/**
 * Circular water-level gauge: current month's consumption as a percentage of the
 * household's average, giving an at-a-glance "how am I doing" read. Purely derived
 * from ResidentDashboardStats.currentMonthUsageKl / averageUsageKl -- no invented
 * targets or thresholds. Renders a neutral state if either figure is unavailable.
 */
import { useCountUp } from '@/hooks/useCountUp';

export default function WaterLevelMeter({
  currentKl,
  averageKl,
}: {
  currentKl: number | null;
  averageKl: number | null;
}) {
  const hasData = currentKl != null && averageKl != null && averageKl > 0;
  const pct = hasData ? Math.round((currentKl! / averageKl!) * 100) : null;
  // Cap the visual fill at 100% of the ring so an unusually high month doesn't overflow.
  const fillPct = pct != null ? Math.min(100, pct) : 0;
  // Draw the ring in from empty on mount, over the real (already-fetched) fill
  // percentage -- never fabricates the underlying number, only the animation frames.
  const animatedFillPct = useCountUp(hasData ? fillPct : 0, 900);

  const size = 168;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animatedFillPct / 100);

  const tone =
    pct == null ? 'stroke-ocean-300 dark:stroke-ocean-700'
      : pct <= 90 ? 'stroke-emerald-500'
      : pct <= 110 ? 'stroke-amber-500'
      : 'stroke-status-critical';

  const diffPct = pct != null ? pct - 100 : null;
  const animatedCurrentKl = useCountUp(hasData ? currentKl! : 0, 900);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            className="stroke-ocean-100 dark:stroke-ocean-800"
          />
          {hasData && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={`transition-all duration-700 ease-out ${tone}`}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hasData ? (
            <>
              <span className="text-2xl font-bold text-ocean-900 dark:text-white">
                {animatedCurrentKl.toFixed(1)} kL
              </span>
              <span className="text-caption">this month</span>
            </>
          ) : (
            <span className="text-caption max-w-[100px] text-center">Not enough data yet</span>
          )}
        </div>
      </div>
      {hasData && diffPct !== null && (
        <p className="text-body text-center">
          {diffPct <= 0 ? (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {Math.abs(diffPct)}% below your average
            </span>
          ) : (
            <span className="font-medium text-status-critical">{diffPct}% above your average</span>
          )}
        </p>
      )}
    </div>
  );
}
