export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Pulp">
      <rect width="32" height="32" rx="7" fill="#16161a" />
      <path d="M10 23V9h6.2c2.9 0 4.8 1.8 4.8 4.5S19.1 18 16.2 18H13v5h-3z" fill="#f5b942" />
      <circle cx="16.2" cy="13.5" r="1.6" fill="#16161a" />
    </svg>
  );
}

export function Wordmark({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <Logo size={size} />
      <span className="font-serif tracking-tight text-[1.35rem] leading-none text-white">
        Pulp
      </span>
    </div>
  );
}
