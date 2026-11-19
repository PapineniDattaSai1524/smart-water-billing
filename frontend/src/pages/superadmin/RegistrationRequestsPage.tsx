import { useState } from 'react';
import { Check, Eye, X } from 'lucide-react';
import {
  useApproveRegistrationRequest, useRegistrationRequests, useRejectRegistrationRequest,
} from '@/hooks/useRegistrationRequests';
import type { RegistrationRequest, RegistrationStatus } from '@/utils/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/format';

const TABS: { label: string; value: RegistrationStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function RegistrationRequestsPage() {
  const [tab, setTab] = useState<RegistrationStatus | undefined>('PENDING');
  const { data: requests, isLoading } = useRegistrationRequests(tab);
  const approveMutation = useApproveRegistrationRequest();
  const rejectMutation = useRejectRegistrationRequest();

  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<RegistrationRequest | null>(null);
  const [approvedCreds, setApprovedCreds] = useState<RegistrationRequest | null>(null);
  const [pendingApprove, setPendingApprove] = useState<RegistrationRequest | null>(null);
  const [pendingReject, setPendingReject] = useState<RegistrationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    if (!pendingApprove) return;
    setError(null);
    try {
      const result = await approveMutation.mutateAsync(pendingApprove.id);
      setApprovedCreds(result.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingApprove(null);
    }
  };

  const handleReject = async () => {
    if (!pendingReject || !rejectReason.trim()) return;
    setError(null);
    try {
      await rejectMutation.mutateAsync({ id: pendingReject.id, reason: rejectReason.trim() });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingReject(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Registration Requests</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Review and approve communities requesting to join the platform.</p>
      </div>

      <div className="flex gap-1 border-b border-ocean-200 dark:border-ocean-700">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(t.value)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.value
                ? 'border-brand-600 text-brand-700 dark:text-brand-300'
                : 'border-transparent text-ocean-500 dark:text-ocean-400 hover:text-ocean-800 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} />

      {approvedCreds && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          <p className="font-medium">Community approved successfully.</p>
          <p>
            Administrator login username: <span className="font-mono font-semibold">{approvedCreds.createdAdminUsername}</span>
            {' '}— share this with {approvedCreds.adminFullName} so they can sign in with the password they set at registration.
          </p>
          <button type="button" className="mt-2 text-xs font-medium underline" onClick={() => setApprovedCreds(null)}>
            Dismiss
          </button>
        </div>
      )}

      {isLoading && <LoadingSpinner label="Loading registration requests..." />}

      {!isLoading && requests?.length === 0 && (
        <EmptyState title="No requests here" description="Nothing matches this filter right now." />
      )}

      {!isLoading && requests && requests.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-ocean-50 dark:bg-ocean-800/40 text-xs uppercase text-ocean-500 dark:text-ocean-400">
              <tr>
                <th className="px-4 py-3">Community</th>
                <th className="px-4 py-3">Apartment</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-100 dark:divide-ocean-800">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-ocean-50 dark:hover:bg-ocean-800/60">
                  <td className="px-4 py-3 font-medium text-ocean-900 dark:text-white">{request.communityName}</td>
                  <td className="px-4 py-3 text-ocean-600 dark:text-ocean-300">{request.apartmentName}</td>
                  <td className="px-4 py-3">
                    <p className="text-ocean-800 dark:text-ocean-100">{request.adminFullName}</p>
                    <p className="text-xs text-ocean-500 dark:text-ocean-400">{request.adminEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-ocean-600 dark:text-ocean-300">
                    {formatDate(request.submittedAt)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800 hover:text-brand-600 dark:hover:text-brand-400"
                        onClick={() => setViewing(request)}
                        aria-label="View details"
                      >
                        <Eye size={16} />
                      </button>
                      {request.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600"
                            onClick={() => setPendingApprove(request)}
                            aria-label="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                            onClick={() => setPendingReject(request)}
                            aria-label="Reject"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4" onClick={() => setViewing(null)} role="dialog" aria-modal="true">
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ocean-900 dark:text-white">Request Details</h2>
              <StatusBadge status={viewing.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-xs text-ocean-500 dark:text-ocean-400">Community</dt><dd className="text-ocean-800 dark:text-ocean-100">{viewing.communityName}</dd></div>
              <div><dt className="text-xs text-ocean-500 dark:text-ocean-400">Apartment</dt><dd className="text-ocean-800 dark:text-ocean-100">{viewing.apartmentName}</dd></div>
              <div className="col-span-2"><dt className="text-xs text-ocean-500 dark:text-ocean-400">Address</dt><dd className="text-ocean-800 dark:text-ocean-100">{viewing.addressLine}, {viewing.city}, {viewing.state} - {viewing.pincode}</dd></div>
              <div><dt className="text-xs text-ocean-500 dark:text-ocean-400">Administrator</dt><dd className="text-ocean-800 dark:text-ocean-100">{viewing.adminFullName}</dd></div>
              <div><dt className="text-xs text-ocean-500 dark:text-ocean-400">Email</dt><dd className="text-ocean-800 dark:text-ocean-100">{viewing.adminEmail}</dd></div>
              <div><dt className="text-xs text-ocean-500 dark:text-ocean-400">Phone</dt><dd className="text-ocean-800 dark:text-ocean-100">{viewing.adminPhoneNumber}</dd></div>
              <div><dt className="text-xs text-ocean-500 dark:text-ocean-400">Submitted</dt><dd className="text-ocean-800 dark:text-ocean-100">{formatDate(viewing.submittedAt)}</dd></div>
              {viewing.reviewedAt && (
                <div><dt className="text-xs text-ocean-500 dark:text-ocean-400">Reviewed</dt><dd className="text-ocean-800 dark:text-ocean-100">{formatDate(viewing.reviewedAt)}</dd></div>
              )}
              {viewing.rejectionReason && (
                <div className="col-span-2"><dt className="text-xs text-ocean-500 dark:text-ocean-400">Rejection Reason</dt><dd className="text-red-600 dark:text-red-400">{viewing.rejectionReason}</dd></div>
              )}
              {viewing.createdAdminUsername && (
                <div className="col-span-2"><dt className="text-xs text-ocean-500 dark:text-ocean-400">Generated Username</dt><dd className="font-mono text-ocean-800 dark:text-ocean-100">{viewing.createdAdminUsername}</dd></div>
              )}
            </dl>
            <button type="button" className="btn-secondary mt-6 w-full" onClick={() => setViewing(null)}>Close</button>
          </div>
        </div>
      )}

      {pendingApprove && (
        <ConfirmDialog
          title="Approve this registration?"
          description={`This creates the community, apartment, and an administrator account for ${pendingApprove.adminFullName}.`}
          confirmLabel="Approve"
          loading={approveMutation.isPending}
          onConfirm={handleApprove}
          onCancel={() => setPendingApprove(null)}
        />
      )}

      {pendingReject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-950/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => { setPendingReject(null); setRejectReason(''); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm animate-slide-up rounded-2xl bg-white dark:bg-ocean-900 p-6 shadow-glass-lg dark:bg-ocean-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-h3 mb-1.5">Reject this registration?</h2>
            <p className="text-body mb-4">Provide a reason — this will be visible to the applicant.</p>
            <label className="label label-required" htmlFor="reject-reason">Reason for rejection</label>
            <textarea
              id="reject-reason"
              className="input min-h-[80px] resize-none"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Incomplete address details"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => { setPendingReject(null); setRejectReason(''); }} disabled={rejectMutation.isPending}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={handleReject} disabled={rejectMutation.isPending || !rejectReason.trim()}>
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
