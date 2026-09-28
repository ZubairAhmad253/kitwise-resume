import { useEffect, useState } from 'react';
import { formatRange } from '@/lib/resume/dates';
import { singleDate } from '@/lib/resume/schema';
import type { Resume } from '@/lib/resume/types';
import { RichText } from '@/components/resume/RichText';
import { AddSection } from './AddSection';
import { BasicsEditor } from './BasicsEditor';
import { SectionEditor } from './SectionEditor';
import { Toolbar } from './Toolbar';
import { useReorder } from './useReorder';
import { useResume } from './useResume';

/** Plain preview of the content; replaced by the paged template preview in the next phase. */
function DraftPreview({ resume }: { resume: Resume }) {
  const { basics, settings } = resume;
  return (
    <article className="mx-auto max-w-[210mm] rounded-sm bg-white p-10 text-[13px] leading-relaxed text-slate-800 shadow-xl">
      <h2 className="text-2xl font-bold text-slate-900">{basics.name || 'Your name'}</h2>
      {basics.headline && <p className="font-medium text-indigo-700">{basics.headline}</p>}
      <p className="mt-1 text-xs text-slate-500">{[basics.email, basics.phone, basics.location, basics.website, basics.linkedin, basics.github].filter(Boolean).join(' · ')}</p>
      {basics.summary && <RichText source={basics.summary} className="mt-4" />}
      {resume.sections
        .filter((s) => !s.hidden && s.items.length)
        .map((s) => (
          <section key={s.id} className="mt-5">
            <h3 className="border-b border-slate-200 pb-1 text-xs font-bold tracking-widest text-slate-900 uppercase">{s.title}</h3>
            {s.items.map((it) => (
              <div key={it.id} className="mt-2.5">
                <div className="flex justify-between gap-4">
                  <p className="font-semibold text-slate-900">
                    {it.title}
                    {it.subtitle && <span className="font-normal text-slate-600"> · {it.subtitle}</span>}
                  </p>
                  <p className="shrink-0 text-xs text-slate-500">{formatRange(it.start, it.end, it.current, settings.dateFormat, singleDate(s.kind))}</p>
                </div>
                {it.tags.length > 0 && <p className="text-xs text-slate-600">{it.tags.join(' · ')}</p>}
                {it.description && <RichText source={it.description} className="mt-1 [&_.rt-li]:ml-4 [&_.rt-li]:list-disc" />}
              </div>
            ))}
          </section>
        ))}
    </article>
  );
}

export default function BuilderApp() {
  const { resume, dispatch, savedAt, saveError } = useResume();
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const sections = useReorder((from, to) => dispatch({ type: 'moveSection', from, to }));

  // Scroll a newly added section into view.
  useEffect(() => {
    if (!justAdded) return;
    document.getElementById(`section-${justAdded}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setJustAdded(null);
  }, [justAdded, resume.sections.length]);

  return (
    <div className="flex h-full flex-col">
      <Toolbar resume={resume} dispatch={dispatch} savedAt={savedAt} saveError={saveError} />

      <div className="flex border-b border-line bg-surface lg:hidden" role="tablist">
        {(['edit', 'preview'] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 py-2.5 text-sm font-semibold capitalize ${tab === t ? 'border-b-2 border-brand text-brand' : 'text-muted'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
        <div className={`min-h-0 overflow-y-auto border-line bg-bg lg:border-r ${tab === 'edit' ? '' : 'hidden lg:block'}`}>
          <div className="space-y-4 p-3 sm:p-5">
            <div className="card p-4">
              <p className="mb-4 font-semibold">Personal details</p>
              <BasicsEditor basics={resume.basics} onChange={(patch) => dispatch({ type: 'basics', patch })} />
            </div>
            {resume.sections.map((s, i) => (
              <div key={s.id} id={`section-${s.id}`} {...sections.item(i)} className={`rounded-2xl transition ${sections.over === i && sections.dragging !== i ? 'ring-2 ring-brand' : ''} ${sections.dragging === i ? 'opacity-50' : ''}`}>
                <SectionEditor section={s} index={i} total={resume.sections.length} dispatch={dispatch} dragHandle={sections.handle(i)} />
              </div>
            ))}
            <AddSection resume={resume} dispatch={dispatch} onAdded={setJustAdded} />
          </div>
        </div>

        <div className={`min-h-0 overflow-y-auto bg-surface-2 p-4 sm:p-8 ${tab === 'preview' ? '' : 'hidden lg:block'}`} aria-label="Resume preview">
          <DraftPreview resume={resume} />
        </div>
      </div>
    </div>
  );
}
