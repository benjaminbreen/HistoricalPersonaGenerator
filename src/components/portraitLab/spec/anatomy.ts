/**
 * portraitLab/spec/anatomy.ts
 *
 * Where everything sits on a 96×96 canvas.
 *
 * The framing is a tight bust: crown near the top edge, shoulders running off
 * the bottom. That gives the head about 48px of width, which is the whole point
 * of moving up from 64×64 — a nose gets five pixels instead of three, and an
 * eye gets ten instead of four. Features are placed as fractions of the skull
 * so a long face and a round face keep believable proportions.
 */

import { unit } from '../core/rng';
import { PortraitSpec, SkullShape } from './types';

export const CANVAS = 96;

export type ProfileKeys = Array<[number, number]>;

export interface Anatomy {
  size: number;
  centerX: number;

  headTop: number;
  chinY: number;
  headHeight: number;
  headHalfWidth: number;
  headProfile: ProfileKeys;
  /**
   * How far the cranium has been extended above where it would naturally sit,
   * in pixels. Zero for every unbound skull. Read by the hair, which has to
   * know that the vault above the hairline is taller than the face implies.
   */
  craniumRise: number;

  browY: number;
  eyeY: number;
  eyeDX: number;
  eyeHalfWidth: number;
  cheekY: number;
  noseBridgeY: number;
  noseBaseY: number;
  mouthY: number;

  earTopY: number;
  earBottomY: number;
  earX: number;

  neckTop: number;
  neckBottom: number;
  neckHalf: number;

  shoulderTop: number;
  shoulderHalf: number;
  /** Where a collar or neckline crosses the chest. */
  collarY: number;

  /**
   * The small ways a real face fails to be its own mirror image.
   *
   * Perfect bilateral symmetry is the loudest tell that a face was generated
   * rather than drawn, and it is loud precisely because it never occurs: no
   * human has brows at the same height or a nose on the midline. A pixel here
   * or there is enough — these are deliberately sub-feature offsets, not
   * deformations, and at 96px one pixel of brow is a visible difference in
   * expression.
   *
   * Indexed by side: `[0]` is the viewer's left (side −1), `[1]` the right.
   */
  asymmetry: {
    browY: [number, number];
    eyeY: [number, number];
    /** Sideways offset of the nose, in pixels. */
    noseLean: number;
    /** Sideways offset of the mouth, in pixels. */
    mouthLean: number;
  };
}

const BASE_PROFILE: ProfileKeys = [
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

function scaleKeys(keys: ProfileKeys, fn: (t: number, half: number) => number): ProfileKeys {
  return keys.map(([t, half]) => [t, Math.max(2, fn(t, half))]);
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * A width multiplier that varies smoothly down the skull.
 *
 * The face shapes used to be written as step functions — `t < 0.3 ? 0.82 :
 * t < 0.62 ? 1.11 : 0.76` for a diamond, and similar for the rest. That is
 * fine while the steps are small, and catastrophic once they are not: the
 * profile's control points sit at t = 0.26 and t = 0.40, so that particular
 * ternary asked two *adjacent* points to differ by 35%, about seven pixels.
 * `sampleProfile` runs Catmull-Rom through them, Catmull-Rom overshoots a step
 * it cannot fit, and the result was a hard angular flare at the temples and a
 * pinched cranium above it. Amplifying the axes did not create that bug; it
 * only made an existing discontinuity big enough to see.
 *
 * Interpolating between anchors with a smoothstep removes the class of problem
 * rather than the instance: there is no way to express a step here, so no
 * future edit to these numbers can reintroduce a corner.
 */
function shapeCurve(anchors: Array<[number, number]>): (t: number) => number {
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

/**
 * The width profiles, as multipliers on the base skull.
 *
 * Read down each list: crown, temple, cheek, jaw, chin. No two neighbouring
 * anchors differ by more than about a tenth, which is the working limit for
 * staying clear of spline overshoot — `limitDeviation` enforces it afterwards
 * regardless, but keeping the authored numbers inside it means the shape you
 * write is the shape you get.
 */
const FACE_SHAPE_CURVES: Record<string, Array<[number, number]>> = {
  // Full through the jaw and a touch narrower at the crown.
  round: [[0, 0.98], [0.5, 1.02], [1, 1.08]],
  // Straight sides carried down to a broad, flat jaw.
  square: [[0, 1.0], [0.5, 1.01], [0.8, 1.09], [1, 1.13]],
  // Tall already, from `headHeight`; the outline's job is to narrow downward.
  long: [[0, 1.0], [0.5, 0.99], [1, 0.90]],
  // Broad at the temples, tapering to a small chin.
  heart: [[0, 1.05], [0.3, 1.04], [0.65, 0.95], [1, 0.82]],
  // Narrow above and below, widest across the cheekbones.
  diamond: [[0, 0.90], [0.28, 0.96], [0.5, 1.06], [0.75, 0.95], [1, 0.85]],
};

/**
 * Stop the accumulated modifiers from varying faster than the spline can draw.
 *
 * Face shape, jawline and cheekbones each multiply the same profile, so they
 * compound: a diamond face with high cheekbones and a sharp jaw applied three
 * separate narrowings and a widening to overlapping stretches of the same
 * skull. Clamping how much the *combined* multiplier may change between
 * neighbouring control points bounds the compounding without capping any one
 * axis, so each stays as expressive as it is on its own and only their
 * pile-up is limited.
 */
function limitDeviation(base: ProfileKeys, shaped: ProfileKeys, maxStep: number): ProfileKeys {
  const ratio = shaped.map(([, half], i) => half / Math.max(0.001, base[i][1]));
  for (let i = 1; i < ratio.length; i += 1) {
    ratio[i] = clamp(ratio[i], ratio[i - 1] - maxStep, ratio[i - 1] + maxStep);
  }
  for (let i = ratio.length - 2; i >= 0; i -= 1) {
    ratio[i] = clamp(ratio[i], ratio[i + 1] - maxStep, ratio[i + 1] + maxStep);
  }
  return base.map(([t, half], i) => [t, Math.max(2, half * ratio[i])]);
}

const SHOULDER_HALF: Record<string, number> = {
  slight: 29,
  short: 31,
  average: 33,
  athletic: 36,
  tall: 34,
  stocky: 37.5,
  heavy: 39,
  imposing: 41,
};

export function buildAnatomy(spec: PortraitSpec): Anatomy {
  const centerX = CANVAS / 2;
  const female = spec.gender === 'Female';

  // Long faces get a taller skull and a narrower one; round faces the reverse.
  // Children keep a larger cranium relative to the jaw.
  //
  // These numbers used to be roughly half what they are. A contact sheet of the
  // twelve feature fixtures — twelve portraits differing only in face shape,
  // jaw, cheekbone, nose and eyes — came back indistinguishable at six times
  // magnification, and the arithmetic says why: a 4% width change on a
  // 46-pixel-wide head is under a pixel, so it rounds away entirely. An axis
  // that cannot move a whole pixel is not an axis. Anything meant to be visible
  // here has to be worth at least two.
  let headHeight = 58;
  let widthScale = 1;
  switch (spec.faceShape) {
    case 'long': headHeight += 8; widthScale = 0.90; break;
    case 'round': headHeight -= 6; widthScale = 1.08; break;
    case 'square': headHeight -= 2; widthScale = 1.04; break;
    case 'heart': headHeight += 2; widthScale = 1.02; break;
    case 'diamond': headHeight += 3; widthScale = 1.0; break;
    default: break;
  }
  if (female) widthScale *= 0.955;
  if (spec.build === 'imposing' || spec.build === 'heavy') widthScale *= 1.06;
  if (spec.build === 'slight') widthScale *= 0.95;
  if (spec.age < 14) { headHeight -= 4; widthScale *= 1.03; }

  const scaled = scaleKeys(BASE_PROFILE, (_t, half) => half * widthScale);
  let keys = scaled;

  // Face shape reshapes the outline rather than just scaling it.
  const shape = FACE_SHAPE_CURVES[spec.faceShape];
  if (shape) {
    const curve = shapeCurve(shape);
    keys = scaleKeys(keys, (t, half) => half * curve(t));
  }

  // Jaw and cheekbone are separate knobs from the overall shape. Both blend in
  // with a smoothstep rather than a linear ramp — a linear ramp leaves a corner
  // in the derivative where it starts, and at this size a kink in the outline
  // is as visible as a step in it.
  const jawFactor: Record<string, number> = {
    sharp: 0.80, soft: 1.0, square: 1.20, round: 1.12, oval: 0.92,
  };
  const jaw = jawFactor[spec.jawline] ?? 1;
  keys = scaleKeys(keys, (t, half) => {
    const u = clamp((t - 0.56) / 0.44, 0, 1);
    return half * (1 + (jaw - 1) * u * u * (3 - 2 * u));
  });

  // Cheekbones are a bump, not a plateau: a Gaussian centred on the zygomatic
  // arch falls off to nothing in both directions on its own.
  const cheekFactor = spec.cheekbones === 'high' ? 1.09 : spec.cheekbones === 'low' ? 0.93 : 1;
  if (cheekFactor !== 1) {
    keys = scaleKeys(keys, (t, half) =>
      half * (1 + (cheekFactor - 1) * Math.exp(-Math.pow((t - 0.5) / 0.19, 2))));
  }

  keys = limitDeviation(scaled, keys, 0.075);

  const headTop = Math.round(9 - (headHeight - 58) * 0.35);
  const chinY = headTop + headHeight;
  const headHalfWidth = Math.max(...keys.map(([, half]) => half));

  const at = (fraction: number) => headTop + headHeight * fraction;

  // A touch of seeded asymmetry in the feature placement keeps a grid of
  // portraits from looking stamped out of one mould.
  const jitter = (unit(spec.seed, 'feature-jitter') - 0.5) * 1.2;

  // Which way this face is off-true, and by how much. Rounded to whole pixels
  // because a fractional offset is a no-op once the feature is stamped, and
  // biased so that most faces get one asymmetry rather than four — a face that
  // is off-true everywhere at once stops reading as a face and starts reading
  // as a mistake.
  const asymPick = (label: string, magnitude: number) => {
    const u = unit(spec.seed, label);
    return Math.round((u - 0.5) * 2 * magnitude);
  };
  const browSkew = asymPick('brow-skew', 1.4);
  const eyeSkew = asymPick('eye-skew', 0.9);

  const eyeY = Math.round(at(0.515) + jitter * 0.4);
  // Classical proportion puts one eye-width between the eyes; on a 48px head
  // with 9px eyes that lands the pupils about ten pixels off centre.
  const eyeDX = Math.round(headHalfWidth * 0.42);

  const neckHalf = Math.round((female ? 8.4 : 9.8) * (spec.build === 'imposing' ? 1.15 : spec.build === 'slight' ? 0.9 : 1));
  const shoulderHalf = (SHOULDER_HALF[spec.build] ?? 33) * (female ? 0.9 : 1);

  return applySkullShape({
    size: CANVAS,
    centerX,

    headTop,
    chinY,
    headHeight,
    headHalfWidth,
    headProfile: keys,
    craniumRise: 0,

    // Far enough above the lash line that brow and eye stay two forms rather
    // than merging into one dark slab.
    //
    // A fraction of the skull height alone does not guarantee that: a round
    // face is six pixels shorter than an oval one, which takes a proportional
    // gap of 6.4px down to 5.6. So the gap is proportional where there is room
    // and six pixels where there is not. It is deliberately only a floor — a
    // heavy brow sitting close over a small skull is a face, not a fault, and
    // the audit's occlusion check flags a few of those. Widening this to
    // silence them would be flattening real variation to please a threshold.
    browY: Math.min(Math.round(at(0.405)), eyeY - 6),
    eyeY,
    eyeDX,
    eyeHalfWidth: 4,
    cheekY: Math.round(at(0.62)),
    noseBridgeY: Math.round(at(0.5)),
    noseBaseY: Math.round(at(0.725)),
    // Classical proportion puts the mouth a third of the way from the nose
    // base to the chin; any lower and the mid-face reads gaunt.
    mouthY: Math.round(at(0.815)),

    earTopY: Math.round(at(0.44)),
    earBottomY: Math.round(at(0.68)),
    // Sat on the silhouette, so the ear protrudes past it instead of being
    // buried inside the cheek where it is invisible.
    earX: Math.round(headHalfWidth),

    neckTop: chinY - 7,
    neckBottom: chinY + 12,
    neckHalf,

    shoulderTop: chinY + 8,
    shoulderHalf,
    collarY: chinY + 12,

    asymmetry: {
      browY: [Math.max(0, -browSkew), Math.max(0, browSkew)],
      eyeY: [Math.max(0, -eyeSkew), Math.max(0, eyeSkew)],
      noseLean: asymPick('nose-lean', 0.8),
      mouthLean: asymPick('mouth-lean', 0.8),
    },
  }, spec.skull);
}

/**
 * A skull bound in infancy.
 *
 * The modification is to the cranium, not to the face: binding a child's head
 * moves the vault up and back and leaves the eyes, nose and mouth where they
 * were. So this runs *after* every feature has been placed and touches only the
 * three things that describe the vault — where it starts, how tall it is, and
 * how wide it is on the way up. Everything that draws itself against the skull
 * rather than against a fixed row follows for free: the hair grows over the new
 * dome, a cap fits it, the shading ellipsoid stretches with it.
 *
 * The vault narrows as it rises, on a curve rather than a taper. Straight sides
 * give a cone; what the Paracas and Alemannic skulls actually show is a long
 * dome that keeps its roundness right to the top.
 */
function applySkullShape(anatomy: Anatomy, shape: SkullShape): Anatomy {
  if (shape !== 'elongated') return anatomy;

  const rise = Math.round(anatomy.headHeight * 0.2);
  const newTop = anatomy.headTop - rise;
  const newHeight = anatomy.headHeight + rise;
  const share = rise / newHeight;

  // The old profile still describes the face; it just occupies less of the
  // skull's height than it did.
  const remapped: ProfileKeys = anatomy.headProfile.map(([t, half]) =>
    [share + t * (1 - share), half] as [number, number]);

  const crownHalf = anatomy.headProfile[0][1];
  const vault: ProfileKeys = [];
  for (let i = 0; i < 4; i += 1) {
    const u = i / 4;
    vault.push([u * share, crownHalf * (0.54 + 0.46 * Math.sqrt(u))]);
  }

  return {
    ...anatomy,
    headTop: newTop,
    headHeight: newHeight,
    headProfile: [...vault, ...remapped],
    craniumRise: rise,
  };
}
