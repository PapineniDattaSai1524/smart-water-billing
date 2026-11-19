-- ============================================================
-- V4: User Management module + Notification Center
-- Fully additive: existing users/rows are unaffected (all new
-- columns are nullable with sensible defaults).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extended resident profile fields on users
-- ------------------------------------------------------------
ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(500);
ALTER TABLE users ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER'));
ALTER TABLE users ADD COLUMN date_of_birth DATE;
ALTER TABLE users ADD COLUMN emergency_contact VARCHAR(20);
ALTER TABLE users ADD COLUMN occupation VARCHAR(100);
ALTER TABLE users ADD COLUMN family_members INTEGER;
ALTER TABLE users ADD COLUMN resident_code VARCHAR(30);

CREATE UNIQUE INDEX idx_users_resident_code ON users(resident_code) WHERE resident_code IS NOT NULL;

-- ------------------------------------------------------------
-- 2. Notification center
-- ------------------------------------------------------------
CREATE TABLE notifications (
    id                  BIGSERIAL PRIMARY KEY,
    recipient_user_id   BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(40)   NOT NULL CHECK (type IN (
                            'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED',
                            'RESIDENT_ADDED', 'RESIDENT_UPDATED', 'RESIDENT_DISABLED',
                            'RESIDENT_ENABLED', 'PASSWORD_RESET', 'CSV_IMPORTED',
                            'METER_READING_SAVED', 'INVOICE_GENERATED', 'PAYMENT_RECORDED'
                        )),
    title               VARCHAR(150)  NOT NULL,
    message             VARCHAR(500)  NOT NULL,
    is_read             BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_user_id, is_read);
