import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft, AtSign, Building2, CheckCircle2, Droplets, Gauge, KeyRound, Loader2, Mail, Receipt, ShieldCheck,
  TrendingUp, User,
} from 'lucide-react';
import { forgotPasswordSchema, loginSchema, type ForgotPasswordFormValues, type LoginFormValues } from '@/utils/validationSchemas';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { getApiErrorMessage } from '@/utils/apiError';
import ErrorBanner from '@/components/common/ErrorBanner';
import PasswordInput from '@/components/common/PasswordInput';
import type { Role } from '@/utils/types';

type Portal = 'resident' | 'owner' | 'super-admin';

interface PortalConfig {
  title: string;
  icon: typeof User;
  role: Role;
  home: string;
  tagline: string;
  features: { icon: typeof User; label: string }[];
  /** Fallback human contact shown on the "Forgot password?" panel alongside the
   *  real self-service email-reset flow, in case the reset email doesn't arrive. */
  resetContact: string;
}

const PORTAL_CONFIG: Record<Portal, PortalConfig> = {
  resident: {
    title: 'Resident Login',
    icon: User,
    role: 'RESIDENT',
    home: '/dashboard',
    tagline: 'Track your water usage and manage your bills with clarity.',
    features: [
      { icon: Gauge, label: 'Monitor your household consumption' },
      { icon: Receipt, label: 'View and pay invoices online' },
      { icon: TrendingUp, label: 'Follow monthly usage trends' },
    ],
    resetContact: 'your Building Owner',
  },
  owner: {
    title: 'Building Owner Login',
    icon: Building2,
    role: 'ADMIN',
    home: '/dashboard',
    tagline: 'Manage apartments, households, billing and revenue in one place.',
    features: [
      { icon: Building2, label: 'Manage apartments and households' },
      { icon: Receipt, label: 'Run transparent billing cycles' },
      { icon: TrendingUp, label: 'Track revenue and collections' },
    ],
    resetContact: 'your Super Admin',
  },
  'super-admin': {
    title: 'Super Admin Login',
    icon: ShieldCheck,
    role: 'SUPER_ADMIN',
    home: '/dashboard',
    tagline: 'Oversee the platform: communities, users and analytics.',
    features: [
      { icon: Building2, label: 'Approve and manage communities' },
      { icon: ShieldCheck, label: 'Control platform-wide access' },
      { icon: TrendingUp, label: 'Monitor system-wide analytics' },
    ],
    resetContact: 'your platform administrator',
  },
};

export default function LoginPage() {
  const { portal: rawPortal } = useParams<{ portal?: string }>();
  const portal: Portal = rawPortal === 'owner' || rawPortal === 'super-admin' ? rawPortal : 'resident';
  const config = PORTAL_CONFIG[portal];
  const PortalIcon = config.icon;

  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');

  const [forgotStatus, setForgotStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    // Inline, as-you-go feedback instead of waiting for submit: once a field
    // has been touched, subsequent keystrokes re-validate immediately.
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    reset: resetForgotForm,
    formState: { errors: forgotErrors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const openForgotPanel = () => {
    setServerError(null);
    setForgotStatus('idle');
    setForgotError(null);
    setDevResetLink(null);
    resetForgotForm();
    setView('forgot');
  };

  const onSubmitForgot = async (values: ForgotPasswordFormValues) => {
    setForgotError(null);
    setForgotStatus('submitting');
    try {
      const res = await authService.forgotPassword({ usernameOrEmail: values.usernameOrEmail, role: config.role });
      setDevResetLink(res.data.devResetLink ?? null);
      setForgotStatus('sent');
    } catch (error) {
      setForgotError(getApiErrorMessage(error, 'Could not process your request. Please try again.'));
      setForgotStatus('idle');
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const profile = await login(values);
      if (profile.role !== config.role) {
        logout();
        setServerError(
          `That account isn't a ${config.title.replace(' Login', '')} account. Please use the correct portal.`
        );
        return;
      }
      const redirectTo = (location.state as { from?: Location })?.from?.pathname || config.home;
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Invalid username/email or password'));
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

      <div className="relative z-10 grid w-full max-w-5xl animate-slide-up grid-cols-1 overflow-hidden rounded-2xl border border-white/10 shadow-glass-lg lg:grid-cols-2">
        {/* Left — brand panel, tuned to the selected portal */}
        <div className="relative flex flex-col justify-between gap-8 bg-gradient-to-br from-ocean-900 via-ocean-800 to-aqua-900 p-8 sm:p-10 lg:gap-10">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 animate-logo-in items-center justify-center rounded-xl bg-white/10 text-aqua-300 backdrop-blur-sm">
                <Droplets size={22} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-white/70">
                Smart Water Billing
              </span>
            </Link>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                <PortalIcon size={18} />
              </span>
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{config.title}</h1>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">{config.tagline}</p>
          </div>

          <ul className="hidden flex-col gap-5 lg:flex">
            {config.features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-aqua-300">
                  <Icon size={18} />
                </div>
                <p className="text-sm font-medium text-white/85">{label}</p>
              </li>
            ))}
          </ul>

          <Link
            to="/"
            className="hidden items-center gap-1.5 text-xs font-medium text-white/40 transition-colors hover:text-white/70 lg:flex"
          >
            <ArrowLeft size={13} /> Back to role selection
          </Link>
        </div>

        {/* Right — form panel */}
        <div className="border-t border-white/10 bg-ocean-950/80 p-8 backdrop-blur-xl sm:p-10 lg:border-l lg:border-t-0">
          <div className="mx-auto flex h-full max-w-sm flex-col justify-center">
            {view === 'login' ? (
              <div key="login-panel" className="animate-panel-in-back">
                <h2 className="text-xl font-semibold text-white">Sign in to your account</h2>
                <p className="mt-1.5 text-sm text-white/50">Enter your details to continue.</p>

                <div className="mt-6">
                  <ErrorBanner message={serverError} />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="usernameOrEmail">
                      Username or Email
                    </label>
                    <div className="relative">
                      <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        id="usernameOrEmail"
                        className={`dark-input pl-9 ${errors.usernameOrEmail ? 'input-error' : ''}`}
                        placeholder="Enter your username or email"
                        autoComplete="username"
                        aria-invalid={Boolean(errors.usernameOrEmail)}
                        aria-describedby="usernameOrEmail-error"
                        {...register('usernameOrEmail')}
                      />
                    </div>
                    <div id="usernameOrEmail-error" className="field-error-slot" aria-live="polite">
                      {errors.usernameOrEmail && <p className="field-error">{errors.usernameOrEmail.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="password">
                      Password
                    </label>
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      error={Boolean(errors.password)}
                      variant="dark"
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby="password-error"
                      {...register('password')}
                    />
                    <div id="password-error" className="field-error-slot" aria-live="polite">
                      {errors.password && <p className="field-error">{errors.password.message}</p>}
                    </div>
                    <div className="-mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={openForgotPanel}
                        className="rounded text-xs font-medium text-aqua-300 transition-colors duration-150 hover:text-aqua-200 hover:underline focus-visible:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aqua-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-glow-aqua transition-all duration-150 hover:-translate-y-0.5 hover:from-aqua-400 hover:to-teal-400 hover:shadow-[0_0_0_1px_rgba(6,182,212,0.25),0_0_32px_-2px_rgba(6,182,212,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {portal !== 'super-admin' && (
                  <p className="mt-6 text-center text-sm text-white/50">
                    Don&apos;t have an account?{' '}
                    <Link
                      to={portal === 'owner' ? '/register-community' : '/register'}
                      className="font-medium text-aqua-300 hover:text-aqua-200 hover:underline"
                    >
                      Register here
                    </Link>
                  </p>
                )}
                <Link
                  to="/"
                  className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-white/40 transition-colors hover:text-white/70 lg:hidden"
                >
                  <ArrowLeft size={13} /> Back to role selection
                </Link>
              </div>
            ) : (
              <div key="forgot-panel" className="animate-panel-in">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aqua-400/10 text-aqua-300">
                  {forgotStatus === 'sent' ? <CheckCircle2 size={18} /> : <KeyRound size={18} />}
                </div>

                {forgotStatus === 'sent' ? (
                  <>
                    <h2 className="mt-4 text-xl font-semibold text-white">Check your email</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                      If a {config.title.replace(' Login', '')} account with that username or email exists, we've
                      sent a password reset link to its registered email address. The link expires in 30 minutes
                      and can only be used once.
                    </p>

                    {devResetLink && (
                      <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
                        <p className="text-xs font-medium text-amber-300">
                          Local dev only — SMTP isn&apos;t configured on this backend, so here&apos;s the link
                          directly:
                        </p>
                        <a
                          href={devResetLink}
                          className="mt-1.5 block break-all text-xs text-aqua-300 underline hover:text-aqua-200"
                        >
                          {devResetLink}
                        </a>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all duration-150 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950 active:scale-[0.98]"
                    >
                      <ArrowLeft size={15} /> Back to sign in
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="mt-4 text-xl font-semibold text-white">Forgot password?</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                      Enter the username or email registered to your {config.title.replace(' Login', '')} account
                      and we&apos;ll send a password reset link to it.
                    </p>

                    <div className="mt-5">
                      <ErrorBanner message={forgotError} />
                    </div>

                    <form onSubmit={handleSubmitForgot(onSubmitForgot)} className="space-y-4" noValidate>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-white/80" htmlFor="forgotUsernameOrEmail">
                          Registered Username / Email
                        </label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                          <input
                            id="forgotUsernameOrEmail"
                            className={`dark-input pl-9 ${forgotErrors.usernameOrEmail ? 'input-error' : ''}`}
                            placeholder="Enter your username or email"
                            autoComplete="username"
                            aria-invalid={Boolean(forgotErrors.usernameOrEmail)}
                            aria-describedby="forgotUsernameOrEmail-error"
                            {...registerForgot('usernameOrEmail')}
                          />
                        </div>
                        <div id="forgotUsernameOrEmail-error" className="field-error-slot" aria-live="polite">
                          {forgotErrors.usernameOrEmail && (
                            <p className="field-error">{forgotErrors.usernameOrEmail.message}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotStatus === 'submitting'}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aqua-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-glow-aqua transition-all duration-150 hover:-translate-y-0.5 hover:from-aqua-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {forgotStatus === 'submitting' ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Continue'
                        )}
                      </button>
                    </form>

                    <p className="mt-4 text-center text-xs text-white/40">
                      Trouble receiving the email? Reach out to {config.resetContact}.
                    </p>

                    <button
                      type="button"
                      onClick={() => setView('login')}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition-all duration-150 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950 active:scale-[0.98]"
                    >
                      <ArrowLeft size={15} /> Back to sign in
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
