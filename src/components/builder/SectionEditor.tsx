import { useState } from 'react';
import { formatRange } from '@/lib/resume/dates';
import { uid } from '@/lib/resume/defaults';
import { KINDS, singleDate } from '@/lib/resume/schema';
import type { Action } from '@/lib/resume/store';
import type { Item, Section } from '@/lib/resume/types';
import { Checkbox, DateField, IconButton, LevelField, RichTextField, TagsField, TextField } from './fields';
import { Icon } from './icons';
import { useReorder } from './useReorder';

function ItemFields({ section, item, onChange }: { section: Section; item: Item; onChange: (patch: Partial<Omit<Item, 'id'>>) => void }) {
  const k = KINDS[section.kind];
  const has = (f: (typeof k.fields)[number]) => k.fields.includes(f);
  const single = singleDate(section.kind);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {has('title') && <TextField label={k.titleLabel} value={item.title} onChange={(v) => onChange({ title: v })} />}
        {has('subtitle') && k.subtitleLabel && <TextField label={k.subtitleLabel} value={item.subtitle} onChange={(v) => onChange({ subtitle: v })} />}
        {has('location') && <TextField label="Location" value={item.location} onChange={(v) => onChange({ location: v })} placeholder="City, country" />}
        {has('url') && <TextField label="Link" type="url" value={item.url} onChange={(v) => onChange({ url: v })} placeholder="Optional" />}
      </div>
      {has('dates') && k.dateLabels && (
        <div className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField label={k.dateLabels[0]} value={item.start} onChange={(v) => onChange({ start: v })} />
            {!single && k.dateLabels[1] && <DateField label={k.dateLabels[1]} value={item.end} onChange={(v) => onChange({ end: v })} disabled={item.current} />}
          </div>
          {!single && section.kind !== 'certifications' && <Checkbox label={section.kind === 'education' ? 'I study here now' : 'I work here now'} checked={item.current} onChange={(v) => onChange({ current: v })} />}
        </div>
      )}
      {has('tags') && k.tagsLabel && <TagsField label={k.tagsLabel} value={item.tags} onChange={(v) => onChange({ tags: v })} placeholder="e.g. React, Node.js, SQL" />}
      {has('level') && k.levelLabel && <LevelField label={k.levelLabel} value={item.level} onChange={(v) => onChange({ level: v })} />}
      {has('description') && k.descriptionLabel && (
        <RichTextField
          label={k.descriptionLabel}
          value={item.description}
          onChange={(v) => onChange({ description: v })}
          rows={section.kind === 'experience' || section.kind === 'projects' ? 5 : 3}
          placeholder={section.kind === 'experience' ? '- Start each point with a strong verb\n- Add numbers: “Cut costs by 20%”' : undefined}
        />
      )}
    </div>
  );
}

function itemSummary(section: Section, item: Item): { main: string; sub: string } {
  const main = item.title || `Untitled ${KINDS[section.kind].noun}`;
  const dates = formatRange(item.start, item.end, item.current, 'MMM YYYY', singleDate(section.kind));
  const detail = item.subtitle || item.tags.join(', ');
  return { main, sub: [detail, dates].filter(Boolean).join(' · ') };
}

export function SectionEditor({
  section,
  index,
  total,
  dispatch,
  dragHandle,
}: {
  section: Section;
  index: number;
  total: number;
  dispatch: (a: Action) => void;
  dragHandle: { onPointerDown: () => void; onPointerUp: () => void };
}) {
  const k = KINDS[section.kind];
  const [open, setOpen] = useState<Set<string>>(() => new Set(section.items.length === 1 ? [section.items[0].id] : []));
  const [collapsed, setCollapsed] = useState(false);
  const items = useReorder((from, to) => dispatch({ type: 'moveItem', sectionId: section.id, from, to }));
  const toggle = (id: string) => setOpen((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])));

  const add = () => {
    const id = uid('i');
    dispatch({ type: 'addItem', sectionId: section.id, id });
    setOpen((s) => new Set([...s, id]));
    setCollapsed(false);
  };

  return (
    <div className={`card overflow-hidden ${section.hidden ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-1 border-b border-line bg-surface-2/60 px-2 py-1.5">
        <span {...dragHandle} className="grid size-8 cursor-grab place-items-center rounded-lg text-muted hover:bg-surface active:cursor-grabbing" title="Drag to reorder" aria-hidden="true">
          <Icon name="grip" />
        </span>
        <input
          aria-label="Section title"
          value={section.title}
          onChange={(e) => dispatch({ type: 'updateSection', id: section.id, patch: { title: e.target.value } })}
          className="h-9 min-w-0 flex-1 rounded-lg bg-transparent px-2 font-semibold outline-none hover:bg-surface focus:bg-surface focus:ring-2 focus:ring-brand/20"
        />
        <IconButton label="Move section up" onClick={() => dispatch({ type: 'moveSection', from: index, to: index - 1 })} disabled={index === 0}>
          <Icon name="up" />
        </IconButton>
        <IconButton label="Move section down" onClick={() => dispatch({ type: 'moveSection', from: index, to: index + 1 })} disabled={index === total - 1}>
          <Icon name="down" />
        </IconButton>
        <IconButton label={section.hidden ? 'Show on resume' : 'Hide from resume'} onClick={() => dispatch({ type: 'updateSection', id: section.id, patch: { hidden: !section.hidden } })}>
          <Icon name={section.hidden ? 'eyeOff' : 'eye'} />
        </IconButton>
        <IconButton
          label="Delete section"
          tone="danger"
          onClick={() => {
            if (section.items.length === 0 || window.confirm(`Delete the “${section.title}” section and its ${section.items.length} entr${section.items.length === 1 ? 'y' : 'ies'}?`)) dispatch({ type: 'removeSection', id: section.id });
          }}
        >
          <Icon name="trash" />
        </IconButton>
        <IconButton label={collapsed ? 'Expand section' : 'Collapse section'} onClick={() => setCollapsed((c) => !c)}>
          <span className={`transition ${collapsed ? '-rotate-90' : ''}`}>
            <Icon name="chevron" />
          </span>
        </IconButton>
      </div>

      {!collapsed && (
        <div className="space-y-2 p-3">
          {section.hidden && <p className="px-1 text-xs text-muted">Hidden: this section won’t appear on your resume.</p>}
          {section.items.map((it, i) => {
            const s = itemSummary(section, it);
            const isOpen = open.has(it.id);
            return (
              <div key={it.id} {...items.item(i)} className={`rounded-xl border bg-surface transition ${items.over === i && items.dragging !== i ? 'border-brand' : 'border-line'} ${items.dragging === i ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-1 px-1.5 py-1">
                  <span {...items.handle(i)} className="grid size-8 cursor-grab place-items-center rounded-lg text-muted hover:bg-surface-2 active:cursor-grabbing" title="Drag to reorder" aria-hidden="true">
                    <Icon name="grip" />
                  </span>
                  <button type="button" onClick={() => toggle(it.id)} aria-expanded={isOpen} className="min-w-0 flex-1 rounded-lg px-1.5 py-1 text-left hover:bg-surface-2">
                    <span className="block truncate text-sm font-medium">{s.main}</span>
                    {s.sub && <span className="block truncate text-xs text-muted">{s.sub}</span>}
                  </button>
                  <IconButton label="Move up" onClick={() => dispatch({ type: 'moveItem', sectionId: section.id, from: i, to: i - 1 })} disabled={i === 0}>
                    <Icon name="up" />
                  </IconButton>
                  <IconButton label="Move down" onClick={() => dispatch({ type: 'moveItem', sectionId: section.id, from: i, to: i + 1 })} disabled={i === section.items.length - 1}>
                    <Icon name="down" />
                  </IconButton>
                  <IconButton label="Duplicate" onClick={() => dispatch({ type: 'duplicateItem', sectionId: section.id, itemId: it.id })}>
                    <Icon name="copy" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => dispatch({ type: 'removeItem', sectionId: section.id, itemId: it.id })}>
                    <Icon name="trash" />
                  </IconButton>
                </div>
                {isOpen && (
                  <div className="border-t border-line p-3">
                    <ItemFields section={section} item={it} onChange={(patch) => dispatch({ type: 'updateItem', sectionId: section.id, itemId: it.id, patch })} />
                  </div>
                )}
              </div>
            );
          })}
          <button type="button" onClick={add} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-sm font-medium text-muted hover:border-brand/50 hover:text-brand">
            <Icon name="plus" /> Add {k.noun}
          </button>
        </div>
      )}
    </div>
  );
}
