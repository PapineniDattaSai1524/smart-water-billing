package com.smartwater.billing.dto.billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private Long id;
    private Long householdId;
    private String unitNumber;
    private String apartmentName;
    private String residentName;
    private String billingMonth;
    private BigDecimal consumptionKl;
    private BigDecimal ratePerKl;
    private BigDecimal fixedCharge;
    private BigDecimal baseCharge;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BillingBreakdownResponse breakdown;
    private String status;
    private LocalDate dueDate;
    private LocalDateTime paidAt;
    private LocalDateTime generatedAt;
}
