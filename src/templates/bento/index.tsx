/**
 * #14 Bento Asymmetrical Grid: the page as rounded tiles of different
 * sizes. A bento header (name, monogram or photo, profile, contact), then
 * each entry as its own tile; a tile can continue onto the next page.
 * Playfair Display with Work Sans.
 */
import '@fontsource-variable/playfair-display';
import '@fontsource-variable/work-sans';
import './bento.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, LEVEL_WORDS, sectionBlocks, splitSections, UrlLink } from '../shared';
import type { Block, TemplateDef } from '../types';

const SIDE_KINDS = ['skills', 'languages', 'certifications', 'awards'] as const;

const initials = (name: string) =>
  name
    .replace(/^(dr|mr|mrs|ms|prof)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

function build(r: Resume) {
  const { side, main } = splitSections(r, [...SIDE_KINDS]);
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const header = (
    <div className={`bn-bento${b.summary ? '' : ' bn-bento--short'}`}>
      <div className="bn-tile bn-tile--name">
        <h1 className="bn-name">{b.name || 'Your Name'}</h1>
        {b.headline && <p className="bn-headline">{b.headline}</p>}
      </div>
      {showPhoto ? (
        <img className="bn-tile bn-tile--photo" src={b.photo} alt="" />
      ) : (
        <div className="bn-tile bn-tile--mono" aria-hidden="true">
          {initials(b.name || 'Your Name')}
        </div>
      )}
      {b.summary && (
        <div className="bn-tile bn-tile--summary">
          <p className="bn-label">Profile</p>
          <RichText source={b.summary} />
        </div>
      )}
      {contacts.length > 0 && (
        <ul className="bn-tile bn-tile--contact">
          {contacts.map((c) => (
            <li key={c.kind}>
              <span className="bn-label">{c.label}</span>
              <ContactValue line={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const title = (s: Section) => <h2 className="bn-title">{s.title}</h2>;

  const mainBlocks: Block[] = [];
  for (const s of main)
    mainBlocks.push(
      ...sectionBlocks(s, {
        title,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="bn-item">
              <div className="bn-item-row">
                <h4 className="bn-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="bn-date">{when}</span>}
              </div>
              {where && <p className="bn-where">{where}</p>}
              {it.tags.length > 0 && (
                <p className="bn-pills">
                  {it.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </p>
              )}
              {it.url && (
                <p className="bn-link">
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
        title,
        inlineDescription: () => true,
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <div className="bn-stack">
              {sec.items.map((it) => (
                <div key={it.id}>
                  <p className="bn-side-title">
                    {it.title}
                    {(it.subtitle || it.level > 0) && <span className="bn-muted"> · {it.subtitle || LEVEL_WORDS[it.level]}</span>}
                  </p>
                  {it.tags.length > 0 && (
                    <p className="bn-pills">
                      {it.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </p>
                  )}
                  {it.description && <RichText source={it.description} className="bn-muted" />}
                </div>
              ))}
            </div>
          ) : null,
        item: (sec, it) => (
          <div>
            <p className="bn-side-title">{it.title || KINDS[sec.kind].titleLabel}</p>
            {it.subtitle && <p className="bn-muted">{it.subtitle}</p>}
            {dateText(r, sec, it) && <p className="bn-muted">{dateText(r, sec, it)}</p>}
            {it.description && <RichText source={it.description} className="bn-muted" />}
          </div>
        ),
      }),
    );

  return { header, regions: { main: mainBlocks, side: sideBlocks } };
}

export const bento: TemplateDef = {
  id: 'bento',
  number: 14,
  name: 'Bento Asymmetrical Grid',
  category: 'Creative, design & marketing',
  description: 'Rounded tiles of different sizes, like a bento box: a bold name tile, monogram, profile and one tile per role.',
  className: 't-bento',
  margins: { top: 12, topNext: 18, right: 12, bottom: 12, left: 12 },
  regions: ['main', 'side'],
  accent: { vars: ['--bn-accent'], color: '#c2553a' },
  build,
};
