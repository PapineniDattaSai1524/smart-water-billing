import { Droplets, Gauge, Receipt } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';

/**
 * The homepage's signature visual: a "living" flow-line composition.
 *
 * A glowing wave path (representing the network of meters feeding data
 * upward) runs beneath a glass dashboard card. The card itself contains an
 * illustrative consumption trend line and two KPI chips. All values here are
 * a static visual mockup for the marketing page only — never wired to live
 * data or Math.random() — and are visually separated (dashed "Sample
 * preview" tag) from anything on authenticated pages.
 */
export default function FlowVisual() {
  const usage = useCountUp(18.4, 1400);
  const bill = useCountUp(1248, 1400);

  return (
    <div className="relative mx-auto w-full max-w-md animate-hero-rise-x [animation-delay:400ms] lg:mx-0">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-aqua-500/20 blur-3xl" aria-hidden />

      {/* Flowing wave with glowing metering nodes, sitting behind the card */}
      <svg
        viewBox="0 0 400 420"
        className="pointer-events-none absolute inset-0 -z-0 h-full w-full opacity-90"
        aria-hidden
      >
        <defs>
          <linearGradient id="flowLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d="M -20 300 C 60 260, 90 340, 170 300 S 300 220, 420 260"
          fill="none"
          stroke="url(#flowLine)"
          strokeWidth="2"
          strokeDasharray="2 10"
          className="animate-flow-dash motion-reduce:animate-none"
        />
        {[
          [70, 288],
          [170, 300],
          [300, 232],
        ].map(([cx, cy], i) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="4" fill="#22d3ee" />
            <circle
              cx={cx}
              cy={cy}
              r="4"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1.5"
              className="origin-center animate-ripple-soft motion-reduce:animate-none"
              style={{ animationDelay: `${i * 0.6}s`, transformBox: 'fill-box' }}
            />
          </g>
        ))}
      </svg>

      {/* Glass dashboard card */}
      <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-glass-lg backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-aqua-500/15 text-aqua-300">
              <Droplets size={18} />
            </span>
            <div>
              <p className="text-xs font-semibold text-white/90">Household consumption</p>
              <p className="text-[11px] text-white/45">Sample preview</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            Normal range
          </span>
        </div>

        {/* Mini trend chart */}
        <div className="mt-5">
          <svg viewBox="0 0 280 84" className="h-20 w-full" aria-hidden preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 60 L40 52 L80 58 L120 34 L160 42 L200 22 L240 30 L280 14 L280 84 L0 84 Z"
              fill="url(#areaFill)"
            />
            <path
              d="M0 60 L40 52 L80 58 L120 34 L160 42 L200 22 L240 30 L280 14"
              fill="none"
              stroke="#5eead4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1"
              className="animate-draw-line motion-reduce:animate-none"
              style={{ ['--line-length' as string]: 1 }}
            />
          </svg>
          <div className="mt-1 flex justify-between text-[10px] text-white/35">
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
          </div>
        </div>

        {/* KPI chips */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
            <div className="flex items-center gap-1.5 text-white/50">
              <Gauge size={13} />
              <span className="text-[10px] font-medium uppercase tracking-wide">This month</span>
            </div>
            <p className="mt-1 font-display text-xl font-semibold text-white">
              {usage.toFixed(1)} <span className="text-sm font-normal text-white/50">kL</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
            <div className="flex items-center gap-1.5 text-white/50">
              <Receipt size={13} />
              <span className="text-[10px] font-medium uppercase tracking-wide">Current bill</span>
            </div>
            <p className="mt-1 font-display text-xl font-semibold text-white">
              ₹{Math.round(bill).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Floating droplet accent */}
      <div
        className="absolute -right-4 -top-4 flex h-14 w-14 animate-bob items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-aqua-300 shadow-glass backdrop-blur-md motion-reduce:animate-none"
        aria-hidden
      >
        <Droplets size={22} />
      </div>
    </div>
  );
}
