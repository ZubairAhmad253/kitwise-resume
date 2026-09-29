/**
 * Every edit to a resume, as a pure reducer. The builder keeps the result
 * in React state and saves it to localStorage (see useResume).
 */
import { newItem, newSection, uid } from './defaults';
import type { Basics, CoverLetter, Item, Resume, Section, SectionKind, Settings } from './types';

export type Action =
  | { type: 'replace'; resume: Resume }
  | { type: 'rename'; name: string }
  | { type: 'basics'; patch: Partial<Basics> }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'letter'; patch: Partial<CoverLetter> }
  | { type: 'addSection'; kind: SectionKind; id?: string }
  | { type: 'updateSection'; id: string; patch: Partial<Pick<Section, 'title' | 'hidden'>> }
  | { type: 'removeSection'; id: string }
  | { type: 'moveSection'; from: number; to: number }
  | { type: 'addItem'; sectionId: string; id?: string }
  | { type: 'updateItem'; sectionId: string; itemId: string; patch: Partial<Omit<Item, 'id'>> }
  | { type: 'removeItem'; sectionId: string; itemId: string }
  | { type: 'moveItem'; sectionId: string; from: number; to: number }
  | { type: 'duplicateItem'; sectionId: string; itemId: string };

/** Move one element of an array; out-of-range moves return the array unchanged. */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = list.slice();
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

const mapSection = (r: Resume, id: string, fn: (s: Section) => Section): Resume => ({ ...r, sections: r.sections.map((s) => (s.id === id ? fn(s) : s)) });

function apply(r: Resume, a: Action): Resume {
  switch (a.type) {
    case 'replace':
      return a.resume;
    case 'rename':
      return { ...r, name: a.name };
    case 'basics':
      return { ...r, basics: { ...r.basics, ...a.patch } };
    case 'settings':
      return { ...r, settings: { ...r.settings, ...a.patch } };
    case 'letter':
      return { ...r, letter: { ...r.letter, ...a.patch } };
    case 'addSection':
      return { ...r, sections: [...r.sections, newSection(a.kind, a.id ? { id: a.id } : {})] };
    case 'updateSection':
      return mapSection(r, a.id, (s) => ({ ...s, ...a.patch }));
    case 'removeSection':
      return { ...r, sections: r.sections.filter((s) => s.id !== a.id) };
    case 'moveSection':
      return { ...r, sections: move(r.sections, a.from, a.to) };
    case 'addItem':
      return mapSection(r, a.sectionId, (s) => ({ ...s, items: [...s.items, newItem(a.id ? { id: a.id } : {})] }));
    case 'updateItem':
      return mapSection(r, a.sectionId, (s) => ({ ...s, items: s.items.map((i) => (i.id === a.itemId ? { ...i, ...a.patch } : i)) }));
    case 'removeItem':
      return mapSection(r, a.sectionId, (s) => ({ ...s, items: s.items.filter((i) => i.id !== a.itemId) }));
    case 'moveItem':
      return mapSection(r, a.sectionId, (s) => ({ ...s, items: move(s.items, a.from, a.to) }));
    case 'duplicateItem':
      return mapSection(r, a.sectionId, (s) => {
        const at = s.items.findIndex((i) => i.id === a.itemId);
        if (at < 0) return s;
        const copy = { ...s.items[at], id: uid('i'), tags: [...s.items[at].tags] };
        return { ...s, items: [...s.items.slice(0, at + 1), copy, ...s.items.slice(at + 1)] };
      });
  }
}

export function reducer(r: Resume, a: Action): Resume {
  const next = apply(r, a);
  if (next === r) return r;
  return a.type === 'replace' ? next : { ...next, updatedAt: new Date().toISOString() };
}
