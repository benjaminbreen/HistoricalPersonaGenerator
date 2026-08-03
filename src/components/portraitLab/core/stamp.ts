/**
 * portraitLab/core/stamp.ts
 *
 * Hand-authored pixel art, written as ASCII.
 *
 * The old renderer computes a nose out of arithmetic — a loop over shadow
 * intensities and offsets. At 3px wide that reads as noise no matter how clever
 * the maths. Real pixel artists place the five pixels by hand.
 *
 * So the features here are *drawn*, in text, and stored as small glyph tables:
 *
 *     const NOSE_AQUILINE = stamp(`
 *       ..-.
 *       ..=.
 *       .-=.
 *       -==+
 *       .###
 *     `);
 *
 * Characters are painted through a table, and most of them are *relative*:
 * `-` means "one ramp step darker than whatever is already here". That means a
 * single authored nose reads correctly on any skin tone, in light or in shadow,
 * with no recolouring pass. Adding a new nose shape is four lines of text.
 *
 * Shared vocabulary (any stamp may extend it):
 *   .  transparent          +  one step lighter       ^  two steps lighter
 *   -  one step darker      =  two steps darker       ~  three steps darker
 *   #  outline colour of the underlying material
 */

import { RGB } from './color';
import { MAT, MaterialId, RampBook, Raster } from './raster';

export interface Stamp {
  width: number;
  height: number;
  rows: string[];
  /** Anchor point, so callers position by a meaningful landmark. */
  anchorX: number;
  anchorY: number;
}

export interface StampOptions {
  /** Landmark inside the art, defaults to the horizontal centre / top row. */
  anchor?: { x: number; y: number };
}

/**
 * Parse ASCII art. All whitespace is ignored, so stamps can be indented to
 * match the surrounding code; use `.` for transparent pixels.
 */
export function stamp(art: string, options: StampOptions = {}): Stamp {
  const rows = art
    .split('\n')
    .map(line => line.replace(/\s+/g, ''))
    .filter(line => line.length > 0);
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const padded = rows.map(row => row.padEnd(width, '.'));
  return {
    width,
    height: padded.length,
    rows: padded,
    anchorX: options.anchor?.x ?? Math.floor(width / 2),
    anchorY: options.anchor?.y ?? 0,
  };
}

/**
 * Widen a stamp by duplicating its centre columns. Used so one authored mouth
 * covers both a narrow and a wide pair of lips without a second drawing.
 */
export function widenStamp(art: Stamp, extraColumns: number): Stamp {
  if (extraColumns <= 0) return art;
  const mid = Math.floor(art.width / 2);
  const rows = art.rows.map(row => row.slice(0, mid) + row[mid].repeat(extraColumns) + row.slice(mid));
  return {
    width: art.width + extraColumns,
    height: art.height,
    rows,
    anchorX: art.anchorX + (art.anchorX >= mid ? extraColumns : 0),
    anchorY: art.anchorY,
  };
}

/**
 * Narrow a stamp by dropping centre columns — the inverse of `widenStamp`.
 *
 * A small mouth is not a wide one drawn faintly, it is a shorter one, and the
 * only honest way to say so at this size is to take the columns out.
 */
export function narrowStamp(art: Stamp, columns: number): Stamp {
  if (columns <= 0 || art.width - columns < 3) return art;
  const mid = Math.floor(art.width / 2);
  const start = Math.max(0, mid - Math.floor(columns / 2));
  const rows = art.rows.map(row => row.slice(0, start) + row.slice(start + columns));
  return {
    width: art.width - columns,
    height: art.height,
    rows,
    anchorX: art.anchorX > start ? Math.max(start, art.anchorX - columns) : art.anchorX,
    anchorY: art.anchorY,
  };
}

/** Duplicate a row — a fuller lower lip, a taller crown, a deeper brim. */
export function insertRows(art: Stamp, atIndex: number, times: number): Stamp {
  if (times <= 0) return art;
  const rows = [...art.rows];
  const source = rows[Math.max(0, Math.min(rows.length - 1, atIndex))];
  rows.splice(atIndex + 1, 0, ...new Array(times).fill(source));
  return {
    width: art.width,
    height: art.height + times,
    rows,
    anchorX: art.anchorX,
    anchorY: art.anchorY > atIndex ? art.anchorY + times : art.anchorY,
  };
}

/** Drop a row, for thinner lips and shallower brims. */
export function removeRow(art: Stamp, atIndex: number): Stamp {
  if (art.height <= 1) return art;
  const rows = [...art.rows];
  const index = Math.max(0, Math.min(rows.length - 1, atIndex));
  rows.splice(index, 1);
  return {
    width: art.width,
    height: art.height - 1,
    rows,
    anchorX: art.anchorX,
    anchorY: art.anchorY > index ? art.anchorY - 1 : art.anchorY,
  };
}

export type Paint =
  | { kind: 'skip' }
  /** Absolute step on a named ramp. */
  | { kind: 'ramp'; ramp: import('./color').Ramp; material: MaterialId; index: number; alpha?: number }
  /** Relative move along whatever ramp is already at this pixel. */
  | { kind: 'delta'; amount: number }
  /** A literal colour, for glints and gem facets. */
  | { kind: 'rgb'; color: RGB; material: MaterialId; alpha?: number; shade?: number }
  /** The outline colour of the underlying material. */
  | { kind: 'outline' };

export type PaintTable = Record<string, Paint>;

export const SKIP: Paint = { kind: 'skip' };

/** The relative-shading characters every stamp understands. */
export function relativePaints(): PaintTable {
  return {
    '.': SKIP,
    '+': { kind: 'delta', amount: -1 },
    '^': { kind: 'delta', amount: -2 },
    '-': { kind: 'delta', amount: 1 },
    '=': { kind: 'delta', amount: 2 },
    '~': { kind: 'delta', amount: 3 },
    '#': { kind: 'outline' },
  };
}

export interface DrawStampOptions {
  flipX?: boolean;
  /** Only paint where the target already has one of these materials. */
  onlyOver?: Set<number>;
  /** Never paint over these materials. */
  skipOver?: Set<number>;
  alpha?: number;
  /**
   * Per-column vertical offset applied at draw time. This is how one authored
   * mouth becomes a smile, a frown, and a smirk: bend the ends up, down, or one
   * of each, without redrawing anything.
   */
  columnShift?: (column: number) => number;
}

/**
 * Raise (positive) or drop (negative) the ends of a stamp, leaving the middle
 * where it is. Feed the result to `columnShift`.
 */
export function endCurve(width: number, amount: number, asymmetry = 0): (column: number) => number {
  const center = (width - 1) / 2;
  return column => {
    const distance = center === 0 ? 0 : (column - center) / center;
    const falloff = Math.pow(Math.abs(distance), 1.7);
    const sideScale = distance < 0 ? 1 - asymmetry : 1 + asymmetry;
    return -Math.round(amount * falloff * sideScale);
  };
}

export function drawStamp(
  raster: Raster,
  art: Stamp,
  x: number,
  y: number,
  table: PaintTable,
  book: RampBook,
  options: DrawStampOptions = {}
): void {
  const { flipX = false, onlyOver, skipOver, alpha = 1, columnShift } = options;
  const originX = x - (flipX ? art.width - 1 - art.anchorX : art.anchorX);
  const originY = y - art.anchorY;

  for (let row = 0; row < art.height; row += 1) {
    for (let col = 0; col < art.width; col += 1) {
      const sourceCol = flipX ? art.width - 1 - col : col;
      const ch = art.rows[row][sourceCol];
      const paint = table[ch];
      if (!paint || paint.kind === 'skip') continue;

      const tx = originX + col;
      const ty = originY + row + (columnShift ? columnShift(col) : 0);
      if (!raster.inside(tx, ty)) continue;

      const targetMat = raster.matAt(tx, ty);
      if (onlyOver && !onlyOver.has(targetMat)) continue;
      if (skipOver && skipOver.has(targetMat)) continue;

      switch (paint.kind) {
        case 'delta': {
          raster.shift(tx, ty, paint.amount, book);
          break;
        }
        case 'ramp': {
          const index = Math.max(0, Math.min(paint.ramp.steps.length - 1, paint.index));
          const a = (paint.alpha ?? 1) * alpha;
          raster.blend(tx, ty, paint.ramp.steps[index], a, paint.material, index);
          break;
        }
        case 'rgb': {
          const a = (paint.alpha ?? 1) * alpha;
          raster.blend(tx, ty, paint.color, a, paint.material, paint.shade ?? 255);
          break;
        }
        case 'outline': {
          const ramp = book[targetMat] || book[MAT.SKIN];
          if (ramp) raster.set(tx, ty, ramp.outline, targetMat, 6);
          break;
        }
        default:
          break;
      }
    }
  }
}

/** Convenience for building `{ kind: 'ramp' }` paints. */
export function rampPaint(
  ramp: import('./color').Ramp,
  material: MaterialId,
  index: number,
  alpha?: number
): Paint {
  return { kind: 'ramp', ramp, material, index, alpha };
}

export function rgbPaint(color: RGB, material: MaterialId, alpha?: number): Paint {
  return { kind: 'rgb', color, material, alpha };
}
