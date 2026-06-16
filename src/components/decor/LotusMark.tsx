interface LotusMarkProps {
  size?: number;
  className?: string;
  /** When true, exposes the lotus as a labelled image; otherwise decorative. */
  labelled?: boolean;
}

/**
 * ISKCON-style lotus emblem: a top-view lotus roundel with a ring of gold back
 * petals, a ring of saffron front petals, and a seed centre. Colours come from
 * the brand tokens so it sits in the saffron/gold palette.
 */
export function LotusMark({ size = 28, className, labelled }: LotusMarkProps) {
  // Petals radiate from the centre (24,24); base at centre, tip outward (up).
  const back = "M24 24 C 16 16, 17 7, 24 2 C 31 7, 32 16, 24 24 Z";
  const front = "M24 24 C 18.5 18.5, 19 11, 24 7 C 29 11, 29.5 18.5, 24 24 Z";
  const backAngles = Array.from({ length: 8 }, (_, i) => i * 45);
  const frontAngles = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? "ISKCON lotus" : undefined}
      aria-hidden={labelled ? undefined : "true"}
    >
      {/* enclosing ring */}
      <circle
        cx="24"
        cy="24"
        r="23"
        fill="none"
        stroke="var(--color-secondary)"
        strokeWidth="1.5"
      />
      <g fill="var(--color-secondary)">
        {backAngles.map((a) => (
          <path key={`b${a}`} d={back} transform={`rotate(${a} 24 24)`} />
        ))}
      </g>
      <g fill="var(--color-primary)">
        {frontAngles.map((a) => (
          <path key={`f${a}`} d={front} transform={`rotate(${a} 24 24)`} />
        ))}
      </g>
      <circle cx="24" cy="24" r="4.5" fill="var(--color-secondary)" />
      <circle cx="24" cy="24" r="2" fill="var(--color-primary)" />
    </svg>
  );
}
