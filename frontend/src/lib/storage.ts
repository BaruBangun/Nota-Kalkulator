import type { Note, Settings } from '@/types/note';
import { DEFAULT_SETTINGS } from '@/types/note';

const DB_NAME = 'notakalk';
const DB_VERSION = 1;
const NOTES = 'notes';
const META = 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(NOTES)) {
          const store = db.createObjectStore(NOTES, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(META)) {
          db.createObjectStore(META, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

function toPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function read<T>(storeName: string, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readonly');
  return toPromise(run(tx.objectStore(storeName)));
}

async function write(storeName: string, run: (store: IDBObjectStore) => void): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  run(tx.objectStore(storeName));
  await done(tx);
}

export async function saveNote(note: Note): Promise<Note> {
  await write(NOTES, (store) => {
    store.put(note);
  });
  return note;
}

export async function putNotes(notes: Note[]): Promise<number> {
  await write(NOTES, (store) => {
    notes.forEach((note) => store.put(note));
  });
  return notes.length;
}

export async function getNote(id: string): Promise<Note | null> {
  const note = await read<Note | undefined>(NOTES, (store) => store.get(id));
  return note ?? null;
}

export async function listNotes(): Promise<Note[]> {
  const notes = await read<Note[]>(NOTES, (store) => store.getAll());
  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteNote(id: string): Promise<void> {
  await write(NOTES, (store) => {
    store.delete(id);
  });
}

export async function clearNotes(): Promise<void> {
  await write(NOTES, (store) => {
    store.clear();
  });
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await read<{ key: string; value: T } | undefined>(META, (store) => store.get(key));
  return row ? row.value : fallback;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  await write(META, (store) => {
    store.put({ key, value });
  });
}

export async function deleteMeta(key: string): Promise<void> {
  await write(META, (store) => {
    store.delete(key);
  });
}

export async function getSettings(): Promise<Settings> {
  const stored = await getMeta<Partial<Settings>>('settings', {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await setMeta('settings', settings);
}

export async function clearAllData(): Promise<void> {
  await clearNotes();
  await deleteMeta('draft');
}
