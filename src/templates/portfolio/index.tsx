/**
 * #15 Portfolio Gallery: work first. Projects become a numbered two-column
 * gallery of cards right under a large display name; experience and the
 * rest follow in a compact list. Syne display type with Inter.
 */
import '@fontsource-variable/syne';
import '@fontsource-variable/inter';
import './portfolio.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, LEVEL_WORDS, role, sectionBlocks, standalone, UrlLink, visibleSections, tr } from '../shared';
import type { Block, TemplateDef } from '../types';

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);
  const all = visibleSections(r);
  const galleries = all.filter((s) => s.kind === 'projects');
  const rest = all.filter((s) => s.kind !== 'projects');

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="pf-head">
          <div className="pf-head-top">
            <h1 className="pf-name">{b.name || 'Your Name'}</h1>
            {showPhoto && <img className="pf-photo" src={b.photo} alt="" />}
          </div>
          <div className="pf-head-row">
            {b.headline && <p className="pf-headline">{b.headline}</p>}
            {contacts.length > 0 && (
              <ul className="pf-contact">
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
  if (b.summary) blocks.push(standalone('summary', <RichText source={b.summary} className="pf-summary" />));

  const title = (s: Section) => (
    <h2 className="pf-title">
      {s.title}
      <span className="pf-count">{String(s.items.length).padStart(2, '0')}</span>
    </h2>
  );

  // The gallery: two cards per block, so rows can move to the next page whole.
  let n = 0;
  for (const s of galleries) {
    blocks.push({ key: `${s.id}:title`, node: role('title', false, false, title(s)), keepWithNext: true });
    for (let i = 0; i < s.items.length; i += 2) {
      const pair = s.items.slice(i, i + 2);
      const last = i + 2 >= s.items.length;
      blocks.push({
        key: `${s.id}:row${i}`,
        node: role(
          'whole',
          last,
          last,
          <div className="pf-gallery">
            {pair.map((it) => {
              n += 1;
              const when = dateText(r, s, it);
              return (
                <div key={it.id} className="pf-card">
                  <p className="pf-num">{String(n).padStart(2, '0')}</p>
                  <h4 className="pf-card-title">{it.title || 'Project'}</h4>
                  {(it.subtitle || when) && <p className="pf-card-meta">{[it.subtitle, when].filter(Boolean).join(' · ')}</p>}
                  {it.description && <RichText source={it.description} className="pf-card-desc" />}
                  {it.tags.length > 0 && (
                    <p className="pf-tags">
                      {it.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </p>
                  )}
                  {it.url && <UrlLink url={it.url} className="pf-card-link" />}
                </div>
              );
            })}
          </div>,
        ),
      });
    }
  }

  for (const s of rest)
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <p className="pf-cloud">
              {sec.items.flatMap((it) =>
                it.tags.length
                  ? it.tags.map((t) => <span key={`${it.id}:${t}`}>{t}</span>)
                  : [
                      <span key={it.id}>
                        {it.title}
                        {(it.subtitle || it.level > 0) && <em> {it.subtitle || tr(r, LEVEL_WORDS[it.level])}</em>}
                      </span>,
                    ],
              )}
            </p>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          return (
            <div className="pf-row">
              <p className="pf-when">{when}</p>
              <div>
                <h4 className="pf-item-title">
                  {it.title || KINDS[sec.kind].titleLabel}
                  {it.subtitle && <span className="pf-at"> — {it.subtitle}</span>}
                </h4>
                {it.location && <p className="pf-muted">{it.location}</p>}
                {it.tags.length > 0 && <p className="pf-muted">{it.tags.join(' / ')}</p>}
                {it.url && (
                  <p>
                    <UrlLink url={it.url} className="pf-card-link" />
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

export const portfolio: TemplateDef = {
  id: 'portfolio',
  number: 15,
  name: 'Portfolio Gallery',
  category: 'Creative, design & marketing',
  description: 'Work first: your projects as a numbered gallery of cards under a big display name, then a compact history.',
  className: 't-portfolio',
  margins: { top: 14, topNext: 20, right: 14, bottom: 13, left: 14 },
  regions: ['main'],
  accent: { vars: ['--pf-accent'], color: '#3d3aff' },
  build,
};
