/**
 * Reads a CV file in the browser and returns its text as lines for
 * parseCv. PDF and Word readers are loaded only when a file is chosen,
 * so the builder stays light for everyone else.
 */
import { normalizeResume } from '../normalize';
import type { Resume } from '../types';
import { linesFromText, type SourceLine } from './parse';
import { pdfDocLines } from './pdf-lines';

export type ReadResult = { kind: 'lines'; lines: SourceLine[]; format: string } | { kind: 'backup'; resume: Resume };

export class ImportError extends Error {}

const MAX_BYTES = 15 * 1024 * 1024;

export async function readCvFile(file: File): Promise<ReadResult> {
  if (file.size > MAX_BYTES) throw new ImportError('That file is over 15 MB. Save a smaller copy (a PDF or Word file of your CV is usually under 1 MB).');
  const name = file.name.toLowerCase();
  const type = file.type;
  if (name.endsWith('.json')) {
    const resume = normalizeResume(JSON.parse(await file.text()));
    if (!resume) throw new ImportError('That JSON file is not a Kitwise resume backup.');
    return { kind: 'backup', resume };
  }
  if (name.endsWith('.pdf') || type === 'application/pdf') return { kind: 'lines', lines: await readPdf(file), format: 'PDF' };
  if (name.endsWith('.docx') || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return { kind: 'lines', lines: await readDocx(file), format: 'Word' };
  if (name.endsWith('.doc')) throw new ImportError('Old Word files (.doc) can’t be read in the browser. In Word, choose File › Save As › Word Document (.docx) or PDF, then upload that.');
  if (/\.(txt|md|text)$/.test(name) || type.startsWith('text/')) return { kind: 'lines', lines: markdownish(await file.text()), format: 'text' };
  if (type.startsWith('image/')) throw new ImportError('Photos and scans of a CV can’t be read as text. Upload the original PDF or Word file, or paste the text instead.');
  throw new ImportError('Upload a PDF, Word (.docx) or text file.');
}

/** Plain text, treating Markdown "# Heading" and "- item" lines as headings and bullets. */
function markdownish(text: string): SourceLine[] {
  return linesFromText(text).map((l) => {
    const h = /^#{1,6}\s+(.*)$/.exec(l.text.trim());
    return h ? { ...l, text: h[1].replace(/[*_]/g, ''), heading: true } : { ...l, text: l.text.replace(/\*\*|__/g, '') };
  });
}

/* ---------- PDF ---------- */

async function readPdf(file: File): Promise<SourceLine[]> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (e) {
    throw new ImportError((e as Error)?.name === 'PasswordException' ? 'That PDF is password-protected. Save an unprotected copy and upload that.' : 'That PDF could not be opened. It may be damaged; try saving it again.');
  }
  const { lines, chars } = await pdfDocLines(doc);
  if (chars < 40) throw new ImportError('This PDF has no selectable text, so it is probably a scan or an image. Upload the original Word file or a PDF exported from it.');
  return lines;
}

/* ---------- Word ---------- */

async function readDocx(file: File): Promise<SourceLine[]> {
  const mammoth = (await import('mammoth/mammoth.browser.min.js')).default;
  let html: string;
  try {
    html = (await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })).value;
  } catch {
    throw new ImportError('That Word file could not be opened. Try saving it again, or export it as a PDF.');
  }
  const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
  const out: SourceLine[] = [];
  let gap = false;
  const push = (text: string, extra: Partial<SourceLine> = {}) => {
    for (const part of text.split('\n')) {
      const t = part.trim();
      if (!t) {
        gap = true;
        continue;
      }
      out.push({ text: t, gapBefore: gap, ...extra });
      gap = false;
    }
  };
  const textOf = (el: Element) => {
    const copy = el.cloneNode(true) as Element;
    copy.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    return copy.textContent ?? '';
  };
  // Sections use the top heading level in the file; lower levels (often job titles) are ordinary lines.
  const levels = Array.from(body.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => Number(h.tagName[1]));
  const top = levels.length ? Math.min(...levels) : 0;
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) push(textOf(child), Number(tag[1]) === top ? { heading: true } : {});
      else if (tag === 'p') {
        const t = textOf(child);
        // A paragraph that is entirely bold and short is often a heading.
        const strong = child.children.length === 1 && child.firstElementChild?.tagName === 'STRONG' && child.textContent?.trim() === child.firstElementChild.textContent?.trim();
        push(t, strong && t.length < 40 ? { heading: true } : {});
        if (!t.trim()) gap = true;
      } else if (tag === 'ul' || tag === 'ol') {
        for (const li of Array.from(child.children)) {
          const nested = Array.from(li.querySelectorAll(':scope > ul, :scope > ol'));
          const own = li.cloneNode(true) as Element;
          own.querySelectorAll('ul, ol').forEach((n) => n.remove());
          push(textOf(own), { bullet: true });
          nested.forEach((n) => walk({ children: [n] } as unknown as Element));
        }
      } else if (tag === 'table') {
        for (const tr of Array.from(child.querySelectorAll('tr'))) {
          const cells = Array.from(tr.children).map((td) => textOf(td).trim());
          if (cells.every((c) => !c.includes('\n'))) push(cells.filter(Boolean).join(' | '));
          else for (const td of Array.from(tr.children)) walk(td);
        }
        gap = true;
      } else walk(child);
    }
  };
  walk(body);
  if (out.length === 0) throw new ImportError('That Word file has no text in it.');
  return out;
}
