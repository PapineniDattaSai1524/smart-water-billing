import { AlertTriangle, IndianRupee, TrendingDown, TrendingUp } from 'lucide-react';
import { useAdminRevenueAnalytics } from '@/hooks/useAnalytics';
import EmptyState from '@/components/common/EmptyState';
import KpiCard from '@/components/common/KpiCard';
import { KpiCardSkeleton, ChartSkeleton } from '@/components/common/Skeleton';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import { formatINR } from '@/utils/format';

export default function RevenueDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminRevenueAnalytics();

  const collectionRatePct = data && data.totalCollected + data.totalOutstanding > 0
    ? (data.totalCollected / (data.totalCollected + data.totalOutstanding)) * 100
    : null;

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Revenue Dashboard</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Collections and outstanding dues across your apartments.</p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </div>
          <div className="glass-panel p-6">
            <ChartSkeleton />
          </div>
        </div>
      )}

      {!isLoading && isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load revenue analytics"
          description="Something went wrong while retrieving revenue data."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              <KpiCard
                key="collected"
                label="Total Collected"
                value={formatINR(data.totalCollected)}
                icon={IndianRupee}
                color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
              />,
              <KpiCard
                key="outstanding"
                label="Outstanding"
                value={formatINR(data.totalOutstanding)}
                icon={TrendingDown}
                color="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
              />,
              <KpiCard
                key="months"
                label="Months Tracked"
                value={data.monthlyRevenue.length}
                icon={TrendingUp}
              />,
            ].map((card, i) => (
              <div key={card.key} className="motion-safe:animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                {card}
              </div>
            ))}
          </div>

          {collectionRatePct != null && (
            <div className="card motion-safe:animate-slide-up p-5" style={{ animationDelay: '100ms' }}>
              <h2 className="text-h3 mb-1">Collection Rate</h2>
              <p className="text-caption mb-4">Share of total billed revenue collected so far</p>
              <div className="space-y-3">
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-ocean-100 dark:bg-ocean-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                    style={{ width: `${collectionRatePct}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Collected: <span className="font-semibold text-ocean-900 dark:text-white">{formatINR(data.totalCollected)}</span></span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ocean-300 dark:bg-ocean-700" /> Outstanding: <span className="font-semibold text-ocean-900 dark:text-white">{formatINR(data.totalOutstanding)}</span></span>
                  <span className="font-medium text-ocean-500 dark:text-ocean-400">{collectionRatePct.toFixed(0)}% collection rate</span>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '160ms' }}>
            <h2 className="section-title mb-4">Monthly Revenue Trend</h2>
            {data.monthlyRevenue.length > 0 ? (
              <MonthlyTrendChart data={data.monthlyRevenue} valueLabel="Revenue" valuePrefix="₹" color="#0891b2" />
            ) : (
              <EmptyState title="No revenue data yet" description="Monthly figures will appear once invoices are billed and paid." />
            )}
          </div>
        </>
      )}
    </div>
  );
}
