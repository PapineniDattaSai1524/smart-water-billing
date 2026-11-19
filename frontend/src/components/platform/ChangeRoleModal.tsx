import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useChangeUserRole } from '@/hooks/usePlatform';
import ErrorBanner from '@/components/common/ErrorBanner';
import { ROLE_LABEL, RoleBadge } from '@/components/platform/platformUserDisplay';
import { getApiErrorMessage } from '@/utils/apiError';
import type { PlatformUser, Role } from '@/utils/types';

// Only these two roles are ever assignable through Role Management -- SUPER_ADMIN is a fixed,
// single, platform-level account and is never offered as a target here (the backend rejects it
// too, see PlatformUserService#changeRole).
const ASSIGNABLE_ROLES: Role[] = ['ADMIN', 'RESIDENT'];

interface ChangeRoleModalProps {
  user: PlatformUser;
  onClose: () => void;
}

/** Role management, kept deliberately separate from Enable/Disable (account status): this
 * modal only ever changes what a user can access, never whether their account can log in.
 * Two-step flow -- pick the new role, then a direction-specific confirmation -- so a role
 * change (which can hand out or remove an entire dashboard's worth of access) is never applied
 * from a single click the way toggling a status badge might be. */
export default function ChangeRoleModal({ user, onClose }: ChangeRoleModalProps) {
  const otherRole = ASSIGNABLE_ROLES.find((r) => r !== user.role) ?? user.role;
  const [selectedRole, setSelectedRole] = useState<Role>(otherRole);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [error, setError] = useState<string | null>(null);
  const changeRole = useChangeUserRole();

  const noChange = selectedRole === user.role;

  const handleClose = () => {
    if (changeRole.isPending) return;
    onClose();
  };

  const handleConfirm = async () => {
    setError(null);
    try {
      await changeRole.mutateAsync({ id: user.id, role: selectedRole });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
      setStep('select');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-950/50 p-4 backdrop-blur-sm motion-safe:animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm motion-safe:animate-slide-up rounded-2xl bg-white p-6 shadow-glass-lg dark:bg-ocean-900" onClick={(e) => e.stopPropagation()}>
        {step === 'select' ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-h3">Change User Role</h2>
              <button type="button" onClick={handleClose} className="rounded p-1 text-ocean-400 hover:bg-ocean-100 dark:text-ocean-500 dark:hover:bg-ocean-800" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <ErrorBanner message={error} />

            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ocean-500 dark:text-ocean-400">User</p>
                <p className="text-sm font-semibold text-ocean-900 dark:text-white">{user.fullName}</p>
                <p className="text-xs text-ocean-500 dark:text-ocean-400">{user.username}</p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ocean-500 dark:text-ocean-400">Current Role</p>
                <RoleBadge role={user.role} />
              </div>

              <div>
                <label className="label" htmlFor="new-role">New Role</label>
                <select
                  id="new-role"
                  className="input"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
              </div>

              {noChange ? (
                <p className="text-caption">No role change required.</p>
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>Changing the role may change the user&apos;s available permissions and dashboard.</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={handleClose} className="btn-secondary">Cancel</button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={noChange}
                className="btn-primary"
              >
                Change Role
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-h3 mb-1.5">
              Change role from {ROLE_LABEL[user.role]} to {ROLE_LABEL[selectedRole]}?
            </h2>
            <p className="text-body mb-6">
              {selectedRole === 'ADMIN'
                ? `${user.fullName} will receive Building Owner access and permissions after the change.`
                : `${user.fullName} will lose ${ROLE_LABEL[user.role]} access and will receive Resident access instead.`}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setStep('select')} className="btn-secondary" disabled={changeRole.isPending}>Cancel</button>
              <button type="button" onClick={handleConfirm} className="btn-primary" disabled={changeRole.isPending}>
                {changeRole.isPending ? 'Changing...' : 'Confirm Change'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
