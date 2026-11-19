package com.smartwater.billing.dto.alert;

import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

/**
 * Admin-supplied override of the platform-wide alert defaults for one apartment.
 * Any field left null means "use the platform default" for that setting.
 */
@Getter
@Setter
public class AlertThresholdConfigRequest {

    @Positive(message = "Daily threshold must be a positive number of kL")
    private Double dailyThresholdKl;

    @Positive(message = "Anomaly standard-deviation multiplier must be positive")
    private Double anomalyStdDevMultiplier;

    @Positive(message = "Minimum history readings must be a positive integer")
    private Integer minHistoryReadings;

    /** Defaults to true (alerts enabled) when not supplied. */
    private Boolean enabled;
}
