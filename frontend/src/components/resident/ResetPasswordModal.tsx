import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, X } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/utils/validationSchemas';
import { useResetResidentPassword } from '@/hooks/useResidentManagement';
import ErrorBanner from '@/components/common/ErrorBanner';
import PasswordInput from '@/components/common/PasswordInput';
import { getApiErrorMessage } from '@/utils/apiError';

export default function ResetPasswordModal({ residentId, onClose }: { residentId: number; onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const mutation = useResetResidentPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    try {
      await mutation.mutateAsync({ id: residentId, newPassword: values.newPassword });
      setDone(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="card w-full max-w-sm animate-pop-in p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id="reset-password-title" className="text-base font-semibold text-ocean-900 dark:text-white">
            Reset Password
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ocean-400 transition-colors duration-150 hover:bg-ocean-100 dark:text-ocean-500 dark:hover:bg-ocean-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        {done ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-fade-in dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>Password reset successfully. Share the new password with the resident securely.</span>
          </div>
        ) : (
          <>
            <ErrorBanner message={serverError} />
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="newPassword">New Password</label>
                <PasswordInput
                  id="newPassword"
                  error={Boolean(errors.newPassword)}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.newPassword)}
                  {...register('newPassword')}
                />
                <div className="field-error-slot" aria-live="polite">
                  {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirm Password</label>
                <PasswordInput
                  id="confirmPassword"
                  error={Boolean(errors.confirmPassword)}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  {...register('confirmPassword')}
                />
                <div className="field-error-slot" aria-live="polite">
                  {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
