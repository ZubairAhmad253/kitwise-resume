/**
 * The resume document. Every template renders this same shape, so a user
 * can switch templates without retyping anything.
 */

export type SectionKind =
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'awards'
  | 'publications'
  | 'volunteering'
  | 'references'
  | 'custom';

export interface Basics {
  name: string;
  /** Job title or one-line pitch under the name. */
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  /** Square JPEG data URL, or '' for no photo. */
  photo: string;
  /** Rich text (see richtext.ts). */
  summary: string;
}

/**
 * One entry in a section. The fields are shared by every section kind and
 * each kind labels and shows the ones it uses (see schema.ts).
 */
export interface Item {
  id: string;
  /** Job title, degree, skill, project, certificate, language… */
  title: string;
  /** Employer, school, issuer, publisher, proficiency… */
  subtitle: string;
  location: string;
  /** "YYYY-MM" or "YYYY", or '' when not set. */
  start: string;
  end: string;
  /** Still doing it: the end date shows as "Present". */
  current: boolean;
  url: string;
  /** Rich text (see richtext.ts). */
  description: string;
  /** Keywords: skills in a group, a project's tech stack… */
  tags: string[];
  /** 0 = not shown, 1–5 = proficiency. */
  level: number;
}

export interface Section {
  id: string;
  kind: SectionKind;
  /** Heading shown on the resume; the user can rename it. */
  title: string;
  hidden: boolean;
  items: Item[];
}

export type PaperSize = 'A4' | 'Letter' | 'Legal';
export type DateFormat = 'MMM YYYY' | 'MM/YYYY' | 'YYYY';
/** Typeface for the whole page; 'template' keeps the design's own pairing. */
export type FontChoice = 'template' | 'inter' | 'jakarta' | 'gelasio' | 'garamond';
export type TextSize = 'S' | 'M' | 'L';
export type Spacing = 'compact' | 'normal' | 'relaxed';

export interface Settings {
  template: string;
  paper: PaperSize;
  dateFormat: DateFormat;
  showPhoto: boolean;
  /** Shrink text slightly (down to about 82%) to fit everything on one page. */
  fitOnePage: boolean;
  /** Accent colour as '#rrggbb', or '' for the template's own colour. */
  accent: string;
  font: FontChoice;
  textSize: TextSize;
  spacing: Spacing;
}

export interface Resume {
  version: 1;
  id: string;
  /** Name of the document itself (not the person), e.g. "Software engineer CV". */
  name: string;
  updatedAt: string;
  basics: Basics;
  sections: Section[];
  settings: Settings;
}
