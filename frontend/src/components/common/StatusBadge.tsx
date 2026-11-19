import clsx from 'clsx';

const STYLES: Record<string, string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-healthy',
  REJECTED: 'badge-critical',
  ACTIVE: 'badge-healthy',
  INACTIVE: 'badge-neutral',
  DISABLED: 'badge-critical',
  PAID: 'badge-healthy',
  UNPAID: 'badge-warning',
  OVERDUE: 'badge-critical',
  CANCELLED: 'badge-neutral',
  INFO: 'badge-info',
  WARNING: 'badge-warning',
  CRITICAL: 'badge-critical',
  SENT: 'badge-healthy',
  FAILED: 'badge-critical',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx(STYLES[status] ?? 'badge-neutral', 'capitalize')}>
      {status.toLowerCase()}
    </span>
  );
}
