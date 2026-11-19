package com.smartwater.billing.repository;

import com.smartwater.billing.entity.Apartment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApartmentRepository extends JpaRepository<Apartment, Long> {
    boolean existsByNameIgnoreCase(String name);
    Optional<Apartment> findByNameIgnoreCase(String name);
    List<Apartment> findByAdminId(Long adminId);
    long countByAdminId(Long adminId);
}
