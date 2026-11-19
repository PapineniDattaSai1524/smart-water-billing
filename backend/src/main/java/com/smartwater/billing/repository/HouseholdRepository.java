package com.smartwater.billing.repository;

import com.smartwater.billing.entity.Household;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HouseholdRepository extends JpaRepository<Household, Long> {

    List<Household> findByApartmentId(Long apartmentId);

    Optional<Household> findByApartmentIdAndUnitNumberIgnoreCase(Long apartmentId, String unitNumber);

    boolean existsByApartmentIdAndUnitNumberIgnoreCase(Long apartmentId, String unitNumber);

    // Resident self-registration (AuthService#register) and the debounced "checking
    // availability..." lookup on the registration form both key off the globally unique
    // household_code, never the internal numeric id or the apartment-scoped unit_number.
    Optional<Household> findByHouseholdCodeIgnoreCase(String householdCode);

    @Query("SELECT COUNT(h) FROM Household h WHERE h.apartment.admin.id = :adminId")
    long countByApartmentAdminId(@Param("adminId") Long adminId);

    // Week 6-7 Feature: full household roster (across every apartment the admin owns) for the
    // Household Usage Comparison chart -- unit-number ordered so households without any current-month
    // reading still appear (zero-filled) instead of silently dropping out of the comparison.
    @Query("SELECT h FROM Household h WHERE h.apartment.admin.id = :adminId ORDER BY h.unitNumber ASC")
    List<Household> findByApartmentAdminIdOrderByUnitNumberAsc(@Param("adminId") Long adminId);
}
