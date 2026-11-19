-- ============================================================
-- V15: Enforce exactly ONE Super Admin account platform-wide.
--
-- Root cause of the duplicate Super Admin problem:
--   1. V3__multi_tenant_foundation.sql unconditionally INSERTs a
--      'superadmin' / SUPER_ADMIN bootstrap row (guarded only by
--      ON CONFLICT (username), i.e. it protects the username, not
--      the role) on every fresh deploy.
--   2. DemoDataInitializer (a CommandLineRunner, so it runs AFTER
--      Flyway) independently ensures an 'admin' / SUPER_ADMIN row
--      exists on every startup, keyed only by username.
--   Because the two mechanisms check different usernames, both rows
--   get created on any environment that runs both -- hence 2
--   SUPER_ADMIN accounts. (docs/RELEASE_REPORT.md claims the V3 seed
--   was removed when the DemoDataInitializer was introduced, but the
--   INSERT was never actually deleted from V3 -- see the accompanying
--   edit to V3 in this change, which now finally does that for new
--   databases. This migration fixes databases where V3 already ran.)
--
-- This migration is idempotent and safe to run against a database
-- that has zero, one, or many SUPER_ADMIN rows.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Pick exactly one canonical Super Admin and demote the rest.
--
--    Canonical account, in priority order:
--      a) the row with username 'admin' (DemoDataInitializer's
--         account -- the one documented in README_FIX_V13.md and
--         docs/RELEASE_REPORT.md as the actual demo login), if it
--         is a SUPER_ADMIN;
--      b) otherwise the oldest existing SUPER_ADMIN row (by
--         created_at, then id), so we never invent or guess an
--         account that isn't already there.
--
--    Any other SUPER_ADMIN rows are demoted to ADMIN rather than
--    deleted: the users table is referenced by apartments.admin_id,
--    registration_requests.reviewed_by, audit_log, notifications,
--    etc. Deleting could either fail on FK constraints or silently
--    orphan history. Demoting preserves the account, its login, and
--    all of its historical references while guaranteeing it can no
--    longer act as Super Admin.
-- ------------------------------------------------------------
DO $$
DECLARE
    canonical_id BIGINT;
BEGIN
    SELECT id INTO canonical_id
    FROM users
    WHERE role = 'SUPER_ADMIN' AND username = 'admin'
    LIMIT 1;

    IF canonical_id IS NULL THEN
        SELECT id INTO canonical_id
        FROM users
        WHERE role = 'SUPER_ADMIN'
        ORDER BY created_at ASC, id ASC
        LIMIT 1;
    END IF;

    IF canonical_id IS NOT NULL THEN
        UPDATE users
        SET role = 'ADMIN', updated_at = CURRENT_TIMESTAMP
        WHERE role = 'SUPER_ADMIN' AND id <> canonical_id;
    END IF;
END $$;

-- ------------------------------------------------------------
-- 2. Database-level guarantee: at most one row can ever have
--    role = 'SUPER_ADMIN', enforced by Postgres itself regardless
--    of which application code path inserts/updates the row.
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_single_super_admin
    ON users ((role))
    WHERE role = 'SUPER_ADMIN';

-- ------------------------------------------------------------
-- 3. Verification (informational only -- surfaces in Flyway/DB logs):
--    SELECT COUNT(*) FROM users WHERE role = 'SUPER_ADMIN'; -- expect 1
-- ------------------------------------------------------------
