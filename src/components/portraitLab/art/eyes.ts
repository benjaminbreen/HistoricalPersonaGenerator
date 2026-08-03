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
import {
  drawStamp, narrowStamp, PaintTable, rampPaint, relativePaints, rgbPaint,
  Stamp, stamp, widenStamp,
} from '../core/stamp';
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

/**
 * Round: short across and tall through, so the aperture approaches a circle and
 * the iris very nearly fills it. Two pixels narrower than the almond rather
 * than one row taller — an eye shape that only changes its height reads as the
 * same eye more or less open, which is an expression, not an anatomy.
 */
const ROUND_OPEN = stamp(
  `
  ..lll..
  .ksssk.
  kwwwwwk
  kwwwwwk
  kwwwwwk
  .kwwwk.
  ..---..
  `,
  { anchor: { x: 3, y: 3 } }
);

/** Narrow: long across and shallow through, with the strongest outer lift. */
const NARROW_OPEN = stamp(
  `
  .lllllllll.
  lkssssssskl
  kwwwwwwwwwk
  .kwwwwwwwk.
  ..LLLLLLL..
  ...-----...
  `,
  { anchor: { x: 5, y: 2 } }
);

/**
 * Wide: long across, and no taller through than an almond.
 *
 * Wide is a proportion, not a size. Drawing it with both a longer opening *and*
 * a deeper one made it the biggest eye on the face by a wide margin and read as
 * a cartoon — which is what `large` is for, below.
 */
const WIDE_OPEN = stamp(
  `
  .lllllllll.
  kwssssssswk
  kwwwwwwwwwk
  kwwwwwwwwwk
  .kwwwwwwwk.
  ..wwwwwww..
  ..-------..
  `,
  { anchor: { x: 5, y: 3 } }
);

/**
 * Large: the genuinely big eye, long *and* deep, with the lid clear of the top
 * of the iris. Its own shape rather than a bigger `wide`, because plenty of
 * people have wide-set narrow eyes and plenty have large round ones, and one
 * axis cannot say both.
 */
const LARGE_OPEN = stamp(
  `
  .lllllllll.
  kwwwwwwwwwk
  kwwwwwwwwwk
  kwwwwwwwwwk
  kwwwwwwwwwk
  kwwwwwwwwwk
  .kwwwwwwwk.
  ..-------..
  `,
  { anchor: { x: 5, y: 3 } }
);

/**
 * Hooded: an almond aperture with its top row taken by the fold above it. The
 * fold alone was not enough — a heavy brow over an unchanged eye reads as a
 * frown, and what makes an eye hooded is that the lid itself is buried.
 */
const HOODED_OPEN = stamp(
  `
  .lllllll.
  .ksssssk.
  kwwwwwwwk
  .kwwwwwk.
  ..wwwww..
  ..-----..
  `,
  { anchor: { x: 4, y: 2 } }
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

/** The fold age puts above the lid line. */
const HOOD_FOLD = stamp(
  `
  .=======.
  ..-----..
  `,
  { anchor: { x: 4, y: 1 } }
);

/** The heavier one a hooded eye is named for: three rows, and it overhangs. */
const HOOD_FOLD_HEAVY = stamp(
  `
  .=======.
  =-------=
  ..-----..
  `,
  { anchor: { x: 4, y: 2 } }
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

/**
 * A larger iris for the large eye.
 *
 * Without it, `large` was a bigger opening with the same five-pixel iris
 * floating in it, and white showing all the way round an iris is the anatomy of
 * a stare, not of a big eye. Large eyes have large irises; that is most of why
 * they read as appealing rather than alarming.
 */
const IRIS_LARGE = stamp(
  `
  ..III..
  .igIIi.
  iIpppIi
  iIpppIi
  .ijjji.
  ..jjj..
  `,
  { anchor: { x: 3, y: 2 } }
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

/**
 * How long each shape's opening is. The shared states below are authored at
 * nine and resized to match.
 */
const SHAPE_WIDTH: Record<EyeShape, number> = {
  round: 7,
  almond: 9,
  hooded: 9,
  wide: 11,
  narrow: 11,
  large: 11,
};

/**
 * Blinking, squinting and looking startled are the *same* eye doing something,
 * so they have to keep the width the persona was born with.
 *
 * Every state below this comment used to be a fixed nine-pixel drawing, which
 * was invisible while all five shapes were also nine pixels across. Once they
 * were not, a persona with an eleven-pixel opening lost two pixels of it on
 * every blink and got them back afterwards — the eye changed size several times
 * a minute, which reads as a fault in the picture rather than as a face.
 */
function fitWidth(art: Stamp, target: number): Stamp {
  if (art.width === target) return art;
  return art.width < target
    ? widenStamp(art, target - art.width)
    : narrowStamp(art, art.width - target);
}

function lidStamp(shape: EyeShape, state: EyeState, droop: number): Stamp {
  const width = SHAPE_WIDTH[shape] ?? 9;
  if (state === 'closed') return fitWidth(CLOSED, width);
  if (state === 'half') return fitWidth(ALMOND_HALF, width);
  if (state === 'squint') return fitWidth(SQUINT, width);
  if (state === 'wide') return fitWidth(STARTLED, width);
  // Age closes the aperture. A *hooded* shape does not — it is a heavy fold
  // above a normal eye, and treating the two the same put a quarter of all
  // personas behind slits with two pixels of visible white.
  if (droop > 0.62) return fitWidth(NARROW_OPEN, width);
  switch (shape) {
    case 'round': return ROUND_OPEN;
    case 'narrow': return NARROW_OPEN;
    case 'wide': return WIDE_OPEN;
    case 'large': return LARGE_OPEN;
    case 'hooded': return HOODED_OPEN;
    default: return ALMOND_OPEN;
  }
}

/** A narrow aperture shows a narrower slice of iris, or there is no white left. */
function irisFor(lid: Stamp, dilated: boolean): Stamp {
  if (dilated) return IRIS_SMALL;
  if (lid === LARGE_OPEN) return IRIS_LARGE;
  // Compared by height rather than by identity: the shared states are resized
  // per shape now, so `lid === ALMOND_HALF` is false for most personas.
  return lid.height <= 6 ? IRIS_SMALL : IRIS;
}

/**
 * Canthal tilt: one pixel of lift at the outer corner, or none.
 *
 * This was first written as a slope across the whole lid, which is how a tilt
 * works on paper and is wrong here for a reason that only shows up on a face.
 * The brow above the eye carries the expression, and several expressions drop
 * its inner end — `guarded` by 0.4, `scowl` by 1.5. A brow angled down toward
 * the nose *already* reads as a slanted eye at this size, because the viewer
 * takes the brow line for the eye line. Sloping the lid as well compounded the
 * two, and on a persona whose eye shape is `narrow` to begin with the result
 * was a caricature — the same face read level in neutral and steeply slanted in
 * skeptical, having changed nothing but its eyebrows.
 *
 * So the lift is a corner detail and nothing more: the outer two columns, one
 * pixel, matching what `spriteHead.eyeGeom` already does for the same shapes.
 * A cue that cannot compound cannot compound into a caricature.
 */
const CANTHAL_LIFT: Record<EyeShape, number> = {
  almond: 1,
  narrow: 1,
  hooded: 0,
  round: 0,
  wide: 0,
  large: 0,
};

/** The outer corner is screen-left for the sitter's right eye, right for the other. */
function cornerLift(art: Stamp, side: -1 | 1, lift: number): ((column: number) => number) | undefined {
  if (lift === 0) return undefined;
  const columns = 2;
  return side === -1
    ? column => (column < columns ? -lift : 0)
    : column => (column >= art.width - columns ? -lift : 0);
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
  /** A clouded eye: the iris pales toward the sclera and the pupil goes. */
  clouded?: boolean;
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
    eyelashes = 'medium', dilation = 0, droop = 0, clouded = false,
  } = options;

  const flip = side === 1;
  const lid = lidStamp(shape, state, droop);
  // Only an open eye carries the lift. A blink and a squint are the same two
  // lids meeting whatever the eye is, and lifting those slid the closed lash
  // line off the socket it belongs to.
  const lift = state === 'open' ? (CANTHAL_LIFT[shape] ?? 0) : 0;

  if ((shape === 'hooded' || droop > 0.45) && state !== 'closed') {
    const fold = shape === 'hooded' ? HOOD_FOLD_HEAVY : HOOD_FOLD;
    drawStamp(raster, fold, centerX, centerY - 4, paints, book, {
      flipX: flip,
      columnShift: cornerLift(fold, side, lift),
    });
  }

  drawStamp(raster, lid, centerX, centerY, paints, book, {
    flipX: flip,
    onlyOver: EYE_SURFACE,
    columnShift: cornerLift(lid, side, lift),
  });

  if (state !== 'closed') {
    // The iris is not lifted with the lid. It sits in the middle of the eye,
    // where a corner detail does not reach, and shifting it there only bent
    // the pupil out of round.
    const iris = irisFor(lid, dilation > 0.5 || state === 'wide');
    drawStamp(raster, iris, centerX + gazeX, centerY + gazeY, paints, book, {
      flipX: flip,
      onlyOver: SCLERA_ONLY,
    });
    if (clouded) {
      // A mature cataract, which is what blindness looks like from outside at
      // this distance: the iris pales toward the sclera and the pupil stops
      // being a dark point. Drawn over the finished iris rather than instead
      // of it, so the eye keeps its shape, its lid and its lashes and only the
      // window in the middle goes. The gaze offset is deliberately ignored —
      // an eye that cannot see does not track.
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          if (dx * dx + dy * dy > 5) continue;
          const x = centerX + dx;
          const y = centerY + dy;
          if (raster.matAt(x, y) !== MAT.IRIS) continue;
          raster.blend(x, y, { r: 196, g: 198, b: 190 }, 0.72, MAT.IRIS, 2);
        }
      }
    }
  }

  // Both of these are placed off the lid's own half-width, because the lids are
  // no longer all nine pixels across — a corner mark measured in absolute
  // pixels lands inside a narrow eye and outside a round one.
  //
  // The signs were also crossed. `side` is -1 for the sitter's right eye, which
  // sits at screen *left*, so its inner corner — the one toward the nose — is
  // at increasing x. The epicanthic fold was being drawn at `+ side * 4`, i.e.
  // on the temple side, and the long lashes at the tear duct.
  const half = Math.floor(lid.width / 2);

  if (shape === 'narrow' && state !== 'closed') {
    drawStamp(raster, INNER_FOLD, centerX - side * (half - 1), centerY, paints, book, { flipX: !flip });
  }

  if (eyelashes === 'long' && state !== 'closed') {
    drawStamp(raster, LASH_LONG, centerX + side * half, centerY - 3, paints, book, { flipX: !flip });
  }
}
