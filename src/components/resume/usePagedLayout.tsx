import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { paginate } from '@/lib/resume/paginate';
import { PAPER } from '@/lib/resume/paper';
import type { Resume } from '@/lib/resume/types';
import type { Block, RegionId, TemplateDef } from '@/templates/types';
import '@/styles/pages.css';

/** Smallest text scale "fit to one page" may use before giving up. */
const MIN_FIT_SCALE = 0.82;
const FIT_STEP = 0.03;

interface PageProps {
  template: TemplateDef;
  paperWidth: number;
  height: number | 'measure';
  pageIndex: number;
  scale: number;
  header?: ReactNode;
  regions: Partial<Record<RegionId, ReactNode>>;
}

/** One sheet. Used for measuring, previewing and printing, so all three always match. */
function Page({ template, paperWidth, height, pageIndex, scale, header, regions }: PageProps) {
  const m = template.margins;
  const style = { width: `${paperWidth}mm`, height: height === 'measure' ? '4000mm' : `${height}mm`, '--kr-scale': scale } as CSSProperties;
  return (
    <div className={`kr-page ${template.className}`} style={style} data-page={pageIndex + 1}>
      {template.decor && <div className="kr-decor">{template.decor(pageIndex)}</div>}
      <div className="kr-body" style={{ padding: `${pageIndex === 0 ? m.top : m.topNext}mm ${m.right}mm ${m.bottom}mm ${m.left}mm` }}>
        {pageIndex === 0 && header && <div className="kr-header">{header}</div>}
        <div className="kr-cols">
          {template.regions.map((id) => (
            <div key={id} className={`kr-region kr-region-${id}`} data-region={id}>
              {regions[id]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const wrap = (blocks: Block[]) =>
  blocks.map((b) => (
    <div key={b.key} className="kr-block" data-block={b.key}>
      {b.node}
    </div>
  ));

/** Content height available inside a region element (its box minus padding and borders). */
function innerHeight(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return el.getBoundingClientRect().height - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
}

export interface PagedLayout {
  /** Hidden measuring copies; mount them where no ancestor can be display: none (e.g. a portal under <body>). */
  measurer: ReactNode;
  /** Rendered pages at full size, ready for the preview or the print view. */
  pages: ReactNode[];
  pageCount: number;
  paper: { width: number; height: number };
  /** Text scale in use (below 1 when fitting to one page). */
  scale: number;
  /** True when "fit to one page" couldn't get everything onto one page. */
  fitFailed: boolean;
}

/**
 * Measures every block of a template off-screen, then splits each column
 * into pages. Re-runs when the resume, template, paper or fonts change.
 */
export function usePagedLayout(resume: Resume, template: TemplateDef, fit: boolean): PagedLayout {
  const paper = PAPER[resume.settings.paper];
  const content = useMemo(() => template.build(resume), [template, resume]);
  const [scale, setScale] = useState(1);
  const [layout, setLayout] = useState<{ pages: Partial<Record<RegionId, number[][]>>; count: number; scale: number } | null>(null);
  const [fontTick, setFontTick] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  // Re-measure once web fonts finish loading (text gets wider or narrower).
  useLayoutEffect(() => {
    const bump = () => setFontTick((t) => t + 1);
    document.fonts?.ready.then(bump);
    document.fonts?.addEventListener('loadingdone', bump);
    return () => document.fonts?.removeEventListener('loadingdone', bump);
  }, []);

  // New content or settings: start the fit search again from full size.
  const contentKey = `${template.id}|${resume.settings.paper}|${fit}|${resume.updatedAt}|${resume.id}`;
  const lastKey = useRef(contentKey);
  useLayoutEffect(() => {
    if (lastKey.current !== contentKey) {
      lastKey.current = contentKey;
      if (scale !== 1) setScale(1);
    }
  }, [contentKey, scale]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const capPages = el.querySelectorAll<HTMLElement>('[data-cap]');
    const flow = el.querySelector<HTMLElement>('[data-flow]');
    if (capPages.length < 2 || !flow) return;

    // A hidden measurer (display: none somewhere above it, or mid-print) reads
    // every height as 0; keep the last good layout rather than collapsing it.
    if (capPages[0].getBoundingClientRect().height < 1) return;

    const pages: Partial<Record<RegionId, number[][]>> = {};
    let count = 1;
    for (const id of template.regions) {
      const blocks = content.regions[id] ?? [];
      const caps = [...capPages].map((p) => innerHeight(p.querySelector<HTMLElement>(`[data-region="${id}"]`)!));
      const heights = blocks.map((b) => {
        const node = flow.querySelector<HTMLElement>(`[data-region="${id}"] > [data-block="${CSS.escape(b.key)}"]`);
        return { height: node ? node.getBoundingClientRect().height : 0, keepWithNext: b.keepWithNext };
      });
      pages[id] = paginate(heights, caps);
      count = Math.max(count, pages[id]!.length);
    }

    if (fit && count > 1 && scale - FIT_STEP >= MIN_FIT_SCALE - 1e-9) {
      setScale(Math.round((scale - FIT_STEP) * 1000) / 1000);
      return;
    }
    setLayout({ pages, count, scale });
  }, [content, template, paper.width, paper.height, scale, fit, fontTick]);

  const measurer = (
    <div ref={root} className="kr-measure" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} data-cap={i}>
          <Page template={template} paperWidth={paper.width} height={paper.height} pageIndex={i} scale={scale} header={content.header} regions={{}} />
        </div>
      ))}
      <div data-flow>
        <Page
          template={template}
          paperWidth={paper.width}
          height="measure"
          pageIndex={0}
          scale={scale}
          header={content.header}
          regions={Object.fromEntries(template.regions.map((id) => [id, wrap(content.regions[id] ?? [])]))}
        />
      </div>
    </div>
  );

  const used = layout ?? { pages: {}, count: 1, scale: 1 };
  const pages = Array.from({ length: used.count }, (_, p) => (
    <Page
      key={p}
      template={template}
      paperWidth={paper.width}
      height={paper.height}
      pageIndex={p}
      scale={used.scale}
      header={content.header}
      regions={Object.fromEntries(
        template.regions.map((id) => {
          const blocks = content.regions[id] ?? [];
          // Until the first measurement lands, show everything on page 1.
          const idx = layout ? (used.pages[id]?.[p] ?? []) : p === 0 ? blocks.map((_, i) => i) : [];
          return [id, wrap(idx.map((i) => blocks[i]).filter(Boolean))];
        }),
      )}
    />
  ));

  return { measurer, pages, pageCount: used.count, paper, scale: used.scale, fitFailed: fit && used.count > 1 };
}
