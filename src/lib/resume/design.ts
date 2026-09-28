/**
 * The user's design choices (accent colour, typeface, text size, spacing)
 * turned into CSS for a page. Templates stay in charge of their layout;
 * these only swap values the templates expose as custom properties.
 */
import type { CSSProperties } from 'react';
import type { FontChoice, Settings, Spacing, TextSize } from './types';

export interface AccentSpec {
  /** Custom properties that take the accent colour directly. */
  vars: string[];
  /** Custom properties that take a light tint of it: [name, percent of accent mixed into white]. */
  tints?: [string, number][];
  /** The template's own accent, shown as the default swatch. */
  color: string;
}

export const FONT_CHOICES: { id: FontChoice; label: string; stack: string }[] = [
  { id: 'template', label: 'Template default', stack: '' },
  { id: 'inter', label: 'Inter (clean sans)', stack: "'Inter Variable', Inter, Arial, sans-serif" },
  { id: 'jakarta', label: 'Plus Jakarta Sans (modern)', stack: "'Plus Jakarta Sans Variable', 'Plus Jakarta Sans', Arial, sans-serif" },
  { id: 'gelasio', label: 'Gelasio (classic serif)', stack: "'Gelasio Variable', Gelasio, Georgia, serif" },
  { id: 'garamond', label: 'EB Garamond (elegant serif)', stack: "'EB Garamond Variable', 'EB Garamond', Garamond, Georgia, serif" },
];

export const TEXT_SIZES: { id: TextSize; label: string; factor: number }[] = [
  { id: 'S', label: 'Small', factor: 0.93 },
  { id: 'M', label: 'Medium', factor: 1 },
  { id: 'L', label: 'Large', factor: 1.07 },
];

export const SPACINGS: { id: Spacing; label: string; factor: number }[] = [
  { id: 'compact', label: 'Compact', factor: 0.7 },
  { id: 'normal', label: 'Normal', factor: 1 },
  { id: 'relaxed', label: 'Relaxed', factor: 1.35 },
];

/** Colours that read well as text on white and as fills behind white text. */
export const ACCENT_SWATCHES = ['#1f5fbf', '#0e7490', '#047857', '#4d7c0f', '#b45309', '#c2410c', '#be123c', '#a21caf', '#6d28d9', '#334155', '#0f172a', '#9a7b2f'];

export const textFactor = (s: Settings) => TEXT_SIZES.find((t) => t.id === s.textSize)?.factor ?? 1;
export const spaceFactor = (s: Settings) => SPACINGS.find((t) => t.id === s.spacing)?.factor ?? 1;

/** Class names and inline custom properties for one page. */
export function pageDesign(s: Settings, accent: AccentSpec | undefined): { className: string; style: CSSProperties } {
  const style: Record<string, string | number> = { '--kr-space': spaceFactor(s) };
  if (s.accent && accent) {
    for (const v of accent.vars) style[v] = s.accent;
    for (const [v, pct] of accent.tints ?? []) style[v] = `color-mix(in srgb, ${s.accent} ${pct}%, #fff)`;
  }
  const font = FONT_CHOICES.find((f) => f.id === s.font);
  if (font?.stack) style['--kr-font'] = font.stack;
  return { className: font?.stack ? 'kr-font-override' : '', style: style as CSSProperties };
}

/** Changes whenever a design setting that affects measured heights changes. */
export const designKey = (s: Settings) => `${s.font}|${s.textSize}|${s.spacing}`;
