/**
 * #11 Credential-First: for jobs where licences decide the shortlist
 * (drivers, pilots, operators, technicians). Every licence and
 * certificate moves to the top as a grid of badges showing issuer and
 * validity; the work history follows. Anton headings with Arimo.
 */
import '@fontsource/anton/400.css';
import '@fontsource-variable/arimo';
import './credential-first.css';
import { RichText } from '@/components/resume/RichText';
import { formatDate } from '@/lib/resume/dates';
import { isRtlContent } from '@/lib/resume/direction';
import { KINDS } from '@/lib/resume/schema';
import type { Item, Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, role, sectionBlocks, standalone, UrlLink, visibleSections, tr } from '../shared';
import type { Block, TemplateDef } from '../types';

const ShieldIcon = () => (
  <svg className="cf-shield" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
    <path fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="m8.5 12 2.4 2.4 4.6-4.8" />
  </svg>
);

function validity(r: Resume, it: Item) {
  const f = r.settings.dateFormat;
  const ar = isRtlContent(r);
  const issued = formatDate(it.start, f, ar);
  const until = it.current ? '' : formatDate(it.end, f, ar);
  return { issued, until };
}

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);
  const all = visibleSections(r);
  const creds = all.filter((s) => s.kind === 'certifications');
  const rest = all.filter((s) => s.kind !== 'certifications');

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="cf-head">
          <div className="cf-head-text">
            <h1 className="cf-name">{b.name || 'Your Name'}</h1>
            {b.headline && <p className="cf-headline">{b.headline}</p>}
            {contacts.length > 0 && (
              <ul className="cf-contact">
                {contacts.map((c) => (
                  <li key={c.kind}>
                    <ContactValue line={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {showPhoto && <img className="cf-photo" src={b.photo} alt="" />}
        </div>
      ),
      keepWithNext: true,
    },
  ];

  const title = (s: Section) => <h2 className="cf-title">{s.title}</h2>;

  // Credentials first: one row of up to three badges per block, so a long list can still break between rows.
  for (const s of creds) {
    blocks.push({ key: `${s.id}:title`, node: role('title', false, false, title(s)), keepWithNext: true });
    for (let i = 0; i < s.items.length; i += 3) {
      const row = s.items.slice(i, i + 3);
      const last = i + 3 >= s.items.length;
      blocks.push({
        key: `${s.id}:row${i}`,
        node: role(
          'whole',
          last,
          last,
          <div className="cf-badges">
            {row.map((it) => {
              const { issued, until } = validity(r, it);
              return (
                <div key={it.id} className="cf-badge">
                  <ShieldIcon />
                  <div className="cf-badge-text">
                    <p className="cf-badge-title">{it.title || 'Licence'}</p>
                    {it.subtitle && <p className="cf-badge-issuer">{it.subtitle}</p>}
                    {it.description && <RichText source={it.description} className="cf-badge-no" />}
                    {(issued || until || it.current) && (
                      <p className="cf-badge-dates">
                        {issued && <span>Issued {issued}</span>}
                        {until && <span className="cf-valid">Valid to {until}</span>}
                        {it.current && <span className="cf-valid">{tr(r, 'Valid')}</span>}
                      </p>
                    )}
                    {it.url && <UrlLink url={it.url} className="cf-badge-link" />}
                  </div>
                </div>
              );
            })}
          </div>,
        ),
      });
    }
  }
  if (b.summary) blocks.push(standalone('summary', <RichText source={b.summary} className="cf-summary" />));

  for (const s of rest)
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <div className="cf-grid">
              {sec.items.map((it) => (
                <div key={it.id} className="cf-cell">
                  <p className="cf-cell-title">{it.title}</p>
                  {it.subtitle && <p className="cf-muted">{it.subtitle}</p>}
                  {it.tags.length > 0 && <p>{it.tags.join(' · ')}</p>}
                  <Level value={it.level} className="cf-level" />
                  {it.description && <RichText source={it.description} className="cf-muted" />}
                </div>
              ))}
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="cf-item">
              <div className="cf-item-row">
                <h4 className="cf-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="cf-date">{when}</span>}
              </div>
              {where && <p className="cf-where">{where}</p>}
              {it.tags.length > 0 && <p className="cf-muted">{it.tags.join(' · ')}</p>}
              {it.url && (
                <p className="cf-link">
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

export const credentialFirst: TemplateDef = {
  id: 'credential-first',
  number: 11,
  name: 'Credential-First',
  category: 'Logistics, drivers & aviation',
  description: 'Licences and certificates come first as badges with issuer and validity, then your work history.',
  className: 't-credential-first',
  margins: { top: 15, topNext: 20, right: 15, bottom: 13, left: 15 },
  regions: ['main'],
  accent: { vars: ['--cf-accent'], tints: [['--cf-accent-soft', 9]], color: '#047857' },
  build,
};
