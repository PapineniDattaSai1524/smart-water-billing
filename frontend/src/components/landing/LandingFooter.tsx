import { Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Analytics', href: '#analytics' },
      { label: 'Billing', href: '#billing' },
      { label: 'How it works', href: '#how-it-works' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Login', to: '/login' },
      { label: 'Register', to: '/register' },
      { label: 'Register your community', to: '/register-community' },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-ocean-950 py-14">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aqua-500 to-teal-500">
                <Droplets size={16} className="text-white" />
              </span>
              <span className="font-display text-sm font-semibold">Smart Water Billing</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-white/40">
              One intelligent platform for water consumption, billing and community management.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link to={link.to} className="text-sm text-white/60 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-sm text-white/60 transition-colors hover:text-white">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row">
          <p>© {new Date().getFullYear()} Smart Water Billing. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
