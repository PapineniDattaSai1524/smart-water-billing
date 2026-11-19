package com.smartwater.billing.repository;

import com.smartwater.billing.entity.ApartmentAlertConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApartmentAlertConfigRepository extends JpaRepository<ApartmentAlertConfig, Long> {

    Optional<ApartmentAlertConfig> findByApartmentId(Long apartmentId);
}
