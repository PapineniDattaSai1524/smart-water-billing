-- ============================================================
-- V6: Payments — records every collected/self-paid invoice
-- transaction (Resident self-pay online, or Building Owner /
-- Apartment Administrator manual collection e.g. cash).
-- ============================================================

CREATE TABLE payments (
    id                    BIGSERIAL PRIMARY KEY,
    invoice_id            BIGINT        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount                NUMERIC(10,2) NOT NULL,
    method                VARCHAR(20)   NOT NULL CHECK (method IN ('CASH', 'UPI', 'CARD', 'NETBANKING')),
    transaction_ref       VARCHAR(100),
    paid_by_user_id       BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    collected_by_user_id  BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    paid_at               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_paid_by ON payments(paid_by_user_id);
CREATE INDEX idx_payments_collected_by ON payments(collected_by_user_id);
