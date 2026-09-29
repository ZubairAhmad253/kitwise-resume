/**
 * Tidies text recognised from a scan or photo before parsing: rules drawn
 * next to headings come out as "—m—m——", bullet dots as "=", "m" or "B",
 * icons as stray letters, and stripes or patterns as rows of capitals.
 */

const MARKER = /^(?:[=~*•·●▪■»>+]|[mBe©®o])\s+(?=\S)/;
const SURE_MARKER = /^[=~*•·●▪■»>+]\s+(?=\S)/;
const REAL_WORD = /[A-Za-z]*[aeiouyAEIOUY][A-Za-z]*/;

/**
 * A heading with a drawn rule after it: cut from the first dash when what
 * follows has no real word and no date ("EXPERIENCE —m—m——— 0" → "EXPERIENCE",
 * but "Engineer — Google" and "Jul 2014 — Apr 2019" stay).
 */
function cutRule(line: string): string {
  const at = line.search(/\s[—–]|\s-{2,}|[—–]{2,}/);
  if (at <= 0) return line;
  const tail = line.slice(at);
  if (/\b(?:19|20)\d{2}\b|present|current/i.test(tail)) return line;
  const words = tail.split(/[\s—–-]+/).filter((w) => w.length >= 3 && /^[A-Za-z][a-z]+$|^[A-Z]{3,}$/.test(w) && REAL_WORD.test(w));
  return words.length ? line : line.slice(0, at).trimEnd();
}

/** Stripes and patterns: a long row of short capital-letter tokens, some repeated, with no lower case. */
function isPattern(line: string): boolean {
  const tokens = line.trim().split(/\s+/);
  if (tokens.length < 8 || /[a-z]/.test(line)) return false;
  const short = tokens.filter((t) => /^[A-Z]{1,5}$/.test(t)).length;
  return short >= tokens.length * 0.9 && new Set(tokens).size < tokens.length;
}

export function cleanOcrText(text: string): string {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => !isPattern(l));
  return lines
    .map((line, i) => {
      let l = cutRule(line);
      // A stray icon or bullet letter in front of a heading in capitals: "# EXPERIENCE", "Bj PROJECTS".
      l = l.replace(/^(?:[^\w\s]{1,2}|[A-Za-z]{1,2})\s+(?=[A-Z][A-Z&, ]{3,}$)/, '');
      // Bullet dots read as "=", or as "m"/"B" when a neighbour line is clearly a bullet.
      if (SURE_MARKER.test(l)) return l.replace(SURE_MARKER, '- ');
      if (MARKER.test(l) && /^[mBe©®o]\s+[A-Z][a-z]/.test(l)) {
        const near = [lines[i - 1], lines[i + 1]].some((n) => n !== undefined && MARKER.test(n));
        if (near) return l.replace(MARKER, '- ');
      }
      return l;
    })
    .join('\n');
}
