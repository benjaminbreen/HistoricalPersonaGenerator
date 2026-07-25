/**
 * portraitLab/art/garments.ts
 *
 * Clothing is drawn as a silhouette plus a neckline, because at bust crop the
 * neckline *is* the garment — it is the only part a viewer sees, and it is what
 * distinguishes a Ming cross-collar robe from a London wool coat from a Sahel
 * narrow-strip robe.
 *
 * The five context packs treated in depth here are the ones the authenticity
 * service resolves with high confidence and good published references. Every
 * other pack falls through to the generic silhouette for its `garmentKind`,
 * which is correct-but-plain rather than confidently wrong — the same posture
 * portraitAuthenticityService takes with its own confidence ratings.
 */

import {
  applyContactShadow, ellipsoidShader, fillMask, MAT, Mask, makeMask,
  maskDilate, maskEllipse, maskFromProfile, maskIntersect, maskSubtract,
} from '../core/raster';
import { Ramp } from '../core/color';
import { makeNoise1D, makeRng } from '../core/rng';
import { RenderContext } from '../render/context';
import { GarmentKind } from '../spec/types';

export interface BodyMasks {
  body: Mask;
  neckline: Mask;
}

function shoulderMask(context: RenderContext): Mask {
  const { anatomy } = context;
  const { size } = anatomy;
  return maskFromProfile(size, size, {
    keys: [
      [0, anatomy.neckHalf + 2.5],
      [0.22, anatomy.shoulderHalf * 0.7],
      [0.5, anatomy.shoulderHalf * 0.92],
      [0.78, anatomy.shoulderHalf],
      [1, anatomy.shoulderHalf * 1.02],
    ],
    top: anatomy.shoulderTop,
    bottom: size + 5,
    centerX: anatomy.centerX,
  });
}

type NecklineShape = 'round' | 'wide' | 'square' | 'v' | 'cross' | 'high' | 'asymmetric';

function necklineMask(context: RenderContext, shape: NecklineShape): Mask {
  const { anatomy } = context;
  const { size, centerX } = anatomy;
  const top = anatomy.collarY - 8;
  const mask = makeMask(size, size);

  const put = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    mask[y * size + x] = 1;
  };

  switch (shape) {
    case 'high': {
      const e = maskEllipse(size, size, centerX, top + 4, anatomy.neckHalf + 1.5, 5);
      return e;
    }
    case 'wide': {
      const e = maskEllipse(size, size, centerX, top + 5, anatomy.neckHalf + 8, 7);
      return e;
    }
    case 'square': {
      for (let y = top; y < top + 11; y += 1) {
        for (let x = centerX - anatomy.neckHalf - 6; x <= centerX + anatomy.neckHalf + 6; x += 1) put(x, y);
      }
      return mask;
    }
    case 'v': {
      const depth = 13;
      for (let i = 0; i < depth; i += 1) {
        const half = (anatomy.neckHalf + 5) * (1 - i / depth);
        for (let x = centerX - half; x <= centerX + half; x += 1) put(Math.round(x), top + 2 + i);
      }
      return mask;
    }
    case 'cross': {
      // Two overlapping panels meeting at a point — the defining feature of
      // cross-collar East Asian robes and of a wrapped Sahel neckline.
      const depth = 12;
      for (let i = 0; i < depth; i += 1) {
        const half = (anatomy.neckHalf + 6) * (1 - i / depth) + 1;
        for (let x = centerX - half; x <= centerX + half * 0.65; x += 1) put(Math.round(x), top + 2 + i);
      }
      return mask;
    }
    case 'asymmetric': {
      for (let i = 0; i < 12; i += 1) {
        const left = centerX - anatomy.neckHalf - 6 + i * 0.4;
        const right = centerX + anatomy.neckHalf + 5 - i * 1.9;
        for (let x = left; x <= right; x += 1) put(Math.round(x), top + 2 + i);
      }
      return mask;
    }
    default: {
      return maskEllipse(size, size, centerX, top + 5, anatomy.neckHalf + 4, 6);
    }
  }
}

const NECKLINE_FOR_KIND: Record<GarmentKind, NecklineShape> = {
  tunic: 'round',
  robe: 'cross',
  gown: 'wide',
  doublet: 'high',
  work_shirt: 'v',
  wrapped_garment: 'asymmetric',
  jacket: 'v',
  bare: 'wide',
};

/**
 * Context packs that get bespoke treatment. Everything else falls through to
 * the generic silhouette for its garment kind.
 */
function necklineForContext(context: RenderContext): NecklineShape {
  const { spec } = context;
  switch (spec.contextPackId) {
    case 'old_bailey_london_1674_1800':
      return spec.gender === 'Female' ? 'square' : 'v';
    case 'china_ming_1368_1650':
    case 'china_tang_song_yuan_600_1368':
    case 'china_early_imperial_200bce_600ce':
      return 'cross';
    case 'sahel_medieval_700_1600':
    case 'sahel_early_0_700':
      return spec.garment.kind === 'wrapped_garment' ? 'asymmetric' : 'wide';
    case 'south_asia_mughal_1526_1800':
      return 'asymmetric';
    case 'mediterranean_antiquity_500bce_500ce':
      return 'round';
    default:
      return NECKLINE_FOR_KIND[spec.garment.kind] || 'round';
  }
}

export function drawGarment(context: RenderContext): BodyMasks {
  const { raster, spec, anatomy, ramps, book } = context;
  const { size, centerX } = anatomy;

  const shoulders = shoulderMask(context);
  const opening = necklineMask(context, necklineForContext(context));
  const body = maskSubtract(shoulders, opening);

  if (spec.garment.kind === 'bare') {
    // Bare shoulders still need modelling and a collarbone to read as a body.
    fillMask(raster, shoulders, ramps.skin, MAT.SKIN, ellipsoidShader(
      centerX, anatomy.shoulderTop + 26, anatomy.shoulderHalf * 1.1, 26, 1,
      { base: 3.4, gain: 5.6, bounce: 0.3 }
    ));
    drawCollarbones(context, shoulders);
    drawShoulderWrap(context, shoulders);
    return { body: shoulders, neckline: opening };
  }

  // Cloth over shoulders is a broad cylinder falling away at the arms.
  fillMask(raster, body, ramps.clothA, MAT.CLOTH_A, (x, y) => {
    const dx = (x + 0.5 - centerX) / (anatomy.shoulderHalf * 1.02);
    const nz = Math.sqrt(Math.max(0.05, 1 - Math.min(1, dx * dx)));
    const drop = Math.max(0, (y - anatomy.shoulderTop) / 34) * 0.9;
    const shoulderTopLight = y < anatomy.shoulderTop + 7 ? -0.7 : 0;
    return 3 - nz * 1.5 + Math.abs(dx) * 2.1 + drop + shoulderTopLight + (dx > 0 ? 0.5 : 0);
  }, { dither: 0.5 });

  drawFolds(context, body);
  drawCollar(context, body, opening);
  drawContextDetails(context, body);

  // The garment sits behind the neck, so the neck casts onto it.
  applyContactShadow(raster, opening, book, { dx: 0, dy: 0, strength: 0 });
  applyContactShadow(raster, maskSubtract(shoulders, body), book, { dx: 0, dy: 1, strength: 1, depth: 1 });

  return { body, neckline: opening };
}

/** A few soft vertical folds, dithered so they read as cloth and not as stripes. */
function drawFolds(context: RenderContext, body: Mask): void {
  const { raster, anatomy, spec, book } = context;
  const { size, centerX } = anatomy;
  const rng = makeRng(spec.seed ^ 0x4d21);
  const noise = makeNoise1D(spec.seed ^ 0x1177);
  const count = spec.garment.material.includes('silk') ? 6 : 4;

  for (let i = 0; i < count; i += 1) {
    const x0 = Math.round(centerX + (rng() * 2 - 1) * anatomy.shoulderHalf * 0.85);
    for (let y = anatomy.shoulderTop + 4; y < size; y += 1) {
      const x = Math.round(x0 + noise(y * 0.18 + i * 9) * 1.6);
      if (x < 0 || x >= size || !body[y * size + x]) continue;
      raster.shift(x, y, 1, book);
      if (rng() > 0.75 && body[y * size + x + 1]) raster.shift(x + 1, y, 1, book);
    }
  }
}

/** The band of cloth that turns a hole in a garment into a neckline. */
function drawCollar(context: RenderContext, body: Mask, opening: Mask): void {
  const { raster, spec, anatomy, ramps, book } = context;
  const { size } = anatomy;
  const edge = maskIntersect(maskDilate(maskDilate(opening, size, size, true), size, size, true), body);

  const useAccent = spec.garment.ornament > 0.3;
  const ramp = useAccent ? ramps.clothC : ramps.clothB;
  const material = useAccent ? MAT.CLOTH_C : MAT.CLOTH_B;
  fillMask(raster, edge, ramp, material, (x, y) => (y < anatomy.collarY ? 2.4 : 3.4));

  // The garment's own edge always reads darker where it turns under.
  applyContactShadow(raster, opening, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
}

function drawCollarbones(context: RenderContext, shoulders: Mask): void {
  const { raster, anatomy, book } = context;
  const { size, centerX } = anatomy;
  const y = anatomy.shoulderTop + 5;
  for (const side of [-1, 1] as const) {
    for (let i = 3; i < 13; i += 1) {
      const x = Math.round(centerX + side * i);
      const yy = y + Math.round(Math.pow(i / 13, 2) * 2);
      if (x < 0 || x >= size || !shoulders[yy * size + x]) continue;
      raster.shift(x, yy, 1, book);
      raster.shift(x, yy - 1, -1, book);
    }
  }
}

/** A fibre or barkcloth band over one shoulder, for wrapped and bare looks. */
function drawShoulderWrap(context: RenderContext, shoulders: Mask): void {
  const { raster, anatomy, ramps } = context;
  const { size, centerX } = anatomy;
  const band = makeMask(size, size);
  for (let y = anatomy.shoulderTop; y < size; y += 1) {
    const t = (y - anatomy.shoulderTop) / 24;
    const x0 = Math.round(centerX - anatomy.shoulderHalf * 0.95 + t * 10);
    const width = 9;
    for (let x = x0; x < x0 + width; x += 1) {
      if (x < 0 || x >= size || !shoulders[y * size + x]) continue;
      band[y * size + x] = 1;
    }
  }
  fillMask(raster, band, ramps.clothA, MAT.CLOTH_A, (x, y) => 3 + ((x + y) % 5 === 0 ? 1 : 0), { dither: 0.6 });
}

/**
 * The bespoke passes for the five deeply-treated context packs.
 */
function drawContextDetails(context: RenderContext, body: Mask): void {
  const { raster, spec, anatomy, ramps, book } = context;
  const { size, centerX } = anatomy;

  const stripe = (x0: number, y0: number, w: number, h: number, ramp: Ramp = ramps.clothC, mat: number = MAT.CLOTH_C) => {
    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        if (x < 0 || y < 0 || x >= size || y >= size || !body[y * size + x]) continue;
        const index = y === y0 ? 2 : y === y0 + h - 1 ? 5 : 3;
        raster.set(x, y, ramp.steps[index], mat, index);
      }
    }
  };

  switch (spec.contextPackId) {
    case 'old_bailey_london_1674_1800': {
      if (spec.gender === 'Female') {
        // A linen kerchief crossed over the bodice — near-universal in the
        // period, and the fastest read for "London working woman".
        for (let i = 0; i < 14; i += 1) {
          const y = anatomy.collarY + 1 + i;
          const half = 9 + i * 1.4;
          for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
            if (x < 0 || x >= size || y >= size || !body[y * size + x]) continue;
            const edge = Math.abs(Math.abs(x - centerX) - half) < 1.2;
            const index = edge ? 4 : i < 3 ? 1 : 2;
            raster.set(x, y, ramps.clothB.steps[index], MAT.CLOTH_B, index);
          }
        }
      } else {
        // Coat front with a linen neckcloth showing above it.
        stripe(centerX - 2, anatomy.collarY - 2, 5, 7, ramps.clothB, MAT.CLOTH_B);
        for (let i = 0; i < 3; i += 1) {
          const y = anatomy.collarY + 8 + i * 6;
          raster.set(centerX + 3, y, ramps.metal.steps[1], MAT.METAL, 1);
          raster.set(centerX + 4, y, ramps.metal.steps[4], MAT.METAL, 4);
        }
      }
      break;
    }

    case 'china_ming_1368_1650':
    case 'china_tang_song_yuan_600_1368':
    case 'china_early_imperial_200bce_600ce': {
      // The overlapping collar band, right panel crossing over left.
      for (let i = 0; i < 13; i += 1) {
        const y = anatomy.collarY - 6 + i;
        const left = Math.round(centerX - (anatomy.neckHalf + 7) + i * 0.55);
        const right = Math.round(centerX + (anatomy.neckHalf + 5) * (1 - i / 15));
        for (let x = left; x <= left + 3; x += 1) stripe(x, y, 1, 1, ramps.clothB, MAT.CLOTH_B);
        for (let x = right - 3; x <= right; x += 1) stripe(x, y, 1, 1, ramps.clothB, MAT.CLOTH_B);
      }
      if (spec.garment.ornament > 0.5) {
        stripe(centerX - 1, anatomy.collarY + 6, 3, 10, ramps.clothC, MAT.CLOTH_C);
      }
      break;
    }

    case 'sahel_medieval_700_1600':
    case 'sahel_early_0_700': {
      // Narrow-strip weaving: the cloth is built from bands, so the seams run
      // vertically at a regular pitch. That pitch is the visual signature.
      const pitch = 7;
      for (let x = centerX - anatomy.shoulderHalf; x <= centerX + anatomy.shoulderHalf; x += 1) {
        if ((x - centerX + 300) % pitch !== 0) continue;
        for (let y = anatomy.shoulderTop; y < size; y += 1) {
          if (x < 0 || x >= size || !body[y * size + x]) continue;
          raster.shift(x, y, 1, book);
        }
      }
      if (spec.garment.ornament > 0.3) {
        // Embroidered neckline panel.
        for (let i = 0; i < 8; i += 1) {
          const y = anatomy.collarY + 2 + i;
          const half = 6 - Math.abs(i - 4) * 0.5;
          for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
            if ((x + y) % 2 === 0) stripe(x, y, 1, 1, ramps.clothC, MAT.CLOTH_C);
          }
        }
      }
      break;
    }

    case 'south_asia_mughal_1526_1800': {
      // A jama ties to one side; the diagonal closure and the sash are the
      // legible details at this crop.
      for (let i = 0; i < 16; i += 1) {
        const y = anatomy.collarY - 2 + i;
        const x = Math.round(centerX + 3 + i * 0.85);
        stripe(x, y, 2, 1, ramps.clothB, MAT.CLOTH_B);
      }
      if (spec.garment.ornament > 0.4) {
        for (let i = 0; i < 16; i += 1) {
          const y = anatomy.collarY - 2 + i;
          const x = Math.round(centerX + 3 + i * 0.85);
          if (i % 3 === 0) stripe(x + 2, y, 1, 1, ramps.metal, MAT.METAL);
        }
      }
      break;
    }

    case 'mediterranean_antiquity_500bce_500ce': {
      // Clavi: the pair of woven bands running down from the shoulders. Almost
      // every surviving depiction of a tunic has them.
      const offset = 9;
      for (const side of [-1, 1] as const) {
        for (let y = anatomy.shoulderTop + 2; y < size; y += 1) {
          const x = Math.round(centerX + side * offset);
          if (!body[y * size + x]) continue;
          for (let d = 0; d < 2; d += 1) {
            const px = x + d;
            if (!body[y * size + px]) continue;
            const index = d === 0 ? 2 : 4;
            raster.set(px, y, ramps.clothC.steps[index], MAT.CLOTH_C, index);
          }
        }
      }
      // A mantle folded over the left shoulder.
      if (spec.wealth === 'wealthy' || spec.wealth === 'noble') {
        const mantle = makeMask(size, size);
        for (let y = anatomy.shoulderTop; y < size; y += 1) {
          const t = (y - anatomy.shoulderTop) / 22;
          const x1 = Math.round(centerX - anatomy.shoulderHalf);
          const x2 = Math.round(centerX - anatomy.shoulderHalf * 0.25 + t * 8);
          for (let x = x1; x <= x2; x += 1) {
            if (x < 0 || x >= size || !body[y * size + x]) continue;
            mantle[y * size + x] = 1;
          }
        }
        fillMask(raster, mantle, ramps.clothB, MAT.CLOTH_B, (x, y) => {
          const dx = (x - (centerX - anatomy.shoulderHalf * 0.6)) / 14;
          return 3 + dx * 1.4 + ((y % 7 === 0) ? 0.8 : 0);
        }, { dither: 0.5 });
        applyContactShadow(raster, mantle, book, { dx: 1, dy: 0, strength: 2, depth: 1 });
      }
      break;
    }

    default:
      break;
  }
}
