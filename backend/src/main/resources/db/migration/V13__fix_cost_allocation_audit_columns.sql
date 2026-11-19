-- ============================================================
-- V13: Fix missing audit column on the Consumption Distribution
-- Engine tables introduced in V11.
--
-- Root cause
-- ----------
-- shared_cost_allocations and household_cost_allocations are
-- mapped by SharedCostAllocation / HouseholdCostAllocation, both
-- of which extend BaseEntity. BaseEntity requires both
-- `created_at` (@CreatedDate) and `updated_at` (@LastModifiedDate).
-- V11 only created `created_at` on these two tables, so
-- Hibernate's schema validator (spring.jpa.hibernate.ddl-auto=
-- validate) fails at startup with:
--   Schema-validation: missing column [updated_at] in table
--   [household_cost_allocations]
--
-- V11 has already been applied in every environment that ran
-- this app, so per Flyway convention we do not edit it — we add
-- the missing column here instead.
-- ============================================================

ALTER TABLE shared_cost_allocations
    ADD COLUMN updated_at TIMESTAMP;

ALTER TABLE household_cost_allocations
    ADD COLUMN updated_at TIMESTAMP;

-- Backfill existing rows so updated_at is never null for data that
-- already existed before this migration ran.
UPDATE shared_cost_allocations
    SET updated_at = created_at
    WHERE updated_at IS NULL;

UPDATE household_cost_allocations
    SET updated_at = created_at
    WHERE updated_at IS NULL;

-- Match BaseEntity's @Column(nullable = false) contract and give
-- new rows the same default behaviour as created_at.
ALTER TABLE shared_cost_allocations
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE household_cost_allocations
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET NOT NULL;
