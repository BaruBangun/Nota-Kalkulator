import { describe, expect, it } from 'vitest';
import { createReceiptPdf, receiptFileName } from '@/lib/pdf';
import type { Note } from '@/types/note';

const note: Note = {
  id: 'pdf-test',
  createdAt: '2026-08-24T00:39:00.000Z',
  updatedAt: '2026-08-24T00:39:00.000Z',
  items: [
    { id: '1', name: 'Semen', quantity: 3, unitPrice: 70, subtotal: 210, rawInput: 'Semen 3x70' },
    { id: '2', name: 'Paku', quantity: 1, unitPrice: -1500, subtotal: -1500, rawInput: 'dibayar -1500' },
  ],
  subtotal: -1290,
  discount: { type: 'none', value: 0 },
  discountAmount: 0,
  total: -1290,
  note: 'Budi',
};

describe('local receipt PDF', () => {
  it('membuat PDF thermal dengan nama toko dan pembayaran positif', async () => {
    const file = createReceiptPdf(note, { storeName: 'TOKO MAKMUR', printSize: 'thermal' });
    const content = await file.blob.text();

    expect(file.blob.type).toBe('application/pdf');
    expect(file.blob.size).toBeGreaterThan(0);
    expect(file.fileName).toMatch(/^Nota-TOKO-MAKMUR-20260824\d{4}\.pdf$/);
    expect(content).toContain('TOKO MAKMUR');
    expect(content).toContain('DIBAYAR');
    expect(content).toContain('KEMBALI');
    expect(content).not.toContain('DIBAYAR -');
  });

  it('membuat PDF A4 tanpa header nama toko dan nama file aman', () => {
    const file = createReceiptPdf({ ...note, items: [note.items[0]], subtotal: 210, total: 210 }, { printSize: 'a4' });

    expect(file.fileName).toMatch(/^Nota-20260824\d{4}\.pdf$/);
    expect(file.blob.type).toBe('application/pdf');
    expect(receiptFileName(note, ' toko\\lama:? ')).toMatch(/^Nota-toko-lama-20260824\d{4}\.pdf$/);
  });
});
