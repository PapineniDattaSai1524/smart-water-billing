import { useEffect, useRef, useState } from 'react';

/**
 * Animates a numeric value counting up from 0 to `target` once, on mount /
 * whenever `target` changes to a new value. Pure display animation over a
 * real, already-fetched number -- never fabricates or rounds the underlying
 * amount, only the intermediate frames shown while animating.
 *
 * Respects prefers-reduced-motion: when the user has that set, the target
 * value is shown immediately with no animation.
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return target;
    }
    return 0;
  });
  const startedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setValue(0);
      return;
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setValue(target);
      return;
    }
    // Only animate the first time we see this target value (e.g. initial load),
    // not on every unrelated re-render.
    if (startedFor.current === target) return;
    startedFor.current = target;

    const start = performance.now();
    const from = 0;
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - (1 - progress) ** 3;
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
