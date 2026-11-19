package com.smartwater.billing.service;

import com.smartwater.billing.entity.Apartment;
import com.smartwater.billing.entity.Community;
import com.smartwater.billing.entity.ResidentAssignment;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.repository.ApartmentRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Enforces community-level suspension: once a Super Admin suspends a
 * community, its administrator and residents can no longer sign in.
 */
@Service
@RequiredArgsConstructor
public class TenantAccessService {

    private final ApartmentRepository apartmentRepository;
    private final ResidentAssignmentRepository residentAssignmentRepository;

    @Transactional(readOnly = true)
    public boolean isCommunitySuspended(Long userId, Role role) {
        if (role == Role.SUPER_ADMIN) {
            return false;
        }
        if (role == Role.ADMIN) {
            return apartmentRepository.findByAdminId(userId).stream()
                    .map(Apartment::getCommunity)
                    .anyMatch(this::isSuspended);
        }
        List<ResidentAssignment> assignments = residentAssignmentRepository.findByUserId(userId);
        return assignments.stream()
                .filter(ResidentAssignment::isActive)
                .map(ra -> ra.getHousehold().getApartment().getCommunity())
                .anyMatch(this::isSuspended);
    }

    private boolean isSuspended(Community community) {
        return community != null && !community.isActive();
    }
}
