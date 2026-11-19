package com.smartwater.billing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * A single consumption band within a {@link TariffPlan}, e.g.
 * "0-10 KL at base rate", "11-20 KL at second rate", "20+ KL at third rate".
 * {@code maxKl == null} marks the highest, unbounded tier.
 */
@Entity
@Table(name = "tariff_tiers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TariffTier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "tariff_tiers_gen")
    @SequenceGenerator(name = "tariff_tiers_gen", sequenceName = "tariff_tiers_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tariff_plan_id", nullable = false)
    private TariffPlan tariffPlan;

    /** 1-based, contiguous ordering of tiers within a plan (1 = lowest band). */
    @Column(name = "tier_order", nullable = false)
    private Integer tierOrder;

    @Column(name = "min_kl", nullable = false, precision = 10, scale = 2)
    private BigDecimal minKl;

    /** Null means unbounded (this is the highest tier, "above X KL"). */
    @Column(name = "max_kl", precision = 10, scale = 2)
    private BigDecimal maxKl;

    @Column(name = "rate_per_kl", nullable = false, precision = 15, scale = 2)
    private BigDecimal ratePerKl;
}
