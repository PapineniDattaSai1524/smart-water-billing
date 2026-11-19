-- ============================================================
-- V10: Bulk Water Purchase Management (Module 2, Week 3)
-- Tracks tanker and municipal water purchases per apartment so
-- their cost can later be distributed across households (Module 3).
-- ============================================================

CREATE TABLE water_purchases (
    id                  BIGSERIAL PRIMARY KEY,
    apartment_id        BIGINT         NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    source_type         VARCHAR(20)    NOT NULL,      -- TANKER | MUNICIPAL
    vendor_name         VARCHAR(150)   NOT NULL,
    quantity_kl         NUMERIC(10, 2) NOT NULL,
    cost                NUMERIC(15, 2) NOT NULL,
    cost_per_kl         NUMERIC(15, 2) NOT NULL,       -- derived: cost / quantity_kl, stored for fast reporting
    purchase_date       DATE           NOT NULL,
    invoice_reference   VARCHAR(100),
    notes               VARCHAR(500),
    -- Module 3 hook: set once this purchase's cost has been distributed to households
    distributed         BOOLEAN        NOT NULL DEFAULT FALSE,
    distributed_at      TIMESTAMP,
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_water_purchases_source_type CHECK (source_type IN ('TANKER', 'MUNICIPAL')),
    CONSTRAINT chk_water_purchases_quantity CHECK (quantity_kl > 0),
    CONSTRAINT chk_water_purchases_cost CHECK (cost >= 0)
);

CREATE INDEX idx_water_purchases_apartment ON water_purchases(apartment_id);
CREATE INDEX idx_water_purchases_date ON water_purchases(purchase_date);
CREATE INDEX idx_water_purchases_vendor ON water_purchases(vendor_name);
CREATE INDEX idx_water_purchases_source_type ON water_purchases(source_type);
CREATE INDEX idx_water_purchases_distributed ON water_purchases(apartment_id, distributed);
