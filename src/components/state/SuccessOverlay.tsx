"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SuccessOverlayProps {
  onDismiss: () => void;
  /** Auto-dismiss delay in ms (design.md §7.9 → 8s). */
  autoDismissMs?: number;
}

const PETALS = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);

/** §14.7 Lotus-bloom success overlay shown after an offering is received. */
export function SuccessOverlay({
  onDismiss,
  autoDismissMs = 8000,
}: SuccessOverlayProps) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [onDismiss, autoDismissMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center backdrop-blur-sm"
    >
      <span className="sr-only">
        Your chanting session has been offered successfully.
      </span>

      <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
        <g style={{ transformOrigin: "80px 110px" }}>
          {PETALS.map((angle, i) => (
            <motion.ellipse
              key={angle}
              cx="80"
              cy="70"
              rx="14"
              ry="38"
              fill="var(--color-secondary)"
              opacity={0.85}
              transform={`rotate(${angle} 80 110)`}
              initial={reduce ? { scaleY: 1, opacity: 0.85 } : { scaleY: 0.1, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 0.85 }}
              transition={{
                duration: 0.8,
                delay: reduce ? 0 : i * 0.1,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{ transformOrigin: "80px 110px" }}
            />
          ))}
          <circle cx="80" cy="110" r="12" fill="var(--color-primary)" />
        </g>
      </svg>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.2, duration: 0.4 }}
        className="text-gold-foil font-heading text-[clamp(2rem,7vw,3rem)]"
      >
        Hare Krishna!
      </motion.h2>
      <p className="max-w-content font-body text-body-lg text-foreground">
        Thank you for your contribution!
      </p>
      <button type="button" onClick={onDismiss} className="btn-secondary mt-2">
        Submit Another Session
      </button>
    </div>
  );
}
