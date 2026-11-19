package com.smartwater.billing.repository;

import com.smartwater.billing.entity.SharedCostAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SharedCostAllocationRepository extends JpaRepository<SharedCostAllocation, Long> {

    Optional<SharedCostAllocation> findByApartmentIdAndBillingMonth(Long apartmentId, LocalDate billingMonth);

    boolean existsByApartmentIdAndBillingMonth(Long apartmentId, LocalDate billingMonth);

    List<SharedCostAllocation> findByApartmentIdOrderByBillingMonthDesc(Long apartmentId);

    @Query("SELECT a FROM SharedCostAllocation a WHERE a.apartment.admin.id = :adminId ORDER BY a.billingMonth DESC")
    List<SharedCostAllocation> findAllForAdmin(@Param("adminId") Long adminId);
}
