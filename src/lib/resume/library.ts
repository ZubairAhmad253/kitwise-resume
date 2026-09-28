/**
 * All of a user's resumes, kept in this browser's localStorage: one entry
 * per resume plus a small index (names, dates, template) for the list, so
 * the menu never has to load every resume. The first version stored a
 * single resume under "kitwise-resume:current"; it is moved in on first load.
 */
import { normalizeResume } from './normalize';
import type { Resume } from './types';

export interface LibraryEntry {
  id: string;
  name: string;
  updatedAt: string;
  template: string;
}

interface Index {
  version: 1;
  current: string | null;
  entries: LibraryEntry[];
}

/** The part of the Storage API used here, so tests can pass a Map-backed fake. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const LEGACY_KEY = 'kitwise-resume:current';
export const INDEX_KEY = 'kitwise-resume:library';
export const docKey = (id: string) => `kitwise-resume:doc:${id}`;

const entryOf = (r: Resume): LibraryEntry => ({ id: r.id, name: r.name, updatedAt: r.updatedAt, template: r.settings.template });

function readJson(store: KeyValueStore, key: string): unknown {
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeIndex(store: KeyValueStore, index: Index) {
  store.setItem(INDEX_KEY, JSON.stringify(index));
}

/** The index, created (and the old single resume moved in) if needed. Newest first. */
export function loadIndex(store: KeyValueStore): Index {
  const raw = readJson(store, INDEX_KEY) as Partial<Index> | null;
  if (raw && Array.isArray(raw.entries)) {
    const entries = raw.entries.filter((e): e is LibraryEntry => Boolean(e && typeof e.id === 'string' && store.getItem(docKey(e.id)) !== null));
    return { version: 1, current: typeof raw.current === 'string' ? raw.current : null, entries: sortEntries(entries) };
  }
  const index: Index = { version: 1, current: null, entries: [] };
  const legacy = normalizeResume(readJson(store, LEGACY_KEY));
  if (legacy) {
    store.setItem(docKey(legacy.id), JSON.stringify(legacy));
    index.entries = [entryOf(legacy)];
    index.current = legacy.id;
    writeIndex(store, index);
    store.removeItem(LEGACY_KEY);
  }
  return index;
}

const sortEntries = (e: LibraryEntry[]) => [...e].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

export function readResume(store: KeyValueStore, id: string): Resume | null {
  return normalizeResume(readJson(store, docKey(id)));
}

/** Saves a resume and makes it the current one. Throws if storage is full or blocked. */
export function saveResume(store: KeyValueStore, r: Resume): LibraryEntry[] {
  store.setItem(docKey(r.id), JSON.stringify(r));
  const index = loadIndex(store);
  index.entries = sortEntries([entryOf(r), ...index.entries.filter((e) => e.id !== r.id)]);
  index.current = r.id;
  writeIndex(store, index);
  return index.entries;
}

export function setCurrent(store: KeyValueStore, id: string) {
  const index = loadIndex(store);
  index.current = id;
  writeIndex(store, index);
}

export function removeResume(store: KeyValueStore, id: string): LibraryEntry[] {
  store.removeItem(docKey(id));
  const index = loadIndex(store);
  index.entries = index.entries.filter((e) => e.id !== id);
  if (index.current === id) index.current = index.entries[0]?.id ?? null;
  writeIndex(store, index);
  return index.entries;
}

/** The resume to open: the current one, else the most recent, else none. */
export function openCurrent(store: KeyValueStore): Resume | null {
  const index = loadIndex(store);
  for (const id of [index.current, ...index.entries.map((e) => e.id)]) {
    if (!id) continue;
    const r = readResume(store, id);
    if (r) return r;
  }
  return null;
}
