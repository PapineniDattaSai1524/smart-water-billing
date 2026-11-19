package com.smartwater.billing.dto.billing;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GenerateInvoicesRequest {

    @NotNull(message = "Apartment is required")
    private Long apartmentId;

    @NotNull(message = "Billing month is required")
    @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "Billing month must be in YYYY-MM format")
    private String billingMonth;
}
