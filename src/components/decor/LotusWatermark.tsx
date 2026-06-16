/** §14.2 Full-bleed lotus watermark behind all content (ISKCON-style bloom). */
export function LotusWatermark() {
  // Radiating petal whose base sits at the centre (200,200), tip pointing up.
  const petal = "M200 200 C 168 150, 172 70, 200 28 C 228 70, 232 150, 200 200 Z";
  const outer = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
  // Inner ring offset by half a step, slightly shorter petals.
  const innerPetal =
    "M200 200 C 180 168, 182 116, 200 92 C 218 116, 220 168, 200 200 Z";
  const inner = Array.from({ length: 12 }, (_, i) => (i * 360) / 12 + 15);

  return (
    <div className="page-mandala-bg" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="h-full w-full">
        <g fill="none" stroke="var(--color-foreground)" strokeWidth="1.5">
          {outer.map((a) => (
            <path key={`o${a}`} d={petal} transform={`rotate(${a} 200 200)`} />
          ))}
          {inner.map((a) => (
            <path
              key={`i${a}`}
              d={innerPetal}
              transform={`rotate(${a} 200 200)`}
            />
          ))}
          <circle cx="200" cy="200" r="22" />
        </g>
      </svg>
    </div>
  );
}
