import { useState } from 'react';
import { Archive, Building2, CalendarClock, CheckCircle2, FileText, Lock, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { useApartments } from '@/hooks/useApartments';
import {
  useArchiveBillingCycle, useBillingCycles, useCloseBillingCycle, useFinalizeBillingCycle,
  useOpenBillingCycle, useReopenBillingCycle,
} from '@/hooks/useBillingCycles';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import ErrorBanner from '@/components/common/ErrorBanner';
import SuccessBanner from '@/components/common/SuccessBanner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatBillingPeriod } from '@/utils/format';
import type { CycleStatus } from '@/utils/types';

const STAGES: CycleStatus[] = ['OPEN', 'CLOSED', 'FINALIZED', 'ARCHIVED'];
const STAGE_LABEL: Record<CycleStatus, string> = {
  OPEN: 'Open', CLOSED: 'Closed', FINALIZED: 'Finalized', ARCHIVED: 'Archived',
};

function LifecycleStepper({ status }: { status: CycleStatus }) {
  const currentIdx = STAGES.indexOf(status);
  return (
    <div className="flex items-center">
      {STAGES.map((stage, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={stage} className="flex items-center">
            <div
              className={clsx(
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors',
                done && 'bg-aqua-500 text-white',
                active && 'bg-aqua-600 text-white ring-4 ring-aqua-100 dark:ring-aqua-500/20',
                !done && !active && 'bg-ocean-100 text-ocean-400 dark:bg-ocean-800 dark:text-ocean-500',
              )}
              title={STAGE_LABEL[stage]}
            >
              {done ? <CheckCircle2 size={13} /> : idx + 1}
            </div>
            {idx < STAGES.length - 1 && (
              <div className={clsx('h-0.5 w-5 transition-colors', done ? 'bg-aqua-500' : 'bg-ocean-100 dark:bg-ocean-800')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

type PendingAction = { kind: 'finalize' | 'archive'; cycleId: number; label: string } | null;

// Week 5-6 Feature 2C: billing cycle lifecycle controls (OPEN -> CLOSED -> FINALIZED ->
// ARCHIVED, with REOPEN as an escape hatch). Every action calls the real, existing
// BillingCycleController from Weeks 3-4 -- no billing logic lives in this component.
export default function BillingCyclesPage() {
  const { data: apartments } = useApartments();
  const [apartmentFilter, setApartmentFilter] = useState<string>('');
  const { data: cycles, isLoading } = useBillingCycles({
    apartmentId: apartmentFilter ? Number(apartmentFilter) : undefined, page: 0, size: 20,
  });

  const [openForm, setOpenForm] = useState({ apartmentId: '', billingMonth: '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const openMutation = useOpenBillingCycle();
  const closeMutation = useCloseBillingCycle();
  const finalizeMutation = useFinalizeBillingCycle();
  const archiveMutation = useArchiveBillingCycle();
  const reopenMutation = useReopenBillingCycle();

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await openMutation.mutateAsync({
        apartmentId: Number(openForm.apartmentId),
        billingMonth: openForm.billingMonth,
        notes: openForm.notes || undefined,
      });
      setOpenForm({ apartmentId: '', billingMonth: '', notes: '' });
      setNotice('Billing cycle opened');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const runAction = async (action: () => Promise<unknown>, successMsg: string) => {
    setError(null);
    try {
      await action();
      setNotice(successMsg);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingAction(null);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.kind === 'finalize') {
      runAction(() => finalizeMutation.mutateAsync(pendingAction.cycleId), 'Bills finalized');
    } else {
      runAction(() => archiveMutation.mutateAsync(pendingAction.cycleId), 'Cycle archived');
    }
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Billing Cycle Management</h1>
        <p className="text-body mt-1">Open, close, finalize, and archive each apartment&apos;s monthly billing cycle.</p>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={notice} />

      <form onSubmit={handleOpen} className="card motion-safe:animate-slide-up grid grid-cols-1 gap-3 p-6 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <label className="label label-required">Apartment</label>
          <select className="input" required value={openForm.apartmentId} onChange={(e) => setOpenForm({ ...openForm, apartmentId: e.target.value })}>
            <option value="">Select apartment</option>
            {apartments?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label label-required">Billing Month</label>
          <input className="input" type="month" required value={openForm.billingMonth} onChange={(e) => setOpenForm({ ...openForm, billingMonth: e.target.value })} />
        </div>
        <div>
          <label className="label">Notes</label>
          <input className="input" placeholder="Optional" value={openForm.notes} onChange={(e) => setOpenForm({ ...openForm, notes: e.target.value })} />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full" disabled={openMutation.isPending}>
            {openMutation.isPending ? 'Opening...' : 'Open Cycle'}
          </button>
        </div>
      </form>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-ocean-600 dark:text-ocean-300">Filter by apartment:</label>
        <select className="input max-w-xs" value={apartmentFilter} onChange={(e) => setApartmentFilter(e.target.value)}>
          <option value="">All apartments</option>
          {apartments?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      {isLoading && <LoadingSpinner label="Loading billing cycles..." />}
      {!isLoading && cycles?.content.length === 0 && (
        <EmptyState icon={CalendarClock} title="No billing cycles yet" description="Open one above to get started." />
      )}

      {!isLoading && cycles && cycles.content.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cycles.content.map((cycle, i) => (
            <div
              key={cycle.id}
              className="card-interactive motion-safe:animate-slide-up space-y-4 p-5"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-h3">{formatBillingPeriod(cycle.billingMonth, 'long')}</p>
                  <p className="text-caption mt-0.5 flex items-center gap-1"><Building2 size={11} /> {cycle.apartmentName}</p>
                </div>
                <StatusBadge status={cycle.status} />
              </div>

              <LifecycleStepper status={cycle.status} />

              <p className="text-caption flex items-center gap-1"><FileText size={12} /> {cycle.invoiceCount} invoice{cycle.invoiceCount === 1 ? '' : 's'}</p>

              <div className="flex flex-wrap gap-2 border-t border-ocean-100 pt-3 dark:border-ocean-800">
                {cycle.status === 'OPEN' && (
                  <button type="button" className="btn-secondary btn-sm" onClick={() => runAction(() => closeMutation.mutateAsync(cycle.id), 'Cycle closed')}>
                    <Lock size={13} /> Close
                  </button>
                )}
                {cycle.status === 'CLOSED' && (
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => setPendingAction({ kind: 'finalize', cycleId: cycle.id, label: `${cycle.apartmentName} — ${formatBillingPeriod(cycle.billingMonth)}` })}
                  >
                    <CheckCircle2 size={13} /> Finalize
                  </button>
                )}
                {cycle.status === 'FINALIZED' && (
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() => setPendingAction({ kind: 'archive', cycleId: cycle.id, label: `${cycle.apartmentName} — ${formatBillingPeriod(cycle.billingMonth)}` })}
                  >
                    <Archive size={13} /> Archive
                  </button>
                )}
                {(cycle.status === 'CLOSED' || cycle.status === 'FINALIZED') && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => runAction(() => reopenMutation.mutateAsync({ id: cycle.id }), 'Cycle reopened')}
                  >
                    <RotateCcw size={13} /> Reopen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingAction?.kind === 'finalize' && (
        <ConfirmDialog
          title="Finalize this billing cycle?"
          description={`This locks in bills for ${pendingAction.label}. Residents will see their invoices as final. You can still reopen this cycle afterward if needed.`}
          confirmLabel="Finalize"
          loading={finalizeMutation.isPending}
          onConfirm={confirmPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
      {pendingAction?.kind === 'archive' && (
        <ConfirmDialog
          title="Archive this billing cycle?"
          description={`${pendingAction.label} will be moved to archived and can no longer be reopened from this screen.`}
          confirmLabel="Archive"
          danger
          loading={archiveMutation.isPending}
          onConfirm={confirmPendingAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
}
