# Smart Water Usage & Consumer Billing System — Merged Final Project

One production-ready project combining the verified backend with the latest
frontend and documentation. Three roles: Resident, Building Owner/Admin,
Super Admin.

## What was merged

**Backend** — taken entirely from `Smart-Water-Usage-System-Backend-FIXED.zip`
(232 of 236 files were byte-identical between the two zips, so the "FIXED"
backend was used as-is rather than hand-merged file by file). It is a superset
of the second zip's backend:

- All 13 Flyway migrations (`V1`–`V13`), including `V13__fix_cost_allocation_audit_columns.sql`,
  which the second zip's backend did not have. This migration fixes a real
  Hibernate schema-validation failure (`missing column [updated_at] in table
  [household_cost_allocations]`) — see `backend/README_FIX_V13.md`.
- `SecurityConfig.java`'s CORS setup reads allowed origins from the
  `app.cors.allowed-origins` property (env-overridable via `CORS_ALLOWED_ORIGINS`)
  instead of the wildcard `*` pattern the second zip's backend used.
- The resident "My Household" `LazyInitializationException` fix (mapping
  moved into the transactional service layer) — documented in
  `docs/FIX_NOTES.md`, carried over from the second zip's history and already
  present in the FIXED backend.

No other backend files differed between the two zips, so there were no
further conflicts to resolve and nothing from the second zip's backend was
merged in beyond what FIXED already contained.

**Frontend** — taken from `Smart-Water-Usage-System-Week3-4-Modules1-2-3-6.zip`
(the FIXED zip contained no frontend). It's a complete React 19 + TypeScript +
Tailwind + Vite app with all three role dashboards, JWT auth with refresh-token
handling, and API services matching every backend controller
(`/api/v1/auth`, `/apartments`, `/households`, `/usage`, `/admin/*`,
`/super-admin/*`, `/residents/me`, `/registration-requests`, `/notifications`,
`/payments`, `/meter-configs`, `/files`, `/profile`). `VITE_API_BASE_URL`
defaults to `http://localhost:8080/api/v1`, matching the backend's port and
`@RequestMapping` prefixes exactly.

**Fixed during merge** — `npm run build` on the second zip's frontend failed
with 3 TypeScript errors. These were bugs in that zip, not integration issues,
so they were corrected rather than carried forward:

- `App.tsx` — removed an unused `Navigate` import (TS6133).
- `MonthlyTrendChart.tsx` — the Recharts v3 `Tooltip` `formatter` prop no
  longer types its `value` argument as `number`; widened the parameter and
  coerced with `Number(value ?? 0)` (TS2322).
- `AuthContext.tsx` — `refreshProfile` was typed `() => Promise<void>` but
  assigned a function returning `Promise<UserProfile | null>`; widened the
  interface to match what it actually returns (TS2322).

The build is clean after these fixes (verified with `npm install && npm run build`
in this sandbox).

**Docs** — `docs/` holds `PROJECT_DOCUMENTATION.md`, `ARCHITECTURE.md`,
`API_REFERENCE.md`, `SETUP_GUIDE.md`, `FIX_NOTES.md`, `RELEASE_REPORT.md`,
`PHASE1_NOTES.md` from the second zip, plus `backend/README_FIX_V13.md` and
`backend/CHANGELOG.md` from the FIXED backend. The second zip also shipped a
standalone `database/migrations/` folder that was a stale duplicate (missing
`V9`–`V13`, and older `V2`/`V3` versions) — it was dropped. The authoritative
migrations are `backend/src/main/resources/db/migration/`, which Flyway
applies automatically; `database/README.md` was kept for its schema overview.

## Known limitation of this merge pass

This sandbox has no Maven and no access to Maven Central, so `mvn clean
install` / `mvn test` / `mvn spring-boot:run` could not actually be executed
here. In their place: every backend `.java` file was checked for balanced
braces, correct `package`-to-directory alignment, and no duplicate class
names (all clean); the Flyway migration sequence was confirmed gap-free
(`V1`–`V13`); and every frontend service's request path was checked against
the corresponding controller's `@RequestMapping`. Please run the Maven
commands below yourself before deploying — the backend source itself is
unchanged from the FIXED zip you confirmed works, so this is a low-risk step,
but it hasn't been executed in this environment.

## Run it

**Backend** (Java 17, PostgreSQL 14+):
```bash
cd backend
createdb smart_water_db   # first time only
mvn clean install
mvn test
mvn spring-boot:run
```
Runs on `http://localhost:8080`, context path `/api/v1`. Override
`DB_URL` / `DB_USERNAME` / `DB_PASSWORD` / `CORS_ALLOWED_ORIGINS` via
environment variables as needed.

**Frontend** (Node 18+):
```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8080/api/v1
npm install
npm run dev             # http://localhost:5173
npm run build            # production build to dist/
```
