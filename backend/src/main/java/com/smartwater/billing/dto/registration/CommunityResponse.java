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
public class CommunityResponse {
    private Long id;
    private String name;
    private String city;
    private String state;
    private boolean active;
    private String apartmentName;
    private String adminName;
    private String adminEmail;
    private long totalHouseholds;
    private long totalResidents;
    private LocalDateTime createdAt;
}
