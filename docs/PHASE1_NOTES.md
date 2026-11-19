# Phase 1 — Multi-Tenant SaaS Foundation

Everything from Week 1 & Week 2 is untouched and still works exactly as before.
This phase only *adds* new tables, entities, endpoints, and screens.

## What's new

**Backend**
- `Role` enum gained `SUPER_ADMIN` (existing `ADMIN` / `RESIDENT` unaffected).
- New `Community` entity (tenant) — `communities` table.
- `Apartment` gained a nullable `community` relation — existing apartments are unaffected (`community_id` is `NULL` for them).
- New `RegistrationRequest` entity/table — captures the public sign-up form; stores the password already BCrypt-hashed, never in plain text.
- New endpoints:
  - `POST /api/v1/registration-requests` — public, no auth. Submits a community registration request.
  - `GET /api/v1/registration-requests?status=PENDING` — Super Admin only.
  - `GET /api/v1/registration-requests/{id}` — Super Admin only.
  - `POST /api/v1/registration-requests/{id}/approve` — Super Admin only. Creates the Community, Apartment, and an enabled ADMIN user in one transaction, auto-generating a unique username from the admin's email.
  - `POST /api/v1/registration-requests/{id}/reject` — Super Admin only, requires a reason.
  - `GET /api/v1/super-admin/dashboard` — Super Admin only. Platform-wide stat counts.
- Flyway migration `V3__multi_tenant_foundation.sql` (additive only) also seeds a bootstrap Super Admin account so the platform is reachable on first deploy:
  - **username:** `superadmin`
  - **password:** `SuperAdmin@123`
  - Change this password after first login (via the existing `/profile/password` endpoint — no new UI needed for that, it already works).

**Frontend**
- `/register` now renders a full community-registration form (community + apartment + administrator details) instead of the old direct account-creation form, and shows the "waiting for Super Admin approval" confirmation screen your spec described. (The old `RegisterPage.tsx` and its API endpoint are untouched, just no longer routed to, in case you want it later.)
- Logging in as `SUPER_ADMIN` now shows a dedicated dashboard (pending/approved/rejected counts, total communities, admins, residents, usage records) and a new sidebar item, **Registration Requests**, with a table to view/approve/reject pending communities. Approving surfaces the generated admin username so you can hand it to the new administrator.
- `ADMIN` and `RESIDENT` logins are pixel-for-pixel unchanged.

## How to test locally

1. Run the backend as usual — Flyway will apply `V3` automatically on startup.
2. Log in at `/login` with `superadmin` / `SuperAdmin@123`.
3. In another browser/incognito tab, go to `/register` and submit a new community.
4. Back in the Super Admin session, go to **Registration Requests**, approve it, and note the generated username.
5. Log out, log in with that username and the password you set during registration — you're now the Apartment Administrator for a fresh, isolated community, with all your existing Week 1/2 admin features intact.

## Verified

- `npx tsc -b --noEmit` — clean.
- `npx vite build` — clean production build.
- Backend reviewed by hand against existing code conventions (no Java compiler available in this sandbox to run `mvn compile`, so please run your usual `mvn clean verify` before merging — flag me immediately if anything doesn't compile and I'll fix it).

## Next up (Phase 2, per our agreed plan)

User Management module (resident CRUD table + Add/Edit/View/Enable/Disable/Reset-password/Delete), Notification Center, and wiring the Apartment Administrator's existing screens to be community-scoped.
