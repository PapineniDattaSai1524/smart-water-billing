package com.smartwater.billing.dto.purchase;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseSummaryResponse {
    private BigDecimal totalQuantityKl;
    private BigDecimal totalCost;
    /** totalCost / totalQuantityKl, or zero if no purchases yet. */
    private BigDecimal averageCostPerKl;
    private long purchaseCount;
}
