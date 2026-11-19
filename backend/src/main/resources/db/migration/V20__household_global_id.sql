-- ============================================================
-- V20: Globally unique Household ID.
--
-- Today a household is only unique within its own apartment
-- (uq_household_unit on (apartment_id, unit_number)) -- the same
-- unit_number can and does exist in two different buildings, so it
-- can't be shared with a resident as a platform-wide identifier.
--
-- Adds household_code: a separate, platform-wide-unique, auto-
-- generated identifier ("HH-<apartment id>-<unit number>") that a
-- Building Owner can hand to a resident, and residents now supply at
-- self-registration time (see AuthService#register) to be linked to
-- the right household automatically.
--
-- Backfill uses exactly the same derivation as Household's
-- @PrePersist (HH-<apartment_id>-<unit_number, upper-cased, spaces
-- stripped>) so pre-existing households get a code consistent with
-- every code generated going forward, and the unit_number/apartment_id
-- uniqueness the code is built from is already guaranteed by
-- uq_household_unit, so this can never collide.
-- ============================================================

ALTER TABLE households ADD COLUMN household_code VARCHAR(60);

UPDATE households
SET household_code = 'HH-' || apartment_id || '-' || UPPER(REGEXP_REPLACE(unit_number, '\s+', '', 'g'))
WHERE household_code IS NULL;

ALTER TABLE households ALTER COLUMN household_code SET NOT NULL;
ALTER TABLE households ADD CONSTRAINT uq_household_code UNIQUE (household_code);
