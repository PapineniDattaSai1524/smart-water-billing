package com.smartwater.billing.repository;

import com.smartwater.billing.entity.ResidentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResidentAssignmentRepository extends JpaRepository<ResidentAssignment, Long> {

    List<ResidentAssignment> findByHouseholdId(Long householdId);

    List<ResidentAssignment> findByUserId(Long userId);

    Optional<ResidentAssignment> findByHouseholdIdAndUserId(Long householdId, Long userId);

    boolean existsByHouseholdIdAndUserIdAndActiveTrue(Long householdId, Long userId);

    List<ResidentAssignment> findByHouseholdIdAndActiveTrue(Long householdId);
}
