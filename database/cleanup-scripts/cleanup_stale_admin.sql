-- One-time cleanup for local databases created before the V2 seed-data fix.
-- Removes the old broken 'admin' (role=ADMIN) and 'ravikumar' rows and their
-- dependent apartment/household data, so DemoDataInitializer can recreate the
-- correct demo accounts (admin/Admin@123 = SUPER_ADMIN, owner/Owner@123 = ADMIN,
-- resident/Resident@123 = RESIDENT) on next app startup.

DELETE FROM resident_assignments WHERE user_id IN
    (SELECT id FROM users WHERE username IN ('admin','ravikumar'));
DELETE FROM water_meter_configs WHERE household_id IN
    (SELECT id FROM households WHERE unit_number = 'A-101');
DELETE FROM households WHERE unit_number = 'A-101';
DELETE FROM apartments WHERE name = 'Green Valley Residency';
DELETE FROM users WHERE username IN ('admin','ravikumar');
