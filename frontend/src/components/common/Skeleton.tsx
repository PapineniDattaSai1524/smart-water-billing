import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/** A single shimmering block. Compose these for page-specific skeleton layouts. */
export function Skeleton({ className = 'h-4 w-full', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

/** Matches the shape of KpiCard: icon block + two lines of text. */
export function KpiCardSkeleton() {
  return (
    <div className="kpi-card">
      <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

/** Matches a card containing a Recharts chart. */
export function ChartSkeleton({ heightClass = 'h-[260px]' }: { heightClass?: string }) {
  return (
    <div className={`flex items-end gap-2 ${heightClass}`}>
      {[40, 65, 50, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

/** Matches a simple table: header row + N body rows. */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-5">
      <Skeleton className="h-4 w-1/4" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
