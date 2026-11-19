package com.smartwater.billing.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private Long invoiceId;
    private String unitNumber;
    private String apartmentName;
    private String billingMonth;
    private BigDecimal amount;
    private String method;
    private String transactionRef;
    private String paidByName;
    private String collectedByName;
    private LocalDateTime paidAt;
}
