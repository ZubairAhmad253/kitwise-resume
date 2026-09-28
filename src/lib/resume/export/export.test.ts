import mammoth from 'mammoth';
import { describe, expect, it } from 'vitest';
import { linesFromText, parseCv } from '../import/parse';
import { SAMPLES, sampleById } from '../samples';
import { toDocx } from './docx';
import { toMarkdown, toPlainText } from './text';
import { crc32 } from './zip';

describe('zip', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('plain text and Markdown', () => {
  it('writes the whole resume as plain text', () => {
    const t = toPlainText(sampleById('software')!.build());
    expect(t.startsWith('AISHA RAHMAN\nSenior Software Engineer\naisha.rahman@example.com | +974 5550 1234')).toBe(true);
    expect(t).toContain('\nEXPERIENCE\nSenior Software Engineer, Gulfstream Payments, Doha, Qatar (Mar 2021 – Present)\n• Led the rebuild');
    expect(t).toContain('Languages: Go, TypeScript, Python, SQL');
    expect(t).not.toMatch(/\*\*/);
  });

  it('writes Markdown with headings and bullets', () => {
    const m = toMarkdown(sampleById('software')!.build());
    expect(m).toContain('# Aisha Rahman');
    expect(m).toContain('## Experience');
    expect(m).toContain('### Senior Software Engineer · Gulfstream Payments');
    expect(m).toContain('- Led the rebuild');
    expect(m).toContain('**8 years**');
  });

  it('plain text of every example reads back through the importer', () => {
    for (const s of SAMPLES) {
      const r = s.build();
      const back = parseCv(linesFromText(toPlainText(r))).resume;
      expect(back.basics.email, s.id).toBe(r.basics.email);
      const jobs = r.sections.find((x) => x.kind === 'experience');
      if (jobs) expect(back.sections.find((x) => x.kind === 'experience')?.items.length, s.id).toBe(jobs.items.length);
    }
  });
});

describe('Word export', () => {
  it('produces a document Word readers can open, with headings and bullets', async () => {
    const r = sampleById('software')!.build();
    const bytes = toDocx(r);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe('PK');
    const { value: html } = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    expect(html).toContain('Aisha Rahman');
    expect(html).toContain('<h1>Experience</h1>');
    expect(html).toMatch(/<h2>Senior Software Engineer — Gulfstream Payments<\/h2>/);
    expect(html).toContain('<li>Led the rebuild of the card-authorisation service in Go');
    expect(html).toContain('<strong>8 years</strong>');
  });

  it('uses the paper size from the settings', () => {
    const r = sampleById('finance')!.build();
    r.settings.paper = 'Letter';
    const xml = new TextDecoder().decode(toDocx(r));
    expect(xml).toContain('<w:pgSz w:w="12240" w:h="15840"/>');
  });
});
