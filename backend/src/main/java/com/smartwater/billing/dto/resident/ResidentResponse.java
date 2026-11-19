package com.smartwater.billing.dto.resident;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidentResponse {
    private Long id;
    private String residentCode;
    private String profilePhotoUrl;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String gender;
    private LocalDate dateOfBirth;
    private String emergencyContact;
    private String occupation;
    private Integer familyMembers;
    private Long apartmentId;
    private String apartmentName;
    private Long householdId;
    private String unitNumber;
    private boolean enabled;
    private LocalDateTime createdAt;
}
