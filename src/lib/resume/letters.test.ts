import mammoth from 'mammoth';
import { describe, expect, it } from 'vitest';
import { TEMPLATES } from '@/templates';
import { letterTemplateFor } from '@/templates/letter';
import { toDocx } from './export/docx';
import { toLetterText } from './export/text';
import { greetingFor, LETTER_STARTERS, letterDate } from './letters';
import { normalizeResume } from './normalize';
import { sampleById } from './samples';

const withLetter = () => {
  const r = sampleById('software')!.build();
  r.letter = { ...r.letter, recipientName: 'Ms Fatima Ahmed', recipientTitle: 'Head of Talent', company: 'Qatar Payments', address: 'Tower 3, West Bay\nDoha, Qatar', subject: 'Application for Staff Engineer', date: '29 September 2026' };
  r.letter.body = LETTER_STARTERS[0].body(r);
  return r;
};

describe('cover letters', () => {
  it('starters fill in what the resume knows and leave placeholders for the rest', () => {
    const r = withLetter();
    expect(r.letter.body).toContain('Staff Engineer role at Qatar Payments');
    expect(r.letter.body).toContain('Senior Software Engineer with 8 years');
    expect(r.letter.body).toMatch(/\[[^\]]+\]/);
    for (const s of LETTER_STARTERS) expect(s.body(sampleById('fresher')!.build()).length).toBeGreaterThan(200);
  });

  it('every template has a letter version that builds', () => {
    const r = withLetter();
    for (const t of TEMPLATES) {
      const lt = letterTemplateFor(t);
      expect(lt).toBe(letterTemplateFor(t));
      expect(lt.className).toContain(t.className);
      const blocks = lt.build(r).regions.main ?? [];
      expect(blocks.map((b) => b.key)).toEqual(expect.arrayContaining(['head', 'date', 'to', 'subject', 'greeting', 'p0', 'sign']));
    }
  });

  it('writes a greeting from the recipient', () => {
    expect(greetingFor('Ms Fatima Ahmed')).toBe('Dear Ms Ahmed,');
    expect(greetingFor('dr. Omar Haddad')).toBe('Dear dr Haddad,');
    expect(greetingFor('Omar Haddad')).toBe('Dear Omar Haddad,');
    expect(greetingFor('  ')).toBe('Dear Hiring Manager,');
  });

  it('uses today when no date is typed', () => {
    const r = sampleById('software')!.build();
    expect(letterDate(r, new Date(2026, 8, 29))).toBe('29 September 2026');
  });

  it('exports the letter as text and Word', async () => {
    const r = withLetter();
    const text = toLetterText(r, letterDate(r));
    expect(text).toContain('Ms Fatima Ahmed\nHead of Talent\nQatar Payments\nTower 3, West Bay\nDoha, Qatar');
    expect(text.trim().endsWith('Aisha Rahman')).toBe(true);
    const { value } = await mammoth.convertToHtml({ buffer: Buffer.from(toDocx(r, 'letter')) });
    expect(value).toContain('Dear Hiring Manager,');
    expect(value).toContain('<strong>Application for Staff Engineer</strong>');
    expect(value).toContain('Kind regards,');
  });

  it('keeps letters in saved data and fills defaults for old saves', () => {
    const r = withLetter();
    expect(normalizeResume(JSON.parse(JSON.stringify(r)))!.letter).toEqual(r.letter);
    const old = normalizeResume({ basics: { name: 'X' } })!;
    expect(old.letter.greeting).toBe('Dear Hiring Manager,');
    expect(old.letter.body).toBe('');
  });
});
