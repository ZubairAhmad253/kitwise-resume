import { describe, expect, it } from 'vitest';
import { formatDate, formatRange, joinDate, splitDate } from './dates';
import { emptyResume, newItem, newSection } from './defaults';
import { cleanDate, normalizeResume } from './normalize';
import { parseInline, parseRichText, plainText, safeHref } from './richtext';
import { SAMPLES } from './samples';
import { move, reducer } from './store';

describe('rich text', () => {
  it('parses bullets and paragraphs', () => {
    const blocks = parseRichText('Intro line\nsecond line\n\n- one\n• two\n\nOutro');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'list', 'paragraph']);
    expect(blocks[1]).toEqual({ type: 'list', items: [[{ type: 'text', text: 'one' }], [{ type: 'text', text: 'two' }]] });
    expect(blocks[0]).toEqual({ type: 'paragraph', children: [{ type: 'text', text: 'Intro line second line' }] });
  });
  it('parses bold, italic and links', () => {
    expect(parseInline('a **b** *c* [d](https://x.com)')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'bold', children: [{ type: 'text', text: 'b' }] },
      { type: 'text', text: ' ' },
      { type: 'italic', children: [{ type: 'text', text: 'c' }] },
      { type: 'text', text: ' ' },
      { type: 'link', href: 'https://x.com', children: [{ type: 'text', text: 'd' }] },
    ]);
  });
  it('leaves unsafe or unmatched markup as text', () => {
    expect(parseInline('[x](javascript:alert(1))')).toEqual([{ type: 'text', text: '[x](javascript:alert(1))' }]);
    expect(parseInline('2 * 3 = 6')).toEqual([{ type: 'text', text: '2 * 3 = 6' }]);
    expect(safeHref('example.com/cv')).toBe('https://example.com/cv');
    expect(safeHref('mailto:a@b.co')).toBe('mailto:a@b.co');
  });
  it('flattens to plain text', () => {
    expect(plainText('**Led** a team\n- cut costs 10%')).toBe('Led a team\n• cut costs 10%');
  });
});

describe('dates', () => {
  it('formats dates and ranges', () => {
    expect(formatDate('2024-03', 'MMM YYYY')).toBe('Mar 2024');
    expect(formatDate('2024-03', 'MM/YYYY')).toBe('03/2024');
    expect(formatDate('2024-03', 'YYYY')).toBe('2024');
    expect(formatDate('2024', 'MMM YYYY')).toBe('2024');
    expect(formatRange('2021-03', '', true, 'MMM YYYY')).toBe('Mar 2021 – Present');
    expect(formatRange('2019', '2023', false, 'YYYY')).toBe('2019 – 2023');
    expect(formatRange('2022-05', '2024-01', false, 'MMM YYYY', true)).toBe('May 2022');
    expect(formatRange('', '', false, 'MMM YYYY')).toBe('');
  });
  it('splits and joins picker values', () => {
    expect(splitDate('2024-03')).toEqual({ year: '2024', month: '03' });
    expect(joinDate('2024', '3')).toBe('2024-03');
    expect(joinDate('24', '03')).toBe('');
    expect(cleanDate('2024-13')).toBe('2024');
    expect(cleanDate('garbage')).toBe('');
  });
});

describe('normalize', () => {
  it('rejects things that are not resumes', () => {
    expect(normalizeResume(null)).toBeNull();
    expect(normalizeResume('hello')).toBeNull();
    expect(normalizeResume({ foo: 1 })).toBeNull();
  });
  it('fills defaults, fixes types and drops bad photos', () => {
    const r = normalizeResume({ basics: { name: 'A', photo: 'javascript:x' }, sections: [{ kind: 'nonsense', items: [{ title: 5, level: 9, tags: ['a', '', 3] }] }], settings: { paper: 'Tabloid' } })!;
    expect(r.basics.name).toBe('A');
    expect(r.basics.photo).toBe('');
    expect(r.sections[0].kind).toBe('custom');
    expect(r.sections[0].title).toBe('Custom section');
    expect(r.sections[0].items[0]).toMatchObject({ title: '5', level: 5, tags: ['a', '3'] });
    expect(r.settings.paper).toBe('A4');
  });
  it('re-ids duplicate ids', () => {
    const r = normalizeResume({ sections: [{ kind: 'skills', id: 'x', items: [{ id: 'y' }, { id: 'y' }] }] })!;
    const [a, b] = r.sections[0].items;
    expect(a.id).toBe('y');
    expect(b.id).not.toBe('y');
  });
  it('round-trips a valid resume unchanged', () => {
    const r = SAMPLES[0].build();
    expect(normalizeResume(JSON.parse(JSON.stringify(r)))).toEqual(r);
  });
});

describe('reducer', () => {
  it('moves elements', () => {
    expect(move([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(move([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
    const same = [1, 2];
    expect(move(same, 0, 5)).toBe(same);
  });
  it('adds, edits, duplicates, moves and removes items', () => {
    let r = emptyResume();
    const sid = r.sections[0].id;
    r = reducer(r, { type: 'addItem', sectionId: sid, id: 'a' });
    r = reducer(r, { type: 'updateItem', sectionId: sid, itemId: 'a', patch: { title: 'Engineer', tags: ['x'] } });
    r = reducer(r, { type: 'duplicateItem', sectionId: sid, itemId: 'a' });
    const items = r.sections[0].items;
    expect(items).toHaveLength(2);
    expect(items[1].title).toBe('Engineer');
    expect(items[1].id).not.toBe('a');
    expect(items[1].tags).not.toBe(items[0].tags);
    r = reducer(r, { type: 'moveItem', sectionId: sid, from: 1, to: 0 });
    expect(r.sections[0].items[1].id).toBe('a');
    r = reducer(r, { type: 'removeItem', sectionId: sid, itemId: 'a' });
    expect(r.sections[0].items).toHaveLength(1);
  });
  it('adds, renames, hides, moves and removes sections', () => {
    let r = { ...emptyResume(), sections: [newSection('experience', { id: 'e' }), newSection('skills', { id: 's' })] };
    r = reducer(r, { type: 'addSection', kind: 'languages', id: 'l' });
    r = reducer(r, { type: 'updateSection', id: 'l', patch: { title: 'Idiomas', hidden: true } });
    r = reducer(r, { type: 'moveSection', from: 2, to: 0 });
    expect(r.sections.map((s) => s.id)).toEqual(['l', 'e', 's']);
    expect(r.sections[0]).toMatchObject({ title: 'Idiomas', hidden: true });
    r = reducer(r, { type: 'removeSection', id: 'e' });
    expect(r.sections.map((s) => s.id)).toEqual(['l', 's']);
  });
  it('updates basics and settings, and stamps the edit time', () => {
    const r0 = { ...emptyResume(), updatedAt: '2000-01-01T00:00:00.000Z' };
    const r = reducer(reducer(r0, { type: 'basics', patch: { name: 'Zed' } }), { type: 'settings', patch: { paper: 'Letter' } });
    expect(r.basics.name).toBe('Zed');
    expect(r.settings.paper).toBe('Letter');
    expect(r.updatedAt).not.toBe(r0.updatedAt);
    expect(newItem().level).toBe(0);
  });
});

describe('samples', () => {
  it('are all valid, unique and filled in', () => {
    const ids = new Set<string>();
    for (const s of SAMPLES) {
      const r = s.build();
      expect(r.basics.name, s.id).not.toBe('');
      expect(r.sections.length, s.id).toBeGreaterThan(2);
      for (const sec of r.sections) {
        expect(sec.items.length, `${s.id}/${sec.kind}`).toBeGreaterThan(0);
        for (const it of sec.items) {
          expect(ids.has(it.id)).toBe(false);
          ids.add(it.id);
        }
      }
      expect(normalizeResume(JSON.parse(JSON.stringify(r)))).toEqual(r);
    }
    expect(SAMPLES).toHaveLength(9);
  });
});
