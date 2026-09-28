import { KINDS } from './schema';
import type { Basics, Item, Resume, Section, SectionKind, Settings } from './types';

/** Short random id; unique enough for items within one resume. */
export function uid(prefix = 'i'): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${rand.slice(0, 10)}`;
}

export const emptyBasics = (): Basics => ({
  name: '',
  headline: '',
  email: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  photo: '',
  summary: '',
});

export const DEFAULT_TEMPLATE = 'corporate';

export const defaultSettings = (): Settings => ({
  template: DEFAULT_TEMPLATE,
  paper: 'A4',
  dateFormat: 'MMM YYYY',
  showPhoto: true,
  fitOnePage: false,
  accent: '',
  font: 'template',
  textSize: 'M',
  spacing: 'normal',
});

export const newItem = (patch: Partial<Item> = {}): Item => ({
  id: uid('i'),
  title: '',
  subtitle: '',
  location: '',
  start: '',
  end: '',
  current: false,
  url: '',
  description: '',
  tags: [],
  level: 0,
  ...patch,
});

export const newSection = (kind: SectionKind, patch: Partial<Section> = {}): Section => ({
  id: uid('s'),
  kind,
  title: KINDS[kind].label,
  hidden: false,
  items: [],
  ...patch,
});

/** A blank resume with the sections almost everyone needs. */
export const emptyResume = (): Resume => ({
  version: 1,
  id: uid('r'),
  name: 'My resume',
  updatedAt: new Date().toISOString(),
  basics: emptyBasics(),
  sections: [newSection('experience'), newSection('education'), newSection('skills')],
  settings: defaultSettings(),
});
