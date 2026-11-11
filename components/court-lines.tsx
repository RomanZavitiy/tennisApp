// A tennis court seen from above, drawn in the current text colour — the
// brand's decorative motif (redesign). Purely ornamental.
export function CourtLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 360 780"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      className={className}
    >
      {/* Doubles court, singles sidelines, net, service boxes. */}
      <rect x="2" y="2" width="356" height="776" />
      <path d="M47 2v776M313 2v776" />
      <path d="M2 390h356" strokeWidth="6" />
      <path d="M47 180h266M47 600h266M180 180v420" />
      <path d="M180 2v14M180 764v14" />
    </svg>
  );
}
