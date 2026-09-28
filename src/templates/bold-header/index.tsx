/**
 * #8 Bold Header: a dark full-width band with a tall uppercase name, then
 * two columns. Projects get summary blocks with an amber top edge. Oswald
 * headings with Roboto.
 */
import '@fontsource-variable/oswald';
import '@fontsource-variable/roboto';
import './bold-header.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, splitSections, standalone, UrlLink } from '../shared';
import type { Block, TemplateDef } from '../types';

const SIDE_KINDS = ['skills', 'languages', 'certifications', 'awards', 'education'] as const;

function build(r: Resume) {
  const { side, main } = splitSections(r, [...SIDE_KINDS]);
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const header = (
    <div className="bh-band">
      <div className="bh-band-row">
        <div>
          <h1 className="bh-name">{b.name || 'Your Name'}</h1>
          {b.headline && <p className="bh-headline">{b.headline}</p>}
        </div>
        {showPhoto && <img className="bh-photo" src={b.photo} alt="" />}
      </div>
      {contacts.length > 0 && (
        <ul className="bh-contact">
          {contacts.map((c) => (
            <li key={c.kind}>
              <span className="bh-contact-label">{c.label}</span>
              <ContactValue line={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const mainTitle = (s: Section) => <h2 className="bh-title">{s.title}</h2>;
  const sideTitle = (s: Section) => <h3 className="bh-side-title">{s.title}</h3>;

  const mainBlocks: Block[] = [];
  if (b.summary) mainBlocks.push(standalone('summary', <RichText source={b.summary} className="bh-summary" />));
  for (const s of main)
    mainBlocks.push(
      ...sectionBlocks(s, {
        title: mainTitle,
        inlineDescription: (sec) => sec.kind === 'projects',
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          if (sec.kind === 'projects')
            return (
              <div className="bh-project">
                <div className="bh-item-row">
                  <h4 className="bh-item-title">{it.title || 'Project'}</h4>
                  {when && <span className="bh-date">{when}</span>}
                </div>
                {it.subtitle && <p className="bh-where">{it.subtitle}</p>}
                {it.description && <RichText source={it.description} className="bh-project-desc" />}
                {it.tags.length > 0 && <p className="bh-tags">{it.tags.join(' / ')}</p>}
                {it.url && (
                  <p className="bh-link">
                    <UrlLink url={it.url} />
                  </p>
                )}
              </div>
            );
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="bh-item">
              <div className="bh-item-row">
                <h4 className="bh-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="bh-date">{when}</span>}
              </div>
              {where && <p className="bh-where">{where}</p>}
              {it.tags.length > 0 && <p className="bh-tags">{it.tags.join(' / ')}</p>}
              {it.url && (
                <p className="bh-link">
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
          <div className="bh-side-item">
            <p className="bh-side-item-title">{it.title || KINDS[sec.kind].titleLabel}</p>
            {it.subtitle && <p className="bh-muted">{it.subtitle}</p>}
            {sec.kind !== 'skills' && sec.kind !== 'languages' && dateText(r, sec, it) && <p className="bh-muted">{dateText(r, sec, it)}</p>}
            {it.tags.length > 0 && (
              <ul className="bh-list">
                {it.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            <Level value={it.level} className="bh-level" />
            {it.description && <RichText source={it.description} className="bh-side-desc" />}
          </div>
        ),
      }),
    );

  return { header, regions: { side: sideBlocks, main: mainBlocks } };
}

export const boldHeader: TemplateDef = {
  id: 'bold-header',
  number: 8,
  name: 'Bold Header',
  category: 'Civil engineering & construction',
  description: 'A strong dark name band with a tall uppercase name, skills down the side and project summary blocks.',
  className: 't-bold-header',
  margins: { top: 0, topNext: 20, right: 14, bottom: 13, left: 14 },
  regions: ['side', 'main'],
  build,
  decor: (page) => (page > 0 ? <div className="bh-strip" /> : null),
};
