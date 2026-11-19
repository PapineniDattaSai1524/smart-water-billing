package com.smartwater.billing.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/** How much of the total consumption fell into one tariff tier, and what it cost. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TierChargeLine {
    private Integer tierOrder;
    private BigDecimal minKl;
    private BigDecimal maxKl;
    private BigDecimal ratePerKl;
    /** KL of consumption actually billed at this tier's rate. */
    private BigDecimal klBilledAtTier;
    /** klBilledAtTier * ratePerKl */
    private BigDecimal chargeForTier;
}
