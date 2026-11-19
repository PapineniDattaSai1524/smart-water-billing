package com.smartwater.billing.dto.billing;

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
public class TariffPlanResponse {
    private Long id;
    private Long apartmentId;
    private String apartmentName;
    private String name;
    private BigDecimal ratePerKl;
    private BigDecimal fixedCharge;
    private BigDecimal taxPercentage;
    private BigDecimal minimumCharge;
    private BigDecimal maximumCharge;
    private boolean tiered;
    private List<TariffTierResponse> tiers;
    private boolean active;
}
