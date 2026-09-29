import { useMemo } from 'react';
import { pageDesign, textFactor } from '@/lib/resume/design';
import { resumeDir } from '@/lib/resume/direction';
import { PAPER, PX_PER_MM } from '@/lib/resume/paper';
import type { Resume } from '@/lib/resume/types';
import { Page, wrapBlocks } from '@/components/resume/usePagedLayout';
import type { TemplateDef } from '@/templates/types';

/**
 * The first page of a resume, scaled to fill its container. Rendered to
 * static HTML on the site pages (no JavaScript needed to show it); a small
 * script in PreviewScale.astro fits the scale to the container's width.
 */
export function PagePreview({ resume, template, zoom }: { resume: Resume; template: TemplateDef; zoom: number }) {
  const paper = PAPER[resume.settings.paper];
  const content = useMemo(() => template.build(resume), [template, resume]);
  const design = pageDesign(resume.settings, template.accent, resumeDir(resume));
  return (
    <div className="kr-preview" data-preview={paper.width * PX_PER_MM} style={{ aspectRatio: `${paper.width} / ${paper.height}`, ['--z' as string]: zoom }}>
      <div className="kr-preview-page" aria-hidden="true" inert>
        <Page
          template={template}
          paperWidth={paper.width}
          height={paper.height}
          pageIndex={0}
          scale={textFactor(resume.settings)}
          header={content.header}
          design={design}
          regions={Object.fromEntries(template.regions.map((id) => [id, wrapBlocks(content.regions[id] ?? [])]))}
        />
      </div>
    </div>
  );
}
