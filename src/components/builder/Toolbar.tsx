import { useEffect, useRef, useState, type ReactNode } from 'react';
import { toDocx } from '@/lib/resume/export/docx';
import { toLetterText, toMarkdown, toPlainText } from '@/lib/resume/export/text';
import { letterDate } from '@/lib/resume/letters';
import type { LibraryEntry } from '@/lib/resume/library';
import { normalizeResume } from '@/lib/resume/normalize';
import { SAMPLES } from '@/lib/resume/samples';
import type { Action } from '@/lib/resume/store';
import type { Resume } from '@/lib/resume/types';
import { getTemplate } from '@/templates';
import { ImportDialog } from './ImportDialog';
import { Icon } from './icons';

/** Dropdown menu that closes on outside click or Escape. */
function Menu({ label, icon, children, width = 'w-72' }: { label: string; icon: ReactNode; children: (close: () => void) => ReactNode; width?: string }) {
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
        <div role="menu" className={`absolute right-0 z-30 mt-2 ${width} max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-2xl`}>
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

function download(data: BlobPart, type: string, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const when = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date().toDateString() === d.toDateString();
  return today ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

export interface LibraryActions {
  library: LibraryEntry[];
  open: (id: string) => void;
  create: (r?: Resume) => void;
  duplicate: () => void;
  remove: (id: string) => void;
}

export function Toolbar({
  resume,
  dispatch,
  savedAt,
  saveError,
  lib,
  doc = 'resume',
}: {
  resume: Resume;
  dispatch: (a: Action) => void;
  savedAt: Date | null;
  saveError: boolean;
  lib: LibraryActions;
  /** The document open in the builder; downloads export this one. */
  doc?: 'resume' | 'letter';
}) {
  const file = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const [importing, setImporting] = useState(false);
  const letter = doc === 'letter';
  const base = `${slug(resume.basics.name || resume.name)}${letter ? '-cover-letter' : ''}`;

  // Links like /builder?import=1 open the importer straight away.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('import') !== '1') return;
    setImporting(true);
    url.searchParams.delete('import');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, []);

  const restore = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = normalizeResume(JSON.parse(await f.text()));
      if (!data) throw new Error('not a resume');
      lib.create(data);
      setNotice('');
    } catch {
      setNotice('That file isn’t a Kitwise Resume backup.');
    }
  };

  const others = lib.library.filter((e) => e.id !== resume.id);

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

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setImporting(true)} aria-haspopup="dialog" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-brand/40 bg-brand-soft px-3 text-sm font-medium text-fg hover:border-brand">
          <Icon name="upload" />
          <span>
            Import<span className="hidden sm:inline"> CV</span>
          </span>
        </button>

        <Menu label={`My resumes${lib.library.length > 1 ? ` (${lib.library.length})` : ''}`} icon={<Icon name="copy" />} width="w-80">
          {(close) => (
            <>
              <p className="px-3 pt-1 pb-2 text-xs text-muted">Saved in this browser. Keep a version for each kind of job.</p>
              <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-3 py-2 text-sm">
                <Icon name="check" className="size-4 shrink-0 text-brand" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{resume.name}</span>
                  <span className="block text-xs text-muted">Open now · {getTemplate(resume.settings.template).name}</span>
                </span>
              </div>
              {others.length > 0 && (
                <ul className="mt-1 max-h-64 overflow-y-auto">
                  {others.map((e) => (
                    <li key={e.id} className="group flex items-center gap-1 rounded-lg hover:bg-surface-2">
                      <button type="button" role="menuitem" className="min-w-0 flex-1 px-3 py-2 text-left text-sm" onClick={() => (close(), lib.open(e.id))}>
                        <span className="block truncate font-medium">{e.name}</span>
                        <span className="block text-xs text-muted">
                          {when(e.updatedAt)} · {getTemplate(e.template).name}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${e.name}`}
                        className="mr-1 grid size-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                        onClick={() => window.confirm(`Delete “${e.name}”? This can’t be undone.`) && lib.remove(e.id)}
                      >
                        <Icon name="trash" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-1 border-t border-line pt-1">
                <button type="button" role="menuitem" className={menuItem} onClick={() => (close(), lib.duplicate())}>
                  <Icon name="copy" className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="block font-medium">Duplicate this resume</span>
                    <span className="block text-xs text-muted">Make a copy to tailor for another job.</span>
                  </span>
                </button>
                <button type="button" role="menuitem" className={menuItem} onClick={() => (close(), lib.create())}>
                  <Icon name="plus" className="mt-0.5 size-4 shrink-0" />
                  <span className="block font-medium">New blank resume</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={`${menuItem} text-danger`}
                  onClick={() => {
                    if (!window.confirm(`Delete “${resume.name}”? This can’t be undone.`)) return;
                    close();
                    lib.remove(resume.id);
                  }}
                >
                  <Icon name="trash" className="mt-0.5 size-4 shrink-0" />
                  <span className="block font-medium">Delete this resume</span>
                </button>
              </div>
            </>
          )}
        </Menu>

        <Menu label="Examples" icon={<Icon name="sparkle" />}>
          {(close) => (
            <>
              <p className="px-3 pt-1 pb-2 text-xs text-muted">Opens as a new resume; your own resumes are kept.</p>
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    close();
                    lib.create(s.build());
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
              <p className="px-3 pt-1 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">Download {letter ? 'cover letter' : 'resume'} as</p>
              <button type="button" role="menuitem" className={menuItem} onClick={() => (close(), download(toDocx(resume, doc) as BlobPart, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', `${base}.docx`))}>
                <Icon name="file" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-medium">Word document (.docx)</span>
                  <span className="block text-xs text-muted">A simple, editable version for employers who ask for Word.</span>
                </span>
              </button>
              <button type="button" role="menuitem" className={menuItem} onClick={() => (close(), download(letter ? toLetterText(resume, letterDate(resume)) : toPlainText(resume), 'text/plain;charset=utf-8', `${base}.txt`))}>
                <Icon name="file" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-medium">Plain text (.txt)</span>
                  <span className="block text-xs text-muted">For job sites that ask you to paste your CV.</span>
                </span>
              </button>
              {!letter && (
              <button type="button" role="menuitem" className={menuItem} onClick={() => (close(), download(toMarkdown(resume), 'text/markdown;charset=utf-8', `${base}.md`))}>
                <Icon name="file" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="block font-medium">Markdown (.md)</span>
                  <span className="block text-xs text-muted">For GitHub profiles, portfolios and notes apps.</span>
                </span>
              </button>
              )}
              <div className="mt-1 border-t border-line pt-1">
                <button type="button" role="menuitem" className={menuItem} onClick={() => (close(), download(JSON.stringify(resume, null, 2), 'application/json', `${base}-kitwise-resume.json`))}>
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
                    <span className="block text-xs text-muted">Load a backup file as a new resume.</span>
                  </span>
                </button>
              </div>
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
            lib.create(r);
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}
