import { describe, expect, it } from 'vitest';
import { newItem } from './defaults';
import { coveredMonths, resumeMetrics } from './metrics';
import { sampleById } from './samples';

const job = (start: string, end = '', current = false) => ({ ...newItem(), start, end, current });
const NOW = new Date(2026, 8, 15); // September 2026

describe('coveredMonths', () => {
  it('counts a closed range inclusively', () => {
    expect(coveredMonths([job('2020-01', '2020-12')], NOW)).toBe(12);
  });
  it('runs current roles to today', () => {
    expect(coveredMonths([job('2026-01', '', true)], NOW)).toBe(9);
  });
  it('counts overlapping roles once', () => {
    expect(coveredMonths([job('2020-01', '2020-12'), job('2020-06', '2021-06')], NOW)).toBe(18);
  });
  it('treats bare years as whole years and ignores entries without dates', () => {
    expect(coveredMonths([job('2018', '2019'), job('')], NOW)).toBe(24);
  });
  it('ignores ranges that end before they start', () => {
    expect(coveredMonths([job('2022-05', '2021-01')], NOW)).toBe(0);
  });
});

describe('resumeMetrics', () => {
  it('derives counters from the driver example', () => {
    const m = resumeMetrics(sampleById('driver')!.build(), NOW);
    expect(m.map((x) => x.value)).toEqual(['15+', '2', '4', '3']);
  });
  it('returns nothing for an empty resume', () => {
    expect(resumeMetrics({ ...sampleById('driver')!.build(), sections: [] }, NOW)).toEqual([]);
  });
});
