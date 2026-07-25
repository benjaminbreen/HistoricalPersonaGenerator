/**
 * portraitLab/art/headwear.ts
 *
 * Head coverings are built on the same skull profile as the hair, so a cap
 * actually fits the head it is on rather than being a shape parked near it.
 *
 * The detail that matters most here is the shadow. A brim throws the whole
 * upper face into shade; a wrapped cloth throws a hard line across the
 * forehead; a hood puts the eyes in a well. Skipping that cast shadow is why
 * hats in most procedural portraits look like stickers.
 */

import {
  applyContactShadow, ellipsoidShader, fillMask, MAT, Mask, makeMask,
  maskEllipse, maskFromProfile, maskSubtract, maskUnion,
} from '../core/raster';
import { makeNoise1D, makeRng } from '../core/rng';
import { RenderContext } from '../render/context';
import { HeadwearKind } from '../spec/types';

/**
 * The part of the face a covering must leave clear. A coif, a veil, or a
 * headcloth reaches well below the brow at the sides while framing the face in
 * the middle — build them as a full lid and you get a persona with a bag over
 * their head, which is exactly what happens without this.
 */
function faceOpening(context: RenderContext, topY: number): Mask {
  const { anatomy } = context;
  const { size, centerX } = anatomy;
  const bottom = anatomy.chinY + 3;
  return maskEllipse(
    size, size,
    centerX,
    (topY + bottom) / 2,
    anatomy.headHalfWidth * 0.88,
    (bottom - topY) / 2
  );
}

/**
 * Cloth that falls past the shoulders parts at the front, the same way hair
 * does. Without this a veil is simply wider than the shoulders and buries the
 * whole garment — which is how twenty-five personas in a two-hundred-portrait
 * audit ended up apparently wearing nothing.
 */
function partAtChest(context: RenderContext, mask: Mask): Mask {
  const { anatomy } = context;
  const { size, centerX } = anatomy;
  const out = mask.slice();
  for (let y = anatomy.collarY - 4; y < size; y += 1) {
    const t = Math.max(0, (y - (anatomy.collarY - 4)) / 18);
    const open = anatomy.neckHalf + 3 + t * 16;
    for (let x = 0; x < size; x += 1) {
      if (Math.abs(x + 0.5 - centerX) <= open) out[y * size + x] = 0;
    }
  }
  return out;
}

/** The skull profile, inflated, for anything that wraps the head. */
function crownMask(context: RenderContext, puff: number, rise: number, bottomY: number): Mask {
  const { anatomy } = context;
  const { size } = anatomy;
  const top = anatomy.headTop - rise;
  const span = anatomy.chinY - anatomy.headTop;

  const keys: Array<[number, number]> = [];
  const steps = 16;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const y = top + t * (bottomY - top);
    const headT = Math.max(0, Math.min(1, (y - anatomy.headTop) / span));
    const source = anatomy.headProfile;
    let idx = 0;
    while (idx < source.length - 2 && source[idx + 1][0] < headT) idx += 1;
    const [t0, h0] = source[idx];
    const [t1, h1] = source[idx + 1];
    const u = t1 === t0 ? 0 : (headT - t0) / (t1 - t0);
    let half = h0 + (h1 - h0) * u + puff;
    if (y < anatomy.headTop) {
      // Round over the top rather than running straight off the crown.
      const above = (anatomy.headTop - y) / Math.max(1, rise + 1);
      half *= Math.sqrt(Math.max(0.05, 1 - above * above * 0.85));
    }
    keys.push([t, Math.max(1, half)]);
  }

  return maskFromProfile(size, size, { keys, top, bottom: bottomY, centerX: anatomy.centerX });
}

function fillHeadwear(context: RenderContext, mask: Mask, options: { dither?: number; gain?: number } = {}): void {
  const { raster, ramps, anatomy } = context;
  const shader = ellipsoidShader(
    anatomy.centerX - 2,
    anatomy.headTop + anatomy.headHeight * 0.24,
    anatomy.headHalfWidth * 1.24,
    anatomy.headHeight * 0.6,
    1,
    { base: 3, gain: options.gain ?? 6.8, bounce: 0.2 }
  );
  fillMask(raster, mask, ramps.headwear, MAT.HEADWEAR, shader, { dither: options.dither ?? 0.4 });
}

/** The cast shadow a covering throws down onto the face. */
function castOntoFace(context: RenderContext, mask: Mask, depth: number, strength: number): void {
  applyContactShadow(context.raster, mask, context.book, { dx: 0, dy: 1, strength, depth });
}

export function drawHeadwear(context: RenderContext): Mask | null {
  const { spec } = context;
  if (!spec.headwear) return null;
  switch (spec.headwear.kind) {
    case 'cap': return drawCap(context);
    case 'brimmed_hat': return drawBrimmedHat(context);
    case 'wrapped_cloth': return drawWrappedCloth(context);
    case 'veil': return drawVeil(context);
    case 'hood': return drawHood(context);
    case 'helmet': return drawHelmet(context);
    case 'coronet': return drawCoronet(context);
    case 'band': return drawBand(context);
    default: return null;
  }
}

function drawCap(context: RenderContext): Mask {
  const { spec, anatomy, raster, ramps } = context;
  const name = spec.headwear!.name.toLowerCase();

  // A coif covers the ears and frames the whole face; a scholar's cap or a
  // skullcap sits high on the crown. Same primitive, different bottom edge.
  const isCoif = /coif|bonnet|kerchief|tignon/.test(name);
  const isFlatTop = /scholar|biretta|futou|official/.test(name);

  const bottom = isCoif ? anatomy.chinY - 4 : anatomy.browY - 3;
  let mask = crownMask(context, isCoif ? 2.8 : 1.6, isFlatTop ? 4 : 2, bottom);
  if (isCoif) mask = maskSubtract(mask, faceOpening(context, anatomy.browY - 3));

  fillHeadwear(context, mask, { dither: isCoif ? 0.3 : 0.45 });

  if (isFlatTop) {
    // Square the top off.
    const { size, centerX } = anatomy;
    for (let y = anatomy.headTop - 5; y < anatomy.headTop - 1; y += 1) {
      for (let x = centerX - 13; x <= centerX + 13; x += 1) {
        if (x < 0 || y < 0 || x >= size) continue;
        const index = y === anatomy.headTop - 5 ? 2 : 3;
        raster.set(x, y, ramps.headwear.steps[index], MAT.HEADWEAR, index);
        mask[y * size + x] = 1;
      }
    }
  }

  if (isCoif) {
    // A gathered edge reads as linen rather than as a helmet.
    const { size } = anatomy;
    const rng = makeRng(spec.seed ^ 0x2b8f);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!mask[y * size + x]) continue;
        const edge = !mask[y * size + x - 1] || !mask[y * size + x + 1];
        if (edge && rng() > 0.55) raster.shift(x, y, -1, context.book);
      }
    }
  }

  castOntoFace(context, mask, 2, 2);
  return mask;
}

function drawBrimmedHat(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const name = spec.headwear!.name.toLowerCase();
  const tall = /top hat|capotain|steeple/.test(name);
  const conical = /conical|douli|straw|coolie/.test(name);

  const brimY = anatomy.browY - 5;
  const crownBottom = brimY + 1;
  const crown = conical
    ? (() => {
        const cone = makeMask(size, size);
        const apexY = anatomy.headTop - 10;
        for (let y = apexY; y <= crownBottom; y += 1) {
          const t = (y - apexY) / Math.max(1, crownBottom - apexY);
          const half = t * (anatomy.headHalfWidth + 2);
          for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
            if (x < 0 || y < 0 || x >= size || y >= size) continue;
            cone[y * size + x] = 1;
          }
        }
        return cone;
      })()
    : crownMask(context, 1.8, tall ? 14 : 4, crownBottom);

  const brimHalf = anatomy.headHalfWidth * (conical ? 1.62 : 1.42);
  const brim = maskEllipse(size, size, centerX, brimY + 1, brimHalf, conical ? 4.5 : 3.6);

  fillHeadwear(context, crown, { dither: 0.35 });

  // The brim is lit on top and dark underneath — that value split is the brim.
  fillMask(raster, brim, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dy = y - (brimY + 1);
    const dx = (x - centerX) / brimHalf;
    return (dy < 0 ? 2.1 : 4.6) + Math.abs(dx) * 0.9 + (dx > 0.2 ? 0.4 : 0);
  }, { dither: 0.4 });

  // Hat band.
  if (spec.headwear!.ornament > 0.2 && !conical) {
    for (let y = brimY - 4; y < brimY - 1; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!crown[y * size + x]) continue;
        const index = y === brimY - 4 ? 2 : 4;
        raster.set(x, y, ramps.clothC.steps[index], MAT.CLOTH_C, index);
      }
    }
  }

  // A brim shades the entire upper face, not just the pixel below it.
  const shaded = maskUnion(crown, brim);
  applyContactShadow(raster, shaded, book, { dx: 0, dy: 1, strength: 2, depth: 4 });
  for (let y = brimY + 2; y < anatomy.eyeY - 1; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (raster.matAt(x, y) === MAT.SKIN) raster.shift(x, y, 1, book);
    }
  }

  return shaded;
}

function drawWrappedCloth(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const name = spec.headwear!.name.toLowerCase();
  const turban = /turban|pagri/.test(name);

  // A headcloth wraps the crown and frames down past the ears; running it to
  // the jaw makes a shapeless tan dome with a face cut out of it.
  const bottom = turban ? anatomy.browY - 2 : anatomy.earBottomY;
  let mask = crownMask(context, turban ? 4.2 : 2.8, turban ? 5 : 2, bottom);
  if (!turban) mask = maskSubtract(mask, faceOpening(context, anatomy.browY - 3));
  fillHeadwear(context, mask, { dither: 0.3 });

  // Wrapped cloth is layered, and the layers are what make it read as wrapped
  // rather than as a bowl. Each band takes a slightly different value.
  const noise = makeNoise1D(spec.seed ^ 0x6611);
  const bands = turban ? 4 : 3;
  for (let b = 0; b < bands; b += 1) {
    const baseY = anatomy.headTop - (turban ? 3 : 0) + b * ((bottom - anatomy.headTop) / bands);
    for (let x = 0; x < size; x += 1) {
      const tilt = ((x - centerX) / anatomy.headHalfWidth) * (turban ? 2.4 : 1.4);
      const y = Math.round(baseY + tilt + noise(x * 0.2 + b * 5) * 0.8);
      if (y < 0 || y >= size || !mask[y * size + x]) continue;
      raster.shift(x, y, 2, book);
      if (y + 1 < size && mask[(y + 1) * size + x]) raster.shift(x, y + 1, -1, book);
    }
  }

  // A headcloth that is not a turban keeps a tail, and the tail falls over one
  // shoulder. Symmetric side panels read as an aviator cap.
  if (!turban) {
    const tailSide = spec.seed % 2 === 0 ? -1 : 1;
    let tail = makeMask(size, size);
    // Stops at the collar rather than running to the frame edge: a tail that
    // hangs the full height reads as a straight curtain, not as cloth.
    for (let y = anatomy.earTopY - 2; y < anatomy.collarY + 2; y += 1) {
      const t = (y - (anatomy.earTopY - 2)) / 24;
      // Swings outward as it falls, and narrows to a point at the end.
      const taper = Math.max(0, 1 - Math.pow(Math.max(0, t - 0.55) / 0.45, 2));
      const outer = anatomy.headHalfWidth + 1.5 + t * 5;
      const inner = outer - (3.5 + t * 2) * taper;
      for (let d = inner; d <= outer; d += 1) {
        const x = Math.round(centerX + tailSide * d);
        if (x < 0 || x >= size) continue;
        tail[y * size + x] = 1;
      }
    }
    tail = maskSubtract(tail, faceOpening(context, anatomy.browY - 2));
    fillMask(raster, tail, ramps.headwear, MAT.HEADWEAR, (x, y) => {
      const dx = (x - centerX) / anatomy.headHalfWidth;
      return 3.6 + Math.abs(dx) * 0.7 + (dx > 0 ? 0.6 : -0.3) + (noise(y * 0.3) > 0.3 ? 0.5 : 0);
    }, { dither: 0.5 });
    applyContactShadow(raster, tail, book, { dx: -tailSide, dy: 0, strength: 1, depth: 1 });
  }

  castOntoFace(context, mask, 3, 2);
  return mask;
}

function drawVeil(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec } = context;
  const { size, centerX } = anatomy;

  const cap = crownMask(context, 2.4, 2, anatomy.browY - 4);
  const drape = makeMask(size, size);
  for (let y = anatomy.headTop + 2; y < size; y += 1) {
    const t = Math.max(0, (y - anatomy.headTop) / (size - anatomy.headTop));
    const outer = anatomy.headHalfWidth + 2 + t * 12;
    // Full width; the face cutout below is what shapes the opening. Leaving an
    // inner radius here strands a ring of hair between veil and face.
    const inner = 0;
    for (const side of [-1, 1] as const) {
      for (let d = inner; d <= outer; d += 1) {
        const x = Math.round(centerX + side * d);
        if (x < 0 || x >= size) continue;
        drape[y * size + x] = 1;
      }
    }
  }
  const mask = partAtChest(context, maskSubtract(maskUnion(cap, drape), faceOpening(context, anatomy.browY - 4)));

  fillMask(raster, mask, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dx = (x - centerX) / (anatomy.headHalfWidth + 8);
    return 3.1 + Math.abs(dx) * 1.5 + (dx > 0 ? 0.6 : -0.6) + (y - anatomy.headTop) / 90;
  }, { dither: 0.4 });

  // Folds run along the hang of the cloth, so they wander rather than ruling
  // the veil into vertical stripes.
  const noise = makeNoise1D(spec.seed ^ 0x77c1);
  for (let f = 0; f < 5; f += 1) {
    const side = f % 2 === 0 ? -1 : 1;
    const x0 = centerX + side * (anatomy.headHalfWidth * 0.55 + f * 2.4);
    for (let y = anatomy.headTop + 12; y < size; y += 1) {
      const x = Math.round(x0 + side * (y - anatomy.headTop) * 0.16 + noise(y * 0.13 + f * 7) * 1.6);
      if (x < 0 || x >= size || !mask[y * size + x]) continue;
      context.raster.shift(x, y, 1, context.book);
    }
  }

  castOntoFace(context, cap, 2, 2);
  return mask;
}

function drawHood(context: RenderContext): Mask {
  const { anatomy, raster, ramps, book } = context;
  const { size, centerX } = anatomy;

  const outer = makeMask(size, size);
  for (let y = anatomy.headTop - 5; y < size; y += 1) {
    const t = Math.max(0, (y - (anatomy.headTop - 5)) / (size - anatomy.headTop + 5));
    const half = anatomy.headHalfWidth * (0.55 + Math.sqrt(Math.min(1, t * 2.4)) * 0.72) + t * 14;
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      outer[y * size + x] = 1;
    }
  }

  // The opening: a rounded arch the face looks out of.
  const opening = maskEllipse(size, size, centerX, anatomy.eyeY + 2, anatomy.headHalfWidth * 0.98, anatomy.headHeight * 0.44);
  const mask = partAtChest(context, maskSubtract(outer, opening));

  fillMask(raster, mask, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dx = (x - centerX) / (anatomy.headHalfWidth + 6);
    const dy = (y - anatomy.headTop) / anatomy.headHeight;
    return 3 + Math.abs(dx) * 1.7 + dy * 0.6 + (dx > 0 ? 0.5 : -0.6);
  }, { dither: 0.45 });

  // Everything inside a hood sits in its shade.
  for (let y = anatomy.headTop; y < anatomy.chinY; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (raster.matAt(x, y) === MAT.SKIN || raster.matAt(x, y) === MAT.HAIR) {
        raster.shift(x, y, y < anatomy.eyeY + 2 ? 2 : 1, book);
      }
    }
  }
  castOntoFace(context, mask, 3, 2);
  return mask;
}

function drawHelmet(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;

  const dome = crownMask(context, 2.6, 5, anatomy.browY - 1);
  fillMask(raster, dome, ramps.headwear, MAT.METAL, ellipsoidShader(
    centerX - 4, anatomy.headTop + 6, anatomy.headHalfWidth * 1.2, anatomy.headHeight * 0.5, 1,
    { base: 3.4, gain: 7.6, bounce: 0.16 }
  ));

  // Rim.
  for (let y = anatomy.browY - 4; y < anatomy.browY - 1; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!dome[y * size + x]) continue;
      const index = y === anatomy.browY - 4 ? 1 : 5;
      raster.set(x, y, ramps.headwear.steps[index], MAT.METAL, index);
    }
  }

  // Nasal bar, if this is that sort of helmet.
  if (/nasal|norman|spangen|conical/.test(spec.headwear!.name.toLowerCase())) {
    for (let y = anatomy.browY - 1; y < anatomy.noseBaseY - 4; y += 1) {
      raster.set(centerX - 2, y, ramps.headwear.steps[3], MAT.METAL, 3);
      raster.set(centerX - 1, y, ramps.headwear.steps[1], MAT.METAL, 1);
      raster.set(centerX, y, ramps.headwear.steps[4], MAT.METAL, 4);
      raster.set(centerX + 1, y, ramps.headwear.steps[6], MAT.METAL, 6);
    }
  }

  castOntoFace(context, dome, 3, 2);
  return dome;
}

/**
 * A band across the brow — beaded, woven, a laurel wreath, a bone or shell
 * ornament. Common enough in the app's output to deserve its own form; drawing
 * these as skullcaps hid the whole top of the head under a bowl.
 */
function drawBand(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);
  const name = spec.headwear!.name.toLowerCase();
  const leafy = /wreath|garland/.test(name);
  const beaded = /bead|pearl|shell|bone/.test(name);

  // A hairpin, comb or flower is worn *in* the hair, not around the brow. A
  // full band for these would cover a third of the head for a two-pixel object.
  if (/pin|comb|flower/.test(name)) {
    const side = spec.seed % 2 === 0 ? -1 : 1;
    const x0 = centerX + side * Math.round(anatomy.headHalfWidth * 0.62);
    const y0 = anatomy.headTop + 8;
    for (let i = 0; i < 3; i += 1) {
      const x = x0 + side * i;
      const y = y0 + (i % 2);
      if (raster.matAt(x, y) !== MAT.HAIR && raster.matAt(x, y) !== MAT.SKIN) continue;
      raster.set(x, y, ramps.headwear.steps[i === 1 ? 0 : 2], MAT.HEADWEAR, i === 1 ? 0 : 2);
      mask[y * size + x] = 1;
    }
    return mask;
  }

  const top = anatomy.browY - 7;
  const rows = /wide|broad/.test(name) ? 4 : 3;

  for (let y = top; y < top + rows; y += 1) {
    for (let x = 0; x < size; x += 1) {
      // Follow the head, and let the band pass over hair as well as skin.
      const material = raster.matAt(x, y);
      if (material !== MAT.SKIN && material !== MAT.HAIR) continue;
      const dx = (x - centerX) / anatomy.headHalfWidth;
      const index = y === top ? 2 : y === top + rows - 1 ? 5 : 3 + (dx > 0.15 ? 1 : 0);
      raster.set(x, y, ramps.headwear.steps[index], MAT.HEADWEAR, index);
      mask[y * size + x] = 1;
    }
  }

  if (beaded) {
    // Individual beads, alternating value so they read as separate objects.
    for (let x = 0; x < size; x += 1) {
      if (!mask[(top + 1) * size + x]) continue;
      if ((x + centerX) % 3 !== 0) continue;
      raster.set(x, top + 1, ramps.headwear.steps[0], MAT.HEADWEAR, 0);
      if (mask[(top + 2) * size + x]) raster.set(x, top + 2, ramps.headwear.steps[6], MAT.HEADWEAR, 6);
    }
  }

  if (leafy) {
    // A ragged upper edge reads as leaves rather than as a machined ring.
    const noise = makeNoise1D(spec.seed ^ 0x4411);
    for (let x = 0; x < size; x += 1) {
      if (!mask[top * size + x]) continue;
      if (noise(x * 0.8) < 0.15) continue;
      const y = top - 1;
      if (raster.matAt(x, y) === MAT.SKIN || raster.matAt(x, y) === MAT.HAIR) {
        raster.set(x, y, ramps.headwear.steps[1], MAT.HEADWEAR, 1);
        mask[y * size + x] = 1;
      }
    }
  }

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
  return mask;
}

function drawCoronet(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);
  const y0 = anatomy.headTop + 4;
  // A feathered or cloth headdress classifies here too, so the band takes the
  // covering's own material rather than always being cast in metal.
  const ramp = ramps.headwear;
  const material = /gold|silver|bronze|brass|steel|iron/.test(spec.headwear!.material) ? MAT.METAL : MAT.HEADWEAR;

  for (let x = centerX - anatomy.headHalfWidth; x <= centerX + anatomy.headHalfWidth; x += 1) {
    for (let y = y0; y < y0 + 3; y += 1) {
      if (x < 0 || x >= size) continue;
      if (Math.abs(x - centerX) > anatomy.headHalfWidth * 0.94) continue;
      const index = y === y0 ? 1 : y === y0 + 2 ? 5 : 3;
      raster.set(x, y, ramp.steps[index], material, index);
      mask[y * size + x] = 1;
    }
  }
  // Points — feathers, spikes, or a crown's fleurons depending on the material.
  const tall = /feather|plume/.test(spec.headwear!.name.toLowerCase()) ? 7 : 3;
  for (let i = -2; i <= 2; i += 1) {
    const x = centerX + i * 9;
    for (let y = y0 - tall; y < y0; y += 1) {
      if (x < 0 || x >= size) continue;
      const index = y < y0 - tall + 2 ? 1 : 3;
      raster.set(x, y, ramp.steps[index], material, index);
      mask[y * size + x] = 1;
    }
    if (spec.headwear!.ornament > 0.6 && material === MAT.METAL) {
      raster.set(x, y0 - tall - 1, ramps.gem.steps[2], MAT.GEM, 2);
      mask[(y0 - tall - 1) * size + x] = 1;
    }
  }
  castOntoFace(context, mask, 1, 1);
  return mask;
}
