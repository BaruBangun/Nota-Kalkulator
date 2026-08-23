import { cardBase, inputBase, labelBase } from '@/lib/styles';
import { cn } from '@/lib/utils';

interface Props {
  note: string;
  onChange: (note: string) => void;
}

export const NoteMemo = ({ note, onChange }: Props) => (
  <section className={cn(cardBase, 'no-print p-4')} data-testid="note-memo">
    <label htmlFor="note-memo-input" className={labelBase}>
      Catatan
    </label>
    <textarea
      id="note-memo-input"
      data-testid="note-memo-input"
      value={note}
      rows={2}
      placeholder="Mis. Pesanan Pak Budi / Bayar sebagian"
      onChange={(event) => onChange(event.target.value)}
      className={cn(inputBase, 'mt-2 resize-none py-3 text-sm')}
    />
  </section>
);
