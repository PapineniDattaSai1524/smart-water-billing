package com.smartwater.billing.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "tariff_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TariffPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "tariff_plans_gen")
    @SequenceGenerator(name = "tariff_plans_gen", sequenceName = "tariff_plans_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String name;

    /**
     * Flat rate per KL, used only when {@link #tiers} is empty (backward
     * compatibility with plans created before the tiered engine existed).
     */
    @Column(name = "rate_per_kl", nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerKl;

    @Builder.Default
    @Column(name = "fixed_charge", nullable = false, precision = 10, scale = 2)
    private BigDecimal fixedCharge = BigDecimal.ZERO;

    /** Tax applied to the (base + shared) charge, as a percentage, e.g. 5.00 = 5%. */
    @Builder.Default
    @Column(name = "tax_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    /** Floor applied to the final bill, regardless of consumption. Null = no floor. */
    @Column(name = "minimum_charge", precision = 15, scale = 2)
    private BigDecimal minimumCharge;

    /** Cap applied to the final bill, regardless of consumption. Null = no cap. */
    @Column(name = "maximum_charge", precision = 15, scale = 2)
    private BigDecimal maximumCharge;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Builder.Default
    @OneToMany(mappedBy = "tariffPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<TariffTier> tiers = new ArrayList<>();

    /** Tiers currently in effect, sorted by band order. Empty means "use the flat rate". */
    @Transient
    public List<TariffTier> getOrderedTiers() {
        return tiers.stream()
                .sorted(Comparator.comparing(TariffTier::getTierOrder))
                .toList();
    }

    public boolean isTiered() {
        return tiers != null && !tiers.isEmpty();
    }
}
