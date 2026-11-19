import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { useApartments } from '@/hooks/useApartments';
import {
  useCreateTariffPlan, useGenerateInvoices, useInvoices, useMarkInvoicePaid, useRevenueSummary, useTariffPlans,
} from '@/hooks/useBilling';
import { invoiceService } from '@/services/invoiceService';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import SuccessBanner from '@/components/common/SuccessBanner';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatBillingPeriod, formatKl, formatINR } from '@/utils/format';
import type { Invoice, TariffTier } from '@/utils/types';

const COLORS = ['#0d9488', '#f59e0b'];

/**
 * Week 5-6 Feature 2D validation: no negative values, ascending & contiguous ranges,
 * no overlapping tiers, every tier's rate required. The backend remains the source of
 * truth (it re-validates and is what actually calculates bills) -- this only stops
 * obviously-bad input before it's submitted.
 */
function validateTiers(tiers: TariffTier[]): string | null {
  if (tiers.length === 0) return null;
  for (const t of tiers) {
    if (t.minKl < 0 || t.ratePerKl < 0 || (t.maxKl != null && t.maxKl < 0)) {
      return 'Tier values cannot be negative.';
    }
    if (t.maxKl != null && t.maxKl <= t.minKl) {
      return 'Each tier\'s max KL must be greater than its min KL.';
    }
  }
  const sorted = [...tiers].sort((a, b) => a.minKl - b.minKl);
  if (sorted[0].minKl !== 0) {
    return 'The first tier must start at 0 KL.';
  }
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.maxKl == null) {
      return 'Only the last (highest) tier may be left open-ended.';
    }
    if (current.maxKl !== next.minKl) {
      return `Tiers must be contiguous with no gaps or overlaps (tier ending at ${current.maxKl} KL, next starts at ${next.minKl} KL).`;
    }
  }
  if (sorted[sorted.length - 1].maxKl != null) {
    return 'The last (highest) tier must be left open-ended (no max KL) to cover all usage above it.';
  }
  return null;
}

function DownloadInvoiceButton({ invoice }: { invoice: Invoice }) {
  const [downloading, setDownloading] = useState(false);
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await invoiceService.downloadPdf(invoice.id, `invoice-${invoice.unitNumber}-${invoice.billingMonth}`);
    } finally {
      setDownloading(false);
    }
  };
  return (
    <button type="button" className="btn-secondary btn-sm" onClick={handleDownload} disabled={downloading}>
      {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      {downloading ? 'Preparing...' : 'PDF'}
    </button>
  );
}

export default function BillingPage() {
  const { data: apartments } = useApartments();
  const { data: tariffPlans } = useTariffPlans();
  const { data: revenue } = useRevenueSummary();
  const [invoiceFilters, setInvoiceFilters] = useState<{ status?: string; billingMonth?: string }>({});
  const { data: invoices, isLoading: invoicesLoading } = useInvoices({
    status: invoiceFilters.status as never, billingMonth: invoiceFilters.billingMonth, page: 0, size: 10,
  });

  const createTariffMutation = useCreateTariffPlan();
  const generateInvoicesMutation = useGenerateInvoices();
  const markPaidMutation = useMarkInvoicePaid();

  const [tariffForm, setTariffForm] = useState({ apartmentId: '', name: '', ratePerKl: '', fixedCharge: '0', taxPercentage: '0' });
  const [useTiers, setUseTiers] = useState(false);
  const [tiers, setTiers] = useState<TariffTier[]>([{ minKl: 0, maxKl: 10, ratePerKl: 0 }]);
  const [invoiceForm, setInvoiceForm] = useState({ apartmentId: '', billingMonth: '' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const revenueData = revenue
    ? [
        { name: 'Collected', value: revenue.totalCollected },
        { name: 'Outstanding', value: revenue.totalOutstanding },
      ]
    : [];

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    setTiers([...tiers, { minKl: last?.maxKl ?? 0, maxKl: null, ratePerKl: 0 }]);
  };

  const removeTier = (idx: number) => setTiers(tiers.filter((_, i) => i !== idx));

  const updateTier = (idx: number, patch: Partial<TariffTier>) => {
    setTiers(tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };

  const handleCreateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (useTiers) {
      const validationError = validateTiers(tiers);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      await createTariffMutation.mutateAsync({
        apartmentId: Number(tariffForm.apartmentId),
        name: tariffForm.name,
        ratePerKl: Number(tariffForm.ratePerKl || (useTiers ? tiers[0]?.ratePerKl ?? 0.01 : 0)),
        fixedCharge: Number(tariffForm.fixedCharge || 0),
        taxPercentage: Number(tariffForm.taxPercentage || 0),
        tiers: useTiers ? tiers : undefined,
      });
      setTariffForm({ apartmentId: '', name: '', ratePerKl: '', fixedCharge: '0', taxPercentage: '0' });
      setTiers([{ minKl: 0, maxKl: 10, ratePerKl: 0 }]);
      setNotice('Tariff plan created');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await generateInvoicesMutation.mutateAsync({
        apartmentId: Number(invoiceForm.apartmentId),
        billingMonth: invoiceForm.billingMonth,
      });
      setNotice(`Generated ${result.data.length} invoice(s)`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1">Billing</h1>
        <p className="text-body mt-1">Tariff plans, monthly invoice generation, and payment tracking.</p>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={notice} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------------- Revenue overview ---------------- */}
        <div className="card p-6">
          <h2 className="text-h3 mb-4">Revenue Overview</h2>
          {revenue ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={revenueData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {revenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${Number(v ?? 0).toFixed(2)}`} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
                <div><p className="text-caption">Collected</p><p className="font-semibold text-ocean-900 dark:text-white">{formatINR(revenue.totalCollected)}</p></div>
                <div><p className="text-caption">Outstanding</p><p className="font-semibold text-ocean-900 dark:text-white">{formatINR(revenue.totalOutstanding)}</p></div>
              </div>
            </>
          ) : <LoadingSpinner label="Loading revenue..." />}
        </div>

        {/* ---------------- Tariff builder ---------------- */}
        <form onSubmit={handleCreateTariff} className="card space-y-3 p-6 lg:col-span-1">
          <h2 className="text-h3">Tariff Builder</h2>

          <div>
            <label className="label label-required">Apartment</label>
            <select className="input" required value={tariffForm.apartmentId} onChange={(e) => setTariffForm({ ...tariffForm, apartmentId: e.target.value })}>
              <option value="">Select apartment</option>
              {apartments?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label label-required">Plan Name</label>
            <input className="input" placeholder="e.g. Standard 2026" required value={tariffForm.name} onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })} />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-ocean-600 dark:text-ocean-300">
            <input type="checkbox" className="h-4 w-4 rounded border-ocean-300 text-aqua-600 focus:ring-aqua-500" checked={useTiers} onChange={(e) => setUseTiers(e.target.checked)} />
            Use tiered pricing
          </label>

          {!useTiers && (
            <div>
              <label className="label label-required">Rate per kL</label>
              <input className="input" type="number" step="0.01" min="0.01" placeholder="e.g. 25.00" required={!useTiers} value={tariffForm.ratePerKl} onChange={(e) => setTariffForm({ ...tariffForm, ratePerKl: e.target.value })} />
            </div>
          )}

          {useTiers && (
            <div className="space-y-2">
              {tiers.map((tier, idx) => (
                <div key={idx} className="rounded-xl border border-ocean-100 bg-ocean-50/50 p-3 dark:border-ocean-800 dark:bg-ocean-800/30">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-aqua-700 dark:text-aqua-400">
                      Tier {String(idx + 1).padStart(2, '0')}
                    </span>
                    {tiers.length > 1 && (
                      <button type="button" onClick={() => removeTier(idx)} className="text-ocean-400 hover:text-status-critical" aria-label="Remove tier">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-caption mb-1 block">Min kL</label>
                      <input className="input py-1.5 text-xs" type="number" min="0" step="0.01" value={tier.minKl} onChange={(e) => updateTier(idx, { minKl: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="text-caption mb-1 block">Max kL</label>
                      <input className="input py-1.5 text-xs" type="number" min="0" step="0.01" placeholder="∞" value={tier.maxKl ?? ''} onChange={(e) => updateTier(idx, { maxKl: e.target.value === '' ? null : Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="text-caption mb-1 block">₹ / kL</label>
                      <input className="input py-1.5 text-xs" type="number" min="0" step="0.01" value={tier.ratePerKl} onChange={(e) => updateTier(idx, { ratePerKl: Number(e.target.value) })} />
                    </div>
                  </div>
                  <p className="text-caption mt-1.5">
                    {tier.minKl}–{tier.maxKl ?? '∞'} kL @ ₹{tier.ratePerKl || 0}/kL
                  </p>
                </div>
              ))}
              <button type="button" onClick={addTier} className="flex items-center gap-1 text-xs font-medium text-aqua-700 hover:underline dark:text-aqua-400">
                <Plus size={14} /> Add tier
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fixed Charge</label>
              <input className="input" type="number" step="0.01" min="0" value={tariffForm.fixedCharge} onChange={(e) => setTariffForm({ ...tariffForm, fixedCharge: e.target.value })} />
            </div>
            <div>
              <label className="label">Tax %</label>
              <input className="input" type="number" step="0.01" min="0" max="100" value={tariffForm.taxPercentage} onChange={(e) => setTariffForm({ ...tariffForm, taxPercentage: e.target.value })} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={createTariffMutation.isPending}>
            {createTariffMutation.isPending ? 'Saving...' : 'Create Plan'}
          </button>
          {!!tariffPlans?.length && (
            <p className="text-caption">
              Active plans: {tariffPlans.filter((p) => p.active).map((p) => `${p.apartmentName} (${p.tiered ? 'tiered' : `₹${p.ratePerKl}/kL`})`).join(', ')}
            </p>
          )}
        </form>

        {/* ---------------- Generate invoices ---------------- */}
        <form onSubmit={handleGenerateInvoices} className="card space-y-3 p-6">
          <h2 className="text-h3">Generate Monthly Invoices</h2>
          <div>
            <label className="label label-required">Apartment</label>
            <select className="input" required value={invoiceForm.apartmentId} onChange={(e) => setInvoiceForm({ ...invoiceForm, apartmentId: e.target.value })}>
              <option value="">Select apartment</option>
              {apartments?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label label-required">Billing Month</label>
            <input className="input" type="month" required value={invoiceForm.billingMonth} onChange={(e) => setInvoiceForm({ ...invoiceForm, billingMonth: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={generateInvoicesMutation.isPending}>
            {generateInvoicesMutation.isPending ? 'Generating...' : 'Generate Invoices'}
          </button>
          <p className="helper-text">Requires an active tariff plan for the apartment. Uses that month&apos;s logged meter readings.</p>
        </form>
      </div>

      {/* ---------------- Invoices ---------------- */}
      <div>
        <h2 className="text-h3 mb-3">Invoices</h2>
        <div className="mb-3 flex flex-wrap gap-3">
          <select className="input max-w-xs" value={invoiceFilters.status ?? ''} onChange={(e) => setInvoiceFilters((f) => ({ ...f, status: e.target.value || undefined }))}>
            <option value="">All statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <input className="input max-w-xs" type="month" value={invoiceFilters.billingMonth ?? ''} onChange={(e) => setInvoiceFilters((f) => ({ ...f, billingMonth: e.target.value || undefined }))} />
        </div>

        {invoicesLoading && <LoadingSpinner label="Loading invoices..." />}
        {!invoicesLoading && invoices?.content.length === 0 && <EmptyState title="No invoices yet" description="Generate invoices from the panel above." />}

        {!invoicesLoading && invoices && invoices.content.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="table-shell hidden sm:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Unit</th>
                    <th>Resident</th>
                    <th>Month</th>
                    <th>Consumption</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="!text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.content.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-medium text-ocean-900 dark:text-white">{inv.unitNumber}</td>
                      <td>{inv.residentName ?? '—'}</td>
                      <td>{formatBillingPeriod(inv.billingMonth)}</td>
                      <td>{formatKl(inv.consumptionKl)}</td>
                      <td className="font-medium text-ocean-900 dark:text-white">{formatINR(inv.totalAmount)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <DownloadInvoiceButton invoice={inv} />
                          {inv.status !== 'PAID' && (
                            <button type="button" className="btn-secondary btn-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10" onClick={() => markPaidMutation.mutate(inv.id)}>
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {invoices.content.map((inv) => (
                <div key={inv.id} className="card space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ocean-900 dark:text-white">Unit {inv.unitNumber}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-caption">{inv.residentName ?? '—'} · {formatBillingPeriod(inv.billingMonth)}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ocean-600 dark:text-ocean-300">{formatKl(inv.consumptionKl)}</p>
                    <p className="font-semibold text-ocean-900 dark:text-white">{formatINR(inv.totalAmount)}</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <DownloadInvoiceButton invoice={inv} />
                    {inv.status !== 'PAID' && (
                      <button type="button" className="btn-secondary btn-sm flex-1 border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300" onClick={() => markPaidMutation.mutate(inv.id)}>
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
