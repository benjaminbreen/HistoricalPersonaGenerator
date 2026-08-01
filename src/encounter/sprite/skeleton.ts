/**
 * encounter/sprite/skeleton.ts
 *
 * The figure's measurements, in one tunable object.
 *
 * Proportioned against the encounter mockup (2026-07): about six heads tall,
 * shoulders a little over two head-widths, legs half the standing height. The
 * reference art is AI-generated, so its own pixel grid is not real and is not
 * something to measure against — it is a target for *proportion, value
 * structure and posture*, nothing finer.
 *
 * The grid before this was 192×352 and the figure on it was **4.7 heads** —
 * the single biggest reason it read as a doll rather than a person. Detail was
 * never the problem; proportion was.
 *
 * Two things are load-bearing here:
 *
 *  · **The figure is built upward from `GROUND_Y`.** Its height is an output,
 *    not an input, so people of different stature stand on the same floor and
 *    differ in height rather than being fitted to the same box.
 *
 *  · **Nothing is one size.** `statureOf` returns three multipliers that
 *    deliberately diverge — body, head and girth — and every measurement below
 *    is a *base* that they scale. See the note on `Stature` for why the head
 *    must grow more slowly than the body.
 *
 * The dev panel (Shift+1) edits the bases live; the defaults are the average
 * adult, and the reference's own proportions.
 */

import { unit } from '../../components/portraitLab/core/rng';
import { Build, PortraitSpec } from '../../components/portraitLab/spec/types';

export const SPRITE_W = 220;
export const SPRITE_H = 330;

/**
 * The ground line. Every figure's soles sit here regardless of how tall it is,
 * so the crown is what moves — which is the whole point of the stature system
 * below. Two people drawn side by side in an encounter stand on the same
 * floor and differ in height, instead of being scaled to fill the same box.
 */
export const GROUND_Y = 300;

/**
 * Display multiplier. MUST stay an integer: the canvas draws with
 * `image-rendering: pixelated`, and a fractional scale makes some source
 * pixels one screen pixel wide and their neighbours two — which turns an
 * authored 1px keyline into a line that randomly doubles along its length.
 * The old 1.38 was quietly undoing every edge decision in the renderer.
 */
/**
 * Display multiplier. MUST stay an integer — a fractional scale on a
 * `pixelated` canvas makes some source pixels one screen pixel wide and their
 * neighbours two, which turns an authored 1px keyline into a line that
 * randomly doubles along its length.
 *
 * That constraint is why the *grid* moved rather than this number. At the old
 * 176×330 grid the only crisp choices were 2× (figures too small) and 3× (too
 * large for the encounter stage), with nothing between. Growing the grid by a
 * quarter and staying at 2× lands between the two, keeps every edge crisp, and
 * buys detail instead of spending it.
 */
export const SPRITE_SCALE = 2;

/**
 * Headroom to keep above a figure's crown, in grid rows.
 *
 * The canvas is sized for the tallest person the stature system can produce
 * plus a raised arm and a tall hat, so a *short* figure leaves nearly half of
 * it empty overhead. That costs nothing to render but it costs layout — the
 * canvas element is as tall as the grid, the encounter stage has to reserve
 * room for headroom nobody uses, and the figures end up small to fit inside it.
 *
 * So the crop is computed per sprite from its own crown rather than fixed for
 * all of them, and this is the margin left above it. It has to clear the two
 * things that reach past the crown: a tall hat (about `headH * 0.16`) and a
 * raised fist, which on the `raise` frame ends roughly 20 rows above the head.
 */
export const SPRITE_HEADROOM = 33;

export interface SpriteTuning {
  /**
   * Retired as a position — the figure is now built upward from GROUND_Y, so
   * the crown lands where the stature puts it. Kept as a global nudge for the
   * whole figure, in px.
   */
  figureTop: number;
  headW: number;
  headH: number;
  neckH: number;
  neckW: number;
  shoulderHalf: number;
  waistHalf: number;
  hipHalf: number;
  /** Vertical spans, from the shoulder line down. */
  torsoLen: number;
  /** Waist to hip. Was hard-coded; the reference wants it short. */
  hipDrop: number;
  legLen: number;
  /** How far the trapezius climbs from the deltoid toward the neck. */
  shoulderSlope: number;
  /** Garment hems, as a fraction of the leg (0 hip … 1 ankle). */
  tunicHem: number;
  coatHem: number;
  /** Robe hems stop this many px above the floor. */
  robeLift: number;
  robeHemHalf: number;
  legW: number;
  legGap: number;
  shoeLen: number;
  shoeH: number;
  armW: number;
  /** Breathing room carved between sleeve and body below the waist. */
  armGap: number;
  /** How far past the wrist the hand hangs, as thigh fraction. */
  handDrop: number;
  /** Face features drift toward the facing side. */
  faceShift: number;
  /** True lean: the figure shears from the feet up, crown moving this many px. */
  lean: number;

  // --- Perspective: the three-quarter turn, one control at a time. ---
  /** Near (facing-side) shoulder wider, far shoulder narrower, in px. */
  shoulderAsym: number;
  /** Near shoulder sits this much lower — the turn's foreshortening. */
  shoulderDrop: number;
  /** Upper torso center shifts toward the facing side… */
  torsoSkew: number;
  /** …and the hips may shift by a different amount. */
  hipSkew: number;
  /** The far sleeve tucks behind the body by this much. */
  farArmTuck: number;
  /** Near leg leads the stride, in px. */
  strideX: number;
  /** Far foot sits higher on the ground line — further away. */
  footStagger: number;
  /** Toe length toward the facing side: 0 frontal … 6 near-profile. */
  footToe: number;
  /** Extra width on the near foot — closer to the camera. */
  footSplay: number;
  /**
   * Bearing. Positive: the head carries forward AND settles down into the
   * shoulders while the upper back rounds after it — a stoop. Negative:
   * head back, chest out — parade posture.
   */
  stoop: number;

  // --- Head furniture placement. ---
  hairY: number;
  hatY: number;

  // --- Face features, as offsets from the constructed positions. ---
  eyeDy: number;
  /** Widens (+) or narrows (−) the space between the eyes. */
  eyeGap: number;
  browDy: number;
  mouthDy: number;

  // --- Ink. ---
  /** 0 none · 1 silhouette only · 2 + interior separations. */
  outline: number;
  /**
   * Depth of the *interior shade line*, in ramp steps.
   *
   * Not a thickness. The silhouette contour is always exactly one pixel; this
   * is how far the ring of pixels just inside it is pushed down its own ramp,
   * so the edge gains weight in the material's colour rather than in black.
   */
  inkWeight: number;
  /** Contact-shadow strength at part junctions. */
  contactShade: number;
  /** Cast shadow on the ground: 0 none … 3 hard noon. */
  groundShadow: number;

  // --- Lighting. ---
  /** Key light azimuth: negative from the left, positive from the right. */
  lightDir: number;
  /** How high the key sits. Higher flattens the vertical falloff. */
  lightHeight: number;
  /** Overall shading gain: 0 flat … 3 carved. */
  lightStrength: number;
  /** Ambient fill from the sky — lifts the shadow side off black. */
  ambient: number;
  /** Rim light on the lit silhouette edge: 0 off … 3 bright. */
  rim: number;

  // --- Garment tone. ---
  /**
   * Fabric mottle density: 0 smooth … 3 heavy. Applied in 2×2 blocks, not
   * per-pixel — the reference's cloth reads as weave, and 1px dispersed
   * noise at this scale reads as sensor grain.
   */
  textureAmt: number;
  /** Falling-fold depth: 0 none … 3 deep. */
  foldStrength: number;
  /** How many fold lines fall from the waist. */
  foldCount: number;
  /** Folds swing as they fall: 0 plumb-straight … 3 loose S-curves. */
  drapeSway: number;
  /** 0 light cloth (lively, broken folds) … 3 heavy (few, deep, straight). */
  clothWeight: number;
  /** Hem raggedness: 0 ruled line … 3 torn and uneven. */
  hemBreak: number;
  /** Hem gather-line and shadow weight: 0 none … 2 strong. */
  hemLine: number;

  // --- Hands. ------------------------------------------------------------
  //
  // A hand is roughly forty pixels of the figure and it is the part the eye
  // checks after the face, so it deserves its own controls rather than
  // inheriting everything from the head's size.
  /** Overall hand size, as a fraction of head height. */
  handSize: number;
  /** How much longer than wide — low is a paw, high is a spider. */
  handLong: number;
  /** Depth of the shadow between fingers: 0 a mitten … 3 fully separated. */
  fingerSplit: number;
  /** How far the wrist bends from the forearm's line, in degrees. */
  wristBend: number;

  // --- Joints and motion. -------------------------------------------------
  //
  // The animations read as wrong more than anything else in the sprite, and
  // the joint geometry is not currently adjustable at all — every pose was
  // authored against fixed limb ratios. These expose the ratios themselves.
  /** Upper-arm length as a fraction of the shoulder-to-waist span. */
  upperArmLen: number;
  /** Forearm length relative to the upper arm. 1 is equal. */
  foreArmRatio: number;
  /** Extra bend always present at the elbow, in degrees — arms are never straight. */
  elbowRest: number;
  /** How far a hanging arm swings clear of the ribs, in degrees. */
  armSwing: number;
  /** How much a folding spine carries the shoulders forward, 0…1. */
  spineCarry: number;
  /** How far the head counter-rotates against a bending spine, 0…1. */
  headCounter: number;
  /** Global amplitude on every animated pose: 0 still … 2 exaggerated. */
  motionScale: number;

  /**
   * Cheekbone prominence: −1 reads it from the persona, 0…4 forces a level.
   *
   * 0 none · 1 subtle short · 2 subtle long · 3 strong short · 4 strong long.
   * Left at −1 the range comes from the spec, so a crowd carries a mix the way
   * the bust does; forcing a level is for judging the five against each other.
   */
  cheekLine: number;

  /**
   * How far cloth's tonal range is widened beyond the portrait's, ×1 … ×2.
   *
   * The bust tunes its ramps for a face that fills the frame; a whole figure
   * competing with a scene needs more. Measured against the style reference,
   * the mockup's skirt spans luminance 1…220 while this renderer's spanned
   * 32…135 — under half the range, which is most of what reads as flat.
   *
   * A slider rather than a constant, because the right value is a judgement:
   * too little and garments wash out, too much and a white dress grows a
   * near-black shadow side. The measurement says which direction is wrong; it
   * cannot say how far to go.
   */
  clothContrast: number;
}

/**
 * Authored against the mockup rather than scaled from the old grid: the head
 * and the body needed different factors, so no single multiplier would have
 * carried both. Level-scale fields (0–3 knobs) are unitless and carry over.
 */
export const DEFAULT_TUNING: SpriteTuning = {
  // Hand-tuned against the encounter mockups in the Shift+1 panel (2026-08),
  // then read back out of it — these are not derived numbers and should not be
  // "corrected" toward any canon. A human eye converged them on the reference
  // and that is the only authority they need.
  //
  // The average adult they describe: about 175px tall over a 30px head, a
  // shade under six heads. Every other build is this figure through the
  // stature multipliers below. Every other
  // build is this figure through the stature multipliers below.
  //
  // Head size has been the hardest number to settle and it went too far in
  // both directions before landing here. 18px could not afford the rows a
  // face needs — no lower lip, no inner eye corner, no separable fingers. 23
  // bought those back but left the head small against the body, which read as
  // a figure standing too far away. 30 is the encounter mockup's own ratio,
  // and it is a *stylisation*: real adults are 7–7.5 heads, and this figure is
  // six. The reference art is AI-generated and its pixel grid is not real, so
  // it is a target for proportion and value structure, never for measurement.
  figureTop: -2,
  headW: 22,
  headH: 30,
  neckH: 8,
  neckW: 11,
  shoulderHalf: 27,
  waistHalf: 18,
  hipHalf: 20,
  torsoLen: 42,
  hipDrop: 11,
  legLen: 84,
  shoulderSlope: 8,
  tunicHem: 0.34,
  coatHem: 0.24,
  robeLift: 7,
  robeHemHalf: 37,
  legW: 12,
  legGap: 2,
  shoeLen: 23,
  shoeH: 8,
  armW: 10,
  armGap: 1,
  handDrop: 0.12,
  // Zero: the face is frontal, and the three-quarter read comes from the
  // lighting and the single visible ear instead. A one-pixel shift is enough
  // to push the near eye against the silhouette edge on a 16px head, and a
  // face with one eye crowding its own outline reads as a mistake, not as
  // perspective. Feet and torso still carry the turn.
  faceShift: 1,
  lean: 0,
  // Perspective.
  shoulderAsym: -1,
  shoulderDrop: 0,
  torsoSkew: 1,
  hipSkew: 1,
  farArmTuck: 3,
  strideX: 8,
  footStagger: 1,
  footToe: 12,
  footSplay: 0,
  stoop: 1,
  // Head furniture.
  hairY: 0,
  hatY: 1,
  // Face.
  eyeDy: 0,
  eyeGap: 0,
  browDy: 0,
  mouthDy: 0,
  // Ink.
  outline: 0,
  inkWeight: 3,
  contactShade: 3,
  groundShadow: 2,
  // Light.
  lightDir: 0,
  lightHeight: 2,
  lightStrength: 3,
  ambient: 1,
  rim: 1,
  // Cloth.
  textureAmt: 1,
  foldStrength: 2,
  foldCount: 2,
  drapeSway: 1,
  clothWeight: 2,
  hemBreak: 1,
  hemLine: 1,
  // Hands.
  handSize: 0.31,
  handLong: 1.45,
  fingerSplit: 2,
  wristBend: -11,
  // Joints. `upperArmLen` and `foreArmRatio` reproduce the previous fixed
  // geometry exactly at these values, so the defaults are a no-op change.
  upperArmLen: 0.63,
  foreArmRatio: 0.94,
  elbowRest: 4,
  armSwing: 8,
  spineCarry: 0.2,
  headCounter: 0.35,
  motionScale: 0.95,
  cheekLine: -1,
  clothContrast: 1.55,
};

// v3 is the 128×160 grid. v1 (96×176) and v2 (192×352) tunings are not
// convertible — the head/body ratio changed, not just the scale — so a
// stored tuning from either is dropped rather than migrated.
const STORAGE_KEY = 'hpg-sprite-tuning-v3';

let active: SpriteTuning = { ...DEFAULT_TUNING };

try {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) active = { ...DEFAULT_TUNING, ...JSON.parse(stored) };
    window.localStorage.removeItem('hpg-sprite-tuning-v1');
    window.localStorage.removeItem('hpg-sprite-tuning-v2');
  }
} catch { /* defaults are fine */ }

const listeners = new Set<() => void>();

export function getTuning(): SpriteTuning {
  return active;
}

export function setTuning(next: Partial<SpriteTuning>): SpriteTuning {
  active = { ...active, ...next };
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    }
  } catch { /* fine */ }
  listeners.forEach((fn) => fn());
  return active;
}

export function resetTuning(): SpriteTuning {
  return setTuning({ ...DEFAULT_TUNING });
}

export function subscribeTuning(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Joint angles for one frame, in the figure's own space. Poses move *these*,
 * and every limb draws from them — so a hanging arm and a reaching arm are
 * the same code at different angles, and a bow folds the spine instead of
 * shearing the finished pixels.
 */
export interface Posture {
  /** Forward fold at the waist, in degrees. */
  spineBend: number;
  /** Side-to-side sway of the whole figure, in px at the crown. */
  lean: number;
  /** Head nod relative to the spine, in px of crown travel. */
  headNod: number;
  /** Per-arm joint angles, in degrees clockwise from straight-down. */
  arms: Record<'near' | 'far', ArmPose>;
  /** Vertical bob of the whole figure — breathing. */
  bob: number;
}

/**
 * Arm angles in the *image plane*, which is the only space that can be
 * authored by eye. An earlier version mixed a forward swing and an abduction
 * into one x-offset and every pose came out either inside the torso or in a
 * T-pose; separating "how far from the body it swings" from "how much it
 * points at the viewer" makes each pose one legible number.
 */
export interface ArmPose {
  /** Degrees from straight-down, positive swinging away from the body. */
  swing: number;
  /** Elbow flexion, degrees. In-plane it folds the forearm toward the midline. */
  elbow: number;
  /** 0 the arm lies in the figure's plane … 1 it points at the viewer. */
  forward: number;
  hand: HandShape;
}

export type HandShape =
  | 'rest' | 'open' | 'clasp' | 'grip' | 'present' | 'fist' | 'hidden';

/** Everything the parts attach to. All absolute canvas coordinates. */
export interface Skeleton {
  cx: number;
  /** Where the head and neck sit: cx plus the stoop's forward carry. */
  headCx: number;
  /**
   * The rounded upper back: how far the shoulder line follows the head
   * forward. Torso top rows and sleeve roots share this offset.
   */
  stoopTopSkew: number;
  faceCx: number;
  crownY: number;
  eyeY: number;
  chinY: number;
  neckTopY: number;
  shoulderY: number;
  chestY: number;
  waistY: number;
  hipY: number;
  kneeY: number;
  ankleY: number;
  floorY: number;
  handY: number;
  /** Resolved head size for this person — the face lays itself out on these. */
  headH: number;
  headW: number;
  headRx: number;
  headRy: number;
  shoulderHalf: number;
  waistHalf: number;
  hipHalf: number;
  legW: number;
  legGap: number;
  armW: number;
  shoeH: number;
  stature: Stature;
  /**
   * How far the figure is rotated away from square-on, 0 (frontal) … 1 (near
   * profile). This is the *whole* three-quarter view: it makes the torso's two
   * halves genuinely different widths, offsets the barrel the light crosses,
   * tucks the far arm behind the ribs, turns the head, and points both feet
   * the same way.
   *
   * It replaces a scattering of ±1px nudges (`shoulderAsym`, `torsoSkew`,
   * `farArmTuck`) that were each too small to read and, being independent,
   * could not agree with one another about which way the body was facing. A
   * figure has one orientation, so it gets one number.
   */
  turn: number;
  /** Which side of the figure's *body* is nearer the viewer. -1 is the viewer's left. */
  nearSide: -1 | 1;
  t: SpriteTuning;
}

/**
 * Per-persona variation, seeded from the spec: every figure carries its own
 * bearing, stride, and proportions as small offsets from the tuned base, so
 * a crowd stops being one body wearing forty heads. Deterministic per seed —
 * the same persona always stands the same way.
 *
 * Spans are roughly half the old grid's, because the grid is: a 3px stoop at
 * 128 wide is the same bearing a 6px stoop was at 192.
 */
function jitteredTuning(spec: PortraitSpec, base: SpriteTuning): SpriteTuning {
  const j = (tag: string, span: number) => Math.round((unit(spec.seed, `sprite-${tag}`) - 0.5) * 2 * span);
  const t = { ...base };
  // Bearing.
  t.stoop += j('stoop', 2);
  t.lean += j('lean', 1);
  t.shoulderAsym += j('shasym', 1);
  t.strideX = Math.max(0, t.strideX + j('stride', 2));
  t.footToe = Math.max(0, t.footToe + j('toe', 2));
  // Build, beyond the spec's coarse tags. Overall size is the stature's job
  // now; these are the small departures from it that keep a crowd from
  // reading as one body at three sizes.
  t.headW += j('headw', 1);
  t.headH += j('headh', 1);
  t.neckW = Math.max(6, t.neckW + j('neckw', 1));
  t.shoulderHalf = Math.max(13, t.shoulderHalf + j('shoulder', 1));
  t.waistHalf = Math.max(9, t.waistHalf + j('waist', 1));
  t.legW = Math.max(7, t.legW + j('legw', 1));
  t.legLen += j('leglen', 2);
  // Face placement.
  t.eyeGap += j('eyegap', 1);
  t.browDy += j('browdy', 1);
  return t;
}

/**
 * How big this person is, in three numbers that deliberately do **not** move
 * together.
 *
 * The anatomy: a 4'5" woman and a 7' man differ by about 58% in height but
 * only about 18% in head height. That divergence is not a detail — it *is*
 * why a tall person reads as tall. Scale a figure uniformly and you get the
 * same person viewed from closer; scale the body faster than the head and you
 * get a different person. So `body` ranges roughly 0.85–1.24 while `head`
 * ranges only 0.94–1.20, and the heads-tall count falls out of the ratio:
 * about 6.1 for the smallest figure, 6.8 average, 7.3 for the largest.
 *
 * `girth` is separate again, because breadth is not height: a stocky person is
 * short *and* wide, a tall one is often long *and* narrow, and one scalar
 * cannot say both.
 */
export interface Stature {
  body: number;
  head: number;
  girth: number;
}

const BUILD_STATURE: Record<Build, Stature> = {
  slight:   { body: 0.96, head: 0.98, girth: 0.90 },
  short:    { body: 0.88, head: 0.94, girth: 1.00 },
  stocky:   { body: 0.93, head: 1.00, girth: 1.18 },
  heavy:    { body: 0.98, head: 1.03, girth: 1.30 },
  average:  { body: 1.00, head: 1.00, girth: 1.00 },
  athletic: { body: 1.05, head: 0.99, girth: 1.08 },
  tall:     { body: 1.13, head: 1.13, girth: 0.96 },
  imposing: { body: 1.20, head: 1.22, girth: 1.16 },
};

export function statureOf(spec: PortraitSpec): Stature {
  const base = BUILD_STATURE[spec.build] ?? BUILD_STATURE.average;
  // Sex and age, both small next to build but both real. Older people lose a
  // little height; the stoop that usually comes with it is separate.
  const female = spec.gender === 'Female';
  const shrink = spec.age >= 70 ? 0.975 : spec.age >= 58 ? 0.99 : 1;
  // Within-build variation, so two 'average' villagers are not twins.
  const j = (unit(spec.seed, 'stature') - 0.5) * 0.06;
  return {
    body: base.body * (female ? 0.95 : 1) * shrink * (1 + j),
    head: base.head * (female ? 0.98 : 1),
    girth: base.girth * (female ? 0.94 : 1),
  };
}

export function buildSkeleton(spec: PortraitSpec, tuning: SpriteTuning = active): Skeleton {
  const t = jitteredTuning(spec, tuning);
  const st = statureOf(spec);
  const b = spec.build;
  const female = spec.gender === 'Female';
  const hunch = Math.round((spec.pose?.hunch ?? 0) * 4) + (spec.age >= 62 ? 2 : 0);

  const px = (v: number, f: number) => Math.max(1, Math.round(v * f));
  // Limbs lengthen faster than the trunk as stature rises, and the trunk
  // slower — the long-legged look of tall people, and the compact one of
  // short people, are both in this pair of exponents.
  const headH = px(t.headH, st.head);
  const headW = px(t.headW, st.head * (b === 'heavy' || b === 'stocky' ? 1.06 : 1));
  const neckH = px(t.neckH, st.body);
  const torsoLen = px(t.torsoLen, Math.pow(st.body, 0.88));
  const hipDrop = px(t.hipDrop, st.body);
  let legLen = px(t.legLen, Math.pow(st.body, 1.06));
  const shoeH = px(t.shoeH, st.body);

  // Built upward from the ground, so every figure stands on the same line and
  // its *height* is what differs. Building downward from a fixed crown, as
  // this used to, made a tall man and a short woman the same height with
  // differently sized heads.
  let total = headH + neckH - 2 + torsoLen + hipDrop + legLen;
  // Heads-tall is clamped, not merely emergent.
  //
  // The multipliers can compound — a tall, slight build takes the long-leg
  // exponent *and* the small-head factor *and* the seeded jitter all in the
  // same direction — and the result was a figure near seven heads with thin
  // elongated limbs that read as stretched rather than as tall. The band below
  // is the observed acceptable range: 6.3 is a genuinely lanky person and is
  // as far as this should ever go.
  const HEADS_MIN = 4.9;
  const HEADS_MAX = 5.9;
  const heads = total / headH;
  if (heads > HEADS_MAX || heads < HEADS_MIN) {
    const want = Math.min(HEADS_MAX, Math.max(HEADS_MIN, heads)) * headH;
    // Correct in the legs: they are the segment whose length actually varies
    // between builds, and shrinking the torso instead makes a stumpy trunk.
    legLen = Math.max(20, legLen + Math.round(want - total));
    total = headH + neckH - 2 + torsoLen + hipDrop + legLen;
  }
  const cx = Math.round(SPRITE_W / 2);
  // `lean` carries the upper body off the plumb line. It used to be applied as
  // a shear over the finished raster — removed when poses became joint angles,
  // which left the slider inert. It belongs here: the shoulders and head
  // offset, the feet stay planted, and every part inherits it for free.
  const leanTop = t.lean;
  const floorY = GROUND_Y;
  const stoopDrop = Math.max(0, Math.round(t.stoop * 0.4));
  const crownBase = floorY - total + t.figureTop + hunch;
  const crownY = crownBase + stoopDrop;
  const headRy = Math.round(headH / 2);
  const headRx = Math.round(headW / 2);
  const chinY = crownY + headH;
  // The head seats *into* the shoulders: the chin overlaps the collar line
  // by a row instead of floating above a column of neck.
  const shoulderY = crownBase + headH + neckH - 2;
  const waistY = shoulderY + torsoLen;
  const hipY = waistY + hipDrop;
  const ankleY = floorY - shoeH;

  // Seeded per persona so a crowd is not all standing at the same angle, but
  // never square-on: a frontal figure is a paper doll, and the whole point of
  // the turn is that it is what makes the body read as a solid.
  const turn = 0.5 + unit(spec.seed, 'turn') * 0.35;

  const g = st.girth;
  return {
    cx,
    turn,
    nearSide: -1,
    headCx: cx + t.stoop + leanTop,
    faceCx: cx + t.stoop + t.faceShift + leanTop,
    stoopTopSkew: Math.round(t.stoop * 0.5) + Math.round(leanTop * 0.6),
    crownY,
    // The eye line sits just above the head's vertical midpoint — the
    // schoolroom rule, and the reference obeys it.
    eyeY: crownY + Math.round(headH * 0.55),
    chinY,
    neckTopY: chinY - Math.round(headH * 0.14),
    shoulderY,
    chestY: shoulderY + Math.round(torsoLen * 0.32),
    waistY,
    hipY,
    kneeY: hipY + Math.round((ankleY - hipY) * 0.5),
    ankleY,
    floorY,
    handY: hipY + Math.round((ankleY - hipY) * t.handDrop),
    headH,
    headW,
    headRx,
    headRy,
    // Shoulders carry the build; hips carry it too but women's carry more of
    // it, which is most of what distinguishes the two silhouettes at a glance.
    // The waist is the *silhouette*, and the silhouette is what reads first.
    //
    // At 0.95 of an already-modest base the trunk narrowed by about five pixels
    // out of twenty-four between shoulder and waist — a taper the eye does not
    // register, so every figure fell as a straight tube from shoulder to hem
    // whatever the folds inside it were doing. A woman's waist is the narrowest
    // part of the trunk by a clear margin and her hips the widest; stating that
    // properly costs nothing and is most of what distinguishes the two
    // silhouettes at a glance.
    shoulderHalf: px(t.shoulderHalf, g * (female ? 0.92 : 1)),
    waistHalf: px(t.waistHalf, g * (female ? 0.80 : 0.94)),
    hipHalf: px(t.hipHalf, g * (female ? 1.14 : 1)),
    // The base width is the *men's*; women take a narrower leg on top of the
    // girth factor. Sharing one width made every woman read as heavier-limbed
    // than she should from the knee down, which is the part of the silhouette
    // a skirt leaves on show.
    legW: px(t.legW, Math.sqrt(g) * (female ? 0.84 : 1)),
    legGap: t.legGap,
    armW: px(t.armW, Math.sqrt(g) * (female ? 0.9 : 1)),
    shoeH,
    stature: st,
    t,
  };
}
