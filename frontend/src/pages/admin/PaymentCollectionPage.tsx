import { useState } from 'react';
import { Wallet, History, IndianRupee, ListChecks } from 'lucide-react';
import { useInvoices } from '@/hooks/useBilling';
import { useAdminPayments, useCollectPayment } from '@/hooks/usePayments';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import SuccessBanner from '@/components/common/SuccessBanner';
import KpiCard from '@/components/common/KpiCard';
import { TableSkeleton } from '@/components/common/Skeleton';
import type { PaymentMethod } from '@/utils/types';
import { formatBillingPeriod, formatDate, formatINR } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/apiError';

const METHODS: PaymentMethod[] = ['CASH', 'UPI', 'CARD', 'NETBANKING'];

export default function PaymentCollectionPage() {
  const { data: invoicePage, isLoading: loadingInvoices } = useInvoices({ status: 'UNPAID', size: 50 });
  const { data: payments, isLoading: loadingPayments } = useAdminPayments();
  const collectPayment = useCollectPayment();
  const [methodByInvoice, setMethodByInvoice] = useState<Record<number, PaymentMethod>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [collectingId, setCollectingId] = useState<number | null>(null);

  const unpaid = invoicePage?.content ?? [];
  const pendingTotal = unpaid.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const collectedTotal = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);

  const handleCollect = async (invoiceId: number) => {
    setError(null);
    setNotice(null);
    setCollectingId(invoiceId);
    const method = methodByInvoice[invoiceId] ?? 'CASH';
    try {
      await collectPayment.mutateAsync({ invoiceId, payload: { method } });
      setNotice('Payment recorded');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setCollectingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Payment Collection</h1>
        <p className="text-body mt-1">Record payments collected in person (cash) or manually reconcile others.</p>
      </div>

      {!loadingInvoices && !loadingPayments && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            <KpiCard key="pending-count" label="Pending Invoices" value={String(unpaid.length)} icon={ListChecks} color="bg-status-warning/10 text-status-warning" />,
            <KpiCard key="pending-amount" label="Pending Amount" value={formatINR(pendingTotal)} icon={IndianRupee} color="bg-status-critical/10 text-status-critical" />,
            <KpiCard key="collected" label="Total Collected" value={formatINR(collectedTotal)} icon={Wallet} color="bg-status-healthy/10 text-status-healthy" />,
          ].map((card, i) => (
            <div key={card.key} className="motion-safe:animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              {card}
            </div>
          ))}
        </div>
      )}

      <ErrorBanner message={error} />
      <SuccessBanner message={notice} />

      <div className="glass-panel motion-safe:animate-slide-up p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          <Wallet size={16} /> Pending Collections
        </h2>
        {loadingInvoices && <LoadingSpinner label="Loading pending invoices..." />}
        {!loadingInvoices && unpaid.length === 0 && (
          <EmptyState title="Nothing pending" description="All invoices across your apartments are settled." />
        )}
        {!loadingInvoices && unpaid.length > 0 && (
          <div className="space-y-3">
            {unpaid.map((inv, i) => (
              <div
                key={inv.id}
                className="motion-safe:animate-fade-in flex flex-col gap-3 rounded-xl border border-ocean-200 p-4 transition-shadow hover:shadow-card-hover dark:border-ocean-800 sm:flex-row sm:items-center sm:justify-between"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div>
                  <p className="font-medium text-ocean-900 dark:text-white">
                    Unit {inv.unitNumber} · {inv.apartmentName}
                  </p>
                  <p className="text-xs text-ocean-500 dark:text-ocean-400">
                    {formatBillingPeriod(inv.billingMonth)} · {formatINR(inv.totalAmount)} · Due {formatDate(inv.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input w-32"
                    value={methodByInvoice[inv.id] ?? 'CASH'}
                    onChange={(e) =>
                      setMethodByInvoice((m) => ({ ...m, [inv.id]: e.target.value as PaymentMethod }))
                    }
                  >
                    {METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <button
                    className="btn-primary"
                    disabled={collectingId === inv.id}
                    onClick={() => handleCollect(inv.id)}
                  >
                    {collectingId === inv.id ? 'Recording...' : 'Collect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '80ms' }}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          <History size={16} /> Collection History
        </h2>
        {loadingPayments && <TableSkeleton rows={5} cols={6} />}
        {!loadingPayments && (payments?.length ?? 0) === 0 && (
          <EmptyState title="No collections yet" description="Collected payments will appear here." icon={History} />
        )}
        {!loadingPayments && payments && payments.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="table-shell hidden sm:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>By</th>
                    <th>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p.id} className="motion-safe:animate-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                      <td className="font-medium text-ocean-900 dark:text-white">{p.unitNumber}</td>
                      <td>{formatBillingPeriod(p.billingMonth)}</td>
                      <td>{formatINR(p.amount)}</td>
                      <td>{p.method}</td>
                      <td>{p.paidByName ?? p.collectedByName ?? '—'}</td>
                      <td>{formatDate(p.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {payments.map((p, i) => (
                <div
                  key={p.id}
                  className="card motion-safe:animate-fade-in space-y-2 p-4"
                  style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ocean-900 dark:text-white">Unit {p.unitNumber}</p>
                      <p className="text-xs text-ocean-500 dark:text-ocean-400">{formatBillingPeriod(p.billingMonth)}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-ocean-900 dark:text-white">{formatINR(p.amount)}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ocean-500 dark:text-ocean-400">
                    <span>{p.method}</span>
                    <span>{p.paidByName ?? p.collectedByName ?? '—'}</span>
                    <span>{formatDate(p.paidAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
