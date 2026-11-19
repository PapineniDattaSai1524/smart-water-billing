-- ============================================================
-- Smart Water Usage and Consumer Billing System
-- V1: Core schema - users, apartments, households, residents,
--     water meter configuration, water usage logs.
-- NOTE: The billing engine (tariff_plans, invoices) is created
-- later in V5__billing_and_audit_log.sql, where its schema is
-- defined to exactly match the TariffPlan / Invoice JPA entities.
-- No placeholder billing tables are created here anymore: the
-- previous forward-looking tariff_plans/billing_cycles tables
-- in this file did not match any entity and collided with the
-- real tariff_plans table created in V5, which broke schema
-- validation on startup.
-- ============================================================

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(120)  NOT NULL,
    email           VARCHAR(150)  NOT NULL UNIQUE,
    username        VARCHAR(60)   NOT NULL UNIQUE,
    password        VARCHAR(255)  NOT NULL,
    phone_number    VARCHAR(20),
    role            VARCHAR(20)   NOT NULL CHECK (role IN ('ADMIN', 'RESIDENT')),
    enabled         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE apartments (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(150)  NOT NULL,
    address_line    VARCHAR(255)  NOT NULL,
    city            VARCHAR(100)  NOT NULL,
    state           VARCHAR(100)  NOT NULL,
    zip_code        VARCHAR(20)   NOT NULL,
    total_units     INTEGER       NOT NULL DEFAULT 0,
    admin_id        BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE households (
    id                  BIGSERIAL PRIMARY KEY,
    apartment_id        BIGINT        NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    unit_number         VARCHAR(30)   NOT NULL,
    area_sqft           DOUBLE PRECISION NOT NULL,
    occupancy_count     INTEGER       NOT NULL DEFAULT 1,
    has_meter           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_household_unit UNIQUE (apartment_id, unit_number)
);

CREATE TABLE resident_assignments (
    id              BIGSERIAL PRIMARY KEY,
    household_id    BIGINT        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id         BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relation_type   VARCHAR(20)   NOT NULL CHECK (relation_type IN ('PRIMARY', 'MEMBER')),
    move_in_date    DATE          NOT NULL,
    move_out_date   DATE,
    active          BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_resident_household_active UNIQUE (household_id, user_id)
);

CREATE TABLE water_meter_configs (
    id                  BIGSERIAL PRIMARY KEY,
    household_id        BIGINT        NOT NULL UNIQUE REFERENCES households(id) ON DELETE CASCADE,
    meter_number        VARCHAR(60)   NOT NULL UNIQUE,
    meter_type          VARCHAR(30)   NOT NULL CHECK (meter_type IN ('ANALOG', 'DIGITAL', 'SMART_IOT')),
    installation_date   DATE          NOT NULL,
    initial_reading     DOUBLE PRECISION NOT NULL DEFAULT 0,
    status              VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'FAULTY', 'REPLACED')),
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE water_usage_logs (
    id                  BIGSERIAL PRIMARY KEY,
    household_id        BIGINT        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    reading_date        DATE          NOT NULL,
    meter_reading_kl    DOUBLE PRECISION NOT NULL,
    consumption_kl      DOUBLE PRECISION NOT NULL,
    source              VARCHAR(20)   NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'CSV_UPLOAD')),
    recorded_by         BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    remarks             VARCHAR(255),
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_household_reading_date UNIQUE (household_id, reading_date)
);

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX idx_households_apartment ON households(apartment_id);
CREATE INDEX idx_resident_assignments_household ON resident_assignments(household_id);
CREATE INDEX idx_resident_assignments_user ON resident_assignments(user_id);
CREATE INDEX idx_usage_logs_household ON water_usage_logs(household_id);
CREATE INDEX idx_usage_logs_reading_date ON water_usage_logs(reading_date);
CREATE INDEX idx_meter_configs_household ON water_meter_configs(household_id);
