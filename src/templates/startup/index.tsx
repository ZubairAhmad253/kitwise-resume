/**
 * #20 Agile Tech Startup: a bold violet name band, colourful accent tags
 * and project cards with tech-stack chips. Plus Jakarta Sans headings over
 * Inter. Skills, languages and awards sit in a narrow right column.
 */
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource-variable/inter';
import './startup.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, splitSections, standalone, UrlLink } from '../shared';
import type { Block, TemplateDef } from '../types';

const SIDE_KINDS = ['skills', 'languages', 'awards', 'certifications'] as const;
/** Chip colour sets, cycled per skill group or per project. */
const TONES = 5;

const Chips = ({ tags, tone }: { tags: string[]; tone: number }) =>
  tags.length ? (
    <p className={`su-chips su-tone-${tone % TONES}`}>
      {tags.map((t) => (
        <span key={t} className="su-chip">
          {t}
        </span>
      ))}
    </p>
  ) : null;

function build(r: Resume) {
  const { side, main } = splitSections(r, [...SIDE_KINDS]);
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const header = (
    <div className="su-band">
      {showPhoto && <img className="su-photo" src={b.photo} alt="" />}
      <div className="su-band-text">
        <h1 className="su-name">{b.name || 'Your Name'}</h1>
        {b.headline && <p className="su-headline">{b.headline}</p>}
        {contacts.length > 0 && (
          <ul className="su-contact">
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

  const mainTitle = (s: Section) => <h2 className="su-title">{s.title}</h2>;
  const sideTitle = (s: Section) => <h3 className="su-side-title">{s.title}</h3>;

  const mainBlocks: Block[] = [];
  if (b.summary) mainBlocks.push(standalone('summary', <RichText source={b.summary} className="su-summary" />));
  for (const s of main) {
    let project = 0;
    mainBlocks.push(
      ...sectionBlocks(s, {
        title: mainTitle,
        inlineDescription: (sec) => sec.kind === 'projects',
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          if (sec.kind === 'projects')
            return (
              <div className={`su-project su-tone-${project++ % TONES}`}>
                <div className="su-item-row">
                  <h4 className="su-item-title">{it.title || 'Project'}</h4>
                  {when && <span className="su-date">{when}</span>}
                </div>
                {it.subtitle && <p className="su-where">{it.subtitle}</p>}
                {it.description && <RichText source={it.description} className="su-project-desc" />}
                <Chips tags={it.tags} tone={project - 1} />
                {it.url && (
                  <p className="su-link">
                    <UrlLink url={it.url} />
                  </p>
                )}
              </div>
            );
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="su-item">
              <div className="su-item-row">
                <h4 className="su-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="su-date">{when}</span>}
              </div>
              {where && <p className="su-where">{where}</p>}
              <Chips tags={it.tags} tone={0} />
              {it.url && (
                <p className="su-link">
                  <UrlLink url={it.url} />
                </p>
              )}
            </div>
          );
        },
      }),
    );
  }

  const sideBlocks: Block[] = [];
  for (const s of side)
    sideBlocks.push(
      ...sectionBlocks(s, {
        title: sideTitle,
        inlineDescription: () => true,
        whole: (sec) =>
          sec.kind === 'skills' ? (
            <div className="su-skills">
              {sec.items.map((it, i) => (
                <div key={it.id}>
                  {it.title && <p className="su-skill-group">{it.title}</p>}
                  <Chips tags={it.tags} tone={i} />
                  {it.description && <RichText source={it.description} className="su-side-desc" />}
                  <Level value={it.level} className="su-bar" />
                </div>
              ))}
            </div>
          ) : null,
        item: (sec, it) => (
          <div className="su-side-item">
            <p className="su-side-item-title">{it.title}</p>
            {it.subtitle && <p className="su-muted">{it.subtitle}</p>}
            {(sec.kind === 'awards' || sec.kind === 'certifications') && dateText(r, sec, it) && <p className="su-muted">{dateText(r, sec, it)}</p>}
            <Level value={it.level} className="su-bar" />
            {it.description && <RichText source={it.description} className="su-side-desc" />}
          </div>
        ),
      }),
    );

  return { header, regions: { main: mainBlocks, side: sideBlocks } };
}

export const startup: TemplateDef = {
  id: 'startup',
  number: 20,
  name: 'Agile Tech Startup',
  category: 'Startups & freshers',
  description: 'A confident name band, colourful skill tags and project cards that show the stack you built with.',
  className: 't-startup',
  margins: { top: 0, topNext: 18, right: 14, bottom: 13, left: 14 },
  regions: ['main', 'side'],
  accent: { vars: ['--su-accent'], color: '#6d28d9' },
  build,
};
