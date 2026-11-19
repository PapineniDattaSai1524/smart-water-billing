package com.smartwater.billing.service;

import com.smartwater.billing.dto.allocation.HouseholdAllocationLine;
import com.smartwater.billing.entity.AllocationBasis;
import com.smartwater.billing.exception.InvalidRequestException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Splits a shared water cost across a set of households.
 *
 * Rule: a household with a meter reading for the period is billed on its
 * actual consumption. A household with no reading (no meter, or a meter
 * that wasn't read this period) falls back to area-based distribution:
 * if any metered households exist, its consumption is <i>estimated</i> from
 * the metered peers' average consumption density (KL per sqft) applied to
 * its own area; if no metered data exists anywhere in the apartment, every
 * household is split by area alone.
 *
 * All money math is BigDecimal, HALF_UP, scale 2 — and the largest line's
 * amount absorbs any rounding remainder so the allocated total always
 * equals the input total cost to the cent.
 */
@Component
public class ConsumptionDistributionEngine {

    private static final int MONEY_SCALE = 2;
    private static final int WEIGHT_SCALE = 4;

    public record HouseholdInput(
            Long householdId,
            String unitNumber,
            boolean hasMeter,
            /** Null if no reading was submitted for the household this period. */
            BigDecimal consumptionKl,
            BigDecimal areaSqft) {
    }

    public List<HouseholdAllocationLine> distribute(List<HouseholdInput> households, BigDecimal totalCost) {
        if (households == null || households.isEmpty()) {
            throw new InvalidRequestException("Cannot distribute cost: apartment has no households");
        }
        if (totalCost == null || totalCost.signum() < 0) {
            throw new InvalidRequestException("Total cost to distribute cannot be negative");
        }

        BigDecimal totalMeteredConsumption = BigDecimal.ZERO;
        BigDecimal totalMeteredArea = BigDecimal.ZERO;
        for (HouseholdInput h : households) {
            if (isMeteredWithReading(h)) {
                totalMeteredConsumption = totalMeteredConsumption.add(h.consumptionKl());
                totalMeteredArea = totalMeteredArea.add(h.areaSqft());
            }
        }
        // Average KL consumed per sqft among households we actually have data for.
        BigDecimal density = totalMeteredArea.signum() > 0
                ? totalMeteredConsumption.divide(totalMeteredArea, 6, RoundingMode.HALF_UP)
                : null;

        List<Weighted> weighted = new ArrayList<>();
        BigDecimal totalWeight = BigDecimal.ZERO;
        for (HouseholdInput h : households) {
            AllocationBasis basis;
            BigDecimal weight;
            if (isMeteredWithReading(h)) {
                basis = AllocationBasis.METERED;
                weight = h.consumptionKl();
            } else if (density != null) {
                basis = AllocationBasis.AREA_ESTIMATED;
                weight = density.multiply(h.areaSqft());
            } else {
                basis = AllocationBasis.AREA_FALLBACK;
                weight = h.areaSqft();
            }
            weight = weight.setScale(WEIGHT_SCALE, RoundingMode.HALF_UP);
            totalWeight = totalWeight.add(weight);
            weighted.add(new Weighted(h, basis, weight));
        }

        if (totalWeight.signum() <= 0) {
            throw new InvalidRequestException(
                    "Cannot distribute cost: no consumption or area data available across any household");
        }

        List<HouseholdAllocationLine> lines = new ArrayList<>();
        BigDecimal runningTotal = BigDecimal.ZERO;
        for (Weighted w : weighted) {
            BigDecimal percentage = w.weight.multiply(BigDecimal.valueOf(100))
                    .divide(totalWeight, WEIGHT_SCALE, RoundingMode.HALF_UP);
            BigDecimal amount = totalCost.multiply(w.weight)
                    .divide(totalWeight, MONEY_SCALE, RoundingMode.HALF_UP);
            runningTotal = runningTotal.add(amount);

            lines.add(HouseholdAllocationLine.builder()
                    .householdId(w.input.householdId())
                    .unitNumber(w.input.unitNumber())
                    .allocationBasis(w.basis)
                    .consumptionKl(w.input.consumptionKl())
                    .areaSqft(w.input.areaSqft())
                    .weight(w.weight)
                    .percentage(percentage)
                    .allocatedAmount(amount)
                    .build());
        }

        // Reconcile rounding drift: give the remainder to the largest allocation
        // so the sum of allocatedAmount always equals totalCost exactly.
        BigDecimal remainder = totalCost.setScale(MONEY_SCALE, RoundingMode.HALF_UP).subtract(runningTotal);
        if (remainder.signum() != 0) {
            HouseholdAllocationLine largest = lines.stream()
                    .max(Comparator.comparing(HouseholdAllocationLine::getAllocatedAmount))
                    .orElseThrow();
            int idx = lines.indexOf(largest);
            lines.set(idx, HouseholdAllocationLine.builder()
                    .householdId(largest.getHouseholdId())
                    .unitNumber(largest.getUnitNumber())
                    .allocationBasis(largest.getAllocationBasis())
                    .consumptionKl(largest.getConsumptionKl())
                    .areaSqft(largest.getAreaSqft())
                    .weight(largest.getWeight())
                    .percentage(largest.getPercentage())
                    .allocatedAmount(largest.getAllocatedAmount().add(remainder))
                    .build());
        }

        return lines;
    }

    private boolean isMeteredWithReading(HouseholdInput h) {
        return h.hasMeter() && h.consumptionKl() != null;
    }

    private record Weighted(HouseholdInput input, AllocationBasis basis, BigDecimal weight) {
    }
}
