package com.smartwater.billing.dto.alert;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Current per-apartment alert configuration. The plain fields reflect the raw
 * override row (null = no override, i.e. using the platform default); the
 * {@code effective*} fields tell the admin exactly what value will be applied
 * on the next scheduler run.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertThresholdConfigResponse {
    private Long apartmentId;
    private String apartmentName;

    private Double dailyThresholdKl;
    private Double anomalyStdDevMultiplier;
    private Integer minHistoryReadings;
    private boolean enabled;

    private double effectiveDailyThresholdKl;
    private double effectiveAnomalyStdDevMultiplier;
    private int effectiveMinHistoryReadings;
}
