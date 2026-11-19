import clsx from 'clsx';
import type { Role } from '@/utils/types';

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Building Owner',
  RESIDENT: 'Resident',
};

export function RoleBadge({ role }: { role: Role }) {
  return <span className={role === 'ADMIN' ? 'badge-info' : 'badge-neutral'}>{ROLE_LABEL[role]}</span>;
}

export function StatusBadgeCompact({ enabled }: { enabled: boolean }) {
  return <span className={enabled ? 'badge-healthy' : 'badge-critical'}>{enabled ? '✓ Enabled' : '● Disabled'}</span>;
}

/** Primary row-level Enable/Disable action -- always the same fixed size in both states
 * (including while its own request is in flight) so the Actions column never reflows or
 * shifts the "⋮" menu beside it out of alignment. Role has no bearing on whether this
 * renders: it's driven purely by `enabled`, never by `role`, so Super Admin, Building Owner
 * and Resident rows all get the same control. */
export function StatusToggleButton({
  enabled, busy, name, onClick,
}: { enabled: boolean; busy: boolean; name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label={`${enabled ? 'Disable' : 'Enable'} account for ${name}`}
      className={clsx(
        'inline-flex h-10 w-24 shrink-0 items-center justify-center rounded-lg border px-2 text-[13px] font-semibold transition-colors duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
        enabled
          ? 'border-red-200 bg-transparent text-status-critical hover:border-red-300 hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10'
          : 'border-aqua-200 bg-transparent text-aqua-700 hover:border-aqua-300 hover:bg-aqua-50 dark:border-aqua-500/40 dark:text-aqua-300 dark:hover:bg-aqua-500/10',
      )}
    >
      {busy ? (enabled ? 'Disabling…' : 'Enabling…') : (enabled ? 'Disable' : 'Enable')}
    </button>
  );
}
