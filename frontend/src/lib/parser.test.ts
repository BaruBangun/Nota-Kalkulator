import { describe, expect, it } from 'vitest';
import { parseTransactionLine, parseTransactionLines } from '@/lib/parser';
import type { ParsedTransaction } from '@/types/transaction';

function value(input: string): ParsedTransaction {
  const result = parseTransactionLine(input);
  if (!result.ok) throw new Error(`Gagal parse: ${input} (${result.code})`);
  return result.value;
}

describe('parseTransactionLine — harga saja', () => {
  it('Susu 28', () => {
    expect(value('Susu 28')).toMatchObject({
      name: 'Susu',
      quantity: 1,
      unitPrice: 28,
      subtotal: 28,
      rawInput: 'Susu 28',
    });
  });

  it('nama dengan beberapa kata', () => {
    expect(value('Susu Enak 28')).toMatchObject({ name: 'Susu Enak', quantity: 1, subtotal: 28 });
  });

  it('mendukung baris negatif untuk pembayaran atau penyesuaian', () => {
    expect(value('dibayar -200')).toMatchObject({
      name: 'dibayar',
      quantity: 1,
      unitPrice: -200,
      subtotal: -200,
    });
  });

  it('nama yang mengandung angka', () => {
    expect(value('Aqua 600 2x5.000')).toMatchObject({
      name: 'Aqua 600',
      quantity: 2,
      unitPrice: 5000,
      subtotal: 10000,
    });
  });
});

describe('parseTransactionLine — qty x harga', () => {
  it('Beras 4x40', () => {
    expect(value('Beras 4x40')).toMatchObject({
      name: 'Beras',
      quantity: 4,
      unitPrice: 40,
      subtotal: 160,
    });
  });

  it('huruf besar X sama hasilnya', () => {
    expect(value('Beras 4X40')).toMatchObject({ name: 'Beras', quantity: 4, unitPrice: 40, subtotal: 160 });
  });

  it('tanda * sama hasilnya', () => {
    expect(value('Beras 4*40')).toMatchObject({ name: 'Beras', quantity: 4, unitPrice: 40, subtotal: 160 });
  });

  it('tanda × sama hasilnya', () => {
    expect(value('Beras 4×40')).toMatchObject({ quantity: 4, unitPrice: 40, subtotal: 160 });
  });

  it('case insensitive dan spasi berlebih', () => {
    expect(value('   beras    4 x   40  ')).toMatchObject({ name: 'beras', subtotal: 160 });
    expect(value('BERAS 4x40')).toMatchObject({ name: 'BERAS', subtotal: 160 });
  });

  it('pemisah ribuan: Semen 2x75.000', () => {
    expect(value('Semen 2x75.000')).toMatchObject({
      name: 'Semen',
      quantity: 2,
      unitPrice: 75000,
      subtotal: 150000,
    });
  });

  it('angka desimal dengan koma', () => {
    expect(value('Gula 2x14,5')).toMatchObject({ quantity: 2, unitPrice: 14.5, subtotal: 29 });
  });

  it('ribuan dan desimal bercampur', () => {
    expect(value('Kabel 2x1.500,50')).toMatchObject({ unitPrice: 1500.5, subtotal: 3001 });
  });
});

describe('parseTransactionLine — input tidak valid', () => {
  it('tanpa angka', () => {
    const result = parseTransactionLine('Beras abc');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('unrecognized');
      expect(result.message).toBe('Format belum dikenali');
      expect(result.hint).toContain('Beras 4x40');
    }
  });

  it('perkalian belum lengkap', () => {
    const result = parseTransactionLine('Beras 4x');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('incomplete-price');
  });

  it('tanpa nama barang', () => {
    const result = parseTransactionLine('4x40');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('missing-name');
  });

  it('input kosong', () => {
    const result = parseTransactionLine('   ');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('empty');
  });

  it('tidak crash untuk karakter aneh', () => {
    expect(() => parseTransactionLine('!!! ??? ***')).not.toThrow();
    expect(parseTransactionLine('!!! ??? ***').ok).toBe(false);
  });
});

describe('parseTransactionLines', () => {
  it('memparse banyak baris sekaligus', () => {
    const results = parseTransactionLines('Susu Enak 28\nTeh Kotak 5\nBeras 4x40\n\n');
    expect(results).toHaveLength(3);
    expect(results.every((result) => result.ok)).toBe(true);
  });
});
