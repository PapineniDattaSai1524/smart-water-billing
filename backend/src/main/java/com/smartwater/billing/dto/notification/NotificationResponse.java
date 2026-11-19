package com.smartwater.billing.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;

    /** Alert & Notification Engine context - null for pre-existing event-driven notification types. */
    private String severity;
    private Long householdId;
    private String householdUnitNumber;
    private Long apartmentId;
    private String apartmentName;
    private Long relatedUsageLogId;
    private String billingMonth;
}
