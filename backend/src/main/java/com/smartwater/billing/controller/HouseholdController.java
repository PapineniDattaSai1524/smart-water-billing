package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.household.HouseholdRequest;
import com.smartwater.billing.dto.household.HouseholdResponse;
import com.smartwater.billing.service.HouseholdService;
import com.smartwater.billing.util.SecurityUtils;
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
@RequestMapping("/api/v1/households")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Households", description = "Household registration and management (CRUD)")
public class HouseholdController {

    private final HouseholdService householdService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register a new household under an apartment")
    public ResponseEntity<ApiResponse<HouseholdResponse>> create(@Valid @RequestBody HouseholdRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Household created successfully", householdService.create(request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all households",
            description = "Staff-only (security fix): previously any authenticated user, including "
                    + "RESIDENT, could enumerate every household across every apartment on the platform. "
                    + "Residents use /api/v1/residents/me/household for their own household.")
    public ResponseEntity<ApiResponse<List<HouseholdResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(householdService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get household details by id",
            description = "RESIDENT: only a household they are actively assigned to. ADMIN: only "
                    + "households in an apartment they administer. SUPER_ADMIN: any household. "
                    + "Enforced in HouseholdService via HouseholdAccessGuard (security fix, previously unchecked).")
    public ResponseEntity<ApiResponse<HouseholdResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(householdService.getById(id)));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List households across every apartment/building the current admin owns",
            description = "Building Owner Water Usage dashboard: scoped to the caller only, unlike the "
                    + "platform-wide GET /households -- this is what the household picker and comparison "
                    + "views should use so households from other buildings never leak in.")
    public ResponseEntity<ApiResponse<List<HouseholdResponse>>> getMine() {
        return ResponseEntity.ok(ApiResponse.success(householdService.getMine(SecurityUtils.getCurrentUserId())));
    }

    @GetMapping("/apartment/{apartmentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all households belonging to a specific apartment (staff-only)")
    public ResponseEntity<ApiResponse<List<HouseholdResponse>>> getByApartment(@PathVariable Long apartmentId) {
        return ResponseEntity.ok(ApiResponse.success(householdService.getByApartment(apartmentId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing household")
    public ResponseEntity<ApiResponse<HouseholdResponse>> update(
            @PathVariable Long id, @Valid @RequestBody HouseholdRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Household updated successfully",
                householdService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a household")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        householdService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Household deleted successfully", null));
    }
}
