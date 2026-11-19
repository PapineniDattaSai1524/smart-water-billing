package com.smartwater.billing.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "notifications_gen")
    @SequenceGenerator(name = "notifications_gen", sequenceName = "notifications_id_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    /**
     * Alert & Notification Engine context (all optional; null for the
     * pre-existing event-driven notification types such as
     * REGISTRATION_APPROVED, INVOICE_GENERATED, etc.).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_usage_log_id")
    private WaterUsageLog relatedUsageLog;

    /** YYYY-MM billing period this alert/notification relates to, if any. */
    @Column(name = "billing_month", length = 7)
    private String billingMonth;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationSeverity severity = NotificationSeverity.INFO;

    /**
     * Building Owner "send notification to my residents" feature: who sent it,
     * and which send action it belongs to (one row is created per recipient, so
     * a batch groups them back together for the sender's Notification History).
     * Both null for every pre-existing, non-broadcast notification type.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Column(name = "batch_id")
    private java.util.UUID batchId;

    @Builder.Default
    @Column(name = "delivery_status", nullable = false, length = 20)
    private String deliveryStatus = "SENT";

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = java.time.LocalDateTime.now();
        }
        if (severity == null) {
            severity = NotificationSeverity.INFO;
        }
    }
}
