import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PHRASE_FIELDS } from '@/lib/resume/assist/phrases';
import { Icon } from './icons';

/** The field to open the picker on (guessed from the resume's job titles). */
export const PhraseFieldContext = createContext('management');

/**
 * "Ideas": ready-made bullet points or summary starters for a field.
 * Clicking one adds it to the text; the picker stays open for more.
 */
export function PhrasePicker({ kind, onInsert }: { kind: 'bullets' | 'summary'; onInsert: (text: string) => void }) {
  const guessed = useContext(PhraseFieldContext);
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(guessed);
  const [query, setQuery] = useState('');
  const [added, setAdded] = useState<string[]>([]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setField(guessed), [guessed]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fields = q ? PHRASE_FIELDS : PHRASE_FIELDS.filter((f) => f.id === field);
    return fields.flatMap((f) => (kind === 'bullets' ? f.bullets : f.summaries)).filter((p) => !q || p.toLowerCase().includes(q));
  }, [field, query, kind]);

  return (
    <div ref={root} className="relative ml-auto">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-brand hover:bg-brand-soft">
        <Icon name="sparkle" className="size-3.5" /> Ideas
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-1 w-[min(26rem,85vw)] rounded-xl border border-line bg-surface p-3 shadow-2xl">
          <div className="flex gap-2">
            <select value={field} onChange={(e) => setField(e.target.value)} className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-brand" aria-label="Field">
              {PHRASE_FIELDS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all" aria-label="Search ideas" className="h-8 w-28 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-brand" />
          </div>
          <p className="mt-2 text-xs text-muted">Click to add. Then replace the parts in [brackets] with your own facts.</p>
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
            {list.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => {
                    onInsert(p);
                    setAdded((a) => [...a, p]);
                  }}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2"
                >
                  <Icon name={added.includes(p) ? 'check' : 'plus'} className={`mt-0.5 size-3.5 shrink-0 ${added.includes(p) ? 'text-accent' : 'text-muted'}`} />
                  <span>{p}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-2 py-3 text-sm text-muted">No ideas match “{query}”.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Adds an idea to existing text: as a new bullet, or as the summary (a new paragraph if there is text already). */
export function insertIdea(value: string, idea: string, kind: 'bullets' | 'summary'): string {
  const trimmed = value.replace(/\s+$/, '');
  if (kind === 'summary') return trimmed ? `${trimmed}\n\n${idea}` : idea;
  return trimmed ? `${trimmed}\n- ${idea}` : `- ${idea}`;
}
