import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import {
  useUnreadNotificationCount,
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/hooks/useDashboardExtras';
import StatusBadge from '@/components/common/StatusBadge';
import type { NotificationItem } from '@/utils/types';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unreadCount } = useUnreadNotificationCount();
  const { data } = useNotifications(0, 5);
  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();
  const navigate = useNavigate();

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) {
      markOneRead.mutate(n.id);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-full p-2 text-ocean-500 dark:text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell size={19} />
        {!!unreadCount && unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-ocean-200 dark:border-ocean-700 bg-white dark:bg-ocean-900 shadow-lg">
            <div className="flex items-center justify-between border-b border-ocean-100 dark:border-ocean-800 px-4 py-3">
              <p className="text-sm font-semibold text-ocean-900 dark:text-white">Notifications</p>
              <button type="button" className="text-xs font-medium text-brand-600 hover:underline" onClick={() => markAllRead.mutate()}>
                Mark all read
              </button>
            </div>
            <div className="max-h-80 divide-y divide-ocean-100 dark:divide-ocean-800 overflow-y-auto">
              {!data || data.content.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ocean-400 dark:text-ocean-500">No notifications yet</p>
              ) : (
                data.content.map((n) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`block w-full px-4 py-3 text-left ${!n.read ? 'bg-brand-50 dark:bg-brand-500/10/40' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ocean-900 dark:text-white">{n.title}</p>
                      {n.severity && n.severity !== 'INFO' && <StatusBadge status={n.severity} />}
                    </div>
                    <p className="text-xs text-ocean-500 dark:text-ocean-400">{n.message}</p>
                  </button>
                ))
              )}
            </div>
            <button
              type="button"
              className="block w-full border-t border-ocean-100 dark:border-ocean-800 px-4 py-2 text-center text-xs font-medium text-brand-600 hover:bg-ocean-50 dark:hover:bg-ocean-800/60"
              onClick={() => { setOpen(false); navigate('/notifications'); }}
            >
              View all
            </button>
          </div>
        </>
      )}
    </div>
  );
}
