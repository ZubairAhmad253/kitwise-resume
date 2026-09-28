import { describe, expect, it } from 'vitest';
import { emptyResume } from '@/lib/resume/defaults';
import { SAMPLES } from '@/lib/resume/samples';
import { getTemplate, TEMPLATES } from '.';

describe('templates', () => {
  it('have unique ids and catalogue numbers', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    expect(new Set(TEMPLATES.map((t) => t.number)).size).toBe(TEMPLATES.length);
  });

  it('build every sample and an empty resume', () => {
    for (const t of TEMPLATES)
      for (const r of [...SAMPLES.map((s) => s.build()), emptyResume()]) {
        const content = t.build(r);
        for (const id of Object.keys(content.regions)) expect(t.regions).toContain(id);
        const keys = t.regions.flatMap((id) => (content.regions[id] ?? []).map((b) => b.key));
        expect(new Set(keys).size).toBe(keys.length);
      }
  });

  it('fall back to the default for unknown ids', () => {
    expect(getTemplate('nope').id).toBe('corporate');
    expect(getTemplate('startup').id).toBe('startup');
  });
});

describe('catalogue', () => {
  it('has all 20 designs, numbered 1 to 20', () => {
    expect(TEMPLATES.map((t) => t.number)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('has a real template for every example', () => {
    for (const s of SAMPLES) expect(getTemplate(s.build().settings.template).id).toBe(s.build().settings.template);
  });
});
