/** §14.1 Lotus petal section divider — purely decorative. */
export function LotusDivider() {
  return (
    <div className="lotus-divider">
      <svg width="240" height="24" viewBox="0 0 240 24" aria-hidden="true">
        <line x1="0" y1="12" x2="90" y2="12" stroke="var(--color-border)" strokeWidth="1" />
        <line x1="150" y1="12" x2="240" y2="12" stroke="var(--color-border)" strokeWidth="1" />
        <ellipse cx="100" cy="12" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.5" transform="rotate(-20 100 12)" />
        <ellipse cx="110" cy="12" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.6" transform="rotate(-10 110 12)" />
        <ellipse cx="120" cy="12" rx="5" ry="10" fill="var(--color-secondary)" opacity="0.7" />
        <ellipse cx="130" cy="12" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.6" transform="rotate(10 130 12)" />
        <ellipse cx="140" cy="12" rx="5" ry="9" fill="var(--color-secondary)" opacity="0.5" transform="rotate(20 140 12)" />
      </svg>
    </div>
  );
}
