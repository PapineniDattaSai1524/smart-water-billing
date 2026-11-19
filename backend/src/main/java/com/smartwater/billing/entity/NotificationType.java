package com.smartwater.billing.entity;

public enum NotificationType {
    REGISTRATION_APPROVED,
    REGISTRATION_REJECTED,
    RESIDENT_ADDED,
    RESIDENT_UPDATED,
    RESIDENT_DISABLED,
    RESIDENT_ENABLED,
    PASSWORD_RESET,
    CSV_IMPORTED,
    METER_READING_SAVED,
    INVOICE_GENERATED,
    PAYMENT_RECORDED,
    GLOBAL_ANNOUNCEMENT,

    /** Building Owner: an announcement sent to the residents of the buildings they administer. */
    OWNER_ANNOUNCEMENT,

    /** Alert & Notification Engine (Week 3-4): daily usage exceeded the configured threshold. */
    USAGE_THRESHOLD_EXCEEDED,
    /** Alert & Notification Engine (Week 3-4): usage > household average + 2*sigma - possible leak. */
    USAGE_ANOMALY_DETECTED
}
