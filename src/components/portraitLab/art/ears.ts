/**
 * portraitLab/art/ears.ts
 *
 * Ears are built as their own small volume attached to the skull, not stamped
 * onto whatever skin happens to be there — they have to protrude past the
 * silhouette by a pixel or two, or they simply vanish, which is what happens
 * when an ear is drawn as a relative-shading stamp clipped to the head.
 *
 * The near ear catches the key light along its helix; the far ear is turned
 * away and sits a step or two down the ramp. Mirroring one drawing for both is
 * a large part of why procedural heads read as flat.
 */

import {
  applyContactShadow, fillMask, MAT, Mask, makeMask, maskEllipse, RampBook, Raster,
} from '../core/raster';
import { PortraitRamps } from './palette';

export interface DrawEarOptions {
  raster: Raster;
  book: RampBook;
  ramps: PortraitRamps;
  /** Centre of the ear, normally a pixel inside the head silhouette. */
  x: number;
  y: number;
  height: number;
  side: -1 | 1;
  ageLines?: number;
}

export function drawEar(options: DrawEarOptions): Mask {
  const { raster, book, ramps, x, y, height, side, ageLines = 0 } = options;
  const { width: w, height: h } = raster;

  const rx = 2.7;
  const ry = height / 2 + (ageLines > 0.6 ? 1 : 0);
  const near = side === -1;

  const shell = maskEllipse(w, h, x, y, rx, ry);

  // Squash the top and bottom so it reads as an ear rather than a bean.
  const mask: Mask = makeMask(w, h);
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      if (!shell[py * w + px]) continue;
      const t = (py - (y - ry)) / (2 * ry);
      const inset = t < 0.18 ? 0.8 : t > 0.82 ? 1.1 : 0;
      if (Math.abs(px + 0.5 - x) > rx - inset) continue;
      mask[py * w + px] = 1;
    }
  }

  fillMask(raster, mask, ramps.skin, MAT.SKIN, (px, py) => {
    const dx = (px + 0.5 - x) / rx;
    const dy = (py + 0.5 - y) / ry;
    // Outer edge is the helix rim; it catches light on the near ear.
    const outward = side === -1 ? -dx : dx;
    const base = near ? 3.1 : 4.2;
    return base - outward * 1.5 + Math.abs(dy) * 0.5;
  });

  // The concha — the bowl. One or two steps down, offset toward the head.
  const bowlX = x + side * 0.9;
  for (let py = Math.round(y - ry * 0.55); py <= Math.round(y + ry * 0.45); py += 1) {
    for (let d = 0; d <= 1; d += 1) {
      const px = Math.round(bowlX + side * d);
      if (!mask[py * w + px]) continue;
      raster.shift(px, py, near ? 2 : 1, book);
    }
  }

  applyContactShadow(raster, mask, book, { dx: side === -1 ? -1 : 1, dy: 1, strength: 1, depth: 1 });
  return mask;
}
