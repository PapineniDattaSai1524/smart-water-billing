-- ============================================================
-- V12: Billing Cycle Management (Module 6, Week 4)
-- Lifecycle: OPEN -> CLOSED -> FINALIZED -> ARCHIVED, with REOPEN
-- allowed from CLOSED or FINALIZED back to OPEN (never from ARCHIVED).
-- ============================================================

CREATE TABLE billing_cycles (
    id                      BIGSERIAL PRIMARY KEY,
    apartment_id            BIGINT       NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    billing_month           VARCHAR(7)   NOT NULL,      -- YYYY-MM, matches invoices.billing_month
    status                  VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    opened_by_admin_id      BIGINT       REFERENCES users(id),
    opened_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at               TIMESTAMP,
    finalized_at            TIMESTAMP,
    archived_at             TIMESTAMP,
    reopened_at             TIMESTAMP,
    recalculation_count     INTEGER      NOT NULL DEFAULT 0,
    notes                   VARCHAR(500),
    created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_billing_cycles_apartment_month UNIQUE (apartment_id, billing_month),
    CONSTRAINT chk_billing_cycles_status
        CHECK (status IN ('OPEN', 'CLOSED', 'FINALIZED', 'ARCHIVED'))
);

CREATE INDEX idx_billing_cycles_apartment ON billing_cycles(apartment_id, billing_month);
CREATE INDEX idx_billing_cycles_status ON billing_cycles(status);

-- Link invoices to the cycle that produced them, and track finalization
-- (bill lifecycle / immutability) separately from payment status.
ALTER TABLE invoices
    ADD COLUMN billing_cycle_id BIGINT REFERENCES billing_cycles(id),
    ADD COLUMN finalized        BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN finalized_at     TIMESTAMP;

CREATE INDEX idx_invoices_billing_cycle ON invoices(billing_cycle_id);
