import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { emptyResume } from '@/lib/resume/defaults';
import { normalizeResume } from '@/lib/resume/normalize';
import { sampleById } from '@/lib/resume/samples';
import { reducer, type Action } from '@/lib/resume/store';
import type { Resume } from '@/lib/resume/types';

export const STORAGE_KEY = 'kitwise-resume:current';

function readSaved(): Resume | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeResume(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** True once the user has typed anything worth protecting. */
export const hasContent = (r: Resume) => Boolean(r.basics.name || r.basics.summary || r.sections.some((s) => s.items.length > 0));

/**
 * The resume being edited: loaded from this browser on first render,
 * saved back half a second after each change. `?sample=<id>` in the URL
 * opens that example instead (asking first if there's work to lose).
 */
export function useResume() {
  const [resume, dispatch] = useReducer(reducer, null, () => {
    const saved = typeof window === 'undefined' ? null : readSaved();
    const sampleId = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('sample');
    const sample = sampleId ? sampleById(sampleId) : undefined;
    if (sample && (!saved || !hasContent(saved) || window.confirm(`Replace your current resume with the “${sample.label}” example?`))) return sample.build();
    return saved ?? emptyResume();
  });
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Drop ?sample= so a reload doesn't ask again.
    const url = new URL(window.location.href);
    if (url.searchParams.has('sample')) {
      url.searchParams.delete('sample');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      // Save immediately if we just loaded an example, so it survives a reload.
      if (readSaved()?.id === resume.id) return;
    }
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
        setSavedAt(new Date());
        setSaveError(false);
      } catch {
        // Storage full or blocked (private mode): keep editing, warn the user.
        setSaveError(true);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [resume]);

  const act = useCallback((a: Action) => dispatch(a), []);
  return { resume, dispatch: act, savedAt, saveError };
}
