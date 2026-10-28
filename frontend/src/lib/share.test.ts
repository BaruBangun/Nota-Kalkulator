import { describe, it, expect } from 'vitest';
import { buildNoteText } from '@/lib/share';
import { receiptImageFileName } from '@/lib/receipt-image';
import { formatNumber } from '@/lib/currency';
import type { Note } from '@/types/note';

describe('buildNoteText payment format', () => {
  it('renders payment as a negative DIBAYAR reduction', () => {
    const note: Note = {
      id: 'test-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [
        {
          id: 'i1',
          name: 'dibayar',
          quantity: 1,
          unitPrice: -200,
          subtotal: -200,
          rawInput: 'dibayar -200',
        },
      ],
      subtotal: -200,
      discount: { type: 'none', value: 0 },
      discountAmount: 0,
      total: -200,
      note: '',
    };

    const text = buildNoteText(note);

    expect(text).toContain('DIBAYAR');
    expect(text).toContain(`DIBAYAR: -${formatNumber(Math.abs(note.items[0].subtotal))}`);
    expect(text).toContain(`TOTAL: ${formatNumber(Math.abs(note.total))}`);
  });

  it('menampilkan nama toko hanya jika dikonfigurasi', () => {
    const note: Note = {
      id: 'test-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [],
      subtotal: 0,
      discount: { type: 'none', value: 0 },
      discountAmount: 0,
      total: 0,
      note: '',
    };

    expect(buildNoteText(note, ' TOKO MAKMUR ')).toContain('TOKO MAKMUR');
    expect(buildNoteText(note, '   ')).not.toContain('TOKO MAKMUR');
    expect(buildNoteText(note, '')).not.toContain('Nama Toko');
  });

  it('membuat nama file image yang aman dan informatif', () => {
    const note: Note = {
      id: 'test-3',
      createdAt: '2026-01-02T03:04:00.000Z',
      updatedAt: '2026-01-02T03:04:00.000Z',
      items: [],
      subtotal: 0,
      discount: { type: 'none', value: 0 },
      discountAmount: 0,
      total: 0,
      note: '',
    };

    expect(receiptImageFileName(note, ' Toko / Makmur ')).toMatch(/^Nota-Toko-Makmur-20260102\d{4}\.png$/);
  });
});
