/**
 * Numbers worked out from the resume itself, for templates that show
 * headline counters. Nothing here is typed in by the user, so it can
 * never disagree with the entries it is based on.
 */
import type { Item, Resume } from './types';

/** "2021-03" → months since year 0; a bare year counts from January (or December for an end date). */
function toMonth(value: string, end: boolean): number | null {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  if (!m) return null;
  const month = m[2] ? Number(m[2]) - 1 : end ? 11 : 0;
  return Number(m[1]) * 12 + month;
}

/**
 * Total months covered by the entries, counting overlapping periods once.
 * An entry marked "current" runs to `now`; one without an end date counts
 * as a single month.
 */
export function coveredMonths(items: Item[], now = new Date()): number {
  const today = now.getFullYear() * 12 + now.getMonth();
  const spans = items
    .map((it): [number, number] | null => {
      const a = toMonth(it.start, false);
      if (a === null) return null;
      const b = it.current ? today : (toMonth(it.end, true) ?? a);
      return b >= a ? [a, Math.min(b, today)] : null;
    })
    .filter((s): s is [number, number] => s !== null && s[1] >= s[0])
    .sort((x, y) => x[0] - y[0]);
  let total = 0;
  let cur: [number, number] | null = null;
  for (const s of spans) {
    if (cur && s[0] <= cur[1] + 1) cur[1] = Math.max(cur[1], s[1]);
    else {
      if (cur) total += cur[1] - cur[0] + 1;
      cur = [s[0], s[1]];
    }
  }
  if (cur) total += cur[1] - cur[0] + 1;
  return total;
}

export interface Metric {
  value: string;
  label: string;
}

/** Headline counters: years of experience, employers, licences, languages. Empty ones are left out. */
export function resumeMetrics(r: Resume, now = new Date()): Metric[] {
  const shown = r.sections.filter((s) => !s.hidden);
  const items = (kind: string) => shown.filter((s) => s.kind === kind).flatMap((s) => s.items);
  const jobs = items('experience');
  const years = Math.floor(coveredMonths(jobs, now) / 12);
  const employers = new Set(jobs.map((j) => j.subtitle.trim().toLowerCase()).filter(Boolean)).size;
  const creds = items('certifications').length;
  const langs = items('languages').length;
  const out: Metric[] = [];
  if (years > 0) out.push({ value: `${years}+`, label: years === 1 ? 'Year of experience' : 'Years of experience' });
  if (employers > 0) out.push({ value: String(employers), label: employers === 1 ? 'Employer' : 'Employers' });
  if (creds > 0) out.push({ value: String(creds), label: creds === 1 ? 'Licence / certificate' : 'Licences & certificates' });
  if (langs > 0) out.push({ value: String(langs), label: langs === 1 ? 'Language' : 'Languages' });
  return out;
}
