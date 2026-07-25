/**
 * portraitLab/art/brows.ts
 *
 * Brows are the one feature that genuinely wants to be procedural rather than
 * stamped, because they are a *stroke* — a curve with a thickness that varies
 * along its length — and because expression moves them continuously. A raised
 * inner corner is sadness, a lowered inner corner is anger, and the difference
 * is one pixel.
 */

import { MAT, RampBook, Raster } from '../core/raster';
import { makeRng } from '../core/rng';
import { BrowShape, BrowThickness } from '../spec/types';
import { PortraitRamps } from './palette';

const THICKNESS: Record<BrowThickness, number> = {
  thin: 1,
  medium: 1.7,
  thick: 2.4,
  bushy: 3.1,
};

/**
 * Height of the brow above its baseline, as a function of position.
 * t = 0 at the outer (temple) end, 1 at the inner (nose) end.
 *
 * The inner end must never sit higher than the outer end at rest. A brow whose
 * medial end rides up is the universal signal for worry or grief, and getting
 * this backwards gives every single persona a permanently stricken look — a
 * one-pixel error that reads as a personality.
 */
function browCurve(shape: BrowShape, t: number): number {
  switch (shape) {
    case 'arched':
      // Peaks over the lateral third, then falls away toward the nose.
      return Math.exp(-((t - 0.36) ** 2) / 0.09) * 2.4 + 0.4;
    case 'rounded':
      return Math.sin(t * Math.PI) * 1.9 + 0.5;
    case 'angular':
      // A hard break rather than a curve.
      return t < 0.4 ? 0.6 + t * 5 : 2.6 - (t - 0.4) * 3.2;
    default:
      // "Straight" is not flat — it still lifts slightly through the middle.
      return 0.7 + Math.sin(t * Math.PI) * 0.4;
  }
}

export interface DrawBrowOptions {
  raster: Raster;
  book: RampBook;
  ramps: PortraitRamps;
  shape: BrowShape;
  thickness: BrowThickness;
  /** Screen x of the pupil this brow sits above. */
  centerX: number;
  /** Screen y of the brow baseline. */
  baseY: number;
  side: -1 | 1;
  length?: number;
  seed?: number;
  /** Expression: negative lifts the whole brow. */
  lift?: number;
  /** Expression: positive raises the inner end (worry), negative lowers it (anger). */
  innerTilt?: number;
  /** 0..1 extra weight for older faces. */
  ageLines?: number;
}

export function drawBrow(options: DrawBrowOptions): void {
  const {
    raster, book, ramps, shape, thickness,
    centerX, baseY, side, length = 13, seed = 1,
    lift = 0, innerTilt = 0, ageLines = 0,
  } = options;

  const rng = makeRng(seed);
  const weight = THICKNESS[thickness] + ageLines * 0.5;
  const half = (length - 1) / 2;

  for (let i = 0; i < length; i += 1) {
    // Walk from the outer (temple) end toward the nose.
    const t = i / (length - 1);
    const px = Math.round(centerX + side * (half - i));
    const height = browCurve(shape, t) + lift + innerTilt * t;

    // Brows thin out at both ends; the tail is always the lightest.
    const taper = Math.min(1, Math.sin(Math.min(1, Math.max(0, t * 1.05 + 0.06)) * Math.PI) * 1.5);
    const rows = Math.max(1, Math.round(weight * (0.45 + taper * 0.75)));
    const top = Math.round(baseY - height);

    // Only on bare skin — a fringe or a low brim occludes the brow for free.
    const onSkin = (y: number) => raster.matAt(px, y) === MAT.SKIN;

    for (let r = 0; r < rows; r += 1) {
      const y = top + r;
      if (!onSkin(y)) continue;
      // The underside of the brow is its darkest edge; the top catches light.
      const index = r === 0 ? 3 : r === rows - 1 ? 6 : 5;
      raster.set(px, y, ramps.brow.steps[index], MAT.BROW, index);
    }

    // Bushy brows break their own outline with stray hairs.
    if (thickness === 'bushy' && rng() > 0.55 && onSkin(top - 1)) {
      raster.set(px, top - 1, ramps.brow.steps[4], MAT.BROW, 4);
    }
    if (thickness === 'bushy' && ageLines > 0.6 && rng() > 0.7 && onSkin(top + rows)) {
      raster.set(px, top + rows, ramps.brow.steps[4], MAT.BROW, 4);
    }
  }
}

/**
 * The vertical crease between the brows. Appears with age, and deepens with a
 * scowl or with concentration.
 */
export function drawGlabellaLines(
  raster: Raster,
  book: RampBook,
  centerX: number,
  y: number,
  strength: number
): void {
  if (strength <= 0.25) return;
  const depth = strength > 0.7 ? 2 : 1;
  const rows = strength > 0.55 ? 3 : 2;
  for (let r = 0; r < rows; r += 1) {
    raster.shift(centerX - 2, y + r, depth, book);
    raster.shift(centerX + 2, y + r, depth, book);
  }
}
