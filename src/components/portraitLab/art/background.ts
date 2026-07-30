/**
 * portraitLab/art/background.ts
 *
 * A backdrop, not wallpaper. Its job is to separate the head from the frame and
 * to carry a hint of place — the authenticity service supplies a base and an
 * accent per context pack, and everything here is built from those two.
 *
 * The gradient is dithered rather than smooth, because a smooth ramp behind
 * hard pixel art is the fastest way to make the art look pasted on. Dithered,
 * not *ordered*-dithered: a repeating matrix behind the sitter is its own kind
 * of wrong, and the threshold comes from `dispersed` for that reason.
 */

import { buildRamp } from '../core/color';
import { bayer, fillMask, MAT, maskRect } from '../core/raster';
import { makeNoise1D, makeNoise2D } from '../core/rng';
import { RenderContext } from '../render/context';

export function drawBackground(context: RenderContext): void {
  const { raster, spec, anatomy, ramps } = context;
  const { size, centerX } = anatomy;
  const accent = buildRamp(spec.background.accent, { contrast: 0.85, shift: 0.3, saturation: 0.85 });
  const noise = makeNoise1D(spec.seed ^ 0x0bad);

  const headCx = centerX;
  const headCy = anatomy.headTop + anatomy.headHeight * 0.45;

  // How deeply this century modelled its grounds, and where it set them. Flat
  // and light is not an absence of the effect below — a plastered wall and a
  // photographer's backdrop really are evenly lit, and rendering them with an
  // oil painter's falloff is what made six eras look like one.
  const depth = spec.background.depth ?? 1;
  const lift = spec.background.lift ?? 0;

  // The canvas is drawn square and shown short, so everything that has to be
  // centred on the *picture* — the fall from top to bottom, and the vignette —
  // measures against the visible rows rather than the drawn ones. Using `size`
  // put the vignette's centre six rows below the middle of what anyone sees,
  // which closed the top corners harder than the bottom ones.
  const view = anatomy.viewHeight;

  const full = maskRect(size, size, 0, 0, size, size);
  fillMask(raster, full, ramps.background, MAT.BG, (x, y) => {
    // A soft glow behind the head lifts the silhouette away from the frame.
    const halo = Math.hypot((x - headCx) / (anatomy.headHalfWidth * 2.1), (y - headCy) / (anatomy.headHeight * 1.5));
    const vertical = y / view;
    let index = 2.4 + lift + (halo * 1.9 + vertical * 0.8) * depth;
    if (spec.background.vignette) {
      const corner = Math.hypot((x - size / 2) / (size / 2), (y - view / 2) / (view / 2));
      index += Math.max(0, corner - 0.62) * 3.4 * (spec.background.vignetteStrength ?? 1);
    }
    return index;
    // Enough dither to dissolve a step boundary and no more.
    //
    // This ran at 0.55 through an ordered Bayer matrix, and between them those
    // two facts put a fine checkered lattice across the whole upper corner of
    // every portrait: the amplitude reached far enough either side of each
    // boundary for the bands to nearly meet, and the matrix repeats every four
    // pixels, so what the eye found was a screen door rather than a ground.
    // `fillMask` now thresholds against dispersed noise, which spreads more
    // evenly and therefore needs less of it — and what is left is a narrow
    // grain band at the boundary instead of a pattern over the whole corner.
    // Lower than this and the halo behind the head bands into visible rings.
  }, { dither: 0.45 });

  // A warm rake of the accent colour across the upper left, in the direction
  // the key light comes from. Subtle, and it ties the figure to its ground.
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = 1 - (x / size) * 0.7 - (y / view) * 0.6;
      if (t <= 0.5) continue;
      // The rake is a lit corner, so it fades with the same century that
      // flattens the ground.
      const strength = (t - 0.5) * 0.5 * Math.min(1.2, depth + 0.15);
      // Which pixels the rake lands on stays an ordered threshold, on purpose.
      // The regular lattice it makes is a *print screen* — the halftone of an
      // engraving or a photogravure — and it is one of the few things in the
      // picture that says the portrait is a made object rather than a window.
      // Dissolving it into a smooth wash removed the texture along with the
      // problem.
      if (bayer(x, y) > strength * 1.2) continue;
      const step = Math.max(0, Math.min(6, Math.round(3 - t * 2)));
      // The problem was never the lattice. It was that each dot was *set* at
      // full value, so a screen meant to be a hint of light in the corner came
      // out as hard specks that competed with the sitter. Blended, the pattern
      // is the same and each mark is a suggestion rather than a pixel of paint.
      raster.blend(x, y, accent.steps[step], 0.42, MAT.BG, step);
    }
  }

  /**
   * The surface the picture is made on.
   *
   * All four of these are one-step moves along the background's own ramp — a
   * backdrop that argues with the figure has stopped being a backdrop. What
   * separates them is *organisation*: grain is unstructured, plaster clumps,
   * canvas is a grid. That structure is the entire difference between a
   * photograph and a painting at this size, and it costs one pass.
   */
  const surface = spec.background.texture;
  const grain2d = makeNoise2D(spec.seed ^ 0x51fe);
  if (surface === 'grain') {
    // Silver grain: fine, dense, and directionless.
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (noise(x * 0.7 + y * 1.9) < 0.55) continue;
        const shade = raster.shadeAt(x, y);
        const next = Math.max(0, Math.min(6, shade + (bayer(x, y) > 0.5 ? 1 : -1)));
        raster.set(x, y, ramps.background.steps[next], MAT.BG, next);
      }
    }
  } else if (surface === 'plaster') {
    // Fresco tooth: broad soft patches where the lime went on unevenly, with
    // the odd pinhole. Lighter than the ground more often than darker, because
    // plaster is what the light is bouncing off.
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const patch = grain2d(x * 0.09, y * 0.09) + grain2d(x * 0.31, y * 0.28) * 0.4;
        const shade = raster.shadeAt(x, y);
        let delta = 0;
        if (patch > 0.34) delta = -1;
        else if (patch < -0.42) delta = 1;
        if (delta === 0 && noise(x * 2.3 + y * 0.7) > 0.93) delta = 1;
        if (delta === 0) continue;
        const next = Math.max(0, Math.min(6, shade + delta));
        raster.set(x, y, ramps.background.steps[next], MAT.BG, next);
      }
    }
  } else if (surface === 'weave') {
    // Primed canvas: a regular grid of warp and weft, one thread lit and the
    // next in its shadow. Kept to every third pixel so it reads as tooth under
    // the paint rather than as sacking.
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const warp = x % 3 === 0;
        const weft = y % 3 === 0;
        if (!warp && !weft) continue;
        const shade = raster.shadeAt(x, y);
        // The crossings sit proud and catch the light; the rest is the dip
        // between threads.
        const delta = warp && weft ? -1 : 1;
        if (delta > 0 && bayer(x, y) > 0.62) continue;
        const next = Math.max(0, Math.min(6, shade + delta));
        raster.set(x, y, ramps.background.steps[next], MAT.BG, next);
      }
    }
  }
}
