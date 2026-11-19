package com.smartwater.billing.dto.billing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TariffTierRequest {

    @NotNull(message = "Minimum KL for the tier is required")
    @DecimalMin(value = "0.0", message = "Minimum KL cannot be negative")
    private BigDecimal minKl;

    /** Null = unbounded (this is the top tier, e.g. "above 20 KL"). */
    private BigDecimal maxKl;

    @NotNull(message = "Rate per KL is required for the tier")
    @DecimalMin(value = "0.0", message = "Rate must be zero or greater")
    private BigDecimal ratePerKl;
}
