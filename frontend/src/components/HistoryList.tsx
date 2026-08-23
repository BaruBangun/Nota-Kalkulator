import { Copy, FolderOpen, MoreVertical, Share2, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/primitives';
import { formatNumber } from '@/lib/currency';
import { formatTime } from '@/lib/dates';
import type { NoteGroup } from '@/lib/dates';
import { cardBase } from '@/lib/styles';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/note';

interface Props {
  groups: NoteGroup[];
  onOpen: (note: Note) => void;
  onDuplicate: (note: Note) => void;
  onShare: (note: Note) => void;
  onDelete: (note: Note) => void;
}

function preview(note: Note): string {
  const names = note.items.slice(0, 3).map((item) => item.name);
  const rest = note.items.length - names.length;
  return [names.join(', '), rest > 0 ? `+${rest} lagi` : ''].filter(Boolean).join(' ');
}

export const HistoryList = ({ groups, onOpen, onDuplicate, onShare, onDelete }: Props) => (
  <div className="space-y-8" data-testid="history-list">
    {groups.map((group) => (
      <section key={group.label} className="animate-fade-up">
        <div className="flex items-baseline justify-between gap-3 px-1 pb-2.5">
          <h2 className="text-base font-semibold tracking-tight">{group.label}</h2>
          <span className="font-mono text-xs text-muted-foreground">
            {group.notes.length} nota · {formatNumber(group.total)}
          </span>
        </div>

        <ul className="space-y-2">
          {group.notes.map((note) => (
            <li
              key={note.id}
              className={cn(cardBase, 'flex items-stretch gap-1 p-1 pl-3.5')}
              data-testid={`history-note-${note.id}`}
            >
              <button
                type="button"
                onClick={() => onOpen(note)}
                data-testid={`history-open-${note.id}`}
                className="min-w-0 flex-1 rounded-md py-3 pr-2 text-left transition-colors duration-150 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-sm text-muted-foreground">{formatTime(note.createdAt)}</span>
                  <span className="font-mono text-lg font-semibold tabular tracking-tight">
                    {formatNumber(note.total)}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {note.items.length} item{preview(note) ? ` · ${preview(note)}` : ''}
                </p>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Menu nota ${formatTime(note.createdAt)}`}
                    data-testid={`history-menu-${note.id}`}
                    className="flex w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onOpen(note)} data-testid={`history-menu-open-${note.id}`}>
                    <FolderOpen className="h-4 w-4" /> Buka
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(note)} data-testid={`history-duplicate-${note.id}`}>
                    <Copy className="h-4 w-4" /> Duplikat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(note)} data-testid={`history-share-${note.id}`}>
                    <Share2 className="h-4 w-4" /> Bagikan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(note)}
                    className="text-destructive focus:text-destructive"
                    data-testid={`history-delete-${note.id}`}
                  >
                    <Trash2 className="h-4 w-4" /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </div>
);
