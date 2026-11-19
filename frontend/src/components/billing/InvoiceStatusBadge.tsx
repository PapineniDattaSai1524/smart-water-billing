import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import type { InvoiceStatus } from '@/utils/types';

// Icon + text for every real InvoiceStatus value ('UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED') --
// never relies on color alone, per the accessibility requirement.
const CONFIG: Record<InvoiceStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  PAID: {
    label: 'Paid',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  UNPAID: {
    label: 'Unpaid',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  OVERDUE: {
    label: 'Overdue',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    className: 'bg-ocean-100 text-ocean-600 dark:bg-ocean-800 dark:text-ocean-300',
  },
};

export default function InvoiceStatusBadge({
  status,
  size = 'md',
  animateIn = false,
}: {
  status: InvoiceStatus;
  size?: 'sm' | 'md';
  animateIn?: boolean;
}) {
  const config = CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config.className,
        animateIn && 'motion-safe:animate-fade-in',
      )}
    >
      <Icon size={size === 'sm' ? 11 : 13} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
