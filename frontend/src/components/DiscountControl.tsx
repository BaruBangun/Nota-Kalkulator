import { useEffect, useState } from 'react';
import { computeDiscountAmount } from '@/lib/calculator';
import { formatNumber, parseCurrency } from '@/lib/currency';
import { cardBase, inputBase, labelBase } from '@/lib/styles';
import { cn } from '@/lib/utils';
import type { Discount, DiscountType } from '@/types/note';

interface Props {
  discount: Discount;
  subtotal: number;
  onChange: (discount: Discount) => void;
}

const MODES: { type: DiscountType; label: string }[] = [
  { type: 'none', label: 'Tanpa' },
  { type: 'nominal', label: 'Nominal' },
  { type: 'percent', label: 'Persen' },
];

export const DiscountControl = ({ discount, subtotal, onChange }: Props) => {
  const [text, setText] = useState(discount.value ? String(discount.value) : '');

  useEffect(() => {
    if (discount.type === 'none') setText('');
  }, [discount.type]);

  const amount = computeDiscountAmount(subtotal, discount);

  return (
    <section className={cn(cardBase, 'no-print p-4')} data-testid="discount-control">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={labelBase}>Diskon</span>
        <div className="flex rounded-full bg-secondary p-1" role="group" aria-label="Jenis diskon">
          {MODES.map((mode) => (
            <button
              key={mode.type}
              type="button"
              aria-pressed={discount.type === mode.type}
              data-testid={`discount-mode-${mode.type}`}
              onClick={() => onChange({ type: mode.type, value: mode.type === 'none' ? 0 : discount.value })}
              className={cn(
                'h-8 rounded-full px-3 text-xs font-medium transition-colors duration-150',
                discount.type === mode.type
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {discount.type !== 'none' && (
        <div className="mt-3 flex items-center gap-3">
          <div className="relative">
            <input
              value={text}
              inputMode="decimal"
              aria-label={discount.type === 'percent' ? 'Diskon persen' : 'Diskon nominal'}
              data-testid="discount-value-input"
              placeholder={discount.type === 'percent' ? '10' : '5.000'}
              onChange={(event) => {
                const next = event.target.value;
                setText(next);
                onChange({ type: discount.type, value: parseCurrency(next) ?? 0 });
              }}
              className={cn(inputBase, 'h-11 w-36 font-mono', discount.type === 'percent' && 'pr-8')}
            />
            {discount.type === 'percent' && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                %
              </span>
            )}
          </div>
          <span className="font-mono text-sm text-muted-foreground" data-testid="discount-amount">
            − {formatNumber(amount)}
          </span>
        </div>
      )}
    </section>
  );
};
