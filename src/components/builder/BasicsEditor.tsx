import { useRef, useState } from 'react';
import type { Basics } from '@/lib/resume/types';
import { RichTextField, TextField } from './fields';
import { Icon } from './icons';

/** Reads an image file, crops it to a centred square and returns a small JPEG data URL. */
async function photoToDataUrl(file: File, size = 400): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that image.'));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function BasicsEditor({ basics, onChange }: { basics: Basics; onChange: (patch: Partial<Basics>) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState('');

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setPhotoError('');
    if (!f.type.startsWith('image/')) return setPhotoError('Please choose an image file (JPG or PNG).');
    try {
      onChange({ photo: await photoToDataUrl(f) });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Could not read that image.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-surface-2 text-muted">
          {basics.photo ? <img src={basics.photo} alt="Your photo" className="size-full object-cover" /> : <Icon name="image" className="size-7" />}
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => file.current?.click()} className="h-9 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:border-brand/50">
              {basics.photo ? 'Change photo' : 'Add photo'}
            </button>
            {basics.photo && (
              <button type="button" onClick={() => onChange({ photo: '' })} className="h-9 rounded-lg px-3 text-sm text-muted hover:text-danger">
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-muted">Optional. Common in the Gulf and Europe, usually left out in the US and UK.</p>
          {photoError && <p className="text-xs text-danger">{photoError}</p>}
        </div>
        <input
          ref={file}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label="Full name" value={basics.name} onChange={(v) => onChange({ name: v })} autoComplete="name" placeholder="e.g. Aisha Rahman" />
        <TextField label="Job title" value={basics.headline} onChange={(v) => onChange({ headline: v })} placeholder="e.g. Senior Software Engineer" />
        <TextField label="Email" type="email" value={basics.email} onChange={(v) => onChange({ email: v })} autoComplete="email" />
        <TextField label="Phone" type="tel" value={basics.phone} onChange={(v) => onChange({ phone: v })} autoComplete="tel" />
        <TextField label="Location" value={basics.location} onChange={(v) => onChange({ location: v })} placeholder="City, country" />
        <TextField label="Website" type="url" value={basics.website} onChange={(v) => onChange({ website: v })} placeholder="yourname.com" />
        <TextField label="LinkedIn" value={basics.linkedin} onChange={(v) => onChange({ linkedin: v })} placeholder="linkedin.com/in/…" />
        <TextField label="GitHub" value={basics.github} onChange={(v) => onChange({ github: v })} placeholder="github.com/…" hint="Optional" />
      </div>
      <RichTextField
        label="Professional summary"
        value={basics.summary}
        onChange={(v) => onChange({ summary: v })}
        rows={4}
        placeholder="Two or three sentences on who you are, your experience and what you’re looking for."
        ideas="summary"
      />
    </div>
  );
}
