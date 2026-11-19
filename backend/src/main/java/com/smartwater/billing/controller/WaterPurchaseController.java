package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.purchase.PurchaseSummaryResponse;
import com.smartwater.billing.dto.purchase.WaterPurchaseRequest;
import com.smartwater.billing.dto.purchase.WaterPurchaseResponse;
import com.smartwater.billing.entity.WaterSourceType;
import com.smartwater.billing.service.WaterPurchaseService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/admin/water-purchases")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Bulk Water Purchases", description = "Tanker and municipal water purchase tracking")
public class WaterPurchaseController {

    private final WaterPurchaseService waterPurchaseService;

    @PostMapping
    @Operation(summary = "Record a new bulk water purchase (tanker or municipal)")
    public ResponseEntity<ApiResponse<WaterPurchaseResponse>> create(
            @Valid @RequestBody WaterPurchaseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Purchase recorded",
                waterPurchaseService.create(request, SecurityUtils.getCurrentUserId())));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a purchase record (only before its cost has been distributed)")
    public ResponseEntity<ApiResponse<WaterPurchaseResponse>> update(
            @PathVariable Long id, @Valid @RequestBody WaterPurchaseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Purchase updated",
                waterPurchaseService.update(id, request, SecurityUtils.getCurrentUserId())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a purchase record (only before its cost has been distributed)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        waterPurchaseService.delete(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Purchase deleted", null));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single purchase record")
    public ResponseEntity<ApiResponse<WaterPurchaseResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                waterPurchaseService.getById(id, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping
    @Operation(summary = "Search purchase history",
            description = "Filter by apartment, source type, date range, and free-text search over "
                    + "vendor name / invoice reference. All filters are optional.")
    public ResponseEntity<ApiResponse<PageResponse<WaterPurchaseResponse>>> search(
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) WaterSourceType sourceType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @Parameter(description = "Matches vendor name or invoice reference") @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageRequest pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(waterPurchaseService.search(
                SecurityUtils.getCurrentUserId(), apartmentId, sourceType, fromDate, toDate, search, pageable)));
    }

    @GetMapping("/summary")
    @Operation(summary = "Aggregate purchase stats across all of your apartments",
            description = "Total quantity purchased, total cost, and blended average cost per KL. "
                    + "Powers the Water Purchase Dashboard.")
    public ResponseEntity<ApiResponse<PurchaseSummaryResponse>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(
                waterPurchaseService.getSummary(SecurityUtils.getCurrentUserId())));
    }
}
