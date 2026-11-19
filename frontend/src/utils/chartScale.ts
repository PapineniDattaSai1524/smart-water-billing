/**
 * Computes a readable Y-axis scale from real chart data -- the classic "nice
 * numbers for graph labels" algorithm (Heckbert), rather than a hardcoded
 * range or a charting library's un-tuned auto-domain.
 *
 * Root-cause fix for the Monthly Bill Trend chart's misleading axis: Recharts'
 * `domain={[0, 'auto']}` combined with `allowDecimals={false}` rounds its
 * upper bound up to a large, evenly-divisible number (e.g. 14,000) regardless
 * of how close the actual data max is to it, so a chart of bills in the
 * hundreds/low-thousands could show ticks up to 14K. This computes the axis
 * directly from `Math.max(...values)` with sensible padding instead.
 */

/** Rounds `range` up to a "nice" number: 1, 2, 5, or 10 times a power of 10. */
function niceNumber(range: number, round: boolean): number {
  if (range <= 0) return 1;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 5) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * 10 ** exponent;
}

export interface NiceAxisScale {
  /** Y-axis upper bound to pass to `domain={[0, max]}`. */
  max: number;
  /** Evenly-spaced tick values from 0 to `max`, inclusive, to pass to `ticks={...}`. */
  ticks: number[];
}

/**
 * Given the real data's maximum value, returns a rounded-up axis max and a
 * small set of evenly-spaced tick values that actually reflect that data's
 * scale (e.g. a max bill of ₹1,248 yields ticks like 0/400/800/1200/1600,
 * not 0/3.5K/7K/10.5K/14K).
 */
export function computeNiceAxisScale(maxValue: number, targetTickCount = 4): NiceAxisScale {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return { max: 1, ticks: [0, 1] };
  }

  // ~15% headroom above the real max so the highest point isn't flush against
  // the top of the chart, then round that padded range to a nice step size.
  const paddedMax = maxValue * 1.15;
  const rawStep = paddedMax / targetTickCount;
  const step = niceNumber(rawStep, true);
  const niceMax = Math.ceil(paddedMax / step) * step;

  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) {
    ticks.push(Math.round(v));
  }
  return { max: niceMax, ticks };
}
