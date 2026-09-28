/**
 * #12 Operational Metric: one column that leads with a row of counters
 * (years on the job, employers, licences, languages) worked out from the
 * entries themselves, then a plain, dependable work history. Noto Sans,
 * a free Verdana/Tahoma-style humanist sans.
 */
import '@fontsource-variable/noto-sans';
import './operational-metric.css';
import { RichText } from '@/components/resume/RichText';
import { resumeMetrics } from '@/lib/resume/metrics';
import { KINDS } from '@/lib/resume/schema';
import type { Resume, Section } from '@/lib/resume/types';
import { contactLines, ContactValue, dateText, Level, sectionBlocks, standalone, UrlLink, visibleSections } from '../shared';
import type { Block, TemplateDef } from '../types';

function build(r: Resume) {
  const b = r.basics;
  const showPhoto = r.settings.showPhoto && Boolean(b.photo);
  const contacts = contactLines(b);
  const metrics = resumeMetrics(r);

  const blocks: Block[] = [
    {
      key: 'name',
      node: (
        <div className="om-head">
          {showPhoto && <img className="om-photo" src={b.photo} alt="" />}
          <div className="om-head-text">
            <h1 className="om-name">{b.name || 'Your Name'}</h1>
            {b.headline && <p className="om-headline">{b.headline}</p>}
            {contacts.length > 0 && (
              <ul className="om-contact">
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
  // Counters only make sense as a row; a single one reads like filler.
  if (metrics.length >= 2)
    blocks.push(
      standalone(
        'metrics',
        <ul className="om-metrics">
          {metrics.map((m) => (
            <li key={m.label}>
              <span className="om-metric-value">{m.value}</span>
              <span className="om-metric-label">{m.label}</span>
            </li>
          ))}
        </ul>,
      ),
    );
  if (b.summary) blocks.push(standalone('summary', <RichText source={b.summary} className="om-summary" />));

  const title = (s: Section) => <h2 className="om-title">{s.title}</h2>;
  for (const s of visibleSections(r))
    blocks.push(
      ...sectionBlocks(s, {
        title,
        whole: (sec) =>
          sec.kind === 'skills' || sec.kind === 'languages' ? (
            <div className="om-table">
              {sec.items.map((it) => (
                <div key={it.id} className="om-table-row">
                  <p className="om-table-key">{it.title}</p>
                  <div>
                    {it.subtitle && <span>{it.subtitle}</span>}
                    {it.tags.length > 0 && <span>{it.tags.join(', ')}</span>}
                    {it.description && <RichText source={it.description} className="om-muted" />}
                  </div>
                  <Level value={it.level} className="om-level" />
                </div>
              ))}
            </div>
          ) : null,
        item: (sec, it) => {
          const when = dateText(r, sec, it);
          return (
            <div className="om-item">
              <div className="om-item-row">
                <h4 className="om-item-title">{it.title || KINDS[sec.kind].titleLabel}</h4>
                {when && <span className="om-date">{when}</span>}
              </div>
              {(it.subtitle || it.location) && (
                <p className="om-where">
                  {it.subtitle && <strong>{it.subtitle}</strong>}
                  {it.subtitle && it.location && ' | '}
                  {it.location}
                </p>
              )}
              {it.tags.length > 0 && <p className="om-muted">{it.tags.join(' · ')}</p>}
              {it.url && (
                <p className="om-link">
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

export const operationalMetric: TemplateDef = {
  id: 'operational-metric',
  number: 12,
  name: 'Operational Metric',
  category: 'Logistics, drivers & aviation',
  description: 'Leads with counters worked out from your entries (years, employers, licences), then a clear work history.',
  className: 't-operational-metric',
  margins: { top: 15, topNext: 20, right: 15, bottom: 13, left: 15 },
  regions: ['main'],
  accent: { vars: ['--om-accent'], color: '#0369a1' },
  build,
};
