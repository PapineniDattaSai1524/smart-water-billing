import { useEffect, useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import clsx from 'clsx';
import { invoiceService } from '@/services/invoiceService';
import type { Invoice } from '@/utils/types';

type Phase = 'idle' | 'downloading' | 'done' | 'failed';

// Same real backend call as before (GET /invoices/{id}/pdf, streamed as a blob) --
// this only adds a small in-button success/failure phase on top of it.
export default function InvoicePdfButton({
  invoice,
  variant = 'secondary',
  fullWidth = false,
}: {
  invoice: Invoice;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(() => setPhase('idle'), 2200);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleDownload = async () => {
    setPhase('downloading');
    try {
      await invoiceService.downloadPdf(invoice.id, `invoice-${invoice.billingMonth}`);
      setPhase('done');
    } catch {
      setPhase('failed');
    }
  };

  return (
    <div className={fullWidth ? 'w-full' : 'inline-flex flex-col items-end gap-1'}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={phase === 'downloading'}
        className={clsx(variant === 'primary' ? 'btn-primary' : 'btn-secondary', 'btn-sm', fullWidth && 'w-full')}
      >
        {phase === 'downloading' && <Loader2 size={13} className="animate-spin" />}
        {phase === 'done' && <Check size={13} />}
        {(phase === 'idle' || phase === 'failed') && <Download size={13} />}
        {phase === 'downloading' ? 'Downloading...' : phase === 'done' ? 'Downloaded' : 'Download PDF'}
      </button>
      {phase === 'failed' && <p className="field-error">Couldn&apos;t load the PDF. Please try again.</p>}
    </div>
  );
}
