/**
 * Turns anything (a backup file, old saved data, a sample) into a valid
 * Resume: missing fields get defaults, wrong types are dropped, unknown
 * section kinds become "custom". Never throws on odd input; returns null
 * only when it isn't a resume at all.
 */
import { isSectionKind, KINDS } from './schema';
import { defaultSettings, emptyBasics, uid } from './defaults';
import type { Basics, DateFormat, Item, PaperSize, Resume, Section, Settings } from './types';

const str = (v: unknown, max = 5000): string => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' ? String(v) : '');
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Keeps "YYYY" and "YYYY-MM"; anything else becomes ''. */
export function cleanDate(v: unknown): string {
  const s = str(v, 20).trim();
  const m = /^(\d{4})(?:-(\d{1,2}))?/.exec(s);
  if (!m) return '';
  const month = m[2] ? Number(m[2]) : 0;
  return month >= 1 && month <= 12 ? `${m[1]}-${String(month).padStart(2, '0')}` : m[1];
}

const PHOTO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const PAPERS: PaperSize[] = ['A4', 'Letter', 'Legal'];
const FORMATS: DateFormat[] = ['MMM YYYY', 'MM/YYYY', 'YYYY'];

function normalizeBasics(v: unknown): Basics {
  const o = obj(v);
  const b = emptyBasics();
  for (const key of Object.keys(b) as (keyof Basics)[]) {
    if (key === 'photo') continue;
    b[key] = str(o[key], key === 'summary' ? 5000 : 300);
  }
  const photo = str(o.photo, 2_000_000);
  b.photo = PHOTO.test(photo) ? photo : '';
  return b;
}

function normalizeItem(v: unknown, seen: Set<string>): Item {
  const o = obj(v);
  let id = str(o.id, 60);
  if (!id || seen.has(id)) id = uid('i');
  seen.add(id);
  const level = Number(o.level);
  return {
    id,
    title: str(o.title, 300),
    subtitle: str(o.subtitle, 300),
    location: str(o.location, 200),
    start: cleanDate(o.start),
    end: cleanDate(o.end),
    current: bool(o.current, false),
    url: str(o.url, 500),
    description: str(o.description, 5000),
    tags: Array.isArray(o.tags) ? o.tags.map((t) => str(t, 80).trim()).filter(Boolean).slice(0, 40) : [],
    level: Number.isFinite(level) ? Math.min(5, Math.max(0, Math.round(level))) : 0,
  };
}

function normalizeSection(v: unknown, seen: Set<string>): Section {
  const o = obj(v);
  const kind = isSectionKind(o.kind) ? o.kind : 'custom';
  let id = str(o.id, 60);
  if (!id || seen.has(id)) id = uid('s');
  seen.add(id);
  const items = Array.isArray(o.items) ? o.items.slice(0, 100).map((i) => normalizeItem(i, seen)) : [];
  return { id, kind, title: str(o.title, 120) || KINDS[kind].label, hidden: bool(o.hidden, false), items };
}

function normalizeSettings(v: unknown): Settings {
  const o = obj(v);
  const d = defaultSettings();
  return {
    template: str(o.template, 60) || d.template,
    paper: PAPERS.includes(o.paper as PaperSize) ? (o.paper as PaperSize) : d.paper,
    dateFormat: FORMATS.includes(o.dateFormat as DateFormat) ? (o.dateFormat as DateFormat) : d.dateFormat,
    showPhoto: bool(o.showPhoto, d.showPhoto),
    fitOnePage: bool(o.fitOnePage, d.fitOnePage),
  };
}

export function normalizeResume(input: unknown): Resume | null {
  const o = obj(input);
  // A resume needs at least a basics object or a sections array.
  if (!('basics' in o) && !Array.isArray(o.sections)) return null;
  const seen = new Set<string>();
  return {
    version: 1,
    id: str(o.id, 60) || uid('r'),
    name: str(o.name, 120) || 'My resume',
    updatedAt: str(o.updatedAt, 40) || new Date().toISOString(),
    basics: normalizeBasics(o.basics),
    sections: Array.isArray(o.sections) ? o.sections.slice(0, 40).map((s) => normalizeSection(s, seen)) : [],
    settings: normalizeSettings(o.settings),
  };
}
