package com.smartwater.billing.dto.registration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationDecisionRequest {

    @NotBlank(message = "A rejection reason is required")
    @Size(max = 500)
    private String reason;
}
