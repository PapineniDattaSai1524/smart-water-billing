-- ============================================================
-- V7: Allow the new GLOBAL_ANNOUNCEMENT notification type, used
-- by the Super Admin's platform-wide broadcast feature.
-- ============================================================

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED',
        'RESIDENT_ADDED', 'RESIDENT_UPDATED', 'RESIDENT_DISABLED',
        'RESIDENT_ENABLED', 'PASSWORD_RESET', 'CSV_IMPORTED',
        'METER_READING_SAVED', 'INVOICE_GENERATED', 'PAYMENT_RECORDED',
        'GLOBAL_ANNOUNCEMENT'
    ));
