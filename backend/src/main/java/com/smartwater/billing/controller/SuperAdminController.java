package com.smartwater.billing.controller;

import com.smartwater.billing.dto.analytics.RevenueAnalyticsResponse;
import com.smartwater.billing.dto.analytics.WaterAnalyticsResponse;
import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.platform.PlatformAnalyticsResponse;
import com.smartwater.billing.dto.registration.SuperAdminDashboardResponse;
import com.smartwater.billing.dto.system.SystemHealthResponse;
import com.smartwater.billing.dto.useradmin.ChangeRoleRequest;
import com.smartwater.billing.dto.useradmin.PlatformUserResponse;
import com.smartwater.billing.entity.Role;
import com.smartwater.billing.service.CsvExportService;
import com.smartwater.billing.service.PlatformAnalyticsService;
import com.smartwater.billing.service.PlatformUserService;
import com.smartwater.billing.service.SuperAdminDashboardService;
import com.smartwater.billing.service.SystemHealthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/super-admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Super Admin", description = "Platform-wide oversight for the Super Admin role")
public class SuperAdminController {

    private final SuperAdminDashboardService dashboardService;
    private final PlatformAnalyticsService platformAnalyticsService;
    private final SystemHealthService systemHealthService;
    private final PlatformUserService platformUserService;
    private final CsvExportService csvExportService;

    @GetMapping("/dashboard")
    @Operation(summary = "Platform-wide dashboard stats (communities, administrators, residents, usage records)")
    public ResponseEntity<ApiResponse<SuperAdminDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStats()));
    }

    @GetMapping("/analytics/platform")
    @Operation(summary = "Platform-wide KPIs: communities, apartments, households, revenue, water usage")
    public ResponseEntity<ApiResponse<PlatformAnalyticsResponse>> platformAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(platformAnalyticsService.getPlatformAnalytics()));
    }

    @GetMapping("/analytics/revenue")
    @Operation(summary = "Platform-wide monthly revenue trend")
    public ResponseEntity<ApiResponse<RevenueAnalyticsResponse>> revenueAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(platformAnalyticsService.getRevenueAnalytics()));
    }

    @GetMapping("/analytics/water")
    @Operation(summary = "Platform-wide monthly water consumption trend")
    public ResponseEntity<ApiResponse<WaterAnalyticsResponse>> waterAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(platformAnalyticsService.getWaterAnalytics()));
    }

    @GetMapping("/system-health")
    @Operation(summary = "System health: database connectivity, uptime, core record counts")
    public ResponseEntity<ApiResponse<SystemHealthResponse>> systemHealth() {
        return ResponseEntity.ok(ApiResponse.success(systemHealthService.getHealth()));
    }

    @GetMapping("/users")
    @Operation(summary = "List all platform users, optionally filtered by role (User/Building Owner/Role management)")
    public ResponseEntity<ApiResponse<List<PlatformUserResponse>>> listUsers(
            @RequestParam(required = false) Role role) {
        return ResponseEntity.ok(ApiResponse.success(platformUserService.listUsers(role)));
    }

    @PutMapping("/users/{id}/enable")
    @Operation(summary = "Enable a user account")
    public ResponseEntity<ApiResponse<PlatformUserResponse>> enableUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User enabled", platformUserService.setEnabled(id, true)));
    }

    @PutMapping("/users/{id}/disable")
    @Operation(summary = "Disable a user account")
    public ResponseEntity<ApiResponse<PlatformUserResponse>> disableUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("User disabled", platformUserService.setEnabled(id, false)));
    }

    @PutMapping("/users/{id}/role")
    @Operation(summary = "Change a user's role")
    public ResponseEntity<ApiResponse<PlatformUserResponse>> changeRole(
            @PathVariable Long id, @Valid @RequestBody ChangeRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Role updated",
                platformUserService.changeRole(id, request.getRole())));
    }

    @GetMapping("/reports/apartments.csv")
    @Operation(summary = "Export a platform-wide apartments/communities overview as CSV")
    public ResponseEntity<byte[]> exportApartments() {
        byte[] csv = csvExportService.exportApartmentsPlatformWide();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("platform-apartments-report.csv").build().toString())
                .body(csv);
    }
}
