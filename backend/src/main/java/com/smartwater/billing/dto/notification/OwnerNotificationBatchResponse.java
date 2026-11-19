package com.smartwater.billing.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** One "send" action in a Building Owner's Notification History -- a batch of per-recipient rows grouped back together. */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerNotificationBatchResponse {
    private String batchId;
    private String title;
    private String message;
    /** Always "Residents Only" for this feature -- there is no other audience it can be. */
    private String audience;
    private LocalDateTime sentAt;
    private String sentByName;
    /** SENT / PENDING / FAILED. Every batch produced by this synchronous send flow is SENT. */
    private String status;
    private long recipientCount;
}
