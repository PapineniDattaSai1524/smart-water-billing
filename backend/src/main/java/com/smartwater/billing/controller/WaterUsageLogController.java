package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.usage.CsvUploadResultResponse;
import com.smartwater.billing.dto.usage.WaterUsageLogRequest;
import com.smartwater.billing.dto.usage.WaterUsageLogResponse;
import com.smartwater.billing.service.WaterUsageLogService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/usage")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Water Usage Logging", description = "Manual meter reading entry and bulk CSV upload")
public class WaterUsageLogController {

    private final WaterUsageLogService waterUsageLogService;

    @PostMapping
    @Operation(summary = "Log a manual daily meter reading for a household")
    public ResponseEntity<ApiResponse<WaterUsageLogResponse>> logReading(
            @Valid @RequestBody WaterUsageLogRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Water usage logged successfully",
                        waterUsageLogService.logManualReading(request, userId)));
    }

    @PostMapping(value = "/upload-csv", consumes = "multipart/form-data")
    @Operation(summary = "Bulk upload household water usage readings via CSV file",
            description = "CSV header must be: household_id,reading_date,meter_reading_kl,remarks " +
                    "(reading_date format yyyy-MM-dd). Duplicate rows and invalid rows are reported, not fatal.")
    public ResponseEntity<ApiResponse<CsvUploadResultResponse>> uploadCsv(
            @RequestParam("file") MultipartFile file) {
        Long userId = SecurityUtils.getCurrentUserId();
        CsvUploadResultResponse result = waterUsageLogService.uploadCsv(file, userId);
        return ResponseEntity.ok(ApiResponse.success(
                "CSV processed: " + result.getSuccessCount() + " succeeded, "
                        + result.getDuplicateCount() + " duplicates, " + result.getErrorCount() + " errors",
                result));
    }

    @GetMapping("/admin/recent")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Most recent water usage readings across every household the current admin owns",
            description = "Building Owner Water Usage dashboard: building-wide activity feed, most recent "
                    + "reading date first, capped by `limit` (default 50).")
    public ResponseEntity<ApiResponse<List<WaterUsageLogResponse>>> getRecentForAdmin(
            @RequestParam(defaultValue = "50") int limit) {
        Long adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(waterUsageLogService.getRecentForAdmin(adminId, limit)));
    }

    @GetMapping("/household/{householdId}")
    @Operation(summary = "Get all usage log entries for a household, most recent first")
    public ResponseEntity<ApiResponse<List<WaterUsageLogResponse>>> getByHousehold(@PathVariable Long householdId) {
        return ResponseEntity.ok(ApiResponse.success(waterUsageLogService.getByHousehold(householdId)));
    }

    @GetMapping("/household/{householdId}/range")
    @Operation(summary = "Get usage log entries for a household within a date range")
    public ResponseEntity<ApiResponse<List<WaterUsageLogResponse>>> getByHouseholdAndRange(
            @PathVariable Long householdId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.success(
                waterUsageLogService.getByHouseholdAndDateRange(householdId, from, to)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a water usage log entry")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        waterUsageLogService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Water usage log deleted successfully", null));
    }
}
