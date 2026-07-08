/** Escudo estilizado — SVG propio, dominio público / uso libre en el proyecto. */
export function CrestIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 2L4 5v6c0 5.25 3.4 10.74 8 11 4.6-.26 8-5.75 8-11V5l-8-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 7v10M9 10h6M9 14h6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
