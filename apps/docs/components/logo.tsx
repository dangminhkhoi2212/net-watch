/** A signal trace that ends in a dot: the library measures a connection and reports one state. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 14h4l2.5-7 3.5 12 2.5-8H17" />
      <circle cx="20.5" cy="11" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
