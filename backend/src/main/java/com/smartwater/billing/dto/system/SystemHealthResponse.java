package com.smartwater.billing.dto.system;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthResponse {
    private String status;
    private boolean databaseUp;
    private String appVersion;
    private long uptimeSeconds;
    private long totalUsers;
    private long totalCommunities;
    private long totalApartments;
    private long totalHouseholds;
}
