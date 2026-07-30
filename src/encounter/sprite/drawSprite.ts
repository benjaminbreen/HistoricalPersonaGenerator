/**
 * encounter/sprite/drawSprite.ts
 *
 * Part-based sprite assembly on the tunable skeleton (skeleton.ts). The
 * mockup's lesson, learned the hard way: dimensionality comes from *parts* —
 * a sleeve is its own lit cylinder, separated from the coat by a seam and a
 * sliver of daylight; trousers are two legs, not a gap in a slab; shoes are
 * drawings with toes. Each part shades itself under one left-hand light and
 * the assembly order handles occlusion. Iterate with `npm run sprite-sheet`,
 * tune live with Shift+1 in the app.
 */

import {
  applyContactShadow, fillMask, makeMask, Mask,
  maskEllipse, maskRect, maskSubtract, maskUnion, MAT, Raster,
  cylinderShaderX, ellipsoidShader,
} from '../../components/portraitLab/core/raster';
import { buildPortraitRamps, PortraitRamps } from '../../components/portraitLab/art/palette';
import { Ramp } from '../../components/portraitLab/core/color';
import { makeRng, unit } from '../../components/portraitLab/core/rng';
import { CONICAL_HAT_PATTERN, PortraitSpec } from '../../components/portraitLab/spec/types';
import { FootwearKind, SpriteExtras, SpriteSource } from './spriteSource';
import {
  drawEarSprite, drawFacialHairSprite, drawHandSprite,
  drawSkinZonesSprite, formLight, groundBounce, headMask, materialTexture,
} from './spriteArt';
// The face borrows the portrait renderer's authored systems wholesale — the
// stamps are the same scale as this head, and they carry everything the
// sprite's hand-rolled features lacked: brow shapes in the hair's own color,
// thirteen expressions, lashes, wall-eyes, cataracts, dental work.
import { drawEye, EyeState, makeEyePaints } from '../../components/portraitLab/art/eyes';
import { drawBrow, drawGlabellaLines } from '../../components/portraitLab/art/brows';
import { drawNasolabialFold, drawNose, makeSkinPaints } from '../../components/portraitLab/art/noses';
import { drawMouth, makeMouthPaints } from '../../components/portraitLab/art/mouths';
// The hair borrows the portrait's entire engine — silhouettes arranged per
// style, texture-driven edges, the sheen band, knots seated behind the
// skull, segmented braids — through a thin anatomy adapter built from the
// sprite skeleton. Mask stride equals SPRITE_W, so portrait masks index
// straight into the sprite raster.
import {
  clipHairUnderCovering, computeHairMasks, drawHairBack, drawHairFront,
  drawHairOverShoulder, HairMasks,
} from '../../components/portraitLab/art/hair';
import { RenderContext } from '../../components/portraitLab/render/context';
import { Anatomy } from '../../components/portraitLab/spec/anatomy';
import { poseForExpression } from '../../components/portraitLab/render/pipeline';
import { restingExpression } from '../../components/portraitLab/spec/buildSpec';
import { buildSkeleton, getTuning, Skeleton, SPRITE_H, SPRITE_W } from './skeleton';

export { SPRITE_H, SPRITE_W };
/**
 * Every animation frame is a point in pose space: a face state, a gaze,
 * a breath phase, a bend at the waist, and what the far arm is doing.
 * Frames compile lazily and cache, so an idle figure costs four rasters
 * and a bow only pays for itself when someone bows.
 */
export type FrameId =
  | 'stand' | 'standBreathe' | 'blink' | 'talk' | 'glance'
  | 'bowLight' | 'bowDeep' | 'reach' | 'raise' | 'offer' | 'fallen';

export interface FramePose {
  face: 'open' | 'blink' | 'talk';
  gazeX: number;
  breathe: boolean;
  /** Forward bend at the waist, in px of crown travel. */
  bend: number;
  farArm: 'rest' | 'forward' | 'up' | 'offer';
}

const FRAME_POSES: Record<Exclude<FrameId, 'fallen'>, FramePose> = {
  stand: { face: 'open', gazeX: 0, breathe: false, bend: 0, farArm: 'rest' },
  standBreathe: { face: 'open', gazeX: 0, breathe: true, bend: 0, farArm: 'rest' },
  blink: { face: 'blink', gazeX: 0, breathe: false, bend: 0, farArm: 'rest' },
  talk: { face: 'talk', gazeX: 0, breathe: false, bend: 0, farArm: 'rest' },
  glance: { face: 'open', gazeX: 2, breathe: false, bend: 0, farArm: 'rest' },
  bowLight: { face: 'open', gazeX: 0, breathe: false, bend: 14, farArm: 'rest' },
  // A deep bow closes the eyes — respect, drawn in one pixel row.
  bowDeep: { face: 'blink', gazeX: 0, breathe: false, bend: 32, farArm: 'rest' },
  reach: { face: 'open', gazeX: 0, breathe: false, bend: 0, farArm: 'forward' },
  raise: { face: 'open', gazeX: 0, breathe: false, bend: 4, farArm: 'up' },
  offer: { face: 'talk', gazeX: 1, breathe: false, bend: 0, farArm: 'offer' },
};

/** Adapter for the head/hair/headwear drawing, which predates the skeleton. */
interface Fig {
  cx: number;
  headRx: number;
  headRy: number;
  headCy: number;
  chinY: number;
  shoulderY: number;
  waistY: number;
  ankleY: number;
  footY: number;
  hipY: number;
  hairDx: number;
  hairDy: number;
  hairVol: number;
  fringe: number;
  hatDx: number;
  hatDy: number;
  /** Fringe shadow never reaches below this row — the eyes stay lit. */
  eyeStopY: number;
}

function figOf(s: Skeleton): Fig {
  return {
    cx: s.headCx,
    headRx: s.headRx,
    headRy: s.headRy,
    headCy: s.crownY + s.headRy + s.t.hairY * 0,
    chinY: s.chinY,
    shoulderY: s.shoulderY,
    waistY: s.waistY,
    ankleY: s.ankleY,
    footY: s.floorY,
    hipY: s.hipY,
    hairDx: s.t.hairX,
    hairDy: s.t.hairY,
    hairVol: s.t.hairVol,
    fringe: s.t.fringe,
    hatDx: s.t.hatX,
    hatDy: s.t.hatY,
    eyeStopY: s.eyeY + s.t.eyeDy - 4,
  };
}

function erase(raster: Raster, x: number, y: number) {
  if (!raster.inside(x, y)) return;
  const i = y * SPRITE_W + x;
  raster.data[i * 4 + 3] = 0;
  raster.mat[i] = MAT.EMPTY;
  raster.shade[i] = 255;
}

const CLOTH = new Set<number>([MAT.CLOTH_A, MAT.CLOTH_B, MAT.CLOTH_C]);
const isCloth = (raster: Raster, x: number, y: number) => CLOTH.has(raster.matAt(x, y));

// ---------------------------------------------------------------------------
// Hair: the portrait engine, adapted.
// ---------------------------------------------------------------------------

/**
 * The bridge: a portrait RenderContext whose anatomy is the sprite skeleton.
 * The portrait hair engine reads about a dozen anatomy fields; every one has
 * a direct skeletal equivalent, and because the hair masks' stride equals
 * SPRITE_W they paint into the sprite raster without any remapping.
 */
function spriteHairContext(raster: Raster, spec: PortraitSpec, ramps: PortraitRamps, s: Skeleton): RenderContext {
  const t = s.t;
  const profile = ([
    [0, 0.34], [0.07, 0.66], [0.18, 0.9], [0.32, 1.0],
    [0.52, 0.97], [0.66, 0.89], [0.8, 0.7], [0.92, 0.5], [1, 0.26],
  ] as Array<[number, number]>).map(([tt, w]) => [tt, w * s.headRx] as [number, number]);
  const anatomy = {
    size: SPRITE_W,
    viewHeight: SPRITE_H,
    centerX: s.headCx + t.hairX,
    faceX: s.faceCx,
    headTop: s.crownY + t.hairY,
    chinY: s.chinY,
    headHeight: s.chinY - s.crownY,
    headHalfWidth: s.headRx,
    headProfile: profile,
    crown: 0.5,
    craniumRise: 0,
    browY: s.eyeY + t.eyeDy - 6 + t.browDy,
    eyeY: s.eyeY + t.eyeDy,
    eyeDX: 8,
    eyeHalfWidth: 4,
    cheekY: s.eyeY + t.eyeDy + 10,
    mouthY: s.eyeY + t.eyeDy + 16 + t.mouthDy,
    earTopY: s.eyeY + t.earDy,
    earBottomY: s.eyeY + t.earDy + 9,
    neckHalf: Math.floor(t.neckW / 2) + 1,
  } as unknown as Anatomy;
  return {
    raster, spec, anatomy, ramps,
    book: ramps.book, skin: makeSkinPaints(), seed: spec.seed,
  };
}

/**
 * The portrait's knot placement assumes a bust frame with nine pixels of
 * headroom; the sprite has a whole canvas above the crown, so buns and updos
 * come back floating. Settle them: whatever stands more than a bun's worth
 * above the crown slides down until it touches.
 */
function settleKnots(masks: HairMasks, headTop: number) {
  let minY = Infinity;
  for (let i = 0; i < masks.knots.length; i += 1) {
    if (masks.knots[i]) minY = Math.min(minY, Math.floor(i / SPRITE_W));
  }
  if (!isFinite(minY)) return;
  const shift = headTop - 12 - minY;
  if (shift <= 0) return;
  for (const layer of [masks.back, masks.front, masks.knots]) {
    const moved: number[] = [];
    for (let i = 0; i < layer.length; i += 1) {
      if (!masks.knots[i] || !layer[i]) continue;
      if (layer !== masks.knots) layer[i] = 0;
      moved.push(i + shift * SPRITE_W);
    }
    if (layer === masks.knots) layer.fill(0);
    for (const i of moved) if (i < layer.length) layer[i] = 1;
  }
}

/** Braids fall to the portrait frame's floor — cap them at the sprite's hip. */
function capBraids(masks: HairMasks, maxY: number) {
  const cut = maxY * SPRITE_W;
  for (const layer of [masks.braids, masks.overShoulder]) {
    for (let i = cut; i < layer.length; i += 1) {
      if (masks.braids[i]) layer[i] = 0;
    }
  }
}

/**
 * The headwear's crown as a mask, so hair clips under it instead of
 * sprouting through it — the same shapes drawHeadwear will draw, minus the
 * detail. Open ornaments (coronet, band) hide nothing.
 */
function headwearCovering(spec: PortraitSpec, fig: Fig): Mask | null {
  const hw = spec.headwear;
  if (!hw || hw.kind === 'none' || hw.kind === 'coronet' || hw.kind === 'band') return null;
  const hcx = fig.cx + fig.hatDx - 2;
  const headCy = fig.headCy + fig.hatDy;
  const top = headCy - fig.headRy;
  switch (hw.kind) {
    case 'cap':
      return maskEllipse(SPRITE_W, SPRITE_H, hcx, headCy - 8, fig.headRx + 2, fig.headRy - 4);
    case 'brimmed_hat': {
      if (CONICAL_HAT_PATTERN.test(`${hw.name} ${hw.material}`.toLowerCase())) {
        const m = makeMask(SPRITE_W, SPRITE_H);
        for (let row = 0; row < 18; row += 1) {
          const half = 4 + Math.round(row * 2.2);
          for (let x = hcx - half; x <= hcx + half; x += 1) {
            const y = top - 14 + row;
            if (y >= 0 && x >= 0 && x < SPRITE_W) m[y * SPRITE_W + x] = 1;
          }
        }
        return m;
      }
      const crown = maskEllipse(SPRITE_W, SPRITE_H, hcx, top + 6, fig.headRx - 2, 12);
      const brim = maskRect(SPRITE_W, SPRITE_H, hcx - fig.headRx - 10, top + 8, (fig.headRx + 10) * 2 + 1, 4);
      return maskUnion(crown, brim);
    }
    case 'wrapped_cloth':
      return maskEllipse(SPRITE_W, SPRITE_H, hcx, headCy - 8, fig.headRx + 4, fig.headRy - 2);
    case 'veil':
      return maskEllipse(SPRITE_W, SPRITE_H, hcx, headCy - 2, fig.headRx + 8, fig.headRy + 6);
    case 'hood':
      return maskEllipse(SPRITE_W, SPRITE_H, hcx, headCy - 2, fig.headRx + 8, fig.headRy + 8);
    case 'helmet':
      return maskEllipse(SPRITE_W, SPRITE_H, hcx, headCy - 6, fig.headRx + 2, fig.headRy - 2);
    default:
      return null;
  }
}

function drawHeadwear(raster: Raster, spec: PortraitSpec, ramps: PortraitRamps, fig: Fig) {
  const hw = spec.headwear;
  if (!hw || hw.kind === 'none') return;
  const ramp = ramps.headwear;
  // Placement offsets ride on a shifted view of the head.
  const f = { ...fig, cx: fig.cx + fig.hatDx, headCy: fig.headCy + fig.hatDy };
  const top = f.headCy - f.headRy;
  const hcx = f.cx - 2;
  const shader = ellipsoidShader(hcx, top + 6, f.headRx + 4, 12, 1, { base: 3, gain: 5 });

  switch (hw.kind) {
    case 'cap': {
      const m = maskSubtract(
        maskEllipse(SPRITE_W, SPRITE_H, hcx, f.headCy - 8, f.headRx + 2, f.headRy - 4),
        maskRect(SPRITE_W, SPRITE_H, 0, f.headCy - 10, SPRITE_W, SPRITE_H)
      );
      fillMask(raster, m, ramp, MAT.HEADWEAR, shader, { dither: 0.4 });
      break;
    }
    case 'brimmed_hat': {
      const conical = CONICAL_HAT_PATTERN.test(`${hw.name} ${hw.material}`.toLowerCase());
      if (conical) {
        for (let row = 0; row < 18; row += 1) {
          const half = 4 + Math.round(row * 2.2);
          for (let x = hcx - half; x <= hcx + half; x += 1) {
            raster.set(x, top - 14 + row, ramp.steps[3 + (row > 13 ? 1 : 0)], MAT.HEADWEAR, 3);
          }
        }
      } else {
        const crown = maskSubtract(
          maskEllipse(SPRITE_W, SPRITE_H, hcx, top + 6, f.headRx - 2, 12),
          maskRect(SPRITE_W, SPRITE_H, 0, top + 8, SPRITE_W, SPRITE_H)
        );
        fillMask(raster, crown, ramp, MAT.HEADWEAR, shader, { dither: 0.3 });
        for (let x = hcx - f.headRx - 10; x <= hcx + f.headRx + 10; x += 1) {
          raster.set(x, top + 8, ramp.steps[4], MAT.HEADWEAR, 4);
          raster.set(x, top + 9, ramp.steps[4], MAT.HEADWEAR, 4);
          raster.set(x, top + 10, ramp.steps[5], MAT.HEADWEAR, 5);
          raster.set(x, top + 11, ramp.steps[5], MAT.HEADWEAR, 5);
        }
      }
      break;
    }
    case 'wrapped_cloth': {
      const m = maskSubtract(
        maskEllipse(SPRITE_W, SPRITE_H, hcx, f.headCy - 8, f.headRx + 4, f.headRy - 2),
        maskRect(SPRITE_W, SPRITE_H, 0, f.headCy - 6, SPRITE_W, SPRITE_H)
      );
      fillMask(raster, m, ramp, MAT.HEADWEAR, shader, { dither: 0.3 });
      // The winding: paired lighter courses across the wrap.
      for (let x = hcx - f.headRx - 2; x <= hcx + f.headRx + 2; x += 4) {
        raster.set(x, f.headCy - 14, ramp.steps[2], MAT.HEADWEAR, 2);
        raster.set(x + 1, f.headCy - 14, ramp.steps[2], MAT.HEADWEAR, 2);
      }
      break;
    }
    case 'veil': {
      // Crown, face frame, shoulder drape with fold lines — the reference
      // woman's scarf, drawn part by part.
      const crown = maskSubtract(
        maskEllipse(SPRITE_W, SPRITE_H, hcx, f.headCy - 2, f.headRx + 8, f.headRy + 6),
        maskEllipse(SPRITE_W, SPRITE_H, hcx + 4, f.headCy + 2, f.headRx - 4, f.headRy - 6)
      );
      const fall = makeMask(SPRITE_W, SPRITE_H);
      for (let y = f.headCy; y <= f.shoulderY + 24; y += 1) {
        const tt = (y - f.headCy) / Math.max(1, f.shoulderY + 24 - f.headCy);
        const half = Math.round(f.headRx + 8 + tt * 8);
        for (let x = hcx - half; x <= hcx + half; x += 1) fall[y * SPRITE_W + x] = 1;
      }
      let m = maskUnion(crown, fall);
      m = maskSubtract(m, maskEllipse(SPRITE_W, SPRITE_H, hcx + 4, f.headCy + 2, f.headRx - 4, f.headRy - 4));
      m = maskSubtract(m, maskRect(SPRITE_W, SPRITE_H, f.cx - 10, f.shoulderY + 14, 24, 16));
      fillMask(raster, m, ramp, MAT.HEADWEAR, shader, { dither: 0.45 });
      // Fold lines where the cloth turns at the shoulders.
      for (const [dx, len] of [[-f.headRx - 2, 18], [f.headRx, 14], [-6, 12]] as const) {
        for (let i = 0; i < len; i += 1) {
          const x = hcx + dx + (i > 8 ? 1 : 0) + (i > 14 ? 1 : 0);
          const y = f.headCy + f.headRy - 4 + i;
          if (raster.matAt(x, y) === MAT.HEADWEAR) {
            raster.shift(x, y, 1, ramps.book);
            if (raster.matAt(x + 1, y) === MAT.HEADWEAR) raster.shift(x + 1, y, 1, ramps.book);
          }
        }
      }
      break;
    }
    case 'hood': {
      const m = maskSubtract(
        maskEllipse(SPRITE_W, SPRITE_H, hcx, f.headCy - 2, f.headRx + 8, f.headRy + 8),
        maskEllipse(SPRITE_W, SPRITE_H, hcx + 4, f.headCy + 2, f.headRx - 4, f.headRy - 4)
      );
      fillMask(raster, m, ramp, MAT.HEADWEAR, shader, { dither: 0.4 });
      break;
    }
    case 'helmet': {
      const m = maskSubtract(
        maskEllipse(SPRITE_W, SPRITE_H, hcx, f.headCy - 6, f.headRx + 2, f.headRy - 2),
        maskRect(SPRITE_W, SPRITE_H, 0, f.headCy - 2, SPRITE_W, SPRITE_H)
      );
      fillMask(raster, m, ramps.metal, MAT.METAL, shader, { dither: 0.2 });
      break;
    }
    case 'coronet': {
      for (let x = hcx - f.headRx + 4; x <= hcx + f.headRx - 4; x += 1) {
        raster.set(x, top + 8, ramps.metal.steps[2], MAT.METAL, 2);
        raster.set(x, top + 9, ramps.metal.steps[3], MAT.METAL, 3);
      }
      raster.set(f.cx + 2, top + 6, ramps.gem.steps[2], MAT.GEM, 2);
      raster.set(f.cx + 3, top + 7, ramps.gem.steps[3], MAT.GEM, 3);
      break;
    }
    case 'band': {
      for (let x = hcx - f.headRx + 4; x <= hcx + f.headRx - 4; x += 1) {
        raster.set(x, top + 10, ramp.steps[3], MAT.HEADWEAR, 3);
        raster.set(x, top + 11, ramp.steps[4], MAT.HEADWEAR, 4);
      }
      break;
    }
  }

  // The dome catches the key light: the topmost covered pixels on the lit
  // side get one bright step — the reference hats' crown highlight.
  for (let x = hcx - f.headRx - 12; x <= hcx + 4; x += 1) {
    for (let y = Math.max(0, top - 20); y <= f.headCy; y += 1) {
      const m = raster.matAt(x, y);
      if (m === MAT.HEADWEAR || m === MAT.METAL) {
        raster.shift(x, y, -1, ramps.book);
        if (raster.matAt(x, y + 1) === m) raster.shift(x, y + 1, -1, ramps.book);
        if (raster.matAt(x, y + 2) === m) raster.shift(x, y + 2, -1, ramps.book);
        break;
      }
      if (m !== MAT.EMPTY && m !== MAT.HAIR) break;
    }
  }

  // Under the brim, the forehead falls into shadow; inside the crown, a
  // crease where the felt folds. Both are what make a hat sit ON a head.
  for (let x = hcx - f.headRx - 4; x <= hcx + f.headRx + 4; x += 1) {
    for (let y = top - 12; y <= f.headCy + 4; y += 1) {
      const m = raster.matAt(x, y);
      const below = raster.matAt(x, y + 1);
      if ((m === MAT.HEADWEAR || m === MAT.METAL) && below === MAT.SKIN) {
        raster.shift(x, y + 1, 1, ramps.book);
        if (raster.matAt(x, y + 2) === MAT.SKIN) raster.shift(x, y + 2, 1, ramps.book);
        break;
      }
    }
  }
  if (hw.kind === 'cap' || hw.kind === 'brimmed_hat' || hw.kind === 'wrapped_cloth') {
    for (let x = hcx - 8; x <= hcx + 6; x += 1) {
      if (raster.matAt(x, top + 4) === MAT.HEADWEAR && (x % 3) !== 0) {
        raster.shift(x, top + 4, 1, ramps.book);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Face.
// ---------------------------------------------------------------------------

function drawFace(raster: Raster, spec: PortraitSpec, ramps: PortraitRamps, s: Skeleton, headM: Mask, fp: FramePose) {
  const variant = fp.face;
  const t = s.t;
  const fx = s.faceCx + t.eyeDx;
  const eyeY = s.eyeY + t.eyeDy;

  // The far ear roots on the head's *actual* silhouette at ear height —
  // the profile narrows and leans there, and an ear hung at the nominal
  // headRx floats a few pixels off the jaw. Scan inward for the first skin
  // pixel and overlap it by one column so the ear is attached.
  const earY = s.eyeY + t.earDy;
  let earEdge = s.headCx - s.headRx + 2;
  for (let x = s.headCx - s.headRx - 4; x <= s.headCx; x += 1) {
    if (raster.matAt(x, earY + 3) === MAT.SKIN) { earEdge = x; break; }
  }
  drawEarSprite(raster, ramps, earEdge + 1, earY, t.earSize);

  // ── Big-form shading FIRST, features second. One plane of shadow down
  // the side of the face away from the key light, and a soft massing in
  // the eye sockets. Every mark that follows lives on this form; without
  // it, detail reads as pen strokes scattered on paper — which is exactly
  // what the earlier faces were.
  const planeStart = fx + 9;
  for (let y = s.crownY + 2; y <= s.chinY + 2; y += 1) {
    for (let x = planeStart; x <= s.headCx + s.headRx + 8; x += 1) {
      if (headM[y * SPRITE_W + x] !== 1) continue;
      if (raster.matAt(x, y) !== MAT.SKIN) continue;
      // A dissolved edge on the plane's border, a solid step past it.
      if (x === planeStart && (x + y) % 2 === 0) continue;
      raster.shift(x, y, 1, ramps.book);
    }
  }
  for (const ex of [fx - 12, fx + 2]) {
    for (let dx = 1; dx < 8; dx += 1) {
      const sy = eyeY - 3;
      if ((dx + ex) % 3 === 0) continue;
      if (raster.matAt(ex + dx, sy) === MAT.SKIN) raster.shift(ex + dx, sy, 1, ramps.book);
    }
  }

  // One seeded asymmetry per face, the portrait's rule: most faces get
  // exactly one of a dropped eye, a leaning mouth, or a leaning nose —
  // a face with all three reads as damage, a face with none as a doll.
  const aRoll = unit(spec.seed, 'sprite-asym');
  const eyeDrop: [number, number] = aRoll < 0.28
    ? (unit(spec.seed, 'sprite-asym-e') < 0.5 ? [1, 0] : [0, 1])
    : [0, 0];
  const mouthLean = aRoll >= 0.28 && aRoll < 0.5 ? (unit(spec.seed, 'sprite-asym-m') < 0.5 ? -1 : 1) : 0;
  const noseLean = aRoll >= 0.5 && aRoll < 0.68 ? (unit(spec.seed, 'sprite-asym-n') < 0.5 ? -1 : 1) : 0;

  // The resting expression is the persona's own — mood and condition pick
  // it, and its pose moves brows, lids, and mouth together.
  const expression = restingExpression(spec.mood, spec.condition);
  const pose = poseForExpression(expression);
  const eyePaints = makeEyePaints(ramps);
  const mouthPaints = makeMouthPaints(ramps);
  const skinPaints = makeSkinPaints();
  const eyeDX = 8 + t.eyeGap;

  // Brows: the portrait's stroke system — shaped, hair-colored, thinning
  // and shedding strays with age. The slider bumps the spec's thickness.
  const THICKNESS_ORDER = ['thin', 'medium', 'thick', 'bushy'] as const;
  const thickIdx = Math.max(0, THICKNESS_ORDER.indexOf(spec.browThickness as typeof THICKNESS_ORDER[number]));
  const browThickness = THICKNESS_ORDER[Math.min(3, thickIdx + t.browThick)];
  for (const side of [-1, 1] as const) {
    drawBrow({
      raster, book: ramps.book, ramps,
      shape: spec.browShape,
      thickness: browThickness,
      centerX: fx + side * eyeDX,
      baseY: eyeY - 6 + t.browDy + Math.round(pose.browLift - (side === 1 ? pose.browAsymmetry : 0)),
      side,
      length: Math.max(6, Math.round(eyeDX * 1.18) + t.browLen),
      seed: spec.seed ^ (side === -1 ? 0x11 : 0x22),
      innerTilt: pose.innerTilt,
      ageLines: spec.ageLines,
    });
  }
  drawGlabellaLines(raster, ramps.book, fx, eyeY - 8 + t.browDy, pose.glabella + spec.ageLines * 0.3);

  // Eyes: authored lids with the iris painted only over sclera, so the lid
  // crops it the way a real lid does. Wall-eyes, cataracts, lashes, and
  // age-droop all come along from the spec.
  const eyeState: EyeState = variant === 'blink' ? 'closed' : pose.eyes;
  for (const side of [-1, 1] as const) {
    const wall = spec.traits.wallEye === side ? side * 2 : 0;
    drawEye({
      raster, book: ramps.book, paints: eyePaints,
      shape: spec.eyeShape, state: eyeState,
      centerX: fx + side * eyeDX,
      centerY: eyeY + eyeDrop[side === -1 ? 0 : 1],
      side, gazeX: wall + fp.gazeX, gazeY: 0,
      eyelashes: spec.eyelashes,
      clouded: spec.traits.blind,
      dilation: pose.dilation,
      droop: spec.lidDroop,
    });
  }
  // The whites slider rides on top of the authored eye: 0 sinks the sclera
  // toward the calm dark marks of the reference, 4 lifts it bright.
  if (t.eyeWhites !== 2 && eyeState !== 'closed') {
    const delta = t.eyeWhites <= 0 ? 2 : t.eyeWhites === 1 ? 1 : t.eyeWhites === 3 ? -1 : -2;
    for (let y = eyeY - 4; y <= eyeY + 4; y += 1) {
      for (let x = fx - eyeDX - 6; x <= fx + eyeDX + 6; x += 1) {
        if (raster.matAt(x, y) === MAT.SCLERA) raster.shift(x, y, delta, ramps.book);
      }
    }
  }

  // The nose: authored per-shape stamps in relative paints, with the age
  // droop built in; the slider slides the whole construction down.
  const noseBaseY = eyeY + 11 + t.noseLen;
  drawNose({
    raster, book: ramps.book, paints: skinPaints,
    shape: spec.noseShape, centerX: fx + noseLean, baseY: noseBaseY,
    ageLines: spec.ageLines,
  });
  if (spec.ageLines > 0.4) {
    for (const side of [-1, 1] as const) {
      drawNasolabialFold(raster, ramps.book, fx, noseBaseY - 2, side, spec.ageLines);
    }
  }

  // Blush: a soft patch per cheek. Strength sets the tint, size grows the
  // patch from a fleck to a wash, and the edges always blend lighter than
  // the core so it never reads as a painted square. The mark budget: an
  // old face spends its marks on age, not color — blush yields to wrinkles.
  if (t.blush > 0 && spec.ageLines <= 0.6) {
    const alpha = Math.min(0.45, 0.14 * t.blush);
    const w = 2 + Math.max(0, Math.round(t.blushSize)) * 2;
    const h = t.blushSize >= 2 ? 3 : 2;
    for (const [bx0, by0] of [[fx - 10 - Math.floor(w / 2), eyeY + 6], [fx + 6, eyeY + 8]] as const) {
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) {
          const bx = bx0 + dx;
          const by = by0 + dy;
          if (raster.matAt(bx, by) !== MAT.SKIN) continue;
          const edge = dx === 0 || dx === w - 1 || dy === 0 || dy === h - 1;
          raster.blend(bx, by, ramps.skinWarm.steps[3], alpha * (edge ? 0.55 : 1), MAT.SKIN, raster.shadeAt(bx, by));
        }
      }
    }
  }

  // Facial hair goes on before the mouth: drawMouth paints only over skin,
  // lip, and teeth, so the moustache overhangs the upper lip for free —
  // even when the mouth is open mid-word.
  const mouthY = eyeY + 16 + t.mouthDy;
  if (spec.facialHair) {
    drawFacialHairSprite(raster, ramps, spec, {
      skullCx: s.headCx, faceCx: fx, mouthY,
      chinY: s.chinY, cheekY: eyeY + 10, earTopY: s.eyeY + t.earDy,
      headRx: s.headRx, headH: s.chinY - s.crownY,
      head: headM,
    });
  }

  // The mouth: four authored bases bent by expression — smiles lift the
  // corners, smirks lift one, age thins the vermillion, lost teeth sink
  // the whole area, and worked teeth part the lips to be seen.
  drawMouth({
    raster, book: ramps.book, paints: mouthPaints,
    expression: variant === 'talk' ? 'surprise' : expression,
    lipShape: spec.lipShape,
    centerX: fx + mouthLean, y: mouthY,
    ageThinning: spec.ageLines,
    toothless: spec.traits.toothless,
    dental: spec.dental,
  });

  // The cheek's plane change: a soft two-pixel contour from the near eye
  // toward the jaw, scaled by its slider; past 1 the far cheekbone hollows.
  // Budgeted: an aged face already carved its planes with wrinkles.
  const cheekLevel = spec.ageLines > 0.6 ? Math.min(1, t.cheekShade) : t.cheekShade;
  if (cheekLevel > 0) {
    for (const [cx0, cy0] of [[fx + 8, eyeY + 10], [fx + 9, eyeY + 12], [fx + 10, eyeY + 13], [fx + 8, eyeY + 16], [fx + 9, eyeY + 17]] as const) {
      if (raster.matAt(cx0, cy0) === MAT.SKIN) raster.shift(cx0, cy0, 1, ramps.book);
    }
    if (cheekLevel >= 2) {
      for (const [cx0, cy0] of [[fx + 10, eyeY + 14], [fx - 12, eyeY + 10], [fx - 12, eyeY + 11], [fx - 13, eyeY + 12]] as const) {
        if (raster.matAt(cx0, cy0) === MAT.SKIN) raster.shift(cx0, cy0, 1, ramps.book);
      }
    }
    if (cheekLevel >= 3) {
      for (const [cx0, cy0] of [[fx + 8, eyeY + 12], [fx + 9, eyeY + 13], [fx - 12, eyeY + 13], [fx - 11, eyeY + 14]] as const) {
        if (raster.matAt(cx0, cy0) === MAT.SKIN) raster.shift(cx0, cy0, 1, ramps.book);
      }
    }
  }

  // Age, drawn where age actually lives — the nasolabial folds came from
  // the portrait above; the rest is the sprite's own. Every stroke is a
  // hue-safe shift so it can never fight the skin tone.
  const carve = (x: number, y: number, by = 1) => {
    if (raster.matAt(x, y) === MAT.SKIN) raster.shift(x, y, by, ramps.book);
  };
  if (spec.ageLines > 0.55) {
    // Crow's feet at the outer corners.
    for (const side of [-1, 1] as const) {
      const outerX = fx + side * (eyeDX + 5);
      carve(outerX, eyeY + 1); carve(outerX + side, eyeY); carve(outerX + side, eyeY + 2);
    }
  }
  if (spec.ageLines > 0.62) {
    // Under-eye shadows.
    for (const side of [-1, 1] as const) {
      for (let i = -2; i <= 2; i += 1) carve(fx + side * eyeDX + i, eyeY + 4);
    }
  }
  if (spec.ageLines > 0.7) {
    // Forehead lines: broken, never ruled.
    for (let x = fx - 10; x <= fx + 10; x += 1) {
      if ((x + spec.seed) % 3 === 0) continue;
      carve(x, eyeY - 12);
      if (spec.ageLines > 0.85 && (x + spec.seed) % 4 !== 0) carve(x, eyeY - 15);
    }
  }
  if (spec.traits?.gaunt) {
    for (const [gx, gy] of [[fx - 10, eyeY + 8], [fx - 10, eyeY + 9], [fx - 9, eyeY + 10], [fx + 8, eyeY + 11], [fx + 8, eyeY + 12]] as const) {
      carve(gx, gy);
    }
  }

  // Jaw shading lives at the corners, never as a band across the chin —
  // a band reads as a beard. The spec's jawline shapes where it falls: a
  // square jaw shades low and wide, a soft one curves up sooner. Strength
  // deepens the tone AND extends its reach along the jaw.
  if (!spec.facialHair && t.jawShade > 0) {
    const square = spec.jawline === 'square' || spec.jawline === 'sharp';
    const reach = Math.min(square ? 8 : 6, 2 * (1 + Math.ceil(t.jawShade / 2)));
    const depth = t.jawShade >= 4 ? 2 : 1;
    for (let i = 0; i < reach; i += 1) {
      const lift = square ? 0 : Math.floor(i / 3);
      carve(fx - 8 + i, s.chinY - 2 - lift, depth);
      carve(fx + 6 - i, s.chinY - 2 - lift, depth);
    }
    if (t.jawShade >= 2) { carve(fx, s.chinY); carve(fx + 1, s.chinY); }
    if (t.jawShade >= 3) {
      // The chin's own cast on the jaw underside.
      for (const dx of [-2, -1, 2] as const) carve(fx + dx, s.chinY);
      carve(fx - 1, s.chinY - 1); carve(fx + 2, s.chinY - 1);
    }
  }

  for (const mark of spec.markings) {
    if (!/face|cheek|forehead|brow|chin|eye/i.test(mark.location)) continue;
    const mx = fx + (unit(spec.seed, `mark-${mark.type}`) > 0.5 ? 6 : -12);
    if (mark.type === 'scar' || mark.type === 'scarification') {
      // A healed line: dark stroke with a lit edge beside it.
      for (let i = 0; i < 4; i += 1) {
        raster.set(mx + Math.floor(i / 2), eyeY + 5 + i, ramps.skin.steps[6], MAT.SKIN, 6);
        if (raster.matAt(mx + Math.floor(i / 2) + 1, eyeY + 5 + i) === MAT.SKIN) {
          raster.set(mx + Math.floor(i / 2) + 1, eyeY + 5 + i, ramps.skin.steps[2], MAT.SKIN, 2);
        }
      }
    } else if (mark.type === 'tattoo' || mark.type === 'paint' || mark.type === 'henna') {
      const ink = ramps.book[MAT.PAINT]?.steps[3] ?? ramps.skin.steps[6];
      for (const [dx, dy] of [[0, 4], [1, 4], [0, 8], [1, 8], [0, 5], [0, 9]] as const) {
        raster.set(mx + dx, eyeY + dy, ink, MAT.PAINT, 3);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Body parts. One left-hand light for everything.
// ---------------------------------------------------------------------------

interface GarmentPlan {
  kind: PortraitSpec['garment']['kind'];
  hemY: number;
  hemHalf: number;
  belted: boolean;
  sleeveEnd: number;
  bell: boolean;
  clasped: boolean;
}

function planGarment(spec: PortraitSpec, s: Skeleton): GarmentPlan {
  const kind = spec.garment.kind;
  const legSpan = s.ankleY - s.hipY;
  const robe = kind === 'robe' || kind === 'gown';
  const hemY = robe
    ? s.floorY - s.t.robeLift
    : kind === 'tunic' || kind === 'jacket' || kind === 'doublet' || kind === 'work_shirt'
      ? s.hipY + Math.round(legSpan * s.t.tunicHem)
      : kind === 'wrapped_garment'
        ? s.hipY + Math.round(legSpan * (s.t.tunicHem + 0.18))
        : s.hipY + 8;
  return {
    kind,
    hemY,
    hemHalf: robe ? s.t.robeHemHalf : s.hipHalf + 8,
    belted: kind === 'tunic' || kind === 'jacket' || kind === 'doublet' || kind === 'work_shirt',
    // The sleeve ends where the hand begins — handDrop moves both together.
    sleeveEnd: kind === 'bare' ? 0 : Math.max(s.waistY + 8, s.handY - 6),
    bell: robe,
    // Some personas rest with their hands clasped at the waist — the
    // mockup woman's composed stance. Seeded, so a persona always holds
    // the same bearing.
    clasped: kind !== 'bare' && unit(spec.seed, 'rest-clasp') < 0.28,
  };
}

function drawLegs(raster: Raster, ramps: PortraitRamps, s: Skeleton, extras: SpriteExtras) {
  const ramp = extras.hasLegwear ? ramps.clothC : ramps.skin;
  const mat = extras.hasLegwear ? MAT.CLOTH_C : MAT.SKIN;
  const t = s.t;
  // Facing-side leg first (it steps ahead but sits behind in depth, raised
  // by the stagger); the near leg — viewer-left — is drawn over it.
  for (const side of [1, -1] as const) {
    const near = side === -1;
    const legCx = s.cx + t.hipSkew + side * (Math.floor(s.legW / 2) + s.legGap)
      + (near ? -2 : Math.round(t.strideX));
    const ankle = near ? s.ankleY : s.ankleY - t.footStagger;
    const m = makeMask(SPRITE_W, SPRITE_H);
    for (let y = s.hipY; y <= ankle + 2; y += 1) {
      const tt = (y - s.hipY) / Math.max(1, ankle - s.hipY);
      const half = tt < 0.45 ? s.legW / 2 : tt < 0.6 ? s.legW / 2 - 1 : tt < 0.85 ? s.legW / 2 : s.legW / 2 - 2;
      for (let x = Math.round(legCx - half); x <= Math.round(legCx + half); x += 1) {
        m[y * SPRITE_W + x] = 1;
      }
    }
    fillMask(raster, m, ramp, mat, cylinderShaderX(legCx, s.legW / 2 + 1), { dither: 0.2 });
    if (!near) {
      // The far leg lives in the near leg's shadow.
      for (let y = s.hipY; y <= ankle + 2; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.shift(x, y, 1, ramps.book);
        }
      }
    }
    // The knee: a soft plane-change patch, not a dot.
    for (const [kx, ky] of [[legCx, s.kneeY], [legCx + 1, s.kneeY], [legCx + 2, s.kneeY], [legCx + 1, s.kneeY + 1], [legCx + 2, s.kneeY + 1]] as const) {
      raster.shift(kx, ky, 1, ramps.book);
    }
    // The ankle narrows into its own shadow above the shoe.
    for (let dy = 0; dy <= 3; dy += 1) {
      for (let x = Math.round(legCx - s.legW / 2); x <= Math.round(legCx + s.legW / 2); x += 1) {
        if (m[(ankle - dy) * SPRITE_W + x]) raster.shift(x, ankle - dy, 1, ramps.book);
      }
    }
  }
}

/**
 * One foot, in whatever is actually worn on it. `dir` is which way the toe
 * points: the near foot turns outward (viewer-left) and the far foot toward
 * the facing side — the mockups' open stance, instead of two parallel feet.
 * The toe length is the "camera angle"; the far foot sits higher on the
 * ground line and in shadow.
 */
function drawFootwear(
  raster: Raster, ramps: PortraitRamps, cx: number, groundY: number,
  kind: FootwearKind, toe: number, extraW: number, shadowed: boolean,
  baseHalf: number, dir: -1 | 1
) {
  const leather = ramps.leather;
  const wood = ramps.book[MAT.WOOD] ?? ramps.leather;
  const cloth = ramps.clothC;
  const skin = ramps.skin;
  const shadow = shadowed ? 1 : 0;

  /**
   * The shared last: heel behind, toe reaching in `dir`, rounded at the tip.
   * `shadeAt` maps (row fraction, distance toward toe 0..1) to a ramp step,
   * so each construction paints its own materials over the same anatomy.
   */
  const last = (
    h: number, ramp: typeof leather, mat: number,
    shadeAt: (tt: number, toeward: number, dy: number) => number,
    opts: { blocky?: boolean; toeScale?: number } = {}
  ) => {
    for (let dy = 0; dy < h; dy += 1) {
      const y = groundY - h + 1 + dy;
      const tt = dy / Math.max(1, h - 1);
      const heel = opts.blocky ? 0 : dy < 2 ? 4 : dy < 4 ? 2 : 0;
      const toeReach = dy < 2 ? 0 : Math.round(Math.sqrt(tt) * toe * (opts.toeScale ?? 0.8));
      const tipRound = opts.blocky ? 0 : dy === h - 1 ? 2 : dy === h - 2 ? 1 : 0;
      const toeExt = baseHalf + extraW + toeReach - tipRound;
      const heelExt = baseHalf + extraW - heel;
      const x0 = cx - (dir === 1 ? heelExt : toeExt);
      const x1 = cx + (dir === 1 ? toeExt : heelExt);
      for (let x = x0; x <= x1; x += 1) {
        const toeward = dir === 1
          ? (x - x0) / Math.max(1, x1 - x0)
          : (x1 - x) / Math.max(1, x1 - x0);
        const sh = Math.max(0, Math.min(6, shadeAt(tt, toeward, dy) + shadow));
        raster.set(x, y, ramp.steps[sh], mat, sh);
      }
    }
  };

  const toeTipX = cx + dir * (baseHalf + extraW + Math.round(toe * 0.7));

  switch (kind) {
    case 'bare': {
      // A bare foot: skin over its own arch shadow, toes separated at the tip.
      last(10, skin, MAT.SKIN, (tt, toeward) =>
        tt > 0.8 ? 5 : toeward > 0.75 ? 2 : toeward < 0.25 ? 4 : 3);
      for (const [ddx, ddy] of [[0, 1], [-dir * 3, 1], [-dir * 6, 2]] as const) {
        if (raster.matAt(toeTipX + ddx, groundY - ddy) === MAT.SKIN) {
          raster.set(toeTipX + ddx, groundY - ddy, skin.steps[5], MAT.SKIN, 5);
        }
      }
      break;
    }
    case 'sandal': {
      // A dark sole, the bare foot on top of it, straps over the instep.
      last(9, skin, MAT.SKIN, (tt, toeward) =>
        toeward > 0.75 ? 2 : toeward < 0.25 ? 4 : 3);
      for (let dy = 0; dy < 2; dy += 1) {
        const y = groundY - dy;
        const soleReach = baseHalf + extraW + (dir === 1 ? Math.round(toe * 0.8) : 0);
        const soleBack = baseHalf + extraW + (dir === -1 ? Math.round(toe * 0.8) : 0);
        const sIdx = dy === 0 ? 6 : 5;
        for (let x = cx - soleBack - 1; x <= cx + soleReach; x += 1) {
          if (raster.alphaAt(x, y) !== 0) raster.set(x, y, leather.steps[sIdx], MAT.LEATHER, sIdx);
        }
      }
      // The instep strap and its ankle loop.
      for (let i = -1; i <= 1; i += 1) {
        const x = cx + dir * 2 + i;
        if (raster.matAt(x, groundY - 4) === MAT.SKIN) raster.set(x, groundY - 4, leather.steps[3], MAT.LEATHER, 3);
        if (raster.matAt(x + dir, groundY - 3) === MAT.SKIN) raster.set(x + dir, groundY - 3, leather.steps[4], MAT.LEATHER, 4);
      }
      for (let x = cx - baseHalf; x <= cx + baseHalf - 1; x += 1) {
        if (raster.matAt(x, groundY - 6) === MAT.SKIN) raster.set(x, groundY - 6, leather.steps[3], MAT.LEATHER, 3);
      }
      // Toe separations past the front strap.
      if (raster.matAt(toeTipX, groundY - 1) === MAT.SKIN) raster.set(toeTipX, groundY - 1, skin.steps[5], MAT.SKIN, 5);
      if (raster.matAt(toeTipX - dir * 3, groundY - 1) === MAT.SKIN) raster.set(toeTipX - dir * 3, groundY - 1, skin.steps[5], MAT.SKIN, 5);
      break;
    }
    case 'boot': {
      // The shaft first, rising over the trouser; then the foot.
      const shaftHalf = Math.max(5, baseHalf - 1);
      for (let dy = 0; dy < 12; dy += 1) {
        const y = groundY - 12 - dy;
        for (let x = cx - shaftHalf; x <= cx + shaftHalf; x += 1) {
          const sh = x < cx - shaftHalf + 3 ? 2 : x > cx + shaftHalf - 3 ? 4 : 3;
          raster.set(x, y, leather.steps[Math.min(6, sh + shadow)], MAT.LEATHER, sh);
        }
      }
      // The cuff: a lit fold at the shaft's top.
      for (let x = cx - shaftHalf; x <= cx + shaftHalf; x += 1) {
        raster.set(x, groundY - 23, leather.steps[Math.min(6, 2 + shadow)], MAT.LEATHER, 2);
        raster.shift(x, groundY - 22, 1, ramps.book);
      }
      last(14, leather, MAT.LEATHER, (tt, toeward) =>
        tt > 0.85 ? 5 : toeward > 0.8 ? 2 : toeward < 0.2 ? 4 : 3);
      // Sole seam.
      for (let x = cx - baseHalf - extraW; x <= cx + dir * (baseHalf + extraW + Math.round(toe * 0.6)); x += dir) {
        if (raster.matAt(x, groundY - 2) === MAT.LEATHER) raster.shift(x, groundY - 2, 1, ramps.book);
      }
      break;
    }
    case 'clog': {
      // Carved wood: blocky, pale, with a thick dark sole and a strap line.
      last(12, wood, MAT.WOOD, (tt, toeward) =>
        tt > 0.7 ? 5 : toeward > 0.7 ? 1 : toeward < 0.25 ? 3 : 2, { blocky: true, toeScale: 0.5 });
      for (let x = cx - baseHalf - extraW; x <= cx + baseHalf + extraW + (dir === 1 ? Math.round(toe * 0.5) : 0); x += 1) {
        if (raster.matAt(x, groundY - 6) === MAT.WOOD) raster.shift(x, groundY - 6, 1, ramps.book);
      }
      break;
    }
    case 'wrap': {
      // Bound cloth: a soft rounded mass with binding courses across it.
      last(13, cloth, MAT.CLOTH_C, (tt, toeward) =>
        tt > 0.85 ? 5 : toeward > 0.75 ? 2 : toeward < 0.25 ? 4 : 3);
      for (let dy = 3; dy < 10; dy += 3) {
        const y = groundY - dy;
        for (let x = cx - baseHalf - extraW + 1; x <= cx + baseHalf + extraW + 2; x += 1) {
          if (raster.matAt(x, y) === MAT.CLOTH_C) raster.shift(x, y, 1, ramps.book);
        }
      }
      break;
    }
    case 'straw': {
      // Plaited fiber: pale, flat, with a woven fleck.
      last(11, leather, MAT.LEATHER, (tt, toeward) =>
        tt > 0.8 ? 4 : toeward > 0.7 ? 1 : toeward < 0.25 ? 3 : 2);
      for (let dy = 1; dy < 8; dy += 1) {
        const y = groundY - dy;
        for (let x = cx - baseHalf - extraW; x <= cx + baseHalf + extraW + Math.round(toe * 0.6); x += 1) {
          if ((x + y) % 3 === 0 && raster.matAt(x, y) === MAT.LEATHER) raster.shift(x, y, 1, ramps.book);
        }
      }
      break;
    }
    default: {
      // A leather shoe: the rounded last, a lit toe cap, a sole seam.
      last(14, leather, MAT.LEATHER, (tt, toeward) =>
        tt > 0.85 ? 5 : toeward > 0.8 ? 2 : toeward < 0.2 ? 4 : 3);
      for (let x = Math.min(cx, toeTipX); x <= Math.max(cx, toeTipX); x += 1) {
        if (raster.matAt(x, groundY - 11) === MAT.LEATHER) {
          raster.set(x, groundY - 11, leather.steps[Math.min(6, 2 + shadow)], MAT.LEATHER, 2);
        }
        if (raster.matAt(x, groundY - 2) === MAT.LEATHER) raster.shift(x, groundY - 2, 1, ramps.book);
      }
    }
  }
}

function drawShoes(raster: Raster, ramps: PortraitRamps, s: Skeleton, extras: SpriteExtras) {
  const t = s.t;
  const off = Math.floor(s.legW / 2) + s.legGap + 2;
  const baseHalf = Math.max(5, Math.round(t.shoeLen * 0.24));
  // Both feet angle into the turn — toward the facing side, the same way
  // the face points, exactly as the mockups plant them. The far foot steps
  // ahead, sits higher on the ground line, in shadow, and shows less of
  // itself; the near foot is closest to the camera and carries the full toe.
  drawFootwear(
    raster, ramps,
    s.cx + t.hipSkew + off + Math.round(t.strideX), s.floorY - t.footStagger,
    extras.footwear, Math.max(0, Math.round(t.footToe * 0.55)), 0, true, baseHalf, 1
  );
  drawFootwear(
    raster, ramps,
    s.cx + t.hipSkew - off - 2, s.floorY,
    extras.footwear, t.footToe, t.footSplay, false, baseHalf, 1
  );
}

/**
 * The volumetric wrap: how far a horizontal band sags as it crosses the
 * body in three-quarter view. Every belt, hem, collar, and cuff is an
 * ellipse arc seen from slightly above — lowest just off center toward the
 * viewer, rising to nothing at the silhouette edges. A straight band is
 * the single loudest "paper cutout" tell; this is its antidote.
 */
function bandSag(x: number, axis: number, half: number, depth: number): number {
  const apex = axis - half * 0.15;
  const u = Math.max(-1.2, Math.min(1.2, (x - apex) / Math.max(1, half)));
  return Math.max(0, Math.round(depth * (1 - u * u)));
}

/** How deep a band's arc runs for a body of this half-width. */
function sagDepth(half: number): number {
  return Math.max(2, Math.min(6, Math.round(half * 0.14)));
}

/**
 * The garment's bottom edge, per column: the hem is itself a wrapped band,
 * arcing down toward the viewer. Shared by the mask (which is cut to it),
 * the hem shadow, the trim, and the ragged break.
 */
function hemEdgeFor(s: Skeleton, plan: GarmentPlan): Int16Array {
  const depth = sagDepth(plan.hemHalf);
  const edge = new Int16Array(SPRITE_W);
  for (let x = 0; x < SPRITE_W; x += 1) {
    edge[x] = plan.hemY - depth + bandSag(x, s.cx, plan.hemHalf, depth);
  }
  return edge;
}

/**
 * The closure line bows with the body instead of hanging plumb: out toward
 * the viewer through the chest, back in at the waist.
 */
function closureX(s: Skeleton, y: number): number {
  const t = (y - s.shoulderY) / Math.max(1, s.hipY - s.shoulderY);
  return s.cx + 4 - Math.round(Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * 2);
}

function torsoMask(s: Skeleton, plan: GarmentPlan, hemEdge: Int16Array): Mask {
  const m = makeMask(SPRITE_W, SPRITE_H);
  const t = s.t;
  for (let y = s.shoulderY; y <= plan.hemY; y += 1) {
    let half: number;
    let skew: number;
    if (y <= s.waistY) {
      const tt = (y - s.shoulderY) / Math.max(1, s.waistY - s.shoulderY);
      half = Math.round(s.shoulderHalf + (s.waistHalf - s.shoulderHalf) * tt);
      skew = Math.round(t.torsoSkew + (t.hipSkew - t.torsoSkew) * tt * 0.5)
        // The stoop's curve: the shoulder rows follow the head forward and
        // the curve dies out by mid-torso, so the back visibly rounds.
        + Math.round(s.stoopTopSkew * Math.max(0, 1 - tt * 2));
    } else {
      const tt = (y - s.waistY) / Math.max(1, plan.hemY - s.waistY);
      half = Math.round(s.waistHalf + (plan.hemHalf - s.waistHalf) * tt);
      skew = Math.round(t.hipSkew + (t.torsoSkew - t.hipSkew) * Math.max(0, 0.5 - tt));
    }
    // The turn. The body rotates toward the facing side, which brings the
    // OPPOSITE shoulder toward the camera: the near shoulder is on the
    // viewer's left when the figure faces the viewer's right. Near side
    // carries more width; the facing side recedes.
    let nearHalf = half + t.shoulderAsym; // viewer-left
    let farHalf = half - t.shoulderAsym;  // facing side, receding
    const sy = y - s.shoulderY;
    // Two different shoulders, because this is a three-quarter view: the
    // near shoulder presents its full breadth and rounds over a long, high
    // arc; the far shoulder is foreshortened — a tighter, quicker curve
    // that starts lower. The drop slider deepens the far side's recession.
    const nearArc = [12, 9, 7, 5, 3, 2, 1] as const;
    const farArc = [13, 10, 7, 4, 2, 1] as const;
    if (sy >= 0) {
      if (sy < nearArc.length) nearHalf -= nearArc[sy];
      if (sy < farArc.length) {
        farHalf -= farArc[sy]
          + (sy <= 1 ? t.shoulderDrop * 2 : sy <= 3 ? t.shoulderDrop : t.shoulderDrop > 2 ? 2 : 0);
      }
    }
    for (let x = s.cx + skew - nearHalf; x <= s.cx + skew + farHalf; x += 1) {
      // The hem is an arc, not a floor: each column ends where the wrapped
      // bottom edge crosses it.
      if (y > hemEdge[x]) continue;
      m[y * SPRITE_W + x] = 1;
    }
  }
  return m;
}

function drawTorso(raster: Raster, spec: PortraitSpec, ramps: PortraitRamps, s: Skeleton, plan: GarmentPlan, seed: number): Mask {
  const bare = plan.kind === 'bare';
  const hemEdge = hemEdgeFor(s, plan);
  const m = torsoMask(s, plan, hemEdge);
  const rng = makeRng(seed ^ 0x51ab);

  // Uneven hem: real cloth does not end in a ruled line — the break rides
  // the wrapped arc, biting two rows deep at the top of its range; heavy
  // cloth hangs a touch straighter.
  if (!bare && plan.hemY > s.waistY + 6 && s.t.hemBreak > 0) {
    const p = Math.max(0.08, 0.1 + s.t.hemBreak * 0.13 - s.t.clothWeight * 0.04);
    for (let x = s.cx - plan.hemHalf; x <= s.cx + plan.hemHalf; x += 1) {
      if (rng() < p) {
        m[hemEdge[x] * SPRITE_W + x] = 0;
        if (s.t.hemBreak >= 2 && rng() < 0.15 * s.t.hemBreak) {
          m[(hemEdge[x] - 1) * SPRITE_W + x] = 0;
        }
      }
    }
  }

  fillMask(raster, m, bare ? ramps.skin : ramps.clothA, bare ? MAT.SKIN : MAT.CLOTH_A,
    cylinderShaderX(s.cx - 4, s.waistHalf + 10, { gain: 5 + s.t.shadeContrast * 1.5 }), { dither: 0.25 });
  if (!bare) {
    // Broad light from the upper left; wide core shadow down the facing side.
    formLight(raster, m, ramps.book, s.t.lightDir, s.t.lightStrength);
  }
  if (bare) {
    const wrap = maskRect(SPRITE_W, SPRITE_H, s.cx - s.hipHalf, s.waistY, s.hipHalf * 2 + 2, s.hipY - s.waistY + 16);
    fillMask(raster, wrap, ramps.clothA, MAT.CLOTH_A, cylinderShaderX(s.cx - 4, s.hipHalf + 2), { dither: 0.25 });
    return m;
  }

  materialTexture(raster, m, ramps.book, spec.garment.material, spec.seed, s.t.textureAmt);

  // Collar: a scooped opening that wraps the neck — an arc, not a notch.
  const collarDepth = 3;
  for (let i = -8; i <= 8; i += 1) {
    const x = s.cx + i;
    const y = s.shoulderY + 2 + bandSag(x, s.cx, 9, collarDepth);
    if (isCloth(raster, x, y)) raster.shift(x, y, 2, ramps.book);
    if (isCloth(raster, x, y + 1)) raster.shift(x, y + 1, 2, ramps.book);
    if (Math.abs(i) <= 5 && isCloth(raster, x, y + 2)) raster.shift(x, y + 2, -1, ramps.book);
  }

  // Front opening with buttons on coats; a fold shadow on everything else.
  // The closure follows the body's curved center axis, never a plumb line.
  const coatlike = plan.kind === 'jacket' || plan.kind === 'doublet' || plan.kind === 'work_shirt' || plan.kind === 'tunic';
  if (coatlike) {
    for (let y = s.shoulderY + 8; y <= (plan.belted ? s.waistY - 2 : plan.hemY - 4); y += 1) {
      const x = closureX(s, y);
      if (isCloth(raster, x, y)) raster.shift(x, y, 1, ramps.book);
    }
    // Buttons: two-pixel studs with a cast shadow beneath each, marching
    // down the curved closure.
    for (let y = s.shoulderY + 12; y <= s.waistY - 4; y += 10) {
      const x = closureX(s, y);
      if (isCloth(raster, x, y)) {
        raster.set(x, y, ramps.metal.steps[2], MAT.METAL, 2);
        raster.set(x + 1, y, ramps.metal.steps[3], MAT.METAL, 3);
        if (isCloth(raster, x, y + 1)) raster.shift(x, y + 1, 1, ramps.book);
      }
    }
  }

  // Falling folds below the waist. Each fold is a seeded column that can
  // sway as it falls (drapeSway), deepening toward the hem. Light cloth
  // breaks its folds into lively dashes; heavy cloth hangs them straight,
  // few and deep. A lit ridge rides beside each crease so the fold reads
  // as form, not as a stripe.
  if (s.t.foldStrength > 0 && plan.hemY > s.waistY + 12) {
    const weight = s.t.clothWeight;
    const n = Math.max(2, Math.round(s.t.foldCount) - (weight >= 3 ? 1 : 0));
    const span = Math.max(8, plan.hemHalf - 8);
    const sway = s.t.drapeSway * Math.max(0.3, 1 - weight * 0.25) * 2;
    const startY = s.waistY + 6;
    const fall = Math.max(1, plan.hemY - startY);
    // Light cloth breaks often; heavy cloth barely at all.
    const gap = weight >= 2 ? 2 : 4;
    for (let i = 0; i < n; i += 1) {
      const jitter = Math.floor(rng() * 5) - 2;
      const fx0 = s.cx - span + Math.round(((i + 0.5) / n) * span * 2) + jitter;
      const phase = rng() * Math.PI * 2;
      const freq = 0.07 + rng() * 0.05;
      for (let y = startY; y <= plan.hemY - 3; y += 1) {
        if (((y + i * 5) % 13) < gap) continue;
        const tt = (y - startY) / fall;
        const fx = fx0 + Math.round(Math.sin(y * freq + phase) * sway * 0.8);
        if (!isCloth(raster, fx, y)) continue;
        // Creases start shallow at the gather and deepen as they fall —
        // sooner, the stronger the slider. Two pixels wide: real cloth
        // turns, it does not crease along a hairline.
        const depth = s.t.foldStrength >= 2 && tt > (s.t.foldStrength >= 3 ? 0.3 : 0.55) ? 2 : 1;
        raster.shift(fx, y, depth, ramps.book);
        if (isCloth(raster, fx + 1, y)) raster.shift(fx + 1, y, Math.max(1, depth - 1), ramps.book);
        // The lit ridge beside the crease, on the light side.
        if (s.t.foldStrength >= 2 && ((y + i) % 5) !== 0 && isCloth(raster, fx - 1, y)) {
          raster.shift(fx - 1, y, -1, ramps.book);
          if (s.t.foldStrength >= 3 && isCloth(raster, fx - 2, y)) raster.shift(fx - 2, y, -1, ramps.book);
        }
      }
    }
    // Belted garments gather at the waist: short radiating tucks just below
    // the belt line, denser on light cloth.
    if (plan.belted && s.t.foldStrength >= 1 && weight <= 2) {
      for (let i = -2; i <= 2; i += 1) {
        const gx = s.cx + i * 8 + (i % 2);
        for (let dy = 6; dy <= 10 + (2 - weight) * 2; dy += 1) {
          const y = s.waistY + dy;
          const x = gx + Math.sign(i) * Math.floor(dy / 8);
          if (isCloth(raster, x, y)) raster.shift(x, y, 1, ramps.book);
        }
      }
    }
  }

  // Hem shadow; a dark gather-line just above it; trim on ornamented cloth.
  // All of it rides the wrapped hem arc, column by column.
  if (s.t.hemLine > 0) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      const e = hemEdge[x];
      for (const dy of [0, 1]) {
        if (m[(e - dy) * SPRITE_W + x] && isCloth(raster, x, e - dy)) {
          raster.shift(x, e - dy, 1 + s.t.hemLine - dy, ramps.book);
        }
      }
      if (spec.garment.ornament <= 0.3 && m[(e - 4) * SPRITE_W + x] && isCloth(raster, x, e - 4) && (x % 7) !== 0) {
        raster.shift(x, e - 4, s.t.hemLine, ramps.book);
      }
    }
  }
  if (spec.garment.ornament > 0.3) {
    // A woven trim band above the hem, curving with it, with its own seam.
    for (let x = s.cx - plan.hemHalf; x <= s.cx + plan.hemHalf; x += 1) {
      const e = hemEdge[x];
      for (const dy of [2, 3, 4, 5, 6]) {
        if (isCloth(raster, x, e - dy)) {
          raster.set(x, e - dy, ramps.clothB.steps[dy === 4 ? 1 : 2], MAT.CLOTH_B, 2);
        }
      }
      if (isCloth(raster, x, e - 7) && (x % 3) !== 0) raster.shift(x, e - 7, 1, ramps.book);
    }
  }

  // The robe's front: a double trim placket when the cloth is ornamented,
  // and a plain center seam when it is not — every long garment closes,
  // and every closure follows the body's curved axis.
  if (plan.bell && spec.garment.ornament > 0.2) {
    for (let y = s.shoulderY + 8; y <= plan.hemY - 8; y += 1) {
      const c = closureX(s, y);
      for (const dx of [0, 1]) {
        if (isCloth(raster, c + dx, y)) raster.set(c + dx, y, ramps.clothB.steps[2], MAT.CLOTH_B, 2);
      }
      for (const dx of [4, 5]) {
        if (isCloth(raster, c + dx, y)) raster.set(c + dx, y, ramps.clothB.steps[2], MAT.CLOTH_B, 2);
      }
      for (const dx of [2, 3]) {
        if (isCloth(raster, c + dx, y)) raster.shift(c + dx, y, 1, ramps.book);
      }
    }
  } else if (plan.bell || plan.kind === 'wrapped_garment') {
    for (let y = s.shoulderY + 10; y <= plan.hemY - 6; y += 1) {
      if ((y % 10) < 2) continue;
      const c = closureX(s, y) + 2;
      if (isCloth(raster, c, y)) raster.shift(c, y, 1, ramps.book);
    }
  }

  // The wrap's diagonal: a doubled seam line with a shadow under its fold.
  if (plan.kind === 'wrapped_garment') {
    for (let i = 0; i < s.shoulderHalf * 2 - 8; i += 1) {
      const x = s.cx - s.shoulderHalf + 4 + i;
      const y = s.shoulderY + 8 + Math.round(i * 0.6);
      if (isCloth(raster, x, y)) raster.shift(x, y, 2, ramps.book);
      if (isCloth(raster, x, y + 1)) raster.shift(x, y + 1, 1, ramps.book);
    }
  }

  // Belt with buckle and pouch. The band is a wrapped ellipse arc — the
  // single loudest volumetric cue on the whole figure: it sags toward the
  // viewer and rises to the silhouette edges, and everything hung on it
  // (buckle, pouch) rides the same curve.
  if (plan.belted) {
    const beltDepth = sagDepth(s.waistHalf + 2);
    const beltSag = (x: number) => bandSag(x, s.cx, s.waistHalf + 2, beltDepth);
    for (let x = s.cx - s.waistHalf - 2; x <= s.cx + s.waistHalf; x += 1) {
      const by = s.waistY - beltDepth + beltSag(x);
      if (!isCloth(raster, x, by) && !isCloth(raster, x, by + 2) && !isCloth(raster, x, by + 4)) continue;
      raster.set(x, by, ramps.leather.steps[2], MAT.LEATHER, 2);
      raster.set(x, by + 1, ramps.leather.steps[3], MAT.LEATHER, 3);
      raster.set(x, by + 2, ramps.leather.steps[4], MAT.LEATHER, 4);
      raster.set(x, by + 3, ramps.leather.steps[4], MAT.LEATHER, 4);
      raster.set(x, by + 4, ramps.leather.steps[5], MAT.LEATHER, 5);
      // The belt casts down onto the cloth below its curve.
      if (isCloth(raster, x, by + 5)) raster.shift(x, by + 5, 1, ramps.book);
    }
    // The buckle sits on the closure line, riding the band's arc.
    const bx = closureX(s, s.waistY);
    const buckleY = s.waistY - beltDepth + beltSag(bx) + 1;
    for (let dy = 0; dy < 3; dy += 1) {
      for (let dx = 0; dx < 4; dx += 1) {
        const edge = dy === 0 || dy === 2 || dx === 0 || dx === 3;
        raster.set(bx + dx, buckleY + dy, ramps.metal.steps[edge ? 3 : 4], MAT.METAL, edge ? 3 : 4);
      }
    }
    raster.set(bx, buckleY, ramps.metal.steps[1], MAT.METAL, 1);
    if (spec.wealth !== 'poor') {
      // The pouch hangs from the belt where the arc has already risen.
      const px0 = s.cx - 24;
      const pouchTop = s.waistY - beltDepth + beltSag(px0 + 5) + 5;
      for (let y = 0; y < 12; y += 1) {
        const w = y < 2 ? 6 : 10;
        for (let x = 0; x < w; x += 1) {
          raster.set(px0 + x + (y < 2 ? 2 : 0), pouchTop + y, ramps.leather.steps[3 + (y >= 8 ? 1 : 0)], MAT.LEATHER, 3);
        }
      }
      for (let x = 0; x < 10; x += 1) {
        raster.set(px0 + x, pouchTop + 3, ramps.leather.steps[5], MAT.LEATHER, 5);
      }
      raster.set(px0 + 3, pouchTop + 2, ramps.leather.steps[2], MAT.LEATHER, 2);
      raster.set(px0 + 4, pouchTop + 2, ramps.leather.steps[2], MAT.LEATHER, 2);
    }
  }

  return m;
}

/**
 * One limb segment as a lit capsule: a thick stroke from joint to joint,
 * shaded ACROSS its own axis so an angled arm reads as a cylinder pointing
 * wherever it points — not as a stack of horizontal spans, which is what
 * made the first reach read as a stick poked through the chest.
 */
function drawLimbSegment(
  raster: Raster, ramp: Ramp, mat: number,
  x0: number, y0: number, x1: number, y1: number, width: number, cover?: Mask
) {
  const len = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
  const steps = Math.ceil(len * 2);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const half = width / 2;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const cx = x0 + (x1 - x0) * t;
    const cy = y0 + (y1 - y0) * t;
    for (let k = -half; k <= half; k += 0.5) {
      const px = Math.round(cx + nx * k);
      const py = Math.round(cy + ny * k);
      if (px < 0 || py < 0 || px >= SPRITE_W || py >= SPRITE_H) continue;
      // The key light crosses the cylinder from the upper left.
      const litDot = nx * k * 0.8 + ny * k * 0.6;
      const sh = Math.max(2, Math.min(5, 3 + Math.round((litDot / half) * 1.6)));
      raster.set(px, py, ramp.steps[sh], mat, sh);
      if (cover) cover[py * SPRITE_W + px] = 1;
    }
  }
}

/**
 * A sleeve is its own cylinder: rooted at the shoulder, hanging past the
 * waist, separated from the coat by a seam and — below the waist — a sliver
 * of daylight. Bell sleeves widen toward the wrist.
 */
function drawSleeve(
  raster: Raster, spec: PortraitSpec, ramps: PortraitRamps, s: Skeleton, plan: GarmentPlan,
  side: -1 | 1, pose: 'hang' | 'clasp' | 'forward' | 'up' | 'offer'
): [number, number] {
  const bare = plan.kind === 'bare';
  // The three-quarter turn is an occlusion, not a slider: the near arm
  // hangs fully clear of the silhouette; the far arm disappears behind the
  // turned torso, leaving an outer sliver of sleeve at the shoulder and
  // the forearm re-emerging where the waist narrows.
  const w = side === -1 ? s.armW : s.armW - 3;
  const rootX = s.stoopTopSkew + (side === -1
    ? s.cx + s.t.torsoSkew - (s.shoulderHalf + s.t.shoulderAsym)
    : s.cx + s.t.torsoSkew + (s.shoulderHalf - s.t.shoulderAsym - 1) - s.t.farArmTuck - 6);
  const m = makeMask(SPRITE_W, SPRITE_H);
  const put = (x0: number, y: number, width: number) => {
    for (let i = 0; i < width; i += 1) {
      const px = x0 + i;
      if (px >= 0 && px < SPRITE_W && y >= 0 && y < SPRITE_H) m[y * SPRITE_W + px] = 1;
    }
  };

  let wrist: [number, number];
  if (pose === 'clasp') {
    // Upper arm falls to the elbow at the waist; the forearm angles in so the
    // hands meet at the front of the waist, the reference woman's rest.
    const elbowY = s.waistY - 12;
    for (let y = s.shoulderY + 4; y <= elbowY; y += 1) {
      const spread = plan.bell ? Math.round((y - s.shoulderY) / 20) : 0;
      put(rootX + (side === 1 ? 0 : -(w + spread) + 1), y, w + spread);
    }
    const targetX = s.cx + side * 4;
    const reach = Math.abs(rootX - targetX) - 4;
    for (let step = 0; step <= reach; step += 1) {
      const x = rootX - side * step;
      const y = elbowY + Math.round(step * 0.35);
      put(x + (side === 1 ? -(w - 2) + 1 : 0), y, w - 2);
    }
    wrist = [targetX, elbowY + Math.round(reach * 0.35)];
  } else if (pose === 'forward' || pose === 'offer' || pose === 'up') {
    // The action poses are articulated limbs, not extruded strips: two
    // capsule segments — shoulder to elbow, elbow to wrist — each shaded
    // across its own axis, rooted at the SHOULDER CAP rather than at the
    // tucked rest position (which put the old reach through the chest).
    const limbRamp = bare ? ramps.skin : ramps.clothA;
    const limbMat = bare ? MAT.SKIN : MAT.CLOTH_A;
    const lw = s.armW;
    const rootAX = s.stoopTopSkew + s.cx + s.t.torsoSkew + (s.shoulderHalf - s.t.shoulderAsym) - 4;
    const rootAY = s.shoulderY + 8;
    let elbow: [number, number];
    if (pose === 'forward') {
      // Reach: upper arm rotates forward and down, forearm drives ahead —
      // at real proportions: the upper arm is over half the torso's length.
      elbow = [rootAX + 10, rootAY + 24];
      wrist = [elbow[0] + 24, elbow[1] - 11];
    } else if (pose === 'up') {
      // Raise: upper arm swings up and out, forearm continues skyward
      // with a slight bend — clear of the head.
      elbow = [rootAX + 9, rootAY - 19];
      wrist = [elbow[0] + 10, elbow[1] - 23];
    } else {
      // Offer: elbow drops toward the waist, the open hand presents forward.
      elbow = [rootAX + 3, rootAY + 26];
      wrist = [elbow[0] + 20, elbow[1] - 8];
    }
    const limbCover = makeMask(SPRITE_W, SPRITE_H);
    drawLimbSegment(raster, limbRamp, limbMat, rootAX, rootAY, elbow[0], elbow[1], lw + 1, limbCover);
    drawLimbSegment(raster, limbRamp, limbMat, elbow[0], elbow[1], wrist[0], wrist[1], lw - 1, limbCover);
    // The acting arm throws its shadow onto whatever it crosses — the one
    // cue that separates same-colored cloth from same-colored cloth.
    applyContactShadow(raster, limbCover, ramps.book, { dx: 1, dy: 2, strength: 2, depth: 2 });
    // The crook of the elbow gathers one crease of shadow.
    if (!bare) {
      raster.shift(elbow[0] - 1, elbow[1] + 1, 1, ramps.book);
      raster.shift(elbow[0], elbow[1] + 2, 1, ramps.book);
    }
  } else {
    // Hanging: rooted at the shoulder's edge, falling straight with a slight
    // outward bow. The far sleeve caps lower — its shoulder is foreshortened
    // and dropped. Below the waist the torso has narrowed, so the space
    // between sleeve and body is real background — the mockup's daylight,
    // no carving required.
    const capY = s.shoulderY + 4 + (side === 1 ? Math.round(s.t.shoulderDrop / 2) + 1 : 0);
    const end = bare ? s.handY - 4 : plan.sleeveEnd;
    for (let y = capY; y <= end; y += 1) {
      const tt = (y - capY) / Math.max(1, end - capY);
      const spread = plan.bell ? Math.round(tt * 6) : 0;
      // Plain sleeves taper into the wrist; bells do the opposite. The far
      // sleeve's visible sliver narrows away into the torso's contour
      // instead of ending in a step.
      const taper = !plan.bell && tt > 0.78 ? 2 : 0;
      const farMerge = side === 1 && tt > 0.55 ? Math.round((tt - 0.55) * 9) : 0;
      const bow = Math.round(Math.sin(tt * Math.PI) * 2);
      const width = Math.max(2, w + spread - taper - farMerge - (y <= capY + 1 ? 2 : 0));
      put(rootX + side * bow + (side === 1 ? 0 : -width + 1), y, width);
    }
    wrist = [rootX + side * 2, end + 2];
    // The cuff opening is a wrapped band like every other opening: trim
    // the sleeve's bottom edge to its arc so the wrist emerges from an
    // ellipse, not a ruled line.
    if (!bare) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        const cut = end - 2 + bandSag(x, wrist[0], w / 2 + 2, 2);
        for (let y = cut + 1; y <= end + 2; y += 1) {
          m[y * SPRITE_W + x] = 0;
        }
      }
    }
  }

  if (bare) {
    fillMask(raster, m, ramps.skin, MAT.SKIN, cylinderShaderX(rootX + side * 2, w / 2 + 2), { dither: 0.2 });
  } else {
    fillMask(raster, m, ramps.clothA, MAT.CLOTH_A, cylinderShaderX(rootX + side * 2, w / 2 + 3, { gain: 5 + s.t.shadeContrast * 1.5 }), { dither: 0.22 });
    materialTexture(raster, m, ramps.book, spec.garment.material, spec.seed + side, s.t.textureAmt);
    if (side === 1 && (pose === 'hang' || pose === 'clasp')) {
      // The facing-side sleeve shades on its inner half only — behind the
      // body, but still the same garment.
      for (let i = 0; i < m.length; i += 1) {
        if (m[i] && (i % SPRITE_W) <= rootX + 1) {
          raster.shift(i % SPRITE_W, Math.floor(i / SPRITE_W), 1, ramps.book);
        }
      }
    }
    // A hanging sleeve carries falling creases of its own — one at the
    // elbow's crook, one swaying with the same drape the skirt uses.
    if (pose === 'hang' && s.t.foldStrength > 0) {
      const cxs = rootX + (side === 1 ? 2 : -2);
      for (let y = s.chestY + 8; y <= plan.sleeveEnd - 6; y += 1) {
        if (((y + side) % 10) < 2) continue;
        const xo = Math.round(Math.sin(y * 0.11 + side * 2) * Math.min(2.4, s.t.drapeSway));
        const px = cxs + xo;
        if (m[y * SPRITE_W + px]) {
          raster.shift(px, y, 1, ramps.book);
          if (m[y * SPRITE_W + px + 1] && s.t.foldStrength >= 2) raster.shift(px + 1, y, 1, ramps.book);
        }
      }
      // The elbow's crook: a short chevron of creases at mid-arm.
      const elbowY = Math.round((s.chestY + plan.sleeveEnd) / 2);
      for (let i = 0; i < 4; i += 1) {
        const px = rootX + (side === 1 ? -1 : 1 - i);
        if (m[(elbowY + i) * SPRITE_W + px + i * side * -1]) {
          raster.shift(px + i * side * -1, elbowY + i, 1, ramps.book);
        }
      }
    }
    if (pose === 'clasp') {
      // The folded forearm sits in the body's shadow, not in the key light.
      for (let y = s.waistY - 16; y <= s.waistY + 4; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.shift(x, y, 1, ramps.book);
        }
      }
    }
    // Seam where sleeve meets body.
    if (pose === 'hang' || pose === 'clasp') {
      const seamX = rootX - side * (w - 2) + (side === 1 ? -2 : 2);
      for (let y = s.shoulderY + 8; y <= Math.min(s.waistY + 4, plan.sleeveEnd); y += 1) {
        if (m[y * SPRITE_W + seamX + side] || isCloth(raster, seamX, y)) raster.shift(seamX, y, 1, ramps.book);
      }
    }
    // Cuff, two rows deep, riding the trimmed arc, with trim on ornamented
    // robes.
    if (pose === 'hang' && plan.sleeveEnd > s.waistY - 8) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        const cut = plan.sleeveEnd - 2 + bandSag(x, wrist[0], w / 2 + 2, 2);
        for (const dy of [0, 1]) {
          if (m[(cut - dy) * SPRITE_W + x]) {
            if (spec.garment.ornament > 0.3) {
              raster.set(x, cut - dy, ramps.clothB.steps[2], MAT.CLOTH_B, 2);
            } else {
              raster.shift(x, cut - dy, 2 - dy, ramps.book);
            }
          }
        }
      }
    }
  }

  return wrist;
}

// ---------------------------------------------------------------------------
// Held items.
// ---------------------------------------------------------------------------

function drawHeldItem(raster: Raster, ramps: PortraitRamps, extras: SpriteExtras, hand: [number, number]) {
  if (!extras.held) return;
  const [hx, hy] = hand;
  const wood = ramps.book[MAT.WOOD] ?? ramps.leather;
  const metal = ramps.metal;
  const leather = ramps.leather;
  const putCol = (x: number, y0: number, y1: number, ramp: typeof wood, mat: number, shade: number) => {
    for (let y = y0; y <= y1; y += 1) raster.set(x, y, ramp!.steps[shade], mat, shade);
  };
  switch (extras.held.kind) {
    case 'pole':
    case 'staff': {
      putCol(hx + 6, hy - 104, hy + 28, wood, MAT.WOOD, 2);
      putCol(hx + 7, hy - 104, hy + 28, wood, MAT.WOOD, 3);
      putCol(hx + 8, hy - 104, hy + 28, wood, MAT.WOOD, 4);
      // The grain: broken darker flecks along the shaft.
      for (let y = hy - 100; y < hy + 24; y += 7) {
        raster.set(hx + 7, y, wood!.steps[4], MAT.WOOD, 4);
      }
      if (extras.held.kind === 'pole') {
        for (let i = 0; i < 10; i += 1) {
          raster.set(hx + 4 + i, hy - 106 - (i % 3), metal.steps[2 + (i % 2)], MAT.METAL, 2);
          raster.set(hx + 4 + i, hy - 105 - (i % 3), metal.steps[3], MAT.METAL, 3);
        }
      }
      break;
    }
    case 'blade': {
      putCol(hx, hy - 40, hy - 6, metal, MAT.METAL, 1);
      putCol(hx + 1, hy - 40, hy - 6, metal, MAT.METAL, 2);
      putCol(hx + 2, hy - 36, hy - 6, metal, MAT.METAL, 3);
      raster.set(hx, hy - 42, metal.steps[1], MAT.METAL, 1);
      raster.set(hx + 1, hy - 41, metal.steps[1], MAT.METAL, 1);
      // The guard and grip.
      for (let i = -4; i <= 4; i += 1) raster.set(hx + i, hy - 5, wood!.steps[3], MAT.WOOD, 3);
      for (let i = -4; i <= 4; i += 1) raster.set(hx + i, hy - 4, wood!.steps[4], MAT.WOOD, 4);
      break;
    }
    case 'tool': {
      putCol(hx, hy - 28, hy + 6, wood, MAT.WOOD, 3);
      putCol(hx + 1, hy - 28, hy + 6, wood, MAT.WOOD, 4);
      for (let i = 0; i < 8; i += 1) {
        raster.set(hx - 2 + i, hy - 30, metal.steps[3], MAT.METAL, 3);
        raster.set(hx - 2 + i, hy - 29, metal.steps[i < 4 ? 2 : 4], MAT.METAL, 3);
      }
      break;
    }
    case 'book': {
      for (let y = 0; y < 14; y += 1) {
        for (let x = 0; x < 10; x += 1) {
          raster.set(hx - 4 + x, hy - 10 + y, leather.steps[x <= 1 ? 2 : 3], MAT.LEATHER, 3);
        }
      }
      // Page block: a light fore-edge.
      for (let y = 1; y < 13; y += 1) raster.set(hx + 5, hy - 10 + y, ramps.metal.steps[1], MAT.LEATHER, 2);
      break;
    }
    case 'bag': {
      for (let y = 0; y < 16; y += 1) {
        const w = y < 4 ? 6 : 12;
        for (let x = 0; x < w; x += 1) {
          raster.set(hx - Math.floor(w / 2) + x, hy - 2 + y, leather.steps[3 + (y > 11 ? 1 : 0)], MAT.LEATHER, 3);
        }
      }
      // The gather at its neck.
      for (let x = -3; x <= 2; x += 1) raster.set(hx + x, hy + 2, leather.steps[5], MAT.LEATHER, 5);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Ink: the interior lines that define parts against each other — collar
// against neck, sleeve against hand, hem against leg. The mockups' secret.
// ---------------------------------------------------------------------------

function inkGroup(m: number): number {
  if (m === MAT.SKIN) return 1;
  if (m === MAT.CLOTH_A || m === MAT.CLOTH_B || m === MAT.CLOTH_C) return 2;
  if (m === MAT.HAIR || m === MAT.BEARD) return 3;
  if (m === MAT.HEADWEAR || m === MAT.HEADWEAR_ACCENT) return 4;
  if (m === MAT.LEATHER) return 5;
  return 0;
}

/**
 * Edge accents: the lit rim on the left silhouette, the form-shadow edge on
 * the right — on every part. The rim slider brightens the lit edge and, at
 * higher settings, catches the tops of masses too: hat crowns, shoulders.
 */
function edgeAccents(raster: Raster, ramps: PortraitRamps, rim: number) {
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (inkGroup(raster.matAt(x, y)) === 0) continue;
      const leftEmpty = x === 0 || raster.alphaAt(x - 1, y) === 0;
      const rightEmpty = x === SPRITE_W - 1 || raster.alphaAt(x + 1, y) === 0;
      const topEmpty = y === 0 || raster.alphaAt(x, y - 1) === 0;
      if (leftEmpty && !rightEmpty) {
        raster.shift(x, y, -Math.max(1, Math.min(3, Math.ceil(rim * 0.7))), ramps.book);
        if (rim >= 4 && raster.alphaAt(x + 1, y) !== 0) raster.shift(x + 1, y, -1, ramps.book);
      }
      else if (rightEmpty && !leftEmpty) raster.shift(x, y, 1, ramps.book);
      else if (topEmpty && rim >= 2) raster.shift(x, y, -1, ramps.book);
    }
  }
}

/**
 * Interior seams, graded: cloth-against-skin and cloth-against-leather take
 * crisp ink; the soft pairs — hair against skin, headscarf against face —
 * take only a darker step, so a hood frames a face without a hard wire
 * around it.
 */
function interiorOutline(raster: Raster, ramps: PortraitRamps, inkSoft: number) {
  const SOFT = new Set([1 * 8 + 3, 3 * 8 + 1, 1 * 8 + 4, 4 * 8 + 1, 3 * 8 + 4, 4 * 8 + 3]);
  for (let y = 0; y < SPRITE_H - 1; y += 1) {
    for (let x = 0; x < SPRITE_W - 1; x += 1) {
      const here = inkGroup(raster.matAt(x, y));
      if (here === 0) continue;
      const below = inkGroup(raster.matAt(x, y + 1));
      const right = inkGroup(raster.matAt(x + 1, y));
      const other = below !== 0 && below !== here ? below : right !== 0 && right !== here ? right : 0;
      if (other === 0) continue;
      if (SOFT.has(here * 8 + other) && inkSoft > 0) {
        raster.shift(x, y, inkSoft >= 3 ? 1 : 2, ramps.book);
      } else {
        const ramp = ramps.book[raster.matAt(x, y)];
        if (ramp) raster.set(x, y, ramp.outline, raster.matAt(x, y), 6);
      }
    }
  }
}

/**
 * Round the silhouette before inking it. The masks arrive with one-pixel
 * nicks and burrs — edge jitter, hem breaks, dither spill — and a contour
 * traced over burrs reads as a torn coastline no matter how thick it is.
 * One pass: notches (empty cells with six-plus filled neighbors) fill from
 * a neighbor; burrs (filled cells with two or fewer filled neighbors)
 * shave off. Gems and metal keep their single-pixel glints.
 */
function smoothSilhouette(raster: Raster) {
  const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]] as const;
  const fills: Array<[number, number, number]> = [];
  const shaves: number[] = [];
  for (let y = 1; y < SPRITE_H - 1; y += 1) {
    for (let x = 1; x < SPRITE_W - 1; x += 1) {
      const i = y * SPRITE_W + x;
      const filled = raster.data[i * 4 + 3] !== 0;
      let n = 0;
      let src = -1;
      for (const [dx, dy] of N8) {
        const ni = (y + dy) * SPRITE_W + x + dx;
        if (raster.data[ni * 4 + 3] !== 0) {
          n += 1;
          if (dy === -1 || (dy === 0 && src < 0)) src = ni;
        }
      }
      if (!filled && n >= 6 && src >= 0) fills.push([i, src, 0]);
      else if (filled && n <= 2) {
        const m = raster.mat[i];
        if (m !== MAT.GEM && m !== MAT.METAL) shaves.push(i);
      }
    }
  }
  for (const [di, si] of fills) {
    raster.data[di * 4] = raster.data[si * 4];
    raster.data[di * 4 + 1] = raster.data[si * 4 + 1];
    raster.data[di * 4 + 2] = raster.data[si * 4 + 2];
    raster.data[di * 4 + 3] = raster.data[si * 4 + 3];
    raster.mat[di] = raster.mat[si];
    raster.shade[di] = raster.shade[si];
  }
  for (const i of shaves) {
    raster.data[i * 4 + 3] = 0;
    raster.mat[i] = MAT.EMPTY;
    raster.shade[i] = 255;
  }
}

/** The reference's warm near-black. */
const INK = { r: 24, g: 16, b: 11 };

function mixRgbLocal(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, t: number) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

/**
 * The silhouette ink, painted rather than stamped. The first ring is a
 * *colored* dark — each material's own outline tone, warmer toward the
 * light and sunk toward near-black on the shadow side. At `outline` ≥ 3 a
 * second ring thickens the shadowed and grounded edges only, one step
 * darker again — the mockups' painterly two-to-three-pixel contour that
 * deepens where form turns away from light, never a uniform black wire.
 */
function paintInk(raster: Raster, ramps: PortraitRamps, litX: number, outline: number, inkSoft: number) {
  const writes: Array<[number, number, { r: number; g: number; b: number }, number]> = [];
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (raster.alphaAt(x, y) !== 0) continue;
      let mat = 0;
      let above = false;
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
        const nm = raster.matAt(x + dx, y + dy);
        if (nm !== MAT.EMPTY && raster.alphaAt(x + dx, y + dy) !== 0) {
          mat = nm;
          above = dy === 1;
          break;
        }
      }
      if (mat === 0) continue;
      const ramp = ramps.book[mat];
      if (!ramp) continue;
      const soft = mat === MAT.HAIR || mat === MAT.BEARD || mat === MAT.HEADWEAR || mat === MAT.HEADWEAR_ACCENT;
      let color;
      if (soft) {
        // Hair and cloth-of-the-head take diluted ink — and at full softness
        // their upper curves take none at all.
        if (inkSoft >= 3 && above) continue;
        color = mixRgbLocal(ramp.outline, ramp.steps[5], Math.min(0.75, 0.25 * inkSoft + (above ? 0.2 : 0)));
      } else {
        const shadowSide = x > litX;
        color = shadowSide ? mixRgbLocal(ramp.outline, INK, 0.55) : mixRgbLocal(ramp.outline, INK, 0.25);
      }
      writes.push([x, y, color, soft ? 1 : 0]);
    }
  }
  for (const [x, y, color] of writes) raster.set(x, y, color, MAT.EMPTY, 255);

  if (outline >= 2) {
    // The full second ring: at this canvas scale a one-pixel line is a
    // hairline, not a contour. Every hard-edged part gets a second pixel
    // all the way around — pulled a third toward ink on the lit side and
    // over half on the shadow side, so the line itself carries a gradient.
    // Soft masses (hair, hoods) keep their single diluted edge. A ring
    // pixel that would bridge a narrow gap of daylight is skipped: the
    // space between arm and body stays open.
    const extra: Array<[number, number, { r: number; g: number; b: number }]> = [];
    for (const [x, y, color, soft] of writes) {
      if (soft) continue;
      const ring2 = outline >= 3
        ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]] as const
        : [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
      for (const [dx, dy] of ring2) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= SPRITE_W || ny >= SPRITE_H) continue;
        if (raster.alphaAt(nx, ny) !== 0) continue;
        const bridgeH = raster.alphaAt(nx - 1, ny) !== 0 && raster.alphaAt(nx + 1, ny) !== 0;
        const bridgeV = raster.alphaAt(nx, ny - 1) !== 0 && raster.alphaAt(nx, ny + 1) !== 0;
        if (bridgeH || bridgeV) continue;
        const pull = nx > litX || dy === 1 ? 0.55 : 0.3;
        extra.push([nx, ny, mixRgbLocal(color, INK, pull)]);
      }
    }
    for (const [x, y, color] of extra) raster.set(x, y, color, MAT.EMPTY, 255);
  }
}

/**
 * The bow: everything above the waist pivots forward. Each row slides
 * toward the facing side and settles downward on a quadratic, so the spine
 * curves instead of hinging; rows re-place from the waist upward so the
 * head and shoulders fold naturally over the chest. The rows just below
 * the waist take a small graded shift for continuity — a bow travels
 * through the hips, it does not snap at a line.
 */
function applyBend(raster: Raster, bend: number, s: Skeleton) {
  if (bend <= 0) return;
  const waistY = s.waistY;
  const span = Math.max(1, waistY - s.crownY + 16);
  const count = waistY * SPRITE_W;
  const data = raster.data.slice(0, count * 4);
  const mat = raster.mat.slice(0, count);
  const shade = raster.shade.slice(0, count);
  for (let i = 0; i < count; i += 1) {
    raster.data[i * 4 + 3] = 0;
    raster.mat[i] = MAT.EMPTY;
    raster.shade[i] = 255;
  }
  for (let y = waistY - 1; y >= 0; y -= 1) {
    const t = (waistY - y) / span;
    const dx = Math.round(bend * Math.pow(t, 1.25));
    const dy = Math.round(bend * 0.65 * t * t);
    const ty = y + dy;
    if (ty >= SPRITE_H) continue;
    for (let x = 0; x < SPRITE_W; x += 1) {
      const si = y * SPRITE_W + x;
      if (data[si * 4 + 3] === 0) continue;
      const tx = x + dx;
      if (tx < 0 || tx >= SPRITE_W) continue;
      const ti = ty * SPRITE_W + tx;
      raster.data[ti * 4] = data[si * 4];
      raster.data[ti * 4 + 1] = data[si * 4 + 1];
      raster.data[ti * 4 + 2] = data[si * 4 + 2];
      raster.data[ti * 4 + 3] = data[si * 4 + 3];
      raster.mat[ti] = mat[si];
      raster.shade[ti] = shade[si];
    }
  }
  for (let y = waistY; y <= s.hipY; y += 1) {
    const k = Math.round(bend * 0.12 * (s.hipY - y) / Math.max(1, s.hipY - waistY));
    if (k <= 0) continue;
    const row = y * SPRITE_W;
    for (let x = SPRITE_W - 1; x >= 0; x -= 1) {
      const src = x - k;
      const di = row + x;
      if (src >= 0 && raster.data[(row + src) * 4 + 3] !== 0) {
        const si = row + src;
        raster.data[di * 4] = raster.data[si * 4];
        raster.data[di * 4 + 1] = raster.data[si * 4 + 1];
        raster.data[di * 4 + 2] = raster.data[si * 4 + 2];
        raster.data[di * 4 + 3] = raster.data[si * 4 + 3];
        raster.mat[di] = raster.mat[si];
        raster.shade[di] = raster.shade[si];
      } else {
        raster.data[di * 4 + 3] = 0;
        raster.mat[di] = MAT.EMPTY;
        raster.shade[di] = 255;
      }
    }
  }
}

/**
 * The breath: everything above the waist rises one pixel while the waist
 * holds, stretching the chest — a body filling its lungs, not a sprite
 * bobbing on a string. The boundary row duplicates, so no seam opens.
 */
function applyBreath(raster: Raster, waistY: number) {
  for (let y = 0; y < waistY - 1; y += 1) {
    const dst = y * SPRITE_W;
    const src = (y + 1) * SPRITE_W;
    for (let x = 0; x < SPRITE_W; x += 1) {
      raster.data[(dst + x) * 4] = raster.data[(src + x) * 4];
      raster.data[(dst + x) * 4 + 1] = raster.data[(src + x) * 4 + 1];
      raster.data[(dst + x) * 4 + 2] = raster.data[(src + x) * 4 + 2];
      raster.data[(dst + x) * 4 + 3] = raster.data[(src + x) * 4 + 3];
      raster.mat[dst + x] = raster.mat[src + x];
      raster.shade[dst + x] = raster.shade[src + x];
    }
  }
}

/**
 * A true lean: shear the finished figure from the feet up, so the crown ends
 * up `lean` px toward the facing side while the feet stay planted. Runs
 * before the ink passes, so outline and rim light follow the leaned
 * silhouette.
 */
function applyLeanShear(raster: Raster, lean: number, crownY: number, floorY: number) {
  if (!lean) return;
  const span = Math.max(1, floorY - crownY);
  for (let y = 0; y < SPRITE_H; y += 1) {
    const off = Math.round(lean * (floorY - y) / span);
    if (off === 0) continue;
    const row = y * SPRITE_W;
    const step = off > 0 ? -1 : 1;
    const from = off > 0 ? SPRITE_W - 1 : 0;
    const to = off > 0 ? -1 : SPRITE_W;
    for (let x = from; x !== to; x += step) {
      const src = x - off;
      const di = row + x;
      if (src >= 0 && src < SPRITE_W) {
        const si = row + src;
        raster.data[di * 4] = raster.data[si * 4];
        raster.data[di * 4 + 1] = raster.data[si * 4 + 1];
        raster.data[di * 4 + 2] = raster.data[si * 4 + 2];
        raster.data[di * 4 + 3] = raster.data[si * 4 + 3];
        raster.mat[di] = raster.mat[si];
        raster.shade[di] = raster.shade[si];
      } else {
        raster.data[di * 4 + 3] = 0;
        raster.mat[di] = MAT.EMPTY;
        raster.shade[di] = 255;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Assembly.
// ---------------------------------------------------------------------------

function compilePose(source: SpriteSource, ramps: PortraitRamps, fp: FramePose): Raster {
  const { spec, extras } = source;
  const s = buildSkeleton(spec, getTuning());
  const f = figOf(s);
  const plan = planGarment(spec, s);
  const raster = new Raster(SPRITE_W, SPRITE_H);

  // Hair, computed once per pose from the portrait engine: silhouette
  // arranged per style, split into back / front / over-shoulder layers,
  // with knots and braids as their own masks. Clipped under whatever the
  // head is wearing, settled onto the sprite's roomier crown.
  const hairCtx = spriteHairContext(raster, spec, ramps, s);
  const hairMasks = computeHairMasks(hairCtx);
  settleKnots(hairMasks, (hairCtx.anatomy as Anatomy).headTop);
  capBraids(hairMasks, s.waistY + 16);
  const covering = headwearCovering(spec, f);
  if (covering) clipHairUnderCovering(hairMasks, covering, SPRITE_W);

  drawHairBack(hairCtx, hairMasks);

  // Legs and shoes, under everything.
  if (plan.hemY < s.ankleY - 2) drawLegs(raster, ramps, s, extras);
  drawShoes(raster, ramps, s, extras);

  // Layered assembly: the facing-side sleeve goes down first (behind the
  // turned body), the body over it, the near sleeve in front — one shoulder
  // genuinely before the other.
  const restPose = plan.clasped ? 'clasp' : 'hang';
  const farPose = fp.farArm === 'forward' ? 'forward'
    : fp.farArm === 'up' ? 'up'
    : fp.farArm === 'offer' ? 'offer'
    : restPose;

  // A resting far arm lives behind the torso; an ACTING one crosses in
  // front of it — so the draw order follows the pose, and a reaching arm
  // shows its whole length instead of a forearm sprouting from the coat.
  let farWrist: [number, number];
  let bodyMask: Mask;
  if (farPose === restPose) {
    farWrist = drawSleeve(raster, spec, ramps, s, plan, 1, farPose);
    bodyMask = drawTorso(raster, spec, ramps, s, plan, spec.seed);
  } else {
    bodyMask = drawTorso(raster, spec, ramps, s, plan, spec.seed);
    farWrist = drawSleeve(raster, spec, ramps, s, plan, 1, farPose);
  }
  const nearWrist = drawSleeve(raster, spec, ramps, s, plan, -1, restPose);
  const handRight = farWrist;

  // Hands — each knows which arm it hangs from, so the thumbs mirror. The
  // far hand only exists where it clears the garment: behind a wide robe
  // or long coat it stays hidden, exactly as the mockups hide it, instead
  // of floating on top of the cloth.
  if (plan.clasped && fp.farArm === 'rest') {
    // Clasped rest: the two hands meet and overlap at the front of the
    // waist, the far one beneath, the near one laid over it.
    drawHandSprite(raster, ramps, s.cx + 3, s.waistY - 9, 1);
    drawHandSprite(raster, ramps, s.cx - 5, s.waistY - 6, -1);
  } else {
    const farOverCloth = fp.farArm === 'rest'
      && bodyMask[(farWrist[1] + 4) * SPRITE_W + farWrist[0]] === 1;
    // A raised arm carries its fist above the wrist, not dangling below it.
    const farHandY = fp.farArm === 'up' ? farWrist[1] - 9 : farWrist[1];
    if (!farOverCloth) drawHandSprite(raster, ramps, farWrist[0], farHandY, 1);
    drawHandSprite(raster, ramps, nearWrist[0], nearWrist[1], -1);
  }

  // The garment casts onto the legs; the sleeves onto the hands. Strength
  // deepens the shadow; past 3 it also reaches further down.
  if (s.t.contactShade > 0) {
    applyContactShadow(raster, bodyMask, ramps.book, {
      dx: 0, dy: 1,
      strength: Math.min(6, s.t.contactShade),
      depth: Math.min(8, 2 * (1 + Math.floor(s.t.contactShade / 3))),
    });
  }

  // Long hair falls forward over the finished clothing, parted around the
  // neck — the portrait's over-shoulder layer, in the sprite's stack.
  drawHairOverShoulder(hairCtx, hairMasks);

  // Neck and head, carried on the stoop.
  const neck = maskRect(SPRITE_W, SPRITE_H, s.headCx - Math.floor(s.t.neckW / 2), s.neckTopY, s.t.neckW, s.shoulderY - s.neckTopY + 6);
  fillMask(raster, neck, ramps.skin, MAT.SKIN, cylinderShaderX(s.headCx, s.t.neckW / 2 + 1), { dither: 0.2 });
  const head = headMask({ ...f, footY: s.floorY } as any, spec.faceShape);
  // Nearly no dither on the face: skin is smooth or it reads as grime.
  fillMask(raster, head, ramps.skin, MAT.SKIN, ellipsoidShader(s.headCx + 4, f.headCy, s.headRx, s.headRy, 1, { base: 3, gain: 4 }), { dither: 0.12 });
  drawSkinZonesSprite(raster, spec, ramps, { ...f, footY: s.floorY } as any, head);
  applyContactShadow(raster, head, ramps.book, { dx: 0, dy: 1, strength: 1, depth: 4 });

  drawFace(raster, spec, ramps, s, head, fp);
  drawHairFront(hairCtx, hairMasks);
  drawHeadwear(raster, spec, ramps, f);

  // A headscarf or hood casts into the face it frames — one quiet step of
  // shadow where cloth meets skin, exactly the reference veil's effect.
  if (spec.headwear && spec.headwear.kind !== 'none' && s.t.contactShade >= 2) {
    for (let y = s.crownY; y <= s.chinY + 4; y += 1) {
      for (const dir of [-1, 1] as const) {
        // Walk in from the outside of the face toward its center; the first
        // skin pixel bordering headwear takes the cast.
        const from = s.headCx - dir * (s.headRx + 6);
        for (let step = 0; step <= s.headRx + 6; step += 1) {
          const x = from + dir * step;
          const m = raster.matAt(x, y);
          if (m === MAT.SKIN) {
            const n1 = raster.matAt(x - dir, y);
            const n2 = raster.matAt(x - dir * 2, y);
            if (n1 === MAT.HEADWEAR || n2 === MAT.HEADWEAR) {
              raster.shift(x, y, 1, ramps.book);
              raster.shift(x + dir, y, 1, ramps.book);
              if (s.t.contactShade >= 5) raster.shift(x + dir * 2, y, 1, ramps.book);
            }
            break;
          }
          if (m !== MAT.EMPTY && m !== MAT.HEADWEAR && m !== MAT.HAIR) break;
        }
      }
    }
  }

  for (const piece of spec.jewelry) {
    if (piece.type === 'necklace' || piece.type === 'chain') {
      // A strand that drapes: paired links stepping down toward the center.
      for (let x = s.cx - 10; x <= s.cx + 10; x += 3) {
        const sag = Math.abs(x - s.cx) <= 4 ? 2 : Math.abs(x - s.cx) <= 7 ? 1 : 0;
        raster.set(x, s.shoulderY + 6 + sag, ramps.metal.steps[2], MAT.METAL, 2);
        raster.set(x + 1, s.shoulderY + 6 + sag, ramps.metal.steps[3], MAT.METAL, 3);
      }
    } else if (piece.type === 'earrings') {
      raster.set(s.cx - s.headRx, f.headCy + 8, ramps.gem.steps[2], MAT.GEM, 2);
      raster.set(s.cx - s.headRx, f.headCy + 9, ramps.gem.steps[3], MAT.GEM, 3);
    }
  }

  drawHeldItem(raster, ramps, extras, fp.farArm === 'rest' ? [s.cx + s.shoulderHalf - 4, s.handY] : handRight);

  if (fp.bend > 0) applyBend(raster, fp.bend, s);
  if (fp.breathe) applyBreath(raster, s.waistY);
  applyLeanShear(raster, s.t.lean, s.crownY, s.floorY);
  smoothSilhouette(raster);
  groundBounce(raster, ramps.book);
  edgeAccents(raster, ramps, s.t.rim);
  if (s.t.outline >= 2) interiorOutline(raster, ramps, s.t.inkSoft);
  if (s.t.outline >= 1) paintInk(raster, ramps, s.cx, s.t.outline, s.t.inkSoft);
  return raster;
}

export interface CompiledSprite {
  /** Lazily compiles and caches the requested frame. */
  frame(id: FrameId): Raster;
  seed: number;
}

function rotateFallen(stand: Raster): Raster {
  const out = new Raster(SPRITE_H, SPRITE_W);
  for (let y = 0; y < stand.height; y += 1) {
    for (let x = 0; x < stand.width; x += 1) {
      const si = y * stand.width + x;
      if (stand.data[si * 4 + 3] === 0) continue;
      const tx = stand.height - 1 - y;
      const ty = x;
      const ti = ty * out.width + tx;
      out.data[ti * 4] = stand.data[si * 4];
      out.data[ti * 4 + 1] = stand.data[si * 4 + 1];
      out.data[ti * 4 + 2] = stand.data[si * 4 + 2];
      out.data[ti * 4 + 3] = stand.data[si * 4 + 3];
      out.mat[ti] = stand.mat[si];
      out.shade[ti] = stand.shade[si];
    }
  }
  return out;
}

export function compileSprite(source: SpriteSource): CompiledSprite {
  const ramps = buildPortraitRamps(source.spec);
  const cache = new Map<FrameId, Raster>();
  const frame = (id: FrameId): Raster => {
    const hit = cache.get(id);
    if (hit) return hit;
    const raster = id === 'fallen'
      ? rotateFallen(frame('stand'))
      : compilePose(source, ramps, FRAME_POSES[id]);
    cache.set(id, raster);
    return raster;
  };
  return { frame, seed: source.spec.seed };
}
