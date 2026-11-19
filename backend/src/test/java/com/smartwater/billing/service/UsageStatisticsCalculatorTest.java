package com.smartwater.billing.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class UsageStatisticsCalculatorTest {

    @Test
    void mean_computesArithmeticAverage() {
        double result = UsageStatisticsCalculator.mean(List.of(1.0, 2.0, 3.0, 4.0));
        assertThat(result).isEqualTo(2.5);
    }

    @Test
    void mean_returnsZero_forEmptyOrNullList() {
        assertThat(UsageStatisticsCalculator.mean(List.of())).isZero();
        assertThat(UsageStatisticsCalculator.mean(null)).isZero();
    }

    @Test
    void standardDeviation_computesSampleStdDev() {
        // Values: 2, 4, 4, 4, 5, 5, 7, 9 -> classic textbook example, sample stddev = 2.13809...
        List<Double> values = List.of(2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0);
        double mean = UsageStatisticsCalculator.mean(values);
        double stdDev = UsageStatisticsCalculator.standardDeviation(values, mean);

        assertThat(mean).isEqualTo(5.0);
        assertThat(stdDev).isCloseTo(2.13809, within(0.001));
    }

    @Test
    void standardDeviation_returnsZero_whenFewerThanTwoValues() {
        assertThat(UsageStatisticsCalculator.standardDeviation(List.of(3.0), 3.0)).isZero();
        assertThat(UsageStatisticsCalculator.standardDeviation(List.of(), 0.0)).isZero();
        assertThat(UsageStatisticsCalculator.standardDeviation(null, 0.0)).isZero();
    }

    @Test
    void standardDeviation_isZero_whenAllValuesIdentical() {
        List<Double> values = List.of(3.0, 3.0, 3.0, 3.0);
        double stdDev = UsageStatisticsCalculator.standardDeviation(values, UsageStatisticsCalculator.mean(values));
        assertThat(stdDev).isZero();
    }

    @Test
    void standardDeviation_convenienceOverload_computesMeanInternally() {
        List<Double> values = List.of(2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0);
        assertThat(UsageStatisticsCalculator.standardDeviation(values))
                .isCloseTo(2.13809, within(0.001));
    }
}
