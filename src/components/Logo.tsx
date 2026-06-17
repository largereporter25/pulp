// pulp.to-style fish mark + PULP wordmark in mono caps.
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 32" fill="none" aria-label="Pulp" style={{ display: "block" }}>
      {/* fish body */}
      <path
        d="M4 16c6-9 20-12 30-7 3 1.5 5 3.6 6 5.2 1.4-1.2 3.3-2.2 5-2.7-1 2.7-1 5.3 0 8-1.7-.5-3.6-1.5-5-2.7-1 1.6-3 3.7-6 5.2C24 28 10 25 4 16Z"
        fill="#f4ab11"
      />
      {/* eye */}
      <circle cx="13.5" cy="14.5" r="1.8" fill="#c81d05" />
    </svg>
  );
}

export function Wordmark({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <Logo size={size + 6} />
      <span className="mono-label text-[0.95rem] font-semibold text-pulp-gold">PULP</span>
    </div>
  );
}
