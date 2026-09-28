/**
 * #18 Traditional CV: the long-form academic and legal CV. A narrow side
 * column holds contact details and a numbered contents list of the
 * sections (the printed version of a sidebar menu); the main column has
 * numbered sections with dates in the margin. Libre Baskerville with Gelasio.
 */
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@fontsource-variable/gelasio';
import './curriculum-vitae.css';
import { RichText } from '@/components/resume/RichText';
import { KINDS } from '@/lib/resume/schema';
import type { Resume } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, LEVEL_WORDS, sectionBlocks, standalone, UrlLink, visibleSections } from '../shared';
import type { Block, TemplateDef } from '../types';

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);
  const sections = visibleSections(r);

  const header = (
    <div className="cv-head">
      <h1 className="cv-name">{b.name || 'Your Name'}</h1>
      {b.headline && <p className="cv-headline">{b.headline}</p>}
      <p className="cv-kicker">Curriculum Vitae</p>
    </div>
  );

  const sideBlocks: Block[] = [];
  if (showPhoto) sideBlocks.push({ key: 'photo', node: <img className="cv-photo" src={b.photo} alt="" /> });
  if (contacts.length)
    sideBlocks.push(
      standalone(
        'contact',
        <div>
          <p className="cv-side-title">Contact</p>
          <ul className="cv-contact">
            {contacts.map((c) => (
              <li key={c.kind}>
                <span className="cv-contact-label">{c.label}</span>
                <span className="cv-contact-value">
                  <ContactValue line={c} />
                </span>
              </li>
            ))}
          </ul>
        </div>,
      ),
    );
  if (sections.length > 1)
    sideBlocks.push(
      standalone(
        'contents',
        <div>
          <p className="cv-side-title">Contents</p>
          <ol className="cv-toc">
            {sections.map((s, i) => (
              <li key={s.id}>
                <span className="cv-toc-num">{i + 1}</span>
                {s.title}
              </li>
            ))}
          </ol>
        </div>,
      ),
    );

  const mainBlocks: Block[] = [];
  if (b.summary) mainBlocks.push(standalone('summary', <RichText source={b.summary} className="cv-summary" />));
  sections.forEach((s, idx) => {
    mainBlocks.push(
      ...sectionBlocks(s, {
        title: (sec) => (
          <h2 className="cv-title">
            <span className="cv-title-num">{idx + 1}.</span> {sec.title}
          </h2>
        ),
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <div className="cv-list">
              {sec.items.map((it) => (
                <div key={it.id} className="cv-row">
                  <p className="cv-when">{it.title}</p>
                  <div>
                    {[it.subtitle || (it.level ? LEVEL_WORDS[it.level] : ''), it.tags.join(', ')].filter(Boolean).join('; ')}
                    {it.description && <RichText source={it.description} className="cv-muted" />}
                  </div>
                </div>
              ))}
            </div>
          ) : null,
        item: (sec, it) => (
          <div className="cv-row">
            <p className="cv-when">{dateText(r, sec, it)}</p>
            <div>
              <h4 className="cv-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
              {(it.subtitle || it.location) && <p className="cv-where">{[it.subtitle, it.location].filter(Boolean).join(', ')}</p>}
              {it.tags.length > 0 && <p className="cv-muted">{it.tags.join(', ')}</p>}
              {it.url && (
                <p className="cv-link">
                  <UrlLink url={it.url} />
                </p>
              )}
            </div>
          </div>
        ),
      }),
    );
  });

  return { header, regions: { side: sideBlocks, main: mainBlocks } };
}

export const curriculumVitae: TemplateDef = {
  id: 'curriculum-vitae',
  number: 18,
  name: 'Traditional CV',
  category: 'Academia, science & legal',
  description: 'The classic long-form CV: numbered sections, dates in the margin and a contents list in the side column.',
  className: 't-curriculum-vitae',
  margins: { top: 16, topNext: 22, right: 16, bottom: 14, left: 16 },
  regions: ['side', 'main'],
  build,
};
