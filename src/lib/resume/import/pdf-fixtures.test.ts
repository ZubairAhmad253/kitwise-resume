/**
 * Runs the real PDF reader on a folder of sample CVs. Skipped unless
 * CV_FIXTURES points at a folder of PDFs, e.g.
 *   CV_FIXTURES=C:/cvs npx vitest run pdf-fixtures
 * Prints what was found in each file, for checking the import by eye.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCv } from './parse';
import { pdfDocLines } from './pdf-lines';

const dir = process.env.CV_FIXTURES;

describe.runIf(Boolean(dir))('PDF import on sample files', () => {
  const files = dir ? readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf')) : [];
  for (const file of files) {
    it(file, async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(join(dir!, file))) }).promise;
      const { lines } = await pdfDocLines(doc as never);
      if (process.env.CV_LINES) console.log(lines.map((l) => `${l.continues ? '  ~' : l.gapBefore ? '---' : '   '} [${l.x ?? ''}|${l.size ?? ''}] ${l.text}`).join('\n'));
      const { resume, found, warnings } = parseCv(lines);
      const detail = resume.sections.map((s) => `  ${s.kind} "${s.title}":\n${s.items.map((i) => `    - ${[i.title, i.subtitle, i.location, [i.start, i.current ? 'now' : i.end].filter(Boolean).join('→'), i.tags.join('/')].filter(Boolean).join(' | ')}${i.description ? `\n      ${i.description.split('\n').join('\n      ')}` : ''}`).join('\n')}`);
      console.log(`\n=== ${file}\n${[...found, ...warnings.map((w) => `! ${w}`)].join('\n')}\n  headline: ${resume.basics.headline}\n  summary: ${resume.basics.summary.slice(0, 100)}\n${detail.join('\n')}`);
      expect(resume.basics.name).not.toBe('');
    });
  }
});
