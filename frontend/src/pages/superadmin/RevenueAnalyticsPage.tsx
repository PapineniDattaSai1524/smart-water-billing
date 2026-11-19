import { IndianRupee, TrendingDown, AlertTriangle } from 'lucide-react';
import { usePlatformRevenueAnalytics } from '@/hooks/usePlatform';
import { KpiCardSkeleton, ChartSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import KpiCard from '@/components/common/KpiCard';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import { formatINR } from '@/utils/format';

export default function SuperAdminRevenueAnalyticsPage() {
  const { data, isLoading, isError, refetch } = usePlatformRevenueAnalytics();

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Revenue Analytics</h1>
        <p className="text-body">Platform-wide revenue trend across every community.</p>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          description="Something went wrong while retrieving platform revenue data."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="motion-safe:animate-slide-up">
              <KpiCard
                label="Total Collected"
                value={formatINR(data.totalCollected)}
                icon={IndianRupee}
                color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
              />
            </div>
            <div className="motion-safe:animate-slide-up" style={{ animationDelay: '40ms' }}>
              <KpiCard
                label="Outstanding"
                value={formatINR(data.totalOutstanding)}
                icon={TrendingDown}
                color="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
              />
            </div>
          </div>
          <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '90ms' }}>
            <h2 className="section-title mb-4">Monthly Revenue Trend</h2>
            {data.monthlyRevenue.length === 0 ? (
              <EmptyState title="No data available" description="Revenue will appear here once invoices are collected." />
            ) : (
              <MonthlyTrendChart data={data.monthlyRevenue} valueLabel="Revenue" valuePrefix="₹" color="#1c6ff2" />
            )}
          </div>
        </>
      )}
    </div>
  );
}
