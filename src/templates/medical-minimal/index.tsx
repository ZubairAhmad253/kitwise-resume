/**
 * #10 Clean Medical Minimalist: airy and quiet. Section names run down a
 * narrow index column on the left, entries sit in rows divided by fine
 * separators, and headings are widely letter-spaced. Arimo with light
 * Open Sans for reading text.
 */
import '@fontsource-variable/arimo';
import '@fontsource-variable/open-sans';
import './medical-minimal.css';
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
        <div className="mm-head">
          <div>
            <h1 className="mm-name">{b.name || 'Your Name'}</h1>
            {b.headline && <p className="mm-headline">{b.headline}</p>}
          </div>
          {showPhoto && <img className="mm-photo" src={b.photo} alt="" />}
        </div>
      ),
      keepWithNext: true,
    },
  ];
  if (contacts.length)
    blocks.push({
      key: 'contact',
      node: (
        <div className="mm-row mm-section-start">
          <p className="mm-index">Contact</p>
          <ul className="mm-contact">
            {contacts.map((c) => (
              <li key={c.kind}>
                <span className="mm-contact-label">{c.label}</span>
                <ContactValue line={c} />
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  if (b.summary)
    blocks.push(
      standalone(
        'summary',
        <div className="mm-row mm-section-start">
          <p className="mm-index">Profile</p>
          <RichText source={b.summary} className="mm-summary" />
        </div>,
      ),
    );

  /*
   * The heading is a zero-height block: its label hangs into the index
   * column beside the first entry, so a section costs no extra line.
   */
  const title = (s: Section) => (
    <h2 className="mm-title">
      <span className="mm-index">{s.title}</span>
    </h2>
  );
  for (const s of visibleSections(r))
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <div className="mm-row">
              <span />
              <div className="mm-pairs">
                {sec.items.map((it) => (
                  <p key={it.id}>
                    <span className="mm-pair-key">{it.title}</span>
                    <span>{[it.subtitle || (it.level ? LEVEL_WORDS[it.level] : ''), it.tags.join(', ')].filter(Boolean).join(' · ')}</span>
                  </p>
                ))}
              </div>
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          return (
            <div className="mm-row">
              <span />
              <div className="mm-item">
                <div className="mm-item-row">
                  <h4 className="mm-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                  {when && <span className="mm-date">{when}</span>}
                </div>
                {(it.subtitle || it.location) && <p className="mm-where">{[it.subtitle, it.location].filter(Boolean).join(', ')}</p>}
                {it.tags.length > 0 && <p className="mm-where">{it.tags.join(' · ')}</p>}
                {it.url && (
                  <p className="mm-link">
                    <UrlLink url={it.url} />
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

export const medicalMinimal: TemplateDef = {
  id: 'medical-minimal',
  number: 10,
  name: 'Clean Medical Minimalist',
  category: 'Healthcare & medicine',
  description: 'Quiet and airy: a slim index of section names on the left, fine row separators and generous spacing.',
  className: 't-medical-minimal',
  margins: { top: 18, topNext: 22, right: 17, bottom: 15, left: 17 },
  regions: ['main'],
  accent: { vars: ['--mm-accent'], color: '#0f7c86' },
  build,
};
