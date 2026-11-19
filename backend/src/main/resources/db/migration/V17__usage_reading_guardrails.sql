-- ============================================================
-- V17: Database-level guardrails on water_usage_logs.
--
-- Background: a live deployment was observed with a water_usage_logs row
-- containing consumption_kl = 899878 (and a household average / bill
-- derived from it). WaterUsageLogService.computeConsumption() already
-- rejects a decreasing meter reading and an out-of-order reading date --
-- the application-layer investigation (see UsageValidationProperties and
-- the new checks in WaterUsageLogService) found the actual gap was the
-- absence of any upper bound, so a unit mix-up (litres typed into a kL
-- field) or a cumulative/serial meter number pasted in by mistake passed
-- every existing check and was accepted as a legitimate reading.
--
-- This migration adds the same class of guardrail at the database level,
-- as defense-in-depth: it does not depend on every write path going
-- through the Java service layer (a raw SQL fix, a future ingestion path,
-- or a different service should not be able to insert a nonsensical
-- value either). The bounds intentionally match
-- UsageValidationProperties' defaults but are deliberately generous
-- (500 kL implied consumption per reading, 1,000,000 kL absolute meter
-- ceiling) so no legitimate residential reading is ever rejected -- this
-- only catches values that are unambiguously wrong.
--
-- Existing corrupted rows (if any) must be corrected or removed BEFORE
-- this migration runs, or Flyway will fail applying it -- see the
-- accompanying cleanup guidance for identifying and fixing the specific
-- affected row(s) first.
-- ============================================================

ALTER TABLE water_usage_logs
    ADD CONSTRAINT chk_usage_logs_meter_reading_non_negative
        CHECK (meter_reading_kl >= 0),
    ADD CONSTRAINT chk_usage_logs_consumption_non_negative
        CHECK (consumption_kl >= 0),
    ADD CONSTRAINT chk_usage_logs_meter_reading_plausible
        CHECK (meter_reading_kl <= 1000000),
    ADD CONSTRAINT chk_usage_logs_consumption_plausible
        CHECK (consumption_kl <= 500);
