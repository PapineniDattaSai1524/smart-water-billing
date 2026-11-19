package com.smartwater.billing.dto.registration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationRequestResponse {
    private Long id;
    private String communityName;
    private String apartmentName;
    private String addressLine;
    private String city;
    private String state;
    private String pincode;
    private String adminFullName;
    private String adminEmail;
    private String adminPhoneNumber;
    private String status;
    private String rejectionReason;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String reviewedByName;

    // Populated only once APPROVED, so the Super Admin can share credentials.
    private Long createdCommunityId;
    private Long createdApartmentId;
    private Long createdAdminUserId;
    private String createdAdminUsername;
}
