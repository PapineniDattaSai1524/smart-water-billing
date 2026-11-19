export default function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-ocean-500 dark:text-ocean-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-aqua-200 border-t-aqua-600 dark:border-aqua-900 dark:border-t-aqua-400" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
