import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, Info, ShieldAlert, Sliders } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApartments } from '@/hooks/useApartments';
import { useApartmentNotifications, useAlertConfig, useUpdateAlertConfig } from '@/hooks/useDashboardExtras';
import type { AlertThresholdConfigPayload, NotificationSeverity } from '@/utils/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import SuccessBanner from '@/components/common/SuccessBanner';
import StatusBadge from '@/components/common/StatusBadge';
import KpiCard from '@/components/common/KpiCard';
import { TableSkeleton } from '@/components/common/Skeleton';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate } from '@/utils/format';

const SEVERITY_FILTERS: Array<'ALL' | NotificationSeverity> = ['ALL', 'CRITICAL', 'WARNING', 'INFO'];

export default function AlertsPage() {
  const { user } = useAuth();
  const { data: apartments, isLoading: apartmentsLoading, isError: apartmentsError, refetch: refetchApartments } = useApartments();

  // Admins manage their own apartment(s); pick the first one that lists them as admin.
  const myApartments = useMemo(
    () => (apartments ?? []).filter((a) => a.adminId === user?.id),
    [apartments, user],
  );
  const [apartmentId, setApartmentId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (apartmentId == null && myApartments.length > 0) {
      setApartmentId(myApartments[0].id);
    }
  }, [myApartments, apartmentId]);

  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | NotificationSeverity>('ALL');

  const {
    data: alerts, isLoading: alertsLoading, isError: alertsError, refetch: refetchAlerts,
  } = useApartmentNotifications(apartmentId, {
    read: readFilter === 'ALL' ? undefined : readFilter === 'READ',
  });
  const { data: config, isLoading: configLoading } = useAlertConfig(apartmentId);
  const updateConfig = useUpdateAlertConfig(apartmentId);

  const filteredAlerts = useMemo(() => {
    const content = alerts?.content ?? [];
    if (severityFilter === 'ALL') return content;
    return content.filter((n) => n.severity === severityFilter);
  }, [alerts, severityFilter]);

  const alertCounts = useMemo(() => {
    const content = alerts?.content ?? [];
    return {
      critical: content.filter((n) => n.severity === 'CRITICAL').length,
      warning: content.filter((n) => n.severity === 'WARNING').length,
      unread: content.filter((n) => !n.read).length,
    };
  }, [alerts]);

  const [form, setForm] = useState<AlertThresholdConfigPayload>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        dailyThresholdKl: config.dailyThresholdKl,
        anomalyStdDevMultiplier: config.anomalyStdDevMultiplier,
        minHistoryReadings: config.minHistoryReadings,
        enabled: config.enabled,
      });
    }
  }, [config]);

  const handleSave = async () => {
    setSaveError(null);
    setSaved(false);
    try {
      await updateConfig.mutateAsync(form);
      setSaved(true);
    } catch (err) {
      setSaveError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Water Usage Alerts</h1>
        <p className="text-body mt-1">
          High-usage and possible-leak alerts raised automatically by the Alert &amp; Notification Engine
          across every household in your apartment.
        </p>
      </div>

      {apartmentId != null && !alertsLoading && !alertsError && (alerts?.content.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            <KpiCard key="critical" label="Critical" value={String(alertCounts.critical)} icon={AlertTriangle} color="bg-status-critical/10 text-status-critical" />,
            <KpiCard key="warning" label="Warning" value={String(alertCounts.warning)} icon={ShieldAlert} color="bg-status-warning/10 text-status-warning" />,
            <KpiCard key="unread" label="Unread" value={String(alertCounts.unread)} icon={Info} color="bg-status-info/10 text-status-info" />,
          ].map((card, i) => (
            <div key={card.key} className="motion-safe:animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              {card}
            </div>
          ))}
        </div>
      )}

      {myApartments.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-ocean-600 dark:text-ocean-300">Apartment</label>
          <select
            className="input max-w-xs"
            value={apartmentId ?? ''}
            onChange={(e) => setApartmentId(Number(e.target.value))}
          >
            {myApartments.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {apartmentsLoading && <LoadingSpinner label="Loading apartments..." />}

      {apartmentsError && !apartmentsLoading && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load your apartments"
          description="Something went wrong while retrieving your apartments."
          action={{ label: 'Retry', onClick: () => refetchApartments() }}
        />
      )}

      {!apartmentsLoading && !apartmentsError && myApartments.length === 0 && (
        <EmptyState
          title="No apartment assigned to your account"
          description="You need to manage at least one apartment to see its alerts."
          icon={ShieldAlert}
        />
      )}

      {apartmentId != null && (
        <>
          {/* Threshold configuration */}
          <div className="glass-panel p-6">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
              <Sliders size={16} /> Alert Thresholds
            </h2>
            <p className="mb-4 text-xs text-ocean-500 dark:text-ocean-400">
              Leave a field blank to use the platform default. Changes apply on the next scheduled run.
            </p>

            {configLoading && <LoadingSpinner label="Loading configuration..." />}

            {!configLoading && config && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ocean-600 dark:text-ocean-300">
                    Daily threshold (kL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder={String(config.effectiveDailyThresholdKl)}
                    value={form.dailyThresholdKl ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        dailyThresholdKl: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ocean-600 dark:text-ocean-300">
                    Anomaly std-dev multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input"
                    placeholder={String(config.effectiveAnomalyStdDevMultiplier)}
                    value={form.anomalyStdDevMultiplier ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        anomalyStdDevMultiplier: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ocean-600 dark:text-ocean-300">
                    Min. history readings
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="input"
                    placeholder={String(config.effectiveMinHistoryReadings)}
                    value={form.minHistoryReadings ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minHistoryReadings: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-ocean-600 dark:text-ocean-300 sm:col-span-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={form.enabled ?? true}
                    onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                  />
                  Alerts enabled for this apartment
                </label>
              </div>
            )}

            <ErrorBanner message={saveError} />
            {saved && !saveError && <SuccessBanner message="Configuration saved." />}

            <div className="mt-4">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={updateConfig.isPending || configLoading}
              >
                {updateConfig.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* Apartment-wide alert feed */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ocean-800 dark:text-ocean-100">
                <BellRing size={16} /> Recent Alerts
              </h2>
              <div className="flex flex-wrap gap-2">
                <div className="flex gap-1 rounded-lg border border-ocean-200 p-1 dark:border-ocean-700" role="group" aria-label="Filter by read status">
                  {(['ALL', 'UNREAD', 'READ'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReadFilter(s)}
                      aria-pressed={readFilter === s}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        readFilter === s
                          ? 'bg-aqua-600 text-white'
                          : 'text-ocean-500 hover:bg-ocean-100 dark:text-ocean-400 dark:hover:bg-ocean-800'
                      }`}
                    >
                      {s === 'ALL' ? 'All' : s === 'UNREAD' ? 'Unread' : 'Read'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 rounded-lg border border-ocean-200 p-1 dark:border-ocean-700" role="group" aria-label="Filter by severity">
                  {SEVERITY_FILTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverityFilter(s)}
                      aria-pressed={severityFilter === s}
                      className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        severityFilter === s
                          ? 'bg-aqua-600 text-white'
                          : 'text-ocean-500 hover:bg-ocean-100 dark:text-ocean-400 dark:hover:bg-ocean-800'
                      }`}
                    >
                      {s === 'ALL' ? 'All' : s.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {alertsLoading && (
              <div className="table-shell">
                <TableSkeleton rows={4} cols={3} />
              </div>
            )}

            {alertsError && !alertsLoading && (
              <EmptyState
                icon={AlertTriangle}
                title="Unable to load alerts"
                description="Something went wrong while retrieving alerts for this apartment."
                action={{ label: 'Retry', onClick: () => refetchAlerts() }}
              />
            )}

            {!alertsLoading && !alertsError && (alerts?.content.length ?? 0) === 0 && (
              <EmptyState
                title="No alerts yet"
                description="High-usage and possible-leak alerts for your apartment will show up here."
                icon={BellRing}
              />
            )}

            {!alertsLoading && !alertsError && alerts && alerts.content.length > 0 && filteredAlerts.length === 0 && (
              <EmptyState title="No matching alerts" description="Try a different filter." icon={BellRing} />
            )}

            {!alertsLoading && !alertsError && filteredAlerts.length > 0 && (
              <div className="card motion-safe:animate-slide-up divide-y divide-ocean-100 dark:divide-ocean-800">
                {filteredAlerts.map((n) => (
                  <div key={n.id} className={`flex items-start gap-3 p-4 ${!n.read ? 'bg-brand-50/40 dark:bg-brand-500/5' : ''}`}>
                    <div className="mt-0.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-ocean-900 dark:text-white">{n.title}</p>
                        {n.severity && <StatusBadge status={n.severity} />}
                        {n.householdUnitNumber && (
                          <span className="text-xs text-ocean-400">Unit {n.householdUnitNumber}</span>
                        )}
                        {!n.read && <span className="text-xs font-medium text-brand-600">Unread</span>}
                      </div>
                      <p className="text-sm text-ocean-600 dark:text-ocean-300">{n.message}</p>
                      <p className="mt-1 text-xs text-ocean-400">{formatDate(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
