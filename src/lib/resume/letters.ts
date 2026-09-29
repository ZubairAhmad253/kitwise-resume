/**
 * Starter cover letters. Parts in [square brackets] are for the user to
 * replace (the resume check flags any left in); details the resume already
 * has, like the job title, are filled in.
 */
import type { Resume } from './types';

/** The date on the letter: what the user typed, or today as "29 September 2026". */
export const letterDate = (r: Resume, now = new Date()) => r.letter.date.trim() || now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** "Ms Fatima Ahmed" → "Dear Ms Ahmed,"; "Omar Haddad" → "Dear Omar Haddad,"; nobody → "Dear Hiring Manager,". */
export function greetingFor(recipient: string): string {
  const name = recipient.trim().replace(/\s+/g, ' ');
  if (!name) return 'Dear Hiring Manager,';
  const m = /^(Mr|Mrs|Ms|Miss|Mx|Dr|Prof|Professor|Eng|Sheikh|Sheikha)\.?\s+(.+)$/i.exec(name);
  if (m) return `Dear ${m[1]} ${m[2].split(' ').pop()},`;
  return `Dear ${name},`;
}

export interface LetterStarter {
  id: string;
  label: string;
  hint: string;
  body: (r: Resume) => string;
}

const role = (r: Resume) => r.letter.subject.replace(/^application for\s+/i, '').replace(/\s*\(.*\)$/, '').trim() || '[job title]';
const company = (r: Resume) => r.letter.company.trim() || '[company]';
const years = (r: Resume) => /(\d+)\+?\s+years/i.exec(r.basics.summary)?.[1] ?? '[N]';
const current = (r: Resume) => r.basics.headline.split(/[·|,]/)[0].trim() || '[your current role]';

export const LETTER_STARTERS: LetterStarter[] = [
  {
    id: 'experienced',
    label: 'Experienced professional',
    hint: 'You have relevant experience for the role.',
    body: (r) =>
      `I'm applying for the ${role(r)} role at ${company(r)}. As a ${current(r)} with ${years(r)} years of experience in [field], I have [one or two things the job ad asks for], and I'd like to bring that to your team.

In my current role at [employer], I [biggest relevant achievement, with a number]. I also [second achievement that matches the job ad]. What I enjoy most is [the part of the work this job is about].

I'm drawn to ${company(r)} because [something specific: a product, project, value or piece of news]. I'd welcome the chance to discuss how I could help with [a goal or challenge from the job ad].

Thank you for your time and consideration.`,
  },
  {
    id: 'graduate',
    label: 'Graduate or first job',
    hint: 'You are starting out, or have little paid experience.',
    body: (r) =>
      `I'm writing to apply for the ${role(r)} position at ${company(r)}. I recently completed my [degree] at [university], and I'm keen to start my career in [field] with a team like yours.

During my studies I [project, internship or achievement, with a result]. Through [part-time job, volunteering or society role] I also learned to [skill the job ad asks for].

I'd bring [two strengths] and a real wish to learn. I'm particularly interested in ${company(r)} because [specific reason].

I'd be glad to talk about how I could contribute. Thank you for considering my application.`,
  },
  {
    id: 'change',
    label: 'Changing careers',
    hint: 'You are moving into a new field.',
    body: (r) =>
      `I'm applying for the ${role(r)} role at ${company(r)}. After [N] years in [previous field], I'm moving into [new field], and I believe the skills I've built transfer directly to this position.

In my work as a ${current(r)}, I [achievement that shows a transferable skill, with a number]. To prepare for this move I have [course, certificate or project], where I [what you did and learned].

I'd bring [transferable strengths] along with a fresh perspective on [area]. ${company(r)} stands out to me because [specific reason].

Thank you for your time. I'd welcome the opportunity to discuss my application.`,
  },
];
