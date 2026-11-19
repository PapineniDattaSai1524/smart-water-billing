package com.smartwater.billing.service;

import com.smartwater.billing.dto.allocation.DistributionReportResponse;
import com.smartwater.billing.dto.allocation.DistributionRunRequest;
import com.smartwater.billing.dto.allocation.HouseholdAllocationLine;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

/**
 * Orchestrates Module 3: pulls the not-yet-distributed bulk water purchases
 * for an apartment/billing-month, runs them through the
 * {@link ConsumptionDistributionEngine}, and persists the result so the
 * Automatic Billing Engine (Module 4) can pick up each household's share as
 * its invoice's shared charge.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AllocationService {

    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final WaterPurchaseRepository waterPurchaseRepository;
    private final SharedCostAllocationRepository sharedCostAllocationRepository;
    private final ConsumptionDistributionEngine distributionEngine;
    private final AuditLogService auditLogService;

    @Transactional
    public DistributionReportResponse runDistribution(DistributionRunRequest request, Long adminId) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", request.getApartmentId()));
        assertOwnedByAdmin(apartment, adminId);

        var billingMonthStart = request.getBillingMonth().atDay(1);
        var billingMonthEnd = request.getBillingMonth().atEndOfMonth();

        sharedCostAllocationRepository.findByApartmentIdAndBillingMonth(apartment.getId(), billingMonthStart)
                .ifPresent(existing -> {
                    if (!request.isOverwrite()) {
                        throw new InvalidRequestException("A distribution already exists for "
                                + request.getBillingMonth() + ". Pass overwrite=true to re-run it.");
                    }
                    // Revert the purchases this run consumed so they're eligible again.
                    existing.getSourcePurchases().forEach(p -> {
                        p.setDistributed(false);
                        p.setDistributedAt(null);
                        waterPurchaseRepository.save(p);
                    });
                    sharedCostAllocationRepository.delete(existing);
                    sharedCostAllocationRepository.flush();
                });

        List<WaterPurchase> purchases = waterPurchaseRepository
                .findByApartmentIdAndPurchaseDateBetween(apartment.getId(), billingMonthStart, billingMonthEnd)
                .stream()
                .filter(p -> !p.isDistributed())
                .toList();

        if (purchases.isEmpty()) {
            throw new InvalidRequestException("No undistributed water purchases found for "
                    + apartment.getName() + " in " + request.getBillingMonth());
        }

        BigDecimal totalCost = purchases.stream()
                .map(WaterPurchase::getCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Household> households = householdRepository.findByApartmentId(apartment.getId());

        List<ConsumptionDistributionEngine.HouseholdInput> inputs = households.stream()
                .map(h -> {
                    List<WaterUsageLog> logs = waterUsageLogRepository
                            .findByHouseholdIdAndReadingDateBetweenOrderByReadingDateAsc(
                                    h.getId(), billingMonthStart, billingMonthEnd);
                    BigDecimal consumption = logs.isEmpty() ? null : logs.stream()
                            .map(l -> BigDecimal.valueOf(l.getConsumptionKl()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new ConsumptionDistributionEngine.HouseholdInput(
                            h.getId(), h.getUnitNumber(), h.isHasMeter(), consumption,
                            BigDecimal.valueOf(h.getAreaSqft()));
                })
                .toList();

        List<HouseholdAllocationLine> lines = distributionEngine.distribute(inputs, totalCost);

        SharedCostAllocation allocation = SharedCostAllocation.builder()
                .apartment(apartment)
                .billingMonth(billingMonthStart)
                .totalCost(totalCost)
                .householdCount(households.size())
                .build();

        households.forEach(h -> allocation.getHouseholdAllocations().add(toEntity(allocation, h, lines)));
        allocation.getSourcePurchases().addAll(purchases);

        SharedCostAllocation saved = sharedCostAllocationRepository.save(allocation);

        purchases.forEach(p -> {
            p.setDistributed(true);
            p.setDistributedAt(LocalDateTime.now());
        });
        waterPurchaseRepository.saveAll(purchases);

        log.info("Distributed {} across {} households for apartment {} / {}",
                totalCost, households.size(), apartment.getId(), request.getBillingMonth());

        auditLogService.record(adminId, "RUN_DISTRIBUTION", "SharedCostAllocation", saved.getId(),
                "Distributed " + totalCost + " across " + households.size() + " households for "
                        + apartment.getName() + " / " + request.getBillingMonth());

        return toReport(saved, lines);
    }

    @Transactional(readOnly = true)
    public DistributionReportResponse getReport(Long apartmentId, YearMonth billingMonth, Long adminId) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> ResourceNotFoundException.of("Apartment", apartmentId));
        assertOwnedByAdmin(apartment, adminId);

        SharedCostAllocation allocation = sharedCostAllocationRepository
                .findByApartmentIdAndBillingMonth(apartmentId, billingMonth.atDay(1))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No distribution found for " + apartment.getName() + " in " + billingMonth));

        return toReport(allocation, null);
    }

    @Transactional(readOnly = true)
    public List<DistributionReportResponse> listReports(Long adminId) {
        return sharedCostAllocationRepository.findAllForAdmin(adminId).stream()
                .map(a -> toReport(a, null))
                .toList();
    }

    private HouseholdCostAllocation toEntity(SharedCostAllocation allocation, Household household,
                                              List<HouseholdAllocationLine> lines) {
        HouseholdAllocationLine line = lines.stream()
                .filter(l -> l.getHouseholdId().equals(household.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Missing allocation line for household " + household.getId()));

        return HouseholdCostAllocation.builder()
                .sharedCostAllocation(allocation)
                .household(household)
                .allocationBasis(line.getAllocationBasis())
                .consumptionKl(line.getConsumptionKl())
                .areaSqft(line.getAreaSqft())
                .weight(line.getWeight())
                .percentage(line.getPercentage())
                .allocatedAmount(line.getAllocatedAmount())
                .build();
    }

    private DistributionReportResponse toReport(SharedCostAllocation allocation, List<HouseholdAllocationLine> freshLines) {
        List<HouseholdAllocationLine> lines = freshLines != null ? freshLines : allocation.getHouseholdAllocations().stream()
                .map(h -> HouseholdAllocationLine.builder()
                        .householdId(h.getHousehold().getId())
                        .unitNumber(h.getHousehold().getUnitNumber())
                        .allocationBasis(h.getAllocationBasis())
                        .consumptionKl(h.getConsumptionKl())
                        .areaSqft(h.getAreaSqft())
                        .weight(h.getWeight())
                        .percentage(h.getPercentage())
                        .allocatedAmount(h.getAllocatedAmount())
                        .build())
                .toList();

        return DistributionReportResponse.builder()
                .allocationId(allocation.getId())
                .apartmentId(allocation.getApartment().getId())
                .apartmentName(allocation.getApartment().getName())
                .billingMonth(allocation.getBillingMonth())
                .totalCost(allocation.getTotalCost())
                .householdCount(allocation.getHouseholdCount())
                .sourcePurchaseCount(allocation.getSourcePurchases().size())
                .households(lines)
                .createdAt(allocation.getCreatedAt())
                .build();
    }

    private void assertOwnedByAdmin(Apartment apartment, Long adminId) {
        if (apartment.getAdmin() == null || !apartment.getAdmin().getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this apartment");
        }
    }
}
