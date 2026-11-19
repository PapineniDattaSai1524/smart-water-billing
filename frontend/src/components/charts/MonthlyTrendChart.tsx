import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthlyValue } from '@/utils/types';
import { formatCompactIndian, formatIndianNumber } from '@/utils/format';
import { computeNiceAxisScale } from '@/utils/chartScale';

interface TooltipPayloadItem {
  value?: number;
}

/**
 * Same themed-tooltip pattern already used by UsageTrendChart -- an explicit
 * Tailwind-styled surface (with a dark-mode companion) instead of Recharts'
 * `contentStyle` inline object, which has no dark-mode awareness and was the
 * root cause of the low-contrast "white background, near-white text" tooltip.
 */
function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
  valuePrefix,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  valueLabel: string;
  valuePrefix: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-ocean-100 bg-white px-3 py-2 text-xs shadow-glass-lg dark:border-ocean-700 dark:bg-ocean-800">
      <p className="mb-0.5 font-medium text-ocean-900 dark:text-white">{label}</p>
      <p className="text-ocean-600 dark:text-ocean-300">
        {valueLabel}: {valuePrefix}{formatIndianNumber(Number(payload[0]?.value ?? 0), 2)}
      </p>
    </div>
  );
}

export default function MonthlyTrendChart({
  data,
  color = '#0891b2',
  valueLabel = 'Value',
  valuePrefix = '',
  gradientId = 'trendFill',
}: {
  data: MonthlyValue[];
  color?: string;
  valueLabel?: string;
  valuePrefix?: string;
  /** Unique per chart instance if this component ever renders twice on the same page (SVG defs are global). */
  gradientId?: string;
}) {
  // Validate incoming data before it ever reaches the chart -- null/undefined/NaN/Infinity
  // points are dropped rather than silently rendered as broken ticks or a flat 0 line.
  const cleaned = (data ?? []).filter(
    (d) => d && typeof d.value === 'number' && Number.isFinite(d.value),
  );

  // Y-axis scale computed from the real data max, not a library auto-domain --
  // see utils/chartScale.ts for why. Recomputed only when the underlying values change.
  const axis = useMemo(() => {
    const max = cleaned.reduce((m, d) => Math.max(m, d.value), 0);
    return computeNiceAxisScale(max);
  }, [cleaned]);

  if (cleaned.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-ocean-400 dark:text-ocean-500">
        No data available
      </div>
    );
  }

  const allZero = cleaned.every((d) => d.value === 0);
  if (allZero) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-ocean-400 dark:text-ocean-500">
        No consumption recorded
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={cleaned} margin={{ top: 10, right: 10, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ocean-100 dark:text-ocean-800" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="currentColor" className="text-ocean-400" tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="currentColor"
          className="text-ocean-400"
          tickLine={false}
          axisLine={false}
          width={52}
          allowDecimals={false}
          domain={[0, axis.max]}
          ticks={axis.ticks}
          tickFormatter={(v: number) => `${valuePrefix}${formatCompactIndian(v)}`}
        />
        <Tooltip
          content={<ChartTooltip valueLabel={valueLabel} valuePrefix={valuePrefix} />}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
