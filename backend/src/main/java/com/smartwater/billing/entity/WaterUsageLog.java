package com.smartwater.billing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "water_usage_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"household_id", "reading_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterUsageLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "water_usage_logs_gen")
    @SequenceGenerator(name = "water_usage_logs_gen", sequenceName = "water_usage_logs_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate;

    @Column(name = "meter_reading_kl", nullable = false)
    private Double meterReadingKl;

    @Column(name = "consumption_kl", nullable = false)
    private Double consumptionKl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UsageSource source = UsageSource.MANUAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(length = 255)
    private String remarks;
}
