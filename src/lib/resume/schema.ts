/**
 * What each section kind is called and which item fields it uses. The
 * editor builds its forms from this, and templates use it to decide how
 * to lay entries out.
 */
import type { SectionKind } from './types';

export type ItemField = 'title' | 'subtitle' | 'location' | 'dates' | 'url' | 'description' | 'tags' | 'level';

export interface KindConfig {
  /** Default section heading. */
  label: string;
  /** What one entry is called ("Add position"). */
  noun: string;
  fields: ItemField[];
  titleLabel: string;
  subtitleLabel?: string;
  /** Label for the date pair; single-date kinds show only the start. */
  dateLabels?: [start: string, end?: string];
  descriptionLabel?: string;
  tagsLabel?: string;
  levelLabel?: string;
  /** Shown on the "Add section" menu. */
  hint: string;
}

export const KINDS: Record<SectionKind, KindConfig> = {
  experience: {
    label: 'Experience',
    noun: 'position',
    fields: ['title', 'subtitle', 'location', 'dates', 'description'],
    titleLabel: 'Job title',
    subtitleLabel: 'Employer',
    dateLabels: ['Start', 'End'],
    descriptionLabel: 'What you did and achieved',
    hint: 'Jobs, internships and contracts',
  },
  education: {
    label: 'Education',
    noun: 'education',
    fields: ['title', 'subtitle', 'location', 'dates', 'description'],
    titleLabel: 'Degree or qualification',
    subtitleLabel: 'School, college or university',
    dateLabels: ['Start', 'End'],
    descriptionLabel: 'Grade, honours or highlights',
    hint: 'Degrees, diplomas and courses',
  },
  skills: {
    label: 'Skills',
    noun: 'skill',
    fields: ['title', 'tags', 'level'],
    titleLabel: 'Skill or skill group',
    tagsLabel: 'Keywords (optional)',
    levelLabel: 'Level',
    hint: 'Tools, technologies and strengths',
  },
  projects: {
    label: 'Projects',
    noun: 'project',
    fields: ['title', 'subtitle', 'dates', 'url', 'description', 'tags'],
    titleLabel: 'Project name',
    subtitleLabel: 'Your role or organisation',
    dateLabels: ['Start', 'End'],
    descriptionLabel: 'Problem, your contribution and results',
    tagsLabel: 'Tech stack or tools',
    hint: 'Personal, academic or open-source work',
  },
  certifications: {
    label: 'Certifications & licences',
    noun: 'certification',
    fields: ['title', 'subtitle', 'dates', 'url', 'description'],
    titleLabel: 'Certificate or licence',
    subtitleLabel: 'Issuing body',
    dateLabels: ['Issued', 'Expires'],
    descriptionLabel: 'Licence number or details (optional)',
    hint: 'Certificates, licences and registrations',
  },
  languages: {
    label: 'Languages',
    noun: 'language',
    fields: ['title', 'subtitle', 'level'],
    titleLabel: 'Language',
    subtitleLabel: 'Proficiency (e.g. Native, Fluent)',
    levelLabel: 'Level',
    hint: 'Spoken and written languages',
  },
  awards: {
    label: 'Awards',
    noun: 'award',
    fields: ['title', 'subtitle', 'dates', 'description'],
    titleLabel: 'Award',
    subtitleLabel: 'Awarded by',
    dateLabels: ['Date'],
    descriptionLabel: 'Details (optional)',
    hint: 'Prizes, scholarships and honours',
  },
  publications: {
    label: 'Publications',
    noun: 'publication',
    fields: ['title', 'subtitle', 'dates', 'url', 'description'],
    titleLabel: 'Title',
    subtitleLabel: 'Journal, publisher or conference',
    dateLabels: ['Published'],
    descriptionLabel: 'Authors or summary (optional)',
    hint: 'Papers, articles and books',
  },
  volunteering: {
    label: 'Volunteering',
    noun: 'role',
    fields: ['title', 'subtitle', 'location', 'dates', 'description'],
    titleLabel: 'Role',
    subtitleLabel: 'Organisation',
    dateLabels: ['Start', 'End'],
    descriptionLabel: 'What you did',
    hint: 'Charity, community and unpaid work',
  },
  references: {
    label: 'References',
    noun: 'reference',
    fields: ['title', 'subtitle', 'description'],
    titleLabel: 'Name',
    subtitleLabel: 'Position and company',
    descriptionLabel: 'Email or phone',
    hint: 'People who can vouch for you',
  },
  custom: {
    label: 'Custom section',
    noun: 'entry',
    fields: ['title', 'subtitle', 'location', 'dates', 'url', 'description'],
    titleLabel: 'Title',
    subtitleLabel: 'Subtitle',
    dateLabels: ['Start', 'End'],
    descriptionLabel: 'Description',
    hint: 'Anything else: hobbies, interests, patents…',
  },
};

export const SECTION_KINDS = Object.keys(KINDS) as SectionKind[];

export const isSectionKind = (k: unknown): k is SectionKind => typeof k === 'string' && k in KINDS;

/** Kinds whose dates are a single point in time (issued, published). */
export const singleDate = (kind: SectionKind) => (KINDS[kind].dateLabels?.length ?? 0) === 1;
