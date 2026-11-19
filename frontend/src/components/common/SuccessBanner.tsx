import { CheckCircle2 } from 'lucide-react';

interface SuccessBannerProps {
  message?: string | null;
}

export default function SuccessBanner({ message }: SuccessBannerProps) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
