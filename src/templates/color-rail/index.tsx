/**
 * #13 Color-Pop Left Rail: a vivid coral strip down the left edge of every
 * page, highlighter-style section headings and skill bars in the same
 * colour. Montserrat headings with Lato.
 */
import '@fontsource-variable/montserrat';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import './color-rail.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, LEVEL_WORDS, sectionBlocks, splitSections, standalone, UrlLink, tr } from '../shared';
import type { Block, TemplateDef } from '../types';

const SIDE_KINDS = ['skills', 'languages', 'certifications', 'awards', 'education'] as const;

function build(r: Resume) {
  const { side, main } = splitSections(r, [...SIDE_KINDS]);
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const header = (
    <div className="cr-head">
      {showPhoto && <img className="cr-photo" src={b.photo} alt="" />}
      <div className="cr-head-text">
        <h1 className="cr-name">{b.name || 'Your Name'}</h1>
        {b.headline && <p className="cr-headline">{b.headline}</p>}
        {contacts.length > 0 && (
          <ul className="cr-contact">
            {contacts.map((c) => (
              <li key={c.kind}>
                <ContactValue line={c} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const mainTitle = (s: Section) => (
    <h2 className="cr-title">
      <span>{s.title}</span>
    </h2>
  );
  const sideTitle = (s: Section) => <h3 className="cr-side-title">{s.title}</h3>;

  const mainBlocks: Block[] = [];
  if (b.summary) mainBlocks.push(standalone('summary', <RichText source={b.summary} className="cr-summary" />));
  for (const s of main)
    mainBlocks.push(
      ...sectionBlocks(s, {
        title: mainTitle,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="cr-item">
              <div className="cr-item-row">
                <h4 className="cr-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="cr-date">{when}</span>}
              </div>
              {where && <p className="cr-where">{where}</p>}
              {it.tags.length > 0 && (
                <p className="cr-tags">
                  {it.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </p>
              )}
              {it.url && (
                <p className="cr-link">
                  <UrlLink url={it.url} />
                </p>
              )}
            </div>
          );
        },
      }),
    );

  const sideBlocks: Block[] = [];
  for (const s of side)
    sideBlocks.push(
      ...sectionBlocks(s, {
        title: sideTitle,
        inlineDescription: () => true,
        item: (sec, it) => (
          <div className="cr-side-item">
            <p className="cr-side-item-title">{it.title || KINDS[sec.kind].titleLabel}</p>
            {it.subtitle && <p className="cr-muted">{it.subtitle}</p>}
            {sec.kind !== 'skills' && sec.kind !== 'languages' && dateText(r, sec, it) && <p className="cr-muted">{dateText(r, sec, it)}</p>}
            {it.tags.length > 0 && <p className="cr-side-tags">{it.tags.join(', ')}</p>}
            {it.level > 0 && (
              <span className="cr-meter" role="img" aria-label={tr(r, LEVEL_WORDS[it.level])}>
                <span style={{ width: `${it.level * 20}%` }} />
              </span>
            )}
            {it.description && <RichText source={it.description} className="cr-muted" />}
          </div>
        ),
      }),
    );

  return { header, regions: { main: mainBlocks, side: sideBlocks } };
}

export const colorRail: TemplateDef = {
  id: 'color-rail',
  number: 13,
  name: 'Color-Pop Left Rail',
  category: 'Creative, design & marketing',
  description: 'A vivid colour strip down the page, highlighter headings and bold skill meters for creative roles.',
  className: 't-color-rail',
  margins: { top: 15, topNext: 20, right: 14, bottom: 13, left: 22 },
  regions: ['main', 'side'],
  accent: { vars: ['--cr-pop'], tints: [['--cr-pop-soft', 22]], color: '#ff5a5f' },
  build,
  decor: () => <div className="cr-strip" />,
};
