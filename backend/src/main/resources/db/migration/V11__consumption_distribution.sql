-- ============================================================
-- V11: Consumption Distribution Engine (Module 3, Week 3)
-- Distributes bulk water purchase cost across households by
-- metered consumption share, falling back to area-based
-- estimation/allocation when meter data isn't available.
-- ============================================================

CREATE TABLE shared_cost_allocations (
    id                  BIGSERIAL PRIMARY KEY,
    apartment_id        BIGINT         NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    billing_month       DATE           NOT NULL,     -- normalized to the 1st of the month
    total_cost          NUMERIC(15, 2) NOT NULL,
    household_count     INTEGER        NOT NULL,
    created_by_admin_id BIGINT         REFERENCES users(id),
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_shared_cost_allocations_apartment_month UNIQUE (apartment_id, billing_month),
    CONSTRAINT chk_shared_cost_allocations_total_cost CHECK (total_cost >= 0)
);

CREATE INDEX idx_shared_cost_allocations_apartment ON shared_cost_allocations(apartment_id, billing_month);

CREATE TABLE household_cost_allocations (
    id                          BIGSERIAL PRIMARY KEY,
    shared_cost_allocation_id   BIGINT         NOT NULL REFERENCES shared_cost_allocations(id) ON DELETE CASCADE,
    household_id                BIGINT         NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    allocation_basis            VARCHAR(20)    NOT NULL,   -- METERED | AREA_ESTIMATED | AREA_FALLBACK
    consumption_kl              NUMERIC(10, 2),             -- null when household had no reading this period
    area_sqft                   NUMERIC(10, 2) NOT NULL,
    weight                      NUMERIC(14, 4) NOT NULL,
    percentage                  NUMERIC(7, 4)  NOT NULL,
    allocated_amount            NUMERIC(15, 2) NOT NULL,
    created_at                  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_household_cost_allocations_alloc_household UNIQUE (shared_cost_allocation_id, household_id),
    CONSTRAINT chk_household_cost_allocations_basis
        CHECK (allocation_basis IN ('METERED', 'AREA_ESTIMATED', 'AREA_FALLBACK'))
);

CREATE INDEX idx_household_cost_allocations_household ON household_cost_allocations(household_id);
CREATE INDEX idx_household_cost_allocations_allocation ON household_cost_allocations(shared_cost_allocation_id);

-- Which purchases funded a given distribution run (a run typically folds in
-- every not-yet-distributed purchase for that apartment/month in one go).
CREATE TABLE shared_cost_allocation_purchases (
    shared_cost_allocation_id BIGINT NOT NULL REFERENCES shared_cost_allocations(id) ON DELETE CASCADE,
    water_purchase_id         BIGINT NOT NULL REFERENCES water_purchases(id) ON DELETE CASCADE,
    PRIMARY KEY (shared_cost_allocation_id, water_purchase_id)
);
