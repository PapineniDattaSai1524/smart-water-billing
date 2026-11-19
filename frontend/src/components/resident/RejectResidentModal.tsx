import { useState } from 'react';
import { X, UserX } from 'lucide-react';
import { useRejectResident } from '@/hooks/useResidentManagement';
import ErrorBanner from '@/components/common/ErrorBanner';
import { getApiErrorMessage } from '@/utils/apiError';
import type { PendingResident } from '@/utils/types';

interface RejectResidentModalProps {
  resident: PendingResident;
  onClose: () => void;
}

export default function RejectResidentModal({ resident, onClose }: RejectResidentModalProps) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const rejectMutation = useRejectResident();

  const trimmedReason = reason.trim();
  const reasonError = touched && !trimmedReason ? 'Rejection reason is required' : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!trimmedReason) return;
    setServerError(null);
    try {
      await rejectMutation.mutateAsync({ id: resident.id, reason: trimmedReason });
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ocean-900 dark:text-white">Reject Resident Registration</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-ocean-400 dark:text-ocean-500 hover:bg-ocean-100 dark:hover:bg-ocean-800" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <ErrorBanner message={serverError} />

        <div className="mb-4 rounded-lg bg-ocean-50 dark:bg-ocean-800/40 p-3 text-sm">
          <p className="font-medium text-ocean-900 dark:text-white">{resident.fullName}</p>
          <p className="text-xs text-ocean-500 dark:text-ocean-400">{resident.username} &middot; {resident.email}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="reason">Rejection Reason</label>
            <textarea
              id="reason"
              className="input"
              rows={3}
              placeholder="e.g. Unable to verify identity"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
            />
            {reasonError && <p className="field-error">{reasonError}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-danger" disabled={rejectMutation.isPending}>
              <UserX size={16} className="mr-1.5" /> Reject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
