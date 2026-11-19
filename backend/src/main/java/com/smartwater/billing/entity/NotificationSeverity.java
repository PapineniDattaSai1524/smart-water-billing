package com.smartwater.billing.entity;

/**
 * Severity level of a notification. Used by the Alert & Notification
 * Engine to distinguish routine info from actionable warnings/leaks,
 * but available to every notification type (defaults to INFO).
 */
public enum NotificationSeverity {
    INFO,
    WARNING,
    CRITICAL
}
