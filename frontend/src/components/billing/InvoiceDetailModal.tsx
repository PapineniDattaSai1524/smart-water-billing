import { X, Droplet } from 'lucide-react';
import InvoiceStatusBadge from '@/components/billing/InvoiceStatusBadge';
import InvoicePdfButton from '@/components/billing/InvoicePdfButton';
import { formatBillingPeriod, formatDate, formatINR, formatInvoiceNumber, formatKl } from '@/utils/format';
import type { Invoice } from '@/utils/types';

// Preview of an already-fetched Invoice -- shows only fields the API actually returns
// (including the optional `breakdown`, when the backend has provided one). No new
// network call, no invented line items.
export default function InvoiceDetailModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const b = invoice.breakdown;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4 motion-safe:animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card motion-safe:animate-slide-up flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ocean-100 px-5 py-4 dark:border-ocean-800">
          <div>
            <h2 className="text-h3">{formatInvoiceNumber(invoice.id)}</h2>
            <p className="text-caption">{formatBillingPeriod(invoice.billingMonth, 'long')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ocean-400 hover:bg-ocean-100 dark:text-ocean-500 dark:hover:bg-ocean-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center justify-between rounded-xl bg-aqua-50 px-4 py-3 dark:bg-aqua-500/10">
            <div className="flex items-center gap-2 text-aqua-700 dark:text-aqua-300">
              <Droplet size={16} />
              <span className="text-sm font-medium">Water Consumption</span>
            </div>
            <span className="text-sm font-semibold text-ocean-900 dark:text-white">{formatKl(invoice.consumptionKl)}</span>
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-body">Water charges</span>
              <span className="font-medium text-ocean-800 dark:text-ocean-100">{formatINR(b ? b.baseCharge : invoice.baseCharge)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body">Fixed charge</span>
              <span className="font-medium text-ocean-800 dark:text-ocean-100">{formatINR(b ? b.fixedCharge : invoice.fixedCharge)}</span>
            </div>
            {b && b.sharedCharge > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-body">Shared area allocation</span>
                <span className="font-medium text-ocean-800 dark:text-ocean-100">{formatINR(b.sharedCharge)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-body">Tax{b?.taxPercentage ? ` (${b.taxPercentage}%)` : ''}</span>
              <span className="font-medium text-ocean-800 dark:text-ocean-100">{formatINR(b ? b.taxAmount : invoice.taxAmount)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-ocean-100 pt-4 dark:border-ocean-800">
            <span className="text-h3">Total</span>
            <span className="text-xl font-bold text-ocean-900 dark:text-white">{formatINR(invoice.totalAmount)}</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <InvoiceStatusBadge status={invoice.status} />
            <span className="text-caption">Due {formatDate(invoice.dueDate)}</span>
          </div>
          {invoice.paidAt && (
            <p className="text-caption mt-2 text-right">Paid on {formatDate(invoice.paidAt)}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-ocean-100 px-5 py-4 dark:border-ocean-800">
          <button type="button" onClick={onClose} className="btn-secondary btn-sm">Close</button>
          <InvoicePdfButton invoice={invoice} variant="primary" />
        </div>
      </div>
    </div>
  );
}
