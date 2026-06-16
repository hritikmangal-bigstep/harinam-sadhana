/**
 * Realistic side-view sacred lotus (Nelumbo nucifera).
 * 9 petals layered in three depths, a grooved receptacle, and visible
 * stamens — all in SVG so it scales crisply at any size.
 */

// Shared path geometry — each layer reuses one outline, varying only the
// rotation/fill/stroke/opacity so the whole flower stays in sync.
const SEPAL_PATH =
  "M50 76 C47 70 43 60 46 50 C47 46 50 46 50 48 C50 46 53 46 54 50 C57 60 53 70 50 76 Z";
const SHORT_PETAL_PATH =
  "M50 76 C 45 68, 37 58, 38 46 C 39 37, 50 33, 50 33 C 50 33, 61 37, 62 46 C 63 58, 55 68, 50 76 Z";
const TALL_PETAL_PATH =
  "M50 76 C 44 66, 35 50, 37 34 C 39 22, 50 18, 50 18 C 50 18, 61 22, 63 34 C 65 50, 56 66, 50 76 Z";

const SEPALS = [
  { rot: -58, op: 0.75 },
  { rot: 58, op: 0.75 },
  { rot: -78, op: 0.55 },
  { rot: 78, op: 0.55 },
];

// Outer + mid-outer petals (pale rose), nearly horizontal to ≈±48°.
const OUTER_PETALS = [
  { rot: -70, op: 0.7 },
  { rot: 70, op: 0.7 },
  { rot: -48, op: 0.85 },
  { rot: 48, op: 0.85 },
];

// Inner-mid + front-inner petals (medium rose), tall and pointed.
const MID_PETALS = [
  { rot: -28, op: 0.92, vein: "M50 75 C49 65 48 50 48 34" },
  { rot: 28, op: 0.92, vein: "M50 75 C51 65 52 50 52 34" },
  { rot: -12, op: 1 },
  { rot: 12, op: 1 },
];

const STAMENS = [
  { x2: 43, y2: 63, cx: 43, cy: 62, anther: "#f59e0b" },
  { x2: 46, y2: 61, cx: 46, cy: 60, anther: "#f59e0b" },
  { x2: 50, y2: 60, cx: 50, cy: 59, anther: "#fbbf24" },
  { x2: 54, y2: 61, cx: 54, cy: 60, anther: "#f59e0b" },
  { x2: 57, y2: 63, cx: 57, cy: 62, anther: "#f59e0b" },
];
const STAMEN_X = [46, 48, 50, 52, 54];

export function LotusLogo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 90"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <defs>
        {/* Outer / back petals — very pale rose, almost ivory */}
        <linearGradient id="ls-po" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#fff0f4" />
          <stop offset="65%" stopColor="#f9c8d4" />
          <stop offset="100%" stopColor="#f0a0b8" />
        </linearGradient>
        {/* Mid petals — medium rose-pink */}
        <linearGradient id="ls-pm" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#fce7f0" />
          <stop offset="55%" stopColor="#e87898" />
          <stop offset="100%" stopColor="#d45880" />
        </linearGradient>
        {/* Centre petal — richest rose, saffron hint at root */}
        <linearGradient id="ls-pc" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#f9d8c0" />
          <stop offset="25%" stopColor="#e06888" />
          <stop offset="75%" stopColor="#c84870" />
          <stop offset="100%" stopColor="#be185d" />
        </linearGradient>
        {/* Receptacle top face — golden-green */}
        <linearGradient id="ls-rt" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#c8df68" />
          <stop offset="100%" stopColor="#88b830" />
        </linearGradient>
        {/* Receptacle rim — deeper green */}
        <linearGradient id="ls-rr" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#98c840" />
          <stop offset="100%" stopColor="#5a8820" />
        </linearGradient>
        {/* Stamen filaments */}
        <linearGradient id="ls-sf" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#e8a020" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        {/* Sepal (green leaf behind petals) */}
        <linearGradient id="ls-sep" x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#5a9828" />
          <stop offset="100%" stopColor="#a0c840" />
        </linearGradient>
      </defs>

      {/* ── SEPALS (green pointed base leaves, behind petals) ── */}
      {SEPALS.map((s) => (
        <path
          key={`sep-${s.rot}`}
          d={SEPAL_PATH}
          transform={`rotate(${s.rot} 50 76)`}
          fill="url(#ls-sep)"
          opacity={s.op}
        />
      ))}

      {/* ── OUTER + MID-OUTER PETALS (≈±70° to ±48°, pale rose) ── */}
      {OUTER_PETALS.map((p) => (
        <path
          key={`out-${p.rot}`}
          d={SHORT_PETAL_PATH}
          transform={`rotate(${p.rot} 50 76)`}
          fill="url(#ls-po)"
          stroke="#e0a0b0"
          strokeWidth="0.5"
          opacity={p.op}
        />
      ))}

      {/* ── INNER MID + FRONT INNER PETALS (≈±28° to ±12°, tall) ── */}
      {MID_PETALS.map((p) => (
        <g key={`mid-${p.rot}`}>
          <path
            d={TALL_PETAL_PATH}
            transform={`rotate(${p.rot} 50 76)`}
            fill="url(#ls-pm)"
            stroke="#c87890"
            strokeWidth="0.6"
            opacity={p.op}
          />
          {p.vein && (
            <path
              d={p.vein}
              transform={`rotate(${p.rot} 50 76)`}
              stroke="#b05870"
              strokeWidth="0.45"
              fill="none"
              opacity="0.22"
            />
          )}
        </g>
      ))}

      {/* ── CENTRE PETAL (upright, richest) ───────────────── */}
      <path
        d={TALL_PETAL_PATH}
        fill="url(#ls-pc)"
        stroke="#a83858"
        strokeWidth="0.7"
      />
      {/* Centre vein */}
      <path
        d="M50 75 C50 60 50 40 50 20"
        stroke="#8a2848"
        strokeWidth="0.55"
        fill="none"
        opacity="0.28"
      />
      {/* Two lateral veins */}
      <path
        d="M50 73 C48 64 44 52 43 42"
        stroke="#8a2848"
        strokeWidth="0.35"
        fill="none"
        opacity="0.18"
      />
      <path
        d="M50 73 C52 64 56 52 57 42"
        stroke="#8a2848"
        strokeWidth="0.35"
        fill="none"
        opacity="0.18"
      />

      {/* ── STAMENS (filaments + anthers, above receptacle) ── */}
      {STAMENS.map((s, i) => (
        <line
          key={`fil-${s.cx}`}
          x1={STAMEN_X[i]}
          y1="76"
          x2={s.x2}
          y2={s.y2}
          stroke="url(#ls-sf)"
          strokeWidth="0.8"
        />
      ))}
      {STAMENS.map((s) => (
        <ellipse
          key={`ant-${s.cx}`}
          cx={s.cx}
          cy={s.cy}
          rx="1.6"
          ry="1.0"
          fill={s.anther}
        />
      ))}

      {/* ── RECEPTACLE (flat-top dome with seed pores) ──────── */}
      {/* Dome body */}
      <path
        d="M37 78 Q38 72 50 72 Q62 72 63 78 Q62 84 50 84 Q38 84 37 78 Z"
        fill="url(#ls-rr)"
      />
      {/* Flat top surface */}
      <ellipse cx="50" cy="77" rx="13" ry="5" fill="url(#ls-rt)" />
      {/* Seed pore dots on the flat top */}
      <circle cx="44" cy="75.5" r="1.4" fill="#4a7020" opacity="0.75" />
      <circle cx="50" cy="74.8" r="1.4" fill="#4a7020" opacity="0.75" />
      <circle cx="56" cy="75.5" r="1.4" fill="#4a7020" opacity="0.75" />
      <circle cx="47" cy="78.0" r="1.2" fill="#4a7020" opacity="0.55" />
      <circle cx="53" cy="78.0" r="1.2" fill="#4a7020" opacity="0.55" />
      {/* Highlight on receptacle top */}
      <ellipse cx="50" cy="75" rx="7" ry="2" fill="white" opacity="0.15" />
    </svg>
  );
}
