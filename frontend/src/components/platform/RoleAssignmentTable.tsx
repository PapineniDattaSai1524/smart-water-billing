import { useMemo, useState } from 'react';
import { Search, Eye, UserCog, Home, ShieldCheck, X } from 'lucide-react';
import { usePlatformUsers, useChangeUserRole } from '@/hooks/usePlatform';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import InitialsAvatar from '@/components/common/InitialsAvatar';
import RowActionsMenu from '@/components/common/RowActionsMenu';
import { KpiCardSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import PlatformUserDetailsDrawer from '@/components/platform/PlatformUserDetailsDrawer';
import { ROLE_LABEL } from '@/components/platform/platformUserDisplay';
import { formatDate } from '@/utils/format';
import type { PlatformUser, Role } from '@/utils/types';

// SUPER_ADMIN is intentionally excluded: the platform allows exactly one Super Admin
// account, created only at application startup. It can never be granted through Role
// Management (the backend rejects it too), so it isn't offered as a selectable target role.
const ASSIGNABLE_ROLES: Role[] = ['ADMIN', 'RESIDENT'];

const ROLE_CARD_META: Record<Role, { icon: typeof UserCog; description: string; color: string }> = {
  SUPER_ADMIN: { icon: ShieldCheck, description: 'Full platform oversight. Fixed at setup, not assignable here.', color: 'bg-ocean-100 text-ocean-600 dark:bg-ocean-800 dark:text-ocean-300' },
  ADMIN: { icon: UserCog, description: 'Manages a community\u2019s buildings, households, billing and residents.', color: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300' },
  RESIDENT: { icon: Home, description: 'Views usage, bills and payments for their own household.', color: 'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300' },
};

const PAGE_SIZE = 10;

/** Role Management is about who holds which access level, not about identity/status -- so
 * this table deliberately drops the Enable/Disable column that PlatformUsersTable centers on
 * (that stays User Management's job) and makes the Role column itself the editable, primary
 * field instead of a read-only badge. Role summary cards up top ground the table in the
 * platform's real, fixed role set rather than presenting it as just another user list. */
export default function RoleAssignmentTable({ emptyLabel = 'No users found' }: { emptyLabel?: string }) {
  const { data: users, isLoading, isError, refetch } = usePlatformUsers();
  const changeRole = useChangeUserRole();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [page, setPage] = useState(1);
  const [pendingChange, setPendingChange] = useState<{ user: PlatformUser; role: Role } | null>(null);
  const [viewing, setViewing] = useState<PlatformUser | null>(null);

  const manageableUsers = useMemo(() => (users ?? []).filter((u) => u.role !== 'SUPER_ADMIN'), [users]);
  const ownerCount = useMemo(() => manageableUsers.filter((u) => u.role === 'ADMIN').length, [manageableUsers]);
  const residentCount = useMemo(() => manageableUsers.filter((u) => u.role === 'RESIDENT').length, [manageableUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return manageableUsers.filter((u) => {
      const matchesSearch = !q
        || u.fullName.toLowerCase().includes(q)
        || u.username.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [manageableUsers, search, roleFilter]);

  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const hasActiveFilters = search.trim() !== '' || roleFilter !== 'ALL';
  const clearFilters = () => { setSearch(''); setRoleFilter('ALL'); setPage(1); };

  const requestRoleChange = (u: PlatformUser, role: Role) => {
    if (role === u.role) return;
    setPendingChange({ user: u, role });
  };

  const confirmRoleChange = async () => {
    if (!pendingChange) return;
    setBusyId(pendingChange.user.id);
    try {
      await changeRole.mutateAsync({ id: pendingChange.user.id, role: pendingChange.role });
    } finally {
      setBusyId(null);
      setPendingChange(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
        <div className="table-shell">
          <TableSkeleton rows={6} cols={4} />
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
    return <EmptyState icon={ShieldCheck} title={emptyLabel} description="Users will appear here once they register or are created." />;
  }

  return (
    <div className="space-y-5">
      {/* Role summary -- grounds the page in the platform's real, fixed role set (including a
          note that Super Admin isn't managed here) instead of jumping straight to a table. */}
      <div className="grid grid-cols-1 gap-3 motion-safe:animate-slide-up sm:grid-cols-3">
        {(['ADMIN', 'RESIDENT', 'SUPER_ADMIN'] as Role[]).map((role) => {
          const meta = ROLE_CARD_META[role];
          const Icon = meta.icon;
          const count = role === 'ADMIN' ? ownerCount : role === 'RESIDENT' ? residentCount : 1;
          return (
            <div key={role} className="card flex items-start gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-h3">{ROLE_LABEL[role]}</p>
                <p className="text-xs font-medium text-ocean-500 dark:text-ocean-400">
                  {role === 'SUPER_ADMIN' ? 'Fixed \u2014 1 account' : `${count} ${count === 1 ? 'user' : 'users'}`}
                </p>
                <p className="mt-1 text-xs text-ocean-500 dark:text-ocean-400">{meta.description}</p>
              </div>
            </div>
          );
        })}
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
          <div className="flex gap-1 rounded-lg border border-ocean-200 p-1 dark:border-ocean-700" role="group" aria-label="Filter by current role">
            {(['ALL', 'ADMIN', 'RESIDENT'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRoleFilter(r); setPage(1); }}
                aria-pressed={roleFilter === r}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-aqua-600 text-white'
                    : 'text-ocean-500 hover:bg-ocean-100 dark:text-ocean-400 dark:hover:bg-ocean-800'
                }`}
              >
                {r === 'ALL' ? 'All' : ROLE_LABEL[r]}
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
          icon={ShieldCheck}
          title="No users found"
          description="Try changing your search or filters."
          action={hasActiveFilters ? { label: 'Clear Filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-shell motion-safe:animate-slide-up hidden sm:block" style={{ animationDelay: '80ms' }}>
            <table className="table-base table-compact">
              <thead>
                <tr>
                  <th className="w-[24%]">Name</th>
                  <th className="w-[28%]">Account</th>
                  <th className="w-[22%]">Role</th>
                  <th className="w-[16%]">Member Since</th>
                  <th className="w-[10%]">
                    <div className="flex items-center justify-end">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={u.fullName} size="sm" />
                        <span className="truncate font-medium text-ocean-900 dark:text-white">{u.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ocean-800 dark:text-ocean-100">{u.username}</p>
                        <p className="truncate text-xs text-ocean-500 dark:text-ocean-400" title={u.email}>{u.email}</p>
                      </div>
                    </td>
                    <td>
                      <select
                        className="input w-40 py-1.5"
                        value={u.role}
                        disabled={busyId === u.id}
                        aria-label={`Change role for ${u.fullName}`}
                        onChange={(e) => requestRoleChange(u, e.target.value as Role)}
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-ocean-500 dark:text-ocean-400">{formatDate(u.createdAt)}</td>
                    <td className="text-right">
                      <RowActionsMenu
                        label={`Actions for ${u.fullName}`}
                        actions={[{ label: 'View Details', icon: <Eye size={14} />, onClick: () => setViewing(u) }]}
                      />
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
                  <div className="flex min-w-0 items-center gap-2.5">
                    <InitialsAvatar name={u.fullName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ocean-900 dark:text-white">{u.fullName}</p>
                      <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{u.username}</p>
                      <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{u.email}</p>
                    </div>
                  </div>
                  <RowActionsMenu
                    label={`Actions for ${u.fullName}`}
                    actions={[{ label: 'View Details', icon: <Eye size={14} />, onClick: () => setViewing(u) }]}
                  />
                </div>
                <select
                  className="input py-1.5"
                  value={u.role}
                  disabled={busyId === u.id}
                  aria-label={`Change role for ${u.fullName}`}
                  onChange={(e) => requestRoleChange(u, e.target.value as Role)}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                <p className="text-xs text-ocean-500 dark:text-ocean-400">Member since {formatDate(u.createdAt)}</p>
              </div>
            ))}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
        </>
      )}

      {pendingChange && (
        <ConfirmDialog
          title="Change Role?"
          description={`${pendingChange.user.fullName} will become ${ROLE_LABEL[pendingChange.role]} and immediately gain that role's access.`}
          confirmLabel="Change Role"
          loading={busyId === pendingChange.user.id}
          onConfirm={confirmRoleChange}
          onCancel={() => setPendingChange(null)}
        />
      )}

      {viewing && <PlatformUserDetailsDrawer user={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
