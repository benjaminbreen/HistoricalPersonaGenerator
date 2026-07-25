/**
 * portraitLab/art/eyes.ts
 *
 * Eyes are drawn in two pieces on purpose.
 *
 * The *lids and sclera* are an authored stamp. The *iris* is a separate stamp
 * painted only where sclera already exists — so the upper lid crops the iris
 * automatically, exactly the way a real eye works, and gaze becomes a one-pixel
 * offset rather than a combinatorial explosion of authored frames.
 *
 * That split is also what makes the animation cheap: blinking swaps a 11×7
 * stamp and looking around moves the iris by a pixel. Nothing else redraws.
 */

import { MAT, RampBook, Raster } from '../core/raster';
import { drawStamp, PaintTable, rampPaint, relativePaints, rgbPaint, Stamp, stamp } from '../core/stamp';
import { PortraitRamps } from './palette';
import { EyeShape } from '../spec/types';

export type EyeState = 'open' | 'half' | 'closed' | 'squint' | 'wide';

/*
 * Legend
 *   l  upper lash line      k  softer lid edge         s  sclera in lid shadow
 *   w  sclera
 *   L  lower lid line       -  skin one step darker    ^  skin two lighter
 */

const ALMOND_OPEN = stamp(
  `
  .lllllll.
  .ksssssk.
  kwwwwwwwk
  kwwwwwwwk
  .kwwwwwk.
  ..wwwww..
  ..-----..
  `,
  { anchor: { x: 4, y: 3 } }
);

const ALMOND_HALF = stamp(
  `
  .........
  .lllllll.
  .ksssssk.
  .kwwwwwk.
  ..LLLLL..
  ...---...
  `,
  { anchor: { x: 4, y: 3 } }
);

const CLOSED = stamp(
  `
  .........
  .........
  .l.....l.
  .lLLLLLl.
  ..-----..
  .........
  `,
  { anchor: { x: 4, y: 3 } }
);

/** Smiling narrows the eye from below and lifts the cheek with it. */
const SQUINT = stamp(
  `
  .lllllll.
  .ksssssk.
  kwwwwwwwk
  .kwwwwwk.
  ..LLLLL..
  ..^^^^^..
  ...---...
  `,
  { anchor: { x: 4, y: 2 } }
);

const ROUND_OPEN = stamp(
  `
  ..lllll..
  .ksssssk.
  kwwwwwwwk
  kwwwwwwwk
  kwwwwwwwk
  .kwwwwwk.
  ..-----..
  `,
  { anchor: { x: 4, y: 3 } }
);

const NARROW_OPEN = stamp(
  `
  .lllllll.
  lkssssskl
  kwwwwwwwk
  .kwwwwwk.
  ..LLLLL..
  ...---...
  `,
  { anchor: { x: 4, y: 2 } }
);

const WIDE_OPEN = stamp(
  `
  .lllllll.
  kwssssswk
  kwwwwwwwk
  kwwwwwwwk
  kwwwwwwwk
  .kwwwwwk.
  ..-----..
  `,
  { anchor: { x: 4, y: 3 } }
);

/** Surprise: the upper lid clears the top of the iris entirely. */
const STARTLED = stamp(
  `
  .lllllll.
  kwwwwwwwk
  kwwwwwwwk
  kwwwwwwwk
  kwwwwwwwk
  .kwwwwwk.
  ..-----..
  `,
  { anchor: { x: 4, y: 3 } }
);

/** The heavy fold that defines a hooded eye, drawn above the lid line. */
const HOOD_FOLD = stamp(
  `
  .=======.
  ..-----..
  `,
  { anchor: { x: 4, y: 1 } }
);

/** A pronounced epicanthic fold at the inner corner. */
const INNER_FOLD = stamp(
  `
  -.
  =-
  -.
  `,
  { anchor: { x: 1, y: 1 } }
);

const IRIS = stamp(
  `
  .III.
  igppi
  ipppi
  ijjji
  .iji.
  `,
  { anchor: { x: 2, y: 2 } }
);

/** A smaller iris for a wider, more startled eye. */
const IRIS_SMALL = stamp(
  `
  .II.
  igpi
  ippi
  .jj.
  `,
  { anchor: { x: 2, y: 2 } }
);

const LASH_LONG = stamp(
  `
  ..l
  .l.
  `,
  { anchor: { x: 0, y: 0 } }
);

export function makeEyePaints(ramps: PortraitRamps): PaintTable {
  return {
    ...relativePaints(),
    l: rampPaint(ramps.brow, MAT.BROW, 6),
    k: rampPaint(ramps.brow, MAT.BROW, 4),
    L: rampPaint(ramps.brow, MAT.BROW, 4),
    s: rampPaint(ramps.sclera, MAT.SCLERA, 5),
    w: rampPaint(ramps.sclera, MAT.SCLERA, 3),
    I: rampPaint(ramps.iris, MAT.IRIS, 5),
    i: rampPaint(ramps.iris, MAT.IRIS, 3),
    j: rampPaint(ramps.iris, MAT.IRIS, 1),
    p: rgbPaint(ramps.pupil, MAT.IRIS),
    g: rgbPaint(ramps.glint, MAT.IRIS),
  };
}

function lidStamp(shape: EyeShape, state: EyeState, droop: number): Stamp {
  if (state === 'closed') return CLOSED;
  if (state === 'half') return ALMOND_HALF;
  if (state === 'squint') return SQUINT;
  if (state === 'wide') return STARTLED;
  // Age closes the aperture. A *hooded* shape does not — it is a heavy fold
  // above a normal eye, and treating the two the same put a quarter of all
  // personas behind slits with two pixels of visible white.
  if (droop > 0.62) return NARROW_OPEN;
  switch (shape) {
    case 'round': return ROUND_OPEN;
    case 'narrow': return NARROW_OPEN;
    case 'wide': return WIDE_OPEN;
    default: return ALMOND_OPEN;
  }
}

/** A narrow aperture shows a narrower slice of iris, or there is no white left. */
function irisFor(lid: Stamp, dilated: boolean): Stamp {
  if (dilated) return IRIS_SMALL;
  return lid === NARROW_OPEN || lid === ALMOND_HALF ? IRIS_SMALL : IRIS;
}

export interface DrawEyeOptions {
  raster: Raster;
  book: RampBook;
  paints: PaintTable;
  shape: EyeShape;
  state: EyeState;
  /** Screen position of the pupil when looking straight ahead. */
  centerX: number;
  centerY: number;
  /** -1 for the character's right eye (screen left), +1 for the other. */
  side: -1 | 1;
  gazeX?: number;
  gazeY?: number;
  eyelashes?: 'short' | 'medium' | 'long';
  /** Pupils widen in low light and with strong feeling; 0..1. */
  dilation?: number;
  /** 0..1 age-related hooding; high values get the fold regardless of shape. */
  droop?: number;
}

const SCLERA_ONLY = new Set<number>([MAT.SCLERA]);
/** Eyes appear on skin and on painted skin — but not under a hood or a brim. */
const EYE_SURFACE = new Set<number>([MAT.SKIN, MAT.PAINT]);

export function drawEye(options: DrawEyeOptions): void {
  const {
    raster, book, paints, shape, state,
    centerX, centerY, side, gazeX = 0, gazeY = 0,
    eyelashes = 'medium', dilation = 0, droop = 0,
  } = options;

  const flip = side === 1;
  const lid = lidStamp(shape, state, droop);

  if ((shape === 'hooded' || droop > 0.45) && state !== 'closed') {
    drawStamp(raster, HOOD_FOLD, centerX, centerY - 4, paints, book, { flipX: flip });
  }

  drawStamp(raster, lid, centerX, centerY, paints, book, { flipX: flip, onlyOver: EYE_SURFACE });

  if (state !== 'closed') {
    const iris = irisFor(lid, dilation > 0.5 || state === 'wide');
    drawStamp(raster, iris, centerX + gazeX, centerY + gazeY, paints, book, {
      flipX: flip,
      onlyOver: SCLERA_ONLY,
    });
  }

  if (shape === 'narrow' && state !== 'closed') {
    // Inner corner, i.e. toward the middle of the face.
    drawStamp(raster, INNER_FOLD, centerX + side * 4, centerY, paints, book, { flipX: flip });
  }

  if (eyelashes === 'long' && state !== 'closed') {
    drawStamp(raster, LASH_LONG, centerX - side * 5, centerY - 3, paints, book, { flipX: flip });
  }
}
