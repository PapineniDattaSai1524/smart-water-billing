/**
 * Shared number-formatting helpers.
 *
 * Root-cause fix for the "000 / 0000 / 00000" axis-tick and KPI display bugs:
 * every place that rendered a raw number (or used the browser default
 * `toLocaleString()`, which is locale-dependent and was clipping inside
 * narrow chart containers) now goes through one of these instead.
 */

/** Formats a plain number using the Indian numbering system (e.g. 1,00,000). */
export function formatIndianNumber(value: number | null | undefined, maximumFractionDigits = 0): string {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits }).format(value);
}

/** Formats a rupee amount using the Indian numbering system with a ₹ prefix. */
export function formatINR(value: number | null | undefined, maximumFractionDigits = 2): string {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits,
  }).format(value);
}

/** Formats a water-consumption value in kilolitres, e.g. "1,250 KL". */
export function formatKl(value: number | null | undefined, maximumFractionDigits = 1): string {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '0 KL';
  return `${formatIndianNumber(value, maximumFractionDigits)} KL`;
}

/**
 * Compact axis-tick formatter for chart Y/X axes. Keeps ticks short so they
 * never get clipped by a narrow axis width (the direct cause of the "000"
 * bug): 100000 -> "1L", 25000 -> "25K", 500 -> "500".
 */
export function formatCompactIndian(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return '0';
  const abs = Math.abs(value);
  if (abs >= 10000000) return `${(value / 10000000).toFixed(abs % 10000000 === 0 ? 0 : 1)}Cr`;
  if (abs >= 100000) return `${(value / 100000).toFixed(abs % 100000 === 0 ? 0 : 1)}L`;
  if (abs >= 1000) return `${(value / 1000).toFixed(abs % 1000 === 0 ? 0 : 1)}K`;
  return formatIndianNumber(value);
}

/**
 * Formats a "yyyy-MM" billing-period key (e.g. "2026-08", as stored/emitted by
 * the backend so it stays sortable/unambiguous) into a human-readable label,
 * e.g. "Aug 2026" (short, default) or "August 2026" (long).
 * Root-cause fix for raw "2026-08" strings leaking into invoice tables/cards —
 * the API contract is untouched, only the display layer changed.
 */
export function formatBillingPeriod(value: string | null | undefined, style: 'short' | 'long' = 'short'): string {
  if (!value) return '—';
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return value; // not a yyyy-MM key — show as-is rather than guess
  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { month: style === 'long' ? 'long' : 'short', year: 'numeric' });
}

/**
 * Formats an ISO date/timestamp string into a human-readable date, e.g.
 * "15 Aug 2026" (default) — never the ambiguous browser-locale-dependent
 * "8/15/2026" that `toLocaleDateString()` alone produces.
 */
export function formatDate(value: string | Date | null | undefined, style: 'short' | 'long' = 'short'): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  });
}

/**
 * Formats a real invoice's numeric database id as a display invoice number,
 * e.g. id 3 -> "INV-003". This is a pure display format over the real id —
 * there is no separate "invoice number" field in the data model, and this
 * does not invent one; it never appears anywhere except as a label.
 */
export function formatInvoiceNumber(id: number | string): string {
  return `INV-${String(id).padStart(3, '0')}`;
}

/** Safely computes a month-over-month % change; returns null when it can't be meaningfully expressed. */
export function safePercentChange(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current == null || previous == null) return null;
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return null; // avoid Infinity / NaN / absurd percentages
  const pct = ((current - previous) / previous) * 100;
  return Number.isFinite(pct) ? pct : null;
}
