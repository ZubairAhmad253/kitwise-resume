import { useEffect, useState } from 'react';
import { AddSection } from './AddSection';
import { BasicsEditor } from './BasicsEditor';
import { PreviewPanel } from './PreviewPanel';
import { SectionEditor } from './SectionEditor';
import { Toolbar } from './Toolbar';
import { useReorder } from './useReorder';
import { useResume } from './useResume';

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

        <div className={`min-h-0 ${tab === 'preview' ? '' : 'hidden lg:block'}`}>
          <PreviewPanel resume={resume} dispatch={dispatch} />
        </div>
      </div>
    </div>
  );
}
