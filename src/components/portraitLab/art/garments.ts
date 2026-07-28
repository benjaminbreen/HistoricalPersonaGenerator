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
  maskDilate, maskEllipse, maskFromProfile, maskIntersect, maskRect, maskSubtract,
} from '../core/raster';
import { Ramp } from '../core/color';
import { choose, makeNoise1D, makeNoise2D, makeRng } from '../core/rng';
import { RenderContext } from '../render/context';
import { GarmentKind } from '../spec/types';
import { drawGarmentSurface } from './garmentSurface';

export interface BodyMasks {
  body: Mask;
  neckline: Mask;
}

function shoulderMask(context: RenderContext): Mask {
  const { anatomy } = context;
  const { size } = anatomy;
  const mask = maskFromProfile(size, size, {
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
  return poseShoulders(context, mask);
}

/**
 * The two things a body does that a symmetric profile cannot say: carry one
 * shoulder lower than the other, and round forward.
 *
 * Both are applied to the finished silhouette as a per-column vertical shift
 * rather than being written into the profile, because the profile is mirrored
 * about the centre by construction and a dropped shoulder is the one shape that
 * is definitionally not. The body runs off the bottom of the frame, so a column
 * only ever needs its *top* edge moved: find where the cloth starts and start
 * it somewhere else.
 */
function poseShoulders(context: RenderContext, mask: Mask): Mask {
  const { anatomy, spec } = context;
  const { size, centerX } = anatomy;
  const { shoulderDrop, hunch } = spec.pose;
  if (shoulderDrop === 0 && hunch === 0) return mask;

  // Which shoulder hangs is fixed per persona rather than random: it reads as a
  // fact about the body, and a fact that changed between renders would not.
  const side = (spec.seed & 1) === 0 ? 1 : -1;
  const out = makeMask(size, size);
  for (let x = 0; x < size; x += 1) {
    let top = -1;
    for (let y = 0; y < size; y += 1) {
      if (mask[y * size + x]) { top = y; break; }
    }
    if (top < 0) continue;

    const t = (x + 0.5 - centerX) / Math.max(1, anatomy.shoulderHalf);
    // The drop is nothing at the neck and full at the point of the shoulder —
    // shifting the whole side down as a block detaches it from the collar.
    const reach = Math.min(1, Math.max(0, Math.abs(t) - 0.18) / 0.6);
    const dropped = t * side > 0 ? shoulderDrop * reach : 0;
    // A stoop lifts the cloth beside the neck and leaves the points of the
    // shoulders where they are, which is what rounds the line over.
    const rounded = hunch * 3.4 * Math.exp(-((Math.abs(t) - 0.32) ** 2) / 0.09);

    const start = Math.max(0, Math.round(top + dropped - rounded));
    for (let y = start; y < size; y += 1) {
      if (y >= top || mask[y * size + x]) out[y * size + x] = 1;
    }
  }
  return out;
}

type NecklineShape =
  | 'round' | 'wide' | 'square' | 'v' | 'cross' | 'high' | 'asymmetric' | 'slit' | 'boat';

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
    case 'slit': {
      // A round neck with a short vertical opening cut down from it — the
      // commonest solution anywhere a garment has to go over a head and still
      // lie flat, and found from West Africa to South Asia to medieval Europe.
      // It is the most useful shape in this list precisely because claiming it
      // for a persona claims almost nothing.
      const e = maskEllipse(size, size, centerX, top + 5, anatomy.neckHalf + 3, 5.5);
      for (let i = 0; i < e.length; i += 1) if (e[i]) mask[i] = 1;
      for (let i = 0; i < 7; i += 1) {
        const half = 1.6 - i * 0.16;
        for (let x = centerX - half; x <= centerX + half; x += 1) put(Math.round(x), top + 9 + i);
      }
      return mask;
    }
    case 'boat': {
      // Wide and shallow: the neckline a rectangular length of cloth makes when
      // it is simply seamed at the shoulders and left open between them.
      const e = maskEllipse(size, size, centerX, top + 3, anatomy.neckHalf + 10, 4.5);
      return e;
    }
    default: {
      return maskEllipse(size, size, centerX, top + 5, anatomy.neckHalf + 4, 6);
    }
  }
}

/**
 * The plausible necklines for each garment kind, in the absence of a context
 * pack that knows better.
 *
 * This used to be one shape per kind, which meant every tunic the app has ever
 * generated — and a tunic is the fallback kind, so that is a lot of them — wore
 * exactly the same collar. Offering two or three defensible options per kind
 * and choosing among them by seed buys back the variation without pretending to
 * more precision than there is: each option is a construction that turns up
 * across most of the world and most of the period range, so picking one is not
 * a claim about this persona's culture. Where there *is* a real claim to make,
 * `necklineForContext` has already made it and never reaches here.
 */
const NECKLINES_FOR_KIND: Record<GarmentKind, NecklineShape[]> = {
  tunic: ['round', 'slit', 'boat'],
  robe: ['cross', 'slit', 'v'],
  gown: ['wide', 'square', 'boat'],
  doublet: ['high', 'square', 'v'],
  work_shirt: ['v', 'slit', 'round'],
  wrapped_garment: ['asymmetric', 'boat', 'wide'],
  jacket: ['v', 'high', 'square'],
  bare: ['wide'],
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
      return genericNeckline(context);
  }
}

function genericNeckline(context: RenderContext): NecklineShape {
  const { spec } = context;
  const options = NECKLINES_FOR_KIND[spec.garment.kind] || ['round'];

  // The one zone-level convention worth honouring outside a context pack: a
  // front-closing overlapped collar is near-universal for East and Central
  // Asian robes across the whole period this app covers, and drawing one of
  // those as a round neck is a more visible error than any of the choices
  // below.
  if (spec.garment.kind === 'robe' && (spec.culturalZone === 'EAST_ASIAN' || spec.culturalZone === 'CENTRAL_ASIAN')) {
    return 'cross';
  }

  // Wealth widens and lowers a neckline: cloth to spare, and no work to do in
  // it. Poor dress closes up, because an open neck is heat lost and a snagged
  // hem. This is about as far as a generic rule can honestly go.
  const wealthy = spec.wealth === 'wealthy' || spec.wealth === 'noble';
  if (wealthy && options.includes('square')) return 'square';
  if (spec.wealth === 'poor' && options.includes('slit')) return 'slit';

  return choose(options, spec.seed, `neckline-${spec.garment.kind}`);
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

  applyClothSurface(context, body);
  // Named decoration goes on before the folds, so the folds shade *over* the
  // pattern the way real cloth does — a brocade that ignores the fold it is
  // lying in reads as wallpaper rather than as a garment.
  drawGarmentSurface(context, body, opening);
  drawFolds(context, body);
  drawCollar(context, body, opening);
  drawContextDetails(context, body);

  drawUndergarment(context, opening, body);

  // The garment sits behind the neck, so the neck casts onto it.
  applyContactShadow(raster, maskSubtract(shoulders, body), book, { dx: 0, dy: 1, strength: 1, depth: 1 });

  return { body, neckline: opening };
}

/**
 * How the cloth itself takes the light.
 *
 * The ramp already varies contrast by material, but contrast alone cannot tell
 * silk from wool — both come out as the same smooth gradient in a different key.
 * What actually separates them is surface: silk is specular and throws a narrow
 * band of lustre across the curve; velvet is the opposite, drinking light at
 * grazing angles so it goes darkest exactly where a shiny cloth goes brightest;
 * wool is matte with visible fibre; linen is crisp and slubbed.
 *
 * This is a cheap pass — a few value shifts — but it is the difference between
 * a persona wearing *cloth* and a persona wearing a coloured shape.
 */
function applyClothSurface(context: RenderContext, body: Mask): void {
  const { raster, spec, anatomy, book } = context;
  const { size, centerX } = anatomy;
  const material = spec.garment.material.toLowerCase();
  const grain = makeNoise2D(spec.seed ^ 0x5ab3);
  const half = Math.max(1, anatomy.shoulderHalf * 1.02);

  const silky = /silk|satin|brocade|damask|taffeta/.test(material);
  const velvet = /velvet|plush|fustian/.test(material);
  const woolly = /wool|felt|broadcloth|serge|tweed|kersey/.test(material);
  const linenish = /linen|cotton|muslin|calico|hemp|ramie/.test(material);
  const coarse = /barkcloth|bark cloth|fibre|fiber|plant|raffia|grass|straw|reed|tapa|hide|skin/.test(material);

  if (!silky && !velvet && !woolly && !linenish && !coarse) return;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!body[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
      const dx = (x + 0.5 - centerX) / half;

      if (silky) {
        // A narrow sheen band up the lit side, and a faster falloff at the
        // edges — lustre is a highlight that moves, not an overall brightness.
        const band = Math.exp(-Math.pow((dx + 0.38) / 0.26, 2));
        if (band > 0.45 && grain(x * 0.3, y * 0.28) > -0.35) raster.shift(x, y, -1, book);
        if (Math.abs(dx) > 0.74) raster.shift(x, y, 1, book);
      } else if (velvet) {
        // Pile scatters: darkest at the turn, with a crushed, uneven nap.
        const n = grain(x * 0.42, y * 0.38);
        if (n > 0.5) raster.shift(x, y, -1, book);
        else if (n < -0.5) raster.shift(x, y, 1, book);
        if (Math.abs(dx) > 0.62) raster.shift(x, y, 1, book);
      } else if (woolly) {
        const n = grain(x * 0.8, y * 0.72);
        if (n > 0.55) raster.shift(x, y, 1, book);
        else if (n < -0.62) raster.shift(x, y, -1, book);
      } else if (linenish) {
        // Slubs: the odd thicker thread catching the light, on a crisp ground.
        if ((x * 3 + y * 5) % 13 === 0 && grain(x * 0.5, y * 0.45) > 0.15) {
          raster.shift(x, y, -1, book);
        } else if (grain(x * 0.95, y * 0.9) > 0.7) {
          raster.shift(x, y, 1, book);
        }
      } else {
        // Coarse plant fibre and hide: a visible, irregular weave.
        if ((x + y * 2) % 5 === 0 && grain(x * 0.6, y * 0.55) > 0) raster.shift(x, y, 1, book);
        else if (grain(x * 0.7, y * 0.65) > 0.66) raster.shift(x, y, -1, book);
      }
    }
  }
}

/**
 * The linen showing at the neck of a wool garment. Almost everyone in almost
 * every period wore something under the outer layer, and a sliver of a paler,
 * plainer cloth at the neckline does more to make clothing read as clothing
 * than any amount of trim.
 */
function drawUndergarment(context: RenderContext, opening: Mask, body: Mask): void {
  const { raster, spec, anatomy, ramps } = context;
  const { size } = anatomy;
  if (spec.garment.kind === 'bare' || spec.garment.kind === 'wrapped_garment') return;

  // Sits inside the neckline opening, below the neck itself.
  const under = makeMask(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!opening[y * size + x]) continue;
      if (raster.matAt(x, y) === MAT.SKIN) continue;
      if (body[y * size + x]) continue;
      under[y * size + x] = 1;
    }
  }
  fillMask(raster, under, ramps.clothB, MAT.CLOTH_B, (x, y) => {
    const dx = (x + 0.5 - anatomy.centerX) / Math.max(1, anatomy.neckHalf + 6);
    return 3.4 + Math.abs(dx) * 1.2 + (y > anatomy.collarY ? 0.6 : 0);
  }, { dither: 0.4 });
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
  // Only genuinely well-off dress gets a contrasting trim. Everyone else gets
  // the same cloth turned under, which is what an ordinary neckline is — a
  // bright accent line on every single garment made the whole population look
  // like it was wearing the same piped uniform.
  const useAccent = spec.garment.ornament > 0.55;

  // And a noble's is wider. Breadth of trim is the cheapest rank signal there
  // is at this size, because it is the one that survives being two pixels: the
  // eye cannot tell a fine braid from a coarse one but it can tell a narrow
  // band from a broad one at a glance across a page of forty portraits.
  const broad = spec.garment.ornament > 0.85;
  let grown = maskDilate(maskDilate(opening, size, size, true), size, size, true);
  if (broad) grown = maskDilate(grown, size, size, true);
  const edge = maskIntersect(grown, body);

  const ramp = useAccent ? ramps.clothC : ramps.clothA;
  const material = useAccent ? MAT.CLOTH_C : MAT.CLOTH_A;
  fillMask(raster, edge, ramp, material, (x, y) => {
    // A turned edge reads as a lit lip above a shadowed fold.
    const lit = y < anatomy.collarY;
    if (!useAccent) return lit ? 1.8 : 4.6;
    // Brighter as well as broader: a trim of real gold or fine silk sits above
    // the cloth's own value range rather than inside it.
    return broad ? (lit ? 1.3 : 3.2) : (lit ? 2.4 : 3.6);
  });

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
      drawGenericConstruction(context, body);
      break;
  }
}

/**
 * What a garment shows about how it was made, for the nine personas in ten who
 * do not match a context pack.
 *
 * The audit says 91.7% of real output falls through to the generic silhouette,
 * and the chest is the bottom third of every card — so this is the largest area
 * of the portrait and it was the emptiest, a flat noisy field with a hole in
 * it. None of what follows is culturally specific, which is the point: a
 * shoulder seam, a hemmed neck edge, a front opening and a fastening are what
 * *any* cut-and-sewn garment has, anywhere, in any century. Drawing them says
 * "this is a made thing" without saying anything that could be wrong.
 */
function drawGenericConstruction(context: RenderContext, body: Mask): void {
  const { raster, spec, anatomy, ramps, book } = context;
  const { size, centerX } = anatomy;
  const kind = spec.garment.kind;
  const rng = makeRng(spec.seed ^ 0x2f77);

  const onBody = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < size && y < size && body[y * size + x] === 1;

  // --- shoulder seams -------------------------------------------------------
  // The join where a sleeve is set into the body. It runs from the neckline
  // out and down over the curve of the shoulder, and it is the single most
  // legible thing on a plain garment — two soft lines and the cloth stops
  // being a blob and starts being a shirt.
  if (kind !== 'bare' && kind !== 'wrapped_garment') {
    for (const side of [-1, 1] as const) {
      const from = anatomy.neckHalf + 4;
      const to = anatomy.shoulderHalf * 0.82;
      for (let i = 0; i <= Math.round(to - from); i += 1) {
        const t = i / Math.max(1, to - from);
        const x = Math.round(centerX + side * (from + i));
        const y = Math.round(anatomy.collarY - 1 + t * t * 9);
        if (!onBody(x, y)) continue;
        // Two steps, not one. The cloth underneath is dithered across a whole
        // ramp step already, so a single-step line is inside the noise floor —
        // the first version of this seam was drawn correctly and simply could
        // not be seen against its own fabric.
        raster.shift(x, y, 2, book);
        // A lit thread on the upper side turns the seam from a scratch into
        // two pieces of cloth meeting.
        if (onBody(x, y - 1)) raster.shift(x, y - 1, -1, book);
      }
    }
  }

  // --- neck edge ------------------------------------------------------------
  // A raw hole in cloth frays, so every neckline in history is bound, faced or
  // turned. One darker row inside the opening reads as all three.
  const edge = maskIntersect(maskDilate(body, size, size, true), maskSubtract(makeMask(size, size), body));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!edge[y * size + x]) continue;
      if (y > anatomy.collarY + 12) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_B) continue;
      raster.shift(x, y, 1, book);
    }
  }

  // --- front opening --------------------------------------------------------
  // Garments that open at the front, and the fastenings that hold them shut.
  const opens = kind === 'jacket' || kind === 'doublet' || kind === 'work_shirt';
  if (opens) {
    const offset = kind === 'work_shirt' ? 0 : 1;
    for (let y = anatomy.collarY + 1; y < size; y += 1) {
      const x = centerX + offset;
      if (!onBody(x, y)) continue;
      raster.shift(x, y, 2, book);
      if (onBody(x - 1, y)) raster.shift(x - 1, y, -1, book);
    }

    // Buttons, hooks, toggles or ties — at this size they are all the same two
    // pixels, so the only question is how many and how bright. Metal for
    // anyone who can afford it, self-coloured cord for anyone who cannot.
    //
    // Spacing is set by the frame rather than by the garment: there are only
    // seventeen rows below the collar before the canvas ends, so the original
    // six-pixel pitch put half of a doublet's buttons off the bottom edge and
    // the persona came back wearing two.
    const metal = spec.garment.ornament > 0.3;
    const count = kind === 'doublet' ? 3 : 2;
    const pitch = 5;
    for (let i = 0; i < count; i += 1) {
      const y = anatomy.collarY + 4 + i * pitch;
      const x = centerX + offset - 2;
      if (y >= size - 1) break;
      if (!onBody(x, y)) continue;
      if (metal) {
        raster.set(x, y, ramps.metal.steps[1], MAT.METAL, 1);
        raster.set(x + 1, y, ramps.metal.steps[4], MAT.METAL, 4);
      } else {
        raster.shift(x, y, -2, book);
        raster.shift(x + 1, y, 2, book);
      }
    }
  }

  // --- a pin at the shoulder ------------------------------------------------
  // A length of cloth draped rather than sewn has to be fastened somewhere, and
  // the shoulder is where — the fibula, the penannular brooch, the thorn. It is
  // also the detail that stops a wrapped garment reading as a towel.
  if (kind === 'wrapped_garment') {
    const side = rng() > 0.5 ? 1 : -1;
    const x = Math.round(centerX + side * (anatomy.neckHalf + 9));
    const y = anatomy.collarY + 2;
    if (onBody(x, y)) {
      const ramp = spec.garment.ornament > 0.25 ? ramps.metal : ramps.clothC;
      const mat = spec.garment.ornament > 0.25 ? MAT.METAL : MAT.CLOTH_C;
      raster.set(x, y, ramp.steps[1], mat, 1);
      raster.set(x + 1, y, ramp.steps[3], mat, 3);
      raster.set(x, y + 1, ramp.steps[3], mat, 3);
      raster.set(x + 1, y + 1, ramp.steps[5], mat, 5);
      applyContactShadow(raster, maskRect(size, size, x, y, 2, 2), book, { dx: 1, dy: 1, strength: 1, depth: 1 });
    }
  }

  // No belt, and this is deliberate. An earlier pass darkened the last few rows
  // of a tunic or robe to suggest a sash gathered at the waist, on the theory
  // that a garment hanging loose to the frame edge reads as a sack. It does not
  // work: a real waist is far below this crop, so the band lands hard against
  // the bottom of the canvas and reads as a vignette or a printing error rather
  // than as clothing. The frame gets to veto an idea, and this one it vetoed.
}
