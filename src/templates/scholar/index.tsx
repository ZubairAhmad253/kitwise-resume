/**
 * #19 Scholar Block: an academic CV built from shaded blocks. Each
 * section opens with a tinted heading band, publications are numbered
 * like a reference list, and dates sit flush right. Crimson Pro (in place
 * of Palatino) with EB Garamond.
 */
import '@fontsource-variable/crimson-pro';
import '@fontsource-variable/eb-garamond';
import './scholar.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, LEVEL_WORDS, sectionBlocks, standalone, UrlLink, visibleSections } from '../shared';
import type { Block, TemplateDef } from '../types';

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="sb-head">
          <div className="sb-head-text">
            <h1 className="sb-name">{b.name || 'Your Name'}</h1>
            {b.headline && <p className="sb-headline">{b.headline}</p>}
          </div>
          {contacts.length > 0 && (
            <ul className="sb-contact">
              {contacts.map((c) => (
                <li key={c.kind}>
                  <ContactValue line={c} />
                </li>
              ))}
            </ul>
          )}
          {showPhoto && <img className="sb-photo" src={b.photo} alt="" />}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary) blocks.push(standalone('summary', <RichText source={b.summary} className="sb-summary" />));

  const title = (s: Section) => <h2 className="sb-title">{s.title}</h2>;
  for (const s of visibleSections(r)) {
    let ref = s.items.length;
    blocks.push(
      ...sectionBlocks(s, {
        title,
        // A publication's authors belong inside the numbered entry.
        inlineDescription: (sec) => sec.kind === 'publications',
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <p className="sb-inline">
              {sec.items.map((it) => (
                <span key={it.id}>
                  <strong>{it.title}</strong>
                  {[it.subtitle || (it.level ? LEVEL_WORDS[it.level] : ''), it.tags.join(', ')].filter(Boolean).length > 0 && (
                    <>: {[it.subtitle || (it.level ? LEVEL_WORDS[it.level] : ''), it.tags.join(', ')].filter(Boolean).join('; ')}</>
                  )}
                </span>
              ))}
            </p>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          // Publications count down, newest first, like a numbered reference list.
          const num = sec.kind === 'publications' ? ref-- : 0;
          return (
            <div className={num ? 'sb-item sb-ref' : 'sb-item'}>
              {num > 0 && <span className="sb-num">[{num}]</span>}
              <div className="sb-item-body">
                <div className="sb-item-row">
                  <h4 className="sb-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                  {when && <span className="sb-date">{when}</span>}
                </div>
                {(it.subtitle || it.location) && <p className="sb-where">{[it.subtitle, it.location].filter(Boolean).join(', ')}</p>}
                {it.tags.length > 0 && <p className="sb-muted">{it.tags.join(', ')}</p>}
                {it.url && (
                  <p className="sb-link">
                    <UrlLink url={it.url} />
                  </p>
                )}
                {num > 0 && it.description && <RichText source={it.description} className="sb-authors" />}
              </div>
            </div>
          );
        },
      }),
    );
  }

  return { regions: { main: blocks } };
}

export const scholar: TemplateDef = {
  id: 'scholar',
  number: 19,
  name: 'Scholar Block',
  category: 'Academia, science & legal',
  description: 'Shaded heading blocks, a numbered publication list and flush-right dates for research and teaching CVs.',
  className: 't-scholar',
  margins: { top: 15, topNext: 21, right: 16, bottom: 14, left: 16 },
  regions: ['main'],
  accent: { vars: ['--sb-accent'], color: '#2f4a73' },
  build,
};
