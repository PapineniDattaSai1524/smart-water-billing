-- ============================================================
-- V16: Relabel the leftover demoted 'superadmin' account.
--
-- Background: on databases where the old V3 bootstrap INSERT already
-- ran (see V3__multi_tenant_foundation.sql and
-- V15__enforce_single_super_admin.sql), V15 demoted that row from
-- SUPER_ADMIN to ADMIN rather than deleting it (it's referenced by
-- FKs elsewhere, e.g. apartments.admin_id). That's correct, but the
-- row kept its original display name ("Platform Super Admin") and
-- email ("superadmin@smartwater.platform") -- which reads as a
-- second Super Admin in Role Management / User Management even
-- though its role is now plain ADMIN. This migration only relabels
-- that display metadata; it never touches role, password, or any
-- linked data.
--
-- Narrowly scoped: only updates a row that matches the exact
-- leftover artifact (username 'superadmin', already demoted to
-- ADMIN, still carrying its original seed name/email). A row that
-- doesn't match all three is left completely untouched -- this will
-- not rename any real user's account.
-- ============================================================

UPDATE users
SET full_name = 'Admin',
    email = 'admin@smartwater.platform',
    updated_at = CURRENT_TIMESTAMP
WHERE username = 'superadmin'
  AND role = 'ADMIN'
  AND full_name = 'Platform Super Admin'
  AND email = 'superadmin@smartwater.platform'
  -- Guard against a (very unlikely) prior collision with the new email.
  AND NOT EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.email = 'admin@smartwater.platform'
        AND u2.username <> 'superadmin'
  );
