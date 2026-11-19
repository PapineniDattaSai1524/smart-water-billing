package com.smartwater.billing.service;

import com.smartwater.billing.dto.billing.BillingBreakdownResponse;
import com.smartwater.billing.dto.billing.TierChargeLine;
import com.smartwater.billing.entity.TariffPlan;
import com.smartwater.billing.entity.TariffTier;
import com.smartwater.billing.exception.InvalidRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Stateless engine that turns a consumption figure into a full, itemized
 * bill for a given {@link TariffPlan}. All monetary math is BigDecimal only
 * — never float/double — scaled to 2 decimal places with HALF_UP rounding,
 * matching DECIMAL(15,2) columns.
 *
 * Billing rule for tiered plans (0-10 / 11-20 / 20+ KL style):
 * each tier is billed only for the portion of consumption that falls
 * inside its own band, at that band's rate — never the whole volume at
 * the top rate. Non-tiered plans fall back to a single flat rate.
 */
@Component
public class TieredBillingCalculator {

    private static final int SCALE = 2;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    public BillingBreakdownResponse calculate(TariffPlan plan, BigDecimal consumptionKl, BigDecimal sharedCharge) {
        if (consumptionKl == null || consumptionKl.signum() < 0) {
            throw new InvalidRequestException("Consumption cannot be negative");
        }
        BigDecimal shared = nz(sharedCharge);

        List<TierChargeLine> tierLines = plan.isTiered()
                ? billTiers(plan.getOrderedTiers(), consumptionKl)
                : List.of(flatRateAsSingleLine(plan, consumptionKl));

        BigDecimal baseCharge = tierLines.stream()
                .map(TierChargeLine::getChargeForTier)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(SCALE, ROUNDING);

        BigDecimal fixedCharge = nz(plan.getFixedCharge());
        BigDecimal subtotal = baseCharge.add(fixedCharge).add(shared).setScale(SCALE, ROUNDING);

        BigDecimal taxPercentage = nz(plan.getTaxPercentage());
        BigDecimal taxAmount = subtotal
                .multiply(taxPercentage)
                .divide(BigDecimal.valueOf(100), SCALE, ROUNDING);

        BigDecimal preClampTotal = subtotal.add(taxAmount).setScale(SCALE, ROUNDING);

        BigDecimal finalTotal = preClampTotal;
        boolean clamped = false;
        if (plan.getMinimumCharge() != null && finalTotal.compareTo(plan.getMinimumCharge()) < 0) {
            finalTotal = plan.getMinimumCharge().setScale(SCALE, ROUNDING);
            clamped = true;
        }
        if (plan.getMaximumCharge() != null && finalTotal.compareTo(plan.getMaximumCharge()) > 0) {
            finalTotal = plan.getMaximumCharge().setScale(SCALE, ROUNDING);
            clamped = true;
        }

        return BillingBreakdownResponse.builder()
                .consumptionKl(consumptionKl.setScale(SCALE, ROUNDING))
                .baseCharge(baseCharge)
                .tierBreakdown(tierLines)
                .fixedCharge(fixedCharge.setScale(SCALE, ROUNDING))
                .sharedCharge(shared.setScale(SCALE, ROUNDING))
                .subtotal(subtotal)
                .taxPercentage(taxPercentage.setScale(SCALE, ROUNDING))
                .taxAmount(taxAmount)
                .preClampTotal(preClampTotal)
                .minimumCharge(plan.getMinimumCharge())
                .maximumCharge(plan.getMaximumCharge())
                .clamped(clamped)
                .totalBill(finalTotal)
                .build();
    }

    private TierChargeLine flatRateAsSingleLine(TariffPlan plan, BigDecimal consumptionKl) {
        BigDecimal rate = nz(plan.getRatePerKl());
        BigDecimal charge = consumptionKl.multiply(rate).setScale(SCALE, ROUNDING);
        return TierChargeLine.builder()
                .tierOrder(1)
                .minKl(BigDecimal.ZERO)
                .maxKl(null)
                .ratePerKl(rate)
                .klBilledAtTier(consumptionKl.setScale(SCALE, ROUNDING))
                .chargeForTier(charge)
                .build();
    }

    private List<TierChargeLine> billTiers(List<TariffTier> tiers, BigDecimal consumptionKl) {
        List<TierChargeLine> lines = new ArrayList<>();
        BigDecimal remaining = consumptionKl;

        for (TariffTier tier : tiers) {
            if (remaining.signum() <= 0) {
                lines.add(zeroLine(tier));
                continue;
            }

            BigDecimal bandWidth = tier.getMaxKl() != null
                    ? tier.getMaxKl().subtract(tier.getMinKl())
                    : remaining; // unbounded top tier: absorb everything left

            BigDecimal klAtThisTier = remaining.min(bandWidth).setScale(SCALE, ROUNDING);
            BigDecimal charge = klAtThisTier.multiply(tier.getRatePerKl()).setScale(SCALE, ROUNDING);

            lines.add(TierChargeLine.builder()
                    .tierOrder(tier.getTierOrder())
                    .minKl(tier.getMinKl())
                    .maxKl(tier.getMaxKl())
                    .ratePerKl(tier.getRatePerKl())
                    .klBilledAtTier(klAtThisTier)
                    .chargeForTier(charge)
                    .build());

            remaining = remaining.subtract(klAtThisTier);
        }
        return lines;
    }

    private TierChargeLine zeroLine(TariffTier tier) {
        return TierChargeLine.builder()
                .tierOrder(tier.getTierOrder())
                .minKl(tier.getMinKl())
                .maxKl(tier.getMaxKl())
                .ratePerKl(tier.getRatePerKl())
                .klBilledAtTier(BigDecimal.ZERO.setScale(SCALE, ROUNDING))
                .chargeForTier(BigDecimal.ZERO.setScale(SCALE, ROUNDING))
                .build();
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    /**
     * Validates that a list of tier requests forms a valid ladder: sorted,
     * contiguous, non-overlapping, and only the last tier is unbounded.
     * Throws InvalidRequestException with a specific reason if not.
     */
    public void validateTierLadder(List<TariffTier> orderedTiers) {
        if (orderedTiers.isEmpty()) {
            return;
        }
        BigDecimal expectedStart = BigDecimal.ZERO;
        for (int i = 0; i < orderedTiers.size(); i++) {
            TariffTier tier = orderedTiers.get(i);
            boolean isLast = i == orderedTiers.size() - 1;

            if (tier.getMinKl().compareTo(expectedStart) != 0) {
                throw new InvalidRequestException("Tier " + (i + 1) + " must start at " + expectedStart
                        + " KL to be contiguous with the previous tier");
            }
            if (!isLast && tier.getMaxKl() == null) {
                throw new InvalidRequestException("Only the last (highest) tier may be unbounded");
            }
            if (isLast && tier.getMaxKl() != null) {
                throw new InvalidRequestException("The last (highest) tier must be unbounded (no maxKl)");
            }
            if (tier.getMaxKl() != null && tier.getMaxKl().compareTo(tier.getMinKl()) <= 0) {
                throw new InvalidRequestException("Tier " + (i + 1) + " maxKl must be greater than minKl");
            }
            if (tier.getRatePerKl().signum() < 0) {
                throw new InvalidRequestException("Tier " + (i + 1) + " rate cannot be negative");
            }
            expectedStart = tier.getMaxKl();
        }
    }
}
