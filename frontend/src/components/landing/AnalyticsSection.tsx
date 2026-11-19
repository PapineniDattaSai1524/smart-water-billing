import { ShieldCheck, TrendingUp } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

const POINTS = [
  { x: 0, y: 58 }, { x: 56, y: 44 }, { x: 112, y: 50 }, { x: 168, y: 28 },
  { x: 224, y: 36 }, { x: 280, y: 16 }, { x: 336, y: 24 },
];
const PATH = POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
const AREA = `${PATH} L336 100 L0 100 Z`;

export default function AnalyticsSection() {
  return (
    <section id="analytics" className="relative bg-ocean-950 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/40">Consumption trend</p>
                  <p className="mt-1 font-display text-lg font-semibold text-white">Last 7 weeks</p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  <TrendingUp size={12} /> Trending down
                </span>
              </div>
              <svg viewBox="0 0 336 110" className="mt-6 h-48 w-full" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={AREA} fill="url(#analyticsFill)" />
                <path
                  d={PATH}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray="1"
                  className="animate-draw-line motion-reduce:animate-none"
                />
                {POINTS.map((p) => (
                  <circle key={p.x} cx={p.x} cy={p.y} r="3" fill="#e6fffb" />
                ))}
              </svg>
              <div className="flex justify-between text-[10px] text-white/30">
                <span>Wk 1</span><span>Wk 2</span><span>Wk 3</span><span>Wk 4</span>
                <span>Wk 5</span><span>Wk 6</span><span>Wk 7</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="section-title text-aqua-300">Water analytics</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Understand your water usage
            </h2>
            <p className="mt-5 max-w-md text-white/55">
              Track monthly consumption and identify changes before they become problems, with
              trend lines built from your own metering history.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                'Monthly and long-term consumption trends',
                'Household-level and community-level views',
                'Early visibility into unusual usage patterns',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-aqua-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
