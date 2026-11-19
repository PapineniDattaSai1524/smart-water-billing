import { useState } from 'react';
import { FileDown, FileSpreadsheet, Receipt } from 'lucide-react';
import { analyticsService } from '@/services/analyticsService';
import ErrorBanner from '@/components/common/ErrorBanner';
import { getApiErrorMessage } from '@/utils/apiError';

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (key: string, fn: () => Promise<void>) => {
    setDownloading(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to generate this report right now. Please try again.'));
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      key: 'invoices',
      title: 'Invoices Report',
      description: 'Every invoice across your apartments — amount, status, due date and payment info.',
      icon: Receipt,
      run: () => analyticsService.exportInvoicesCsv(),
    },
    {
      key: 'usage',
      title: 'Water Usage Report',
      description: 'Every meter reading and consumption record across your apartments.',
      icon: FileSpreadsheet,
      run: () => analyticsService.exportUsageCsv(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Reports</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">
          Export data as CSV — opens directly in Excel, Google Sheets, or any spreadsheet tool.
        </p>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reports.map(({ key, title, description, icon: Icon, run }, i) => (
          <div
            key={key}
            className="glass-card motion-safe:animate-slide-up flex flex-col gap-3 p-6"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-aqua-50 text-aqua-600 dark:bg-aqua-950 dark:text-aqua-300">
              <Icon size={20} />
            </div>
            <h2 className="font-semibold text-ocean-900 dark:text-white">{title}</h2>
            <p className="text-sm text-ocean-500 dark:text-ocean-400">{description}</p>
            <button
              type="button"
              className="btn-secondary mt-2 self-start disabled:opacity-60"
              disabled={downloading === key}
              onClick={() => handleExport(key, run)}
            >
              <FileDown size={16} className="mr-2" />
              {downloading === key ? 'Preparing...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
