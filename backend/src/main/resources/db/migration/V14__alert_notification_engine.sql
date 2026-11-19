-- ============================================================
-- V14: Alert & Notification Engine
--
-- Fully additive on top of the existing `notifications` table
-- (V4/V7): all new columns are nullable (or have safe defaults),
-- so existing notification rows and existing notify(...) call
-- sites (registration, invoices, payments, CSV import, etc.)
-- continue to work unchanged.
--
-- Adds:
--   1. household/apartment/severity/related-usage-log/billing-
--      month context to notifications, so alerts can be scoped
--      and displayed correctly per resident / apartment admin.
--   2. two new notification types for the scheduler-driven alert
--      engine: USAGE_THRESHOLD_EXCEEDED (overuse) and
--      USAGE_ANOMALY_DETECTED (possible leak, 2-sigma rule).
--   3. apartment_alert_configs: optional per-apartment override
--      of the global default threshold/anomaly settings
--      (app.alert.* in application.properties). A missing row
--      simply means "use the platform default".
-- ============================================================

-- ------------------------------------------------------------
-- 1. Notification context columns
-- ------------------------------------------------------------
ALTER TABLE notifications ADD COLUMN household_id BIGINT REFERENCES households(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN apartment_id BIGINT REFERENCES apartments(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN related_usage_log_id BIGINT REFERENCES water_usage_logs(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN billing_month VARCHAR(7);
ALTER TABLE notifications ADD COLUMN severity VARCHAR(20) NOT NULL DEFAULT 'INFO';

ALTER TABLE notifications ADD CONSTRAINT notifications_severity_check
    CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL'));

CREATE INDEX idx_notifications_household ON notifications(household_id);
CREATE INDEX idx_notifications_apartment ON notifications(apartment_id);

-- Fast existence check used by the alert scheduler to avoid raising
-- the same alert twice for the same household/type/usage reading.
CREATE INDEX idx_notifications_dedupe ON notifications(household_id, type, related_usage_log_id);

-- ------------------------------------------------------------
-- 2. New notification types for the alert engine
-- ------------------------------------------------------------
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED',
        'RESIDENT_ADDED', 'RESIDENT_UPDATED', 'RESIDENT_DISABLED',
        'RESIDENT_ENABLED', 'PASSWORD_RESET', 'CSV_IMPORTED',
        'METER_READING_SAVED', 'INVOICE_GENERATED', 'PAYMENT_RECORDED',
        'GLOBAL_ANNOUNCEMENT',
        'USAGE_THRESHOLD_EXCEEDED', 'USAGE_ANOMALY_DETECTED'
    ));

-- ------------------------------------------------------------
-- 3. Per-apartment alert threshold configuration (optional
--    override of the application-wide defaults)
-- ------------------------------------------------------------
CREATE TABLE apartment_alert_configs (
    id                          BIGSERIAL PRIMARY KEY,
    apartment_id                BIGINT NOT NULL UNIQUE REFERENCES apartments(id) ON DELETE CASCADE,
    daily_threshold_kl          DOUBLE PRECISION,
    anomaly_std_dev_multiplier  DOUBLE PRECISION,
    min_history_readings        INTEGER,
    enabled                     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_apartment_alert_configs_apartment ON apartment_alert_configs(apartment_id);
