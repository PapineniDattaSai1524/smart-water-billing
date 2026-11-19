import { Building2, Home, IndianRupee, Landmark, TrendingDown, Users, Droplets, AlertTriangle } from 'lucide-react';
import { usePlatformAnalytics } from '@/hooks/usePlatform';
import { KpiCardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import KpiCard from '@/components/common/KpiCard';
import { formatINR, formatKl, formatIndianNumber } from '@/utils/format';

export default function PlatformAnalyticsPage() {
  const { data, isLoading, isError, refetch } = usePlatformAnalytics();

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Platform Analytics</h1>
        <p className="text-body">A bird's-eye view of the entire platform.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load platform analytics"
          description="Something went wrong while retrieving platform analytics."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            <KpiCard key="c" label="Communities" value={formatIndianNumber(data.totalCommunities)} icon={Landmark} />,
            <KpiCard key="a" label="Apartments" value={formatIndianNumber(data.totalApartments)} icon={Building2} />,
            <KpiCard key="h" label="Households" value={formatIndianNumber(data.totalHouseholds)} icon={Home} />,
            <KpiCard key="bo" label="Building Owners" value={formatIndianNumber(data.totalAdministrators)} icon={Users} />,
            <KpiCard key="r" label="Residents" value={formatIndianNumber(data.totalResidents)} icon={Users} />,
            <KpiCard
              key="rev"
              label="Revenue Collected"
              value={formatINR(data.totalRevenueCollected)}
              icon={IndianRupee}
              color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
            />,
            <KpiCard
              key="out"
              label="Outstanding"
              value={formatINR(data.totalOutstanding)}
              icon={TrendingDown}
              color="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
            />,
            <KpiCard key="w" label="Water Consumed" value={formatKl(data.totalWaterConsumptionKl)} icon={Droplets} />,
          ].map((card, i) => (
            <div key={card.key} className="motion-safe:animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              {card}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
