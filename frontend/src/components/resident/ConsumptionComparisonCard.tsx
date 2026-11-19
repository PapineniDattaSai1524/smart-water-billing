import type { ConsumptionComparison } from '@/utils/types';
import { formatBillingPeriod } from '@/utils/format';
import { Droplets } from 'lucide-react';
import clsx from 'clsx';
import { useCountUp } from '@/hooks/useCountUp';

const STATUS_LABEL: Record<ConsumptionComparison['status'], string> = {
  BELOW_AVERAGE: 'Below average',
  NEAR_AVERAGE: 'Near average',
  ABOVE_AVERAGE: 'Above average',
};

const STATUS_BADGE: Record<ConsumptionComparison['status'], string> = {
  BELOW_AVERAGE: 'badge-healthy',
  NEAR_AVERAGE: 'badge-info',
  ABOVE_AVERAGE: 'badge-warning',
};

function Bar({
  label, valueKl, maxKl, barClass, highlight,
}: {
  label: string; valueKl: number | null; maxKl: number; barClass: string; highlight?: boolean;
}) {
  const pct = valueKl != null && maxKl > 0 ? Math.min(100, (valueKl / maxKl) * 100) : 0;
  // Grow the bar in from empty on mount/data-change, over the real percentage.
  const animatedPct = useCountUp(pct, 700);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={clsx('font-medium', highlight ? 'text-ocean-900 dark:text-white' : 'text-ocean-500 dark:text-ocean-400')}>
          {label}
        </span>
        <span className="font-semibold text-ocean-800 dark:text-ocean-100">
          {valueKl != null ? `${valueKl} kL` : 'No data'}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-ocean-100 dark:bg-ocean-800">
        <div
          className={clsx('h-full rounded-full', barClass)}
          style={{ width: `${animatedPct}%` }}
        />
      </div>
    </div>
  );
}

// Week 5-6 Feature 4: real consumption comparison -- own household vs. apartment average
// vs. similar-sized household average, all computed server-side from live data.
export default function ConsumptionComparisonCard({ data }: { data: ConsumptionComparison | undefined }) {
  if (!data) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-ocean-400 dark:text-ocean-500">
        <Droplets size={24} className="opacity-50" />
        <p className="text-sm">Comparison data not available yet</p>
      </div>
    );
  }

  const maxKl = Math.max(data.myUsageKl, data.apartmentAverageKl ?? 0, data.similarSizedAverageKl ?? 0, 1) * 1.15;
  const diffFromAvg = data.apartmentAverageKl != null
    ? Math.round(((data.myUsageKl - data.apartmentAverageKl) / data.apartmentAverageKl) * 100)
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption">{formatBillingPeriod(data.billingMonth)}</p>
        <span className={STATUS_BADGE[data.status]}>{STATUS_LABEL[data.status]}</span>
      </div>

      <div className="space-y-4">
        <Bar label="Your Household" valueKl={data.myUsageKl} maxKl={maxKl} barClass="bg-aqua-500" highlight />
        <Bar
          label={`Apartment Average${data.apartmentHouseholdCount ? ` (${data.apartmentHouseholdCount} households)` : ''}`}
          valueKl={data.apartmentAverageKl}
          maxKl={maxKl}
          barClass="bg-violet-400"
        />
        <Bar
          label={
            data.similarSizedHouseholdCount > 0
              ? `Similar-Sized Households (${data.similarSizedHouseholdCount})`
              : 'Similar-Sized Households'
          }
          valueKl={data.similarSizedAverageKl}
          maxKl={maxKl}
          barClass="bg-amber-400"
        />
      </div>

      {diffFromAvg !== null && (
        <p className="text-body border-t border-ocean-100 pt-4 dark:border-ocean-800">
          You&apos;re using{' '}
          <span className={clsx('font-semibold', diffFromAvg <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-status-critical')}>
            {Math.abs(diffFromAvg)}% {diffFromAvg <= 0 ? 'less' : 'more'}
          </span>{' '}
          water than the apartment average.
        </p>
      )}
    </div>
  );
}
