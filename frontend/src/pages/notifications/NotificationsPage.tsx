import { Bell, BellRing, Check } from 'lucide-react';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/hooks/useDashboardExtras';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications(0, 50);
  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 motion-safe:animate-slide-up">
        <div>
          <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-ocean-500 dark:text-ocean-400">Recent activity relevant to you.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
          Mark all as read
        </button>
      </div>

      {isLoading && <LoadingSpinner label="Loading notifications..." />}

      {!isLoading && data?.content.length === 0 && (
        <EmptyState title="You're all caught up" description="New notifications will show up here." icon={Bell} />
      )}

      {!isLoading && data && data.content.length > 0 && (
        <div className="card divide-y divide-ocean-100 dark:divide-ocean-800 motion-safe:animate-slide-up" style={{ animationDelay: '80ms' }}>
          {data.content.map((n, i) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 motion-safe:animate-fade-in ${!n.read ? 'bg-brand-50 dark:bg-brand-500/10/40' : ''}`}
              style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!n.read ? 'bg-brand-100 text-brand-600' : 'bg-ocean-100 dark:bg-ocean-800 text-ocean-400 dark:text-ocean-500'}`}>
                <BellRing size={15} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ocean-900 dark:text-white">{n.title}</p>
                  {n.severity && n.severity !== 'INFO' && <StatusBadge status={n.severity} />}
                  {n.householdUnitNumber && (
                    <span className="text-xs text-ocean-400 dark:text-ocean-500">Unit {n.householdUnitNumber}</span>
                  )}
                </div>
                <p className="text-sm text-ocean-600 dark:text-ocean-300">{n.message}</p>
                <p className="mt-1 text-xs text-ocean-400 dark:text-ocean-500">{formatDate(n.createdAt)}</p>
              </div>
              {!n.read && (
                <button
                  type="button"
                  title="Mark as read"
                  className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border border-ocean-200 dark:border-ocean-700 px-2 py-1 text-xs font-medium text-ocean-500 dark:text-ocean-400 hover:bg-ocean-50 dark:hover:bg-ocean-800/60 disabled:opacity-50"
                  onClick={() => markOneRead.mutate(n.id)}
                  disabled={markOneRead.isPending}
                >
                  <Check size={12} />
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
