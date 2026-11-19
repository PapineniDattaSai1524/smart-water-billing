package com.smartwater.billing.service;

import com.smartwater.billing.config.AlertProperties;
import com.smartwater.billing.dto.dashboard.ConsumptionComparisonResponse;
import com.smartwater.billing.dto.dashboard.ResidentDashboardResponse;
import com.smartwater.billing.dto.dashboard.UsageTrendPointResponse;
import com.smartwater.billing.dto.household.HouseholdResponse;
import com.smartwater.billing.dto.usage.WaterUsageLogResponse;
import com.smartwater.billing.entity.ApartmentAlertConfig;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.RegistrationStatus;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.entity.WaterUsageLog;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.mapper.HouseholdMapper;
import com.smartwater.billing.mapper.WaterUsageLogMapper;
import com.smartwater.billing.repository.ApartmentAlertConfigRepository;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.OptionalDouble;

@Service
@RequiredArgsConstructor
public class ResidentSelfService {

    private final UserRepository userRepository;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final HouseholdRepository householdRepository;
    private final NotificationService notificationService;
    private final HouseholdMapper householdMapper;
    private final WaterUsageLogMapper waterUsageLogMapper;
    private final AlertProperties alertProperties;
    private final ApartmentAlertConfigRepository apartmentAlertConfigRepository;

    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("yyyy-MM");
    /** Households within this fractional band of my area are considered "similar-sized". */
    private static final double SIMILAR_SIZE_BAND = 0.20;
    /**
     * Minimum number of *other* reporting households needed before an above/below-average
     * verdict is meaningful. With only one other household's data point, a single neighbour
     * with no reading yet (or one unusually low/high reading) can flip the entire badge --
     * report NEAR_AVERAGE instead of a confident-looking verdict built on too little data.
     */
    private static final int MIN_HOUSEHOLDS_FOR_COMPARISON = 2;

    /**
     * Never throws for a resident who is legitimately logged in but has no active
     * household yet (pending approval, rejected, or approved-but-not-yet-assigned) --
     * returns a status/message the frontend renders directly instead of an error page.
     */
    @Transactional(readOnly = true)
    public ResidentDashboardResponse getDashboard(Long userId) {
        Optional<Household> household = activeHouseholdForOptional(userId);

        if (household.isEmpty()) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> ResourceNotFoundException.of("User", userId));

            if (user.getRegistrationStatus() == RegistrationStatus.PENDING) {
                return ResidentDashboardResponse.builder()
                        .status("PENDING_APPROVAL")
                        .message("Your registration is waiting for Building Owner approval.")
                        .unreadNotifications(notificationService.unreadCount(userId))
                        .build();
            }
            if (user.getRegistrationStatus() == RegistrationStatus.REJECTED) {
                return ResidentDashboardResponse.builder()
                        .status("REJECTED")
                        .message("Your registration request has been rejected."
                                + (user.getRejectionReason() != null ? " Reason: " + user.getRejectionReason() : ""))
                        .unreadNotifications(notificationService.unreadCount(userId))
                        .build();
            }
            return ResidentDashboardResponse.builder()
                    .status("UNASSIGNED")
                    .message("Your account isn't linked to a household yet. Please contact your Building Owner.")
                    .unreadNotifications(notificationService.unreadCount(userId))
                    .build();
        }

        return buildActiveDashboard(household.get(), userId);
    }

    private ResidentDashboardResponse buildActiveDashboard(Household household, Long userId) {

        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        Double currentUsage = sumConsumption(household.getId(), currentMonth);
        Double previousUsage = sumConsumption(household.getId(), previousMonth);

        List<WaterUsageLog> history = waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId());
        OptionalDouble average = history.stream().mapToDouble(WaterUsageLog::getConsumptionKl).average();

        WaterUsageLog latest = waterUsageLogRepository.findFirstByHouseholdIdOrderByReadingDateDesc(household.getId())
                .orElse(null);

        return ResidentDashboardResponse.builder()
                .apartmentName(household.getApartment().getName())
                .unitNumber(household.getUnitNumber())
                .currentMonthUsageKl(currentUsage)
                .previousMonthUsageKl(previousUsage)
                .averageUsageKl(average.isPresent() ? Math.round(average.getAsDouble() * 100) / 100.0 : null)
                .latestReadingKl(latest != null ? latest.getMeterReadingKl() : null)
                .latestReadingDate(latest != null ? latest.getReadingDate() : null)
                .unreadNotifications(notificationService.unreadCount(userId))
                .build();
    }

    @Transactional(readOnly = true)
    public Household getMyHousehold(Long userId) {
        return activeHouseholdFor(userId);
    }

    /**
     * Maps to the response DTO while the Hibernate session is still open, so lazy
     * associations (household.apartment, household.residentAssignments) are resolved
     * here instead of blowing up with LazyInitializationException once the transaction
     * that fetched the entity has already closed (e.g. in the controller layer).
     */
    @Transactional(readOnly = true)
    public HouseholdResponse getMyHouseholdResponse(Long userId) {
        Household household = activeHouseholdFor(userId);
        return householdMapper.toResponse(household);
    }

    @Transactional(readOnly = true)
    public List<WaterUsageLog> getMyUsageHistory(Long userId) {
        Household household = activeHouseholdFor(userId);
        return waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId());
    }

    /**
     * Same fix as getMyHouseholdResponse: maps to DTOs here, inside the open session,
     * because each WaterUsageLog.household is FetchType.LAZY and the mapper reads
     * household.getUnitNumber() — that blew up with LazyInitializationException when
     * the mapping happened in the controller after this transaction had closed.
     */
    @Transactional(readOnly = true)
    public List<WaterUsageLogResponse> getMyUsageHistoryResponse(Long userId) {
        Household household = activeHouseholdFor(userId);
        return waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId())
                .stream().map(waterUsageLogMapper::toResponse).toList();
    }

    private Double sumConsumption(Long householdId, YearMonth month) {
        return waterUsageLogRepository
                .findByHouseholdIdAndReadingDateBetweenOrderByReadingDateAsc(
                        householdId, month.atDay(1), month.atEndOfMonth())
                .stream()
                .mapToDouble(WaterUsageLog::getConsumptionKl)
                .sum();
    }

    private Optional<Household> activeHouseholdForOptional(Long userId) {
        return residentAssignmentRepository.findByUserId(userId).stream()
                .filter(ResidentAssignment::isActive)
                .map(ResidentAssignment::getHousehold)
                .findFirst();
    }

    private Household activeHouseholdFor(Long userId) {
        return activeHouseholdForOptional(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "You are not currently assigned to a household. Please contact your administrator."));
    }

    // ---------------- Week 5-6: dashboard trend charts & benchmarking ----------------

    /**
     * Daily consumption for the last {@code days} days (including today), oldest first.
     * A day with no logged reading is reported as 0.0 kL rather than being omitted, so the
     * React line chart gets one point per calendar day and doesn't look like missing data.
     */
    @Transactional(readOnly = true)
    public List<UsageTrendPointResponse> getDailyTrend(Long userId, int days) {
        Household household = activeHouseholdFor(userId);
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(Math.max(days, 1) - 1L);

        List<WaterUsageLog> logs = waterUsageLogRepository
                .findByHouseholdIdAndReadingDateBetweenOrderByReadingDateAsc(household.getId(), from, to);

        List<UsageTrendPointResponse> points = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            final LocalDate day = d;
            double usage = logs.stream()
                    .filter(l -> l.getReadingDate().isEqual(day))
                    .mapToDouble(WaterUsageLog::getConsumptionKl)
                    .sum();
            points.add(UsageTrendPointResponse.builder()
                    .label(day.format(DAY_LABEL))
                    .consumptionKl(Math.round(usage * 100) / 100.0)
                    .build());
        }
        return points;
    }

    /**
     * Monthly consumption totals for the last {@code months} calendar months (including the
     * current month), oldest first. A month with no readings is reported as 0.0 kL.
     */
    @Transactional(readOnly = true)
    public List<UsageTrendPointResponse> getMonthlyTrend(Long userId, int months) {
        Household household = activeHouseholdFor(userId);
        YearMonth current = YearMonth.now();
        YearMonth start = current.minusMonths(Math.max(months, 1) - 1L);

        List<UsageTrendPointResponse> points = new ArrayList<>();
        for (YearMonth m = start; !m.isAfter(current); m = m.plusMonths(1)) {
            double usage = sumConsumption(household.getId(), m) != null ? sumConsumption(household.getId(), m) : 0.0;
            points.add(UsageTrendPointResponse.builder()
                    .label(m.format(MONTH_LABEL))
                    .consumptionKl(Math.round(usage * 100) / 100.0)
                    .build());
        }
        return points;
    }

    /**
     * Week 5-6 Feature 4: compares this household's current-month usage against (a) the
     * apartment-wide average and (b) the average of "similar-sized" households (area_sqft
     * within +/-20% of this household's area, the closest existing schema field to a
     * flat-size bucket -- no new columns were added per the brief's "don't invent fields"
     * instruction). All numbers come from real water_usage_logs / household rows.
     */
    @Transactional(readOnly = true)
    public ConsumptionComparisonResponse getConsumptionComparison(Long userId) {
        Household myHousehold = activeHouseholdFor(userId);
        YearMonth currentMonth = YearMonth.now();

        List<Household> apartmentHouseholds = householdRepository.findByApartmentId(myHousehold.getApartment().getId());

        double myUsage = nz(sumConsumption(myHousehold.getId(), currentMonth));

        List<Double> apartmentUsages = new ArrayList<>();
        List<Double> similarUsages = new ArrayList<>();
        Double myArea = myHousehold.getAreaSqft();

        for (Household h : apartmentHouseholds) {
            List<WaterUsageLog> monthLogs = waterUsageLogRepository
                    .findByHouseholdIdAndReadingDateBetweenOrderByReadingDateAsc(
                            h.getId(), currentMonth.atDay(1), currentMonth.atEndOfMonth());
            // Root-cause fix: a household with no logged reading yet this month must not be
            // treated as "used 0 kL" -- that silently drags the apartment/similar-sized average
            // down and makes every other household with real data look artificially high, e.g.
            // a household using a perfectly normal 16 kL reads as "High Usage" simply because a
            // neighbour hasn't logged a reading yet. Only households with at least one real
            // reading this month contribute to either average; a household with no data
            // contributes nothing to the comparison, same as it already does for its own
            // historical average elsewhere in this class.
            if (monthLogs.isEmpty()) {
                continue;
            }
            double usage = monthLogs.stream().mapToDouble(WaterUsageLog::getConsumptionKl).sum();
            apartmentUsages.add(usage);
            if (!h.getId().equals(myHousehold.getId()) && myArea != null && h.getAreaSqft() != null) {
                double lower = myArea * (1 - SIMILAR_SIZE_BAND);
                double upper = myArea * (1 + SIMILAR_SIZE_BAND);
                if (h.getAreaSqft() >= lower && h.getAreaSqft() <= upper) {
                    similarUsages.add(usage);
                }
            }
        }

        Double apartmentAverage = apartmentUsages.isEmpty() ? null
                : round2(apartmentUsages.stream().mapToDouble(Double::doubleValue).average().orElse(0));
        Double similarAverage = similarUsages.isEmpty() ? null
                : round2(similarUsages.stream().mapToDouble(Double::doubleValue).average().orElse(0));

        // With too few reporting households, "above/below average" is not a meaningful signal
        // (one other data point either way flips the verdict) -- report NEAR_AVERAGE rather
        // than a confident-looking badge built on a single neighbour's data.
        String status = "NEAR_AVERAGE";
        if (apartmentAverage != null && apartmentAverage > 0 && apartmentUsages.size() >= MIN_HOUSEHOLDS_FOR_COMPARISON) {
            double ratio = myUsage / apartmentAverage;
            if (ratio < 0.9) {
                status = "BELOW_AVERAGE";
            } else if (ratio > 1.1) {
                status = "ABOVE_AVERAGE";
            }
        }

        return ConsumptionComparisonResponse.builder()
                .billingMonth(currentMonth.format(MONTH_LABEL))
                .myUsageKl(round2(myUsage))
                .apartmentAverageKl(apartmentAverage)
                .similarSizedAverageKl(similarAverage)
                .apartmentHouseholdCount(apartmentUsages.size())
                .similarSizedHouseholdCount(similarUsages.size())
                .status(status)
                .possibleLeak(isPossibleLeak(myHousehold))
                .build();
    }

    /**
     * Read-only reuse of the Alert Engine's own 2-sigma rule (same
     * mean + stdDevMultiplier*stdDev cutoff, same per-apartment config overrides), purely
     * to drive the resident dashboard's "possible leak" tip. This does not raise any
     * alert, notification, or email -- that remains solely AlertEngineService's job via
     * its scheduled job, so there is still only one alert engine in the system.
     */
    private boolean isPossibleLeak(Household household) {
        List<WaterUsageLog> readings =
                waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId());
        if (readings.isEmpty()) {
            return false;
        }
        WaterUsageLog latest = readings.get(0);
        if (latest.getConsumptionKl() == null) {
            return false;
        }

        ApartmentAlertConfig override = apartmentAlertConfigRepository
                .findByApartmentId(household.getApartment().getId()).orElse(null);
        if (override != null && !override.isEnabled()) {
            return false;
        }
        double stdDevMultiplier = (override != null && override.getAnomalyStdDevMultiplier() != null)
                ? override.getAnomalyStdDevMultiplier() : alertProperties.getAnomalyStdDevMultiplier();
        int minHistory = (override != null && override.getMinHistoryReadings() != null)
                ? override.getMinHistoryReadings() : alertProperties.getMinHistoryReadings();

        List<Double> history = readings.stream().skip(1).map(WaterUsageLog::getConsumptionKl).toList();
        if (history.size() < minHistory) {
            return false;
        }
        double mean = UsageStatisticsCalculator.mean(history);
        double stdDev = UsageStatisticsCalculator.standardDeviation(history, mean);
        if (stdDev <= 0) {
            return false;
        }
        return latest.getConsumptionKl() > mean + (stdDevMultiplier * stdDev);
    }

    private static double nz(Double v) {
        return v != null ? v : 0.0;
    }

    private static double round2(double v) {
        return Math.round(v * 100) / 100.0;
    }
}
