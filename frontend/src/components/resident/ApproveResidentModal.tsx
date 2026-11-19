import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, UserCheck } from 'lucide-react';
import { useApartments } from '@/hooks/useApartments';
import { useHouseholdsByApartment } from '@/hooks/useHouseholds';
import { useApproveResident } from '@/hooks/useResidentManagement';
import { approveResidentSchema, type ApproveResidentFormValues } from '@/utils/validationSchemas';
import ErrorBanner from '@/components/common/ErrorBanner';
import { getApiErrorMessage } from '@/utils/apiError';
import type { PendingResident } from '@/utils/types';

interface ApproveResidentModalProps {
  resident: PendingResident;
  onClose: () => void;
}

export default function ApproveResidentModal({ resident, onClose }: ApproveResidentModalProps) {
  const { data: apartments } = useApartments();
  const [apartmentId, setApartmentId] = useState<number | undefined>(undefined);
  const { data: households } = useHouseholdsByApartment(apartmentId);
  const [serverError, setServerError] = useState<string | null>(null);
  const approveMutation = useApproveResident();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ApproveResidentFormValues>({
    resolver: zodResolver(approveResidentSchema),
    defaultValues: { relationType: 'MEMBER' },
  });

  const apartmentField = register('apartmentId');

  const onSubmit = async (values: ApproveResidentFormValues) => {
    setServerError(null);
    try {
      await approveMutation.mutateAsync({
        id: resident.id,
        payload: { householdId: values.householdId, relationType: values.relationType },
      });
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ocean-900 dark:text-white">Approve Resident Registration</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-ocean-400 dark:text-ocean-500 hover:bg-ocean-100 dark:hover:bg-ocean-800" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <ErrorBanner message={serverError} />

        <div className="mb-4 rounded-lg bg-ocean-50 dark:bg-ocean-800/40 p-3 text-sm">
          <p className="font-medium text-ocean-900 dark:text-white">{resident.fullName}</p>
          <p className="text-xs text-ocean-500 dark:text-ocean-400">{resident.username} &middot; {resident.email}</p>
          {resident.phoneNumber && <p className="text-xs text-ocean-500 dark:text-ocean-400">{resident.phoneNumber}</p>}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="apartmentId">Apartment</label>
            <select
              id="apartmentId"
              className="input"
              {...apartmentField}
              onChange={(e) => {
                apartmentField.onChange(e);
                const value = e.target.value ? Number(e.target.value) : undefined;
                setApartmentId(value);
                setValue('householdId', 0);
              }}
            >
              <option value="">Select apartment</option>
              {apartments?.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.apartmentId && <p className="field-error">{errors.apartmentId.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="householdId">Household</label>
            <select id="householdId" className="input" {...register('householdId')} disabled={!apartmentId}>
              <option value="">Select household</option>
              {households?.map((h) => (
                <option key={h.id} value={h.id}>{h.unitNumber}</option>
              ))}
            </select>
            {errors.householdId && <p className="field-error">{errors.householdId.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="relationType">Relation Type</label>
            <select id="relationType" className="input" {...register('relationType')}>
              <option value="PRIMARY">Primary</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <UserCheck size={16} className="mr-1.5" /> Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
