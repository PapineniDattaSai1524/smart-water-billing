package com.smartwater.billing.controller;

import com.smartwater.billing.dto.billing.*;
import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.entity.InvoiceStatus;
import com.smartwater.billing.service.BillingService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/billing")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Billing", description = "Tariff plans, invoice generation, and payment tracking")
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/tariff-plans")
    @Operation(summary = "Create/replace the active tariff plan for one of your apartments")
    public ResponseEntity<ApiResponse<TariffPlanResponse>> createTariffPlan(@Valid @RequestBody TariffPlanRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tariff plan created",
                billingService.createTariffPlan(request, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/tariff-plans")
    @Operation(summary = "List your tariff plans")
    public ResponseEntity<ApiResponse<List<TariffPlanResponse>>> listTariffPlans() {
        return ResponseEntity.ok(ApiResponse.success(billingService.listTariffPlans(SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/tariff-plans/preview")
    @Operation(summary = "Preview the itemized bill for a given consumption against a tariff plan",
            description = "Runs the tiered billing engine (tier-by-tier charges, tax, shared charge, "
                    + "and minimum/maximum clamping) without persisting anything. Use this to test a "
                    + "tariff configuration before it is applied to real invoices.")
    public ResponseEntity<ApiResponse<BillingBreakdownResponse>> previewBill(
            @Valid @RequestBody BillingPreviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                billingService.previewBill(request, SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/invoices/generate")
    @Operation(summary = "Generate monthly invoices for all households in an apartment from their usage logs")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> generateInvoices(
            @Valid @RequestBody GenerateInvoicesRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Invoices generated",
                billingService.generateInvoices(request, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/invoices")
    @Operation(summary = "List invoices for your households, filterable by status/billing month")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> listInvoices(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) String billingMonth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(billingService.listInvoices(
                SecurityUtils.getCurrentUserId(), status, billingMonth, PageRequest.of(page, size))));
    }

    @PutMapping("/invoices/{id}/mark-paid")
    @Operation(summary = "Mark an invoice as paid")
    public ResponseEntity<ApiResponse<InvoiceResponse>> markPaid(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Invoice marked as paid",
                billingService.markPaid(id, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/revenue-summary")
    @Operation(summary = "Total collected and outstanding revenue across your apartments")
    public ResponseEntity<ApiResponse<RevenueSummaryResponse>> revenueSummary() {
        return ResponseEntity.ok(ApiResponse.success(billingService.getRevenueSummary(SecurityUtils.getCurrentUserId())));
    }
}
