package com.smartwater.billing.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Optional per-apartment override of the Alert & Notification Engine's
 * platform-wide defaults (see {@code app.alert.*} in application.properties,
 * bound by {@link com.smartwater.billing.config.AlertProperties}).
 * A missing row for an apartment simply means "use the platform default".
 */
@Entity
@Table(name = "apartment_alert_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApartmentAlertConfig extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "apartment_alert_configs_gen")
    @SequenceGenerator(name = "apartment_alert_configs_gen", sequenceName = "apartment_alert_configs_id_seq", allocationSize = 1)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apartment_id", nullable = false, unique = true)
    private Apartment apartment;

    /** Daily consumption (kL) above which an OVERUSE alert fires. Null = use platform default. */
    @Column(name = "daily_threshold_kl")
    private Double dailyThresholdKl;

    /** Multiplier applied to standard deviation for the anomaly/leak rule. Null = use platform default. */
    @Column(name = "anomaly_std_dev_multiplier")
    private Double anomalyStdDevMultiplier;

    /** Minimum number of historical readings required before anomaly detection runs. Null = use platform default. */
    @Column(name = "min_history_readings")
    private Integer minHistoryReadings;

    @Builder.Default
    @Column(nullable = false)
    private boolean enabled = true;
}
