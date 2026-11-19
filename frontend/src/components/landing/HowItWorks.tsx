import { Gauge, LineChart, Receipt, Users } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

const STEPS = [
  { n: '01', icon: Gauge, title: 'Track', description: 'Record water usage from meters, automatically or by manual reading.' },
  { n: '02', icon: LineChart, title: 'Analyze', description: 'Understand consumption trends across households and communities.' },
  { n: '03', icon: Receipt, title: 'Bill', description: 'Generate transparent, itemised billing from actual usage.' },
  { n: '04', icon: Users, title: 'Manage', description: 'Monitor payments and community activity from one dashboard.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-ocean-950 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <Reveal className="max-w-2xl">
          <p className="section-title text-aqua-300">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            From meter to bill, in four steps.
          </h2>
        </Reveal>

        <div className="relative mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* Connecting line — desktop only, this is a real ordered process so the timeline is earned */}
          <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" aria-hidden />

          {STEPS.map(({ n, icon: Icon, title, description }, i) => (
            <Reveal key={n} delay={i * 100} className="relative">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-aqua-400/30 bg-ocean-950 text-aqua-300 shadow-glow-aqua">
                <Icon size={18} />
              </div>
              <p className="mt-5 font-display text-xs font-semibold tracking-widest text-white/25">{n}</p>
              <h3 className="mt-1 font-display text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
