package com.smartwater.billing.repository;

import com.smartwater.billing.entity.HouseholdCostAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface HouseholdCostAllocationRepository extends JpaRepository<HouseholdCostAllocation, Long> {

    /**
     * The shared-cost amount already allocated to a household for a given
     * billing month, if a distribution run has happened for that month.
     * Consumed by the Automatic Billing Engine (Module 4) as the invoice's
     * shared charge.
     */
    @Query("SELECT h FROM HouseholdCostAllocation h "
            + "WHERE h.household.id = :householdId AND h.sharedCostAllocation.billingMonth = :billingMonth")
    Optional<HouseholdCostAllocation> findByHouseholdIdAndBillingMonth(
            @Param("householdId") Long householdId, @Param("billingMonth") LocalDate billingMonth);
}
