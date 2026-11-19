package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.registration.CommunityResponse;
import com.smartwater.billing.service.CommunityManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/super-admin/communities")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Super Admin - Communities", description = "Platform-wide community oversight")
public class CommunityManagementController {

    private final CommunityManagementService communityManagementService;

    @GetMapping
    @Operation(summary = "List all onboarded communities")
    public ResponseEntity<ApiResponse<List<CommunityResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(communityManagementService.list()));
    }

    @PutMapping("/{id}/suspend")
    @Operation(summary = "Suspend a community — blocks its administrator and residents from logging in")
    public ResponseEntity<ApiResponse<CommunityResponse>> suspend(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Community suspended", communityManagementService.suspend(id)));
    }

    @PutMapping("/{id}/activate")
    @Operation(summary = "Reactivate a suspended community")
    public ResponseEntity<ApiResponse<CommunityResponse>> activate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Community activated", communityManagementService.activate(id)));
    }
}
