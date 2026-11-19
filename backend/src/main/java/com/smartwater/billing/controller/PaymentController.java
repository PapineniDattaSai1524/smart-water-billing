package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.payment.PaymentRequest;
import com.smartwater.billing.dto.payment.PaymentResponse;
import com.smartwater.billing.service.PaymentService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Payments", description = "Resident bill payments and Apartment Administrator payment collection")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/api/v1/residents/me/invoices/{id}/pay")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "Pay one of my invoices online (UPI/Card/Netbanking)")
    public ResponseEntity<ApiResponse<PaymentResponse>> payInvoice(
            @PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Payment successful",
                paymentService.payAsResident(id, SecurityUtils.getCurrentUserId(), request)));
    }

    @GetMapping("/api/v1/residents/me/payments")
    @PreAuthorize("hasRole('RESIDENT')")
    @Operation(summary = "My payment history")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> myPayments() {
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.getHistoryForResident(SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/api/v1/admin/invoices/{id}/collect")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Manually record a collected payment (e.g. cash) for one of my invoices")
    public ResponseEntity<ApiResponse<PaymentResponse>> collectPayment(
            @PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Payment collected",
                paymentService.collectAsAdmin(id, SecurityUtils.getCurrentUserId(), request)));
    }

    @GetMapping("/api/v1/admin/payments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Payment collection history across my apartments")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> adminPayments() {
        return ResponseEntity.ok(ApiResponse.success(
                paymentService.getHistoryForAdmin(SecurityUtils.getCurrentUserId())));
    }
}
