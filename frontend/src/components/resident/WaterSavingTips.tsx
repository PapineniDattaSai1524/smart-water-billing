import { AlertTriangle, Droplet, ShieldAlert, ThumbsUp } from 'lucide-react';
import type { ComparisonStatus } from '@/utils/types';

// Week 5-6 Feature 1: water-saving tips, related to the resident's actual consumption
// (via the real ConsumptionComparison status/possibleLeak fields) rather than a static
// list. No medical or financial advice, per the spec.
const TIPS: Record<ComparisonStatus, { icon: typeof Droplet; tone: string; iconTone: string; message: string }> = {
  BELOW_AVERAGE: {
    icon: ThumbsUp,
    tone: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconTone: 'text-emerald-600 dark:text-emerald-400',
    message: 'Your consumption is below the apartment average. Keep up the mindful usage!',
  },
  NEAR_AVERAGE: {
    icon: Droplet,
    tone: 'bg-brand-50 dark:bg-brand-500/10',
    iconTone: 'text-brand-600 dark:text-brand-400',
    message: 'Your consumption is within the apartment average.',
  },
  ABOVE_AVERAGE: {
    icon: ShieldAlert,
    tone: 'bg-amber-50 dark:bg-amber-500/10',
    iconTone: 'text-amber-600 dark:text-amber-400',
    message: 'Your water consumption is above average. Consider checking for leaking taps and reducing unnecessary usage.',
  },
};

const LEAK_TIP = {
  icon: AlertTriangle,
  tone: 'bg-red-50 dark:bg-red-500/10',
  iconTone: 'text-status-critical',
  message: 'Abnormal usage detected. Please check household plumbing for possible leaks.',
};

export default function WaterSavingTips({
  status,
  possibleLeak,
}: {
  status: ComparisonStatus | undefined;
  possibleLeak?: boolean;
}) {
  if (!status) {
    return (
      <div className="flex h-20 items-center justify-center text-sm text-ocean-400 dark:text-ocean-500">
        Tips will appear once this month&apos;s usage data is available.
      </div>
    );
  }

  // A flagged possible leak takes priority over the ordinary average-comparison tip.
  const tip = possibleLeak ? LEAK_TIP : TIPS[status];
  const Icon = tip.icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl p-4 ${tip.tone}`}>
      <div className={`mt-0.5 shrink-0 ${tip.iconTone}`}>
        <Icon size={18} className={possibleLeak ? 'animate-pulse-ring rounded-full' : undefined} />
      </div>
      <p className="text-sm text-ocean-800 dark:text-ocean-100">{tip.message}</p>
    </div>
  );
}
