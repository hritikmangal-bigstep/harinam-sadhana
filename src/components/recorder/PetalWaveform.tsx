"use client";

import { motion, useReducedMotion } from "framer-motion";

interface PetalWaveformProps {
  /** Normalized 0–100 amplitudes; alternating petals colour primary/secondary. */
  amplitudes: number[];
}

/** §14.5 Petal waveform — teardrop bars that scale with audio amplitude. */
export function PetalWaveform({ amplitudes }: PetalWaveformProps) {
  const reduce = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="flex h-12 items-center justify-center gap-1"
    >
      {amplitudes.map((amp, i) => {
        const color =
          i % 2 === 0 ? "var(--color-primary)" : "var(--color-secondary)";
        const height = reduce ? 16 : Math.max(8, (amp / 100) * 44);
        return (
          <motion.span
            key={i}
            className="rounded-full"
            style={{ width: 8, background: color, opacity: reduce ? 0.5 : 1 }}
            animate={{ height }}
            transition={{ duration: 0.08, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
