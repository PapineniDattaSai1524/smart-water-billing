package com.smartwater.billing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** One household's share of a {@link SharedCostAllocation} run. */
@Entity
@Table(name = "household_cost_allocations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"shared_cost_allocation_id", "household_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HouseholdCostAllocation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "household_cost_allocations_gen")
    @SequenceGenerator(name = "household_cost_allocations_gen", sequenceName = "household_cost_allocations_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shared_cost_allocation_id", nullable = false)
    private SharedCostAllocation sharedCostAllocation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @Enumerated(EnumType.STRING)
    @Column(name = "allocation_basis", nullable = false, length = 20)
    private AllocationBasis allocationBasis;

    /** Null when the household had no reading for the period. */
    @Column(name = "consumption_kl", precision = 10, scale = 2)
    private BigDecimal consumptionKl;

    @Column(name = "area_sqft", nullable = false, precision = 10, scale = 2)
    private BigDecimal areaSqft;

    @Column(nullable = false, precision = 14, scale = 4)
    private BigDecimal weight;

    @Column(nullable = false, precision = 7, scale = 4)
    private BigDecimal percentage;

    @Column(name = "allocated_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal allocatedAmount;
}
