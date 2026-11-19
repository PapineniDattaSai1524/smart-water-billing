package com.smartwater.billing.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full, itemized breakdown of a bill: per-tier consumption charges, fixed
 * charge, shared/common charge, tax, and the min/max-adjusted final total.
 * Every monetary field is a BigDecimal scaled to 2 decimal places.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingBreakdownResponse {

    private BigDecimal consumptionKl;

    /** Sum of all per-tier charges (or consumption * flat rate for non-tiered plans). */
    private BigDecimal baseCharge;

    private List<TierChargeLine> tierBreakdown;

    private BigDecimal fixedCharge;

    /** Shared/common-area charge allocated to this bill (e.g. tanker top-up share). */
    private BigDecimal sharedCharge;

    /** Subtotal before tax: baseCharge + fixedCharge + sharedCharge. */
    private BigDecimal subtotal;

    private BigDecimal taxPercentage;

    private BigDecimal taxAmount;

    /** subtotal + taxAmount, before minimum/maximum charge clamping. */
    private BigDecimal preClampTotal;

    private BigDecimal minimumCharge;

    private BigDecimal maximumCharge;

    /** True if the minimum or maximum charge rule changed the final total. */
    private boolean clamped;

    /** Final amount due, after tax and min/max clamping. */
    private BigDecimal totalBill;
}
