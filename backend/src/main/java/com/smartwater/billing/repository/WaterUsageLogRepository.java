package com.smartwater.billing.repository;

import com.smartwater.billing.entity.WaterUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WaterUsageLogRepository extends JpaRepository<WaterUsageLog, Long> {

    List<WaterUsageLog> findByHouseholdIdOrderByReadingDateDesc(Long householdId);

    Optional<WaterUsageLog> findByHouseholdIdAndReadingDate(Long householdId, LocalDate readingDate);

    boolean existsByHouseholdIdAndReadingDate(Long householdId, LocalDate readingDate);

    List<WaterUsageLog> findByHouseholdIdAndReadingDateBetweenOrderByReadingDateAsc(
            Long householdId, LocalDate from, LocalDate to);

    Optional<WaterUsageLog> findFirstByHouseholdIdOrderByReadingDateDesc(Long householdId);

    @Query("SELECT COUNT(w) FROM WaterUsageLog w WHERE w.household.apartment.admin.id = :adminId")
    long countByHouseholdApartmentAdminId(@Param("adminId") Long adminId);

    @Query("""
            SELECT COALESCE(SUM(w.consumptionKl), 0) FROM WaterUsageLog w
            WHERE w.household.apartment.admin.id = :adminId
              AND w.readingDate BETWEEN :from AND :to
            """)
    Double sumConsumptionForAdminBetween(
            @Param("adminId") Long adminId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            SELECT w FROM WaterUsageLog w
            WHERE w.household.apartment.admin.id = :adminId
              AND w.readingDate BETWEEN :from AND :to
            ORDER BY w.readingDate ASC
            """)
    List<WaterUsageLog> findForAdminBetween(
            @Param("adminId") Long adminId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
            SELECT w.household.id, SUM(w.consumptionKl) FROM WaterUsageLog w
            WHERE w.household.apartment.admin.id = :adminId
              AND w.readingDate BETWEEN :from AND :to
            GROUP BY w.household.id
            ORDER BY SUM(w.consumptionKl) DESC
            """)
    List<Object[]> topConsumersForAdmin(
            @Param("adminId") Long adminId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT w FROM WaterUsageLog w WHERE w.household.apartment.admin.id = :adminId ORDER BY w.readingDate ASC")
    List<WaterUsageLog> findAllForAdminOrderByReadingDateAsc(@Param("adminId") Long adminId);

    @Query("SELECT w FROM WaterUsageLog w ORDER BY w.readingDate ASC")
    List<WaterUsageLog> findAllOrderByReadingDateAsc();

    @Query("SELECT COALESCE(SUM(w.consumptionKl), 0) FROM WaterUsageLog w")
    Double sumConsumptionGlobal();

    @Query("SELECT w FROM WaterUsageLog w WHERE w.household.apartment.admin.id = :adminId ORDER BY w.readingDate DESC")
    List<WaterUsageLog> findAllForAdmin(@Param("adminId") Long adminId);
}
