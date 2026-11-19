import { useEffect } from 'react';
import { X } from 'lucide-react';
import InitialsAvatar from '@/components/common/InitialsAvatar';
import { formatDate } from '@/utils/format';
import type { PlatformUser, Role } from '@/utils/types';

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Building Owner',
  RESIDENT: 'Resident',
};

interface PlatformUserDetailsDrawerProps {
  user: PlatformUser;
  onClose: () => void;
  /** Optional footer action, e.g. Enable/Disable -- only rendered when the caller supplies one,
   * so this drawer stays a pure read-only view when no action makes sense in context. */
  footerAction?: { label: string; onClick: () => void; danger?: boolean; loading?: boolean };
}

/** Premium right-side drawer showing everything the platform actually knows about a user
 * account. Every field maps 1:1 to `PlatformUser` -- no building/last-login/activity fields
 * are shown here because the API doesn't return them for platform-wide users. */
export default function PlatformUserDetailsDrawer({ user, onClose, footerAction }: PlatformUserDetailsDrawerProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ocean-950/50 backdrop-blur-sm motion-safe:animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="User details"
    >
      <div
        className="flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white shadow-glass-lg motion-safe:animate-slide-in-right dark:bg-ocean-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ocean-100 px-5 py-4 dark:border-ocean-800">
          <h2 className="text-h3">User Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ocean-500 hover:bg-ocean-100 dark:text-ocean-400 dark:hover:bg-ocean-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 px-5 py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <InitialsAvatar name={user.fullName} size="md" className="h-16 w-16 text-lg" />
            <div>
              <p className="text-h3">{user.fullName}</p>
              <p className="text-caption">{user.username}</p>
            </div>
          </div>

          <dl className="space-y-4">
            <div>
              <dt className="section-title">Account</dt>
              <dd className="mt-1 space-y-0.5">
                <p className="text-body break-all">{user.email}</p>
              </dd>
            </div>
            <div>
              <dt className="section-title">Role</dt>
              <dd className="mt-1.5">
                <span className={user.role === 'ADMIN' ? 'badge-info' : 'badge-neutral'}>
                  {ROLE_LABEL[user.role]}
                </span>
              </dd>
            </div>
            <div>
              <dt className="section-title">Status</dt>
              <dd className="mt-1.5">
                <span className={user.enabled ? 'badge-healthy' : 'badge-critical'}>
                  {user.enabled ? '✓ Enabled' : '● Disabled'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="section-title">Member Since</dt>
              <dd className="text-body mt-1">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </div>

        {footerAction && (
          <div className="border-t border-ocean-100 px-5 py-4 dark:border-ocean-800">
            <button
              type="button"
              onClick={footerAction.onClick}
              disabled={footerAction.loading}
              className={footerAction.danger ? 'btn-danger w-full' : 'btn-primary w-full'}
            >
              {footerAction.loading ? 'Working...' : footerAction.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
