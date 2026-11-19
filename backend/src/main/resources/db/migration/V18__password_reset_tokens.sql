-- ============================================================
-- V18: Self-service "Forgot password" support for all roles.
--
-- Background: the login screens across all portals (Resident, Building
-- Owner/ADMIN, Super Admin) exposed a "Forgot password?" link, but no
-- backend endpoint or table ever existed to back it -- the frontend only
-- showed a static "contact your admin" message. This migration adds the
-- table needed for a real, database-backed reset flow.
--
-- Design notes:
--  * We store a SHA-256 hash of the reset token, never the raw token --
--    the raw token is only ever emailed to the user, the same way a
--    password itself is never stored in plaintext.
--  * expires_at gives every token a short lifetime (see
--    app.password-reset.token-expiry-minutes, default 30 minutes).
--  * used_at is set once a token is consumed so it cannot be replayed;
--    a NULL used_at with a future expires_at is the only "still valid"
--    state.
--  * ON DELETE CASCADE: if a user account is ever deleted, any
--    outstanding reset tokens for it become meaningless and should go
--    with it rather than leaving orphaned rows.
-- ============================================================

CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    used_at     TIMESTAMP,
    created_at  TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP NOT NULL
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
