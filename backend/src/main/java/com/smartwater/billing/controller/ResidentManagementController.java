package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.resident.AdminResetPasswordRequest;
import com.smartwater.billing.dto.resident.ApproveResidentRequest;
import com.smartwater.billing.dto.resident.AssignableResidentResponse;
import com.smartwater.billing.dto.resident.PendingResidentResponse;
import com.smartwater.billing.dto.resident.RejectResidentRequest;
import com.smartwater.billing.dto.resident.ResidentCreateRequest;
import com.smartwater.billing.dto.resident.ResidentResponse;
import com.smartwater.billing.dto.resident.ResidentUpdateRequest;
import com.smartwater.billing.service.ResidentManagementService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/residents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User Management", description = "Apartment Administrator resident management module")
public class ResidentManagementController {

    private final ResidentManagementService residentManagementService;

    @GetMapping("/pending")
    @Operation(summary = "List self-registered residents awaiting approval")
    public ResponseEntity<ApiResponse<List<PendingResidentResponse>>> pending() {
        return ResponseEntity.ok(ApiResponse.success(residentManagementService.listPending()));
    }

    @GetMapping("/assignable")
    @Operation(summary = "List approved residents available to pick in the Assign Resident dropdown")
    public ResponseEntity<ApiResponse<List<AssignableResidentResponse>>> assignable() {
        return ResponseEntity.ok(ApiResponse.success(residentManagementService.listAssignable()));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a pending resident registration and assign them to a household")
    public ResponseEntity<ApiResponse<ResidentResponse>> approve(
            @PathVariable Long id, @Valid @RequestBody ApproveResidentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Resident registration approved",
                residentManagementService.approve(id, request, SecurityUtils.getCurrentUserId())));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject a pending resident registration")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long id, @Valid @RequestBody RejectResidentRequest request) {
        residentManagementService.reject(id, request, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Resident registration rejected", null));
    }

    @PostMapping
    @Operation(summary = "Add a new resident to one of your households")
    public ResponseEntity<ApiResponse<ResidentResponse>> create(@Valid @RequestBody ResidentCreateRequest request) {
        ResidentResponse response = residentManagementService.create(request, SecurityUtils.getCurrentUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resident added successfully", response));
    }

    @GetMapping
    @Operation(summary = "Search/list your residents with pagination, filters, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<ResidentResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long apartmentId,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(ApiResponse.success(residentManagementService.list(
                SecurityUtils.getCurrentUserId(), apartmentId, enabled, search, pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single resident's full profile")
    public ResponseEntity<ApiResponse<ResidentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                residentManagementService.getById(id, SecurityUtils.getCurrentUserId())));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Edit a resident's profile")
    public ResponseEntity<ApiResponse<ResidentResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ResidentUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Resident updated successfully",
                residentManagementService.update(id, request, SecurityUtils.getCurrentUserId())));
    }

    @PutMapping("/{id}/enable")
    @Operation(summary = "Enable a resident's account")
    public ResponseEntity<ApiResponse<ResidentResponse>> enable(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Resident account enabled",
                residentManagementService.setEnabled(id, true, SecurityUtils.getCurrentUserId())));
    }

    @PutMapping("/{id}/disable")
    @Operation(summary = "Disable a resident's account")
    public ResponseEntity<ApiResponse<ResidentResponse>> disable(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Resident account disabled",
                residentManagementService.setEnabled(id, false, SecurityUtils.getCurrentUserId())));
    }

    @PutMapping("/{id}/reset-password")
    @Operation(summary = "Reset a resident's password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id, @Valid @RequestBody AdminResetPasswordRequest request) {
        residentManagementService.resetPassword(id, request, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a resident")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        residentManagementService.delete(id, SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.success("Resident deleted successfully", null));
    }
}
