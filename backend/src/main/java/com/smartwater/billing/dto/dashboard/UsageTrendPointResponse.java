package com.smartwater.billing.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** A single point on the resident dashboard's daily or monthly consumption trend chart. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsageTrendPointResponse {
    /** "2026-08-09" for daily points, "2026-08" for monthly points. */
    private String label;
    private Double consumptionKl;
}
