-- ============================================================
-- V19: Building Owner -> their-own-residents-only notification
-- broadcast. Reuses the existing per-recipient `notifications`
-- table (one row per recipient) rather than a new notification
-- system:
--   - sender_id / batch_id let a single "send" action (which
--     fans out into one row per resident) be identified and
--     grouped back together for the owner's Notification History.
--   - delivery_status records the outcome of that send; every
--     row currently created via this synchronous, transactional
--     flow is SENT (the column exists so a future async delivery
--     path - e.g. email - can record PENDING/FAILED without a
--     further migration).
-- ============================================================

ALTER TABLE notifications ADD COLUMN sender_id BIGINT REFERENCES users(id);
ALTER TABLE notifications ADD COLUMN batch_id UUID;
ALTER TABLE notifications ADD COLUMN delivery_status VARCHAR(20) NOT NULL DEFAULT 'SENT';

CREATE INDEX idx_notifications_batch_id ON notifications(batch_id);
CREATE INDEX idx_notifications_sender_id ON notifications(sender_id);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED',
        'RESIDENT_ADDED', 'RESIDENT_UPDATED', 'RESIDENT_DISABLED',
        'RESIDENT_ENABLED', 'PASSWORD_RESET', 'CSV_IMPORTED',
        'METER_READING_SAVED', 'INVOICE_GENERATED', 'PAYMENT_RECORDED',
        'GLOBAL_ANNOUNCEMENT',
        'USAGE_THRESHOLD_EXCEEDED', 'USAGE_ANOMALY_DETECTED',
        'OWNER_ANNOUNCEMENT'
    ));

ALTER TABLE notifications ADD CONSTRAINT notifications_delivery_status_check
    CHECK (delivery_status IN ('SENT', 'PENDING', 'FAILED'));
