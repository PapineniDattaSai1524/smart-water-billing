package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.cycle.BillingCycleResponse;
import com.smartwater.billing.entity.BillingCycle;
import com.smartwater.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BillingCycleMapper {

    private final InvoiceRepository invoiceRepository;

    public BillingCycleResponse toResponse(BillingCycle cycle) {
        int invoiceCount = invoiceRepository
                .findByApartmentIdAndBillingMonth(cycle.getApartment().getId(), cycle.getBillingMonth())
                .size();

        return BillingCycleResponse.builder()
                .id(cycle.getId())
                .apartmentId(cycle.getApartment().getId())
                .apartmentName(cycle.getApartment().getName())
                .billingMonth(cycle.getBillingMonth())
                .status(cycle.getStatus())
                .openedByAdminName(cycle.getOpenedByAdmin() != null ? cycle.getOpenedByAdmin().getFullName() : null)
                .openedAt(cycle.getOpenedAt())
                .closedAt(cycle.getClosedAt())
                .finalizedAt(cycle.getFinalizedAt())
                .archivedAt(cycle.getArchivedAt())
                .reopenedAt(cycle.getReopenedAt())
                .recalculationCount(cycle.getRecalculationCount())
                .invoiceCount(invoiceCount)
                .notes(cycle.getNotes())
                .build();
    }
}
