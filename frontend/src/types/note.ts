export type DiscountType = 'none' | 'nominal' | 'percent';

export interface Discount {
  type: DiscountType;
  value: number;
}

export interface NoteItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  rawInput: string;
}

export interface Note {
  id: string;
  createdAt: string;
  updatedAt: string;
  items: NoteItem[];
  subtotal: number;
  discount: Discount;
  discountAmount: number;
  total: number;
  note: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type PrintSize = 'a4' | 'thermal';

export interface Settings {
  theme: ThemeMode;
  printSize: PrintSize;
  storeName: string;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  printSize: 'a4',
  storeName: '',
};

export const NO_DISCOUNT: Discount = { type: 'none', value: 0 };

export interface BackupFile {
  app: 'notakalk';
  version: number;
  exportedAt: string;
  notes: Note[];
  settings: Settings;
}
