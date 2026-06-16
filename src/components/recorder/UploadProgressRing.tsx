"use client";

interface UploadProgressRingProps {
  /** 0–100 offering progress. */
  progress: number;
}

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** §14.5 Gold upload progress ring drawn around the recorder button. */
export function UploadProgressRing({ progress }: UploadProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;

  return (
    <>
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 88 88"
        aria-hidden="true"
      >
        <circle
          cx="44"
          cy="44"
          r={RADIUS}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="3"
        />
        <circle
          cx="44"
          cy="44"
          r={RADIUS}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <span
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Offering your session"
        className="sr-only"
      >
        {Math.round(clamped)}%
      </span>
    </>
  );
}
