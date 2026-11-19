package com.smartwater.billing.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopConsumerResponse {
    private String unitNumber;
    private double consumptionKl;
}
