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
 *
 * The five shapes differ in *proportion*, not in shading. An earlier set drew
 * them all nine pixels wide and twelve rows tall and distinguished them by
 * moving a couple of `+` and `=` cells around the bridge; measured against each
 * other, straight and roman came out fourteen pixels apart on a 14,400-pixel
 * canvas, which is to say identical. A frontal view cannot show a profile, so
 * what it has to show instead is how long the nose is, how wide it is at the
 * base, and how much shadow the tip throws. Those are the numbers that vary
 * here — 7 to 13 pixels of width, and 5 to 12 rows above the nostril line.
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

/**
 * Long and narrow, with the bridge starting up between the eyes and a tip that
 * hangs. The narrow nostril line is as much of the read as the length is: an
 * aquiline nose is the only one here whose base is *narrower* than its bridge
 * is long.
 */
const AQUILINE = stamp(
  `
  ...+-....
  ...+-....
  ...+-....
  ...+=....
  ..+^=....
  ..+^=....
  ..+^=-...
  ..+^=-...
  ..+^==...
  ..+^.=-..
  .-+^^==..
  .=-+^-=-.
  ..~-+-~..
  ...===...
  ....-....
  `,
  { anchor: { x: 4, y: 12 } }
);

/**
 * The hump. A dorsal bump has no outline to show from the front, so it reads as
 * the lit column of the bridge swelling to two pixels across the middle third
 * and the shadow beside it stepping out to make room.
 */
const ROMAN = stamp(
  `
  ...+-....
  ...+-....
  ...+.-...
  ..+^.-...
  ..^^.=...
  .+^^.=-..
  ..+^.=-..
  ..+^.=...
  ..+^.=...
  ..+^.=-..
  .-+^^==..
  .~~-+-~~.
  ..-===-..
  `,
  { anchor: { x: 4, y: 11 } }
);

/** Wide at the base, with the nostrils flaring clear of the bridge above them. */
const BROAD = stamp(
  `
  .....+.-.....
  .....+.-.....
  ....+..-.....
  ....+..=.....
  ....+..=.....
  ...+^..=-....
  ...+^..==....
  ..-+^..==-...
  .=-+^^+-==-..
  .~~==-+-==~~.
  ..---------..
  `,
  { anchor: { x: 6, y: 9 } }
);

/**
 * Small and tipped up, which is what puts the nostrils on show — on a button
 * nose they are a larger share of the whole than on any other shape, and that
 * ratio is most of what makes it read as one.
 *
 * The *bridge* still runs up between the eyes. An earlier version of this took
 * the shortness literally and stopped the whole nose five rows above the
 * nostrils, which on a long face left a bare inch of cheek between the eyes and
 * a small mark floating below them. What is short on a button nose is the part
 * that projects, not the part that joins it to the skull.
 */
const BUTTON = stamp(
  `
  ...-...
  ..+.-..
  ..+.-..
  ..+.-..
  ..+.=..
  .-^^=..
  .-^^=-.
  .~~+~~.
  ..===..
  `,
  { anchor: { x: 3, y: 7 } }
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
