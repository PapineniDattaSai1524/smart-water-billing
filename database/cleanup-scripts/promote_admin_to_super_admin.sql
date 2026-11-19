-- Manual, immediate fix for: "Super Admin login doesn't work, but Building
-- Owner / Resident logins do."
--
-- Root cause: some databases have a leftover 'admin' user whose role was
-- never SUPER_ADMIN (e.g. created by the old, since-removed V2 seed
-- migration with role=ADMIN). DemoDataInitializer.ensureSingleSuperAdmin()
-- used to look this row up by username and leave it untouched on every
-- startup -- that gap is now fixed in code (see DemoDataInitializer.java),
-- so simply restarting the backend after upgrading will self-heal this.
-- Run this script instead only if you want it fixed immediately without a
-- restart, or if you're on a build predating that fix.
--
-- Effect: promotes the existing 'admin' user to SUPER_ADMIN and resets its
-- password to the documented demo credential (Admin@123), matching what
-- DemoDataInitializer would do on a fresh startup. Safe to run more than
-- once. No-op if a SUPER_ADMIN already exists or 'admin' doesn't exist.
--
-- The bcrypt hash below was freshly generated for the literal password
-- "Admin@123" at BCrypt strength 10 (Spring Security BCryptPasswordEncoder's
-- default) and verified to check out against that password before being
-- placed in this script.

UPDATE users
SET role = 'SUPER_ADMIN',
    password = '$2a$10$UwOO3FIx1lFh/zxZhWLPiuaer2a9MRzDh7G36S81aAf8MqvuLnpby',
    enabled = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'admin'
  AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'SUPER_ADMIN');

-- Verify:
-- SELECT username, role, enabled FROM users WHERE username = 'admin';
-- Then log in with admin / Admin@123.
