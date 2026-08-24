import { formatNumber, formatQuantity } from '@/lib/currency';
import type { Note } from '@/types/note';

function receiptNumber(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '000000000000';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function buildNoteText(note: Note, storeName = ''): string {
  const lines: string[] = [];

  if (storeName.trim()) lines.push(storeName.trim(), '');
  lines.push(`🧾 NOTA #${receiptNumber(note.createdAt)}`, '');

  const paid = note.items.reduce((sum, item) => (item.subtotal < 0 ? sum + Math.abs(item.subtotal) : sum), 0);
  const total = paid > 0 ? Math.max(note.total + paid, 0) : note.total;

  note.items.forEach((item) => {
    if (item.subtotal < 0) return;
    lines.push(item.name);
    lines.push(item.quantity === 1
      ? `${formatNumber(item.unitPrice)} = ${formatNumber(item.subtotal)}`
      : `${formatQuantity(item.quantity)} × ${formatNumber(item.unitPrice)} = ${formatNumber(item.subtotal)}`);
    lines.push('');
  });

  lines.push('──────────────');

  if (note.discountAmount > 0) {
    lines.push(`SUBTOTAL: ${formatNumber(total + note.discountAmount)}`);
    lines.push(`DISKON: -${formatNumber(note.discountAmount)}`);
  }

  lines.push(`TOTAL: ${formatNumber(Math.abs(total))}`);
  if (paid > 0) {
    lines.push('', `DIBAYAR: ${formatNumber(paid)}`);
    const change = paid - total;
    if (change > 0) lines.push(`KEMBALI: ${formatNumber(change)}`);
  }

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

export async function shareNote(note: Note, storeName = ''): Promise<ShareOutcome> {
  const text = buildNoteText(note, storeName);

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Nota NotaKalk', text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }

  return (await copyText(text)) ? 'copied' : 'failed';
}
