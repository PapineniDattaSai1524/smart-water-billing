import { useMemo, useState } from 'react';
import {
  Search, Eye, Users, UserCog, UserCheck, UserX, X,
} from 'lucide-react';
import { usePlatformUsers, useSetUserEnabled } from '@/hooks/usePlatform';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import RowActionsMenu from '@/components/common/RowActionsMenu';
import InitialsAvatar from '@/components/common/InitialsAvatar';
import KpiCard from '@/components/common/KpiCard';
import { KpiCardSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import PlatformUserDetailsDrawer from '@/components/platform/PlatformUserDetailsDrawer';
import ChangeRoleModal from '@/components/platform/ChangeRoleModal';
import { RoleBadge, StatusBadgeCompact, StatusToggleButton } from '@/components/platform/platformUserDisplay';
import { getApiErrorMessage } from '@/utils/apiError';
import type { PlatformUser, Role } from '@/utils/types';

const PAGE_SIZE = 10;

export default function PlatformUsersTable({
  roleFilter,
  emptyLabel = 'No users found',
}: {
  roleFilter?: Role;
  emptyLabel?: string;
}) {
  const { data: users, isLoading, isError, refetch } = usePlatformUsers(roleFilter);
  const setEnabled = useSetUserEnabled();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleQuickFilter, setRoleQuickFilter] = useState<'ALL' | Role>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');
  const [page, setPage] = useState(1);
  const [pendingDisable, setPendingDisable] = useState<PlatformUser | null>(null);
  const [pendingEnable, setPendingEnable] = useState<PlatformUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<PlatformUser | null>(null);
  // Role management is a separate action from Enable/Disable (account status) -- its own
  // modal, its own menu entry, never combined with the status toggle.
  const [changingRoleFor, setChangingRoleFor] = useState<PlatformUser | null>(null);

  // The Super Admin account is a fixed, single, platform-level account (never created or
  // managed through this screen) -- it's filtered out of every user-management table rather
  // than just being read-only within one, so it never shows up as an "unmanageable" row that
  // breaks the table's alignment or confuses admins who can't act on it anyway. Its actual
  // login/authorization is untouched -- this only affects what this table renders.
  const manageableUsers = useMemo(() => (users ?? []).filter((u) => u.role !== 'SUPER_ADMIN'), [users]);

  const totalCount = manageableUsers.length;
  const activeCount = useMemo(() => manageableUsers.filter((u) => u.enabled).length, [manageableUsers]);
  const disabledCount = totalCount - activeCount;
  const ownerCount = useMemo(() => manageableUsers.filter((u) => u.role === 'ADMIN').length, [manageableUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return manageableUsers.filter((u) => {
      const matchesSearch = !q
        || u.fullName.toLowerCase().includes(q)
        || u.username.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ENABLED' ? u.enabled : !u.enabled);
      const matchesRole = roleQuickFilter === 'ALL' || u.role === roleQuickFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [manageableUsers, search, statusFilter, roleQuickFilter]);

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'ALL' || roleQuickFilter !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setRoleQuickFilter('ALL');
    setPage(1);
  };

  // Both directions are account-access-affecting enough to confirm explicitly -- disabling
  // locks the user out immediately, enabling restores access they didn't have a moment ago --
  // so neither happens straight off a single click on the row.
  const toggleEnabled = (u: PlatformUser) => {
    setActionError(null);
    if (u.enabled) setPendingDisable(u);
    else setPendingEnable(u);
  };

  const confirmDisable = async () => {
    if (!pendingDisable) return;
    setBusyId(pendingDisable.id);
    try {
      await setEnabled.mutateAsync({ id: pendingDisable.id, enabled: false });
      setPendingDisable(null);
    } catch (err) {
      // Leave the dialog open and the row's displayed status untouched -- surface the error
      // via the same inline banner pattern the rest of the app uses instead of a fake toast.
      setActionError(getApiErrorMessage(err, 'Unable to update account status. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmEnable = async () => {
    if (!pendingEnable) return;
    setBusyId(pendingEnable.id);
    try {
      await setEnabled.mutateAsync({ id: pendingEnable.id, enabled: true });
      setPendingEnable(null);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Unable to update account status. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
        <div className="table-shell">
          <TableSkeleton rows={6} cols={5} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <ErrorBanner message="Unable to load users. Something went wrong while retrieving user information." />
        <button type="button" className="btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (manageableUsers.length === 0) {
    return <EmptyState icon={Users} title={emptyLabel} description="Users will appear here once they register or are created." />;
  }

  return (
    <div className="space-y-5">
      {/* KPI strip -- the role-breakdown cards only show for the full-population view (no
          fixed roleFilter prop), since a role split of an already-role-filtered list (e.g.
          Building Owner Management) would just repeat the same total twice. */}
      <div className="grid grid-cols-2 gap-3 motion-safe:animate-slide-up lg:grid-cols-4">
        <KpiCard label="Total Users" value={totalCount} icon={Users} />
        <KpiCard label="Enabled" value={activeCount} icon={UserCheck} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" />
        <KpiCard label="Disabled" value={disabledCount} icon={UserX} color="bg-red-50 text-status-critical dark:bg-red-500/10 dark:text-red-300" />
        {!roleFilter && (
          <KpiCard label="Building Owners" value={ownerCount} icon={UserCog} color="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300" />
        )}
      </div>

      {/* Toolbar */}
      <div className="motion-safe:animate-slide-up flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between" style={{ animationDelay: '40ms' }}>
        <div className="relative sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by name, username or email"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search users"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!roleFilter && (
            <select
              className="input w-auto py-1.5"
              value={roleQuickFilter}
              onChange={(e) => { setRoleQuickFilter(e.target.value as 'ALL' | Role); setPage(1); }}
              aria-label="Filter by role"
            >
              <option value="ALL">All roles</option>
              <option value="ADMIN">Building Owner</option>
              <option value="RESIDENT">Resident</option>
            </select>
          )}
          <div className="flex gap-1 rounded-lg border border-ocean-200 p-1 dark:border-ocean-700" role="group" aria-label="Filter by status">
            {(['ALL', 'ENABLED', 'DISABLED'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatusFilter(s); setPage(1); }}
                aria-pressed={statusFilter === s}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-aqua-600 text-white'
                    : 'text-ocean-500 hover:bg-ocean-100 dark:text-ocean-400 dark:hover:bg-ocean-800'
                }`}
              >
                {s === 'ALL' ? 'All' : s === 'ENABLED' ? 'Enabled' : 'Disabled'}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button type="button" className="btn-ghost btn-sm" onClick={clearFilters}>
              <X size={13} className="mr-1" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try changing your search or filters."
          action={hasActiveFilters ? { label: 'Clear Filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-shell motion-safe:animate-slide-up hidden sm:block" style={{ animationDelay: '80ms' }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-[24%]">Name</th>
                  <th className="w-[26%]">Account</th>
                  <th className="w-[16%]">Role</th>
                  <th className="w-[14%]">Status</th>
                  <th className="w-[180px] min-w-[180px] max-w-[180px] pr-5">
                    <div className="flex items-center justify-end">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={u.fullName} size="md" />
                        <span className="truncate font-semibold text-[15px] text-ocean-900 dark:text-white">{u.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ocean-800 dark:text-ocean-100">{u.username}</p>
                        <p className="truncate text-xs text-ocean-500 dark:text-ocean-400" title={u.email}>{u.email}</p>
                      </div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td><StatusBadgeCompact enabled={u.enabled} /></td>
                    <td className="w-[180px] min-w-[180px] max-w-[180px] pr-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <StatusToggleButton
                          enabled={u.enabled}
                          busy={busyId === u.id}
                          name={u.fullName}
                          onClick={() => toggleEnabled(u)}
                        />
                        <RowActionsMenu
                          label={`More actions for ${u.fullName}`}
                          size="md"
                          actions={[
                            { label: 'View Details', icon: <Eye size={14} />, onClick: () => setViewing(u) },
                            { label: 'Change Role', icon: <UserCog size={14} />, onClick: () => setChangingRoleFor(u) },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {pageItems.map((u, i) => (
              <div key={u.id} className="card motion-safe:animate-fade-in space-y-3 p-4" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <InitialsAvatar name={u.fullName} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[15px] text-ocean-900 dark:text-white">{u.fullName}</p>
                      <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{u.username}</p>
                      <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{u.email}</p>
                    </div>
                  </div>
                  <RowActionsMenu
                    label={`More actions for ${u.fullName}`}
                    size="md"
                    actions={[
                      { label: 'View Details', icon: <Eye size={14} />, onClick: () => setViewing(u) },
                      { label: 'Change Role', icon: <UserCog size={14} />, onClick: () => setChangingRoleFor(u) },
                    ]}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <RoleBadge role={u.role} />
                    <StatusBadgeCompact enabled={u.enabled} />
                  </div>
                  <StatusToggleButton
                    enabled={u.enabled}
                    busy={busyId === u.id}
                    name={u.fullName}
                    onClick={() => toggleEnabled(u)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      {pendingDisable && (
        <ConfirmDialog
          title="Disable account?"
          description={`Are you sure you want to disable ${pendingDisable.fullName}'s account? They will no longer be able to access the application while disabled.`}
          confirmLabel="Disable"
          loadingLabel="Disabling..."
          danger
          loading={busyId === pendingDisable.id}
          onConfirm={confirmDisable}
          onCancel={() => { setPendingDisable(null); setActionError(null); }}
        >
          <div className="flex items-center gap-2">
            <RoleBadge role={pendingDisable.role} />
            <StatusBadgeCompact enabled={pendingDisable.enabled} />
          </div>
          {actionError && <div className="mt-3"><ErrorBanner message={actionError} /></div>}
        </ConfirmDialog>
      )}

      {pendingEnable && (
        <ConfirmDialog
          title="Enable account?"
          description={`Are you sure you want to enable ${pendingEnable.fullName}'s account?`}
          confirmLabel="Enable"
          loadingLabel="Enabling..."
          loading={busyId === pendingEnable.id}
          onConfirm={confirmEnable}
          onCancel={() => { setPendingEnable(null); setActionError(null); }}
        >
          <div className="flex items-center gap-2">
            <RoleBadge role={pendingEnable.role} />
            <StatusBadgeCompact enabled={pendingEnable.enabled} />
          </div>
          {actionError && <div className="mt-3"><ErrorBanner message={actionError} /></div>}
        </ConfirmDialog>
      )}

      {viewing && (
        <PlatformUserDetailsDrawer
          user={viewing}
          onClose={() => setViewing(null)}
          footerAction={{
            label: viewing.enabled ? 'Disable User' : 'Enable User',
            danger: viewing.enabled,
            loading: busyId === viewing.id,
            onClick: () => { const u = viewing; setViewing(null); toggleEnabled(u); },
          }}
        />
      )}

      {changingRoleFor && (
        <ChangeRoleModal user={changingRoleFor} onClose={() => setChangingRoleFor(null)} />
      )}
    </div>
  );
}
