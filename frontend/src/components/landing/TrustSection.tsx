import { KeyRound, Lock, ShieldCheck, UserCog } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

const TRUST_POINTS = [
  { icon: KeyRound, title: 'Secure authentication', description: 'JWT-based sign-in keeps every session verified and scoped.' },
  { icon: UserCog, title: 'Role-based access', description: 'Residents, building owners and admins see only what applies to them.' },
  { icon: Lock, title: 'Protected user data', description: 'Personal and billing data is handled behind authenticated APIs.' },
  { icon: ShieldCheck, title: 'Controlled administration', description: 'Admin actions are scoped by role, from household to platform level.' },
];

export default function TrustSection() {
  return (
    <section className="relative bg-ocean-950 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal className="max-w-2xl">
          <p className="section-title text-aqua-300">Security &amp; trust</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built on access control that actually holds up.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 90}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <Icon size={20} className="text-aqua-300" />
                <h3 className="mt-4 font-display text-sm font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
