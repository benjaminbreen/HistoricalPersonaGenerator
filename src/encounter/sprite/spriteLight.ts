/**
 * encounter/sprite/spriteLight.ts
 *
 * One lamp for the whole figure.
 *
 * The old renderer shaded every part around *its own* axis — the sleeve had a
 * lit ridge down its middle, the torso a different one, each leg a third. Four
 * light sources on one body, which is why nothing read as volume no matter how
 * the contrast sliders moved: the eye resolves consistent lighting long before
 * it resolves anatomy.
 *
 * So parts no longer choose their own colours. They declare their *surface* —
 * a normal and a depth — into the form buffer below, and a single pass at the
 * end resolves every pixel against one key light. That one change also buys,
 * for free and consistently:
 *
 *   · ambient occlusion wherever a near part overlaps a far one (the arm's
 *     shadow on the coat, the chin's on the neck, the hem's on the shins),
 *   · rim light that only appears where the surface actually turns away,
 *   · an outline whose weight follows the form, because "how dark is this
 *     edge" and "how thick is its keyline" are now the same question.
 *
 * Banding is deliberate and hard-edged. The style reference carries three or
 * four values per material with visible boundaries between them; a smooth
 * gradient quantised late looks like a JPEG of pixel art.
 */

import {
  MAT, MaterialId, Mask, NO_SHADE, RampBook, Raster, dispersed,
} from '../../components/portraitLab/core/raster';
import { RGB } from '../../components/portraitLab/core/color';
import { SPRITE_H, SPRITE_W, SpriteTuning } from './skeleton';
import { BIAS_SCALE, DENSE_LEN } from './denseRamp';

const N = SPRITE_W * SPRITE_H;

/** Materials whose surface the light pass is allowed to re-shade. */
const LIT_MATS = new Set<number>([
  MAT.SKIN, MAT.CLOTH_A, MAT.CLOTH_B, MAT.CLOTH_C, MAT.HEADWEAR,
  MAT.HEADWEAR_ACCENT, MAT.LEATHER, MAT.WOOD, MAT.HAIR, MAT.BEARD,
  MAT.METAL, MAT.FOLIAGE,
]);

/**
 * Materials that are *drawn*, not lit: the eye, the mouth line, jewellery
 * stones. They are already the value they need to be and a lambert term
 * would only wash them out.
 */
const UNLIT_MATS = new Set<number>([
  MAT.SCLERA, MAT.IRIS, MAT.BROW, MAT.LIP, MAT.GEM, MAT.GLASS, MAT.TEETH, MAT.PAINT,
]);

/**
 * Surface description, parallel to the raster. Every part writes here as it
 * draws; nothing reads it until `resolveLight`.
 */
export class FormBuffer {
  readonly nx = new Float32Array(N);
  readonly ny = new Float32Array(N);
  readonly nz = new Float32Array(N);
  /** 0 far … 1 near. Drives occlusion and which edge gets the rim. */
  readonly depth = new Float32Array(N);
  readonly written = new Uint8Array(N);
  /**
   * Per-pixel shade bias, in *authored* ramp steps: folds, seams, weave.
   *
   * Deliberately floating point. As an `Int8Array` the smallest expressible
   * change was one authored step — four dense steps, about 26 luminance on a
   * widened cloth ramp — so any bias difference between neighbouring pixels
   * forced a jump that large. Measured across a skirt, 28% of adjacent pairs
   * differed by 44 luminance against the reference's 8.9 overall, while the
   * lighting gradient either side sat at a smooth 3.9: the terracing was
   * entirely the creases, and it was a quantisation artefact rather than a
   * choice. A cosine shoulder can now actually be a cosine.
   */
  readonly bias = new Float32Array(N);

  clear(): void {
    this.written.fill(0);
    this.bias.fill(0);
    this.depth.fill(0);
  }

  set(x: number, y: number, nx: number, ny: number, nz: number, depth: number): void {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    const i = y * SPRITE_W + x;
    const len = Math.hypot(nx, ny, nz) || 1;
    this.nx[i] = nx / len;
    this.ny[i] = ny / len;
    this.nz[i] = nz / len;
    this.depth[i] = depth;
    this.written[i] = 1;
    this.bias[i] = 0;
  }

  /** Nudge a pixel along its ramp *before* the light resolves it. */
  addBias(x: number, y: number, delta: number): void {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    const i = y * SPRITE_W + x;
    if (!this.written[i]) return;
    this.bias[i] = Math.max(-4, Math.min(4, this.bias[i] + delta));
  }

  depthAt(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return -1;
    const i = y * SPRITE_W + x;
    return this.written[i] ? this.depth[i] : -1;
  }
}

// ---------------------------------------------------------------------------
// Surface writers. Parts call these instead of picking colours.
// ---------------------------------------------------------------------------

/**
 * A vertical cylinder — torso, neck, hanging sleeve, leg. `axis` is the x of
 * the centre line, `r` the half-width. Pixels past the silhouette edge clamp
 * to a grazing normal rather than going imaginary.
 */
export function cylinderSurface(
  form: FormBuffer, mask: Mask, axis: number, r: number, depth: number, lean = 0
): void {
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!mask[y * SPRITE_W + x]) continue;
      const u = Math.max(-1, Math.min(1, (x - axis) / Math.max(1, r)));
      const nz = Math.sqrt(Math.max(0.02, 1 - u * u));
      form.set(x, y, u, lean, nz, depth + nz * 0.06);
    }
  }
}

/**
 * A cylinder around an arbitrary axis — an articulated limb segment. The
 * normal is perpendicular to the bone, in the image plane, plus the bulge
 * toward the viewer.
 */
export function limbSurface(
  form: FormBuffer, mask: Mask,
  x0: number, y0: number, x1: number, y1: number, r: number, depth: number
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  // Unit normal to the bone, in-plane.
  const px = -dy / len;
  const py = dx / len;
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!mask[y * SPRITE_W + x]) continue;
      // Signed distance from the bone, along the in-plane normal.
      const off = (x - x0) * px + (y - y0) * py;
      const u = Math.max(-1, Math.min(1, off / Math.max(1, r)));
      const nz = Math.sqrt(Math.max(0.02, 1 - u * u));
      form.set(x, y, px * u, py * u, nz, depth + nz * 0.06);
    }
  }
}

/** An ellipsoid — the head, a knot of hair, a shoulder cap, a fist. */
export function ellipsoidSurface(
  form: FormBuffer, mask: Mask,
  cx: number, cy: number, rx: number, ry: number, depth: number, flatten = 1
): void {
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!mask[y * SPRITE_W + x]) continue;
      const u = Math.max(-1, Math.min(1, (x - cx) / Math.max(1, rx)));
      const v = Math.max(-1, Math.min(1, (y - cy) / Math.max(1, ry)));
      const nz = Math.sqrt(Math.max(0.02, 1 - u * u - v * v * flatten * flatten));
      form.set(x, y, u, v * flatten, nz, depth + nz * 0.08);
    }
  }
}

/** A flat plane facing the viewer — a belt face, a hem band, a hat brim top. */
export function planeSurface(
  form: FormBuffer, mask: Mask, nx: number, ny: number, depth: number
): void {
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!mask[y * SPRITE_W + x]) continue;
      form.set(x, y, nx, ny, 1, depth);
    }
  }
}

// ---------------------------------------------------------------------------
// The resolve.
// ---------------------------------------------------------------------------

export interface LightRig {
  /** Unit vector *toward* the key light. */
  lx: number;
  ly: number;
  lz: number;
  ambient: number;
  strength: number;
  rim: number;
}

export function buildRig(t: SpriteTuning): LightRig {
  // Azimuth from lightDir (−3 hard left … +3 hard right), elevation from
  // lightHeight. The reference is lit from the upper left and slightly in
  // front — enough to model, not so much that the far side goes black.
  const az = (t.lightDir / 3) * 0.85;
  const el = 0.22 + (t.lightHeight / 3) * 0.5;
  const lx = az;
  const ly = -el;
  const lz = Math.sqrt(Math.max(0.15, 1 - lx * lx - ly * ly));
  return {
    lx, ly, lz,
    ambient: 0.2 + t.ambient * 0.12,
    strength: t.lightStrength,
    rim: t.rim,
  };
}

/**
 * Bands, not a gradient. The boundaries widen with `strength`, so the lowest
 * setting is nearly flat cel shading and the highest carves. Returns a ramp
 * step index: 0 is the brightest step, 3 the material's base, 6 the darkest.
 */
/**
 * The band boundaries, as thresholds on the spread value. Kept as a table so
 * the dithered variant below can find *which* boundary a pixel is sitting near
 * without duplicating the ladder.
 */
const BANDS: ReadonlyArray<number> = [0.88, 0.66, 0.42, 0.24, 0.10];

/**
 * The dense ladder: twelve boundaries over thirteen steps, evenly spaced in
 * the same 0…1 span the coarse one covers. Doubling the resolution is the fix
 * for stepped fold shading — see denseRamp.ts for why it is arithmetic rather
 * than placement.
 */
const DENSE_BANDS: ReadonlyArray<number> = Array.from(
  { length: DENSE_LEN - 1 },
  (_, i) => 0.96 - (i * 0.92) / (DENSE_LEN - 1),
);

/**
 * Map lighting onto the ramp across the range the lighting can actually reach.
 *
 * `lit` is `ambient + (1 - ambient) * lambert`, so with an ambient fill of
 * 0.32 it lives in 0.32…1.0 and never approaches zero. Contrasting it about
 * **0.5** — which is what this did — therefore threw away the entire lower
 * half of the mapping and pushed everything above half-light off the top:
 * measured over three garments, *55% of every one* landed on step 0 and
 * another 11% on step 12, with almost nothing in between. That is not a
 * shading problem that better normals or deeper folds could fix; the surface
 * was being posterised to two values before any of that reached it.
 *
 * Normalising to the achievable range first, then contrasting about *its*
 * midpoint, spends the whole ramp on the part of the signal that varies.
 */
function normLit(lit: number, strength: number, ambient: number): number {
  const u = (lit - ambient) / Math.max(0.01, 1 - ambient);
  return 0.5 + (u - 0.5) * (0.6 + strength * 0.14);
}

function denseBandOf(lit: number, strength: number, ambient: number): number {
  const v = normLit(lit, strength, ambient);
  for (let i = 0; i < DENSE_BANDS.length; i += 1) if (v > DENSE_BANDS[i]) return i;
  return DENSE_LEN - 1;
}

function bandOf(lit: number, strength: number, ambient: number): number {
  const v = normLit(lit, strength, ambient);
  if (v > 0.88) return 1;
  if (v > 0.66) return 2;
  if (v > 0.42) return 3;
  if (v > 0.24) return 4;
  if (v > 0.10) return 5;
  return 6;
}

/**
 * The same ladder, but a pixel sitting close to a boundary is scattered across
 * it rather than snapped to one side.
 *
 * Seven ramp steps quantised hard is *posterisation*: broad flat plateaus with
 * visible contour lines between them, which is what made the figures read as
 * cel-shaded next to the reference's painterly falloff. The reference is not
 * using more colours than this — it is letting adjacent values interleave in
 * the transition, so the eye integrates them into an intermediate tone that is
 * not in the palette at all. A dispersed (void-and-cluster style) matrix does
 * that without the directional artefacts a Bayer grid leaves on a curved
 * surface, and it costs one lookup.
 *
 * Only the *transition* is dithered — a pixel well inside a band is left
 * alone, so flat areas stay clean and only the terminator breaks up.
 */
function ditheredBand(
  lit: number, strength: number, x: number, y: number, ambient: number
): number {
  const v = normLit(lit, strength, ambient);
  const hard = bandOf(lit, strength, ambient);
  // How near is the closest boundary, as a fraction of the local band's width?
  let nearest = -1;
  let dist = 1;
  for (let b = 0; b < BANDS.length; b += 1) {
    const d = Math.abs(v - BANDS[b]);
    if (d < dist) { dist = d; nearest = b; }
  }
  if (nearest < 0) return hard;
  // The blend zone is a *narrow* slice either side of the boundary.
  //
  // Sized generously it does not soften anything — a cylinder's lighting is
  // compressed enough that most of its surface sits within reach of some
  // boundary, so a wide zone dithers the whole garment into a two-value
  // checkerboard. That is noisier than the posterisation it was meant to fix.
  // This wants to catch the terminator and nothing else.
  const ZONE = 0.018;
  if (dist > ZONE) return hard;
  // 0 at the boundary … 1 at the edge of the zone.
  const t = dist / ZONE;
  const above = v > BANDS[nearest];
  // Probability of taking the *other* side, falling off from 50% at the line.
  const p = (1 - t) * 0.42;
  return dispersed(x, y) < p ? (above ? hard + 1 : hard - 1) : hard;
}

/**
 * Ambient occlusion from the depth buffer: a pixel with a markedly nearer
 * neighbour up and to the light side is in that neighbour's shadow. This is
 * what separates a sleeve from the coat behind it when both are the same
 * bolt of cloth — and it costs nothing extra, because the parts already had
 * to declare their depth to be drawn in the right order.
 */
function occlusionAt(form: FormBuffer, x: number, y: number, strength: number): number {
  const here = form.depthAt(x, y);
  if (here < 0) return 0;
  let occ = 0;
  for (let dy = -2; dy <= 0; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const there = form.depthAt(x + dx, y + dy);
      if (there < 0) continue;
      const rise = there - here;
      if (rise > 0.12) {
        const falloff = 1 / (1 + Math.abs(dx) + Math.abs(dy));
        occ += rise * falloff;
      }
    }
  }
  return Math.min(2, occ * 2.2 * strength);
}

/**
 * Resolve every surface pixel against the rig. Called once, after all parts
 * are down and before any detail marks — folds, seams and weave are applied
 * on top of the finished form, the way a painter lays them in last.
 */
/**
 * Per-material calibration against the bust, in ramp steps.
 *
 * These are not artistic choices. The sprite lights every surface from one
 * lamp against normals that mostly face the viewer and the sky, so materials
 * whose masks are broad and outward-facing — skin above all — resolve
 * systematically brighter than the same material in the portrait. Measured
 * over 200 personas the sprite was lighter-skinned than the bust on *every
 * one* of 68 disagreements and darker on none; a one-directional error at that
 * scale is a calibration fault, not lighting variation.
 *
 * Applied globally here rather than patched at each call site, because the
 * error is global: hands, neck, legs and face all shared it, and biasing only
 * the head left the rest of the body a different colour from it.
 *
 * `npm run match-audit` is what these are tuned against; changing them without
 * re-running it is how the drift got here in the first place.
 */
const MATERIAL_BIAS: Record<number, number> = {
  [MAT.SKIN]: 1,
  [MAT.HAIR]: 1,
  [MAT.BEARD]: 1,
  // A veil is a dome facing the sky and it was resolving two full steps above
  // its own colour: a rust #9c5230 headscarf rendering #bf9376, a flat salmon
  // block. Same fault skin and hair had, and worse here because the area is
  // large and unbroken, so there is nothing to distract from it.
  [MAT.HEADWEAR]: 2,
};

export function resolveLight(
  raster: Raster, form: FormBuffer, book: RampBook, rig: LightRig, occStrength: number
): void {
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      const i = y * SPRITE_W + x;
      if (!form.written[i]) continue;
      if (raster.data[i * 4 + 3] === 0) continue;
      const mat = raster.mat[i];
      if (!LIT_MATS.has(mat)) continue;
      const ramp = book[mat];
      if (!ramp) continue;

      const lambert = Math.max(0, form.nx[i] * rig.lx + form.ny[i] * rig.ly + form.nz[i] * rig.lz);
      const lit = rig.ambient + (1 - rig.ambient) * lambert;
      // Biases were all authored against the coarse ladder, so they scale up
      // rather than being reinterpreted — a crease worth one step still darkens
      // by one step's worth of value.
      let step = denseBandOf(lit, rig.strength, rig.ambient);
      // Bias is fractional; the ramp index is not. Rounding happens once,
      // here, after every contribution is summed — rounding each one on the
      // way in is what quantised the fold shoulders in the first place.
      step += (form.bias[i] + (MATERIAL_BIAS[mat] ?? 0)) * BIAS_SCALE;
      step += occlusionAt(form, x, y, occStrength) * BIAS_SCALE;
      step = Math.max(0, Math.min(DENSE_LEN - 1, Math.round(step)));
      raster.set(x, y, ramp.steps[step], mat, step);
    }
  }
}

/**
 * Rim light: the lit-side silhouette edge catches the sky. Only where the
 * surface is already turning away — a rim on a pixel that faces the viewer
 * reads as a misplaced highlight, which is what the old unconditional
 * version produced along the shoulders.
 */
export function applyRim(raster: Raster, form: FormBuffer, book: RampBook, rig: LightRig): void {
  if (rig.rim <= 0) return;
  const lifts: Array<[number, number]> = [];
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      const i = y * SPRITE_W + x;
      if (!form.written[i] || raster.data[i * 4 + 3] === 0) continue;
      if (!LIT_MATS.has(raster.mat[i])) continue;
      // Grazing: the surface has turned nearly side-on to the viewer.
      if (form.nz[i] > 0.5) continue;
      // On the light's side of the form.
      if (form.nx[i] * rig.lx + form.ny[i] * rig.ly <= 0.25) continue;
      const outward = rig.lx < 0 ? -1 : 1;
      if (raster.alphaAt(x + outward, y) !== 0) continue;
      lifts.push([x, y]);
    }
  }
  for (const [x, y] of lifts) raster.shift(x, y, -Math.min(2, rig.rim), book);
}

// ---------------------------------------------------------------------------
// Ink.
// ---------------------------------------------------------------------------

const INK: RGB = { r: 22, g: 17, b: 20 };

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/**
 * The keyline, drawn *inside* the silhouette.
 *
 * The old pass painted the transparent pixels *outside* the art and, at its
 * highest setting, painted a second ring beyond those — a uniform 2px halo
 * hung off the figure, which is most of what read as "bad outlining". A real
 * contour eats a pixel of the drawing and varies in weight: heavier where the
 * form has turned away from the light, lighter where it faces it.
 *
 * Weight comes from the form buffer, so the line and the shading can never
 * disagree about which side of the figure is in shadow.
 */
export function inkSilhouette(
  raster: Raster, form: FormBuffer, book: RampBook, rig: LightRig, weight: number
): void {
  const edge: Array<[number, number, number]> = [];
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      const i = y * SPRITE_W + x;
      if (raster.data[i * 4 + 3] === 0) continue;
      const mat = raster.mat[i];
      if (mat === MAT.EMPTY || mat === MAT.BG) continue;
      const openL = raster.alphaAt(x - 1, y) === 0;
      const openR = raster.alphaAt(x + 1, y) === 0;
      const open = openL || openR
        || raster.alphaAt(x, y - 1) === 0 || raster.alphaAt(x, y + 1) === 0;
      if (!open) continue;
      // A one- or two-pixel gap — between a hanging arm and the body, or
      // between the legs — must not be inked from both banks, or the gap
      // fills solid and reads as a hole punched through the figure. Only the
      // nearer bank takes the line; the far one keeps its occlusion shadow.
      const gap = openL ? -1 : openR ? 1 : 0;
      if (gap !== 0) {
        const across = raster.alphaAt(x + gap * 2, y) !== 0 || raster.alphaAt(x + gap * 3, y) !== 0;
        if (across) {
          const here = form.written[i] ? form.depth[i] : 0;
          const thereI = y * SPRITE_W + x + gap * 2;
          const there = raster.alphaAt(x + gap * 2, y) !== 0 && form.written[thereI]
            ? form.depth[thereI]
            : form.depth[y * SPRITE_W + x + gap * 3] ?? 0;
          if (there > here) continue;
        }
      }
      const lambert = form.written[i]
        ? Math.max(0, form.nx[i] * rig.lx + form.ny[i] * rig.ly + form.nz[i] * rig.lz)
        : 0.3;
      edge.push([x, y, lambert]);
    }
  }
  for (const [x, y, lambert] of edge) {
    const i = y * SPRITE_W + x;
    const ramp = book[raster.mat[i]];
    if (!ramp) continue;
    // The line keeps a breath of the material's own hue so a green tunic is
    // contoured in near-black green, not in a flat keyline that reads as a
    // sticker cut from the background.
    // Further toward ink than before. A ramp's own `outline` is only one step
    // past its darkest value, so on a light material — leather, straw, pale
    // cloth — a gentle mix left the contour reading mid-brown and the shoe or
    // shoulder lost its edge against the ground. Enough hue survives that a
    // red robe is still contoured in near-black red rather than in flat black.
    const dark = mix(ramp.outline, INK, lambert > 0.55 ? 0.55 : 0.78);
    raster.set(x, y, dark, raster.mat[i], 6);
  }
  if (weight <= 0) return;
  // The **second line is not ink**.
  //
  // The contour above is exactly one pixel, everywhere, without exception —
  // a silhouette that runs one pixel here, two there and three somewhere else
  // reads as a ragged cut-out, and thickening it on the shadow side was
  // producing precisely that. What sits inside it instead is a *shade line*:
  // the same material, pushed a few steps down its own ramp, so a white robe
  // is lined in grey-white and a green tunic in dark green. Never black. It
  // gives the edge weight without turning the figure into a colouring book.
  for (const [x, y] of edge) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx2 = x + dx;
      const ny2 = y + dy;
      if (nx2 < 0 || ny2 < 0 || nx2 >= SPRITE_W || ny2 >= SPRITE_H) continue;
      const i2 = ny2 * SPRITE_W + nx2;
      if (raster.data[i2 * 4 + 3] === 0) continue;
      // Only into the body, not along the contour itself.
      if (raster.shade[i2] === 6 && raster.mat[i2] === raster.mat[y * SPRITE_W + x]) continue;
      const ramp = book[raster.mat[i2]];
      if (!ramp) continue;
      const cur = raster.shade[i2];
      if (cur === NO_SHADE) continue;
      const step = Math.min(ramp.steps.length - 1, cur + weight);
      raster.set(nx2, ny2, ramp.steps[step], raster.mat[i2], step);
    }
  }
}

/**
 * Interior separations: where a near part crosses a far one, the far one
 * takes a dark line along the join. Not full ink — a coat seen behind a
 * sleeve is still lit coat, just two steps down — so parts stay legible as
 * one garment instead of reading as a collage of stickers.
 */
export function inkInterior(
  raster: Raster, form: FormBuffer, book: RampBook
): void {
  const marks: Array<[number, number, number]> = [];
  for (let y = 1; y < SPRITE_H - 1; y += 1) {
    for (let x = 1; x < SPRITE_W - 1; x += 1) {
      const i = y * SPRITE_W + x;
      if (!form.written[i] || raster.data[i * 4 + 3] === 0) continue;
      const here = form.depth[i];
      let nearest = here;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const there = form.depthAt(x + dx, y + dy);
        if (there > nearest) nearest = there;
      }
      if (nearest - here <= 0.16) continue;
      // How hard the line is depends on how big the step is *and* on whether
      // the two sides are the same material.
      //
      // A sleeve resting against the body is one bolt of cloth folded over
      // itself — the reference shows a soft crease there, not a drawn line. An
      // arm against a different garment, or skin against cloth, is a genuine
      // edge and takes the full weight. Marking both identically drew a hard
      // black seam down every shoulder.
      let sameMaterial = true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        if (form.depthAt(x + dx, y + dy) > here + 0.16
          && raster.matAt(x + dx, y + dy) !== raster.mat[i]) sameMaterial = false;
      }
      // Same cloth folded against itself gets *no* line at all. One step was
      // still enough to draw a visible seam down every shoulder, and a sleeve
      // resting on the body it hangs from has no edge there to draw — the
      // occlusion below already separates them.
      if (sameMaterial) continue;
      marks.push([x, y, 2]);
    }
  }
  for (const [x, y, w] of marks) raster.shift(x, y, w, book);
}

// ---------------------------------------------------------------------------
// Ground.
// ---------------------------------------------------------------------------

/**
 * The cast shadow. Without it a figure hovers a few pixels off whatever it is
 * standing on, no matter how well its feet are drawn — the old sprites had a
 * warm bounce light along their lower edge but nothing under them, and every
 * one of them floated.
 */
export function groundShadow(
  raster: Raster, cx: number, floorY: number, halfWidth: number, strength: number
): void {
  if (strength <= 0) return;
  const rx = Math.max(6, halfWidth + 3);
  const ry = Math.max(2, Math.round(rx * 0.28));
  const alpha = 0.16 + strength * 0.09;
  for (let dy = -ry; dy <= ry; dy += 1) {
    for (let dx = -rx; dx <= rx; dx += 1) {
      const u = dx / rx;
      const v = dy / ry;
      const d = u * u + v * v;
      if (d > 1) continue;
      const x = cx + dx;
      const y = floorY - 1 + dy;
      if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) continue;
      // Never over the figure — the shadow is on the ground, not on the boot.
      if (raster.alphaAt(x, y) !== 0) continue;
      // Denser at the core, feathered at the rim, with one dithered ring so
      // the edge does not read as a drawn ellipse.
      const core = 1 - d;
      if (core < 0.28 && ((x + y) & 1) === 0) continue;
      raster.blend(x, y, { r: 18, g: 14, b: 16 }, alpha * (0.45 + core * 0.55), MAT.BG, NO_SHADE);
    }
  }
}

/** Warm light kicked up from the lit ground onto the lowest edges. */
export function groundBounce(raster: Raster, book: RampBook, floorY: number): void {
  for (let y = Math.max(0, floorY - 16); y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      const i = y * SPRITE_W + x;
      if (raster.data[i * 4 + 3] === 0) continue;
      if (raster.mat[i] === MAT.BG) continue;
      const below = y + 1 >= SPRITE_H || raster.alphaAt(x, y + 1) === 0;
      if (below) raster.shift(x, y, -1, book);
    }
  }
}

/**
 * Fabric weave, in 2×2 blocks.
 *
 * The old texture pass shifted single pixels on a dispersed hash, which at
 * 192px read as sensor noise and was most of the "dithered mess". The
 * reference's cloth is blocky — you can count the tufts — so the mottle is
 * quantised to a 2px grid and applied as a *bias*, before the light resolves,
 * so a weave slub in shadow stays in shadow.
 */
export function weaveBias(
  form: FormBuffer, mask: Mask, material: string, seed: number, amount: number
): void {
  if (amount <= 0) return;
  const m = material.toLowerCase();
  // How loud the weave is, and how big its blocks are. These numbers are
  // deliberately sparse: an earlier pass marked two blocks in five and the
  // mottle swamped the form light entirely — the tunic read as camouflage,
  // and no amount of shading contrast could be seen through it. Texture is a
  // seasoning on the modelling, never a competitor to it.
  // Blocks of 2×2 read as *spots*, not as weave — at this scale four pixels is
  // a mark the eye resolves as an object rather than as surface. Only the
  // genuinely clumpy materials get a block; everything woven is single pixels,
  // denser, so it reads as fibre.
  // Two marks in `every` blocks. Dropping to single pixels without also
  // raising `every` put a mark on a fifth of the garment and turned the whole
  // surface into a two-value checkerboard — which then looked exactly like a
  // dithering fault and sent me hunting in the wrong place. Roughly one pixel
  // in twelve is as loud as this can be before it competes with the modelling.
  let every = 22;
  let block = 1;
  if (/fur|hide|pelt|fleece|sheepskin|shag/.test(m)) { every = 11; block = 2; }
  else if (/wool|felt|tweed|homespun|kersey|frieze/.test(m)) { every = 16; block = 1; }
  else if (/silk|satin|damask|taffeta|velvet|brocade/.test(m)) { every = 44; block = 1; }
  else if (/linen|hemp|cotton|flax|muslin|calico/.test(m)) { every = 24; block = 1; }
  every = Math.max(4, Math.round(every / Math.max(0.5, amount / 2)));

  for (let by = 0; by < SPRITE_H; by += block) {
    for (let bx = 0; bx < SPRITE_W; bx += block) {
      const hash = ((bx * 73856093) ^ (by * 19349663) ^ (seed * 83492791)) >>> 0;
      const roll = hash % every;
      if (roll > 1) continue;
      // Slubs run dark more often than light: cloth catches shadow in its
      // pile more readily than it catches a specular.
      const delta = roll === 0 ? 1 : -1;
      for (let y = by; y < by + block; y += 1) {
        for (let x = bx; x < bx + block; x += 1) {
          if (!mask[y * SPRITE_W + x]) continue;
          form.addBias(x, y, delta);
        }
      }
    }
  }
}
