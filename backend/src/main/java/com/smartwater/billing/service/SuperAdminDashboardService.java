package com.smartwater.billing.service;

import com.smartwater.billing.dto.registration.SuperAdminDashboardResponse;
import com.smartwater.billing.entity.RegistrationStatus;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.repository.CommunityRepository;
import com.smartwater.billing.repository.RegistrationRequestRepository;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.repository.WaterUsageLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SuperAdminDashboardService {

    private final RegistrationRequestRepository registrationRequestRepository;
    private final CommunityRepository communityRepository;
    private final UserRepository userRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;

    @Transactional(readOnly = true)
    public SuperAdminDashboardResponse getStats() {
        return SuperAdminDashboardResponse.builder()
                .pendingRequests(registrationRequestRepository.countByStatus(RegistrationStatus.PENDING))
                .approvedCommunities(registrationRequestRepository.countByStatus(RegistrationStatus.APPROVED))
                .rejectedRequests(registrationRequestRepository.countByStatus(RegistrationStatus.REJECTED))
                .totalCommunities(communityRepository.count())
                .totalAdministrators(userRepository.findByRole(Role.ADMIN).size())
                .totalResidents(userRepository.findByRole(Role.RESIDENT).size())
                .totalWaterUsageRecords(waterUsageLogRepository.count())
                .build();
    }
}
