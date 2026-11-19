import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Compact "Showing X-Y of N" pager. This paginates an array that's already
 * fully loaded client-side (the underlying API has no page/size params) -- it
 * only controls how many rows render at once, it never implies a real
 * server-side page request. */
export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  for (let p = 1; p <= pageCount; p += 1) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-caption">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        <button
          type="button"
          className="btn-ghost btn-sm px-2"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) => (p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-ocean-400">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={
              p === page
                ? 'rounded-lg bg-aqua-600 px-2.5 py-1 text-xs font-semibold text-white'
                : 'rounded-lg px-2.5 py-1 text-xs font-medium text-ocean-600 hover:bg-ocean-100 dark:text-ocean-300 dark:hover:bg-ocean-800'
            }
          >
            {p}
          </button>
        )))}
        <button
          type="button"
          className="btn-ghost btn-sm px-2"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
