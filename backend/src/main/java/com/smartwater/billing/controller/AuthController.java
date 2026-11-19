package com.smartwater.billing.controller;

import com.smartwater.billing.dto.auth.*;
import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, login, and JWT token refresh")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user (ADMIN or RESIDENT)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserProfileResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @GetMapping("/household-lookup")
    @Operation(summary = "Check a Household ID before submitting Resident registration",
            description = "Public, debounced-on-the-frontend lookup used while the resident is still typing "
                    + "their Household ID. This is a UX convenience only -- POST /auth/register always "
                    + "re-validates the Household ID itself server-side and is the sole authoritative check.")
    public ResponseEntity<ApiResponse<HouseholdLookupResponse>> householdLookup(
            @RequestParam String householdId) {
        return ResponseEntity.ok(ApiResponse.success(authService.lookupHousehold(householdId)));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate a user and receive access/refresh JWT tokens")
    public ResponseEntity<ApiResponse<JwtResponse>> login(@Valid @RequestBody LoginRequest request) {
        JwtResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange a valid refresh token for a new access/refresh token pair")
    public ResponseEntity<ApiResponse<JwtResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        JwtResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset link for the given role-specific account")
    public ResponseEntity<ApiResponse<ForgotPasswordResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        ForgotPasswordResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @GetMapping("/reset-password/validate")
    @Operation(summary = "Check whether a password reset token is still usable, without consuming it")
    public ResponseEntity<ApiResponse<ValidateResetTokenResponse>> validateResetToken(
            @RequestParam String token) {
        ValidateResetTokenResponse response = authService.validateResetToken(token);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Set a new password using a valid reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You can now sign in.", null));
    }
}
