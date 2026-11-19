import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Building2, Droplets, Gauge, Home, Receipt,
  ShieldCheck, TrendingUp, Users, Activity, FileClock,
} from 'lucide-react';
import Reveal from '@/components/common/Reveal';

type RoleKey = 'resident' | 'owner' | 'super-admin';

interface RoleCard {
  key: RoleKey;
  portal: string;
  icon: typeof Droplets;
  title: string;
  description: string;
  features: { icon: typeof Droplets; label: string }[];
  cta: string;
  /** Per-role hover accent used for the icon badge, border glow and CTA arrow. */
  accent: string;
  /** Extra class applied to the ambient hover graphic for this card. */
  hoverGraphic: 'ripple' | 'grid' | 'network';
}

const ROLES: RoleCard[] = [
  {
    key: 'resident',
    portal: '/login/resident',
    icon: Droplets,
    title: 'Resident',
    description: 'Track your water usage, view bills, manage payments, and understand your consumption.',
    features: [
      { icon: Gauge, label: 'Water consumption' },
      { icon: Receipt, label: 'Bills & invoices' },
      { icon: TrendingUp, label: 'Payment status' },
      { icon: BarChart3, label: 'Usage analytics' },
    ],
    cta: 'Continue as Resident',
    accent: 'aqua',
    hoverGraphic: 'ripple',
  },
  {
    key: 'owner',
    portal: '/login/owner',
    icon: Building2,
    title: 'Building Owner',
    description: 'Manage apartments, households, water usage, billing, and building-level insights.',
    features: [
      { icon: Building2, label: 'Building management' },
      { icon: Home, label: 'Apartment management' },
      { icon: Users, label: 'Household management' },
      { icon: BarChart3, label: 'Billing analytics' },
    ],
    cta: 'Continue as Building Owner',
    accent: 'teal',
    hoverGraphic: 'grid',
  },
  {
    key: 'super-admin',
    portal: '/login/super-admin',
    icon: ShieldCheck,
    title: 'Super Admin',
    description: 'Monitor the complete water billing ecosystem with centralized administration and analytics.',
    features: [
      { icon: Users, label: 'User management' },
      { icon: Activity, label: 'System analytics' },
      { icon: FileClock, label: 'Audit logs' },
      { icon: ShieldCheck, label: 'System health' },
    ],
    cta: 'Continue as Super Admin',
    accent: 'sky',
    hoverGraphic: 'network',
  },
];

const ACCENT_CLASSES: Record<string, { badge: string; border: string; text: string; glow: string }> = {
  aqua: {
    badge: 'from-aqua-500/20 to-aqua-400/10 text-aqua-300 group-hover:from-aqua-500/30 group-hover:to-aqua-400/20',
    border: 'group-hover:border-aqua-400/40',
    text: 'group-hover:text-aqua-300',
    glow: 'group-hover:shadow-glow-aqua',
  },
  teal: {
    badge: 'from-teal-500/20 to-teal-400/10 text-teal-300 group-hover:from-teal-500/30 group-hover:to-teal-400/20',
    border: 'group-hover:border-teal-400/40',
    text: 'group-hover:text-teal-300',
    glow: 'group-hover:shadow-[0_0_0_1px_rgba(45,212,191,0.15),0_0_24px_-4px_rgba(45,212,191,0.35)]',
  },
  sky: {
    badge: 'from-sky-500/20 to-sky-400/10 text-sky-300 group-hover:from-sky-500/30 group-hover:to-sky-400/20',
    border: 'group-hover:border-sky-400/40',
    text: 'group-hover:text-sky-300',
    glow: 'group-hover:shadow-[0_0_0_1px_rgba(56,189,248,0.15),0_0_24px_-4px_rgba(56,189,248,0.35)]',
  },
};

/** Ambient graphic shown inside a card, revealed and animated on hover/focus. */
function HoverGraphic({ variant }: { variant: RoleCard['hoverGraphic'] }) {
  if (variant === 'ripple') {
    return (
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
        <span className="absolute inset-0 rounded-full border border-aqua-400/40 motion-safe:animate-ripple-soft" />
        <span className="absolute inset-0 rounded-full border border-aqua-400/40 motion-safe:animate-ripple-soft [animation-delay:0.6s]" />
      </div>
    );
  }
  if (variant === 'grid') {
    return (
      <div
        className="pointer-events-none absolute -right-4 -top-4 grid h-24 w-24 grid-cols-3 gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="rounded-[2px] bg-teal-400/25 motion-safe:animate-fade-in"
            style={{ animationDelay: `${i * 45}ms` }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden>
      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sky-400/70 motion-safe:animate-bob" />
      <span className="absolute right-10 top-8 h-1.5 w-1.5 rounded-full bg-sky-400/50 motion-safe:animate-bob [animation-delay:0.8s]" />
      <span className="absolute right-4 top-14 h-1.5 w-1.5 rounded-full bg-sky-400/60 motion-safe:animate-bob [animation-delay:1.4s]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 96 96" fill="none" aria-hidden>
        <path d="M78 10 L86 18 M12 78 L20 86 M50 22 L62 34" stroke="rgba(56,189,248,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function RoleSelector() {
  return (
    <section id="roles" className="relative overflow-hidden bg-ocean-900 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="section-title text-aqua-300">Get started</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Choose Your Experience
          </h2>
          <p className="mt-4 text-white/50">Access the tools designed for your role.</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {ROLES.map((role, i) => {
            const RoleIcon = role.icon;
            const accent = ACCENT_CLASSES[role.accent];
            return (
              <Reveal key={role.key} delay={i * 110} className="h-full">
                <Link
                  to={role.portal}
                  aria-label={`${role.cta} — go to the ${role.title} login`}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-7 shadow-glass backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 focus-visible:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${accent.border} ${accent.glow}`}
                >
                  <HoverGraphic variant={role.hoverGraphic} />

                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br transition-colors ${accent.badge}`}>
                    <RoleIcon size={22} className="transition-transform duration-300 group-hover:scale-110" />
                  </span>

                  <h3 className="mt-6 font-display text-xl font-semibold text-white">{role.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-white/55">{role.description}</p>

                  <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                    {role.features.map(({ icon: FeatureIcon, label }) => (
                      <li key={label} className="flex items-center gap-2.5 text-sm text-white/60">
                        <FeatureIcon size={15} className="shrink-0 text-white/35" />
                        {label}
                      </li>
                    ))}
                  </ul>

                  <span className={`mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors ${accent.text}`}>
                    {role.cta}
                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
