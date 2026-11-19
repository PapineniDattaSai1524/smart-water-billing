package com.smartwater.billing.dto.allocation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DistributionReportResponse {
    private Long allocationId;
    private Long apartmentId;
    private String apartmentName;
    private LocalDate billingMonth;
    private BigDecimal totalCost;
    private int householdCount;
    private int sourcePurchaseCount;
    private List<HouseholdAllocationLine> households;
    private LocalDateTime createdAt;
}
