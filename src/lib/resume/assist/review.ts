/**
 * The resume check: a score out of 100 and a list of concrete fixes and
 * tips, from the resume data alone (nothing is sent anywhere). Also
 * matches a pasted job ad against the resume's words.
 */
import { parseRichText, plainText, type Inline } from '../richtext';
import type { Resume } from '../types';
import { isHeadingText } from '../import/parse';
import { ACTION_VERBS } from './phrases';

export type CheckLevel = 'fix' | 'tip' | 'good';

export interface Check {
  id: string;
  level: CheckLevel;
  group: 'Details' | 'Summary' | 'Experience' | 'Writing' | 'Skills & education' | 'ATS & layout';
  message: string;
  /** Where to look: a section or entry name. */
  where?: string;
}

export interface Review {
  score: number;
  checks: Check[];
}

const VERBS = new Set(ACTION_VERBS);
const words = (s: string) => s.split(/\s+/).filter(Boolean);
const hasNumber = (s: string) => /\d|%|\b(one|two|three|four|five|six|seven|eight|nine|ten|twice|half|double)\b/i.test(s);
const PLACEHOLDER = /\[[^\]]{1,40}\]/;
const FIRST_PERSON = /\b(i|my|me|i'm|i’ve|i've)\b/i;

const inlineText = (nodes: Inline[]): string => nodes.map((n) => (n.type === 'text' ? n.text : inlineText(n.children))).join('');

function bulletsOf(description: string): string[] {
  return parseRichText(description).flatMap((b) => (b.type === 'list' ? b.items.map(inlineText) : []));
}

/**
 * @param pageCount pages in the current layout, when known (the preview knows it).
 * @param now for tests.
 */
export function reviewResume(r: Resume, pageCount?: number, now = new Date()): Review {
  const checks: Check[] = [];
  let got = 0;
  let total = 0;
  /** A scored criterion: `share` of `points` (0..1). */
  const score = (points: number, share: number) => {
    total += points;
    got += points * Math.max(0, Math.min(1, share));
  };
  const add = (c: Check) => checks.push(c);
  const b = r.basics;
  const shown = r.sections.filter((s) => !s.hidden);
  const of = (kind: string) => shown.filter((s) => s.kind === kind);
  const jobs = of('experience').flatMap((s) => s.items);
  const allItems = shown.flatMap((s) => s.items.map((it) => ({ s, it })));

  // Details
  score(10, b.name.trim() ? 1 : 0);
  if (!b.name.trim()) add({ id: 'name', level: 'fix', group: 'Details', message: 'Add your full name.' });
  score(8, b.email ? 1 : 0);
  if (!b.email) add({ id: 'email', level: 'fix', group: 'Details', message: 'Add an email address so employers can reply.' });
  else if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(b.email)) add({ id: 'email-format', level: 'fix', group: 'Details', message: `Check your email address: “${b.email}” doesn’t look complete.` });
  score(6, b.phone ? 1 : 0);
  if (!b.phone) add({ id: 'phone', level: 'fix', group: 'Details', message: 'Add a phone number, with the country code if you apply abroad.' });
  score(4, b.location ? 1 : 0);
  if (!b.location) add({ id: 'location', level: 'tip', group: 'Details', message: 'Add your city and country. Many employers and job sites filter by location.' });
  score(6, b.headline ? 1 : 0);
  if (!b.headline) add({ id: 'headline', level: 'tip', group: 'Details', message: 'Add a job title under your name (the role you want), so readers know what you do at a glance.' });
  if (!b.linkedin && jobs.length) add({ id: 'linkedin', level: 'tip', group: 'Details', message: 'Add your LinkedIn profile. Recruiters usually look it up anyway.' });

  // Summary
  const summaryWords = words(plainText(b.summary)).length;
  score(8, summaryWords ? 1 : 0);
  score(4, summaryWords >= 25 && summaryWords <= 120 ? 1 : 0);
  if (!summaryWords) add({ id: 'summary', level: 'fix', group: 'Summary', message: 'Write a short summary: two or three sentences on who you are, your experience and what you’re after. Use “Ideas” for a starting point.' });
  else if (summaryWords < 25) add({ id: 'summary-short', level: 'tip', group: 'Summary', message: `Your summary is ${summaryWords} words. Aim for 25 to 80: add your years of experience, strongest skills and a result.` });
  else if (summaryWords > 120) add({ id: 'summary-long', level: 'tip', group: 'Summary', message: `Your summary is ${summaryWords} words. Keep it under about 80 so it gets read.` });
  if (FIRST_PERSON.test(b.summary) && summaryWords) add({ id: 'summary-voice', level: 'good', group: 'Summary', message: 'Writing your summary in the first person (“I build…”) is fine. Just keep bullet points short and verb-first.' });

  // Experience (students can rely on education and projects)
  const hasProjects = of('projects').some((s) => s.items.length);
  const hasEducation = of('education').some((s) => s.items.length);
  score(15, jobs.length ? 1 : hasProjects && hasEducation ? 0.8 : 0);
  if (!jobs.length) add({ id: 'experience', level: hasProjects ? 'tip' : 'fix', group: 'Experience', message: hasProjects ? 'No work experience yet: that’s fine for a first job. Add internships, volunteering or part-time work if you have any.' : 'Add your work experience, or projects and volunteering if you are just starting out.' });
  const named = jobs.filter((j) => j.title && j.subtitle).length;
  const dated = jobs.filter((j) => j.start).length;
  if (jobs.length) {
    score(4, named / jobs.length);
    score(4, dated / jobs.length);
    for (const j of jobs) {
      const label = j.title || j.subtitle || 'An entry';
      if (!j.title || !j.subtitle) add({ id: `job-name-${j.id}`, level: 'fix', group: 'Experience', message: `Add both the job title and the employer.`, where: label });
      if (!j.start) add({ id: `job-date-${j.id}`, level: 'fix', group: 'Experience', message: 'Add a start date (month and year).', where: label });
      if (j.start && j.end && !j.current && j.end < j.start) add({ id: `job-order-${j.id}`, level: 'fix', group: 'Experience', message: 'The end date is before the start date.', where: label });
      const nowYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (j.start && j.start.slice(0, 7) > nowYm) add({ id: `job-future-${j.id}`, level: 'fix', group: 'Experience', message: 'The start date is in the future.', where: label });
      if (bulletsOf(j.description).length < 2 && words(plainText(j.description)).length < 25)
        add({ id: `job-bullets-${j.id}`, level: 'tip', group: 'Experience', message: 'Add two to five bullet points on what you achieved here.', where: label });
    }
  }

  // Writing quality of bullets everywhere
  const bullets = allItems.flatMap(({ s, it }) => bulletsOf(it.description).map((text) => ({ text, where: it.title || s.title })));
  if (bullets.length) {
    const verbFirst = bullets.filter((x) => VERBS.has(x.text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '') ?? '')).length;
    const quantified = bullets.filter((x) => hasNumber(x.text)).length;
    score(6, verbFirst / bullets.length / 0.6);
    score(8, quantified / bullets.length / 0.4);
    if (verbFirst / bullets.length < 0.6) add({ id: 'verbs', level: 'tip', group: 'Writing', message: `${bullets.length - verbFirst} of ${bullets.length} bullet points don’t start with an action verb. Start with what you did: Led, Built, Cut, Improved…` });
    else add({ id: 'verbs-ok', level: 'good', group: 'Writing', message: 'Your bullet points start with strong verbs.' });
    if (quantified / bullets.length < 0.4) add({ id: 'numbers', level: 'tip', group: 'Writing', message: `Only ${quantified} of ${bullets.length} bullet points have a number. Add results you can measure: money, time, %, people, volume.` });
    else add({ id: 'numbers-ok', level: 'good', group: 'Writing', message: 'Plenty of your bullet points show measurable results.' });
    const long = bullets.filter((x) => words(x.text).length > 40);
    if (long.length) add({ id: 'long-bullets', level: 'tip', group: 'Writing', message: `${long.length} bullet point${long.length > 1 ? 's are' : ' is'} over 40 words. Split or trim them so they can be skimmed.`, where: long[0].where });
    const firstPerson = bullets.filter((x) => FIRST_PERSON.test(x.text));
    score(3, firstPerson.length ? 0 : 1);
    if (firstPerson.length) add({ id: 'pronouns', level: 'tip', group: 'Writing', message: `Drop “I” and “my” from bullet points (${firstPerson.length} found). “Led a team of 5”, not “I led my team of 5”.`, where: firstPerson[0].where });
    const seen = new Map<string, string>();
    for (const x of bullets) {
      const key = x.text.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key && seen.has(key)) {
        add({ id: 'duplicate', level: 'tip', group: 'Writing', message: 'The same bullet point appears more than once.', where: x.where });
        break;
      }
      seen.set(key, x.where);
    }
  }
  const placeholder = [b.summary, b.headline, ...allItems.map(({ it }) => [it.title, it.subtitle, it.description].join(' '))].find((t) => PLACEHOLDER.test(t));
  score(5, placeholder ? 0 : 1);
  if (placeholder) add({ id: 'placeholder', level: 'fix', group: 'Writing', message: `Replace the parts in square brackets with your own facts, e.g. “${PLACEHOLDER.exec(placeholder)![0]}”.` });

  // Skills & education
  const skillCount = of('skills').flatMap((s) => s.items.flatMap((i) => (i.tags.length ? i.tags : [i.title]))).filter(Boolean).length;
  // Academic CVs (with publications) often leave skills out; that's a tip, not a fault.
  const academic = of('publications').some((s) => s.items.length > 0);
  score(8, academic && !skillCount ? 0.75 : Math.min(1, skillCount / 5));
  if (academic && !skillCount) add({ id: 'skills', level: 'tip', group: 'Skills & education', message: 'Academic CVs often skip a skills list, but a short one (methods, instruments, software) helps with applications outside academia.' });
  else if (skillCount < 5) add({ id: 'skills', level: skillCount ? 'tip' : 'fix', group: 'Skills & education', message: skillCount ? `List at least 5 skills (you have ${skillCount}). Use the words from the job ads you apply to.` : 'Add a Skills section. Applicant tracking systems search it for keywords.' });
  score(6, hasEducation ? 1 : 0);
  if (!hasEducation) add({ id: 'education', level: 'tip', group: 'Skills & education', message: 'Add your education, even if it’s a school certificate or a short course.' });

  // ATS & layout
  if (pageCount !== undefined) {
    score(3, pageCount <= 2 ? 1 : 0);
    if (pageCount > 2) add({ id: 'pages', level: 'tip', group: 'ATS & layout', message: `Your resume is ${pageCount} pages. Two is plenty for most jobs (academic CVs are the exception). Try “Fit to one page” or trim older roles.` });
  }
  const oddTitles = shown.filter((s) => s.kind !== 'custom' && !isHeadingText(s.title)).map((s) => s.title);
  if (oddTitles.length) add({ id: 'headings', level: 'tip', group: 'ATS & layout', message: `Some applicant tracking systems look for standard headings. Consider renaming “${oddTitles[0]}” to a common name like “Experience”, “Education” or “Skills”.` });
  if (b.photo && r.settings.showPhoto && r.settings.paper !== 'A4') add({ id: 'photo', level: 'tip', group: 'ATS & layout', message: 'In the US and Canada, resumes usually leave the photo out. You can hide it in Design.' });
  add({ id: 'ats-text', level: 'good', group: 'ATS & layout', message: 'The PDF keeps real, selectable text, so applicant tracking systems can read it.' });

  return { score: Math.round((got / Math.max(1, total)) * 100), checks };
}

/* ---------- job ad matching ---------- */

const STOP = new Set(
  'a about above across after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each etc few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not now of off on once only or other our ours out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours able ability across apply applicant applicants based benefits candidate candidates company day days degree desired duties environment etc excellent experience experienced full good great help high including job join key knowledge least looking must new one opportunity plus position preferred prior proven related relevant required requirements responsibilities responsible role salary skills strong successful support team teams time type use using work working world year years well within per plus make ensure provide build building senior junior services service solutions product products seeking ideal bonus nice hands looking minimum'.split(
    /\s+/,
  ),
);

function terms(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9+#./-]*[a-z0-9+#]|[a-z]/g) ?? []).filter((w) => w.length > 1 && !STOP.has(w));
}

export interface JobMatch {
  /** 0–100: share of the ad's key terms found in the resume. */
  score: number;
  matched: string[];
  missing: string[];
}

/** The ad's most repeated meaningful words and two-word phrases, checked against the resume text. */
export function matchJob(r: Resume, ad: string, limit = 25): JobMatch {
  const counts = new Map<string, number>();
  const bump = (t: string, n = 1) => counts.set(t, (counts.get(t) ?? 0) + n);
  const list = terms(ad);
  list.forEach((t) => bump(t));
  // Two-word phrases that repeat ("project management", "power bi") count extra.
  for (let i = 0; i + 1 < list.length; i++) bump(`${list[i]} ${list[i + 1]}`, 0.5);
  // Phrases only when they repeat; single words that a chosen phrase already covers are dropped.
  const ranked = [...counts.entries()]
    .filter(([t, n]) => !t.includes(' ') || n >= 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
  const top: string[] = [];
  for (const t of ranked) {
    if (top.length >= limit) break;
    if (!t.includes(' ') && top.some((p) => p.split(' ').includes(t))) continue;
    top.push(t);
  }
  const text = resumeText(r);
  const has = (t: string) => {
    const stem = t.replace(/(ies|es|s)$/, '');
    return new RegExp(`(^|[^a-z0-9])${escape(stem)}`, 'i').test(text);
  };
  const matched = top.filter(has);
  const missing = top.filter((t) => !has(t));
  return { score: top.length ? Math.round((matched.length / top.length) * 100) : 0, matched, missing };
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function resumeText(r: Resume): string {
  const b = r.basics;
  return [b.headline, b.summary, ...r.sections.filter((s) => !s.hidden).flatMap((s) => [s.title, ...s.items.flatMap((i) => [i.title, i.subtitle, i.description, i.tags.join(' ')])])]
    .join(' \n ')
    .toLowerCase();
}
