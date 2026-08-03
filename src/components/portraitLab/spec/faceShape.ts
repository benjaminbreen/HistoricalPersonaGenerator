/**
 * portraitLab/spec/faceShape.ts
 *
 * What a face shape *means*, in numbers both renderers can spend.
 *
 * The bust and the sprite are two projections of one `PortraitSpec`, and the
 * design note in `spriteHead.ts` is explicit that what keeps them in agreement
 * is a shared spec and a shared palette rather than shared drawing code. That
 * held for colour and it did not hold for form: `faceShape` moved the bust's
 * skull by 44% between `round` and `long` and moved the sprite's by 1.4% —
 * which is to say not at all, since 1.4% is the seeded ±1px jitter. Every
 * sprite head was the same 23 × 36 box, and 0.64 is very nearly the bust's
 * `long` (0.631), so every figure in the encounter was a long-faced person
 * however their card described them.
 *
 * The fix is not to give the sprite its own opinion about face shapes. It is to
 * put the one opinion somewhere both can read, the way `CONICAL_HAT_PATTERN`
 * already is — the bug that pattern was written for is exactly this one, a
 * classifier and a renderer drifting apart because each kept its own copy.
 *
 * This is *vocabulary*, not drawing. Each view still spends these at its own
 * scale: a `round` face is eight pixels of extra width on a 96px bust and two
 * on a sprite, and it is the same face because it came off the same table.
 */

import { unit } from '../core/rng';
import { FaceShape, PortraitSpec } from './types';

/**
 * The height a face shape is measured against, in bust pixels.
 *
 * Exported because the deltas below are absolute and only mean something
 * beside it — the sprite turns the pair into a multiplier on its own head.
 */
export const FACE_SHAPE_BASE_HEIGHT = 58;

/**
 * The overall box a face shape sits in, before its outline is drawn.
 *
 * Height and width move in opposite directions, which is most of what the eye
 * actually reads: a long face is not a normal face stretched, it is a taller
 * *and* narrower one. Keeping the product roughly constant is also what stops
 * the axis from reading as a zoom.
 *
 * The magnitudes are the bust's, and they are larger than they look for the
 * reason `buildAnatomy` records: a 4% width change on a 46px head is under a
 * pixel and rounds away entirely, so anything meant to be visible has to be
 * worth at least two.
 */
export interface FaceShapeMetrics {
  /** Pixels added to `FACE_SHAPE_BASE_HEIGHT`. */
  heightDelta: number;
  /** Multiplier on the skull's width. */
  widthScale: number;
}

export const FACE_SHAPE_METRICS: Record<FaceShape, FaceShapeMetrics> = {
  oval:    { heightDelta:  0, widthScale: 1.00 },
  long:    { heightDelta:  8, widthScale: 0.90 },
  round:   { heightDelta: -6, widthScale: 1.08 },
  square:  { heightDelta: -2, widthScale: 1.04 },
  heart:   { heightDelta:  2, widthScale: 1.02 },
  diamond: { heightDelta:  3, widthScale: 1.00 },
};

/** The box as a pair of multipliers, for a renderer with its own base head. */
export function faceShapeScale(shape: FaceShape): { height: number; width: number } {
  const m = FACE_SHAPE_METRICS[shape] ?? FACE_SHAPE_METRICS.oval;
  return {
    height: 1 + m.heightDelta / FACE_SHAPE_BASE_HEIGHT,
    width: m.widthScale,
  };
}

/**
 * The width profiles, as multipliers down the skull.
 *
 * Read down each list: crown, temple, cheek, jaw, chin. No two neighbouring
 * anchors differ by more than about a tenth, which is the working limit for
 * staying clear of spline overshoot in the bust's Catmull-Rom — keeping the
 * authored numbers inside it means the shape you write is the shape you get.
 *
 * `oval` is absent rather than flat: it is the unmodified skull, and giving it
 * an identity curve would invite someone to "balance" it against the others.
 */
export const FACE_SHAPE_CURVES: Partial<Record<FaceShape, Array<[number, number]>>> = {
  // Full through the jaw and a touch narrower at the crown.
  round: [[0, 0.98], [0.5, 1.02], [1, 1.08]],
  // Straight sides carried down to a broad, flat jaw.
  square: [[0, 1.0], [0.5, 1.01], [0.8, 1.09], [1, 1.13]],
  // Tall already, from the height delta; the outline's job is to narrow down.
  long: [[0, 1.0], [0.5, 0.99], [1, 0.90]],
  // Broad at the temples, tapering to a small chin.
  heart: [[0, 1.05], [0.3, 1.04], [0.65, 0.95], [1, 0.82]],
  // Narrow above and below, widest across the cheekbones.
  diamond: [[0, 0.90], [0.28, 0.96], [0.5, 1.06], [0.75, 0.95], [1, 0.85]],
};

/**
 * The skull's own outline, before any of the axes above touch it.
 *
 * Read down: crown, temple, cheekbone, jaw, chin. These are bust pixels — the
 * bust uses them directly as its base profile, and the sprite divides through
 * by `SKULL_PROFILE_MAX` and spends the result against its own half-width.
 *
 * This lives here for the same reason the face-shape curves do. Both renderers
 * were drawing a head and each kept its own idea of what a head is, and they
 * did not match: the sprite held a *constant* half-width from a fifth of the
 * way down to just past halfway — a dead-flat vertical side over a third of the
 * skull, which is what made every sprite read as blocky — and then took the
 * chin to 0.58 of the widest point, where the bust takes it to 0.34. A sprite
 * chin was very nearly twice as wide as the same persona's bust chin, which is
 * the whole of why they read as flat and square.
 */
export const SKULL_PROFILE: Array<[number, number]> = [
  [0.00, 13.2],
  [0.06, 18.6],
  [0.14, 21.8],
  [0.26, 23.5],
  [0.40, 24.0],
  [0.52, 23.7],
  [0.64, 22.1],
  [0.78, 18.7],
  [0.90, 13.8],
  [1.00, 8.2],
];

/** The widest half-width in `SKULL_PROFILE`, for normalising it. */
export const SKULL_PROFILE_MAX = 24.0;

/**
 * How much the vault narrows at each of the top three control points when a
 * skull is fully domed. Below t = 0.14 the outline is brow ridge and temple,
 * which are not part of the vault — pulling those in would narrow the face
 * rather than round the head.
 */
export const CROWN_KEYS: Array<[number, number]> = [
  [0.00, 0.48],
  [0.06, 0.22],
  [0.14, 0.08],
];

/**
 * Narrow the crown keys so the width arrives further down and the interpolation
 * carries it as a dome. At `crown` = 0 every multiplier is 1 and the profile is
 * exactly as authored.
 */
export function roundCrown(
  keys: Array<[number, number]>,
  crown: number
): Array<[number, number]> {
  if (crown <= 0) return keys;
  return keys.map(([t, half], i) => {
    const rule = CROWN_KEYS[i];
    // Matched by index rather than by t, because every earlier pass preserves
    // the control points' t values and only touches their widths.
    if (!rule || rule[0] !== t) return [t, half] as [number, number];
    return [t, half * (1 - rule[1] * crown)] as [number, number];
  });
}

/**
 * The skull outline as a multiplier on a renderer's own half-width, 0 at the
 * crown to 1 at the chin. For the sprite, which has no spline of its own.
 */
export function skullOutline(dome: number): (t: number) => number {
  const keys = roundCrown(SKULL_PROFILE, dome);
  return shapeCurve(keys.map(([t, half]) => [t, half / SKULL_PROFILE_MAX] as [number, number]));
}

/** How far the jaw carries the skull's width down to the chin. */
export const JAW_WIDTH: Record<string, number> = {
  sharp: 0.80, soft: 1.0, square: 1.20, round: 1.12, oval: 0.92,
};

/** The zygomatic arch, as a multiplier at its own height. */
export const CHEEK_WIDTH: Record<string, number> = {
  high: 1.09, average: 1.0, low: 0.93,
};

/**
 * A width multiplier that varies smoothly down the skull.
 *
 * The face shapes used to be written as step functions, which is fine while
 * the steps are small and catastrophic once they are not: two *adjacent*
 * control points asked to differ by 35% made the bust's spline overshoot into
 * a hard angular flare at the temples. Interpolating between anchors with a
 * smoothstep removes the class of problem rather than the instance — there is
 * no way to express a step here, so no future edit to the table above can
 * reintroduce a corner.
 */
export function shapeCurve(anchors: Array<[number, number]>): (t: number) => number {
  return (t: number) => {
    if (t <= anchors[0][0]) return anchors[0][1];
    const last = anchors[anchors.length - 1];
    if (t >= last[0]) return last[1];
    let i = 0;
    while (i < anchors.length - 2 && anchors[i + 1][0] < t) i += 1;
    const [t0, v0] = anchors[i];
    const [t1, v1] = anchors[i + 1];
    const u = (t - t0) / (t1 - t0 || 1);
    return v0 + (v1 - v0) * (u * u * (3 - 2 * u));
  };
}

/** Smoothstep on an already-clamped 0…1. */
export function smoothstep(u: number): number {
  return u * u * (3 - 2 * u);
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * How domed the top of the skull is. 0 is the flattest, 1 the roundest.
 *
 * Mostly seeded, because the shape of a vault is not something the app records
 * anywhere and inventing a data source for it would be worse than admitting it
 * is arbitrary. Two things do bear on it and both are cheap: a `round` face and
 * a `square` one are already claims about the outline, and a skull that is
 * round through the cheeks and flat across the top is a contradiction the
 * viewer can see; and children genuinely are domed, the vault reaching most of
 * its adult size years before the face does.
 *
 * Read off `unit`, which is a pure hash of seed and label rather than a
 * stream position — so the sprite consulting it costs nothing and cannot shift
 * any other decision, and a persona domed in the bust is domed in the sprite.
 */
export function crownFor(spec: PortraitSpec): number {
  let crown = unit(spec.seed, 'crown');
  if (spec.faceShape === 'round') crown = Math.min(1, crown + 0.3);
  if (spec.faceShape === 'square') crown = Math.max(0, crown - 0.3);
  if (spec.age < 14) crown = Math.min(1, crown + 0.35);
  return crown;
}
