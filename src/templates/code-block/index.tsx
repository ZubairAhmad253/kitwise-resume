/**
 * #1 Code-Block Minimalist: a 30/70 split with a dark slate rail. Skills
 * sit in a terminal window, headings read like code comments. JetBrains
 * Mono for labels, Inter for reading text.
 */
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/inter';
import './code-block.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, splitSections, standalone, UrlLink } from '../shared';
import type { Block, TemplateDef } from '../types';

const SIDE_KINDS = ['skills', 'languages', 'certifications', 'awards'] as const;

/** "Senior Software Engineer" → "senior-software-engineer" for the prompt line. */
const slug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function build(r: Resume) {
  const { side, main } = splitSections(r, [...SIDE_KINDS]);
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);

  const sideTitle = (s: Section) => <h3 className="cb-side-title">{s.title}</h3>;
  const mainTitle = (s: Section) => <h2 className="cb-title">{s.title}</h2>;

  const sideBlocks: Block[] = [];
  if (showPhoto) sideBlocks.push({ key: 'photo', node: <img className="cb-photo" src={b.photo} alt="" /> });
  const contacts = contactLines(b);
  if (contacts.length)
    sideBlocks.push(
      standalone(
        'contact',
        <div>
          <h3 className="cb-side-title">contact</h3>
          <ul className="cb-contact">
            {contacts.map((c) => (
              <li key={c.kind}>
                <span className="cb-key">{c.kind}:</span>
                <span className="cb-contact-value">
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
        whole: (sec) =>
          sec.kind === 'skills' ? (
            <div className="cb-term">
              <div className="cb-term-bar" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="cb-term-body">
                {sec.items.map((it) => (
                  <div key={it.id} className="cb-term-group">
                    <p className="cb-term-cmd">
                      <span className="cb-prompt">$</span> ls {slug(it.title || 'skills')}/
                    </p>
                    {it.tags.length > 0 && <p className="cb-term-out">{it.tags.join('  ')}</p>}
                    {it.description && <RichText source={it.description} className="cb-term-out" />}
                  </div>
                ))}
              </div>
            </div>
          ) : null,
        item: (sec, it) => (
          <div className="cb-side-item">
            <p className="cb-side-item-title">{it.title}</p>
            {it.subtitle && <p className="cb-side-muted">{it.subtitle}</p>}
            {(sec.kind === 'certifications' || sec.kind === 'awards') && dateText(r, sec, it) && <p className="cb-side-muted">{dateText(r, sec, it)}</p>}
            <Level value={it.level} className="cb-dots" />
            {it.description && <RichText source={it.description} className="cb-side-desc" />}
          </div>
        ),
      }),
    );

  const mainBlocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="cb-head">
          <p className="cb-whoami">
            <span className="cb-prompt">~$</span> whoami
          </p>
          <h1 className="cb-name">{b.name || 'Your Name'}</h1>
          {b.headline && <p className="cb-headline">{b.headline}</p>}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (b.summary) mainBlocks.push(standalone('summary', <RichText source={b.summary} className="cb-summary" />));
  for (const s of main)
    mainBlocks.push(
      ...sectionBlocks(s, {
        title: mainTitle,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          const where = [it.subtitle, it.location].filter(Boolean).join(' · ');
          return (
            <div className="cb-item">
              <div className="cb-item-row">
                <h4 className="cb-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="cb-date">{when}</span>}
              </div>
              {where && <p className="cb-where">{where}</p>}
              {(it.tags.length > 0 || it.url) && (
                <p className="cb-meta">
                  {it.tags.map((t) => (
                    <span key={t} className="cb-tag">
                      {t}
                    </span>
                  ))}
                  <UrlLink url={it.url} className="cb-url" />
                </p>
              )}
            </div>
          );
        },
      }),
    );

  return { regions: { side: sideBlocks, main: mainBlocks } };
}

export const codeBlock: TemplateDef = {
  id: 'code-block',
  number: 1,
  name: 'Code-Block Minimalist',
  category: 'Software & tech',
  description: 'A dark slate rail with your stack in a terminal window, and a clean, code-inspired career history.',
  className: 't-code-block',
  margins: { top: 14, topNext: 20, right: 12, bottom: 12, left: 0 },
  regions: ['side', 'main'],
  build,
  decor: () => <div className="cb-rail" />,
};
