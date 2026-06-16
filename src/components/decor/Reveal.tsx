"use client";

import { motion, useReducedMotion } from "framer-motion";

/** §9 Section reveal: fade + slide up on scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduce ? 0.15 : 0.4, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
