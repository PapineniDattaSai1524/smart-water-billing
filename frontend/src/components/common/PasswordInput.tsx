import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Lock } from 'lucide-react';

/** Inline eye icon (password hidden state) — kept as raw SVG per design spec. */
const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="20"
    height="20"
    aria-hidden="true"
  >
    <path d="M2.06 12.35a1 1 0 0 1 0-.7C3.9 7.3 7.6 4.5 12 4.5s8.1 2.8 9.94 7.15a1 1 0 0 1 0 .7C20.1 16.7 16.4 19.5 12 19.5s-8.1-2.8-9.94-7.15Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** Inline eye-off icon (password visible state) — kept as raw SVG per design spec. */
const EyeOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="20"
    height="20"
    aria-hidden="true"
  >
    <path d="M3 3l18 18" />
    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
    <path d="M9.9 4.7A10.9 10.9 0 0 1 12 4.5c4.4 0 8.1 2.8 9.94 7.15a1 1 0 0 1 0 .7 12.8 12.8 0 0 1-3.1 4.25" />
    <path d="M6.6 6.6a12.8 12.8 0 0 0-4.54 4.45 1 1 0 0 0 0 .7C3.9 16.7 7.6 19.5 12 19.5c1.1 0 2.15-.17 3.12-.48" />
  </svg>
);

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Marks the field as invalid, applying the shared error border/ring styles. */
  error?: boolean;
  /** Hide the leading lock icon (rarely needed — kept for tight layouts). */
  hideIcon?: boolean;
  /** 'light' uses the shared `.input` style; 'dark' uses `.dark-input` (glass panels on dark surfaces). */
  variant?: 'light' | 'dark';
}

/**
 * Drop-in replacement for `<input type="password" className="input" ... />`.
 * Adds a leading lock icon and an accessible show/hide toggle without
 * changing the underlying field value, and works with react-hook-form's
 * `register(...)` spread (ref is forwarded to the real <input>).
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', error = false, hideIcon = false, variant = 'light', ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const baseClass = variant === 'dark' ? 'dark-input' : 'input';
    const iconClass = variant === 'dark'
      ? 'text-white/40'
      : 'text-ocean-400 dark:text-ocean-500';
    const toggleClass = variant === 'dark'
      ? 'text-white/40 hover:bg-white/10 hover:text-aqua-300 focus-visible:text-aqua-300'
      : 'text-ocean-400 hover:bg-ocean-100 hover:text-aqua-600 focus-visible:text-aqua-600 dark:text-ocean-500 dark:hover:bg-ocean-800 dark:hover:text-aqua-400';

    return (
      <div className="relative">
        {!hideIcon && (
          <Lock
            aria-hidden
            className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${iconClass}`}
          />
        )}
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={[
            baseClass,
            hideIcon ? '' : 'pl-9',
            'pr-10',
            error ? 'input-error' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={0}
          className={`absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition-colors duration-150 ${toggleClass}`}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
