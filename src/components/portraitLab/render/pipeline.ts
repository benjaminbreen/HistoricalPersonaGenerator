/**
 * portraitLab/render/pipeline.ts
 *
 * Two phases.
 *
 * `compilePortrait` draws everything that never changes — the background, the
 * head, hair, clothing, headwear, markings — once, into a cached raster. That
 * is the expensive part, a few milliseconds, and it happens on mount.
 *
 * `renderFrame` copies that cache and draws only the parts that move: brows,
 * eyes, and mouth. That is a memcpy plus a few hundred pixels, which is why
 * blinking and glancing around cost effectively nothing even with a wall of
 * portraits on screen.
 *
 * The trick that makes the split work is material-guarded stamps. The eyes draw
 * `onlyOver` skin, so a hood or a hat brim occludes them automatically, and the
 * mouth refuses to paint over a moustache — no explicit z-ordering required.
 */

import { applyOutline, applyRimLight, MAT, Mask, maskDilate, RampBook, Raster } from '../core/raster';
import { PaintTable, relativePaints } from '../core/stamp';
import { buildAnatomy, Anatomy, CANVAS } from '../spec/anatomy';
import { Expression, PortraitSpec } from '../spec/types';
import { buildPortraitRamps, PortraitRamps } from '../art/palette';
import { drawBackground } from '../art/background';
import { drawAgeLines, drawComplexion, drawHeadAndNeck } from '../art/face';
import { drawNasolabialFold, drawNose } from '../art/noses';
import { drawBrow, drawGlabellaLines } from '../art/brows';
import { drawEye, EyeState, makeEyePaints } from '../art/eyes';
import { drawDimple, drawMouth, makeMouthPaints } from '../art/mouths';
import {
  computeHairMasks, drawFacialHair, drawHairBack, drawHairFront,
  drawHairOverShoulder, HairMasks,
} from '../art/hair';
import { drawGarment } from '../art/garments';
import { drawHeadwear } from '../art/headwear';
import { drawAilments, drawFaceTraits, drawGlasses, drawJewelry, drawMarkings } from '../art/details';
import { RenderContext } from './context';

export interface CompiledPortrait {
  size: number;
  spec: PortraitSpec;
  anatomy: Anatomy;
  ramps: PortraitRamps;
  book: RampBook;
  base: Raster;
  eyePaints: PaintTable;
  mouthPaints: PaintTable;
  skinPaints: PaintTable;
  hair: HairMasks;
  headMask: Mask;
  /** Set when hair falls past the jaw, enabling the per-frame sway. */
  sway: { top: number; withoutHair: Raster } | null;
}

export function compilePortrait(spec: PortraitSpec): CompiledPortrait {
  const anatomy = buildAnatomy(spec);
  const ramps = buildPortraitRamps(spec);
  const base = new Raster(CANVAS, CANVAS);
  const skinPaints = relativePaints();

  const context: RenderContext = {
    raster: base,
    spec,
    anatomy,
    ramps,
    book: ramps.book,
    skin: skinPaints,
    seed: spec.seed,
  };

  drawBackground(context);

  const hair = computeHairMasks(context);
  drawHairBack(context, hair);

  const { head, ears } = drawHeadAndNeck(context);

  // Short hair is cut back around the ears. Without this the hair silhouette
  // swallows them and every close-cropped persona looks earless.
  if (spec.hairLength === 'short' || spec.hairLength === 'very_short' || spec.hairLength === 'bald') {
    const clearance = maskDilate(ears, CANVAS, CANVAS, true);
    for (let i = 0; i < hair.front.length; i += 1) {
      if (clearance[i]) hair.front[i] = 0;
    }
  }

  drawComplexion(context, head);
  drawNose({
    raster: base,
    book: ramps.book,
    paints: skinPaints,
    shape: spec.noseShape,
    centerX: anatomy.centerX + anatomy.asymmetry.noseLean,
    baseY: anatomy.noseBaseY,
    ageLines: spec.ageLines,
  });
  if (spec.ageLines > 0.4) {
    for (const side of [-1, 1] as const) {
      drawNasolabialFold(base, ramps.book, anatomy.centerX, anatomy.noseBaseY - 2, side, spec.ageLines);
    }
  }
  drawAgeLines(context, head);
  drawMarkings(context);
  drawAilments(context);
  drawFaceTraits(context);

  drawGarment(context);

  // Hair falling past the jaw lies over the clothing. Snapshot what is behind
  // it first, so the per-frame sway has something to reveal.
  let sway: CompiledPortrait['sway'] = null;
  const hasFallingHair = hair.overShoulder.some(v => v === 1);
  if (hasFallingHair) {
    const top = anatomy.chinY;
    const strip = new Raster(CANVAS, CANVAS - top);
    for (let y = top; y < CANVAS; y += 1) {
      for (let x = 0; x < CANVAS; x += 1) {
        const si = y * CANVAS + x;
        const ti = (y - top) * CANVAS + x;
        strip.data.set(base.data.subarray(si * 4, si * 4 + 4), ti * 4);
        strip.mat[ti] = base.mat[si];
        strip.shade[ti] = base.shade[si];
      }
    }
    sway = { top, withoutHair: strip };
  }

  drawHairOverShoulder(context, hair);
  drawHairFront(context, hair);
  drawHeadwear(context);
  drawFacialHair(context, head);
  drawJewelry(context);
  drawGlasses(context);

  applyRimLight(base, 1);
  applyOutline(base, ramps.book);

  return {
    size: CANVAS,
    spec,
    anatomy,
    ramps,
    book: ramps.book,
    base,
    eyePaints: makeEyePaints(ramps),
    mouthPaints: makeMouthPaints(ramps),
    skinPaints,
    hair,
    headMask: head,
    sway,
  };
}

// ---------------------------------------------------------------------------
// Expression
// ---------------------------------------------------------------------------

interface ExpressionPose {
  /** Negative raises the brow. */
  browLift: number;
  /** Positive raises the inner end (worry); negative lowers it (anger). */
  innerTilt: number;
  eyes: EyeState;
  glabella: number;
  /** One brow only, for a quizzical look. */
  browAsymmetry: number;
  dilation: number;
}

const NEUTRAL_POSE: ExpressionPose = {
  browLift: 0, innerTilt: 0, eyes: 'open', glabella: 0, browAsymmetry: 0, dilation: 0,
};

export function poseForExpression(expression: Expression): ExpressionPose {
  switch (expression) {
    case 'content': return { ...NEUTRAL_POSE, browLift: -0.4, eyes: 'open' };
    case 'smile': return { ...NEUTRAL_POSE, browLift: -0.6, eyes: 'squint' };
    case 'grin': return { ...NEUTRAL_POSE, browLift: -1, eyes: 'squint', dilation: 0.2 };
    case 'smirk': return { ...NEUTRAL_POSE, browLift: -0.4, innerTilt: -0.3, browAsymmetry: 1 };
    case 'sad': return { ...NEUTRAL_POSE, browLift: 0.3, innerTilt: 1.6, glabella: 0.4 };
    case 'concern': return { ...NEUTRAL_POSE, browLift: 0.2, innerTilt: 1.1, glabella: 0.35 };
    case 'scowl': return { ...NEUTRAL_POSE, browLift: 1, innerTilt: -1.5, glabella: 0.85 };
    case 'weary': return { ...NEUTRAL_POSE, browLift: 0.4, innerTilt: 0.5, eyes: 'half' };
    case 'guarded': return { ...NEUTRAL_POSE, browLift: 0.5, innerTilt: -0.4, glabella: 0.4 };
    case 'surprise': return { ...NEUTRAL_POSE, browLift: -2.4, eyes: 'wide', dilation: 0.8 };
    case 'thinking': return { ...NEUTRAL_POSE, browLift: -0.5, browAsymmetry: 1.6, glabella: 0.45 };
    case 'determined': return { ...NEUTRAL_POSE, browLift: 0.6, innerTilt: -0.9, glabella: 0.6 };
    default: return NEUTRAL_POSE;
  }
}

export interface FrameState {
  expression: Expression;
  /** Overrides the expression's own eye state — this is how blinking works. */
  blink: 'none' | 'half' | 'closed';
  gazeX: number;
  gazeY: number;
  /** 0..1 horizontal drift of hair falling past the jaw. */
  sway: number;
}

export const RESTING_FRAME: FrameState = {
  expression: 'neutral',
  blink: 'none',
  gazeX: 0,
  gazeY: 0,
  sway: 0,
};

export function renderFrame(
  compiled: CompiledPortrait,
  state: FrameState,
  target: Raster
): void {
  const { base, anatomy, spec, ramps, book, eyePaints, mouthPaints, skinPaints } = compiled;
  target.copyFrom(base);

  applySway(compiled, state.sway, target);

  const pose = poseForExpression(state.expression);

  // --- brows ---------------------------------------------------------------
  for (const side of [-1, 1] as const) {
    const asymmetric = side === 1 ? pose.browAsymmetry : 0;
    drawBrow({
      raster: target,
      book,
      ramps,
      shape: spec.browShape,
      thickness: spec.browThickness,
      centerX: anatomy.centerX + side * anatomy.eyeDX,
      baseY: anatomy.browY + anatomy.asymmetry.browY[side === -1 ? 0 : 1]
        + Math.round(pose.browLift - asymmetric),
      side,
      length: Math.round(anatomy.eyeDX * 1.18),
      seed: spec.seed ^ (side === -1 ? 0x11 : 0x22),
      innerTilt: pose.innerTilt,
      ageLines: spec.ageLines,
    });
  }
  drawGlabellaLines(target, book, anatomy.centerX, anatomy.browY - 3, pose.glabella + spec.ageLines * 0.3);

  // --- eyes ----------------------------------------------------------------
  const eyeState: EyeState =
    state.blink === 'closed' ? 'closed' : state.blink === 'half' ? 'half' : pose.eyes;

  for (const side of [-1, 1] as const) {
    drawEye({
      raster: target,
      book,
      paints: eyePaints,
      shape: spec.eyeShape,
      state: eyeState,
      centerX: anatomy.centerX + side * anatomy.eyeDX,
      centerY: anatomy.eyeY + anatomy.asymmetry.eyeY[side === -1 ? 0 : 1],
      side,
      gazeX: state.gazeX,
      gazeY: state.gazeY,
      eyelashes: spec.eyelashes,
      clouded: spec.traits.blind,
      dilation: pose.dilation,
      droop: spec.lidDroop,
    });
  }

  // --- mouth ---------------------------------------------------------------
  drawMouth({
    raster: target,
    book,
    paints: mouthPaints,
    expression: state.expression,
    lipShape: spec.lipShape,
    centerX: anatomy.centerX + anatomy.asymmetry.mouthLean,
    y: anatomy.mouthY,
    ageThinning: spec.ageLines,
    toothless: spec.traits.toothless,
  });

  const smiling = state.expression === 'smile' || state.expression === 'grin' || state.expression === 'content';
  if (smiling) {
    const width = spec.lipShape === 'wide' ? 10 : 8;
    drawDimple(target, book, anatomy.centerX - width, anatomy.mouthY + 1);
    drawDimple(target, book, anatomy.centerX + width, anatomy.mouthY + 1);
  }
}

/**
 * Slide hair that falls past the jaw sideways by a pixel, revealing what the
 * compile step recorded behind it. A very small motion, but it is the thing
 * that makes a portrait feel alive rather than merely animated.
 */
function applySway(compiled: CompiledPortrait, sway: number, target: Raster): void {
  if (!compiled.sway || sway === 0) return;
  const { top, withoutHair } = compiled.sway;
  const { base, size } = compiled;

  for (let y = top; y < size; y += 1) {
    const shift = Math.round(sway * Math.min(1, (y - top) / 10));
    if (shift === 0) continue;
    const stripRow = (y - top) * size;

    // Reveal the garment underneath, then lay the hair back down shifted.
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      if (base.mat[i] !== MAT.HAIR) continue;
      const si = stripRow + x;
      target.data[i * 4] = withoutHair.data[si * 4];
      target.data[i * 4 + 1] = withoutHair.data[si * 4 + 1];
      target.data[i * 4 + 2] = withoutHair.data[si * 4 + 2];
      target.data[i * 4 + 3] = withoutHair.data[si * 4 + 3];
      target.mat[i] = withoutHair.mat[si];
      target.shade[i] = withoutHair.shade[si];
    }
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      if (base.mat[i] !== MAT.HAIR) continue;
      const tx = x + shift;
      if (tx < 0 || tx >= size) continue;
      const ti = y * size + tx;
      target.data[ti * 4] = base.data[i * 4];
      target.data[ti * 4 + 1] = base.data[i * 4 + 1];
      target.data[ti * 4 + 2] = base.data[i * 4 + 2];
      target.data[ti * 4 + 3] = base.data[i * 4 + 3];
      target.mat[ti] = base.mat[i];
      target.shade[ti] = base.shade[i];
    }
  }
}

export function writeImageData(raster: Raster, imageData: ImageData): void {
  imageData.data.set(raster.data);
}
