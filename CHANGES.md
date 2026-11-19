# Invoice History Redesign — What Changed

All changes are presentation-only, inside `frontend/src`. No API contracts,
calculations, database structure, or PDF generation logic were touched.

## New files (frontend/src/components/billing/)
- `InvoiceStatusBadge.tsx` — icon + text badge for the real statuses
  (`PAID`, `UNPAID`, `OVERDUE`, `CANCELLED`; note: the API has no `PENDING`
  status, so the design was adapted to what actually exists).
- `InvoicePdfButton.tsx` — same `GET /invoices/{id}/pdf` call as before,
  now with Downloading → Downloaded button states.
- `InvoiceHeroCard.tsx` — the prominent "current bill" card, with a
  one-time count-up on the amount (skipped automatically for
  `prefers-reduced-motion`).
- `InvoiceListCard.tsx` — replaces the old table row / mobile-card split
  with one responsive card used at every breakpoint.
- `InvoiceDetailModal.tsx` — "View Invoice" preview, built entirely from
  the already-fetched `Invoice` object (including its `breakdown` when
  present) — no new network call, no invented line items.
- `InvoiceSkeleton.tsx` — invoice-shaped loading skeletons (reuses the
  existing `Skeleton` primitive) instead of a full-page spinner.

## New file (frontend/src/hooks/)
- `useCountUp.ts` — small reusable animation hook for the amount count-up.

## Rewritten
- `pages/resident/MyBillsPage.tsx` — now: header → 4 summary cards
  (Current Bill / Total Billed / Average Bill / Total Consumption, all
  computed from the real invoice list) → hero card for the latest
  invoice → a monthly-bill trend chart (reuses the existing
  `MonthlyTrendChart` component, only rendered when ≥2 data points exist)
  → searchable/filterable invoice history with status and year filters,
  active-filter chips, and a "Show more" reveal instead of a giant table.

## Added in the follow-up pass
- **Generic "Unable to load invoices" error state with Retry** (§22).
  Distinguished from the pre-existing "not linked to a household" case by
  checking the real HTTP status the backend returns
  (`ResourceNotFoundException` → 404 for "no household"; anything else is
  treated as a genuine fetch failure with a Retry button wired to
  react-query's `refetch()`).
- **Consumption vs Bill mini-widget** (§17) —
  `components/billing/ConsumptionVsBillCard.tsx`. Two numbers only
  (current invoice's consumption and total), both already on the
  `Invoice` object — no new analytics, no invented figures.

## Deliberately not built
- **Timeline alternative layout** (§9) — spec said pick cards *or*
  timeline; cards were implemented.
- **Payment success screen** (§37) — no payment flow exists on this
  page/in this codebase to attach it to.
- **"Download Statement" as a combined multi-invoice PDF** — no backend
  endpoint for that exists; the button downloads the latest invoice's
  real PDF instead of faking a feature.
- **True numbered pagination** (§23) — backend returns the full list
  with no page metadata, so a "Show more" reveal was used instead of
  fabricating page counts.

## Known limitation
This sandbox has no network access, so `npm install` / a real `tsc`
build couldn't be run here to verify it end-to-end. I reviewed every new
file by hand against the project's `strict` + `noUnusedLocals` /
`noUnusedParameters` TypeScript config, the existing design-token
classes (`.card`, `.kpi-card`, `.badge-*`, `.input`, Tailwind color
scale), and cross-checked the error-state logic against the actual
backend controller/exception-handler code in this same zip. You should
still run `npm run build` (or `tsc --noEmit`) once you pull this in.
