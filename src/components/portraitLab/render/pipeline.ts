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

import { buildRamp, RampOptions } from '../core/color';
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
  clipHairUnderCovering, computeHairMasks, drawFacialHair, drawHairBack, drawHairFront,
  drawHairOverShoulder, HairMasks,
} from '../art/hair';
import { drawGarment } from '../art/garments';
import { coveringSilhouette, drawHeadwear } from '../art/headwear';
import { drawAilments, drawFaceTraits, drawGlasses, drawJewelry, drawMarkings, GlintSite } from '../art/details';
import { RenderContext } from './context';

export interface CompiledPortrait {
  size: number;
  spec: PortraitSpec;
  anatomy: Anatomy;
  ramps: PortraitRamps;
  book: RampBook;
  base: Raster;
  eyePaints: PaintTable;
  /** A second eye paint table for a mismatched iris. Null when the eyes match. */
  altEyePaints: PaintTable | null;
  mouthPaints: PaintTable;
  skinPaints: PaintTable;
  hair: HairMasks;
  headMask: Mask;
  /** Set when hair falls past the jaw, enabling the per-frame sway. */
  sway: { top: number; withoutHair: Raster } | null;
  /**
   * The highlight pixels of any specular jewellery, in draw order along each
   * piece. Empty for the majority of personas, who wear nothing that catches.
   */
  glints: GlintSite[];
}

/**
 * The iris response, kept here as well as in `palette.ts` so a second iris can
 * be built without the whole ramp book. High contrast and high chroma: an iris
 * is four pixels across and has to carry a colour in them.
 */
const IRIS_RAMP: RampOptions = { contrast: 1.45, shift: 0.32, saturation: 1.22 };

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
  // Kept so a tilted head has something to leave behind it. See `applyTilt`.
  const backdrop = new Raster(CANVAS, CANVAS);
  backdrop.copyFrom(base);

  const hair = computeHairMasks(context);
  // Ask the covering for its silhouette before any hair goes down, so the hair
  // can be cut to fit under it rather than sprouting out of the top of it.
  const covering = coveringSilhouette(context);
  if (covering) clipHairUnderCovering(hair, covering, CANVAS);
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
    centerX: anatomy.faceX + anatomy.asymmetry.noseLean,
    baseY: anatomy.noseBaseY,
    ageLines: spec.ageLines,
  });
  if (spec.ageLines > 0.4) {
    for (const side of [-1, 1] as const) {
      drawNasolabialFold(base, ramps.book, anatomy.faceX, anatomy.noseBaseY - 2, side, spec.ageLines);
    }
  }
  drawAgeLines(context, head);
  drawMarkings(context, hair.hairlineY);
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
  drawHeadwear(context, hair.hairlineY);
  drawFacialHair(context, head);
  const glints: GlintSite[] = [];
  drawJewelry(context, glints);
  drawGlasses(context);

  // Last, so the shear carries everything the head is wearing with it, and
  // first of the finishing passes, so the outline traces where the head ended
  // up rather than where it started.
  applyTilt(base, backdrop, anatomy, spec.pose.tilt);

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
    altEyePaints: spec.traits.heterochromia
      ? makeEyePaints({ ...ramps, iris: buildRamp(spec.traits.heterochromia, IRIS_RAMP) })
      : null,
    mouthPaints: makeMouthPaints(ramps),
    skinPaints,
    hair,
    headMask: head,
    sway,
    glints,
  };
}

// ---------------------------------------------------------------------------
// Tilt
// ---------------------------------------------------------------------------

/**
 * How far a given row has been carried sideways by the head's tilt.
 *
 * Exported because the per-frame features are drawn *after* the shear and would
 * otherwise land on a head that is no longer under them. Each of them occupies
 * one narrow band of rows, so one offset per feature is enough — there is no
 * need to shear the eyes themselves at 96 pixels.
 */
export function tiltAt(anatomy: Anatomy, tilt: number, y: number): number {
  if (tilt === 0) return 0;
  const pivotY = anatomy.chinY + 6;
  if (y >= pivotY) return 0;
  return Math.round(tilt * (pivotY - y) / Math.max(1, pivotY - anatomy.headTop));
}

/**
 * Lean the head.
 *
 * A row-by-row horizontal shear about a pivot down in the neck, applied to the
 * finished head so that hair, hat, jewellery and paint all come with it — the
 * alternative, teaching nine drawing modules to take an angle, would put the
 * same rotation in nine places and get it slightly wrong in three of them.
 *
 * Only the foreground moves. The backdrop is a dithered gradient, and shearing
 * it along with the head drags a visible staircase through the halo behind the
 * ear; so each row is first restored from the backdrop as it was drawn, and
 * then the head's own pixels are laid back down displaced.
 */
function applyTilt(base: Raster, backdrop: Raster, anatomy: Anatomy, tilt: number): void {
  if (tilt === 0) return;
  const size = base.width;
  const pivotY = anatomy.chinY + 6;

  for (let y = 0; y < Math.min(pivotY, size); y += 1) {
    const dx = tiltAt(anatomy, tilt, y);
    if (dx === 0) continue;

    // Lift this row's foreground before the row is wiped.
    const kept: Array<{ x: number; r: number; g: number; b: number; mat: number; shade: number }> = [];
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      if (base.mat[i] === MAT.BG || base.data[i * 4 + 3] === 0) continue;
      kept.push({
        x,
        r: base.data[i * 4], g: base.data[i * 4 + 1], b: base.data[i * 4 + 2],
        mat: base.mat[i], shade: base.shade[i],
      });
    }
    if (!kept.length) continue;

    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      base.data[i * 4] = backdrop.data[i * 4];
      base.data[i * 4 + 1] = backdrop.data[i * 4 + 1];
      base.data[i * 4 + 2] = backdrop.data[i * 4 + 2];
      base.data[i * 4 + 3] = backdrop.data[i * 4 + 3];
      base.mat[i] = backdrop.mat[i];
      base.shade[i] = backdrop.shade[i];
    }

    for (const pixel of kept) {
      const x = pixel.x + dx;
      if (x < 0 || x >= size) continue;
      const i = y * size + x;
      base.data[i * 4] = pixel.r;
      base.data[i * 4 + 1] = pixel.g;
      base.data[i * 4 + 2] = pixel.b;
      base.data[i * 4 + 3] = 255;
      base.mat[i] = pixel.mat;
      base.shade[i] = pixel.shade;
    }
  }
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
  /**
   * Where the catch of light has reached along a piece of jewellery, or -1 when
   * nothing is catching — which is most of the time. See `glintSweep`.
   */
  glint: number;
}

export const RESTING_FRAME: FrameState = {
  expression: 'neutral',
  blink: 'none',
  gazeX: 0,
  gazeY: 0,
  sway: 0,
  glint: -1,
};

/** How much of the piece the travelling catch covers at any instant. */
const GLINT_WIDTH = 0.3;

/**
 * Run the catch of light along whatever the persona is wearing.
 *
 * Cheap by construction. The jewellery is drawn once, into the compiled base,
 * and what survives to here is a handful of coordinates — the pixels that were
 * already the highlight of a bead. Lighting them is a few writes per frame
 * against the 9,216 the rest of the loop is already doing, so a portrait with a
 * necklace costs no more to animate than one without.
 *
 * Guarded on the material at the target pixel rather than trusting the
 * recorded coordinate: hair sways over the collarbone, and a highlight painted
 * onto hair that has drifted across a necklace is a firefly behind somebody's
 * shoulder.
 */
function applyGlint(compiled: CompiledPortrait, position: number, target: Raster): void {
  if (position < -GLINT_WIDTH || !compiled.glints.length) return;
  const { anatomy, spec, size } = compiled;

  for (const site of compiled.glints) {
    const distance = Math.abs(site.along - position);
    if (distance >= GLINT_WIDTH) continue;
    // Smoothstep, so a bead swells and fades rather than switching on. A linear
    // ramp at this size reads as a flicker.
    const t = 1 - distance / GLINT_WIDTH;
    const amount = t * t * (3 - 2 * t) * 0.92;

    const x = site.x + tiltAt(anatomy, spec.pose.tilt, site.y);
    if (x < 0 || x >= size || site.y < 0 || site.y >= size) continue;
    const i = site.y * size + x;
    if (target.mat[i] !== MAT.METAL && target.mat[i] !== MAT.GEM) continue;

    const o = i * 4;
    target.data[o] += (site.peak.r - target.data[o]) * amount;
    target.data[o + 1] += (site.peak.g - target.data[o + 1]) * amount;
    target.data[o + 2] += (site.peak.b - target.data[o + 2]) * amount;
  }
}

export function renderFrame(
  compiled: CompiledPortrait,
  state: FrameState,
  target: Raster
): void {
  const { base, anatomy, spec, ramps, book, eyePaints, altEyePaints, mouthPaints, skinPaints } = compiled;
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
      centerX: anatomy.faceX + side * anatomy.eyeDX + tiltAt(anatomy, spec.pose.tilt, anatomy.browY),
      baseY: anatomy.browY + anatomy.asymmetry.browY[side === -1 ? 0 : 1]
        + Math.round(pose.browLift - asymmetric),
      side,
      length: Math.round(anatomy.eyeDX * 1.18),
      seed: spec.seed ^ (side === -1 ? 0x11 : 0x22),
      innerTilt: pose.innerTilt,
      ageLines: spec.ageLines,
    });
  }
  drawGlabellaLines(target, book, anatomy.faceX + tiltAt(anatomy, spec.pose.tilt, anatomy.browY), anatomy.browY - 3, pose.glabella + spec.ageLines * 0.3);

  // --- eyes ----------------------------------------------------------------
  const eyeState: EyeState =
    state.blink === 'closed' ? 'closed' : state.blink === 'half' ? 'half' : pose.eyes;

  for (const side of [-1, 1] as const) {
    // A divergent eye turns outward while the other holds the viewer. Two
    // pixels, which does not sound like much and is in fact the entire
    // difference — the eyes are four pixels of iris each, so moving one of them
    // by two is moving it half its own width.
    const wall = spec.traits.wallEye === side ? side * 2 : 0;
    drawEye({
      raster: target,
      book,
      // The second iris colour, on the sitter's left. Built alongside the first
      // at compile time, because a ramp is eight colours resolved from a hex
      // and doing that per frame would put it in the blink path.
      paints: side === 1 && altEyePaints ? altEyePaints : eyePaints,
      shape: spec.eyeShape,
      state: eyeState,
      centerX: anatomy.faceX + side * anatomy.eyeDX + tiltAt(anatomy, spec.pose.tilt, anatomy.eyeY),
      centerY: anatomy.eyeY + anatomy.asymmetry.eyeY[side === -1 ? 0 : 1],
      side,
      gazeX: state.gazeX + wall,
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
    centerX: anatomy.faceX + anatomy.asymmetry.mouthLean + tiltAt(anatomy, spec.pose.tilt, anatomy.mouthY),
    y: anatomy.mouthY,
    ageThinning: spec.ageLines,
    toothless: spec.traits.toothless,
    dental: spec.dental,
  });

  const smiling = state.expression === 'smile' || state.expression === 'grin' || state.expression === 'content';
  if (smiling) {
    const width = spec.lipShape === 'wide' ? 10 : 8;
    const cx = anatomy.faceX + tiltAt(anatomy, spec.pose.tilt, anatomy.mouthY);
    drawDimple(target, book, cx - width, anatomy.mouthY + 1);
    drawDimple(target, book, cx + width, anatomy.mouthY + 1);
  }

  // Last, and after the sway in particular: hair that has drifted across the
  // collarbone has to be able to cover a bead, not be lit by it.
  applyGlint(compiled, state.glint, target);
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
