/**
 * Splits a column of measured blocks into pages.
 *
 * Blocks are atomic (a section heading, an entry header, one bullet…).
 * A block marked keepWithNext is never left alone at the bottom of a page:
 * a heading moves to the next page together with the first thing under it.
 * A block taller than a whole page gets a page to itself and overflows.
 */
export interface MeasuredBlock {
  height: number;
  keepWithNext?: boolean;
}

/**
 * @param capacity available height on each page (index 0 = first page);
 *   the last value is reused for all later pages.
 * @returns the block indexes on each page (at least one page).
 */
export function paginate(blocks: MeasuredBlock[], capacity: number[]): number[][] {
  const cap = (page: number) => capacity[Math.min(page, capacity.length - 1)] ?? 0;
  const pages: number[][] = [[]];
  let used = 0;
  // Tiny rounding differences between measurement and render must not push a block over.
  const EPS = 0.5;

  for (let i = 0; i < blocks.length; i++) {
    const page = pages.length - 1;
    const room = cap(page) - used;
    // Height of this block plus the chain it must stay with.
    let chain = blocks[i].height;
    for (let j = i; blocks[j]?.keepWithNext && j + 1 < blocks.length; j++) chain += blocks[j + 1].height;
    const needed = blocks[i].keepWithNext && chain <= cap(page + 1) ? chain : blocks[i].height;

    if (pages[page].length > 0 && needed > room + EPS) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(i);
    used += blocks[i].height;
  }
  return pages;
}
