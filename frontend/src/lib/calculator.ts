import { roundMoney } from '@/lib/currency';
import type { Discount, Note, NoteItem } from '@/types/note';
import type { ParsedTransaction } from '@/types/transaction';

export interface Totals {
  subtotal: number;
  discountAmount: number;
  total: number;
}

export function createId(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createNoteItem(parsed: ParsedTransaction): NoteItem {
  return {
    id: createId(),
    name: parsed.name,
    quantity: parsed.quantity,
    unitPrice: parsed.unitPrice,
    subtotal: parsed.subtotal,
    rawInput: parsed.rawInput,
  };
}

export function computeSubtotal(items: NoteItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + item.subtotal, 0));
}

export function computeDiscountAmount(subtotal: number, discount: Discount): number {
  if (!discount || discount.type === 'none' || !discount.value) return 0;
  if (discount.type === 'percent') {
    const percent = Math.min(Math.max(discount.value, 0), 100);
    return roundMoney((subtotal * percent) / 100);
  }
  return roundMoney(Math.min(Math.max(discount.value, 0), subtotal));
}

export function computeTotals(items: NoteItem[], discount: Discount): Totals {
  const subtotal = computeSubtotal(items);
  const discountAmount = computeDiscountAmount(subtotal, discount);
  return {
    subtotal,
    discountAmount,
    total: roundMoney(Math.max(subtotal - discountAmount, 0)),
  };
}

export function moveItem(items: NoteItem[], index: number, direction: -1 | 1): NoteItem[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

export function duplicateItem(items: NoteItem[], index: number): NoteItem[] {
  const item = items[index];
  if (!item) return items;
  const next = [...items];
  next.splice(index + 1, 0, { ...item, id: createId() });
  return next;
}

export function buildNote(input: {
  id?: string;
  createdAt?: string;
  items: NoteItem[];
  discount: Discount;
  note: string;
}): Note {
  const now = new Date().toISOString();
  const { subtotal, discountAmount, total } = computeTotals(input.items, input.discount);
  return {
    id: input.id ?? createId(),
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    items: input.items,
    subtotal,
    discount: input.discount,
    discountAmount,
    total,
    note: input.note.trim(),
  };
}

export function duplicateNote(note: Note): Note {
  const now = new Date().toISOString();
  return {
    ...note,
    id: createId(),
    createdAt: now,
    updatedAt: now,
    items: note.items.map((item) => ({ ...item, id: createId() })),
  };
}
