import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { useAssignableResidents } from '@/hooks/useResidentManagement';
import type { AssignableResident } from '@/utils/types';

interface ResidentComboboxProps {
  value: number | undefined;
  onChange: (userId: number | undefined) => void;
  error?: string;
}

export default function ResidentCombobox({ value, onChange, error }: ResidentComboboxProps) {
  const { data: residents, isLoading } = useAssignableResidents();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = residents?.find((r) => r.id === value);

  const filtered = useMemo(() => {
    if (!residents) return [];
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter(
      (r) => r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.username.toLowerCase().includes(q),
    );
  }, [residents, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const label = (r: AssignableResident) => `${r.fullName} (${r.email})`;

  const select = (r: AssignableResident) => {
    onChange(r.id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="input flex w-full items-center justify-between text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? 'text-ocean-900 dark:text-white' : 'text-ocean-400 dark:text-ocean-500'}>
          {selected ? label(selected) : isLoading ? 'Loading residents...' : 'Search resident by name or email'}
        </span>
        <ChevronDown size={16} className="text-ocean-400 dark:text-ocean-500" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-ocean-200 dark:border-ocean-700 bg-white dark:bg-ocean-900 shadow-lg">
          <div className="flex items-center gap-2 border-b border-ocean-100 dark:border-ocean-800 px-3 py-2">
            <Search size={14} className="text-ocean-400 dark:text-ocean-500" />
            <input
              autoFocus
              type="text"
              className="w-full text-sm outline-none"
              placeholder="Type a name, email, or username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1 text-sm">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-ocean-400 dark:text-ocean-500">No residents found</li>
            )}
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-ocean-50 dark:hover:bg-ocean-800/60"
                  onClick={() => select(r)}
                >
                  <span>
                    <span className="font-medium text-ocean-900 dark:text-white">{r.fullName}</span>{' '}
                    <span className="text-ocean-500 dark:text-ocean-400">({r.email})</span>
                  </span>
                  {r.id === value && <Check size={14} className="text-emerald-600 dark:text-emerald-400" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
