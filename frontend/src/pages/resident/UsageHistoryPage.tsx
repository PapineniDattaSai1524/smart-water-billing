import { UserX } from 'lucide-react';
import { useMyUsageHistory } from '@/hooks/useDashboardExtras';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/format';

export default function UsageHistoryPage() {
  const { data: history, isLoading, isError, error } = useMyUsageHistory();

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Usage History</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Your full water meter reading history.</p>
      </div>

      {isLoading && <LoadingSpinner label="Loading usage history..." />}

      {!isLoading && isError && (
        <EmptyState
          icon={UserX}
          title="Not linked to a household yet"
          description={getApiErrorMessage(
            error,
            'Your account isn\'t assigned to a household yet. Please contact your Building Owner administrator so they can add you.',
          )}
        />
      )}

      {!isLoading && !isError && history?.length === 0 && (
        <EmptyState title="No readings yet" description="Meter readings recorded by your administrator will appear here." />
      )}

      {!isLoading && !isError && history && history.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="card motion-safe:animate-slide-up hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-ocean-50 dark:bg-ocean-800/40 text-xs uppercase text-ocean-500 dark:text-ocean-400">
                <tr>
                  <th className="px-4 py-3">Reading Date</th>
                  <th className="px-4 py-3">Meter Reading (KL)</th>
                  <th className="px-4 py-3">Consumption (KL)</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-100 dark:divide-ocean-800">
                {history.map((log, i) => (
                  <tr
                    key={log.id}
                    className="motion-safe:animate-fade-in transition-colors hover:bg-ocean-50 dark:hover:bg-ocean-800/60"
                    style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                  >
                    <td className="px-4 py-3 text-ocean-800 dark:text-ocean-100">{formatDate(log.readingDate)}</td>
                    <td className="px-4 py-3 text-ocean-600 dark:text-ocean-300">{log.meterReadingKl}</td>
                    <td className="px-4 py-3 font-medium text-ocean-900 dark:text-white">{log.consumptionKl}</td>
                    <td className="px-4 py-3 text-ocean-600 dark:text-ocean-300">{log.source}</td>
                    <td className="px-4 py-3 text-ocean-500 dark:text-ocean-400">{log.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {history.map((log, i) => (
              <div
                key={log.id}
                className="card motion-safe:animate-fade-in space-y-2 p-4"
                style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ocean-900 dark:text-white">{formatDate(log.readingDate)}</p>
                  <p className="shrink-0 font-semibold text-ocean-900 dark:text-white">{log.consumptionKl} KL</p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ocean-500 dark:text-ocean-400">
                  <span>Reading: {log.meterReadingKl} KL</span>
                  <span>{log.source}</span>
                </div>
                {log.remarks && (
                  <p className="text-xs text-ocean-500 dark:text-ocean-400">{log.remarks}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
