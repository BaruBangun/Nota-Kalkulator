import { describe, expect, it } from 'vitest';
import { computeDiscountAmount, computeTotals, createNoteItem, duplicateItem, moveItem } from '@/lib/calculator';
import { parseTransactionLine } from '@/lib/parser';
import { formatCurrency, formatNumber, parseCurrency } from '@/lib/currency';
import { buildNoteText } from '@/lib/share';
import { buildNote } from '@/lib/calculator';
import { NO_DISCOUNT } from '@/types/note';
import type { NoteItem } from '@/types/note';

function items(...lines: string[]): NoteItem[] {
  return lines.map((line) => {
    const result = parseTransactionLine(line);
    if (!result.ok) throw new Error(`Gagal parse: ${line}`);
    return createNoteItem(result.value);
  });
}

describe('computeTotals', () => {
  it('28 + 5 + 160 = 193', () => {
    const totals = computeTotals(items('Susu Enak 28', 'Teh Kotak 5', 'Beras 4x40'), NO_DISCOUNT);
    expect(totals.subtotal).toBe(193);
    expect(totals.discountAmount).toBe(0);
    expect(totals.total).toBe(193);
  });

  it('menghitung 227 dengan minyak 2 x 17', () => {
    const totals = computeTotals(items('Susu 28', 'Teh 5', 'Beras 4x40', 'Minyak 2x17'), NO_DISCOUNT);
    expect(totals.total).toBe(227);
  });

  it('nota kosong = 0', () => {
    expect(computeTotals([], NO_DISCOUNT)).toEqual({ subtotal: 0, discountAmount: 0, total: 0 });
  });
});

describe('diskon', () => {
  it('diskon nominal 10 dari 227', () => {
    const totals = computeTotals(items('Susu 28', 'Teh 5', 'Beras 4x40', 'Minyak 2x17'), {
      type: 'nominal',
      value: 10,
    });
    expect(totals.discountAmount).toBe(10);
    expect(totals.total).toBe(217);
  });

  it('diskon 10% dari 1.000 = 100', () => {
    expect(computeDiscountAmount(1000, { type: 'percent', value: 10 })).toBe(100);
    const totals = computeTotals(items('Barang 1000'), { type: 'percent', value: 10 });
    expect(totals.total).toBe(900);
  });

  it('diskon nominal tidak melebihi subtotal', () => {
    const totals = computeTotals(items('Barang 100'), { type: 'nominal', value: 500 });
    expect(totals.discountAmount).toBe(100);
    expect(totals.total).toBe(0);
  });

  it('persen dibatasi 0-100', () => {
    expect(computeDiscountAmount(1000, { type: 'percent', value: 150 })).toBe(1000);
    expect(computeDiscountAmount(1000, { type: 'percent', value: -20 })).toBe(0);
  });
});

describe('urutan item', () => {
  it('move up / move down', () => {
    const list = items('A 1', 'B 2', 'C 3');
    expect(moveItem(list, 2, -1).map((item) => item.name)).toEqual(['A', 'C', 'B']);
    expect(moveItem(list, 0, 1).map((item) => item.name)).toEqual(['B', 'A', 'C']);
    expect(moveItem(list, 0, -1)).toBe(list);
  });

  it('duplikat menghasilkan id baru', () => {
    const list = items('A 1');
    const next = duplicateItem(list, 0);
    expect(next).toHaveLength(2);
    expect(next[0].id).not.toBe(next[1].id);
    expect(next[1].name).toBe('A');
  });
});

describe('format angka Indonesia', () => {
  it('format ribuan', () => {
    expect(formatNumber(1500)).toBe('1.500');
    expect(formatNumber(150000)).toBe('150.000');
    expect(formatNumber(1500000)).toBe('1.500.000');
    expect(formatNumber(28)).toBe('28');
  });

  it('formatCurrency tanpa simbol secara default', () => {
    expect(formatCurrency(15000)).toBe('15.000');
    expect(formatCurrency(15000, { withSymbol: true })).toBe('Rp15.000');
  });

  it('parseCurrency', () => {
    expect(parseCurrency('75.000')).toBe(75000);
    expect(parseCurrency('1.500.000')).toBe(1500000);
    expect(parseCurrency('12,5')).toBe(12.5);
    expect(parseCurrency('abc')).toBeNull();
    expect(parseCurrency('')).toBeNull();
  });
});

describe('buildNoteText', () => {
  it('sama dengan hasil perhitungan preview', () => {
    const note = buildNote({ items: items('Susu Enak 28', 'Teh Kotak 5', 'Beras 4x40'), discount: NO_DISCOUNT, note: '' });
    const text = buildNoteText(note);
    expect(text).toContain('NOTA');
    expect(text).toContain('Beras 4 × 40');
    expect(text).toMatch(/TOTAL\s+193/);
  });

  it('menampilkan baris diskon bila ada', () => {
    const note = buildNote({ items: items('Barang 1000'), discount: { type: 'percent', value: 10 }, note: 'Bayar sebagian' });
    const text = buildNoteText(note);
    expect(text).toMatch(/Subtotal\s+1\.000/);
    expect(text).toMatch(/Diskon 10%\s+-100/);
    expect(text).toMatch(/TOTAL\s+900/);
    expect(text).toContain('Bayar sebagian');
  });
});
