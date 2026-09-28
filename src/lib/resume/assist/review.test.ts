import { describe, expect, it } from 'vitest';
import { emptyResume, newItem, newSection } from '../defaults';
import { SAMPLES, sampleById } from '../samples';
import { guessField, PHRASE_FIELDS } from './phrases';
import { matchJob, reviewResume } from './review';

const NOW = new Date(2026, 8, 15);

describe('reviewResume', () => {
  it('scores the built-in examples well', () => {
    for (const s of SAMPLES) {
      const { score, checks } = reviewResume(s.build(), 1, NOW);
      expect(score, s.id).toBeGreaterThanOrEqual(70);
      expect(checks.filter((c) => c.level === 'fix').map((c) => c.message), s.id).toEqual([]);
    }
  });

  it('gives an empty resume a low score and the basics to fix', () => {
    const { score, checks } = reviewResume(emptyResume(), 1, NOW);
    expect(score).toBeLessThan(15);
    expect(checks.map((c) => c.id)).toEqual(expect.arrayContaining(['name', 'email', 'phone', 'summary', 'experience', 'skills']));
  });

  it('flags placeholders, pronouns, date problems and weak bullets', () => {
    const r = sampleById('software')!.build();
    const exp = r.sections.find((s) => s.kind === 'experience')!;
    exp.items[0].description = '- I was responsible for [feature]\n- My tasks included meetings';
    exp.items[1].start = '2027-01';
    exp.items[2].end = '2015-01';
    const ids = reviewResume(r, 3, NOW).checks.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['placeholder', 'pronouns', `job-future-${exp.items[1].id}`, `job-order-${exp.items[2].id}`, 'pages']));
  });

  it('suggests standard headings for renamed sections', () => {
    const r = emptyResume();
    const s = newSection('experience');
    s.title = 'My journey';
    s.items = [newItem({ title: 'Clerk', subtitle: 'Shop', start: '2020' })];
    r.sections = [s];
    expect(reviewResume(r, 1, NOW).checks.some((c) => c.id === 'headings' && c.message.includes('My journey'))).toBe(true);
  });
});

describe('matchJob', () => {
  it('finds the ad’s key terms in the resume and lists the missing ones', () => {
    const ad = 'We need a backend engineer with Go and Kubernetes. Experience with Kafka is required. Kubernetes on AWS, Terraform a plus. Go, Go, Go.';
    const m = matchJob(sampleById('software')!.build(), ad);
    expect(m.matched).toEqual(expect.arrayContaining(['go', 'kubernetes', 'kafka', 'aws']));
    expect(m.missing).toContain('terraform');
    expect(m.score).toBeGreaterThan(50);
  });
  it('returns zero for an empty ad', () => {
    expect(matchJob(emptyResume(), '').score).toBe(0);
  });
});

describe('phrases', () => {
  it('guesses a field from the job titles', () => {
    expect(guessField(sampleById('software')!.build())).toBe('software');
    expect(guessField(sampleById('driver')!.build())).toBe('logistics');
    expect(guessField(sampleById('doctor')!.build())).toBe('healthcare');
    expect(guessField(sampleById('fresher')!.build())).toBe('student');
  });
  it('gives every field bullets and a summary', () => {
    for (const f of PHRASE_FIELDS) {
      expect(f.bullets.length).toBeGreaterThanOrEqual(6);
      expect(f.summaries.length).toBeGreaterThanOrEqual(1);
    }
  });
});
