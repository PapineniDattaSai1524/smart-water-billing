package com.smartwater.billing.repository;

import com.smartwater.billing.entity.BillingCycle;
import com.smartwater.billing.entity.CycleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BillingCycleRepository extends JpaRepository<BillingCycle, Long> {

    Optional<BillingCycle> findByApartmentIdAndBillingMonth(Long apartmentId, String billingMonth);

    boolean existsByApartmentIdAndBillingMonth(Long apartmentId, String billingMonth);

    @Query("SELECT c FROM BillingCycle c WHERE c.apartment.admin.id = :adminId "
            + "AND (:apartmentId IS NULL OR c.apartment.id = :apartmentId) "
            + "AND (:status IS NULL OR c.status = :status) "
            + "ORDER BY c.billingMonth DESC")
    Page<BillingCycle> search(
            @Param("adminId") Long adminId,
            @Param("apartmentId") Long apartmentId,
            @Param("status") CycleStatus status,
            Pageable pageable);
}
