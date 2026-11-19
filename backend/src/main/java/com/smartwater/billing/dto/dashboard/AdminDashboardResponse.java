package com.smartwater.billing.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private long totalApartments;
    private long totalHouseholds;
    private long totalResidents;
    private long activeMeters;
    private double currentMonthConsumptionKl;
    private double previousMonthConsumptionKl;
    private long unreadNotifications;
}
