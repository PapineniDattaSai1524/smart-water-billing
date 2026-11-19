import {
  Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Droplets } from 'lucide-react';
import type { UsageTrendPoint } from '@/utils/types';
import { formatCompactIndian, formatIndianNumber } from '@/utils/format';

interface TooltipPayloadItem {
  value?: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-ocean-100 bg-white px-3 py-2 text-xs shadow-glass-lg dark:border-ocean-700 dark:bg-ocean-800">
      <p className="mb-0.5 font-medium text-ocean-900 dark:text-white">{label}</p>
      <p className="text-ocean-600 dark:text-ocean-300">
        {formatIndianNumber(Number(payload[0]?.value ?? 0), 2)} kL
      </p>
    </div>
  );
}

/**
 * Week 5-6 Feature 1: daily/monthly consumption trend. Data always comes from the
 * resident-me trend endpoints (real water_usage_logs aggregation) -- never mocked.
 * `gradientId` must be unique per chart instance on the page (SVG defs are global).
 */
export default function UsageTrendChart({
  data,
  color = '#0891b2',
  gradientId,
  averageKl,
}: {
  data: UsageTrendPoint[] | undefined;
  color?: string;
  gradientId: string;
  /** Optional reference line, e.g. the household's average, if the backend supplied one. */
  averageKl?: number | null;
}) {
  // Validate before rendering: drop null/undefined/NaN/Infinity points rather than let
  // them reach the chart as broken ticks or a misleading flat line.
  const cleaned = (data ?? []).filter(
    (d) => d && typeof d.consumptionKl === 'number' && Number.isFinite(d.consumptionKl),
  );

  if (cleaned.length === 0) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-ocean-400 dark:text-ocean-500">
        <Droplets size={28} className="opacity-50" />
        <p className="text-sm">No usage data yet</p>
      </div>
    );
  }

  const allZero = cleaned.every((d) => d.consumptionKl === 0);
  if (allZero) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-ocean-400 dark:text-ocean-500">
        <Droplets size={28} className="opacity-50" />
        <p className="text-sm">No consumption recorded</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={cleaned} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-ocean-100 dark:stroke-ocean-800" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          className="fill-ocean-400 dark:fill-ocean-500"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          className="fill-ocean-400 dark:fill-ocean-500"
          width={48}
          allowDecimals={false}
          domain={[0, 'auto']}
          tickFormatter={(v: number) => formatCompactIndian(v)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
        {averageKl != null && averageKl > 0 && (
          <ReferenceLine
            y={averageKl}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: 'Average', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }}
          />
        )}
        <Area
          type="monotone"
          dataKey="consumptionKl"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
