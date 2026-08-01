/**
 * encounter/sprite/denseRamp.ts
 *
 * Thirteen steps where the portrait uses seven.
 *
 * The last gap between these sprites and the style reference was that fold
 * shading *stepped* where the reference's rolls. It was tempting to read that
 * as a placement problem — the wrong terminator, the wrong kernel — and two
 * passes were spent tuning those without moving it. It is not a placement
 * problem. It is arithmetic: a cylinder lit across a 7-step ramp has at most
 * seven values to spend on its whole turn, and once the broad light, the fold
 * valleys, the ridges and the occlusion have each taken a step there is
 * nothing left for the transitions. The plateaus are wide because there are
 * too few of them, and no amount of moving the boundaries around changes that.
 *
 * So the sprite interpolates the portrait's ramp to double resolution and
 * shades against that. This is not a departure from pixel art — a longer
 * palette is exactly what a pixel artist reaches for when a form needs a
 * smoother roll, and every value here still lies on the line the portrait's
 * own ramp already drew between its endpoints. The two views stay in
 * agreement, because the dense ramp *is* the portrait's ramp, sampled finer.
 *
 * Biases stay in the old units. Everything that calls `addBias` was authored
 * against a 7-step ladder, so `resolveLight` doubles them on the way in; a
 * crease worth one step still reads as one step's worth of darkening.
 */

import { Ramp, RGB } from '../../components/portraitLab/core/color';
import { RampBook } from '../../components/portraitLab/core/raster';

/** Steps in a dense ramp. Two of these to one of the portrait's, less the shared end. */
export const DENSE_LEN = 13;

/** How many dense steps one authored bias step is worth. */
export const BIAS_SCALE = 2;

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

/**
 * Interpolate a 7-step ramp to 13. Even indices are the originals, odd ones
 * the midpoints, so the endpoints and the base value are untouched and a
 * material's own colour still lands exactly on a step.
 */
export function densify(ramp: Ramp): Ramp {
  const steps: RGB[] = [];
  for (let i = 0; i < DENSE_LEN; i += 1) {
    const src = i / 2;
    const lo = Math.floor(src);
    const hi = Math.min(ramp.steps.length - 1, lo + 1);
    steps.push(src === lo ? { ...ramp.steps[lo] } : mix(ramp.steps[lo], ramp.steps[hi], src - lo));
  }
  return { steps, outline: ramp.outline, baseHex: ramp.baseHex };
}

/**
 * Stretch a ramp's contrast about its base step, in place of rebuilding it.
 *
 * The portrait deliberately gives skin a narrow range — a bust fills the frame
 * and overshading a face that large reads as grime. A sprite's head is 32px
 * and competes with a whole figure for attention, so the same ramp comes out
 * washed out: the face reads as a flat pale shape with marks on it. Widening
 * only for the sprite keeps the portrait's judgement intact while letting the
 * small head carry a real light and shadow side.
 */
function stretch(ramp: Ramp, amount: number): Ramp {
  const base = ramp.steps[Math.floor(ramp.steps.length / 2)];
  return {
    ...ramp,
    steps: ramp.steps.map((c) => ({
      r: Math.max(0, Math.min(255, Math.round(base.r + (c.r - base.r) * amount))),
      g: Math.max(0, Math.min(255, Math.round(base.g + (c.g - base.g) * amount))),
      b: Math.max(0, Math.min(255, Math.round(base.b + (c.b - base.b) * amount))),
    })),
  };
}

/** Materials whose portrait ramp is too gentle once the head is this small. */
const STRETCH: Record<number, number> = {};

/** The same book, every ramp densified. Built once per compiled sprite. */
export function densifyBook(book: RampBook, stretchBy: Record<number, number> = STRETCH): RampBook {
  return book.map((r, mat) => {
    if (!r) return null;
    const k = stretchBy[mat];
    return densify(k && k !== 1 ? stretch(r, k) : r);
  });
}
