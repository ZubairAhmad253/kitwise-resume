import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PAPER, PAPER_SIZES, PX_PER_MM } from '@/lib/resume/paper';
import type { Action } from '@/lib/resume/store';
import type { PaperSize, Resume } from '@/lib/resume/types';
import { usePagedLayout } from '@/components/resume/usePagedLayout';
import { getTemplate } from '@/templates';
import { letterTemplateFor } from '@/templates/letter';
import { DesignPanel } from './DesignPanel';
import { ReviewPanel } from './ReviewPanel';
import { TemplateGallery } from './TemplateGallery';
import { Icon } from './icons';

const PAD = 32;
const GAP = 24;

/** Opens the browser's print dialog, where "Save as PDF" makes the file. */
function downloadPdf(resume: Resume, what: string) {
  const before = document.title;
  const who = resume.basics.name.trim();
  // Browsers use the page title as the suggested PDF file name.
  document.title = `${who ? `${who} – ` : ''}${what}`.replace(/[\\/:*?"<>|]+/g, '');
  const restore = () => {
    document.title = before;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}

export function PreviewPanel({ resume, dispatch, doc = 'resume' }: { resume: Resume; dispatch: (a: Action) => void; doc?: 'resume' | 'letter' }) {
  const base = getTemplate(resume.settings.template);
  // The letter uses the same template's fonts and colours (letterTemplateFor caches, so identity is stable).
  const template = doc === 'letter' ? letterTemplateFor(base) : base;
  const layout = usePagedLayout(resume, template, resume.settings.fitOnePage);
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.7);
  const [printHost, setPrintHost] = useState<HTMLElement | null>(null);
  const [measureHost, setMeasureHost] = useState<HTMLElement | null>(null);
  const [gallery, setGallery] = useState(false);
  const [panel, setPanel] = useState<'design' | 'check' | null>(null);
  const toggle = (p: 'design' | 'check') => setPanel((cur) => (cur === p ? null : p));

  // Scale pages to the panel width (never above 100%).
  const pageW = layout.paper.width * PX_PER_MM;
  const pageH = layout.paper.height * PX_PER_MM;
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setZoom(Math.min(1, Math.max(0.25, (el.clientWidth - PAD * 2) / pageW)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageW]);

  // The print copy lives directly under <body> so print CSS can show only it,
  // and the measuring copy too, so it still measures when the preview panel is
  // hidden (the Edit tab on phones).
  useEffect(() => {
    const print = document.createElement('div');
    print.id = 'kr-print';
    const measure = document.createElement('div');
    measure.id = 'kr-measure-host';
    document.body.append(print, measure);
    setPrintHost(print);
    setMeasureHost(measure);
    return () => {
      print.remove();
      measure.remove();
    };
  }, []);

  const { paper } = layout;
  const status = `${layout.pageCount} page${layout.pageCount === 1 ? '' : 's'}${layout.scale < 1 ? ` · text at ${Math.round(layout.scale * 100)}%` : ''}`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setGallery(true)}
          aria-haspopup="dialog"
          className="inline-flex h-9 max-w-[15rem] items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium hover:border-brand/40"
          title="Change template"
        >
          <Icon name="grid" className="size-4 shrink-0 text-muted" />
          <span className="truncate">
            {base.number}. {base.name}
          </span>
          <Icon name="chevron" className="size-3.5 shrink-0 text-muted" />
        </button>
        <button
          type="button"
          onClick={() => toggle('design')}
          aria-expanded={panel === 'design'}
          aria-controls="kr-panel"
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium ${panel === 'design' ? 'border-brand bg-brand-soft text-fg' : 'border-line bg-surface hover:border-brand/40'}`}
        >
          <Icon name="palette" /> Design
        </button>
        {doc === 'resume' && (
        <button
          type="button"
          onClick={() => toggle('check')}
          aria-expanded={panel === 'check'}
          aria-controls="kr-panel"
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium ${panel === 'check' ? 'border-brand bg-brand-soft text-fg' : 'border-line bg-surface hover:border-brand/40'}`}
        >
          <Icon name="check" /> Check
        </button>
        )}
        <div className="flex overflow-hidden rounded-lg border border-line" role="radiogroup" aria-label="Paper size">
          {PAPER_SIZES.map((p: PaperSize) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={resume.settings.paper === p}
              title={`${PAPER[p].label}: ${PAPER[p].width} × ${PAPER[p].height} mm (${PAPER[p].hint})`}
              onClick={() => dispatch({ type: 'settings', patch: { paper: p } })}
              className={`h-9 px-2.5 text-sm font-medium ${resume.settings.paper === p ? 'bg-brand text-brand-fg' : 'bg-surface text-muted hover:text-fg'}`}
            >
              {PAPER[p].label}
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={resume.settings.fitOnePage} onChange={(e) => dispatch({ type: 'settings', patch: { fitOnePage: e.target.checked } })} className="size-4 accent-[var(--brand)]" />
          Fit to one page
        </label>
        <span className={`text-xs ${layout.fitFailed ? 'text-warn' : 'text-muted'}`} aria-live="polite">
          {layout.fitFailed ? `Too long for one page (${status})` : status}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted xl:inline">Choose “Save as PDF” in the print window</span>
          <button type="button" onClick={() => downloadPdf(resume, doc === 'letter' ? 'Cover letter' : 'Resume')} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-brand-fg hover:opacity-90">
            <Icon name="download" /> Download PDF
          </button>
        </div>
      </div>

      {panel && (
        <div id="kr-panel">
          {panel === 'check' && doc === 'resume' ? <ReviewPanel resume={resume} pageCount={layout.pageCount} /> : <DesignPanel resume={resume} template={base} dispatch={dispatch} />}
        </div>
      )}

      <div ref={box} className="min-h-0 flex-1 overflow-auto bg-surface-2" aria-label="Resume preview">
        <div className="flex flex-col items-center" style={{ padding: PAD, gap: GAP }}>
          {layout.pages.map((page, i) => (
            <div key={i} className="relative" style={{ width: pageW * zoom, height: pageH * zoom }}>
              <div className="absolute top-0 left-0 origin-top-left shadow-[0_2px_12px_rgb(15_23_42/0.18)]" style={{ transform: `scale(${zoom})` }}>
                {page}
              </div>
              {layout.pageCount > 1 && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[11px] text-muted">Page {i + 1}</span>}
            </div>
          ))}
        </div>
      </div>

      {gallery && (
        <TemplateGallery
          resume={resume}
          onClose={() => setGallery(false)}
          onPick={(id) => {
            dispatch({ type: 'settings', patch: { template: id } });
            setGallery(false);
          }}
        />
      )}

      {measureHost && createPortal(layout.measurer, measureHost)}

      {printHost &&
        createPortal(
          <>
            <style>{`@page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }`}</style>
            {layout.pages}
          </>,
          printHost,
        )}
    </div>
  );
}
