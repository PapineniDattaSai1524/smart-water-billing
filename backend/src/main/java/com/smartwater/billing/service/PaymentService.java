package com.smartwater.billing.service;

import com.smartwater.billing.dto.payment.PaymentRequest;
import com.smartwater.billing.dto.payment.PaymentResponse;
import com.smartwater.billing.entity.*;
import com.smartwater.billing.exception.InvalidRequestException;
import com.smartwater.billing.exception.ResourceNotFoundException;
import com.smartwater.billing.exception.UnauthorizedActionException;
import com.smartwater.billing.mapper.PaymentMapper;
import com.smartwater.billing.repository.InvoiceRepository;
import com.smartwater.billing.repository.PaymentRepository;
import com.smartwater.billing.repository.ResidentAssignmentRepository;
import com.smartwater.billing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final ResidentAssignmentRepository residentAssignmentRepository;
    private final UserRepository userRepository;
    private final PaymentMapper paymentMapper;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional
    public PaymentResponse payAsResident(Long invoiceId, Long residentUserId, PaymentRequest request) {
        Invoice invoice = findInvoiceOrThrow(invoiceId);

        boolean belongsToResident = residentAssignmentRepository
                .findByHouseholdIdAndActiveTrue(invoice.getHousehold().getId())
                .stream()
                .anyMatch(ra -> ra.getUser().getId().equals(residentUserId));
        if (!belongsToResident) {
            throw new UnauthorizedActionException("This invoice does not belong to your household");
        }
        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new InvalidRequestException("This invoice has already been paid");
        }

        User resident = userRepository.findById(residentUserId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", residentUserId));

        Payment payment = recordPayment(invoice, request, resident, null);

        User admin = invoice.getHousehold().getApartment().getAdmin();
        if (admin != null) {
            notificationService.notify(admin.getId(), NotificationType.PAYMENT_RECORDED,
                    "Payment received",
                    resident.getFullName() + " paid the " + invoice.getBillingMonth()
                            + " bill for unit " + invoice.getHousehold().getUnitNumber());
        }

        return paymentMapper.toResponse(payment);
    }

    @Transactional
    public PaymentResponse collectAsAdmin(Long invoiceId, Long adminId, PaymentRequest request) {
        Invoice invoice = findInvoiceOrThrow(invoiceId);
        assertOwnedByAdmin(invoice, adminId);

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new InvalidRequestException("This invoice has already been paid");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> ResourceNotFoundException.of("User", adminId));

        Payment payment = recordPayment(invoice, request, null, admin);

        residentAssignmentRepository.findByHouseholdIdAndActiveTrue(invoice.getHousehold().getId())
                .forEach(ra -> notificationService.notify(ra.getUser().getId(), NotificationType.PAYMENT_RECORDED,
                        "Payment recorded",
                        "Your " + invoice.getBillingMonth() + " bill was marked as paid by your administrator"));

        auditLogService.record(adminId, "COLLECT_PAYMENT", "Invoice", invoice.getId(),
                "Collected " + request.getMethod() + " payment of " + invoice.getTotalAmount());

        return paymentMapper.toResponse(payment);
    }

    private Payment recordPayment(Invoice invoice, PaymentRequest request, User paidBy, User collectedBy) {
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(invoice.getTotalAmount())
                .method(request.getMethod())
                .transactionRef(request.getTransactionRef())
                .paidBy(paidBy)
                .collectedBy(collectedBy)
                .build();
        return paymentRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getHistoryForResident(Long residentUserId) {
        return paymentRepository.findByPaidByIdOrderByPaidAtDesc(residentUserId).stream()
                .map(paymentMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getHistoryForAdmin(Long adminId) {
        return paymentRepository.findForAdmin(adminId).stream()
                .map(paymentMapper::toResponse).toList();
    }

    private Invoice findInvoiceOrThrow(Long invoiceId) {
        return invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> ResourceNotFoundException.of("Invoice", invoiceId));
    }

    private void assertOwnedByAdmin(Invoice invoice, Long adminId) {
        User admin = invoice.getHousehold().getApartment().getAdmin();
        if (admin == null || !admin.getId().equals(adminId)) {
            throw new UnauthorizedActionException("You do not manage this apartment");
        }
    }
}
