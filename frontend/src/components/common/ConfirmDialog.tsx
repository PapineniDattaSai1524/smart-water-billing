import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  /** Optional extra content rendered between the description and the action buttons -- e.g.
   * the affected record's current role/status badges, so the person confirms with full context
   * instead of just a name in a sentence. Omitted entirely when not supplied, so every existing
   * call site (plain title + description) renders exactly as before. */
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Premium confirmation modal for irreversible/destructive actions (spec section 37) -- never browser confirm(). */
export default function ConfirmDialog({
  title, description, confirmLabel = 'Confirm', danger = false, loading = false, loadingLabel = 'Working...', children, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-950/50 p-4 backdrop-blur-sm motion-safe:animate-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm motion-safe:animate-slide-up rounded-2xl bg-white p-6 shadow-glass-lg dark:bg-ocean-900" onClick={(e) => e.stopPropagation()}>
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-status-critical dark:bg-red-500/10' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'}`}>
          <AlertTriangle size={20} />
        </div>
        <h2 className="text-h3 mb-1.5">{title}</h2>
        <p className="text-body">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button>
          <button type="button" onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'} disabled={loading}>
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
