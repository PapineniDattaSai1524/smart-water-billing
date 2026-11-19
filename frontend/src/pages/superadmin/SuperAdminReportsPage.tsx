import { useState } from 'react';
import { FileDown, Building2 } from 'lucide-react';
import { platformService } from '@/services/platformService';

export default function SuperAdminReportsPage() {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      await platformService.exportApartmentsCsv();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="motion-safe:animate-slide-up">
        <h1 className="text-xl font-semibold text-ocean-900 dark:text-white">Reports</h1>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">Platform-wide exports for offline analysis.</p>
      </div>

      <div className="glass-card card-interactive flex flex-col gap-3 p-6 sm:max-w-sm motion-safe:animate-slide-up" style={{ animationDelay: '80ms' }}>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-aqua-50 text-aqua-600 dark:bg-aqua-950 dark:text-aqua-300">
          <Building2 size={20} />
        </div>
        <h2 className="font-semibold text-ocean-900 dark:text-white">Apartments &amp; Communities</h2>
        <p className="text-sm text-ocean-500 dark:text-ocean-400">
          Every apartment on the platform — city, state, units, community and administrator.
        </p>
        <button className="btn-secondary mt-2 self-start" disabled={downloading} onClick={handleExport}>
          <FileDown size={16} className="mr-2" />
          {downloading ? 'Preparing...' : 'Download CSV'}
        </button>
      </div>
    </div>
  );
}
