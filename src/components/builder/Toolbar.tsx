import { useEffect, useRef, useState, type ReactNode } from 'react';
import { emptyResume } from '@/lib/resume/defaults';
import { normalizeResume } from '@/lib/resume/normalize';
import { SAMPLES } from '@/lib/resume/samples';
import type { Action } from '@/lib/resume/store';
import type { Resume } from '@/lib/resume/types';
import { ImportDialog } from './ImportDialog';
import { hasContent } from './useResume';
import { Icon } from './icons';

/** Dropdown menu that closes on outside click or Escape. */
function Menu({ label, icon, children }: { label: string; icon: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
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
  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-brand/40">
        {icon}
        <span className="hidden sm:inline">{label}</span>
        <Icon name="chevron" className="size-3.5 text-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-2xl">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const menuItem = 'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'resume';

export function Toolbar({ resume, dispatch, savedAt, saveError }: { resume: Resume; dispatch: (a: Action) => void; savedAt: Date | null; saveError: boolean }) {
  const file = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);

  // Links like /builder?import=1 open the importer straight away.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('import') !== '1') return;
    setImporting(true);
    url.searchParams.delete('import');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, []);

  const replace = (next: Resume, what: string) => {
    if (hasContent(resume) && !window.confirm(`Replace your current resume with ${what}? Download a backup first if you want to keep it.`)) return;
    dispatch({ type: 'replace', resume: next });
  };

  const backup = () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug(resume.basics.name || resume.name)}-kitwise-resume.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const restore = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = normalizeResume(JSON.parse(await f.text()));
      if (!data) throw new Error('not a resume');
      replace({ ...data, updatedAt: new Date().toISOString() }, 'the backup');
      setNotice('');
    } catch {
      setNotice('That file isn’t a Kitwise Resume backup.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface px-3 py-2 sm:px-4">
      <input
        aria-label="Document name"
        value={resume.name}
        onChange={(e) => dispatch({ type: 'rename', name: e.target.value })}
        className="h-9 w-40 min-w-0 rounded-lg bg-transparent px-2 font-semibold outline-none hover:bg-surface-2 focus:bg-surface-2 focus:ring-2 focus:ring-brand/20 sm:w-56"
      />
      <span className={`hidden text-xs md:inline ${saveError ? 'text-danger' : 'text-muted'}`} aria-live="polite">
        {saveError ? 'Couldn’t save in this browser (storage full or blocked). Download a backup.' : savedAt ? `Saved on this device · ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved on this device'}
      </span>
      {notice && (
        <span className="text-xs text-danger" role="alert">
          {notice}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={() => setImporting(true)} aria-haspopup="dialog" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand/40 bg-brand-soft px-3 text-sm font-medium text-fg hover:border-brand">
          <Icon name="upload" />
          <span>
            Import<span className="hidden sm:inline"> CV</span>
          </span>
        </button>
        <Menu label="Examples" icon={<Icon name="sparkle" />}>
          {(close) => (
            <>
              <p className="px-3 pt-1 pb-2 text-xs text-muted">Start from an example and edit it. Your current resume is replaced.</p>
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    close();
                    replace(s.build(), `the “${s.label}” example`);
                  }}
                >
                  <span>
                    <span className="block font-medium">{s.label}</span>
                    <span className="block text-xs text-muted">{s.field}</span>
                  </span>
                </button>
              ))}
            </>
          )}
        </Menu>
        <Menu label="File" icon={<Icon name="download" />}>
          {(close) => (
            <>
              <button type="button" role="menuitem" className={menuItem} onClick={() => (close(), backup())}>
                <Icon name="download" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-medium">Download backup</span>
                  <span className="block text-xs text-muted">Save your resume data as a file, to keep or move to another device.</span>
                </span>
              </button>
              <button type="button" role="menuitem" className={menuItem} onClick={() => (close(), file.current?.click())}>
                <Icon name="upload" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-medium">Open backup</span>
                  <span className="block text-xs text-muted">Load a backup file you saved earlier.</span>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItem}
                onClick={() => {
                  close();
                  replace(emptyResume(), 'a blank resume');
                }}
              >
                <Icon name="reset" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-medium">Start over</span>
                  <span className="block text-xs text-muted">Clear everything and begin with a blank resume.</span>
                </span>
              </button>
            </>
          )}
        </Menu>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void restore(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      {importing && (
        <ImportDialog
          current={resume}
          onClose={() => setImporting(false)}
          onApply={(r) => {
            dispatch({ type: 'replace', resume: r });
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}
