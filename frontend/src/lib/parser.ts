import { parseCurrency, roundMoney } from '@/lib/currency';
import type { ParseResult, ParsedTransaction } from '@/types/transaction';

const MULTIPLY = '[x×*]';
const NUMBER = '[\\d.,]+';

// "Beras 4x40" / "Beras 4 X 40" / "Beras 4*40"
const QTY_PRICE = new RegExp(`^(.*?)\\s*(${NUMBER})\\s*${MULTIPLY}\\s*(${NUMBER})$`, 'i');
// "Susu Enak 28"
const PRICE_ONLY = new RegExp(`^(.*?)\\s*(${NUMBER})$`);
// "Beras 4x" (belum lengkap)
const INCOMPLETE = new RegExp(`${MULTIPLY}\\s*$|^\\s*${MULTIPLY}`, 'i');

const HINT = 'Contoh: Beras 4x40 atau Susu Enak 28';

function failure(
  code: 'empty' | 'missing-name' | 'incomplete-price' | 'unrecognized',
  message: string,
  rawInput: string,
): ParseResult {
  return { ok: false, code, message, hint: HINT, rawInput };
}

function cleanName(value: string): string {
  return value.replace(/[\s,;:-]+$/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Parser murni: tidak pernah mengeksekusi input user (tanpa eval).
 */
export function parseTransactionLine(input: string): ParseResult {
  const rawInput = String(input ?? '');
  const line = rawInput.replace(/\s+/g, ' ').trim();

  if (!line) {
    return failure('empty', 'Ketik dulu itemnya', rawInput);
  }

  const qtyPrice = QTY_PRICE.exec(line);
  if (qtyPrice) {
    const name = cleanName(qtyPrice[1]);
    const quantity = parseCurrency(qtyPrice[2]);
    const unitPrice = parseCurrency(qtyPrice[3]);
    if (quantity === null || unitPrice === null) {
      return failure('unrecognized', 'Format belum dikenali', rawInput);
    }
    if (!name) {
      return failure('missing-name', 'Tambahkan nama barang', rawInput);
    }
    return {
      ok: true,
      value: {
        name,
        quantity,
        unitPrice,
        subtotal: roundMoney(quantity * unitPrice),
        rawInput,
      },
    };
  }

  if (INCOMPLETE.test(line)) {
    return failure('incomplete-price', 'Angkanya belum lengkap', rawInput);
  }

  const priceOnly = PRICE_ONLY.exec(line);
  if (priceOnly) {
    const name = cleanName(priceOnly[1]);
    const unitPrice = parseCurrency(priceOnly[2]);
    if (unitPrice === null) {
      return failure('unrecognized', 'Format belum dikenali', rawInput);
    }
    if (!name) {
      return failure('missing-name', 'Tambahkan nama barang', rawInput);
    }
    return {
      ok: true,
      value: {
        name,
        quantity: 1,
        unitPrice,
        subtotal: roundMoney(unitPrice),
        rawInput,
      },
    };
  }

  return failure('unrecognized', 'Format belum dikenali', rawInput);
}

/** Parse banyak baris sekaligus (mis. hasil paste). */
export function parseTransactionLines(input: string): ParseResult[] {
  return String(input ?? '')
    .split(/[\n\r]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseTransactionLine);
}

/** Ringkasan interpretasi untuk ditampilkan sebagai hint hidup di UI. */
export function describeParsed(value: ParsedTransaction): string {
  if (value.quantity === 1) return value.name;
  return `${value.name} ${value.quantity} × ${value.unitPrice}`;
}
