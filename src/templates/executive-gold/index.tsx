/**
 * #16 Executive Gold: a centred, formal layout for senior corporate and
 * finance roles. Navy and gold rules frame the name; headings sit between
 * gold lines. EB Garamond with Tinos (metric-compatible with Times).
 */
import '@fontsource-variable/eb-garamond';
import '@fontsource/tinos/400.css';
import '@fontsource/tinos/700.css';
import '@fontsource/tinos/400-italic.css';
import './executive-gold.css';
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
        <div className="eg-head">
          {showPhoto && <img className="eg-photo" src={b.photo} alt="" />}
          <h1 className="eg-name">{b.name || 'Your Name'}</h1>
          {b.headline && <p className="eg-headline">{b.headline}</p>}
          {contacts.length > 0 && (
            <ul className="eg-contact">
              {contacts.map((c) => (
                <li key={c.kind}>
                  <ContactValue line={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary) blocks.push(standalone('summary', <RichText source={b.summary} className="eg-summary" />));

  const title = (s: Section) => (
    <h2 className="eg-title">
      <span>{s.title}</span>
    </h2>
  );
  for (const s of visibleSections(r))
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <div className="eg-columns">
              {sec.items.map((it) => (
                <p key={it.id}>
                  <strong>{it.title}</strong>
                  {(it.subtitle || it.level > 0) && <em> — {it.subtitle || LEVEL_WORDS[it.level]}</em>}
                  {it.tags.length > 0 && <span className="eg-muted"> {it.tags.join(' · ')}</span>}
                </p>
              ))}
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          return (
            <div className="eg-item">
              <div className="eg-item-row">
                <h4 className="eg-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="eg-date">{when}</span>}
              </div>
              {(it.subtitle || it.location) && (
                <div className="eg-item-row">
                  <p className="eg-where">{it.subtitle}</p>
                  {it.location && <span className="eg-muted">{it.location}</span>}
                </div>
              )}
              {it.tags.length > 0 && <p className="eg-muted">{it.tags.join(' · ')}</p>}
              {it.url && (
                <p className="eg-link">
                  <UrlLink url={it.url} />
                </p>
              )}
            </div>
          );
        },
      }),
    );

  return { regions: { main: blocks } };
}

export const executiveGold: TemplateDef = {
  id: 'executive-gold',
  number: 16,
  name: 'Executive Gold',
  category: 'Corporate, finance & administration',
  description: 'Formal and centred, with navy and gold rules: made for senior finance, legal and management roles.',
  className: 't-executive-gold',
  margins: { top: 15, topNext: 21, right: 18, bottom: 14, left: 18 },
  regions: ['main'],
  build,
  decor: () => <div className="eg-frame" />,
};
