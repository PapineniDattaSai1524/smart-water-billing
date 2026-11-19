import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Gauge, Trash2 } from 'lucide-react';
import { useHouseholds } from '@/hooks/useHouseholds';
import { useConfigureMeter, useDeleteMeterConfig, useMeterConfigs } from '@/hooks/useMeterConfigs';
import { meterConfigSchema, type MeterConfigFormValues } from '@/utils/validationSchemas';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { getApiErrorMessage } from '@/utils/apiError';
import type { WaterMeterConfig } from '@/utils/types';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'badge-healthy',
  INACTIVE: 'badge-neutral',
  FAULTY: 'badge-critical',
  REPLACED: 'badge-warning',
};

export default function MeterConfigPage() {
  const { data: households } = useHouseholds();
  const { data: meters, isLoading } = useMeterConfigs();
  const configureMutation = useConfigureMeter();
  const deleteMutation = useDeleteMeterConfig();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WaterMeterConfig | null>(null);

  const unconfiguredHouseholds = households?.filter((h) => !h.meterConfigured) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeterConfigFormValues>({
    resolver: zodResolver(meterConfigSchema),
    defaultValues: {
      meterType: 'DIGITAL',
      status: 'ACTIVE',
      initialReading: 0,
      installationDate: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (values: MeterConfigFormValues) => {
    setError(null);
    try {
      await configureMutation.mutateAsync(values);
      reset({
        meterType: 'DIGITAL', status: 'ACTIVE', initialReading: 0,
        installationDate: new Date().toISOString().slice(0, 10), meterNumber: '', householdId: undefined,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setError(null);
    try {
      await deleteMutation.mutateAsync(pendingDelete.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Water Meter Configuration</h1>
        <p className="text-body mt-1">Install and configure water meters for households.</p>
      </div>

      <ErrorBanner message={error} />

      <div className="card p-6 motion-safe:animate-slide-up" style={{ animationDelay: '80ms' }}>
        <h2 className="text-h3 mb-4">Configure a New Meter</h2>
        {unconfiguredHouseholds.length === 0 && households && households.length > 0 && (
          <p className="helper-text mb-4">Every household already has a meter configured.</p>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" noValidate>
          <div>
            <label className="label label-required" htmlFor="householdId">Household</label>
            <select id="householdId" className="input" {...register('householdId')}>
              <option value="">Select household</option>
              {unconfiguredHouseholds.map((h) => (
                <option key={h.id} value={h.id}>{h.unitNumber} — {h.apartmentName}</option>
              ))}
            </select>
            {errors.householdId && <p className="field-error"><AlertCircle size={12} /> {errors.householdId.message}</p>}
          </div>
          <div>
            <label className="label label-required" htmlFor="meterNumber">Meter Number</label>
            <input id="meterNumber" className="input" placeholder="MTR-A101-001" {...register('meterNumber')} />
            {errors.meterNumber && <p className="field-error"><AlertCircle size={12} /> {errors.meterNumber.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="meterType">Meter Type</label>
            <select id="meterType" className="input" {...register('meterType')}>
              <option value="ANALOG">Analog</option>
              <option value="DIGITAL">Digital</option>
              <option value="SMART_IOT">Smart IoT</option>
            </select>
          </div>
          <div>
            <label className="label label-required" htmlFor="installationDate">Installation Date</label>
            <input id="installationDate" type="date" className="input" {...register('installationDate')} />
            {errors.installationDate && <p className="field-error"><AlertCircle size={12} /> {errors.installationDate.message}</p>}
          </div>
          <div>
            <label className="label label-required" htmlFor="initialReading">Initial Reading (kL)</label>
            <input id="initialReading" type="number" step="0.01" className="input" {...register('initialReading')} />
            {errors.initialReading && <p className="field-error"><AlertCircle size={12} /> {errors.initialReading.message}</p>}
          </div>
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="FAULTY">Faulty</option>
              <option value="REPLACED">Replaced</option>
            </select>
          </div>
          <div className="flex items-end lg:col-span-3">
            <button type="submit" className="btn-primary" disabled={isSubmitting || unconfiguredHouseholds.length === 0}>
              <Gauge size={16} /> {isSubmitting ? 'Configuring...' : 'Configure Meter'}
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden p-0 motion-safe:animate-slide-up" style={{ animationDelay: '140ms' }}>
        <div className="border-b border-ocean-100 p-5 dark:border-ocean-800">
          <h2 className="text-h3">Configured Meters</h2>
        </div>
        {isLoading && <LoadingSpinner label="Loading meters..." />}
        {!isLoading && meters?.length === 0 && (
          <div className="p-6">
            <EmptyState icon={Gauge} title="No meters configured yet" description="Configure your first meter using the form above." />
          </div>
        )}
        {!isLoading && meters && meters.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Household</th>
                    <th>Meter Number</th>
                    <th>Type</th>
                    <th>Installed</th>
                    <th>Status</th>
                    <th className="!text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meters.map((m, i) => (
                    <tr key={m.id} className="motion-safe:animate-fade-in" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                      <td className="font-medium text-ocean-900 dark:text-white">{m.unitNumber}</td>
                      <td>{m.meterNumber}</td>
                      <td>{m.meterType}</td>
                      <td>{m.installationDate}</td>
                      <td><span className={STATUS_BADGE[m.status] ?? 'badge-neutral'}>{m.status}</span></td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="rounded p-1.5 text-ocean-400 hover:bg-red-50 hover:text-status-critical dark:hover:bg-red-500/10"
                          onClick={() => setPendingDelete(m)}
                          aria-label="Delete meter configuration"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 sm:hidden">
              {meters.map((m, i) => (
                <div key={m.id} className="card motion-safe:animate-fade-in space-y-2 p-4" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ocean-900 dark:text-white">{m.unitNumber}</p>
                      <p className="truncate text-xs text-ocean-500 dark:text-ocean-400">{m.meterNumber}</p>
                    </div>
                    <span className={STATUS_BADGE[m.status] ?? 'badge-neutral'}>{m.status}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-ocean-600 dark:text-ocean-300">
                    <span>{m.meterType}</span>
                    <span>Installed {m.installationDate}</span>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded p-1.5 text-xs font-medium text-ocean-400 hover:bg-red-50 hover:text-status-critical dark:hover:bg-red-500/10"
                      onClick={() => setPendingDelete(m)}
                      aria-label="Delete meter configuration"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Remove this meter configuration?"
          description={`Meter ${pendingDelete.meterNumber} for unit ${pendingDelete.unitNumber} will be removed. Historical usage logs are not affected.`}
          confirmLabel="Remove"
          danger
          loading={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
