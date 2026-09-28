/**
 * #4 Technical Matrix: a spec-sheet grid. The header is a bordered matrix
 * of cells, sections are framed boxes with lettered title bars, and a
 * column rule separates dates from details. Courier Prime with Arimo.
 */
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import '@fontsource-variable/arimo';
import './tech-matrix.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, standalone, UrlLink, visibleSections } from '../shared';
import type { Block, TemplateDef } from '../types';

const GRID_KINDS = new Set(['skills', 'languages']);

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="tm-head">
          <div className="tm-head-top">
            <div className="tm-head-name">
              <p className="tm-cell-label">Name</p>
              <h1 className="tm-name">{b.name || 'Your Name'}</h1>
              {b.headline && <p className="tm-headline">{b.headline}</p>}
            </div>
            {showPhoto && <img className="tm-photo" src={b.photo} alt="" />}
          </div>
          {contacts.length > 0 && (
            <ul className="tm-contact">
              {contacts.map((c) => (
                <li key={c.kind}>
                  <p className="tm-cell-label">{c.label}</p>
                  <p className="tm-contact-value">
                    <ContactValue line={c} />
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary)
    blocks.push(
      standalone(
        'summary',
        <div className="tm-summary">
          <p className="tm-cell-label">Profile</p>
          <RichText source={b.summary} />
        </div>,
      ),
    );

  visibleSections(r).forEach((s, idx) => {
    const letter = String.fromCharCode(65 + (idx % 26));
    const title = (sec: Section) => (
      <h2 className="tm-title">
        <span className="tm-letter">{letter}</span>
        <span>{sec.title}</span>
      </h2>
    );
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          GRID_KINDS.has(sec.kind) ? (
            <div className="tm-grid">
              {sec.items.map((it) => (
                <div key={it.id} className="tm-grid-row">
                  <p className="tm-grid-key">{it.title}</p>
                  <div className="tm-grid-val">
                    {it.subtitle && <span className="tm-grid-sub">{it.subtitle}</span>}
                    {it.tags.map((t) => (
                      <span key={t} className="tm-spec">
                        {t}
                      </span>
                    ))}
                    <Level value={it.level} className="tm-level" />
                    {it.description && <RichText source={it.description} className="tm-grid-desc" />}
                  </div>
                </div>
              ))}
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          return (
            <div className="tm-item">
              <p className="tm-item-meta">{when}</p>
              <div>
                <h4 className="tm-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {(it.subtitle || it.location) && <p className="tm-where">{[it.subtitle, it.location].filter(Boolean).join(' · ')}</p>}
                {it.tags.length > 0 && (
                  <p className="tm-specs">
                    {it.tags.map((t) => (
                      <span key={t} className="tm-spec">
                        {t}
                      </span>
                    ))}
                  </p>
                )}
                {it.url && (
                  <p className="tm-link">
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

export const techMatrix: TemplateDef = {
  id: 'tech-matrix',
  number: 4,
  name: 'Technical Matrix',
  category: 'Mechanical & electrical engineering',
  description: 'A precise spec-sheet grid: framed sections, lettered title bars and your tools laid out like a data table.',
  className: 't-tech-matrix',
  margins: { top: 14, topNext: 20, right: 14, bottom: 13, left: 14 },
  regions: ['main'],
  build,
};
