import { describe, expect, it } from 'vitest';
import { defaultSettings } from './defaults';
import { designKey, pageDesign, spaceFactor, textFactor } from './design';
import { normalizeResume } from './normalize';

const accent = { vars: ['--x-accent'], tints: [['--x-soft', 20]] as [string, number][], color: '#123456' };

describe('pageDesign', () => {
  it('leaves template colours and fonts alone by default', () => {
    const d = pageDesign(defaultSettings(), accent);
    expect(d.className).toBe('');
    expect(d.style).toEqual({ '--kr-space': 1 });
  });

  it('sets the accent, its tints, the typeface and spacing', () => {
    const d = pageDesign({ ...defaultSettings(), accent: '#be123c', font: 'gelasio', spacing: 'compact' }, accent);
    expect(d.className).toBe('kr-font-override');
    expect(d.style).toMatchObject({ '--x-accent': '#be123c', '--x-soft': 'color-mix(in srgb, #be123c 20%, #fff)', '--kr-space': 0.7 });
    expect(String((d.style as Record<string, string>)['--kr-font'])).toContain('Gelasio');
  });

  it('turns sizes into factors and keys only on layout-changing settings', () => {
    expect(textFactor({ ...defaultSettings(), textSize: 'L' })).toBeGreaterThan(1);
    expect(spaceFactor({ ...defaultSettings(), spacing: 'relaxed' })).toBeGreaterThan(1);
    expect(designKey({ ...defaultSettings(), accent: '#000000' })).toBe(designKey(defaultSettings()));
  });
});

describe('design settings in saved data', () => {
  it('keeps valid values and drops bad ones', () => {
    const ok = normalizeResume({ basics: {}, settings: { accent: '#AABBCC', font: 'inter', textSize: 'S', spacing: 'relaxed' } })!;
    expect(ok.settings).toMatchObject({ accent: '#aabbcc', font: 'inter', textSize: 'S', spacing: 'relaxed' });
    const bad = normalizeResume({ basics: {}, settings: { accent: 'red; background:url(x)', font: 'comic', textSize: 'XL', spacing: 1 } })!;
    expect(bad.settings).toMatchObject({ accent: '', font: 'template', textSize: 'M', spacing: 'normal' });
  });
});
