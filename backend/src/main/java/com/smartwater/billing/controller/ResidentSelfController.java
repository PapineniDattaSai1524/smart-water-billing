package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.dashboard.ConsumptionComparisonResponse;
import com.smartwater.billing.dto.dashboard.ResidentDashboardResponse;
import com.smartwater.billing.dto.dashboard.UsageTrendPointResponse;
import com.smartwater.billing.dto.household.HouseholdResponse;
import com.smartwater.billing.dto.usage.WaterUsageLogResponse;
import com.smartwater.billing.service.ResidentSelfService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/residents/me")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Resident Self-Service", description = "The logged-in resident's own apartment, household, and usage data")
public class ResidentSelfController {

    private final ResidentSelfService residentSelfService;
    private final com.smartwater.billing.service.BillingService billingService;

    @GetMapping("/dashboard")
    @Operation(summary = "My dashboard: apartment, house number, current/previous/average usage, latest reading")
    public ResponseEntity<ApiResponse<ResidentDashboardResponse>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(
                residentSelfService.getDashboard(SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/household")
    @Operation(summary = "My household and apartment details")
    public ResponseEntity<ApiResponse<HouseholdResponse>> household() {
        return ResponseEntity.ok(ApiResponse.success(
                residentSelfService.getMyHouseholdResponse(SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/usage-history")
    @Operation(summary = "My full water usage reading history, most recent first")
    public ResponseEntity<ApiResponse<List<WaterUsageLogResponse>>> usageHistory() {
        return ResponseEntity.ok(ApiResponse.success(
                residentSelfService.getMyUsageHistoryResponse(SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/invoices")
    @Operation(summary = "My billing history")
    public ResponseEntity<ApiResponse<List<com.smartwater.billing.dto.billing.InvoiceResponse>>> myInvoices() {
        Long householdId = residentSelfService.getMyHousehold(SecurityUtils.getCurrentUserId()).getId();
        return ResponseEntity.ok(ApiResponse.success(billingService.getInvoicesForHousehold(householdId)));
    }

    @GetMapping("/usage-trend/daily")
    @Operation(summary = "Week 5-6: my daily consumption trend for the resident dashboard line chart",
            description = "One point per calendar day, oldest first, days with no reading reported as 0 kL. Default 30 days.")
    public ResponseEntity<ApiResponse<List<UsageTrendPointResponse>>> dailyTrend(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.success(
                residentSelfService.getDailyTrend(SecurityUtils.getCurrentUserId(), days)));
    }

    @GetMapping("/usage-trend/monthly")
    @Operation(summary = "Week 5-6: my monthly consumption trend for the resident dashboard line chart",
            description = "One point per calendar month, oldest first, months with no reading reported as 0 kL. Default 6 months.")
    public ResponseEntity<ApiResponse<List<UsageTrendPointResponse>>> monthlyTrend(
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(ApiResponse.success(
                residentSelfService.getMonthlyTrend(SecurityUtils.getCurrentUserId(), months)));
    }

    @GetMapping("/consumption-comparison")
    @Operation(summary = "Week 5-6 Feature 4: my usage vs. apartment average vs. similar-sized households",
            description = "Current calendar month, computed live from water_usage_logs and household.areaSqft. No hardcoded values.")
    public ResponseEntity<ApiResponse<ConsumptionComparisonResponse>> consumptionComparison() {
        return ResponseEntity.ok(ApiResponse.success(
                residentSelfService.getConsumptionComparison(SecurityUtils.getCurrentUserId())));
    }
}
