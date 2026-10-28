import { NoteItemRow } from '@/components/NoteItemRow';
import { ReceiptInputRow } from '@/components/ReceiptInputRow';
import { TotalDisplay } from '@/components/TotalDisplay';
import { formatNumber } from '@/lib/currency';
import { formatFull } from '@/lib/dates';
import type { Totals } from '@/lib/calculator';
import { cn } from '@/lib/utils';
import type { Discount, NoteItem } from '@/types/note';
import type { ParsedTransaction } from '@/types/transaction';
import type { RefObject } from 'react';

interface Props {
  items: NoteItem[];
  totals: Totals;
  discount: Discount;
  note: string;
  storeName?: string;
  reductionColor?: string;
  totalColor?: string;
  createdAt?: string | null;
  readOnly?: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  onAddItems?: (parsed: ParsedTransaction[]) => void;
  onEditItem?: (id: string, parsed: ParsedTransaction) => void;
  onDuplicateItem?: (index: number) => void;
  onRemoveItem?: (id: string) => void;
  onMoveItem?: (index: number, direction: -1 | 1) => void;
}

const noop = () => {};

export const NotePreview = ({
  items,
  totals,
  discount,
  note,
  storeName = '',
  reductionColor,
  totalColor,
  createdAt,
  readOnly = false,
  inputRef,
  onAddItems,
  onEditItem = noop,
  onDuplicateItem = noop,
  onRemoveItem = noop,
  onMoveItem = noop,
}: Props) => {
  const payment = items.reduce((sum, item) => (item.subtotal < 0 ? sum + Math.abs(item.subtotal) : sum), 0);
  const hasPayment = payment > 0;
  // Negative rows are already included in totals.total as reductions.
  const displayTotal = totals.total;

  return (
    <div className="relative" data-testid="note-preview">
    <div
      className={cn(
        'receipt-print paper-grain rounded-t-lg border border-b-0 border-border bg-paper px-5 pb-4 pt-5 text-paper-foreground shadow-sm sm:px-6',
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.32em]">Nota</span>
        <span className="font-mono text-[11px] text-paper-muted" data-testid="receipt-date">
          {formatFull(createdAt ?? new Date().toISOString())}
        </span>
      </div>

      <div className="dashed-rule mt-4" />

      {storeName.trim() && (
        <div className="pb-2 pt-4 text-center" data-testid="receipt-store-name">
          <p className="font-mono text-base font-semibold uppercase tracking-[0.12em]">{storeName.trim()}</p>
        </div>
      )}

      {items.length === 0 && readOnly ? (
        <div className="py-10 text-center">
          <p className="font-mono text-sm text-paper-muted">Nota kosong</p>
        </div>
      ) : (
        <ul className="divide-y divide-paper-line/45" data-testid="receipt-items">
          {items.map((item, index) => (
            <NoteItemRow
              key={item.id}
              item={item}
              index={index}
              count={items.length}
              readOnly={readOnly}
              onEdit={onEditItem}
              onDuplicate={onDuplicateItem}
              onRemove={onRemoveItem}
              onMove={onMoveItem}
              reductionColor={reductionColor}
            />
          ))}
          {!readOnly && inputRef && onAddItems && (
            <ReceiptInputRow inputRef={inputRef} onAdd={onAddItems} showHint={items.length === 0} />
          )}
        </ul>
      )}

      <div className="dashed-rule mt-2 pt-2">
        {totals.discountAmount > 0 && (
          <>
            <TotalDisplay label="Subtotal" value={totals.subtotal} testId="receipt-subtotal" />
            <TotalDisplay
              label={discount.type === 'percent' ? `Diskon ${formatNumber(discount.value)}%` : 'Diskon'}
              value={totals.discountAmount}
              prefix="-"
              testId="receipt-discount"
            />
          </>
        )}
        <div className="mt-2 border-t-[3px] border-double border-paper-line">
          <TotalDisplay
            label={displayTotal < 0 ? 'Kembali' : 'Total'}
            value={Math.abs(displayTotal)}
            emphasis
            color={totalColor}
            testId="receipt-total"
          />
        </div>
        {hasPayment && <TotalDisplay label="Dibayar" value={-payment} color={reductionColor} testId="receipt-paid" />}
      </div>

      {note.trim() && (
        <div className="dashed-rule mt-4 pt-3" data-testid="receipt-note">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper-muted">Catatan</p>
          <p className="mt-1 whitespace-pre-wrap font-mono text-sm">{note.trim()}</p>
        </div>
      )}

      <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-paper-muted/80">
        {items.length} item · NotaKalk
      </p>
    </div>
    <div className="paper-edge no-print" aria-hidden="true" />
  </div>
  );
};
