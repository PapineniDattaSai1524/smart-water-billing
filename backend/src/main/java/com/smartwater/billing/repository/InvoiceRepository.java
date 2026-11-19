package com.smartwater.billing.repository;

import com.smartwater.billing.entity.Invoice;
import com.smartwater.billing.entity.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    boolean existsByHouseholdIdAndBillingMonth(Long householdId, String billingMonth);

    List<Invoice> findByHouseholdIdOrderByBillingMonthDesc(Long householdId);

    @Query("SELECT i FROM Invoice i WHERE i.household.apartment.admin.id = :adminId "
            + "AND (:status IS NULL OR i.status = :status) "
            + "AND (:billingMonth IS NULL OR i.billingMonth = :billingMonth) "
            + "ORDER BY i.generatedAt DESC")
    Page<Invoice> findForAdmin(
            @Param("adminId") Long adminId,
            @Param("status") InvoiceStatus status,
            @Param("billingMonth") String billingMonth,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i "
            + "WHERE i.household.apartment.admin.id = :adminId AND i.status = 'PAID'")
    java.math.BigDecimal sumPaidRevenueForAdmin(@Param("adminId") Long adminId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i "
            + "WHERE i.household.apartment.admin.id = :adminId AND i.status IN ('UNPAID', 'OVERDUE')")
    java.math.BigDecimal sumOutstandingForAdmin(@Param("adminId") Long adminId);

    Optional<Invoice> findByHouseholdIdAndBillingMonth(Long householdId, String billingMonth);

    @Query("SELECT i.billingMonth, COALESCE(SUM(i.totalAmount), 0) FROM Invoice i "
            + "WHERE i.household.apartment.admin.id = :adminId AND i.status = 'PAID' "
            + "GROUP BY i.billingMonth ORDER BY i.billingMonth ASC")
    List<Object[]> monthlyRevenueForAdmin(@Param("adminId") Long adminId);

    @Query("SELECT i.billingMonth, COALESCE(SUM(i.totalAmount), 0) FROM Invoice i "
            + "WHERE i.status = 'PAID' GROUP BY i.billingMonth ORDER BY i.billingMonth ASC")
    List<Object[]> monthlyRevenueGlobal();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status = 'PAID'")
    java.math.BigDecimal sumPaidRevenueGlobal();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status IN ('UNPAID', 'OVERDUE')")
    java.math.BigDecimal sumOutstandingGlobal();

    @Query("SELECT i FROM Invoice i WHERE i.household.apartment.id = :apartmentId AND i.billingMonth = :billingMonth")
    List<Invoice> findByApartmentIdAndBillingMonth(
            @Param("apartmentId") Long apartmentId, @Param("billingMonth") String billingMonth);

    @Query("SELECT i FROM Invoice i WHERE i.billingCycle.id = :cycleId")
    List<Invoice> findByBillingCycleId(@Param("cycleId") Long cycleId);

    @Query("SELECT i FROM Invoice i WHERE i.household.apartment.id = :apartmentId "
            + "AND i.billingMonth = :billingMonth AND i.status <> 'PAID'")
    List<Invoice> findUnpaidByApartmentIdAndBillingMonth(
            @Param("apartmentId") Long apartmentId, @Param("billingMonth") String billingMonth);

    @Query("SELECT COUNT(i) > 0 FROM Invoice i WHERE i.household.apartment.id = :apartmentId "
            + "AND i.billingMonth = :billingMonth AND i.status = 'PAID'")
    boolean existsPaidByApartmentIdAndBillingMonth(
            @Param("apartmentId") Long apartmentId, @Param("billingMonth") String billingMonth);

    @Query("SELECT i FROM Invoice i WHERE i.household.apartment.admin.id = :adminId ORDER BY i.generatedAt DESC")
    List<Invoice> findAllForAdmin(@Param("adminId") Long adminId);
}
