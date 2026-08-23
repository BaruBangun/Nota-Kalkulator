import { getSettings, listNotes, putNotes, saveSettings } from '@/lib/storage';
import type { BackupFile, Note, Settings } from '@/types/note';
import { DEFAULT_SETTINGS } from '@/types/note';

function stamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export async function buildBackup(): Promise<BackupFile> {
  const [notes, settings] = await Promise.all([listNotes(), getSettings()]);
  return {
    app: 'notakalk',
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
    settings,
  };
}

export async function exportData(): Promise<{ fileName: string; noteCount: number }> {
  const backup = await buildBackup();
  const fileName = `nota-backup-${stamp()}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { fileName, noteCount: backup.notes.length };
}

function isValidNote(value: unknown): value is Note {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<Note>;
  return typeof note.id === 'string' && typeof note.createdAt === 'string' && Array.isArray(note.items);
}

export function parseBackup(raw: string): { notes: Note[]; settings: Settings } {
  const data = JSON.parse(raw) as Partial<BackupFile>;
  if (!data || !Array.isArray(data.notes)) {
    throw new Error('File backup tidak dikenali');
  }
  const notes = data.notes.filter(isValidNote);
  if (!notes.length) {
    throw new Error('Tidak ada nota di dalam file ini');
  }
  return {
    notes,
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
  };
}

export async function importData(file: File, options: { applySettings?: boolean } = {}): Promise<number> {
  const raw = await file.text();
  const { notes, settings } = parseBackup(raw);
  await putNotes(notes);
  if (options.applySettings) await saveSettings(settings);
  return notes.length;
}
