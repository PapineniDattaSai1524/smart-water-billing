import { ArrowRight, ChevronDown } from 'lucide-react';
import FlowVisual from './FlowVisual';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ocean-gradient">
      {/* Ambient background: radial glows + slowly drifting wave texture + soft particles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-aqua-600/20 blur-[120px]" />
        <div className="absolute -right-24 top-40 h-[28rem] w-[28rem] rounded-full bg-teal-600/15 blur-[110px]" />
        <div className="water-texture absolute inset-x-0 bottom-0 h-64 animate-wave-drift opacity-[0.15] motion-reduce:animate-none" />
        {[
          { top: '18%', left: '8%', size: 5, delay: '0s' },
          { top: '62%', left: '4%', size: 3, delay: '1.2s' },
          { top: '30%', left: '92%', size: 4, delay: '0.6s' },
          { top: '75%', left: '88%', size: 3, delay: '1.8s' },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute animate-bob rounded-full bg-aqua-300/40 motion-reduce:animate-none"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size, animationDelay: p.delay }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-16 sm:px-10 sm:pt-24 lg:grid-cols-2 lg:gap-12 lg:pb-32 lg:pt-28">
        <div>
          <p className="animate-hero-rise text-xs font-semibold uppercase tracking-[0.2em] text-aqua-300 [animation-delay:0ms]">
            Smart Water · Smart Billing · Smart Communities
          </p>

          <h1 className="mt-5 animate-hero-rise font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white [animation-delay:100ms] sm:text-5xl lg:text-[3.4rem]">
            Smarter water management.
            <br />
            Simpler billing.
            <br />
            <span className="bg-gradient-to-r from-aqua-300 to-teal-300 bg-clip-text text-transparent">
              Better communities.
            </span>
          </h1>

          <p className="mt-6 max-w-lg animate-hero-rise text-base leading-relaxed text-white/60 [animation-delay:200ms] sm:text-lg">
            Monitor water usage, understand consumption, manage billing and payments, and gain
            meaningful insights from one intelligent platform.
          </p>

          <div className="mt-9 flex animate-hero-rise flex-wrap items-center gap-4 [animation-delay:300ms]">
            <a
              href="#roles"
              className="group btn bg-gradient-to-r from-aqua-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-glow-aqua transition-all hover:-translate-y-0.5 hover:shadow-glass-lg"
            >
              Choose Your Experience
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#features"
              className="btn border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-10 flex animate-hero-rise items-center gap-6 text-xs text-white/40 [animation-delay:350ms]">
            <span>Built for residents, owners &amp; platform admins</span>
          </div>
        </div>

        <FlowVisual />
      </div>

      <a
        href="#features"
        aria-label="Scroll to features"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bob text-white/30 transition-colors hover:text-white/60 motion-reduce:animate-none lg:block"
      >
        <ChevronDown size={22} />
      </a>
    </section>
  );
}
