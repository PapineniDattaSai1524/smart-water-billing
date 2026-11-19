package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.registration.RegistrationRequestResponse;
import com.smartwater.billing.entity.RegistrationRequest;
import org.springframework.stereotype.Component;

@Component
public class RegistrationRequestMapper {

    public RegistrationRequestResponse toResponse(RegistrationRequest request) {
        return RegistrationRequestResponse.builder()
                .id(request.getId())
                .communityName(request.getCommunityName())
                .apartmentName(request.getApartmentName())
                .addressLine(request.getAddressLine())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .adminFullName(request.getAdminFullName())
                .adminEmail(request.getAdminEmail())
                .adminPhoneNumber(request.getAdminPhoneNumber())
                .status(request.getStatus().name())
                .rejectionReason(request.getRejectionReason())
                .submittedAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .reviewedByName(request.getReviewedBy() != null ? request.getReviewedBy().getFullName() : null)
                .createdCommunityId(request.getCreatedCommunity() != null ? request.getCreatedCommunity().getId() : null)
                .createdApartmentId(request.getCreatedApartment() != null ? request.getCreatedApartment().getId() : null)
                .createdAdminUserId(request.getCreatedAdminUser() != null ? request.getCreatedAdminUser().getId() : null)
                .createdAdminUsername(request.getCreatedAdminUser() != null ? request.getCreatedAdminUser().getUsername() : null)
                .build();
    }
}
