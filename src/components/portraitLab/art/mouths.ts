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
import { hexToRgb } from '../core/color';
import {
  drawStamp, endCurve, insertRows, narrowStamp, PaintTable, rampPaint,
  relativePaints, removeRow, rgbPaint, Stamp, stamp, widenStamp,
} from '../core/stamp';
import { DentalWork, Expression, LipShape } from '../spec/types';
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

/**
 * Lips resting closed, but not sealed — one row of teeth showing between them.
 *
 * This exists for modified teeth. Blackened, filed or inlaid teeth are worked
 * on precisely so that they are seen, and a portrait of someone who has had
 * that done with the mouth shut is a portrait that omits the thing. The grin is
 * the wrong instrument: it puts a broad smile on every persona who lacquered
 * their teeth, when the practice belonged to composed married women as often as
 * to anyone. A parted lip shows the work without inventing the mood.
 */
const PARTED = stamp(
  `
  ....-----....
  ..uuUUuUUuu..
  .mtttttttttm.
  ..ddDDDDDdd..
  ...ddddddd...
  ...-=====-...
  `,
  { anchor: { x: 6, y: 2 } }
);

/**
 * The same parting, one row deeper, for lacquered teeth.
 *
 * A single row of enamel is enough to show white teeth against a lip, and not
 * nearly enough to show black ones: laid over the row where the mouth line
 * already sits, blackened teeth came out looking exactly like a closed mouth.
 * The modification has to be visible as an *opening* before its colour can say
 * anything, so the lacquer gets two rows and the white does not.
 */
const PARTED_DEEP = stamp(
  `
  ....-----....
  ..uuUUuUUuu..
  .mtttttttttm.
  .mtttttttttm.
  ..ddDDDDDdd..
  ...ddddddd...
  ...-=====-...
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

/**
 * Lip fullness and width, applied to whichever base the expression picked.
 *
 * Every shape here has to change the outline. `bow` used to return the stamp
 * untouched, on the reasoning that the base drawing already carries a cupid's
 * bow — which is true, and which meant `bow` and `medium` rendered the same
 * pixels. A row of the card that names a shape the picture does not draw is
 * worse than no row at all, because the reader checks it.
 *
 * The four that do vary are kept on separate axes so no two collide: `thin` and
 * `full` move the lower lip, `bow` moves the upper one and takes width out,
 * `wide` only adds width.
 */
function shapeMouth(art: Stamp, lipShape: LipShape, ageThinning = 0): Stamp {
  // The vermillion of the lip shrinks steadily with age, so an old mouth is a
  // narrower band no matter what shape it started as.
  const shape: LipShape =
    ageThinning > 0.62 && lipShape !== 'thin'
      ? (lipShape === 'full' ? 'medium' : 'thin')
      : lipShape;
  const lowerLipRow = art.rows.findIndex(row => row.includes('D'));
  const upperLipRow = art.rows.findIndex(row => row.includes('u') || row.includes('U'));
  switch (shape) {
    case 'thin':
      return lowerLipRow >= 0 ? removeRow(art, lowerLipRow + 1) : art;
    case 'full': {
      // Both lips, and the lower first so inserting above it does not move the
      // index the second insert is measured from.
      const fuller = lowerLipRow >= 0 ? insertRows(art, lowerLipRow, 1) : art;
      return upperLipRow >= 0 ? insertRows(fuller, upperLipRow, 1) : fuller;
    }
    case 'wide':
      return widenStamp(art, 4);
    case 'bow': {
      // Small and short, with the upper lip carrying the height — which is what
      // a bow mouth is. Widening the *upper* lip while taking columns out of
      // the whole makes it unmistakable against `full`, which grows both.
      const narrowed = narrowStamp(art, 2);
      const upper = narrowed.rows.findIndex(row => row.includes('u') || row.includes('U'));
      return upper >= 0 ? insertRows(narrowed, upper, 1) : narrowed;
    }
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
  /** 0..1; thins the lips the way age does. */
  ageThinning?: number;
  /** No teeth behind the lips: they fall inward and the mouth sinks. */
  toothless?: boolean;
  /** Blackened, filed or inlaid teeth. Parts the lips so they can be seen. */
  dental?: DentalWork | null;
}

/**
 * Note the absence of MAT.BEARD: a moustache is drawn into the base layer, so
 * excluding it here means the moustache overhangs the upper lip for free.
 */
const MOUTH_SURFACE = new Set<number>([MAT.SKIN, MAT.LIP, MAT.TEETH, MAT.PAINT]);

export function drawMouth(options: DrawMouthOptions): void {
  const {
    raster, book, paints, expression, lipShape, centerX, y,
    bendBias = 0, ageThinning = 0, toothless = false, dental = null,
  } = options;
  const pose = poseFor(expression);
  // Losing teeth thins the lips past anything age alone does, because there is
  // nothing behind them to hold their shape.
  const thinning = toothless ? Math.max(ageThinning, 0.92) : ageThinning;
  // Modified teeth part a mouth that would otherwise be shut — but only one
  // that is shut. An expression that already opens the mouth, or one held
  // deliberately tight, keeps its own pose; overriding those would flatten
  // thirteen expressions back down to one.
  const showTeeth = dental && !toothless && pose.base === CLOSED;
  const parted = dental?.style === 'blackened' ? PARTED_DEEP : PARTED;
  const art = shapeMouth(showTeeth ? parted : pose.base, lipShape, thinning);
  const bend = pose.bend + bendBias;

  drawStamp(raster, art, centerX, y, paints, book, {
    onlyOver: MOUTH_SURFACE,
    columnShift: bend === 0 && pose.asymmetry === 0
      ? undefined
      : endCurve(art.width, bend, pose.asymmetry),
  });

  if (toothless) {
    // Thin lips alone read as a stern mouth, not an empty one. What actually
    // says "no teeth" is that the whole area *sinks*: the upper lip falls in
    // against the gum and the chin rides up beneath. Two shallow bands of
    // shadow, one above and one below, and the mouth stops being a line on a
    // face and starts being a hollow in it.
    const half = Math.round(art.width / 2) - 1;
    for (let dx = -half; dx <= half; dx += 1) {
      // Narrower at the ends, so the sinking follows the mouth's own curve
      // instead of sitting on it as a rectangle.
      const taper = 1 - Math.pow(Math.abs(dx) / Math.max(1, half), 2);
      if (taper < 0.3) continue;
      const x = centerX + dx;
      for (const dy of [-3, -2, 3, 4] as const) {
        if (raster.matAt(x, y + dy) !== MAT.SKIN) continue;
        raster.shift(x, y + dy, Math.abs(dy) > 2 ? 1 : 2, book);
      }
    }
  }

  if (dental && !toothless) drawDentalWork(raster, dental, centerX, y);
}

/**
 * What was done to the teeth, worked over whatever enamel the mouth exposed.
 *
 * Driven off the material rather than off the stamp, so it lands correctly on a
 * parted lip, a grin and an open mouth alike, and lands on nothing at all when
 * the expression happens to hide the teeth. That last case is the reason this
 * is not drawn as a marking: a marking would have painted a black bar across
 * the closed lips of anyone who had lacquered their teeth.
 */
function drawDentalWork(
  raster: Raster,
  dental: DentalWork,
  centerX: number,
  mouthY: number
): void {
  const stone = hexToRgb(dental.color);
  for (let dy = -4; dy <= 4; dy += 1) {
    const y = mouthY + dy;
    for (let dx = -8; dx <= 8; dx += 1) {
      const x = centerX + dx;
      if (raster.matAt(x, y) !== MAT.TEETH) continue;
      switch (dental.style) {
        case 'blackened':
          // Lacquer, not decay: near-black but wet, so it keeps a highlight
          // along the upper row where a flat black would kill the whole mouth.
          raster.set(x, y, dy < 0 && (dx === -2 || dx === -1)
            ? { r: 74, g: 66, b: 62 }
            : { r: 24, g: 19, b: 20 }, MAT.TEETH);
          break;
        case 'filed':
          // Points. Every other tooth taken back to the dark of the mouth,
          // which at this size is the only way a sawtooth edge reads as one.
          if ((dx + 16) % 2 === 0) raster.set(x, y, { r: 46, g: 26, b: 28 }, MAT.TEETH);
          break;
        case 'inlay':
          // A stone set into one of the front teeth, off centre because a
          // symmetrical pair reads as a mistake rather than as jewellery.
          if (dx === 1) raster.set(x, y, stone, MAT.GEM);
          break;
      }
    }
  }
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
