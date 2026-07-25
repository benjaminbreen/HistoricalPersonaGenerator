/**
 * portraitLab/art/noses.ts
 *
 * A nose is four things: a shadow down one side of the bridge, a highlight on
 * the ball, two nostril darks, and a shadow underneath. Get those four right
 * and the nose reads; compute them out of a loop and it reads as dirt. So these
 * are drawn by hand.
 *
 * Every pixel here is *relative* — `-` is one step darker than whatever skin
 * tone is underneath, `^` two steps lighter. One authored nose therefore works
 * on every complexion and stays correct when the whole head is in shadow.
 *
 * The light comes from the upper left, so the lit edge of the bridge is always
 * on the left and the cast shadow on the right.
 */

import { MAT, RampBook, Raster } from '../core/raster';
import { drawStamp, PaintTable, relativePaints, Stamp, stamp } from '../core/stamp';
import { NoseShape } from '../spec/types';

const STRAIGHT = stamp(
  `
  ....-....
  ....-....
  ...+.-...
  ...+.-...
  ...+.-...
  ...+.-...
  ...+.=...
  ..+^.=-..
  ..^^.==..
  .-+^+-=-.
  .~~-+-~~.
  ..-===-..
  `,
  { anchor: { x: 4, y: 10 } }
);

const AQUILINE = stamp(
  `
  ....-....
  ...+-....
  ...+=....
  ..+^=....
  ..+^=-...
  ..+^=-...
  ..+^==...
  ..+^.=-..
  .-+^^==..
  .=-+^-==.
  .~~-+-~~.
  ..-===-..
  `,
  { anchor: { x: 4, y: 10 } }
);

const ROMAN = stamp(
  `
  ...+-....
  ...+-....
  ...+.-...
  ...+.-...
  ...+.=...
  ...+.=...
  ..+^.=...
  ..+^.=-..
  ..^^.==..
  .-+^^-=-.
  .~==-=~~.
  ..-----..
  `,
  { anchor: { x: 4, y: 10 } }
);

const BROAD = stamp(
  `
  .....-.....
  .....-.....
  ....+.-....
  ....+.-....
  ....+.-....
  ...+..=....
  ...+..=....
  ..+^..=-...
  .-+^^.==-..
  .=-+^+-=-..
  .~~=-+-=~~.
  ..-------..
  `,
  { anchor: { x: 5, y: 10 } }
);

const BUTTON = stamp(
  `
  ...-...
  ...-...
  ..+.-..
  ..+.-..
  .-+^=..
  .-^^=-.
  .~=+=~.
  ..---..
  `,
  { anchor: { x: 3, y: 6 } }
);

const NOSES: Record<NoseShape, Stamp> = {
  straight: STRAIGHT,
  aquiline: AQUILINE,
  roman: ROMAN,
  broad: BROAD,
  button: BUTTON,
};

/** Cartilage keeps growing: older noses sit lower and read heavier. */
const AGE_DROOP = stamp(
  `
  .=-+-=.
  ..---..
  `,
  { anchor: { x: 3, y: 0 } }
);

export function makeSkinPaints(): PaintTable {
  return relativePaints();
}

export interface DrawNoseOptions {
  raster: Raster;
  book: RampBook;
  paints: PaintTable;
  shape: NoseShape;
  centerX: number;
  /** Screen y of the nostril row. */
  baseY: number;
  ageLines?: number;
}

const SKIN_ONLY = new Set<number>([MAT.SKIN]);

export function drawNose(options: DrawNoseOptions): void {
  const { raster, book, paints, shape, centerX, baseY, ageLines = 0 } = options;
  const art = NOSES[shape] || STRAIGHT;
  drawStamp(raster, art, centerX, baseY, paints, book, { onlyOver: SKIN_ONLY });
  if (ageLines > 0.55) {
    drawStamp(raster, AGE_DROOP, centerX, baseY + 1, paints, book, { onlyOver: SKIN_ONLY });
  }
}

/**
 * The nasolabial fold — the single most age-legible line on a face, and the
 * one thing that turns a 60-year-old from "a 20-year-old with grey hair" into
 * someone who has lived.
 *
 * It is drawn rather than stamped because its length and depth both need to
 * scale continuously: a faint crease at forty, a deep bracket around the mouth
 * at seventy. It runs from beside the nostril, out and down, curving in toward
 * the corner of the mouth.
 */
export function drawNasolabialFold(
  raster: Raster,
  book: RampBook,
  centerX: number,
  topY: number,
  side: -1 | 1,
  strength: number
): void {
  const length = 4 + Math.round(strength * 6);
  const deep = strength > 0.7;
  for (let i = 0; i < length; i += 1) {
    const t = i / Math.max(1, length - 1);
    // Bows outward at the top, then tucks back toward the mouth corner.
    const out = 4 + Math.sin(t * Math.PI * 0.75) * 2.6;
    const x = Math.round(centerX + side * out);
    const y = topY + i;
    if (raster.matAt(x, y) !== MAT.SKIN) continue;
    raster.shift(x, y, deep ? 2 : 1, book);
    // A lit ridge on the cheek side is what makes it a fold and not a scratch.
    if (deep && raster.matAt(x + side, y) === MAT.SKIN) raster.shift(x + side, y, -1, book);
    if (deep && i > 1 && raster.matAt(x - side, y) === MAT.SKIN) raster.shift(x - side, y, 1, book);
  }
}
