import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Building2, Calendar, CircleDollarSign, Clock, Download, Droplets, FileWarning, Gauge, Home,
  Loader2, RefreshCw, ShieldCheck, TrendingDown, TrendingUp, UserX, Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useResidentDashboard, useMonthlyUsageTrend, useConsumptionComparison,
} from '@/hooks/useDashboardExtras';
import { useMyInvoices } from '@/hooks/useBilling';
import { useCountUp } from '@/hooks/useCountUp';
import { invoiceService } from '@/services/invoiceService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import KpiCard from '@/components/common/KpiCard';
import Reveal from '@/components/common/Reveal';
import { ChartSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import UsageTrendChart from '@/components/charts/UsageTrendChart';
import ConsumptionComparisonCard from '@/components/resident/ConsumptionComparisonCard';
import WaterSavingTips from '@/components/resident/WaterSavingTips';
import WaterLevelMeter from '@/components/resident/WaterLevelMeter';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatBillingPeriod, formatDate, formatINR, formatKl, formatInvoiceNumber } from '@/utils/format';
import type { Invoice } from '@/utils/types';

function pctChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function DownloadInvoiceButton({ invoice, compact }: { invoice: Invoice; compact?: boolean }) {
  const [downloading, setDownloading] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    setFailed(false);
    try {
      await invoiceService.downloadPdf(invoice.id, `invoice-${invoice.billingMonth}`);
    } catch {
      setFailed(true);
    } finally {
      setDownloading(false);
    }
  };

  const button = (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={compact ? 'btn-secondary btn-sm w-full' : 'inline-flex items-center gap-1 text-xs font-medium text-aqua-700 hover:underline disabled:opacity-60 dark:text-aqua-400'}
    >
      {downloading ? (
        <>
          <Loader2 size={compact ? 14 : 13} className="animate-spin" /> Preparing your invoice...
        </>
      ) : failed ? (
        <>
          <RefreshCw size={compact ? 14 : 13} /> Try Again
        </>
      ) : (
        <>
          <Download size={compact ? 14 : 13} /> Download
        </>
      )}
    </button>
  );

  if (!failed || downloading) return button;

  return (
    <div className={compact ? 'space-y-1.5' : 'inline-flex flex-col items-end gap-1'}>
      <p className="text-xs text-red-600 dark:text-red-400">Unable to download invoice. Please try again.</p>
      {button}
    </div>
  );
}

export default function ResidentDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading, isError, error, refetch } = useResidentDashboard();
  const { data: monthlyTrend, isLoading: monthlyLoading } = useMonthlyUsageTrend(6);
  const { data: comparison } = useConsumptionComparison();
  const { data: invoices, isLoading: invoicesLoading } = useMyInvoices();

  // Outstanding = sum of every unpaid/overdue invoice for this household, not just the
  // latest one -- a resident could have more than one unpaid cycle. Derived entirely from
  // the same already-fetched invoice list used by the "Current Bill" KPI and the invoice
  // history table below, never a separate/fabricated figure.
  const outstandingTotal = (invoices ?? [])
    .filter((inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const outstandingCount = (invoices ?? []).filter((inv) => inv.status === 'UNPAID' || inv.status === 'OVERDUE').length;

  // KPI count-up animations, over real (already-fetched) numbers -- called
  // unconditionally, above the early returns below, per the Rules of Hooks.
  const animatedUsageKl = useCountUp(stats?.currentMonthUsageKl ?? 0, 900);
  const animatedAverageKl = useCountUp(stats?.averageUsageKl ?? 0, 900);
  const animatedBillAmount = useCountUp(invoices?.[0]?.totalAmount ?? 0, 900);
  const animatedOutstanding = useCountUp(outstandingTotal, 900);

  if (isLoading) return <LoadingSpinner label="Loading your dashboard..." />;

  // A genuine network/server failure (backend unreachable, 500, etc.) -- distinct from the
  // normal not-yet-approved / not-yet-assigned states below, which the API now returns as
  // a 200 with a status field instead of an error.
  if (isError) {
    return (
      <EmptyState
        icon={UserX}
        title="Couldn't load your dashboard"
        description={getApiErrorMessage(error, 'Something went wrong loading your dashboard. Please try again shortly.')}
        action={{ label: 'Retry', onClick: () => refetch() }}
      />
    );
  }

  if (stats?.status === 'PENDING_APPROVAL') {
    return (
      <EmptyState
        icon={Clock}
        title="Registration pending approval"
        description={stats.message ?? 'Your registration is waiting for Building Owner approval.'}
      />
    );
  }

  if (stats?.status === 'REJECTED') {
    return (
      <EmptyState
        icon={UserX}
        title="Registration rejected"
        description={stats.message ?? 'Your registration request has been rejected.'}
      />
    );
  }

  if (stats?.status === 'UNASSIGNED') {
    return (
      <EmptyState
        icon={UserX}
        title="Not linked to a household yet"
        description={stats.message ?? 'Your account isn\'t assigned to a household yet. Please contact your Building Owner administrator so they can add you.'}
      />
    );
  }

  // "Current billing cycle" = the most recent invoice for this household, since invoices
  // are already returned ordered newest-first by the real Spring Boot billing engine.
  const currentInvoice = invoices && invoices.length > 0 ? invoices[0] : null;
  const usageTrendPct = pctChange(stats?.currentMonthUsageKl ?? null, stats?.previousMonthUsageKl ?? null);

  const efficiencyLabel = comparison?.status === 'BELOW_AVERAGE' ? 'Efficient'
    : comparison?.status === 'ABOVE_AVERAGE' ? 'High Usage'
    : comparison ? 'Normal' : null;
  const efficiencyBadgeClass = comparison?.status === 'BELOW_AVERAGE' ? 'badge-healthy'
    : comparison?.status === 'ABOVE_AVERAGE' ? 'badge-warning'
    : 'badge-info';

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pb-8">
      {/* ---------------- Hero ---------------- */}
      <div className="water-texture relative animate-hero-rise overflow-hidden rounded-2xl bg-gradient-to-br from-ocean-900 via-ocean-800 to-aqua-900 p-6 text-white shadow-glass-lg sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-aqua-200">{greeting}, {user?.fullName?.split(' ')[0]} 👋</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Your household water intelligence
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-aqua-100/90">
              <span className="flex items-center gap-1.5"><Building2 size={14} /> {stats?.apartmentName ?? '—'}</span>
              <span className="flex items-center gap-1.5"><Home size={14} /> Unit {stats?.unitNumber ?? '—'}</span>
              {currentInvoice && (
                <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatBillingPeriod(currentInvoice.billingMonth)}</span>
              )}
            </div>
          </div>
          {!!stats?.unreadNotifications && stats.unreadNotifications > 0 && (
            <Link
              to="/notifications"
              className="flex items-center gap-2 self-start rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <Bell size={16} /> {stats.unreadNotifications} unread notification{stats.unreadNotifications === 1 ? '' : 's'}
            </Link>
          )}
        </div>
      </div>

      {/* ---------------- KPI cards ---------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Reveal delay={0} className="h-full">
          <KpiCard
            label="Current Consumption"
            value={stats?.currentMonthUsageKl != null ? `${animatedUsageKl.toFixed(1)} kL` : '—'}
            icon={Droplets}
            color="bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300"
            trendPct={usageTrendPct}
            trendGoodDirection="down"
            caption="vs previous month"
          />
        </Reveal>
        <Reveal delay={80} className="h-full">
          <KpiCard
            label="Current Bill"
            value={currentInvoice ? formatINR(animatedBillAmount) : '—'}
            icon={Wallet}
            color="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
            caption={currentInvoice ? currentInvoice.status.charAt(0) + currentInvoice.status.slice(1).toLowerCase() : 'No invoice yet'}
          />
        </Reveal>
        <Reveal delay={160} className="h-full">
          {outstandingTotal > 0 ? (
            <Link to="/payments" className="block h-full transition-transform hover:-translate-y-0.5">
              <KpiCard
                label="Outstanding"
                value={formatINR(animatedOutstanding)}
                icon={CircleDollarSign}
                color="bg-status-critical/10 text-status-critical"
                caption={`${outstandingCount} bill${outstandingCount === 1 ? '' : 's'} to pay`}
              />
            </Link>
          ) : (
            <KpiCard
              label="Outstanding"
              value={invoices ? formatINR(0) : '—'}
              icon={CircleDollarSign}
              color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
              caption={invoices ? 'All bills paid' : undefined}
            />
          )}
        </Reveal>
        <Reveal delay={240} className="h-full">
          <KpiCard
            label="Household Average"
            value={stats?.averageUsageKl != null ? `${animatedAverageKl.toFixed(1)} kL` : '—'}
            icon={Gauge}
            color="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
            caption="historical average"
          />
        </Reveal>
        <Reveal delay={320} className="h-full">
          <div className="kpi-card">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-ocean-500 dark:text-ocean-400">Water Efficiency</p>
              {efficiencyLabel ? (
                <span className={`${efficiencyBadgeClass} mt-1`}>{efficiencyLabel}</span>
              ) : (
                <p className="text-caption mt-0.5">Available once this month&apos;s data is in</p>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      {comparison?.possibleLeak && (
        <Reveal className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <FileWarning size={18} className="shrink-0" />
          <p><span className="font-semibold">Possible leak detected.</span> Your recent usage pattern is unusual — check taps, toilets, and fixtures.</p>
        </Reveal>
      )}

      {/* ---------------- Water level hero + tips ---------------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal className="card flex flex-col items-center justify-center p-6 lg:col-span-1">
          <p className="section-title mb-4">This Month</p>
          <WaterLevelMeter currentKl={stats?.currentMonthUsageKl ?? null} averageKl={stats?.averageUsageKl ?? null} />
        </Reveal>
        <Reveal delay={100} className="card flex flex-col justify-center gap-4 p-6 lg:col-span-2">
          <p className="section-title">Water-Saving Insight</p>
          <WaterSavingTips status={comparison?.status} possibleLeak={comparison?.possibleLeak} />
        </Reveal>
      </div>

      {/* ---------------- Monthly consumption trend ---------------- */}
      {/* Note: a daily consumption chart was removed here -- meter readings are logged monthly
          (not daily), so a "last 30 days" chart had no reliable per-day data to plot and would
          have needed fabricated/interpolated points. Monthly consumption is what the system
          actually has reliable data for. */}
      <Reveal className="card p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-h3">Monthly Consumption Trend</h2>
          {usageTrendPct != null && (
            <span className={`flex items-center gap-1 text-xs font-medium ${usageTrendPct <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-status-critical'}`}>
              {usageTrendPct <= 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
              {Math.abs(usageTrendPct).toFixed(0)}% vs last month
            </span>
          )}
        </div>
        <p className="text-caption mb-3">Is your usage improving? Last 6 months</p>
        {monthlyLoading ? <ChartSkeleton /> : (
          <UsageTrendChart data={monthlyTrend} color="#7c3aed" gradientId="monthly-gradient" averageKl={stats?.averageUsageKl} />
        )}
      </Reveal>

      {/* ---------------- Consumption comparison / peer benchmarking ---------------- */}
      <Reveal className="card p-5">
        <h2 className="text-h3 mb-1">How You Compare</h2>
        <p className="text-caption mb-4">Your household vs. the apartment and similar-sized homes</p>
        <ConsumptionComparisonCard data={comparison} />
      </Reveal>

      {/* ---------------- Current billing cycle summary ---------------- */}
      <Reveal className="card p-5">
        <h2 className="text-h3 mb-4">Current Billing Cycle</h2>
        {invoicesLoading && <TableSkeleton rows={2} cols={3} />}
        {!invoicesLoading && !currentInvoice && (
          <p className="text-body">No invoice has been generated for this household yet.</p>
        )}
        {!invoicesLoading && currentInvoice && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="grid grid-cols-2 gap-4 text-sm lg:col-span-2 sm:grid-cols-3">
              <div><p className="text-caption">Billing Cycle</p><p className="font-medium text-ocean-900 dark:text-white">{formatBillingPeriod(currentInvoice.billingMonth)}</p></div>
              <div><p className="text-caption">Consumption</p><p className="font-medium text-ocean-900 dark:text-white">{formatKl(currentInvoice.consumptionKl)}</p></div>
              <div><p className="text-caption">Base Charge</p><p className="font-medium text-ocean-900 dark:text-white">{formatINR(currentInvoice.breakdown?.baseCharge ?? currentInvoice.baseCharge)}</p></div>
              <div><p className="text-caption">Shared-Area Allocation</p><p className="font-medium text-ocean-900 dark:text-white">{formatINR(currentInvoice.breakdown?.sharedCharge ?? 0)}</p></div>
              <div><p className="text-caption">Tax / Adjustments</p><p className="font-medium text-ocean-900 dark:text-white">{formatINR(currentInvoice.taxAmount ?? 0)}</p></div>
              <div><p className="text-caption">Due Date</p><p className="font-medium text-ocean-900 dark:text-white">{formatDate(currentInvoice.dueDate)}</p></div>
            </div>
            {/* Total payable — the visual focal point of the card */}
            <div className="flex flex-col justify-between gap-4 rounded-xl bg-gradient-to-br from-aqua-600 to-teal-700 p-5 text-white lg:col-span-1">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-aqua-100">Total Payable</p>
                <p className="mt-1 text-3xl font-bold">{formatINR(currentInvoice.totalAmount)}</p>
                <div className="mt-2"><StatusBadge status={currentInvoice.status} /></div>
              </div>
              <DownloadInvoiceButton invoice={currentInvoice} compact />
            </div>
          </div>
        )}
      </Reveal>

      {/* ---------------- Invoice history ---------------- */}
      <Reveal className="card overflow-hidden p-0">
        <div className="flex flex-col gap-1 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <h2 className="text-h3">Invoice History</h2>
            <p className="text-caption mt-0.5">Your most recent invoices</p>
          </div>
          <Link to="/my-bills" className="self-start text-xs font-medium text-aqua-700 hover:underline dark:text-aqua-400 sm:self-auto">View all</Link>
        </div>

        {invoicesLoading && <TableSkeleton />}

        {!invoicesLoading && (!invoices || invoices.length === 0) && (
          <div className="px-5 pb-5">
            <EmptyState icon={FileWarning} title="No invoices yet" description="No invoices have been generated for this household yet." />
          </div>
        )}

        {!invoicesLoading && invoices && invoices.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="table-base w-full">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Billing Cycle</th>
                    <th>Invoice Date</th>
                    <th>Consumption</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="!text-right">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((inv, i) => (
                    <tr
                      key={inv.id}
                      className="animate-reveal-up motion-reduce:animate-none"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <td className="font-medium text-ocean-900 dark:text-white">{formatInvoiceNumber(inv.id)}</td>
                      <td>{formatBillingPeriod(inv.billingMonth)}</td>
                      <td>{formatDate(inv.generatedAt)}</td>
                      <td>{formatKl(inv.consumptionKl)}</td>
                      <td className="font-medium text-ocean-900 dark:text-white">{formatINR(inv.totalAmount)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td className="text-right"><DownloadInvoiceButton invoice={inv} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 sm:hidden">
              {invoices.slice(0, 5).map((inv, i) => (
                <div
                  key={inv.id}
                  className="animate-reveal-up rounded-xl border border-ocean-100 p-4 motion-reduce:animate-none dark:border-ocean-800"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-ocean-900 dark:text-white">{formatInvoiceNumber(inv.id)}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-caption">Cycle</p><p className="text-ocean-800 dark:text-ocean-100">{formatBillingPeriod(inv.billingMonth)}</p></div>
                    <div><p className="text-caption">Consumption</p><p className="text-ocean-800 dark:text-ocean-100">{formatKl(inv.consumptionKl)}</p></div>
                    <div className="col-span-2"><p className="text-caption">Amount</p><p className="text-base font-semibold text-ocean-900 dark:text-white">{formatINR(inv.totalAmount)}</p></div>
                  </div>
                  <DownloadInvoiceButton invoice={inv} compact />
                </div>
              ))}
            </div>
          </>
        )}
      </Reveal>

      <div className="flex flex-wrap gap-3">
        <Link to="/usage-history" className="btn-secondary">View Usage History</Link>
        <Link to="/my-bills" className="btn-secondary">View My Bills</Link>
      </div>
    </div>
  );
}
