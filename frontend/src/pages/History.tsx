import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/AppHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { HistoryList } from '@/components/HistoryList';
import { duplicateNote } from '@/lib/calculator';
import { formatNumber } from '@/lib/currency';
import { groupNotesByDay } from '@/lib/dates';
import { shareNote } from '@/lib/share';
import { deleteNote, listNotes, saveNote } from '@/lib/storage';
import { btnPrimary, btnSize, cardBase } from '@/lib/styles';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/note';

export default function History() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const load = () => listNotes().then(setNotes);

  useEffect(() => {
    void load();
  }, []);

  const groups = useMemo(() => groupNotesByDay(notes ?? []), [notes]);
  const grandTotal = useMemo(() => (notes ?? []).reduce((sum, note) => sum + note.total, 0), [notes]);

  const handleDuplicate = async (note: Note) => {
    const copy = duplicateNote(note);
    await saveNote(copy);
    toast.success('Nota diduplikat');
    navigate(`/note/${copy.id}`);
  };

  const handleShare = async (note: Note) => {
    const outcome = await shareNote(note);
    if (outcome === 'copied') toast.success('Nota disalin ke clipboard');
    if (outcome === 'failed') toast.error('Gagal membagikan nota');
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    await deleteNote(pendingDelete.id);
    setPendingDelete(null);
    await load();
    toast.success('Nota dihapus');
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-5 md:px-8 md:pt-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Riwayat</h1>
            <p className="mt-1.5 text-sm text-muted-foreground" data-testid="history-summary">
              {notes === null
                ? 'Memuat…'
                : `${notes.length} nota · total ${formatNumber(grandTotal)}`}
            </p>
          </div>
        </div>

        <div className="mt-7">
          {notes !== null && notes.length === 0 ? (
            <div className={cn(cardBase, 'flex flex-col items-start gap-4 p-6')} data-testid="history-empty">
              <Receipt className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-base font-medium">Belum ada nota tersimpan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Buat nota baru, lalu tekan Simpan. Nota akan tampil di sini walau tanpa internet.
                </p>
              </div>
              <Link to="/" className={cn(btnPrimary, btnSize.md)} data-testid="history-create-btn">
                Buat nota
              </Link>
            </div>
          ) : (
            <HistoryList
              groups={groups}
              onOpen={(note) => navigate(`/note/${note.id}`)}
              onDuplicate={handleDuplicate}
              onShare={handleShare}
              onDelete={setPendingDelete}
            />
          )}
        </div>
      </main>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Hapus nota ini?"
        description="Nota yang dihapus tidak dapat dikembalikan."
        onConfirm={handleDelete}
        testId="confirm-delete-history"
      />
    </div>
  );
}
