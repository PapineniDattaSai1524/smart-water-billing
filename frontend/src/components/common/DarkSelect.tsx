import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export interface DarkSelectOption {
  value: string;
  label: string;
}

interface DarkSelectProps {
  id?: string;
  value: string;
  options: DarkSelectOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon?: ReactNode;
  placeholder?: string;
  'aria-invalid'?: boolean;
  name?: string;
}

/**
 * A custom-styled, keyboard-accessible listbox that matches the dark glass theme used
 * across the auth pages. Replaces the native <select>, whose open options panel is
 * rendered by the browser/OS and can't be themed or animated.
 */
export default function DarkSelect({
  id,
  value,
  options,
  onChange,
  onBlur,
  icon,
  placeholder,
  name,
  ...rest
}: DarkSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onBlur]);

  useEffect(() => {
    if (open) {
      setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
      // Focus the panel's active option on open for keyboard users.
      requestAnimationFrame(() => {
        optionRefs.current[Math.max(0, options.findIndex((o) => o.value === value))]?.focus();
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeAndFocusButton = () => {
    setOpen(false);
    onBlur?.();
    buttonRef.current?.focus();
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const next = Math.min(options.length - 1, index + 1);
        setActiveIndex(next);
        optionRefs.current[next]?.focus();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prev = Math.max(0, index - 1);
        setActiveIndex(prev);
        optionRefs.current[prev]?.focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        setActiveIndex(0);
        optionRefs.current[0]?.focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        setActiveIndex(options.length - 1);
        optionRefs.current[options.length - 1]?.focus();
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        onChange(options[index].value);
        closeAndFocusButton();
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeAndFocusButton();
        break;
      }
      case 'Tab': {
        setOpen(false);
        onBlur?.();
        break;
      }
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input keeps a plain name/value pair in the DOM for form tooling/tests. */}
      {name && <input type="hidden" name={name} value={value} readOnly />}
      {icon && <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-white/40">{icon}</span>}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id ? `${id}-listbox` : undefined}
        aria-invalid={rest['aria-invalid']}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleButtonKeyDown}
        className={clsx(
          'dark-input flex items-center pr-9 text-left',
          icon ? 'pl-9' : 'pl-3',
          rest['aria-invalid'] && 'input-error',
        )}
      >
        <span className={selected ? 'text-white' : 'text-white/30'}>
          {selected ? selected.label : placeholder}
        </span>
      </button>
      <ChevronDown
        size={16}
        className={clsx(
          'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-transform duration-200',
          open && 'rotate-180',
        )}
      />

      {open && (
        <ul
          id={id ? `${id}-listbox` : undefined}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={id ? `${id}-option-${activeIndex}` : undefined}
          className="absolute z-20 mt-2 w-full origin-top animate-pop-in overflow-hidden rounded-xl border border-white/10 bg-ocean-950/90 py-1.5 shadow-glass-lg backdrop-blur-xl"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                ref={(el) => { optionRefs.current[index] = el; }}
                id={id ? `${id}-option-${index}` : undefined}
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(option.value);
                  closeAndFocusButton();
                }}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                className={clsx(
                  'mx-1.5 cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors duration-100',
                  isSelected
                    ? 'bg-aqua-500/15 text-aqua-300'
                    : activeIndex === index
                      ? 'bg-white/10 text-white'
                      : 'text-white/80',
                )}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
