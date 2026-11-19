package com.smartwater.billing.service;

import com.smartwater.billing.dto.system.SystemHealthResponse;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.CommunityRepository;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;

@Service
@RequiredArgsConstructor
public class SystemHealthService {

    private static final String APP_VERSION = "1.0.0";

    private final UserRepository userRepository;
    private final CommunityRepository communityRepository;
    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;

    @Transactional(readOnly = true)
    public SystemHealthResponse getHealth() {
        boolean databaseUp;
        long users = 0;
        long communities = 0;
        long apartments = 0;
        long households = 0;
        try {
            users = userRepository.count();
            communities = communityRepository.count();
            apartments = apartmentRepository.count();
            households = householdRepository.count();
            databaseUp = true;
        } catch (Exception ex) {
            databaseUp = false;
        }

        return SystemHealthResponse.builder()
                .status(databaseUp ? "UP" : "DEGRADED")
                .databaseUp(databaseUp)
                .appVersion(APP_VERSION)
                .uptimeSeconds(ManagementFactory.getRuntimeMXBean().getUptime() / 1000)
                .totalUsers(users)
                .totalCommunities(communities)
                .totalApartments(apartments)
                .totalHouseholds(households)
                .build();
    }
}
