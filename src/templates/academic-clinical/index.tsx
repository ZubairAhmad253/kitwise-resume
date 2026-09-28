/**
 * #9 Academic-Clinical: a calm, serif CV for doctors and clinicians. The
 * first licence or certificate becomes a registration badge beside the
 * name, where a hiring panel looks first. Gelasio (a free Georgia look)
 * with Carlito (metric-compatible with Calibri).
 */
import '@fontsource-variable/gelasio';
import '@fontsource/carlito/400.css';
import '@fontsource/carlito/700.css';
import './academic-clinical.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, sectionBlocks, standalone, UrlLink, visibleSections } from '../shared';
import type { Block, TemplateDef } from '../types';

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  // The first licence/certificate is lifted into the badge; its section keeps the rest.
  let sections = visibleSections(r);
  const credSection = sections.find((s) => s.kind === 'certifications');
  const badge = credSection?.items[0];
  if (credSection && badge)
    sections = sections.flatMap((s) => (s !== credSection ? [s] : s.items.length > 1 ? [{ ...s, items: s.items.slice(1) }] : []));

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="ac-head">
          {showPhoto && <img className="ac-photo" src={b.photo} alt="" />}
          <div className="ac-head-text">
            <h1 className="ac-name">{b.name || 'Your Name'}</h1>
            {b.headline && <p className="ac-headline">{b.headline}</p>}
            {contacts.length > 0 && (
              <ul className="ac-contact">
                {contacts.map((c) => (
                  <li key={c.kind}>
                    <ContactValue line={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {badge && credSection && (
            <div className="ac-badge">
              <p className="ac-badge-label">Registration</p>
              <p className="ac-badge-title">{badge.title}</p>
              {badge.subtitle && <p className="ac-badge-sub">{badge.subtitle}</p>}
              {badge.description && <RichText source={badge.description} className="ac-badge-no" />}
              {dateText(r, credSection, badge) && <p className="ac-badge-sub">{dateText(r, credSection, badge)}</p>}
            </div>
          )}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary) blocks.push(standalone('summary', <RichText source={b.summary} className="ac-summary" />));

  const title = (s: Section) => <h2 className="ac-title">{s.title}</h2>;
  for (const s of sections)
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          sec.kind === 'languages' ? (
            <p className="ac-inline">
              {sec.items.map((it) => (
                <span key={it.id}>
                  <strong>{it.title}</strong>
                  {it.subtitle && <> ({it.subtitle})</>}
                </span>
              ))}
            </p>
          ) : sec.kind === 'skills' ? (
            <div className="ac-skills">
              {sec.items.map((it) => (
                <p key={it.id}>
                  {it.title && <strong>{it.title}: </strong>}
                  {it.tags.join(', ')}
                  {it.description && <RichText source={it.description} />}
                </p>
              ))}
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          return (
            <div className="ac-item">
              <div className="ac-item-row">
                <h4 className="ac-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="ac-date">{when}</span>}
              </div>
              {(it.subtitle || it.location) && (
                <p className="ac-where">
                  {it.subtitle}
                  {it.subtitle && it.location && ', '}
                  {it.location}
                </p>
              )}
              {it.tags.length > 0 && <p className="ac-muted">{it.tags.join(' · ')}</p>}
              {it.url && (
                <p className="ac-link">
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

export const academicClinical: TemplateDef = {
  id: 'academic-clinical',
  number: 9,
  name: 'Academic-Clinical',
  category: 'Healthcare & medicine',
  description: 'A calm serif CV for clinicians: your main licence sits in a registration badge next to your name.',
  className: 't-academic-clinical',
  margins: { top: 16, topNext: 22, right: 17, bottom: 14, left: 17 },
  regions: ['main'],
  accent: { vars: ['--ac-accent'], tints: [['--ac-badge', 8]], color: '#1d5c7a' },
  build,
};
