-- ============================================================
-- V3: Multi-tenant SaaS foundation
-- Adds the SUPER_ADMIN role, a Community (tenant) concept, and
-- the public registration / Super Admin approval workflow.
-- Fully additive: no existing table, column, or row is altered
-- in a way that breaks Week 1-2 functionality.
--
-- NOTE for existing local databases where this migration already
-- ran with its old content (the 'superadmin' bootstrap INSERT
-- removed below): editing an already-applied migration changes its
-- checksum, so Flyway will report a validation mismatch on next
-- startup. This mirrors the same situation already handled in
-- V2__seed_data.sql. Either run `mvn flyway:repair` (or the
-- equivalent Flyway repair command) to re-baseline the checksum, or
-- drop/recreate your local dev database -- V15__enforce_single_super_admin.sql
-- will clean up any leftover 'superadmin' row either way.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Allow the new SUPER_ADMIN role on users.role
-- ------------------------------------------------------------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'RESIDENT'));

-- ------------------------------------------------------------
-- 2. Communities (tenants)
-- ------------------------------------------------------------
CREATE TABLE communities (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL,
    city            VARCHAR(100),
    state           VARCHAR(100),
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. Link apartments to their owning community (nullable so
--    existing Week 1-2 apartments keep working unchanged)
-- ------------------------------------------------------------
ALTER TABLE apartments ADD COLUMN community_id BIGINT REFERENCES communities(id) ON DELETE SET NULL;
CREATE INDEX idx_apartments_community ON apartments(community_id);

-- ------------------------------------------------------------
-- 4. Registration requests (public sign-up -> Super Admin review)
-- ------------------------------------------------------------
CREATE TABLE registration_requests (
    id                      BIGSERIAL PRIMARY KEY,
    community_name          VARCHAR(150)  NOT NULL,
    apartment_name          VARCHAR(150)  NOT NULL,
    address_line            VARCHAR(255)  NOT NULL,
    city                    VARCHAR(100)  NOT NULL,
    state                   VARCHAR(100)  NOT NULL,
    pincode                 VARCHAR(20)   NOT NULL,
    admin_full_name         VARCHAR(120)  NOT NULL,
    admin_email             VARCHAR(150)  NOT NULL,
    admin_phone_number      VARCHAR(20)   NOT NULL,
    admin_password_hash     VARCHAR(255)  NOT NULL,
    status                  VARCHAR(20)   NOT NULL DEFAULT 'PENDING'
                                CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    rejection_reason        VARCHAR(500),
    reviewed_at             TIMESTAMP,
    reviewed_by             BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    created_community_id    BIGINT        REFERENCES communities(id) ON DELETE SET NULL,
    created_apartment_id    BIGINT        REFERENCES apartments(id) ON DELETE SET NULL,
    created_admin_user_id   BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    created_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registration_requests_status ON registration_requests(status);
CREATE INDEX idx_registration_requests_admin_email ON registration_requests(admin_email);

-- ------------------------------------------------------------
-- 5. Bootstrap Super Admin account so the platform is reachable
--    on first deploy.
--
--    FIXED: this used to unconditionally INSERT a second Super Admin
--    ('superadmin' / SuperAdmin@123) here, guarded only by
--    ON CONFLICT (username) -- which protects the username, not the
--    role. DemoDataInitializer (config/DemoDataInitializer.java)
--    independently creates its own Super Admin ('admin' / Admin@123)
--    as a CommandLineRunner on every startup. Because the two
--    mechanisms key off different usernames, running both against a
--    fresh database always produced 2 SUPER_ADMIN rows -- the project
--    requires exactly one. DemoDataInitializer is now the single
--    source of truth for the bootstrap Super Admin (it already checks
--    "does a SUPER_ADMIN exist at all" before creating one), so this
--    INSERT is intentionally removed. See V15__enforce_single_super_admin.sql
--    for the migration that cleans up databases where this INSERT
--    already ran, plus the database-level uniqueness constraint.
-- ------------------------------------------------------------
