package com.smartwater.billing.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartwater.billing.dto.billing.BillingBreakdownResponse;
import com.smartwater.billing.dto.billing.InvoiceResponse;
import com.smartwater.billing.dto.billing.TariffPlanResponse;
import com.smartwater.billing.dto.billing.TariffTierResponse;
import com.smartwater.billing.entity.Invoice;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.TariffPlan;
import com.smartwater.billing.entity.TariffTier;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BillingMapper {

    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final ObjectMapper objectMapper;

    public TariffPlanResponse toResponse(TariffPlan plan) {
        return TariffPlanResponse.builder()
                .id(plan.getId())
                .apartmentId(plan.getApartment().getId())
                .apartmentName(plan.getApartment().getName())
                .name(plan.getName())
                .ratePerKl(plan.getRatePerKl())
                .fixedCharge(plan.getFixedCharge())
                .taxPercentage(plan.getTaxPercentage())
                .minimumCharge(plan.getMinimumCharge())
                .maximumCharge(plan.getMaximumCharge())
                .tiered(plan.isTiered())
                .tiers(plan.getOrderedTiers().stream().map(this::toResponse).toList())
                .active(plan.isActive())
                .build();
    }

    public TariffTierResponse toResponse(TariffTier tier) {
        return TariffTierResponse.builder()
                .id(tier.getId())
                .tierOrder(tier.getTierOrder())
                .minKl(tier.getMinKl())
                .maxKl(tier.getMaxKl())
                .ratePerKl(tier.getRatePerKl())
                .build();
    }

    public InvoiceResponse toResponse(Invoice invoice) {
        String residentName = residentAssignmentRepository
                .findByHouseholdIdAndActiveTrue(invoice.getHousehold().getId())
                .stream()
                .filter(ra -> ra.getRelationType().name().equals("PRIMARY"))
                .map(ResidentAssignment::getUser)
                .findFirst()
                .map(u -> u.getFullName())
                .orElse(null);

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .householdId(invoice.getHousehold().getId())
                .unitNumber(invoice.getHousehold().getUnitNumber())
                .apartmentName(invoice.getHousehold().getApartment().getName())
                .residentName(residentName)
                .billingMonth(invoice.getBillingMonth())
                .consumptionKl(invoice.getConsumptionKl())
                .ratePerKl(invoice.getRatePerKl())
                .fixedCharge(invoice.getFixedCharge())
                .baseCharge(invoice.getBaseCharge())
                .taxAmount(invoice.getTaxAmount())
                .totalAmount(invoice.getTotalAmount())
                .breakdown(deserializeBreakdown(invoice.getBreakdownJson()))
                .status(invoice.getStatus().name())
                .dueDate(invoice.getDueDate())
                .paidAt(invoice.getPaidAt())
                .generatedAt(invoice.getGeneratedAt())
                .build();
    }

    private BillingBreakdownResponse deserializeBreakdown(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, BillingBreakdownResponse.class);
        } catch (Exception e) {
            log.warn("Could not deserialize stored invoice breakdown JSON, omitting from response", e);
            return null;
        }
    }
}
