import { useEffect, useMemo, useRef, useState } from 'react';
import { sampleById } from '@/lib/resume/samples';
import type { Resume } from '@/lib/resume/types';
import { TemplateThumb } from '@/components/resume/TemplateThumb';
import { TEMPLATES } from '@/templates';
import { hasContent } from './useResume';
import { Icon } from './icons';

const ALL = 'All designs';

/**
 * Full-screen picker showing every template as a live thumbnail of the
 * user's own resume (or an example while theirs is still empty).
 */
export function TemplateGallery({ resume, onPick, onClose }: { resume: Resume; onPick: (id: string) => void; onClose: () => void }) {
  const [category, setCategory] = useState(ALL);
  const dialog = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => [ALL, ...new Set(TEMPLATES.map((t) => t.category))], []);
  const shown = category === ALL ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  // An empty resume makes blank thumbnails; show an example in the user's settings instead.
  const preview = useMemo(() => (hasContent(resume) ? resume : { ...sampleById('software')!.build(), settings: resume.settings }), [resume]);

  // Keep the latest close handler without re-running the open/close effect.
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    document.addEventListener('keydown', key);
    dialog.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 sm:p-6" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="kr-gallery-title" className="flex max-h-full w-full max-w-6xl flex-col overflow-hidden bg-surface shadow-2xl sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
          <h2 id="kr-gallery-title" className="text-lg font-bold">
            Choose a template
          </h2>
          <span className="text-sm text-muted">{TEMPLATES.length} designs, all free. Your content moves with you.</span>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto inline-flex size-9 items-center justify-center rounded-lg hover:bg-surface-2">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-line px-4 py-2.5 sm:px-6" role="toolbar" aria-label="Filter by field">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`h-8 shrink-0 rounded-full border px-3 text-sm ${category === c ? 'border-brand bg-brand text-brand-fg' : 'border-line text-muted hover:text-fg'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-surface-2 p-4 sm:p-6">
          <ul className="grid grid-cols-[repeat(auto-fill,200px)] justify-center gap-5">
            {shown.map((t) => {
              const current = resume.settings.template === t.id;
              return (
                <li key={t.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '180px 330px' }}>
                  <button
                    type="button"
                    aria-pressed={current}
                    onClick={() => onPick(t.id)}
                    className={`group block w-full rounded-xl border-2 bg-surface p-2 text-left transition ${current ? 'border-brand' : 'border-transparent hover:border-brand/40'}`}
                  >
                    <div className="relative overflow-hidden rounded-md shadow-sm ring-1 ring-line">
                      <TemplateThumb resume={preview} template={t} width={180} />
                      {current && (
                        <span className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-brand text-brand-fg shadow">
                          <Icon name="check" className="size-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-semibold">
                      {t.number}. {t.name}
                    </p>
                    <p className="text-xs text-muted">{t.category}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{t.description}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
