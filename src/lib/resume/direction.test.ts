import { describe, expect, it } from 'vitest';
import { formatRange } from './dates';
import { isRtlText, resumeDir } from './direction';
import { sampleById } from './samples';
import { toPlainText } from './export/text';

describe('text direction', () => {
  it('detects right-to-left text by its letters', () => {
    expect(isRtlText('مريم الكواري')).toBe(true);
    expect(isRtlText('محاسبة قانونية · CMA')).toBe(true);
    expect(isRtlText('Senior Engineer')).toBe(false);
    expect(isRtlText('2024 · +974')).toBe(false);
  });

  it('lays an Arabic resume out right to left unless the user chooses otherwise', () => {
    const ar = sampleById('arabic')!.build();
    expect(resumeDir(ar)).toBe('rtl');
    expect(resumeDir({ ...ar, settings: { ...ar.settings, direction: 'ltr' } })).toBe('ltr');
    const en = sampleById('software')!.build();
    expect(resumeDir(en)).toBe('ltr');
    expect(resumeDir({ ...en, settings: { ...en.settings, direction: 'rtl' } })).toBe('rtl');
  });

  it('writes dates in Arabic for Arabic resumes', () => {
    expect(formatRange('2020-03', '', true, 'MMM YYYY', false, true)).toBe('مارس 2020 – حتى الآن');
    expect(formatRange('2020-03', '', true, 'MMM YYYY')).toBe('Mar 2020 – Present');
    expect(toPlainText(sampleById('arabic')!.build())).toContain('سبتمبر 2016 – فبراير 2020');
  });
});
