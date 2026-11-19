package com.smartwater.billing.repository;

import com.smartwater.billing.entity.RegistrationRequest;
import com.smartwater.billing.entity.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {

    List<RegistrationRequest> findAllByOrderByCreatedAtDesc();

    List<RegistrationRequest> findByStatusOrderByCreatedAtDesc(RegistrationStatus status);

    boolean existsByAdminEmailIgnoreCaseAndStatus(String adminEmail, RegistrationStatus status);

    long countByStatus(RegistrationStatus status);
}
