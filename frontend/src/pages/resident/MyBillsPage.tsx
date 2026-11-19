import { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { Search, X, UserX, Receipt, FileWarning, WifiOff } from 'lucide-react';
import { useMyInvoices } from '@/hooks/useBilling';
import EmptyState from '@/components/common/EmptyState';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import InvoiceHeroCard from '@/components/billing/InvoiceHeroCard';
import InvoiceListCard from '@/components/billing/InvoiceListCard';
import InvoiceDetailModal from '@/components/billing/InvoiceDetailModal';
import InvoicePdfButton from '@/components/billing/InvoicePdfButton';
import ConsumptionVsBillCard from '@/components/billing/ConsumptionVsBillCard';
import { InvoicePageSkeleton } from '@/components/billing/InvoiceSkeleton';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatBillingPeriod, formatINR, formatInvoiceNumber, formatKl } from '@/utils/format';
import type { Invoice, InvoiceStatus } from '@/utils/types';

const PAGE_SIZE = 6;

export default function MyBillsPage() {
  const { data: invoices, isLoading, isError, error, refetch, isFetching } = useMyInvoices();

  // The backend maps "resident has no household" to a 404 (ResourceNotFoundException).
  // Any other failure (5xx, network drop, etc.) is a real fetch error, not a setup
  // problem, so it gets its own "Unable to load / Retry" state instead of the
  // household-onboarding message.
  const isNotLinked = error instanceof AxiosError && error.response?.status === 404;
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [yearFilter, setYearFilter] = useState<'ALL' | string>('ALL');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Backend returns most-recent-first (findByHouseholdIdOrderByBillingMonthDesc) --
  // every figure below is derived from that real, already-fetched list only.
  const sortedDesc = invoices ?? [];
  const currentBill = sortedDesc[0] ?? null;
  const historyAll = sortedDesc.slice(1);

  const recentForStats = sortedDesc.slice(0, Math.min(6, sortedDesc.length));
  const totalBilled = recentForStats.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const averageBill = recentForStats.length > 0 ? totalBilled / recentForStats.length : 0;
  const totalConsumption = recentForStats.reduce((sum, inv) => sum + inv.consumptionKl, 0);
  const recentLabel = recentForStats.length === sortedDesc.length ? 'All time' : `Last ${recentForStats.length} bills`;

  const trendData = useMemo(
    () =>
      [...recentForStats]
        .reverse()
        .map((inv) => ({ month: formatBillingPeriod(inv.billingMonth, 'short'), value: inv.totalAmount })),
    [recentForStats],
  );

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    sortedDesc.forEach((inv) => {
      const match = /^(\d{4})-\d{2}$/.exec(inv.billingMonth ?? '');
      if (match) years.add(match[1]);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [sortedDesc]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return historyAll.filter((inv) => {
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (yearFilter !== 'ALL' && !inv.billingMonth?.startsWith(yearFilter)) return false;
      if (q) {
        const haystack = `${formatInvoiceNumber(inv.id)} ${formatBillingPeriod(inv.billingMonth, 'long')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [historyAll, search, statusFilter, yearFilter]);

  const visibleHistory = filteredHistory.slice(0, visibleCount);
  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'ALL' || yearFilter !== 'ALL';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setYearFilter('ALL');
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="motion-safe:animate-slide-up flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-h1">Invoices</h1>
          <p className="text-body mt-1">Your complete water billing history. Track your monthly usage, charges and payments.</p>
        </div>
        {currentBill && <InvoicePdfButton invoice={currentBill} variant="primary" />}
      </div>

      {isLoading && <InvoicePageSkeleton />}

      {!isLoading && isError && isNotLinked && (
        <EmptyState
          icon={UserX}
          title="Not linked to a household yet"
          description={getApiErrorMessage(
            error,
            'Your account isn\'t assigned to a household yet. Please contact your Building Owner administrator so they can add you.',
          )}
        />
      )}

      {!isLoading && isError && !isNotLinked && (
        <EmptyState
          icon={WifiOff}
          title="Unable to load invoices"
          description={getApiErrorMessage(error, "We couldn't retrieve your billing history.")}
          action={{ label: isFetching ? 'Retrying...' : 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && sortedDesc.length === 0 && (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Your water bills will appear here once your first billing cycle is completed."
        />
      )}

      {!isLoading && !isError && sortedDesc.length > 0 && currentBill && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="kpi-card motion-safe:animate-slide-up flex-col items-start gap-1" style={{ animationDelay: '40ms' }}>
              <p className="text-caption">Current Bill</p>
              <p className="text-xl font-bold text-ocean-900 dark:text-white">{formatINR(currentBill.totalAmount)}</p>
              <p className="text-caption">{formatBillingPeriod(currentBill.billingMonth)}</p>
            </div>
            <div className="kpi-card motion-safe:animate-slide-up flex-col items-start gap-1" style={{ animationDelay: '90ms' }}>
              <p className="text-caption">Total Billed</p>
              <p className="text-xl font-bold text-ocean-900 dark:text-white">{formatINR(totalBilled)}</p>
              <p className="text-caption">{recentLabel}</p>
            </div>
            <div className="kpi-card motion-safe:animate-slide-up flex-col items-start gap-1" style={{ animationDelay: '140ms' }}>
              <p className="text-caption">Average Bill</p>
              <p className="text-xl font-bold text-ocean-900 dark:text-white">{formatINR(averageBill)}</p>
              <p className="text-caption">Monthly average</p>
            </div>
            <div className="kpi-card motion-safe:animate-slide-up flex-col items-start gap-1" style={{ animationDelay: '190ms' }}>
              <p className="text-caption">Total Consumption</p>
              <p className="text-xl font-bold text-ocean-900 dark:text-white">{formatKl(totalConsumption)}</p>
              <p className="text-caption">{recentLabel}</p>
            </div>
          </div>

          {/* Current bill hero */}
          <InvoiceHeroCard invoice={currentBill} onView={() => setSelected(currentBill)} />

          {/* Monthly trend + consumption-vs-bill: chart ~65-70% width, summary ~30-35%,
              via a 3-column grid (col-span-2 : col-span-1). Both children are stretched
              to the row's height so the summary card matches the chart card's height
              instead of leaving empty space beneath a shorter card. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] lg:items-stretch">
            {trendData.length >= 2 && (
              <div className="card motion-safe:animate-slide-up min-w-0 p-5">
                <p className="text-h3">Monthly bill trend</p>
                <p className="text-caption mb-1">{recentLabel}</p>
                <MonthlyTrendChart data={trendData} valueLabel="Bill" valuePrefix="₹" gradientId="myBillsTrend" />
              </div>
            )}
            <div className={trendData.length >= 2 ? 'h-full min-w-0' : 'min-w-0'}>
              <ConsumptionVsBillCard invoice={currentBill} />
            </div>
          </div>

          {/* History */}
          {historyAll.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-h3">Invoice history</p>
                  <p className="text-caption">Your previous water bills</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ocean-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                      placeholder="Search invoices..."
                      className="input h-9 w-40 pl-8 transition-[width] duration-200 focus:w-52"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as 'ALL' | InvoiceStatus); setVisibleCount(PAGE_SIZE); }}
                    className="input h-9 w-auto py-0 text-sm"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="UNPAID">Unpaid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  {availableYears.length > 1 && (
                    <select
                      value={yearFilter}
                      onChange={(e) => { setYearFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
                      className="input h-9 w-auto py-0 text-sm"
                    >
                      <option value="ALL">All years</option>
                      {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 motion-safe:animate-fade-in">
                  {search.trim() && (
                    <button type="button" onClick={() => setSearch('')} className="badge-info inline-flex items-center gap-1">
                      &ldquo;{search.trim()}&rdquo; <X size={11} />
                    </button>
                  )}
                  {statusFilter !== 'ALL' && (
                    <button type="button" onClick={() => setStatusFilter('ALL')} className="badge-info inline-flex items-center gap-1">
                      {statusFilter} <X size={11} />
                    </button>
                  )}
                  {yearFilter !== 'ALL' && (
                    <button type="button" onClick={() => setYearFilter('ALL')} className="badge-info inline-flex items-center gap-1">
                      {yearFilter} <X size={11} />
                    </button>
                  )}
                  <button type="button" onClick={clearFilters} className="text-caption underline hover:text-ocean-700 dark:hover:text-ocean-200">
                    Clear filters
                  </button>
                </div>
              )}

              {filteredHistory.length === 0 ? (
                <EmptyState
                  icon={FileWarning}
                  title="No matching invoices"
                  description="Try a different search term or clear your filters."
                  action={{ label: 'Clear filters', onClick: clearFilters }}
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {visibleHistory.map((inv, i) => (
                      <InvoiceListCard
                        key={inv.id}
                        invoice={inv}
                        onView={() => setSelected(inv)}
                        style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-caption">
                    <span>
                      Showing {visibleHistory.length} of {filteredHistory.length} invoice{filteredHistory.length === 1 ? '' : 's'}
                    </span>
                    {visibleCount < filteredHistory.length && (
                      <button
                        type="button"
                        onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                        className="btn-secondary btn-sm"
                      >
                        Show more
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {selected && <InvoiceDetailModal invoice={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
