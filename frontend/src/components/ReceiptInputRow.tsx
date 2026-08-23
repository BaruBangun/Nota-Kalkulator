import { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { formatNumber, formatQuantity } from '@/lib/currency';
import { parseTransactionLine, parseTransactionLines } from '@/lib/parser';
import { cn } from '@/lib/utils';
import type { ParseFailure, ParseResult, ParseSuccess, ParsedTransaction } from '@/types/transaction';

interface Props {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onAdd: (parsed: ParsedTransaction[]) => void;
  showHint?: boolean;
}

/** Baris input yang menyatu di dalam nota: ketik → Enter → jadi baris nota. */
export const ReceiptInputRow = ({ inputRef, onAdd, showHint = false }: Props) => {
  const [value, setValue] = useState('');
  const [failure, setFailure] = useState<ParseFailure | null>(null);

  const live = useMemo<ParseResult | null>(() => {
    const text = value.trim();
    if (!text || text.includes('\n')) return null;
    return parseTransactionLine(text);
  }, [value]);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  }, [value, inputRef]);

  const addFromText = (text: string): boolean => {
    const results = parseTransactionLines(text);
    const parsed = results.filter((result): result is ParseSuccess => result.ok).map((result) => result.value);
    const failures = results.filter((result): result is ParseFailure => !result.ok);

    if (!parsed.length) {
      setFailure(failures[0] ?? null);
      return false;
    }
    onAdd(parsed);
    setFailure(null);
    if (parsed.length > 1) toast.success(`${parsed.length} item ditambahkan`);
    if (failures.length) toast.message(`${failures.length} baris dilewati`, { description: failures[0].hint });
    return true;
  };

  const commit = () => {
    const text = value.trim();
    if (!text) return;
    if (addFromText(text)) {
      setValue('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return (
    <li className="no-print py-2" data-testid="receipt-input-row">
      <div
        className={cn(
          'flex items-start gap-2 border-b border-dashed pb-1.5 transition-colors duration-150',
          failure ? 'border-destructive' : 'border-paper-line/70 focus-within:border-primary',
        )}
      >
        <textarea
          id="item-input"
          ref={inputRef}
          data-testid="input-transaction"
          value={value}
          rows={1}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label="Ketik item nota"
          aria-describedby="item-hint"
          placeholder="Ketik item… mis. Beras 4x40"
          onChange={(event) => {
            setValue(event.target.value);
            if (failure) setFailure(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              commit();
            }
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData('text');
            if (!text.includes('\n')) return;
            event.preventDefault();
            if (addFromText(text)) setValue('');
          }}
          className="min-h-[28px] flex-1 resize-none border-0 bg-transparent p-0 font-mono text-sm leading-relaxed text-paper-foreground outline-none placeholder:text-paper-muted/70"
        />

        <span className="tabular shrink-0 pt-0.5 font-mono text-sm text-paper-muted" data-testid="input-live-subtotal">
          {live?.ok ? formatNumber(live.value.subtotal) : '·'}
        </span>

        <button
          type="button"
          onClick={commit}
          aria-label="Tambah item"
          data-testid="add-item-btn"
          className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper-muted transition-colors duration-150 hover:bg-paper-line/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <p id="item-hint" className="mt-1.5 min-h-[1rem] font-mono text-[11px]" data-testid="editor-hint">
        {failure ? (
          <span className="inline-flex animate-nudge items-center gap-1 text-destructive" data-testid="editor-error">
            {failure.message}. <span className="text-paper-muted">{failure.hint}</span>
          </span>
        ) : live?.ok && live.value.quantity !== 1 ? (
          <span className="text-primary" data-testid="editor-live-preview">
            {live.value.name} {formatQuantity(live.value.quantity)} × {formatNumber(live.value.unitPrice)} ={' '}
            {formatNumber(live.value.subtotal)}
          </span>
        ) : live?.ok ? (
          <span className="text-primary" data-testid="editor-live-preview">
            Enter untuk tambah {live.value.name}
          </span>
        ) : showHint ? (
          <span className="text-paper-muted" data-testid="receipt-empty">
            Contoh: Susu Enak 28 · Beras 4x40 · Semen 2x75.000
          </span>
        ) : (
          <span className="text-paper-muted/80">Enter = tambah item · geser baris ke kiri untuk hapus</span>
        )}
      </p>
    </li>
  );
};
