package com.smartwater.billing.service;

import com.smartwater.billing.config.AlertProperties;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.ApartmentAlertConfig;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.NotificationSeverity;
import com.smartwater.billing.entity.NotificationType;
import com.smartwater.billing.entity.RelationType;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.entity.WaterUsageLog;
import com.smartwater.billing.repository.ApartmentAlertConfigRepository;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertEngineServiceTest {

    @Mock private HouseholdRepository householdRepository;
    @Mock private WaterUsageLogRepository waterUsageLogRepository;
    @Mock private ResidentAssignmentRepository residentAssignmentRepository;
    @Mock private ApartmentAlertConfigRepository apartmentAlertConfigRepository;
    @Mock private NotificationService notificationService;
    @Mock private EmailNotificationService emailNotificationService;

    private AlertProperties alertProperties;
    private AlertEngineService alertEngineService;

    private Apartment apartment;
    private Household household;
    private User admin;
    private User resident;

    @BeforeEach
    void setUp() {
        alertProperties = new AlertProperties();
        alertProperties.setDailyThresholdKl(1.0);
        alertProperties.setAnomalyStdDevMultiplier(2.0);
        alertProperties.setMinHistoryReadings(7);
        alertProperties.setEnabled(true);

        alertEngineService = new AlertEngineService(
                householdRepository, waterUsageLogRepository, residentAssignmentRepository,
                apartmentAlertConfigRepository, notificationService, emailNotificationService, alertProperties);

        admin = User.builder().id(100L).fullName("Admin User").build();
        apartment = Apartment.builder().id(1L).name("Palm Residency").admin(admin).build();
        household = Household.builder().id(10L).apartment(apartment).unitNumber("A-101")
                .areaSqft(900.0).occupancyCount(3).hasMeter(true).build();
        resident = User.builder().id(200L).fullName("Resident User").build();

        lenient().when(apartmentAlertConfigRepository.findByApartmentId(apartment.getId())).thenReturn(Optional.empty());
        lenient().when(residentAssignmentRepository.findByHouseholdIdAndActiveTrue(household.getId()))
                .thenReturn(List.of(ResidentAssignment.builder().id(1L).household(household).user(resident)
                        .relationType(RelationType.PRIMARY).moveInDate(LocalDate.now().minusYears(1)).active(true).build()));
    }

    private WaterUsageLog reading(Long id, LocalDate date, double consumption) {
        return WaterUsageLog.builder().id(id).household(household).readingDate(date)
                .meterReadingKl(consumption).consumptionKl(consumption).build();
    }

    @Test
    void evaluateHousehold_returnsNull_whenNoReadingsExist() {
        when(waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId())).thenReturn(List.of());

        AlertEngineService.EvaluationResult result = alertEngineService.evaluateHousehold(household);

        assertThat(result).isNull();
        verifyNoInteractions(notificationService);
    }

    @Test
    void evaluateHousehold_returnsNull_whenApartmentAlertsDisabled() {
        ApartmentAlertConfig override = ApartmentAlertConfig.builder().apartment(apartment).enabled(false).build();
        when(apartmentAlertConfigRepository.findByApartmentId(apartment.getId())).thenReturn(Optional.of(override));

        AlertEngineService.EvaluationResult result = alertEngineService.evaluateHousehold(household);

        assertThat(result).isNull();
        verifyNoInteractions(waterUsageLogRepository);
    }

    @Test
    void evaluateHousehold_firesThresholdAlert_whenLatestReadingExceedsDefaultThreshold() {
        WaterUsageLog latest = reading(1L, LocalDate.now(), 2.5); // well above default 1.0 kL threshold
        when(waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId()))
                .thenReturn(List.of(latest));
        when(notificationService.alertAlreadySent(household.getId(), NotificationType.USAGE_THRESHOLD_EXCEEDED, latest.getId()))
                .thenReturn(false);

        AlertEngineService.EvaluationResult result = alertEngineService.evaluateHousehold(household);

        assertThat(result.thresholdFired()).isTrue();
        assertThat(result.anomalyFired()).isFalse();
        verify(notificationService).notifyAlert(eq(resident), eq(NotificationType.USAGE_THRESHOLD_EXCEEDED),
                anyString(), anyString(), eq(NotificationSeverity.WARNING), eq(household), eq(apartment), eq(latest), anyString());
        verify(notificationService).notifyAlert(eq(admin), eq(NotificationType.USAGE_THRESHOLD_EXCEEDED),
                anyString(), anyString(), eq(NotificationSeverity.WARNING), eq(household), eq(apartment), eq(latest), anyString());
    }

    @Test
    void evaluateHousehold_doesNotFireThresholdAlert_whenBelowThreshold() {
        WaterUsageLog latest = reading(1L, LocalDate.now(), 0.4);
        when(waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId()))
                .thenReturn(List.of(latest));

        AlertEngineService.EvaluationResult result = alertEngineService.evaluateHousehold(household);

        assertThat(result.thresholdFired()).isFalse();
        verify(notificationService, never()).notifyAlert(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void evaluateHousehold_doesNotFireDuplicateThresholdAlert() {
        WaterUsageLog latest = reading(1L, LocalDate.now(), 5.0);
        when(waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId()))
                .thenReturn(List.of(latest));
        when(notificationService.alertAlreadySent(household.getId(), NotificationType.USAGE_THRESHOLD_EXCEEDED, latest.getId()))
                .thenReturn(true);

        AlertEngineService.EvaluationResult result = alertEngineService.evaluateHousehold(household);

        assertThat(result.thresholdFired()).isFalse();
        verify(notificationService, never()).notifyAlert(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void evaluateHousehold_firesAnomalyAlert_whenLatestReadingIsMoreThanTwoStdDevsAboveHistory() {
        // Stable history around 0.5 kL/day for 7 days, then a huge spike -> classic leak signature.
        List<WaterUsageLog> history = List.of(
                reading(2L, LocalDate.now().minusDays(7), 0.5),
                reading(3L, LocalDate.now().minusDays(6), 0.52),
                reading(4L, LocalDate.now().minusDays(5), 0.48),
                reading(5L, LocalDate.now().minusDays(4), 0.51),
                reading(6L, LocalDate.now().minusDays(3), 0.49),
                reading(7L, LocalDate.now().minusDays(2), 0.50),
                reading(8L, LocalDate.now().minusDays(1), 0.53));
        WaterUsageLog latest = reading(1L, LocalDate.now(), 0.9); // stays under 1.0 kL default threshold, so only anomaly should fire

        java.util.List<WaterUsageLog> all = new java.util.ArrayList<>();
        all.add(latest);
        all.addAll(history);
        when(waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId())).thenReturn(all);
        when(notificationService.alertAlreadySent(eq(household.getId()), eq(NotificationType.USAGE_ANOMALY_DETECTED), eq(latest.getId())))
                .thenReturn(false);

        AlertEngineService.EvaluationResult result = alertEngineService.evaluateHousehold(household);

        assertThat(result.thresholdFired()).isFalse();
        assertThat(result.anomalyFired()).isTrue();
        verify(notificationService).notifyAlert(eq(resident), eq(NotificationType.USAGE_ANOMALY_DETECTED),
                anyString(), anyString(), eq(NotificationSeverity.CRITICAL), eq(household), eq(apartment), eq(latest), anyString());
    }

    @Test
    void evaluateHousehold_doesNotRunAnomalyRule_whenHistoryBelowMinimum() {
        List<WaterUsageLog> history = List.of(
                reading(2L, LocalDate.now().minusDays(2), 0.5),
                reading(3L, LocalDate.now().minusDays(1), 0.5));
        WaterUsageLog latest = reading(1L, LocalDate.now(), 0.9);

        java.util.List<WaterUsageLog> all = new java.util.ArrayList<>();
        all.add(latest);
        all.addAll(history);
        when(waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId())).thenReturn(all);

        AlertEngineService.EvaluationResult result = alertEngineService.evaluateHousehold(household);

        assertThat(result.anomalyFired()).isFalse();
    }

    @Test
    void evaluateHousehold_usesApartmentOverride_insteadOfPlatformDefault() {
        ApartmentAlertConfig override = ApartmentAlertConfig.builder().apartment(apartment)
                .dailyThresholdKl(10.0).enabled(true).build();
        when(apartmentAlertConfigRepository.findByApartmentId(apartment.getId())).thenReturn(Optional.of(override));

        // Would exceed the 1.0 kL platform default, but not the 10.0 kL apartment override.
        WaterUsageLog latest = reading(1L, LocalDate.now(), 2.5);
        when(waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(household.getId()))
                .thenReturn(List.of(latest));

        AlertEngineService.EvaluationResult result = alertEngineService.evaluateHousehold(household);

        assertThat(result.thresholdFired()).isFalse();
        verifyNoInteractions(notificationService);
    }

    @Test
    void evaluateAllHouseholds_skipsHouseholdsWithoutAMeter() {
        Household unmetered = Household.builder().id(11L).apartment(apartment).unitNumber("A-102")
                .areaSqft(700.0).occupancyCount(2).hasMeter(false).build();
        when(householdRepository.findAll()).thenReturn(List.of(unmetered));

        AlertEngineService.AlertRunSummary summary = alertEngineService.evaluateAllHouseholds();

        assertThat(summary.evaluated()).isZero();
        verifyNoInteractions(waterUsageLogRepository);
    }
}
