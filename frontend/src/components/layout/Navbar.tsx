import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, LogOut, Menu, Moon, Sun, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationBell from '@/components/layout/NotificationBell';

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Building Owner',
  RESIDENT: 'Resident',
};

interface NavbarProps {
  onOpenMobileMenu: () => void;
}

export default function Navbar({ onOpenMobileMenu }: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.fullName
    ? user.fullName.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
    : '?';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-ocean-100 bg-white/90 px-4 backdrop-blur-sm dark:border-ocean-800 dark:bg-ocean-900/90 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-ocean-500 hover:bg-ocean-100 dark:text-ocean-300 dark:hover:bg-ocean-800 md:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aqua-500 to-teal-600 text-white shadow-sm">
            <Droplets size={18} />
          </div>
          <span className="hidden text-base font-semibold text-ocean-900 dark:text-white sm:block">
            Smart Water Billing
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-full p-2 text-ocean-500 transition-colors hover:bg-ocean-100 dark:text-ocean-300 dark:hover:bg-ocean-800"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && <NotificationBell />}

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-ocean-100 dark:hover:bg-ocean-800"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aqua-100 text-xs font-semibold text-aqua-700 dark:bg-aqua-500/20 dark:text-aqua-300">
                {initials}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-medium leading-tight text-ocean-900 dark:text-ocean-50">
                  {user.fullName}
                </span>
                <span className="block text-xs leading-tight text-ocean-500 dark:text-ocean-400">
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </span>
              <ChevronDown size={14} className="hidden text-ocean-400 sm:block" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-2 w-52 animate-slide-up rounded-xl border border-ocean-100 bg-white p-1.5 shadow-glass-lg dark:border-ocean-800 dark:bg-ocean-900"
              >
                <div className="border-b border-ocean-100 px-2.5 py-2 dark:border-ocean-800 sm:hidden">
                  <p className="text-sm font-medium text-ocean-900 dark:text-ocean-50">{user.fullName}</p>
                  <p className="text-xs text-ocean-500 dark:text-ocean-400">{ROLE_LABEL[user.role] ?? user.role}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ocean-700 hover:bg-ocean-100 dark:text-ocean-200 dark:hover:bg-ocean-800"
                >
                  <User size={15} /> My Profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-status-critical hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
