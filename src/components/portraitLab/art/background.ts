/**
 * portraitLab/art/background.ts
 *
 * A backdrop, not wallpaper. Its job is to separate the head from the frame and
 * to carry a hint of place — the authenticity service supplies a base and an
 * accent per context pack, and everything here is built from those two.
 *
 * The gradient is ordered-dithered rather than smooth, because a smooth ramp
 * behind hard pixel art is the fastest way to make the art look pasted on.
 */

import { buildRamp } from '../core/color';
import { bayer, fillMask, MAT, maskRect } from '../core/raster';
import { makeNoise1D } from '../core/rng';
import { RenderContext } from '../render/context';

export function drawBackground(context: RenderContext): void {
  const { raster, spec, anatomy, ramps } = context;
  const { size, centerX } = anatomy;
  const accent = buildRamp(spec.background.accent, { contrast: 0.85, shift: 0.3, saturation: 0.85 });
  const noise = makeNoise1D(spec.seed ^ 0x0bad);

  const headCx = centerX;
  const headCy = anatomy.headTop + anatomy.headHeight * 0.45;

  const full = maskRect(size, size, 0, 0, size, size);
  fillMask(raster, full, ramps.background, MAT.BG, (x, y) => {
    // A soft glow behind the head lifts the silhouette away from the frame.
    const halo = Math.hypot((x - headCx) / (anatomy.headHalfWidth * 2.1), (y - headCy) / (anatomy.headHeight * 1.5));
    const vertical = y / size;
    let index = 2.4 + halo * 1.9 + vertical * 0.8;
    if (spec.background.vignette) {
      const corner = Math.hypot((x - size / 2) / (size / 2), (y - size / 2) / (size / 2));
      index += Math.max(0, corner - 0.62) * 3.4;
    }
    return index;
  }, { dither: 0.55 });

  // A warm rake of the accent colour across the upper left, in the direction
  // the key light comes from. Subtle, and it ties the figure to its ground.
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = 1 - (x / size) * 0.7 - (y / size) * 0.6;
      if (t <= 0.5) continue;
      const strength = (t - 0.5) * 0.5;
      if (bayer(x, y) > strength * 1.2) continue;
      const step = Math.max(0, Math.min(6, Math.round(3 - t * 2)));
      raster.set(x, y, accent.steps[step], MAT.BG, step);
    }
  }

  if (spec.background.texture === 'grain') {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (noise(x * 0.7 + y * 1.9) < 0.55) continue;
        const shade = raster.shadeAt(x, y);
        const next = Math.max(0, Math.min(6, shade + (bayer(x, y) > 0.5 ? 1 : -1)));
        raster.set(x, y, ramps.background.steps[next], MAT.BG, next);
      }
    }
  }

}
