/**
 * Turns the text of an existing CV (from a PDF, Word file or plain text)
 * into a Resume. Everything runs in the browser; nothing is uploaded.
 *
 * CVs have no standard layout, so this works by recognising the usual
 * signals: section headings ("Work experience", "Education"…), date
 * ranges, bullet points, and contact details anywhere near the top. It
 * gets most CVs mostly right; the review screen tells the user to check.
 */
import { newItem, newSection, emptyResume } from '../defaults';
import type { Item, Resume, Section, SectionKind } from '../types';

export interface SourceLine {
  text: string;
  /** Font size in points, when known (PDF). */
  size?: number;
  /** A visible gap (blank line, extra spacing) before this line. */
  gapBefore?: boolean;
  /** Marked as a heading by the source (Word heading styles). */
  heading?: boolean;
  /** A list item in the source (Word bullets). */
  bullet?: boolean;
  /** Wrapped continuation of the previous line (PDF layout). */
  continues?: boolean;
  /** Where the line's content starts, in points from the left (PDF). */
  x?: number;
  /** Space above the line compared with normal line spacing: 1 = a plain next line (PDF). */
  gapRatio?: number;
  /** The text was letter-spaced ("J A M E S"); set by parseCv. */
  spaced?: boolean;
}

export interface ImportReport {
  resume: Resume;
  /** What was found, for the review screen. */
  found: string[];
  /** Things the user should check. */
  warnings: string[];
}

/* ---------- text helpers ---------- */

const LIGATURES: Record<string, string> = { 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl', 'ﬅ': 'st', 'ﬆ': 'st' };
export const clean = (s: string) =>
  s
    .replace(/[ﬁﬂﬀﬃﬄﬅﬆ]/g, (c) => LIGATURES[c] ?? c)
    .replace(/[​-‍﻿­]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(SPACED_RE, (m) => (spacedRun(m) ? m.replace(/ /g, '') : m))
    .trim();

/**
 * Letter-spaced text as PDFs give it: "E X P E R I E N C E". Kerning can
 * keep a few letters together ("AW A R D S"), so a run may hold short
 * chunks as long as most of it is single letters.
 */
const SPACED_RE = /(?<![\p{L}\p{N}])(?:[\p{L}&]{1,3} ){3,}[\p{L}&]{1,3}(?![\p{L}\p{N}])/gu;
function spacedRun(m: string): boolean {
  const tokens = m.split(' ');
  const singles = tokens.filter((t) => t.length === 1).length;
  return singles >= 3 && singles >= tokens.length * 0.6;
}
const isSpacedOut = (s: string) => [...s.matchAll(SPACED_RE)].some((m) => spacedRun(m[0]));

const BULLET_RE = /^\s*(?:[•●○◦▪■□►▸‣∙·*\-–—✓✔➢➤❖◆◇→>»›+]|\(?\d{1,2}[.)])\s+/;
const isBulletText = (s: string) => BULLET_RE.test(s);
const stripBullet = (s: string) => s.replace(BULLET_RE, '').trim();

/* ---------- dates ---------- */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = '\\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';
const YEAR = '(?<!\\d)((?:19|20)\\d{2})(?!\\d)';
const ONE = `(?:${MONTH}\\s*,?\\s*${YEAR}|(?<!\\d)(\\d{1,2})\\s*[/.-]\\s*${YEAR}|${YEAR})`;
const NOW = '(present|current(?:ly)?|now|today|ongoing|till\\s+date|to\\s+date|date)';
const RANGE_RE = new RegExp(`${ONE}\\s*(?:-|–|—|to|until|till|through)\\s*(?:${ONE}|${NOW})`, 'i');
/** A piece of a date: "Sep 2020 –", "Oct 2015 – Aug", "2020", "Present". */
const FRAG_RE = new RegExp(`^(?:(?:${MONTH}\\s*)?(?:(?:19|20)\\d{2})?\\s*(?:[-–—]|to)?\\s*(?:${MONTH}\\s*)?(?:(?:19|20)\\d{2})?|${NOW})$`, 'i');
const SINGLE_RE = new RegExp(`(?:^|[\\s(,|])${ONE}(?=$|[\\s),|.])`, 'i');

/** One matched date → "YYYY-MM" or "YYYY". Groups: month name, year | month number, year | year. */
function toDate(g: (string | undefined)[]): string {
  const [mName, y1, mNum, y2, y3] = g;
  if (mName && y1) return `${y1}-${String(MONTHS.indexOf(mName.slice(0, 3).toLowerCase()) + 1).padStart(2, '0')}`;
  if (mNum && y2 && Number(mNum) >= 1 && Number(mNum) <= 12) return `${y2}-${mNum.padStart(2, '0')}`;
  return y2 || y3 || '';
}

export interface FoundDates {
  start: string;
  end: string;
  current: boolean;
  /** The matched text, so callers can remove it. */
  match: string;
}

export function findDates(text: string): FoundDates | null {
  const r = RANGE_RE.exec(text);
  if (r) {
    const start = toDate(r.slice(1, 6));
    const current = Boolean(r[11]);
    const end = current ? '' : toDate(r.slice(6, 11));
    return { start, end, current, match: r[0] };
  }
  const s = SINGLE_RE.exec(text);
  if (s) return { start: toDate(s.slice(1, 6)), end: '', current: false, match: s[0].trim() };
  return null;
}

/* ---------- section headings ---------- */

const HEADINGS: [SectionKind | 'summary' | 'contact' | 'skip', string[]][] = [
  ['summary', ['summary', 'profile', 'professional summary', 'career summary', 'personal profile', 'about me', 'about', 'objective', 'career objective', 'professional profile', 'executive summary', 'overview']],
  ['experience', ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'career history', 'relevant experience', 'clinical experience', 'teaching experience', 'academic appointments', 'appointments', 'positions', 'positions held', 'career', 'professional background', 'internships', 'internship']],
  ['education', ['education', 'academic background', 'education and training', 'education & training', 'academic qualifications', 'qualifications', 'educational background', 'academics', 'education history', 'training']],
  ['skills', ['skills', 'technical skills', 'key skills', 'core skills', 'core competencies', 'competencies', 'expertise', 'areas of expertise', 'skills and abilities', 'skills & abilities', 'tools', 'technologies', 'tech stack', 'software', 'computer skills', 'it skills', 'soft skills', 'strengths']],
  ['projects', ['projects', 'key projects', 'selected projects', 'personal projects', 'academic projects', 'selected work', 'portfolio', 'project experience']],
  ['certifications', ['certifications', 'certification', 'certificates', 'registration', 'licences', 'licenses', 'licence', 'license', 'licenses and certifications', 'licences and certifications', 'licenses & certifications', 'licences & certifications', 'certifications and licenses', 'certifications & licences', 'professional certifications', 'accreditations', 'registrations', 'licences & clearances', 'courses', 'courses and certifications', 'training and certifications']],
  ['languages', ['languages', 'language', 'language skills', 'languages spoken']],
  ['awards', ['awards', 'honors', 'honours', 'achievements', 'awards and honors', 'awards & honours', 'awards and achievements', 'grants', 'grants and awards', 'grants & awards', 'scholarships', 'recognition', 'accomplishments']],
  ['publications', ['publications', 'selected publications', 'research', 'papers', 'publications and presentations', 'research and publications', 'articles']],
  ['volunteering', ['volunteering', 'volunteer', 'volunteer experience', 'volunteer work', 'community service', 'community involvement', 'extracurricular activities', 'activities', 'leadership']],
  ['references', ['references', 'referees', 'reference']],
  ['contact', ['contact', 'contact details', 'contact information', 'personal details', 'personal information', 'details']],
  // Other common sections, kept under their own name.
  ['custom', ['teaching', 'teaching and mentoring', 'supervision', 'mentoring', 'invited talks', 'talks', 'presentations', 'conferences', 'conference presentations', 'service', 'professional service', 'memberships', 'professional memberships', 'affiliations', 'professional affiliations', 'interests', 'hobbies', 'hobbies and interests', 'additional information', 'other information', 'patents', 'exhibitions', 'clients', 'key achievements']],
  // A printed table of contents only repeats the section names.
  ['skip', ['contents', 'table of contents']],
];
const HEADING_INDEX = new Map(HEADINGS.flatMap(([kind, names]) => names.map((n) => [n, kind] as const)));
// Letter-spaced headings lose their word breaks ("CERTIFICATIONS&LICENCES"), so also match without spaces.
const HEADING_INDEX_TIGHT = new Map(HEADINGS.flatMap(([kind, names]) => names.map((n) => [n.replace(/ /g, ''), kind] as const)));
const lookupHeading = (t: string) => HEADING_INDEX.get(headingKey(t)) ?? HEADING_INDEX_TIGHT.get(headingKey(t).replace(/ /g, ''));
/** A leading label some designs put before headings: "A | EXPERIENCE", "01 Skills", "IV. Education". */
const HEADING_LABEL = /^\s*(?:[A-Za-z]|\d(?: ?\d)?|[IVX]{1,4})(?:[.)]\s*|\s*\|\s*|\s+)(?=\S)/;
const knownHeading = (t: string) => lookupHeading(t) ?? lookupHeading(t.replace(HEADING_LABEL, ''));

/** True when a piece of text reads as a section heading (used by the PDF reader to find where columns start). */
export const isHeadingText = (t: string) => {
  const c = clean(t);
  if (c.length > 45 || findDates(c)) return false;
  const letters = c.replace(/[^A-Za-z]/g, '');
  const caps = letters.length >= 4 && letters === letters.toUpperCase();
  return Boolean(knownHeading(c) || (caps && c.split(/\s+/).length <= 5 && !TITLE_WORDS.test(c) && keywordHeading(c)));
};

const headingKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/[:：]\s*$/, '')
    .replace(/[^a-z& ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * A known heading, or (once a known one has been seen) a short line that
 * stands out as a heading: a Word heading style, or capitals set larger
 * than the body text or after a gap. Capitalised job titles and employer
 * names inside a section don't qualify.
 */
function headingKind(line: SourceLine, bodySize: number, seenKnown: boolean): SectionKind | 'summary' | 'contact' | 'skip' | null {
  const t = line.text.trim();
  if (t.length > 45 || findDates(t)) return null;
  // Checked before bullets, so numbered headings ("1. Education") count.
  const known = knownHeading(t);
  if (known) return known;
  if (isBulletText(t) || /[@|]/.test(t)) return null;
  const words = t.split(/\s+/).length;
  const letters = t.replace(/[^A-Za-z]/g, '');
  const caps = letters.length >= 4 && letters === letters.toUpperCase();
  const standsOut = line.size && bodySize ? line.size >= bodySize * 1.08 : Boolean(line.gapBefore);
  // A heading-looking line built around a known word: "LICENCES & BOARD CERTIFICATION", "Work History & Internships".
  // Capitals or a Word heading style only, and never a job title ("PROJECT MANAGER").
  const keyword = words <= 5 && (line.heading || caps) && !TITLE_WORDS.test(t) ? keywordHeading(t) : null;
  if (keyword) return keyword;
  if (!seenKnown || /[\d,]/.test(t)) return null;
  if (line.heading && words <= 6) return 'custom';
  return caps && words <= 3 && standsOut ? 'custom' : null;
}

const KEYWORDS: [RegExp, SectionKind | 'summary'][] = [
  [/\bexperience\b|\bemployment\b|\bwork history\b|\bcareer history\b/i, 'experience'],
  [/\beducation\b|\bacademic background\b|\bqualifications?\b/i, 'education'],
  [/\bskills?\b|\bcompetenc/i, 'skills'],
  [/\bcertific|\blicen[cs]e|\baccreditation/i, 'certifications'],
  [/\blanguages?\b/i, 'languages'],
  [/\bawards?\b|\bhono(u)?rs\b|\bachievements?\b/i, 'awards'],
  [/\bpublications?\b/i, 'publications'],
  [/\bprojects?\b/i, 'projects'],
  [/\bvolunteer/i, 'volunteering'],
  [/\breferences?\b|\breferees\b/i, 'references'],
  [/\bsummary\b|\bprofile\b|\bobjective\b/i, 'summary'],
];
const keywordHeading = (t: string) => KEYWORDS.find(([re]) => re.test(t))?.[1] ?? null;

/* ---------- contact details ---------- */

const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/;
const PHONE_RE = /(?:\+|00)?\d[\d\s().-]{6,}\d/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/[^\s|,;]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s|,;]+/i;
const WEB_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|dev|io|me|net|org|design|app|co|info|site|xyz|tech|ai|page|studio|science|online|pro|blog|portfolio|qa|ae|sa|uk|in|pk|eu|de|fr|ca|au)(?:\/[^\s|,;]*)?/i;
const LOCATION_RE = /^[A-Z][A-Za-z.'’ -]{1,30},\s*[A-Z][A-Za-z.'’ -]{1,30}$/;
const NOT_A_PLACE = /universit|college|school|institut|academy|faculty|\bltd\b|\binc\b|\bllc\b|gmbh|group|company|corp|bank|hospital|clinic|centre|center|department|ministry|management|engineering|medicine|science|studies|technology|systems|services|solutions/i;

/** "Doha, Qatar", "Leeds, UK": a place, not "Engineer, Google" or "BSc Physics, University of Leeds". */
function isLocation(p: string): boolean {
  if (!LOCATION_RE.test(p) || p.length > 45) return false;
  if (p.split(',').some((side) => side.trim().split(/\s+/).length > 3)) return false;
  return !NOT_A_PLACE.test(p) && !TITLE_WORDS.test(p) && !DEGREE_WORDS.test(p);
}

const digitsIn = (s: string) => s.replace(/\D/g, '').length;
const trimUrl = (s: string) => s.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/[.)]+$/, '');

/** Pieces of a header line separated by | • · or wide gaps. */
const pieces = (s: string) =>
  s
    .split(/\s*(?:\||•|·|◆|⋅|•|\s{2,}|\t|(?<=\S)\s[-–—]\s(?=\S))\s*/)
    .map((p) => p.replace(/^(?:email|e-mail|phone|mobile|tel|cell|linkedin|github|website|web|portfolio|address|location)\s*[:：]\s*/i, '').trim())
    .filter(Boolean);

interface Contact {
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  location: string;
}

function takeContacts(lines: string[], c: Contact): string[] {
  const rest: string[] = [];
  for (const line of lines) {
    let left = line;
    const grab = (re: RegExp, key: keyof Contact, fix: (m: string) => string = (m) => m) => {
      const m = re.exec(left);
      if (!m) return;
      if (!c[key]) c[key] = fix(m[0]);
      left = left.replace(m[0], ' ');
    };
    grab(EMAIL_RE, 'email');
    grab(LINKEDIN_RE, 'linkedin', trimUrl);
    grab(GITHUB_RE, 'github', trimUrl);
    const phone = PHONE_RE.exec(left);
    if (phone && digitsIn(phone[0]) >= 8 && digitsIn(phone[0]) <= 15 && !findDates(phone[0])) {
      if (!c.phone) c.phone = phone[0].trim();
      left = left.replace(phone[0], ' ');
    }
    const web = WEB_RE.exec(left);
    if (web && !/@/.test(web[0])) {
      if (!c.website) c.website = trimUrl(web[0]);
      left = left.replace(web[0], ' ');
    }
    const remaining = pieces(left).filter((p) => {
      if (!c.location && isLocation(p)) {
        c.location = p;
        return false;
      }
      return !/^(?:email|phone|mobile|linkedin|github|website|address)$/i.test(p);
    });
    const text = remaining.join(' · ').trim();
    if (text) rest.push(text);
  }
  return rest;
}

const NAME_RE = /^[\p{L}][\p{L}.'’-]*(?:\s+[\p{L}][\p{L}.'’-]*){1,4}$/u;
const looksLikeName = (s: string) => NAME_RE.test(s) && s.length <= 42 && !knownHeading(s);

/* ---------- entries ---------- */

const TITLE_WORDS = /\b(engineer|developer|manager|designer|analyst|intern|director|lead|consultant|specialist|officer|assistant|coordinator|head|teacher|lecturer|professor|nurse|physician|doctor|surgeon|driver|technician|architect|scientist|accountant|executive|associate|supervisor|administrator|representative|agent|advisor|adviser|operator|pilot|researcher|fellow|resident|chef|clerk|cashier|editor|writer|president|founder|owner|partner|programmer|tester|trainee|apprentice|volunteer|tutor|instructor|mechanic|electrician|foreman|inspector|planner|buyer|controller|strategist|marketer|recruiter|counsellor|counselor|therapist|pharmacist|dentist|paramedic|secretary|receptionist|captain|officer)s?\b/i;
const DEGREE_WORDS = /\b(bsc|b\.sc|ba|b\.a|bs|b\.s|beng|b\.eng|btech|b\.tech|msc|m\.sc|ma|m\.a|ms|meng|mtech|mba|phd|ph\.d|doctorate|bachelor|master|masters|diploma|degree|certificate|high school|secondary|a-levels|a levels|o-levels|gcse|igcse|mbbs|md|llb|llm|jd|associate|foundation|residency|fellowship|hsc|ssc|matric|intermediate|fsc)\b/i;

interface RawEntry {
  header: string[];
  bullets: string[];
  paras: string[];
  hasDate: boolean;
  /** Font size of the entry's first line (PDF), to tell smaller description text apart. */
  size?: number;
}

/**
 * In PDFs, entries in a section are set apart by more space than the
 * lines inside an entry. Find that break: the biggest jump in the line
 * spacing ratios. Infinity when spacing is uniform (one entry) or unknown.
 */
function gapThreshold(lines: SourceLine[]): number {
  const r = [...new Set(lines.map((l) => l.gapRatio).filter((x): x is number => x !== undefined && x > 0))].sort((a, b) => a - b);
  let best = 0;
  let at = Infinity;
  for (let i = 1; i < r.length; i++) {
    const jump = r[i] - r[i - 1];
    if (jump > best) {
      best = jump;
      at = (r[i] + r[i - 1]) / 2;
    }
  }
  return best >= 0.2 ? at : Infinity;
}

function groupEntries(lines: SourceLine[]): RawEntry[] {
  const threshold = gapThreshold(lines);
  const bySpacing = Number.isFinite(threshold);
  const bigGap = (l: SourceLine) => Boolean(l.gapBefore || (l.gapRatio !== undefined && l.gapRatio > threshold));
  const out: RawEntry[] = [];
  let cur: RawEntry | null = null;
  let lastWasBullet = false;
  let headerX: number | undefined;
  for (const line of lines) {
    const t = line.text;
    // Wrapped lines join whatever they continue: a bullet, a paragraph or a header line.
    if (cur && line.continues) {
      if (cur.bullets.length && lastWasBullet) cur.bullets[cur.bullets.length - 1] += ` ${t}`;
      else if (cur.paras.length) cur.paras[cur.paras.length - 1] += ` ${t}`;
      else if (cur.header.length) cur.header[cur.header.length - 1] += ` ${t}`;
      continue;
    }
    // In PDFs without bullet characters, lines indented past the entry's header are its bullets.
    const indented = line.x !== undefined && headerX !== undefined && line.x > headerX + (line.size ?? 10) * 0.6 && !findDates(t);
    const bullet = line.bullet || isBulletText(t) || Boolean(cur && cur.header.length && indented);
    if (bullet) {
      if (!cur) out.push((cur = { header: [], bullets: [], paras: [], hasDate: false }));
      cur.bullets.push(stripBullet(t));
      lastWasBullet = true;
      continue;
    }
    // A wrapped bullet line: indented continuation, or starts in lower case.
    if (cur && lastWasBullet && (line.continues || /^[a-z(,&]/.test(t)) && !findDates(t)) {
      cur.bullets[cur.bullets.length - 1] += ` ${t}`;
      continue;
    }
    lastWasBullet = false;
    // A date range, or a year on a short line: a year inside a sentence ("…in 2024. 5,200 sign-ups") doesn't count.
    const found = findDates(t);
    const dated = Boolean(found && (found.end || found.current || t.length < 50 || t.includes(' | ')));
    // Sentences are description: "New identity across 9 properties."
    if (cur && cur.header.length > 0 && !dated && /[.!?]$/.test(t) && t.split(/\s+/).length >= 4) {
      cur.paras.push(t);
      continue;
    }
    // Long undated lines are description text, not entry headers: over 75 characters, over 60
    // once there are two header lines, or 40+ characters set smaller than the entry's title.
    const smaller = Boolean(cur?.size && line.size && line.size < cur.size - 0.3);
    const long = cur && cur.header.length > 0 && !dated && (t.length > 75 || (cur.header.length >= 2 && t.length > 60) || (smaller && t.length >= 40));
    if (cur && long) {
      if (cur.paras.length && !line.gapBefore) cur.paras[cur.paras.length - 1] += ` ${t}`;
      else cur.paras.push(t);
      continue;
    }
    // With spacing to go by, only a bigger gap (or a second date) starts the next entry;
    // other lines after the description are more description.
    if (bySpacing && cur && (cur.bullets.length || cur.paras.length) && !bigGap(line) && !dated) {
      cur.paras.push(t);
      continue;
    }
    // An entry that so far is only its title line takes the next undated line too, even after a gap
    // (a title strip above a body, as in project sheets).
    const onlyTitle = Boolean(cur && cur.header.length === 1 && !cur.bullets.length && !cur.paras.length && !dated);
    const startNew = onlyTitle
      ? false
      : bySpacing
        ? !cur || bigGap(line) || (dated && cur.hasDate)
        : !cur || cur.bullets.length > 0 || cur.paras.length > 0 || (dated && cur.hasDate) || (line.gapBefore && cur.header.length > 0) || cur.header.length >= 3;
    if (startNew) {
      out.push((cur = { header: [], bullets: [], paras: [], hasDate: false, size: line.size }));
      headerX = line.x;
    }
    cur!.header.push(t);
    if (dated) cur!.hasDate = true;
  }
  // An entry with no header of its own continues the one before it (a page break mid-entry).
  return out.reduce<RawEntry[]>((acc, e) => {
    const prev = acc[acc.length - 1];
    if (prev && e.header.length === 0) {
      prev.bullets.push(...e.bullets);
      prev.paras.push(...e.paras);
    } else acc.push(e);
    return acc;
  }, []);
}

const SPLIT_RE = /\s*(?:\||•|·|◆|\s[-–—]\s|\t|\sat\s(?=\p{Lu}))\s*/u;

/** "Engineer, Google" → two parts; "Google, Doha, Qatar" → the employer and "Doha, Qatar". */
function splitCommas(parts: string[]): string[] {
  let out = parts;
  if (out.length === 1 && out[0].includes(', ') && !isLocation(out[0])) {
    const [a, ...b] = out[0].split(', ');
    out = [a, b.join(', ')];
  }
  return out.flatMap((p, i) => {
    if (i === 0 || isLocation(p)) return [p];
    const at = p.indexOf(', ');
    return at > 0 && isLocation(p.slice(at + 2)) ? [p.slice(0, at), p.slice(at + 2)] : [p];
  });
}

function entryToItem(e: RawEntry, kind: SectionKind): Item {
  const it = newItem();
  let header = e.header;
  // Prefer a piece that is only a date ("2022 | Hypoxia in the Gulf, 2015–2021" is dated 2022).
  const pure = header.flatMap((h) => h.split(' | ')).find((s) => {
    const m = findDates(s);
    return m && s.replace(m.match, '').replace(/[\s()–—-]/g, '').length === 0;
  });
  let d = findDates(pure ?? header.join(' | '));
  // A date range wrapped inside a narrow date column arrives in pieces ("Sep 2020 –" … "Present").
  if (!d || !(d.end || d.current)) {
    const segs = header.flatMap((h) => h.split(' | '));
    const frags = segs.filter((s) => FRAG_RE.test(s.trim()) && /\d|present|current|now/i.test(s));
    const joined = frags.length >= 2 ? findDates(frags.join(' ')) : null;
    if (joined && (joined.end || joined.current)) {
      d = joined;
      header = [segs.filter((s) => !frags.includes(s)).join(' | ')];
    }
  }
  if (d) {
    it.start = d.start;
    it.end = d.end;
    it.current = d.current;
  }
  let parts = header
    .map((h) => (d ? h.replace(d.match, ' ').replace(/\(\s*\)/g, ' ') : h))
    .flatMap((h) => h.split(SPLIT_RE))
    .map((p) =>
      p
        .replace(/^[,;:\s]+|[,;:\s]+$/g, '')
        .replace(/^\)+|\(+$/g, '')
        .replace(/\(\s*\)/g, '')
        // A bracket left open by a split ("Engineer (PE" … ")") is closed again.
        .replace(/^([^()]*\([^()]*)$/, '$1)')
        .replace(/^([^()]*)\)$/, (m, a) => (a.includes('(') ? m : a))
        // Field captions some layouts print in front of values.
        .replace(/^(?:ROLE|SITE|CLIENT|LOCATION|COMPANY|EMPLOYER|POSITION|TITLE|DATES?)\s+(?=\S)/, '')
        .trim(),
    )
    .filter((p) => p && !/^(?:from|to|since)$/i.test(p));
  parts = splitCommas(parts);
  // Pull out a "City, Country" or "Remote" part.
  const locIdx = parts.findIndex((p, i) => i > 0 && (isLocation(p) || /^(remote|hybrid|on-?site)$/i.test(p)));
  if (locIdx > 0) {
    it.location = parts[locIdx];
    parts = parts.filter((_, i) => i !== locIdx);
  }
  // Titles and degrees usually come first; swap when the employer or school was listed first.
  const typed = kind === 'education' ? DEGREE_WORDS : kind === 'experience' || kind === 'volunteering' ? TITLE_WORDS : null;
  if (typed && parts.length >= 2 && !typed.test(parts[0]) && typed.test(parts[1])) [parts[0], parts[1]] = [parts[1], parts[0]];
  it.title = parts[0] ?? '';
  it.subtitle = parts[1] ?? '';
  const extra = parts.slice(2);
  const desc: string[] = [];
  if (extra.length) desc.push(extra.join(' · '));
  desc.push(...e.paras);
  if (e.bullets.length) desc.push(e.bullets.map((b) => `- ${b}`).join('\n'));
  it.description = desc.join('\n\n').trim();
  return it;
}

/* ---------- list-like sections ---------- */

const LEVELS: [RegExp, number][] = [
  [/native|mother tongue|first language|bilingual|c2/i, 5],
  [/fluent|proficient|full professional|c1/i, 5],
  [/advanced|professional working|very good|b2/i, 4],
  [/intermediate|good|conversational|working|b1/i, 3],
  [/basic|elementary|limited|a2/i, 2],
  [/beginner|a1/i, 1],
];

/**
 * Cards laid out side by side come out of a PDF as a row of labels and a
 * row of values ("ENGLISH | ARABIC" then "Fluent | Native"). Pair them up
 * as "ENGLISH: Fluent", "ARABIC: Native".
 */
function zipLabelRows(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const labels = lines[i].split(' | ');
    const values = lines[i + 1]?.split(' | ');
    const isLabelRow = labels.length >= 2 && labels.every((l) => l.split(/\s+/).length <= 3 && l === l.toUpperCase() && /\p{L}/u.test(l));
    if (isLabelRow && values && values.length === labels.length) {
      labels.forEach((l, j) => out.push(`${titleCase(l.trim())}: ${values[j].trim()}`));
      i++;
    } else out.push(lines[i]);
  }
  return out;
}

const levelOf = (s: string) => LEVELS.find(([re]) => re.test(s))?.[1] ?? 0;
const LEVEL_ONLY = /^(?:native|mother tongue|first language|bilingual|fluent|proficient|advanced|intermediate|good|very good|conversational|working|professional|basic|elementary|limited|beginner|[abc][12])(?:\s+\w+)?$/i;

function languageItems(lines: string[]): Item[] {
  const out: Item[] = [];
  const pieces = lines
    .flatMap((l) => l.split(/\s*[,;|•·]\s*(?![^()]*\))/))
    .map((p) => p.trim())
    .filter(Boolean);
  for (const p of pieces) {
    // A level on its own line ("Fluent") belongs to the language above it.
    const last = out[out.length - 1];
    if (last && !last.subtitle && LEVEL_ONLY.test(p)) {
      last.subtitle = p.replace(/^\w/, (c) => c.toUpperCase());
      last.level = levelOf(p);
      continue;
    }
    const m = /^([\p{L} ]+?)\s*(?:[(:–—-]\s*([^)]+)\)?)?$/u.exec(p);
    const it = newItem({ title: titleCase((m?.[1] ?? p).trim()) });
    const lvl = (m?.[2] ?? '').trim();
    if (lvl) {
      it.subtitle = lvl.replace(/^\w/, (c) => c.toUpperCase());
      it.level = levelOf(lvl);
    }
    if (it.title.length <= 30) out.push(it);
  }
  return out;
}

function skillItems(lines: string[], fallbackTitle: string): Item[] {
  const groups: Item[] = [];
  const loose: string[] = [];
  // Commas, semicolons, bars, dots, and " / " with spaces (so "CI/CD" stays one skill).
  const split = (s: string) =>
    s
      .split(/\s*[,;|•·]\s*|\s+\/\s+|\s*\/\s*$/)
      .map((x) => x.trim())
      .filter(Boolean);
  const tidy = (raw: string) => raw.replace(/^\$\s*(?:ls\s+)?/, '');
  let current: Item | null = null;
  lines.forEach((raw, i) => {
    const l = tidy(raw);
    // Label lines name the group below them: "Tools:", terminal-style "$ ls languages/",
    // or a short line on its own followed by a list ("Frontend" then "React | TypeScript").
    const label = /^([^,;|:/]{2,40})[:/]$/.exec(l)?.[1] ?? (split(l).length === 1 && l.split(/\s+/).length <= 3 && split(tidy(lines[i + 1] ?? '')).length >= 2 ? l : null);
    if (label) {
      current = newItem({ title: label.trim() });
      groups.push(current);
      return;
    }
    // "Label: a, b, c" or, from PDFs, "Label | a, b, c" (but "React | TypeScript" is just two skills).
    const colonMatch = /^([^:|,]{2,40}?)\s*(:|\s\|\s)\s*(.+)$/.exec(l);
    const colon = colonMatch && (colonMatch[2] === ':' || /,/.test(colonMatch[3]) || colonMatch[3].split(/\s+/).length >= 3) ? [colonMatch[0], colonMatch[1], colonMatch[3]] : null;
    if (colon) {
      groups.push(newItem({ title: colon[1].trim(), tags: split(colon[2]) }));
      current = null;
    } else if (current) current.tags.push(...split(l));
    else loose.push(...split(l));
  });
  // A label with nothing under it was really a skill of its own.
  for (const g of groups.filter((g) => g.tags.length === 0)) loose.unshift(g.title);
  groups.splice(0, groups.length, ...groups.filter((g) => g.tags.length > 0));
  if (loose.length) groups.push(newItem({ title: groups.length ? 'Other' : fallbackTitle, tags: [...new Set(loose)].slice(0, 40) }));
  return groups;
}

/**
 * Certificates, awards and the like: one item per line in text and Word
 * files. In PDFs, lines set close together (issuer and date under a
 * title) belong to one item, and extra space starts the next.
 */
function listItems(lines: SourceLine[], kind: SectionKind): Item[] {
  const groups: string[][] = [];
  const threshold = Math.min(gapThreshold(lines), 1.6);
  for (const l of lines) {
    const t = stripBullet(l.text);
    const last = groups[groups.length - 1];
    if (last && l.continues) last[last.length - 1] += ` ${t}`;
    else if (last && l.gapRatio !== undefined && l.gapRatio <= threshold && !l.gapBefore && !isBulletText(l.text)) last.push(t);
    else groups.push([t]);
  }
  return groups.map((header) => entryToItem({ header, bullets: [], paras: [], hasDate: false }, kind));
}

/* ---------- main ---------- */

interface RawSection {
  kind: SectionKind | 'summary' | 'contact' | 'skip';
  title: string;
  lines: SourceLine[];
}

const titleCase = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()) : s);

/** A heading as a section title: decorations like "#", "//" or "</>" removed, capitals softened. */
function sectionTitle(t: string): string {
  const bare = (lookupHeading(t) ? t : t.replace(HEADING_LABEL, ''))
    .replace(/^[^\p{L}]+|[^\p{L})]+$/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Letter-spaced headings lose their spaces; use the dictionary wording instead.
  if (!bare.includes(' ') && bare.length > 12) {
    const tight = bare.toLowerCase().replace(/[^a-z&]/g, '');
    const phrase = HEADINGS.flatMap(([, names]) => names).find((n) => n.replace(/ /g, '') === tight);
    if (phrase) return phrase.replace(/^\w/, (c) => c.toUpperCase());
  }
  const out = titleCase(bare);
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** "JAMESWHITFIELD" (letter-spaced, spaces lost) → "James Whitfield", using the email or LinkedIn address. */
function restoreSpacedName(name: string, c: { email: string; linkedin: string }): string {
  const letters = name.replace(/[^\p{L}]/gu, '').toLowerCase();
  const sources = [c.email.split('@')[0] ?? '', c.linkedin.split('/').pop() ?? ''];
  for (const src of sources) {
    const words = src.split(/[._-]+/).filter(Boolean);
    if (words.length >= 2 && words.join('').toLowerCase() === letters) return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return name;
}

/**
 * Tidies raw lines: joins wrapped lines back together (re-joining words
 * split with a hyphen), and splits rows that carry a heading and its
 * content side by side ("PROFILE | Backend engineer with…").
 */
function prepare(input: SourceLine[]): SourceLine[] {
  const out: SourceLine[] = [];
  for (const raw of input) {
    const l: SourceLine = { ...raw, spaced: isSpacedOut(raw.text), text: clean(raw.text) };
    if (!l.text || /^(?:page\s*)?\d{1,2}(?:\s*(?:of|\/)\s*\d{1,2})?$/i.test(l.text) || /^(?:curriculumvitae|resume|résumé|cv)$/i.test(l.text.replace(/\s/g, ''))) continue;
    const prev = out[out.length - 1];
    if (prev && l.continues) {
      prev.text = /\p{L}-$/u.test(prev.text) ? prev.text + l.text : `${prev.text} ${l.text}`;
      continue;
    }
    const bar = l.text.indexOf(' | ');
    const after = l.text.slice(bar + 3);
    // Only when real content follows, not a row of labels ("LANGUAGES | PLATFORMS | PRACTICES").
    if (bar > 0 && bar <= 40 && knownHeading(l.text.slice(0, bar)) && after.length >= 25 && /\p{Ll}/u.test(after)) {
      out.push({ ...l, text: l.text.slice(0, bar) });
      out.push({ ...l, text: l.text.slice(bar + 3), gapBefore: false, x: undefined });
      continue;
    }
    out.push(l);
  }
  return out;
}

/** The part of a header line that could be the name: "Dr Sara Al-Mansoori | REGISTRATION" → the first piece. */
const namePart = (l: SourceLine) => l.text.split(' | ')[0].trim();

export function parseCv(input: SourceLine[]): ImportReport {
  const lines = prepare(input);

  // Split into the header (before the first heading) and sections.
  const header: SourceLine[] = [];
  const sections: RawSection[] = [];
  const sizes = lines
    .map((l) => l.size ?? 0)
    .filter((s) => s > 0)
    .sort((a, b) => a - b);
  const bodySize = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 0;
  let seenKnown = false;
  for (const line of lines) {
    let kind = headingKind(line, bodySize, seenKnown);
    const current = sections[sections.length - 1];
    // Inside a printed contents list, numbered section names are just entries of the list.
    if (kind && current?.kind === 'skip' && /^\d/.test(line.text)) kind = null;
    // "Tools" or "Software" inside a Skills section is a group label, not a new section.
    if (kind === 'skills' && current?.kind === 'skills' && current.lines.length > 0) kind = null;
    if (kind && (sections.length > 0 || header.length > 0)) {
      if (kind !== 'custom') seenKnown = true;
      sections.push({ kind, title: sectionTitle(line.text), lines: [] });
      continue;
    }
    if (sections.length) sections[sections.length - 1].lines.push(line);
    else header.push(line);
  }

  const r = emptyResume();
  const found: string[] = [];
  const warnings: string[] = [];
  const contact: Contact = { email: '', phone: '', linkedin: '', github: '', website: '', location: '' };

  // Name: the biggest name-like line near the top (or the first one when sizes are unknown).
  const top = header.slice(0, 8);
  const candidates = top.filter((l) => (looksLikeName(namePart(l)) || (l.spaced && /^\p{L}{3,40}$/u.test(namePart(l)))) && !EMAIL_RE.test(namePart(l)));
  const biggest = candidates.reduce<SourceLine | null>((best, l) => (!best || (l.size ?? 0) > (best.size ?? 0) ? l : best), null);
  const nameLine = biggest && (biggest.size ?? 0) > 0 ? biggest : candidates[0];
  if (nameLine) r.basics.name = namePart(nameLine).replace(/\s+/g, ' ');

  // Contact details can be in the header or in a "Contact" section (sidebars).
  const contactSections = sections.filter((s) => s.kind === 'contact');
  const headerTexts = header.map((l) => (l === nameLine ? l.text.split(' | ').slice(1).join(' | ') : l.text)).filter(Boolean);
  const headerRest = takeContacts(headerTexts, contact)
    // Drop decorations ("// ", "~$ ") and stray single lower-case words like a terminal prompt.
    .map((t) => t.replace(/^[^\p{L}\p{N}(]+/u, '').trim())
    .filter((t) => t && !/^\p{Ll}+$/u.test(t));
  for (const s of contactSections) takeContacts(s.lines.map((l) => l.text), contact);
  // Contact details sometimes sit at the very end, or inside other sections.
  if (!contact.email || !contact.phone) {
    const probe: Contact = { ...contact };
    takeContacts(lines.map((l) => l.text), probe);
    contact.email ||= probe.email;
    contact.phone ||= probe.phone;
    contact.linkedin ||= probe.linkedin;
    contact.github ||= probe.github;
  }
  Object.assign(r.basics, contact);
  if (nameLine?.spaced) r.basics.name = restoreSpacedName(r.basics.name, contact);

  // Headline: the first short line after the name that isn't a contact line. Field labels
  // ("NAME") and single capitalised words (a badge caption) are passed over when possible.
  const shortLines = headerRest.filter((t) => t.length <= 90 && !looksLikeParagraph(t) && !/^(?:name|full name|contact|profile|summary|email|phone|address)$/i.test(t));
  const headline = shortLines.find((t) => !/^\p{Lu}+$/u.test(t)) ?? shortLines[0];
  if (headline) r.basics.headline = headline;
  const headerParas = headerRest.filter((t) => t !== headline && looksLikeParagraph(t));

  const out: Section[] = [];
  for (const s of sections) {
    if (s.kind === 'contact' || s.kind === 'skip') continue;
    const texts = s.lines.map((l) => (l.bullet ? `- ${l.text}` : l.text));
    if (s.kind === 'summary') {
      r.basics.summary = joinParagraphs(s.lines);
      continue;
    }
    if (s.kind === 'references' && /available\s+(?:up)?on\s+request/i.test(texts.join(' '))) continue;
    const kind = s.kind;
    const sec = newSection(kind);
    sec.title = s.title;
    const plain = s.lines.map((l) => stripBullet(l.text)).filter(Boolean);
    if (kind === 'skills') sec.items = skillItems(zipLabelRows(plain), s.title);
    else if (kind === 'languages') sec.items = languageItems(zipLabelRows(plain));
    else if (kind === 'certifications' || kind === 'awards' || kind === 'publications' || kind === 'references') {
      // One line per item unless the section is laid out like entries (bullets under headers).
      const looksLikeEntries = s.lines.some((l) => l.bullet || isBulletText(l.text)) && s.lines.some((l) => !(l.bullet || isBulletText(l.text)));
      sec.items = looksLikeEntries ? groupEntries(s.lines).map((e) => entryToItem(e, kind)) : listItems(s.lines, kind);
    } else sec.items = groupEntries(s.lines).map((e) => entryToItem(e, kind));
    sec.items = sec.items.filter((it) => it.title || it.description || it.tags.length);
    if (sec.items.length) out.push(sec);
  }

  if (!r.basics.summary && headerParas.length) r.basics.summary = headerParas.join(' ');

  // Nothing recognisable: keep the text so nothing is lost.
  if (out.length === 0) {
    const body = lines.filter((l) => l !== nameLine && !header.includes(l)).map((l) => l.text);
    const text = (body.length ? body : headerRest).join('\n');
    if (text.trim()) {
      const sec = newSection('custom');
      sec.title = 'Imported text';
      sec.items = [newItem({ title: 'From your file', description: text })];
      out.push(sec);
      warnings.push('We could not find the usual section headings, so the text is in one "Imported text" section. Move the parts you need into proper sections.');
    }
  }

  r.sections = out;
  r.name = r.basics.name ? `${r.basics.name} (imported)` : 'Imported resume';

  if (r.basics.name) found.push(`Name: ${r.basics.name}`);
  else warnings.push('No name found. Add it under Personal details.');
  const contacts = (['email', 'phone', 'location', 'linkedin', 'github', 'website'] as const).filter((k) => r.basics[k]);
  if (contacts.length) found.push(`Contact: ${contacts.join(', ')}`);
  else warnings.push('No email or phone found.');
  if (r.basics.summary) found.push('Summary');
  for (const s of out) found.push(`${s.title}: ${s.items.length} ${s.items.length === 1 ? 'entry' : 'entries'}`);
  if (lines.some((l) => l.spaced && (l.text === r.basics.headline || l.text === r.basics.name) && !/\s/.test(l.text.trim())))
    warnings.push('Your name or job title used wide letter spacing, so spaces between words may be missing. Check them under Personal details.');
  const undated = out.filter((s) => (s.kind === 'experience' || s.kind === 'education') && s.items.some((i) => !i.start)).map((s) => s.title);
  if (undated.length) warnings.push(`Some entries in ${undated.join(' and ')} have no dates. Check them.`);

  return { resume: r, found, warnings };
}

function looksLikeParagraph(t: string) {
  return t.length > 90 || (t.split(/\s+/).length > 12 && /[.,]/.test(t));
}

/** Summary lines back into paragraphs and bullets. */
function joinParagraphs(lines: SourceLine[]): string {
  const out: string[] = [];
  for (const l of lines) {
    const bullet = l.bullet || isBulletText(l.text);
    if (bullet) out.push(`- ${stripBullet(l.text)}`);
    else if (out.length && !l.gapBefore && !out[out.length - 1].startsWith('- ')) out[out.length - 1] += ` ${l.text}`;
    else out.push(l.text);
  }
  return out.join('\n');
}

/** Plain text (a .txt file or pasted text) as source lines. */
export function linesFromText(text: string): SourceLine[] {
  const out: SourceLine[] = [];
  let gap = false;
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (!raw.trim()) {
      gap = true;
      continue;
    }
    out.push({ text: raw, gapBefore: gap });
    gap = false;
  }
  return out;
}
