import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { shareNote } from '@/lib/share';
import { btnOutline, btnSize } from '@/lib/styles';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/note';

interface Props {
  getNote: () => Note;
  disabled?: boolean;
  className?: string;
  label?: string;
  testId?: string;
}

export const ShareButton = ({
  getNote,
  disabled,
  className,
  label = 'Bagikan',
  testId = 'share-btn',
}: Props) => {
  const handleShare = async () => {
    const outcome = await shareNote(getNote());
    if (outcome === 'copied') toast.success('Nota disalin ke clipboard');
    if (outcome === 'failed') toast.error('Gagal membagikan nota');
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={disabled}
      data-testid={testId}
      className={cn(btnOutline, btnSize.md, className)}
    >
      <Share2 className="h-4 w-4" />
      {label}
    </button>
  );
};
