package com.smartwater.billing.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Platform-wide defaults for the Alert & Notification Engine, bound from
 * {@code app.alert.*} in application.properties. Any apartment can override
 * the threshold/anomaly values via {@link com.smartwater.billing.entity.ApartmentAlertConfig};
 * these are the fallback values used when no override (or a partial override) exists.
 */
@Configuration
@ConfigurationProperties(prefix = "app.alert")
@Getter
@Setter
public class AlertProperties {

    /** Master switch for the scheduled job. */
    private boolean enabled = true;

    /** Daily consumption (kL) above which an OVERUSE alert fires. */
    private double dailyThresholdKl = 1.0;

    /** Multiplier applied to standard deviation for the anomaly/leak rule (2-sigma by default). */
    private double anomalyStdDevMultiplier = 2.0;

    /** Minimum number of historical readings required before anomaly detection runs. */
    private int minHistoryReadings = 7;

    /** Cron expression controlling how often the alert engine runs. Defaults to daily at 06:00. */
    private String cron = "0 0 6 * * *";

    /**
     * Master switch for outbound alert emails. Defaults to false so a deployment with no
     * SMTP settings never even attempts to send (and never logs send failures on every run).
     * Turn on once {@code spring.mail.host} etc. are configured.
     */
    private boolean emailEnabled = false;
}
