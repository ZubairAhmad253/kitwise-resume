import { describe, expect, it } from 'vitest';
import { cleanOcrText } from './ocr-clean';
import { linesFromText, parseCv } from './parse';

// Real tesseract output for a resume page (the Infrastructure Scale example).
const SCAN = `priya.nair@example.com
PRIYA NAIR rsa
A Doha, Qatar
Structural Engineer - PE linkedin.com/in/priyanair
ESATA TLS SAA AAT TTL TLA AT AAT ATLL TAT AT TL TLS LSTA S SSSA
Structural engineer with 11 years on bridges, metro stations and high-rise concrete structures worth over QAR 2.4
billion. Known for value engineering and safe, on-time delivery.
# EXPERIENCE —m—m——————o 0 — —
Lead Structural Engineer May 2019 - Present
Pearl Infrastructure Group - Doha, Qatar
= Led design of a 1.2 km elevated metro viaduct delivered 6 weeks early
m Value-engineered post-tensioned slabs, saving QAR 18 million
= Managed a team of 9 engineers and drafters
Structural Engineer Jul 2014 — Apr 2019
Kerala Build Consultants - Kochi, India
= Designed 14 residential towers up to 30 storeys
B Zero lost-time incidents across 3 years of site supervision
Bj PROJECTS — — — — — — —
Lusail Metro Station L-4
ROLE Structural design lead
Underground station, 38,000 m? GFA, QAR 640 million.
J CERTIFICATIONS & LICENCES —m4mM8 —— 0 0
Professional Engineer (PE) 2020
Qatar MME`;

describe('cleanOcrText', () => {
  it('removes drawn rules, stray icon letters, patterns and misread bullets', () => {
    const lines = cleanOcrText(SCAN).split('\n');
    expect(lines).toContain('EXPERIENCE');
    expect(lines).toContain('PROJECTS');
    expect(lines).toContain('CERTIFICATIONS & LICENCES');
    expect(lines).toContain('- Value-engineered post-tensioned slabs, saving QAR 18 million');
    expect(lines).toContain('- Zero lost-time incidents across 3 years of site supervision');
    expect(lines.some((l) => l.startsWith('ESATA'))).toBe(false);
    expect(lines).toContain('Lead Structural Engineer May 2019 - Present');
  });

  it('lets the parser find the sections and jobs', () => {
    const { resume } = parseCv(linesFromText(cleanOcrText(SCAN)));
    expect(resume.basics.email).toBe('priya.nair@example.com');
    const jobs = resume.sections.find((s) => s.kind === 'experience')!;
    expect(jobs.items.map((j) => [j.title, j.start])).toEqual([
      ['Lead Structural Engineer', '2019-05'],
      ['Structural Engineer', '2014-07'],
    ]);
    expect(jobs.items[0].description.split('\n')).toHaveLength(3);
    expect(resume.sections.map((s) => s.kind)).toEqual(expect.arrayContaining(['projects', 'certifications']));
  });
});
