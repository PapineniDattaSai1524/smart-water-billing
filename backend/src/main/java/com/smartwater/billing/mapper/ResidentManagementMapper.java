package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.resident.AssignableResidentResponse;
import com.smartwater.billing.dto.resident.PendingResidentResponse;
import com.smartwater.billing.dto.resident.ResidentResponse;
import com.smartwater.billing.entity.Household;
import com.smartwater.billing.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ResidentManagementMapper {

    public AssignableResidentResponse toAssignableResponse(User user) {
        return AssignableResidentResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .username(user.getUsername())
                .build();
    }

    public PendingResidentResponse toPendingResponse(User user) {
        return PendingResidentResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .registeredAt(user.getCreatedAt())
                .status(user.getRegistrationStatus().name())
                .build();
    }

    public ResidentResponse toResponse(User user, Household household) {
        return ResidentResponse.builder()
                .id(user.getId())
                .residentCode(user.getResidentCode())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .dateOfBirth(user.getDateOfBirth())
                .emergencyContact(user.getEmergencyContact())
                .occupation(user.getOccupation())
                .familyMembers(user.getFamilyMembers())
                .apartmentId(household != null ? household.getApartment().getId() : null)
                .apartmentName(household != null ? household.getApartment().getName() : null)
                .householdId(household != null ? household.getId() : null)
                .unitNumber(household != null ? household.getUnitNumber() : null)
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
