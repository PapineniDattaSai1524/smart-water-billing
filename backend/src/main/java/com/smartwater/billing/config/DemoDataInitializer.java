package com.smartwater.billing.config;

import com.smartwater.billing.entity.*;
import com.smartwater.billing.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Seeds the three demo accounts required for a first-run demonstration of
 * the platform, plus just enough linked data (community, apartment,
 * household, meter, tariff plan, a couple of usage readings, and one
 * invoice) for each role's dashboard to show real numbers instead of empty
 * states. Runs once on every startup; every step is idempotent (checks
 * before inserting), so it never duplicates data and never requires a
 * manual SQL script.
 *
 * Demo credentials:
 *   Super Admin:    admin    / Admin@123
 *   Building Owner: owner    / Owner@123
 *   Resident:       resident / Resident@123
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final WaterMeterConfigRepository waterMeterConfigRepository;
    private final TariffPlanRepository tariffPlanRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final InvoiceRepository invoiceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        ensureSingleSuperAdmin();

        User owner = ensureUser("owner", "Building Owner Demo", "owner@smartwater.demo",
                "Owner@123", Role.ADMIN);

        Community community = communityRepository.findAll().stream()
                .filter(c -> "Demo Community".equals(c.getName()))
                .findFirst()
                .orElseGet(() -> communityRepository.save(Community.builder()
                        .name("Demo Community")
                        .city("Chennai")
                        .state("Tamil Nadu")
                        .active(true)
                        .build()));

        Apartment apartment = apartmentRepository.findByNameIgnoreCase("Green Valley Residency")
                .orElseGet(() -> apartmentRepository.save(Apartment.builder()
                        .name("Green Valley Residency")
                        .addressLine("12 Anna Nagar Main Road")
                        .city("Chennai")
                        .state("Tamil Nadu")
                        .zipCode("600040")
                        .totalUnits(50)
                        .admin(owner)
                        .community(community)
                        .build()));

        Household household = householdRepository.findByApartmentIdAndUnitNumberIgnoreCase(apartment.getId(), "A-101")
                .orElseGet(() -> householdRepository.save(Household.builder()
                        .apartment(apartment)
                        .unitNumber("A-101")
                        .areaSqft(950.0)
                        .occupancyCount(4)
                        .hasMeter(true)
                        .build()));

        User resident = ensureUser("resident", "Resident Demo", "resident@smartwater.demo",
                "Resident@123", Role.RESIDENT);

        if (!residentAssignmentRepository.existsByHouseholdIdAndUserIdAndActiveTrue(household.getId(), resident.getId())) {
            residentAssignmentRepository.save(ResidentAssignment.builder()
                    .household(household)
                    .user(resident)
                    .relationType(RelationType.PRIMARY)
                    .moveInDate(LocalDate.now().minusMonths(6))
                    .active(true)
                    .build());
        }

        if (!waterMeterConfigRepository.existsByHouseholdId(household.getId())) {
            waterMeterConfigRepository.save(WaterMeterConfig.builder()
                    .household(household)
                    .meterNumber("MTR-A101-DEMO")
                    .meterType(MeterType.DIGITAL)
                    .installationDate(LocalDate.now().minusMonths(6))
                    .initialReading(0.0)
                    .status(MeterStatus.ACTIVE)
                    .build());
        }

        TariffPlan tariffPlan = tariffPlanRepository.findByApartmentIdAndActiveTrue(apartment.getId())
                .orElseGet(() -> tariffPlanRepository.save(TariffPlan.builder()
                        .apartment(apartment)
                        .name("Standard Residential Tariff")
                        .ratePerKl(new BigDecimal("25.00"))
                        .fixedCharge(new BigDecimal("100.00"))
                        .active(true)
                        .build()));

        seedUsageAndInvoice(household, tariffPlan);

        log.info("Demo data ready — Super Admin: admin/Admin@123, Building Owner: owner/Owner@123, "
                + "Resident: resident/Resident@123");
    }

    private void seedUsageAndInvoice(Household household, TariffPlan tariffPlan) {
        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        if (waterUsageLogRepository.findByHouseholdIdAndReadingDate(household.getId(), previousMonth.atDay(20)).isEmpty()) {
            waterUsageLogRepository.save(WaterUsageLog.builder()
                    .household(household)
                    .readingDate(previousMonth.atDay(20))
                    .meterReadingKl(120.0)
                    .consumptionKl(18.0)
                    .source(UsageSource.MANUAL)
                    .remarks("Demo seed reading")
                    .build());
        }
        if (waterUsageLogRepository.findByHouseholdIdAndReadingDate(household.getId(), currentMonth.atDay(5)).isEmpty()) {
            waterUsageLogRepository.save(WaterUsageLog.builder()
                    .household(household)
                    .readingDate(currentMonth.atDay(Math.min(5, currentMonth.lengthOfMonth())))
                    .meterReadingKl(138.0)
                    .consumptionKl(16.0)
                    .source(UsageSource.MANUAL)
                    .remarks("Demo seed reading")
                    .build());
        }

        String billingMonth = previousMonth.toString();
        if (!invoiceRepository.existsByHouseholdIdAndBillingMonth(household.getId(), billingMonth)) {
            BigDecimal consumption = new BigDecimal("18.0");
            BigDecimal total = consumption.multiply(tariffPlan.getRatePerKl()).add(tariffPlan.getFixedCharge());
            invoiceRepository.save(Invoice.builder()
                    .household(household)
                    .tariffPlan(tariffPlan)
                    .billingMonth(billingMonth)
                    .consumptionKl(consumption)
                    .ratePerKl(tariffPlan.getRatePerKl())
                    .fixedCharge(tariffPlan.getFixedCharge())
                    .totalAmount(total)
                    .status(InvoiceStatus.UNPAID)
                    .dueDate(currentMonth.atDay(15))
                    .build());
        }
    }

    /**
     * Platform-wide invariant: exactly one SUPER_ADMIN account may exist.
     * Checked by role (not just by the "admin" username) so this stays
     * correct even if the canonical username ever changes, and so it
     * never creates a second Super Admin alongside one created by any
     * other path (e.g. a leftover migration seed). Safe to run on every
     * startup: if a SUPER_ADMIN already exists, this is a no-op.
     *
     * FIXED: this used to delegate straight to ensureUser("admin", ...),
     * which looks the row up by USERNAME first. On any database carrying
     * a leftover 'admin' row from the old (pre-fix) V2 seed migration --
     * username 'admin', role ADMIN, password hash for "Password@123" --
     * ensureUser found that row by username and returned it unchanged,
     * every single startup, forever. Net effect: findByRole(SUPER_ADMIN)
     * stayed empty, this method kept "fixing" it, and nothing actually
     * changed -- the Super Admin login never started working while
     * Building Owner/Resident accounts (fresh usernames, no collision)
     * worked fine. Now this explicitly checks for a stale 'admin' row by
     * username and promotes it (role + password + enabled) instead of
     * leaving it untouched, before falling back to creating a fresh one.
     */
    private void ensureSingleSuperAdmin() {
        if (!userRepository.findByRole(Role.SUPER_ADMIN).isEmpty()) {
            return;
        }

        userRepository.findByUsername("admin").ifPresentOrElse(
                staleAdmin -> {
                    log.warn("Found existing 'admin' user (id={}) with role={} instead of SUPER_ADMIN "
                                    + "-- promoting it and resetting its password to the documented demo "
                                    + "credential so the Super Admin login works.",
                            staleAdmin.getId(), staleAdmin.getRole());
                    staleAdmin.setRole(Role.SUPER_ADMIN);
                    staleAdmin.setPassword(passwordEncoder.encode("Admin@123"));
                    staleAdmin.setEnabled(true);
                    userRepository.save(staleAdmin);
                },
                () -> ensureUser("admin", "Platform Super Admin", "admin@smartwater.demo",
                        "Admin@123", Role.SUPER_ADMIN)
        );
    }

    private User ensureUser(String username, String fullName, String email, String rawPassword, Role role) {
        return userRepository.findByUsername(username).orElseGet(() -> userRepository.save(User.builder()
                .fullName(fullName)
                .email(email)
                .username(username)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .enabled(true)
                .build()));
    }
}
