import { Link } from 'react-router-dom';
import {
  Bell, Building2, Droplets, Gauge, Home, IndianRupee, Trophy, Users, Wallet, TrendingUp, TrendingDown, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApartments } from '@/hooks/useApartments';
import { useHouseholds } from '@/hooks/useHouseholds';
import { useMeterConfigs } from '@/hooks/useMeterConfigs';
import { useAdminDashboardStats, useNotifications } from '@/hooks/useDashboardExtras';
import { useRevenueSummary } from '@/hooks/useBilling';
import { useAdminWaterAnalytics } from '@/hooks/useAnalytics';
import SuperAdminDashboardPage from '@/pages/superadmin/SuperAdminDashboardPage';
import ResidentDashboardPage from '@/pages/resident/ResidentDashboardPage';
import KpiCard from '@/components/common/KpiCard';
import { KpiCardSkeleton, ChartSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import HouseholdUsageBarChart from '@/components/charts/HouseholdUsageBarChart';
import { formatDate, formatINR } from '@/utils/format';

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'badge-critical',
  WARNING: 'badge-warning',
  INFO: 'badge-info',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: apartments } = useApartments();
  const { data: households } = useHouseholds();
  const { data: meters } = useMeterConfigs();
  const { data: adminStats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: revenue, isLoading: revenueLoading } = useRevenueSummary();
  const { data: waterAnalytics, isLoading: waterLoading } = useAdminWaterAnalytics();
  const { data: recentNotifications, isLoading: notificationsLoading } = useNotifications(0, 5);

  if (user?.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboardPage />;
  }

  if (user?.role === 'RESIDENT') {
    return <ResidentDashboardPage />;
  }

  const consumptionTrendPct = adminStats
    ? pctChange(adminStats.currentMonthConsumptionKl, adminStats.previousMonthConsumptionKl)
    : null;

  const collectionRatePct = revenue && (revenue.totalCollected + revenue.totalOutstanding) > 0
    ? (revenue.totalCollected / (revenue.totalCollected + revenue.totalOutstanding)) * 100
    : null;

  return (
    <div className="space-y-6 pb-8">
      {/* ---------------- Hero ---------------- */}
      <div className="water-texture relative overflow-hidden rounded-2xl bg-gradient-to-br from-ocean-900 via-ocean-800 to-aqua-900 p-6 text-white shadow-glass-lg motion-safe:animate-slide-up sm:p-8">
        <p className="text-sm font-medium text-aqua-200">Welcome back, {user?.fullName?.split(' ')[0]} 👋</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Water Operations Command Center</h1>
        <p className="mt-2 max-w-xl text-sm text-aqua-100/90">
          Consumption, billing, and household activity across the apartments you manage.
        </p>
      </div>

      {/* ---------------- Top-level KPIs ---------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="motion-safe:animate-slide-up" style={{ animationDelay: '40ms' }}>
          <Link to="/households"><KpiCard label="Total Households" value={households?.length ?? '—'} icon={Home} color="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300" /></Link>
        </div>
        <div className="motion-safe:animate-slide-up" style={{ animationDelay: '80ms' }}>
          {statsLoading ? <KpiCardSkeleton /> : (
            <KpiCard
              label="Monthly Consumption"
              value={adminStats ? `${adminStats.currentMonthConsumptionKl.toFixed(1)} kL` : '—'}
              icon={Droplets}
              color="bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300"
              trendPct={consumptionTrendPct}
              trendGoodDirection="down"
              caption="vs previous month"
            />
          )}
        </div>
        <div className="motion-safe:animate-slide-up" style={{ animationDelay: '120ms' }}>
          {revenueLoading ? <KpiCardSkeleton /> : (
            <KpiCard
              label="Total Outstanding"
              value={revenue ? formatINR(revenue.totalOutstanding, 0) : '—'}
              icon={Wallet}
              color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
            />
          )}
        </div>
        <div className="motion-safe:animate-slide-up" style={{ animationDelay: '160ms' }}>
          {revenueLoading ? <KpiCardSkeleton /> : (
            <KpiCard
              label="Total Collected"
              value={revenue ? formatINR(revenue.totalCollected, 0) : '—'}
              icon={IndianRupee}
              color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/apartments" className="card-interactive motion-safe:animate-slide-up flex items-center gap-3 p-4" style={{ animationDelay: '200ms' }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"><Building2 size={17} /></div>
          <div><p className="text-caption">Apartments</p><p className="font-semibold text-ocean-900 dark:text-white">{apartments?.length ?? '—'}</p></div>
        </Link>
        <Link to="/meters" className="card-interactive motion-safe:animate-slide-up flex items-center gap-3 p-4" style={{ animationDelay: '230ms' }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300"><Gauge size={17} /></div>
          <div><p className="text-caption">Configured Meters</p><p className="font-semibold text-ocean-900 dark:text-white">{meters?.length ?? '—'}</p></div>
        </Link>
        <Link to="/user-management" className="card-interactive motion-safe:animate-slide-up flex items-center gap-3 p-4" style={{ animationDelay: '260ms' }}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><Users size={17} /></div>
          <div><p className="text-caption">Residents</p><p className="font-semibold text-ocean-900 dark:text-white">{adminStats?.totalResidents ?? '—'}</p></div>
        </Link>
      </div>

      {!!adminStats?.unreadNotifications && adminStats.unreadNotifications > 0 && (
        <Link to="/notifications" className="card-interactive motion-safe:animate-slide-up flex items-center gap-3 p-4 text-sm text-amber-700 dark:text-amber-300">
          <Bell size={18} /> You have {adminStats.unreadNotifications} unread notification{adminStats.unreadNotifications === 1 ? '' : 's'}
        </Link>
      )}

      {/* ---------------- Water Consumption Overview ---------------- */}
      <div className="card motion-safe:animate-slide-up p-5" style={{ animationDelay: '300ms' }}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-h3">Water Consumption Overview</h2>
          {consumptionTrendPct != null && (
            <span className={`flex items-center gap-1 text-xs font-medium ${consumptionTrendPct <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-status-critical'}`}>
              {consumptionTrendPct <= 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {Math.abs(consumptionTrendPct).toFixed(0)}% vs last month
            </span>
          )}
        </div>
        <p className="text-caption mb-3">Monthly consumption across all apartments you manage</p>
        {waterLoading ? <ChartSkeleton /> : (
          <MonthlyTrendChart data={waterAnalytics?.monthlyConsumption ?? []} color="#0891b2" valueLabel="kL" gradientId="admin-water-trend" />
        )}
      </div>

      {/* ---------------- Household Usage Comparison ---------------- */}
      <div className="card motion-safe:animate-slide-up p-5" style={{ animationDelay: '340ms' }}>
        <h2 className="text-h3 mb-1 flex items-center gap-2"><Trophy size={16} className="text-amber-500" /> Household Usage Comparison</h2>
        <p className="text-caption mb-4">This month's consumption by unit — red bars are 30%+ above the apartment average</p>
        {waterLoading ? <ChartSkeleton /> : <HouseholdUsageBarChart data={waterAnalytics?.householdUsage} />}
        <div className="mt-3 text-right">
          <Link to="/water-analytics" className="text-xs font-medium text-aqua-700 hover:underline dark:text-aqua-400">
            Full water analytics <ArrowRight size={11} className="ml-0.5 inline" />
          </Link>
        </div>
      </div>

      {/* ---------------- Billing Performance ---------------- */}
      <div className="card motion-safe:animate-slide-up p-5" style={{ animationDelay: '380ms' }}>
        <h2 className="text-h3 mb-1">Billing Performance</h2>
        <p className="text-caption mb-4">Collected vs. outstanding across all invoices</p>
        {revenueLoading ? <ChartSkeleton heightClass="h-16" /> : revenue ? (
          <div className="space-y-3">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-ocean-100 dark:bg-ocean-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                style={{ width: `${collectionRatePct ?? 0}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Collected: <span className="font-semibold text-ocean-900 dark:text-white">{formatINR(revenue.totalCollected, 0)}</span></span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ocean-300 dark:bg-ocean-700" /> Outstanding: <span className="font-semibold text-ocean-900 dark:text-white">{formatINR(revenue.totalOutstanding, 0)}</span></span>
              {collectionRatePct != null && <span className="font-medium text-ocean-500 dark:text-ocean-400">{collectionRatePct.toFixed(0)}% collection rate</span>}
            </div>
          </div>
        ) : (
          <EmptyState title="No billing data yet" description="Revenue figures will appear once invoices are generated." />
        )}
      </div>

      {/* ---------------- Recent Activity / Alerts ---------------- */}
      <div className="card motion-safe:animate-slide-up p-5" style={{ animationDelay: '420ms' }}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-h3">Recent Activity</h2>
          <Link to="/notifications" className="text-xs font-medium text-aqua-700 hover:underline dark:text-aqua-400">View all</Link>
        </div>
        {notificationsLoading && <ChartSkeleton heightClass="h-32" />}
        {!notificationsLoading && (!recentNotifications || recentNotifications.content.length === 0) && (
          <EmptyState title="Everything looks good" description="No recent alerts or notifications." />
        )}
        {!notificationsLoading && recentNotifications && recentNotifications.content.length > 0 && (
          <ul className="divide-y divide-ocean-100 dark:divide-ocean-800">
            {recentNotifications.content.map((n, i) => (
              <li key={n.id} className="motion-safe:animate-fade-in flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ocean-900 dark:text-white">{n.title}</p>
                  <p className="text-caption truncate">{n.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {n.severity && <span className={SEVERITY_BADGE[n.severity] ?? 'badge-neutral'}>{n.severity}</span>}
                  <span className="text-caption whitespace-nowrap">{formatDate(n.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
