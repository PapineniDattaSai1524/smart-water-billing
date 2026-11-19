package com.smartwater.billing.controller;

import com.smartwater.billing.dto.apartment.ApartmentRequest;
import com.smartwater.billing.dto.apartment.ApartmentResponse;
import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.service.ApartmentService;
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
@RequestMapping("/api/v1/apartments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Apartments", description = "Apartment onboarding and management (CRUD)")
public class ApartmentController {

    private final ApartmentService apartmentService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Onboard a new apartment community")
    public ResponseEntity<ApiResponse<ApartmentResponse>> create(@Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Apartment created successfully",
                        apartmentService.create(request, SecurityUtils.getCurrentUserId())));
    }

    @GetMapping
    @Operation(summary = "List all apartments")
    public ResponseEntity<ApiResponse<List<ApartmentResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(apartmentService.getAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get apartment details by id")
    public ResponseEntity<ApiResponse<ApartmentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(apartmentService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing apartment")
    public ResponseEntity<ApiResponse<ApartmentResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ApartmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Apartment updated successfully",
                apartmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an apartment and its households")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        apartmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Apartment deleted successfully", null));
    }
}
