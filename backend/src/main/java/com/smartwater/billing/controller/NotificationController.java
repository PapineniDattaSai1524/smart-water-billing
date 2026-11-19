package com.smartwater.billing.controller;

import com.smartwater.billing.dto.common.ApiResponse;
import com.smartwater.billing.dto.common.PageResponse;
import com.smartwater.billing.dto.notification.BroadcastRequest;
import com.smartwater.billing.dto.notification.NotificationResponse;
import com.smartwater.billing.dto.notification.OwnerBroadcastRequest;
import com.smartwater.billing.dto.notification.OwnerNotificationBatchResponse;
import com.smartwater.billing.entity.NotificationType;
import com.smartwater.billing.service.AlertEngineService;
import com.smartwater.billing.service.NotificationService;
import com.smartwater.billing.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notifications", description = "Logged-in user's notification center")
public class NotificationController {

    private final NotificationService notificationService;
    private final AlertEngineService alertEngineService;

    @GetMapping
    @Operation(summary = "List my notifications, most recent first")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.list(userId, PageRequest.of(page, size))));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get my unread notification count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount() {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", notificationService.unreadCount(userId))));
    }

    @PutMapping("/mark-all-read")
    @Operation(summary = "Mark all of my notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead() {
        Long userId = SecurityUtils.getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a single notification of mine as read")
    public ResponseEntity<ApiResponse<Void>> markOneRead(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean updated = notificationService.markAsRead(id, userId);
        if (!updated) {
            return ResponseEntity.ok(ApiResponse.error("Notification not found or does not belong to you"));
        }
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }

    @GetMapping("/search")
    @Operation(summary = "Search my notifications by type / read status / date range")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> search(
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Boolean read,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.search(userId, type, read, from, to, PageRequest.of(page, size))));
    }

    @GetMapping("/apartment/{apartmentId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: list every alert/notification raised for the apartments they manage")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> searchByApartment(
            @PathVariable Long apartmentId,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Boolean read,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long adminId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.searchByApartment(apartmentId, adminId, type, read, from, to, PageRequest.of(page, size))));
    }

    @PostMapping("/broadcast")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Super Admin: send a platform-wide (or role-targeted) global notification")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> broadcast(@Valid @RequestBody BroadcastRequest request) {
        int count = notificationService.broadcast(request.getTitle(), request.getMessage(), request.getTargetRole());
        return ResponseEntity.ok(ApiResponse.success("Notification sent to " + count + " user(s)",
                Map.of("recipientCount", count)));
    }

    @PostMapping("/owner-broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Building Owner: send a notification to every resident of the buildings they administer")
    public ResponseEntity<ApiResponse<OwnerNotificationBatchResponse>> ownerBroadcast(
            @Valid @RequestBody OwnerBroadcastRequest request) {
        Long ownerId = SecurityUtils.getCurrentUserId();
        OwnerNotificationBatchResponse response =
                notificationService.sendOwnerBroadcastToResidents(ownerId, request.getTitle(), request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(
                "Notification sent to " + response.getRecipientCount() + " resident(s)", response));
    }

    @GetMapping("/owner-broadcast/recipient-count")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Building Owner: how many residents an owner-broadcast would reach right now")
    public ResponseEntity<ApiResponse<Map<String, Long>>> ownerBroadcastRecipientCount() {
        Long ownerId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("recipientCount", notificationService.countRecipientsForOwnerBroadcast(ownerId))));
    }

    @GetMapping("/owner-broadcast/history")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Building Owner: their own sent-notification history")
    public ResponseEntity<ApiResponse<PageResponse<OwnerNotificationBatchResponse>>> ownerBroadcastHistory(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long ownerId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.ownerBroadcastHistory(ownerId, search, status, PageRequest.of(page, size))));
    }

    @GetMapping("/owner-broadcast/{batchId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Building Owner: full detail of one of their own sent notifications")
    public ResponseEntity<ApiResponse<OwnerNotificationBatchResponse>> ownerBroadcastDetail(@PathVariable String batchId) {
        Long ownerId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.ownerBroadcastDetail(ownerId, java.util.UUID.fromString(batchId))));
    }

    @PostMapping("/run-alert-check")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Super Admin: manually trigger the Alert & Notification Engine instead of waiting for the daily cron run")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> runAlertCheckNow() {
        AlertEngineService.AlertRunSummary summary = alertEngineService.evaluateAllHouseholds();
        return ResponseEntity.ok(ApiResponse.success(
                "Alert check complete: " + summary.evaluated() + " household(s) evaluated, "
                        + summary.thresholdAlerts() + " threshold alert(s), "
                        + summary.anomalyAlerts() + " anomaly alert(s) raised",
                Map.of(
                        "evaluated", summary.evaluated(),
                        "thresholdAlerts", summary.thresholdAlerts(),
                        "anomalyAlerts", summary.anomalyAlerts())));
    }
}
