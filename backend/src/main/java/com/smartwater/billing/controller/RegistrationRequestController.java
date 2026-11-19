package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.registration.RegistrationDecisionRequest;
import com.smartwater.billing.dto.registration.RegistrationRequestResponse;
import com.smartwater.billing.dto.registration.RegistrationSubmitRequest;
import com.smartwater.billing.entity.RegistrationStatus;
import com.smartwater.billing.service.RegistrationRequestService;
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
@RequestMapping("/api/v1/registration-requests")
@RequiredArgsConstructor
@Tag(name = "Community Registration", description = "Public community sign-up and Super Admin approval workflow")
public class RegistrationRequestController {

    private final RegistrationRequestService registrationRequestService;

    @PostMapping
    @Operation(summary = "Submit a new community registration request (public, no auth required)")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> submit(
            @Valid @RequestBody RegistrationSubmitRequest request) {
        RegistrationRequestResponse response = registrationRequestService.submit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Your registration request has been submitted successfully. Waiting for Super Admin approval.",
                response));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all registration requests, optionally filtered by status")
    public ResponseEntity<ApiResponse<List<RegistrationRequestResponse>>> list(
            @RequestParam(required = false) RegistrationStatus status) {
        return ResponseEntity.ok(ApiResponse.success(registrationRequestService.list(status)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get a single registration request's details")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(registrationRequestService.getById(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Approve a request: creates the community, apartment, and administrator account")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> approve(@PathVariable Long id) {
        Long superAdminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Registration request approved successfully",
                registrationRequestService.approve(id, superAdminId)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Reject a request with a reason")
    public ResponseEntity<ApiResponse<RegistrationRequestResponse>> reject(
            @PathVariable Long id, @Valid @RequestBody RegistrationDecisionRequest decision) {
        Long superAdminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Registration request rejected",
                registrationRequestService.reject(id, decision, superAdminId)));
    }
}
