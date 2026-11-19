import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { householdSchema, type HouseholdFormValues } from '@/utils/validationSchemas';
import type { Apartment, Household } from '@/utils/types';
import type { HouseholdPayload } from '@/services/householdService';
import ErrorBanner from '@/components/common/ErrorBanner';
import { getApiErrorMessage } from '@/utils/apiError';

interface HouseholdFormModalProps {
  household: Household | null;
  apartments: Apartment[];
  onClose: () => void;
  onSubmit: (values: HouseholdPayload) => Promise<void>;
}

export default function HouseholdFormModal({
  household, apartments, onClose, onSubmit,
}: HouseholdFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdSchema),
    defaultValues: household
      ? {
          apartmentId: household.apartmentId,
          unitNumber: household.unitNumber,
          areaSqft: household.areaSqft,
          occupancyCount: household.occupancyCount,
          hasMeter: household.hasMeter,
        }
      : {
          apartmentId: apartments[0]?.id ?? 0,
          unitNumber: '',
          areaSqft: 0,
          occupancyCount: 1,
          hasMeter: true,
        },
  });

  const submit = async (values: HouseholdFormValues) => {
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-ocean-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ocean-900 dark:text-white">
            {household ? 'Edit Household' : 'New Household'}
          </h3>
          <button type="button" onClick={onClose} className="text-ocean-400 dark:text-ocean-500 hover:text-ocean-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          {household && (
            <div>
              <label className="label">Household ID</label>
              <input
                className="input font-mono text-sm text-ocean-500 dark:text-ocean-400"
                value={household.householdCode}
                readOnly
                disabled
              />
              <p className="mt-1 text-xs text-ocean-500 dark:text-ocean-400">
                Share this with the resident -- they&apos;ll enter it during registration. It cannot be changed.
              </p>
            </div>
          )}
          <div>
            <label className="label" htmlFor="apartmentId">Apartment</label>
            <select id="apartmentId" className="input" {...register('apartmentId')}>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>{apt.name}</option>
              ))}
            </select>
            {errors.apartmentId && <p className="field-error">{errors.apartmentId.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="unitNumber">Unit Number</label>
            <input id="unitNumber" className="input" placeholder="A-101" {...register('unitNumber')} />
            {errors.unitNumber && <p className="field-error">{errors.unitNumber.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="areaSqft">Area (sqft)</label>
              <input id="areaSqft" type="number" step="0.01" className="input" {...register('areaSqft')} />
              {errors.areaSqft && <p className="field-error">{errors.areaSqft.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="occupancyCount">Occupancy Count</label>
              <input id="occupancyCount" type="number" min={1} className="input" {...register('occupancyCount')} />
              {errors.occupancyCount && <p className="field-error">{errors.occupancyCount.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="hasMeter" type="checkbox" className="h-4 w-4 rounded border-ocean-300 dark:border-ocean-600" {...register('hasMeter')} />
            <label className="text-sm text-ocean-700 dark:text-ocean-300" htmlFor="hasMeter">This unit has a water meter installed</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {household ? 'Save Changes' : 'Create Household'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
