/** §14.3 Animated diya (oil lamp) with a flickering flame. Decorative. */
export function DiyaFlame({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flame-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBF0C0" />
          <stop offset="100%" stopColor="#E8680A" />
        </linearGradient>
      </defs>
      {/* flame */}
      <path
        className="diya-flame"
        d="M24 6 C20 14 22 18 24 22 C26 18 28 14 24 6 Z"
        fill="url(#flame-grad)"
        style={{ transformOrigin: "24px 22px" }}
      />
      {/* lamp bowl */}
      <path
        d="M10 30 C10 38 38 38 38 30 L34 30 C34 34 14 34 14 30 Z"
        fill="var(--color-secondary)"
      />
      <ellipse cx="24" cy="30" rx="14" ry="3" fill="var(--color-secondary)" />
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .diya-flame {
            animation: flame-flicker 1.8s ease-in-out infinite alternate;
            transform-origin: 24px 22px;
          }
        }
      `}</style>
    </svg>
  );
}
