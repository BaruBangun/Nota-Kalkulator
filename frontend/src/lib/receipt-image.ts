import { formatNumber, formatQuantity } from '@/lib/currency';
import type { ImageFont, ImageSpacing, Note } from '@/types/note';

const WIDTH = 800;
const PADDING = 56;

export interface ReceiptImageSettings {
  imageFont: ImageFont;
  imageSpacing: ImageSpacing;
  imageGuides: boolean;
  imageBackground: string;
  reductionColor: string;
  totalColor: string;
}

export interface ReceiptImageFile {
  blob: Blob;
  fileName: string;
}

function receiptNumber(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '000000000000';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function safePart(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

export function receiptImageFileName(note: Note, storeName = ''): string {
  const storePart = safePart(storeName);
  return `Nota-${storePart ? `${storePart}-` : ''}${receiptNumber(note.createdAt)}.png`;
}

function dateText(createdAt: string): string {
  return new Date(createdAt).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function itemLabel(item: Note['items'][number]): string {
  return item.quantity === 1 ? item.name : `${item.name} ${formatQuantity(item.quantity)} × ${formatNumber(Math.abs(item.unitPrice))}`;
}

function wrap(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export function createReceiptImage(note: Note, storeName = '', settings: ReceiptImageSettings): Promise<ReceiptImageFile> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Canvas tidak tersedia'));
      return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas tidak tersedia'));
      return;
    }

    const cleanStoreName = storeName.trim();
    const font = `${settings.imageFont}, sans-serif`;
    const lineHeight = settings.imageSpacing === 'compact' ? 36 : 46;
    const padding = settings.imageSpacing === 'compact' ? 48 : PADDING;
    ctx.font = `400 24px ${font}`;
    const items = note.items;
    const lines = items.reduce((count, item) => count + wrap(ctx, itemLabel(item), 500).length, 0);
    const guideHeight = settings.imageGuides ? Math.max(0, items.length - 1) * 16 : 0;
    const noteLines = note.note.trim() ? wrap(ctx, `Catatan: ${note.note.trim()}`, WIDTH - padding * 2).length : 0;
    const height = padding * 2 + 260 + lines * lineHeight + guideHeight + (noteLines ? 58 + noteLines * 32 : 0);
    canvas.width = WIDTH;
    canvas.height = height;

    ctx.fillStyle = settings.imageBackground;
    ctx.fillRect(0, 0, WIDTH, height);
    ctx.fillStyle = '#1f2937';
    ctx.textBaseline = 'top';

    let y = padding;
    if (cleanStoreName) {
      ctx.font = `700 30px ${font}`;
      ctx.textAlign = 'center';
      ctx.fillText(cleanStoreName.toUpperCase(), WIDTH / 2, y);
      y += 52;
    }

    ctx.textAlign = 'left';
    ctx.font = `700 24px ${font}`;
    ctx.fillText(`NOTA #${receiptNumber(note.createdAt)}`, padding, y);
    y += 36;
    ctx.font = `400 20px ${font}`;
    ctx.fillStyle = '#6b7280';
    ctx.fillText(dateText(note.createdAt), padding, y);
    y += 52;

    items.forEach((item) => {
      const negative = item.subtotal < 0;
      const label = negative ? 'DIBAYAR' : itemLabel(item);
      const value = `${negative ? '-' : ''}${formatNumber(Math.abs(item.subtotal))}`;
      const labelLines = wrap(ctx, label, 500);
      ctx.font = negative ? `700 24px ${font}` : `400 24px ${font}`;
      ctx.fillStyle = negative ? settings.reductionColor : '#1f2937';
      ctx.textAlign = 'left';
      labelLines.forEach((line) => {
        ctx.fillText(line, padding, y);
        y += lineHeight;
      });
      ctx.textAlign = 'right';
      ctx.fillText(value, WIDTH - padding, y - lineHeight * labelLines.length);
      ctx.textAlign = 'left';
      if (settings.imageGuides && item !== items[items.length - 1]) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, y + 8);
        ctx.lineTo(WIDTH - padding, y + 8);
        ctx.stroke();
        y += 16;
      }
    });

    y += 12;
    ctx.strokeStyle = settings.imageGuides ? '#9ca3af' : 'transparent';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(WIDTH - padding, y);
    ctx.stroke();
    y += 28;

    ctx.font = `700 30px ${font}`;
    ctx.fillStyle = settings.totalColor;
    ctx.textAlign = 'left';
    ctx.fillText(note.total < 0 ? 'KEMBALI' : 'TOTAL', padding, y);
    ctx.textAlign = 'right';
    ctx.fillText(formatNumber(Math.abs(note.total)), WIDTH - padding, y);

    if (note.note.trim()) {
      y += 58;
      ctx.font = `400 22px ${font}`;
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      wrap(ctx, `Catatan: ${note.note.trim()}`, WIDTH - padding * 2).forEach((line) => {
        ctx.fillText(line, padding, y);
        y += 32;
      });
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal membuat image'));
        return;
      }
      resolve({ blob, fileName: receiptImageFileName(note, cleanStoreName) });
    }, 'image/png');
  });
}

export function downloadReceiptImage(file: ReceiptImageFile): void {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
