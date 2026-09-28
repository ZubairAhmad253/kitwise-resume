/**
 * #5 Project Timeline: one vertical line runs down every page, with dates
 * on its left and a node for each role or project on its right. Didact
 * Gothic (a free Century Gothic look) with Arimo.
 */
import '@fontsource/didact-gothic/400.css';
import '@fontsource-variable/arimo';
import './timeline.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, standalone, UrlLink, visibleSections } from '../shared';
import type { Block, TemplateDef } from '../types';

/** Page left margin and the line's distance from it, in mm (the CSS uses the same numbers). */
const LEFT = 16;
const LINE = 33;

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="tl-head">
          {showPhoto && <img className="tl-photo" src={b.photo} alt="" />}
          <div>
            <h1 className="tl-name">{b.name || 'Your Name'}</h1>
            {b.headline && <p className="tl-headline">{b.headline}</p>}
            {contacts.length > 0 && (
              <ul className="tl-contact">
                {contacts.map((c) => (
                  <li key={c.kind}>
                    <ContactValue line={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary)
    blocks.push(
      standalone(
        'summary',
        <div className="tl-row">
          <p className="tl-side-label">Profile</p>
          <RichText source={b.summary} className="tl-summary" />
        </div>,
      ),
    );

  const title = (s: Section) => (
    <div className="tl-row">
      <span />
      <h2 className="tl-title">{s.title}</h2>
    </div>
  );
  for (const s of visibleSections(r))
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <div className="tl-row">
              <span />
              <div className="tl-groups">
                {sec.items.map((it) => (
                  <div key={it.id} className="tl-group">
                    <p className="tl-group-title">
                      {it.title}
                      {it.subtitle && <span className="tl-muted"> · {it.subtitle}</span>}
                    </p>
                    {it.tags.length > 0 && <p className="tl-group-tags">{it.tags.join(', ')}</p>}
                    <Level value={it.level} className="tl-level" />
                    {it.description && <RichText source={it.description} className="tl-muted" />}
                  </div>
                ))}
              </div>
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          return (
            <div className="tl-row tl-item">
              <div className="tl-when">
                {when && <p>{when}</p>}
                {it.location && <p className="tl-muted">{it.location}</p>}
              </div>
              <div>
                <span className="tl-node" aria-hidden="true" />
                <h4 className="tl-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {it.subtitle && <p className="tl-where">{it.subtitle}</p>}
                {it.tags.length > 0 && <p className="tl-tags">{it.tags.join(' · ')}</p>}
                {it.url && (
                  <p className="tl-link">
                    <UrlLink url={it.url} />
                  </p>
                )}
              </div>
            </div>
          );
        },
      }),
    );

  return { regions: { main: blocks } };
}

export const timeline: TemplateDef = {
  id: 'timeline',
  number: 5,
  name: 'Project Timeline',
  category: 'Mechanical & electrical engineering',
  description: 'A single timeline runs down the page: dates on the left, each role and project as a node on the right.',
  className: 't-timeline',
  margins: { top: 15, topNext: 20, right: 16, bottom: 13, left: LEFT },
  regions: ['main'],
  build,
  decor: (page) => <div className={`tl-line${page === 0 ? ' tl-line--first' : ''}`} style={{ left: `${LEFT + LINE}mm` }} />,
};
