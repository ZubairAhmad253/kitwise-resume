/**
 * Rebuilds lines of text from a PDF's positioned text pieces: reads
 * two-column layouts one column at a time, keeps wide gaps as " | "
 * separators (a date pushed to the right edge), undoes letter-spacing,
 * and marks gaps, font sizes, indents and wrapped lines for parseCv.
 * Works with pdf.js in the browser and in Node (for tests).
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { findDates, isHeadingText, type SourceLine } from './parse';

interface Glyph {
  str: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Symbol-font bullets and icon glyphs from the Private Use Area. */
const fixGlyphs = (s: string) => s.replace(/^\s*[-]+\s*/, '• ').replace(/[-]/g, ' ');

export async function pdfDocLines(doc: PDFDocumentProxy, maxPages = 10): Promise<{ lines: SourceLine[]; chars: number }> {
  // Main text from every page first, sidebars after: a main column that runs onto
  // page 2 must not be cut in two by page 1's sidebar.
  const main: SourceLine[] = [];
  const sides: SourceLine[] = [];
  let chars = 0;
  for (let p = 1; p <= Math.min(doc.numPages, maxPages); p++) {
    const page = await doc.getPage(p);
    const vp = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const glyphs: Glyph[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const [a, b, , , e, f] = item.transform as number[];
      const h = item.height || Math.hypot(a, b) || 10;
      glyphs.push({ str: item.str, x: e, y: vp.height - f, w: item.width, h });
      chars += item.str.trim().length;
    }
    // A box beside the name (a registration badge, a QR caption) is read on its own, after the rest.
    const badge = p === 1 ? splitHeaderBox(glyphs, vp.width) : null;
    if (badge) {
      main.push(...toLines(badge.header, true));
      sides.push(...toLines(badge.box, false));
    }
    const { full, columns } = splitColumns(badge ? badge.body : glyphs, vp.width);
    // The main column: the one with the biggest text (name or main headings), then the most text.
    const biggest = (gs: Glyph[]) => Math.max(0, ...gs.map((g) => g.h));
    const size = (gs: Glyph[]) => gs.reduce((n, g) => n + g.str.length, 0);
    columns.sort((a, b) => biggest(b) - biggest(a) || size(b) - size(a));
    const [first, second] = columns;
    if (full.length) main.push(...toLines(full, main.length === 0));
    if (first?.length) main.push(...toLines(first, main.length === 0));
    if (second?.length) sides.push(...toLines(second, false));
  }
  return { lines: [...main, ...sides], chars };
}

/**
 * Two-column CVs (a sidebar next to the main text) must be read one
 * column at a time. Look for a vertical band that almost no text crosses,
 * with plenty of text on both sides. The few rows that do cross it (a
 * name band across the top) are read first, as full-width rows.
 */
function splitColumns(glyphs: Glyph[], width: number): { full: Glyph[]; columns: Glyph[][] } {
  const none = { full: [], columns: [glyphs] };
  if (glyphs.length < 20) return none;
  const allowed = Math.max(3, glyphs.length * 0.06);
  let best: { x: number; run: number } | null = null;
  let runStart = -1;
  for (let x = width * 0.18; x <= width * 0.75; x += 2) {
    const crossing = glyphs.filter((g) => g.x < x - 1 && g.x + g.w > x + 1).length;
    if (crossing <= allowed) {
      if (runStart < 0) runStart = x;
      const run = x - runStart;
      if (!best || run > best.run) best = { x: runStart + run / 2, run };
    } else runStart = -1;
  }
  if (!best || best.run < 6) return none;
  const cut = best.x;
  // Rows with anything crossing the cut are full-width rows, and so is everything above
  // the first section heading (a name band whose contact line happens to leave a gap).
  const crossRows = new Set(glyphs.filter((g) => g.x < cut - 1 && g.x + g.w > cut + 1).map((g) => Math.round(g.y)));
  const inCrossRow = (g: Glyph) => [...crossRows].some((y) => Math.abs(y - g.y) < Math.max(2, g.h * 0.5));
  const headingY = firstHeadingY(glyphs);
  const isFull = (g: Glyph) => g.y < headingY - 1 || inCrossRow(g);
  const full = glyphs.filter(isFull);
  const rest = glyphs.filter((g) => !isFull(g));
  const left = rest.filter((g) => g.x < cut);
  const right = rest.filter((g) => g.x >= cut);
  const share = Math.min(left.length, right.length) / glyphs.length;
  // Each side needs real content spread down the page, not just a column of dates.
  const spread = (gs: Glyph[]) => new Set(gs.map((g) => Math.round(g.y / 20))).size;
  const avgLen = (gs: Glyph[]) => gs.reduce((n, g) => n + g.str.length, 0) / Math.max(1, gs.length);
  if (share < 0.12 || spread(left) < 8 || spread(right) < 8 || Math.min(avgLen(left), avgLen(right)) < 3) return none;
  // Dates and places pushed to the right edge of a one-column CV are not a second column.
  const dateShare = (gs: Glyph[]) => gs.filter((g) => findDates(g.str) || /^[A-Z][\w .'-]+, [A-Z][\w .'-]+$/.test(g.str.trim())).length / Math.max(1, gs.length);
  const chars = (gs: Glyph[]) => gs.reduce((n, g) => n + g.str.length, 0);
  if (dateShare(chars(left) < chars(right) ? left : right) > 0.35) return none;
  // Rows crossing the cut must sit above the columns; if they are scattered down the page it's one column.
  const colTop = Math.min(...rest.map((g) => g.y));
  if (glyphs.some((g) => inCrossRow(g) && g.y > colTop + 4)) return none;
  return { full, columns: [left, right] };
}

/**
 * The top of the first row that reads as a section heading. Rows, not
 * single pieces: small-caps headings arrive as "L" + "ICENCES".
 */
function firstHeadingY(glyphs: Glyph[]): number {
  const rows: Glyph[][] = [];
  for (const g of [...glyphs].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - g.y) < Math.max(2, Math.min(row[0].h, g.h) * 0.5)) row.push(g);
    else rows.push([g]);
  }
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    // A heading may share its row with other text across a wide gap; check each piece of the row.
    if (joinRow(row).text.split(' | ').some((part) => isHeadingText(part))) return Math.min(...row.map((g) => g.y));
  }
  return Infinity;
}

/**
 * Above the first section heading, a separate box on the right of the
 * name (with no contact details in it) is read after everything else, so
 * it doesn't get mixed into the name and job title.
 */
function splitHeaderBox(glyphs: Glyph[], width: number): { header: Glyph[]; box: Glyph[]; body: Glyph[] } | null {
  // The first heading on the left: the box itself may carry a caption that reads like one.
  const headingY = firstHeadingY(glyphs.filter((g) => g.x < width * 0.45));
  if (!Number.isFinite(headingY)) return null;
  // For each possible cut, the box runs down until the first text that crosses the gap
  // before it (a full-width summary). Keep the cut with the deepest box of 3+ rows.
  let best: { x: number; bottom: number } | null = null;
  for (let x = width * 0.45; x <= width * 0.85; x += 2) {
    const crossing = glyphs.filter((g) => g.y < headingY && g.x < x + 1 && g.x + g.w > x - 7);
    const bottom = Math.min(headingY, ...crossing.map((g) => g.y));
    const rows = new Set(glyphs.filter((g) => g.y < bottom - 1 && g.x >= x).map((g) => Math.round(g.y / 4))).size;
    if (rows >= 3 && (!best || bottom > best.bottom)) best = { x, bottom };
  }
  if (!best) return null;
  const { x: cut, bottom } = best;
  const zone = glyphs.filter((g) => g.y < bottom - 1);
  const box = zone.filter((g) => g.x >= cut);
  const header = zone.filter((g) => g.x < cut);
  const chars = (gs: Glyph[]) => gs.reduce((n, g) => n + g.str.length, 0);
  const rows = new Set(box.map((g) => Math.round(g.y / 4))).size;
  // A sidebar keeps going below; a box ends with the header.
  const lineH = Math.max(10, ...box.map((g) => g.h));
  if (glyphs.some((g) => g.x >= cut && g.y >= bottom - 1 && g.y < bottom + lineH * 4)) return null;
  // Contact details on the right are part of the header, not a separate box.
  if (!header.length || rows < 3 || chars(box) > chars(zone) * 0.6 || box.some((g) => /@|\+?\d[\d\s()-]{7,}/.test(g.str))) return null;
  return { header, box, body: glyphs.filter((g) => g.y >= bottom - 1) };
}

/**
 * Joins the pieces of one row, telling letter-spacing, word spaces and
 * wide gaps apart. Also returns where the row's content starts: the first
 * piece after a wide gap that isn't just a date (so "2019 – 2021 | Engineer"
 * starts at "Engineer").
 */
function joinRow(row: Glyph[]): { text: string; contentX: number } {
  const gaps = row.slice(1).map((g, i) => g.x - (row[i].x + row[i].w));
  const singles = row.filter((g) => g.str.trim().length === 1).length;
  // Letter-spaced text (headings in capitals) arrives one character at a time.
  const spaced = singles >= 4 && singles / row.length > 0.6;
  const positive = gaps.filter((g) => g > 0).sort((a, b) => a - b);
  const letterGap = spaced && positive.length ? positive[Math.floor(positive.length / 2)] : 0;
  let text = row[0].str;
  const segments: { x: number; from: number }[] = [{ x: row[0].x, from: 0 }];
  row.slice(1).forEach((g, i) => {
    const gap = gaps[i];
    const h = Math.min(g.h, row[i].h);
    let sep = '';
    if (gap > h * 1.6) sep = ' | ';
    else if (spaced) sep = gap > letterGap * 1.7 + h * 0.08 ? ' ' : '';
    else if (gap > h * 0.12) sep = ' ';
    // pdf.js sometimes includes the space inside the piece already.
    if (sep === ' ' && (text.endsWith(' ') || g.str.startsWith(' '))) sep = '';
    if (sep === ' | ') segments.push({ x: g.x, from: text.length + 3 });
    text += sep + g.str;
  });
  const content = segments.find((s, i) => {
    const seg = text.slice(s.from, segments[i + 1] ? segments[i + 1].from - 3 : undefined).trim();
    const d = findDates(seg);
    return !d || seg.replace(d.match, '').trim().length > 2;
  });
  return { text, contentX: (content ?? segments[0]).x };
}

function toLines(glyphs: Glyph[], firstPage: boolean): SourceLine[] {
  const sorted = [...glyphs].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: Glyph[][] = [];
  for (const g of sorted) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0].y - g.y) < Math.max(2, Math.min(row[0].h, g.h) * 0.5)) row.push(g);
    else rows.push([g]);
  }
  rows.forEach((r) => r.sort((a, b) => a.x - b.x));
  // Typical line step inside a paragraph, and the column's right edge, to spot wrapped lines.
  const steps = rows
    .slice(1)
    .map((r, i) => r[0].y - rows[i][0].y)
    .filter((s) => s > 0)
    .sort((a, b) => a - b);
  const step = steps.length ? steps[Math.floor(steps.length * 0.3)] : 0;
  const rightOf = (r: Glyph[]) => Math.max(...r.map((g) => g.x + g.w));
  const rights = rows.map(rightOf).sort((a, b) => a - b);
  const colRight = rights.length ? rights[Math.floor(rights.length * 0.9)] : 0;
  // Text inset in a card or box wraps at the box's edge, not the column's: use the right edge of
  // rows starting at the same indent when there are enough of them.
  const rightFor = (x: number) => {
    const same = rows
      .filter((r) => Math.abs(r[0].x - x) < 2)
      .map(rightOf)
      .sort((a, b) => a - b);
    return same.length >= 3 ? same[Math.floor(same.length * 0.9)] : colRight;
  };

  const out: SourceLine[] = [];
  let prev = null as { y: number; h: number; x: number; right: number } | null;
  for (const row of rows) {
    const joined = joinRow(row);
    const text = fixGlyphs(joined.text).trim();
    if (!text) continue;
    const h = Math.max(...row.map((g) => g.h));
    const bullet = /^[•●○◦▪■►▸‣∙·*–—>»›✓✔+-]\s/.test(text);
    // A bullet's text starts after the bullet glyph.
    const x = bullet && row.length > 1 ? row[1].x : joined.contentX;
    const right = Math.max(...row.map((g) => g.x + g.w));
    const gap = prev ? row[0].y - prev.y : 0;
    // Wrapped: this line's first word would not have fitted at the end of the line above,
    // and it sits tight underneath at the same indent.
    const firstWord = (text.split(/\s/)[0] ?? '').length * h * 0.5;
    const continues = Boolean(prev && !bullet && step && gap <= step * 1.08 && Math.abs(h - prev.h) < 0.25 && Math.abs(x - prev.x) < h * 0.6 && prev.right + h * 0.3 + firstWord > rightFor(row[0].x));
    out.push({
      text,
      size: Math.round(h * 10) / 10,
      x: Math.round(x * 10) / 10,
      gapBefore: prev ? gap > prev.h * 1.9 : !firstPage,
      gapRatio: prev && step ? Math.round((gap / step) * 100) / 100 : undefined,
      continues,
    });
    prev = { y: row[0].y, h, x, right };
  }
  return out;
}
