import { useMemo, useState } from 'react';
import {
  Megaphone, HelpCircle, Send, Users, Search, RefreshCw, Eye, X, Loader2,
} from 'lucide-react';
import {
  useOwnerBroadcastRecipientCount, useSendOwnerBroadcast, useOwnerBroadcastHistory,
} from '@/hooks/useDashboardExtras';
import { notificationService } from '@/services/notificationService';
import ErrorBanner from '@/components/common/ErrorBanner';
import SuccessBanner from '@/components/common/SuccessBanner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import Pagination from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/Skeleton';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/format';
import type { OwnerNotificationBatch, OwnerNotificationStatus } from '@/utils/types';

const TITLE_MAX = 100;
const MESSAGE_MAX = 1000;
const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<'ALL' | OwnerNotificationStatus> = ['ALL', 'SENT', 'PENDING', 'FAILED'];

export default function OwnerNotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [viewing, setViewing] = useState<OwnerNotificationBatch | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OwnerNotificationStatus>('ALL');
  const [page, setPage] = useState(1);

  const { data: recipientCount, isLoading: countLoading } = useOwnerBroadcastRecipientCount();
  const sendMutation = useSendOwnerBroadcast();
  const {
    data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory, isFetching: historyFetching,
  } = useOwnerBroadcastHistory({
    search: search || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page: page - 1,
    size: PAGE_SIZE,
  });

  const titleError = touched && !title.trim() ? 'Notification title is required.'
    : title.length > TITLE_MAX ? `Title cannot exceed ${TITLE_MAX} characters.` : null;
  const messageError = touched && !message.trim() ? 'Message is required.'
    : message.length > MESSAGE_MAX ? `Message cannot exceed ${MESSAGE_MAX} characters.` : null;
  const isValid = title.trim().length > 0 && title.length <= TITLE_MAX
    && message.trim().length > 0 && message.length <= MESSAGE_MAX;

  const handleSend = async () => {
    setTouched(true);
    setSendError(null);
    setSendResult(null);
    if (!isValid) return;
    try {
      const response = await sendMutation.mutateAsync({ title: title.trim(), message: message.trim() });
      setSendResult(`Notification sent successfully to ${response.data.recipientCount} resident(s).`);
      setTitle('');
      setMessage('');
      setTouched(false);
      setPage(1);
    } catch (err) {
      setSendError(getApiErrorMessage(err, 'Unable to send notification. Please try again.'));
    }
  };

  const openDetails = async (batch: OwnerNotificationBatch) => {
    setViewing(batch);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await notificationService.ownerBroadcastDetail(batch.batchId);
      setViewing(response.data);
    } catch (err) {
      setDetailError(getApiErrorMessage(err, 'Unable to load notification details.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const rows = useMemo(() => history?.content ?? [], [history]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 motion-safe:animate-slide-up">
        <div>
          <h1 className="flex items-center gap-2 text-h1">
            <Megaphone size={22} className="text-aqua-500" /> Notifications
          </h1>
          <p className="text-body mt-1">Send important updates and announcements to your residents.</p>
        </div>
        <button type="button" className="btn-secondary btn-sm inline-flex items-center gap-1.5" onClick={() => setShowHelp(true)}>
          <HelpCircle size={14} /> How it works?
        </button>
      </div>

      <div className="glass-panel motion-safe:animate-slide-up space-y-4 p-6" style={{ animationDelay: '40ms' }}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-ocean-700 dark:text-ocean-300" htmlFor="notif-title">
              Title <span className="text-status-critical">*</span>
            </label>
            <input
              id="notif-title"
              className="input"
              value={title}
              maxLength={TITLE_MAX + 20}
              placeholder="Enter notification title"
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={Boolean(titleError)}
            />
            <div className="mt-1 flex items-center justify-between">
              {titleError ? <p className="field-error !mt-0">{titleError}</p> : <span />}
              <span className={`text-xs ${title.length > TITLE_MAX ? 'text-status-critical' : 'text-ocean-400 dark:text-ocean-500'}`}>
                {title.length}/{TITLE_MAX}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ocean-700 dark:text-ocean-300" htmlFor="notif-audience">
              Audience
            </label>
            <div
              id="notif-audience"
              className="input flex items-center gap-2 !bg-ocean-50 text-ocean-600 dark:!bg-ocean-800/60 dark:text-ocean-300"
              aria-readonly="true"
            >
              <Users size={15} className="shrink-0 text-aqua-500" />
              Residents Only
            </div>
            <p className="mt-1 text-xs text-ocean-400 dark:text-ocean-500">
              {countLoading ? 'Loading recipients...' : `Recipients: ${recipientCount ?? 0} resident(s)`}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-ocean-700 dark:text-ocean-300" htmlFor="notif-message">
            Message <span className="text-status-critical">*</span>
          </label>
          <textarea
            id="notif-message"
            className="input min-h-[110px]"
            value={message}
            maxLength={MESSAGE_MAX + 100}
            placeholder="Enter your message"
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={Boolean(messageError)}
          />
          <div className="mt-1 flex items-center justify-between">
            {messageError ? <p className="field-error !mt-0">{messageError}</p> : <span />}
            <span className={`text-xs ${message.length > MESSAGE_MAX ? 'text-status-critical' : 'text-ocean-400 dark:text-ocean-500'}`}>
              {message.length}/{MESSAGE_MAX}
            </span>
          </div>
        </div>

        <ErrorBanner message={sendError} />
        <SuccessBanner message={sendResult} />

        <button
          type="button"
          className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleSend}
          disabled={!isValid || sendMutation.isPending}
        >
          {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sendMutation.isPending ? 'Sending notification...' : 'Send Notification'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ocean-800 dark:text-ocean-100">Notification History</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
              <input
                className="input max-w-[220px] pl-8"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                aria-label="Search notifications"
              />
            </div>
            <select
              className="input max-w-[150px]"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as 'ALL' | OwnerNotificationStatus); setPage(1); }}
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => refetchHistory()}
              disabled={historyFetching}
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={historyFetching ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {historyLoading && (
          <div className="table-shell">
            <TableSkeleton rows={PAGE_SIZE} cols={6} />
          </div>
        )}

        {historyError && !historyLoading && (
          <EmptyState
            title="Unable to load notification history"
            description="Something went wrong while retrieving your sent notifications."
            icon={Megaphone}
            action={{ label: 'Retry', onClick: () => refetchHistory() }}
          />
        )}

        {!historyLoading && !historyError && rows.length === 0 && (
          <EmptyState
            title="No notifications sent yet"
            description="Notifications you send to your residents will show up here."
            icon={Megaphone}
          />
        )}

        {!historyLoading && !historyError && rows.length > 0 && (
          <>
            <div className="table-shell motion-safe:animate-slide-up hidden lg:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Message</th>
                    <th>Audience</th>
                    <th>Sent On</th>
                    <th>Sent By</th>
                    <th>Status</th>
                    <th className="!text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((n) => (
                    <tr key={n.batchId}>
                      <td className="max-w-[200px] truncate font-medium text-ocean-900 dark:text-white">{n.title}</td>
                      <td className="max-w-[280px] truncate">{n.message}</td>
                      <td>{n.audience}</td>
                      <td>{formatDate(n.sentAt)}</td>
                      <td>{n.sentByName ?? '—'}</td>
                      <td><StatusBadge status={n.status} /></td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800 hover:text-aqua-600"
                          onClick={() => openDetails(n)}
                          aria-label={`View details for ${n.title}`}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {rows.map((n) => (
                <div key={n.batchId} className="card motion-safe:animate-slide-up space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-ocean-900 dark:text-white">{n.title}</p>
                    <StatusBadge status={n.status} />
                  </div>
                  <p className="line-clamp-2 text-sm text-ocean-600 dark:text-ocean-300">{n.message}</p>
                  <p className="text-xs text-ocean-400 dark:text-ocean-500">{n.audience} &middot; {formatDate(n.sentAt)}</p>
                  <button type="button" className="btn-secondary btn-sm w-full" onClick={() => openDetails(n)}>
                    <Eye size={14} className="mr-1.5" /> View Details
                  </button>
                </div>
              ))}
            </div>

            {history && (
              <Pagination page={page} pageSize={PAGE_SIZE} total={history.totalElements} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4 motion-safe:animate-fade-in"
          onClick={() => setShowHelp(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="card motion-safe:animate-slide-up w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-h3">How it works</h2>
              <button type="button" onClick={() => setShowHelp(false)} className="rounded p-1 text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-ocean-600 dark:text-ocean-300">
              <li>Notifications you send here only reach residents in the buildings you manage.</li>
              <li>You can't select a different audience — it's always Residents Only.</li>
              <li>Each resident sees your message in their own Notifications page.</li>
              <li>Every notification you send is logged below in Notification History.</li>
            </ul>
            <button type="button" className="btn-primary btn-sm mt-4 w-full" onClick={() => setShowHelp(false)}>Got it</button>
          </div>
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ocean-900/40 p-4 motion-safe:animate-fade-in"
          onClick={() => setViewing(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="card motion-safe:animate-slide-up flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ocean-100 px-5 py-4 dark:border-ocean-800">
              <h2 className="text-h3">Notification Details</h2>
              <button type="button" onClick={() => setViewing(null)} className="rounded p-1 text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {detailLoading && <p className="text-sm text-ocean-500 dark:text-ocean-400">Loading...</p>}
              <ErrorBanner message={detailError} />
              {!detailLoading && !detailError && (
                <>
                  <div>
                    <p className="text-caption">Title</p>
                    <p className="font-medium text-ocean-900 dark:text-white">{viewing.title}</p>
                  </div>
                  <div>
                    <p className="text-caption">Message</p>
                    <p className="whitespace-pre-wrap text-sm text-ocean-700 dark:text-ocean-200">{viewing.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-caption">Audience</p>
                      <p className="text-sm text-ocean-700 dark:text-ocean-200">{viewing.audience}</p>
                    </div>
                    <div>
                      <p className="text-caption">Status</p>
                      <StatusBadge status={viewing.status} />
                    </div>
                    <div>
                      <p className="text-caption">Sent date/time</p>
                      <p className="text-sm text-ocean-700 dark:text-ocean-200">{formatDate(viewing.sentAt, 'long')}</p>
                    </div>
                    <div>
                      <p className="text-caption">Sender</p>
                      <p className="text-sm text-ocean-700 dark:text-ocean-200">{viewing.sentByName ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-caption">Recipient count</p>
                      <p className="text-sm text-ocean-700 dark:text-ocean-200">{viewing.recipientCount} resident(s)</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end border-t border-ocean-100 px-5 py-4 dark:border-ocean-800">
              <button type="button" onClick={() => setViewing(null)} className="btn-secondary btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
