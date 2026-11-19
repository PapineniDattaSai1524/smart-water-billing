package com.smartwater.billing.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A single bulk water purchase — a tanker delivery or a municipal supply
 * top-up — recorded against an apartment. Feeds Module 3 (Consumption
 * Distribution Engine), which allocates this cost across households.
 */
@Entity
@Table(name = "water_purchases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WaterPurchase extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "water_purchases_gen")
    @SequenceGenerator(name = "water_purchases_gen", sequenceName = "water_purchases_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 20)
    private WaterSourceType sourceType;

    @NotBlank
    @Column(name = "vendor_name", nullable = false, length = 150)
    private String vendorName;

    @Column(name = "quantity_kl", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityKl;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal cost;

    /** Derived: cost / quantityKl, persisted for fast reporting/sorting. */
    @Column(name = "cost_per_kl", nullable = false, precision = 15, scale = 2)
    private BigDecimal costPerKl;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate;

    @Column(name = "invoice_reference", length = 100)
    private String invoiceReference;

    @Column(length = 500)
    private String notes;

    /** Set once Module 3 has allocated this purchase's cost across households. */
    @Builder.Default
    @Column(nullable = false)
    private boolean distributed = false;

    @Column(name = "distributed_at")
    private LocalDateTime distributedAt;
}
