/**
 * Compass mark for the Robotics Compass wordmark. Inherits color from
 * `currentColor`; the needle uses the accent token via `text-accent` on a
 * wrapper. Decorative — labelled by the wordmark, so marked aria-hidden.
 */
export function CompassLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9.25"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.55"
      />
      {/* compass needle: pointing north-east, accent-filled */}
      <path d="M12 12 L16 8 L12.8 12.5 Z" fill="currentColor" />
      <path d="M12 12 L8 16 L11.2 11.5 Z" fill="currentColor" opacity="0.4" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}
