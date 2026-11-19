import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AtSign, Building2, CheckCircle2, Droplets, Gauge, Home, Loader2, Mail, Phone, ShieldCheck, User, XCircle,
} from 'lucide-react';
import { registerSchema, type RegisterFormValues } from '@/utils/validationSchemas';
import { authService, type HouseholdLookupResult } from '@/services/authService';
import { getApiErrorMessage, getApiErrorStatus } from '@/utils/apiError';
import ErrorBanner from '@/components/common/ErrorBanner';
import PasswordInput from '@/components/common/PasswordInput';
import PasswordStrengthMeter from '@/components/common/PasswordStrengthMeter';
import DarkSelect from '@/components/common/DarkSelect';

const ROLE_OPTIONS = [
  { value: 'RESIDENT', label: 'Resident' },
  { value: 'ADMIN', label: 'Building Owner' },
];

const FEATURES = [
  {
    icon: Droplets,
    title: 'Smart Consumption',
    description: 'Track your water usage effortlessly.',
  },
  {
    icon: Gauge,
    title: 'Intelligent Insights',
    description: 'Understand your consumption patterns.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent Billing',
    description: 'Know exactly where your water costs come from.',
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Tracks whether the current serverError is specifically the "email already exists"
  // conflict, so it can be auto-cleared the moment the user edits the email field --
  // without also silently clearing unrelated errors (e.g. a household ID problem).
  const [isEmailConflict, setIsEmailConflict] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'RESIDENT' },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const passwordValue = watch('password') || '';
  const roleValue = watch('role');
  const householdIdValue = watch('householdId') || '';
  const emailValue = watch('email') || '';

  // The red "An account with this email already exists." banner disappears automatically
  // as soon as the user changes the email field -- it does not wait for another submit.
  useEffect(() => {
    if (isEmailConflict) {
      setServerError(null);
      setIsEmailConflict(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailValue]);

  // Debounced (500ms), non-authoritative "checking availability..." indicator -- the
  // authoritative check always happens again server-side on submit (see onSubmit below).
  const [householdLookup, setHouseholdLookup] = useState<HouseholdLookupResult | null>(null);
  const [isCheckingHousehold, setIsCheckingHousehold] = useState(false);

  useEffect(() => {
    if (roleValue !== 'RESIDENT' || !householdIdValue.trim()) {
      setHouseholdLookup(null);
      setIsCheckingHousehold(false);
      return;
    }
    setIsCheckingHousehold(true);
    const handle = setTimeout(() => {
      authService
        .checkHouseholdId(householdIdValue.trim())
        .then((res) => setHouseholdLookup(res.data))
        .catch(() => setHouseholdLookup(null))
        .finally(() => setIsCheckingHousehold(false));
    }, 500);
    return () => clearTimeout(handle);
  }, [householdIdValue, roleValue]);

  // Building Owner accounts are not created on this generic form -- they're set up
  // through the existing Community Registration flow (see handleContinueToCommunity).
  const onSubmit = async (values: RegisterFormValues) => {
    if (values.role !== 'RESIDENT') {
      navigate('/register-community');
      return;
    }
    setServerError(null);
    setIsEmailConflict(false);
    setIsSubmitting(true);
    try {
      await authService.register({
        ...values,
        phoneNumber: values.phoneNumber || undefined,
        householdId: values.householdId,
      });
      setSuccessMessage('Registration successful! You are now linked to your household -- you can log in.');
      setTimeout(() => navigate('/login'), 1800);
    } catch (error) {
      const status = getApiErrorStatus(error);
      const message = getApiErrorMessage(error, 'Registration failed. Please check your details.');
      // A 409 whose message references the email is the "this email already exists"
      // conflict -- shown as the exact required copy, at the top of the form, in red.
      // No page reload happens here: this is a caught client-side error inside an
      // async handler, the form's onSubmit already prevents the native submit/reload.
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

  const handleContinueToCommunity = () => navigate('/register-community');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ocean-gradient px-4 py-10">
      {/* Ambient background glow — kept subtle and behind the card */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-aqua-500/20 blur-[100px]" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-teal-500/15 blur-[120px]" />
        <div className="water-texture absolute inset-0 opacity-[0.04]" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl animate-slide-up grid-cols-1 overflow-hidden rounded-2xl border border-white/10 shadow-glass-lg xl:grid-cols-[minmax(0,17rem)_1fr]">
        {/* Left — brand panel (hidden until xl so the form gets more room) */}
        <div className="relative hidden flex-col justify-between gap-8 bg-gradient-to-br from-ocean-900 via-ocean-800 to-aqua-900 p-6 xl:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-aqua-300 backdrop-blur-sm">
                <Droplets size={22} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-white/70">
                Smart Water Billing
              </span>
            </div>

            <h1 className="mt-6 text-3xl font-bold leading-tight text-white">
              Smarter Water.
              <br />
              Better Living.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Monitor consumption, understand your usage, and manage water intelligently.
            </p>
          </div>

          <ul className="flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-aqua-300">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-xs text-white/50">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form panel */}
        <div className="border-t border-white/10 bg-ocean-950/80 p-7 backdrop-blur-xl sm:p-8 xl:border-l xl:border-t-0">
          <div className="mx-auto max-w-sm">
            <h2 className="text-xl font-semibold text-white">Create your account</h2>
            <p className="mt-2 text-sm text-white/50">
              Start managing your water usage with confidence.
            </p>

            <div className="mt-5 flex items-center gap-2" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-aqua-400" />
              <div className="h-1 flex-1 rounded-full bg-white/10">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-aqua-500 to-teal-400" />
              </div>
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-white/30">Account setup</p>

            {(serverError || successMessage || householdLookup?.status === 'ALREADY_REGISTERED') && (
              <div className="mt-5">
                <ErrorBanner
                  message={
                    serverError ||
                    (householdLookup?.status === 'ALREADY_REGISTERED'
                      ? householdLookup.unitNumber
                        ? `Unit ${householdLookup.unitNumber} is already filled`
                        : 'This unit is already filled'
                      : null)
                  }
                />
                {successMessage && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="role">
                  Register As
                </label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <DarkSelect
                      id="role"
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      options={ROLE_OPTIONS}
                      icon={roleValue === 'ADMIN' ? <Building2 size={16} /> : <User size={16} />}
                      aria-invalid={Boolean(errors.role)}
                    />
                  )}
                />
                {errors.role && <p className="field-error">{errors.role.message}</p>}
              </div>

              {roleValue === 'ADMIN' && (
                <div className="animate-slide-up rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aqua-500/15 text-aqua-300">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Set up your community</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/50">
                        Building Owner accounts are created through Community Registration, where
                        you&apos;ll add your building/community and administrator details. A Super
                        Admin reviews new communities before sign-in is enabled.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {roleValue === 'RESIDENT' && (
              <>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="fullName">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="fullName"
                    className="dark-input pl-9"
                    placeholder="Enter your full name"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && <p className="field-error">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="email"
                    type="email"
                    className="dark-input pl-9"
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="username"
                    className="dark-input pl-9"
                    placeholder="Choose a username"
                    {...register('username')}
                  />
                </div>
                {errors.username && <p className="field-error">{errors.username.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="password">
                  Password
                </label>
                <PasswordInput
                  id="password"
                  placeholder="••••••••••••"
                  error={Boolean(errors.password)}
                  variant="dark"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                {errors.password ? (
                  <p className="field-error">{errors.password.message}</p>
                ) : (
                  <PasswordStrengthMeter password={passwordValue} />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="phoneNumber">
                  Phone Number <span className="text-white/30">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="phoneNumber"
                    className="dark-input pl-9"
                    placeholder="Enter phone number"
                    {...register('phoneNumber')}
                  />
                </div>
                {errors.phoneNumber && <p className="field-error">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80" htmlFor="householdId">
                  Household ID
                </label>
                <div className="relative">
                  <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    id="householdId"
                    className="dark-input pl-9"
                    placeholder="Enter your household ID"
                    autoComplete="off"
                    aria-invalid={Boolean(errors.householdId)}
                    {...register('householdId')}
                  />
                </div>
                {/* Reserve space so the availability indicator never shifts layout. */}
                <div id="householdId-error" className="field-error-slot" aria-live="polite">
                  {errors.householdId ? (
                    <p className="field-error">{errors.householdId.message}</p>
                  ) : isCheckingHousehold ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/40">
                      <Loader2 size={12} className="animate-spin" /> Checking...
                    </span>
                  ) : householdLookup?.status === 'AVAILABLE' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                      <CheckCircle2 size={12} />
                      {householdLookup.unitNumber && householdLookup.apartmentName
                        ? `Unit ${householdLookup.unitNumber}, ${householdLookup.apartmentName}`
                        : 'Household found'}
                    </span>
                  ) : householdLookup?.status === 'ALREADY_REGISTERED' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                      <XCircle size={12} /> This household is already registered
                    </span>
                  ) : householdLookup?.status === 'NOT_FOUND' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400">
                      <XCircle size={12} /> We couldn&apos;t find a household with this ID
                    </span>
                  ) : null}
                </div>
              </div>
              </>
              )}

              <button
                type={roleValue === 'ADMIN' ? 'button' : 'submit'}
                onClick={roleValue === 'ADMIN' ? handleContinueToCommunity : undefined}
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aqua-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-glow-aqua transition-all duration-150 hover:-translate-y-0.5 hover:from-aqua-400 hover:to-teal-400 hover:shadow-[0_0_0_1px_rgba(6,182,212,0.25),0_0_32px_-2px_rgba(6,182,212,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {roleValue === 'ADMIN' ? (
                  'Continue to Community Registration'
                ) : isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/50">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-aqua-300 hover:text-aqua-200 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
