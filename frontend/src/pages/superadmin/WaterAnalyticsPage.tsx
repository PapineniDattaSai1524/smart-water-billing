import { Droplets, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { usePlatformWaterAnalytics } from '@/hooks/usePlatform';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import KpiCard from '@/components/common/KpiCard';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import EmptyState from '@/components/common/EmptyState';
import { formatIndianNumber, safePercentChange } from '@/utils/format';

export default function SuperAdminWaterAnalyticsPage() {
  const { data, isLoading, isError, refetch } = usePlatformWaterAnalytics();

  const trendPct = data ? safePercentChange(data.currentMonthConsumptionKl, data.previousMonthConsumptionKl) : null;

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Water Analytics</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Platform-wide water consumption trend.</p>
      </div>

      {isLoading && <LoadingSpinner label="Loading water analytics..." />}

      {!isLoading && isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load consumption analytics"
          description="Something went wrong while retrieving platform-wide water consumption data."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 motion-safe:animate-slide-up" style={{ animationDelay: '80ms' }}>
            <KpiCard
              label="Monthly Water Consumption"
              value={data.monthlyConsumption.length === 0 ? '—' : `${formatIndianNumber(data.currentMonthConsumptionKl, 1)} KL`}
              icon={Droplets}
              trendPct={trendPct}
              trendGoodDirection="down"
              caption={trendPct != null ? 'vs previous month' : (data.monthlyConsumption.length === 0 ? 'No consumption data available' : 'No previous-month comparison')}
            />
            <KpiCard label="All-Time Consumption" value={`${formatIndianNumber(data.totalConsumptionKl, 1)} KL`} icon={Droplets} caption="lifetime total, across the platform" />
          </div>
          <div className="glass-panel p-6 motion-safe:animate-slide-up" style={{ animationDelay: '140ms' }}>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="section-title">Water Consumption Trend</h2>
              {trendPct != null && (
                <span className={`flex items-center gap-1 text-xs font-medium ${trendPct <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-status-critical'}`}>
                  {trendPct <= 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                  {Math.abs(trendPct).toFixed(1)}% vs previous month
                </span>
              )}
            </div>
            <p className="text-caption mb-3">
              {data.monthlyConsumption.length > 0
                ? `Last ${data.monthlyConsumption.length} month${data.monthlyConsumption.length === 1 ? '' : 's'} with recorded readings, platform-wide`
                : 'Last 6 months, platform-wide'}
            </p>
            {data.monthlyConsumption.length === 0 ? (
              <EmptyState title="No consumption data available" description="A trend will appear once meter readings are logged across the platform." />
            ) : (
              <>
                {data.monthlyConsumption.length < 2 && (
                  <p className="mb-3 text-sm text-ocean-500 dark:text-ocean-400">Not enough historical data available to show a trend yet.</p>
                )}
                <MonthlyTrendChart data={data.monthlyConsumption} valueLabel="KL" color="#0ea5e9" />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
