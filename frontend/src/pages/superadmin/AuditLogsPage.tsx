import { useMemo, useState } from 'react';
import { ClipboardList, Search, AlertTriangle } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useCommunityManagement';
import EmptyState from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { formatDate } from '@/utils/format';

export default function AuditLogsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useAuditLogs(page, 20);

  // Search filters the current, already-fetched page of real audit-log entries -- the
  // backend has no search/date-filter query params, so this doesn't fabricate a
  // server-side filter it can't actually satisfy; it narrows what's on screen instead.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !data) return data?.content ?? [];
    return data.content.filter((log) =>
      log.action.toLowerCase().includes(q)
      || (log.actorName ?? '').toLowerCase().includes(q)
      || (log.entityType ?? '').toLowerCase().includes(q)
      || (log.details ?? '').toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="flex items-center gap-2 text-h1">
          <ClipboardList size={20} /> Audit Logs
        </h1>
        <p className="text-body">Recent administrative actions across the platform.</p>
      </div>

      {!isLoading && !isError && data && data.content.length > 0 && (
        <div className="relative sm:w-80">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search this page by action, user, or entity"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search audit logs"
          />
        </div>
      )}

      {isLoading && (
        <div className="table-shell">
          <TableSkeleton rows={8} cols={4} />
        </div>
      )}

      {!isLoading && isError && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load audit logs"
          description="Something went wrong while retrieving audit logs."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && data?.content.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No activity yet"
          description="Administrative actions will be recorded here."
        />
      )}

      {!isLoading && !isError && data && data.content.length > 0 && (
        <>
          {filtered.length === 0 ? (
            <EmptyState title="No matching entries" description="Try a different search term." />
          ) : (
            <div className="table-shell motion-safe:animate-slide-up">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-ocean-500 dark:text-ocean-400">{formatDate(log.createdAt)}</td>
                      <td className="font-medium text-ocean-900 dark:text-white">{log.actorName ?? 'System'}</td>
                      <td>
                        <span className="badge-info">{log.action.replace(/_/g, ' ')}</span>
                        {log.entityType && (
                          <span className="ml-2 text-xs text-ocean-400 dark:text-ocean-500">
                            {log.entityType}#{log.entityId}
                          </span>
                        )}
                      </td>
                      <td className="max-w-md">{log.details ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-ocean-600 dark:text-ocean-300">
            <span>Page {data.pageNumber + 1} of {Math.max(data.totalPages, 1)}</span>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button type="button" className="btn-secondary btn-sm" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
