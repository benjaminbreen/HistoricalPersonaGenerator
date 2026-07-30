/**
 * encounter/sprite/skeleton.ts
 *
 * The figure's measurements, in one tunable object. Every number here was
 * taken off the mockup reference crops (devtools/reference-*.png): a figure
 * about five and a half heads tall, shoulders just under two head-widths,
 * hands at mid-thigh, big honest shoes. The dev panel (Shift+1) edits these
 * live; the defaults are the mockup's own proportions.
 */

import { unit } from '../../components/portraitLab/core/rng';
import { PortraitSpec } from '../../components/portraitLab/spec/types';

export const SPRITE_W = 192;
export const SPRITE_H = 352;

export interface SpriteTuning {
  /** Where the crown of the head sits. */
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
  legLen: number;
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
  /** Toe length toward the facing side: 0 frontal … 8 near-profile. */
  footToe: number;
  /** Extra width on the near foot — closer to the camera. */
  footSplay: number;
  /**
   * Bearing. Positive: the head carries forward AND settles down into the
   * shoulders while the upper back rounds after it — a stoop. Negative:
   * head back, chest out — parade posture.
   */
  stoop: number;

  // --- Hair placement. ---
  hairX: number;
  hairY: number;
  /** Extra hair mass radius. */
  hairVol: number;
  /** How deep the fringe shadow falls on the brow. */
  fringe: number;

  // --- Headwear placement. ---
  hatX: number;
  hatY: number;

  // --- Face features, as offsets from the constructed positions. ---
  eyeDx: number;
  eyeDy: number;
  /** Widens (+) or narrows (−) the space between the eyes. */
  eyeGap: number;
  /** Grows (+) or shrinks (−) both eyes. The spec's eyeShape sets the base. */
  eyeSize: number;
  /**
   * How much the eye opens up: 0 calm solid-dark · 1 + a catchlight ·
   * 2 + a sclera corner · 3 full whites with iris · 4 bright wide whites.
   */
  eyeWhites: number;
  /** Jaw shading: strength deepens it, and it reaches further along the jaw. */
  jawShade: number;
  /** Cheek blush strength. */
  blush: number;
  /** Blush patch size: 0 a fleck … 3 a broad wash. */
  blushSize: number;
  /** Cheekbone plane-change strength: 0 flat … 3 carved. */
  cheekShade: number;
  browDy: number;
  mouthDy: number;
  earDy: number;

  // --- Ink. ---
  /** 0 none · 1 silhouette · 2 + interior seams · 3 thickened shadow side. */
  outline: number;
  /** How gently hair and headscarves are inked: 0 crisp … 3 nearly none. */
  inkSoft: number;
  /** Rim light on the lit silhouette edge: 0 off … 3 bright. */
  rim: number;
  /** Contact-shadow strength at part junctions. */
  contactShade: number;

  // --- Lighting. ---
  /** Moves the key light: negative left, positive right. */
  lightDir: number;
  /** Broad form-light strength: 0 flat … 3 dramatic. */
  lightStrength: number;
  /** Per-part shading gain: 0 soft … 3 carved. */
  shadeContrast: number;

  // --- Garment tone. ---
  /** Fabric mottle density: 0 smooth … 3 heavy. */
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

  // --- More face. ---
  /** Retired: the portrait eye stamps own slant/shape now. Kept for storage. */
  eyeSlant: number;
  /** Brow length adjustment. */
  browLen: number;
  /** Extra brow thickness on top of the spec's. */
  browThick: number;
  /** Mouth width adjustment. */
  mouthW: number;
  /** Nose length: −1 short … 2 long. */
  noseLen: number;
  /**
   * Lip fullness on top of the spec's lipShape: 0 a seam · 1 a lower lip ·
   * 2 both lips with a highlight · 3 full mouth.
   */
  lipFull: number;
  /** Ear prominence: 0 hidden · 1 a hint · 2 a drawn ear · 3 prominent. */
  earSize: number;
}

// Hand-tuned in the Shift+1 panel against the encounter mockups (2026-07),
// then ported to the 192×352 grid: an upright figure with a slight
// back-lean, strong ink and rim, carved shading, heavy straight-hanging
// cloth, and calm catchlit eyes. Pixel-unit values are 2× the tuned
// originals; fractions and level-scales carried over unchanged.
export const DEFAULT_TUNING: SpriteTuning = {
  figureTop: 25,
  headW: 40,
  headH: 58,
  neckH: 4,
  neckW: 17,
  shoulderHalf: 28,
  waistHalf: 20,
  hipHalf: 26,
  torsoLen: 55,
  legLen: 136,
  tunicHem: 0.74,
  coatHem: 0.5,
  robeLift: 6,
  robeHemHalf: 56,
  legW: 16,
  legGap: 2,
  shoeLen: 34,
  shoeH: 16,
  armW: 12,
  armGap: 2,
  handDrop: 0.21,
  faceShift: 14,
  lean: -2,
  shoulderAsym: -3,
  shoulderDrop: 3,
  torsoSkew: -1,
  hipSkew: -1,
  farArmTuck: 5,
  strideX: 8,
  footStagger: 2,
  footToe: 17,
  footSplay: 0,
  stoop: 2,
  hairX: 2,
  hairY: -4,
  hairVol: 3,
  fringe: 14,
  hatX: 4,
  hatY: 3,
  eyeDx: -2,
  eyeDy: -6,
  eyeGap: 0,
  eyeSize: 0,
  eyeWhites: 1,
  jawShade: 5,
  blush: 3,
  blushSize: 1,
  cheekShade: 2,
  browDy: 1,
  mouthDy: 0,
  earDy: -8,
  outline: 3,
  inkSoft: 3,
  rim: 5,
  contactShade: 12,
  lightDir: 1,
  lightStrength: 2,
  shadeContrast: 2,
  textureAmt: 2,
  foldStrength: 3,
  foldCount: 2,
  drapeSway: 2,
  clothWeight: 3,
  hemBreak: 2,
  hemLine: 1,
  eyeSlant: 0,
  browLen: 3,
  browThick: 1,
  mouthW: 0,
  noseLen: 0,
  lipFull: 0,
  earSize: 2,
};

const STORAGE_KEY = 'hpg-sprite-tuning-v2';
const LEGACY_KEY = 'hpg-sprite-tuning-v1';

/** Tuning fields measured in pixels — these double on the v1→v2 migration. */
const PX_KEYS: ReadonlyArray<keyof SpriteTuning> = [
  'figureTop', 'headW', 'headH', 'neckH', 'neckW', 'shoulderHalf', 'waistHalf',
  'hipHalf', 'torsoLen', 'legLen', 'robeLift', 'robeHemHalf', 'legW', 'legGap',
  'shoeLen', 'shoeH', 'armW', 'armGap', 'faceShift', 'lean', 'shoulderAsym',
  'shoulderDrop', 'torsoSkew', 'hipSkew', 'farArmTuck', 'strideX',
  'footStagger', 'footToe', 'footSplay', 'stoop', 'hairX', 'hairY', 'hairVol',
  'fringe', 'hatX', 'hatY', 'eyeDx', 'eyeDy', 'eyeGap', 'eyeSize', 'eyeSlant',
  'browLen', 'browDy', 'mouthW', 'mouthDy', 'earDy',
];

let active: SpriteTuning = { ...DEFAULT_TUNING };

try {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      active = { ...DEFAULT_TUNING, ...JSON.parse(stored) };
    } else {
      // A v1 tuning was authored on the 96×176 grid: double its pixel-unit
      // values, keep fractions and level-scales, and carry on from there.
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as Partial<SpriteTuning>;
        for (const key of PX_KEYS) {
          if (typeof parsed[key] === 'number') (parsed as any)[key] = parsed[key]! * 2;
        }
        active = { ...DEFAULT_TUNING, ...parsed };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
      }
    }
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
  headRx: number;
  headRy: number;
  shoulderHalf: number;
  waistHalf: number;
  hipHalf: number;
  legW: number;
  legGap: number;
  armW: number;
  t: SpriteTuning;
}

/**
 * Per-persona variation, seeded from the spec: every figure carries its own
 * bearing, stride, and proportions as small offsets from the tuned base, so
 * a crowd stops being one body wearing forty heads. Deterministic per seed —
 * the same persona always stands the same way.
 */
function jitteredTuning(spec: PortraitSpec, base: SpriteTuning): SpriteTuning {
  const j = (tag: string, span: number) => Math.round((unit(spec.seed, `sprite-${tag}`) - 0.5) * 2 * span);
  const t = { ...base };
  // Bearing.
  t.stoop += j('stoop', 3);
  t.lean += j('lean', 2);
  t.shoulderAsym += j('shasym', 2);
  t.torsoSkew += j('tskew', 1);
  t.strideX = Math.max(0, t.strideX + j('stride', 3));
  t.footToe = Math.max(0, t.footToe + j('toe', 3));
  // Build, beyond the spec's coarse tags.
  t.headW += j('headw', 2);
  t.headH += j('headh', 3);
  t.neckW = Math.max(10, t.neckW + j('neckw', 2));
  t.shoulderHalf = Math.max(20, t.shoulderHalf + j('shoulder', 2));
  t.waistHalf = Math.max(14, t.waistHalf + j('waist', 2));
  t.legW = Math.max(10, t.legW + j('legw', 2));
  t.armW = Math.max(9, t.armW + j('armw', 1));
  t.legLen += j('leglen', 4);
  // Face placement.
  t.eyeGap += j('eyegap', 1);
  t.browDy += j('browdy', 1);
  t.mouthDy += j('mouthdy', 1);
  t.earDy += j('eardy', 2);
  t.jawShade = Math.max(0, Math.min(5, t.jawShade + j('jaw', 1)));
  return t;
}

export function buildSkeleton(spec: PortraitSpec, tuning: SpriteTuning = active): Skeleton {
  const t = jitteredTuning(spec, tuning);
  const b = spec.build;
  const wide = b === 'stocky' || b === 'heavy' || b === 'imposing' ? 4 : b === 'athletic' ? 2 : b === 'slight' ? -4 : 0;
  const tall = b === 'tall' || b === 'imposing' ? 12 : b === 'short' ? -14 : b === 'stocky' ? -6 : 0;
  const female = spec.gender === 'Female' ? -2 : 0;
  const hunch = Math.round((spec.pose?.hunch ?? 0) * 6) + (spec.age >= 62 ? 4 : 0);

  // Lean is applied as a shear over the finished raster (drawSprite), so the
  // skeleton itself stands plumb.
  const cx = 92;
  // A stoop drops the head into the shoulders as well as carrying it forward;
  // the shoulder line itself stays put, so the neck visibly shortens.
  const stoopDrop = Math.max(0, Math.round(t.stoop * 0.3));
  const crownBase = t.figureTop + hunch;
  const crownY = crownBase + stoopDrop;
  const headRy = Math.round(t.headH / 2);
  const headRx = Math.round(t.headW / 2) + (b === 'heavy' ? 2 : 0);
  const chinY = crownY + t.headH;
  // The head seats *into* the shoulders: the chin overlaps the collar line
  // by a couple of rows instead of floating above a visible column of neck.
  const shoulderY = crownBase + t.headH + t.neckH - 2;
  const waistY = shoulderY + t.torsoLen;
  const hipY = waistY + 20;
  const legLen = t.legLen + tall;
  const floorY = Math.min(SPRITE_H - 4, hipY + legLen);
  const ankleY = floorY - t.shoeH;

  return {
    cx,
    headCx: cx + t.stoop,
    faceCx: cx + t.stoop + t.faceShift,
    stoopTopSkew: Math.round(t.stoop * 0.45),
    crownY,
    eyeY: crownY + headRy + 6,
    chinY,
    neckTopY: chinY - 6,
    shoulderY,
    chestY: shoulderY + Math.round(t.torsoLen * 0.32),
    waistY,
    hipY,
    kneeY: hipY + Math.round((ankleY - hipY) * 0.52),
    ankleY,
    floorY,
    handY: hipY + Math.round((ankleY - hipY) * t.handDrop),
    headRx,
    headRy,
    shoulderHalf: t.shoulderHalf + wide + female,
    waistHalf: t.waistHalf + wide + female,
    hipHalf: t.hipHalf + wide,
    legW: t.legW,
    legGap: t.legGap,
    armW: t.armW + (b === 'heavy' || b === 'imposing' ? 2 : 0),
    t,
  };
}
