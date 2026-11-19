package com.smartwater.billing.dto.billing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TariffPlanRequest {

    @NotNull(message = "Apartment is required")
    private Long apartmentId;

    @NotBlank(message = "Plan name is required")
    private String name;

    /**
     * Flat rate per KL. Required for backward compatibility even on tiered
     * plans, but only used to price consumption when {@link #tiers} is empty.
     */
    @NotNull(message = "Rate per KL is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rate must be greater than zero")
    private BigDecimal ratePerKl;

    @NotNull(message = "Fixed charge is required (use 0 if none)")
    @DecimalMin(value = "0.0", message = "Fixed charge cannot be negative")
    private BigDecimal fixedCharge;

    @NotNull(message = "Tax percentage is required (use 0 if none)")
    @DecimalMin(value = "0.0", message = "Tax percentage cannot be negative")
    @DecimalMax(value = "100.0", message = "Tax percentage cannot exceed 100")
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    /** Optional floor for the final bill. */
    @DecimalMin(value = "0.0", message = "Minimum charge cannot be negative")
    private BigDecimal minimumCharge;

    /** Optional cap for the final bill. */
    @DecimalMin(value = "0.0", message = "Maximum charge cannot be negative")
    private BigDecimal maximumCharge;

    /**
     * Optional tiered bands, e.g. 0-10 KL / 11-20 KL / 20+ KL. Must be
     * supplied in ascending, contiguous, non-overlapping order and the last
     * tier's maxKl must be null (unbounded). Leave empty to use a flat rate.
     */
    @Valid
    private List<TariffTierRequest> tiers = new ArrayList<>();
}
