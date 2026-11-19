import { useState } from 'react';
import { CheckCircle2, CircleDollarSign, CreditCard, Receipt, UserX } from 'lucide-react';
import { useMyInvoices } from '@/hooks/useBilling';
import { useMyPayments, usePayInvoice } from '@/hooks/usePayments';
import { useCountUp } from '@/hooks/useCountUp';
import EmptyState from '@/components/common/EmptyState';
import KpiCard from '@/components/common/KpiCard';
import StatusBadge from '@/components/common/StatusBadge';
import { TableSkeleton } from '@/components/common/Skeleton';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatBillingPeriod, formatDate, formatINR, formatKl } from '@/utils/format';
import type { PaymentMethod } from '@/utils/types';

const METHODS: PaymentMethod[] = ['UPI', 'CARD', 'NETBANKING', 'CASH'];

export default function PaymentsPage() {
  const { data: invoices, isLoading: loadingInvoices, isError: invoicesError, error: invoicesErrorObj } = useMyInvoices();
  const { data: payments, isLoading: loadingPayments, isError: paymentsError, error: paymentsErrorObj } = useMyPayments();
  const payInvoice = usePayInvoice();
  const [methodByInvoice, setMethodByInvoice] = useState<Record<number, PaymentMethod>>({});

  const notLinkedMessage = getApiErrorMessage(
    invoicesErrorObj ?? paymentsErrorObj,
    'Your account isn\'t assigned to a household yet. Please contact your Building Owner administrator so they can add you.',
  );

  const unpaid = (invoices ?? []).filter((inv) => inv.status !== 'PAID');
  const outstandingTotal = unpaid.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const animatedOutstanding = useCountUp(outstandingTotal, 900);

  const handlePay = async (invoiceId: number) => {
    const method = methodByInvoice[invoiceId] ?? 'UPI';
    await payInvoice.mutateAsync({ invoiceId, payload: { method } });
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Payments</h1>
        <p className="text-body mt-1">Pay your outstanding bills and review your payment history.</p>
      </div>

      {!loadingInvoices && !invoicesError && invoices && invoices.length > 0 && (
        <div className="motion-safe:animate-slide-up grid grid-cols-2 gap-4 sm:grid-cols-2">
          <KpiCard
            label="Outstanding"
            value={formatINR(animatedOutstanding)}
            icon={CircleDollarSign}
            color={outstandingTotal > 0 ? 'bg-status-critical/10 text-status-critical' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'}
            caption={`${unpaid.length} bill${unpaid.length === 1 ? '' : 's'} unpaid`}
          />
          <KpiCard
            label="Paid This Year"
            value={formatINR((payments ?? []).reduce((sum, p) => sum + p.amount, 0))}
            icon={CheckCircle2}
            color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
            caption={`${(payments ?? []).length} payment${(payments ?? []).length === 1 ? '' : 's'} on record`}
          />
        </div>
      )}

      <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '40ms' }}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          <CreditCard size={16} /> Outstanding Bills
        </h2>
        {loadingInvoices && <TableSkeleton rows={2} cols={3} />}
        {!loadingInvoices && invoicesError && (
          <EmptyState icon={UserX} title="Not linked to a household yet" description={notLinkedMessage} />
        )}
        {!loadingInvoices && !invoicesError && unpaid.length === 0 && (
          <EmptyState icon={CheckCircle2} title="You're all caught up" description="No outstanding bills to pay right now." />
        )}
        {!loadingInvoices && !invoicesError && unpaid.length > 0 && (
          <div className="space-y-3">
            {unpaid.map((inv, i) => (
              <div
                key={inv.id}
                className="motion-safe:animate-fade-in flex flex-col gap-3 rounded-xl border border-ocean-200 p-4 transition-shadow hover:shadow-card-hover dark:border-ocean-800 sm:flex-row sm:items-center sm:justify-between"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div>
                  <p className="font-medium text-ocean-900 dark:text-white">{formatBillingPeriod(inv.billingMonth)} — {formatINR(inv.totalAmount)}</p>
                  <p className="text-xs text-ocean-500 dark:text-ocean-400">
                    {formatKl(inv.consumptionKl)} · Due {formatDate(inv.dueDate)} · <StatusBadge status={inv.status} />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input w-32"
                    value={methodByInvoice[inv.id] ?? 'UPI'}
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
                    disabled={payInvoice.isPending}
                    onClick={() => handlePay(inv.id)}
                  >
                    {payInvoice.isPending ? 'Paying...' : 'Pay Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '120ms' }}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          <Receipt size={16} /> Payment History
        </h2>
        {loadingPayments && <TableSkeleton rows={3} cols={4} />}
        {!loadingPayments && paymentsError && (
          <EmptyState icon={UserX} title="Not linked to a household yet" description={notLinkedMessage} />
        )}
        {!loadingPayments && !paymentsError && (payments?.length ?? 0) === 0 && (
          <EmptyState icon={Receipt} title="No payments yet" description="Your paid bills will show up here." />
        )}
        {!loadingPayments && !paymentsError && payments && payments.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-ocean-500 dark:text-ocean-400">
                  <tr>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Paid At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ocean-100 dark:divide-ocean-800">
                  {payments.map((p, i) => (
                    <tr key={p.id} className="motion-safe:animate-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                      <td className="px-3 py-2 font-medium text-ocean-900 dark:text-white">{formatBillingPeriod(p.billingMonth)}</td>
                      <td className="px-3 py-2 text-ocean-700 dark:text-ocean-300">{formatINR(p.amount)}</td>
                      <td className="px-3 py-2 text-ocean-700 dark:text-ocean-300">{p.method}</td>
                      <td className="px-3 py-2 text-ocean-500 dark:text-ocean-400">{formatDate(p.paidAt)}</td>
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
                  className="card motion-safe:animate-fade-in flex items-center justify-between gap-3 p-4"
                  style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ocean-900 dark:text-white">{formatBillingPeriod(p.billingMonth)}</p>
                    <p className="text-xs text-ocean-500 dark:text-ocean-400">{p.method} · {formatDate(p.paidAt)}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-ocean-900 dark:text-white">{formatINR(p.amount)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
