/**
 * portraitLab/core/rng.ts
 *
 * Deterministic randomness. Every portrait is a pure function of its seed, so
 * the same persona always draws the same face — across reloads, across the
 * A/B toggle, and in the contact sheets.
 */

export type Rng = () => number;

/** FNV-1a. Stable across engines, unlike anything built on Math.sin. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, good enough distribution for art decisions. */
export function makeRng(seed: number): Rng {
  let a = (seed >>> 0) || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A named sub-stream. Lets one part of the art re-roll without shifting every
 * later decision — `sub(seed, 'hair')` is independent of `sub(seed, 'nose')`.
 */
export function subRng(seed: number, name: string): Rng {
  return makeRng((seed ^ hashString(name)) >>> 0);
}

/** Deterministic choice from a seed + label, with no rng threading required. */
export function choose<T>(values: readonly T[], seed: number, label: string): T {
  return values[hashString(`${seed}|${label}`) % values.length];
}

/** Deterministic 0..1 from a seed + label. */
export function unit(seed: number, label: string): number {
  return (hashString(`${seed}|${label}`) % 100000) / 100000;
}

export function pick<T>(rng: Rng, values: readonly T[]): T {
  return values[Math.min(values.length - 1, Math.floor(rng() * values.length))];
}

export function rangeInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}

/** Smooth 1-D value noise — used for hair edges and cloth folds. */
export function makeNoise1D(seed: number): (x: number) => number {
  const rng = makeRng(seed);
  const table = new Float32Array(64);
  for (let i = 0; i < table.length; i += 1) table[i] = rng() * 2 - 1;
  return (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = table[((i % 64) + 64) % 64];
    const b = table[(((i + 1) % 64) + 64) % 64];
    const t = f * f * (3 - 2 * f);
    return a + (b - a) * t;
  };
}

/**
 * Smooth 2-D value noise, in -1..1.
 *
 * Summing two 1-D fields is not a substitute: a 1-D noise of `x*a + y*b` is
 * constant along a line, so adding two of them gives diagonal banding. That
 * looks like striped cloth, which is exactly wrong for anything — fur, thatch,
 * weathered stone — that needs to break up into blobs.
 */
export function makeNoise2D(seed: number): (x: number, y: number) => number {
  const at = (ix: number, iy: number) => {
    let h = (ix | 0) * 374761393 + (iy | 0) * 668265263 + seed * 69069;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 2147483647.5 - 1;
  };
  return (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
    const bottom = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;
    return top + (bottom - top) * sy;
  };
}
