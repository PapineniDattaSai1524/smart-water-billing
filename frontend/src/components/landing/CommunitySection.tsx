import { Building2, Home, ShieldCheck, User, Users } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

const ROLES = [
  { icon: Building2, label: 'Apartments' },
  { icon: Home, label: 'Households' },
  { icon: User, label: 'Residents' },
  { icon: Users, label: 'Building owners' },
  { icon: ShieldCheck, label: 'Administrators' },
];

export default function CommunitySection() {
  return (
    <section id="about" className="relative bg-ocean-900 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="section-title text-aqua-300">Community management</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built for every layer of a community.
          </h2>
          <p className="mt-4 text-white/50">
            One structure connects apartments, households and the people who manage them —
            each with the view and permissions they need.
          </p>
        </Reveal>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {ROLES.map(({ icon: Icon, label }, i) => (
            <Reveal key={label} delay={i * 80}>
              <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 transition-colors hover:border-aqua-400/30 hover:bg-white/[0.07]">
                <Icon size={16} className="text-aqua-300" />
                <span className="text-sm font-medium text-white/80">{label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
