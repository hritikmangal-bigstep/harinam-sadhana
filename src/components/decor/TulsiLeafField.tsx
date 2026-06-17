"use client";

import { motion, useReducedMotion } from "framer-motion";

const LEAVES = [
  { x: 8,  delay: 0,   startTop: 80 },
  { x: 20, delay: 1.5, startTop: 60 },
  { x: 33, delay: 3,   startTop: 40 },
  { x: 47, delay: 0.8, startTop: 15 },
  { x: 60, delay: 2.2, startTop: 70 },
  { x: 72, delay: 4,   startTop: 50 },
  { x: 85, delay: 1.1, startTop: 30 },
  { x: 92, delay: 3.4, startTop: 5  },
];

function Leaf() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true">
      <ellipse cx="8" cy="10" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.5" transform="rotate(-10 8 10)" />
      <line x1="8" y1="1" x2="8" y2="19" stroke="var(--color-secondary)" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

/** §14.2 Floating tulsi leaves drifting upward behind the hero. Decorative. */
export function TulsiLeafField() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {LEAVES.map((l, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: `${l.x}%`, top: `${l.startTop}%`, opacity: 0.08 }}
          >
            <Leaf />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {LEAVES.map((l, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ left: `${l.x}%`, top: `${l.startTop}%` }}
          initial={{ y: 0, opacity: 0.3, rotate: 0 }}
          animate={{ y: -520, opacity: [0.3, 0.6, 0.5, 0], rotate: 40 }}
          transition={{ duration: 9, delay: l.delay, repeat: Infinity, ease: "easeOut" }}
        >
          <Leaf />
        </motion.span>
      ))}
    </div>
  );
}
