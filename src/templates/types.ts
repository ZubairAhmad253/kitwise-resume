import type { ReactNode } from 'react';
import type { Resume } from '@/lib/resume/types';

/** Columns a template can lay content into. Single-column templates use only "main". */
export type RegionId = 'main' | 'side';

/** One unbreakable piece of content; pages break only between blocks. */
export interface Block {
  key: string;
  node: ReactNode;
  /** Never end a page with this block (headings, entry headers). */
  keepWithNext?: boolean;
}

export interface TemplateContent {
  /** Full-width area at the top of page 1 only (e.g. a name band). */
  header?: ReactNode;
  regions: Partial<Record<RegionId, Block[]>>;
}

export interface TemplateDef {
  id: string;
  /** Number in the design catalogue (1–20). */
  number: number;
  name: string;
  /** Field this design is made for, e.g. "Software & tech". */
  category: string;
  description: string;
  /** Root CSS class; the template's stylesheet is scoped under it. */
  className: string;
  /** Page margins in mm. `topNext` is the top margin on pages 2+, so continued pages never start at the edge. */
  margins: { top: number; topNext: number; right: number; bottom: number; left: number };
  /** Regions in visual order (left to right). */
  regions: RegionId[];
  build: (resume: Resume) => TemplateContent;
  /** Full-bleed page decoration (rails, bands, patterns) drawn behind the content. */
  decor?: (pageIndex: number) => ReactNode;
}
