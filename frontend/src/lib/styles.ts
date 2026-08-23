const transition =
  'transition-[background-color,border-color,color,box-shadow,opacity] duration-150 ease-out';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export const btnBase = `inline-flex select-none items-center justify-center gap-2 rounded-full font-medium ${transition} ${focusRing} active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45`;

export const btnPrimary = `${btnBase} bg-primary text-primary-foreground shadow-sm hover:bg-primary/90`;
export const btnSecondary = `${btnBase} bg-secondary text-secondary-foreground hover:bg-accent`;
export const btnOutline = `${btnBase} border border-border bg-card text-foreground hover:bg-accent`;
export const btnGhost = `${btnBase} text-foreground hover:bg-accent`;
export const btnDanger = `${btnBase} bg-destructive text-destructive-foreground hover:bg-destructive/90`;

export const btnSize = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
  icon: 'h-11 w-11 p-0',
  iconSm: 'h-9 w-9 p-0',
};

export const cardBase = 'rounded-lg border border-border bg-card shadow-sm';

export const inputBase = `w-full rounded-md border border-input bg-card px-4 text-foreground placeholder:text-muted-foreground ${transition} focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25`;

export const labelBase = 'text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground';
