import { Droplets, TrendingDown, TrendingUp, Trophy, AlertTriangle } from 'lucide-react';
import { useAdminWaterAnalytics } from '@/hooks/useAnalytics';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import KpiCard from '@/components/common/KpiCard';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import HouseholdUsageBarChart from '@/components/charts/HouseholdUsageBarChart';
import EmptyState from '@/components/common/EmptyState';
import { formatIndianNumber, safePercentChange } from '@/utils/format';

export default function AdminWaterAnalyticsPage() {
  const { data, isLoading, isError, refetch } = useAdminWaterAnalytics();

  const trendPct = data ? safePercentChange(data.currentMonthConsumptionKl, data.previousMonthConsumptionKl) : null;

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Water Consumption Analytics</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Consumption trends and top-consuming households across your apartments.</p>
      </div>

      {isLoading && <LoadingSpinner label="Loading water analytics..." />}

      {!isLoading && isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load consumption analytics"
          description="Something went wrong while retrieving water consumption data."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          {/* ---------------- Monthly Water Consumption ---------------- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              <KpiCard
                key="monthly"
                label="Monthly Water Consumption"
                value={data.monthlyConsumption.length === 0 ? '—' : `${formatIndianNumber(data.currentMonthConsumptionKl, 1)} KL`}
                icon={Droplets}
                color="bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300"
                trendPct={trendPct}
                trendGoodDirection="down"
                caption={trendPct != null ? 'vs previous month' : (data.monthlyConsumption.length === 0 ? 'No consumption data available' : 'No previous-month comparison')}
              />,
              <KpiCard key="alltime" label="All-Time Consumption" value={`${formatIndianNumber(data.totalConsumptionKl, 1)} KL`} icon={Droplets} caption="lifetime total" />,
              <KpiCard key="months" label="Months Tracked" value={data.monthlyConsumption.length} icon={Droplets} />,
            ].map((card, i) => (
              <div key={card.key} className="motion-safe:animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                {card}
              </div>
            ))}
          </div>

          {/* ---------------- Last 6 Months Trend ---------------- */}
          <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '140ms' }}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="section-title">Water Consumption Trend</h2>
              {trendPct != null && (
                <span className={`flex items-center gap-1 text-xs font-medium ${trendPct <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-status-critical'}`}>
                  {trendPct <= 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                  {Math.abs(trendPct).toFixed(1)}% vs previous month
                </span>
              )}
            </div>
            <p className="text-caption mb-4">
              {data.monthlyConsumption.length > 0
                ? `Last ${data.monthlyConsumption.length} month${data.monthlyConsumption.length === 1 ? '' : 's'} with recorded readings`
                : 'Last 6 months'}
            </p>
            {data.monthlyConsumption.length === 0 ? (
              <EmptyState title="No consumption data available" description="A trend will appear once meter readings are logged for your households." />
            ) : data.monthlyConsumption.length < 2 ? (
              <div className="space-y-3">
                <p className="text-sm text-ocean-500 dark:text-ocean-400">Not enough historical data available to show a trend yet.</p>
                <MonthlyTrendChart data={data.monthlyConsumption} valueLabel="KL" color="#0ea5e9" />
              </div>
            ) : (
              <MonthlyTrendChart data={data.monthlyConsumption} valueLabel="KL" color="#0ea5e9" />
            )}
          </div>

          <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '180ms' }}>
            <h2 className="section-title mb-4 flex items-center gap-2"><Trophy size={14} /> Household Usage Comparison (This Month)</h2>
            <HouseholdUsageBarChart data={data.householdUsage} />
          </div>

          <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '220ms' }}>
            <h2 className="section-title mb-4 flex items-center gap-2"><Trophy size={14} /> Top Consumers (This Month)</h2>
            {data.topConsumers.length === 0 ? (
              <EmptyState title="No usage recorded this month" description="Top consumers will appear once readings are logged." />
            ) : (
              <div className="space-y-2">
                {data.topConsumers.map((c, idx) => (
                  <div
                    key={c.unitNumber + idx}
                    className="motion-safe:animate-fade-in flex items-center justify-between rounded-lg border border-ocean-200 px-4 py-2 text-sm transition-shadow hover:shadow-card-hover dark:border-ocean-800"
                    style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
                  >
                    <span className="font-medium text-ocean-800 dark:text-ocean-100">#{idx + 1} · Unit {c.unitNumber}</span>
                    <span className="text-ocean-600 dark:text-ocean-300">{formatIndianNumber(c.consumptionKl, 1)} KL</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
