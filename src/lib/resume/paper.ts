import type { PaperSize } from './types';

/** Paper sizes in millimetres. */
export const PAPER: Record<PaperSize, { label: string; width: number; height: number; hint: string }> = {
  A4: { label: 'A4', width: 210, height: 297, hint: 'Most of the world' },
  Letter: { label: 'US Letter', width: 215.9, height: 279.4, hint: 'US and Canada' },
  Legal: { label: 'US Legal', width: 215.9, height: 355.6, hint: 'Long US format' },
};

export const PAPER_SIZES = Object.keys(PAPER) as PaperSize[];

/** CSS pixels per millimetre (96 px per inch). */
export const PX_PER_MM = 96 / 25.4;
