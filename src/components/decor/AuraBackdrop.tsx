"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Flowing organic light — soft saffron/gold/rose blobs drifting slowly behind
 * the hero so the space reads as warm and alive rather than empty. Decorative;
 * collapses to a still gradient wash when reduced motion is requested.
 */
const BLOBS = [
  {
    color: "rgba(232,104,10,0.22)",
    size: 460,
    top: "-8%",
    left: "-6%",
    drift: { x: [0, 28, -10, 0], y: [0, -18, 14, 0] },
    duration: 18,
  },
  {
    color: "rgba(212,160,23,0.20)",
    size: 520,
    top: "20%",
    left: "62%",
    drift: { x: [0, -26, 12, 0], y: [0, 20, -12, 0] },
    duration: 22,
  },
  {
    color: "rgba(194,88,122,0.16)",
    size: 380,
    top: "58%",
    left: "12%",
    drift: { x: [0, 18, -16, 0], y: [0, -14, 10, 0] },
    duration: 26,
  },
];

export function AuraBackdrop() {
  const reduce = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {BLOBS.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 40% 40%, ${b.color}, transparent 70%)`,
            filter: "blur(28px)",
          }}
          animate={reduce ? undefined : b.drift}
          transition={
            reduce
              ? undefined
              : {
                  duration: b.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}
