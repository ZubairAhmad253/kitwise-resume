import { uid } from '@/lib/resume/defaults';
import { KINDS, SECTION_KINDS } from '@/lib/resume/schema';
import type { Action } from '@/lib/resume/store';
import type { Resume } from '@/lib/resume/types';
import { Icon } from './icons';

/** Grid of section types; types already on the resume (except custom) are marked. */
export function AddSection({ resume, dispatch, onAdded }: { resume: Resume; dispatch: (a: Action) => void; onAdded: (id: string) => void }) {
  const used = new Set(resume.sections.map((s) => s.kind));
  return (
    <div className="card p-4">
      <p className="font-semibold">Add a section</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {SECTION_KINDS.map((kind) => {
          const taken = used.has(kind) && kind !== 'custom';
          return (
            <button
              key={kind}
              type="button"
              onClick={() => {
                const id = uid('s');
                dispatch({ type: 'addSection', kind, id });
                onAdded(id);
              }}
              className="flex items-start gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-left hover:border-brand/50"
            >
              <Icon name="plus" className="mt-0.5 size-4 shrink-0 text-brand" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {KINDS[kind].label}
                  {taken && <span className="ml-1.5 text-xs font-normal text-muted">(already added)</span>}
                </span>
                <span className="block text-xs text-muted">{KINDS[kind].hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
