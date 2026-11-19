import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, X } from 'lucide-react';
import {
  residentCreateSchema, residentUpdateSchema,
  type ResidentCreateFormValues, type ResidentUpdateFormValues,
} from '@/utils/validationSchemas';
import { useApartments } from '@/hooks/useApartments';
import { useHouseholdsByApartment } from '@/hooks/useHouseholds';
import { useCreateResident, useUpdateResident } from '@/hooks/useResidentManagement';
import PhotoUpload from '@/components/resident/PhotoUpload';
import ErrorBanner from '@/components/common/ErrorBanner';
import ErrorToast from '@/components/common/ErrorToast';
import PasswordInput from '@/components/common/PasswordInput';
import { getApiErrorMessage, getApiErrorStatus } from '@/utils/apiError';
import type { Resident } from '@/utils/types';

interface ResidentFormModalProps {
  resident?: Resident | null;
  onClose: () => void;
}

export default function ResidentFormModal({ resident, onClose }: ResidentFormModalProps) {
  const isEdit = !!resident;
  const { data: apartments } = useApartments();
  const [apartmentId, setApartmentId] = useState<number | undefined>(resident?.apartmentId ?? undefined);
  const { data: households } = useHouseholdsByApartment(apartmentId);
  // Every household in the selected apartment already has an active resident -- nothing
  // is selectable, so tell the Building Owner why instead of leaving a dead dropdown.
  const noHouseholdsAvailable =
    !isEdit && !!apartmentId && !!households && households.length > 0 && households.every((h) => h.residentCount > 0);
  const [photoUrl, setPhotoUrl] = useState<string | null>(resident?.profilePhotoUrl ?? null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Tracks whether the current serverError is specifically the "email already exists"
  // conflict, so it can be auto-cleared the moment the email field is edited.
  const [isEmailConflict, setIsEmailConflict] = useState(false);

  const createMutation = useCreateResident();
  const updateMutation = useUpdateResident();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const createForm = useForm<ResidentCreateFormValues>({
    resolver: zodResolver(residentCreateSchema),
    defaultValues: { enabled: true },
  });
  const updateForm = useForm<ResidentUpdateFormValues>({
    resolver: zodResolver(residentUpdateSchema),
    defaultValues: resident
      ? {
          fullName: resident.fullName,
          phoneNumber: resident.phoneNumber,
          gender: resident.gender ?? undefined,
          dateOfBirth: resident.dateOfBirth ?? undefined,
          emergencyContact: resident.emergencyContact ?? undefined,
          occupation: resident.occupation ?? undefined,
          familyMembers: resident.familyMembers ?? undefined,
        }
      : undefined,
  });

  useEffect(() => {
    if (resident) setApartmentId(resident.apartmentId ?? undefined);
  }, [resident]);

  // Watch the selected household so the duplicate-household error clears itself the
  // moment the Building Owner picks a different one, without needing to reopen the form.
  const selectedHouseholdId = createForm.watch('householdId');
  useEffect(() => {
    if (createForm.formState.errors.householdId?.type === 'duplicate') {
      createForm.clearErrors('householdId');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHouseholdId]);

  // The red "An account with this email already exists." banner disappears automatically
  // as soon as the Building Owner changes the email field -- it does not wait for a resubmit.
  const emailValue = createForm.watch('email');
  useEffect(() => {
    if (isEmailConflict) {
      setServerError(null);
      setIsEmailConflict(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailValue]);

  const onSubmitCreate = async (values: ResidentCreateFormValues) => {
    setServerError(null);
    setIsEmailConflict(false);
    try {
      await createMutation.mutateAsync({
        householdId: Number(values.householdId),
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        gender: values.gender || undefined,
        dateOfBirth: values.dateOfBirth || undefined,
        emergencyContact: values.emergencyContact || undefined,
        occupation: values.occupation || undefined,
        familyMembers: values.familyMembers,
        profilePhotoUrl: photoUrl ?? undefined,
        enabled: values.enabled ?? true,
      });
      onClose();
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = getApiErrorStatus(err);
      const isHouseholdConflict = status === 409 && /household/i.test(message);
      // A 409 whose message references the email is the "this email already exists"
      // conflict -- shown as the exact required copy, at the top of the form, in red.
      const isEmailAlreadyExists = status === 409 && /email/i.test(message);

      if (isHouseholdConflict) {
        // Keep the modal open, keep every entered value, highlight the Household field
        // specifically -- don't clear the form or touch the generic banner.
        createForm.setError('householdId', { type: 'duplicate', message });
        setToastMessage('Unable to add resident. This household is already assigned.');
      } else if (isEmailAlreadyExists) {
        setIsEmailConflict(true);
        setServerError('An account with this email already exists.');
      } else {
        setServerError(message);
      }
    }
  };

  const onSubmitUpdate = async (values: ResidentUpdateFormValues) => {
    if (!resident) return;
    setServerError(null);
    try {
      await updateMutation.mutateAsync({
        id: resident.id,
        payload: {
          fullName: values.fullName,
          phoneNumber: values.phoneNumber,
          gender: values.gender || undefined,
          dateOfBirth: values.dateOfBirth || undefined,
          emergencyContact: values.emergencyContact || undefined,
          occupation: values.occupation || undefined,
          familyMembers: values.familyMembers,
          profilePhotoUrl: photoUrl ?? undefined,
        },
      });
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ocean-900 dark:text-white">{isEdit ? 'Edit Resident' : 'Add Resident'}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-ocean-400 dark:text-ocean-500 hover:bg-ocean-100 dark:hover:bg-ocean-800" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {noHouseholdsAvailable && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 animate-fade-in dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>No available households in this apartment.</span>
          </div>
        )}

        <ErrorBanner message={serverError} />

        <PhotoUpload value={photoUrl} onChange={setPhotoUrl} />

        {!isEdit ? (
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="mt-4 space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Apartment</label>
                <select
                  className="input"
                  value={apartmentId ?? ''}
                  onChange={(e) => setApartmentId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Select apartment</option>
                  {apartments?.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Household</label>
                <select
                  className={`input ${createForm.formState.errors.householdId ? 'input-error' : ''}`}
                  aria-invalid={Boolean(createForm.formState.errors.householdId)}
                  {...createForm.register('householdId')}
                  disabled={!apartmentId}
                >
                  <option value="">Select household</option>
                  {households?.map((h) => (
                    <option key={h.id} value={h.id} disabled={h.residentCount > 0}>
                      {h.residentCount > 0 ? `\uD83D\uDD12 ${h.unitNumber} — Already Assigned` : `${h.unitNumber} — Available`}
                    </option>
                  ))}
                </select>
                {/* Reserve space so the error appearing/clearing never shifts the rest of the form. */}
                <div className="field-error-slot">
                  {createForm.formState.errors.householdId && (
                    <p className="field-error">⚠ {createForm.formState.errors.householdId.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full Name</label>
                <input className="input" {...createForm.register('fullName')} />
                {createForm.formState.errors.fullName && <p className="field-error">{createForm.formState.errors.fullName.message}</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" {...createForm.register('email')} />
                {createForm.formState.errors.email && <p className="field-error">{createForm.formState.errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Phone Number</label>
                <input className="input" {...createForm.register('phoneNumber')} />
                {createForm.formState.errors.phoneNumber && <p className="field-error">{createForm.formState.errors.phoneNumber.message}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <PasswordInput
                  error={Boolean(createForm.formState.errors.password)}
                  {...createForm.register('password')}
                />
                {createForm.formState.errors.password && <p className="field-error">{createForm.formState.errors.password.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Gender</label>
                <select className="input" {...createForm.register('gender')}>
                  <option value="">—</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" className="input" {...createForm.register('dateOfBirth')} />
              </div>
              <div>
                <label className="label">Family Members</label>
                <input type="number" min={0} className="input" {...createForm.register('familyMembers')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Emergency Contact</label>
                <input className="input" {...createForm.register('emergencyContact')} />
                {createForm.formState.errors.emergencyContact && <p className="field-error">{createForm.formState.errors.emergencyContact.message}</p>}
              </div>
              <div>
                <label className="label">Occupation</label>
                <input className="input" {...createForm.register('occupation')} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ocean-600 dark:text-ocean-300">
              <input type="checkbox" defaultChecked {...createForm.register('enabled')} />
              Account enabled
            </label>

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Resident'}
            </button>
          </form>
        ) : (
          <form onSubmit={updateForm.handleSubmit(onSubmitUpdate)} className="mt-4 space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full Name</label>
                <input className="input" {...updateForm.register('fullName')} />
                {updateForm.formState.errors.fullName && <p className="field-error">{updateForm.formState.errors.fullName.message}</p>}
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" {...updateForm.register('phoneNumber')} />
                {updateForm.formState.errors.phoneNumber && <p className="field-error">{updateForm.formState.errors.phoneNumber.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Gender</label>
                <select className="input" {...updateForm.register('gender')}>
                  <option value="">—</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Date of Birth</label>
                <input type="date" className="input" {...updateForm.register('dateOfBirth')} />
              </div>
              <div>
                <label className="label">Family Members</label>
                <input type="number" min={0} className="input" {...updateForm.register('familyMembers')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Emergency Contact</label>
                <input className="input" {...updateForm.register('emergencyContact')} />
                {updateForm.formState.errors.emergencyContact && <p className="field-error">{updateForm.formState.errors.emergencyContact.message}</p>}
              </div>
              <div>
                <label className="label">Occupation</label>
                <input className="input" {...updateForm.register('occupation')} />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
      <ErrorToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
