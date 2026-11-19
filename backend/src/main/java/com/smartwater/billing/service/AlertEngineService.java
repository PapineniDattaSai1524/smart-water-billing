package com.smartwater.billing.service;

import com.smartwater.billing.config.AlertProperties;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.ApartmentAlertConfig;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.NotificationSeverity;
import com.smartwater.billing.entity.NotificationType;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.WaterUsageLog;
import com.smartwater.billing.repository.ApartmentAlertConfigRepository;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * The Alert & Notification Engine's core scheduled job.
 *
 * <p>Once per {@code app.alert.cron} it walks every metered household, looks at
 * its most recent usage reading, and applies two independent rules:
 * <ol>
 *   <li><b>Threshold rule</b> — the latest reading exceeds the configured daily
 *       threshold (platform default or per-apartment override) -&gt; overuse alert.</li>
 *   <li><b>Anomaly rule</b> — the latest reading exceeds the household's own
 *       historical mean by more than N standard deviations (2-sigma by default),
 *       which is a decent heuristic for a leak or a stuck-open tap -&gt; anomaly alert.
 *       Only runs once enough history exists (min-history-readings).</li>
 * </ol>
 * Both rules are dedup-aware: an alert is raised at most once per
 * household/type/usage-reading, no matter how many times the job runs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertEngineService {

    private static final DateTimeFormatter BILLING_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final HouseholdRepository householdRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final ApartmentAlertConfigRepository apartmentAlertConfigRepository;
    private final NotificationService notificationService;
    private final EmailNotificationService emailNotificationService;
    private final AlertProperties alertProperties;

    @Scheduled(cron = "${app.alert.cron}")
    @Transactional
    public void runScheduledCheck() {
        log.info("Alert & Notification Engine scheduler started.");
        if (!alertProperties.isEnabled()) {
            log.info("Alert engine is disabled (app.alert.enabled=false); skipping scheduled run.");
            return;
        }
        AlertRunSummary summary = evaluateAllHouseholds();
        log.info("Alert engine run complete: {} household(s) evaluated, {} threshold alert(s), {} anomaly alert(s) raised.",
                summary.evaluated(), summary.thresholdAlerts(), summary.anomalyAlerts());
    }

    /** Evaluates every metered household. Public/transactional so it can also be triggered manually (e.g. from tests or an admin action). */
    @Transactional
    public AlertRunSummary evaluateAllHouseholds() {
        int evaluated = 0;
        int thresholdAlerts = 0;
        int anomalyAlerts = 0;

        for (Household household : householdRepository.findAll()) {
            if (!household.isHasMeter()) {
                continue;
            }
            EvaluationResult result = evaluateHousehold(household);
            if (result == null) {
                continue;
            }
            evaluated++;
            if (result.thresholdFired()) {
                thresholdAlerts++;
            }
            if (result.anomalyFired()) {
                anomalyAlerts++;
            }
        }
        return new AlertRunSummary(evaluated, thresholdAlerts, anomalyAlerts);
    }

    /**
     * Evaluates a single household. Returns null if there's nothing to evaluate
     * (no readings yet, or alerts disabled for its apartment).
     */
    EvaluationResult evaluateHousehold(Household household) {
        Apartment apartment = household.getApartment();
        ApartmentAlertConfig override = apartmentAlertConfigRepository.findByApartmentId(apartment.getId()).orElse(null);
        if (override != null && !override.isEnabled()) {
            return null;
        }

        double dailyThreshold = (override != null && override.getDailyThresholdKl() != null)
                ? override.getDailyThresholdKl() : alertProperties.getDailyThresholdKl();
        double stdDevMultiplier = (override != null && override.getAnomalyStdDevMultiplier() != null)
                ? override.getAnomalyStdDevMultiplier() : alertProperties.getAnomalyStdDevMultiplier();
        int minHistory = (override != null && override.getMinHistoryReadings() != null)
                ? override.getMinHistoryReadings() : alertProperties.getMinHistoryReadings();

        List<WaterUsageLog> readings = waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId());
        if (readings.isEmpty()) {
            return null;
        }

        WaterUsageLog latest = readings.get(0);
        if (latest.getConsumptionKl() == null) {
            return null;
        }
        List<Double> history = readings.stream().skip(1).map(WaterUsageLog::getConsumptionKl).toList();

        boolean thresholdFired = checkThreshold(household, apartment, latest, dailyThreshold);
        boolean anomalyFired = checkAnomaly(household, apartment, latest, history, minHistory, stdDevMultiplier);

        return new EvaluationResult(thresholdFired, anomalyFired);
    }

    private boolean checkThreshold(Household household, Apartment apartment, WaterUsageLog latest, double dailyThreshold) {
        if (latest.getConsumptionKl() <= dailyThreshold) {
            return false;
        }
        String title = "High Water Usage Alert";
        String message = String.format(
                "Your household has exceeded the configured water consumption threshold.%n%n"
                        + "Household: %s%n"
                        + "Current usage: %.2f kL%n"
                        + "Configured threshold: %.2f kL%n%n"
                        + "Reduction tip: Please check for leaks and reduce unnecessary usage.",
                household.getUnitNumber(), latest.getConsumptionKl(), dailyThreshold);
        return raiseAlert(household, apartment, latest, NotificationType.USAGE_THRESHOLD_EXCEEDED,
                NotificationSeverity.WARNING, title, message);
    }

    private boolean checkAnomaly(Household household, Apartment apartment, WaterUsageLog latest,
                                  List<Double> history, int minHistory, double stdDevMultiplier) {
        if (history.size() < minHistory) {
            return false;
        }
        double mean = UsageStatisticsCalculator.mean(history);
        double stdDev = UsageStatisticsCalculator.standardDeviation(history, mean);
        if (stdDev <= 0) {
            return false;
        }
        double anomalyCutoff = mean + (stdDevMultiplier * stdDev);
        if (latest.getConsumptionKl() <= anomalyCutoff) {
            return false;
        }
        String title = "Possible Water Leak Detected";
        String message = String.format(
                "Household: %s%n%n"
                        + "Abnormal Usage: %.2f kL%n"
                        + "Historical Average: %.2f kL (std dev %.2f)%n%n"
                        + "Please inspect the household for a possible water leak.",
                household.getUnitNumber(), latest.getConsumptionKl(), mean, stdDev);
        return raiseAlert(household, apartment, latest, NotificationType.USAGE_ANOMALY_DETECTED,
                NotificationSeverity.CRITICAL, title, message);
    }

    /**
     * Creates the notification for every active resident of the household plus the
     * apartment admin, guarded by the dedup check (household + type + usage reading).
     *
     * @return true if an alert was actually raised, false if it was a duplicate.
     */
    private boolean raiseAlert(Household household, Apartment apartment, WaterUsageLog latest,
                                NotificationType type, NotificationSeverity severity, String title, String message) {
        if (notificationService.alertAlreadySent(household.getId(), type, latest.getId())) {
            log.debug("Duplicate {} alert skipped for household {} / usage reading {}.",
                    type, household.getId(), latest.getId());
            return false;
        }
        log.info("{} alert generated for household {} (unit {}), usage reading {}.",
                type, household.getId(), household.getUnitNumber(), latest.getId());

        String billingMonth = latest.getReadingDate().format(BILLING_MONTH_FORMAT);

        List<ResidentAssignment> residents = residentAssignmentRepository.findByHouseholdIdAndActiveTrue(household.getId());
        for (ResidentAssignment assignment : residents) {
            notificationService.notifyAlert(assignment.getUser(), type, title, message, severity,
                    household, apartment, latest, billingMonth);
            emailNotificationService.sendAlertEmail(assignment.getUser(), title, message);
        }
        if (apartment.getAdmin() != null) {
            notificationService.notifyAlert(apartment.getAdmin(), type, title, message, severity,
                    household, apartment, latest, billingMonth);
            emailNotificationService.sendAlertEmail(apartment.getAdmin(), title, message);
        }
        return true;
    }

    public record AlertRunSummary(int evaluated, int thresholdAlerts, int anomalyAlerts) {
    }

    record EvaluationResult(boolean thresholdFired, boolean anomalyFired) {
    }
}
