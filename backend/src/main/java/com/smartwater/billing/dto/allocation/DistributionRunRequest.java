package com.smartwater.billing.dto.allocation;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.YearMonth;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DistributionRunRequest {

    @NotNull(message = "Apartment is required")
    private Long apartmentId;

    @NotNull(message = "Billing month is required")
    private YearMonth billingMonth;

    /**
     * If true, re-runs a distribution that already exists for this
     * apartment/month (replacing it) instead of rejecting the request.
     */
    private boolean overwrite;
}
