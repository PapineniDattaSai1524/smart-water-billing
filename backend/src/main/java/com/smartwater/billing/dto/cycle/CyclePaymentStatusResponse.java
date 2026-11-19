package com.smartwater.billing.dto.cycle;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CyclePaymentStatusResponse {
    private Long cycleId;
    private String billingMonth;
    private int totalInvoices;
    private int paidCount;
    private int unpaidCount;
    private int overdueCount;
    private int cancelledCount;
    private BigDecimal totalBilled;
    private BigDecimal totalCollected;
    private BigDecimal totalOutstanding;
    /** paidCount / totalInvoices * 100, or 0 if there are no invoices yet. */
    private BigDecimal collectionRatePercent;
}
