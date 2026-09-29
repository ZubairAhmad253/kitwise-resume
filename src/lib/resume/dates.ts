import { AR_MONTHS, label } from './direction';
import type { DateFormat } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_NAMES = MONTHS;

/** "2024-03" → "Mar 2024" / "03/2024" / "2024"; "2024" stays "2024". */
export function formatDate(value: string, format: DateFormat, arabic = false): string {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  if (!m) return '';
  const [, year, month] = m;
  if (!month || format === 'YYYY') return year;
  return format === 'MM/YYYY' ? `${month}/${year}` : `${(arabic ? AR_MONTHS : MONTHS)[Number(month) - 1]} ${year}`;
}

/**
 * The date text for an entry: "Mar 2021 – Present", "2019 – 2023",
 * "Jun 2024" (single date), or '' when nothing is set. In Arabic: "مارس 2021 – حتى الآن".
 */
export function formatRange(start: string, end: string, current: boolean, format: DateFormat, single = false, arabic = false): string {
  const a = formatDate(start, format, arabic);
  if (single) return a;
  const b = current ? label(arabic, 'Present') : formatDate(end, format, arabic);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  return a || b;
}

/** Split a stored date into its parts for the month/year pickers. */
export function splitDate(value: string): { year: string; month: string } {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(value);
  return m ? { year: m[1], month: m[2] ?? '' } : { year: '', month: '' };
}

/** Join picker parts back into "YYYY-MM" or "YYYY" ('' without a valid year). */
export function joinDate(year: string, month: string): string {
  const y = year.trim();
  if (!/^\d{4}$/.test(y)) return '';
  return month ? `${y}-${month.padStart(2, '0')}` : y;
}
