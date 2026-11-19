package com.smartwater.billing.service;

import java.util.List;

/**
 * Pure, stateless statistics helper used by the Alert & Notification Engine's
 * 2-sigma anomaly rule. Kept free of any Spring/JPA dependency so it is
 * trivially unit-testable.
 */
public final class UsageStatisticsCalculator {

    private UsageStatisticsCalculator() {
    }

    /** Arithmetic mean of the given values. Returns 0.0 for a null/empty list. */
    public static double mean(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return 0.0;
        }
        double sum = 0.0;
        for (double value : values) {
            sum += value;
        }
        return sum / values.size();
    }

    /**
     * Sample standard deviation (n-1 denominator) of the given values around the given mean.
     * Returns 0.0 when fewer than 2 values are supplied, since variance is undefined for n &lt; 2.
     */
    public static double standardDeviation(List<Double> values, double mean) {
        if (values == null || values.size() < 2) {
            return 0.0;
        }
        double sumSquaredDiffs = 0.0;
        for (double value : values) {
            double diff = value - mean;
            sumSquaredDiffs += diff * diff;
        }
        return Math.sqrt(sumSquaredDiffs / (values.size() - 1));
    }

    /** Convenience overload that computes the mean internally. */
    public static double standardDeviation(List<Double> values) {
        return standardDeviation(values, mean(values));
    }
}
