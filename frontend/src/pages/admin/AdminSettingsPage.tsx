import { useState } from 'react';
import { Moon, Sun, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [overdueReminders, setOverdueReminders] = useState(true);

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Settings</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Preferences for your Building Owner account.</p>
      </div>

      <div className="glass-panel motion-safe:animate-slide-up p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
          <User size={16} /> Account
        </h2>
        <p className="text-sm text-ocean-600 dark:text-ocean-300">{user?.fullName} · {user?.email}</p>
      </div>

      <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '60ms' }}>
        <h2 className="mb-4 text-sm font-semibold text-ocean-800 dark:text-ocean-100">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ocean-600 dark:text-ocean-300">Theme</span>
          <button className="btn-secondary" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </div>

      <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '120ms' }}>
        <h2 className="mb-4 text-sm font-semibold text-ocean-800 dark:text-ocean-100">Notification Preferences</h2>
        <div className="space-y-3 text-sm">
          <label className="flex items-center justify-between">
            <span className="text-ocean-600 dark:text-ocean-300">Email alerts for new invoices</span>
            <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-ocean-600 dark:text-ocean-300">Overdue payment reminders</span>
            <input type="checkbox" checked={overdueReminders} onChange={(e) => setOverdueReminders(e.target.checked)} className="h-4 w-4" />
          </label>
        </div>
        <p className="mt-4 text-xs text-ocean-400 dark:text-ocean-500">
          These preferences are stored locally in this demo build; wire them to a backend endpoint to persist server-side.
        </p>
      </div>
    </div>
  );
}
