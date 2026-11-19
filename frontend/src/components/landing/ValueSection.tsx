import { Droplets, BarChart3, Receipt, Building2 } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

const FEATURES = [
  {
    icon: Droplets,
    title: 'Smart water tracking',
    description: 'Monitor consumption in real time, down to the household and meter.',
  },
  {
    icon: BarChart3,
    title: 'Powerful analytics',
    description: 'Understand monthly and long-term usage trends at a glance.',
  },
  {
    icon: Receipt,
    title: 'Transparent billing',
    description: 'Clear invoices, itemised charges and full payment history.',
  },
  {
    icon: Building2,
    title: 'Community management',
    description: 'Manage apartments, households and residents from one place.',
  },
];

export default function ValueSection() {
  return (
    <section id="features" className="relative bg-ocean-950 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal className="max-w-2xl">
          <p className="section-title text-aqua-300">Smart water management</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything you need to understand and manage water consumption.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={i * 90}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-aqua-400/30 hover:bg-white/[0.06]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-aqua-500/20 to-teal-500/20 text-aqua-300 transition-colors group-hover:from-aqua-500/30 group-hover:to-teal-500/30">
                  <Icon size={20} />
                </span>
                <h3 className="mt-5 font-display text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
