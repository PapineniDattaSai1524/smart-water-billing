import { Droplet, IndianRupee } from 'lucide-react';
import { formatINR, formatKl } from '@/utils/format';
import type { Invoice } from '@/utils/types';

/**
 * A deliberately simple stack of the current invoice's two headline numbers
 * -- both already present on the Invoice object, nothing derived or
 * estimated. Kept to two figures per the "don't overload the invoice page
 * with analytics" guidance.
 *
 * Stacked (Consumption row, divider, Bill row) at every width, rather than
 * split side-by-side, because this card always lives in a narrow column next
 * to the trend chart (~300-380px) -- half of that is not enough room for a
 * bold, nowrap rupee amount like "₹13,735.73" without either shrinking the
 * font to the point of illegibility or letting it overflow past the card
 * edge. Stacking gives each value the card's full width, so the amount stays
 * large, legible, and fully inside the card at any viewport.
 */
export default function ConsumptionVsBillCard({ invoice }: { invoice: Invoice }) {
  return (
    <div className="card motion-safe:animate-slide-up flex h-full flex-col justify-center gap-5 p-6 sm:p-7">
      {/* Consumption */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300">
          <Droplet size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-aqua-600 dark:text-aqua-300">Consumption</p>
          <p className="mt-1 truncate text-2xl font-bold leading-tight text-ocean-900 dark:text-white">
            {formatKl(invoice.consumptionKl)}
          </p>
        </div>
      </div>

      {/* Divider: a full-width horizontal rule between the two rows. */}
      <div className="h-px w-full bg-ocean-100 dark:bg-ocean-800" aria-hidden />

      {/* Bill */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
          <IndianRupee size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-aqua-600 dark:text-aqua-300">Bill</p>
          <p className="mt-1 truncate text-2xl font-bold leading-tight text-ocean-900 dark:text-white">
            {formatINR(invoice.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}
