"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { CircleDot, Users, Clock, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/decor/Reveal";
import {
  MINUTES_DAILY_TOTAL,
  cumulativeNow,
  decimalHour,
  presenceFraction,
  ratePerHour,
} from "@/lib/day-activity";

type Mode = "allTime" | "today" | "live";

interface Stat {
  icon: typeof CircleDot;
  base: number;
  label: string;
  mode: Mode;
}

const STATS: Stat[] = [
  { icon: CircleDot, base: 248910, label: "Rounds offered in all", mode: "allTime" },
  { icon: Users, base: 90, label: "Devotees chanting now", mode: "live" },
  { icon: Clock, base: MINUTES_DAILY_TOTAL, label: "Minutes of japa today", mode: "today" },
];

function initialFor(mode: Mode, base: number): number {
  if (mode === "allTime") return base;
  if (mode === "today") return cumulativeNow(base);
  return Math.max(1, Math.round(base * presenceFraction(decimalHour())));
}

function LiveStat({
  icon: Icon,
  base,
  label,
  mode,
  active,
}: Stat & { active: boolean }) {
  const reduce = useReducedMotion();
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    const initial = initialFor(mode, base);

    const tick = () => {
      if (mode === "live") {
        // Presence drifts with the time of day, jittered as devotees come and go.
        const target =
          Math.round(base * presenceFraction(decimalHour())) +
          Math.round((Math.random() * 2 - 1) * 2.5);
        setDisplay(Math.max(1, target));
        timer.current = setTimeout(tick, 3500 + Math.random() * 2500);
      } else if (mode === "today") {
        // Accumulate at the time-of-day rate — brisk at dawn, gentle by midday.
        const intervalSec = 1.4 + Math.random() * 1.4;
        const rph = ratePerHour(base, decimalHour());
        const incr = Math.max(1, Math.round((rph * intervalSec) / 3600));
        setDisplay((d) => d + incr);
        timer.current = setTimeout(tick, intervalSec * 1000);
      } else {
        // All-time total: a steady, occasional climb.
        setDisplay((d) => d + 1);
        timer.current = setTimeout(tick, 6000 + Math.random() * 10000);
      }
    };

    if (reduce) {
      setDisplay(initial);
      return;
    }

    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    const controls = animate(count, initial, {
      duration: 1.8,
      ease: "easeOut",
      onComplete: tick,
    });
    return () => {
      controls.stop();
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="glass-card flex h-full flex-col items-center gap-2 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="font-heading text-[clamp(1.5rem,4vw,2rem)] font-semibold tabular-nums text-heading">
        {display.toLocaleString()}
      </span>
      <span className="font-body text-body-sm text-muted">{label}</span>
    </div>
  );
}

/** Live "sangha in practice" band — framed as a shared, growing offering. */
export function SanghaStats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="mx-auto max-w-container px-4 pt-12 pb-4">
      <Reveal>
        <p className="mb-2 text-center font-heading text-h3 text-heading">
          Devotees in contribution
        </p>
        <p className="mx-auto mb-8 max-w-content text-center font-body text-body text-muted">
          A living stream of devotion — every session you offer joins the count.
        </p>
      </Reveal>
      <div ref={ref} className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <LiveStat {...s} active={inView} />
          </Reveal>
        ))}
      </div>
      <Reveal>
        <div className="mt-8 flex justify-center">
          <a href="#offer" className="btn-secondary h-11 gap-2 px-6 text-body-sm">
            Add your voice
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
