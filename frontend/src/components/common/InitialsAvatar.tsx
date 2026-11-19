import clsx from 'clsx';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

interface InitialsAvatarProps {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

/** Compact initials avatar (e.g. "Geddamuri Swathi" -> "GS") used wherever a
 * person's name needs a visual anchor without a full profile-photo system,
 * consistent with the initials badge already used in the navbar's profile menu. */
export default function InitialsAvatar({ name, size = 'md', className }: InitialsAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-aqua-100 font-semibold text-aqua-700 dark:bg-aqua-500/20 dark:text-aqua-300',
        size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs',
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
