package com.smartwater.billing.dto.payment;

import com.smartwater.billing.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentRequest {

    @NotNull(message = "Payment method is required")
    private PaymentMethod method;

    private String transactionRef;
}
