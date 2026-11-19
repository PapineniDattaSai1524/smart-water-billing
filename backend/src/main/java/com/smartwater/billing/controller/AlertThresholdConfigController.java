package com.smartwater.billing.controller;

import com.smartwater.billing.dto.alert.AlertThresholdConfigRequest;
import com.smartwater.billing.dto.alert.AlertThresholdConfigResponse;
import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.service.AlertThresholdConfigService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/apartments/{apartmentId}/alert-config")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Alert Configuration", description = "Per-apartment overrides for the Alert & Notification Engine's thresholds")
public class AlertThresholdConfigController {

    private final AlertThresholdConfigService alertThresholdConfigService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get the alert threshold configuration for an apartment I manage")
    public ResponseEntity<ApiResponse<AlertThresholdConfigResponse>> get(@PathVariable Long apartmentId) {
        Long adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                alertThresholdConfigService.getForApartment(apartmentId, adminId)));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create or update the alert threshold override for an apartment I manage")
    public ResponseEntity<ApiResponse<AlertThresholdConfigResponse>> update(
            @PathVariable Long apartmentId, @Valid @RequestBody AlertThresholdConfigRequest request) {
        Long adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Alert configuration updated",
                alertThresholdConfigService.upsert(apartmentId, request, adminId)));
    }
}
