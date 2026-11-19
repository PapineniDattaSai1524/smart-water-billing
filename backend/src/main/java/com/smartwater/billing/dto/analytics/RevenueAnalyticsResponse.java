package com.smartwater.billing.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueAnalyticsResponse {
    private BigDecimal totalCollected;
    private BigDecimal totalOutstanding;
    private List<MonthlyValue> monthlyRevenue;
}
