package com.smartwater.billing.controller;

import com.smartwater.billing.dto.auth.ChangePasswordRequest;
import com.smartwater.billing.dto.auth.UpdateProfileRequest;
import com.smartwater.billing.dto.auth.UserProfileResponse;
import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.service.UserService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Profile", description = "Logged-in user's own profile management")
public class ProfileController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get the currently logged-in user's profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(userService.getProfile(userId)));
    }

    @PutMapping
    @Operation(summary = "Update the currently logged-in user's profile (name, phone number)")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully",
                userService.updateProfile(userId, request)));
    }

    @PutMapping("/password")
    @Operation(summary = "Change the currently logged-in user's password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        userService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
