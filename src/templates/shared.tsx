/**
 * Building blocks shared by the templates: turning sections and entries
 * into page-breakable blocks, contact details, dates and levels.
 */
import type { ReactNode } from 'react';
import { formatRange } from '@/lib/resume/dates';
import { parseRichText, type Block as RtBlock } from '@/lib/resume/richtext';
import { singleDate } from '@/lib/resume/schema';
import type { Basics, Item, Resume, Section, SectionKind } from '@/lib/resume/types';
import { RichTextBlocks } from '@/components/resume/RichText';
import type { Block } from './types';

/** Sections that are shown and have content. */
export const visibleSections = (r: Resume) => r.sections.filter((s) => !s.hidden && s.items.length > 0);

/** Split sections between two columns by kind, keeping the user's order within each. */
export function splitSections(r: Resume, sideKinds: SectionKind[]) {
  const all = visibleSections(r);
  return { side: all.filter((s) => sideKinds.includes(s.kind)), main: all.filter((s) => !sideKinds.includes(s.kind)) };
}

export const dateText = (r: Resume, s: Section, it: Item) => formatRange(it.start, it.end, it.current, r.settings.dateFormat, singleDate(s.kind));

export interface ContactLine {
  kind: 'email' | 'phone' | 'location' | 'website' | 'linkedin' | 'github';
  label: string;
  value: string;
  href?: string;
}

const withScheme = (v: string) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const bare = (v: string) => v.replace(/^https?:\/\//i, '').replace(/\/$/, '');

export function contactLines(b: Basics): ContactLine[] {
  const out: ContactLine[] = [];
  if (b.email) out.push({ kind: 'email', label: 'Email', value: b.email, href: `mailto:${b.email}` });
  if (b.phone) out.push({ kind: 'phone', label: 'Phone', value: b.phone, href: `tel:${b.phone.replace(/[^\d+]/g, '')}` });
  if (b.location) out.push({ kind: 'location', label: 'Location', value: b.location });
  if (b.website) out.push({ kind: 'website', label: 'Website', value: bare(b.website), href: withScheme(b.website) });
  if (b.linkedin) out.push({ kind: 'linkedin', label: 'LinkedIn', value: bare(b.linkedin), href: withScheme(b.linkedin) });
  if (b.github) out.push({ kind: 'github', label: 'GitHub', value: bare(b.github), href: withScheme(b.github) });
  return out;
}

/** Long addresses may wrap only after "@" or "/", never mid-word. */
function breakable(value: string) {
  const parts = value.split(/(?<=[@/])/);
  return parts.map((p, i) => (
    <span key={i}>
      {p}
      {i < parts.length - 1 && <wbr />}
    </span>
  ));
}

/** Contact value as a link when it has one (links stay clickable in the PDF). */
export function ContactValue({ line }: { line: ContactLine }) {
  return line.href ? (
    <a href={line.href} style={{ color: 'inherit', textDecoration: 'none' }}>
      {breakable(line.value)}
    </a>
  ) : (
    <>{breakable(line.value)}</>
  );
}

/**
 * A description as separate pieces, one per paragraph and one per bullet,
 * so a long entry can continue on the next page between bullets.
 */
export function descriptionPieces(source: string): RtBlock[] {
  return parseRichText(source).flatMap((b): RtBlock[] => (b.type === 'list' ? b.items.map((it) => ({ type: 'list', items: [it] })) : [b]));
}

/**
 * Wraps a block's content with its spacing role. Templates set the gaps:
 * `.kr-b--title`, `.kr-b--item`, `.kr-b--desc`, and the larger gaps after
 * `.kr-end-item` (last block of an entry) and `.kr-end-section`.
 */
const role = (kind: 'title' | 'item' | 'desc' | 'whole', endItem: boolean, endSection: boolean, node: ReactNode) => (
  <div className={`kr-b kr-b--${kind}${endItem ? ' kr-end-item' : ''}${endSection ? ' kr-end-section' : ''}`}>{node}</div>
);

export interface SectionRenderers {
  /** Section heading. */
  title: (s: Section) => ReactNode;
  /** Header of one entry (title, subtitle, dates…), without its description. */
  item: (s: Section, it: Item) => ReactNode;
  /** Render the description inside the item node instead of as separate blocks. */
  inlineDescription?: (s: Section) => boolean;
  /** Render a whole section as one node (e.g. a chip cloud of skills). */
  whole?: (s: Section) => ReactNode | null;
}

/**
 * Blocks for one section: heading (kept with what follows), then each
 * entry header (kept with its first line), then its description lines.
 */
export function sectionBlocks(s: Section, r: SectionRenderers): Block[] {
  const title: Block = { key: `${s.id}:title`, node: role('title', false, false, r.title(s)), keepWithNext: true };
  const whole = r.whole?.(s);
  if (whole) return [title, { key: `${s.id}:all`, node: role('whole', true, true, whole) }];
  const out: Block[] = [title];
  s.items.forEach((it, idx) => {
    const lastItem = idx === s.items.length - 1;
    const desc = r.inlineDescription?.(s) ? [] : descriptionPieces(it.description);
    out.push({ key: `${s.id}:${it.id}`, node: role('item', desc.length === 0, lastItem && desc.length === 0, r.item(s, it)), keepWithNext: desc.length > 0 });
    desc.forEach((p, j) => {
      const lastPiece = j === desc.length - 1;
      out.push({ key: `${s.id}:${it.id}:d${j}`, node: role('desc', lastPiece, lastItem && lastPiece, <RichTextBlocks blocks={[p]} className="kr-desc" />) });
    });
  });
  return out;
}

/** A single free-standing block with section-end spacing (summary, intro text…). */
export const standalone = (key: string, node: ReactNode, keepWithNext = false): Block => ({ key, node: role('whole', true, true, node), keepWithNext });

/** Five dots or bars for a 1–5 level; nothing for level 0. */
export function Level({ value, className = 'kr-level', label }: { value: number; className?: string; label?: string }) {
  if (!value) return null;
  return (
    <span className={className} role="img" aria-label={label ?? `${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'on' : 'off'} />
      ))}
    </span>
  );
}

export const LEVEL_WORDS = ['', 'Beginner', 'Basic', 'Good', 'Very good', 'Expert'];

/** An entry's web address as a clickable link without the "https://". */
export function UrlLink({ url, className }: { url: string; className?: string }) {
  if (!url) return null;
  return (
    <a className={className} href={withScheme(url)} style={{ textDecoration: 'none' }}>
      {breakable(bare(url))}
    </a>
  );
}
