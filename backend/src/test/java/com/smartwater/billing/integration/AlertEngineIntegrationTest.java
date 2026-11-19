package com.smartwater.billing.integration;

import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.RegistrationStatus;
import com.smartwater.billing.entity.RelationType;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.entity.User;
import com.smartwater.billing.entity.WaterUsageLog;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.NotificationRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import com.smartwater.billing.security.CustomUserDetails;
import com.smartwater.billing.security.jwt.JwtService;
import com.smartwater.billing.service.AlertEngineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end integration test for the Alert & Notification Engine scheduler.
 *
 * <p>Seeds an apartment/household/resident + a week of stable usage history
 * plus a spike reading directly through the repositories (bypassing the
 * registration/approval flow, which is orthogonal to what's under test),
 * invokes {@link AlertEngineService#evaluateAllHouseholds()} exactly the way
 * the {@code @Scheduled} job would, and then verifies the resulting alerts
 * through the real {@code /api/v1/notifications/*} HTTP endpoints for both
 * the resident and the apartment admin - proving the scheduler, the
 * dedup-guarded persistence layer, and the read-side API all agree.
 *
 * @Transactional: rolls back all seeded data after each test, same rationale
 * as the other integration tests in this package.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AlertEngineIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;

    @Autowired private UserRepository userRepository;
    @Autowired private ApartmentRepository apartmentRepository;
    @Autowired private HouseholdRepository householdRepository;
    @Autowired private ResidentAssignmentRepository residentAssignmentRepository;
    @Autowired private WaterUsageLogRepository waterUsageLogRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private AlertEngineService alertEngineService;

    private User admin;
    private User resident;
    private Household household;

    @BeforeEach
    void seedData() {
        admin = userRepository.save(User.builder()
                .fullName("Apartment Admin").email("scheduler-admin@example.com").username("scheduleradmin")
                .password("irrelevant-hashed-value").role(Role.ADMIN).enabled(true)
                .registrationStatus(RegistrationStatus.APPROVED).build());

        resident = userRepository.save(User.builder()
                .fullName("Household Resident").email("scheduler-resident@example.com").username("schedulerresident")
                .password("irrelevant-hashed-value").role(Role.RESIDENT).enabled(true)
                .registrationStatus(RegistrationStatus.APPROVED).build());

        Apartment apartment = apartmentRepository.save(Apartment.builder()
                .name("Scheduler Test Residency").addressLine("1 Test Lane").city("Chennai")
                .state("Tamil Nadu").zipCode("600001").totalUnits(20).admin(admin).build());

        household = householdRepository.save(Household.builder()
                .apartment(apartment).unitNumber("A-101").areaSqft(900.0).occupancyCount(3)
                .hasMeter(true).build());

        residentAssignmentRepository.save(ResidentAssignment.builder()
                .household(household).user(resident).relationType(RelationType.PRIMARY)
                .moveInDate(LocalDate.now().minusYears(1)).active(true).build());

        // A stable week of ~0.5 kL/day history, then a large spike today -
        // exceeds both the 1.0 kL platform threshold and the household's own
        // historical mean + 2*stddev, so both rules should fire.
        for (int i = 7; i >= 1; i--) {
            waterUsageLogRepository.save(reading(LocalDate.now().minusDays(i), 0.5 + (i % 2 == 0 ? 0.02 : -0.02)));
        }
        waterUsageLogRepository.save(reading(LocalDate.now(), 3.2));
    }

    private WaterUsageLog reading(LocalDate date, double consumption) {
        return WaterUsageLog.builder().household(household).readingDate(date)
                .meterReadingKl(consumption).consumptionKl(consumption).build();
    }

    private String tokenFor(User user) {
        return jwtService.generateAccessToken(new CustomUserDetails(user));
    }

    @Test
    void evaluateAllHouseholds_raisesThresholdAndAnomalyAlerts_visibleToResidentAndAdmin() throws Exception {
        AlertEngineService.AlertRunSummary summary = alertEngineService.evaluateAllHouseholds();

        assertThat(summary.evaluated()).isEqualTo(1);
        assertThat(summary.thresholdAlerts()).isEqualTo(1);
        assertThat(summary.anomalyAlerts()).isEqualTo(1);

        // Each rule notifies both the resident and the admin -> 2 alert types * 2 recipients = 4 rows.
        assertThat(notificationRepository.count()).isEqualTo(4);

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + tokenFor(resident)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[*].type",
                        hasItems("USAGE_THRESHOLD_EXCEEDED", "USAGE_ANOMALY_DETECTED")));

        mockMvc.perform(get("/api/v1/notifications/apartment/" + household.getApartment().getId())
                        .header("Authorization", "Bearer " + tokenFor(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(4));

        mockMvc.perform(get("/api/v1/notifications/search")
                        .param("type", "USAGE_ANOMALY_DETECTED")
                        .header("Authorization", "Bearer " + tokenFor(resident)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].severity").value("CRITICAL"));
    }

    @Test
    void evaluateAllHouseholds_doesNotDoubleAlert_whenRunTwiceForTheSameReadings() {
        alertEngineService.evaluateAllHouseholds();
        long afterFirstRun = notificationRepository.count();

        AlertEngineService.AlertRunSummary secondSummary = alertEngineService.evaluateAllHouseholds();

        assertThat(secondSummary.thresholdAlerts()).isZero();
        assertThat(secondSummary.anomalyAlerts()).isZero();
        assertThat(notificationRepository.count()).isEqualTo(afterFirstRun);
    }

    @Test
    void markOneRead_updatesOnlyThatResidentsOwnNotification() throws Exception {
        alertEngineService.evaluateAllHouseholds();
        Long residentNotificationId = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(
                        resident.getId(), org.springframework.data.domain.PageRequest.of(0, 1))
                .getContent().get(0).getId();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/v1/notifications/" + residentNotificationId + "/read")
                        .header("Authorization", "Bearer " + tokenFor(resident)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(notificationRepository.findById(residentNotificationId).orElseThrow().isRead()).isTrue();
    }
}
