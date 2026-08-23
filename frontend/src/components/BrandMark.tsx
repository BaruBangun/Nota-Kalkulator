export const BrandMark = ({ className = 'h-8 w-8' }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true" role="presentation">
    <rect width="64" height="64" rx="16" fill="hsl(var(--foreground))" />
    <path
      d="M20 13h24a2 2 0 0 1 2 2v31l-4.7-3.4L36.6 46 32 42.6 27.4 46l-4.7-3.4L18 46V15a2 2 0 0 1 2-2z"
      fill="hsl(var(--background))"
    />
    <rect x="24" y="20" width="16" height="3" rx="1.5" fill="hsl(var(--muted-foreground))" />
    <rect x="24" y="26" width="11" height="3" rx="1.5" fill="hsl(var(--muted-foreground))" />
    <rect x="24" y="33.5" width="14" height="4.5" rx="2.2" fill="hsl(var(--primary))" />
  </svg>
);
