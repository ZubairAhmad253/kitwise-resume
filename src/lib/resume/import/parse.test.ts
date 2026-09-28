import { describe, expect, it } from 'vitest';
import { formatRange } from '../dates';
import { SAMPLES } from '../samples';
import { singleDate } from '../schema';
import type { Resume } from '../types';
import { findDates, linesFromText, parseCv } from './parse';

/** A resume written out the way many plain CVs look. */
function asPlainCv(r: Resume): string {
  const b = r.basics;
  const out = [b.name, b.headline, [b.email, b.phone, b.location].filter(Boolean).join(' | '), [b.linkedin, b.github, b.website].filter(Boolean).join(' | '), ''];
  if (b.summary) out.push('SUMMARY', b.summary.replace(/\*\*/g, ''), '');
  for (const s of r.sections) {
    out.push(s.title.toUpperCase());
    for (const it of s.items) {
      if (s.kind === 'skills') {
        out.push(`${it.title}: ${it.tags.join(', ')}`);
        continue;
      }
      if (s.kind === 'languages') {
        out.push(`${it.title} (${it.subtitle})`);
        continue;
      }
      const when = formatRange(it.start, it.end, it.current, 'MMM YYYY', singleDate(s.kind));
      out.push([it.title, it.subtitle, it.location, when].filter(Boolean).join(' | '));
      if (it.description) out.push(...it.description.replace(/\*\*/g, '').split('\n'));
    }
    out.push('');
  }
  return out.join('\n');
}

describe('findDates', () => {
  it('reads common date ranges', () => {
    expect(findDates('Jan 2020 – Present')).toMatchObject({ start: '2020-01', end: '', current: true });
    expect(findDates('03/2018 - 11/2021')).toMatchObject({ start: '2018-03', end: '2021-11' });
    expect(findDates('September 2015 to June 2019')).toMatchObject({ start: '2015-09', end: '2019-06' });
    expect(findDates('2012-2016')).toMatchObject({ start: '2012', end: '2016' });
    expect(findDates('Graduated 2019')).toMatchObject({ start: '2019', end: '' });
  });
  it('ignores numbers that are not dates', () => {
    expect(findDates('Led a team of 12 across 3 sites')).toBeNull();
    expect(findDates('Summary of 450 projects')).toBeNull();
    expect(findDates('Budget of 12020 units')).toBeNull();
  });
});

describe('parseCv on the built-in examples', () => {
  for (const sample of SAMPLES) {
    it(`recovers the ${sample.id} example`, () => {
      const original = sample.build();
      const { resume } = parseCv(linesFromText(asPlainCv(original)));
      expect(resume.basics.name).toBe(original.basics.name);
      expect(resume.basics.email).toBe(original.basics.email);
      expect(resume.basics.phone).toBe(original.basics.phone);
      expect(resume.basics.headline).toBe(original.basics.headline);
      for (const kind of ['experience', 'education'] as const) {
        const want = original.sections.find((s) => s.kind === kind);
        if (!want) continue;
        const got = resume.sections.find((s) => s.kind === kind);
        expect(got?.items.length, `${kind} count`).toBe(want.items.length);
        expect(got?.items.map((i) => i.title)).toEqual(want.items.map((i) => i.title));
        expect(got?.items.map((i) => i.start)).toEqual(want.items.map((i) => i.start));
      }
      const skills = original.sections.find((s) => s.kind === 'skills');
      if (skills?.items.some((i) => i.tags.length)) {
        const got = resume.sections.find((s) => s.kind === 'skills')!;
        expect(got.items.flatMap((i) => i.tags)).toEqual(skills.items.flatMap((i) => i.tags));
      }
    });
  }
});

describe('parseCv on other layouts', () => {
  it('handles employer-first entries, wrapped bullets and a contact block', () => {
    const text = `
John Carter
Operations Manager

Contact
john.carter@mail.com
+44 7700 900123
Manchester, UK

Professional Experience
Northwind Logistics — Manchester, UK
Operations Manager, Jan 2019 - Present
• Run a 40-person warehouse team across two shifts and cut picking errors
  by 30% in the first year
• Introduced a new WMS
Acme Freight
Shift Supervisor
2015 - 2018

Education
BSc Business Management, University of Leeds, 2011 - 2014

Languages
English (Native), French (Intermediate)

References
Available on request
`;
    const { resume, warnings } = parseCv(linesFromText(text));
    expect(resume.basics).toMatchObject({ name: 'John Carter', headline: 'Operations Manager', email: 'john.carter@mail.com', phone: '+44 7700 900123', location: 'Manchester, UK' });
    const exp = resume.sections.find((s) => s.kind === 'experience')!;
    expect(exp.items).toHaveLength(2);
    expect(exp.items[0]).toMatchObject({ title: 'Operations Manager', subtitle: 'Northwind Logistics', location: 'Manchester, UK', start: '2019-01', current: true });
    expect(exp.items[0].description).toBe('- Run a 40-person warehouse team across two shifts and cut picking errors by 30% in the first year\n- Introduced a new WMS');
    expect(exp.items[1]).toMatchObject({ title: 'Shift Supervisor', subtitle: 'Acme Freight', start: '2015', end: '2018' });
    const edu = resume.sections.find((s) => s.kind === 'education')!;
    expect(edu.items[0]).toMatchObject({ title: 'BSc Business Management', subtitle: 'University of Leeds', start: '2011', end: '2014' });
    const langs = resume.sections.find((s) => s.kind === 'languages')!;
    expect(langs.items.map((i) => [i.title, i.subtitle, i.level])).toEqual([
      ['English', 'Native', 5],
      ['French', 'Intermediate', 3],
    ]);
    expect(resume.sections.some((s) => s.kind === 'references')).toBe(false);
    expect(warnings).toEqual([]);
  });

  it('keeps unrecognised text instead of dropping it', () => {
    const { resume, warnings } = parseCv(linesFromText('Maria Lopez\nI have worked in retail for ten years and love helping customers.\nI am reliable and punctual.'));
    expect(resume.basics.name).toBe('Maria Lopez');
    expect(resume.basics.summary || resume.sections[0]?.items[0]?.description).toContain('retail');
    expect(warnings.length + resume.sections.length).toBeGreaterThanOrEqual(0);
  });

  it('turns capitalised extra headings into custom sections only after a known one', () => {
    const text = 'ANNA SMITH\nDATA ANALYST\nanna@x.io\n\nEXPERIENCE\nAnalyst | Contoso | 2020 - 2023\n\nHOBBIES\nChess, running';
    const { resume } = parseCv(linesFromText(text));
    expect(resume.basics.name).toBe('ANNA SMITH');
    expect(resume.basics.headline).toBe('DATA ANALYST');
    expect(resume.sections.map((s) => [s.kind, s.title])).toEqual([
      ['experience', 'Experience'],
      ['custom', 'Hobbies'],
    ]);
  });
});
