import { jsPDF } from 'jspdf';
import { formatNumber, formatQuantity } from '@/lib/currency';
import type { Note, NoteItem, PrintSize } from '@/types/note';

const THERMAL_WIDTH = 80;
const THERMAL_MARGIN = 7;
const A4_MARGIN = 24;

interface PdfOptions {
  storeName?: string;
  printSize?: PrintSize;
}

interface PdfFile {
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
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export function receiptFileName(note: Note, storeName = ''): string {
  const storePart = safePart(storeName);
  return `Nota-${storePart ? `${storePart}-` : ''}${receiptNumber(note.createdAt)}.pdf`;
}

function itemText(item: NoteItem): string {
  if (item.quantity === 1) return item.name;
  return `${item.name} ${formatQuantity(item.quantity)} × ${formatNumber(Math.abs(item.unitPrice))}`;
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

function lineItems(note: Note): { items: NoteItem[]; paid: number } {
  return note.items.reduce(
    (result, item) => {
      if (item.subtotal < 0) result.paid += Math.abs(item.subtotal);
      else result.items.push(item);
      return result;
    },
    { items: [] as NoteItem[], paid: 0 },
  );
}

function drawRow(doc: jsPDF, label: string, value: string, y: number, left: number, right: number, maxWidth: number) {
  const valueWidth = doc.getTextWidth(value);
  const labelLines = doc.splitTextToSize(label, Math.max(maxWidth - valueWidth - 4, 20));
  doc.text(labelLines, left, y);
  doc.text(value, right, y, { align: 'right' });
  return y + Math.max(labelLines.length, 1) * 5.5;
}

export function createReceiptPdf(note: Note, options: PdfOptions = {}): PdfFile {
  const storeName = options.storeName?.trim() ?? '';
  const printSize = options.printSize ?? 'a4';
  const { items, paid } = lineItems(note);
  const width = printSize === 'thermal' ? THERMAL_WIDTH : 210;
  const margin = printSize === 'thermal' ? THERMAL_MARGIN : A4_MARGIN;
  const estimatedHeight = printSize === 'thermal' ? Math.max(80, 46 + items.length * 8 + (note.note ? 14 : 0)) : 297;
  const doc = new jsPDF({
    unit: 'mm',
    format: printSize === 'thermal' ? [width, estimatedHeight] : 'a4',
    compress: false,
  });
  const right = width - margin;
  const contentWidth = right - margin;
  let y = margin;

  if (storeName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(printSize === 'thermal' ? 12 : 14);
    doc.text(storeName.toUpperCase(), width / 2, y, { align: 'center', maxWidth: contentWidth });
    y += 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`NOTA #${receiptNumber(note.createdAt)}`, margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(dateText(note.createdAt), margin, y);
  y += 8;

  doc.setFontSize(printSize === 'thermal' ? 9.5 : 10);
  items.forEach((item) => {
    y = drawRow(doc, itemText(item), formatNumber(item.subtotal), y, margin, right, contentWidth);
  });

  doc.setDrawColor(90, 90, 90);
  doc.line(margin, y - 2, right, y - 2);
  y += 5;

  const positiveSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const hasPayment = paid > 0;
  const displayedTotal = hasPayment ? Math.max(positiveSubtotal - note.discountAmount, 0) : note.total;
  if (note.discountAmount > 0) {
    y = drawRow(doc, 'Subtotal', formatNumber(positiveSubtotal), y, margin, right, contentWidth);
    y = drawRow(doc, 'Diskon', `-${formatNumber(note.discountAmount)}`, y, margin, right, contentWidth);
  }
  if (hasPayment) y = drawRow(doc, 'DIBAYAR', formatNumber(paid), y, margin, right, contentWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(printSize === 'thermal' ? 11 : 12);
  y = drawRow(doc, 'TOTAL', formatNumber(Math.abs(displayedTotal)), y, margin, right, contentWidth);
  const change = hasPayment ? paid - displayedTotal : note.total < 0 ? Math.abs(note.total) : 0;
  if (change > 0) y = drawRow(doc, 'KEMBALI', formatNumber(change), y, margin, right, contentWidth);

  if (note.note.trim()) {
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(`Catatan: ${note.note.trim()}`, contentWidth);
    doc.text(noteLines, margin, y);
  }

  return { blob: doc.output('blob'), fileName: receiptFileName(note, storeName) };
}

export function downloadPdf(file: PdfFile): void {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type { PdfFile, PdfOptions };
