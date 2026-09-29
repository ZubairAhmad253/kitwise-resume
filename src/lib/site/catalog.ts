/**
 * What the site pages show: which example content previews each
 * template, the fields templates are grouped by, and the notes on each
 * resume example page.
 */
import { SAMPLES, sampleById } from '@/lib/resume/samples';
import type { Resume } from '@/lib/resume/types';
import { TEMPLATES } from '@/templates';
import type { TemplateDef } from '@/templates/types';

/** The example that best shows a template, by the field it's made for. */
const EXAMPLE_FOR_CATEGORY: Record<string, string> = {
  'Software & tech': 'software',
  'Startups & freshers': 'fresher',
  'Mechanical & electrical engineering': 'mechanical',
  'Civil engineering & construction': 'civil',
  'Healthcare & medicine': 'doctor',
  'Logistics, drivers & aviation': 'driver',
  'Creative, design & marketing': 'designer',
  'Corporate, finance & administration': 'finance',
  'Academia, science & legal': 'academic',
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function exampleIdFor(t: TemplateDef): string {
  return SAMPLES.find((s) => s.build().settings.template === t.id)?.id ?? EXAMPLE_FOR_CATEGORY[t.category] ?? 'software';
}

/** Example content in a given template, for previews. */
export function previewResume(t: TemplateDef, exampleId = exampleIdFor(t)): Resume {
  const r = sampleById(exampleId)!.build();
  return { ...r, settings: { ...r.settings, template: t.id } };
}

/** Templates grouped by field, in catalogue order. */
export function templatesByCategory(): { category: string; slug: string; templates: TemplateDef[] }[] {
  const out: { category: string; slug: string; templates: TemplateDef[] }[] = [];
  for (const t of TEMPLATES) {
    let group = out.find((g) => g.category === t.category);
    if (!group) out.push((group = { category: t.category, slug: slugify(t.category), templates: [] }));
    group.templates.push(t);
  }
  return out;
}

/** Plain-language facts about a template's layout, for its page. */
export function templateFacts(t: TemplateDef): string[] {
  const facts = [t.regions.length > 1 ? 'Two columns: details at the side, your career in the main column' : 'One column, easy for recruiters and applicant tracking systems to read'];
  facts.push('A4, US Letter or US Legal, with clean page breaks and room at the top of every new page');
  facts.push('Change the accent colour, typeface, text size and spacing in Design');
  facts.push('Free PDF download with real, selectable text; Word and plain-text copies too');
  return facts;
}

export interface ExampleNotes {
  title: string;
  intro: string;
  tips: string[];
  /** Phrase library field for the example's bullet ideas. */
  field: string;
}

export const EXAMPLE_NOTES: Record<string, ExampleNotes> = {
  software: {
    title: 'Software engineer resume example',
    intro: 'A backend-focused senior engineer: impact in numbers, the stack up front, and one open-source project that shows the work.',
    tips: ['Lead with results: latency, uptime, users, cost. Recruiters skim for numbers.', 'Group skills by type (languages, platforms, practices) so they are easy to scan.', 'Link one or two projects or a GitHub profile rather than listing every repository.', 'Keep it to one page unless you have well over ten years of relevant experience.'],
    field: 'software',
  },
  fresher: {
    title: 'Graduate and fresher resume example',
    intro: 'A new computer engineering graduate with no full-time job yet: education first, then projects and an internship that prove the skills.',
    tips: ['Put education at the top while it is your strongest section.', 'Treat projects like jobs: your role, what you built, and a result.', 'Hackathon wins, club roles and part-time work all count as experience.', 'One page is plenty; leave out school-level details once you have a degree.'],
    field: 'student',
  },
  mechanical: {
    title: 'Mechanical engineer resume example',
    intro: 'A chartered HVAC and MEP engineer: project scale, standards and software, and savings that clients can put a figure on.',
    tips: ['Name the standards and codes you design to; many job ads ask for them by name.', 'Give project scale: tonnage, floor area, value or number of units.', 'List chartered or professional status near the top.', 'Show commissioning and site results as well as design work.'],
    field: 'engineering',
  },
  civil: {
    title: 'Civil and structural engineer resume example',
    intro: 'A structural engineer on metro, bridge and high-rise work, with the headline projects given their own space.',
    tips: ['Give key projects their own entries with value, size and your role.', 'Mention safety records and early or on-budget delivery.', 'List analysis software and design codes separately so both are easy to find.', 'Put your professional engineer registration in the headline or near it.'],
    field: 'engineering',
  },
  doctor: {
    title: 'Doctor and physician CV example',
    intro: 'A consultant internist: licences and board certification first, then clinical roles, training and publications.',
    tips: ['Put licences and registration numbers where they are seen first.', 'Show the size of your service: beds, clinics, patients per week.', 'Include quality-improvement work and teaching, not only clinical duties.', 'Keep publications short: title, journal and year is enough on a CV.'],
    field: 'healthcare',
  },
  driver: {
    title: 'Heavy vehicle driver resume example',
    intro: 'A GCC heavy vehicle driver where licences and a clean record decide the shortlist, so they come first.',
    tips: ['List every licence with its issuing authority and expiry date.', 'Give your safety record and on-time rate in numbers.', 'Name the vehicle types and loads you are cleared for (trailers, tankers, ADR).', 'Keep it short: one page with licences, experience and languages.'],
    field: 'logistics',
  },
  designer: {
    title: 'Designer resume example',
    intro: 'A brand and product designer: selected work with outcomes, a short skills list, and a link to the full portfolio.',
    tips: ['Link your portfolio near the top; the resume is the summary, the portfolio is the proof.', 'Pick two or three projects and say what changed because of your work.', 'Keep the layout clean enough for applicant tracking systems to read the text.', 'Show tools and levels briefly instead of long lists.'],
    field: 'creative',
  },
  finance: {
    title: 'Finance manager resume example',
    intro: 'An ACCA-qualified finance manager: budgets owned, close times cut and savings found, in a formal, classic layout.',
    tips: ['Put your qualification (ACCA, CPA, CFA) next to your name or title.', 'Show the size of what you manage: budget, entities, team.', 'Give process improvements in days or hours saved.', 'Name the systems you use (SAP, Oracle, Power BI); they are common filters.'],
    field: 'finance',
  },
  arabic: {
    title: 'Arabic resume example (right to left)',
    intro: 'A qualified accountant in Doha, written in Arabic. The page lays itself out right to left, with Arabic headings, month names and fonts, while emails and links stay readable.',
    tips: ['Write your resume in Arabic and the builder switches to right to left by itself; you can also set it under Design, Text direction.', 'Keep English terms employers search for, such as IFRS, SAP or CMA, as they are.', 'Use Design, “Use Arabic section headings” to rename the default English headings in one click.', 'Many Gulf employers ask for both an Arabic and an English CV: duplicate this one under My resumes and translate the copy.'],
    field: 'finance',
  },
  academic: {
    title: 'Academic CV example',
    intro: 'An associate professor’s full academic CV: appointments, education, publications, teaching, supervision, talks and grants.',
    tips: ['Academic CVs can run to several pages; clarity matters more than length.', 'List publications consistently, newest first, with authors, journal and year.', 'Show funding won, students supervised and invited talks as separate sections.', 'For roles outside academia, shorten this to a two-page resume.'],
    field: 'education',
  },
};
