package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.resident.ResidentAssignmentRequest;
import com.smartwater.billing.dto.resident.ResidentAssignmentResponse;
import com.smartwater.billing.service.ResidentAssignmentService;
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
@RequestMapping("/api/v1/resident-assignments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Resident Assignments", description = "Assigning residents (users) to households")
public class ResidentAssignmentController {

    private final ResidentAssignmentService residentAssignmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign a resident to a household")
    public ResponseEntity<ApiResponse<ResidentAssignmentResponse>> assign(
            @Valid @RequestBody ResidentAssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resident assigned successfully", residentAssignmentService.assign(request)));
    }

    @GetMapping("/household/{householdId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all resident assignments for a household (staff-only)",
            description = "Security fix: previously reachable by any authenticated user regardless of role, "
                    + "exposing who lives in any household. Every other mutating endpoint on this controller "
                    + "was already ADMIN-only; this GET (and getByUser below) had been missed. Residents use "
                    + "/api/v1/residents/me/household for their own assignment.")
    public ResponseEntity<ApiResponse<List<ResidentAssignmentResponse>>> getByHousehold(
            @PathVariable Long householdId) {
        return ResponseEntity.ok(ApiResponse.success(residentAssignmentService.getByHousehold(householdId)));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all household assignments for a resident user (staff-only)")
    public ResponseEntity<ApiResponse<List<ResidentAssignmentResponse>>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(residentAssignmentService.getByUser(userId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a resident assignment (relation type, move-in/out dates)")
    public ResponseEntity<ApiResponse<ResidentAssignmentResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ResidentAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Resident assignment updated successfully",
                residentAssignmentService.update(id, request)));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a resident assignment (e.g. resident has moved out)")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        residentAssignmentService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Resident assignment deactivated successfully", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Permanently delete a resident assignment record")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        residentAssignmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Resident assignment deleted successfully", null));
    }
}
