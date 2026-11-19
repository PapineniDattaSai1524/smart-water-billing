package com.smartwater.billing.controller;

import com.smartwater.billing.dto.analytics.RevenueAnalyticsResponse;
import com.smartwater.billing.dto.analytics.WaterAnalyticsResponse;
import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.service.AnalyticsService;
import com.smartwater.billing.service.CsvExportService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Building Owner Analytics & Reports", description = "Revenue/water analytics and CSV report exports")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final CsvExportService csvExportService;

    @GetMapping("/analytics/revenue")
    @Operation(summary = "Monthly revenue trend + collected/outstanding totals across my apartments")
    public ResponseEntity<ApiResponse<RevenueAnalyticsResponse>> revenueAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(
                analyticsService.getRevenueAnalytics(SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/analytics/water")
    @Operation(summary = "Monthly water consumption trend + top-consuming households")
    public ResponseEntity<ApiResponse<WaterAnalyticsResponse>> waterAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(
                analyticsService.getWaterAnalytics(SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/reports/invoices.csv")
    @Operation(summary = "Export all invoices for my apartments as CSV")
    public ResponseEntity<byte[]> exportInvoices() {
        byte[] csv = csvExportService.exportInvoicesForAdmin(SecurityUtils.getCurrentUserId());
        return csvResponse(csv, "invoices-report.csv");
    }

    @GetMapping("/reports/usage.csv")
    @Operation(summary = "Export all water usage logs for my apartments as CSV")
    public ResponseEntity<byte[]> exportUsage() {
        byte[] csv = csvExportService.exportUsageForAdmin(SecurityUtils.getCurrentUserId());
        return csvResponse(csv, "water-usage-report.csv");
    }

    private ResponseEntity<byte[]> csvResponse(byte[] body, String filename) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(body);
    }
}
