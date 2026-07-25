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
import { PortraitSpec } from './types';

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

  // Long faces get a taller skull and a slightly narrower one; round faces the
  // reverse. Children keep a larger cranium relative to the jaw.
  let headHeight = 58;
  let widthScale = 1;
  switch (spec.faceShape) {
    case 'long': headHeight += 5; widthScale = 0.925; break;
    case 'round': headHeight -= 4; widthScale = 1.055; break;
    case 'square': headHeight -= 1; widthScale = 1.02; break;
    case 'heart': headHeight += 1; break;
    case 'diamond': headHeight += 2; break;
    default: break;
  }
  if (female) widthScale *= 0.965;
  if (spec.build === 'imposing' || spec.build === 'heavy') widthScale *= 1.04;
  if (spec.build === 'slight') widthScale *= 0.97;
  if (spec.age < 14) { headHeight -= 4; widthScale *= 1.03; }

  let keys = scaleKeys(BASE_PROFILE, (_t, half) => half * widthScale);

  // Face shape reshapes the outline rather than just scaling it.
  switch (spec.faceShape) {
    case 'heart':
      keys = scaleKeys(keys, (t, half) =>
        t < 0.35 ? half * 1.04 : t > 0.82 ? half * (0.82 - (t - 0.82) * 0.6) : half);
      break;
    case 'diamond':
      keys = scaleKeys(keys, (t, half) =>
        t < 0.3 ? half * 0.9 : t < 0.62 ? half * 1.05 : half * 0.86);
      break;
    case 'square':
      keys = scaleKeys(keys, (t, half) => (t > 0.7 ? half * (1 + (t - 0.7) * 0.72) : half));
      break;
    case 'round':
      keys = scaleKeys(keys, (t, half) => (t > 0.72 ? half * (1 + (t - 0.72) * 0.38) : half));
      break;
    default:
      break;
  }

  // Jaw and cheekbone are separate knobs from the overall shape.
  const jawFactor: Record<string, number> = {
    sharp: 0.86, soft: 1.0, square: 1.16, round: 1.08, oval: 0.96,
  };
  const jaw = jawFactor[spec.jawline] ?? 1;
  keys = scaleKeys(keys, (t, half) => (t > 0.66 ? half * (1 + (jaw - 1) * ((t - 0.66) / 0.34)) : half));

  const cheekFactor = spec.cheekbones === 'high' ? 1.06 : spec.cheekbones === 'low' ? 0.95 : 1;
  keys = scaleKeys(keys, (t, half) =>
    t > 0.4 && t < 0.68 ? half * (1 + (cheekFactor - 1) * (1 - Math.abs(t - 0.54) / 0.14)) : half);

  const headTop = Math.round(9 - (headHeight - 58) * 0.35);
  const chinY = headTop + headHeight;
  const headHalfWidth = Math.max(...keys.map(([, half]) => half));

  const at = (fraction: number) => headTop + headHeight * fraction;

  // A touch of seeded asymmetry in the feature placement keeps a grid of
  // portraits from looking stamped out of one mould.
  const jitter = (unit(spec.seed, 'feature-jitter') - 0.5) * 1.2;

  const eyeY = Math.round(at(0.515) + jitter * 0.4);
  // Classical proportion puts one eye-width between the eyes; on a 48px head
  // with 9px eyes that lands the pupils about ten pixels off centre.
  const eyeDX = Math.round(headHalfWidth * 0.42);

  const neckHalf = Math.round((female ? 8.4 : 9.8) * (spec.build === 'imposing' ? 1.15 : spec.build === 'slight' ? 0.9 : 1));
  const shoulderHalf = (SHOULDER_HALF[spec.build] ?? 33) * (female ? 0.9 : 1);

  return {
    size: CANVAS,
    centerX,

    headTop,
    chinY,
    headHeight,
    headHalfWidth,
    headProfile: keys,

    // Far enough above the lash line that brow and eye stay two forms
    // rather than merging into one dark slab.
    browY: Math.round(at(0.405)),
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
  };
}
