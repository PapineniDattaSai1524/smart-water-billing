package com.smartwater.billing.service;

import com.smartwater.billing.dto.registration.CommunityResponse;
import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Community;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.repository.CommunityRepository;
import com.smartwater.billing.repository.HouseholdRepository;
import com.smartwater.billing.repository.UserRepository;
import com.smartwater.billing.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CommunityManagementService {

    private final CommunityRepository communityRepository;
    private final HouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<CommunityResponse> list() {
        return communityRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public CommunityResponse suspend(Long id) {
        Community community = findOrThrow(id);
        community.setActive(false);
        CommunityResponse response = toResponse(communityRepository.save(community));
        auditLogService.record(SecurityUtils.getCurrentUserId(), "SUSPEND_COMMUNITY", "Community", id,
                "Suspended community '" + community.getName() + "'");
        return response;
    }

    @Transactional
    public CommunityResponse activate(Long id) {
        Community community = findOrThrow(id);
        community.setActive(true);
        CommunityResponse response = toResponse(communityRepository.save(community));
        auditLogService.record(SecurityUtils.getCurrentUserId(), "ACTIVATE_COMMUNITY", "Community", id,
                "Activated community '" + community.getName() + "'");
        return response;
    }

    private Community findOrThrow(Long id) {
        return communityRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Community", id));
    }

    private CommunityResponse toResponse(Community community) {
        Optional<Apartment> firstApartment = community.getApartments().stream().findFirst();
        long households = firstApartment.map(a -> householdRepository.findByApartmentId(a.getId()).size()).orElse(0);
        long residents = firstApartment
                .map(a -> a.getAdmin() != null ? userRepository.countResidentsForAdmin(a.getAdmin().getId()) : 0L)
                .orElse(0L);

        return CommunityResponse.builder()
                .id(community.getId())
                .name(community.getName())
                .city(community.getCity())
                .state(community.getState())
                .active(community.isActive())
                .apartmentName(firstApartment.map(Apartment::getName).orElse(null))
                .adminName(firstApartment.map(a -> a.getAdmin() != null ? a.getAdmin().getFullName() : null).orElse(null))
                .adminEmail(firstApartment.map(a -> a.getAdmin() != null ? a.getAdmin().getEmail() : null).orElse(null))
                .totalHouseholds(households)
                .totalResidents(residents)
                .createdAt(community.getCreatedAt())
                .build();
    }
}
