package com.smartwater.billing.repository;

import com.smartwater.billing.entity.WaterMeterConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WaterMeterConfigRepository extends JpaRepository<WaterMeterConfig, Long> {

    Optional<WaterMeterConfig> findByHouseholdId(Long householdId);

    boolean existsByMeterNumberIgnoreCase(String meterNumber);

    boolean existsByHouseholdId(Long householdId);

    @Query("""
            SELECT COUNT(m) FROM WaterMeterConfig m
            WHERE m.household.apartment.admin.id = :adminId AND m.status = com.smartwater.billing.entity.MeterStatus.ACTIVE
            """)
    long countActiveByAdminId(@Param("adminId") Long adminId);
}
