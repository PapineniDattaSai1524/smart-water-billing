import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, UserMinus, Check, X as XIcon } from 'lucide-react';
import { useHouseholds } from '@/hooks/useHouseholds';
import { useAssignResident, useDeactivateResident, useResidentsByHousehold } from '@/hooks/useResidents';
import { usePendingResidents } from '@/hooks/useResidentManagement';
import { residentAssignmentSchema, type ResidentAssignmentFormValues } from '@/utils/validationSchemas';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import ApproveResidentModal from '@/components/resident/ApproveResidentModal';
import RejectResidentModal from '@/components/resident/RejectResidentModal';
import ResidentCombobox from '@/components/resident/ResidentCombobox';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getApiErrorMessage } from '@/utils/apiError';
import type { PendingResident, ResidentAssignment } from '@/utils/types';
import { formatDate } from '@/utils/format';

export default function ResidentAssignmentPage() {
  const { data: households } = useHouseholds();
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | undefined>(undefined);
  const { data: assignments, isLoading } = useResidentsByHousehold(selectedHouseholdId);
  const assignMutation = useAssignResident();
  const deactivateMutation = useDeactivateResident();
  const [error, setError] = useState<string | null>(null);

  const { data: pendingResidents, isLoading: isPendingLoading } = usePendingResidents();
  const [approveTarget, setApproveTarget] = useState<PendingResident | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingResident | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResidentAssignmentFormValues>({
    resolver: zodResolver(residentAssignmentSchema),
    defaultValues: { relationType: 'MEMBER', moveInDate: new Date().toISOString().slice(0, 10) },
  });

  const onSubmit = async (values: ResidentAssignmentFormValues) => {
    setError(null);
    try {
      await assignMutation.mutateAsync({ ...values, moveOutDate: values.moveOutDate || null });
      reset({ householdId: values.householdId, userId: undefined, relationType: 'MEMBER', moveInDate: new Date().toISOString().slice(0, 10), moveOutDate: '' });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const [pendingDeactivate, setPendingDeactivate] = useState<ResidentAssignment | null>(null);

  const handleDeactivate = async () => {
    if (!pendingDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(pendingDeactivate.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingDeactivate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Resident Management</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Review new resident registrations and assign residents to households.</p>
      </div>

      <ErrorBanner message={error} />

      <div className="card motion-safe:animate-slide-up p-6">
        <h2 className="mb-4 text-sm font-semibold text-ocean-800 dark:text-ocean-100">Pending Resident Registrations</h2>

        {isPendingLoading && <LoadingSpinner label="Loading pending registrations..." />}

        {!isPendingLoading && pendingResidents?.length === 0 && (
          <EmptyState title="No pending registrations" description="New resident sign-ups will appear here for approval." />
        )}

        {!isPendingLoading && pendingResidents && pendingResidents.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ocean-200 dark:border-ocean-700 text-xs uppercase text-ocean-500 dark:text-ocean-400">
              <tr>
                <th className="py-2">Full Name</th>
                <th className="py-2">Username</th>
                <th className="py-2">Email</th>
                <th className="py-2">Phone Number</th>
                <th className="py-2">Registration Date</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-100 dark:divide-ocean-800">
              {pendingResidents.map((r, i) => (
                <tr key={r.id} className="motion-safe:animate-fade-in" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <td className="py-2 font-medium text-ocean-900 dark:text-white">{r.fullName}</td>
                  <td className="py-2 text-ocean-600 dark:text-ocean-300">{r.username}</td>
                  <td className="py-2 text-ocean-600 dark:text-ocean-300">{r.email}</td>
                  <td className="py-2 text-ocean-600 dark:text-ocean-300">{r.phoneNumber || '—'}</td>
                  <td className="py-2 text-ocean-600 dark:text-ocean-300">{formatDate(r.registeredAt)}</td>
                  <td className="py-2">
                    <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                      Pending
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                        onClick={() => setApproveTarget(r)}
                        aria-label="Approve registration"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        className="rounded p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        onClick={() => setRejectTarget(r)}
                        aria-label="Reject registration"
                        title="Reject"
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-base font-semibold text-ocean-900 dark:text-white">Existing Resident Assignments</h2>
        <p className="mb-4 text-sm text-ocean-500 dark:text-ocean-400">Assign already-registered residents to households, or manage current assignments.</p>
      </div>

      <div className="card motion-safe:animate-slide-up p-6" style={{ animationDelay: '80ms' }}>
        <h2 className="mb-4 text-sm font-semibold text-ocean-800 dark:text-ocean-100">Assign a Resident</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" noValidate>
          <div>
            <label className="label" htmlFor="householdId">Household</label>
            <select
              id="householdId"
              className="input"
              {...register('householdId')}
              onChange={(e) => setSelectedHouseholdId(Number(e.target.value) || undefined)}
            >
              <option value="">Select household</option>
              {households?.map((h) => (
                <option key={h.id} value={h.id}>{h.unitNumber} — {h.apartmentName}</option>
              ))}
            </select>
            {errors.householdId && <p className="field-error">{errors.householdId.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="userId">Resident</label>
            <Controller
              name="userId"
              control={control}
              render={({ field }) => (
                <ResidentCombobox value={field.value} onChange={field.onChange} error={errors.userId?.message} />
              )}
            />
          </div>
          <div>
            <label className="label" htmlFor="relationType">Relation Type</label>
            <select id="relationType" className="input" {...register('relationType')}>
              <option value="PRIMARY">Primary</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="moveInDate">Move-in Date</label>
            <input id="moveInDate" type="date" className="input" {...register('moveInDate')} />
            {errors.moveInDate && <p className="field-error">{errors.moveInDate.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="moveOutDate">Move-out Date (optional)</label>
            <input id="moveOutDate" type="date" className="input" {...register('moveOutDate')} />
            {errors.moveOutDate && <p className="field-error">{errors.moveOutDate.message}</p>}
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              <UserPlus size={16} className="mr-1.5" /> Assign Resident
            </button>
          </div>
        </form>
      </div>

      <div className="card motion-safe:animate-slide-up p-6" style={{ animationDelay: '120ms' }}>
        <h2 className="mb-4 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          {selectedHouseholdId ? 'Assignments for Selected Household' : 'Select a household above to view assignments'}
        </h2>

        {selectedHouseholdId && isLoading && <LoadingSpinner label="Loading assignments..." />}

        {selectedHouseholdId && !isLoading && assignments?.length === 0 && (
          <EmptyState title="No residents assigned yet" />
        )}

        {selectedHouseholdId && assignments && assignments.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ocean-200 dark:border-ocean-700 text-xs uppercase text-ocean-500 dark:text-ocean-400">
              <tr>
                <th className="py-2">Resident</th>
                <th className="py-2">Relation</th>
                <th className="py-2">Move-in</th>
                <th className="py-2">Move-out</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-100 dark:divide-ocean-800">
              {assignments.map((a, i) => (
                <tr key={a.id} className="motion-safe:animate-fade-in" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <td className="py-2">
                    <p className="font-medium text-ocean-900 dark:text-white">{a.userFullName}</p>
                    <p className="text-xs text-ocean-500 dark:text-ocean-400">{a.userEmail}</p>
                  </td>
                  <td className="py-2 text-ocean-600 dark:text-ocean-300">{a.relationType}</td>
                  <td className="py-2 text-ocean-600 dark:text-ocean-300">{a.moveInDate}</td>
                  <td className="py-2 text-ocean-600 dark:text-ocean-300">{a.moveOutDate || '—'}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.active ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-ocean-100 dark:bg-ocean-800 text-ocean-500 dark:text-ocean-400'}`}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {a.active && (
                      <button
                        type="button"
                        className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                        onClick={() => setPendingDeactivate(a)}
                        aria-label="Deactivate assignment"
                      >
                        <UserMinus size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {approveTarget && (
        <ApproveResidentModal resident={approveTarget} onClose={() => setApproveTarget(null)} />
      )}
      {rejectTarget && (
        <RejectResidentModal resident={rejectTarget} onClose={() => setRejectTarget(null)} />
      )}
      {pendingDeactivate && (
        <ConfirmDialog
          title="Deactivate this resident assignment?"
          description="The resident will no longer be linked to this household. This can be reversed by re-assigning them later."
          confirmLabel="Deactivate"
          danger
          loading={deactivateMutation.isPending}
          onConfirm={handleDeactivate}
          onCancel={() => setPendingDeactivate(null)}
        />
      )}
    </div>
  );
}

