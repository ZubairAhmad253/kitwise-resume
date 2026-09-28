import { describe, expect, it } from 'vitest';
import { emptyResume } from './defaults';
import { docKey, INDEX_KEY, LEGACY_KEY, loadIndex, openCurrent, readResume, removeResume, saveResume, setCurrent, type KeyValueStore } from './library';
import { sampleById } from './samples';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe('resume library', () => {
  it('moves the old single saved resume into the library', () => {
    const store = memoryStore();
    const old = sampleById('software')!.build();
    store.setItem(LEGACY_KEY, JSON.stringify(old));
    const index = loadIndex(store);
    expect(index.current).toBe(old.id);
    expect(index.entries.map((e) => e.name)).toEqual([old.name]);
    expect(store.getItem(LEGACY_KEY)).toBeNull();
    expect(readResume(store, old.id)?.basics.name).toBe('Aisha Rahman');
  });

  it('saves, lists newest first, switches and removes', () => {
    const store = memoryStore();
    const a = { ...emptyResume(), name: 'A', updatedAt: '2026-01-01T00:00:00Z' };
    const b = { ...emptyResume(), name: 'B', updatedAt: '2026-02-01T00:00:00Z' };
    saveResume(store, a);
    expect(saveResume(store, b).map((e) => e.name)).toEqual(['B', 'A']);
    expect(openCurrent(store)?.name).toBe('B');
    setCurrent(store, a.id);
    expect(openCurrent(store)?.name).toBe('A');
    expect(removeResume(store, a.id).map((e) => e.name)).toEqual(['B']);
    expect(store.getItem(docKey(a.id))).toBeNull();
    expect(openCurrent(store)?.name).toBe('B');
  });

  it('ignores index entries whose resume is gone, and bad data', () => {
    const store = memoryStore();
    store.setItem(INDEX_KEY, JSON.stringify({ version: 1, current: 'x', entries: [{ id: 'x', name: 'Lost', updatedAt: '', template: '' }] }));
    expect(loadIndex(store).entries).toEqual([]);
    expect(openCurrent(store)).toBeNull();
    store.setItem(INDEX_KEY, '{not json');
    expect(loadIndex(store).entries).toEqual([]);
  });
});
