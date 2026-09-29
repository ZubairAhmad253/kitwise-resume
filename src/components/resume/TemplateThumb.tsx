import { useMemo } from 'react';
import { pageDesign, textFactor } from '@/lib/resume/design';
import { resumeDir } from '@/lib/resume/direction';
import { PAPER, PX_PER_MM } from '@/lib/resume/paper';
import type { Resume } from '@/lib/resume/types';
import type { TemplateDef } from '@/templates/types';
import { Page, wrapBlocks } from './usePagedLayout';

/**
 * A scaled-down first page of a resume in a template: the real page
 * markup, just smaller, so thumbnails always match the PDF. Content past
 * the first page is cut off rather than paginated.
 */
export function TemplateThumb({ resume, template, width }: { resume: Resume; template: TemplateDef; width: number }) {
  const paper = PAPER[resume.settings.paper];
  const content = useMemo(() => template.build(resume), [template, resume]);
  const design = useMemo(() => pageDesign(resume.settings, template.accent, resumeDir(resume)), [resume, template]);
  const zoom = width / (paper.width * PX_PER_MM);
  return (
    <div className="relative overflow-hidden bg-white" style={{ width, height: paper.height * PX_PER_MM * zoom }} aria-hidden="true">
      <div className="pointer-events-none absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${zoom})` }} inert>
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
