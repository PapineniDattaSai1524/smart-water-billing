import { Droplets, Receipt, TrendingDown, Zap } from 'lucide-react';
import Reveal from '@/components/common/Reveal';
import { useCountUp } from '@/hooks/useCountUp';

const MONTHS = [
  { label: 'Mar', value: 26 },
  { label: 'Apr', value: 24 },
  { label: 'May', value: 28 },
  { label: 'Jun', value: 21 },
  { label: 'Jul', value: 23 },
  { label: 'Aug', value: 18 },
];
const MAX = Math.max(...MONTHS.map((m) => m.value));

export default function ProductPreview() {
  const usage = useCountUp(18.4, 1200);
  const efficiency = useCountUp(94, 1200);

  return (
    <section className="relative bg-ocean-900 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="section-title text-aqua-300">One intelligent platform</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything you need. One intelligent platform.
          </h2>
          <p className="mt-4 text-white/50">
            A single view of consumption, billing and efficiency — the same dashboard your
            residents see after they sign in.
          </p>
        </Reveal>

        <Reveal delay={150} className="mt-14">
          <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-3 shadow-glass-lg sm:p-4">
            <div className="rounded-2xl border border-white/10 bg-ocean-950/60 p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
                <div>
                  <p className="font-display text-sm font-semibold text-white">Resident overview</p>
                  <p className="text-xs text-white/40">Sample dashboard preview</p>
                </div>
                <span className="rounded-full bg-aqua-500/15 px-3 py-1 text-[11px] font-semibold text-aqua-300">
                  August 2026
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Droplets, label: 'This month', value: `${usage.toFixed(1)} kL` },
                  { icon: Receipt, label: 'Current bill', value: '₹1,248' },
                  { icon: TrendingDown, label: 'vs last month', value: '-11%' },
                  { icon: Zap, label: 'Efficiency', value: `${Math.round(efficiency)}%` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <Icon size={16} className="text-aqua-300" />
                    <p className="mt-2 font-display text-lg font-semibold text-white">{value}</p>
                    <p className="text-[11px] text-white/40">{label}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart: last 6 months */}
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-medium text-white/50">Last 6 months (kL)</p>
                <div className="mt-4 flex h-28 items-end gap-3 sm:gap-5">
                  {MONTHS.map((m, i) => (
                    <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex h-full w-full items-end">
                        <div
                          className="w-full origin-bottom animate-grow-bar rounded-t-md bg-gradient-to-t from-aqua-500 to-teal-400 motion-reduce:animate-none"
                          style={{
                            height: `${(m.value / MAX) * 100}%`,
                            animationDelay: `${i * 90}ms`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-white/35">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent invoice row */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                    <Receipt size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">Invoice · August 2026</p>
                    <p className="text-xs text-white/40">18.4 kL · ₹1,248.00</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                  Paid
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
