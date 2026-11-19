# Alert & Notification Engine — Progress Snapshot (feature-complete, backend build UNVERIFIED)

All planned Week 3-4 Alert & Notification Engine work is now written. See
"What is NOT verified" below before treating this as a merge-ready deliverable
— the backend has not actually been compiled/run in this environment.

## What IS implemented

### Backend logic (unchanged from the previous checkpoint)
1. `backend/src/main/resources/db/migration/V14__alert_notification_engine.sql`
2. `entity/NotificationSeverity.java`, extended `entity/NotificationType.java`
3. Extended `entity/Notification.java` (nullable household/apartment/relatedUsageLog/billingMonth/severity)
4. `entity/ApartmentAlertConfig.java` + `repository/ApartmentAlertConfigRepository.java`
5. `repository/NotificationRepository.java` (dedup check, markAsRead, search, searchByApartment)
6. `dto/notification/NotificationResponse.java` + `mapper/NotificationMapper.java`
7. `config/AlertProperties.java` (`app.alert.*`, env-overridable) + `@EnableScheduling`
8. `service/UsageStatisticsCalculator.java` — mean / sample-stddev helper
9. `service/AlertEngineService.java` — the `@Scheduled` job: threshold rule + 2-sigma anomaly
   rule, per-apartment override resolution via `ApartmentAlertConfig`, dedup-guarded, notifies
   every active resident + the apartment admin. `evaluateAllHouseholds()` is callable standalone.
10. `service/AlertThresholdConfigService.java` + `controller/AlertThresholdConfigController.java`
    — `/api/v1/apartments/{apartmentId}/alert-config` GET/PUT, ownership-checked.
11. `service/NotificationService.java` extended: `notifyAlert`, `alertAlreadySent`, `markAsRead`,
    `search`, `searchByApartment` (all additive; existing methods untouched).
12. `controller/NotificationController.java` extended: `PUT /{id}/read`, `GET /search`,
    `GET /apartment/{apartmentId}`.

### Tests — this checkpoint
13. `UsageStatisticsCalculatorTest` — mean/stddev correctness, edge cases. **Complete.**
14. `AlertEngineServiceTest` — threshold/anomaly firing, dedup, overrides, disabled/unmetered
    skips. **Complete.** (Fixed a compile bug from the prior checkpoint: the seeded
    `ResidentAssignment` used `RelationType.OWNER`, which doesn't exist on the `RelationType`
    enum — only `PRIMARY`/`MEMBER` do. Changed to `RelationType.PRIMARY`.)
15. `NotificationServiceTest` (new) — `markAsRead` (owned / not-owned), `search` (filtered /
    unfiltered), `searchByApartment` (success, wrong-admin, apartment-with-no-admin,
    apartment-not-found).
16. `AlertThresholdConfigServiceTest` (new) — `getForApartment` (platform defaults vs override,
    unauthorized, not-found), `upsert` (create, update-in-place, default-enabled-to-true,
    explicit-disable, unauthorized). Uses `ArgumentCaptor` to assert exactly what gets persisted.
17. `AlertEngineIntegrationTest` (new, `integration/`) — full `@SpringBootTest` against H2:
    seeds an apartment/admin/household/resident/8-days-of-usage-history directly through the
    repositories, calls `AlertEngineService.evaluateAllHouseholds()` the same way the
    `@Scheduled` job would, then verifies the resulting alerts through the real
    `GET /api/v1/notifications`, `GET /api/v1/notifications/apartment/{id}`,
    `GET /api/v1/notifications/search`, and `PUT /api/v1/notifications/{id}/read` endpoints
    using JWTs minted via `JwtService` for both the resident and the admin. Also asserts a
    second run raises zero new alerts (dedup).

### Frontend — this checkpoint
18. `utils/types.ts` — `NotificationItem` extended with `severity`, `householdId`/
    `householdUnitNumber`, `apartmentId`/`apartmentName`, `relatedUsageLogId`, `billingMonth`;
    added `NotificationSeverity` and `NotificationSearchParams`.
19. `services/notificationService.ts` — added `markOneRead(id)`, `search(params)`,
    `listByApartment(apartmentId, params)`.
20. `hooks/useDashboardExtras.ts` — added `useMarkNotificationRead`, `useNotificationSearch`,
    `useApartmentNotifications` (React Query, with query-key invalidation matching the existing
    `useMarkAllNotificationsRead` pattern).
21. `components/common/StatusBadge.tsx` — added `INFO`/`WARNING`/`CRITICAL` color variants,
    reused as the severity badge (no new component needed).
22. `pages/notifications/NotificationsPage.tsx` — severity badge, unit number, per-notification
    "Mark read" button (only shown when unread).
23. `components/layout/NotificationBell.tsx` — severity badges in the dropdown; clicking an
    unread item now marks it read via `useMarkNotificationRead`.

## What is NOT verified

- **Frontend build: verified in this environment.** `npm install`, `npx tsc -b`, and
  `npm run build` (Vite) all ran clean here — npm's registry is reachable. No type errors, no
  build failures.
- **Backend build: still not run.** This sandbox has no route to Maven Central
  (`repo.maven.apache.org` returns 403 through the egress proxy; only npm/pip/crates/GitHub
  registries are reachable here), so `mvn clean test / install / spring-boot:run` has not
  actually been executed — not for the new code, and not for the pre-existing backend either.
  All of the Java above was written and reviewed by hand against the existing codebase's exact
  conventions (entity/repository/service/controller/test patterns, exception types,
  `ApiResponse`/`PageResponse` envelopes, `@PreAuthorize`/ownership idioms, Mockito style from
  `ApartmentServiceTest`, MockMvc/JWT style from `ApartmentHouseholdIntegrationTest`), and every
  field/method reference was cross-checked against the real entity, repository, DTO, and
  security classes it depends on. Treat the Java as unverified until you run the Maven build
  yourself.

## Next step (if the Maven build surfaces anything)

Reply with the `mvn clean test` output (or `spring-boot:run` stack trace) and I'll fix it in
place — this is a complete pass over the checklist, not a partial checkpoint, so any remaining
work should just be build-error fixes rather than missing features.

## This checkpoint: email notifications wired in

The previous checkpoint above implemented everything except the actual outbound email send
(spec section 15 / 5.7). This pass adds it:

- `pom.xml` — added `spring-boot-starter-mail`.
- `config/AlertProperties.java` — new `emailEnabled` field (`app.alert.email-enabled`,
  default `false`).
- `application.properties` — `spring.mail.*` (host/port/username/password, all env-overridable,
  all blank/safe by default) + `mail.from` + `app.alert.email-enabled`.
- `service/EmailNotificationService.java` (new) — thin wrapper around `JavaMailSender`. No-ops
  (with a debug log) unless `app.alert.email-enabled=true` **and** `spring.mail.host` is set
  **and** the recipient has an email address; any send exception is caught and logged as a
  warning, never propagated. `spring-boot-starter-mail` auto-configures a `JavaMailSenderImpl`
  bean even with no host set, so the app starts fine with zero mail config either way.
- `service/AlertEngineService.java` — calls `emailNotificationService.sendAlertEmail(...)`
  alongside `notificationService.notifyAlert(...)` for every resident + the apartment admin;
  added `log.info`/`log.debug` lines for alert-generated / duplicate-skipped (email
  sent/failed is logged inside `EmailNotificationService` itself).
- `AlertEngineServiceTest.java` — added the new `EmailNotificationService` mock to the
  constructor call so the existing test still compiles.

### Still not verified in this environment

This sandbox has no outbound network access at all (not just to Maven Central — bash_tool's
network is disabled entirely here), so **no `mvn` command has been run** against this
checkpoint's changes. Every reference above was checked by hand against the real
`AlertProperties`/`User`/entity classes it touches (in particular `User.getEmail()`, the
`JavaMailSender`/`spring-boot-starter-mail` auto-configuration behavior, and the
`AlertEngineServiceTest` constructor signature), but treat it as unverified until `mvn clean
test` / `mvn spring-boot:run` actually runs. If that surfaces anything, share the output and
it can be fixed directly — this is believed to be a complete pass, not a partial one.

## This checkpoint: admin-facing UI for apartment-wide alerts + threshold config

Previously the only alert-related frontend page was the shared `/notifications` (personal
inbox). The backend already had `GET /notifications/apartment/{id}` and
`GET/PUT /apartments/{id}/alert-config`, but nothing in the React app called them. Added:

- `utils/types.ts` — `AlertThresholdConfig`, `AlertThresholdConfigPayload`.
- `services/alertConfigService.ts` (new) — `get`/`update` for the per-apartment threshold API.
- `hooks/useDashboardExtras.ts` — added `useAlertConfig`, `useUpdateAlertConfig` (the existing
  `useApartmentNotifications` hook was already there but unused by any page — now it's used).
- `pages/admin/AlertsPage.tsx` (new) — Building Owner/Admin page with two sections: (1) a
  threshold-override form (daily kL threshold, anomaly std-dev multiplier, min history
  readings, enabled toggle — blank = platform default, matches the `effective*` fields the
  backend already returns), and (2) the apartment-wide alert feed (every household's alerts,
  not just the admin's own copy), reusing the existing `StatusBadge`/`EmptyState`/
  `LoadingSpinner`/`ErrorBanner` components and `input`/`card`/`btn-primary` CSS classes for
  visual consistency with the rest of the app. Apartment is resolved from
  `apartments.filter(a => a.adminId === user.id)` (there's no "my apartment" endpoint; admins
  match apartments by `adminId`, same pattern the rest of the app already relies on).
- `App.tsx` — added the `/alerts` route (admin-only, same guarded route group as
  `/water-analytics` etc.).
- `components/layout/Sidebar.tsx` — added a "Water Usage Alerts" nav item for the `ADMIN` role.

### Not verified

Same caveat as above: no network in this sandbox means `npm install` / `npx tsc -b` /
`npm run build` were not run against this change (no `node_modules` present, nothing to type-
check against). Reviewed by hand against the actual `Apartment`/`NotificationItem`/`ApiResponse`
types and every existing hook/service/component it imports. Run the frontend build yourself and
report back if anything doesn't compile.

## This checkpoint: demo-friendly default cron

`app.alert.cron` default changed from `0 0 6 * * *` (once daily at 6 AM) to `0 * * * * *`
(once every minute), so the scheduler visibly fires within the first minute of the app
running — useful for demos/mentor review without needing the manual "Run Alert Check Now"
trigger or an hours-long wait. Still fully overridable via the `ALERT_ENGINE_CRON` env var
with zero code changes either way.

**Before real/production use**, set `ALERT_ENGINE_CRON=0 0 6 * * *` (or whatever real
schedule is wanted) via environment variable, or change the default back in
`application.properties` — running every minute forever is harmless (dedup prevents
duplicate alerts) but wasteful.

## Bugfix: scheduled alert run threw LazyInitializationException

**Symptom (confirmed via real `mvn spring-boot:run` log against Postgres):** the manual
`POST /api/v1/notifications/run-alert-check` path and the integration test both worked, but the
actual `@Scheduled` cron run crashed every time a threshold/anomaly alert needed to notify an
apartment admin:

```
org.hibernate.LazyInitializationException: could not initialize proxy [Apartment#1] - no Session
  at AlertEngineService.raiseAlert -> apartment.getAdmin()
```

**Root cause:** classic Spring AOP self-invocation bug. `runScheduledCheck()` (the `@Scheduled`
entry point) called `evaluateAllHouseholds()` directly on `this`. `@Transactional` only takes
effect when a method is invoked *through the Spring proxy*; calling it from inside the same
class bypasses the proxy, so no transaction/Hibernate session was ever opened for the scheduled
path. The first `apartment.getAdmin()` lazy-load (needed to notify the admin) then failed with
no session, and the whole run rolled back — which is why the app logged "alert generated" and
then immediately errored, with every alert lost.

The manual controller endpoint and the integration test never hit this because they call
`evaluateAllHouseholds()` from *outside* the class, through the real Spring-managed proxy, so
`@Transactional` applied correctly there.

**Fix:** added `@Transactional` directly to `runScheduledCheck()` as well
(`service/AlertEngineService.java`, ~line 55-57), so the scheduler opens a session before
calling into `evaluateAllHouseholds()`, and that session stays open through the whole
evaluate → raiseAlert → lazy-load chain.

```java
@Scheduled(cron = "${app.alert.cron}")
@Transactional
public void runScheduledCheck() {
    ...
}
```

Verified by re-reading the patched method; re-run `mvn clean install` /
`mvn spring-boot:run` yourself and confirm the scheduler completes cleanly (no
LazyInitializationException) once usage data crosses the threshold.

## Merge: Week 5-6 onto the SUPERADMIN-FIXED base

The user provided a separately-fixed base (Smart-Water-Usage-System-SUPERADMIN-FIXED.zip)
containing genuine Super Admin bug fixes made after the original Week 5-6 work was done:
`config/DemoDataInitializer.java`, `service/AuthService.java`, `service/PlatformUserService.java`,
`db/migration/V3__multi_tenant_foundation.sql` (this explains the earlier Flyway V3
checksum-mismatch error -- the migration content legitimately changed), a new
`config/FlywayConfig.java`, a new `V15__enforce_single_super_admin.sql` migration, and a
frontend fix in `components/platform/PlatformUsersTable.tsx` (excludes SUPER_ADMIN from
assignable roles in Role Management).

All of Week 5-6 (Phases 1-3) was re-applied on top of this base. Every file touched by
Week 5-6 was diffed against this base first to confirm none of the above Super Admin fixes
lived in the same files as my Week 5-6 changes before overwriting -- confirmed clean in every
case (the diffs were purely "my week 5-6 additions are missing here", nothing else). The
4 backend + 1 frontend Super Admin-fix files listed above were left completely untouched.

Verification for this merge: a project-wide brace-balance check across every .java file in
the backend (all OK), a `tsc --noEmit` syntax check across every new/changed frontend file
(clean), and `pom.xml` confirmed well-formed XML with the PDFBox dependency present. Same
caveat as every prior phase: no `mvn`/`npm install` access in this sandbox, so this is still
static verification, not a real build. Run `mvn clean install` and `npm install && npm run
dev` yourself -- if the Flyway V3 checksum issue recurs, it means your local database still
has the OLD V3 checksum from before the Super Admin fix; drop and recreate the local
database (see prior guidance in this doc) to pick up the corrected V3 file cleanly.
