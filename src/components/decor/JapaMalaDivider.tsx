/** §14.1 Japa mala bead divider — 10 beads + central meru. Decorative. */
export function JapaMalaDivider() {
  const beads = [10, 30, 50, 70, 90, 110, 130, 150, 170, 190];
  return (
    <div className="flex justify-center py-2">
      <svg width="200" height="16" viewBox="0 0 200 16" aria-hidden="true">
        <line x1="10" y1="8" x2="190" y2="8" stroke="var(--color-border)" strokeWidth="1.5" />
        {beads.map((cx) => (
          <circle key={cx} cx={cx} cy="8" r="4" fill="var(--color-secondary)" opacity="0.5" />
        ))}
        <circle cx="100" cy="8" r="6" fill="var(--color-secondary)" opacity="0.8" />
      </svg>
    </div>
  );
}
