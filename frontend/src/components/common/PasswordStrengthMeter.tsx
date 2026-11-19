interface PasswordStrengthMeterProps {
  password: string;
}

const CHECKS = [
  { test: (p: string) => p.length >= 8, label: '8+ characters' },
  { test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p), label: 'Upper & lowercase' },
  { test: (p: string) => /\d/.test(p), label: 'Number' },
  { test: (p: string) => /[@$!%*?&#^()_+=-]/.test(p), label: 'Special character' },
];

const LEVELS = [
  { label: 'Weak', barColor: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
  { label: 'Fair', barColor: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
  { label: 'Good', barColor: 'bg-aqua-500', textColor: 'text-aqua-600 dark:text-aqua-400' },
  { label: 'Strong', barColor: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
];

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const passed = CHECKS.filter((check) => check.test(password)).length;
  // Map 0-4 passed checks onto the 4 visible levels (0 checks still shows a sliver as "Weak").
  const levelIndex = Math.max(0, Math.min(LEVELS.length - 1, passed - 1));
  const level = LEVELS[levelIndex];
  const filledBars = passed === 0 ? 1 : passed;

  return (
    <div className="mt-2 animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" role="presentation">
          {LEVELS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < filledBars ? level.barColor : 'bg-ocean-200 dark:bg-ocean-700'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${level.textColor}`}>{level.label}</span>
      </div>
      <p className="mt-1.5 text-[11px] text-ocean-400 dark:text-ocean-500">
        {CHECKS.map((check, i) => (
          <span key={check.label} className={check.test(password) ? 'text-emerald-600 dark:text-emerald-400' : ''}>
            {check.label}
            {i < CHECKS.length - 1 ? ' • ' : ''}
          </span>
        ))}
      </p>
    </div>
  );
}
