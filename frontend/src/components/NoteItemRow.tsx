import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/primitives';
import { formatNumber, formatQuantity } from '@/lib/currency';
import { parseTransactionLine } from '@/lib/parser';
import { cn } from '@/lib/utils';
import type { NoteItem } from '@/types/note';
import type { ParsedTransaction } from '@/types/transaction';

interface Props {
  item: NoteItem;
  index: number;
  count: number;
  readOnly?: boolean;
  onEdit: (id: string, parsed: ParsedTransaction) => void;
  onDuplicate: (index: number) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

const SWIPE_LIMIT = 132;
const SWIPE_THRESHOLD = 76;

function rawOf(item: NoteItem): string {
  if (item.rawInput) return item.rawInput;
  return item.quantity === 1 ? `${item.name} ${item.unitPrice}` : `${item.name} ${item.quantity}x${item.unitPrice}`;
}

export const NoteItemRow = ({ item, index, count, readOnly, onEdit, onDuplicate, onRemove, onMove }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(rawOf(item));
  const [invalid, setInvalid] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  const endSwipe = () => {
    startX.current = null;
    setDragging(false);
    if (offset <= -SWIPE_THRESHOLD) {
      setOffset(-SWIPE_LIMIT);
      onRemove(item.id);
      return;
    }
    setOffset(0);
  };

  const startEdit = () => {
    setDraft(rawOf(item));
    setInvalid(false);
    setEditing(true);
  };

  const commit = () => {
    const result = parseTransactionLine(draft);
    if (!result.ok) {
      setInvalid(true);
      return;
    }
    onEdit(item.id, result.value);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="py-2" data-testid={`item-edit-row-${index}`}>
        <input
          autoFocus
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
            if (event.key === 'Escape') setEditing(false);
          }}
          onBlur={commit}
          data-testid={`item-edit-input-${index}`}
          aria-label={`Ubah ${item.name}`}
          className={cn(
            'w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm outline-none',
            invalid ? 'border-destructive' : 'border-paper-line focus:border-primary',
          )}
        />
        <span className="mt-1 block text-xs text-paper-muted">
          {invalid ? 'Format belum dikenali. Contoh: Beras 4x40' : 'Enter untuk simpan · Esc untuk batal'}
        </span>
      </li>
    );
  }

  return (
    <li className="relative overflow-hidden" data-testid={`receipt-item-${index}`}>
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 flex w-28 items-center justify-end gap-1.5 pr-2 text-destructive transition-opacity duration-150"
        style={{ opacity: offset < -6 ? 1 : 0 }}
      >
        <Trash2 className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">Hapus</span>
      </div>

      <div
        className="group flex animate-item-in items-start gap-3 bg-paper py-2 font-mono text-sm"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 180ms ease-out',
          touchAction: 'pan-y',
        }}
        data-testid={`item-swipe-${index}`}
        onPointerDown={(event) => {
          if (readOnly) return;
          startX.current = event.clientX;
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (startX.current === null) return;
          const delta = event.clientX - startX.current;
          setOffset(delta < 0 ? Math.max(delta, -SWIPE_LIMIT) : 0);
        }}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
        onPointerLeave={() => {
          if (startX.current === null) return;
          startX.current = null;
          setDragging(false);
          setOffset(0);
        }}
      >
        <div className="min-w-0 flex-1">
          <span className="break-words" data-testid={`receipt-item-name-${index}`}>
            {item.name}
          </span>
          {item.quantity !== 1 && (
            <span className="text-paper-muted" data-testid={`receipt-item-qty-${index}`}>
              {' '}
              {formatQuantity(item.quantity)} × {formatNumber(item.unitPrice)}
            </span>
          )}
        </div>

        <span
          className={cn('tabular shrink-0 tracking-tight', item.subtotal < 0 && 'font-semibold text-primary')}
          data-testid={`receipt-item-subtotal-${index}`}
        >
          {formatNumber(item.subtotal)}
        </span>

        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Menu untuk ${item.name}`}
                data-testid={`item-menu-btn-${index}`}
                className="-my-1.5 -mr-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper-muted transition-colors duration-150 hover:bg-paper-line/40 hover:text-paper-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={startEdit} data-testid={`item-edit-${index}`}>
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(index)} data-testid={`item-duplicate-${index}`}>
                <Copy className="h-4 w-4" /> Duplikat
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === 0}
                onClick={() => onMove(index, -1)}
                data-testid={`item-move-up-${index}`}
              >
                <ArrowUp className="h-4 w-4" /> Naik
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === count - 1}
                onClick={() => onMove(index, 1)}
                data-testid={`item-move-down-${index}`}
              >
                <ArrowDown className="h-4 w-4" /> Turun
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onRemove(item.id)}
                className="text-destructive focus:text-destructive"
                data-testid={`item-delete-${index}`}
              >
                <Trash2 className="h-4 w-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
};
