import { Link } from 'react-router-dom';
import { CheckCircle2, Download, FileText } from 'lucide-react';
import Reveal from '@/components/common/Reveal';

export default function BillingShowcase() {
  return (
    <section className="relative overflow-hidden bg-ocean-900 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 sm:px-10 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="section-title text-aqua-300">Billing experience</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Invoices that are actually easy to read.
          </h2>
          <p className="mt-5 max-w-md text-white/55">
            Every bill breaks down consumption and charges clearly, with a full payment history
            and a downloadable PDF for your records — the same view you'll find on the Invoice
            History page after you sign in.
          </p>
          <Link to="/register" className="btn-primary mt-8 inline-flex px-5 py-2.5">
            Get Started
          </Link>
        </Reveal>

        <Reveal delay={120}>
          <div className="mx-auto max-w-sm rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-glass-lg backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-white/80">
                <FileText size={16} className="text-aqua-300" />
                <span className="text-xs font-semibold uppercase tracking-wide">August 2026</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 size={12} /> Paid
              </span>
            </div>

            <p className="mt-6 font-display text-4xl font-semibold text-white">₹1,248.00</p>
            <p className="mt-1 text-sm text-white/45">18.4 kL consumed</p>

            <dl className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/45">Consumption charges</dt>
                <dd className="text-white/80">₹980.00</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/45">Service &amp; maintenance</dt>
                <dd className="text-white/80">₹268.00</dd>
              </div>
            </dl>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="btn-secondary flex-1 justify-center border-white/15 bg-transparent text-white hover:bg-white/10"
              >
                View Invoice
              </button>
              <button
                type="button"
                className="btn flex-1 justify-center bg-white/10 text-white hover:bg-white/20"
              >
                <Download size={14} /> PDF
              </button>
            </div>
            <p className="mt-4 text-center text-[11px] text-white/30">Sample invoice preview</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
