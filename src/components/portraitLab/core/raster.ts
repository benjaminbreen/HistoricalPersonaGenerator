/**
 * portraitLab/core/raster.ts
 *
 * A tiny indexed-ish pixel buffer. Alongside RGBA it keeps two extra planes:
 *
 *   mat[]   which material occupies each pixel (skin, hair, wool, bronze…)
 *   shade[] which ramp step that pixel currently sits at
 *
 * Those two planes are what make the rest of the system composable. A feature
 * can say "one step darker than whatever is already here" and get a correct
 * result whether it landed on lit skin, shadowed skin, or a hat brim. Contact
 * shadows, rim light, and the outline pass all work off the same planes.
 */

import { Ramp, RGB, RAMP_LEN } from './color';

export const MAT = {
  EMPTY: 0,
  BG: 1,
  SKIN: 2,
  HAIR: 3,
  BEARD: 4,
  BROW: 5,
  SCLERA: 6,
  IRIS: 7,
  LIP: 8,
  CLOTH_A: 9,
  CLOTH_B: 10,
  CLOTH_C: 11,
  HEADWEAR: 12,
  METAL: 13,
  GEM: 14,
  LEATHER: 15,
  WOOD: 16,
  PAINT: 17,
  GLASS: 18,
  TEETH: 19,
} as const;

export const MAT_COUNT = 24;
export const NO_SHADE: number = 255;

export type MaterialId = number;
export type RampBook = Array<Ramp | null>;

/** Materials that participate in the silhouette outline. */
export const BODY_MATS = new Set<number>([
  MAT.SKIN, MAT.HAIR, MAT.BEARD, MAT.CLOTH_A, MAT.CLOTH_B, MAT.CLOTH_C,
  MAT.HEADWEAR, MAT.METAL, MAT.LEATHER, MAT.WOOD, MAT.GEM, MAT.PAINT, MAT.GLASS,
]);

export type Mask = Uint8Array;

const BAYER_4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

export function bayer(x: number, y: number): number {
  return BAYER_4[(y & 3) * 4 + (x & 3)] / 16;
}

const clampIdx = (v: number) => (v < 0 ? 0 : v > RAMP_LEN - 1 ? RAMP_LEN - 1 : v);

export class Raster {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
  readonly mat: Uint8Array;
  readonly shade: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
    this.mat = new Uint8Array(width * height);
    this.shade = new Uint8Array(width * height).fill(NO_SHADE);
  }

  clear(): void {
    this.data.fill(0);
    this.mat.fill(MAT.EMPTY);
    this.shade.fill(NO_SHADE);
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  alphaAt(x: number, y: number): number {
    if (!this.inside(x, y)) return 0;
    return this.data[(y * this.width + x) * 4 + 3];
  }

  matAt(x: number, y: number): number {
    if (!this.inside(x, y)) return MAT.EMPTY;
    return this.mat[y * this.width + x];
  }

  shadeAt(x: number, y: number): number {
    if (!this.inside(x, y)) return NO_SHADE;
    return this.shade[y * this.width + x];
  }

  rgbAt(x: number, y: number): RGB {
    const o = (y * this.width + x) * 4;
    return { r: this.data[o], g: this.data[o + 1], b: this.data[o + 2] };
  }

  /** Opaque write. This is the normal path — pixel art rarely wants blending. */
  set(x: number, y: number, color: RGB, material: MaterialId = MAT.EMPTY, shadeIndex: number = NO_SHADE): void {
    if (!this.inside(x, y)) return;
    const i = y * this.width + x;
    const o = i * 4;
    this.data[o] = color.r;
    this.data[o + 1] = color.g;
    this.data[o + 2] = color.b;
    this.data[o + 3] = 255;
    this.mat[i] = material;
    this.shade[i] = shadeIndex;
  }

  /** Alpha write, for veils, glass, and soft paint. */
  blend(x: number, y: number, color: RGB, alpha: number, material: MaterialId = MAT.EMPTY, shadeIndex: number = NO_SHADE): void {
    if (!this.inside(x, y) || alpha <= 0) return;
    if (alpha >= 1) return this.set(x, y, color, material, shadeIndex);
    const i = y * this.width + x;
    const o = i * 4;
    const dstA = this.data[o + 3] / 255;
    const outA = alpha + dstA * (1 - alpha);
    if (outA <= 0) return;
    this.data[o] = (color.r * alpha + this.data[o] * dstA * (1 - alpha)) / outA;
    this.data[o + 1] = (color.g * alpha + this.data[o + 1] * dstA * (1 - alpha)) / outA;
    this.data[o + 2] = (color.b * alpha + this.data[o + 2] * dstA * (1 - alpha)) / outA;
    this.data[o + 3] = outA * 255;
    if (alpha > 0.5) {
      this.mat[i] = material;
      this.shade[i] = shadeIndex;
    }
  }

  /** Move a pixel along its own ramp. The heart of "one step darker". */
  shift(x: number, y: number, delta: number, book: RampBook): void {
    if (!this.inside(x, y)) return;
    const i = y * this.width + x;
    if (this.data[i * 4 + 3] === 0) return;
    const material = this.mat[i];
    const ramp = book[material];
    const current = this.shade[i];
    if (!ramp || current === NO_SHADE) return;
    const next = clampIdx(current + delta);
    this.set(x, y, ramp.steps[next], material, next);
  }

  copyFrom(source: Raster): void {
    this.data.set(source.data);
    this.mat.set(source.mat);
    this.shade.set(source.shade);
  }

  /** Source-over composite, carrying the material and shade planes along. */
  compositeFrom(source: Raster, offsetX = 0, offsetY = 0): void {
    const { width, height } = this;
    for (let y = 0; y < source.height; y += 1) {
      const ty = y + offsetY;
      if (ty < 0 || ty >= height) continue;
      for (let x = 0; x < source.width; x += 1) {
        const tx = x + offsetX;
        if (tx < 0 || tx >= width) continue;
        const si = y * source.width + x;
        const alpha = source.data[si * 4 + 3];
        if (alpha === 0) continue;
        if (alpha === 255) {
          const ti = ty * width + tx;
          this.data[ti * 4] = source.data[si * 4];
          this.data[ti * 4 + 1] = source.data[si * 4 + 1];
          this.data[ti * 4 + 2] = source.data[si * 4 + 2];
          this.data[ti * 4 + 3] = 255;
          this.mat[ti] = source.mat[si];
          this.shade[ti] = source.shade[si];
        } else {
          this.blend(
            tx,
            ty,
            { r: source.data[si * 4], g: source.data[si * 4 + 1], b: source.data[si * 4 + 2] },
            alpha / 255,
            source.mat[si],
            source.shade[si]
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Masks
// ---------------------------------------------------------------------------

export function makeMask(width: number, height: number): Mask {
  return new Uint8Array(width * height);
}

export function maskHas(mask: Mask, width: number, x: number, y: number, height: number): boolean {
  if (x < 0 || y < 0 || x >= width || y >= height) return false;
  return mask[y * width + x] === 1;
}

export function maskUnion(a: Mask, b: Mask): Mask {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = a[i] || b[i] ? 1 : 0;
  return out;
}

export function maskSubtract(a: Mask, b: Mask): Mask {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = a[i] && !b[i] ? 1 : 0;
  return out;
}

export function maskIntersect(a: Mask, b: Mask): Mask {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = a[i] && b[i] ? 1 : 0;
  return out;
}

export function maskEllipse(
  width: number,
  height: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): Mask {
  const mask = makeMask(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) mask[y * width + x] = 1;
    }
  }
  return mask;
}

export function maskRect(
  width: number,
  height: number,
  x0: number,
  y0: number,
  w: number,
  h: number
): Mask {
  const mask = makeMask(width, height);
  for (let y = Math.max(0, y0); y < Math.min(height, y0 + h); y += 1) {
    for (let x = Math.max(0, x0); x < Math.min(width, x0 + w); x += 1) {
      mask[y * width + x] = 1;
    }
  }
  return mask;
}

export interface ProfileOptions {
  /** [t, halfWidth] control points, t running 0 (top) to 1 (bottom). */
  keys: Array<[number, number]>;
  top: number;
  bottom: number;
  centerX: number;
  /** Optional per-row horizontal offset, e.g. a head tilted off axis. */
  lean?: (t: number) => number;
  /** Optional per-row edge wobble, for hair and fur. */
  jitter?: (t: number, side: -1 | 1) => number;
}

/** Catmull-Rom through the control points, clamped at the ends. */
function sampleProfile(keys: Array<[number, number]>, t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[keys.length - 1][0]) return keys[keys.length - 1][1];
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1][0] < t) i += 1;
  const p0 = keys[Math.max(0, i - 1)];
  const p1 = keys[i];
  const p2 = keys[i + 1];
  const p3 = keys[Math.min(keys.length - 1, i + 2)];
  const span = p2[0] - p1[0] || 1;
  const u = (t - p1[0]) / span;
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * u +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)
  );
}

/**
 * Build a symmetrical silhouette from a vertical width profile. Heads, hoods,
 * shoulders, and hair are all shapes whose character lives in how their width
 * changes down the frame, so this one primitive covers most of the portrait.
 */
export function maskFromProfile(width: number, height: number, options: ProfileOptions): Mask {
  const mask = makeMask(width, height);
  const { keys, top, bottom, centerX, lean, jitter } = options;
  const span = bottom - top || 1;
  for (let y = Math.max(0, Math.floor(top)); y <= Math.min(height - 1, Math.ceil(bottom)); y += 1) {
    const t = (y + 0.5 - top) / span;
    if (t < -0.02 || t > 1.02) continue;
    const half = sampleProfile(keys, Math.max(0, Math.min(1, t)));
    if (half <= 0) continue;
    const cx = centerX + (lean ? lean(t) : 0);
    const leftEdge = cx - half - (jitter ? jitter(t, -1) : 0);
    const rightEdge = cx + half + (jitter ? jitter(t, 1) : 0);
    for (let x = Math.max(0, Math.floor(leftEdge)); x <= Math.min(width - 1, Math.ceil(rightEdge)); x += 1) {
      if (x + 0.5 >= leftEdge && x + 0.5 <= rightEdge) mask[y * width + x] = 1;
    }
  }
  return mask;
}

export function maskDilate(mask: Mask, width: number, height: number, diagonal = false): Mask {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (mask[y * width + x]) {
        out[y * width + x] = 1;
        continue;
      }
      const neighbours: Array<[number, number]> = diagonal
        ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
        : [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of neighbours) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && mask[ny * width + nx]) {
          out[y * width + x] = 1;
          break;
        }
      }
    }
  }
  return out;
}

export function maskErode(mask: Mask, width: number, height: number): Mask {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      const keep =
        maskHas(mask, width, x - 1, y, height) &&
        maskHas(mask, width, x + 1, y, height) &&
        maskHas(mask, width, x, y - 1, height) &&
        maskHas(mask, width, x, y + 1, height);
      out[y * width + x] = keep ? 1 : 0;
    }
  }
  return out;
}

export function maskShift(mask: Mask, width: number, height: number, dx: number, dy: number): Mask {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y += 1) {
    const sy = y - dy;
    if (sy < 0 || sy >= height) continue;
    for (let x = 0; x < width; x += 1) {
      const sx = x - dx;
      if (sx < 0 || sx >= width) continue;
      out[y * width + x] = mask[sy * width + sx];
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Lighting
// ---------------------------------------------------------------------------

/**
 * One key light, upper-left, slightly in front. Every layer in the portrait
 * derives its modelling from this same vector, which is why the parts read as
 * one head rather than a collage.
 */
export const LIGHT = (() => {
  const v = { x: -0.52, y: -0.62, z: 0.59 };
  const len = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / len, y: v.y / len, z: v.z / len };
})();

export interface ShadeParams {
  /** Ramp index a front-facing surface lands on. */
  base?: number;
  /** How fast the ramp moves across the form. */
  gain?: number;
  /** Strength of the warm bounce filling the shadow side. */
  bounce?: number;
  /** Lambert value treated as "neutral". */
  neutral?: number;
}

export function shadeFromNormal(
  nx: number,
  ny: number,
  nz: number,
  params: ShadeParams = {}
): number {
  const { base = 3, gain = 7, bounce = 0.25, neutral = 0.78 } = params;
  const lambert = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z;
  const fill = Math.max(0, 0.35 * nx + 0.8 * ny + 0.35 * nz) * bounce;
  const lum = 0.5 + 0.5 * lambert + fill;
  return base - (lum - neutral) * gain;
}

export type Shader = (x: number, y: number) => number;

/**
 * Treat a region as the front of an ellipsoid. Used for the skull, the neck,
 * the shoulders, and anything wrapped around them (hair, hoods, collars) so
 * they all share one consistent sense of volume.
 */
export function ellipsoidShader(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rz: number,
  params: ShadeParams = {}
): Shader {
  return (x, y) => {
    const dx = (x + 0.5 - cx) / rx;
    const dy = (y + 0.5 - cy) / ry;
    const d2 = dx * dx + dy * dy;
    const nz = Math.sqrt(Math.max(0.04, 1 - Math.min(1, d2)));
    const scale = rz > 0 ? 1 : 1;
    return shadeFromNormal(dx, dy, nz * scale, params);
  };
}

/** A cylinder lying along the x axis — necks, sleeves, rolled cloth. */
export function cylinderShaderX(
  cx: number,
  rx: number,
  params: ShadeParams = {}
): Shader {
  return x => {
    const dx = (x + 0.5 - cx) / rx;
    const nz = Math.sqrt(Math.max(0.04, 1 - Math.min(1, dx * dx)));
    return shadeFromNormal(dx, 0, nz, params);
  };
}

export function constantShader(index: number): Shader {
  return () => index;
}

export function fillMask(
  raster: Raster,
  mask: Mask,
  ramp: Ramp,
  material: MaterialId,
  shader: Shader,
  options: { dither?: number; alpha?: number } = {}
): void {
  const { dither = 0, alpha = 1 } = options;
  const { width, height } = raster;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      let index = shader(x, y);
      if (dither > 0) index += (bayer(x, y) - 0.5) * dither;
      const step = clampIdx(Math.round(index));
      if (alpha >= 1) raster.set(x, y, ramp.steps[step], material, step);
      else raster.blend(x, y, ramp.steps[step], alpha, material, step);
    }
  }
}

/**
 * Darken whatever sits just below/right of a mask. This is what makes hair sit
 * *on* a head rather than float beside it, and it is almost entirely absent
 * from naive procedural portraits.
 */
export function applyContactShadow(
  raster: Raster,
  mask: Mask,
  book: RampBook,
  options: { dx?: number; dy?: number; strength?: number; depth?: number } = {}
): void {
  const { dx = 1, dy = 1, strength = 1, depth = 1 } = options;
  const { width, height } = raster;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) continue;
      for (let step = 1; step <= depth; step += 1) {
        const tx = x + dx * step;
        const ty = y + dy * step;
        if (tx < 0 || ty < 0 || tx >= width || ty >= height) continue;
        if (mask[ty * width + tx]) continue;
        const amount = step === 1 ? strength : Math.max(1, Math.round(strength * 0.5));
        raster.shift(tx, ty, amount, book);
      }
    }
  }
}

/**
 * A cool rim on the shadow-side silhouette. Cheap, and it does more for
 * readability against a busy background than any amount of interior detail.
 */
export function applyRimLight(raster: Raster, strength = 1): void {
  const { width, height } = raster;
  const touched: Array<[number, number]> = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (raster.data[i * 4 + 3] === 0) continue;
      if (!BODY_MATS.has(raster.mat[i])) continue;
      const outsideRight = raster.alphaAt(x + 1, y) === 0 || !BODY_MATS.has(raster.matAt(x + 1, y));
      const outsideUp = raster.alphaAt(x, y - 1) === 0 || !BODY_MATS.has(raster.matAt(x, y - 1));
      if (outsideRight && !outsideUp) touched.push([x, y]);
    }
  }
  for (const [x, y] of touched) {
    const i = y * width + x;
    const o = i * 4;
    const rim = { r: 176, g: 190, b: 226 };
    const t = 0.24 * strength;
    raster.data[o] = raster.data[o] * (1 - t) + rim.r * t;
    raster.data[o + 1] = raster.data[o + 1] * (1 - t) + rim.g * t;
    raster.data[o + 2] = raster.data[o + 2] * (1 - t) + rim.b * t;
  }
}

/**
 * Silhouette outline. It is drawn *outside* the art so it never eats detail,
 * and it takes its hue from the pixel it is hugging, so a red cloak gets a
 * warm outline and blue wool a cool one — never a flat black keyline.
 */
export function applyOutline(raster: Raster, book: RampBook, backgroundOnly = true): void {
  const { width, height } = raster;
  const writes: Array<{ x: number; y: number; color: RGB }> = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const material = raster.mat[i];
      if (material !== MAT.BG && material !== MAT.EMPTY) continue;
      if (backgroundOnly && raster.data[i * 4 + 3] === 0 && material !== MAT.BG) {
        // still allowed — transparent frames want an outline too
      }
      let source: number | null = null;
      const neighbours: Array<[number, number]> = [[0, -1], [-1, 0], [1, 0], [0, 1]];
      for (const [dx, dy] of neighbours) {
        const nm = raster.matAt(x + dx, y + dy);
        if (BODY_MATS.has(nm)) {
          source = nm;
          break;
        }
      }
      if (source === null) continue;
      const ramp = book[source];
      if (!ramp) continue;
      writes.push({ x, y, color: ramp.outline });
    }
  }
  for (const write of writes) {
    raster.set(write.x, write.y, write.color, MAT.EMPTY, RAMP_LEN - 1);
  }
}
