# Audit / hardening pass — 2026-08-19

Scope: security audit, Docker Compose, build/test verification. This was a
focused pass, not the full 21-phase production-hardening spec — see the
evidence table below for what remains.

## Verified (executed, not just read)

- `npm install` — clean, 287 packages.
- `npx tsc -b` — 0 type errors.
- `npx vite build` — succeeds, produces `dist/`.
- `mvn compile` — **fails**: Maven Central is unreachable from this
  environment (403 Forbidden through the sandbox's network policy). Backend
  was never compiled or test-run here. Run locally: `cd backend && mvn clean test`.
- `npx eslint .` — fails: no `eslint.config.js` exists in the repo at all.
  Not created in this pass (would need new devDependencies not currently in
  `package.json`); flagging as a real, confirmed gap.

## Security fixes (found by reading the actual source, not assumed)

1. **Hardcoded JWT fallback secret** (`application.properties`): the
   `${JWT_SECRET:...}` default was a fixed string committed to source
   control. Any deployment that forgot to set `JWT_SECRET` would sign every
   token with a key visible in the public repo. Added
   `JwtSecretStartupValidator` (`@Profile("prod")`) that refuses to boot if
   the secret is still the default or under 32 bytes. Not compiled/verified
   locally — same Maven Central block.

2. **IDOR — water usage logs** (`WaterUsageLogController` /
   `WaterUsageLogService`): `POST /usage`, `GET /usage/household/{id}`, and
   `GET /usage/household/{id}/range` had no ownership check at all — any
   authenticated user, including RESIDENT, could read or fabricate another
   household's meter readings by changing the ID. Fixed with a new shared
   `HouseholdAccessGuard` (SUPER_ADMIN: any household; ADMIN: only
   apartments they administer; RESIDENT: only their own active assignment),
   the same rule already used correctly for invoice PDF downloads.

3. **IDOR — household lookup** (`HouseholdController` / `HouseholdService`):
   `GET /households` and `GET /households/apartment/{id}` let any
   authenticated user (including RESIDENT) enumerate every household across
   every apartment on the platform. Restricted to `ADMIN`/`SUPER_ADMIN`.
   `GET /households/{id}` now goes through `HouseholdAccessGuard` instead of
   returning any household to anyone.

4. **IDOR — meter config** (`WaterMeterConfigController` /
   `WaterMeterConfigService`): same pattern, same fix — `getAll` restricted
   to staff roles, `getByHousehold` now ownership-checked.

5. **IDOR — resident assignments** (`ResidentAssignmentController`):
   `GET /resident-assignments/household/{id}` and `.../user/{id}` had no
   role check while every other endpoint on the same controller was already
   `ADMIN`-only — restricted these two to match.

   Confirmed via frontend grep that no resident-facing code path calls any
   of the now-restricted endpoints (residents already go through
   `ResidentSelfController` / `residentService.ts`), so this does not remove
   working functionality.

6. **Missing `/actuator/health`**: `SecurityConfig` already whitelisted this
   path as public, but `spring-boot-starter-actuator` was never added to
   `pom.xml`, so the endpoint 404'd. Added the starter +
   `management.endpoints.web.exposure.include=health` (health only, not the
   full actuator surface). Used by the new Docker Compose healthcheck.

None of these were compiled locally — Maven Central is blocked in this
sandbox. Run `mvn clean test` locally before deploying.

## Infrastructure added (previously missing entirely — confirmed by search)

- `docker-compose.yml` — Postgres + backend + frontend, health-based startup
  ordering (backend waits for Postgres to be healthy, frontend waits for
  backend), no hardcoded credentials (all via `.env`).
- `backend/Dockerfile` — multi-stage Maven build → slim JRE 21 runtime.
- `frontend/Dockerfile` + `frontend/nginx.conf` — multi-stage Vite build →
  nginx, SPA fallback routing, `/api` and `/photos` reverse-proxied to the
  backend container.
- `.env.example` — every variable documented, no secrets filled in.
- Not run: Docker isn't available in this sandbox, so `docker compose up`
  itself is unverified. Files are written to the same config keys the
  Spring Boot app already reads (`DB_URL`, `JWT_SECRET`, etc.) — verify
  locally with `docker compose up --build`.

## Not attempted this pass (see prior response for the full list)

UI/UX redesign of the 20 remaining pages, responsive/accessibility QA,
browser QA, load testing, live SMTP delivery, live PostgreSQL connection,
payments/alerts/reports functional review, settings persistence question
(Phase 17).
