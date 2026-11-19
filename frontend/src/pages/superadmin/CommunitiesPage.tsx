import { useState } from 'react';
import { useActivateCommunity, useCommunities, useSuspendCommunity } from '@/hooks/useCommunityManagement';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { CommunityRow } from '@/utils/types';

export default function CommunitiesPage() {
  const { data: communities, isLoading } = useCommunities();
  const suspendMutation = useSuspendCommunity();
  const activateMutation = useActivateCommunity();
  const [pendingSuspend, setPendingSuspend] = useState<CommunityRow | null>(null);

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Communities</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">All communities onboarded to the platform.</p>
      </div>

      {isLoading && <LoadingSpinner label="Loading communities..." />}

      {!isLoading && communities?.length === 0 && (
        <EmptyState title="No communities yet" description="Approved registration requests will appear here." />
      )}

      {!isLoading && communities && communities.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="table-shell overflow-x-auto motion-safe:animate-slide-up hidden sm:block" style={{ animationDelay: '80ms' }}>
            <table className="w-full text-left text-sm">
              <thead className="bg-ocean-50 dark:bg-ocean-800/40 text-xs uppercase text-ocean-500 dark:text-ocean-400">
                <tr>
                  <th className="px-4 py-3">Community</th>
                  <th className="px-4 py-3">Apartment</th>
                  <th className="px-4 py-3">Administrator</th>
                  <th className="px-4 py-3">Households</th>
                  <th className="px-4 py-3">Residents</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-100 dark:divide-ocean-800">
                {communities.map((c, i) => (
                  <tr
                    key={c.id}
                    className="motion-safe:animate-fade-in hover:bg-ocean-50 dark:hover:bg-ocean-800/60"
                    style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                  >
                    <td className="px-4 py-3 font-medium text-ocean-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-ocean-600 dark:text-ocean-300">{c.apartmentName}</td>
                    <td className="px-4 py-3">
                      <p className="text-ocean-800 dark:text-ocean-100">{c.adminName}</p>
                      <p className="text-xs text-ocean-500 dark:text-ocean-400">{c.adminEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-ocean-600 dark:text-ocean-300">{c.totalHouseholds}</td>
                    <td className="px-4 py-3 text-ocean-600 dark:text-ocean-300">{c.totalResidents}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="px-4 py-3 text-right">
                      {c.active ? (
                        <button
                          type="button"
                          className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                          onClick={() => setPendingSuspend(c)}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          onClick={() => activateMutation.mutate(c.id)}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {communities.map((c, i) => (
              <div key={c.id} className="card motion-safe:animate-slide-up space-y-2 p-4" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ocean-900 dark:text-white">{c.name}</p>
                    <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{c.apartmentName}</p>
                  </div>
                  <StatusBadge status={c.active ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <p className="truncate text-xs text-ocean-600 dark:text-ocean-300">{c.adminName} · {c.adminEmail}</p>
                <div className="flex gap-4 text-xs text-ocean-600 dark:text-ocean-300">
                  <span>{c.totalHouseholds} households</span>
                  <span>{c.totalResidents} residents</span>
                </div>
                <div className="pt-1">
                  {c.active ? (
                    <button
                      type="button"
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                      onClick={() => setPendingSuspend(c)}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                      onClick={() => activateMutation.mutate(c.id)}
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pendingSuspend && (
        <ConfirmDialog
          title={`Suspend ${pendingSuspend.name}?`}
          description="Their administrator and residents will not be able to log in until this community is reactivated."
          confirmLabel="Suspend"
          danger
          loading={suspendMutation.isPending}
          onConfirm={() => { suspendMutation.mutate(pendingSuspend.id); setPendingSuspend(null); }}
          onCancel={() => setPendingSuspend(null)}
        />
      )}
    </div>
  );
}
