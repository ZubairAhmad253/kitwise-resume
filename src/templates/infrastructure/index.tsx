/**
 * #7 Infrastructure Scale: a wide, project-first layout for civil and
 * construction work. Projects become "project sheets" with a title strip,
 * scope and specs; a hazard-stripe rule closes the header. Fira Sans (in
 * place of Trebuchet MS) with Open Sans.
 */
import '@fontsource/fira-sans/400.css';
import '@fontsource/fira-sans/500.css';
import '@fontsource/fira-sans/600.css';
import '@fontsource/fira-sans/700.css';
import '@fontsource-variable/open-sans';
import './infrastructure.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, LEVEL_WORDS, sectionBlocks, standalone, UrlLink, visibleSections, tr } from '../shared';
import type { Block, TemplateDef } from '../types';

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="is-head">
          <div className="is-head-row">
            {showPhoto && <img className="is-photo" src={b.photo} alt="" />}
            <div className="is-head-name">
              <h1 className="is-name">{b.name || 'Your Name'}</h1>
              {b.headline && <p className="is-headline">{b.headline}</p>}
            </div>
            {contacts.length > 0 && (
              <ul className="is-contact">
                {contacts.map((c) => (
                  <li key={c.kind}>
                    <ContactValue line={c} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="is-hazard" aria-hidden="true" />
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary) blocks.push(standalone('summary', <RichText source={b.summary} className="is-summary" />));

  const title = (s: Section) => <h2 className="is-title">{s.title}</h2>;
  for (const s of visibleSections(r))
    blocks.push(
      ...sectionBlocks(s, {
        title,
        inlineDescription: (sec) => sec.kind === 'projects',
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <div className="is-spec-table">
              {sec.items.map((it) => (
                <div key={it.id} className="is-spec-row">
                  <p className="is-spec-key">{it.title}</p>
                  <div className="is-spec-val">
                    {[it.subtitle || (it.level ? tr(r, LEVEL_WORDS[it.level]) : ''), it.tags.join(', ')].filter(Boolean).join(' · ')}
                    {it.description && <RichText source={it.description} className="is-muted" />}
                  </div>
                </div>
              ))}
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          if (sec.kind === 'projects')
            return (
              <div className="is-sheet">
                <div className="is-sheet-strip">
                  <h4>{it.title || 'Project'}</h4>
                  {when && <span>{when}</span>}
                </div>
                <div className="is-sheet-body">
                  {(it.subtitle || it.location) && (
                    <p className="is-sheet-role">
                      {it.subtitle && (
                        <>
                          <span className="is-key">{tr(r, 'Role')}</span> {it.subtitle}
                        </>
                      )}
                      {it.location && (
                        <>
                          <span className="is-key">{tr(r, 'Site')}</span> {it.location}
                        </>
                      )}
                    </p>
                  )}
                  {it.description && <RichText source={it.description} className="is-sheet-desc" />}
                  {it.tags.length > 0 && (
                    <p className="is-sheet-specs">
                      {it.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </p>
                  )}
                  {it.url && (
                    <p className="is-link">
                      <UrlLink url={it.url} />
                    </p>
                  )}
                </div>
              </div>
            );
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="is-item">
              <div className="is-item-row">
                <h4 className="is-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="is-date">{when}</span>}
              </div>
              {where && <p className="is-where">{where}</p>}
              {it.tags.length > 0 && <p className="is-muted">{it.tags.join(' · ')}</p>}
              {it.url && (
                <p className="is-link">
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

export const infrastructure: TemplateDef = {
  id: 'infrastructure',
  number: 7,
  name: 'Infrastructure Scale',
  category: 'Civil engineering & construction',
  description: 'Project-first and wide: each project gets its own sheet with role, scope and specs, under a construction-grade header.',
  className: 't-infrastructure',
  margins: { top: 14, topNext: 20, right: 14, bottom: 13, left: 14 },
  regions: ['main'],
  accent: { vars: ['--is-accent'], color: '#d9480f' },
  build,
};
