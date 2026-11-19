# RELEASE REPORT — Smart Water Usage & Consumer Billing System

**Scope of this pass:** built out the missing pieces against the enterprise spec on top of the existing codebase (this was not a from-scratch build — see "What was already there" below).

---

## 1. Demo Credentials

Seeded automatically on backend startup by `DemoDataInitializer`
(`backend/.../config/DemoDataInitializer.java`), using the app's own
`BCryptPasswordEncoder` — no manual SQL required, no hand-computed hashes.

| Role | Username | Password |
|---|---|---|
| Super Admin | `admin` | `Admin@123` |
| Building Owner | `owner` | `Owner@123` |
| Resident | `resident` | `Resident@123` |

The initializer also creates one demo community, apartment ("Green Valley
Residency"), household ("A-101"), water meter, tariff plan, two usage
readings, and one invoice — so every dashboard shows real numbers instead
of empty states on first run.

The old hardcoded seed accounts (`admin`/`Password@123` as ADMIN,
`superadmin`/`SuperAdmin@123`, `ravikumar`) were removed from
`V2__seed_data.sql` / `V3__multi_tenant_foundation.sql` to avoid colliding
with the new `admin` username — the initializer is now the single source
of truth for demo data.

---

## 2. What was already there (prior work, not built in this pass)

17 backend controllers, 3 working roles (`RESIDENT`/`ADMIN`/`SUPER_ADMIN`),
JWT auth, apartment/household/resident-assignment CRUD, water meter
config, manual + CSV usage logging, tariff plans, invoice generation,
notifications, audit logs, community management, registration-request
approval flow, and a React/TS/Tailwind frontend with dashboards for all
three roles, already using React Query + dark/light mode.

## 3. Built in this pass

**Backend — new modules:**
- **Payments** — `Payment` entity/table, resident self-pay
  (`POST /residents/me/invoices/{id}/pay`) and Building-Owner manual
  collection (`POST /admin/invoices/{id}/collect`), plus payment history
  endpoints for both roles (UPI/Card/Netbanking/Cash).
- **Building Owner Analytics & Reports** — `GET /admin/analytics/revenue`,
  `/admin/analytics/water` (monthly trends + top-consuming households),
  and CSV exports `/admin/reports/invoices.csv`, `/admin/reports/usage.csv`.
- **Super Admin platform features** — `/super-admin/analytics/platform`,
  `/revenue`, `/water`; `/super-admin/system-health` (DB connectivity,
  uptime, core counts); `/super-admin/users` list/enable/disable/role-change
  (covers Building Owner Management, User Management, Role Management);
  `/super-admin/reports/apartments.csv`; and
  `POST /notifications/broadcast` for platform-wide or role-targeted
  announcements.
- Two new Flyway migrations: `V6__payments.sql`, `V7` (new notification
  type for broadcasts). `V2`/`V3` edited to remove now-superseded seed
  accounts (see §1).

**Frontend — new UI:**
- Landing page with the three role cards (Resident / Building Owner /
  Super Admin), each opening its own login screen against the same JWT
  backend, with role-mismatch protection (logging into the wrong portal
  is rejected).
- Aqua-blue glassmorphism theme layered on top of the existing dark/light
  mode support (`tailwind.config.js`, `index.css`) — applies automatically
  across the app via shared `.card`/`.btn-*`/`.input` classes, plus new
  `.glass-card`/`.glass-panel`/`.aqua-surface` utilities used on the new
  screens.
- New pages: Resident **Payments**; Building Owner **Payment Collection**,
  **Revenue Dashboard**, **Water Analytics**, **Reports**, **Settings**;
  Super Admin **Building Owner Management**, **User Management**, **Role
  Management**, **Platform/Revenue/Water Analytics**, **Reports**,
  **System Health**, **Global Notifications**, **Settings**.
- Recharts-based trend charts, a shared `KpiCard`, and a shared
  `PlatformUsersTable` reused across the three Super Admin people-management
  screens.
- Sidebar and routing updated for all of the above, scoped per role.

---

## 4. Build verification — read this before assuming a green CI run

**I could not run `mvn` or `npm install`/`npm run build` in this
environment — it has no network access, and neither the Maven nor npm
dependency caches were present in the sandbox.** I did not fabricate a
build log. What I *did* do instead, for every new file:

- Cross-checked every new repository/service method call against the
  actual method signatures already in your codebase (not assumed from
  memory) — e.g. confirmed `ResidentAssignmentRepository
  .findByHouseholdIdAndActiveTrue`, `AuditLogService.record(...)`,
  `NotificationService.notify(...)`, entity field names on `Payment`,
  `Invoice`, `Household`, etc., before writing code against them.
- Confirmed frontend types/services against the real `ApiResponse`,
  `PageResponse`, `UserProfile`, `Invoice` shapes and the existing
  `axiosClient` base URL convention, rather than guessing.
- Traced every new route through `App.tsx` → `ProtectedRoute` → role
  guard → lazy import to make sure paths and imports line up.

This gives high confidence the code is *structurally* correct, but it is
**not the same as a compiler/bundler actually running.** If you build
this with network access and hit a stray typo or import mismatch, that's
expected residual risk I couldn't eliminate without a real build — please
paste me the error and I'll fix it immediately.

**Known gaps / things I did not implement:**
- PDF/Excel export — only CSV was implemented (opens natively in
  Excel/Sheets; PDF/Excel would need an added library and network access
  to fetch it).
- A few older shared components (`EmptyState`, `ErrorBanner`,
  `LoadingSpinner`) don't yet have dark-mode variants — cosmetically
  minor, functionally unaffected.
- Owner/Super Admin "Settings" notification toggles are UI-only in this
  pass (not persisted to a backend endpoint).

---

## 5. Fixes from a real `mvn test` run

You ran the actual build and sent back the failures — that's exactly the
kind of ground truth I can't get in this sandbox. Two distinct issues:

1. **`AuthServiceTest.login_...` NPE — pre-existing, not introduced by this
   pass.** `AuthService` already depended on `TenantAccessService` (from
   earlier multi-tenant work), but the unit test's `@Mock` list was never
   updated to include it, so `@InjectMocks` left it `null`. Fixed by
   mocking it and stubbing `isCommunitySuspended(...)` to return `false`.

2. **All `@SpringBootTest` integration tests failing to load the
   `ApplicationContext` — this one was mine, two compounding causes:**
   - `DemoDataInitializer` (my new `CommandLineRunner`) had no profile
     guard, so it also ran during integration tests. Fixed with
     `@Profile("!test")`.
   - More importantly: two new `WaterUsageLogRepository` queries used
     `FUNCTION('to_char', w.readingDate, 'YYYY-MM')` to group consumption
     by month. Spring Data JPA validates `@Query` JPQL at repository-proxy
     creation time — i.e. at context startup — and H2 (used in the test
     profile) doesn't register `to_char` the way Hibernate's function
     registry expects, which would fail context load for every
     `@SpringBootTest`. Removed the dialect-specific function entirely;
     monthly consumption is now aggregated in Java from a plain
     `ORDER BY readingDate` query, so it's portable across H2 and
     Postgres and carries no startup-time SQL-dialect risk.

I re-verified there are no other `FUNCTION(...)` calls anywhere in the
new code, and no leftover references to the two removed repository
methods.

3. **All register calls failing with 500 — pre-existing, not introduced
   by this pass, and not something my earlier two fixes touched.** The
   real stack trace showed Hibernate generating `insert into users (...)
   returning id` against the H2 test database, which doesn't accept that
   syntax — a Postgres `RETURNING`-clause INSERT running against H2.
   Root cause: `application.properties` sets
   `spring.jpa.properties.hibernate.dialect=...PostgreSQLDialect`, while
   `application-test.properties` only overrode the different key
   `spring.jpa.database-platform=...H2Dialect`. Since they're different
   property keys, Spring Boot doesn't treat one as overriding the other —
   both got merged in, and Hibernate read the explicit
   `hibernate.dialect=PostgreSQLDialect` regardless of the test profile.
   Fixed by adding `spring.jpa.properties.hibernate.dialect=
   org.hibernate.dialect.H2Dialect` to `application-test.properties` —
   the exact same key as the main config, so the test profile now
   actually wins.

I also caught the *other* bug your log surfaced along the way — the
`register_returns400_whenPasswordDoesNotMeetComplexityRules` test failing
on `$.success` — this is unrelated to the 500s above.
`GlobalExceptionHandler` returns error responses shaped as `ApiError`
(`status`/`error`/`message`/`path`/`details`), while success responses
use the differently-shaped `ApiResponse` (`success`/`message`/`data`).
The frontend's error parser already depends on `ApiError`'s
`message`/`details` fields, so rather than restructure it, I added the
missing `success: false` field directly to `ApiError`.

## 6. Database changes

- `V6__payments.sql` — new `payments` table (invoice_id, amount, method,
  transaction_ref, paid_by_user_id, collected_by_user_id, paid_at).
- `V7__notification_type_global_announcement.sql` — widens the
  `notifications.type` CHECK constraint to allow `GLOBAL_ANNOUNCEMENT`.
- `V2__seed_data.sql`, `V3__multi_tenant_foundation.sql` — hardcoded demo
  user inserts removed in favor of `DemoDataInitializer` (see §1).
