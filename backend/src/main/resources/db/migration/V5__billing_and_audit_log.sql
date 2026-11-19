-- ============================================================
-- V5: Billing module (tariff plans + invoices) and Audit Log
-- Fully additive.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Audit log — records key administrative actions platform-wide
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    actor_user_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
    actor_name      VARCHAR(120),
    action          VARCHAR(80)   NOT NULL,
    entity_type     VARCHAR(60),
    entity_id       BIGINT,
    details         VARCHAR(500),
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);

-- ------------------------------------------------------------
-- 2. Tariff plans — flat rate per kilolitre, one active plan per apartment
-- ------------------------------------------------------------
CREATE TABLE tariff_plans (
    id                  BIGSERIAL PRIMARY KEY,
    apartment_id        BIGINT        NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    name                VARCHAR(100)  NOT NULL,
    rate_per_kl         NUMERIC(10,2) NOT NULL,
    fixed_charge        NUMERIC(10,2) NOT NULL DEFAULT 0,
    active              BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tariff_plans_apartment ON tariff_plans(apartment_id);

-- ------------------------------------------------------------
-- 3. Invoices — one per household per billing month
-- ------------------------------------------------------------
CREATE TABLE invoices (
    id                  BIGSERIAL PRIMARY KEY,
    household_id        BIGINT        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    tariff_plan_id       BIGINT        REFERENCES tariff_plans(id) ON DELETE SET NULL,
    billing_month        VARCHAR(7)    NOT NULL, -- 'YYYY-MM'
    consumption_kl        NUMERIC(10,2) NOT NULL,
    rate_per_kl           NUMERIC(10,2) NOT NULL,
    fixed_charge          NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount           NUMERIC(10,2) NOT NULL,
    status                VARCHAR(20)   NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    due_date              DATE          NOT NULL,
    paid_at               TIMESTAMP,
    generated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (household_id, billing_month)
);

CREATE INDEX idx_invoices_household ON invoices(household_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_billing_month ON invoices(billing_month);
