/**
 * Cover letters in the style of any resume template. The letter reuses the
 * template's typefaces and accent colour (it renders inside the template's
 * style scope) with its own simple letter layout, and goes through the same
 * page engine, so page breaks, paper sizes and PDF download all work.
 */
import './letter.css';
import { RichTextBlocks } from '@/components/resume/RichText';
import { letterDate } from '@/lib/resume/letters';
import type { Resume } from '@/lib/resume/types';
import { contactLines, ContactValue, descriptionPieces } from './shared';
import type { Block, TemplateDef } from './types';

function buildLetter(r: Resume, t: TemplateDef): { regions: { main: Block[] } } {
  const b = r.basics;
  const l = r.letter;
  const accent = { ['--kl-accent' as string]: r.settings.accent || t.accent.color };
  const contacts = contactLines(b);
  const blocks: Block[] = [
    {
      key: 'head',
      node: (
        <header className="kl-head" style={accent}>
          <p className="kl-name">{b.name || 'Your Name'}</p>
          {b.headline && <p className="kl-headline">{b.headline}</p>}
          {contacts.length > 0 && (
            <p className="kl-contact">
              {contacts.map((c, i) => (
                <span key={c.kind}>
                  {i > 0 && <span className="kl-sep"> · </span>}
                  <ContactValue line={c} />
                </span>
              ))}
            </p>
          )}
        </header>
      ),
    },
    { key: 'date', node: <p className="kl-date">{letterDate(r)}</p> },
  ];
  const to = [l.recipientName, l.recipientTitle, l.company, ...l.address.split('\n')].map((s) => s.trim()).filter(Boolean);
  if (to.length)
    blocks.push({
      key: 'to',
      node: (
        <p className="kl-to">
          {to.map((line, i) => (
            <span key={i} className="kl-line">
              {line}
            </span>
          ))}
        </p>
      ),
    });
  if (l.subject) blocks.push({ key: 'subject', node: <p className="kl-subject">{l.subject}</p>, keepWithNext: true });
  if (l.greeting) blocks.push({ key: 'greeting', node: <p className="kl-greeting">{l.greeting}</p>, keepWithNext: true });
  descriptionPieces(l.body).forEach((piece, i) => blocks.push({ key: `p${i}`, node: <RichTextBlocks blocks={[piece]} className="kl-body" /> }));
  blocks.push({
    key: 'sign',
    node: (
      <div className="kl-sign" style={accent}>
        {l.closing && <p>{l.closing}</p>}
        <p className="kl-signature">{l.signature || b.name || 'Your Name'}</p>
      </div>
    ),
  });
  return { regions: { main: blocks } };
}

const cache = new Map<string, TemplateDef>();

/** The letter version of a template (cached, so its identity is stable for the page engine). */
export function letterTemplateFor(t: TemplateDef): TemplateDef {
  let lt = cache.get(t.id);
  if (!lt) {
    lt = {
      ...t,
      id: `${t.id}:letter`,
      name: `${t.name} cover letter`,
      className: `${t.className} kl`,
      margins: { top: 20, topNext: 22, right: 22, bottom: 20, left: 22 },
      regions: ['main'],
      decor: undefined,
      build: (r: Resume) => buildLetter(r, t),
    };
    cache.set(t.id, lt);
  }
  return lt;
}
