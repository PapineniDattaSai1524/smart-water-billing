package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.cycle.*;
import com.smartwater.billing.entity.CycleStatus;
import com.smartwater.billing.service.BillingCycleService;
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

@RestController
@RequestMapping("/api/v1/admin/billing-cycles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Billing Cycle Management", description = "Open/close/finalize/archive/reopen the monthly billing lifecycle")
public class BillingCycleController {

    private final BillingCycleService billingCycleService;

    @PostMapping("/open")
    @Operation(summary = "Open a new billing cycle for an apartment/month")
    public ResponseEntity<ApiResponse<BillingCycleResponse>> open(@Valid @RequestBody OpenCycleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Cycle opened",
                billingCycleService.openCycle(request, SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Close a cycle", description = "Locks the cycle for review. Requires invoices to already exist for the month.")
    public ResponseEntity<ApiResponse<BillingCycleResponse>> close(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Cycle closed",
                billingCycleService.closeCycle(id, SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/{id}/finalize")
    @Operation(summary = "Finalize a cycle's bills", description = "Makes every bill in the cycle immutable and ready to send.")
    public ResponseEntity<ApiResponse<BillingCycleResponse>> finalizeCycle(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Bills finalized",
                billingCycleService.finalizeCycle(id, SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Archive a finalized cycle", description = "Terminal state — the cycle becomes read-only history.")
    public ResponseEntity<ApiResponse<BillingCycleResponse>> archive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Cycle archived",
                billingCycleService.archiveCycle(id, SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/{id}/reopen")
    @Operation(summary = "Reopen a closed or finalized cycle back to OPEN")
    public ResponseEntity<ApiResponse<BillingCycleResponse>> reopen(
            @PathVariable Long id, @RequestBody(required = false) ReopenCycleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cycle reopened",
                billingCycleService.reopenCycle(id, request, SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/{id}/recalculate")
    @Operation(summary = "Recalculate unpaid bills in an open cycle",
            description = "Deletes and regenerates every not-yet-paid invoice for the cycle's billing month. "
                    + "Paid invoices are left untouched.")
    public ResponseEntity<ApiResponse<BillingCycleResponse>> recalculate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Bills recalculated",
                billingCycleService.recalculateBills(id, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single billing cycle")
    public ResponseEntity<ApiResponse<BillingCycleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                billingCycleService.getCycle(id, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/{id}/payment-status")
    @Operation(summary = "Payment status summary for a cycle", description = "Paid/unpaid/overdue counts and totals.")
    public ResponseEntity<ApiResponse<CyclePaymentStatusResponse>> paymentStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                billingCycleService.getPaymentStatus(id, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping
    @Operation(summary = "List your billing cycles, optionally filtered by apartment/status")
    public ResponseEntity<ApiResponse<PageResponse<BillingCycleResponse>>> search(
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) CycleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(billingCycleService.search(
                SecurityUtils.getCurrentUserId(), apartmentId, status, PageRequest.of(page, size))));
    }
}
