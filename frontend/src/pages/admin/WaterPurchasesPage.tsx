import { useState } from 'react';
import { Droplets, IndianRupee, Pencil, Trash2, Truck, X } from 'lucide-react';
import { useApartments } from '@/hooks/useApartments';
import {
  useCreateWaterPurchase, useDeleteWaterPurchase, useUpdateWaterPurchase, useWaterPurchaseSummary, useWaterPurchases,
} from '@/hooks/useWaterPurchases';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import KpiCard from '@/components/common/KpiCard';
import ErrorBanner from '@/components/common/ErrorBanner';
import SuccessBanner from '@/components/common/SuccessBanner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getApiErrorMessage } from '@/utils/apiError';
import type { WaterPurchase, WaterSourceType } from '@/utils/types';
import { formatINR, formatKl } from '@/utils/format';

const EMPTY_FORM = {
  apartmentId: '', sourceType: 'TANKER' as WaterSourceType, vendorName: '', quantityKl: '', cost: '',
  purchaseDate: new Date().toISOString().slice(0, 10), invoiceReference: '', notes: '',
};

// Week 5-6 Feature 2E: bulk water purchase entry (tanker/municipal). Add + view + delete
// + filter by billing cycle (month), all against the existing Week 3-4 purchase-tracking
// backend -- no duplicate logic here.
export default function WaterPurchasesPage() {
  const { data: apartments } = useApartments();
  const { data: summary } = useWaterPurchaseSummary();

  const [apartmentFilter, setApartmentFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const fromDate = monthFilter ? `${monthFilter}-01` : undefined;
  const toDate = monthFilter ? new Date(Number(monthFilter.split('-')[0]), Number(monthFilter.split('-')[1]), 0).toISOString().slice(0, 10) : undefined;

  const { data: purchases, isLoading } = useWaterPurchases({
    apartmentId: apartmentFilter ? Number(apartmentFilter) : undefined,
    fromDate, toDate, page: 0, size: 20,
  });

  const createMutation = useCreateWaterPurchase();
  const updateMutation = useUpdateWaterPurchase();
  const deleteMutation = useDeleteWaterPurchase();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WaterPurchase | null>(null);

  const totalCost = form.quantityKl && form.cost ? Number(form.cost) : 0;

  const startEdit = (p: WaterPurchase) => {
    setEditingId(p.id);
    setForm({
      apartmentId: String(p.apartmentId),
      sourceType: p.sourceType,
      vendorName: p.vendorName,
      quantityKl: String(p.quantityKl),
      cost: String(p.cost),
      purchaseDate: p.purchaseDate,
      invoiceReference: p.invoiceReference ?? '',
      notes: p.notes ?? '',
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const payload = {
      apartmentId: Number(form.apartmentId),
      sourceType: form.sourceType,
      vendorName: form.vendorName,
      quantityKl: Number(form.quantityKl),
      cost: Number(form.cost),
      purchaseDate: form.purchaseDate,
      invoiceReference: form.invoiceReference || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
        setNotice('Water purchase updated');
      } else {
        await createMutation.mutateAsync(payload);
        setNotice('Water purchase recorded');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
      setNotice('Purchase deleted');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Water Procurement</h1>
        <p className="text-body mt-1">Record tanker and municipal water purchases for your apartments.</p>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={notice} />

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            <KpiCard key="qty" label="Total Purchased" value={formatKl(summary.totalQuantityKl)} icon={Droplets} color="bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300" />,
            <KpiCard key="cost" label="Total Cost" value={formatINR(summary.totalCost)} icon={IndianRupee} color="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300" />,
            <KpiCard key="avg" label="Avg. Cost / kL" value={formatINR(summary.averageCostPerKl)} icon={Truck} color="bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300" />,
          ].map((card, i) => (
            <div key={card.key} className="motion-safe:animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              {card}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card motion-safe:animate-slide-up grid grid-cols-1 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4" style={{ animationDelay: '140ms' }}>
        <div className="flex items-center justify-between sm:col-span-3 lg:col-span-4">
          <h2 className="text-h3">{editingId ? 'Edit Purchase' : 'Record New Purchase'}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1 text-xs font-medium text-ocean-500 hover:text-ocean-700 dark:text-ocean-400 dark:hover:text-ocean-200">
              <X size={14} /> Cancel edit
            </button>
          )}
        </div>
        <div>
          <label className="label label-required">Apartment</label>
          <select className="input" required value={form.apartmentId} onChange={(e) => setForm({ ...form, apartmentId: e.target.value })}>
            <option value="">Select apartment</option>
            {apartments?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label label-required">Source</label>
          <select className="input" required value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value as WaterSourceType })}>
            <option value="TANKER">Tanker</option>
            <option value="MUNICIPAL">Municipal</option>
          </select>
        </div>
        <div>
          <label className="label label-required">Supplier / Vendor</label>
          <input className="input" placeholder="Vendor name" required value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
        </div>
        <div>
          <label className="label label-required">Delivery Date</label>
          <input className="input" type="date" required value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
        </div>
        <div>
          <label className="label label-required">Purchased Volume (kL)</label>
          <input className="input" type="number" step="0.01" min="0.01" required value={form.quantityKl} onChange={(e) => setForm({ ...form, quantityKl: e.target.value })} />
        </div>
        <div>
          <label className="label label-required">Total Cost (₹)</label>
          <input className="input" type="number" step="0.01" min="0" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        </div>
        <div>
          <label className="label">Invoice Reference</label>
          <input className="input" placeholder="Optional" value={form.invoiceReference} onChange={(e) => setForm({ ...form, invoiceReference: e.target.value })} />
        </div>
        <div>
          <label className="label">Notes</label>
          <input className="input" placeholder="Optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="flex items-center gap-3 sm:col-span-3 lg:col-span-4">
          {totalCost > 0 && Number(form.quantityKl) > 0 && (
            <p className="text-caption">
              ≈ ₹{(totalCost / Number(form.quantityKl)).toFixed(2)} / kL
            </p>
          )}
          <button type="submit" className="btn-primary ml-auto" disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending)
              ? 'Saving...'
              : editingId ? 'Save Changes' : 'Add Purchase'}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <select className="input max-w-xs" value={apartmentFilter} onChange={(e) => setApartmentFilter(e.target.value)}>
          <option value="">All apartments</option>
          {apartments?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input className="input max-w-xs" type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} placeholder="Filter by billing cycle" />
      </div>

      {isLoading && <LoadingSpinner label="Loading purchases..." />}
      {!isLoading && purchases?.content.length === 0 && (
        <EmptyState icon={Droplets} title="No water purchases recorded" description="No water purchases have been recorded for this billing cycle yet. Add one using the form above." />
      )}

      {!isLoading && purchases && purchases.content.length > 0 && (
        <div className="table-shell motion-safe:animate-slide-up">
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Apartment</th>
                <th>Source</th>
                <th>Vendor</th>
                <th>Volume</th>
                <th>Cost</th>
                <th>₹/kL</th>
                <th>Distributed</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.content.map((p, i) => (
                <tr key={p.id} className="motion-safe:animate-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}>
                  <td>{p.purchaseDate}</td>
                  <td>{p.apartmentName}</td>
                  <td><span className="badge-neutral">{p.sourceType}</span></td>
                  <td className="font-medium text-ocean-900 dark:text-white">{p.vendorName}</td>
                  <td>{p.quantityKl} kL</td>
                  <td className="font-medium text-ocean-900 dark:text-white">{formatINR(p.cost)}</td>
                  <td>{formatINR(p.costPerKl)}</td>
                  <td>{p.distributed ? <span className="badge-healthy">Yes</span> : <span className="badge-neutral">No</span>}</td>
                  <td className="text-right">
                    {!p.distributed && (
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-aqua-700 hover:underline dark:text-aqua-400"
                          aria-label="Edit purchase"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(p)}
                          className="text-status-critical inline-flex items-center gap-1 text-xs font-medium hover:underline"
                          aria-label="Delete purchase"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this water purchase?"
          description={`The ${pendingDelete.quantityKl} kL purchase from ${pendingDelete.vendorName} on ${pendingDelete.purchaseDate} will be permanently removed.`}
          confirmLabel="Delete"
          danger
          loading={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
