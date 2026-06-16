"use client";

import type React from "react";
import { motion, useReducedMotion } from "framer-motion";

/** §14.5 Concentric aura rings radiating from the recorder while recording. */
export function AuraRings() {
  const reduce = useReducedMotion();

  // Margin-based centering: avoids conflicting with Framer Motion's scale transform.
  const ringStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -36,
    marginLeft: -36,
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "2px solid var(--color-primary)",
  };

  if (reduce) {
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none"
        style={{ ...ringStyle, opacity: 0.2 }}
      />
    );
  }

  return (
    <>
      {[0, 0.66, 1.33].map((delay) => (
        <motion.span
          key={delay}
          aria-hidden="true"
          className="pointer-events-none"
          style={ringStyle}
          initial={{ scale: 1, opacity: 0.35 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 2, delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </>
  );
}
