package com.smartwater.billing.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Week 5-6 Feature 4: consumption benchmarking / peer comparison for the
 * logged-in resident's household, computed entirely from real
 * water_usage_logs data (current calendar month) -- no hardcoded values.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumptionComparisonResponse {
    private String billingMonth;
    private Double myUsageKl;
    private Double apartmentAverageKl;
    /** Average usage among households whose areaSqft is within +/-20% of this household's. Null if none qualify besides self. */
    private Double similarSizedAverageKl;
    private int apartmentHouseholdCount;
    private int similarSizedHouseholdCount;
    /** BELOW_AVERAGE, NEAR_AVERAGE, or ABOVE_AVERAGE, relative to apartmentAverageKl. */
    private String status;
    /**
     * True when the household's latest reading exceeds mean + (stdDevMultiplier * stdDev)
     * of its own history -- the same 2-sigma rule the Alert Engine uses, read here purely
     * for the resident dashboard's "possible leak" tip. Does not raise a new alert/email;
     * that still only happens via the existing AlertEngineService scheduled job.
     */
    private boolean possibleLeak;
}
