-- ============================================================
-- V21: Database-level protection for the "Add Resident" business
-- rule -- for the SAME apartment, the SAME household can be
-- assigned to only ONE resident.
--
-- A household already belongs to exactly one apartment
-- (households.apartment_id, NOT NULL), so "same apartment + same
-- household" collapses to just "same household": guaranteeing at
-- most one active PRIMARY resident_assignment row per household_id
-- is equivalent to the Apartment + Household ID rule.
--
-- Scope: PRIMARY only, not every relation_type. The existing
-- Resident Assignments screen (ResidentAssignmentService) is a
-- separate, unrelated feature that intentionally lets a household
-- have additional active MEMBER residents (e.g. family members) --
-- this migration must not block that. It is the "Add Resident"
-- flow (ResidentManagementService#create) that now always assigns
-- PRIMARY and is rejected in the application layer before it ever
-- reaches the database if a PRIMARY already exists; this index is
-- the last-line-of-defense for concurrent/simultaneous requests and
-- for any request that bypasses the frontend and calls the API
-- directly.
--
-- Pre-flight check: if any household already has more than one
-- active PRIMARY resident (which should not currently be possible
-- through the application, but is checked here defensively per the
-- "report existing duplicates before adding a constraint" rule),
-- fail the migration with a clear, actionable message instead of a
-- cryptic constraint-violation error. No existing data is modified
-- or deleted by this migration.
-- ============================================================

DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT household_id
        FROM resident_assignments
        WHERE relation_type = 'PRIMARY' AND active = true
        GROUP BY household_id
        HAVING COUNT(*) > 1
    ) duplicates;

    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Cannot add uq_resident_assignments_household_active_primary: % household(s) already have more than one active PRIMARY resident. Resolve these duplicate assignments (deactivate or reassign the extras) before re-running this migration.', duplicate_count;
    END IF;
END $$;

CREATE UNIQUE INDEX uq_resident_assignments_household_active_primary
    ON resident_assignments (household_id)
    WHERE relation_type = 'PRIMARY' AND active = true;
