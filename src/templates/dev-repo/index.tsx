/**
 * #3 Dev-Repo Style: the resume as a code repository's README. A repo bar
 * and file tabs on top, badge-style contacts, projects as repository cards
 * and skills as topic pills. IBM Plex Mono with Inter.
 */
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource-variable/inter';
import './dev-repo.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, LEVEL_WORDS, sectionBlocks, standalone, UrlLink, visibleSections } from '../shared';
import type { Block, TemplateDef } from '../types';

/** Colours for the "main language" dot on project cards, picked by name. */
const DOT_COLOURS = ['#3572A5', '#f1e05a', '#00ADD8', '#3178c6', '#e34c26', '#b07219', '#563d7c', '#DA5B0B', '#178600', '#89e051'];
const dotColour = (name: string) => DOT_COLOURS[[...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % DOT_COLOURS.length];

/** Repo owner shown in the top bar: the GitHub handle, else the name. */
function owner(r: Resume) {
  const gh = r.basics.github.replace(/\/$/, '').split('/').pop();
  if (gh && r.basics.github) return gh;
  return (r.basics.name || 'you').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const RepoIcon = () => (
  <svg className="dr-icon" viewBox="0 0 16 16" aria-hidden="true">
    <path
      fill="currentColor"
      d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.71 1.71.75.75 0 0 1-1.07 1.05A2.5 2.5 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.71A2.5 2.5 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.09a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"
    />
  </svg>
);

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);
  const sections = visibleSections(r);

  const blocks: Block[] = [
    {
      key: 'repo-bar',
      node: (
        <div className="dr-bar">
          <p className="dr-repo">
            <RepoIcon />
            <span className="dr-owner">{owner(r)}</span>
            <span className="dr-slash">/</span>
            <strong>resume</strong>
            <span className="dr-pill">Public</span>
          </p>
          <ul className="dr-tabs">
            <li className="on">README.md</li>
            {sections.slice(0, 5).map((s) => (
              <li key={s.id}>{s.title
                  .toLowerCase()
                  .replace(/[^\p{L}\p{N}]+/gu, '-')
                  .replace(/^-|-$/g, '')}</li>
            ))}
          </ul>
        </div>
      ),
      keepWithNext: true,
    },
    {
      key: 'name',
      node: (
        <div className="dr-head">
          <div>
            <h1 className="dr-name">{b.name || 'Your Name'}</h1>
            {b.headline && <p className="dr-headline">{b.headline}</p>}
            {contacts.length > 0 && (
              <ul className="dr-badges">
                {contacts.map((c) => (
                  <li key={c.kind} className={`dr-badge dr-badge--${c.kind}`}>
                    <span className="dr-badge-k">{c.label.toLowerCase()}</span>
                    <span className="dr-badge-v">
                      <ContactValue line={c} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {showPhoto && <img className="dr-avatar" src={b.photo} alt="" />}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary) blocks.push(standalone('summary', <RichText source={b.summary} className="dr-summary" />));

  const title = (s: Section) => <h2 className="dr-title">{s.title}</h2>;
  for (const s of sections)
    blocks.push(
      ...sectionBlocks(s, {
        title,
        inlineDescription: (sec) => sec.kind === 'projects',
        whole: (sec) => {
          if (sec.kind === 'skills')
            return (
              <div className="dr-topics">
                {sec.items.map((it) => (
                  <div key={it.id} className="dr-topic-row">
                    <p className="dr-topic-name">{it.title}</p>
                    <p className="dr-topic-list">
                      {it.tags.map((t) => (
                        <span key={t} className="dr-topic">
                          {t}
                        </span>
                      ))}
                      {it.tags.length === 0 && it.description && <span className="dr-muted">{it.description}</span>}
                    </p>
                  </div>
                ))}
              </div>
            );
          if (sec.kind === 'languages')
            return (
              <p className="dr-topic-list">
                {sec.items.map((it) => (
                  <span key={it.id} className="dr-lang">
                    <span className="dr-lang-dot" style={{ background: dotColour(it.title) }} />
                    <strong>{it.title}</strong> <span className="dr-muted">{it.subtitle || LEVEL_WORDS[it.level]}</span>
                  </span>
                ))}
              </p>
            );
          return null;
        },
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          if (sec.kind === 'projects')
            return (
              <div className="dr-card">
                <p className="dr-card-head">
                  <RepoIcon />
                  <span className="dr-card-name">{it.title || 'project'}</span>
                  {it.subtitle && <span className="dr-pill">{it.subtitle}</span>}
                </p>
                {it.description && <RichText source={it.description} className="dr-card-desc" />}
                <p className="dr-card-foot">
                  {it.tags.map((t, i) => (
                    <span key={t} className="dr-lang">
                      {i === 0 && <span className="dr-lang-dot" style={{ background: dotColour(t) }} />}
                      {t}
                    </span>
                  ))}
                  {when && <span>{when}</span>}
                  <UrlLink url={it.url} className="dr-link" />
                </p>
              </div>
            );
          return (
            <div className="dr-item">
              <span className="dr-commit" aria-hidden="true" />
              <div className="dr-item-main">
                <div className="dr-item-row">
                  <h4 className="dr-item-title">
                    {it.title || KINDS[sec.kind].titleLabel}
                    {it.subtitle && <span className="dr-at">{sec.kind === 'experience' || sec.kind === 'volunteering' ? ' @ ' : ' · '}{it.subtitle}</span>}
                  </h4>
                  {when && <span className="dr-date">{when}</span>}
                </div>
                {it.location && <p className="dr-muted">{it.location}</p>}
                {it.tags.length > 0 && (
                  <p className="dr-topic-list dr-item-tags">
                    {it.tags.map((t) => (
                      <span key={t} className="dr-topic">
                        {t}
                      </span>
                    ))}
                  </p>
                )}
                {it.url && (
                  <p>
                    <UrlLink url={it.url} className="dr-link" />
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

export const devRepo: TemplateDef = {
  id: 'dev-repo',
  number: 3,
  name: 'Dev-Repo Style',
  category: 'Software & tech',
  description: 'Your resume as a project README: badges for contacts, repository cards for projects and topic pills for skills.',
  className: 't-dev-repo',
  margins: { top: 13, topNext: 20, right: 15, bottom: 13, left: 15 },
  regions: ['main'],
  build,
};
