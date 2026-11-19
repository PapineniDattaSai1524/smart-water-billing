package com.smartwater.billing.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaterAnalyticsResponse {
    /** All-time consumption across every recorded reading -- a lifetime total, not a "current" figure. */
    private double totalConsumptionKl;
    /** Consumption for the current calendar month only -- what dashboards should treat as "now". */
    private double currentMonthConsumptionKl;
    /** Consumption for the calendar month immediately before the current one -- used for the % trend. */
    private double previousMonthConsumptionKl;
    /** Up to the last 6 calendar months that actually have logged readings, oldest first. Never zero-filled. */
    private List<MonthlyValue> monthlyConsumption;
    /** Ranked leaderboard (highest consumption first, capped) -- only households with a current-month reading. */
    private List<TopConsumerResponse> topConsumers;
    /**
     * EVERY household belonging to the admin's apartment(s), unit-number ordered, zero-filled for
     * households with no current-month reading yet. Powers the "Household Usage Comparison" chart,
     * which must show the full roster, not just top consumers.
     */
    private List<TopConsumerResponse> householdUsage;
}
