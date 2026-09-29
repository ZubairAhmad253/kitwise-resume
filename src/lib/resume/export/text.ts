/**
 * Plain-text and Markdown versions of a resume: for job sites that ask
 * you to paste your CV, for email, and as a simple ATS-safe copy.
 */
import { formatRange } from '../dates';
import { parseRichText, type Inline } from '../richtext';
import { singleDate } from '../schema';
import type { Item, Resume, Section } from '../types';

export const visibleSectionsOf = (r: Resume) => r.sections.filter((s) => !s.hidden && s.items.length > 0);

export const contactsOf = (r: Resume) => {
  const b = r.basics;
  return [b.email, b.phone, b.location, b.website, b.linkedin, b.github].filter(Boolean);
};

export const datesOf = (r: Resume, s: Section, it: Item) => formatRange(it.start, it.end, it.current, r.settings.dateFormat, singleDate(s.kind));

/** Inline rich text as plain words: bold and italic dropped, links as "label (address)". */
export function inlinePlain(nodes: Inline[], md = false): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.text;
      const inner = inlinePlain(n.children, md);
      if (n.type === 'bold') return md ? `**${inner}**` : inner;
      if (n.type === 'italic') return md ? `*${inner}*` : inner;
      if (md) return `[${inner}](${n.href})`;
      const bare = n.href.replace(/^mailto:|^https?:\/\//, '');
      return inner === bare || inner === n.href ? inner : `${inner} (${bare})`;
    })
    .join('');
}

/** A description as lines: paragraphs as they are, bullets with a marker. */
export function descriptionLines(source: string, bullet: string, md = false): string[] {
  return parseRichText(source).flatMap((b) => (b.type === 'paragraph' ? [inlinePlain(b.children, md)] : b.items.map((it) => `${bullet}${inlinePlain(it, md)}`)));
}

/** One line for an entry: "Title, Employer, Place (Dates)"; skills and languages read "Group: a, b". */
function headline(r: Resume, s: Section, it: Item): string {
  if (s.kind === 'skills') return [it.title, it.tags.join(', ')].filter(Boolean).join(': ');
  if (s.kind === 'languages') return [it.title, it.subtitle].filter(Boolean).join(': ');
  const main = [it.title, it.subtitle, it.location].filter(Boolean).join(', ');
  const when = datesOf(r, s, it);
  return when ? `${main} (${when})` : main;
}

export function toPlainText(r: Resume): string {
  const b = r.basics;
  const out: string[] = [b.name.toUpperCase(), b.headline, contactsOf(r).join(' | ')].filter(Boolean);
  if (b.summary) out.push('', 'SUMMARY', ...descriptionLines(b.summary, '• '));
  for (const s of visibleSectionsOf(r)) {
    out.push('', s.title.toUpperCase());
    for (const it of s.items) {
      out.push(headline(r, s, it));
      if (s.kind !== 'skills' && it.tags.length) out.push(it.tags.join(', '));
      if (it.url) out.push(it.url);
      out.push(...descriptionLines(it.description, '• '));
      if (s.kind !== 'skills' && s.kind !== 'languages') out.push('');
    }
    if (out[out.length - 1] === '') out.pop();
  }
  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

/** The cover letter as plain text, ready to paste into an email or job site. */
export function toLetterText(r: Resume, date: string): string {
  const b = r.basics;
  const l = r.letter;
  const out: string[] = [b.name, b.headline, contactsOf(r).join(' | '), '', date, ''];
  const to = [l.recipientName, l.recipientTitle, l.company, ...l.address.split('\n')].map((s) => s.trim()).filter(Boolean);
  if (to.length) out.push(...to, '');
  if (l.subject) out.push(l.subject, '');
  if (l.greeting) out.push(l.greeting, '');
  for (const p of descriptionLines(l.body, '• ')) out.push(p, '');
  out.push(l.closing, '', l.signature || b.name);
  // No double blank lines (a missing headline or subject leaves gaps).
  const lines = out.filter((x, i, a) => !(x === '' && a[i - 1] === ''));
  return `${lines.join('\n').trim()}\n`;
}

export function toMarkdown(r: Resume): string {
  const b = r.basics;
  const out: string[] = [`# ${b.name || 'Your Name'}`];
  if (b.headline) out.push('', `**${b.headline}**`);
  if (contactsOf(r).length) out.push('', contactsOf(r).join(' · '));
  if (b.summary) out.push('', ...descriptionLines(b.summary, '- ', true));
  for (const s of visibleSectionsOf(r)) {
    out.push('', `## ${s.title}`, '');
    if (s.kind === 'skills' || s.kind === 'languages') {
      for (const it of s.items) out.push(`- ${headline(r, s, it).replace(/^([^:]+):/, '**$1:**')}`);
      continue;
    }
    for (const it of s.items) {
      out.push(`### ${[it.title, it.subtitle].filter(Boolean).join(' · ')}`);
      const meta = [datesOf(r, s, it), it.location].filter(Boolean).join(' · ');
      if (meta) out.push(`*${meta}*`);
      if (it.tags.length) out.push(it.tags.map((t) => `\`${t}\``).join(' '));
      if (it.url) out.push(`<${/^https?:/i.test(it.url) ? it.url : `https://${it.url}`}>`);
      const desc = descriptionLines(it.description, '- ', true);
      if (desc.length) out.push('', ...desc);
      out.push('');
    }
  }
  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}
