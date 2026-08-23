import type { Note } from '@/types/note';

const timeFormat = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const fullFormat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

export function formatFull(iso: string): string {
  return fullFormat.format(new Date(iso));
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (dayKey(date) === dayKey(today)) return 'Hari ini';
  if (dayKey(date) === dayKey(yesterday)) return 'Kemarin';
  return dayFormat.format(date);
}

export interface NoteGroup {
  label: string;
  notes: Note[];
  total: number;
}

export function groupNotesByDay(notes: Note[]): NoteGroup[] {
  const groups: NoteGroup[] = [];
  notes.forEach((note) => {
    const label = dayLabel(note.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.notes.push(note);
      last.total += note.total;
    } else {
      groups.push({ label, notes: [note], total: note.total });
    }
  });
  return groups;
}
