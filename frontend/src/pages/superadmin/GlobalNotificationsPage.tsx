import { useState } from 'react';
import { Megaphone, Send, PlayCircle } from 'lucide-react';
import { useBroadcastNotification, useRunAlertCheckNow } from '@/hooks/usePlatform';
import ErrorBanner from '@/components/common/ErrorBanner';
import { getApiErrorMessage } from '@/utils/apiError';
import type { Role } from '@/utils/types';

// SUPER_ADMIN deliberately excluded: there is exactly one Super Admin account (the sender
// themself), so it isn't offered as a broadcast audience -- consistent with it being excluded
// from every other role-facing control on the platform (see PlatformUsersTable).
type Audience = Extract<Role, 'ADMIN' | 'RESIDENT'> | '';

export default function GlobalNotificationsPage() {
  const broadcast = useBroadcastNotification();
  const runAlertCheck = useRunAlertCheckNow();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<Audience>('');
  const [result, setResult] = useState<string | null>(null);
  const [alertRunResult, setAlertRunResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAlertCheck = async () => {
    setAlertRunResult(null);
    setError(null);
    try {
      const response = await runAlertCheck.mutateAsync();
      setAlertRunResult(response.message ?? 'Alert check complete.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleSend = async () => {
    setResult(null);
    setError(null);
    try {
      const response = await broadcast.mutateAsync({
        title,
        message,
        targetRole: targetRole || undefined,
      });
      setResult(`Sent to ${response.data.recipientCount} user(s).`);
      setTitle('');
      setMessage('');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-ocean-900 dark:text-white">
          <Megaphone size={20} /> Global Notifications
        </h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Send a platform-wide announcement to every user, or a specific role.</p>
      </div>

      <ErrorBanner message={error} />

      <div className="glass-panel motion-safe:animate-slide-up max-w-xl space-y-4 p-6" style={{ animationDelay: '40ms' }}>
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Scheduled maintenance" />
        </div>
        <div>
          <label className="label" htmlFor="message">Message</label>
          <textarea
            id="message"
            className="input min-h-[100px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="The platform will be briefly unavailable tonight from 11 PM to midnight."
          />
        </div>
        <div>
          <label className="label" htmlFor="targetRole">Audience</label>
          <select
            id="targetRole"
            className="input"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value as Audience)}
          >
            <option value="">Everyone</option>
            <option value="ADMIN">Building Owners only</option>
            <option value="RESIDENT">Residents only</option>
          </select>
        </div>
        {result && <p className="text-sm text-emerald-600 dark:text-emerald-400">{result}</p>}
        <button
          className="btn-primary"
          disabled={!title || !message || broadcast.isPending}
          onClick={handleSend}
        >
          <Send size={16} className="mr-2" />
          {broadcast.isPending ? 'Sending...' : 'Send Notification'}
        </button>
      </div>

      <div className="glass-panel motion-safe:animate-slide-up max-w-xl space-y-3 p-6" style={{ animationDelay: '90ms' }}>
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ocean-900 dark:text-white">
            <PlayCircle size={16} /> Alert & Notification Engine
          </h2>
          <p className="text-sm text-ocean-500 dark:text-ocean-400">
            The engine normally runs once a day. Trigger it manually to evaluate every household right now.
          </p>
        </div>
        {alertRunResult && <p className="text-sm text-emerald-600 dark:text-emerald-400">{alertRunResult}</p>}
        <button
          className="btn-secondary"
          disabled={runAlertCheck.isPending}
          onClick={handleRunAlertCheck}
        >
          <PlayCircle size={16} className="mr-2" />
          {runAlertCheck.isPending ? 'Running...' : 'Run Alert Check Now'}
        </button>
      </div>
    </div>
  );
}
