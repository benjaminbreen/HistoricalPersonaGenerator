/**
 * portraitLab/art/ears.ts
 *
 * Ears are built as their own small volume attached to the skull, not stamped
 * onto whatever skin happens to be there — they have to protrude past the
 * silhouette by a pixel or two, or they simply vanish, which is what happens
 * when an ear is drawn as a relative-shading stamp clipped to the head.
 *
 * Two things make the difference between an ear and a paddle. The first is that
 * it is hung on the silhouette *row by row*: the skull is at its widest around
 * the brow and narrows through the jaw, so an ear pinned to a single
 * headHalfWidth ends up welded to the temple at the top and floating a full
 * five pixels clear of the cheek at the bottom. The second is taper — a real
 * ear is a wide helix over a small lobe, and drawing it as a straight-sided
 * bean is most of why procedural ears read as elf ears.
 *
 * The near ear catches the key light along its helix; the far ear is turned
 * away and sits a step or two down the ramp. Mirroring one drawing for both is
 * a large part of why procedural heads read as flat.
 */

import {
  applyContactShadow, fillMask, MAT, Mask, makeMask, RampBook, Raster,
} from '../core/raster';
import { PortraitRamps } from './palette';

export interface DrawEarOptions {
  raster: Raster;
  book: RampBook;
  ramps: PortraitRamps;
  centerX: number;
  /** Half-width of the skull at a given row — the ear is hung on this. */
  edgeAt: (y: number) => number;
  top: number;
  bottom: number;
  side: -1 | 1;
  ageLines?: number;
}

/**
 * The ear's width down its own length, as a fraction of full size: a broad
 * helix through the upper third, a waist at the tragus, and a small lobe.
 */
function earTaper(t: number): number {
  if (t < 0.16) return 0.55 + (t / 0.16) * 0.42;
  if (t < 0.46) return 0.97 + (t - 0.16) * 0.1;
  if (t < 0.74) return 1 - ((t - 0.46) / 0.28) * 0.22;
  return Math.max(0.24, 0.78 - ((t - 0.74) / 0.26) * 0.5);
}

export function drawEar(options: DrawEarOptions): Mask {
  const { raster, book, ramps, centerX, edgeAt, top, bottom, side, ageLines = 0 } = options;
  const { width: w, height: h } = raster;
  const near = side === -1;

  const span = Math.max(1, bottom - top);
  // Older ears are genuinely larger — cartilage keeps growing — and they sit
  // slightly further off the skull.
  const scale = 1 + (ageLines > 0.6 ? 0.12 : 0);

  // How far the ear reaches past the silhouette, and how far it bites into the
  // cheek behind it. Both track the taper, so the lobe tucks in against the jaw
  // instead of hanging off it.
  const outAt = (t: number) => (2.2 * earTaper(t) - 0.35) * scale;
  const inAt = (t: number) => 2.1 * earTaper(t) * scale;

  const mask: Mask = makeMask(w, h);
  const y0 = Math.max(0, Math.round(top));
  const y1 = Math.min(h - 1, Math.round(bottom));
  for (let py = y0; py <= y1; py += 1) {
    const t = (py + 0.5 - top) / span;
    const edge = edgeAt(py);
    const outer = edge + outAt(t);
    const inner = edge - inAt(t);
    if (outer <= inner) continue;
    for (let px = 0; px < w; px += 1) {
      const d = side === -1 ? centerX - (px + 0.5) : (px + 0.5) - centerX;
      if (d < inner || d > outer) continue;
      mask[py * w + px] = 1;
    }
  }

  fillMask(raster, mask, ramps.skin, MAT.SKIN, (px, py) => {
    const t = (py + 0.5 - top) / span;
    const edge = edgeAt(py);
    const inner = edge - inAt(t);
    const outer = edge + outAt(t);
    // 0 at the crease against the skull, 1 at the outer rim of the helix.
    const d = side === -1 ? centerX - (px + 0.5) : (px + 0.5) - centerX;
    const u = Math.max(0, Math.min(1, (d - inner) / Math.max(0.8, outer - inner)));

    // The rim catches light, the crease against the head is the darkest thing
    // on the ear. The far ear is turned away from the key and gets less of both.
    let index = near ? 4.8 - u * 2.3 : 5.2 - u * 1.3;
    // The concha — the bowl behind the rim — is the interior shadow.
    if (u > 0.2 && u < 0.62 && t > 0.14 && t < 0.72) index += near ? 1.0 : 0.6;
    // Lobe is solid flesh, no bowl, and sits out of the light.
    if (t > 0.78) index += 0.5;
    return index;
  });

  // The crease where the ear meets the skull, cast inward onto the cheek. This
  // is what stops ear and cheek reading as one wide slab of skin.
  applyContactShadow(raster, mask, book, {
    dx: side === -1 ? 1 : -1, dy: 0, strength: 2, depth: 1,
  });
  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
  return mask;
}
