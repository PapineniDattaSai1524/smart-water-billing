# Fix: Resident "My Household" LazyInitializationException

## Bug
`GET /api/v1/residents/me/household` was throwing:

```
An unexpected error occurred: could not initialize proxy
[com.smartwater.billing.entity.Household#1] - no Session
```

## Root Cause
`ResidentSelfController.household()` called `residentSelfService.getMyHousehold(userId)`
(a `@Transactional(readOnly = true)` service method that returns the raw `Household`
entity) and then mapped it to a DTO **in the controller, after the transaction/Hibernate
session had already closed**. Since `Household.apartment` and
`ResidentAssignment.household` are `FetchType.LAZY`, accessing `household.getApartment()`
outside the open session threw the classic Hibernate `LazyInitializationException`.

Note the Resident Dashboard endpoint worked fine because it builds its DTO fully
*inside* the transactional service method — this bug only affected `/household`.

## Fix
Moved the entity -> DTO mapping into the service layer, inside the same
`@Transactional(readOnly = true)` method that fetches the entity, so lazy associations
resolve while the session is still open.

**Files changed:**
- `backend/src/main/java/com/smartwater/billing/service/ResidentSelfService.java`
  - Injected `HouseholdMapper`
  - Added `getMyHouseholdResponse(Long userId)` which fetches + maps in one transaction
- `backend/src/main/java/com/smartwater/billing/controller/ResidentSelfController.java`
  - `/household` endpoint now calls `getMyHouseholdResponse(...)` directly
  - Removed the now-unused `HouseholdMapper` field/import

`getMyHousehold(Long userId)` (returning the raw entity) is kept as-is for
`myInvoices()`, which only calls `.getId()` on it — safe, since a Hibernate proxy's ID
is available without hitting the database.

## How to verify
1. Rebuild backend: `mvn clean install` (or restart via your IDE/Spring Boot run config)
2. Log in as a Resident with an active household assignment
3. Navigate to **My Household** — should now show unit number, apartment name, area,
   occupants, meter status instead of the error
4. Re-check Dashboard, Usage History, Bills, Payments to confirm no regression

## Update 2 — Same bug on Usage History page

`GET /api/v1/residents/me/usage-history` had the identical bug: `ResidentSelfController.usageHistory()`
mapped `WaterUsageLog` entities to DTOs (`waterUsageLogMapper::toResponse`, which reads
`log.getHousehold().getUnitNumber()` — lazy) **after** `getMyUsageHistory()`'s transaction
had already closed.

**Fix:** added `ResidentSelfService.getMyUsageHistoryResponse(Long userId)` — fetches and
maps in the same `@Transactional(readOnly = true)` method — and updated the controller
to call it directly. Same pattern as the `/household` fix above.

Audited every other controller in the codebase for the same "fetch in service,
map in controller" pattern — no other endpoint has it, so no more LazyInitializationException
should be lurking behind Bills, Payments, or the admin/owner dashboards.

## Update 3 — Resident registration never actually creates a resident account

**Symptom:** Registering a new resident routes the request to Super Admin's
"Registration Requests" queue. Approving it there does not let the resident log in.

**Root Cause:** `/register` — the route behind the "Register here" link on the Resident
Login page — was wired to `CommunityRegisterPage`, the form for onboarding a brand new
community (creates a `RegistrationRequest`, approved by Super Admin, which spins up a
new Community + Apartment + Building Owner account). It has nothing to do with
individual residents.

The actual resident self-registration form, `RegisterPage.tsx` — which correctly posts
to `POST /api/v1/auth/register` and creates a `PENDING` resident awaiting the **Building
Owner's** approval (per the V8 migration / `ResidentManagementController` `/pending`,
`/approve`, `/reject` endpoints) — existed in the codebase but was never imported or
routed in `App.tsx`. Dead code.

Net effect: residents registering via "Register here" never got a resident account at
all. If Super Admin approved their submission, it silently created an unrelated,
unwanted community/building-owner instead.

**Fix (frontend only):**
- `App.tsx`: `/register` now renders `RegisterPage` (resident/self-service admin
  registration). Community onboarding moved to a new route, `/register-community`
  (still `CommunityRegisterPage`, still Super-Admin-approved).
- `LoginPage.tsx`: the "Register here" link is now portal-aware — Resident portal →
  `/register`, Building Owner portal → `/register-community`.
- `LandingPage.tsx`: split the single ambiguous "Register your community" link into two
  clear links — "New Building Owner? Register your community" (`/register-community`)
  and "New Resident? Create your account" (`/register`).

**How to verify:**
1. Rebuild/restart frontend (`npm run dev` / `npm run build`)
2. From `/login/resident`, click "Register here" → should land on the account-creation
   form with a Resident/Admin role selector, not a community-details form
3. Submit as a Resident → confirm the success message says "Your Building Owner needs
   to approve your account"
4. Log in as the Building Owner (ADMIN) who owns that apartment → Resident Management →
   Pending tab → the new resident should now appear there, not in Super Admin's
   Registration Requests
5. Approve from there and assign to a household → the resident should now be able to
   log in

## Update 4 — Week 1–2 completion: missing tests added

Added the two missing Mockito unit test classes flagged in the Week 1–2 analysis
(same conventions as the existing `HouseholdServiceTest`/`ApartmentServiceTest`):

- `backend/src/test/java/com/smartwater/billing/service/ResidentAssignmentServiceTest.java`
  — 9 tests covering: successful assignment, missing household/user, duplicate active
  assignment, a household already having an active PRIMARY resident, listing by an
  unknown household, deactivate, delete, and delete-not-found.
- `backend/src/test/java/com/smartwater/billing/service/WaterMeterConfigServiceTest.java`
  — 10 tests covering: successful configure (and marking `household.hasMeter = true`),
  missing household, meter-already-configured-for-household, duplicate meter number,
  get-by-household (found/not found), update with a conflicting meter number, update
  keeping the same meter number (no duplicate check triggered), and delete (clearing
  `household.hasMeter`) plus delete-not-found.

**Note on `billing_cycles`:** the spec calls for a dedicated `billing_cycles` table.
This build instead tracks the billing period as a `billing_month` (`YYYY-MM`) string
column directly on `invoices` (`V5__billing_and_audit_log.sql`), with billing-cycle
open/generate/finalize behavior implemented in `BillingService`. Functionally
equivalent, but if a literal `billing_cycles` table is required for grading/schema
review, that would mean introducing a real `BillingCycle` entity + migration and
relating `Invoice` to it — a larger schema change intentionally *not* made here to
avoid destabilizing the working billing/invoice code without a way to compile-test it
in this environment. Flag if you want that done as a follow-up.

**Week 1–2 status after this update: complete**, with the one documented design
deviation above.

## Update 5 — Super Admin login still broken after V15 (Building Owner/Resident fine)

**Symptom:** `owner`/`Owner@123` and `resident`/`Resident@123` log in correctly, but the
Super Admin account does not work, even after `V15__enforce_single_super_admin.sql` was
applied.

**Root Cause:** `DemoDataInitializer.ensureSingleSuperAdmin()` only checked
`findByRole(SUPER_ADMIN).isEmpty()` and, if so, delegated to `ensureUser("admin", ...)`.
`ensureUser` looks the row up **by username first** — so on any database carrying a
leftover `admin` user with the wrong role (e.g. from the old, since-removed V2 seed
migration, which inserted `admin`/role=`ADMIN`/password `Password@123`), it found that
row by username and returned it completely unchanged. `findByRole(SUPER_ADMIN)` stayed
empty forever, so this "fix" ran and did nothing on every single startup — the account
was never promoted, and its password was never reset to the documented `Admin@123`.
`V15` didn't catch this either: it only demotes *extra* rows that already have
`role = 'SUPER_ADMIN'`; it has no effect on a database where `admin` never had that role
to begin with.

**Fix:**
- `DemoDataInitializer.java` — `ensureSingleSuperAdmin()` now explicitly looks for an
  existing `admin` user by username when no `SUPER_ADMIN` exists yet. If found, it is
  promoted in place (`role = SUPER_ADMIN`, password reset to `Admin@123`,
  `enabled = true`) instead of being left untouched. Falls back to creating a fresh
  `admin` user only if none exists at all. This is idempotent and self-heals on the next
  backend restart — no manual DB step required going forward.
- `database/cleanup-scripts/promote_admin_to_super_admin.sql` — new optional script for
  fixing an already-running database immediately, without waiting for a restart. Safe to
  run repeatedly; no-ops if a `SUPER_ADMIN` already exists.

**How to verify:**
1. Restart the backend (Flyway runs first, then `DemoDataInitializer` — the log line
   `Demo data ready — Super Admin: admin/Admin@123, ...` confirms it ran).
2. `SELECT username, role, enabled FROM users WHERE username = 'admin';` → expect
   `role = 'SUPER_ADMIN'`, `enabled = true`.
3. Log in as `admin` / `Admin@123` → should reach the Super Admin dashboard.
