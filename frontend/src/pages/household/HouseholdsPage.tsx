import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Gauge, Search, Home, AlertTriangle, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApartments } from '@/hooks/useApartments';
import { useCreateHousehold, useDeleteHousehold, useHouseholds, useUpdateHousehold } from '@/hooks/useHouseholds';
import type { Household } from '@/utils/types';
import HouseholdFormModal from '@/components/household/HouseholdFormModal';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import KpiCard from '@/components/common/KpiCard';
import Reveal from '@/components/common/Reveal';
import { KpiCardSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import { getApiErrorMessage } from '@/utils/apiError';

export default function HouseholdsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data: households, isLoading, isError, refetch } = useHouseholds();
  const { data: apartments } = useApartments();
  const createMutation = useCreateHousehold();
  const updateMutation = useUpdateHousehold();
  const deleteMutation = useDeleteHousehold();

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [apartmentFilter, setApartmentFilter] = useState<number | undefined>(undefined);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (households ?? []).filter((h) => {
      const matchesSearch = !q
        || h.unitNumber.toLowerCase().includes(q)
        || h.apartmentName.toLowerCase().includes(q);
      const matchesApartment = apartmentFilter == null || h.apartmentId === apartmentFilter;
      return matchesSearch && matchesApartment;
    });
  }, [households, search, apartmentFilter]);

  // Portfolio-level summary, derived entirely from the already-fetched household list.
  const totalOccupants = (households ?? []).reduce((sum, h) => sum + h.occupancyCount, 0);
  const meterConfiguredCount = (households ?? []).filter((h) => h.meterConfigured).length;
  const meterCoveragePct = households && households.length > 0 ? (meterConfiguredCount / households.length) * 100 : null;

  const handleDelete = async () => {
    if (pendingDeleteId == null) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(pendingDeleteId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* ---------------- Header ---------------- */}
      <div className="motion-safe:animate-slide-up flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
            <Home size={20} />
          </div>
          <div>
            <h1 className="text-h1">Households</h1>
            <p className="text-body mt-0.5">Manage individual household units within apartments.</p>
          </div>
        </div>
        {isAdmin && (
          <button
            type="button"
            className="btn-primary"
            disabled={!apartments?.length}
            onClick={() => { setEditingHousehold(null); setModalOpen(true); }}
          >
            <Plus size={16} className="mr-1.5" /> New Household
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      {/* ---------------- Portfolio summary ---------------- */}
      {isLoading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton />
          </div>
          <div className="table-shell">
            <TableSkeleton rows={5} cols={isAdmin ? 7 : 6} />
          </div>
        </>
      )}
      {!isLoading && !isError && households && households.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Reveal delay={0}>
            <KpiCard label="Households" value={households.length} icon={Home} color="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300" caption={`across ${apartments?.length ?? 0} apartment${apartments?.length === 1 ? '' : 's'}`} />
          </Reveal>
          <Reveal delay={80}>
            <KpiCard label="Total Occupants" value={totalOccupants} icon={Users} color="bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300" />
          </Reveal>
          <Reveal delay={160}>
            <KpiCard
              label="Meter Coverage"
              value={meterCoveragePct != null ? `${meterCoveragePct.toFixed(0)}%` : '—'}
              icon={Gauge}
              color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
              caption={`${meterConfiguredCount} of ${households.length} configured`}
            />
          </Reveal>
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load households"
          description="Something went wrong while retrieving households."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && households?.length === 0 && (
        <EmptyState
          title="No households yet"
          description="Create an apartment first, then add households to it."
          icon={Home}
        />
      )}

      {!isLoading && !isError && households && households.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="Search by unit or apartment"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search households"
              />
            </div>
            {apartments && apartments.length > 1 && (
              <div className="relative sm:w-56">
                <Building2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
                <select
                  className="input pl-9"
                  value={apartmentFilter ?? ''}
                  onChange={(e) => setApartmentFilter(e.target.value ? Number(e.target.value) : undefined)}
                  aria-label="Filter by apartment"
                >
                  <option value="">All apartments</option>
                  {apartments.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No matching households" description="Try a different search term or filter." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="table-shell motion-safe:animate-slide-up hidden sm:block">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Household ID</th>
                      <th>Apartment</th>
                      <th>Area (sqft)</th>
                      <th>Occupants</th>
                      <th>Meter</th>
                      <th>Residents</th>
                      {isAdmin && <th className="!text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((household, i) => (
                      <tr key={household.id} className="motion-safe:animate-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                        <td className="font-medium text-ocean-900 dark:text-white">{household.unitNumber}</td>
                        <td className="font-mono text-xs text-ocean-600 dark:text-ocean-300">{household.householdCode}</td>
                        <td>{household.apartmentName}</td>
                        <td>{household.areaSqft}</td>
                        <td>{household.occupancyCount}</td>
                        <td>
                          {household.meterConfigured ? (
                            <span className="badge-healthy inline-flex items-center gap-1">
                              <Gauge size={12} /> Configured
                            </span>
                          ) : (
                            <span className="badge-neutral">Not configured</span>
                          )}
                        </td>
                        <td>{household.residentCount}</td>
                        {isAdmin && (
                          <td className="text-right">
                            <button
                              type="button"
                              className="mr-2 rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800 hover:text-brand-600 dark:hover:text-brand-400"
                              onClick={() => { setEditingHousehold(household); setModalOpen(true); }}
                              aria-label={`Edit household ${household.unitNumber}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className="rounded p-1.5 text-ocean-500 dark:text-ocean-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                              onClick={() => setPendingDeleteId(household.id)}
                              aria-label={`Delete household ${household.unitNumber}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 sm:hidden">
                {filtered.map((household, i) => (
                  <div key={household.id} className="card motion-safe:animate-slide-up space-y-2 p-4" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ocean-900 dark:text-white">{household.unitNumber}</p>
                        <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{household.apartmentName}</p>
                        <p className="truncate font-mono text-[11px] text-ocean-400 dark:text-ocean-500">{household.householdCode}</p>
                      </div>
                      {household.meterConfigured ? (
                        <span className="badge-healthy shrink-0 inline-flex items-center gap-1">
                          <Gauge size={12} /> Configured
                        </span>
                      ) : (
                        <span className="badge-neutral shrink-0">Not configured</span>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-ocean-600 dark:text-ocean-300">
                      <span>{household.areaSqft} sqft</span>
                      <span>{household.occupancyCount} occupants</span>
                      <span>{household.residentCount} residents</span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          className="btn-secondary btn-sm flex-1"
                          onClick={() => { setEditingHousehold(household); setModalOpen(true); }}
                        >
                          <Pencil size={14} className="mr-1.5" /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-sm flex-1 text-red-600 dark:text-red-400"
                          onClick={() => setPendingDeleteId(household.id)}
                        >
                          <Trash2 size={14} className="mr-1.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {isModalOpen && apartments && (
        <HouseholdFormModal
          household={editingHousehold}
          apartments={apartments}
          onClose={() => setModalOpen(false)}
          onSubmit={async (values) => {
            if (editingHousehold) {
              await updateMutation.mutateAsync({ id: editingHousehold.id, payload: values });
            } else {
              await createMutation.mutateAsync(values);
            }
            setModalOpen(false);
          }}
        />
      )}

      {pendingDeleteId != null && (
        <ConfirmDialog
          title="Delete this household?"
          description="This cannot be undone. All associated meter readings and invoices remain in records, but the household itself is permanently removed."
          confirmLabel="Delete"
          danger
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}
