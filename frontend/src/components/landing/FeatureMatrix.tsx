import { Check } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

/**
 * Every row here maps to a real route/feature in App.tsx and the backend
 * migrations — nothing aspirational. "Scope" reflects which role(s) the
 * capability is actually available to, not a generic checkmark.
 */
const CAPABILITIES: { label: string; scope: string }[] = [
  { label: 'Building & apartment management', scope: 'Building Owner' },
  { label: 'Household & resident management', scope: 'Building Owner' },
  { label: 'Meter configuration', scope: 'Building Owner' },
  { label: 'Water usage logging', scope: 'Building Owner' },
  { label: 'Bulk CSV usage import', scope: 'Building Owner' },
  { label: 'Water usage analytics', scope: 'Resident · Building Owner · Super Admin' },
  { label: 'Consumption alerts', scope: 'Building Owner' },
  { label: 'Billing & tiered tariffs', scope: 'Building Owner' },
  { label: 'Invoice PDF download', scope: 'Resident · Building Owner' },
  { label: 'Payments & payment collection', scope: 'Resident · Building Owner' },
  { label: 'Revenue & billing reports', scope: 'Building Owner · Super Admin' },
  { label: 'Role-based access control', scope: 'All roles' },
  { label: 'Platform-wide audit logs', scope: 'Super Admin' },
];

export default function FeatureMatrix() {
  return (
    <section className="relative bg-ocean-900 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="section-title text-aqua-300">Feature overview</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything in one platform.
          </h2>
        </Reveal>

        {/* Desktop/tablet: table. Mobile: stacked cards — a 3-column table with long
            role labels would either overflow or truncate unreadably at 320–425px. */}
        <Reveal delay={120} className="mt-14 hidden overflow-hidden rounded-2xl border border-white/10 sm:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-white/[0.04]">
                <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-white/50">
                  Capability
                </th>
                <th scope="col" className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-white/50">
                  Available to
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-white/50">
                  Included
                </th>
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}
                >
                  <td className="px-6 py-4 text-sm font-medium text-white/85">{row.label}</td>
                  <td className="px-6 py-4 text-sm text-white/45">{row.scope}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-aqua-500/15 text-aqua-300">
                      <Check size={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <Reveal delay={120} className="mt-14 space-y-2.5 sm:hidden">
          {CAPABILITIES.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div>
                <p className="text-sm font-medium text-white/85">{row.label}</p>
                <p className="mt-1 text-xs text-white/40">{row.scope}</p>
              </div>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-aqua-500/15 text-aqua-300">
                <Check size={14} />
              </span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
