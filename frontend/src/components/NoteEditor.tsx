import { useEffect, useMemo, useState } from 'react';
import type { RefObject } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { parseTransactionLine, parseTransactionLines } from '@/lib/parser';
import { formatNumber, formatQuantity } from '@/lib/currency';
import { btnPrimary, btnSize, cardBase, inputBase, labelBase } from '@/lib/styles';
import { cn } from '@/lib/utils';
import type { ParseFailure, ParseResult, ParseSuccess, ParsedTransaction } from '@/types/transaction';

interface Props {
  onAdd: (parsed: ParsedTransaction[]) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export const NoteEditor = ({ onAdd, inputRef }: Props) => {
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
    element.style.height = `${Math.min(element.scrollHeight, 168)}px`;
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
    if (parsed.length > 1) {
      toast.success(`${parsed.length} item ditambahkan`);
    }
    if (failures.length) {
      toast.message(`${failures.length} baris dilewati`, { description: failures[0].hint });
    }
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
    <section className={cn(cardBase, 'no-print p-4 sm:p-5')} data-testid="note-editor">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor="item-input" className={labelBase}>
          Ketik item
        </label>
        <span className="text-xs text-muted-foreground">Enter = tambah item</span>
      </div>

      <div className="mt-3 flex items-start gap-2">
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
          aria-describedby="item-hint"
          placeholder="Beras 4x40"
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
          className={cn(inputBase, 'min-h-[56px] resize-none py-4 font-mono text-lg leading-snug')}
        />
        <button
          type="button"
          onClick={commit}
          aria-label="Tambah item"
          data-testid="add-item-btn"
          className={cn(btnPrimary, btnSize.icon, 'h-14 w-14 shrink-0')}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <p id="item-hint" className="mt-3 min-h-[1.25rem] text-sm" data-testid="editor-hint">
        {failure ? (
          <span className="inline-flex animate-nudge items-center gap-1.5 text-destructive" data-testid="editor-error">
            {failure.message}.{' '}
            <span className="text-muted-foreground">{failure.hint}</span>
          </span>
        ) : live?.ok ? (
          <span className="font-mono text-primary" data-testid="editor-live-preview">
            {live.value.name}
            {live.value.quantity !== 1 && (
              <span className="text-muted-foreground">
                {' '}
                {formatQuantity(live.value.quantity)} × {formatNumber(live.value.unitPrice)}
              </span>
            )}{' '}
            = {formatNumber(live.value.subtotal)}
          </span>
        ) : (
          <span className="text-muted-foreground">Contoh: Susu Enak 28 · Beras 4x40 · Semen 2x75.000</span>
        )}
      </p>
    </section>
  );
};
