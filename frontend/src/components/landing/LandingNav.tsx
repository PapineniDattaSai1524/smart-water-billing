import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplets, Menu, X } from 'lucide-react';
import clsx from 'clsx';

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Choose Your Experience', href: '#roles' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'About', href: '#about' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      id="top"
      className={clsx(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/10 bg-ocean-950/80 shadow-glass backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <a href="#top" className="flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aqua-500 to-teal-500 shadow-glow-aqua">
            <Droplets size={18} className="text-white" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">Smart Water Billing</span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link to="/login" className="text-sm font-medium text-white/80 transition-colors hover:text-white">
            Login
          </Link>
          <Link
            to="/register"
            className="btn bg-white text-ocean-900 shadow-sm hover:bg-white/90 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ocean-950"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={clsx(
          'fixed inset-0 z-[60] lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={clsx(
            'absolute inset-0 bg-ocean-950/70 backdrop-blur-sm transition-opacity duration-300',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          className={clsx(
            'absolute right-0 top-0 flex h-full w-full max-w-xs flex-col gap-1 border-l border-white/10 bg-ocean-900 p-6 shadow-glass-lg transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            mobileOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2 text-white">
              <Droplets size={18} className="text-aqua-400" />
              <span className="font-display text-sm font-semibold">Smart Water Billing</span>
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}

          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="btn-secondary justify-center border-white/15 bg-transparent text-white hover:bg-white/10"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="btn bg-white text-ocean-900 justify-center hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
