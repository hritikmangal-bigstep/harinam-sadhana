/**
 * Time-of-day models for the live "sangha activity" figures shared by the hero
 * rounds badge and the sangha stats band. Devotees chant most in the early
 * morning (brahma-muhurta) with a gentler evening return, so cumulative totals
 * surge from dawn and concurrent presence peaks around sunrise and dusk.
 */
export const DAWN = 4;
export const MORNING_END = 9;
const PRE_DAWN_SHARE = 0.03;
const MORNING_SHARE = 0.72;

/**
 * Aspirational end-of-day rounds total. With 72% offered by 9 AM this clears
 * ~10,800 rounds by 9 AM, then climbs gently to ~15,000 by midnight.
 */
export const ROUNDS_DAILY_TOTAL = 15000;
/** A round of 108 holy names takes roughly 8–9.5 minutes; use the midpoint. */
export const MINUTES_PER_ROUND = 8.75;
/** Minutes-of-japa tracks rounds × per-round minutes, so the two stay in step. */
export const MINUTES_DAILY_TOTAL = Math.round(
  ROUNDS_DAILY_TOTAL * MINUTES_PER_ROUND,
);

export function decimalHour(d: Date = new Date()): number {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/** Cumulative share (0..1) of a day's total offered by hour h. Monotonic. */
export function cumulativeFraction(h: number): number {
  if (h <= DAWN) return (h / DAWN) * PRE_DAWN_SHARE;
  if (h <= MORNING_END) {
    const p = (h - DAWN) / (MORNING_END - DAWN);
    // ease-out so it surges right after dawn, then settles toward 9 AM
    return PRE_DAWN_SHARE + (MORNING_SHARE - PRE_DAWN_SHARE) * (1 - (1 - p) ** 2);
  }
  const p = (h - MORNING_END) / (24 - MORNING_END);
  return MORNING_SHARE + (1 - MORNING_SHARE) * p;
}

export function cumulativeNow(total: number, d: Date = new Date()): number {
  return Math.round(total * cumulativeFraction(decimalHour(d)));
}

/** Expected events/hour implied by the cumulative curve at hour h. */
export function ratePerHour(total: number, h: number): number {
  if (h <= DAWN) return (total * PRE_DAWN_SHARE) / DAWN;
  if (h <= MORNING_END)
    return (total * (MORNING_SHARE - PRE_DAWN_SHARE)) / (MORNING_END - DAWN);
  return (total * (1 - MORNING_SHARE)) / (24 - MORNING_END);
}

/** Concurrent "presence" share (0..1): peaks at dawn and dusk, low at night. */
const PRESENCE_ANCHORS: [number, number][] = [
  [0, 0.12],
  [4, 0.22],
  [5, 0.7],
  [6, 1.0],
  [7, 0.95],
  [8, 0.8],
  [9, 0.62],
  [12, 0.42],
  [15, 0.38],
  [18, 0.6],
  [19, 0.72],
  [20, 0.6],
  [21, 0.44],
  [23, 0.2],
  [24, 0.12],
];

export function presenceFraction(h: number): number {
  for (let i = 0; i < PRESENCE_ANCHORS.length - 1; i++) {
    const [h0, v0] = PRESENCE_ANCHORS[i];
    const [h1, v1] = PRESENCE_ANCHORS[i + 1];
    if (h >= h0 && h <= h1) {
      const p = (h - h0) / (h1 - h0);
      return v0 + (v1 - v0) * p;
    }
  }
  return PRESENCE_ANCHORS[PRESENCE_ANCHORS.length - 1][1];
}
