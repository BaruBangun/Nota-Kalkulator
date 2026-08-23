/**
 * Format angka gaya Indonesia: 1.500 / 150.000 / 1.500.000
 * Tanpa simbol "Rp" secara default (lebih bersih untuk nota).
 */

const formatters = new Map<number, Intl.NumberFormat>();

function formatter(maxFractionDigits: number): Intl.NumberFormat {
  let nf = formatters.get(maxFractionDigits);
  if (!nf) {
    nf = new Intl.NumberFormat('id-ID', { maximumFractionDigits: maxFractionDigits });
    formatters.set(maxFractionDigits, nf);
  }
  return nf;
}

export function formatNumber(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '0';
  return formatter(maxFractionDigits).format(value);
}

export function formatCurrency(value: number, options: { withSymbol?: boolean } = {}): string {
  const text = formatNumber(value);
  return options.withSymbol ? `Rp${text}` : text;
}

export function formatQuantity(value: number): string {
  return formatNumber(value, 3);
}

/**
 * Ubah teks angka menjadi number. Mendukung pemisah ribuan (titik/koma)
 * dan desimal. Mengembalikan null bila bukan angka valid.
 */
export function parseCurrency(input: string): number | null {
  const raw = String(input).replace(/\s|_/g, '');
  const negative = raw.startsWith('-') || raw.startsWith('−');
  const text = negative ? raw.slice(1) : raw;
  if (!text || !/^[\d.,]+$/.test(text) || !/\d/.test(text)) return null;

  const hasDot = text.includes('.');
  const hasComma = text.includes(',');
  let normalized = text;

  if (hasDot && hasComma) {
    const decimalSep = text.lastIndexOf(',') > text.lastIndexOf('.') ? ',' : '.';
    const groupSep = decimalSep === ',' ? '.' : ',';
    const [intPart, ...rest] = text.split(decimalSep);
    if (rest.length > 1) return null;
    normalized = `${intPart.split(groupSep).join('')}.${rest[0] ?? '0'}`;
  } else if (hasDot || hasComma) {
    const sep = hasDot ? '.' : ',';
    const parts = text.split(sep);
    const looksLikeThousands =
      parts.length > 1 &&
      parts[0].length >= 1 &&
      parts[0].length <= 3 &&
      parts.slice(1).every((part) => part.length === 3);
    if (looksLikeThousands) {
      normalized = parts.join('');
    } else if (parts.length === 2) {
      normalized = `${parts[0] || '0'}.${parts[1]}`;
    } else {
      return null;
    }
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
