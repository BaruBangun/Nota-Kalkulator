import { describe, it, expect } from 'vitest';
import { buildNoteText } from '@/lib/share';
import { formatNumber } from '@/lib/currency';
import type { Note } from '@/types/note';

describe('buildNoteText payment format', () => {
  it('renders payment as a positive DIBAYAR value', () => {
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
    expect(text).toContain(`DIBAYAR: ${formatNumber(Math.abs(note.items[0].subtotal))}`);
    expect(text).not.toContain(`-${formatNumber(Math.abs(note.items[0].subtotal))}`);
    expect(text).toContain(`TOTAL: ${formatNumber(0)}`);
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
});
