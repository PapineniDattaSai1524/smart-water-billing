import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Building2, AlertTriangle, MapPin, Home, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useApartments, useCreateApartment, useDeleteApartment, useUpdateApartment,
} from '@/hooks/useApartments';
import type { Apartment } from '@/utils/types';
import ApartmentFormModal from '@/components/apartment/ApartmentFormModal';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import KpiCard from '@/components/common/KpiCard';
import Reveal from '@/components/common/Reveal';
import { KpiCardSkeleton } from '@/components/common/Skeleton';
import { getApiErrorMessage } from '@/utils/apiError';

export default function ApartmentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { data: apartments, isLoading, isError, refetch } = useApartments();
  const createMutation = useCreateApartment();
  const updateMutation = useUpdateApartment();
  const deleteMutation = useDeleteApartment();

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingApartment, setEditingApartment] = useState<Apartment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apartments ?? [];
    return (apartments ?? []).filter((a) =>
      a.name.toLowerCase().includes(q)
      || a.city.toLowerCase().includes(q)
      || a.state.toLowerCase().includes(q)
      || a.addressLine.toLowerCase().includes(q));
  }, [apartments, search]);

  // Portfolio-level summary, derived entirely from the already-fetched apartment list --
  // no separate/fabricated aggregate endpoint.
  const totalUnits = (apartments ?? []).reduce((sum, a) => sum + a.totalUnits, 0);
  const totalHouseholds = (apartments ?? []).reduce((sum, a) => sum + a.householdCount, 0);
  const occupancyPct = totalUnits > 0 ? (totalHouseholds / totalUnits) * 100 : null;

  const openCreateModal = () => {
    setEditingApartment(null);
    setModalOpen(true);
  };

  const openEditModal = (apartment: Apartment) => {
    setEditingApartment(apartment);
    setModalOpen(true);
  };

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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
            <Building2 size={20} />
          </div>
          <div>
            <h1 className="text-h1">Apartments</h1>
            <p className="text-body mt-0.5">Manage apartment communities onboarded to the platform.</p>
          </div>
        </div>
        {isAdmin && (
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} className="mr-1.5" /> New Apartment
          </button>
        )}
      </div>

      <ErrorBanner message={error} />

      {/* ---------------- Portfolio summary ---------------- */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton />
        </div>
      )}
      {!isLoading && !isError && apartments && apartments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Reveal delay={0}>
            <KpiCard label="Apartments" value={apartments.length} icon={Building2} color="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300" />
          </Reveal>
          <Reveal delay={80}>
            <KpiCard label="Total Units" value={totalUnits} icon={Home} color="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300" caption={`${totalHouseholds} households`} />
          </Reveal>
          <Reveal delay={160}>
            <KpiCard
              label="Occupancy"
              value={occupancyPct != null ? `${occupancyPct.toFixed(0)}%` : '—'}
              icon={Users}
              color="bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300"
              caption="households vs. total units"
            />
          </Reveal>
        </div>
      )}

      {isError && !isLoading && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load apartments"
          description="Something went wrong while retrieving apartments."
          action={{ label: 'Retry', onClick: () => refetch() }}
        />
      )}

      {!isLoading && !isError && apartments?.length === 0 && (
        <EmptyState
          title="No apartments yet"
          description="Create your first apartment community to get started."
          icon={Building2}
        />
      )}

      {!isLoading && !isError && apartments && apartments.length > 0 && (
        <div className="space-y-4">
          <div className="relative sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by name, city or state"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search apartments"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No matching apartments" description="Try a different search term." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((apartment, i) => {
                const occupied = apartment.householdCount;
                const vacant = Math.max(0, apartment.totalUnits - occupied);
                return (
                  <Reveal key={apartment.id} delay={Math.min(i, 9) * 40} className="card-interactive flex flex-col gap-4 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                        <Building2 size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ocean-900 dark:text-white">{apartment.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ocean-500 dark:text-ocean-400">
                          <MapPin size={11} className="shrink-0" /> {apartment.city}, {apartment.state}
                        </p>
                      </div>
                    </div>

                    <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{apartment.addressLine}</p>

                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-ocean-50/70 p-3 text-center dark:bg-ocean-800/40">
                      <div>
                        <p className="text-base font-semibold text-ocean-900 dark:text-white">{apartment.totalUnits}</p>
                        <p className="text-[11px] uppercase tracking-wide text-ocean-500 dark:text-ocean-400">Units</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">{occupied}</p>
                        <p className="text-[11px] uppercase tracking-wide text-ocean-500 dark:text-ocean-400">Occupied</p>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-ocean-500 dark:text-ocean-400">{vacant}</p>
                        <p className="text-[11px] uppercase tracking-wide text-ocean-500 dark:text-ocean-400">Vacant</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="mt-auto flex gap-2 pt-1">
                        <button type="button" className="btn-secondary btn-sm flex-1" onClick={() => openEditModal(apartment)}>
                          <Pencil size={14} className="mr-1.5" /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary btn-sm flex-1 text-red-600 dark:text-red-400"
                          onClick={() => setPendingDeleteId(apartment.id)}
                        >
                          <Trash2 size={14} className="mr-1.5" /> Delete
                        </button>
                      </div>
                    )}
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <ApartmentFormModal
          apartment={editingApartment}
          onClose={() => setModalOpen(false)}
          onSubmit={async (values) => {
            if (editingApartment) {
              await updateMutation.mutateAsync({ id: editingApartment.id, payload: values });
            } else {
              await createMutation.mutateAsync(values);
            }
            setModalOpen(false);
          }}
        />
      )}

      {pendingDeleteId != null && (
        <ConfirmDialog
          title="Delete this apartment?"
          description="This will delete the apartment and all of its households. This cannot be undone."
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
