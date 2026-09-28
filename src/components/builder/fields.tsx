import { useId, useRef, useState, type ReactNode } from 'react';
import { joinDate, MONTH_NAMES, splitDate } from '@/lib/resume/dates';
import { insertIdea, PhrasePicker } from './PhrasePicker';

const inputCls =
  'h-11 w-full min-w-0 rounded-xl border border-line bg-surface px-3.5 text-[0.95rem] outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15';

export function Label({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  autoComplete?: string;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <input id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete ?? 'off'} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}

export function SelectField<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={`${inputCls} pr-8`}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Month (optional) + year picker, stored as "YYYY-MM" or "YYYY". Works in every browser. */
export function DateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const id = useId();
  const { year, month } = splitDate(value);
  // Keep a partly typed year locally so "20" isn't thrown away while typing.
  const [draft, setDraft] = useState<string | null>(null);
  const shownYear = draft ?? year;
  return (
    <div className="min-w-0">
      <Label htmlFor={`${id}-y`}>{label}</Label>
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-1.5">
        <select aria-label={`${label} month`} disabled={disabled} value={month} onChange={(e) => onChange(joinDate(shownYear, e.target.value))} className={`${inputCls} pr-7 disabled:opacity-50`}>
          <option value="">Month</option>
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, '0')}>
              {m}
            </option>
          ))}
        </select>
        <input
          id={`${id}-y`}
          inputMode="numeric"
          placeholder="Year"
          maxLength={4}
          disabled={disabled}
          value={shownYear}
          onChange={(e) => {
            const y = e.target.value.replace(/\D/g, '').slice(0, 4);
            setDraft(y);
            if (y.length === 4 || y === '') onChange(joinDate(y, month));
          }}
          onBlur={() => setDraft(null)}
          className={`${inputCls} tabular-nums disabled:opacity-50`}
        />
      </div>
    </div>
  );
}

/** Keywords typed as a comma-separated list, shown as chips. */
export function TagsField({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const id = useId();
  const [text, setText] = useState<string | null>(null);
  const shown = text ?? value.join(', ');
  const commit = (t: string) =>
    onChange(
      t
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    );
  return (
    <div className="min-w-0">
      <Label htmlFor={id} hint="Separate with commas">
        {label}
      </Label>
      <input
        id={id}
        value={shown}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => setText(null)}
        className={inputCls}
      />
    </div>
  );
}

/** 0–5 level; 0 hides it on the resume. */
export function LevelField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const names = ['Not shown', 'Beginner', 'Basic', 'Good', 'Very good', 'Expert'];
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <div role="radiogroup" aria-label={label} className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={names[n]}
              onClick={() => onChange(value === n ? 0 : n)}
              className={`size-7 rounded-lg border transition ${n <= value ? 'border-brand bg-brand' : 'border-line bg-surface hover:border-brand/50'}`}
            />
          ))}
        </div>
        <span className="text-xs text-muted">{names[value] ?? ''}</span>
      </div>
    </div>
  );
}

/**
 * Plain textarea with buttons that wrap the selection in the rich-text
 * markup (**bold**, *italic*, [link](url)) or turn lines into bullets.
 */
export function RichTextField({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  ideas,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  /** Show the "Ideas" picker with ready-made bullets or summary starters. */
  ideas?: 'bullets' | 'summary';
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement>(null);

  const edit = (fn: (sel: string) => string, selectInner = true) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = value.slice(a, b);
    const next = fn(sel);
    onChange(value.slice(0, a) + next + value.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      if (selectInner) el.setSelectionRange(a, a + next.length);
    });
  };
  const wrap = (mark: string, fallback: string) => edit((s) => `${mark}${s || fallback}${mark}`);
  const bullets = () => {
    const el = ref.current;
    if (!el) return;
    // Expand the selection to whole lines, then toggle "- " on each.
    const start = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
    const endIdx = value.indexOf('\n', el.selectionEnd);
    const end = endIdx === -1 ? value.length : endIdx;
    const lines = value.slice(start, end).split('\n');
    const allBulleted = lines.every((l) => /^\s*[-•]\s/.test(l) || !l.trim());
    const next = lines.map((l) => (allBulleted ? l.replace(/^\s*[-•]\s/, '') : l.trim() ? `- ${l.replace(/^\s*[-•]\s/, '')}` : l)).join('\n');
    onChange(value.slice(0, start) + next + value.slice(end));
    requestAnimationFrame(() => el.focus());
  };

  const btn = 'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm text-muted hover:bg-surface-2 hover:text-fg';
  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <div className="rounded-xl border border-line bg-surface transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
        <div className="flex gap-0.5 border-b border-line px-1.5 py-1" role="toolbar" aria-label={`${label} formatting`}>
          <button type="button" className={`${btn} font-bold`} onClick={() => wrap('**', 'bold text')} aria-label="Bold">
            B
          </button>
          <button type="button" className={`${btn} italic`} onClick={() => wrap('*', 'italic text')} aria-label="Italic">
            I
          </button>
          <button type="button" className={btn} onClick={() => edit((s) => `[${s || 'link text'}](https://)`, false)} aria-label="Link">
            Link
          </button>
          <button type="button" className={btn} onClick={bullets} aria-label="Bullet list">
            • List
          </button>
          {ideas && <PhrasePicker kind={ideas} onInsert={(idea) => onChange(insertIdea(value, idea, ideas))} />}
        </div>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full resize-y rounded-b-xl bg-transparent px-3.5 py-2.5 text-[0.95rem] leading-relaxed outline-none placeholder:text-muted/70"
        />
      </div>
    </div>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--brand)]" />
      {label}
    </label>
  );
}

/** Small square icon button used in card headers. */
export function IconButton({ label, onClick, children, disabled, tone = 'default' }: { label: string; onClick: () => void; children: ReactNode; disabled?: boolean; tone?: 'default' | 'danger' }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 disabled:opacity-30 disabled:hover:bg-transparent ${tone === 'danger' ? 'hover:text-danger' : 'hover:text-fg'}`}
    >
      {children}
    </button>
  );
}
