package com.smartwater.billing.repository;

import com.smartwater.billing.entity.TariffPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TariffPlanRepository extends JpaRepository<TariffPlan, Long> {
    List<TariffPlan> findByApartmentId(Long apartmentId);
    Optional<TariffPlan> findByApartmentIdAndActiveTrue(Long apartmentId);
    List<TariffPlan> findByApartmentAdminId(Long adminId);
}
