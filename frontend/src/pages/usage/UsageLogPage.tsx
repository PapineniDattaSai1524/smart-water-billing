import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import {
  AlertCircle, AlertTriangle, BarChart3, CheckCircle2, Copy, Download, Droplets,
  FileSpreadsheet, Home, Loader2, Search, Trash2, TrendingUp, Upload, X,
} from 'lucide-react';
import { useMyHouseholds } from '@/hooks/useHouseholds';
import {
  useDeleteUsageLog, useLogUsageReading, useRecentUsageLogsForAdmin,
  useUploadUsageCsv, useUsageLogsByHousehold,
} from '@/hooks/useUsageLogs';
import { useAdminWaterAnalytics } from '@/hooks/useAnalytics';
import { usageLogSchema, type UsageLogFormValues } from '@/utils/validationSchemas';
import type { CsvUploadResult, WaterUsageLog } from '@/utils/types';
import EmptyState from '@/components/common/EmptyState';
import ErrorBanner from '@/components/common/ErrorBanner';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import KpiCard from '@/components/common/KpiCard';
import { KpiCardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/common/Skeleton';
import MonthlyTrendChart from '@/components/charts/MonthlyTrendChart';
import HouseholdUsageBarChart from '@/components/charts/HouseholdUsageBarChart';
import { getApiErrorMessage } from '@/utils/apiError';
import { formatDate, formatIndianNumber, formatKl } from '@/utils/format';
import {
  buildWaterUsageTemplateWorkbook, convertUsageWorkbookToCsvFile, downloadWorkbookBuffer,
} from '@/utils/excelTemplate';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Same "above average" rule HouseholdUsageBarChart already uses to color/flag bars -- reused
// here (not reinvented) so the KPI count, the comparison filters, and the recent-readings status
// column all agree with what the chart itself highlights.
const HIGH_USAGE_MULTIPLIER = 1.3;

type UsageFilter = 'ALL' | 'HIGH' | 'NORMAL';

export default function UsageLogPage() {
  const {
    data: households, isLoading: householdsLoading, isError: householdsIsError,
  } = useMyHouseholds();
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics } = useAdminWaterAnalytics();

  const logMutation = useLogUsageReading();
  const deleteMutation = useDeleteUsageLog();
  const uploadCsvMutation = useUploadUsageCsv();

  const [error, setError] = useState<string | null>(null);
  const [csvResult, setCsvResult] = useState<CsvUploadResult | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------- Household comparison: search + status filter --------
  const [compareSearch, setCompareSearch] = useState('');
  const [compareFilter, setCompareFilter] = useState<UsageFilter>('ALL');

  // -------- Recent readings: household filter + search + status filter --------
  const [recentHouseholdId, setRecentHouseholdId] = useState<number | 'ALL'>('ALL');
  const [recentSearch, setRecentSearch] = useState('');
  const [recentStatusFilter, setRecentStatusFilter] = useState<UsageFilter>('ALL');

  const {
    data: buildingWideLogs, isLoading: buildingWideLoading, isError: buildingWideError, refetch: refetchBuildingWide,
  } = useRecentUsageLogsForAdmin(50);
  const {
    data: householdLogs, isLoading: householdLoading, isError: householdError, refetch: refetchHousehold,
  } = useUsageLogsByHousehold(recentHouseholdId === 'ALL' ? undefined : recentHouseholdId);

  const recentLoading = recentHouseholdId === 'ALL' ? buildingWideLoading : householdLoading;
  const recentError = recentHouseholdId === 'ALL' ? buildingWideError : householdError;
  const recentRefetch = recentHouseholdId === 'ALL' ? refetchBuildingWide : refetchHousehold;
  const recentLogsRaw: WaterUsageLog[] = (recentHouseholdId === 'ALL' ? buildingWideLogs : householdLogs) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UsageLogFormValues>({
    resolver: zodResolver(usageLogSchema),
    defaultValues: { readingDate: new Date().toISOString().slice(0, 10) },
  });

  const onSubmit = async (values: UsageLogFormValues) => {
    setError(null);
    try {
      await logMutation.mutateAsync({ ...values, remarks: values.remarks || undefined });
      reset({ householdId: values.householdId, readingDate: new Date().toISOString().slice(0, 10), meterReadingKl: undefined, remarks: '' });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDeleteConfirmed = async () => {
    if (pendingDeleteId == null) return;
    try {
      await deleteMutation.mutateAsync(pendingDeleteId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingDeleteId(null);
    }
  };

  const selectFile = async (file: File) => {
    setError(null);
    setCsvResult(null);
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.csv')) {
      setPendingFile(file);
      return;
    }
    if (lowerName.endsWith('.xlsx')) {
      try {
        // Convert client-side into the exact CSV shape the existing backend
        // parser expects -- no backend change, no new upload endpoint.
        const csvFile = await convertUsageWorkbookToCsvFile(file);
        setPendingFile(csvFile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not read the Excel file. Please check the format.');
      }
      return;
    }
    setError('Please select a .csv or .xlsx file.');
  };

  const startUpload = async () => {
    if (!pendingFile) return;
    setError(null);
    try {
      const result = await uploadCsvMutation.mutateAsync(pendingFile);
      setCsvResult(result.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearPendingFile = () => {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = async () => {
    if (isDownloadingTemplate) return;
    setError(null);

    if (householdsIsError) {
      setError('Unable to download template. Please try again.');
      return;
    }
    if (!households || households.length === 0) {
      setError('No households available for this building.');
      return;
    }

    setIsDownloadingTemplate(true);
    try {
      // households comes straight from GET /households/mine -- real rows for
      // this Building Owner's own buildings only, enforced server-side.
      const buffer = await buildWaterUsageTemplateWorkbook(households);
      downloadWorkbookBuffer(buffer, 'Water_Usage_Template.xlsx');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 403) {
        setError('You are not authorized to download this data.');
      } else if (err instanceof AxiosError && err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError(getApiErrorMessage(err, 'Unable to download template. Please try again.'));
      }
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // -------- Derived building-wide numbers (all from the real analytics payload) --------
  const householdUsage = analytics?.householdUsage ?? [];
  const householdCount = householdUsage.length;
  const avgUsageKl = householdCount > 0
    ? householdUsage.reduce((sum, h) => sum + h.consumptionKl, 0) / householdCount
    : 0;
  const highUsageThreshold = avgUsageKl > 0 ? avgUsageKl * HIGH_USAGE_MULTIPLIER : null;
  const alertCount = highUsageThreshold != null
    ? householdUsage.filter((h) => h.consumptionKl > highUsageThreshold).length
    : 0;

  const noBuildingDataAtAll = !!analytics
    && analytics.monthlyConsumption.length === 0
    && householdUsage.every((h) => h.consumptionKl === 0);

  // Households enriched with apartment name/id, for the comparison search box (spec section 8).
  const comparisonRows = useMemo(() => {
    const byUnit = new Map((households ?? []).map((h) => [h.unitNumber, h]));
    return householdUsage.map((h) => {
      const match = byUnit.get(h.unitNumber);
      return {
        unitNumber: h.unitNumber,
        consumptionKl: h.consumptionKl,
        apartmentName: match?.apartmentName,
        householdId: match?.id,
        isHigh: highUsageThreshold != null && h.consumptionKl > highUsageThreshold,
      };
    });
  }, [households, householdUsage, highUsageThreshold]);

  const filteredComparisonRows = useMemo(() => {
    const q = compareSearch.trim().toLowerCase();
    return comparisonRows.filter((r) => {
      if (compareFilter === 'HIGH' && !r.isHigh) return false;
      if (compareFilter === 'NORMAL' && r.isHigh) return false;
      if (!q) return true;
      return (
        r.unitNumber.toLowerCase().includes(q)
        || r.apartmentName?.toLowerCase().includes(q)
        || String(r.householdId ?? '').includes(q)
      );
    });
  }, [comparisonRows, compareSearch, compareFilter]);

  const scopedTopConsumers = useMemo(
    () => filteredComparisonRows.map((r) => ({ unitNumber: r.unitNumber, consumptionKl: r.consumptionKl })),
    [filteredComparisonRows],
  );

  // -------- Recent readings: search + status filter on top of whichever source is active --------
  const filteredRecentLogs = useMemo(() => {
    const q = recentSearch.trim().toLowerCase();
    return recentLogsRaw.filter((log) => {
      const isHigh = highUsageThreshold != null && log.consumptionKl > highUsageThreshold;
      if (recentStatusFilter === 'HIGH' && !isHigh) return false;
      if (recentStatusFilter === 'NORMAL' && isHigh) return false;
      if (!q) return true;
      return log.unitNumber.toLowerCase().includes(q) || log.readingDate.includes(q);
    });
  }, [recentLogsRaw, recentSearch, recentStatusFilter, highUsageThreshold]);

  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-h1">Water Usage</h1>
        <p className="text-body mt-1">
          Monitor building-wide consumption, manage meter readings, and identify unusual household usage.
        </p>
      </div>

      <ErrorBanner message={error} />

      {analyticsLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
          </div>
          <div className="card p-6"><ChartSkeleton /></div>
        </div>
      )}

      {!analyticsLoading && analyticsError && (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load water usage data"
          description="Something went wrong while retrieving building consumption data. Please try again."
          action={{ label: 'Retry', onClick: () => refetchAnalytics() }}
        />
      )}

      {!analyticsLoading && !analyticsError && analytics && noBuildingDataAtAll && (
        <EmptyState
          icon={Droplets}
          title="No water usage readings yet"
          description="Start by recording a manual meter reading, or upload readings in bulk using CSV."
        />
      )}

      {!analyticsLoading && !analyticsError && analytics && !noBuildingDataAtAll && (
        <>
          {/* ---------------- Overview KPIs ---------------- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              <KpiCard
                key="total"
                label="Total Consumption"
                value={formatKl(analytics.currentMonthConsumptionKl)}
                icon={Droplets}
                color="bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300"
                caption="This month"
              />,
              <KpiCard
                key="households"
                label="Households"
                value={householdCount}
                icon={Home}
                color="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"
                caption="In your building"
              />,
              <KpiCard
                key="avg"
                label="Average Usage"
                value={formatKl(avgUsageKl)}
                icon={BarChart3}
                color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                caption="Per household, this month"
              />,
              <KpiCard
                key="alerts"
                label="Usage Alerts"
                value={alertCount}
                icon={AlertTriangle}
                color={alertCount > 0 ? 'bg-status-critical/10 text-status-critical' : 'bg-ocean-100 text-ocean-500 dark:bg-ocean-800 dark:text-ocean-400'}
                caption="Above threshold, this month"
              />,
            ].map((card, i) => (
              <div key={card.key} className="motion-safe:animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                {card}
              </div>
            ))}
          </div>

          {/* ---------------- Building Consumption Trend ---------------- */}
          <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '120ms' }}>
            <h2 className="section-title mb-1 flex items-center gap-2"><TrendingUp size={14} /> Building Consumption Trend</h2>
            <p className="text-caption mb-4">
              {analytics.monthlyConsumption.length > 0
                ? `Last ${analytics.monthlyConsumption.length} month${analytics.monthlyConsumption.length === 1 ? '' : 's'} with recorded readings across your building`
                : 'Monthly building-wide consumption'}
            </p>
            <MonthlyTrendChart data={analytics.monthlyConsumption} valueLabel="KL" color="#0891b2" />
          </div>

          {/* ---------------- Household Usage Comparison ---------------- */}
          <div className="glass-panel motion-safe:animate-slide-up p-6" style={{ animationDelay: '160ms' }}>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <h2 className="section-title flex items-center gap-2"><BarChart3 size={14} /> Household Usage Comparison</h2>
            </div>
            <p className="text-caption mb-4">This month&apos;s consumption by household, across every unit in your building</p>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
                <input
                  className="input pl-8"
                  placeholder="Search household..."
                  value={compareSearch}
                  onChange={(e) => setCompareSearch(e.target.value)}
                  aria-label="Search households"
                />
              </div>
              <div className="flex gap-1 rounded-lg border border-ocean-200 p-1 dark:border-ocean-700" role="group" aria-label="Filter households by usage">
                {([['ALL', 'All'], ['HIGH', 'High Usage'], ['NORMAL', 'Normal']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCompareFilter(value)}
                    aria-pressed={compareFilter === value}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      compareFilter === value
                        ? 'bg-aqua-600 text-white'
                        : 'text-ocean-500 hover:bg-ocean-100 dark:text-ocean-400 dark:hover:bg-ocean-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {filteredComparisonRows.length === 0 ? (
              <EmptyState title="No matching households" description="Try a different search or filter." icon={Search} />
            ) : (
              <HouseholdUsageBarChart data={scopedTopConsumers} />
            )}
          </div>
        </>
      )}

      {/* ---------------- Manual reading + Bulk CSV upload ---------------- */}
      <div id="log-reading-section" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-h3 mb-4 flex items-center gap-2"><Droplets size={16} className="text-aqua-500" /> Log a Manual Reading</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="label label-required" htmlFor="householdId">Household</label>
              <select id="householdId" className="input" {...register('householdId')}>
                <option value="">Select household</option>
                {households?.map((h) => (
                  <option key={h.id} value={h.id}>{h.unitNumber} — {h.apartmentName}</option>
                ))}
              </select>
              {errors.householdId && <p className="field-error"><AlertCircle size={12} /> {errors.householdId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label label-required" htmlFor="readingDate">Reading Date</label>
                <input id="readingDate" type="date" className="input" {...register('readingDate')} />
                {errors.readingDate && <p className="field-error"><AlertCircle size={12} /> {errors.readingDate.message}</p>}
              </div>
              <div>
                <label className="label label-required" htmlFor="meterReadingKl">Meter Reading (kL)</label>
                <input id="meterReadingKl" type="number" step="0.01" className="input" {...register('meterReadingKl')} />
                {errors.meterReadingKl && <p className="field-error"><AlertCircle size={12} /> {errors.meterReadingKl.message}</p>}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="remarks">Remarks (optional)</label>
              <input id="remarks" className="input" {...register('remarks')} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
              <Droplets size={16} /> {isSubmitting ? 'Logging...' : 'Log Reading'}
            </button>
          </form>
        </div>

        <div id="csv-upload-section" className="card p-6">
          <h2 className="text-h3 mb-1 flex items-center gap-2"><Upload size={16} className="text-aqua-500" /> Bulk Upload Water Readings</h2>
          <p className="helper-text mb-1">Upload multiple meter readings at once.</p>
          <p className="helper-text mb-4">
            Download the template below, fill in the reading date and meter reading for each household, then
            upload the same file here — or use a plain CSV with columns:{' '}
            <code className="rounded bg-ocean-100 px-1 py-0.5 dark:bg-ocean-800">household_id,reading_date,meter_reading_kl,remarks</code>
            {' '}· Date format: <code className="rounded bg-ocean-100 px-1 py-0.5 dark:bg-ocean-800">YYYY-MM-DD</code>
            {' '}· Meter unit: kL
          </p>

          <button
            type="button"
            onClick={downloadTemplate}
            disabled={isDownloadingTemplate || householdsLoading}
            className="btn-secondary btn-sm mb-4 w-full sm:w-auto"
          >
            {isDownloadingTemplate ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Downloading...
              </>
            ) : (
              <>
                <Download size={14} /> Download Excel Template
              </>
            )}
          </button>

          {!pendingFile ? (
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void selectFile(file);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                isDragging
                  ? 'border-aqua-500 bg-aqua-50 dark:bg-aqua-500/10'
                  : 'border-ocean-200 hover:border-aqua-400 hover:bg-ocean-50/50 dark:border-ocean-700 dark:hover:bg-ocean-800/30'
              }`}
            >
              <Upload className="mb-2 text-aqua-500" size={28} />
              <span className="text-sm font-medium text-ocean-700 dark:text-ocean-200">
                Drag &amp; drop your file here, or click to browse
              </span>
              <span className="text-caption mt-1">.xlsx (from the template) or .csv files</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void selectFile(file);
                }}
              />
            </label>
          ) : (
            <div className="rounded-xl border border-ocean-200 p-4 dark:border-ocean-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-aqua-50 text-aqua-600 dark:bg-aqua-500/10 dark:text-aqua-300">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ocean-900 dark:text-white">{pendingFile.name}</p>
                  <p className="text-caption">{formatBytes(pendingFile.size)}</p>
                </div>
                {!uploadCsvMutation.isPending && (
                  <button type="button" onClick={clearPendingFile} className="rounded p-1 text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-800" aria-label="Remove file">
                    <X size={16} />
                  </button>
                )}
              </div>
              {uploadCsvMutation.isPending ? (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ocean-100 dark:bg-ocean-800">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-aqua-500" />
                  </div>
                  <p className="text-caption mt-1.5">Uploading and validating rows...</p>
                </div>
              ) : (
                <button type="button" onClick={startUpload} className="btn-primary btn-sm mt-3 w-full">
                  <Upload size={13} /> Upload &amp; Import
                </button>
              )}
            </div>
          )}

          {csvResult && (
            <div className="mt-4 space-y-3">
              {csvResult.errorCount === 0 && csvResult.duplicateCount === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <CheckCircle2 size={16} /> Upload completed — {csvResult.successCount} reading{csvResult.successCount === 1 ? '' : 's'} imported successfully.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
                    <CheckCircle2 size={16} className="mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">{csvResult.successCount}</p>
                    <p className="text-caption">Succeeded</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
                    <Copy size={16} className="mx-auto mb-1 text-amber-600 dark:text-amber-400" />
                    <p className="text-lg font-semibold text-amber-700 dark:text-amber-300">{csvResult.duplicateCount}</p>
                    <p className="text-caption">Duplicates</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 dark:bg-red-500/10">
                    <AlertCircle size={16} className="mx-auto mb-1 text-status-critical" />
                    <p className="text-status-critical text-lg font-semibold">{csvResult.errorCount}</p>
                    <p className="text-caption">Errors</p>
                  </div>
                </div>
              )}
              <p className="text-caption text-center">{csvResult.totalRows} row{csvResult.totalRows === 1 ? '' : 's'} processed</p>
              {csvResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/30 dark:bg-red-500/10">
                  <p className="mb-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
                    {csvResult.errors.length} row{csvResult.errors.length === 1 ? '' : 's'} need attention
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-red-700 dark:text-red-300">
                    {csvResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------------- Recent Water Readings ---------------- */}
      <div className="card p-6">
        <h2 className="text-h3 mb-4">Recent Water Readings</h2>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400" />
            <input
              className="input pl-8"
              placeholder="Search unit or date..."
              value={recentSearch}
              onChange={(e) => setRecentSearch(e.target.value)}
              aria-label="Search recent readings"
            />
          </div>
          <select
            className="input w-52"
            value={recentHouseholdId}
            onChange={(e) => setRecentHouseholdId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            aria-label="Filter by household"
          >
            <option value="ALL">All households</option>
            {households?.map((h) => (
              <option key={h.id} value={h.id}>{h.unitNumber} — {h.apartmentName}</option>
            ))}
          </select>
          <div className="flex gap-1 rounded-lg border border-ocean-200 p-1 dark:border-ocean-700" role="group" aria-label="Filter by status">
            {([['ALL', 'All'], ['HIGH', 'High Usage'], ['NORMAL', 'Normal']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRecentStatusFilter(value)}
                aria-pressed={recentStatusFilter === value}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  recentStatusFilter === value
                    ? 'bg-aqua-600 text-white'
                    : 'text-ocean-500 hover:bg-ocean-100 dark:text-ocean-400 dark:hover:bg-ocean-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {recentLoading && (
          <div className="table-shell">
            <TableSkeleton rows={5} cols={6} />
          </div>
        )}

        {!recentLoading && recentError && (
          <EmptyState
            icon={AlertTriangle}
            title="Unable to load water usage data"
            description="Please try again."
            action={{ label: 'Retry', onClick: () => recentRefetch() }}
          />
        )}

        {!recentLoading && !recentError && recentLogsRaw.length === 0 && (
          <EmptyState
            icon={Droplets}
            title="No meter readings yet"
            description="Readings will appear here once logged manually or imported via CSV."
            action={{ label: 'Log Reading', onClick: () => scrollToId('log-reading-section') }}
          />
        )}

        {!recentLoading && !recentError && recentLogsRaw.length > 0 && filteredRecentLogs.length === 0 && (
          <EmptyState title="No matching readings" description="Try a different search or filter." icon={Search} />
        )}

        {!recentLoading && !recentError && filteredRecentLogs.length > 0 && (
          <div className="table-shell">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Household</th>
                  <th>Date</th>
                  <th>Reading (kL)</th>
                  <th>Usage (kL)</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecentLogs.map((log) => {
                  const isHigh = highUsageThreshold != null && log.consumptionKl > highUsageThreshold;
                  return (
                    <tr key={log.id}>
                      <td className="font-medium text-ocean-900 dark:text-white">{log.unitNumber}</td>
                      <td>{formatDate(log.readingDate)}</td>
                      <td>{formatIndianNumber(log.meterReadingKl, 2)}</td>
                      <td>{formatIndianNumber(log.consumptionKl, 2)}</td>
                      <td><span className={isHigh ? 'badge-critical' : 'badge-healthy'}>{isHigh ? 'High Usage' : 'Normal'}</span></td>
                      <td><span className="badge-neutral">{log.source}</span></td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="rounded p-1.5 text-ocean-400 hover:bg-red-50 hover:text-status-critical dark:hover:bg-red-500/10"
                          onClick={() => setPendingDeleteId(log.id)}
                          aria-label="Delete usage log"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pendingDeleteId != null && (
        <ConfirmDialog
          title="Delete this usage log entry?"
          description="This meter reading will be permanently removed and cannot be recovered."
          confirmLabel="Delete"
          danger
          loading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}
