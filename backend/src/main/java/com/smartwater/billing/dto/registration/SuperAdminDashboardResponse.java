package com.smartwater.billing.dto.registration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminDashboardResponse {
    private long pendingRequests;
    private long approvedCommunities;
    private long rejectedRequests;
    private long totalCommunities;
    private long totalAdministrators;
    private long totalResidents;
    private long totalWaterUsageRecords;
}
