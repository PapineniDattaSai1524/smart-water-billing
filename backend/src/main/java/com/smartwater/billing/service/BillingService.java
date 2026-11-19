package com.smartwater.billing.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartwater.billing.dto.billing.*;
import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.BillingMapper;
import com.smartwater.billing.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    private final TariffPlanRepository tariffPlanRepository;
    private final InvoiceRepository invoiceRepository;
    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final BillingMapper billingMapper;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final TieredBillingCalculator tieredBillingCalculator;
    private final ObjectMapper objectMapper;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final EmailNotificationService emailNotificationService;
    private final HouseholdCostAllocationRepository householdCostAllocationRepository;

    // ---------------- Tariff Plans ----------------

    @Transactional
    public TariffPlanResponse createTariffPlan(TariffPlanRequest request, Long adminId) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", request.getApartmentId()));
        assertOwnedByAdmin(apartment, adminId);

        if (request.getMinimumCharge() != null && request.getMaximumCharge() != null
                && request.getMaximumCharge().compareTo(request.getMinimumCharge()) < 0) {
            throw new InvalidRequestException("Maximum charge cannot be less than minimum charge");
        }

        // Only one active plan per apartment: deactivate any existing active plan
        tariffPlanRepository.findByApartmentIdAndActiveTrue(apartment.getId())
                .ifPresent(existing -> {
                    existing.setActive(false);
                    tariffPlanRepository.save(existing);
                });

        TariffPlan plan = TariffPlan.builder()
                .apartment(apartment)
                .name(request.getName())
                .ratePerKl(request.getRatePerKl())
                .fixedCharge(request.getFixedCharge())
                .taxPercentage(request.getTaxPercentage() == null ? BigDecimal.ZERO : request.getTaxPercentage())
                .minimumCharge(request.getMinimumCharge())
                .maximumCharge(request.getMaximumCharge())
                .active(true)
                .build();

        List<TariffTier> tiers = buildTiers(plan, request.getTiers());
        tieredBillingCalculator.validateTierLadder(tiers);
        plan.setTiers(tiers);

        TariffPlan saved = tariffPlanRepository.save(plan);
        auditLogService.record(adminId, "CREATE_TARIFF_PLAN", "TariffPlan", saved.getId(),
                (saved.isTiered() ? "Tiered" : "Flat-rate") + " plan '" + saved.getName() + "' created for "
                        + apartment.getName());

        return billingMapper.toResponse(saved);
    }

    private List<TariffTier> buildTiers(TariffPlan plan, List<TariffTierRequest> tierRequests) {
        if (tierRequests == null || tierRequests.isEmpty()) {
            return new ArrayList<>();
        }
        List<TariffTier> tiers = new ArrayList<>();
        for (int i = 0; i < tierRequests.size(); i++) {
            TariffTierRequest tr = tierRequests.get(i);
            tiers.add(TariffTier.builder()
                    .tariffPlan(plan)
                    .tierOrder(i + 1)
                    .minKl(tr.getMinKl())
                    .maxKl(tr.getMaxKl())
                    .ratePerKl(tr.getRatePerKl())
                    .build());
        }
        return tiers;
    }

    /**
     * Preview the itemized bill for an arbitrary consumption figure against
     * one of the caller's tariff plans, without persisting anything. Used by
     * the admin UI to test tariff configurations before invoices go out.
     */
    @Transactional(readOnly = true)
    public BillingBreakdownResponse previewBill(BillingPreviewRequest request, Long adminId) {
        TariffPlan plan = tariffPlanRepository.findById(request.getTariffPlanId())
                .orElseThrow(() -> ResourceNotFoundException.of("TariffPlan", request.getTariffPlanId()));
        assertOwnedByAdmin(plan.getApartment(), adminId);

        return tieredBillingCalculator.calculate(plan, request.getConsumptionKl(), request.getSharedCharge());
    }

    @Transactional(readOnly = true)
    public List<TariffPlanResponse> listTariffPlans(Long adminId) {
        return tariffPlanRepository.findByApartmentAdminId(adminId).stream()
                .map(billingMapper::toResponse).toList();
    }

    // ---------------- Invoices ----------------

    @Transactional
    public List<InvoiceResponse> generateInvoices(GenerateInvoicesRequest request, Long adminId) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", request.getApartmentId()));
        assertOwnedByAdmin(apartment, adminId);

        TariffPlan plan = tariffPlanRepository.findByApartmentIdAndActiveTrue(apartment.getId())
                .orElseThrow(() -> new InvalidRequestException(
                        "No active tariff plan configured for this apartment. Create one before generating invoices."));

        YearMonth billingMonth = YearMonth.parse(request.getBillingMonth());
        List<Household> households = householdRepository.findByApartmentId(apartment.getId());

        List<InvoiceResponse> generated = households.stream()
                .filter(h -> !invoiceRepository.existsByHouseholdIdAndBillingMonth(h.getId(), request.getBillingMonth()))
                .map(household -> {
                    BigDecimal consumption = waterUsageLogRepository
                            .findByHouseholdIdAndReadingDateBetweenOrderByReadingDateAsc(
                                    household.getId(), billingMonth.atDay(1), billingMonth.atEndOfMonth())
                            .stream()
                            .map(log -> BigDecimal.valueOf(log.getConsumptionKl()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal sharedCharge = householdCostAllocationRepository
                            .findByHouseholdIdAndBillingMonth(household.getId(), billingMonth.atDay(1))
                            .map(HouseholdCostAllocation::getAllocatedAmount)
                            .orElse(BigDecimal.ZERO);

                    BillingBreakdownResponse breakdown =
                            tieredBillingCalculator.calculate(plan, consumption, sharedCharge);

                    Invoice invoice = invoiceRepository.save(Invoice.builder()
                            .household(household)
                            .tariffPlan(plan)
                            .billingMonth(request.getBillingMonth())
                            .consumptionKl(consumption)
                            .ratePerKl(plan.getRatePerKl())
                            .fixedCharge(plan.getFixedCharge())
                            .baseCharge(breakdown.getBaseCharge())
                            .taxAmount(breakdown.getTaxAmount())
                            .totalAmount(breakdown.getTotalBill())
                            .breakdownJson(toJson(breakdown))
                            .status(InvoiceStatus.UNPAID)
                            .dueDate(billingMonth.plusMonths(1).atDay(15))
                            .build());

                    notifyResidentsOfNewInvoice(invoice);

                    return billingMapper.toResponse(invoice);
                })
                .toList();

        auditLogService.record(adminId, "GENERATE_INVOICES", "Apartment", apartment.getId(),
                "Generated " + generated.size() + " invoices for " + request.getBillingMonth());

        return generated;
    }

    /**
     * Week 5-6 Feature 5: monthly bill notification. Sends an in-app INVOICE_GENERATED
     * notification plus a transactional email (subject to the usual email-enabled /
     * SMTP-configured / has-an-email-address gates in {@link EmailNotificationService},
     * which never throws) to every active resident of the invoice's household. Uses the
     * real, just-persisted {@link Invoice} row -- consumption/amount are never hardcoded.
     */
    private void notifyResidentsOfNewInvoice(Invoice invoice) {
        String title = "Water Bill Generated - " + invoice.getBillingMonth();
        String body = String.format(
                "Your %s water bill has been generated.%n%nConsumption: %s kL%nTotal Amount: Rs. %s%nPayment Status: %s%n%n"
                        + "Please log in to view/download your invoice.",
                invoice.getBillingMonth(), invoice.getConsumptionKl(), invoice.getTotalAmount(), invoice.getStatus());

        List<ResidentAssignment> residents =
                residentAssignmentRepository.findByHouseholdIdAndActiveTrue(invoice.getHousehold().getId());
        for (ResidentAssignment assignment : residents) {
            notificationService.notify(assignment.getUser().getId(), NotificationType.INVOICE_GENERATED, title, body);
            emailNotificationService.sendBillEmail(assignment.getUser(), title, body);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> listInvoices(
            Long adminId, InvoiceStatus status, String billingMonth, Pageable pageable) {
        Page<Invoice> page = invoiceRepository.findForAdmin(adminId, status, billingMonth, pageable);
        return PageResponse.from(page.map(billingMapper::toResponse));
    }

    @Transactional
    public InvoiceResponse markPaid(Long invoiceId, Long adminId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> ResourceNotFoundException.of("Invoice", invoiceId));
        assertOwnedByAdmin(invoice.getHousehold().getApartment(), adminId);

        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        Invoice saved = invoiceRepository.save(invoice);

        notificationService.notify(adminId, NotificationType.PAYMENT_RECORDED,
                "Payment recorded",
                "Invoice for " + invoice.getHousehold().getUnitNumber() + " (" + invoice.getBillingMonth() + ") marked as paid");

        return billingMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public RevenueSummaryResponse getRevenueSummary(Long adminId) {
        BigDecimal paid = invoiceRepository.sumPaidRevenueForAdmin(adminId);
        BigDecimal outstanding = invoiceRepository.sumOutstandingForAdmin(adminId);
        return RevenueSummaryResponse.builder()
                .totalCollected(paid)
                .totalOutstanding(outstanding)
                .build();
    }

    // ---------------- Resident self-service ----------------

    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesForHousehold(Long householdId) {
        return invoiceRepository.findByHouseholdIdOrderByBillingMonthDesc(householdId).stream()
                .map(billingMapper::toResponse).toList();
    }

    private void assertOwnedByAdmin(Apartment apartment, Long adminId) {
        if (apartment.getAdmin() == null || !apartment.getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this apartment");
        }
    }

    private String toJson(BillingBreakdownResponse breakdown) {
        try {
            return objectMapper.writeValueAsString(breakdown);
        } catch (Exception e) {
            log.warn("Could not serialize billing breakdown to JSON for invoice audit trail", e);
            return null;
        }
    }
}
