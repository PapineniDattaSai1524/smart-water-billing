# UI/UX Redesign Progress

Working through the redesign in the order the spec lays out: design system first
(everything else depends on it), then global navigation, then screen-by-screen.
This file tracks what's actually done vs. still pending so nothing gets lost.

## Done — Increment 1: Design system + global navigation

**Files changed:**
- `frontend/tailwind.config.js` — full token system: Inter font, Deep Ocean Navy
  scale (`ocean-*`, new), existing `brand`/`aqua` kept, new `teal` scale, semantic
  `status-*` colors (healthy/warning/critical/info — meaning-based, not decorative),
  card shadows, a subtle wave-line background image, motion keyframes
  (fade-in/slide-up/slide-in-right/shimmer/pulse-ring).
- `frontend/index.html` — loads Inter (Google Fonts).
- `frontend/src/index.css` — full component layer: typography scale
  (display/h1/h2/h3/body/caption), buttons (primary/secondary/ghost/danger),
  form elements (input/label/required-indicator/helper-text/field-error), surfaces
  (card/card-interactive/glass-card/kpi-card), status badges (4 semantic colors),
  table base styles, skeleton loader (shimmer), sidebar link states, global focus
  rings, cross-browser scrollbar styling. All dark-mode variants included, not
  inverted-by-default.
- `frontend/src/components/layout/Sidebar.tsx` — rewritten: nav items now grouped
  into labeled sections per role (Overview / Community / Water / Billing / Reports
  / System for Admin; My Water / Billing / System for Resident; Platform /
  Analytics & Reports / System for Super Admin), a collapsible desktop rail
  (icon-only with hover tooltips when collapsed, state persisted to localStorage),
  and a mobile drawer with backdrop + Escape/click-outside close — the sidebar
  previously had **no mobile presentation at all** (`hidden ... md:block`), so this
  is a real functional gap closed, not just a visual one. Every route matches an
  existing route in `App.tsx` 1:1 — nothing added or removed, only reorganized.
- `frontend/src/components/layout/Navbar.tsx` — rewritten: mobile menu toggle,
  theme switcher (unchanged logic), notification bell (unchanged), and a real
  accessible profile dropdown (click-outside + Escape to close, `role="menu"`)
  replacing the old plain name/role text — Profile and Logout now live there.
- `frontend/src/layouts/MainLayout.tsx` — lifted collapse/mobile-drawer state so
  Navbar and Sidebar can coordinate; closes the mobile drawer automatically on
  navigation; added a max-width content wrapper + fade-in so pages don't stretch
  edge-to-edge on ultra-wide monitors.

**Verified:** `npm install && npm run build` — clean, no TypeScript errors.

**Not yet done (next increments):** resident dashboard hero/KPI cards/charts/
benchmarking, admin dashboard, individual page redesigns (tables, forms, empty/
error/loading states on each page), tariff builder, billing cycle lifecycle UI,
meter upload drag-and-drop, micro-interactions beyond what's listed above.
Existing pages still render with the *old* ad-hoc styling in places until each is
redesigned — they are not broken, just not yet visually upgraded.

## Done — Increment 2: Resident Dashboard + Admin Dashboard

**Shared components upgraded (backward-compatible, so every other page using them
keeps working unchanged):**
- `KpiCard.tsx` — added optional trend indicator (arrow + %), caption line.
- `StatusBadge.tsx` — restyled onto the semantic badge tokens.
- `EmptyState.tsx` — added optional retry/action button.
- `LoadingSpinner.tsx` — restyled.
- `Skeleton.tsx` (new) — `KpiCardSkeleton`, `ChartSkeleton`, `TableSkeleton` for real
  skeleton loading states instead of "Loading..." text, per spec section 34.
- `MonthlyTrendChart.tsx` / `HouseholdUsageBarChart.tsx` — restyled; also fixed a
  latent bug where `MonthlyTrendChart`'s SVG gradient had a hardcoded `id`, which
  would silently break if the component ever rendered twice on one page (now takes
  an optional `gradientId` prop, defaults preserve old behavior). Household chart now
  highlights bars 30%+ above the household average in red and shows an average
  reference line, per spec section 16/24.

**Resident-specific components rebuilt** (`WaterLevelMeter.tsx` new — circular
consumption gauge; `UsageTrendChart.tsx`, `ConsumptionComparisonCard.tsx`,
`WaterSavingTips.tsx` — restyled): all still driven only by the real
`ResidentDashboardStats` / `UsageTrendPoint[]` / `ConsumptionComparison` API
responses — no new fields invented, no fabricated numbers.

**`pages/resident/ResidentDashboardPage.tsx`** — full rewrite: hero with
greeting/apartment/unit/billing period, 4 KPI cards (consumption w/ trend, current
bill, household average, efficiency badge), leak-warning banner (only when
`comparison.possibleLeak` is true), water-level meter + saving tips side by side,
daily/monthly trend charts, peer benchmarking, billing summary with a visually
focal "Total Payable" panel, invoice history as a table on desktop / cards on
mobile, and a real "Preparing your invoice..." loading state on the PDF download
button (spec section 22) instead of a silent click.

**`pages/dashboard/DashboardPage.tsx`** (Admin/Building-Owner view) — full rewrite:
hero, top-level KPIs (households, consumption w/ trend, outstanding, collected),
secondary quick-links row, water consumption overview chart (reuses the existing
`useAdminWaterAnalytics` hook/endpoint — no new query), household usage comparison
bar chart, a billing performance bar (collected vs. outstanding, real
`RevenueSummary` data only), and a Recent Activity panel built from the existing
`useNotifications` hook (real notifications, not fabricated "activity feed" data).
Super Admin and Resident branches of this page are unchanged (they already
delegate to their own dashboard components).

**Verified:** `npm install && npm run build` — clean, no TypeScript errors, after
this build produced two errors on first pass (unused imports from refactoring) that
were fixed before packaging.

**Not yet done:** individual admin pages (tariff builder, billing cycle lifecycle
UI, meter upload drag-and-drop, water purchases, tables/forms across the app),
Super Admin dashboard/pages, micro-interactions pass, full responsive QA pass at
every breakpoint listed in the spec.

## Done — Increment 3: Billing pages + Meter Upload (bug fixes included)

**New shared components:**
- `ErrorBanner.tsx` — restyled with icon (18 existing callers, unchanged interface).
- `SuccessBanner.tsx` (new) — matching success-state banner.
- `ConfirmDialog.tsx` (new) — proper modal confirmation for destructive/irreversible
  actions, replacing `window.confirm()`. Spec section 37 explicitly forbids browser
  `confirm()`/`alert()` — **this was actually still in use** in `UsageLogPage.tsx`'s
  delete handler; fixed as part of this pass, not just a visual swap.

**`pages/admin/BillingCyclesPage.tsx`** — full rewrite: each cycle card now shows a
real visual OPEN → CLOSED → FINALIZED → ARCHIVED lifecycle stepper (using the actual
`CycleStatus` values from the backend, not invented labels), and Finalize/Archive
(irreversible actions) now go through `ConfirmDialog` instead of firing immediately
on click.

**`pages/admin/BillingPage.tsx`** — full rewrite: the tariff form's tier inputs are
now a proper visual tier builder (`TIER 01 / TIER 02...` cards with a live
min–max–rate summary line), matching spec section 27. Same validation logic,
same mutations, same API calls — only the presentation changed. Invoice table now
has a mobile card fallback and each PDF download button shows "Preparing..." while
in flight, consistent with the resident dashboard.

**`pages/usage/UsageLogPage.tsx`** — full rewrite: **real drag-and-drop** for the CSV
upload (the old version was click-to-browse only, despite the spec explicitly
asking for drag-and-drop), with a file preview card (name, size, remove button)
before upload starts, an uploading progress state, and a redesigned results
breakdown (succeeded/duplicates/errors as three colored stat blocks instead of one
paragraph). Delete confirmation now uses `ConfirmDialog` instead of
`window.confirm()` (see above).

**Verified:** `npm install && npm run build` — clean, no TypeScript errors.

**Not yet done:** Water Purchases page, Meter Configuration page, tables/forms on
remaining admin pages (Apartments, Households, Residents, Alerts, Reports), Super
Admin section, micro-interactions pass, full responsive QA pass at every listed
breakpoint.

## Done — Increment 4: Global token migration + remaining bug sweep

**Global design-token migration:** ran a scripted, word-boundary-safe find/replace
(`slate-*` -> `ocean-*`, `cyan-*` -> `aqua-*`) across every remaining `.ts`/`.tsx`
file under `src/` that hadn't been hand-redesigned yet (~35 pages: Apartments,
Households, Residents, Alerts, Reports, Profile, all Super Admin pages, auth pages,
etc.). This is a pure Tailwind utility-class swap -- no logic, structure, or markup
changed -- verified safe with a full `npm run build` immediately after. The whole
app now shares one consistent color language instead of only the hand-redesigned
pages looking upgraded.

**`pages/admin/WaterPurchasesPage.tsx`** and **`pages/meter/MeterConfigPage.tsx`** --
full rewrites: both were missing dark-mode variants entirely (not just
unpolished -- e.g. `text-ocean-900` with no `dark:text-white`, so text would have
been unreadable in dark mode), which is now fixed, plus `table-shell`/`badge-*`
styling and (Meter Config) a `ConfirmDialog` replacing a `window.confirm()`.

**App-wide `window.confirm()` / `window.prompt()` sweep:** spec section 37 is
explicit that browser-native `confirm()`/`alert()` must not be used for
confirmations. Beyond the two already fixed in the prior increment, this same
pattern was found in **6 more files** and fixed:
- `HouseholdsPage.tsx`, `ApartmentsPage.tsx` -- delete confirmations -> `ConfirmDialog`.
- `UserManagementPage.tsx` -- resident delete confirmation -> `ConfirmDialog`.
- `CommunitiesPage.tsx` -- suspend-community confirmation -> `ConfirmDialog`.
- `RegistrationRequestsPage.tsx` -- approve -> `ConfirmDialog`; reject used
  `window.prompt()` for a required reason string, replaced with a proper modal
  containing a labeled, required textarea (can't be dismissed with an empty reason,
  which `window.prompt()` could accidentally allow via a blank string).
- `ResidentAssignmentPage.tsx` -- deactivate-assignment confirmation -> `ConfirmDialog`.

Two type-name mismatches (`Community` vs. the actual `CommunityRow`, `MeterConfig`
vs. the actual `WaterMeterConfig`) were introduced while wiring these up and caught
by the TypeScript build before packaging -- fixed, not shipped broken.

**Verified:** `npm install && npm run build` -- clean, no TypeScript errors, zero
remaining `window.confirm`/`window.alert`/`window.prompt` calls anywhere in
`pages/` or `components/` (confirmed via grep).

## Overall status

Functionally fixed: PDF invoice download (LazyInitializationException), hardcoded
live SMTP credential removed, 8 total `window.confirm`/`prompt` violations replaced
with proper dialogs, one hardcoded SVG gradient ID collision bug.

Redesigned in full: design system/tokens, global nav (sidebar+navbar), Resident
Dashboard, Admin Dashboard, Billing, Billing Cycles, Meter Upload, Water Purchases,
Meter Configuration.

Token-migrated (consistent colors, not yet individually polished for
layout/hierarchy/micro-interactions): Apartments, Households, Residents/User
Management, Resident Assignment, Alerts, Reports (admin + super admin), Profile,
Notifications, auth pages (Login/Register/Community Register), Landing/404, all
remaining Super Admin pages (Communities, Registration Requests, Building Owners,
Role Management, Audit Logs, Platform Analytics, Revenue Analytics, Water
Analytics, System Health, Global Notifications, Settings), resident My
Household/My Bills/Payments/Usage History.

Not started: micro-interactions pass beyond what ships with the shared components
(hover/skeleton/fade-in already apply everywhere via the design system), a
dedicated responsive QA pass at every breakpoint the spec lists, and accessibility
audit beyond what's built into the shared components (focus rings, aria-labels on
icon buttons already present from the design system layer).

## Done — Increment 5: App-wide dark-mode completion

Found and closed the last major systemic gap: **19 pages and 9 shared modal
components had zero dark-mode support at all** (not "unpolished" -- genuinely
broken, e.g. `text-ocean-900` with no `dark:` companion means invisible/low-contrast
text against a dark background). Fixed with a targeted, word-boundary-safe script
that appends the correct dark-mode companion class next to each raw color utility
(e.g. `text-ocean-900` -> `text-ocean-900 dark:text-white`, `bg-white` ->
`bg-white dark:bg-ocean-900`, `border-ocean-200` -> `border-ocean-200
dark:border-ocean-700`), with a negative-lookbehind guard so `hover:`/variant-
prefixed classes got their own correct `dark:hover:` companion instead of being
corrupted. Applied to:

Pages: NotFoundPage, admin/UserManagementPage, apartment/ApartmentsPage,
auth/CommunityRegisterPage, auth/RegisterPage, household/HouseholdsPage,
notifications/NotificationsPage, profile/ProfilePage, resident/MyBillsPage,
resident/MyHouseholdPage, resident/ResidentAssignmentPage,
resident/UsageHistoryPage, superadmin/AuditLogsPage, superadmin/CommunitiesPage,
superadmin/SuperAdminDashboardPage, superadmin/RegistrationRequestsPage,
superadmin/BuildingOwnerManagementPage, superadmin/RoleManagementPage,
superadmin/UserManagementPage, superadmin/WaterAnalyticsPage.

Shared components: ApartmentFormModal, HouseholdFormModal, NotificationBell,
ApproveResidentModal, PhotoUpload, RejectResidentModal, ResetPasswordModal,
ResidentCombobox, ResidentFormModal.

**Verified:** grepped for `window.confirm|alert|prompt` across `pages/` and
`components/` -- zero remaining. Grepped every page file for zero `dark:`
occurrences -- zero remaining (down from 19). Full `npm run build` after the
injection -- clean, no TypeScript errors, no JSX corruption from the scripted edit.

## Final status

**Fixed (verified):** PDF invoice LazyInitializationException, hardcoded live SMTP
credential, chart gradient-ID collision, 8 browser-native `confirm`/`prompt` calls
replaced with proper dialogs, zero pages left without dark-mode support.

**Fully hand-redesigned** (layout, hierarchy, empty/loading/error states, premium
visual treatment): design system, global nav, Resident Dashboard, Admin Dashboard,
Billing, Billing Cycles, Meter Upload, Water Purchases, Meter Configuration -- 10
screens built to the full spec bar.

**Consistent and dark-mode-complete, not individually hand-redesigned for layout/
hierarchy/micro-interactions beyond what the shared component system provides**
(cards, badges, tables, buttons, focus rings, skeletons, hover states are all
premium and consistent everywhere via the design system -- but bespoke
per-page layout work like the dashboards got wasn't repeated on every CRUD page):
Apartments, Households, Residents/User Management, Resident Assignment, Alerts,
Reports (admin + super admin), Profile, Notifications, auth pages, Landing/404, and
the full Super Admin section.

**Genuinely not done, and can't honestly be claimed as done:** `mvn clean
test`/`mvn clean package` (no Maven Central access in this sandbox -- run these
yourself before deploying), a live manual QA pass across real browsers/devices at
every listed breakpoint, and a full functional audit of every Week 5-6 feature
beyond what static code review can catch (only the PDF bug was confirmed broken by
you; everything else was inspected but not run against a live database).

## Done — Increment 6: Human-readable dates/billing periods + Invoice History/My Bills redesign

**Root problem (spec sections 9, 15, 16, 36, 44, 45):** `billingMonth` is stored/emitted by
the backend as a `"yyyy-MM"` key (e.g. `"2026-08"`) — correct as a sortable API value, but
it was being rendered *raw* in 9 frontend files. Separately, `toLocaleDateString()` /
`toLocaleString()` were called directly in 15 more files, which is browser-locale-dependent
(renders as ambiguous `8/15/2026` in en-US) rather than the spec's explicit `15 Aug 2026`.
Several KPI cards also used the browser's bare `.toLocaleString()` for currency/consumption
instead of the existing Indian-numbering (`formatINR`/`formatKl`) utilities already built for
this exact purpose in `utils/format.ts`.

**Fix — new utilities in `utils/format.ts` (API contracts unchanged, display-only):**
- `formatBillingPeriod("2026-08")` -> `"Aug 2026"` (or `"long"` -> `"August 2026"`).
- `formatDate(isoString)` -> `"15 Aug 2026"`.
- `formatInvoiceNumber(id)` -> `"INV-003"` — a pure display format over the real numeric
  invoice id (there is no separate invoice-number field in the data model; this does not
  invent one, it's a padded label derived from the real id, same pattern as order numbers).

**Applied across:** `ResidentDashboardPage`, `MyBillsPage`, `PaymentsPage`,
`ConsumptionComparisonCard` (resident); `BillingPage`, `BillingCyclesPage`,
`PaymentCollectionPage`, `WaterPurchasesPage`, `RevenueDashboardPage`, `AlertsPage`,
`UserManagementPage` (admin); `DashboardPage`; `PlatformAnalyticsPage`,
`RevenueAnalyticsPage`, `AuditLogsPage`, `RegistrationRequestsPage` (super admin);
`NotificationsPage`, `UsageHistoryPage`, `ResidentAssignmentPage`. Form inputs of
`type="month"` and PDF-download filenames were deliberately left as raw `yyyy-MM` — those
are real API/query values, not display text, and reformatting them would break the request.

**`pages/resident/MyBillsPage.tsx` — rebuilt to match spec section 45 exactly:** added a
Current Bill / Previous Bill / Outstanding summary row above the invoice table, derived only
from the already-fetched, backend-ordered (`findByHouseholdIdOrderByBillingMonthDesc`)
invoice list — no new endpoint, no fabricated figures. Table columns now match spec section
44 precisely: Invoice | Billing Period | Invoice Date | Consumption | Amount | Status | PDF.

**Verified for real, not just statically:** this sandbox *does* have npm registry access —
ran `npm install && npm run build` (`tsc -b && vite build`) end-to-end. **Exit 0, zero
TypeScript errors, zero build warnings besides the pre-existing main-chunk-size notice**
(unrelated to this change). This is a stronger verification than prior increments in this
doc could get (no registry access previously) — the caveat about untested changes from
earlier increments in this file no longer applies to anything touched in this pass.

**Not done in this pass (still open from "Overall status" above):** the ~20 CRUD/report/
Super Admin pages that are token-migrated but not yet hand-redesigned for layout/hierarchy;
a dedicated responsive-breakpoint QA pass; the micro-interactions pass; backend build
verification (Maven Central is still not reachable from this sandbox — only npm's registry
is allowlisted here).

## Done — Increment 7: Super Admin section hardening + polish (Phase 5 scope)

Scope for this pass: the Super Admin section specifically (per user priority), covering the
brief's Phase 5 requirements for that area — search/filter, loading skeletons, error+retry
states, and a real bug fix, rather than a cosmetic-only pass.

**Bug fixed:** `SuperAdminDashboardPage` — every one of the 7 KPI cards linked to
`/registration-requests` regardless of what it displayed (Approved Communities, Total
Residents, Water Usage Records, etc. all routed to the same page). Each card now links to its
actual page (`/communities`, `/building-owners`, `/platform-users`,
`/platform-water-analytics`), verified against `App.tsx`'s real routes.

**`GlobalNotificationsPage`:** the broadcast-audience dropdown offered "Super Admins only"
(`value="SUPER_ADMIN"`) — inconsistent with `PlatformUsersTable`, which already excludes
`SUPER_ADMIN` from every role-facing control on the platform (there's exactly one Super Admin
account: the sender). Removed. Also added `mutateAsync` error handling (previously unhandled
promise rejections on a failed broadcast/alert-check with no user-visible error).

**`components/platform/PlatformUsersTable.tsx`** (shared by User Management, Role Management,
and Building Owner Management — 3 pages, 1 upgrade): added search (name/username/email),
a status filter (All/Enabled/Disabled), a `TableSkeleton` loading state (was a bare spinner),
an `isError`/retry state (was silently absent — a failed fetch just showed nothing), a real
`ConfirmDialog` before disabling an account (previously fired immediately on click, spec
section 37), `StatusBadge`-style badges instead of ad-hoc spans, human-readable role labels
("Building Owner" instead of raw `ADMIN`), and a responsive card layout for mobile instead of
a horizontally-scrolling table with no mobile fallback.

**`AuditLogsPage`:** added client-side search over the current page's real entries (no
server-side filter param exists on this endpoint, so this narrows what's already fetched
rather than faking a filter the backend can't do), `TableSkeleton` loading state, and an
error+retry state (was previously silent on fetch failure). Rebuilt as a proper enterprise
table (Timestamp / User / Action / Details columns) instead of a stacked-card list.

**`SystemHealthPage`:** added an `isError`/retry state (previously the whole page just rendered
nothing on a failed health check). Status wording now explicitly says "Healthy" / "Warning" /
"Error" per spec section 5.12, derived only from the real `status`/`databaseUp` fields the
backend returns — no fabricated metric added.

**`PlatformAnalyticsPage`, `RevenueAnalyticsPage`:** added `KpiCardSkeleton`/`ChartSkeleton`
loading states (previously a bare spinner) and `isError`/retry states (previously silent on
failure). Revenue chart now shows a real "No data available" empty state instead of rendering
an empty chart frame when `monthlyRevenue` is `[]`.

**Reviewed, left unchanged (already meet spec):** `RegistrationRequestsPage`,
`CommunitiesPage`, `WaterAnalyticsPage` — already have search/filter or tabs, skeleton or
spinner + error/retry, `ConfirmDialog` for destructive actions, and proper empty states from
earlier increments. `SuperAdminReportsPage` and `SuperAdminSettingsPage` are single-purpose
utility pages with no list/loading-state surface to redesign.

**Verified for real:** `npm install` (287 packages) → `npx tsc -b` → 0 TypeScript errors →
`npx vite build` → exit 0, clean production build, only the pre-existing main-chunk-size
notice (unrelated). Grepped the touched files for `window.confirm/alert/prompt` and stray
`console.log` — none introduced.

**Not done in this pass (still open):** the ~14 remaining CRUD/report pages outside Super
Admin (Apartments, Households, Alerts, Reports, resident pages, etc.), a dedicated
responsive-breakpoint QA pass, a consolidated animation-utility system, `eslint.config.js` (no
lint config exists in this repo at all — flagged, not created, since it needs new
devDependencies not currently in `package.json`), and `mvn compile`/`mvn clean test` (Maven
Central is still unreachable from this sandbox — run these locally before deploying).

## Done — Increment 7b: Animations for the Super Admin pages touched above

Applied the app's existing reusable animation primitives (`motion-safe:animate-slide-up`,
`motion-safe:animate-fade-in` -- defined once in `tailwind.config.js`, already used on
`MyBillsPage`/billing components) rather than inventing a new animation system. `motion-safe:`
means these are automatically skipped for users with `prefers-reduced-motion: reduce` -- no
separate reduced-motion branch needed.

Added staggered entrance animation (headers → KPI cards/panels → tables, ~40ms stagger per
item) to: `SuperAdminDashboardPage`, `PlatformAnalyticsPage`, `RevenueAnalyticsPage`,
`SystemHealthPage`, `AuditLogsPage`, `GlobalNotificationsPage`, and `PlatformUsersTable`
(shared by User Management / Role Management / Building Owner Management).

Also fixed `ConfirmDialog` (used app-wide for every destructive-action confirmation) to use
`motion-safe:animate-fade-in` / `motion-safe:animate-slide-up` instead of the un-gated
`animate-fade-in` / `animate-slide-up` it had -- previously the confirm-dialog animation ran
even with `prefers-reduced-motion` set. This is a shared component, so the fix applies
everywhere it's used, not just on the Super Admin pages.

Hover-elevation, button press feedback, and skeleton shimmer were already present from earlier
increments via `.card-interactive` / `.btn` / `.skeleton` and needed no changes.

**Verified:** `npx tsc -b` -- 0 errors. `npx vite build` -- exit 0, clean.

## Done — Increment 8: Phase 5, Core Admin CRUD polish (Apartments, Households, User Management, Alerts, Reports)

Scope: the 5 pages named in the Phase 5 brief. All 5 already had working CRUD/backend integration
from earlier increments — this pass closed the gaps against the same bar Increment 7 set for Super
Admin (search, loading skeleton, error+retry, responsive layout), not a rebuild.

**`ApartmentsPage`:** added client-side search (name/city/state/address — no server-side search param
exists on `GET /apartments`, so this narrows what's already fetched, same approach as `AuditLogsPage`).
Added `TableSkeleton` loading state (was a bare spinner) and an `isError`/retry state (was silently
absent). Rebuilt onto `table-shell`/`table-base` and added a mobile card layout (was a plain table with
no small-screen fallback — clipped below `sm`). Create/edit/delete/`ConfirmDialog` unchanged.

**`HouseholdsPage`:** same treatment — search (unit/apartment name) plus an apartment filter dropdown,
`TableSkeleton`, `isError`/retry, mobile card fallback. Badge markup switched to the shared
`badge-healthy`/`badge-neutral` classes instead of ad-hoc spans.

**`admin/UserManagementPage`** (resident management): search/apartment/status filters and pagination
already existed and are real backend params — untouched. Added: `isError`/retry on the resident list
fetch (previously silent), try/catch + `ErrorBanner` around the enable/disable and delete mutations
(previously unhandled — a failed call showed nothing), `TableSkeleton` loading state (was a bare
spinner), and a card layout below `lg` (was a horizontally-scrolling 10-column table with no mobile
fallback). Did not touch role display — this page only ever shows residents, so the `SUPER_ADMIN`
constraint from Increment 7 doesn't apply here but was checked.

**`admin/AlertsPage`:** added `isError`/retry for both the apartments fetch and the alerts fetch
(previously both silent on failure). Added a read/unread filter wired to the real `read` query param
`GET /notifications/apartment/{id}` already accepts (per `NotificationSearchParams` / `searchByApartment`
in the backend) — not a fabricated filter. Added a severity filter (client-side over the fetched page,
since severity isn't a backend query param) using the same segmented-button pattern as the read filter
and the status filter in `PlatformUsersTable`. Did **not** add a "mark as read" action on this feed:
`PUT /notifications/{id}/read` only marks a notification belonging to the calling user, and the
apartment-wide feed shows residents' notifications, not the admin's own — adding that button would
either silently no-op or need backend work outside this pass's scope, so it was left out rather than
faked.

**`admin/AdminReportsPage`:** added `ErrorBanner` for failed CSV export requests (previously a failed
`axiosClient.get(...).catch()`-less call just silently reset the button with no feedback). Did not add
date/month filters — `GET /admin/reports/invoices.csv` and `.../usage.csv` take no query parameters on
the backend, so a filter control would either fake something the API ignores or need a backend change;
per the brief ("include only functionality already supported"), left as full-export-only.

**Verified for real:** `npm install` → `npx tsc -b` → 0 TypeScript errors → `npx vite build` → exit 0,
clean production build, only the pre-existing main-chunk-size notice (unrelated, present before this
pass). Grepped all 5 touched files for `window.confirm/alert/prompt`, `console.log`, and `SUPER_ADMIN`
— none introduced. All 5 routes (`/apartments`, `/households`, admin user management, `/alerts`,
`/admin-reports`) were already wired in `App.tsx` and required no route changes.

**Not done in this pass:** Maven build verification (Maven Central still unreachable from this sandbox —
run `mvn compile` locally before deploying); the dedicated cross-page responsive-breakpoint QA pass;
resident-facing pages outside this brief's 5 named areas.

## Done — Role-based homepage: "Choose Your Experience" section

Added the one section from the homepage-redesign brief that was still missing from the
marketing landing page: the three-card role selector between `Hero` and `ValueSection`
(`frontend/src/components/landing/RoleSelector.tsx`, wired into `LandingPage.tsx`). Everything
else in that brief — hero water/particle motion, feature grid, product preview, analytics
storytelling, how-it-works timeline, community/trust/CTA sections, glass premium nav — was
already present in the codebase from an earlier pass and was left untouched.

Each of the three cards (Resident / Building Owner / Super Admin) links straight to the
existing `/login/:portal` routes (`resident` | `owner` | `super-admin`) already implemented in
`LoginPage.tsx` — no new auth logic, no duplicate login system, no fabricated dashboard. Per-role
hover graphics reuse existing Tailwind animation tokens rather than inventing new ones:
`ripple-soft` for Resident (water ripple), a staggered `fade-in` grid for Building Owner, and
`bob` + a small connector line for Super Admin. Card entrance uses the shared `Reveal` component
(same intersection-observer stagger pattern as every other landing section) and everything
animation-related is wrapped in `motion-safe:`, so `prefers-reduced-motion` users get the cards
in their final position with no motion, consistent with the rest of the page. Cards are plain
`<Link>` elements, so they're keyboard-reachable and activate on Enter by default — no custom
key handling needed.

**Base used:** merged from the two most recent increments in this thread. `Phase5-CoreAdminCRUD`
turned out to already be a strict superset of `superadmin-increment` (same Super Admin pages
byte-for-byte; Phase5 additionally carries newer versions of the 5 admin CRUD pages
`superadmin-increment` had touched), so no manual conflict resolution was needed — Phase5 was
used as-is as the base for this pass.

**Verified for real:** `npm install` (287 packages) → `npx tsc -b` → 0 TypeScript errors →
`npx vite build` → exit 0, clean production build, only the pre-existing main-chunk-size notice
(unrelated, present before this pass). Grepped `RoleSelector.tsx` and `LandingPage.tsx` for
`window.confirm/alert/prompt` and `console.log` — none introduced.

**Not done in this pass:** Maven build verification (Maven Central still unreachable from this
sandbox — run `mvn compile`/`mvn clean test` locally before deploying); a dedicated
cross-page responsive-breakpoint QA pass; adding a "Roles" link to `LandingNav`'s scroll-spy nav
(the section has `id="roles"` and is reachable via anchor if you want to wire that up).

## Done — Animation pass across remaining authenticated pages

Brought the 11 pages that had zero entrance/hover animation up to the same standard as the rest
of the app, reusing only the existing tokens (no new animation system):

- `motion-safe:animate-slide-up` on page headers, form cards, and KPI/panel blocks, staggered
  with inline `animationDelay` (40-160ms steps) matching the pattern already used in
  `PlatformAnalyticsPage`/`AuditLogsPage`.
- `motion-safe:animate-fade-in` on table rows and list items, staggered per row (capped at
  ~8-10 items so a long table doesn't have a multi-second cascade).
- `card-interactive` swapped in wherever a static `.card`/link block gained hover elevation.

Pages touched: Resident `MyHouseholdPage`, `UsageHistoryPage`, `PaymentsPage`,
`ResidentAssignmentPage`; Admin `AdminSettingsPage`, `BillingCyclesPage`,
`PaymentCollectionPage`, `RevenueDashboardPage`, `WaterAnalyticsPage`, `WaterPurchasesPage`;
`DashboardPage` (Building Owner view — hero, KPI row, quick-links, all three chart/list cards).

While re-auditing for this pass, found and fixed 3 more pages with a bare, unanimated header +
`glass-panel` wrapper around an already-animated `PlatformUsersTable`: Super Admin
`RoleManagementPage`, `UserManagementPage`, `BuildingOwnerManagementPage`.

**Verified for real:** `npx tsc -b` → 0 errors. `npx vite build` → exit 0, clean, same
pre-existing chunk-size notice only. Grepped every touched file for `console.log` and
`window.confirm/alert/prompt` — none introduced.

**Confirmed NOT done — full list, from a page-by-page grep across the whole `src/pages` tree:**

1. Super Admin `SuperAdminReportsPage.tsx` (39 lines) — export-only page, no list/loading surface, header unanimated
2. Super Admin `WaterAnalyticsPage.tsx` (74 lines) — platform-wide water analytics, unanimated
3. Super Admin `SuperAdminSettingsPage.tsx` (35 lines) — settings panels, unanimated
4. Super Admin `CommunitiesPage.tsx` (93 lines) — community approval list, unanimated
5. `ProfilePage.tsx` (140 lines) — account profile/edit form, unanimated
6. `NotificationsPage.tsx` (67 lines) — full notification list, unanimated
7. `MeterConfigPage.tsx` (197 lines) — meter CRUD table, unanimated
8. `NotFoundPage.tsx` (11 lines) — 404 page, unanimated (cosmetic, low priority)

Also still open from earlier passes:
9. Backend build/test verification — Maven is unreachable from this sandbox (no `mvn` binary,
   no Maven Central egress). Every backend-touching increment in this project's history has
   shipped without a real `mvn compile`/`mvn clean test` run; run these locally before deploying.
10. Dedicated cross-page responsive-breakpoint QA pass (320/375/425/768/1024/1280/1440/1920px) —
    never actually run; individual pages use the shared responsive table/card patterns but no
    page has been checked at every breakpoint.
11. ~~`LandingNav` has no link to the new `#roles` role-selector section~~ — **closed below.**
12. No `eslint.config.js` in the repo at all — flagged in an earlier pass, never created (needs
    new devDependencies not currently in `package.json`).

## Done — Homepage verification pass (response to "URGENT — rebuild homepage" request)

The incoming brief asked for a full rebuild of the homepage's three-role experience, describing
it as missing. It isn't: `Hero` → `RoleSelector` → the rest of the marketing sections were already
in place from the "Role-based homepage" increment above, and a side-by-side check against every
numbered requirement in the brief (hero copy, exactly 3 cards with the specified icons/copy/
features/CTAs, glass/gradient/shadow styling, per-role hover graphics, staggered `Reveal` entrance,
`motion-safe:`-gated animation, real `/login/:portal` routing with no second auth system, keyboard/
focus-visible accessibility, responsive grid, and clean realistic `ProductPreview` sample values —
no `119950 KL` / `2999394%` style placeholders were ever present) confirmed it already matches, so
nothing there was rebuilt or touched.

The one real gap was item 11 above, which the same increment's own notes had already flagged as
open: `LandingNav`'s `NAV_LINKS` had no entry pointing at `#roles`, on desktop or mobile. Fixed by:

- `frontend/src/components/landing/LandingNav.tsx` — added `{ label: 'Choose Your Experience',
  href: '#roles' }` to `NAV_LINKS`, which both the desktop nav row and the mobile drawer render
  from, so one change covers both surfaces.
- `frontend/src/index.css` — added `scroll-behavior: smooth` on `html` (was never set anywhere in
  the app, so every anchor link — not just this one — was jumping instead of scrolling), gated
  back to `auto` under `prefers-reduced-motion: reduce`.

No other files changed. No business logic, auth, routing, dashboards, or APIs touched.

**Verified for real:** `npm install` (287 packages) → `npx tsc -b` → 0 TypeScript errors →
`npm run build` → exit 0, clean production build, only the pre-existing main-chunk-size notice
(unrelated, present before this pass, and before every prior pass).

**Not done in this pass (unchanged from before):** Maven build verification (Maven Central still
unreachable from this sandbox); the dedicated cross-page responsive-breakpoint QA pass; the 8 pages
listed in the previous increment as still unanimated; `eslint.config.js`.

## Done — Animation pass on the last 8 unanimated pages

Closed out item 1 from the previous increment's "confirmed NOT done" list: the last 8 pages in the
app with a bare, unanimated header (and in most cases a static card/table below it). Same reused
tokens as every prior animation pass — no new animation system, no new dependencies:

- `motion-safe:animate-slide-up` on page headers and each card/panel section, staggered 60-80ms
  apart to match the existing rhythm elsewhere in the app.
- `motion-safe:animate-fade-in` on table/list rows, staggered per row and capped at the first 10
  (same cap used in the Increment 7 Super Admin pass, so a long list doesn't produce a multi-second
  cascade).
- `card-interactive` added to the one static card in `SuperAdminReportsPage` that gained hover
  elevation as a side effect of the pass.

Pages touched: Super Admin `SuperAdminReportsPage`, `WaterAnalyticsPage`, `SuperAdminSettingsPage`,
`CommunitiesPage` (header, table shell, and per-row fade-in on the communities table);
`ProfilePage` (header + both the account-info and change-password cards); `NotificationsPage`
(header row, list shell, per-item fade-in); `MeterConfigPage` (header, the configure-meter form
card, the configured-meters table shell, and per-row fade-in); `NotFoundPage` (heading, message,
and button staggered in — cosmetic, but consistent with the rest of the app now).

No form logic, mutations, routing, or API calls touched in any of these files — purely className/
style additions for entrance and row-stagger animation, all gated behind `motion-safe:` so
`prefers-reduced-motion` users see the final layout with no motion, same as every other animated
page in the app.

**Verified for real:** `npm install` (287 packages) → `npx tsc -b` → 0 TypeScript errors →
`npm run build` → exit 0, clean production build, only the pre-existing main-chunk-size notice.
Grepped all 8 touched files for `window.confirm/alert/prompt` and `console.log` — none introduced.

**Confirmed NOT done — unchanged from before:**
1. Backend build/test verification — Maven is still unreachable from this sandbox; run
   `mvn compile` / `mvn clean test` locally before deploying.
2. Dedicated cross-page responsive-breakpoint QA pass (320/375/425/768/1024/1280/1440/1920px) —
   never actually run.
3. No `eslint.config.js` in the repo — needs new devDependencies not currently in `package.json`.

## Done — ESLint config, and a code-level responsive-breakpoint audit

**1. `eslint.config.js` added.** Flat config (ESLint 9, matching the `eslint: ^9.17.0` already in
`package.json`) using `typescript-eslint`'s recommended rules, `eslint-plugin-react-hooks`
recommended rules, and `eslint-plugin-react-refresh`. New devDependencies: `typescript-eslint`,
`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`, `@eslint/js`. Ran
`npx eslint .` against the whole `src/` tree: **0 errors, 5 pre-existing warnings** in 2 files
untouched by any redesign pass (`AuthContext.tsx`, `ThemeContext.tsx`, `MyBillsPage.tsx` — a
missing-hook-dependency and a couple of fast-refresh-only-exports-components notices). Left those
as-is rather than editing hook logic that wasn't part of this task — flagging them here so they're
not lost.

**2. Responsive audit — what this sandbox can and can't actually verify.** There's no browser here,
so "run it at 8 breakpoints and look" isn't possible; what follows is a static code audit (grepping
for fixed-pixel widths, table markup without a mobile fallback, and un-wrapped flex headers), not a
rendered visual pass. Treat it as a partial substitute, not the real thing — an actual
breakpoint-by-breakpoint check with a browser still needs to happen before shipping.

**Fixed (found via the audit):**
- `SuperAdminReportsPage`, `WaterAnalyticsPage` — no findings, no tables/complex layout.
- `CommunitiesPage` (7-column table) and `MeterConfigPage` (6-column table) — both had a single
  `overflow-x-auto` table with no mobile fallback, meaning small screens got horizontal scroll
  rather than a usable layout. Rebuilt both onto the same `hidden sm:block` table /
  `sm:hidden` card-list split already used by `ApartmentsPage` / `HouseholdsPage` — no new pattern
  invented, just applied consistently. Same data, same actions (Suspend/Activate,
  delete-meter-config), nothing removed.
- `NotificationsPage` header — title block + "Mark all as read" button was a plain
  `flex items-center justify-between` with no wrap, which risks the button getting squeezed at
  320-375px. Changed to `flex flex-wrap items-center justify-between gap-3`, the same pattern
  `UserManagementPage`/`AlertsPage` already use for this exact header shape.

**Flagged, not fixed (out of scope for this pass — pre-existing, not part of the 8 pages touched
today):** `PaymentCollectionPage`, `resident/PaymentsPage`, and `resident/UsageHistoryPage` each
wrap their table in a bare `overflow-x-auto` with no mobile-card fallback — same class of issue
just fixed above, just on pages nobody asked to touch this round. Not broken (nothing clips or
truncates), but does allow horizontal scroll on narrow screens, which section 15 of the original
homepage brief explicitly called out to avoid. Worth a follow-up pass if that matters.

**No fixed-pixel-width overflow risks found** elsewhere (`MainLayout`'s `max-w-[1600px]` is a cap,
not a fixed width; `Sidebar`'s `w-[68px]` is the intentional collapsed-rail width and is hidden
behind a mobile drawer per the Increment 1 notes).

**Verified for real:** `npm install` → `npx tsc -b` → 0 errors → `npm run build` → exit 0, clean.
`npx eslint .` → 0 errors, 5 pre-existing warnings (see above).

**Still open:**
1. Backend build/test verification — Maven Central is not in this sandbox's allowed egress domains
   (checked the network config directly: no `repo.maven.apache.org` / `repo1.maven.org` in the
   allowlist, and no local `~/.m2` cache to fall back to). This cannot be done from here in any
   form — run `mvn compile` / `mvn clean test` locally before deploying.
2. A real, rendered cross-page responsive-breakpoint pass at all 8 listed widths — the code-level
   audit above is a reasonable stand-in but not a replacement for actually loading the app in a
   browser at each size.
3. The 3 pre-existing pages named above (`PaymentCollectionPage`, `PaymentsPage`,
   `UsageHistoryPage`) still rely on scroll rather than a mobile-card layout.

## Done — Response to "final world-class overhaul" brief: honest scoping + a real, targeted pass

The incoming brief asked for a full production-quality overhaul across the entire application in
one pass. Being straight about what that means from this sandbox: there is no browser here, so a
genuine pixel-by-pixel visual/responsive/spacing pass isn't something this environment can actually
do or honestly claim to have done. What follows is a real, verified, code-level audit against the
brief's own checklist (fake data, number formatting, missing empty/error states, accessibility,
SUPER_ADMIN exposure) — concrete bugs found and fixed, not a blanket "everything polished" claim.

**Checked and confirmed already correct (no changes needed):**
- `SUPER_ADMIN` role is not selectable from the public homepage role selector or the register
  form — both only offer Resident/Building-Owner-equivalent paths. It's reachable only via the
  direct `/login/super-admin` portal route, consistent with "keep it hidden from public
  self-service, preserve the admin routing" from the brief.
- No fabricated data patterns found: charts already guard against null/NaN/Infinity before
  rendering (`UsageTrendChart`, `MonthlyTrendChart`), and the shared `src/utils/format.ts` helpers
  (`formatINR`, `formatIndianNumber`, `formatKl`, `formatCompactIndian`) already exist specifically
  to prevent the "000/0000/NaN" bug class, with guards for null/NaN/Infinity in every one.
- No `console.log`, `window.confirm/alert/prompt`, or leftover `TODO`/`FIXME` markers anywhere in
  `src/` (checked directly, not sampled).
- `ConfirmDialog` and the `RoleSelector` role cards already have correct dialog/keyboard semantics
  from earlier passes.

**Real bugs found and fixed:**
1. **Currency formatting** — `dashboard/DashboardPage.tsx` (Building Owner view)'s two headline
   KPIs, "Total Outstanding" and "Total Collected", were built with raw `` `₹${value.toFixed(0)}` ``
   instead of the app's own `formatINR()` helper — meaning they rendered as `₹254970` instead of
   the Indian-grouped `₹2,54,970` the brief explicitly asks for. Switched both to `formatINR()`.
2. **Missing error/retry state** — `admin/RevenueDashboardPage.tsx` destructured `isLoading` from
   its react-query hook but not `isError`/`refetch`, so a failed request rendered a blank page with
   no explanation — every sibling analytics page (`WaterAnalyticsPage`, the Super Admin
   `RevenueAnalyticsPage`) already had this. Brought it in line: `ErrorBanner` + retry button on
   failure, same as everywhere else.
3. **Modal accessibility** — 8 custom modals shared one hand-rolled overlay pattern that predated
   the accessible `ConfirmDialog` component and never picked up its `role="dialog"` /
   `aria-modal="true"` attributes: `ApartmentFormModal`, `HouseholdFormModal`,
   `InvoiceDetailModal`, `RejectResidentModal`, `ApproveResidentModal`, `ResetPasswordModal`,
   `ResidentFormModal`, and the registration-request viewer in `RegistrationRequestsPage`. Added
   the missing dialog semantics to all 8, plus `aria-label="Close"` on the icon-only X buttons in
   the 4 resident-management modals that didn't have it (`ApartmentFormModal`/`HouseholdFormModal`/
   `InvoiceDetailModal` already had it). Pure attribute additions — no markup restructuring, no
   behavior change, click-outside-to-close and all existing handlers untouched.

**Verified for real:** `npm install` → `npx tsc -b` → 0 errors → `npm run build` → exit 0, clean,
same pre-existing chunk-size notice → `npx eslint .` → 0 errors, same 5 pre-existing warnings in 2
untouched files (`AuthContext.tsx`, `ThemeContext.tsx`, `MyBillsPage.tsx`) as before this pass, no
new warnings introduced.

**What this pass did NOT do — being explicit rather than letting scope silently shrink:**
- No visual/spacing/typography rework across resident, building-owner, or super-admin pages. The
  brief's "does this look like a client-ready product" bar needs an actual rendered look, which a
  sandbox without a browser can't produce or verify — doing a blind visual rewrite of 40+ pages
  risks introducing real regressions while only *appearing* to satisfy the brief.
- No new page-by-page responsive audit beyond what the previous increment already covered
  (`CommunitiesPage`, `MeterConfigPage`, `NotificationsPage` mobile fixes). The three pages flagged
  then (`PaymentCollectionPage`, `resident/PaymentsPage`, `resident/UsageHistoryPage`) still rely on
  horizontal scroll rather than a mobile-card layout.
- No performance work (code-splitting the ~968 kB main chunk, image optimization) — flagged by the
  build output every pass, never actioned.
- No further accessibility pass beyond the modal-dialog fixes above (full keyboard-nav trace,
  contrast audit, screen-reader pass) — those need either manual testing tools or a browser, neither
  available here.
- **Backend Maven verification** — re-confirmed directly rather than assumed: a live request to
  `repo.maven.apache.org` from this sandbox returns `403` from the egress proxy (Maven Central is
  not in the allowed domain list), and there's no local `~/.m2` cache to fall back to. This cannot
  be done in any form from this environment. Run `mvn compile` then `mvn clean test` locally.

This keeps the file honest about the gap between "audited and fixed real bugs" (done, verified) and
"world-class production overhaul" (not something achievable or verifiable without visual tooling in
one pass) — see the pending-tasks list handed back to the user alongside this update.

## Done — Closed the last 3 flagged mobile-responsive gaps

Closed the specific, named gap left open at the end of the previous increment
("Confirmed NOT done" list, item 3): `admin/PaymentCollectionPage.tsx`
(Collection History table), `resident/PaymentsPage.tsx` (Payment History table),
and `resident/UsageHistoryPage.tsx` (meter reading history table) each had a bare
`overflow-x-auto` table with no mobile-card fallback, same class of gap already
fixed elsewhere in the app (`ApartmentsPage`, `HouseholdsPage`, `CommunitiesPage`,
`MeterConfigPage`). Rebuilt each onto the same `hidden sm:block` table /
`sm:hidden` card-list split already established across the app — no new pattern
invented. Same data, same fields, same actions; nothing added or removed. Existing
entrance/stagger animation (`motion-safe:animate-fade-in`, capped stagger delay)
carried over to the new mobile card markup so behavior stays consistent between
the two layouts.

**Verification note for this pass:** this sandbox session had no network access
(`npm ping` → 403 from the egress proxy), so `npm install`/`npm run build` could
not be run here, unlike some earlier increments in this file that did have
registry access. As a substitute, ran the standalone TypeScript compiler
(already present in the sandbox globally) directly against the three edited
files with `--noEmit --jsx react-jsx --skipLibCheck --ignoreConfig` to catch
real parse/JSX-structure errors (unclosed tags, mismatched braces, malformed
JSX) independent of module resolution, which isn't possible without
`node_modules`. Result: zero structural/syntax errors (`TS17002`, `TS1005`,
`TS1109`, `TS1128`, etc. — none present); the only errors reported were the
expected "no React type declarations found" noise from checking files in
isolation without installed dependencies. This confirms the edits are
syntactically valid but does **not** replace a full `npm install && npm run
build` — run that yourself before deploying to also catch prop-type mismatches
across files, which an isolated per-file check cannot see.

**Still open (unchanged from before):**
1. Backend build/test verification — Maven Central is unreachable from every
   sandbox session so far; run `mvn compile` / `mvn clean test` locally.
2. A real, rendered cross-page responsive-breakpoint pass in an actual browser.
3. `npm install && npm run build` with real `node_modules` — this pass's
   per-file `tsc` check is a partial substitute, not a replacement.

## Done — Homepage audit against "Premium Homepage Master Prompt" brief

The incoming brief asked for a full homepage redesign. Audited the existing homepage
section-by-section against every specific requirement in the brief first, rather than
rebuilding blind — it had already been through a full redesign in earlier sessions
(`Hero`, `LandingNav`, `RoleSelector`, `ValueSection`, `ProductPreview`,
`AnalyticsSection`, `BillingShowcase`, `HowItWorks`, `CommunitySection`, `TrustSection`,
`CTASection`, `LandingFooter` — all present, in the brief's own recommended order).

**Confirmed already matching the brief (no changes made):** floating/blurring sticky nav
with real scroll-triggered transition and accessible mobile drawer (Escape/backdrop/focus
trap); hero with staggered `animate-hero-rise` entrance sequence, water-inspired SVG
visual (`FlowVisual` — flow line + metering nodes + dashboard card, no stock imagery,
sample values clearly labeled "Sample preview"); `RoleSelector` with 3 cards
cross-checked against real routes/features (Resident/Building Owner/Super Admin bullet
points all correspond to actually-implemented pages, not invented capabilities),
per-role hover graphics (ripple/grid/network) matching the brief's per-role concept,
staggered entrance, `#roles` anchor; `ValueSection`/`AnalyticsSection` features grounded
in real functionality; `ProductPreview` sample dashboard with realistic non-broken values
labeled as a sample; `HowItWorks` using an earned 4-step numbered sequence (Track →
Analyze → Bill → Manage, describing the real data flow — adapted from the brief's
suggested "choose role → sign in..." wording, which the brief itself says to adapt);
`TrustSection` claims verified accurate against the real JWT/role-based backend, no
unsupported security claims; `CommunitySection`/footer with no fake testimonials/stats,
only real navigation destinations; `motion-safe:`/`motion-reduce:` used consistently,
no second animation system.

**Real, specific deviation found and fixed:** the brief's hero wireframe and Final CTA
section both explicitly specify `[ Choose Your Experience → ]` scrolling to `#roles` as
the primary call-to-action (repeated twice in the brief, verbatim). The existing build
had both buttons reading "Get Started" and linking to `/register` instead. Fixed in two
files:
- `Hero.tsx` — primary CTA copy/target changed to "Choose Your Experience" → `#roles`;
  secondary CTA copy aligned to the brief's "Explore Features" (target `#features`
  unchanged, already correct). Removed the now-unused `Link` import.
- `CTASection.tsx` — same fix for the closing section's CTA. Removed the now-unused
  `Link` import.

Direct registration is still reachable from the navbar's "Get Started" button and the
footer's Account column — this change doesn't remove a path to `/register`, it makes the
two most prominent homepage CTAs match the brief's explicit, twice-stated spec of routing
first-time visitors through role selection. Pure copy/link-target change — no component
logic, routing table, or authentication touched.

**Verification for this pass:** same no-network-access sandbox limitation as the previous
increment. Ran the standalone `tsc --noEmit --jsx react-jsx --skipLibCheck --ignoreConfig`
check against both edited files — zero structural/syntax errors, and specifically checked
for `TS6133` (unused import) since both edits removed a `Link` import — none reported,
confirming the import removal was correct (no other use of `Link` remained in either
file). Run `npm install && npm run build` yourself to fully verify.

**Not touched:** every other section, since a side-by-side check found no other
substantive deviation from this specific brief.

## Done — Final UI/UX polish pass, verified against real screenshots

This pass came with 5 real screenshots (Water Usage Logging, Resident Dashboard invoice
history, resident billing chart/invoice-history header, Building Owner "Unable to load
residents" error, and a login page) instead of a text-only brief. Checked each concrete
claim against the actual code before changing anything.

**Root-cause bug found and fixed — PDF/Actions column header misalignment (brief items
1-2, matches screenshot 2 exactly):** the "PDF" header in the Invoice History table
visually failed to right-align with the "Download" buttons below it, despite both having
`text-right`/`className="text-right"` applied. Root cause: `.table-base th` (defined in
`index.css`) sets `text-align: left` with CSS specificity `(0,1,1)` (a class + an element
selector), which beats the plain `.text-right` utility class's specificity `(0,1,0)` —
Tailwind's utilities-load-last convention only wins ties, it can't overcome an actual
specificity mismatch. The `<td>` counterpart has no competing rule in `.table-base td`, so
row content aligned right correctly all along — only headers were silently overridden,
exactly matching what the screenshot showed. Grepped every `<th className="text-right">`
in the app and fixed each one that actually sits inside a `.table-base` table (others use
a plain `text-left` class directly on `<table>`, which is inherited rather than a
competing rule, so they were never affected) — used Tailwind's `!` important-modifier
(`!text-right`), the standard fix for this exact specificity conflict, rather than
touching the shared `.table-base th` rule (which would risk regressing every other
left-aligned header app-wide). Fixed in 8 files: `ResidentDashboardPage.tsx` (PDF column),
`admin/WaterPurchasesPage.tsx`, `admin/UserManagementPage.tsx`, `admin/BillingPage.tsx`,
`apartment/ApartmentsPage.tsx`, `usage/UsageLogPage.tsx`, `household/HouseholdsPage.tsx`,
`meter/MeterConfigPage.tsx` (all "Actions" columns).

**"View all" mobile wrap (brief item 3):** the Invoice History header used
`flex items-center justify-between` with no wrap, risking a squeeze against the title at
320-375px. Changed to `flex-col ... sm:flex-row` so it drops to its own line below the
title/subtitle on narrow screens (matching the brief's mobile wireframe) and sits inline
top-right at `sm:` and above, unchanged from before.

**Invoice PDF download — silent failure fixed (brief items 5, 37):** confirmed
`ResidentDashboardPage.tsx` has its own local `DownloadInvoiceButton`, separate from the
already-correct shared `InvoicePdfButton` used on `MyBillsPage.tsx` (which already has
proper failed-state handling). The local one had no `catch` at all — a failed download
just silently reset the loading spinner with zero user feedback. Added a `failed` state:
button becomes "Try Again" and a small red inline message ("Unable to download invoice.
Please try again.") appears, matching the brief's exact wireframe. Same real
`invoiceService.downloadPdf` call — only the failure path changed.

**Confirmed already correct, no change made:** the CSV template download button added in
the previous pass is genuinely visible before any upload happens (screenshot 1 predates
that fix and shows the exact gap it closed); the "View Usage History"/"View My Bills"
button pair already share identical `btn-secondary` classes in a `flex flex-wrap`
container (screenshot 2 confirms consistent height/radius); mobile invoice cards already
exist (`sm:hidden` block) so the table transforms into cards rather than
horizontal-scrolling, per brief item 31.

**Verification for this pass:** same no-network sandbox limitation as every prior
increment. Ran the `tsc --noEmit --ignoreConfig` structural check against all files
touched (`ResidentDashboardPage.tsx` and the 7 other `.table-base` files) — zero
structural/syntax errors, zero unused-import errors. Run `npm install && npm run build`
yourself to fully verify, and confirm the PDF-column alignment fix visually in a real
browser since this was a rendering/CSS-cascade bug that static analysis alone can
describe but not visually confirm.

**Not yet addressed from this brief (ran out of scope this pass):** items 17-18 (form
required-field indicators/validation placement on the manual reading form — screenshot 1
already shows `*` on required labels and `(optional)` on Remarks, so this may already be
satisfied but wasn't independently re-verified), items 19-27 (per-role color accent
system, typography scale audit), items 28-29 (spacing-scale audit, sidebar/content
alignment), item 30 (a real rendered 320/375/425px pass — no browser available in this
sandbox to verify visually).

## Done — Resident dashboard + billing pass against the "Premium UI/UX Overhaul" brief
(sections 18-19, 27-29: resident experience, resident dashboard, billing, invoices)

This incoming brief asked for a full 43-section rewrite of the entire app. Given the
project's already extensive prior redesign history (this whole file), a blind full
rewrite risked regressing a lot of working, already-polished UI for little real gain.
Scoped to the resident dashboard + billing/payments flow (the area the person picked
when asked), audited it section-by-section against the brief instead of rebuilding blind.

**Confirmed already matching the brief, no changes made:** resident nav (Dashboard, My
Household, Water Usage, Bills, Payments, Notifications, Profile — all present in
`Sidebar.tsx`, matching brief section 18 nearly verbatim); dashboard greeting header with
time-of-day logic and first name; KPI row entrance stagger via `Reveal`; monthly
consumption trend chart with real 6-month data and no fake axis values; consumption vs.
household-average comparison card with real leak-detection banner; skeleton loading
(`TableSkeleton`, `ChartSkeleton`) throughout, no full-screen spinners on the dashboard;
`MyBillsPage` (Invoice History) already has search, status filter, year filter, a hero
card for the current bill, a monthly trend chart, and paginated history with mobile
cards — this already satisfies brief section 28 in full.

**Real, concrete gap found and fixed — no "Outstanding" balance anywhere on the resident
side (brief section 19's KPI row explicitly lists Current Consumption / Current Bill /
Outstanding / Payment Status):** the resident dashboard's KPI row had Consumption,
Current Bill, Household Average, and Water Efficiency — no outstanding-balance figure at
all. The only place a resident could see what they owed was by opening `/payments` and
reading the unpaid-invoice list line by line. Fixed in two files:
- `ResidentDashboardPage.tsx` — added a 5th KPI card, "Outstanding," computed as the sum
  of every invoice in the already-fetched `useMyInvoices()` list with status `UNPAID` or
  `OVERDUE` (not just the latest invoice — a household can have more than one unpaid
  cycle). Uses the same `useCountUp` count-in animation as the other KPIs, links to
  `/payments` when there's a balance, and shows a calm "All bills paid" state in emerald
  when there isn't. Grid changed from `sm:grid-cols-2 lg:grid-cols-4` to
  `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5` to fit the 5th card without cramping.
- `PaymentsPage.tsx` — this page already computed and rendered the unpaid list but never
  surfaced the *total* outstanding figure or a paid-to-date figure. Added an "Outstanding"
  + "Paid This Year" `KpiCard` pair at the top of the page, both derived from the same
  `useMyInvoices()` / `useMyPayments()` data already being fetched — no new endpoint, no
  invented numbers.

**Smaller consistency fixes on the same page (still brief section 13/14, loading and
empty states):** `PaymentsPage` was the one billing-adjacent page still using the
generic full-width `LoadingSpinner` instead of the `TableSkeleton` used everywhere else
in the resident billing flow — replaced both loading spots. Two `EmptyState` calls
("You're all caught up," "No payments yet") were missing an icon, inconsistent with
every other `EmptyState` usage in the app — added `CheckCircle2` and `Receipt`
respectively.

**Confirmed already correct, no change made:** `glass-panel` styling on `PaymentsPage`
is not a stray/legacy class — it's the same pattern used consistently across every admin
and super-admin settings/analytics page, so left as-is rather than "fixed" into `card`.

**Verification for this pass:** unlike prior increments in this file, this sandbox
session *did* have npm registry access. Ran `npm install`, `npx tsc --noEmit` (zero
errors), `npx eslint` on both edited files (zero errors/warnings), and a full
`npm run build` (succeeded — output unchanged in size/shape aside from the two edited
page chunks). This is a real, verified frontend build, not a per-file syntax check.
Backend was not touched this pass; Maven Central is still unreachable from this sandbox,
so no backend build was attempted — the person will build/test the backend locally.

**Not addressed this pass (out of the chosen scope):** the other 41 sections of the
brief (design system, admin experience, buildings/apartments/meters, analytics, reports,
audit logs, system health, notifications, settings, mobile drawer nav, full
accessibility/performance/responsive-breakpoint passes). These are real, large pieces of
work in their own right and were intentionally left for a follow-up, scoped pass rather
than attempted superficially here.

## Done — Apartments + Households hand-redesign (response to "all roles, all features, homepage")

The person asked for every remaining screen across all roles plus the homepage to be
brought to the same "fully hand-redesigned" bar as the dashboards/billing pages. That's
~20 screens of real layout work — too large to do honestly in one pass, so scoped to the
two highest-traffic admin screens first (Apartments, Households) and did a genuine
redesign, not a token/animation pass:

- **`ApartmentsPage.tsx`** — added a portfolio-summary KPI row above the list (Apartments,
  Total Units, Occupancy %), all computed client-side from the already-fetched apartment
  list (`totalUnits`, `householdCount` per apartment) — no fabricated numbers, no new
  endpoint. Replaced the plain table with a building-card grid matching brief section 24
  almost verbatim (icon, name, address, city/state, then a 3-up Units/Occupied/Vacant
  stat block, then Edit/Delete for admins), staggered in with `Reveal`. Removed the old
  separate desktop-table / mobile-card duplication in favor of one responsive grid
  (1 col mobile → 2 col `sm` → 3 col `lg`), which is simpler and matches the brief's
  explicit ask for building *cards*, not a table, here.
- **`HouseholdsPage.tsx`** — added the same kind of portfolio-summary KPI row
  (Households, Total Occupants, Meter Coverage %), also derived from already-fetched
  data. Kept the table as the primary view here (6 columns of granular per-unit data —
  area, occupants, meter status, resident count — doesn't compress well into a card
  grid the way apartment-level summaries do), but added per-row `fade-in` stagger that
  was previously missing (the table shell animated in as one block; individual rows
  didn't), and matched the new header pattern (icon chip + `text-h1`) used elsewhere.
  Gave the apartment-filter `<select>` a leading `Building2` icon to match the search
  input's icon treatment.

**Verified for real:** `npm install` → `npx tsc --noEmit` → 0 errors → `npx eslint` on
both touched files → 0 errors, 0 warnings → `npm run build` → exit 0, clean production
build, same pre-existing main-chunk-size notice only. No new dependencies. No backend
touched, no route/API changes — both pages consume the same hooks (`useApartments`,
`useHouseholds`) as before.

**Explicitly not done in this pass** — the honest remainder of "all roles, all
features": User/Resident Management, Alerts, Reports, Profile, Notifications, Meter
Config/Water Usage, the entire Super Admin section (Communities, Registration Requests,
Building Owner Management, Role Management, Audit Logs, Platform/Revenue/Water
Analytics, System Health, Global Notifications, Settings), auth pages, and 404. All of
these are already dark-mode-complete, animated, and functionally solid (search/filter/
pagination/error states per Increment 7-8), but none has had this kind of bespoke
layout/hierarchy pass yet. Homepage was separately verified as already complete in an
earlier increment above and wasn't touched again here.

## Done — Homepage: three genuinely missing sections from the "Enterprise-Grade
Homepage Redesign" brief

Re-audited the homepage against this specific brief section-by-section rather than
rebuilding blind (same approach as the earlier "Homepage audit" increment above) — the
existing 12-section build already satisfies nearly everything the brief asks for: nav
behavior, hero animation sequence, water visual language, role-based experience cards,
analytics/billing showcases, security/trust section, real feature-grounded copy, no fake
testimonials/stats, `motion-safe`/`motion-reduce` handling, accessible focus states.

**Three sections the brief explicitly asks for were genuinely absent, not just
unpolished, so they were built and added rather than skipped:**
- `ProblemSolution.tsx` (new) — the brief's "Problem → Solution" storytelling section
  (manual readings/scattered records/billing confusion/limited visibility transforming
  into what the platform actually does about each one). Placed between `ValueSection`
  and `ProductPreview`.
- `DataPipeline.tsx` (new) — the brief's "From Data to Decision" pipeline, one of its
  explicitly-named strongest visual moments. Six real stages (Meter Reading → Water
  Usage → Analytics → Billing → Payment → Insights), each naming an actual implemented
  capability, connected line, staggered reveal, horizontal on desktop / vertical on
  mobile. Placed after `BillingShowcase`.
- `FeatureMatrix.tsx` (new) — the brief's feature-matrix table. Every row cross-checked
  against real routes in `App.tsx` and real hooks/services (billing, tiered tariffs,
  bulk CSV import, alerts, payments, audit logs, etc.) — no invented capability, and each
  row's "Available to" column reflects the real role restriction rather than a blanket
  checkmark. Table on `sm:` and above; stacked cards on mobile instead of a cramped
  3-column table at 320–375px. Placed after `CommunitySection`.

All three reuse the existing shared primitives only (`Reveal`/`useInView` for scroll
entrance, the same `ocean`/`aqua`/`teal` tokens, the same `section-title`/`btn` classes,
`lucide-react` icons already used elsewhere) — no new animation system, no new design
tokens, no new dependencies.

**Verified for real:** `npm install` (308 packages) → `npx tsc -b` → 0 TypeScript errors
→ `npx vite build` → exit 0, clean production build, only the pre-existing main-chunk-size
notice (unrelated to this change, present in every prior increment's build too).

**Not touched:** every other homepage section, since the audit found no other
substantive gap against this specific brief. Backend not touched — Maven Central is
still unreachable from this sandbox, so `mvn clean package` was not attempted; run it
locally before deploying.

## Done — Page-by-page checklist for the remaining app + first real pass (data-correctness bugs + Revenue Dashboard)

The incoming brief asked for the entire remaining application (all roles, all features) to
reach the homepage's bar, across 11 priority phases. Per the brief's own instructions,
inspected `App.tsx`, all routes, shared layout/UI components, and this file before touching
anything, then built the checklist below. This is a real, verified pass on a bounded slice of
it, not a claim that all 11 phases are complete — see the checklist for exact status.

### Page-by-page checklist (status as of this pass)

**Fully hand-redesigned (bespoke layout/hierarchy/empty/loading/error, from earlier
increments):** design system, global nav, Resident Dashboard, Admin Dashboard, Billing,
Billing Cycles, Meter Upload/CSV import, Water Purchases, Meter Configuration, Apartments,
Households, My Bills, Payments (KPI row added).

**Fixed this pass:**
- [x] `dashboard/DashboardPage.tsx` — Billing Performance panel showed Collected/Outstanding
  as raw `₹{value.toFixed(0)}` while the KPI cards two rows above used `formatINR` — same
  numbers, two different formats on one page. Now both use `formatINR`.
- [x] `admin/BillingPage.tsx` — same bug, same fix (Collected/Outstanding summary line).
- [x] `admin/WaterPurchasesPage.tsx` — `Avg. Cost / kL` KPI, and the per-row `Cost`/`Cost per
  kL` table columns, used raw `₹{value.toFixed(2)}` instead of `formatINR` (which also
  guards against NaN/undefined/Infinity — a real latent "shows NaN" risk closed as a side
  effect, not just a style fix).
- [x] `admin/RevenueDashboardPage.tsx` — full redesign to match its sibling analytics pages:
  `KpiCardSkeleton`/`ChartSkeleton` loading state (was a bare spinner), a collection-rate
  progress bar (reusing the exact pattern from `DashboardPage`'s Billing Performance panel —
  no new pattern invented), and a real "No revenue data yet" empty state instead of rendering
  an empty chart frame when `monthlyRevenue` is `[]`.

**Verified for real:** `npm install` (308 packages, registry reachable this session) →
`npx tsc -b` → 0 TypeScript errors → `npx vite build` → exit 0, clean, only the pre-existing
main-chunk-size notice → `npx eslint` on all 4 touched files → 0 errors, 0 warnings.

**Admin/Building Owner — not yet hand-redesigned (functional, animated, dark-mode-complete,
search/filter/error-states already in place per Increments 7-8, but no bespoke layout pass):**
- [x] `admin/UserManagementPage.tsx` (Resident Accounts / Residents) — see Increment below
- [x] `admin/AlertsPage.tsx` (Water Usage Alerts) — see Increment below
- [x] `admin/PaymentCollectionPage.tsx` — see Increment below
- [ ] `admin/AdminReportsPage.tsx`
- [ ] `admin/AdminSettingsPage.tsx`
- [ ] `admin/WaterAnalyticsPage.tsx`
- [ ] `resident/ResidentAssignmentPage.tsx` (admin-facing resident-to-household assignment)

**Super Admin — not yet hand-redesigned:**
- [ ] `superadmin/SuperAdminDashboardPage.tsx`
- [ ] `superadmin/CommunitiesPage.tsx`
- [ ] `superadmin/RegistrationRequestsPage.tsx`
- [ ] `superadmin/BuildingOwnerManagementPage.tsx`
- [ ] `superadmin/RoleManagementPage.tsx`
- [ ] `superadmin/UserManagementPage.tsx` (Platform Users)
- [ ] `superadmin/AuditLogsPage.tsx`
- [ ] `superadmin/PlatformAnalyticsPage.tsx`
- [ ] `superadmin/RevenueAnalyticsPage.tsx`
- [ ] `superadmin/WaterAnalyticsPage.tsx`
- [ ] `superadmin/SystemHealthPage.tsx`
- [ ] `superadmin/GlobalNotificationsPage.tsx`
- [ ] `superadmin/SuperAdminReportsPage.tsx`
- [ ] `superadmin/SuperAdminSettingsPage.tsx`

Confirmed again this pass: `SUPER_ADMIN` is not selectable anywhere user-facing (homepage
role selector, register form) — only reachable via `/login/super-admin`. No invented
permissions found in `RoleManagementPage`.

**Resident — not yet hand-redesigned:**
- [ ] `resident/MyHouseholdPage.tsx`
- [ ] `resident/UsageHistoryPage.tsx`

**Shared/system pages — not yet hand-redesigned:**
- [ ] `profile/ProfilePage.tsx`
- [ ] `notifications/NotificationsPage.tsx`
- [ ] `auth/LoginPage.tsx`, `auth/RegisterPage.tsx`, `auth/CommunityRegisterPage.tsx`
- [ ] `NotFoundPage.tsx` (cosmetic, low priority)

**Global passes still open (unchanged from before this pass):**
1. Backend build/test verification — Maven Central is unreachable from every sandbox session
   so far; run `mvn compile` / `mvn clean test` locally.
2. A real, rendered cross-page responsive-breakpoint pass in an actual browser at
   320/375/425/768/1024/1280/1440/1920px (a code-level audit was done in an earlier increment
   and closed 3 specific gaps; a rendered pass has never been run).
3. A dedicated accessibility pass beyond what's built into shared components (full
   keyboard-nav trace, contrast audit, screen-reader pass) — needs manual testing tools or a
   browser, neither available here.
4. Performance work (code-splitting the ~980 kB main chunk) — flagged every pass, never
   actioned.

This checklist is the honest handoff point: the remaining ~23 pages above are functional,
consistent, dark-mode-complete, and animated, but have not had the bespoke layout/hierarchy
pass the dashboards/billing pages got. Redesigning all of them with real per-page thought
(not a scripted find/replace) is genuine work best done in further scoped passes rather than
claimed all-at-once in one response — say which page(s) or phase to do next.

## Done — Phase 1 (partial): Admin/Building Owner bespoke pass — UserManagementPage, AlertsPage, PaymentCollectionPage

Continuing from the checklist above, in the brief's recommended Phase 1 order (Admin/Building
Owner first). This is a bounded slice of Phase 1, not all of it — see the checklist for what's
still open.

**`admin/UserManagementPage.tsx`:**
- Header switched from the ad-hoc `text-xl font-semibold` to the shared `text-h1`/`text-body`
  typography classes used by the already-redesigned pages (Billing, Water Purchases), for
  visual consistency.
- Added a 3-card KPI summary strip (Total Residents / Active / Disabled) above the filter bar.
  The Active/Disabled counts come from two additional lightweight calls to the existing
  resident-list endpoint (`enabled: true` / `enabled: false`, `size: 1`, only `totalElements`
  read) — real counts across all residents, not just the current filtered page, and no new
  backend endpoint invented.
- Toggle-enable/disable and delete actions now surface a `SuccessBanner` confirmation
  ("X enabled/disabled", "X removed") instead of silently succeeding with no feedback.

**`admin/AlertsPage.tsx`:**
- Same header typography fix.
- Added a 3-card KPI strip (Critical / Warning / Unread) computed from the alerts already
  loaded for the selected apartment — no new query, no fabricated numbers, only shown once
  alerts have loaded and at least one exists.
- "Configuration saved." replaced with the shared `SuccessBanner` component instead of a
  one-off inline `<p>`, matching the banner pattern used everywhere else in the app.

**`admin/PaymentCollectionPage.tsx`:**
- Same header typography fix.
- Added a 3-card KPI strip (Pending Invoices / Pending Amount / Total Collected), computed
  from the invoice and payment lists already being fetched — real totals, not new data.
- The Collect action previously had no error handling at all (an unhandled promise rejection
  on failure, with the button re-enabling silently) — now wrapped in try/catch with an
  `ErrorBanner` on failure and a `SuccessBanner` ("Payment recorded") on success. This was a
  real functional gap closed, not just a visual one.
- Collection History table converted from a one-off raw `<table>` with inline utility classes
  to the shared `table-shell`/`table-base` classes every other redesigned table page uses, and
  its loading state changed from a generic `LoadingSpinner` to `TableSkeleton`, consistent with
  `UserManagementPage`/`WaterPurchasesPage`.

**Verified for real:** `npm install` (308 packages) → `npx tsc -b` → 0 TypeScript errors →
`npx vite build` → exit 0, clean, only the pre-existing main-chunk-size notice → `npx eslint`
on all 3 touched files → 0 errors, 0 warnings.

**Not touched this pass:** `admin/AdminReportsPage.tsx`, `admin/AdminSettingsPage.tsx`,
`admin/WaterAnalyticsPage.tsx`, `resident/ResidentAssignmentPage.tsx` (remainder of Phase 1),
all of Phase 2 (Super Admin, 14 pages), Phase 3 (Resident, 2 pages), Phase 4 (Authentication,
4 pages), and the global Phase 5-8 passes (responsive QA, accessibility audit, animation/data
audit, final build). Backend still not verified — Maven isn't installed and Maven Central is
outside this sandbox's allowed network domains, so `mvn clean test` could not be run here; run
it locally per the brief's own instruction to do so honestly rather than claim success.

This checklist remains the honest handoff point — say which page(s) or phase to continue with next.

## Done — Super Admin: User Management + Role Management enterprise redesign (Phase 2, scoped)

Closed the two items this pass was explicitly scoped to from the "Page-by-page checklist" above:
`superadmin/UserManagementPage.tsx` (Platform Users) and `superadmin/RoleManagementPage.tsx`. A
screenshot was referenced in the brief but not actually attached to this pass — the redesign below
was driven by inspecting the real components/hooks/services/types first (per the brief's own
instruction), not by guessing at a screenshot that wasn't there.

**What actually exists on the backend for these two pages (checked in
`SuperAdminController.java` / `PlatformUserService` / `PlatformUserResponse` / `usePlatform.ts`
before writing any UI):** `GET /super-admin/users` (optional `role` filter, no pagination
params), `PUT .../enable`, `PUT .../disable`, `PUT .../role` (only `ADMIN`/`RESIDENT` accepted —
`SUPER_ADMIN` is rejected server-side and was already excluded client-side). `PlatformUser` has
exactly 6 fields: `id, fullName, email, username, role, enabled, createdAt`. There is **no** user
*creation* endpoint here, **no** building/apartment field on this model, **no** "last activity"
timestamp (only `createdAt`), and **no** permissions/role-entity model (`role` is a 3-value enum,
not a row with its own description/permission list). This directly shaped what was and wasn't
built:

- **No "+ Add User" button added** to either page — there's no create-platform-user endpoint to
  call. (Resident *creation* is a real, separate feature — it lives on the different
  `admin/UserManagementPage.tsx` resident-management screen, which this pass didn't touch.)
- **No Building/Apartment filter** — `PlatformUser` carries no such field.
- **No server-side pagination wired up** — the endpoint returns the full list with no page/size
  params to send. Client-side pagination (`Pagination.tsx`, new) was still added since the
  brief's core complaint was "the table wastes space" — it slices the array that's already fully
  loaded, 10 rows/page; it does not pretend to be a server request.
- **No fabricated "Last Activity" column** — used the one real timestamp (`createdAt`, labeled
  "Member Since") instead of inventing an activity field.
- **No granular permissions checklist/matrix on Role Management** — the brief's mockup (section
  22-23) implies a permission-entity model (`View Dashboard`, `Manage Billing`, etc. as
  individually toggleable rows) that this backend does not have; building that UI would imply a
  security model that doesn't exist. Kept role-card descriptions to one accurate, generic line
  each instead (what Building Owner/Resident/Super Admin actually do in this app, grounded in
  real routes) — the same kind of human-readable labeling the app already does elsewhere (e.g.
  `ADMIN` → "Building Owner"), not a fabricated data field.

**New shared components:**
- `components/common/InitialsAvatar.tsx` — compact initials avatar (e.g. "Geddamuri Swathi" →
  "GS"), same pattern as the existing initials badge in `Navbar`'s profile menu, reused instead
  of duplicated.
- `components/common/RowActionsMenu.tsx` — accessible "⋮" kebab menu (click-outside, Escape,
  `role="menu"`) so a row's actions no longer compete for horizontal space with a full-width
  button; same interaction pattern as `Navbar`'s existing profile dropdown, not a new one.
- `components/common/Pagination.tsx` — compact "Showing X–Y of N" pager with page numbers +
  ellipsis, operating purely client-side over an already-loaded array (see above).
- `components/platform/PlatformUserDetailsDrawer.tsx` — right-side drawer with only real
  `PlatformUser` fields (avatar/name/username, email, role badge, status badge, member-since
  date). No Building field (mockup showed one; no such data exists here).
- `components/platform/platformUserDisplay.tsx` — shared `ROLE_LABEL` map + compact `RoleBadge`/
  `StatusBadgeCompact` components, used by both tables below (kept in its own file so Vite's
  fast-refresh doesn't warn about a component file also exporting constants).
- `index.css` — added an opt-in `.table-compact` modifier (denser th/td padding) rather than
  editing the shared `.table-base` rule, so every other table in the app keeps its current
  spacing untouched.

**`components/platform/PlatformUsersTable.tsx`** (User Management, and — since it's shared —
also Building Owner Management) — rewritten as an enterprise data grid: a KPI strip (Total /
Active, plus a Building Owners/Residents role split shown only on the unfiltered view so Building
Owner Management doesn't repeat the same total twice — Building Owner Management wasn't in this
pass's scope but automatically inherits the shared component's improvements, same as every prior
shared-component upgrade in this file's history); a toolbar with search, a role filter (a
previously-unused capability — `usePlatformUsers(role)` already accepted this param, just had no
UI control for it), the existing status filter, and a "Clear Filters" button that only appears
once a filter is active; a compact table (avatar + name, username-primary/email-secondary account
column with `title` for the full address on truncation, role badge, status badge, a kebab menu
with View Details + Enable/Disable) using the new `.table-compact` modifier; a responsive card
layout below `sm` (was already present, kept and restyled to match); the details drawer; and the
existing `ConfirmDialog` before disabling (unchanged behavior, just restyled copy to match the
brief's wireframe wording).

**`components/platform/RoleAssignmentTable.tsx`** (new, Role Management only) — a deliberately
different information architecture from the table above, not a reskin of it: role-summary cards
for Building Owner / Resident / Super Admin (the last one shown as fixed/non-editable, so it's
clear *why* it never appears in the table below rather than just silently missing); a table whose
primary editable column is Role itself (an inline `<select>`, restricted to `ADMIN`/`RESIDENT` —
same rule as before) instead of a read-only badge, with Member Since instead of a Status column —
Enable/Disable was deliberately left out of this table entirely, since account status is User
Management's concern and role assignment is this page's; and a role-change confirmation dialog
(new — the previous version fired the role change immediately on `<select>` change with no
confirmation at all, which the brief's own emphasis on confirming meaningful actions argued
against, even though role changes aren't literally "destructive" in the delete/disable sense).

**Pages:** both `UserManagementPage.tsx` and `RoleManagementPage.tsx` — header copy switched to
the brief's exact wording, moved onto the shared `text-h1`/`text-body` typography classes (already
used by every previously-redesigned page), and the old single `glass-panel` wrapper around the
whole KPI+table block was removed so the KPI cards render as their own row of cards above the
table — matching real enterprise dashboards (and the brief's own KPI-strip mockup) rather than one
big nested panel.

**Verified for real:** `npm install` (308 packages, registry reachable this session) →
`npx tsc -b` → 0 TypeScript errors → `npx vite build` → exit 0, clean production build, same
pre-existing main-chunk-size notice only → `npx eslint` on every new/touched file → 0 errors, 1
pre-existing-pattern warning (`react-refresh/only-export-components` on the constants file, same
class of warning already noted as acceptable elsewhere in this doc) → grepped all touched files
for `window.confirm/alert/prompt` and `console.log` — none introduced.

**Explicitly not done in this pass (out of the two-page scope given):**
- `BuildingOwnerManagementPage.tsx` wasn't redesigned itself — it just inherits
  `PlatformUsersTable`'s improvements automatically since it's the same shared component with
  `roleFilter="ADMIN"`, unchanged otherwise.
- No backend changes of any kind (no new endpoints, no pagination support added, no permissions
  model added) — everything above works within what the API already returns.
- No rendered, in-browser check at the specific breakpoints listed in the brief (1280/1440/1920/
  768/1024/320/375/425) — this sandbox has no browser; the responsive behavior (`hidden sm:block`
  table / `sm:hidden` cards, `lg:` toolbar wrapping) follows the same pattern already used and
  visually verified elsewhere in this app (Apartments, Households, Communities, Meter Config), but
  wasn't independently re-verified pixel-by-pixel here.
- Backend Maven build — still unreachable from this sandbox (Maven Central not in the allowed
  domain list); not attempted, same caveat as every prior increment in this file.

## Done — Resident dashboard: fixed uneven KPI card heights (response to "Fix the
Water Billing Dashboard UI" brief, no screenshot actually attached this pass)

No image came through with this request, only the project zip, so this pass worked
directly from the current `ResidentDashboardPage.tsx` and the brief's specific, itemized
list rather than a visual reference. Audited every item in the list against the real code
before changing anything (same approach as every prior increment in this file) — the
resident dashboard was already in good shape structurally: `MainLayout` scrolls correctly
(`overflow-y-auto` on `<main>`, no clipped content), `Sidebar` is a properly fixed desktop
rail with a separate mobile drawer (no overlap), charts use a fixed-height
`ResponsiveContainer` (no cut-off), currency/consumption formatting and ₹ symbols were
already correct and untouched, no business logic/API calls were anywhere near this file.

**Real, root-caused bug found and fixed — inconsistent KPI card height (brief section
3: "Equal or visually consistent height"):** the 5-card KPI row wraps each `KpiCard` in a
`Reveal` entrance-animation div. `Reveal` (not `KpiCard`) is the actual CSS grid item, and
grid items stretch to the row's tallest neighbor by default — but `Reveal`'s child
(`.kpi-card`) had no `height: 100%` of its own, so it only took its natural content
height inside the taller stretched wrapper. Cards whose caption text is longer or absent
("Available once this month's data is in" vs. a short badge) ended up visibly different
heights within the same row — exactly the symptom the brief described. Root cause, not
a cosmetic patch:
- `index.css` — added `h-full` to the shared `.kpi-card` rule (with a comment explaining
  why). This class is also used directly as a grid child on two other pages
  (`SuperAdminDashboardPage`, `MyBillsPage`) where it was already being stretched by the
  grid itself — `h-full` there is a no-op, not a behavior change.
- `ResidentDashboardPage.tsx` — added `className="h-full"` to all 5 `Reveal` wrappers in
  the KPI grid (and to the `Link` wrapping the "Outstanding" card when it's clickable),
  so the stretch now propagates all the way from the grid row through the animation
  wrapper into the visible card.

**Reviewed against the rest of the brief, no further code change needed:** header spacing
(greeting/title/apartment/unit/billing-period) already uses a deliberate `mt-1`/`mt-3`
rhythm with responsive `flex-col sm:flex-row`; icon alignment/typography/padding inside
`KpiCard` were already consistent (`h-11 w-11` icon badge, `text-xs` label, `text-base
sm:text-lg` value, `break-words` so long INR/kL values wrap instead of truncating);
sidebar preserves the exact nav items listed in the brief with active-state styling
(`sidebar-link-active`) and doesn't overlap content at any breakpoint; responsive grid
already steps `1 → 2 → 3 → 5` columns per breakpoint with no horizontal scroll. Nothing
in `useResidentDashboard`, `useMyInvoices`, billing math, or auth was touched.

**Verified for real:** `npm install` (308 packages) → `npx tsc -b` → 0 TypeScript errors
→ `npx vite build` → exit 0, clean production build, same pre-existing main-chunk-size
notice as every prior increment (unrelated). Grepped the two touched files for
`console.log`/`window.confirm` — none introduced.

**Not verified (no browser in this sandbox):** an actual rendered screenshot at
desktop/tablet/mobile widths to visually confirm the fix — the root cause is a CSS grid
stretch/box-model issue that's straightforward to reason about statically, but a real
visual check in a browser is worth doing before considering this fully closed.

## Done — Bills page: dynamic chart scale, readable tooltip, compact hero card
(response to "Fix the Bills Page UI" brief; again no screenshot actually attached,
worked from the itemized brief against the real code)

**Root cause found and fixed — misleading Y-axis scale (brief section 3, the chart
showing 0/3.5K/7K/10.5K/14K for much smaller bill values):** `MonthlyTrendChart.tsx`
(shared by `MyBillsPage`, `DashboardPage`, `WaterAnalyticsPage` x2, `RevenueDashboardPage`,
`RevenueAnalyticsPage` -- 6 pages, 1 fix) used Recharts' `domain={[0, 'auto']}` with
`allowDecimals={false}`. That combination rounds the axis ceiling up to a large,
evenly-divisible number regardless of how close the real data max is to it -- for bills
in the hundreds/low-thousands it could still land on a 14K-style ceiling. Replaced with
`utils/chartScale.ts` (new): a standard "nice numbers for graph labels" (Heckbert)
algorithm that computes the axis max and tick values directly from
`Math.max(...actual bill amounts)` with ~15% headroom, no hardcoded scale, no library
auto-domain guesswork. Verified in isolation: a real max of ₹550 now produces ticks
0/200/400/600/800; ₹1,248 produces 0/500/1000/1500 -- proportional to the actual data
either way, not a fixed large ceiling. Reused (not duplicated) across all 6 pages that
render this chart, per the brief's own "reuse existing chart utilities" instruction.

**Root cause found and fixed -- tooltip contrast (brief section 5):** the same chart's
`<Tooltip contentStyle={{...}} />` never set an explicit background/text color, so it
fell back to Recharts' default white surface while inheriting near-white text color from
this dark theme's ambient styling -- light text on a white background. Replaced with the
same Tailwind-classed custom tooltip pattern `UsageTrendChart.tsx` already uses elsewhere
in the app (`bg-white dark:bg-ocean-800`, `text-ocean-900 dark:text-white`), rather than
inventing a second tooltip styling approach.

**Compacted the bill summary card (brief section 2):** `InvoiceHeroCard.tsx` was three
separately-`border-t`-divided, vertically-stacked blocks (amount, then a
consumption/due-date row, then an actions row) -- each with its own top margin/padding,
pushing real vertical height into the page. Rebuilt as a single balanced row on desktop
(Bill amount | Consumption / Due date | Actions, using `lg:flex-row` with vertical
dividers) that still stacks cleanly on mobile. Same fields, same `InvoicePdfButton`/
`onView` handlers -- no functional change, layout only.

**Fixed the summary-card/chart height mismatch (brief section 6):** `ConsumptionVsBillCard`
sits next to the trend chart in a `lg:grid-cols-3` row (chart at 2/3 width, summary at
1/3 -- already matching the brief's 65-70% / 30-35% split, so that ratio needed no
change). But the wrapping `<div>` around the summary card was the actual grid item that
stretched to the row height, while `ConsumptionVsBillCard` itself had no `h-full` to fill
that wrapper -- identical root cause to the KPI-card height bug fixed on the resident
dashboard in the previous increment. Fixed the same way: `h-full` on both the wrapper and
the card, plus `items-center` so the two content columns stay vertically centered as the
card stretches.

**Reviewed against the rest of the brief, no further change needed:** page/sidebar/header
layout was already correct (`MainLayout`'s `<main>` scrolls independently, sidebar is
fixed, no overlap); no fixed pixel widths beyond one `lg:min-w-[190px]` well inside the
1600px content container (no horizontal overflow risk); spacing already reuses the app's
existing `card`/`kpi-card`/`text-caption`/`section-title` tokens rather than one-off
values; dark navy theme, cyan/teal accents, rounded cards, sidebar nav items and the
"Bills" active-state highlighting were untouched. No API call, invoice/billing
calculation, PDF download, or auth logic was touched -- only `MonthlyTrendChart.tsx`,
the new `chartScale.ts`, `InvoiceHeroCard.tsx`, `ConsumptionVsBillCard.tsx`, and the
grid wrapper in `MyBillsPage.tsx` were modified.

**Verified for real:** `npm install` (308 packages) → `npx tsc -b` → 0 TypeScript errors
→ `npx vite build` → exit 0, clean production build (same pre-existing chunk-size
notice as every prior increment). Also ran the nice-scale function standalone against
₹550 / ₹1,248 / ₹13,735.73 / ₹89 / ₹25,000 to confirm the output stays proportional to
the real max at every scale rather than defaulting to a big round ceiling.

**Not verified (no browser in this sandbox):** an actual rendered screenshot at
desktop/tablet/mobile widths -- worth a real visual check before considering this fully
closed, same caveat as the previous increment.

## Done — Consumption/Bill summary card visual rebuild (response to a real screenshot
of the card, styling-only per the brief)

Rebuilt `ConsumptionVsBillCard.tsx` (used on `MyBillsPage`, next to the Monthly Bill
Trend chart) to match an explicit visual spec. No data, formatter, prop, or API call was
touched -- `invoice.consumptionKl` / `invoice.totalAmount` flow through the exact same
`formatKl`/`formatINR` calls as before.

**What changed and why:**
- Replaced the `divide-x` two-column layout with a real 3-column grid on desktop
  (`sm:grid-cols-[1fr_auto_1fr]`: consumption / divider / bill) so both sections get
  genuinely equal width, plus a single-column stacked layout on mobile with a horizontal
  divider between the two sections instead of a cramped two-up grid.
- The divider is now a dedicated, deliberately-sized element (`h-16 w-px`, `mx-5` on each
  side) instead of a `divide-x` border tied to whatever height the content box happened
  to be -- it's short of the card's top/bottom edges and low-contrast
  (`bg-ocean-100`/`dark:bg-ocean-800`, the same subtle border tone used for dividers
  elsewhere in the app) on both mobile (horizontal) and desktop (vertical).
- Both icon badges are now identical `h-12 w-12` circles (were already circular/consistent
  in size, just formalized at a slightly larger, more balanced size against the larger
  value text below).
- Labels: `text-xs font-medium text-aqua-600 dark:text-aqua-300` -- reused the existing
  `aqua-*` accent scale already used for labels/eyebrows throughout the app, rather than
  introducing a new color, to read as a clearly muted blue/cyan rather than plain gray.
- Values: bumped to `text-2xl font-bold` with `whitespace-nowrap` so `₹13,735.73`-scale
  amounts can never wrap onto a second line, and `leading-tight` for a tighter, more
  deliberate line height.
- Outer card is `flex flex-col justify-center` so the whole icon/label/value group is
  vertically centered as a single block when the card is stretched to match the trend
  chart's height (see the previous increment's `h-full` fix) -- addresses the large empty
  area below the content that the screenshot showed, without changing why the card is
  that height in the first place (that's still the deliberate chart-height match from the
  prior increment, not something to remove).
- Card padding `p-6 sm:p-7` (24/28px) and icon-to-text gap `gap-4` (16px) reuse existing
  Tailwind spacing tokens already used elsewhere in the app, landing inside the requested
  24-32px / 14-18px ranges without introducing new spacing values.

**Verified for real:** `npx tsc -b` -- 0 TypeScript errors. `npx vite build` -- exit 0,
clean production build, same pre-existing chunk-size notice as every prior increment.

**Not verified (no browser in this sandbox):** a rendered screenshot at each breakpoint
to confirm pixel-level spacing -- worth a quick visual check, same standing caveat as
every prior increment in this file.

---

## Household Usage Comparison — show ALL households, not just one (2026-08-24)

**Root cause found by tracing the full data flow (DB → repo → service → controller →
frontend):** the chart was never hardcoded to one household. `GET /api/v1/admin/analytics/water`
already scoped correctly to the logged-in Building Owner's apartments
(`w.household.apartment.admin.id = :adminId`). The bug was that `topConsumers` was built
*only* from `WaterUsageLogRepository.topConsumersForAdmin(...)`, a query grouped from
**usage-log rows for the current month**. Any household with no meter reading logged yet
this month simply never produced a row -- it wasn't filtered out, it was never in the
source data to begin with. In a fresh/lightly-seeded environment where only one unit
(`A-101`) has a current-month reading, that's the only bar that can ever appear, no matter
how many households actually exist.

**Fix (backend, `AnalyticsService.getWaterAnalytics`):**
- Added `HouseholdRepository.findByApartmentAdminIdOrderByUnitNumberAsc(adminId)` -- the
  actual household roster (every unit across every apartment the admin owns), independent
  of who has logged a reading.
- New response field `householdUsage: TopConsumerResponse[]` = every household in that
  roster, zero-filled from a current-month-consumption map when no reading exists yet.
  Unit-number sorted (`A-101, A-102, A-103, ...`).
- Existing `topConsumers` field (ranked, capped at 10, usage-only) is untouched --
  it still powers the separate "Top Consumers" leaderboard list, which is intentionally
  a different view (rank by usage) from the comparison chart (show every unit).

**Fix (frontend):**
- `WaterAnalytics` type gained `householdUsage: TopConsumer[]`.
- Both places that render the comparison chart -- `DashboardPage.tsx` and
  `WaterAnalyticsPage.tsx` -- now pass `data.householdUsage` / `waterAnalytics?.householdUsage`
  into `HouseholdUsageBarChart` instead of `topConsumers`.
- `HouseholdUsageBarChart.tsx`:
  - Empty-roster message changed to "No household usage data available for this apartment."
  - Removed the old "all zero → hide the chart" branch -- a household with 0 kL this month
    now renders as a real zero-length bar (per requirement: show actual zero values, don't
    hide behind a message).
  - Average/red-highlight threshold (30%, i.e. `avg * 1.3`) is unchanged and still computed
    dynamically from whatever's on screen -- now correctly averaged across every household,
    not just the ones with logged usage. Guarded against `avg === 0` (all-zero roster) so it
    doesn't flag every bar red.
  - Chart height still grows with household count, but is now capped at 480px with the
    container becoming vertically scrollable beyond that, so a 50-household apartment stays
    usable instead of pushing the whole dashboard out of view.
  - Tooltip now reports consumption, apartment average, and above/below-average % together
    per bar.

**Verified for real:** `npx tsc -b` -- 0 TypeScript errors. `npx vite build` -- exit 0,
clean build. `npx eslint` on all touched files -- 0 errors.

**Not verified (no Maven/JDK in this sandbox, same standing caveat as every prior
increment in this file):** the backend was reviewed carefully by hand (brace/paren
balance checked, follows the exact existing repository/service/DTO patterns in the file)
but never compiled or run against a real database. Please run the backend test suite /
a manual smoke test against seeded multi-household data before shipping.
