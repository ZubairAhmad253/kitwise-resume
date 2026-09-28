/**
 * #17 Two-Column Corporate: a traditional split with skills, tools and
 * credentials in a light left rail and the full career history on the
 * right. Helvetica/Arial look via Arimo (free, metric-compatible).
 */
import '@fontsource-variable/arimo';
import './corporate.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, splitSections, standalone } from '../shared';
import type { Block, TemplateDef } from '../types';

const SIDE_KINDS = ['skills', 'languages', 'certifications', 'awards'] as const;

function build(r: Resume) {
  const { side, main } = splitSections(r, [...SIDE_KINDS]);
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);

  const sideTitle = (s: Section) => <h3 className="c-side-title">{s.title}</h3>;
  const mainTitle = (s: Section) => <h2 className="c-title">{s.title}</h2>;

  const sideBlocks: Block[] = [];
  if (showPhoto) sideBlocks.push({ key: 'photo', node: <img className="c-photo" src={b.photo} alt="" /> });
  const contacts = contactLines(b);
  if (contacts.length)
    sideBlocks.push(
      standalone(
        'contact',
        <div>
          <h3 className="c-side-title">Contact</h3>
          <ul className="c-contact">
            {contacts.map((c) => (
              <li key={c.kind}>
                <span className="c-contact-label">{c.label}</span>
                <span className="c-contact-value">
                  <ContactValue line={c} />
                </span>
              </li>
            ))}
          </ul>
        </div>,
      ),
    );
  for (const s of side)
    sideBlocks.push(
      ...sectionBlocks(s, {
        title: sideTitle,
        inlineDescription: () => true,
        item: (sec, it) => (
          <div className="c-side-item">
            <p className="c-side-item-title">
              {it.title}
              {sec.kind === 'languages' && it.subtitle && <span className="c-muted"> · {it.subtitle}</span>}
            </p>
            {sec.kind !== 'languages' && it.subtitle && <p className="c-muted">{it.subtitle}</p>}
            {(sec.kind === 'certifications' || sec.kind === 'awards') && dateText(r, sec, it) && <p className="c-muted">{dateText(r, sec, it)}</p>}
            {it.tags.length > 0 && <p className="c-tags">{it.tags.join(', ')}</p>}
            <Level value={it.level} className="c-bar" />
            {it.description && <RichText source={it.description} className="c-side-desc" />}
          </div>
        ),
      }),
    );

  const mainBlocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="c-head">
          <h1 className="c-name">{b.name || 'Your Name'}</h1>
          {b.headline && <p className="c-headline">{b.headline}</p>}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary) mainBlocks.push(standalone('summary', <RichText source={b.summary} className="c-summary" />));
  for (const s of main)
    mainBlocks.push(
      ...sectionBlocks(s, {
        title: mainTitle,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="c-item">
              <div className="c-item-row">
                <h4 className="c-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="c-date">{when}</span>}
              </div>
              {where && <p className="c-where">{where}</p>}
              {it.tags.length > 0 && <p className="c-tags c-tags-main">{it.tags.join(' · ')}</p>}
              {it.url && (
                <p className="c-link">
                  <a href={/^https?:/i.test(it.url) ? it.url : `https://${it.url}`}>{it.url.replace(/^https?:\/\//i, '')}</a>
                </p>
              )}
            </div>
          );
        },
      }),
    );

  return { regions: { side: sideBlocks, main: mainBlocks } };
}

export const corporate: TemplateDef = {
  id: 'corporate',
  number: 17,
  name: 'Two-Column Corporate',
  category: 'Corporate, finance & administration',
  description: 'A classic 25/75 split: skills, tools and credentials on the left, your full career history on the right.',
  className: 't-corporate',
  margins: { top: 15, topNext: 22, right: 13, bottom: 13, left: 0 },
  regions: ['side', 'main'],
  build,
  decor: () => <div className="c-rail" />,
};
