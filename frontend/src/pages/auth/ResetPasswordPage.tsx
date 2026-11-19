import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Droplets, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/utils/validationSchemas';
import { authService } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';
import ErrorBanner from '@/components/common/ErrorBanner';
import PasswordInput from '@/components/common/PasswordInput';
import type { Role } from '@/utils/types';

type Status = 'checking' | 'ready' | 'invalid' | 'submitting' | 'success';

/** Maps a role back to its login portal path, so "Back to sign in" lands in the right place. */
const PORTAL_PATH: Record<Role, string> = {
  RESIDENT: '/login',
  ADMIN: '/login/owner',
  SUPER_ADMIN: '/login/super-admin',
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>('checking');
  const [role, setRole] = useState<Role | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    let cancelled = false;
    authService
      .validateResetToken(token)
      .then((res) => {
        if (cancelled) return;
        if (res.data.valid) {
          setRole(res.data.role ?? null);
          setStatus('ready');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    setStatus('submitting');
    try {
      await authService.resetPassword({ token, ...values });
      setStatus('success');
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Could not reset your password. Please try again.'));
      setStatus('ready');
    }
  };

  const backToLoginPath = role ? PORTAL_PATH[role] : '/login';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ocean-gradient px-4 py-10">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-aqua-500/20 blur-[100px]" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-teal-500/15 blur-[120px]" />
        <div className="water-texture absolute inset-0 opacity-[0.04]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up rounded-2xl border border-white/10 bg-ocean-950/80 p-8 shadow-glass-lg backdrop-blur-xl sm:p-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-aqua-300 backdrop-blur-sm">
            <Droplets size={22} />
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider text-white/70">
            Smart Water Billing
          </span>
        </Link>

        {status === 'checking' && (
          <div className="mt-10 flex flex-col items-center gap-3 py-6 text-white/60">
            <Loader2 size={22} className="animate-spin text-aqua-300" />
            <p className="text-sm">Checking your reset link...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className="mt-8 animate-panel-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-400/10 text-red-300">
              <ShieldAlert size={18} />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-white">This link isn&apos;t valid</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-white/50">
              This password reset link is invalid, expired, or has already been used. Reset links expire a short
              time after they&apos;re requested, so head back to the login page and request a new one.
            </p>
            <Link
              to="/login"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all duration-150 hover:border-white/20 hover:bg-white/10"
            >
              Back to sign in
            </Link>
          </div>
        )}

        {(status === 'ready' || status === 'submitting') && (
          <div className="mt-8 animate-panel-in">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aqua-400/10 text-aqua-300">
              <KeyRound size={18} />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-white">Choose a new password</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-white/50">
              Your new password must be at least 8 characters and include an uppercase letter, a lowercase letter,
              a digit, and a special character.
            </p>

            <div className="mt-6">
              <ErrorBanner message={serverError} />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="newPassword">
                  New Password
                </label>
                <PasswordInput
                  id="newPassword"
                  variant="dark"
                  error={Boolean(errors.newPassword)}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.newPassword)}
                  aria-describedby="newPassword-error"
                  {...register('newPassword')}
                />
                <div id="newPassword-error" className="field-error-slot" aria-live="polite">
                  {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  variant="dark"
                  error={Boolean(errors.confirmPassword)}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby="confirmPassword-error"
                  {...register('confirmPassword')}
                />
                <div id="confirmPassword-error" className="field-error-slot" aria-live="polite">
                  {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aqua-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-glow-aqua transition-all duration-150 hover:-translate-y-0.5 hover:from-aqua-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-8 animate-panel-in text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 size={22} />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-white">Password reset</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-white/50">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link
              to={backToLoginPath}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aqua-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-glow-aqua transition-all duration-150 hover:-translate-y-0.5 hover:from-aqua-400 hover:to-teal-400"
            >
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
