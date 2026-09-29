/**
 * #6 Hybrid Blueprint: a faint drafting grid behind the page, a framed
 * title block for the name and dimension-line section headings in slate
 * blue. Libre Franklin headings (a free Franklin Gothic look) with Open Sans.
 */
import '@fontsource-variable/libre-franklin';
import '@fontsource-variable/open-sans';
import './blueprint.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, splitSections, standalone, UrlLink, tr } from '../shared';
import type { Block, TemplateDef } from '../types';

const SIDE_KINDS = ['skills', 'languages', 'certifications', 'awards'] as const;

function build(r: Resume) {
  const { side, main } = splitSections(r, [...SIDE_KINDS]);
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const header = (
    <div className="bp-titleblock">
      <div className="bp-tb-main">
        <p className="bp-tb-label">{tr(r, 'Drawing title')}</p>
        <h1 className="bp-name">{b.name || 'Your Name'}</h1>
        {b.headline && <p className="bp-headline">{b.headline}</p>}
      </div>
      {contacts.length > 0 && (
        <ul className="bp-tb-contact">
          {contacts.map((c) => (
            <li key={c.kind}>
              <span className="bp-tb-label">{c.label}</span>
              <span className="bp-tb-value">
                <ContactValue line={c} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {showPhoto && <img className="bp-photo" src={b.photo} alt="" />}
    </div>
  );

  const mainTitle = (s: Section) => (
    <h2 className="bp-title">
      <span>{s.title}</span>
    </h2>
  );
  const sideTitle = (s: Section) => <h3 className="bp-side-title">{s.title}</h3>;

  const mainBlocks: Block[] = [];
  if (b.summary) mainBlocks.push(standalone('summary', <RichText source={b.summary} className="bp-summary" />));
  for (const s of main)
    mainBlocks.push(
      ...sectionBlocks(s, {
        title: mainTitle,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="bp-item">
              <div className="bp-item-row">
                <h4 className="bp-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="bp-date">{when}</span>}
              </div>
              {where && <p className="bp-where">{where}</p>}
              {it.tags.length > 0 && <p className="bp-tags">{it.tags.join(' · ')}</p>}
              {it.url && (
                <p className="bp-link">
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
          <div className="bp-side-item">
            <p className="bp-side-item-title">{it.title}</p>
            {it.subtitle && <p className="bp-muted">{it.subtitle}</p>}
            {(sec.kind === 'certifications' || sec.kind === 'awards') && dateText(r, sec, it) && <p className="bp-muted">{dateText(r, sec, it)}</p>}
            {it.tags.length > 0 && (
              <p className="bp-chips">
                {it.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </p>
            )}
            <Level value={it.level} className="bp-level" />
            {it.description && <RichText source={it.description} className="bp-muted" />}
          </div>
        ),
      }),
    );

  return { header, regions: { main: mainBlocks, side: sideBlocks } };
}

export const blueprint: TemplateDef = {
  id: 'blueprint',
  number: 6,
  name: 'Hybrid Blueprint',
  category: 'Mechanical & electrical engineering',
  description: 'A drafting-sheet look: faint grid, a framed title block and dimension-line headings in slate blue.',
  className: 't-blueprint',
  margins: { top: 13, topNext: 20, right: 13, bottom: 13, left: 13 },
  regions: ['main', 'side'],
  accent: { vars: ['--bp-accent'], color: '#3b5b8c' },
  build,
  decor: () => (
    <>
      <div className="bp-grid" />
      <div className="bp-border" />
    </>
  ),
};
