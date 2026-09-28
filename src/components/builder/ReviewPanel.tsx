import { useMemo, useState } from 'react';
import { matchJob, reviewResume, type Check } from '@/lib/resume/assist/review';
import type { Resume } from '@/lib/resume/types';
import { Icon } from './icons';

const LEVELS: { level: Check['level']; title: string; tone: string }[] = [
  { level: 'fix', title: 'Fix these', tone: 'text-danger' },
  { level: 'tip', title: 'Make it stronger', tone: 'text-warn' },
  { level: 'good', title: 'Looking good', tone: 'text-accent' },
];

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? 'var(--accent)' : score >= 55 ? 'var(--warn)' : 'var(--danger)';
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0" role="img" aria-label={`Score ${score} out of 100`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--fg)">
        {score}
      </text>
    </svg>
  );
}

/** The resume check: score, what to fix, and how well a pasted job ad matches. */
export function ReviewPanel({ resume, pageCount }: { resume: Resume; pageCount: number }) {
  const review = useMemo(() => reviewResume(resume, pageCount), [resume, pageCount]);
  const [ad, setAd] = useState('');
  const match = useMemo(() => (ad.trim().length > 40 ? matchJob(resume, ad) : null), [resume, ad]);
  const count = (l: Check['level']) => review.checks.filter((c) => c.level === l).length;
  const verdict = review.score >= 85 ? 'Ready to send' : review.score >= 65 ? 'Nearly there' : 'Needs work';

  return (
    <div className="grid max-h-[55vh] gap-4 overflow-y-auto border-b border-line bg-surface px-3 py-3 sm:px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <ScoreRing score={review.score} />
          <div>
            <p className="font-semibold">{verdict}</p>
            <p className="text-sm text-muted">
              {count('fix')} to fix · {count('tip')} tips. Checked on this device; nothing is sent anywhere.
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {LEVELS.map(({ level, title, tone }) => {
            const list = review.checks.filter((c) => c.level === level);
            if (!list.length) return null;
            return (
              <div key={level}>
                <p className={`text-xs font-semibold tracking-wide uppercase ${tone}`}>{title}</p>
                <ul className="mt-1 space-y-1.5">
                  {list.map((c) => (
                    <li key={c.id} className="flex gap-2 text-sm">
                      <Icon name={level === 'good' ? 'check' : level === 'fix' ? 'close' : 'sparkle'} className={`mt-0.5 size-4 shrink-0 ${tone}`} />
                      <span>
                        {c.message}
                        {c.where && <span className="text-muted"> ({c.where})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <div className="min-w-0">
        <label htmlFor="kr-ad" className="text-xs font-semibold tracking-wide text-muted uppercase">
          Match a job ad
        </label>
        <textarea
          id="kr-ad"
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          rows={5}
          placeholder="Paste the job description to see which of its key words your resume uses."
          className="mt-1.5 block w-full resize-y rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-brand"
        />
        {match && (
          <div className="mt-2 space-y-2 text-sm">
            <p>
              <span className="font-semibold">{match.score}% match.</span> <span className="text-muted">Add the missing words where they are true for you, in your skills and bullet points.</span>
            </p>
            {match.missing.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="Missing keywords">
                {match.missing.map((t) => (
                  <span key={t} className="rounded-full border border-danger/30 bg-danger/5 px-2 py-0.5 text-xs text-danger">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {match.matched.length > 0 && (
              <div className="flex flex-wrap gap-1.5" aria-label="Keywords found">
                {match.matched.map((t) => (
                  <span key={t} className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
