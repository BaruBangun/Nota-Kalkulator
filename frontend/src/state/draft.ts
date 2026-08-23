import { createNoteItem, duplicateItem, moveItem } from '@/lib/calculator';
import type { Discount, Note, NoteItem } from '@/types/note';
import { NO_DISCOUNT } from '@/types/note';
import type { ParsedTransaction } from '@/types/transaction';

export interface DraftState {
  savedId: string | null;
  createdAt: string | null;
  items: NoteItem[];
  discount: Discount;
  note: string;
}

export const emptyDraft: DraftState = {
  savedId: null,
  createdAt: null,
  items: [],
  discount: NO_DISCOUNT,
  note: '',
};

export type DraftAction =
  | { type: 'add'; parsed: ParsedTransaction[] }
  | { type: 'update'; id: string; parsed: ParsedTransaction }
  | { type: 'remove'; id: string }
  | { type: 'move'; index: number; direction: -1 | 1 }
  | { type: 'duplicate'; index: number }
  | { type: 'discount'; discount: Discount }
  | { type: 'note'; note: string }
  | { type: 'load'; note: Note }
  | { type: 'restore'; draft: DraftState }
  | { type: 'saved'; note: Note }
  | { type: 'reset' };

function fromNote(note: Note): DraftState {
  return {
    savedId: note.id,
    createdAt: note.createdAt,
    items: note.items,
    discount: note.discount ?? NO_DISCOUNT,
    note: note.note ?? '',
  };
}

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'add':
      return { ...state, items: [...state.items, ...action.parsed.map(createNoteItem)] };
    case 'update':
      return {
        ...state,
        items: state.items.map((item): NoteItem =>
          item.id === action.id
            ? {
                ...item,
                name: action.parsed.name,
                quantity: action.parsed.quantity,
                unitPrice: action.parsed.unitPrice,
                subtotal: action.parsed.subtotal,
                rawInput: action.parsed.rawInput,
              }
            : item,
        ),
      };
    case 'remove':
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };
    case 'move':
      return { ...state, items: moveItem(state.items, action.index, action.direction) };
    case 'duplicate':
      return { ...state, items: duplicateItem(state.items, action.index) };
    case 'discount':
      return { ...state, discount: action.discount };
    case 'note':
      return { ...state, note: action.note };
    case 'load':
      return fromNote(action.note);
    case 'restore':
      return { ...emptyDraft, ...action.draft };
    case 'saved':
      return { ...state, savedId: action.note.id, createdAt: action.note.createdAt };
    case 'reset':
      return emptyDraft;
    default:
      return state;
  }
}
