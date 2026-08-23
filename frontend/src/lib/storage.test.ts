import { beforeEach, describe, expect, it } from 'vitest';
import { buildNote, createNoteItem, duplicateNote } from '@/lib/calculator';
import { parseTransactionLine } from '@/lib/parser';
import { parseBackup } from '@/lib/export';
import {
  clearAllData,
  deleteMeta,
  deleteNote,
  getNote,
  getSettings,
  listNotes,
  putNotes,
  saveNote,
  saveSettings,
} from '@/lib/storage';
import { NO_DISCOUNT } from '@/types/note';
import type { NoteItem } from '@/types/note';

function items(...lines: string[]): NoteItem[] {
  return lines.map((line) => {
    const result = parseTransactionLine(line);
    if (!result.ok) throw new Error(`Gagal parse: ${line}`);
    return createNoteItem(result.value);
  });
}

describe('IndexedDB storage', () => {
  beforeEach(async () => {
    await clearAllData();
    await deleteMeta('settings');
  });

  it('simpan lalu baca kembali nota', async () => {
    const note = buildNote({ items: items('Susu Enak 28', 'Beras 4x40'), discount: NO_DISCOUNT, note: 'Tes' });
    await saveNote(note);

    const loaded = await getNote(note.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.total).toBe(188);
    expect(loaded?.items).toHaveLength(2);
    expect(loaded?.note).toBe('Tes');
  });

  it('riwayat terurut dari yang terbaru', async () => {
    const older = buildNote({ items: items('A 10'), discount: NO_DISCOUNT, note: '' });
    older.createdAt = new Date(Date.now() - 60_000).toISOString();
    const newer = buildNote({ items: items('B 20'), discount: NO_DISCOUNT, note: '' });
    await putNotes([older, newer]);

    const list = await listNotes();
    expect(list.map((note) => note.id)).toEqual([newer.id, older.id]);
  });

  it('hapus nota', async () => {
    const note = buildNote({ items: items('A 10'), discount: NO_DISCOUNT, note: '' });
    await saveNote(note);
    await deleteNote(note.id);
    expect(await getNote(note.id)).toBeNull();
    expect(await listNotes()).toHaveLength(0);
  });

  it('duplikat nota membuat id baru dengan item sama', async () => {
    const note = buildNote({ items: items('Semen 5x75.000'), discount: NO_DISCOUNT, note: '' });
    const copy = duplicateNote(note);
    await putNotes([note, copy]);
    expect(copy.id).not.toBe(note.id);
    expect(copy.total).toBe(note.total);
    expect(await listNotes()).toHaveLength(2);
  });

  it('menyimpan pengaturan', async () => {
    await saveSettings({ theme: 'dark', printSize: 'thermal', storeName: 'TOKO MAKMUR' });
    expect(await getSettings()).toEqual({ theme: 'dark', printSize: 'thermal', storeName: 'TOKO MAKMUR' });
  });

  it('nama toko kosong secara default dan dapat dihapus', async () => {
    expect((await getSettings()).storeName).toBe('');
    await saveSettings({ theme: 'light', printSize: 'a4', storeName: 'TOKO MAKMUR' });
    await saveSettings({ theme: 'light', printSize: 'a4', storeName: '' });
    expect((await getSettings()).storeName).toBe('');
  });

  it('hapus semua data menghapus nota, draft, dan nama toko', async () => {
    await saveSettings({ theme: 'light', printSize: 'a4', storeName: 'TOKO MAKMUR' });
    await saveNote(buildNote({ items: items('Barang 10'), discount: NO_DISCOUNT, note: '' }));
    await clearAllData();

    expect(await listNotes()).toHaveLength(0);
    expect((await getSettings()).storeName).toBe('');
  });
});

describe('backup', () => {
  it('parseBackup menerima file valid', () => {
    const note = buildNote({ items: items('A 10'), discount: NO_DISCOUNT, note: '' });
    const raw = JSON.stringify({
      app: 'notakalk',
      version: 1,
      exportedAt: '',
      notes: [note],
      settings: { theme: 'light', printSize: 'a4', storeName: 'TOKO MAKMUR' },
    });
    expect(parseBackup(raw)).toMatchObject({
      notes: [note],
      settings: { storeName: 'TOKO MAKMUR' },
    });
  });

  it('parseBackup menolak file asing', () => {
    expect(() => parseBackup('{"foo":1}')).toThrow();
    expect(() => parseBackup('{"notes":[]}')).toThrow();
  });
});
