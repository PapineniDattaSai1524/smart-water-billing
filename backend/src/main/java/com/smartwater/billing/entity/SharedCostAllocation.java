package com.smartwater.billing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * One run of the Consumption Distribution Engine: splits the total bulk
 * water cost for an apartment/billing-month across its households.
 */
@Entity
@Table(name = "shared_cost_allocations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"apartment_id", "billing_month"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedCostAllocation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "shared_cost_allocations_gen")
    @SequenceGenerator(name = "shared_cost_allocations_gen", sequenceName = "shared_cost_allocations_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    /** Normalized to the 1st of the month. */
    @Column(name = "billing_month", nullable = false)
    private LocalDate billingMonth;

    @Column(name = "total_cost", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "household_count", nullable = false)
    private Integer householdCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_admin_id")
    private User createdByAdmin;

    @Builder.Default
    @OneToMany(mappedBy = "sharedCostAllocation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HouseholdCostAllocation> householdAllocations = new ArrayList<>();

    @Builder.Default
    @ManyToMany
    @JoinTable(name = "shared_cost_allocation_purchases",
            joinColumns = @JoinColumn(name = "shared_cost_allocation_id"),
            inverseJoinColumns = @JoinColumn(name = "water_purchase_id"))
    private List<WaterPurchase> sourcePurchases = new ArrayList<>();
}
