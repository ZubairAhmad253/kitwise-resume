import type { ReactNode } from 'react';
import { ACCENT_SWATCHES, FONT_CHOICES, SPACINGS, TEXT_SIZES } from '@/lib/resume/design';
import type { Action } from '@/lib/resume/store';
import type { DateFormat, Resume, Settings } from '@/lib/resume/types';
import type { TemplateDef } from '@/templates/types';
import { Icon } from './icons';

const DATE_FORMATS: { id: DateFormat; label: string }[] = [
  { id: 'MMM YYYY', label: 'Mar 2024' },
  { id: 'MM/YYYY', label: '03/2024' },
  { id: 'YYYY', label: '2024' },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-line" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`h-8 flex-1 px-2.5 text-sm ${value === o.id ? 'bg-brand font-medium text-brand-fg' : 'bg-surface text-muted hover:text-fg'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Colour, typeface, size, spacing, dates and photo for the current resume. */
export function DesignPanel({ resume, template, dispatch }: { resume: Resume; template: TemplateDef; dispatch: (a: Action) => void }) {
  const s = resume.settings;
  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings', patch });
  const swatch = (color: string, label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`relative inline-flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-[var(--surface)] ${active ? 'ring-2 ring-fg' : 'hover:ring-2 hover:ring-line'}`}
      style={{ background: color }}
    >
      {active && <Icon name="check" className="size-3.5 text-white" />}
    </button>
  );
  const custom = s.accent && !ACCENT_SWATCHES.includes(s.accent);

  return (
    <div className="grid gap-4 border-b border-line bg-surface px-3 py-3 sm:grid-cols-2 sm:px-4 xl:grid-cols-3">
      <Row label="Accent colour">
        <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Accent colour">
          {swatch(template.accent.color, `Template colour (${template.accent.color})`, !s.accent, () => set({ accent: '' }))}
          <span className="mx-0.5 h-5 w-px bg-line" aria-hidden="true" />
          {ACCENT_SWATCHES.map((c) => swatch(c, c, s.accent === c, () => set({ accent: c })))}
          <label className={`relative inline-flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-line ${custom ? 'ring-2 ring-fg ring-offset-2' : ''}`} title="Custom colour">
            <span className="sr-only">Custom colour</span>
            <span className="absolute inset-0" style={{ background: custom ? s.accent : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
            <input type="color" value={s.accent || template.accent.color} onChange={(e) => set({ accent: e.target.value.toLowerCase() })} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
        </div>
      </Row>
      <Row label="Typeface">
        <select value={s.font} onChange={(e) => set({ font: e.target.value as Settings['font'] })} className="h-8 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-brand" aria-label="Typeface">
          {FONT_CHOICES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </Row>
      <Row label="Text size">
        <Segmented label="Text size" value={s.textSize} options={TEXT_SIZES} onChange={(v) => set({ textSize: v })} />
      </Row>
      <Row label="Spacing">
        <Segmented label="Spacing" value={s.spacing} options={SPACINGS} onChange={(v) => set({ spacing: v })} />
      </Row>
      <Row label="Dates">
        <Segmented label="Date format" value={s.dateFormat} options={DATE_FORMATS} onChange={(v) => set({ dateFormat: v })} />
      </Row>
      <Row label="Photo">
        <label className={`inline-flex items-center gap-2 text-sm ${resume.basics.photo ? 'cursor-pointer' : 'text-muted'}`}>
          <input type="checkbox" disabled={!resume.basics.photo} checked={s.showPhoto} onChange={(e) => set({ showPhoto: e.target.checked })} className="size-4 accent-[var(--brand)]" />
          {resume.basics.photo ? 'Show my photo' : 'Add a photo under Personal details first'}
        </label>
      </Row>
    </div>
  );
}
