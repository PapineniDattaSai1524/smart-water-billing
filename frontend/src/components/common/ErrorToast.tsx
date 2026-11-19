import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ErrorToastProps {
  message: string | null;
  onDismiss: () => void;
  /** Milliseconds before the toast auto-dismisses. Defaults to 5000. */
  durationMs?: number;
}

/**
 * A subtle, self-dismissing error toast rendered in the corner of the screen.
 * Used instead of the browser's blocking window.alert().
 */
export default function ErrorToast({ message, onDismiss, durationMs = 5000 }: ErrorToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-[60] flex max-w-sm items-start gap-2.5 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-lg animate-fade-in dark:border-red-500/30 dark:bg-ocean-800 dark:text-red-300"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded p-0.5 text-red-400 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
