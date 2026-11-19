import { Moon, Sun, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function SuperAdminSettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Settings</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Preferences for your Super Admin account.</p>
      </div>

      <div className="glass-panel p-6 motion-safe:animate-slide-up" style={{ animationDelay: '80ms' }}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          <User size={16} /> Account
        </h2>
        <p className="text-sm text-ocean-600 dark:text-ocean-300">{user?.fullName} · {user?.email}</p>
      </div>

      <div className="glass-panel p-6 motion-safe:animate-slide-up" style={{ animationDelay: '140ms' }}>
        <h2 className="mb-4 text-sm font-semibold text-ocean-800 dark:text-ocean-100">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ocean-600 dark:text-ocean-300">Theme</span>
          <button className="btn-secondary" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </div>
    </div>
  );
}
