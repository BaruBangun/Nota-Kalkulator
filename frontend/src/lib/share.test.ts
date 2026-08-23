import { describe, it, expect } from 'vitest';
import { buildNoteText } from '@/lib/share';
import { formatNumber } from '@/lib/currency';
import type { Note } from '@/types/note';

describe('buildNoteText negative item support', () => {
  it('renders negative item rows and KEMBALI total', () => {
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

    // Label should be uppercased in the share text
    expect(text).toContain('DIBAYAR');

    // Value should appear with a leading minus and formatted number
    const expectedValue = `-${formatNumber(Math.abs(note.items[0].subtotal))}`;
    expect(text).toContain(expectedValue);

    // The total section should use the KEMBALI label for negative totals
    expect(text).toContain('KEMBALI');

    // The printed total should be the absolute total formatted
    expect(text).toContain(formatNumber(Math.abs(note.total)));
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
