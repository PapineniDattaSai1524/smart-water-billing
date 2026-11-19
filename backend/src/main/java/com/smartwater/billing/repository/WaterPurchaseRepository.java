package com.smartwater.billing.repository;

import com.smartwater.billing.entity.WaterPurchase;
import com.smartwater.billing.entity.WaterSourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface WaterPurchaseRepository extends JpaRepository<WaterPurchase, Long> {

    /**
     * Filterable, searchable purchase history for everything the admin owns.
     * All filters are optional (pass null to skip); {@code search} matches
     * vendor name or invoice reference, case-insensitively.
     */
    @Query("SELECT p FROM WaterPurchase p WHERE p.apartment.admin.id = :adminId "
            + "AND (:apartmentId IS NULL OR p.apartment.id = :apartmentId) "
            + "AND (:sourceType IS NULL OR p.sourceType = :sourceType) "
            + "AND (:fromDate IS NULL OR p.purchaseDate >= :fromDate) "
            + "AND (:toDate IS NULL OR p.purchaseDate <= :toDate) "
            + "AND (:search IS NULL OR LOWER(p.vendorName) LIKE LOWER(CONCAT('%', :search, '%')) "
            + "     OR LOWER(p.invoiceReference) LIKE LOWER(CONCAT('%', :search, '%'))) "
            + "ORDER BY p.purchaseDate DESC, p.id DESC")
    Page<WaterPurchase> search(
            @Param("adminId") Long adminId,
            @Param("apartmentId") Long apartmentId,
            @Param("sourceType") WaterSourceType sourceType,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("search") String search,
            Pageable pageable);

    List<WaterPurchase> findByApartmentId(Long apartmentId);

    /** Purchases for an apartment not yet folded into a household bill (Module 3 input). */
    List<WaterPurchase> findByApartmentIdAndDistributedFalse(Long apartmentId);

    List<WaterPurchase> findByApartmentIdAndPurchaseDateBetween(Long apartmentId, LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(SUM(p.quantityKl), 0) FROM WaterPurchase p "
            + "WHERE p.apartment.id = :apartmentId AND p.purchaseDate BETWEEN :from AND :to")
    BigDecimal sumQuantityForApartmentBetween(
            @Param("apartmentId") Long apartmentId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(p.cost), 0) FROM WaterPurchase p "
            + "WHERE p.apartment.id = :apartmentId AND p.purchaseDate BETWEEN :from AND :to")
    BigDecimal sumCostForApartmentBetween(
            @Param("apartmentId") Long apartmentId, @Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT COALESCE(SUM(p.quantityKl), 0) FROM WaterPurchase p WHERE p.apartment.admin.id = :adminId")
    BigDecimal sumQuantityForAdmin(@Param("adminId") Long adminId);

    @Query("SELECT COALESCE(SUM(p.cost), 0) FROM WaterPurchase p WHERE p.apartment.admin.id = :adminId")
    BigDecimal sumCostForAdmin(@Param("adminId") Long adminId);
}
