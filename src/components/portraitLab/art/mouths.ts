/**
 * portraitLab/art/mouths.ts
 *
 * Four drawings cover thirteen expressions.
 *
 * Rather than author a smile, a frown, a smirk, a grimace and so on separately
 * — which is how you end up with 6000 lines and no two of them looking related
 * — there are four base mouths (closed, grinning, open, pursed) and the
 * expression is applied as a *bend*: the ends of the stamp lift for a smile,
 * drop for a frown, and lift on one side only for a smirk. Lip fullness adds or
 * removes a row; a wide mouth duplicates a middle column.
 */

import { MAT, RampBook, Raster } from '../core/raster';
import {
  drawStamp, endCurve, insertRows, PaintTable, rampPaint, relativePaints,
  removeRow, rgbPaint, Stamp, stamp, widenStamp,
} from '../core/stamp';
import { Expression, LipShape } from '../spec/types';
import { PortraitRamps } from './palette';

/*
 * Legend
 *   u  upper lip, in shadow      U  upper lip, catching light
 *   m  the mouth line            d  lower lip           D  lower lip highlight
 *   t  teeth                     o  the dark inside the mouth
 */

const CLOSED = stamp(
  `
  ....-----....
  ..uuUUuUUuu..
  .mmmmmmmmmmm.
  ..ddDDDDDdd..
  ...ddddddd...
  ...-=====-...
  `,
  { anchor: { x: 6, y: 2 } }
);

const GRIN = stamp(
  `
  ....-----....
  ..uuuuuuuuu..
  .mtttttttttm.
  .-mmmmmmmmm-.
  ..dDDDDDDDd..
  ...-======-..
  `,
  { anchor: { x: 6, y: 2 } }
);

const OPEN = stamp(
  `
  .....---.....
  ...uuuuuuu...
  ..umoooooum..
  ..umoooooum..
  ...dDDDDDd...
  ....-===-....
  `,
  { anchor: { x: 6, y: 2 } }
);

const PURSED = stamp(
  `
  ....-----....
  ...uUUUUUu...
  ...mmmmmmm...
  ...dDDDDDd...
  ....-===-....
  `,
  { anchor: { x: 6, y: 2 } }
);

export function makeMouthPaints(ramps: PortraitRamps): PaintTable {
  return {
    ...relativePaints(),
    u: rampPaint(ramps.lip, MAT.LIP, 5),
    U: rampPaint(ramps.lip, MAT.LIP, 4),
    m: rampPaint(ramps.lip, MAT.LIP, 6),
    d: rampPaint(ramps.lip, MAT.LIP, 3),
    D: rampPaint(ramps.lip, MAT.LIP, 2),
    t: rgbPaint(ramps.teeth, MAT.TEETH),
    o: rgbPaint({ r: 46, g: 26, b: 28 }, MAT.LIP),
  };
}

interface MouthPose {
  base: Stamp;
  /** How far the corners bend. Positive is up. */
  bend: number;
  /** -1..1; non-zero gives a crooked mouth. */
  asymmetry: number;
}

function poseFor(expression: Expression): MouthPose {
  switch (expression) {
    case 'content': return { base: CLOSED, bend: 1, asymmetry: 0 };
    case 'smile': return { base: CLOSED, bend: 2, asymmetry: 0 };
    case 'grin': return { base: GRIN, bend: 2, asymmetry: 0 };
    case 'smirk': return { base: CLOSED, bend: 2, asymmetry: 0.85 };
    case 'sad': return { base: CLOSED, bend: -2, asymmetry: 0 };
    case 'concern': return { base: CLOSED, bend: -1, asymmetry: 0 };
    case 'scowl': return { base: PURSED, bend: -2, asymmetry: 0 };
    case 'weary': return { base: CLOSED, bend: -1, asymmetry: 0.3 };
    case 'guarded': return { base: PURSED, bend: 0, asymmetry: 0 };
    case 'surprise': return { base: OPEN, bend: 0, asymmetry: 0 };
    case 'thinking': return { base: PURSED, bend: 0, asymmetry: 0.6 };
    case 'determined': return { base: PURSED, bend: -1, asymmetry: 0 };
    default: return { base: CLOSED, bend: 0, asymmetry: 0 };
  }
}

/** Lip fullness and width, applied to whichever base the expression picked. */
function shapeMouth(art: Stamp, lipShape: LipShape): Stamp {
  const lowerLipRow = art.rows.findIndex(row => row.includes('D'));
  switch (lipShape) {
    case 'thin':
      return lowerLipRow >= 0 ? removeRow(art, lowerLipRow + 1) : art;
    case 'full':
      return lowerLipRow >= 0 ? insertRows(art, lowerLipRow, 1) : art;
    case 'wide':
      return widenStamp(art, 3);
    case 'bow':
      // The base drawing already carries a cupid's bow at its centre.
      return art;
    default:
      return art;
  }
}

export interface DrawMouthOptions {
  raster: Raster;
  book: RampBook;
  paints: PaintTable;
  expression: Expression;
  lipShape: LipShape;
  centerX: number;
  /** Screen y of the mouth line. */
  y: number;
  /** Extra bend, e.g. from mood on top of the expression. */
  bendBias?: number;
}

/**
 * Note the absence of MAT.BEARD: a moustache is drawn into the base layer, so
 * excluding it here means the moustache overhangs the upper lip for free.
 */
const MOUTH_SURFACE = new Set<number>([MAT.SKIN, MAT.LIP, MAT.TEETH, MAT.PAINT]);

export function drawMouth(options: DrawMouthOptions): void {
  const { raster, book, paints, expression, lipShape, centerX, y, bendBias = 0 } = options;
  const pose = poseFor(expression);
  const art = shapeMouth(pose.base, lipShape);
  const bend = pose.bend + bendBias;

  drawStamp(raster, art, centerX, y, paints, book, {
    onlyOver: MOUTH_SURFACE,
    columnShift: bend === 0 && pose.asymmetry === 0
      ? undefined
      : endCurve(art.width, bend, pose.asymmetry),
  });
}

/**
 * A dimple, which only appears on a real smile. Small, but it is the kind of
 * detail that makes a face feel observed rather than generated.
 */
export function drawDimple(
  raster: Raster,
  book: RampBook,
  x: number,
  y: number
): void {
  raster.shift(x, y, 2, book);
  raster.shift(x, y + 1, 1, book);
}
