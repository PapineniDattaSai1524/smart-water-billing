import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, CheckCircle2, ClipboardCheck, Droplets, Loader2, ShieldCheck, UserCog } from 'lucide-react';
import {
  registrationSubmitSchema, type RegistrationSubmitFormValues,
} from '@/utils/validationSchemas';
import { registrationService } from '@/services/registrationService';
import { getApiErrorMessage, getApiErrorStatus } from '@/utils/apiError';
import ErrorBanner from '@/components/common/ErrorBanner';
import PasswordInput from '@/components/common/PasswordInput';

const STEPS = [
  { icon: ClipboardCheck, label: 'Submit your community and admin details' },
  { icon: ShieldCheck, label: 'A Super Admin reviews your request' },
  { icon: UserCog, label: 'Sign in and start managing your community' },
];

export default function CommunityRegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Tracks whether the current serverError is specifically the "email already exists"
  // conflict, so it can be auto-cleared the moment the user edits the admin email field.
  const [isEmailConflict, setIsEmailConflict] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationSubmitFormValues>({
    resolver: zodResolver(registrationSubmitSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const adminEmailValue = watch('adminEmail') || '';

  // The red "An account with this email already exists." banner disappears automatically
  // as soon as the user changes the admin email field -- it does not wait for a resubmit.
  useEffect(() => {
    if (isEmailConflict) {
      setServerError(null);
      setIsEmailConflict(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEmailValue]);

  const onSubmit = async (values: RegistrationSubmitFormValues) => {
    setServerError(null);
    setIsEmailConflict(false);
    setIsSubmitting(true);
    try {
      await registrationService.submit(values);
      setSubmitted(true);
    } catch (error) {
      const status = getApiErrorStatus(error);
      const message = getApiErrorMessage(error, 'Registration failed. Please check your details.');
      // A 409 whose message references the email is the "this email already exists"
      // conflict -- shown as the exact required copy, at the top of the form, in red.
      // No page reload happens here: this is a caught client-side error inside an async
      // handler, the form's onSubmit already prevents the native submit/reload.
      if (status === 409 && message.toLowerCase().includes('email')) {
        setIsEmailConflict(true);
        setServerError('An account with this email already exists.');
      } else {
        setIsEmailConflict(false);
        setServerError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ocean-gradient px-4 py-10">
      {/* Ambient background glow — kept subtle and behind the card */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-aqua-500/20 blur-[100px]" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-teal-500/15 blur-[120px]" />
        <div className="water-texture absolute inset-0 opacity-[0.04]" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl animate-slide-up grid-cols-1 overflow-hidden rounded-2xl border border-white/10 shadow-glass-lg lg:grid-cols-[minmax(0,20rem)_1fr]">
        {/* Left — brand panel */}
        <div className="relative flex flex-col justify-between gap-8 bg-gradient-to-br from-ocean-900 via-ocean-800 to-aqua-900 p-7 sm:p-8">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-aqua-300 backdrop-blur-sm">
                <Droplets size={22} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-white/70">
                Smart Water Billing
              </span>
            </Link>

            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                <Building2 size={18} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-aqua-300">
                  Building Owner
                </p>
                <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Community Registration
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Bring your apartments, households and residents onto one intelligent billing
              platform.
            </p>
          </div>

          <ul className="hidden flex-col gap-5 lg:flex">
            {STEPS.map(({ icon: Icon, label }, i) => (
              <li key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-aqua-300">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Step {i + 1}
                  </p>
                  <p className="text-sm font-medium text-white/85">{label}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form panel */}
        <div className="border-t border-white/10 bg-ocean-950/80 p-7 backdrop-blur-xl sm:p-8 lg:border-l lg:border-t-0">
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="text-lg font-semibold text-white">Registration submitted successfully!</h2>
              <p className="max-w-md text-sm text-white/50">
                Your registration request has been submitted. It's now waiting for Super Admin
                approval — you'll be able to sign in once your community has been approved.
              </p>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aqua-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow-aqua transition-all hover:from-aqua-400 hover:to-teal-400"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl">
              <h2 className="text-xl font-semibold text-white">Building Owner – Community Registration</h2>
              <p className="mt-2 text-sm text-white/50">
                Tell us about your community and who'll manage it as Building Owner.
              </p>

              {serverError && (
                <div className="mt-5">
                  <ErrorBanner message={serverError} />
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-6" noValidate>
                <fieldset className="space-y-4">
                  <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aqua-300">
                    Community &amp; apartment
                  </legend>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="communityName">
                        Community Name
                      </label>
                      <input
                        id="communityName"
                        className="dark-input"
                        placeholder="Green Valley Community"
                        {...register('communityName')}
                      />
                      {errors.communityName && <p className="field-error">{errors.communityName.message}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="apartmentName">
                        Apartment Name
                      </label>
                      <input
                        id="apartmentName"
                        className="dark-input"
                        placeholder="Green Valley Towers"
                        {...register('apartmentName')}
                      />
                      {errors.apartmentName && <p className="field-error">{errors.apartmentName.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="addressLine">
                      Apartment Address
                    </label>
                    <input
                      id="addressLine"
                      className="dark-input"
                      placeholder="123 Lake View Road"
                      {...register('addressLine')}
                    />
                    {errors.addressLine && <p className="field-error">{errors.addressLine.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="city">
                        City
                      </label>
                      <input id="city" className="dark-input" placeholder="Chennai" {...register('city')} />
                      {errors.city && <p className="field-error">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="state">
                        State
                      </label>
                      <input id="state" className="dark-input" placeholder="Tamil Nadu" {...register('state')} />
                      {errors.state && <p className="field-error">{errors.state.message}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="pincode">
                        Pincode
                      </label>
                      <input id="pincode" className="dark-input" placeholder="600001" {...register('pincode')} />
                      {errors.pincode && <p className="field-error">{errors.pincode.message}</p>}
                    </div>
                  </div>
                </fieldset>

                <fieldset className="space-y-4">
                  <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-aqua-300">
                    Administrator details
                  </legend>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="adminFullName">
                        Administrator Name
                      </label>
                      <input
                        id="adminFullName"
                        className="dark-input"
                        placeholder="Ravi Kumar"
                        {...register('adminFullName')}
                      />
                      {errors.adminFullName && <p className="field-error">{errors.adminFullName.message}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="adminEmail">
                        Email
                      </label>
                      <input
                        id="adminEmail"
                        type="email"
                        className="dark-input"
                        placeholder="you@example.com"
                        {...register('adminEmail')}
                      />
                      {errors.adminEmail && <p className="field-error">{errors.adminEmail.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="adminPhoneNumber">
                      Phone Number
                    </label>
                    <input
                      id="adminPhoneNumber"
                      className="dark-input"
                      placeholder="9876543210"
                      {...register('adminPhoneNumber')}
                    />
                    {errors.adminPhoneNumber && <p className="field-error">{errors.adminPhoneNumber.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="password">
                        Password
                      </label>
                      <PasswordInput
                        id="password"
                        placeholder="••••••••"
                        error={Boolean(errors.password)}
                        variant="dark"
                        {...register('password')}
                      />
                      {errors.password && <p className="field-error">{errors.password.message}</p>}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="confirmPassword">
                        Confirm Password
                      </label>
                      <PasswordInput
                        id="confirmPassword"
                        placeholder="••••••••"
                        error={Boolean(errors.confirmPassword)}
                        variant="dark"
                        {...register('confirmPassword')}
                      />
                      {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>
                </fieldset>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aqua-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-glow-aqua transition-all duration-150 hover:-translate-y-0.5 hover:from-aqua-400 hover:to-teal-400 hover:shadow-[0_0_0_1px_rgba(6,182,212,0.25),0_0_32px_-2px_rgba(6,182,212,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting request...
                    </>
                  ) : (
                    'Submit Registration Request'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/50">
                Already approved?{' '}
                <Link to="/login" className="font-medium text-aqua-300 hover:text-aqua-200 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
