import { useId, useState } from 'react';
import { greetingFor, LETTER_STARTERS, letterDate } from '@/lib/resume/letters';
import type { Action } from '@/lib/resume/store';
import type { CoverLetter, Resume } from '@/lib/resume/types';
import { RichTextField, TextField } from './fields';
import { Icon } from './icons';

/**
 * The cover letter form. Name, job title and contact details come from the
 * resume (Personal details), so they're only typed once.
 */
export function LetterEditor({ resume, dispatch }: { resume: Resume; dispatch: (a: Action) => void }) {
  const l = resume.letter;
  const set = (patch: Partial<CoverLetter>) => dispatch({ type: 'letter', patch });
  const [starter, setStarter] = useState(LETTER_STARTERS[0].id);
  const addressId = useId();

  const useStarter = () => {
    const s = LETTER_STARTERS.find((x) => x.id === starter)!;
    if (l.body.trim() && !window.confirm('Replace the letter text with this starter? Your current text will be lost.')) return;
    set({ body: s.body(resume) });
  };

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <p className="font-semibold">Who it’s for</p>
        <p className="text-sm text-muted">Your name and contact details come from the resume. Address the letter to a person when you can find their name.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Recipient’s name"
            value={l.recipientName}
            // The greeting follows the name until the user writes their own.
            onChange={(v) => set(l.greeting === greetingFor(l.recipientName) ? { recipientName: v, greeting: greetingFor(v) } : { recipientName: v })}
            placeholder="e.g. Ms Fatima Ahmed"
          />
          <TextField label="Their job title" value={l.recipientTitle} onChange={(v) => set({ recipientTitle: v })} placeholder="e.g. Head of Talent" />
          <TextField label="Company" value={l.company} onChange={(v) => set({ company: v })} />
          <TextField label="Date" value={l.date} onChange={(v) => set({ date: v })} placeholder={letterDate({ ...resume, letter: { ...l, date: '' } })} hint="Empty = today" />
        </div>
        <div className="min-w-0">
          <label htmlFor={addressId} className="mb-1.5 block text-sm font-medium">
            Address <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea dir="auto"
            id={addressId}
            rows={2}
            value={l.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder={'Tower 3, West Bay\nDoha, Qatar'}
            className="block w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[0.95rem] outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </div>
        <TextField label="Subject line" value={l.subject} onChange={(v) => set({ subject: v })} placeholder="e.g. Application for Senior Nurse (ref. 1234)" hint="Optional" />
      </div>

      <div className="card space-y-3 p-4">
        <p className="font-semibold">The letter</p>
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-surface-2 p-3">
          <label className="min-w-0 flex-1 text-sm">
            <span className="mb-1 block font-medium">Start from a template letter</span>
            <select value={starter} onChange={(e) => setStarter(e.target.value)} className="h-9 w-full rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-brand">
              {LETTER_STARTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}: {s.hint}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={useStarter} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-semibold text-brand-fg hover:opacity-90">
            <Icon name="sparkle" className="size-3.5" /> Use it
          </button>
        </div>
        <TextField label="Greeting" value={l.greeting} onChange={(v) => set({ greeting: v })} placeholder="Dear Ms Ahmed," />
        <RichTextField
          label="Letter text"
          value={l.body}
          onChange={(v) => set({ body: v })}
          rows={14}
          placeholder={'Three or four short paragraphs:\n1. The role you’re applying for and why you fit.\n2. One or two achievements that match the job ad.\n3. Why this company, and a friendly close.'}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Closing" value={l.closing} onChange={(v) => set({ closing: v })} placeholder="Kind regards," />
          <TextField label="Signature" value={l.signature} onChange={(v) => set({ signature: v })} placeholder={resume.basics.name || 'Your name'} hint="Empty = your name" />
        </div>
        <p className="text-xs text-muted">Keep it to one page: about 250 to 400 words. Replace every part in [square brackets] before you send it.</p>
      </div>
    </div>
  );
}
