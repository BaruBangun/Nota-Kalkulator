import { buildNote, createNoteItem } from '@/lib/calculator';
import { parseTransactionLine } from '@/lib/parser';
import type { Note } from '@/types/note';
import { NO_DISCOUNT } from '@/types/note';

function noteFrom(lines: string[], minutesAgo: number, note = '', discount = NO_DISCOUNT): Note {
  const items = lines
    .map(parseTransactionLine)
    .filter((result) => result.ok)
    .map((result) => createNoteItem(result.value));
  const created = new Date(Date.now() - minutesAgo * 60_000).toISOString();
  return buildNote({ items, discount, note, createdAt: created });
}

/** Contoh data untuk mencoba aplikasi tanpa mengetik apa pun. */
export function sampleNotes(): Note[] {
  return [
    noteFrom(['Susu Enak 28', 'Teh Kotak 5', 'Beras 4x40'], 45),
    noteFrom(['Semen 2x75.000', 'Pasir 3x50.000', 'Cat 1x120.000'], 26 * 60, 'Pesanan Pak Budi', {
      type: 'percent',
      value: 5,
    }),
    noteFrom(['Gula 2x14.500', 'Minyak 2x17.000', 'Kopi 3x12.000', 'Mie 10x3.500'], 50 * 60, 'Bayar sebagian', {
      type: 'nominal',
      value: 5000,
    }),
  ];
}
