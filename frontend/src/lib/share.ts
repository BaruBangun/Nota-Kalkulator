import { formatNumber, formatQuantity } from '@/lib/currency';
import type { Note } from '@/types/note';

const WIDTH = 32;
const DIVIDER = '─'.repeat(WIDTH);

function row(label: string, value: string, width = WIDTH): string {
  const space = Math.max(width - label.length - value.length, 1);
  if (space === 1 && label.length + value.length + 1 > width) {
    return `${label}\n${' '.repeat(Math.max(width - value.length, 0))}${value}`;
  }
  return `${label}${' '.repeat(space)}${value}`;
}

export function itemLabel(name: string, quantity: number, unitPrice: number): string {
  if (quantity === 1) return name;
  return `${name} ${formatQuantity(quantity)} × ${formatNumber(unitPrice)}`;
}

export function buildNoteText(note: Note): string {
  const lines: string[] = ['NOTA', ''];

  note.items.forEach((item) => {
    lines.push(row(itemLabel(item.name, item.quantity, item.unitPrice), formatNumber(item.subtotal)));
  });

  lines.push(DIVIDER);

  if (note.discountAmount > 0) {
    lines.push(row('Subtotal', formatNumber(note.subtotal)));
    const label = note.discount.type === 'percent' ? `Diskon ${formatNumber(note.discount.value)}%` : 'Diskon';
    lines.push(row(label, `-${formatNumber(note.discountAmount)}`));
  }

  lines.push(row('TOTAL', formatNumber(note.total)));

  if (note.note) {
    lines.push('', 'Catatan:', note.note);
  }

  lines.push(
    '',
    new Date(note.createdAt).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  );

  return lines.join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // jatuh ke fallback di bawah
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export async function shareNote(note: Note): Promise<ShareOutcome> {
  const text = buildNoteText(note);
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Nota', text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}
