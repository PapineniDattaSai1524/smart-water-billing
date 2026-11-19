import { type ElementType, type ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import clsx from 'clsx';

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in ms, applied via inline style so it composes with any number of items. */
  delay?: number;
  className?: string;
  as?: ElementType;
}

/**
 * Fades + rises content into place the first time it enters the viewport.
 * Shared across the marketing homepage and the authenticated app so both use
 * the same entrance-animation system. Motion-reduced users see content in
 * its final position immediately (see useInView).
 */
export default function Reveal({ children, delay = 0, className, as: Tag = 'div' }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={clsx(
        'transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        className,
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </Tag>
  );
}
