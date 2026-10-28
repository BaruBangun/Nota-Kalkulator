import { ClipboardCopy, FileImage, FilePlus2, MoreHorizontal, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { ShareButton } from '@/components/ShareButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/primitives';
import { formatNumber } from '@/lib/currency';
import { btnOutline, btnPrimary, btnSecondary, btnSize } from '@/lib/styles';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/note';

export interface NoteActionsProps {
  total: number;
  itemCount: number;
  isSaved: boolean;
  getNote: () => Note;
  onFocusInput: () => void;
  onSave: () => void;
  onCopy: () => void;
  onPrint: () => void;
  onSaveImage: () => void;
  onNew: () => void;
  onDelete?: () => void;
}

const MoreMenu = ({ onCopy, onPrint, onSaveImage, onNew, onDelete, isSaved, suffix }: NoteActionsProps & { suffix: string }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label="Aksi lainnya"
        data-testid={`more-actions-btn-${suffix}`}
        className={cn(btnOutline, btnSize.icon, 'shrink-0')}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuItem onClick={onCopy} data-testid={`copy-note-${suffix}`}>
        <ClipboardCopy className="h-4 w-4" /> Copy teks nota
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onPrint} data-testid={`print-note-${suffix}`}>
        <Printer className="h-4 w-4" /> Print
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onSaveImage} data-testid={`save-image-${suffix}`}>
        <FileImage className="h-4 w-4" /> Simpan sebagai PNG
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onNew} data-testid={`new-note-${suffix}`}>
        <FilePlus2 className="h-4 w-4" /> Nota baru
      </DropdownMenuItem>
      {isSaved && onDelete && (
        <DropdownMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
          data-testid={`delete-note-${suffix}`}
        >
          <Trash2 className="h-4 w-4" /> Hapus nota
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

export const NoteActions = (props: NoteActionsProps) => {
  const { itemCount, isSaved, getNote, onSave } = props;
  return (
    <div className="no-print flex flex-wrap items-center gap-2" data-testid="note-actions">
      <button
        type="button"
        onClick={onSave}
        disabled={!itemCount}
        data-testid="save-note-btn"
        className={cn(btnPrimary, btnSize.md, 'min-w-[130px]')}
      >
        <Save className="h-4 w-4" />
        {isSaved ? 'Perbarui' : 'Simpan'}
      </button>
      <ShareButton getNote={getNote} disabled={!itemCount} />
      <MoreMenu {...props} suffix="inline" />
    </div>
  );
};

export const ActionDock = (props: NoteActionsProps) => {
  const { total, itemCount, isSaved, getNote, onFocusInput, onSave } = props;
  return (
    <div
      className="no-print dock-safe fixed inset-x-0 bottom-0 z-30 border-t border-border glass px-4 pt-3 md:hidden"
      data-testid="action-dock"
    >
      <div className="mx-auto flex w-full max-w-2xl items-baseline justify-between pb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Total {itemCount} item
        </span>
        <span className="font-mono text-2xl font-semibold tabular tracking-tight" data-testid="dock-total">
          {formatNumber(total)}
        </span>
      </div>
      <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
        <button
          type="button"
          onClick={onFocusInput}
          data-testid="focus-input-btn"
          className={cn(btnSecondary, btnSize.md, 'min-w-0 flex-1 px-2 text-xs')}
        >
          <Plus className="h-4 w-4" /> Item
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!itemCount}
          data-testid="save-note-dock-btn"
          className={cn(btnPrimary, btnSize.md, 'min-w-0 flex-1 px-2 text-xs')}
        >
          <Save className="h-4 w-4" />
          {isSaved ? 'Perbarui' : 'Simpan'}
        </button>
        <ShareButton
          getNote={getNote}
          disabled={!itemCount}
          testId="share-dock-btn"
          label="Bagikan"
          className="min-w-0 flex-1 px-2 text-xs"
        />
        <MoreMenu {...props} suffix="dock" />
      </div>
    </div>
  );
};
