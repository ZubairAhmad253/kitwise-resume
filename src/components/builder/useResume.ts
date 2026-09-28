import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { emptyResume, uid } from '@/lib/resume/defaults';
import { loadIndex, openCurrent, readResume, removeResume, saveResume, setCurrent, type LibraryEntry } from '@/lib/resume/library';
import { sampleById } from '@/lib/resume/samples';
import { reducer, type Action } from '@/lib/resume/store';
import type { Resume } from '@/lib/resume/types';
import { TEMPLATES } from '@/templates';

/** True once the user has typed anything worth protecting. */
export const hasContent = (r: Resume) => Boolean(r.basics.name || r.basics.summary || r.sections.some((s) => s.items.length > 0));

const store = () => (typeof window === 'undefined' ? null : window.localStorage);

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** An example from `?sample=<id>` (with optional `&template=`, `&paper=` and `&fit=1`), or null. */
function sampleFromUrl(): Resume | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const sample = sampleById(params.get('sample') ?? '');
  if (!sample) return null;
  const r = sample.build();
  const template = params.get('template');
  if (template && TEMPLATES.some((t) => t.id === template)) r.settings.template = template;
  const paper = params.get('paper');
  if (paper === 'A4' || paper === 'Letter' || paper === 'Legal') r.settings.paper = paper;
  if (params.get('fit') === '1') r.settings.fitOnePage = true;
  return r;
}

/**
 * The resume being edited, and the library of all resumes in this browser.
 * Changes are saved half a second after each edit. `?sample=<id>` opens an
 * example as a new resume, so nothing already saved is replaced.
 */
export function useResume() {
  const [resume, dispatch] = useReducer(reducer, null, () => {
    const s = store();
    return sampleFromUrl() ?? (s ? safe(() => openCurrent(s), null) : null) ?? emptyResume();
  });
  const [library, setLibrary] = useState<LibraryEntry[]>(() => {
    const s = store();
    return s ? safe(() => loadIndex(s).entries, []) : [];
  });
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);
  const latest = useRef(resume);
  latest.current = resume;
  const known = useRef(library);
  known.current = library;

  /** Saves a resume, unless it is a blank one nobody has touched (those would only clutter the list). */
  const persist = useCallback((r: Resume) => {
    const s = store();
    if (!s || (!hasContent(r) && !known.current.some((e) => e.id === r.id))) return;
    try {
      setLibrary(saveResume(s, r));
      setSavedAt(new Date());
      setSaveError(false);
    } catch {
      // Storage full or blocked (private mode): keep editing, warn the user.
      setSaveError(true);
    }
  }, []);

  useEffect(() => {
    // Drop ?sample= so a reload doesn't open another copy.
    const url = new URL(window.location.href);
    if (url.searchParams.has('sample')) {
      for (const k of ['sample', 'template', 'paper', 'fit']) url.searchParams.delete(k);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => persist(resume), 500);
    return () => clearTimeout(t);
  }, [resume, persist]);

  /** Saves the open resume now, then shows another one. */
  const show = useCallback(
    (next: Resume) => {
      persist(latest.current);
      dispatch({ type: 'replace', resume: next });
      persist(next);
    },
    [persist],
  );

  const open = useCallback(
    (id: string) => {
      const s = store();
      const r = s && safe(() => readResume(s, id), null);
      if (!r) return;
      show(r);
      safe(() => setCurrent(s!, id), undefined);
    },
    [show],
  );

  /** Adds a resume (blank, an example, an import or a backup) as a new entry and opens it. */
  const create = useCallback((r: Resume = emptyResume()) => show({ ...r, id: uid('r'), updatedAt: new Date().toISOString() }), [show]);

  const duplicate = useCallback(() => create({ ...latest.current, name: `${latest.current.name} (copy)` }), [create]);

  const remove = useCallback(
    (id: string) => {
      const s = store();
      if (!s) return;
      const left = safe(() => removeResume(s, id), library);
      setLibrary(left);
      if (id !== latest.current.id) return;
      const next = left[0] && safe(() => readResume(s, left[0].id), null);
      dispatch({ type: 'replace', resume: next ?? emptyResume() });
    },
    [library],
  );

  const act = useCallback((a: Action) => dispatch(a), []);
  return { resume, dispatch: act, savedAt, saveError, library, open, create, duplicate, remove };
}
