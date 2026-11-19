import { FileText } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import InvoiceStatusBadge from '@/components/billing/InvoiceStatusBadge';
import InvoicePdfButton from '@/components/billing/InvoicePdfButton';
import { formatBillingPeriod, formatDate, formatIndianNumber, formatKl } from '@/utils/format';
import type { Invoice } from '@/utils/types';

/**
 * Compact single-row layout on desktop (Bill amount | Consumption | Due date |
 * Actions), stacking cleanly on smaller screens -- was 3 separately-bordered,
 * vertically-stacked sections (amount block, then a border-t consumption/due-date
 * block, then another border-t actions block), which pushed the rest of the page
 * down further than the same information needs. Same fields, same values, same
 * InvoicePdfButton/onView handlers -- only the arrangement changed.
 */
export default function InvoiceHeroCard({ invoice, onView }: { invoice: Invoice; onView: () => void }) {
  const animatedAmount = useCountUp(invoice.totalAmount, 800);

  return (
    <div className="card motion-safe:animate-slide-up relative overflow-hidden p-5 sm:p-6">
      {/* Subtle water-themed accent, decorative only */}
      <div className="water-texture pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* Bill amount */}
        <div className="lg:min-w-[190px]">
          <div className="flex items-center gap-2">
            <p className="section-title">{formatBillingPeriod(invoice.billingMonth, 'long').toUpperCase()}</p>
            <InvoiceStatusBadge status={invoice.status} animateIn />
          </div>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-ocean-900 dark:text-white">
            ₹{formatIndianNumber(animatedAmount, 2)}
          </p>
        </div>

        {/* Consumption + due date */}
        <div className="flex gap-6 border-t border-ocean-100 pt-4 dark:border-ocean-800 lg:border-t-0 lg:border-x lg:px-6 lg:pt-0">
          <div>
            <p className="text-caption">Consumption</p>
            <p className="mt-0.5 text-sm font-semibold text-ocean-800 dark:text-ocean-100">{formatKl(invoice.consumptionKl)}</p>
          </div>
          <div>
            <p className="text-caption">Due date</p>
            <p className="mt-0.5 text-sm font-semibold text-ocean-800 dark:text-ocean-100">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-ocean-100 pt-4 dark:border-ocean-800 sm:flex-row lg:border-t-0 lg:pt-0">
          <button type="button" onClick={onView} className="btn-secondary btn-sm">
            <FileText size={13} />
            View Invoice
          </button>
          <InvoicePdfButton invoice={invoice} variant="primary" />
        </div>
      </div>
    </div>
  );
}
