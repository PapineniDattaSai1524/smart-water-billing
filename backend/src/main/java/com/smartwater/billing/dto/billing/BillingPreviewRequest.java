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
public class BillingPreviewRequest {

    @NotNull(message = "Tariff plan is required")
    private Long tariffPlanId;

    @NotNull(message = "Consumption in KL is required")
    @DecimalMin(value = "0.0", message = "Consumption cannot be negative")
    private BigDecimal consumptionKl;

    /**
     * Optional shared/common-area charge to add on top of the tariff
     * calculation (e.g. this household's share of a tanker top-up).
     * Defaults to zero when omitted.
     */
    @DecimalMin(value = "0.0", message = "Shared charge cannot be negative")
    private BigDecimal sharedCharge;
}
