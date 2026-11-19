-- ============================================================
-- V9: Tiered Tariff Billing Engine (Module 1, Week 3)
-- Fully additive — existing flat-rate plans keep working
-- unchanged (a plan with zero tiers falls back to rate_per_kl).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tariff plans: tax + min/max charge guardrails
-- ------------------------------------------------------------
ALTER TABLE tariff_plans
    ADD COLUMN tax_percentage   NUMERIC(5, 2)  NOT NULL DEFAULT 0,
    ADD COLUMN minimum_charge   NUMERIC(15, 2),
    ADD COLUMN maximum_charge   NUMERIC(15, 2);

ALTER TABLE tariff_plans
    ADD CONSTRAINT chk_tariff_plans_tax_percentage
        CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
    ADD CONSTRAINT chk_tariff_plans_charge_bounds
        CHECK (maximum_charge IS NULL OR minimum_charge IS NULL OR maximum_charge >= minimum_charge);

-- ------------------------------------------------------------
-- 2. Tariff tiers: 0-10 KL / 11-20 KL / 20+ KL style bands.
--    tier_order is 1-based and contiguous per plan.
--    max_kl NULL means "unbounded" (the last / highest tier).
-- ------------------------------------------------------------
CREATE TABLE tariff_tiers (
    id              BIGSERIAL PRIMARY KEY,
    tariff_plan_id  BIGINT        NOT NULL REFERENCES tariff_plans(id) ON DELETE CASCADE,
    tier_order      INTEGER       NOT NULL,
    min_kl          NUMERIC(10, 2) NOT NULL,
    max_kl          NUMERIC(10, 2),
    rate_per_kl     NUMERIC(15, 2) NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tariff_tiers_plan_order UNIQUE (tariff_plan_id, tier_order),
    CONSTRAINT chk_tariff_tiers_range CHECK (max_kl IS NULL OR max_kl > min_kl),
    CONSTRAINT chk_tariff_tiers_rate CHECK (rate_per_kl >= 0)
);

CREATE INDEX idx_tariff_tiers_plan ON tariff_tiers(tariff_plan_id, tier_order);

-- ------------------------------------------------------------
-- 3. Invoices: persist the tax + tiered breakdown alongside the
--    existing flat columns so history stays fully reconstructable.
-- ------------------------------------------------------------
ALTER TABLE invoices
    ADD COLUMN tax_amount      NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN base_charge     NUMERIC(15, 2),
    ADD COLUMN breakdown_json  TEXT;
