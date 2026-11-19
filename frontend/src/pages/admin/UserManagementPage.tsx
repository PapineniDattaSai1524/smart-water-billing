import { useState } from 'react';
import { AlertTriangle, KeyRound, Pencil, Plus, Power, Trash2, User, UserCheck, UserX, Users } from 'lucide-react';
import { useResidentList, useSetResidentEnabled, useDeleteResident } from '@/hooks/useResidentManagement';
import { useApartments } from '@/hooks/useApartments';
import type { Resident } from '@/utils/types';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import SuccessBanner from '@/components/common/SuccessBanner';
import StatusBadge from '@/components/common/StatusBadge';
import KpiCard from '@/components/common/KpiCard';
import ResidentFormModal from '@/components/resident/ResidentFormModal';
import ResetPasswordModal from '@/components/resident/ResetPasswordModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/Skeleton';
import { formatDate } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/apiError';

const PAGE_SIZE = 10;

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [apartmentId, setApartmentId] = useState<number | undefined>(undefined);
  const [enabled, setEnabled] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC');

  const { data: apartments } = useApartments();
  const { data, isLoading, isError, error: listError, refetch } = useResidentList({
    search: search || undefined, apartmentId, enabled, page, size: PAGE_SIZE, sortBy, sortDir,
  });
  // Lightweight real-count queries (size:1, only the pagination total is used) so the
  // summary strip reflects actual enabled/disabled counts across ALL residents, not just
  // the current filtered page — same list endpoint, no fabricated numbers.
  const { data: allCount } = useResidentList({ page: 0, size: 1 });
  const { data: enabledCount } = useResidentList({ enabled: true, page: 0, size: 1 });
  const { data: disabledCount } = useResidentList({ enabled: false, page: 0, size: 1 });
  const setEnabledMutation = useSetResidentEnabled();
  const deleteMutation = useDeleteResident();

  const [formResident, setFormResident] = useState<Resident | null | undefined>(undefined);
  const [resetPasswordFor, setResetPasswordFor] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Resident | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortDir('ASC');
    }
    setPage(0);
  };

  const handleToggleEnabled = async (resident: Resident) => {
    setActionError(null);
    setBusyId(resident.id);
    try {
      await setEnabledMutation.mutateAsync({ id: resident.id, enabled: !resident.enabled });
      setActionNotice(`${resident.fullName} ${resident.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      setActionNotice(`${pendingDelete.fullName} removed`);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  };

  const origin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/api\/v1\/?$/, '');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 motion-safe:animate-slide-up">
        <div>
          <h1 className="text-h1">User Management</h1>
          <p className="text-body mt-1">Add, edit, and manage residents across your apartments.</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={() => setFormResident(null)}>
          <Plus size={16} /> Add Resident
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          <KpiCard key="total" label="Total Residents" value={String(allCount?.totalElements ?? 0)} icon={Users} color="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300" />,
          <KpiCard key="active" label="Active" value={String(enabledCount?.totalElements ?? 0)} icon={UserCheck} color="bg-status-healthy/10 text-status-healthy" />,
          <KpiCard key="disabled" label="Disabled" value={String(disabledCount?.totalElements ?? 0)} icon={UserX} color="bg-status-critical/10 text-status-critical" />,
        ].map((card, i) => (
          <div key={card.key} className="motion-safe:animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            {card}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name, email, resident ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          aria-label="Search residents"
        />
        <select
          className="input max-w-xs"
          value={apartmentId ?? ''}
          onChange={(e) => { setApartmentId(e.target.value ? Number(e.target.value) : undefined); setPage(0); }}
          aria-label="Filter by apartment"
        >
          <option value="">All apartments</option>
          {apartments?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select
          className="input max-w-xs"
          value={enabled === undefined ? '' : String(enabled)}
          onChange={(e) => { setEnabled(e.target.value === '' ? undefined : e.target.value === 'true'); setPage(0); }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </div>

      <ErrorBanner message={actionError} />
      <SuccessBanner message={actionNotice} />

      {isLoading && (
        <div className="table-shell">
          <TableSkeleton rows={PAGE_SIZE} cols={10} />
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load residents"
          description={getApiErrorMessage(
            listError,
            'Something went wrong while retrieving resident information.',
          )}
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && data?.content.length === 0 && (
        <EmptyState title="No residents found" description="Try adjusting your search or filters, or add a new resident." icon={Users} />
      )}

      {!isLoading && !isError && data && data.content.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="table-shell motion-safe:animate-slide-up hidden lg:block">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Resident ID</th>
                  <th className="cursor-pointer" onClick={() => toggleSort('fullName')}>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Apartment</th>
                  <th>House No.</th>
                  <th>Status</th>
                  <th className="cursor-pointer" onClick={() => toggleSort('createdAt')}>Created</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((resident) => (
                  <tr key={resident.id}>
                    <td>
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-ocean-100 dark:bg-ocean-800 text-ocean-400 dark:text-ocean-500">
                        {resident.profilePhotoUrl ? (
                          <img src={`${origin}${resident.profilePhotoUrl}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-xs">{resident.residentCode}</td>
                    <td className="font-medium text-ocean-900 dark:text-white">{resident.fullName}</td>
                    <td>{resident.email}</td>
                    <td>{resident.phoneNumber}</td>
                    <td>{resident.apartmentName}</td>
                    <td>{resident.unitNumber}</td>
                    <td><StatusBadge status={resident.enabled ? 'ACTIVE' : 'DISABLED'} /></td>
                    <td>{formatDate(resident.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800 hover:text-brand-600 dark:hover:text-brand-400" onClick={() => setFormResident(resident)} aria-label={`Edit ${resident.fullName}`}><Pencil size={15} /></button>
                        <button type="button" className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800 hover:text-amber-600" onClick={() => setResetPasswordFor(resident.id)} aria-label={`Reset password for ${resident.fullName}`}><KeyRound size={15} /></button>
                        <button
                          type="button"
                          className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800 hover:text-emerald-600 disabled:opacity-50"
                          aria-label={resident.enabled ? `Disable ${resident.fullName}` : `Enable ${resident.fullName}`}
                          disabled={busyId === resident.id}
                          onClick={() => handleToggleEnabled(resident)}
                        >
                          <Power size={15} />
                        </button>
                        <button
                          type="button"
                          className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                          aria-label={`Delete ${resident.fullName}`}
                          onClick={() => setPendingDelete(resident)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="space-y-3 lg:hidden">
            {data.content.map((resident, i) => (
              <div key={resident.id} className="card motion-safe:animate-slide-up space-y-3 p-4" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ocean-100 dark:bg-ocean-800 text-ocean-400 dark:text-ocean-500">
                    {resident.profilePhotoUrl ? (
                      <img src={`${origin}${resident.profilePhotoUrl}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-ocean-900 dark:text-white">{resident.fullName}</p>
                      <StatusBadge status={resident.enabled ? 'ACTIVE' : 'DISABLED'} />
                    </div>
                    <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{resident.email}</p>
                    <p className="text-xs text-ocean-500 dark:text-ocean-400">{resident.apartmentName} &middot; Unit {resident.unitNumber}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary btn-sm flex-1" onClick={() => setFormResident(resident)}>
                    <Pencil size={14} className="mr-1.5" /> Edit
                  </button>
                  <button type="button" className="btn-secondary btn-sm flex-1" onClick={() => setResetPasswordFor(resident.id)}>
                    <KeyRound size={14} className="mr-1.5" /> Reset
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm flex-1 disabled:opacity-50"
                    disabled={busyId === resident.id}
                    onClick={() => handleToggleEnabled(resident)}
                  >
                    <Power size={14} className="mr-1.5" /> {resident.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" className="btn-secondary btn-sm text-red-600 dark:text-red-400" onClick={() => setPendingDelete(resident)} aria-label={`Delete ${resident.fullName}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-ocean-600 dark:text-ocean-300">
            <span>
              Page {data.pageNumber + 1} of {Math.max(data.totalPages, 1)} &middot; {data.totalElements} residents
            </span>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button type="button" className="btn-secondary" disabled={data.last} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </>
      )}

      {formResident !== undefined && (
        <ResidentFormModal resident={formResident} onClose={() => setFormResident(undefined)} />
      )}
      {resetPasswordFor !== null && (
        <ResetPasswordModal residentId={resetPasswordFor} onClose={() => setResetPasswordFor(null)} />
      )}
      {pendingDelete && (
        <ConfirmDialog
          title="Delete this resident?"
          description={`${pendingDelete.fullName} will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
