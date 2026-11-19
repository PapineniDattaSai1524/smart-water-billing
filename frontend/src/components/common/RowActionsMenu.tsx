import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import clsx from 'clsx';

export interface RowAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

interface RowActionsMenuProps {
  actions: RowAction[];
  label: string;
  /** Trigger button size. 'sm' (default) keeps the existing compact ~28px hit target used
   * across the app's other row menus, unchanged. 'md' is a fixed 36x36px square -- used where
   * the menu sits beside a fixed-size primary action button and needs to match its height. */
  size?: 'sm' | 'md';
}

/** Compact "⋮" action menu for dense table rows -- keeps every row the same
 * height regardless of how many actions it has, instead of a row of full
 * buttons competing for space (spec: actions column should not be visually
 * heavy). Same accessible dropdown pattern (click-outside, Escape, role="menu")
 * already used by Navbar's profile menu, so keyboard/focus behavior is
 * consistent app-wide rather than a one-off. */
export default function RowActionsMenu({ actions, label, size = 'sm' }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={clsx(
          'flex shrink-0 items-center justify-center rounded-lg text-ocean-500 transition-colors hover:bg-ocean-100 hover:text-ocean-700 dark:text-ocean-400 dark:hover:bg-ocean-800 dark:hover:text-ocean-100',
          size === 'md' ? 'h-9 w-9' : 'p-1.5',
        )}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-44 motion-safe:animate-slide-up rounded-xl border border-ocean-100 bg-white p-1.5 shadow-glass-lg dark:border-ocean-800 dark:bg-ocean-900"
        >
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              disabled={a.disabled}
              onClick={() => { setOpen(false); a.onClick(); }}
              className={clsx(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                a.danger
                  ? 'text-status-critical hover:bg-red-50 dark:hover:bg-red-500/10'
                  : 'text-ocean-700 hover:bg-ocean-100 dark:text-ocean-200 dark:hover:bg-ocean-800',
              )}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
