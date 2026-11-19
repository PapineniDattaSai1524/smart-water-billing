package com.smartwater.billing.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TariffTierResponse {
    private Long id;
    private Integer tierOrder;
    private BigDecimal minKl;
    private BigDecimal maxKl;
    private BigDecimal ratePerKl;
}
