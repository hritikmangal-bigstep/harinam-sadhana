"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import {
  ROUNDS_DAILY_TOTAL,
  cumulativeNow,
  decimalHour,
  ratePerHour,
} from "@/lib/day-activity";

/**
 * §14.3 "Rounds offered today" — a count that accumulates across the day so the
 * sangha feels live. Devotees chant in the early morning (brahma-muhurta), so
 * the figure surges from dawn, clears ~8,000 before 9 AM, then climbs gently
 * the rest of the day. While the page is open, fresh "arrivals" tick the number
 * up — often in the morning, rarely in the afternoon. Resets at midnight.
 */
export function RoundsBadge({
  dailyTarget = ROUNDS_DAILY_TOTAL,
}: {
  dailyTarget?: number;
}) {
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initial = cumulativeNow(dailyTarget);

    // Live arrivals: schedule the next chant to land, paced by the time of day.
    const scheduleArrival = () => {
      const rph = ratePerHour(dailyTarget, decimalHour());
      const meanDelay = 3_600_000 / Math.max(rph, 6); // ≥ ~1 every 10 min
      const delay = meanDelay * (0.5 + Math.random()); // organic jitter
      timer.current = setTimeout(() => {
        setDisplay((d) => d + 1);
        scheduleArrival();
      }, delay);
    };

    if (reduce) {
      setDisplay(initial);
      return;
    }

    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    const controls = animate(count, initial, {
      duration: 1.6,
      ease: "easeOut",
      onComplete: scheduleArrival,
    });
    return () => {
      controls.stop();
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyTarget]);

  return (
    <span className="rounds-badge inline-flex items-center gap-1.5 rounded-pill border border-primary/30 bg-primary-light px-4 py-1.5 font-body text-body-sm font-medium text-primary">
      <span aria-hidden="true">✦</span>
      <span aria-live="polite">
        {display.toLocaleString()} rounds offered today
      </span>
    </span>
  );
}
