-- ============================================================
-- V22: Defensive repair for text columns on `users` that may have drifted
-- to BYTEA in some environments -- PostgreSQL has no LOWER(bytea) overload,
-- so any BYTEA drift on a column the resident search touches with LOWER()
-- breaks GET /api/v1/admin/residents with:
--   "ERROR: function lower(bytea) does not exist"
--
-- V1/V4 always declared full_name/email/username/resident_code as VARCHAR,
-- and the User entity maps them as plain java.lang.String (no @Lob), so
-- BYTEA was never the intended type for any of them in this schema -- if
-- one shows up as BYTEA in a given database it is drift, not a deliberate
-- binary column, so the correct fix is converting the column back, not
-- rewriting the search query to work around binary data.
--
-- Each column is inspected via information_schema and converted ONLY if it
-- is actually BYTEA in this database; VARCHAR/TEXT columns are left
-- completely untouched, so this is a safe no-op everywhere the schema is
-- already correct. Conversion uses convert_from(col, 'UTF8'), which is a
-- lossless, exact inverse of how a text value ends up stored as BYTEA in
-- the first place (the driver/ORM UTF-8-encoding the string on write) --
-- no data is discarded.
-- ============================================================

DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'full_name') = 'bytea' THEN
        ALTER TABLE users ALTER COLUMN full_name TYPE VARCHAR(120) USING convert_from(full_name, 'UTF8');
    END IF;

    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'email') = 'bytea' THEN
        ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(150) USING convert_from(email, 'UTF8');
    END IF;

    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'username') = 'bytea' THEN
        ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(60) USING convert_from(username, 'UTF8');
    END IF;

    IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'resident_code') = 'bytea' THEN
        ALTER TABLE users ALTER COLUMN resident_code TYPE VARCHAR(30) USING convert_from(resident_code, 'UTF8');
    END IF;
END $$;
