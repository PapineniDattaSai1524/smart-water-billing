import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Optional call-to-action, e.g. { label: 'Retry', onClick: refetch }. */
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ocean-200 bg-ocean-50/50 px-6 py-12 text-center dark:border-ocean-700 dark:bg-ocean-900/40">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ocean-100 text-ocean-400 dark:bg-ocean-800 dark:text-ocean-500">
          <Icon size={22} />
        </div>
      )}
      <p className="text-h3">{title}</p>
      {description && <p className="text-body mt-1 max-w-sm">{description}</p>}
      {action && (
        <button type="button" onClick={action.onClick} className="btn-secondary btn-sm mt-4">
          {action.label}
        </button>
      )}
    </div>
  );
}
