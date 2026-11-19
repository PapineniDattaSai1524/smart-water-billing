import { Activity, CheckCircle2, AlertTriangle, Database, Server, Users, Building2 } from 'lucide-react';
import { useSystemHealth } from '@/hooks/usePlatform';
import { KpiCardSkeleton } from '@/components/common/Skeleton';
import ErrorBanner from '@/components/common/ErrorBanner';
import KpiCard from '@/components/common/KpiCard';
import { formatIndianNumber } from '@/utils/format';

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function SystemHealthPage() {
  const { data, isLoading, isError, refetch } = useSystemHealth();

  // Status wording is derived only from what the backend actually reports (data.status /
  // data.databaseUp) -- "Healthy" / "Warning" / "Error" are display labels over real values,
  // never a fabricated metric.
  const isHealthy = data?.status === 'UP' && data?.databaseUp;
  const isDegraded = data && !isHealthy && data.databaseUp;

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="flex items-center gap-2 text-h1">
          <Activity size={20} /> System Health
        </h1>
        <p className="text-body">Live status of the platform's core services. Refreshes every 30s.</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div className="glass-panel h-24 animate-pulse" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
          </div>
        </div>
      )}

      {!isLoading && isError && (
        <div className="space-y-3">
          <ErrorBanner message="Unable to reach the system-health endpoint. The platform may be experiencing an outage." />
          <button type="button" className="btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="glass-panel motion-safe:animate-slide-up flex items-center gap-4 p-6">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isHealthy
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                  : isDegraded
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {isHealthy ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <p className="flex items-center gap-2 text-lg font-semibold text-ocean-900 dark:text-white">
                {isHealthy ? '✓ Healthy — all systems operational' : isDegraded ? '⚠ Warning — degraded' : '! Error — service down'}
              </p>
              <p className="text-body">
                App version {data.appVersion} · Uptime {formatUptime(data.uptimeSeconds)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="motion-safe:animate-slide-up" style={{ animationDelay: '40ms' }}>
              <KpiCard
                label="Database"
                value={data.databaseUp ? '✓ Connected' : '! Down'}
                icon={Database}
                color={
                  data.databaseUp
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                }
              />
            </div>
            <div className="motion-safe:animate-slide-up" style={{ animationDelay: '80ms' }}>
              <KpiCard label="Total Users" value={formatIndianNumber(data.totalUsers)} icon={Users} />
            </div>
            <div className="motion-safe:animate-slide-up" style={{ animationDelay: '120ms' }}>
              <KpiCard label="Communities" value={formatIndianNumber(data.totalCommunities)} icon={Server} />
            </div>
            <div className="motion-safe:animate-slide-up" style={{ animationDelay: '160ms' }}>
              <KpiCard
                label="Apartments / Households"
                value={`${formatIndianNumber(data.totalApartments)} / ${formatIndianNumber(data.totalHouseholds)}`}
                icon={Building2}
              />
            </div>
          </div>

          <p className="text-caption">
            Only metrics reported by the backend's health endpoint are shown here — no simulated
            or estimated values.
          </p>
        </>
      )}
    </div>
  );
}
