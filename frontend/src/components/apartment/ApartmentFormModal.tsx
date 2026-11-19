import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { apartmentSchema, type ApartmentFormValues } from '@/utils/validationSchemas';
import type { Apartment } from '@/utils/types';
import type { ApartmentPayload } from '@/services/apartmentService';
import ErrorBanner from '@/components/common/ErrorBanner';
import { getApiErrorMessage } from '@/utils/apiError';

interface ApartmentFormModalProps {
  apartment: Apartment | null;
  onClose: () => void;
  onSubmit: (values: ApartmentPayload) => Promise<void>;
}

export default function ApartmentFormModal({ apartment, onClose, onSubmit }: ApartmentFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApartmentFormValues>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: apartment
      ? {
          name: apartment.name,
          addressLine: apartment.addressLine,
          city: apartment.city,
          state: apartment.state,
          zipCode: apartment.zipCode,
          totalUnits: apartment.totalUnits,
        }
      : { name: '', addressLine: '', city: '', state: '', zipCode: '', totalUnits: 1 },
  });

  const submit = async (values: ApartmentFormValues) => {
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
            {apartment ? 'Edit Apartment' : 'New Apartment'}
          </h3>
          <button type="button" onClick={onClose} className="text-ocean-400 dark:text-ocean-500 hover:text-ocean-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="name">Apartment Name</label>
            <input id="name" className="input" {...register('name')} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="addressLine">Address</label>
            <input id="addressLine" className="input" {...register('addressLine')} />
            {errors.addressLine && <p className="field-error">{errors.addressLine.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="city">City</label>
              <input id="city" className="input" {...register('city')} />
              {errors.city && <p className="field-error">{errors.city.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="state">State</label>
              <input id="state" className="input" {...register('state')} />
              {errors.state && <p className="field-error">{errors.state.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="zipCode">Zip Code</label>
              <input id="zipCode" className="input" {...register('zipCode')} />
              {errors.zipCode && <p className="field-error">{errors.zipCode.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="totalUnits">Total Units</label>
              <input id="totalUnits" type="number" min={1} className="input" {...register('totalUnits')} />
              {errors.totalUnits && <p className="field-error">{errors.totalUnits.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {apartment ? 'Save Changes' : 'Create Apartment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
