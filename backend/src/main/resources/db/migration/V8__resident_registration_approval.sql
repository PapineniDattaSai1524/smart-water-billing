-- ============================================================
-- V8: Resident self-registration approval workflow.
--
-- Adds registration_status/resident_rejection_reason to users so a
-- RESIDENT who self-registers via POST /api/v1/auth/register can be
-- held as PENDING (enabled=false, cannot log in) until a Building
-- Owner approves or rejects them from the Resident Management screen.
--
-- Existing rows (ADMIN, SUPER_ADMIN, and already-active RESIDENT
-- accounts) default to APPROVED so nobody who could already log in
-- is affected.
-- ============================================================

ALTER TABLE users
    ADD COLUMN registration_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';

ALTER TABLE users
    ADD CONSTRAINT users_registration_status_check
    CHECK (registration_status IN ('PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE users
    ADD COLUMN resident_rejection_reason VARCHAR(500);

UPDATE users SET registration_status = 'APPROVED' WHERE registration_status IS NULL;
