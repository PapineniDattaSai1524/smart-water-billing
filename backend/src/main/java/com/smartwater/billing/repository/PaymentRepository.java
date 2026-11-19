package com.smartwater.billing.repository;

import com.smartwater.billing.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByInvoiceId(Long invoiceId);

    @Query("SELECT p FROM Payment p WHERE p.paidBy.id = :userId ORDER BY p.paidAt DESC")
    List<Payment> findByPaidByIdOrderByPaidAtDesc(@Param("userId") Long userId);

    @Query("SELECT p FROM Payment p WHERE p.invoice.household.apartment.admin.id = :adminId ORDER BY p.paidAt DESC")
    List<Payment> findForAdmin(@Param("adminId") Long adminId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.invoice.household.apartment.admin.id = :adminId")
    java.math.BigDecimal sumForAdmin(@Param("adminId") Long adminId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p")
    java.math.BigDecimal sumGlobal();
}
