import { describe, expect, it } from 'vitest';
import { paginate } from './paginate';

const b = (height: number, keepWithNext = false) => ({ height, keepWithNext });

describe('paginate', () => {
  it('keeps everything on one page when it fits', () => {
    expect(paginate([b(10), b(20), b(30)], [100])).toEqual([[0, 1, 2]]);
    expect(paginate([], [100])).toEqual([[]]);
  });
  it('breaks when a block does not fit', () => {
    expect(paginate([b(40), b(40), b(40)], [100])).toEqual([[0, 1], [2]]);
  });
  it('uses a smaller capacity on later pages (extra top padding)', () => {
    // 90 fits on page 1 (100) but pages 2+ only hold 80.
    expect(paginate([b(50), b(40), b(45), b(40)], [100, 80])).toEqual([[0, 1], [2], [3]]);
  });
  it('never leaves a heading alone at the bottom of a page', () => {
    // Heading (10) would fit at 90/100, but its first entry (20) would not.
    expect(paginate([b(80), b(10, true), b(20)], [100])).toEqual([[0], [1, 2]]);
  });
  it('follows chains of keep-with-next blocks', () => {
    // Section heading + entry header + first bullet move together.
    expect(paginate([b(70), b(10, true), b(10, true), b(15), b(5)], [100])).toEqual([[0], [1, 2, 3, 4]]);
  });
  it('does not move a chain that could never fit on a page anyway', () => {
    expect(paginate([b(10), b(10, true), b(200)], [100])).toEqual([[0, 1], [2]]);
  });
  it('gives an oversized block its own page', () => {
    expect(paginate([b(20), b(150), b(20)], [100])).toEqual([[0], [1], [2]]);
  });
  it('tolerates rounding at the page edge', () => {
    expect(paginate([b(60), b(40.3)], [100])).toEqual([[0, 1]]);
  });
});
