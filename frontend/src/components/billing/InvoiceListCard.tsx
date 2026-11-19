import type { CSSProperties } from 'react';
import { FileText } from 'lucide-react';
import InvoiceStatusBadge from '@/components/billing/InvoiceStatusBadge';
import InvoicePdfButton from '@/components/billing/InvoicePdfButton';
import { formatBillingPeriod, formatDate, formatINR, formatInvoiceNumber, formatKl } from '@/utils/format';
import type { Invoice } from '@/utils/types';

export default function InvoiceListCard({
  invoice,
  onView,
  style,
}: {
  invoice: Invoice;
  onView: () => void;
  style?: CSSProperties;
}) {
  return (
    <div
      className="card-interactive motion-safe:animate-slide-up group p-4 sm:p-5"
      style={style}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wide text-ocean-500 dark:text-ocean-400">
            {formatInvoiceNumber(invoice.id)}
          </span>
          <p className="text-caption mt-0.5">
            {formatBillingPeriod(invoice.billingMonth, 'long')} · {formatDate(invoice.generatedAt)}
          </p>
        </div>
        <InvoiceStatusBadge status={invoice.status} size="sm" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-caption">Consumption</p>
          <p className="mt-0.5 text-sm font-medium text-ocean-800 dark:text-ocean-100">{formatKl(invoice.consumptionKl)}</p>
        </div>
        <div>
          <p className="text-caption">Total</p>
          <p className="mt-0.5 text-base font-semibold text-ocean-900 dark:text-white">{formatINR(invoice.totalAmount)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-caption">Due date</p>
          <p className="mt-0.5 text-sm font-medium text-ocean-800 dark:text-ocean-100">{formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-ocean-100 pt-3 dark:border-ocean-800 sm:flex-row sm:justify-end sm:opacity-80 sm:transition-opacity sm:group-hover:opacity-100">
        <button type="button" onClick={onView} className="btn-secondary btn-sm">
          <FileText size={12} />
          View
        </button>
        <InvoicePdfButton invoice={invoice} />
      </div>
    </div>
  );
}
