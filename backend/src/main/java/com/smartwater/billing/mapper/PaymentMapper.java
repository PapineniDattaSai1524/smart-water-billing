package com.smartwater.billing.mapper;

import com.smartwater.billing.dto.payment.PaymentResponse;
import com.smartwater.billing.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoice().getId())
                .unitNumber(payment.getInvoice().getHousehold().getUnitNumber())
                .apartmentName(payment.getInvoice().getHousehold().getApartment().getName())
                .billingMonth(payment.getInvoice().getBillingMonth())
                .amount(payment.getAmount())
                .method(payment.getMethod().name())
                .transactionRef(payment.getTransactionRef())
                .paidByName(payment.getPaidBy() != null ? payment.getPaidBy().getFullName() : null)
                .collectedByName(payment.getCollectedBy() != null ? payment.getCollectedBy().getFullName() : null)
                .paidAt(payment.getPaidAt())
                .build();
    }
}
