import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TopConsumer } from '@/utils/types';
import { formatCompactIndian, formatIndianNumber } from '@/utils/format';

// Week 5-6 Feature 2A: household-wise usage comparison bar chart. Data comes from the
// existing admin water-analytics endpoint (already apartment-scoped to the logged-in
// admin server-side) -- no new backend endpoint, no duplicate query.
export default function HouseholdUsageBarChart({ data }: { data: TopConsumer[] | undefined }) {
  const cleaned = (data ?? []).filter(
    (c) => c && typeof c.consumptionKl === 'number' && Number.isFinite(c.consumptionKl),
  );

  if (cleaned.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-center text-sm text-ocean-400 dark:text-ocean-500">
        No household usage data available for this apartment.
      </div>
    );
  }

  const chartData = cleaned.map((c) => ({ unit: `Unit ${c.unitNumber}`, consumptionKl: c.consumptionKl }));
  const avg = chartData.reduce((sum, c) => sum + c.consumptionKl, 0) / chartData.length;

  // Households with no reading yet still render as real zero-length bars (per-household truth),
  // rather than being hidden behind a blanket "no consumption" message.
  const ROW_HEIGHT = 36;
  const MAX_VISIBLE_HEIGHT = 480;
  const naturalHeight = Math.max(220, chartData.length * ROW_HEIGHT);
  const chartHeight = Math.min(naturalHeight, MAX_VISIBLE_HEIGHT);
  const needsScroll = naturalHeight > MAX_VISIBLE_HEIGHT;

  const chart = (
    <ResponsiveContainer width="100%" height={needsScroll ? naturalHeight : chartHeight}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 24, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-ocean-100 dark:text-ocean-800" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 12 }}
          stroke="currentColor"
          className="text-ocean-400"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          domain={[0, 'auto']}
          tickFormatter={(v: number) => formatCompactIndian(v)}
        />
        <YAxis type="category" dataKey="unit" width={90} tick={{ fontSize: 12 }} stroke="currentColor" className="text-ocean-500" tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value, _name, item) => {
            const consumption = Number(value ?? 0);
            const aboveAvgPct = avg > 0 ? ((consumption - avg) / avg) * 100 : 0;
            return [
              `${formatIndianNumber(consumption, 2)} kL  ·  Apartment average: ${formatIndianNumber(avg, 2)} kL  ·  ${aboveAvgPct >= 0 ? 'Above' : 'Below'} average: ${formatIndianNumber(Math.abs(aboveAvgPct), 0)}%`,
              item?.payload?.unit ?? 'Consumption',
            ];
          }}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        />
        {chartData.length > 1 && avg > 0 && (
          <ReferenceLine x={avg} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Avg', position: 'top', fontSize: 10, fill: '#94a3b8' }} />
        )}
        <Bar dataKey="consumptionKl" radius={[0, 6, 6, 0]}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={avg > 0 && entry.consumptionKl > avg * 1.3 ? '#ef4444' : '#0891b2'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (!needsScroll) return chart;

  return (
    <div style={{ height: MAX_VISIBLE_HEIGHT, overflowY: 'auto' }} className="pr-1">
      {chart}
    </div>
  );
}
