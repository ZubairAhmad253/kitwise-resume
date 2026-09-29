/**
 * #2 Linear Monotone: one column, strong horizontal rules and numbered
 * sections. Dates run down a narrow left column; skills and languages
 * become a grid of small cards. Roboto Mono labels over an Arial-style body.
 */
import '@fontsource-variable/roboto-mono';
import '@fontsource-variable/arimo';
import './linear-mono.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, standalone, UrlLink, visibleSections, tr } from '../shared';
import type { Block, TemplateDef } from '../types';

const CARD_KINDS = new Set(['skills', 'languages']);

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);
  const sections = visibleSections(r);

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="lm-head">
          <div className="lm-head-text">
            <h1 className="lm-name">{b.name || 'Your Name'}</h1>
            {b.headline && <p className="lm-headline">{b.headline}</p>}
            {contacts.length > 0 && (
              <ul className="lm-contact">
                {contacts.map((c) => (
                  <li key={c.kind}>
                    <ContactValue line={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {showPhoto && <img className="lm-photo" src={b.photo} alt="" />}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary)
    blocks.push(
      standalone(
        'summary',
        <div className="lm-row">
          <p className="lm-label">{tr(r, 'Profile')}</p>
          <RichText source={b.summary} className="lm-summary" />
        </div>,
      ),
    );

  sections.forEach((s, idx) => {
    const title = (sec: Section) => (
      <h2 className="lm-title">
        <span className="lm-num">{String(idx + 1).padStart(2, '0')}</span>
        <span>{sec.title}</span>
      </h2>
    );
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          CARD_KINDS.has(sec.kind) ? (
            <div className="lm-cards">
              {sec.items.map((it) => (
                <div key={it.id} className="lm-card">
                  <p className="lm-card-title">{it.title}</p>
                  {it.subtitle && <p className="lm-card-sub">{it.subtitle}</p>}
                  {it.tags.length > 0 && <p className="lm-card-tags">{it.tags.join(' / ')}</p>}
                  <Level value={it.level} className="lm-bar" />
                  {it.description && <RichText source={it.description} className="lm-card-desc" />}
                </div>
              ))}
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          const where = [it.subtitle, it.location].filter(Boolean).join(', ');
          return (
            <div className="lm-row">
              <p className="lm-date">{when}</p>
              <div>
                <h4 className="lm-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {where && <p className="lm-where">{where}</p>}
                {it.tags.length > 0 && <p className="lm-tags">{it.tags.join(' / ')}</p>}
                {it.url && (
                  <p className="lm-link">
                    <UrlLink url={it.url} />
                  </p>
                )}
              </div>
            </div>
          );
        },
      }),
    );
  });

  return { regions: { main: blocks } };
}

export const linearMono: TemplateDef = {
  id: 'linear-mono',
  number: 2,
  name: 'Linear Monotone',
  category: 'Software & tech',
  description: 'One clean column with numbered sections, sharp rules and a monospaced timeline of dates.',
  className: 't-linear-mono',
  margins: { top: 16, topNext: 22, right: 16, bottom: 14, left: 16 },
  regions: ['main'],
  accent: { vars: ['--lm-ink'], color: '#111111' },
  build,
};
