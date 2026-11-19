import { ArrowRight, ClipboardX, FileWarning, Layers, Network } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

const PROBLEMS = [
  { icon: ClipboardX, label: 'Manual meter readings' },
  { icon: Layers, label: 'Scattered household records' },
  { icon: FileWarning, label: 'Billing confusion and disputes' },
  { icon: Network, label: 'Limited visibility into usage' },
];

const SOLUTIONS = [
  'Digital usage logs, entered directly or imported in bulk',
  'Every apartment, household and resident in one structure',
  'Transparent, itemised invoices generated from actual readings',
  'Real-time consumption and billing analytics for every role',
];

export default function ProblemSolution() {
  return (
    <section className="relative overflow-hidden bg-ocean-900 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-teal-600/10 blur-[100px]" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="section-title text-aqua-300">Why Smart Water Billing</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Water management shouldn&apos;t be complicated.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          {/* Before */}
          <Reveal>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/35">Without a platform</p>
              <ul className="mt-5 space-y-4">
                {PROBLEMS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-white/55">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-white/40">
                      <Icon size={15} />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Arrow */}
          <Reveal delay={100} className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-aqua-400/30 bg-ocean-950 text-aqua-300 shadow-glow-aqua lg:rotate-0">
              <ArrowRight size={20} className="rotate-90 lg:rotate-0" />
            </span>
          </Reveal>

          {/* After */}
          <Reveal delay={180}>
            <div className="h-full rounded-2xl border border-aqua-400/20 bg-gradient-to-br from-aqua-500/[0.08] to-teal-500/[0.03] p-7 shadow-glow-aqua">
              <p className="text-xs font-semibold uppercase tracking-wide text-aqua-300">With Smart Water Billing</p>
              <ul className="mt-5 space-y-4">
                {SOLUTIONS.map((label) => (
                  <li key={label} className="flex items-start gap-3 text-sm text-white/80">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-aqua-400" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
