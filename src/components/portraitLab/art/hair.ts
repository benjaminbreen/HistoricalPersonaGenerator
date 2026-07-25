/**
 * portraitLab/art/hair.ts
 *
 * Hair is built as a silhouette rather than as strands. At 96px you are drawing
 * a *mass* with a lit side, a shadow side, and one specular arc following the
 * curve of the skull — the shine band is what sells hair in pixel art, and it
 * is the thing most procedural systems leave out entirely.
 *
 * Texture changes the edge, not the interior: straight hair has a clean
 * silhouette, wavy hair a rolling one, and coily and kinky hair a dense soft
 * halo whose highlight breaks into clusters instead of running as a ribbon.
 * Treating textured hair as "straight hair plus noise" is the usual failure,
 * and it is why so many generators render it as a helmet.
 */

import {
  applyContactShadow, ellipsoidShader, fillMask, MAT, Mask, makeMask,
  maskDilate, maskFromProfile, maskIntersect, maskSubtract, Raster,
} from '../core/raster';
import { makeNoise1D, makeRng, unit } from '../core/rng';
import { RenderContext } from '../render/context';
import { HairLength, HairTexture } from '../spec/types';

export interface HairMasks {
  /** Everything behind the head — drawn before the skull. */
  back: Mask;
  /** Everything in front — the cap, the fringe, the strands over the temples. */
  front: Mask;
  /** Long hair past the jaw, which lies *over* the garment rather than under. */
  overShoulder: Mask;
  /** Where the hairline crosses the forehead, for headwear to sit against. */
  hairlineY: number;
}

interface LengthProfile {
  /** How far the hair stands off the skull. */
  puff: number;
  /** How far the crown rises above the skull. */
  crown: number;
  /** Bottom of the hair mass, as a y coordinate. */
  bottom: (context: RenderContext) => number;
  /** Half width at the bottom, if the hair falls past the jaw. */
  fallWidth: number;
}

const LENGTHS: Record<HairLength, LengthProfile> = {
  bald: { puff: 0.4, crown: 0, bottom: c => c.anatomy.earTopY, fallWidth: 0 },
  very_short: { puff: 1.4, crown: 1, bottom: c => c.anatomy.earTopY + 2, fallWidth: 0 },
  short: { puff: 2.2, crown: 2, bottom: c => c.anatomy.earBottomY, fallWidth: 0 },
  medium: { puff: 2.8, crown: 3, bottom: c => c.anatomy.chinY + 4, fallWidth: 0.92 },
  long: { puff: 3.2, crown: 3, bottom: c => c.anatomy.size, fallWidth: 1.06 },
  very_long: { puff: 3.6, crown: 4, bottom: c => c.anatomy.size, fallWidth: 1.2 },
};

function edgeJitter(texture: HairTexture, seed: number): (t: number, side: -1 | 1) => number {
  const noise = makeNoise1D(seed);
  switch (texture) {
    case 'wavy':
      return (t, side) => Math.sin(t * 11 + (side === 1 ? 1.7 : 0)) * 1.1 + noise(t * 6) * 0.5;
    case 'curly':
      return (t, side) => noise(t * 13 + (side === 1 ? 30 : 0)) * 1.9 + 0.6;
    case 'coily':
      return (t, side) => noise(t * 17 + (side === 1 ? 50 : 0)) * 1.1 + 1.6;
    case 'kinky':
      return (t, side) => noise(t * 21 + (side === 1 ? 70 : 0)) * 1.0 + 2.1;
    default:
      return (t, side) => noise(t * 4 + (side === 1 ? 12 : 0)) * 0.35;
  }
}

/**
 * The hairline. It dips lower over the temples than at the centre, which is why
 * a straight horizontal hairline always looks like a wig — and recession eats
 * into it from the temples inward, not from the front.
 */
function hairlineAt(context: RenderContext, dx: number): number {
  const { anatomy, spec } = context;
  const t = Math.min(1, Math.abs(dx) / Math.max(1, anatomy.headHalfWidth));
  const base = anatomy.browY - 8 + spec.recession * 4;
  const templeDip = 3.4 * t * t;
  const recessionBump = spec.recession * 8 * Math.exp(-((t - 0.66) ** 2) / 0.09);
  // A slight widow's peak keeps the centre from reading as a straight cut.
  const peak = Math.exp(-(t ** 2) / 0.03) * 0.9;
  return base + templeDip - recessionBump + peak;
}

export function computeHairMasks(context: RenderContext): HairMasks {
  const { spec, anatomy } = context;
  const { size, centerX } = anatomy;
  const profile = LENGTHS[spec.hairLength] || LENGTHS.short;
  const hairlineY = Math.round(hairlineAt(context, 0));

  if (spec.hairLength === 'bald' && spec.recession > 0.85) {
    const empty = makeMask(size, size);
    return { back: empty, front: makeMask(size, size), overShoulder: makeMask(size, size), hairlineY };
  }

  const jitter = edgeJitter(spec.hairTexture, spec.seed ^ 0x51ed);
  const top = anatomy.headTop - profile.crown;
  const bottom = profile.bottom(context);
  const span = bottom - top;
  const headSpan = anatomy.chinY - anatomy.headTop;

  // Reuse the skull profile so the hair genuinely sits on this head, then
  // inflate it by the puff and let it fall past the jaw if it is long enough.
  const keys: Array<[number, number]> = [];
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    const y = top + t * span;
    const headT = (y - anatomy.headTop) / headSpan;
    let half: number;
    if (headT <= 1) {
      const clamped = Math.max(0, Math.min(1, headT));
      const source = anatomy.headProfile;
      let idx = 0;
      while (idx < source.length - 2 && source[idx + 1][0] < clamped) idx += 1;
      const [t0, h0] = source[idx];
      const [t1, h1] = source[idx + 1];
      const u = t1 === t0 ? 0 : (clamped - t0) / (t1 - t0);
      half = h0 + (h1 - h0) * u + profile.puff;
      // Above the crown the hair rounds over the top of the skull.
      if (headT < 0) half = anatomy.headHalfWidth * 0.55;
    } else {
      // Past the jaw: hair falls, widening slightly toward the shoulders.
      const fall = Math.min(1, (headT - 1) / 0.6);
      half = anatomy.headHalfWidth * (0.94 + fall * (profile.fallWidth - 0.6));
    }
    keys.push([t, Math.max(1, half)]);
  }

  // Hair that ends inside the frame has to round off. Without this, a
  // shoulder-length cut ends in a flat horizontal slab across the chest.
  if (bottom < size - 3) {
    for (const key of keys) {
      if (key[0] <= 0.7) continue;
      const u = (key[0] - 0.7) / 0.3;
      key[1] *= 1 - u * u * 0.78;
    }
  }

  let silhouette = maskFromProfile(size, size, {
    keys,
    top,
    bottom,
    centerX,
    jitter,
  });

  // Textured hair gets its volume from a soft, dense halo rather than a hard
  // outline; dilating and then eroding stochastically produces that read.
  if (spec.hairTexture === 'coily' || spec.hairTexture === 'kinky') {
    const puffed = maskDilate(silhouette, size, size, true);
    const rng = makeRng(spec.seed ^ 0x9a71);
    for (let i = 0; i < puffed.length; i += 1) {
      if (puffed[i] && !silhouette[i] && rng() > 0.62) puffed[i] = 0;
    }
    silhouette = puffed;
  }

  // Carve out the face. Everything below the hairline and inside the skull is
  // skin, except at the very edges where sideburns and framing strands survive.
  const faceOpening = makeMask(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - centerX;
      if (y + 0.5 < hairlineAt(context, dx)) continue;
      const t = Math.abs(dx) / Math.max(1, anatomy.headHalfWidth);
      // Sideburn corridor: hair keeps a strip against the silhouette edge.
      const sideburn = spec.hairLength === 'bald' ? 1 : 0.9;
      if (t > sideburn) continue;
      if (y > anatomy.chinY) continue;
      faceOpening[y * size + x] = 1;
    }
  }

  const hair = maskSubtract(silhouette, faceOpening);

  // Below the jaw, hair parts around the neck and falls to either side rather
  // than swallowing the chest.
  //
  // The parting has to be clamped against the hair's own outer edge. An
  // unbounded opening curve eventually overtakes the silhouette and leaves a
  // pair of one-pixel crescents floating at the shoulders — which read as a
  // strange little cape rather than as hair.
  const MIN_FALL_WIDTH = 7;
  for (let y = Math.max(0, anatomy.chinY - 3); y < size; y += 1) {
    let outer = 0;
    for (let x = 0; x < size; x += 1) {
      if (!hair[y * size + x]) continue;
      outer = Math.max(outer, Math.abs(x + 0.5 - centerX));
    }
    const t = Math.max(0, (y - (anatomy.chinY - 3)) / 26);
    const curve = anatomy.neckHalf + 1 + t * 9;
    // Two rules, and the order matters. Keep a solid fall on each side where
    // the hair is wide enough to have one — but never let the parting close in
    // past the neck, or a shoulder-length cut ends with its two tips meeting
    // across the throat and reading as a collar.
    const open = Math.max(
      anatomy.neckHalf + 1,
      outer > MIN_FALL_WIDTH ? Math.min(curve, outer - MIN_FALL_WIDTH) : curve
    );

    for (let x = 0; x < size; x += 1) {
      if (Math.abs(x + 0.5 - centerX) <= open) hair[y * size + x] = 0;
    }
  }

  // Three layers, because hair is not simply in front of or behind a head:
  // it sits on the skull, spills out beside it, and — if it is long enough —
  // falls forward over the shoulders on top of the clothing.
  const front = makeMask(size, size);
  const back = makeMask(size, size);
  const overShoulder = makeMask(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      if (!hair[i]) continue;
      if (y >= anatomy.chinY) {
        overShoulder[i] = 1;
        continue;
      }
      const dx = Math.abs(x + 0.5 - centerX);
      if (dx < anatomy.headHalfWidth + 2) front[i] = 1;
      else back[i] = 1;
    }
  }

  return { back, front, overShoulder, hairlineY };
}

function fillHair(context: RenderContext, mask: Mask): void {
  const { raster, ramps, anatomy, spec } = context;
  const shader = ellipsoidShader(
    anatomy.centerX - 2,
    anatomy.headTop + anatomy.headHeight * 0.3,
    anatomy.headHalfWidth * 1.18,
    anatomy.headHeight * 0.62,
    1,
    { base: 3, gain: 7.2, bounce: 0.18, neutral: 0.8 }
  );
  const dither = spec.hairTexture === 'coily' || spec.hairTexture === 'kinky' ? 0.6 : 0.25;
  fillMask(raster, mask, ramps.hair, MAT.HAIR, (x, y) => {
    // Hair falling past the jaw loses some light — but only about a step, or
    // ginger hair turns brown on the way down and stops reading as the same
    // head of hair.
    const drop = y > anatomy.chinY ? Math.min(1.1, (y - anatomy.chinY) / 18) : 0;
    return shader(x, y) + drop;
  }, { dither });
}

/**
 * The shine. A single arc riding the curve of the skull on the lit side, broken
 * into clusters for textured hair. Nothing else does as much for hair at this
 * resolution.
 */
function drawSheen(context: RenderContext, mask: Mask): void {
  const { raster, ramps, anatomy, spec } = context;
  const { size, centerX } = anatomy;
  if (spec.hairLength === 'bald') return;

  const noise = makeNoise1D(spec.seed ^ 0x2f19);
  const clustered = spec.hairTexture === 'coily' || spec.hairTexture === 'kinky' || spec.hairTexture === 'curly';
  const startX = Math.round(centerX - anatomy.headHalfWidth * 0.92);
  const endX = Math.round(centerX + anatomy.headHalfWidth * 0.15);

  for (let x = startX; x <= endX; x += 1) {
    // Find the top of the hair mass in this column.
    let topY = -1;
    for (let y = 0; y < size; y += 1) {
      if (mask[y * size + x]) { topY = y; break; }
    }
    if (topY < 0) continue;

    const t = (x - startX) / Math.max(1, endX - startX);
    // The band dips as it wraps around the skull.
    const depth = 2 + Math.round(Math.sin(t * Math.PI) * 2.4 + noise(x * 0.5) * 0.8);
    const y = topY + depth;
    if (!mask[y * size + x]) continue;

    if (clustered && noise(x * 0.9 + 20) < 0.05) continue;
    if (clustered && (x - startX) % 3 === 2) continue;

    raster.set(x, y, ramps.hair.steps[1], MAT.HAIR, 1);
    if (!clustered && mask[(y + 1) * size + x] && Math.sin(t * Math.PI) > 0.55) {
      raster.set(x, y + 1, ramps.hair.steps[2], MAT.HAIR, 2);
    }
    if (clustered && mask[(y + 1) * size + x] && noise(x * 1.3) > 0.4) {
      raster.set(x, y + 1, ramps.hair.steps[2], MAT.HAIR, 2);
    }
  }
}

/** Strand separations — a few dark breaks so the mass is not a solid blob. */
function drawStrands(context: RenderContext, mask: Mask): void {
  const { raster, ramps, anatomy, spec } = context;
  const { size, centerX } = anatomy;
  if (spec.hairLength === 'bald' || spec.hairLength === 'very_short') return;

  const rng = makeRng(spec.seed ^ 0x7c3d);
  const count = spec.hairLength === 'long' || spec.hairLength === 'very_long' ? 9 : 5;
  const wavy = spec.hairTexture === 'wavy' || spec.hairTexture === 'curly';

  for (let i = 0; i < count; i += 1) {
    const x0 = Math.round(centerX + (rng() * 2 - 1) * anatomy.headHalfWidth * 1.15);
    const y0 = Math.round(anatomy.headTop + rng() * anatomy.headHeight * 0.55);
    const length = 4 + Math.floor(rng() * 10);
    for (let s = 0; s < length; s += 1) {
      const x = Math.round(x0 + (wavy ? Math.sin((y0 + s) * 0.55 + i) * 1.4 : (x0 - centerX) * 0.012 * s));
      const y = y0 + s;
      if (x < 0 || y < 0 || x >= size || y >= size) break;
      if (!mask[y * size + x]) continue;
      raster.shift(x, y, 1, context.book);
    }
  }
}

export function drawHairBack(context: RenderContext, masks: HairMasks): void {
  if (context.spec.hairLength === 'bald' && context.spec.recession > 0.85) return;
  fillHair(context, masks.back);
}

/** Long hair falling forward over the clothing. Drawn after the garment. */
export function drawHairOverShoulder(context: RenderContext, masks: HairMasks): void {
  const { spec } = context;
  if (spec.hairLength === 'bald') return;
  fillHair(context, masks.overShoulder);
  drawStrands(context, masks.overShoulder);
  applyContactShadow(context.raster, masks.overShoulder, context.book, { dx: 1, dy: 1, strength: 1, depth: 1 });
}

export function drawHairFront(context: RenderContext, masks: HairMasks): void {
  const { spec } = context;
  if (spec.hairLength === 'bald' && spec.recession > 0.85) return;
  fillHair(context, masks.front);
  drawSheen(context, masks.front);
  drawStrands(context, masks.front);
  // Hair throws a real shadow onto the forehead. This is the single cheapest
  // way to stop hair looking like a decal pasted on the skull.
  applyContactShadow(context.raster, masks.front, context.book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  applyContactShadow(context.raster, masks.front, context.book, { dx: 1, dy: 1, strength: 1, depth: 1 });
}

// ---------------------------------------------------------------------------
// Facial hair
// ---------------------------------------------------------------------------

interface BeardRegions {
  mustache: boolean;
  chin: boolean;
  jaw: boolean;
  sideburns: boolean;
  /** How far the beard hangs below the chin, in pixels. */
  hang: number;
  soulPatch: boolean;
  forked: boolean;
  handlebar: boolean;
}

function beardRegions(style: string): BeardRegions {
  const base: BeardRegions = {
    mustache: false, chin: false, jaw: false, sideburns: false,
    hang: 0, soulPatch: false, forked: false, handlebar: false,
  };
  switch (style) {
    case 'full_beard': return { ...base, mustache: true, chin: true, jaw: true, sideburns: true, hang: 6 };
    case 'verdi': return { ...base, mustache: true, chin: true, jaw: true, sideburns: true, hang: 4 };
    case 'forked_beard': return { ...base, mustache: true, chin: true, jaw: true, sideburns: true, hang: 8, forked: true };
    case 'chin_curtain': return { ...base, chin: true, jaw: true, sideburns: true, hang: 3 };
    case 'mutton_chops': return { ...base, jaw: true, sideburns: true };
    case 'goatee': return { ...base, mustache: true, chin: true, hang: 3 };
    case 'van_dyke': return { ...base, mustache: true, chin: true, hang: 2 };
    case 'imperial': return { ...base, mustache: true, handlebar: true };
    case 'handlebar': return { ...base, mustache: true, handlebar: true };
    case 'mustache': return { ...base, mustache: true };
    case 'soul_patch': return { ...base, soulPatch: true };
    case 'stubble': return { ...base, mustache: true, chin: true, jaw: true, sideburns: true };
    default: return { ...base, chin: true, jaw: true };
  }
}

/**
 * The line where a beard starts. It rides high near the ears and dips to just
 * above the corners of the mouth in the middle — a horizontal cut-off, which is
 * the naive implementation, gives every bearded persona a rectangular bib.
 */
function beardLineAt(context: RenderContext, dx: number): number {
  const { anatomy } = context;
  const u = Math.min(1, Math.abs(dx) / Math.max(1, anatomy.headHalfWidth));
  const nearEar = anatomy.cheekY + 1;
  const nearMouth = anatomy.mouthY - 2;
  return nearMouth + (nearEar - nearMouth) * Math.pow(u, 0.75);
}

export function drawFacialHair(context: RenderContext, headMask: Mask): void {
  const { raster, spec, anatomy, ramps, book } = context;
  if (!spec.facialHair) return;

  const { size, centerX } = anatomy;
  const regions = beardRegions(spec.facialHair.style);
  const stubbleOnly = spec.facialHair.style === 'stubble';
  const density =
    spec.facialHair.thickness === 'sparse' ? 0.55 :
    spec.facialHair.thickness === 'thick' ? 1 : 0.82;

  const mask = makeMask(size, size);
  const put = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    mask[y * size + x] = 1;
  };
  const onHead = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < size && y < size && headMask[y * size + x] === 1;

  if (regions.jaw) {
    for (let y = anatomy.cheekY - 2; y <= anatomy.chinY; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!onHead(x, y)) continue;
        if (y + 0.5 < beardLineAt(context, x + 0.5 - centerX)) continue;
        put(x, y);
      }
    }
  }

  // Below the jaw the beard hangs free of the head silhouette, so it needs its
  // own taper — clamped, or it spreads into a slab across the shoulders.
  if (regions.hang > 0) {
    for (let y = anatomy.chinY + 1; y <= anatomy.chinY + regions.hang; y += 1) {
      const t = (y - anatomy.chinY) / Math.max(1, regions.hang);
      const half = (regions.chin ? 8 : 10) * (1 - t * 0.62);
      for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
        if (regions.forked && t > 0.55 && Math.abs(x - centerX) < 2) continue;
        put(x, y);
      }
    }
  }

  if (regions.sideburns) {
    for (const side of [-1, 1] as const) {
      for (let y = anatomy.earTopY + 3; y <= anatomy.cheekY + 1; y += 1) {
        for (let d = 0; d < 3; d += 1) {
          const x = Math.round(centerX + side * (anatomy.headHalfWidth - d));
          if (onHead(x, y)) put(x, y);
        }
      }
    }
  }

  if (regions.chin && !regions.jaw) {
    // A goatee is a small patch under the lower lip, not a bib.
    for (let y = anatomy.mouthY + 3; y <= anatomy.chinY + regions.hang; y += 1) {
      const t = (y - anatomy.mouthY - 3) / Math.max(1, anatomy.chinY + regions.hang - anatomy.mouthY - 3);
      const half = 5 - t * 1.6;
      for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) put(x, y);
    }
  }

  // The lips always show through. Carve them out before the moustache goes on.
  for (let y = anatomy.mouthY - 4; y <= anatomy.mouthY + 4; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5 - centerX) / 8;
      const dy = (y + 0.5 - anatomy.mouthY) / 4;
      if (dx * dx + dy * dy <= 1) mask[y * size + x] = 0;
    }
  }

  if (regions.mustache) {
    const top = anatomy.mouthY - 6;
    const rows = spec.facialHair.thickness === 'thick' ? 4 : 3;
    for (let i = 0; i < rows; i += 1) {
      const y = top + i;
      const half = 6 + i * 1.4;
      for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) put(x, y);
    }
    if (regions.handlebar) {
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < 4; i += 1) {
          put(Math.round(centerX + side * (9 + i)), top + 2 - Math.floor(i / 2));
        }
      }
    }
  }

  if (regions.soulPatch) {
    for (let y = anatomy.mouthY + 4; y <= anatomy.mouthY + 6; y += 1) {
      for (let x = centerX - 2; x <= centerX + 2; x += 1) put(x, y);
    }
  }

  // Stubble is a scatter, not a shape: dither it and let skin show through.
  if (stubbleOnly) {
    const rng = makeRng(spec.seed ^ 0x3311);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!mask[y * size + x]) continue;
        if (rng() > density * 0.42) continue;
        raster.blend(x, y, ramps.beard.steps[5], 0.34, MAT.SKIN, raster.shadeAt(x, y));
      }
    }
    return;
  }

  const shader = ellipsoidShader(
    centerX - 1,
    anatomy.chinY - 6,
    anatomy.headHalfWidth * 1.1,
    anatomy.headHeight * 0.42,
    1,
    { base: 3, gain: 6.6, bounce: 0.22 }
  );
  fillMask(raster, mask, ramps.beard, MAT.BEARD, shader, { dither: 0.5 });

  // Sparse beards let skin through at the edges.
  if (density < 0.8) {
    const rng = makeRng(spec.seed ^ 0x88b1);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!mask[y * size + x]) continue;
        const edge = !mask[y * size + x - 1] || !mask[y * size + x + 1] || !mask[(y - 1) * size + x];
        if (edge && rng() > density) raster.shift(x, y, -1, book);
      }
    }
  }

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
}
