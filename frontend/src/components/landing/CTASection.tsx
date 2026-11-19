import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-ocean-gradient py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-0 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-aqua-500/15 blur-[110px]" />
        <div className="water-texture absolute inset-x-0 bottom-0 h-40 animate-wave-drift opacity-10 motion-reduce:animate-none" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 text-center sm:px-10">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Smarter water management starts here.
          </h2>
          <p className="mt-4 text-white/55">
            Join residents and communities already using Smart Water Billing to track usage and
            manage payments with clarity.
          </p>
          <a
            href="#roles"
            className="group btn mt-8 inline-flex bg-gradient-to-r from-aqua-500 to-teal-500 px-7 py-3.5 text-sm font-semibold text-white shadow-glow-aqua transition-all hover:-translate-y-0.5 hover:shadow-glass-lg"
          >
            Choose Your Experience
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
