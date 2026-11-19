import { BarChart3, Gauge, Lightbulb, Receipt, Wallet, Waves } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

const STAGES = [
  { icon: Waves, label: 'Meter Reading' },
  { icon: Gauge, label: 'Water Usage' },
  { icon: BarChart3, label: 'Analytics' },
  { icon: Receipt, label: 'Billing' },
  { icon: Wallet, label: 'Payment' },
  { icon: Lightbulb, label: 'Insights' },
];

/**
 * The homepage's signature "from data to decision" moment: a connected
 * pipeline showing how a single meter reading flows into a billed, paid
 * invoice and, ultimately, an insight. Every stage names a real capability
 * already present in the app (usage logging, analytics dashboards, billing,
 * payments, reports) — nothing here is aspirational.
 */
export default function DataPipeline() {
  return (
    <section id="analytics-pipeline" className="relative overflow-hidden bg-ocean-950 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="section-title text-aqua-300">From data to decision</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            One reading becomes a clear decision.
          </h2>
          <p className="mt-4 text-white/50">
            Every stage below is a real part of the platform — not a marketing diagram.
          </p>
        </Reveal>

        <div className="relative mt-16">
          {/* Connecting line: horizontal on desktop, vertical on mobile */}
          <div
            className="pointer-events-none absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-aqua-400/40 via-white/10 to-transparent sm:block lg:left-0 lg:top-8 lg:h-px lg:w-full lg:bg-gradient-to-r"
            aria-hidden
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
            {STAGES.map(({ icon: Icon, label }, i) => (
              <Reveal key={label} delay={i * 140} className="flex items-center gap-4 lg:flex-1 lg:flex-col lg:items-center lg:text-center">
                <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-aqua-400/30 bg-ocean-900 text-aqua-300 shadow-glow-aqua">
                  <Icon size={22} />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-aqua-500 text-[10px] font-bold text-ocean-950">
                    {i + 1}
                  </span>
                </span>
                <div className="lg:mt-1">
                  <p className="font-display text-sm font-semibold text-white">{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
