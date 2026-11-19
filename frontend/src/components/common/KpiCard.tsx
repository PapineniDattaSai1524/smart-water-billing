import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  /** Optional: percentage change vs. the prior period. Positive = up, negative = down. */
  trendPct?: number | null;
  /** Optional: whether an upward trend is good (default) or bad (e.g. consumption, cost). */
  trendGoodDirection?: 'up' | 'down';
  /** Optional small caption under the value, e.g. "vs last month". */
  caption?: string;
}

export default function KpiCard({
  label,
  value,
  icon: Icon,
  color = 'bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300',
  trendPct,
  trendGoodDirection = 'down',
  caption,
}: KpiCardProps) {
  const hasTrend = trendPct !== undefined && trendPct !== null && Number.isFinite(trendPct);
  const isUp = hasTrend && trendPct! > 0;
  const isGood = hasTrend && (trendGoodDirection === 'up' ? isUp : !isUp);

  return (
    <div className="kpi-card">
      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', color)}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-ocean-500 dark:text-ocean-400">{label}</p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {/* Never clip the value with an ellipsis -- wrap instead so long currency/consumption
              numbers stay fully visible (root fix for the "..." / truncated KPI bug). */}
          <p
            className="break-words text-base font-semibold leading-snug text-ocean-900 dark:text-white sm:text-lg"
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </p>
          {hasTrend && trendPct !== 0 && (
            <span
              className={clsx(
                'flex shrink-0 items-center gap-0.5 text-xs font-semibold',
                isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-status-critical',
              )}
            >
              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(trendPct!).toFixed(0)}%
            </span>
          )}
        </div>
        {caption && <p className="text-caption mt-0.5">{caption}</p>}
      </div>
    </div>
  );
}
