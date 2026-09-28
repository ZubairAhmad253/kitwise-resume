import { useEffect, useRef, useState } from 'react';
import { ImportError, readCvFile } from '@/lib/resume/import/extract';
import { linesFromText, parseCv, type ImportReport } from '@/lib/resume/import/parse';
import type { Resume } from '@/lib/resume/types';
import { TemplateThumb } from '@/components/resume/TemplateThumb';
import { getTemplate } from '@/templates';
import { hasContent } from './useResume';
import { Icon } from './icons';

type State = { step: 'pick' } | { step: 'reading'; name: string } | { step: 'review'; report: ImportReport; source: string } | { step: 'error'; message: string };

const ACCEPT = '.pdf,.docx,.txt,.md,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

/**
 * "Upload your CV": reads a PDF, Word or text file in the browser, shows
 * what was found and a preview in the chosen template, then fills the
 * editor. The user's template, paper and design settings are kept.
 */
export function ImportDialog({ current, onApply, onClose }: { current: Resume; onApply: (r: Resume) => void; onClose: () => void }) {
  const [state, setState] = useState<State>({ step: 'pick' });
  const [paste, setPaste] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    document.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
    };
  }, []);

  const keepSettings = (r: Resume): Resume => ({ ...r, settings: current.settings, updatedAt: new Date().toISOString() });

  const read = async (file: File | undefined) => {
    if (!file) return;
    setState({ step: 'reading', name: file.name });
    try {
      const result = await readCvFile(file);
      if (result.kind === 'backup') {
        setState({ step: 'review', report: { resume: result.resume, found: ['A complete Kitwise backup: everything is restored exactly.'], warnings: [] }, source: file.name });
        return;
      }
      const report = parseCv(result.lines);
      report.resume = keepSettings(report.resume);
      setState({ step: 'review', report, source: `${file.name} (${result.format})` });
    } catch (e) {
      setState({ step: 'error', message: e instanceof ImportError ? e.message : 'Something went wrong reading that file. Try a PDF or Word version, or paste the text.' });
    }
  };

  const readPasted = () => {
    const report = parseCv(linesFromText(paste));
    report.resume = keepSettings(report.resume);
    setState({ step: 'review', report, source: 'pasted text' });
  };

  const apply = (r: Resume) => {
    if (hasContent(current) && !window.confirm('Replace the resume you are editing with the imported one? Download a backup first (File menu) if you want to keep it.')) return;
    onApply(r);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-0 sm:p-6" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="kr-import-title" className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden bg-surface shadow-2xl sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3">
          <h2 id="kr-import-title" className="text-lg font-bold">
            Import your existing CV
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto inline-flex size-9 items-center justify-center rounded-lg hover:bg-surface-2">
            <Icon name="close" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {(state.step === 'pick' || state.step === 'error') && (
            <div className="flex flex-col gap-4">
              {state.step === 'error' && (
                <p role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                  {state.message}
                </p>
              )}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void read(e.dataTransfer.files[0]);
                }}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center ${dragging ? 'border-brand bg-brand-soft' : 'border-line'}`}
              >
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon name="file" className="size-6" />
                </span>
                <p className="font-semibold">Drop your CV here</p>
                <p className="max-w-md text-sm text-muted">PDF, Word (.docx) or text. We read it right here in your browser: the file never leaves your device.</p>
                <button type="button" onClick={() => input.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-fg hover:opacity-90">
                  <Icon name="upload" /> Choose a file
                </button>
                <input
                  ref={input}
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  data-testid="cv-file"
                  onChange={(e) => {
                    void read(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>
              {showPaste ? (
                <div className="flex flex-col gap-2">
                  <label htmlFor="kr-paste" className="text-sm font-medium">
                    Paste the text of your CV
                  </label>
                  <textarea id="kr-paste" value={paste} onChange={(e) => setPaste(e.target.value)} rows={10} className="rounded-lg border border-line bg-surface p-3 text-sm outline-none focus:border-brand" placeholder={'Jane Doe\nMarketing Manager\njane@example.com\n\nExperience\n…'} />
                  <button type="button" disabled={paste.trim().length < 20} onClick={readPasted} className="self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg disabled:opacity-40">
                    Read this text
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowPaste(true)} className="self-center text-sm text-brand underline-offset-2 hover:underline">
                  Or paste the text instead
                </button>
              )}
            </div>
          )}

          {state.step === 'reading' && (
            <div className="flex flex-col items-center gap-3 py-16 text-center" aria-live="polite">
              <span className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="font-medium">Reading {state.name}…</p>
            </div>
          )}

          {state.step === 'review' && (
            <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted">From {state.source}</p>
                <div>
                  <p className="mb-1.5 text-sm font-semibold">What we found</p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {state.report.found.map((f) => (
                      <li key={f} className="flex gap-2">
                        <Icon name="check" className="mt-0.5 size-4 shrink-0 text-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                {state.report.warnings.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-sm font-semibold">Please check</p>
                    <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-warn">
                      {state.report.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
                  Every CV is laid out differently, so give each section a quick read after importing. Your template, colours and paper size stay as they are, and you can switch templates at any time.
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
                  <button type="button" onClick={() => apply(state.report.resume)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-fg hover:opacity-90">
                    <Icon name="check" /> Use this
                  </button>
                  <button type="button" onClick={() => setState({ step: 'pick' })} className="h-10 rounded-lg border border-line px-4 text-sm font-medium hover:bg-surface-2">
                    Try another file
                  </button>
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="mb-1.5 text-center text-xs text-muted">Preview in {getTemplate(state.report.resume.settings.template).name}</p>
                <div className="overflow-hidden rounded-md shadow ring-1 ring-line">
                  <TemplateThumb resume={state.report.resume} template={getTemplate(state.report.resume.settings.template)} width={230} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
