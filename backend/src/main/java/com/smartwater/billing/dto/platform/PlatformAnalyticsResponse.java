package com.smartwater.billing.dto.platform;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformAnalyticsResponse {
    private long totalCommunities;
    private long totalApartments;
    private long totalHouseholds;
    private long totalAdministrators;
    private long totalResidents;
    private BigDecimal totalRevenueCollected;
    private BigDecimal totalOutstanding;
    private double totalWaterConsumptionKl;
}
