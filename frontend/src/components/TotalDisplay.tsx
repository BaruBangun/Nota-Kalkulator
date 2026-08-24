import { formatNumber } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number;
  emphasis?: boolean;
  prefix?: string;
  testId?: string;
}

export const TotalDisplay = ({ label, value, emphasis = false, prefix = '', testId }: Props) => (
  <div
    className={cn(
      'flex items-end justify-between gap-4 font-mono',
      emphasis ? 'pt-3' : 'py-1 text-sm text-paper-muted',
    )}
  >
    <span
      className={cn(
        emphasis ? 'text-sm font-semibold uppercase tracking-[0.2em]' : 'uppercase tracking-[0.08em]',
      )}
    >
      {label}
    </span>
    <span
      data-testid={testId}
      className={cn('tabular tracking-tight', emphasis ? 'text-3xl font-bold sm:text-4xl' : 'font-medium')}
    >
      {prefix}
      {formatNumber(value)}
    </span>
  </div>
);
