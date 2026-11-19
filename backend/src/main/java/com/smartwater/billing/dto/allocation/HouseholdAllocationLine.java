package com.smartwater.billing.dto.allocation;

import com.smartwater.billing.entity.AllocationBasis;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdAllocationLine {
    private Long householdId;
    private String unitNumber;
    private AllocationBasis allocationBasis;
    /** Null when the household had no meter reading for the period. */
    private BigDecimal consumptionKl;
    private BigDecimal areaSqft;
    private BigDecimal weight;
    private BigDecimal percentage;
    private BigDecimal allocatedAmount;
}
