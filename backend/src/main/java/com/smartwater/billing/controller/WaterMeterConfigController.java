package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.meter.WaterMeterConfigRequest;
import com.smartwater.billing.dto.meter.WaterMeterConfigResponse;
import com.smartwater.billing.service.WaterMeterConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meter-configs")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Water Meter Configuration", description = "Configuring water meters for households")
public class WaterMeterConfigController {

    private final WaterMeterConfigService waterMeterConfigService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Configure a water meter for a household")
    public ResponseEntity<ApiResponse<WaterMeterConfigResponse>> configure(
            @Valid @RequestBody WaterMeterConfigRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Water meter configured successfully",
                        waterMeterConfigService.configure(request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all configured water meters (staff-only)")
    public ResponseEntity<ApiResponse<List<WaterMeterConfigResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(waterMeterConfigService.getAll()));
    }

    @GetMapping("/household/{householdId}")
    @Operation(summary = "Get the water meter configuration for a household",
            description = "Ownership-checked (security fix, previously unchecked): RESIDENT only their own "
                    + "household, ADMIN only households in an apartment they administer, SUPER_ADMIN any.")
    public ResponseEntity<ApiResponse<WaterMeterConfigResponse>> getByHousehold(@PathVariable Long householdId) {
        return ResponseEntity.ok(ApiResponse.success(waterMeterConfigService.getByHousehold(householdId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing water meter configuration")
    public ResponseEntity<ApiResponse<WaterMeterConfigResponse>> update(
            @PathVariable Long id, @Valid @RequestBody WaterMeterConfigRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Water meter configuration updated successfully",
                waterMeterConfigService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove a water meter configuration")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        waterMeterConfigService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Water meter configuration deleted successfully", null));
    }
}
