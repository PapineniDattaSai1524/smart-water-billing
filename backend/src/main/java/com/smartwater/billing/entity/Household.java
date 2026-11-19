package com.smartwater.billing.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "households", uniqueConstraints = @UniqueConstraint(columnNames = {"apartment_id", "unit_number"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Household extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "households_gen")
    @SequenceGenerator(name = "households_gen", sequenceName = "households_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "apartment_id", nullable = false)
    private Apartment apartment;

    @NotBlank
    @Column(name = "unit_number", nullable = false, length = 30)
    private String unitNumber;

    /**
     * Globally unique (platform-wide, not just within this apartment) identifier a
     * Building Owner shares with a resident so the resident can self-register and be
     * linked to the correct household automatically (see AuthService#register). Always
     * server-generated -- see {@link #assignHouseholdCodeIfMissing()} -- never settable
     * via {@link com.smartwater.billing.dto.household.HouseholdRequest}, so it can never
     * collide with another building's household the way unit_number alone can.
     */
    @Column(name = "household_code", nullable = false, unique = true, length = 60)
    private String householdCode;

    @Positive
    @Column(name = "area_sqft", nullable = false)
    private Double areaSqft;

    @Column(name = "occupancy_count", nullable = false)
    private Integer occupancyCount;

    @Builder.Default
    @Column(name = "has_meter", nullable = false)
    private boolean hasMeter = true;

    @Builder.Default
    @OneToMany(mappedBy = "household", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResidentAssignment> residentAssignments = new ArrayList<>();

    @OneToOne(mappedBy = "household", cascade = CascadeType.ALL, orphanRemoval = true)
    private WaterMeterConfig meterConfig;

    /**
     * Generates the household_code exactly once, at insert time, from the (already
     * persisted, so it has an id) parent apartment and this household's unit number --
     * never regenerated on update, so a code already handed to a resident keeps working
     * even if the unit number is edited later. Format: HH-<apartment id>-<unit number,
     * upper-cased, whitespace stripped>. Since (apartment_id, unit_number) is already
     * guaranteed unique by the uq_household_unit constraint, this is guaranteed globally
     * unique without needing a lookup/retry loop.
     */
    @PrePersist
    private void assignHouseholdCodeIfMissing() {
        if (householdCode == null || householdCode.isBlank()) {
            String normalizedUnit = unitNumber == null ? "" : unitNumber.replaceAll("\\s+", "").toUpperCase();
            householdCode = "HH-" + apartment.getId() + "-" + normalizedUnit;
        }
    }
}
