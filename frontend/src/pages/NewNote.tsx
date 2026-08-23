import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FilePlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppHeader } from '@/components/AppHeader';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DiscountControl } from '@/components/DiscountControl';
import { ActionDock, NoteActions } from '@/components/NoteActions';
import { NoteEditor } from '@/components/NoteEditor';
import { NoteMemo } from '@/components/NoteMemo';
import { NotePreview } from '@/components/NotePreview';
import { buildNote, computeTotals } from '@/lib/calculator';
import { buildNoteText, copyText } from '@/lib/share';
import { deleteMeta, deleteNote, getMeta, getNote, saveNote, setMeta } from '@/lib/storage';
import { btnOutline, btnSize } from '@/lib/styles';
import { cn } from '@/lib/utils';
import { draftReducer, emptyDraft } from '@/state/draft';
import type { DraftState } from '@/state/draft';

const DRAFT_KEY = 'draft';

export default function NewNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [draft, dispatch] = useReducer(draftReducer, emptyDraft);
  const [ready, setReady] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let alive = true;
    setReady(false);
    void (async () => {
      if (id) {
        const note = await getNote(id);
        if (!alive) return;
        if (!note) {
          toast.error('Nota tidak ditemukan');
          navigate('/', { replace: true });
          return;
        }
        dispatch({ type: 'load', note });
      } else {
        const stored = await getMeta<DraftState | null>(DRAFT_KEY, null);
        if (alive && stored && stored.items?.length) dispatch({ type: 'restore', draft: stored });
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!ready || id) return;
    const timer = setTimeout(() => void setMeta(DRAFT_KEY, draft), 300);
    return () => clearTimeout(timer);
  }, [draft, ready, id]);

  const totals = useMemo(() => computeTotals(draft.items, draft.discount), [draft.items, draft.discount]);

  const currentNote = useCallback(
    () =>
      buildNote({
        id: draft.savedId ?? undefined,
        createdAt: draft.createdAt ?? undefined,
        items: draft.items,
        discount: draft.discount,
        note: draft.note,
      }),
    [draft],
  );

  const focusInput = () => {
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleSave = async () => {
    if (!draft.items.length) return;
    const note = currentNote();
    await saveNote(note);
    dispatch({ type: 'saved', note });
    toast.success(draft.savedId ? 'Nota diperbarui' : 'Nota disimpan', {
      description: 'Tersimpan di perangkat ini',
    });
  };

  const handleCopy = async () => {
    const ok = await copyText(buildNoteText(currentNote()));
    if (ok) toast.success('Teks nota disalin');
    else toast.error('Gagal menyalin nota');
  };

  const handleNew = () => {
    dispatch({ type: 'reset' });
    void deleteMeta(DRAFT_KEY);
    if (id) navigate('/');
    focusInput();
  };

  const handleDelete = async () => {
    if (draft.savedId) await deleteNote(draft.savedId);
    setConfirmDelete(false);
    dispatch({ type: 'reset' });
    void deleteMeta(DRAFT_KEY);
    toast.success('Nota dihapus');
    navigate('/');
  };

  const actionProps = {
    total: totals.total,
    itemCount: draft.items.length,
    isSaved: Boolean(draft.savedId),
    getNote: currentNote,
    onFocusInput: focusInput,
    onSave: handleSave,
    onCopy: handleCopy,
    onPrint: () => window.print(),
    onNew: handleNew,
    onDelete: () => setConfirmDelete(true),
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-4 pb-44 pt-5 md:px-8 md:pb-16 md:pt-8">
        <div className="no-print flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="page-title">
              {draft.savedId ? 'Nota tersimpan' : 'Nota'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {draft.items.length
                ? `${draft.items.length} item · ketik lagi lalu Enter`
                : 'Ketik item lalu tekan Enter. Secepat kalkulator.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleNew}
            data-testid="new-note-btn"
            className={cn(btnOutline, btnSize.sm, 'shrink-0')}
          >
            <FilePlus2 className="h-4 w-4" />
            <span className="hidden sm:inline">Nota Baru</span>
          </button>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 md:gap-8 lg:gap-12">
          <div className="no-print space-y-4">
            <NoteEditor inputRef={inputRef} onAdd={(parsed) => dispatch({ type: 'add', parsed })} />
            <DiscountControl
              discount={draft.discount}
              subtotal={totals.subtotal}
              onChange={(discount) => dispatch({ type: 'discount', discount })}
            />
            <NoteMemo note={draft.note} onChange={(note) => dispatch({ type: 'note', note })} />
            <div className="hidden md:block">
              <NoteActions {...actionProps} />
            </div>
          </div>

          <div className="md:sticky md:top-24 md:self-start">
            <NotePreview
              items={draft.items}
              totals={totals}
              discount={draft.discount}
              note={draft.note}
              createdAt={draft.createdAt}
              onEditItem={(itemId, parsed) => dispatch({ type: 'update', id: itemId, parsed })}
              onDuplicateItem={(index) => dispatch({ type: 'duplicate', index })}
              onRemoveItem={(itemId) => dispatch({ type: 'remove', id: itemId })}
              onMoveItem={(index, direction) => dispatch({ type: 'move', index, direction })}
            />
          </div>
        </div>
      </main>

      <ActionDock {...actionProps} />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Hapus nota ini?"
        description="Nota yang dihapus tidak dapat dikembalikan."
        onConfirm={handleDelete}
        testId="confirm-delete-note"
      />
    </div>
  );
}
