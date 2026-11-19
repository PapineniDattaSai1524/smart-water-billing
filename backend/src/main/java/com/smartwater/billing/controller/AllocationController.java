package com.smartwater.billing.controller;

import com.smartwater.billing.dto.allocation.DistributionReportResponse;
import com.smartwater.billing.dto.allocation.DistributionRunRequest;
import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.service.AllocationService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/distribution")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Consumption Distribution", description = "Distributes bulk water purchase cost across households")
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping("/run")
    @Operation(summary = "Run the distribution engine for an apartment/billing month",
            description = "Splits every not-yet-distributed water purchase cost for the month across "
                    + "households by metered consumption share, falling back to area-based estimation "
                    + "or a pure area split when meter data is unavailable. Marks the purchases used as "
                    + "distributed so they aren't double-counted.")
    public ResponseEntity<ApiResponse<DistributionReportResponse>> run(
            @Valid @RequestBody DistributionRunRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Distribution complete",
                allocationService.runDistribution(request, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/apartments/{apartmentId}/report")
    @Operation(summary = "Get the distribution report for an apartment/billing month")
    public ResponseEntity<ApiResponse<DistributionReportResponse>> getReport(
            @PathVariable Long apartmentId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth billingMonth) {
        return ResponseEntity.ok(ApiResponse.success(
                allocationService.getReport(apartmentId, billingMonth, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/reports")
    @Operation(summary = "List all distribution runs across your apartments, most recent first")
    public ResponseEntity<ApiResponse<List<DistributionReportResponse>>> listReports() {
        return ResponseEntity.ok(ApiResponse.success(
                allocationService.listReports(SecurityUtils.getCurrentUserId())));
    }
}
