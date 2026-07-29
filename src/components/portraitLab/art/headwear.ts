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
  maskEllipse, maskErode, maskFromProfile, maskSubtract, maskUnion, NO_SHADE, Raster,
} from '../core/raster';
import { makeNoise1D, makeNoise2D, makeRng } from '../core/rng';
import { RenderContext, withRaster } from '../render/context';
import { drawOrnaments } from './ornaments';
import { CONICAL_HAT_PATTERN, HeadwearKind, WOVEN_HAT_PATTERN } from '../spec/types';

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

// ---------------------------------------------------------------------------
// Pattern
// ---------------------------------------------------------------------------

/**
 * Repaint one pixel in the covering's second colour, at whatever step of the
 * ramp it was already sitting at.
 *
 * Inheriting the shade index rather than choosing one is the whole trick. A
 * stripe drawn at a fixed value is a decal that ignores the fold it crosses; a
 * stripe that keeps the ground's step goes over the fold with it, so the cloth
 * stays one continuous surface that happens to be two colours.
 */
function patternPixel(context: RenderContext, x: number, y: number, lighten = 0): void {
  const { raster, ramps } = context;
  const current = raster.shadeAt(x, y);
  if (current === NO_SHADE) return;
  const material = raster.matAt(x, y);
  if (material !== MAT.HEADWEAR && material !== MAT.HEADWEAR_ACCENT) return;
  const index = Math.max(0, Math.min(6, Math.round(current + lighten)));
  raster.set(x, y, ramps.headwearAccent.steps[index], MAT.HEADWEAR_ACCENT, index);
}

/**
 * What a length of cloth is patterned with, read out of its name and fibre.
 *
 * Thirty-eight distinct wrapped-cloth items in the app's tables were all
 * arriving here as the same undifferentiated field of colour, which is why a
 * printed Ankara wrapper, a checked keffiyeh and a plain linen kerchief looked
 * like one object in three dyes. The weave is the cheapest way to tell them
 * apart and — for aso oke, Ankara and the keffiyeh check — the historically
 * loaded one.
 */
type ClothPattern = 'plain' | 'stripe' | 'check' | 'print';

function clothPatternFor(name: string, material: string): ClothPattern {
  const text = `${name} ${material}`;
  if (/check|keffiyeh|shemagh|kufiya|ghutra|plaid|tartan|gingham/i.test(text)) return 'check';
  if (/stripe|aso ?oke|kente|ikat|banded|adire|madras/i.test(text)) return 'stripe';
  if (/print|ankara|batik|wax|floral|patterned|embroider|decorated/i.test(text)) return 'print';
  return 'plain';
}

/**
 * Lay a pattern over cloth that has already been filled and folded.
 *
 * Everything here tilts with x, because cloth on a head is on a curved surface
 * and a rule-straight line across it reads as a sticker laid over the top. The
 * tilt is small — a couple of pixels across the whole head — and it is the
 * difference between woven-in and printed-on.
 */
function applyClothPattern(
  context: RenderContext,
  mask: Mask,
  pattern: ClothPattern,
  seed: number
): void {
  if (pattern === 'plain') return;
  const { anatomy } = context;
  const { size, centerX } = anatomy;
  const noise = makeNoise1D(seed ^ 0x1d37);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!mask[y * size + x]) continue;
      const dx = (x + 0.5 - centerX) / Math.max(1, anatomy.headHalfWidth);
      // How far round the head this column has travelled. Bands follow it.
      const wrap = y + dx * dx * 2.4 + dx * 1.2;

      if (pattern === 'stripe') {
        const band = (wrap + noise(y * 0.12) * 0.6) % 7;
        if (band < 1) patternPixel(context, x, y);
        else if (band < 1.9) patternPixel(context, x, y, 1.4);
      } else if (pattern === 'check') {
        // A check is the one pattern that must *not* take the accent colour.
        // The accent is chosen to stand apart in value, and a grid of it at
        // this spacing stops being cloth and becomes a fishnet laid over the
        // head — which is exactly what the first version of this looked like.
        // A woven check is the same yarn doubled, so it is drawn as the ground
        // two steps down, and the gaps in the line do the rest of the work.
        const across = Math.abs((x + dx * 1.5) % 7) < 1;
        const along = Math.abs(wrap % 7) < 1;
        const dash = (x + y) % 3 !== 0;
        if (across && along) context.raster.shift(x, y, 3, context.book);
        else if ((across || along) && dash) context.raster.shift(x, y, 2, context.book);
      } else {
        // A print is motifs on a lattice, not a texture: three pixels in a
        // little cross, spaced far enough apart to read as separate marks.
        const cellX = Math.round((x - centerX) / 6);
        const cellY = Math.round(wrap / 6);
        const jx = Math.round(noise(cellX * 3.1 + cellY) * 1.4);
        const jy = Math.round(noise(cellY * 2.3 + cellX * 0.7) * 1.4);
        const ox = x - centerX - (cellX * 6 + jx);
        const oy = wrap - (cellY * 6 + jy);
        if (Math.abs(ox) + Math.abs(oy) < 1.2) patternPixel(context, x, y, -0.6);
        else if (Math.abs(ox) + Math.abs(oy) < 2.2) patternPixel(context, x, y, 0.8);
      }
    }
  }
}

/**
 * The coverings that enclose the crown, and so hide whatever hair is under
 * them. A band or a coronet is the other sort: it is worn *in* the hair, drawn
 * over it on purpose, and the hair above it is the point.
 */
const CROWN_COVERINGS: ReadonlySet<HeadwearKind> = new Set<HeadwearKind>([
  'cap', 'brimmed_hat', 'wrapped_cloth', 'veil', 'hood', 'helmet',
]);

function drawCovering(context: RenderContext): Mask | null {
  const { spec } = context;
  if (!spec.headwear) return null;
  switch (spec.headwear.kind) {
    case 'cap': return drawCap(context);
    case 'brimmed_hat': return drawBrimmedHat(context);
    case 'wrapped_cloth': return drawWrappedCloth(context);
    case 'veil': return drawVeil(context);
    case 'hood': return drawHood(context);
    case 'helmet':
      // A pith helmet is cork and canvas. Sent through the metal dome it came
      // out a burnished steel bowl on a district officer.
      return /pith|sola|safari/i.test(spec.headwear.name)
        ? drawBrimmedHat(context)
        : drawHelmet(context);
    case 'coronet': return drawCoronet(context);
    case 'band': return drawBand(context);
    default: return null;
  }
}

/**
 * The shape the covering is about to occupy, worked out before the hair is
 * drawn so the hair can be cut to fit under it.
 *
 * It is obtained by drawing the covering onto a scratch raster and keeping only
 * the mask that comes back. That looks wasteful next to a table of crown
 * heights per kind, but every such table drifts: the fur cap grows tufts, the
 * flat-topped cap squares its crown off afterwards, the conical hat is a
 * different shape entirely from the brimmed hat it is routed through. Asking
 * the covering to draw itself is the only version that cannot fall out of step
 * with what actually lands on the portrait.
 */
export function coveringSilhouette(context: RenderContext): Mask | null {
  const kind = context.spec.headwear?.kind;
  if (!kind || !CROWN_COVERINGS.has(kind)) return null;
  const scratch = new Raster(context.raster.width, context.raster.height);
  return drawCovering(withRaster(context, scratch));
}

export function drawHeadwear(context: RenderContext, hairlineY: number): Mask | null {
  const { spec } = context;
  if (!spec.headwear) return null;
  const mask = drawCovering(context);

  // A garland's flowers are the garland. The ornament layer reads `flower` out
  // of the same name and would pin a second, unrelated bloom at the temple —
  // which is how a jasmine string ended up wearing a gold daisy.
  const ornaments = isWreath(spec.headwear)
    ? spec.headwear.ornaments.filter(o => o.kind !== 'flower')
    : spec.headwear.ornaments;

  // Decoration goes on last, over whatever the covering turned out to be, so a
  // plume rises out of the crown of a cap instead of being buried under it. It
  // also runs when there is no covering at all — a hairpin worn in bare hair is
  // the commonest case in the whole table, and the one that started this.
  drawOrnaments(context, ornaments, hairlineY);

  return mask;
}

/**
 * Turns a smooth cap into fur.
 *
 * Three things separate fur from felt, and a smooth filled dome has none of
 * them: the silhouette is broken rather than clean, the value is clumped
 * rather than evenly graded, and there are individual guard hairs catching the
 * light at the edge. The silhouette matters most — a clean outline reads as
 * felt no matter how the interior is shaded.
 *
 * Returns the grown mask so the caller's shadow work covers the tufts too.
 */
function applyFur(context: RenderContext, mask: Mask): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const rng = makeRng(spec.seed ^ 0x9c17);
  const wander = makeNoise1D(spec.seed ^ 0x4d2b);
  const locks = makeNoise2D(spec.seed ^ 0x77a1);
  const pile = makeNoise2D(spec.seed ^ 0x2e55);

  // Push the boundary outward along the surface normal by a wandering amount,
  // so the edge gains clumps and partings rather than uniform fuzz.
  const cx = centerX;
  const cy = anatomy.headTop + anatomy.headHeight * 0.42;
  const grown = mask.slice();
  const tufts: Array<[number, number]> = [];
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      if (!mask[y * size + x]) continue;
      const open =
        !mask[y * size + x - 1] || !mask[y * size + x + 1] ||
        !mask[(y - 1) * size + x];
      if (!open) continue;
      let dx = x + 0.5 - cx;
      let dy = y + 0.5 - cy;
      const len = Math.max(0.001, Math.hypot(dx, dy));
      dx /= len; dy /= len;
      const angle = Math.atan2(dy, dx);
      const reach = 1.3 + wander(angle * 5.5) * 1.7;
      const steps = Math.max(0, Math.round(reach));
      for (let k = 1; k <= steps; k += 1) {
        const nx = Math.round(x + dx * k);
        const ny = Math.round(y + dy * k);
        if (nx < 1 || ny < 1 || nx >= size - 1 || ny >= size - 1) continue;
        // A couple of pixels of fringe over the forehead, but never down into
        // the eyes.
        if (ny > anatomy.browY - 1) continue;
        grown[ny * size + nx] = 1;
        if (k === steps) tufts.push([nx, ny]);
      }
    }
  }

  // Fur scatters light, so it sits flatter and lighter than a felt dome.
  fillHeadwear(context, grown, { dither: 0.75, gain: 5.2 });

  // Clumped value. Two offset 1D fields stand in for a 2D one, which is enough
  // to break the even gradient into locks of hair.
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!grown[y * size + x]) continue;
      // Two octaves: broad locks, plus a finer pile on top of them. Squashing
      // y makes each lock slightly taller than it is wide, which is the way
      // fur lies on a curved surface.
      const m = locks(x * 0.34, y * 0.26) * 1.0 + pile(x * 0.85, y * 0.7) * 0.45;
      const shift = Math.round(m * 1.5);
      if (shift !== 0) raster.shift(x, y, shift, book);
    }
  }

  // Guard hairs: single lit pixels at the tips, single dark ones just inside.
  for (const [x, y] of tufts) {
    if (rng() > 0.45) raster.shift(x, y, -2, book);
    const iy = y + 1;
    if (iy < size && grown[iy * size + x] && rng() > 0.7) raster.shift(x, iy, 2, book);
  }

  return grown;
}

/**
 * The soft caps that are a shape rather than a dome.
 *
 * `cap` is the fallback kind, so it collects forty-nine distinct names and used
 * to draw one skullcap for all of them. A newsboy cap, a beret, a fez and a
 * baseball cap have almost nothing in common except that none of them is a
 * smooth hemisphere, and each is defined by a single silhouette move: a peak
 * jutting forward, a disc slumped to one side, a flat truncated top, a curved
 * bill. Those moves are cheap and they are the entire recognition.
 */
// Gandhi's cap is deliberately absent: it is a brimless boat-shaped khadi cap
// and giving it a peak turns a piece of political dress into a workman's cap.
const PEAKED_CAP = /newsboy|flat cap|cheese-cutter|baseball|snapback|mao cap|zhongshan cap|visor|official cap|guan cap/i;
const BERET = /beret|tam|balmoral/i;
const FEZ = /fez|tarboosh|kufi|taqiyah|kofia|topi|songkok/i;
const PILLBOX = /pillbox|toque/i;

function drawPeakedCap(context: RenderContext, soft: boolean): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;

  // The crown. A newsboy's is slack and sits wide of the skull; a baseball
  // cap's is fitted. Both are lower at the back than a skullcap would be.
  const bottom = anatomy.browY - 2;
  const crown = crownMask(context, soft ? 3.4 : 1.4, soft ? 3 : 2, bottom);
  fillHeadwear(context, crown, { dither: soft ? 0.55 : 0.35 });

  const mask = crown.slice();

  // The peak: a stiff shelf thrown forward over the brow, dark underneath
  // because nothing lights the underside of a brim.
  const peakY = bottom - 1;
  const peakHalf = anatomy.headHalfWidth * (soft ? 0.86 : 0.94);
  const reach = soft ? 3 : 5;
  for (let dy = 0; dy <= reach; dy += 1) {
    const t = dy / reach;
    const half = peakHalf * Math.sqrt(Math.max(0, 1 - t * t * 0.82));
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      const y = peakY + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const index = dy === 0 ? 1.5 : 4.4 + t * 1.6;
      raster.set(x, y, ramps.headwear.steps[Math.round(index)], MAT.HEADWEAR, Math.round(index));
      mask[y * size + x] = 1;
    }
  }

  if (soft) {
    // A newsboy cap is panelled and slouches forward over its own peak. One
    // seam and one fold is the whole difference from a felt bowl.
    const noise = makeNoise1D(spec.seed ^ 0x3c19);
    for (let y = anatomy.headTop - 3; y < peakY; y += 1) {
      const x = Math.round(centerX + 2 + noise(y * 0.3) * 3);
      if (!mask[y * size + x]) continue;
      raster.shift(x, y, 2, book);
      raster.shift(x - 1, y, -1, book);
    }
    // The button at the crown, which every one of these has.
    raster.set(centerX, anatomy.headTop - 3, ramps.headwear.steps[1], MAT.HEADWEAR, 1);
  }

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 4 });
  for (let y = peakY + reach + 1; y < anatomy.eyeY; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (raster.matAt(x, y) === MAT.SKIN) raster.shift(x, y, 1, book);
    }
  }
  return mask;
}

/** A beret: a soft disc that slumps to one side and has no structure at all. */
function drawBeret(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const side = (spec.seed & 2) === 0 ? 1 : -1;

  const mask = makeMask(size, size);
  const cy = anatomy.headTop + 2;
  const rx = anatomy.headHalfWidth * 1.16;
  const ry = 8.5;
  for (let y = Math.round(cy - ry); y <= Math.round(cy + ry); y += 1) {
    for (let x = Math.round(centerX - rx); x <= Math.round(centerX + rx); x += 1) {
      // The disc is pulled down over one ear and lifts off the other, so its
      // centre is offset from the skull's rather than sitting on it.
      const dx = (x - (centerX + side * 3)) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      mask[y * size + x] = 1;
    }
  }
  // It still has to sit on the head rather than float above it.
  const seat = crownMask(context, 0.6, -2, anatomy.browY - 5);
  for (let i = 0; i < mask.length; i += 1) if (seat[i]) mask[i] = 1;

  fillHeadwear(context, mask, { dither: 0.5, gain: 5.4 });
  // The stalk at the centre of the crown.
  raster.set(centerX + side * 2, Math.round(cy - ry) + 1, ramps.headwear.steps[1], MAT.HEADWEAR, 1);
  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  return mask;
}

/**
 * A fan of pleats springing from one point — the tied end of a safa, the
 * standing wing of a gele.
 *
 * Both of those failed the same way when they were drawn as shading inside the
 * wrap: a fan that does not break the silhouette is not a fan, it is a slightly
 * uneven patch of the same hat. So this builds an actual mask outside the head
 * and fills it with alternating pleats, each one a wedge from the knot, with a
 * dark seam where two pleats meet. The alternation is what carries it — a solid
 * shape the same colour as the wrap is a lump, however well its edge is drawn.
 */
function drawPleatFan(
  context: RenderContext,
  originX: number,
  originY: number,
  startAngle: number,
  endAngle: number,
  length: number,
  pleats: number
): Mask {
  const { anatomy, raster, ramps, book } = context;
  const { size } = anatomy;
  const mask = makeMask(size, size);
  const steps = Math.max(24, Math.round(Math.abs(endAngle - startAngle) * 30));

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = startAngle + (endAngle - startAngle) * t;
    // Longest in the middle, so the fan's outer edge is a curve rather than a
    // sector of a circle — cloth held by one corner sags at its ends.
    const reach = length * (0.62 + Math.sin(t * Math.PI) * 0.38);
    const pleat = Math.floor(t * pleats);
    const seam = Math.abs(t * pleats - Math.round(t * pleats)) < 0.08;
    for (let r = 0; r <= reach; r += 0.5) {
      const x = Math.round(originX + Math.cos(angle) * r);
      const y = Math.round(originY + Math.sin(angle) * r);
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const index = seam ? 5.4 : pleat % 2 === 0 ? 2.2 : 3.6;
      const step = Math.round(index);
      raster.set(x, y, ramps.headwear.steps[step], MAT.HEADWEAR, step);
      mask[y * size + x] = 1;
    }
  }

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  return mask;
}

/**
 * Knitwear.
 *
 * A knitted cap and a felt cap are both a dome, and drawn as one they were the
 * same object in two colours — which is a real loss, because knitting is one of
 * the few crafts whose *structure* is visible at portrait scale. Three things
 * make wool read as knitted:
 *
 * The **cuff**. Every one of these is worn with a ribbed turn-up, and the ribs
 * run vertically while the stitches above them run in courses. That change of
 * direction at the brow is the single loudest signal in the whole shape.
 *
 * The **grain**. Stockinette is a field of V's, and at one pixel per stitch
 * that is a two-tone lattice offset by half a stitch each course. It reads as
 * texture rather than as noise because it is regular — the dither the felt cap
 * uses is the opposite, and reads as fuzz.
 *
 * The **colourwork**. A band of contrasting yarn round the crown is what a
 * knitter does with a second ball of wool, from Andean chullos to Baltic
 * mittens, and it is where the app's palette accent finally earns its keep.
 */
// `toque` is deliberately absent: it is already claimed by the pillbox, which
// is the older sense of the word and the one the app's tables use.
const KNIT = /knit|knitted|beanie|chullo|stocking cap|watch cap|nightcap|toboggan/i;

function drawKnitCap(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const text = `${spec.headwear!.name} ${spec.headwear!.material}`.toLowerCase();
  const rng = makeRng(spec.seed ^ 0x5b21);
  const noise = makeNoise1D(spec.seed ^ 0x33a7);
  const earflaps = /chullo|ear.?flap|flapped|aviator/.test(text);
  const pompom = earflaps || /pom|bobble|tassel/.test(text) || rng() > 0.62;

  // Knitted wool has give, so it sits a little proud of the skull and slumps
  // rather than gripping it. A stiff outline is felt however it is shaded.
  const cuffBottom = anatomy.browY - 2;
  const mask = crownMask(context, 2.7, earflaps ? 5 : 4, cuffBottom);
  fillHeadwear(context, mask, { dither: 0.3, gain: 5.4 });

  const cuffTop = cuffBottom - 5;

  // The grain: one pixel per stitch, half a stitch offset per course.
  for (let y = anatomy.headTop - 6; y < cuffTop; y += 1) {
    const course = Math.floor(y / 2);
    for (let x = 0; x < size; x += 1) {
      if (!mask[y * size + x]) continue;
      if ((x + course) % 2 === 0) raster.shift(x, y, -1, book);
      else if ((x + course) % 4 === 1) raster.shift(x, y, 1, book);
    }
  }

  // Colourwork. A band of it sits where the crown starts to turn away, which is
  // both where a knitter puts it and where it is most visible from the front.
  if (rng() > 0.28) {
    const bandY = Math.round(anatomy.headTop + (cuffTop - anatomy.headTop) * 0.42);
    for (let y = bandY; y < bandY + 4; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!mask[y * size + x]) continue;
        const step = (x + (y === bandY + 1 || y === bandY + 2 ? 0 : 2)) % 4;
        // A zigzag rather than a stripe: two rows solid, the rows above and
        // below broken into single stitches, which is the simplest motif that
        // still reads as a pattern someone chose.
        if (y === bandY || y === bandY + 3 ? step < 1 : step < 3) patternPixel(context, x, y);
      }
    }
  }

  // The ribbed cuff, and the fold at the top of it.
  for (let y = cuffTop; y <= cuffBottom; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!mask[y * size + x]) continue;
      const rib = (x + Math.round(noise(x * 0.05) * 0.4)) % 3;
      if (rib === 0) raster.shift(x, y, -1, book);
      else if (rib === 2) raster.shift(x, y, 2, book);
      if (y === cuffTop) raster.shift(x, y, 2, book);
      if (y === cuffTop + 1) raster.shift(x, y, -1, book);
    }
  }

  // The crown decreases — where the knitting was gathered off, in a small
  // spiral of darker stitches. Without it the top of a beanie is a bald patch.
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + 0.4;
    for (let r = 1; r < 5; r += 1) {
      const x = Math.round(centerX + Math.cos(angle) * r * 1.6);
      const y = Math.round(anatomy.headTop - 3 + Math.sin(angle) * r * 0.9);
      if (x < 0 || y < 0 || x >= size || !mask[y * size + x]) continue;
      raster.shift(x, y, 1, book);
    }
  }

  if (earflaps) {
    // Flaps come down over the ears and end in a plaited tie. A chullo without
    // them is just a beanie, and the app's tables call for them by name.
    for (const side of [-1, 1] as const) {
      const x0 = Math.round(centerX + side * (anatomy.headHalfWidth - 1));
      for (let y = anatomy.earTopY - 2; y < anatomy.earBottomY + 4; y += 1) {
        const t = (y - (anatomy.earTopY - 2)) / 14;
        const half = Math.max(1, 4.5 * (1 - t * t * 0.9));
        for (let d = -half; d <= half; d += 1) {
          const x = Math.round(x0 + side * 1.5 + d);
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const index = 3.4 + Math.abs(d) / half + (side > 0 ? 0.5 : -0.3);
          const step = Math.max(0, Math.min(6, Math.round(index)));
          raster.set(x, y, ramps.headwear.steps[step], MAT.HEADWEAR, step);
          mask[y * size + x] = 1;
          if ((x + Math.floor(y / 2)) % 2 === 0) raster.shift(x, y, -1, book);
        }
      }
      // The tie: three pixels of twisted cord, in the contrasting yarn.
      for (let i = 0; i < 6; i += 1) {
        const x = Math.round(x0 + side * (2 + Math.sin(i * 0.8)));
        const y = anatomy.earBottomY + 4 + i;
        if (y >= size) break;
        const step = i % 2 === 0 ? 2 : 4;
        raster.set(x, y, ramps.headwearAccent.steps[step], MAT.HEADWEAR_ACCENT, step);
        mask[y * size + x] = 1;
      }
    }
  }

  if (pompom) {
    // A bobble is a ball of loose ends, so it wants a broken outline: a tidy
    // disc on top of a hat reads as a cherry.
    const cx = centerX + (rng() > 0.5 ? 1 : -1);
    const cy = anatomy.headTop - 6;
    for (let dy = -3; dy <= 3; dy += 1) {
      for (let dx = -3; dx <= 3; dx += 1) {
        const d = Math.hypot(dx, dy * 1.1);
        if (d > 3 || (d > 2.1 && noise(dx * 2.7 + dy * 1.3) < 0.1)) continue;
        const index = 2.2 + (dx + dy) * 0.45 + (noise(dx * 5 + dy * 3) - 0.5);
        const step = Math.max(0, Math.min(6, Math.round(index)));
        raster.set(cx + dx, cy + dy, ramps.headwearAccent.steps[step], MAT.HEADWEAR_ACCENT, step);
        mask[(cy + dy) * size + (cx + dx)] = 1;
      }
    }
  }

  castOntoFace(context, mask, 2, 2);
  return mask;
}

/** A truncated cone worn upright — fez, kufi, taqiyah, topi. */
function drawFez(context: RenderContext, tassel: boolean): Mask {
  const { anatomy, raster, ramps, book } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);

  const top = anatomy.headTop - (tassel ? 5 : 0);
  const bottom = anatomy.browY - 4;
  const span = Math.max(1, bottom - top);
  for (let y = top; y <= bottom; y += 1) {
    const t = (y - top) / span;
    // Straight sides, flat top: the shape is a section of a cylinder, and any
    // curvature at the crown turns it back into a skullcap.
    const half = anatomy.headHalfWidth * (0.74 + t * 0.3);
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      mask[y * size + x] = 1;
    }
  }
  fillHeadwear(context, mask, { dither: 0.3, gain: 5 });
  // A flat top takes light square on, so it reads brighter than the sides.
  for (let x = 0; x < size; x += 1) {
    if (mask[top * size + x]) raster.set(x, top, ramps.headwear.steps[1], MAT.HEADWEAR, 1);
  }

  if (tassel) {
    // The tassel hangs off the crown down one side.
    for (let i = 0; i < 9; i += 1) {
      const x = centerX + Math.round(anatomy.headHalfWidth * 0.8) + (i > 3 ? 1 : 0);
      const y = top + i;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      raster.set(x, y, ramps.clothC.steps[i > 6 ? 1 : 3], MAT.CLOTH_C, i > 6 ? 1 : 3);
    }
  }
  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 3 });
  return mask;
}

/** A pillbox: a short flat-topped cylinder perched high on the head. */
function drawPillbox(context: RenderContext): Mask {
  const { anatomy, raster, ramps, book } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);
  const top = anatomy.headTop + 1;
  const half = anatomy.headHalfWidth * 0.78;
  for (let y = top; y <= top + 8; y += 1) {
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      mask[y * size + x] = 1;
    }
  }
  fillHeadwear(context, mask, { dither: 0.25, gain: 4.6 });
  for (let x = 0; x < size; x += 1) {
    if (mask[top * size + x]) raster.set(x, top, ramps.headwear.steps[1], MAT.HEADWEAR, 1);
  }
  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  return mask;
}

function drawCap(context: RenderContext): Mask {
  const { spec, anatomy, raster, ramps } = context;
  const name = spec.headwear!.name.toLowerCase();
  const material = spec.headwear!.material.toLowerCase();

  if (PEAKED_CAP.test(name)) return drawPeakedCap(context, /newsboy|flat cap|cheese/i.test(name));
  if (BERET.test(name)) return drawBeret(context);
  if (PILLBOX.test(name)) return drawPillbox(context);
  if (FEZ.test(name)) return drawFez(context, /fez|tarboosh/i.test(name));
  if (KNIT.test(`${name} ${material}`)) return drawKnitCap(context);

  // A coif covers the ears and frames the whole face; a scholar's cap or a
  // skullcap sits high on the crown. Same primitive, different bottom edge.
  const isCoif = /coif|bonnet|kerchief|tignon/.test(name);
  const isFlatTop = /scholar|biretta|futou|official/.test(name);
  // Fur sits thick and high on the head; felt sits close to it.
  const isFur = !isCoif && !isFlatTop &&
    /fur|pelt|shearling|astrakhan|ushanka|papakha|sheepskin|sable|mink|beaver|ermine|wolf|fox|bear|otter|marten/.test(`${name} ${material}`);

  const bottom = isCoif ? anatomy.chinY - 4 : anatomy.browY - 3;
  let mask = crownMask(context, isCoif ? 2.8 : isFur ? 3.1 : 1.6, isFlatTop ? 4 : isFur ? 4 : 2, bottom);
  if (isCoif) mask = maskSubtract(mask, faceOpening(context, anatomy.browY - 3));

  if (isFur) {
    mask = applyFur(context, mask);
    castOntoFace(context, mask, 3, 2);
    return mask;
  }

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

// ---------------------------------------------------------------------------
// Woven hats
// ---------------------------------------------------------------------------

/**
 * Which shape a plant-fibre hat takes, and how it is proportioned.
 *
 * "Straw Hat" is 15% of every head item the app produces — thirty personas in a
 * two-hundred audit, all of them previously wearing the identical cone. That is
 * both the most repeated object in the portrait set and a claim about the world
 * that is simply false: the same fistful of straw is plaited into a steep douli
 * on the Yangtze, a broad low sombrero in the Andes, and a shallow round sunhat
 * with a floppy brim across Europe and the Sahel. The fibre is universal; the
 * silhouette is entirely local.
 *
 * Era does less work here than place, but it does some: the older the century,
 * the coarser the plait and the more likely the hat is to be worn out, because
 * hats were made by hand from what grew nearby and were kept until they failed.
 */
interface WovenHatProfile {
  /** How far past the head the brim reaches, as a multiple of the half-width. */
  spread: number;
  /** How far the crown or apex rises above the skull. */
  rise: number;
  /** Coils of plait from apex to rim. More is a finer weave. */
  rings: number;
  /** How far the near edge of the rim sags below the widest point. */
  sag: number;
  /** A cord under the chin. Working hats have one; a hat for show does not. */
  cord: boolean;
  frayed: boolean;
}

const CONICAL_ZONES = new Set(['EAST_ASIAN', 'SOUTH_ASIAN', 'OCEANIA']);

/** Broad and low, or steep and narrow — the local answer. */
function wovenHatProfile(context: RenderContext, conical: boolean): WovenHatProfile {
  const { spec } = context;
  const zone = spec.culturalZone || '';
  const era = spec.era || '';
  const rng = makeRng(spec.seed ^ 0x2d94);
  const wide = zone === 'SOUTH_AMERICAN' || zone === 'NORTH_AMERICAN_PRE_COLUMBIAN'
    || zone === 'MENA';
  // A hand-plaited hat from a century without mills is coarser and more worn.
  const early = era === 'PREHISTORY' || era === 'ANTIQUITY' || era === 'MEDIEVAL';
  const jitter = (spread: number) => (rng() - 0.5) * spread;

  if (conical) {
    return {
      // A salakot is flatter and wider than a douli; both are narrower than the
      // sunhats worn in the open country of the Americas.
      spread: (zone === 'SOUTH_ASIAN' ? 1.78 : 1.6) + jitter(0.22),
      rise: (zone === 'SOUTH_ASIAN' ? 5 : 8) + Math.round(jitter(3)),
      rings: (early ? 4.4 : 5.8) + jitter(1.1),
      sag: 4.5 + jitter(1.4),
      cord: rng() > 0.45,
      frayed: rng() > (early ? 0.4 : 0.65),
    };
  }
  return {
    spread: (wide ? 1.95 : 1.62) + jitter(0.2),
    rise: (wide ? 3 : 5) + Math.round(jitter(2)),
    rings: (early ? 3.6 : 4.8) + jitter(0.9),
    sag: 2.6 + jitter(1),
    cord: rng() > (wide ? 0.45 : 0.7),
    frayed: rng() > (early ? 0.45 : 0.7),
  };
}

/**
 * The cord under the chin.
 *
 * Cheap, and it does more for realism than another pass of weave texture would:
 * a wide hat with nothing holding it on is a prop balanced on a head, and one
 * with a cord is a thing somebody works in on a windy hillside.
 */
function drawChinCord(context: RenderContext, fromY: number, halfWidth: number): void {
  const { anatomy, raster, ramps } = context;
  const { size, centerX } = anatomy;
  const chin = anatomy.chinY + 2;
  for (const side of [-1, 1] as const) {
    const x0 = centerX + side * halfWidth * 0.82;
    const steps = Math.max(1, chin - fromY);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      // Slack: the cord bows outward before it comes in under the jaw.
      const bow = Math.sin(t * Math.PI) * 2.2;
      const x = Math.round(x0 + side * bow - side * t * (halfWidth * 0.82 - anatomy.headHalfWidth * 0.42));
      const y = fromY + i;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const step = i < 2 ? 5 : 4;
      raster.set(x, y, ramps.leather.steps[step], MAT.LEATHER, step);
    }
  }
}

/**
 * A round-crowned woven sunhat — the European field hat, the Sahelian one, and
 * with a wide enough brim the Andean and Mexican ones.
 *
 * The recognition is all in the brim, and specifically in the fact that it is
 * not flat. Straw plait has no stiffness of its own: it sags at the sides under
 * its own weight, more the wider it is cut, and drawing it as a rigid ellipse
 * is what makes a procedural sunhat read as a plastic disc.
 */
function drawStrawHat(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const profile = wovenHatProfile(context, false);
  const noise = makeNoise1D(spec.seed ^ 0x63a1);

  const brimY = anatomy.browY - 4;
  const crownBottom = brimY + 1;
  const crown = crownMask(context, 1.5, profile.rise, crownBottom);
  const brimHalf = anatomy.headHalfWidth * profile.spread;

  // The brim, drooping as it goes out. Every column of it is placed by hand
  // rather than taken from an ellipse, because the droop *is* the hat.
  const brim = makeMask(size, size);
  const droopAt = (dx: number) => {
    const t = Math.min(1, Math.abs(dx) / brimHalf);
    return t * t * (profile.spread - 1.1) * 7;
  };
  for (let dx = -Math.round(brimHalf); dx <= Math.round(brimHalf); dx += 1) {
    const x = centerX + dx;
    if (x < 0 || x >= size) continue;
    const t = Math.min(1, Math.abs(dx) / brimHalf);
    // Thickness in section: deepest under the crown, tapering to the edge.
    const thickness = Math.max(1, Math.round((1 - t * t) * profile.sag + 1.6));
    const top = Math.round(brimY + droopAt(dx)) - (profile.frayed && noise(dx * 0.7) > 0.6 ? 1 : 0);
    for (let y = top; y < top + thickness; y += 1) {
      if (y < 0 || y >= size) continue;
      brim[y * size + x] = 1;
    }
  }

  fillHeadwear(context, crown, { dither: 0.3, gain: 5.2 });
  fillMask(raster, brim, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dx = (x - centerX) / brimHalf;
    const top = brimY + droopAt(x - centerX);
    // Lit along the upper surface, dark underneath — the same value split that
    // makes a felt brim work, but following the droop rather than a straight
    // line, so the shadow curves the way the cloth does.
    return (y <= top ? 2.0 : 4.4) + Math.abs(dx) * 1.0 + (dx > 0.2 ? 0.4 : -0.2);
  }, { dither: 0.35 });

  // The plait: concentric coils across the crown and out along the brim, with
  // the radial stagger that stops them reading as contour lines.
  const mask = maskUnion(crown, brim);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!mask[y * size + x]) continue;
      const dx = x + 0.5 - centerX;
      const dy = y - (anatomy.headTop - profile.rise);
      const radial = Math.min(1, Math.hypot(dx / brimHalf, dy / 26));
      const ring = (radial * profile.rings * 2.2 + noise(radial * 6) * 0.08) % 1;
      if (ring < 0.26) raster.shift(x, y, 1, book);
      else if (ring > 0.88) raster.shift(x, y, -1, book);
      if (radial > 0.5 && (Math.atan2(Math.max(1, dy), dx) * 8 / Math.PI) % 1 < 0.18) {
        raster.shift(x, y, 1, book);
      }
    }
  }

  // A worn hat loses fibres along the edge, which breaks the silhouette in the
  // one place the eye checks for machine-made regularity.
  if (profile.frayed) {
    for (let x = 0; x < size; x += 1) {
      for (let y = size - 1; y >= 0; y -= 1) {
        if (!brim[y * size + x]) continue;
        if (noise(x * 1.3) > 0.55) raster.shift(x, y, 1, book);
        break;
      }
    }
  }

  // A band where the crown meets the brim: cloth on a good hat, plaited fibre
  // on a working one.
  for (let y = brimY - 4; y < brimY - 1; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!crown[y * size + x]) continue;
      const index = y === brimY - 4 ? 2 : 4;
      const ramp = spec.headwear!.ornament > 0.25 ? ramps.clothC : ramps.headwear;
      const material = spec.headwear!.ornament > 0.25 ? MAT.CLOTH_C : MAT.HEADWEAR;
      raster.set(x, y, ramp.steps[index], material, index);
    }
  }

  if (profile.cord) drawChinCord(context, brimY + 4, brimHalf);

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 4 });
  for (let y = brimY + 2; y < anatomy.eyeY; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (raster.matAt(x, y) === MAT.SKIN) raster.shift(x, y, 1, book);
    }
  }
  return mask;
}

/**
 * A conical woven hat — douli, sugegasa, salakot, non la.
 *
 * The thing that makes these read as a real object rather than a triangle
 * parked on a disc is that the cone and the brim are *one continuous surface*.
 * There is no join to see. Drawing them as a separate cone plus an ellipse
 * leaves a dark wedge where the two meet and the whole thing reads as a witch
 * hat balanced on a plate.
 *
 * Seen from the front the rim is a circle in perspective, so it sags below the
 * widest points rather than cutting straight across. That sag, plus the woven
 * rings, is most of the realism here.
 */
function drawConicalHat(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const profile = wovenHatProfile(context, true);
  const weathered = profile.frayed;

  const rimY = anatomy.browY - 4;
  const apexY = anatomy.headTop - profile.rise;
  const maxHalf = anatomy.headHalfWidth * profile.spread;
  const sag = profile.sag;
  const span = Math.max(1, rimY - apexY);
  const noise = makeNoise1D(spec.seed ^ 0x51c3);

  // Slope profile. An exponent just above 1 gives the slightly concave flare a
  // real woven hat has; a straight line reads as a party hat.
  const halfAt = (y: number) => {
    const t = Math.max(0, Math.min(1, (y - apexY) / span));
    let half = maxHalf * Math.pow(t, 1.18);
    // Round the point off. Clamping to a flat minimum instead leaves a
    // straight-sided chimney sticking out of the top of the hat.
    if (t < 0.14) half = Math.max(half, 0.7 + (t / 0.14) * 1.4);
    return Math.max(0.7, half);
  };

  const mask = makeMask(size, size);
  for (let y = apexY; y <= rimY; y += 1) {
    const half = halfAt(y);
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      mask[y * size + x] = 1;
    }
  }
  // The cone is narrower than the skull near the crown, so on its own it lets
  // hair show *above* the brim, which cannot happen on a real hat. Union it
  // with the skull profile so the covering always contains the head.
  const crown = crownMask(context, 0.5, 3, rimY);
  for (let i = 0; i < mask.length; i += 1) if (crown[i]) mask[i] = 1;

  // The near edge of the rim, sagging below the widest points.
  const rimArc = maskEllipse(size, size, centerX, rimY, maxHalf, sag);
  for (let y = rimY; y < Math.min(size, rimY + sag + 2); y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (rimArc[y * size + x]) mask[y * size + x] = 1;
    }
  }

  // Shade as a cone: the surface turns away from the light as it wraps around,
  // so value tracks horizontal position, and the underside of the near rim is
  // always the darkest part of the hat.
  fillMask(raster, mask, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const u = (x + 0.5 - centerX) / maxHalf;
    const t = Math.max(0, Math.min(1, (y - apexY) / span));
    let index = 2.15 + u * 1.85 + t * 0.85;
    if (y > rimY) index += 2.2;            // underside of the brim
    return index;
  }, { dither: 0.3 });

  // The weave. Concentric rings are how a coiled bamboo hat actually reads at
  // this size; the radial ribs underneath them are what stop the rings from
  // looking like contour lines on a map.
  const rings = profile.rings;
  for (let y = apexY; y < Math.min(size, rimY + sag + 2); y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!mask[y * size + x]) continue;
      const dx = x + 0.5 - centerX;
      const dy = y - apexY;
      const half = Math.max(1, halfAt(y));
      // Distance from the apex along the cone's surface, normalised.
      const radial = Math.min(1, Math.hypot(dx / maxHalf, dy / span * 0.85));
      const wobble = noise(radial * 7) * 0.06;
      const ring = (radial * rings + wobble) % 1;
      if (ring < 0.24) {
        raster.shift(x, y, 1, book);
      } else if (ring > 0.86) {
        raster.shift(x, y, -1, book);      // the lit top of each coil
      }
      // Radial ribs, only on the lower half where they would be visible.
      if (radial > 0.45) {
        const angle = Math.atan2(Math.max(1, dy), dx);
        if ((angle * 9 / Math.PI) % 1 < 0.16) raster.shift(x, y, 1, book);
      }
      // A worn hat loses fibres at the rim.
      if (weathered && Math.abs(Math.abs(dx) - half) < 1.2 && noise(x * 0.9 + y) > 0.5) {
        raster.shift(x, y, 1, book);
      }
    }
  }

  // Crisp the silhouette: a bright catch along the top-left slope and a dark
  // lip all the way round the rim.
  for (let y = apexY; y < Math.min(size, rimY + sag + 2); y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!mask[y * size + x]) continue;
      const left = !mask[y * size + x - 1];
      const right = !mask[y * size + x + 1];
      const below = y + 1 < size && !mask[(y + 1) * size + x];
      if (below && y >= rimY) raster.shift(x, y, 2, book);
      else if (left && y < rimY) raster.shift(x, y, -1, book);
      else if (right && y < rimY) raster.shift(x, y, 1, book);
    }
  }

  if (profile.cord) drawChinCord(context, rimY + Math.round(sag) + 1, maxHalf);

  // A wide brim shades the whole upper face, not just the row beneath it.
  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 4 });
  for (let y = rimY + 2; y < anatomy.eyeY; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (raster.matAt(x, y) === MAT.SKIN) raster.shift(x, y, 1, book);
    }
  }

  return mask;
}

function drawBrimmedHat(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const name = spec.headwear!.name.toLowerCase();
  const material = spec.headwear!.material.toLowerCase();
  const tall = /top hat|capotain|steeple/.test(name);
  // Woven plant fibre is one material and several hats. A name that states the
  // shape — douli, salakot, sugegasa — is a cone anywhere on earth; a name that
  // states only the fibre is a cone in the places that plait cones and a
  // round-crowned sunhat everywhere else. Getting that split right is what
  // stopped one persona in seven from wearing the same hat.
  const woven = WOVEN_HAT_PATTERN.test(`${name} ${material}`);
  const conical = CONICAL_HAT_PATTERN.test(`${name} ${material}`)
    || (woven && CONICAL_ZONES.has(spec.culturalZone || ''));
  if (conical) return drawConicalHat(context);
  if (woven) return drawStrawHat(context);
  // A pillbox is called a hat and has no brim whatever. Routed through the
  // brimmed classifier by its own name, it came out a bowler.
  if (PILLBOX.test(name)) return drawPillbox(context);

  const brimY = anatomy.browY - 5;
  const crownBottom = brimY + 1;
  // Hats that are one shape with one move. Each of these is drawn as a bowler
  // plus that move rather than from scratch, because the brim, the shadow and
  // the seating on the skull are the same problem every time and only the
  // crown differs.
  const creased = /fedora|homburg|trilby|panama/i.test(name);
  const flatTop = /boater|pork ?pie/i.test(name);
  const tricorn = /tricorn|bicorne/i.test(name);
  const pith = /pith|sola|safari/i.test(name);
  // Everything woven has already been sent elsewhere, so from here down this is
  // the felt hat: a dome, a stiff brim, and one move per name.
  const crown = crownMask(context, 1.8, tall ? 14 : 4, crownBottom);

  const brimHalf = anatomy.headHalfWidth * (tricorn ? 1.5 : pith ? 1.58 : 1.42);
  const brim = maskEllipse(size, size, centerX, brimY + 1, brimHalf, pith ? 4.2 : 3.6);

  fillHeadwear(context, crown, { dither: pith ? 0.2 : 0.35 });

  if (flatTop) {
    // A boater's crown is a cylinder with a flat lid, not a dome. Squaring the
    // top off is the entire recognition.
    for (let y = anatomy.headTop - 4; y < anatomy.headTop; y += 1) {
      for (let x = centerX - 14; x <= centerX + 14; x += 1) {
        if (x < 0 || y < 0 || x >= size) continue;
        if (Math.abs(x - centerX) > anatomy.headHalfWidth * 0.92) continue;
        const index = y === anatomy.headTop - 4 ? 1 : 3;
        raster.set(x, y, ramps.headwear.steps[index], MAT.HEADWEAR, index);
        crown[y * size + x] = 1;
      }
    }
  }

  if (creased) {
    // The lengthwise crease and the two pinches at the front of a soft felt
    // hat. Without them a fedora is a bowler, which is a different decade and
    // a different class.
    for (let y = anatomy.headTop - 3; y < brimY - 6; y += 1) {
      const x = centerX;
      if (!crown[y * size + x]) continue;
      raster.shift(x, y, 3, book);
      raster.shift(x - 1, y, -1, book);
      raster.shift(x + 1, y, -1, book);
    }
    for (const side of [-1, 1] as const) {
      for (let y = anatomy.headTop - 1; y < anatomy.headTop + 5; y += 1) {
        const x = Math.round(centerX + side * anatomy.headHalfWidth * 0.62);
        if (!crown[y * size + x]) continue;
        raster.shift(x, y, 2, book);
      }
    }
  }

  // The brim is lit on top and dark underneath — that value split is the brim.
  fillMask(raster, brim, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dy = y - (brimY + 1);
    const dx = (x - centerX) / brimHalf;
    return (dy < 0 ? 2.1 : 4.6) + Math.abs(dx) * 0.9 + (dx > 0.2 ? 0.4 : 0);
  }, { dither: 0.4 });

  if (tricorn) {
    // Three sides of the brim cocked up against the crown. Drawn as two wings
    // rising off the sides, which is what the shape reads as from the front.
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < 12; i += 1) {
        const x = Math.round(centerX + side * (anatomy.headHalfWidth * 0.55 + i));
        const lift = Math.round(i * 0.9);
        for (let dy = 0; dy < 3; dy += 1) {
          const y = brimY - lift + dy;
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          const index = dy === 0 ? 1.4 : 4.6;
          raster.set(x, y, ramps.headwear.steps[Math.round(index)], MAT.HEADWEAR, Math.round(index));
          brim[y * size + x] = 1;
        }
      }
    }
  }

  // Hat band.
  if (spec.headwear!.ornament > 0.2) {
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

/**
 * Wrapped cloth — the commonest covering in the whole app, and until now the
 * one with the least to say for itself.
 *
 * Thirty-eight distinct items route here: kerchiefs, keffiyehs, geles, turbans,
 * headwraps, duku, aso oke. They were all drawn as one wrapped bowl with a tail
 * over one shoulder, so a Yoruba gele and a Russian kerchief differed only in
 * hue. But these are not variations on a shape — they are different *acts*. A
 * kerchief is folded and knotted; a gele is tied, and the tying is a display; a
 * keffiyeh is not tied at all but laid square over the head and held by a cord.
 * Drawing the act is what tells them apart.
 */
type WrapForm = 'turban' | 'safa' | 'gele' | 'keffiyeh' | 'kerchief' | 'headcloth';

function wrapFormFor(text: string): WrapForm {
  if (/safa|peta|kalgi|pagri/i.test(text)) return 'safa';
  if (/turban/i.test(text)) return 'turban';
  if (/gele|aso ?oke|ankara|duku|doek|dhuku/i.test(text)) return 'gele';
  if (/keffiyeh|shemagh|kufiya|ghutra|agal/i.test(text)) return 'keffiyeh';
  if (/kerchief|scarf|babushka|tignon|head tie|fichu/i.test(text)) return 'kerchief';
  return 'headcloth';
}

function drawWrappedCloth(context: RenderContext): Mask {
  const { spec } = context;
  const text = `${spec.headwear!.name} ${spec.headwear!.material}`.toLowerCase();
  switch (wrapFormFor(text)) {
    case 'safa': return drawTurban(context, true);
    case 'turban': return drawTurban(context, false);
    case 'gele': return drawGele(context);
    case 'keffiyeh': return drawKeffiyeh(context);
    case 'kerchief': return drawKerchief(context);
    default: return drawHeadcloth(context);
  }
}

/**
 * The layered wrap every one of these forms is built on: cloth going round the
 * head more than once, each pass a little out of line with the last.
 *
 * The passes tilt alternately, because a length of cloth wound round a head
 * spirals — it cannot come back to the same height it left. Tilting them all
 * the same way, which is what this did before, gives a set of parallel hoops
 * and reads as a stack of rings rather than as one continuous cloth.
 */
function windCloth(
  context: RenderContext,
  mask: Mask,
  topY: number,
  bottomY: number,
  passes: number,
  tiltScale: number,
  seed: number
): void {
  const { anatomy, raster, book } = context;
  const { size, centerX } = anatomy;
  const noise = makeNoise1D(seed);
  for (let b = 0; b < passes; b += 1) {
    const baseY = topY + b * ((bottomY - topY) / passes);
    const lean = b % 2 === 0 ? 1 : -0.7;
    for (let x = 0; x < size; x += 1) {
      const tilt = ((x - centerX) / anatomy.headHalfWidth) * tiltScale * lean;
      const y = Math.round(baseY + tilt + noise(x * 0.2 + b * 5) * 0.8);
      if (y < 0 || y >= size || !mask[y * size + x]) continue;
      raster.shift(x, y, 2, book);
      if (y + 1 < size && mask[(y + 1) * size + x]) raster.shift(x, y + 1, -1, book);
    }
  }
}

/** A turban, and — with a fan of pleats at the temple — a safa or a peta. */
function drawTurban(context: RenderContext, fanned: boolean): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const rng = makeRng(spec.seed ^ 0x4c72);
  const bottom = anatomy.browY - 2;
  const mask = crownMask(context, fanned ? 4.6 : 4.2, fanned ? 6 : 5, bottom);
  fillHeadwear(context, mask, { dither: 0.3 });

  // How many times the cloth went round is the main way one turban differs
  // from another, and it is a real difference: a Rajasthani safa is nine metres
  // of cloth and a plain working pagri is three.
  const passes = fanned ? 6 : 4 + (rng() > 0.5 ? 1 : 0);
  windCloth(context, mask, anatomy.headTop - 3, bottom, passes, 2.4, spec.seed ^ 0x6611);

  if (fanned) {
    // The pleated fan, springing from the side of the crown and standing well
    // clear of it. A safa's turra is the tallest thing the wearer owns and the
    // reason the turban is tied that way at all.
    const side: -1 | 1 = spec.seed % 2 === 0 ? -1 : 1;
    const ox = Math.round(centerX + side * anatomy.headHalfWidth * 0.5);
    const oy = anatomy.headTop + 3;
    const up = -Math.PI / 2;
    const fan = drawPleatFan(context, ox, oy, up - side * 0.15, up - side * 1.15, 15, 7);
    for (let i = 0; i < fan.length; i += 1) if (fan[i]) mask[i] = 1;
  }

  applyClothPattern(context, mask, clothPatternFor(spec.headwear!.name, spec.headwear!.material), spec.seed);
  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 3 });
  castOntoFace(context, mask, 3, 2);
  return mask;
}

/**
 * A gele, and its relatives across West Africa and the diaspora.
 *
 * This one is worth the code on its own. A gele is starched cloth tied so that
 * it *stands*, and the standing part is larger than the head — it is the point
 * of the object, the thing the wearer is displaying, and rendering it as a
 * close wrap of the skull threw away the whole silhouette. The fan is drawn as
 * pleats radiating from the knot, because that is how the cloth actually
 * gathers, and the alternating value of those pleats is what keeps it from
 * being a coloured shape stuck to the top of a head.
 */
function drawGele(context: RenderContext): Mask {
  const { anatomy, raster, spec, book } = context;
  const { size, centerX } = anatomy;
  const side: -1 | 1 = spec.seed % 2 === 0 ? -1 : 1;

  // The wrap covers the hairline completely and stops clear of the brows.
  const bottom = anatomy.browY - 3;
  const mask = crownMask(context, 3.4, 3, bottom);
  fillHeadwear(context, mask, { dither: 0.25 });
  windCloth(context, mask, anatomy.headTop - 1, bottom, 3, 2.0, spec.seed ^ 0x2255);

  // The pattern goes on the wrap only. Aso oke is striped, and stripes laid
  // over the pleats of the fan below cancel both — two competing sets of lines
  // at right angles read as neither.
  applyClothPattern(context, mask, clothPatternFor(spec.headwear!.name, spec.headwear!.material), spec.seed);

  // The standing wing: a broad fan tied off to one side, leaning away from the
  // head and rising above it. This is the whole object as far as silhouette is
  // concerned, and drawing the gele without it — which is what a generic wrap
  // did — leaves a headscarf where a piece of display should be.
  const knotX = Math.round(centerX + side * anatomy.headHalfWidth * 0.38);
  const knotY = anatomy.headTop + 5;
  const up = -Math.PI / 2;
  const fan = drawPleatFan(context, knotX, knotY, up - side * 1.25, up + side * 0.75, 21, 9);
  for (let i = 0; i < fan.length; i += 1) if (fan[i]) mask[i] = 1;

  // The knot the wing springs from, dark where the cloth gathers through.
  for (let dy = -1; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const x = knotX + dx;
      const y = knotY + dy;
      if (x < 0 || y < 0 || x >= size || !mask[y * size + x]) continue;
      raster.shift(x, y, Math.abs(dx) < 2 ? 2 : 1, book);
    }
  }

  castOntoFace(context, mask, 3, 2);
  return mask;
}

/**
 * A keffiyeh or ghutra: a square of cloth laid over the head, not wound round
 * it, and held down by the agal — a doubled black cord.
 *
 * The silhouette is the tell. Wound cloth is round; a laid square keeps its
 * corners, falls in two straight sheets either side of the face, and shows a
 * fold running back from the crown. And it never sits without the cord, which
 * is why the cord is drawn even when the item's name does not mention it.
 */
function drawKeffiyeh(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;

  const cap = crownMask(context, 2.4, 3, anatomy.browY - 4);
  const drape = makeMask(size, size);
  for (let y = anatomy.browY - 6; y < Math.min(size, anatomy.collarY - 2); y += 1) {
    const t = Math.max(0, (y - anatomy.headTop) / 46);
    // Straight-sided, and squared off at the bottom rather than tapering: this
    // is a hemmed square of cloth, not a drape gathered to a point. It stays
    // close to the head, because a keffiyeh that flares reads as a nemes and
    // puts the persona in the wrong millennium.
    const outer = anatomy.headHalfWidth + 1 + t * 2.6;
    for (let x = Math.round(centerX - outer); x <= Math.round(centerX + outer); x += 1) {
      if (x < 0 || x >= size) continue;
      drape[y * size + x] = 1;
    }
  }
  const mask = partAtChest(
    context,
    maskSubtract(maskUnion(cap, drape), faceOpening(context, anatomy.browY - 4))
  );

  fillMask(raster, mask, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dx = (x - centerX) / (anatomy.headHalfWidth + 8);
    return 2.8 + Math.abs(dx) * 1.4 + (dx > 0 ? 0.6 : -0.5) + (y - anatomy.headTop) / 80;
  }, { dither: 0.35 });

  // The fold where the cloth turns over the crown, and the two folds where it
  // breaks over the shoulders.
  const noise = makeNoise1D(spec.seed ^ 0x51b9);
  for (const side of [-1, 1] as const) {
    for (let y = anatomy.earTopY; y < anatomy.collarY; y += 1) {
      const x = Math.round(centerX + side * (anatomy.headHalfWidth + 2 + (y - anatomy.earTopY) * 0.16)
        + noise(y * 0.2) * 1.2);
      if (x < 0 || x >= size || !mask[y * size + x]) continue;
      raster.shift(x, y, 1, book);
      raster.shift(x - side, y, -1, book);
    }
  }

  applyClothPattern(context, mask, clothPatternFor(spec.headwear!.name, spec.headwear!.material), spec.seed);

  // The agal: two turns of black cord round the crown, the lower one shaded by
  // the upper. Drawn after the pattern, because the cord lies on top of the
  // cloth and the check has to run under it.
  for (const [row, top] of [[anatomy.headTop + 1, true], [anatomy.headTop + 4, false]] as Array<[number, boolean]>) {
    for (let x = 0; x < size; x += 1) {
      const tilt = Math.round(Math.pow((x - centerX) / anatomy.headHalfWidth, 2) * 2.2);
      const y = row + tilt;
      if (y < 0 || y >= size || !mask[y * size + x]) continue;
      raster.set(x, y, ramps.headwearAccent.steps[top ? 5 : 6], MAT.HEADWEAR_ACCENT, top ? 5 : 6);
      // One lit pixel along the top of each turn: a rope is round.
      if (top && y - 1 >= 0 && mask[(y - 1) * size + x] && x % 2 === 0) {
        raster.set(x, y - 1, ramps.headwearAccent.steps[3], MAT.HEADWEAR_ACCENT, 3);
      }
    }
  }

  castOntoFace(context, cap, 2, 2);
  return mask;
}

/**
 * A kerchief: a square folded to a triangle, laid over the hair and knotted.
 *
 * Everything about this one is the knot. It is what the wearer did with their
 * hands, it puts the shape off-centre, and it is the reason a kerchief reads as
 * cloth someone tied rather than as a cap someone put on.
 */
function drawKerchief(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const side: -1 | 1 = spec.seed % 2 === 0 ? -1 : 1;

  const bottom = anatomy.earBottomY - 1;
  let mask = crownMask(context, 2.4, 2, bottom);
  mask = maskSubtract(mask, faceOpening(context, anatomy.browY - 4));
  fillHeadwear(context, mask, { dither: 0.3 });

  // The hem, turned back along the edge that frames the face. Two values do it:
  // the fold catches the light, and the cloth immediately behind it does not.
  // Without this the kerchief has no thickness and reads as a painted hood.
  for (let x = 0; x < size; x += 1) {
    for (let y = anatomy.headTop - 2; y < anatomy.eyeY + 4; y += 1) {
      if (!mask[y * size + x]) continue;
      const openBelow = y + 1 < size && !mask[(y + 1) * size + x];
      if (!openBelow) continue;
      raster.shift(x, y, -2, book);
      if (y - 1 >= 0 && mask[(y - 1) * size + x]) raster.shift(x, y - 1, 2, book);
      break;
    }
  }

  // Folds running back from the crown to the knot — the cloth is pulled, and
  // the pull is what tells you it was tied rather than put on.
  const noise = makeNoise1D(spec.seed ^ 0x3d51);
  for (let f = 0; f < 3; f += 1) {
    for (let y = anatomy.headTop + 2; y < bottom; y += 1) {
      const t = (y - anatomy.headTop) / 20;
      const x = Math.round(centerX + side * (anatomy.headHalfWidth * (0.3 + f * 0.24) + t * 3)
        + noise(y * 0.2 + f * 4) * 1.2);
      if (x < 0 || x >= size || !mask[y * size + x]) continue;
      raster.shift(x, y, 1, book);
      raster.shift(x - side, y, -1, book);
    }
  }

  applyClothPattern(context, mask, clothPatternFor(spec.headwear!.name, spec.headwear!.material), spec.seed);

  // The knot, tied at the side under the ear, with its two loose ends. It has
  // to touch the wrap: an earlier version put it at the jaw and it came out as
  // a detached lump floating beside the neck.
  const knotX = Math.round(centerX + side * (anatomy.headHalfWidth - 2));
  const knotY = anatomy.earBottomY - 2;
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -3; dx <= 3; dx += 1) {
      // Two lobes, not one lump: a knot is cloth pulled through itself.
      const lobe = Math.min(Math.hypot(dx + 1.6, dy * 1.4), Math.hypot(dx - 1.6, dy * 1.4));
      if (lobe > 2.2) continue;
      const x = knotX + dx;
      const y = knotY + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const index = 2 + lobe * 1.1 + (dy > 0 ? 1 : 0);
      const step = Math.max(0, Math.min(6, Math.round(index)));
      raster.set(x, y, ramps.headwear.steps[step], MAT.HEADWEAR, step);
      mask[y * size + x] = 1;
    }
  }
  for (let i = 0; i < 2; i += 1) {
    for (let t = 0; t < 8; t += 1) {
      const x = Math.round(knotX + side * (1 + t * 0.45) + (i === 0 ? 0 : side * 2));
      const y = knotY + 2 + t;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const step = i === 0 ? 3 : 5;
      raster.set(x, y, ramps.headwear.steps[step], MAT.HEADWEAR, step);
      mask[y * size + x] = 1;
    }
  }

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  castOntoFace(context, mask, 3, 2);
  return mask;
}

/** A plain headcloth: wrapped at the crown, falling in a tail over one shoulder. */
function drawHeadcloth(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;

  const bottom = anatomy.earBottomY;
  let mask = crownMask(context, 2.8, 2, bottom);
  mask = maskSubtract(mask, faceOpening(context, anatomy.browY - 3));
  fillHeadwear(context, mask, { dither: 0.3 });
  windCloth(context, mask, anatomy.headTop, bottom, 3, 1.4, spec.seed ^ 0x6611);

  const noise = makeNoise1D(spec.seed ^ 0x6611);
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

  applyClothPattern(context, maskUnion(mask, tail), clothPatternFor(spec.headwear!.name, spec.headwear!.material), spec.seed);
  castOntoFace(context, mask, 3, 2);
  return mask;
}

// ---------------------------------------------------------------------------
// Veils
// ---------------------------------------------------------------------------

/**
 * A veil is not one garment, and drawing it as one is how a dupatta came out
 * as a wimple: a straight-sided slab of dye from the crown to the collar with
 * not a hair showing anywhere.
 *
 * What separates these forms at portrait scale is how much head they leave in
 * view. A dupatta is laid *back* on the crown — the hairline, the parting and
 * the front of the hair are all in plain sight, and the object announces
 * itself by its woven border and by the end thrown over one shoulder. A hijab
 * is the exact opposite: every hair covered, the cloth closing round the face
 * and crossing below the chin. A mantilla stands up over a comb and is more
 * hole than thread. Only the last of them — the wimple, the chador, the nun's
 * veil — is the enclosing sheet that all four used to be drawn as.
 */
type VeilForm = 'draped' | 'wrapped' | 'mantilla' | 'enveloping';

function veilFormFor(text: string): VeilForm {
  if (/dupatta|odhani|orna|chunni|chunari|bridal veil/i.test(text)) return 'draped';
  if (/mantilla|lace/i.test(text)) return 'mantilla';
  if (/hijab|khimar|shayla|amira|head ?scarf/i.test(text)) return 'wrapped';
  return 'enveloping';
}

/** Cloth thin enough to read what is behind it, named as such in the fibre. */
function isSheerCloth(text: string): boolean {
  return /chiffon|gauze|voile|georgette|organza|net|tulle|lace|muslin|sheer/i.test(text);
}

/**
 * Punch a weave into cloth so that what lies behind it shows through.
 *
 * Blending means nothing in a seven-step ramp, so sheerness is done by simply
 * not painting part of the cloth: the hair, the shoulder and the skin behind
 * come through the gaps and the eye mixes them. By default it only opens up
 * where there is a body underneath — let loose over the background it punches
 * holes in the silhouette, which is right for lace and wrong for chiffon.
 */
function weaveGaps(context: RenderContext, mask: Mask, spacing: number, overBackground = false): Mask {
  const { raster, anatomy } = context;
  const { size } = anatomy;
  const behind = new Set<number>([MAT.SKIN, MAT.HAIR, MAT.BEARD, MAT.CLOTH_A, MAT.CLOTH_B, MAT.CLOTH_C]);
  const out = mask.slice();
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!out[y * size + x]) continue;
      if (!overBackground && !behind.has(raster.matAt(x, y))) continue;
      // Two families of diagonals crossing: a weave, rather than scanlines.
      if ((x + y * 2) % spacing === 0 || (x * 2 - y) % (spacing * 3) === 0) {
        out[y * size + x] = 0;
      }
    }
  }
  return out;
}

/**
 * The woven border running along the free edge of a length of cloth.
 *
 * This is the cheapest legibility there is. A dupatta, a mantilla, a bordered
 * palla and a bridal veil are all, at ninety-six pixels, a coloured field plus
 * a line of contrast around the edge — and it is the line that says "cloth
 * with a selvage" instead of "shape filled in". Painted only over cloth that
 * was actually laid down, so a sheer weave's gaps stay open.
 */
function drawClothBorder(context: RenderContext, mask: Mask, width: number): void {
  const { anatomy, raster, ramps } = context;
  const { size } = anatomy;
  let inner = mask;
  for (let w = 0; w < width; w += 1) inner = maskErode(inner, size, size);
  const band = maskSubtract(mask, inner);
  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      if (!band[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.HEADWEAR) continue;
      const shade = raster.shadeAt(x, y);
      if (shade === NO_SHADE) continue;
      const index = Math.max(0, Math.min(6, Math.round(shade + 1)));
      raster.set(x, y, ramps.headwearAccent.steps[index], MAT.HEADWEAR_ACCENT, index);
    }
  }
}

/**
 * The folds in a hanging length of cloth. They wander, because a rule-straight
 * line down a veil turns it into a set of vertical stripes.
 */
function drapeFolds(context: RenderContext, mask: Mask, topY: number, count: number, seed: number): void {
  const { anatomy, raster, book } = context;
  const { size, centerX } = anatomy;
  const noise = makeNoise1D(seed);
  for (let f = 0; f < count; f += 1) {
    const side = f % 2 === 0 ? -1 : 1;
    const x0 = centerX + side * (anatomy.headHalfWidth * 0.5 + f * 2.6);
    for (let y = topY; y < size; y += 1) {
      const x = Math.round(x0 + side * (y - topY) * 0.2 + noise(y * 0.13 + f * 7) * 1.8);
      if (x < 1 || x >= size - 1 || !mask[y * size + x]) continue;
      raster.shift(x, y, 1, book);
      if (mask[y * size + x - side]) raster.shift(x - side, y, -1, book);
    }
  }
}

function drawVeil(context: RenderContext): Mask {
  const { spec } = context;
  const text = `${spec.headwear!.name} ${spec.headwear!.material}`.toLowerCase();
  switch (veilFormFor(text)) {
    case 'draped': return drawDrapedVeil(context);
    case 'mantilla': return drawMantilla(context);
    case 'wrapped': return drawWrappedVeil(context);
    default: return drawEnvelopingVeil(context);
  }
}

/**
 * A dupatta, an odhani, a chunni: a long rectangle of light cloth laid over
 * the back of the head with both ends hanging, one of them longer and thrown
 * across a shoulder.
 *
 * The two things that make it read are the ones an enclosing veil cannot have.
 * The leading edge crosses the head *above* the hairline, so the hair is the
 * frame around the face and the cloth is behind it — and it never hangs
 * evenly, because half its purpose is the fall of the long end.
 */
function drawDrapedVeil(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const text = `${spec.headwear!.name} ${spec.headwear!.material}`.toLowerCase();
  const pallu: -1 | 1 = spec.seed % 2 === 0 ? -1 : 1;
  const noise = makeNoise1D(spec.seed ^ 0x77c1);

  // Where the cloth's leading edge crosses the skull. Well back from the brow:
  // the gap between this and the face is the hair, and the hair is the point.
  const lead = anatomy.headTop + Math.round(anatomy.headHeight * 0.17);
  const lid = crownMask(context, 2.2, 1, anatomy.earTopY + 4);
  const showing = maskEllipse(
    size, size, centerX, (lead + anatomy.chinY) / 2,
    anatomy.headHalfWidth * 0.94, (anatomy.chinY - lead) / 2
  );
  const crown = maskSubtract(lid, showing);

  // The two falls, hanging outside the hair. They are *bands* of cloth, not
  // sheets: below the jaw each one keeps clear of the throat and the middle of
  // the chest, or the persona is wearing a poncho and the garment underneath
  // has vanished. The end thrown over one shoulder hangs longer, comes further
  // in across the chest, and is the whole asymmetry of the thing.
  const fall = makeMask(size, size);
  for (const side of [-1, 1] as const) {
    const long = side === pallu;
    const stop = long ? size : anatomy.collarY + 8;
    for (let y = anatomy.earTopY - 8; y < Math.min(size, stop); y += 1) {
      const t = Math.max(0, (y - (anatomy.earTopY - 8)) / 38);
      const outer = anatomy.headHalfWidth + 1 + t * (long ? 9 : 5)
        + noise(y * 0.09 + (long ? 31 : 0)) * 1.4;
      // Above the jaw the head cutout below does the shaping; past it the cloth
      // has to hold its own inner edge.
      const below = Math.max(0, y - (anatomy.chinY - 6));
      const inner = below === 0 ? 0
        : Math.min(outer - 2, anatomy.neckHalf + (long ? 0 : 3) + below * (long ? 0.15 : 0.5));
      for (let d = Math.round(inner); d <= Math.round(outer); d += 1) {
        const x = Math.round(centerX + side * d);
        if (x < 0 || x >= size) continue;
        fall[y * size + x] = 1;
      }
    }
  }

  const mask = maskSubtract(maskUnion(crown, fall), showing);
  const cloth = isSheerCloth(text) ? weaveGaps(context, mask, 4) : mask;
  fillMask(raster, cloth, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dx = (x - centerX) / (anatomy.headHalfWidth + 8);
    return 2.6 + Math.abs(dx) * 1.4 + (dx > 0 ? 0.6 : -0.6) + (y - anatomy.headTop) / 100;
  }, { dither: 0.4 });

  drapeFolds(context, cloth, anatomy.earTopY, 4, spec.seed ^ 0x77c1);
  applyClothPattern(context, cloth, clothPatternFor(spec.headwear!.name, spec.headwear!.material), spec.seed);
  drawClothBorder(context, mask, 2);

  // The cloth lies on the hair, not in it, so it throws a shadow down onto it.
  applyContactShadow(raster, crown, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  return mask;
}

/**
 * A hijab or khimar: the hair wholly covered, the cloth closing round the face
 * in a rounded frame and carrying on below the chin onto the shoulders.
 *
 * The silhouette is the tell, and it is a curve everywhere — the straight
 * vertical sides of the old drawing are what made every veil look like a
 * curtain rail. The under-cap showing as a line at the hairline and the pin at
 * the jaw are the two details that say someone put this on this morning.
 */
function drawWrappedVeil(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const side: -1 | 1 = spec.seed % 2 === 0 ? -1 : 1;

  const shell = crownMask(context, 3.2, 3, anatomy.chinY + 2);

  // Below the chin the cloth spreads onto the shoulders and rounds off; it does
  // not run to the bottom of the frame.
  // Built column by column so the lower edge is a curve. Cut row by row it
  // ends on a straight horizontal line across the chest, which is a bib and
  // not a garment.
  const bib = makeMask(size, size);
  const bibHalf = anatomy.headHalfWidth + 4;
  for (let x = Math.round(centerX - bibHalf); x <= Math.round(centerX + bibHalf); x += 1) {
    if (x < 0 || x >= size) continue;
    const dx = (x + 0.5 - centerX) / bibHalf;
    const bottom = Math.min(size - 1, Math.round(anatomy.collarY + 6 - dx * dx * 12));
    for (let y = anatomy.chinY - 6; y < bottom; y += 1) bib[y * size + x] = 1;
  }

  // The opening: the face and nothing else. It reaches just above the brows and
  // closes again a touch below the chin.
  const top = anatomy.browY - 3;
  const bottom = anatomy.chinY - 1;
  const opening = maskEllipse(
    size, size, centerX, (top + bottom) / 2,
    anatomy.headHalfWidth * 0.80, (bottom - top) / 2
  );
  const mask = maskSubtract(maskUnion(shell, bib), opening);

  fillMask(raster, mask, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dx = (x - centerX) / (anatomy.headHalfWidth + 5);
    const dy = (y - anatomy.headTop) / anatomy.headHeight;
    return 2.9 + Math.abs(dx) * 1.6 + dy * 0.5 + (dx > 0 ? 0.5 : -0.6);
  }, { dither: 0.4 });

  // The turned edge round the face: the fold catches the light and the cloth
  // just behind it does not. This is what gives the opening any thickness.
  for (let y = anatomy.headTop; y < bottom + 3; y += 1) {
    for (const from of [-1, 1] as const) {
      for (let step = 0; step < anatomy.headHalfWidth; step += 1) {
        const x = Math.round(centerX + from * (anatomy.headHalfWidth - step));
        if (x < 1 || x >= size - 1 || !mask[y * size + x]) continue;
        if (mask[y * size + x - from]) continue;
        raster.shift(x, y, -2, book);
        if (mask[y * size + x + from]) raster.shift(x + from, y, 1, book);
        break;
      }
    }
  }

  // Folds gathering towards the pin at the jaw.
  const noise = makeNoise1D(spec.seed ^ 0x2b81);
  for (let f = 0; f < 3; f += 1) {
    for (let y = anatomy.earTopY; y < anatomy.collarY + 6; y += 1) {
      const t = (y - anatomy.earTopY) / 24;
      const x = Math.round(centerX + side * (anatomy.headHalfWidth + 1 - f * 2 - t * 2)
        + noise(y * 0.18 + f * 5) * 1.2);
      if (x < 1 || x >= size - 1 || !mask[y * size + x]) continue;
      raster.shift(x, y, 1, book);
    }
  }

  applyClothPattern(context, mask, clothPatternFor(spec.headwear!.name, spec.headwear!.material), spec.seed);

  // The pin at the jaw, and the line of the under-cap at the hairline.
  const pinX = Math.round(centerX + side * (anatomy.headHalfWidth - 3));
  const pinY = anatomy.chinY - 5;
  for (const [dx, dy, step] of [[0, 0, 1], [1, 0, 3], [0, 1, 4]] as Array<[number, number, number]>) {
    const x = pinX + dx * side;
    const y = pinY + dy;
    if (x < 0 || y < 0 || x >= size || y >= size || !mask[y * size + x]) continue;
    raster.set(x, y, ramps.headwearAccent.steps[step], MAT.HEADWEAR_ACCENT, step);
  }

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  castOntoFace(context, mask, 3, 2);
  return mask;
}

/**
 * A mantilla: black or ivory lace, stood up over a comb at the crown and
 * falling to the shoulders.
 *
 * This is the one veil that is allowed to open onto the background, because
 * lace genuinely is — the whole character of the thing is that you can see the
 * room through it. The border and the scalloped hem hold the silhouette
 * together while the middle of it is half air.
 */
function drawMantilla(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const noise = makeNoise1D(spec.seed ^ 0x5ac3);

  // The comb: the lace does not lie on the head, it is raised off the crown.
  const lid = crownMask(context, 2.0, 6, anatomy.earTopY + 2);
  const lead = anatomy.headTop + Math.round(anatomy.headHeight * 0.13);
  const showing = maskEllipse(
    size, size, centerX, (lead + anatomy.chinY) / 2,
    anatomy.headHalfWidth * 0.95, (anatomy.chinY - lead) / 2
  );
  const crown = maskSubtract(lid, showing);

  // The fall, hemmed in a scallop rather than cut off square.
  const fall = makeMask(size, size);
  const hem = anatomy.collarY + 12;
  for (const dir of [-1, 1] as const) {
    for (let y = anatomy.earTopY - 6; y < Math.min(size, hem + 6); y += 1) {
      const t = Math.max(0, (y - (anatomy.earTopY - 6)) / 36);
      const outer = anatomy.headHalfWidth + 2 + t * 11;
      for (let d = 0; d <= Math.round(outer); d += 1) {
        const x = Math.round(centerX + dir * d);
        if (x < 0 || x >= size) continue;
        // The hem rises and falls in a scallop across the width of the cloth.
        const edge = hem - 3 + Math.round(Math.abs(Math.sin((x - centerX) * 0.55)) * 5);
        if (y > edge) continue;
        fall[y * size + x] = 1;
      }
    }
  }

  const mask = partAtChest(context, maskSubtract(maskUnion(crown, fall), showing));
  const cloth = weaveGaps(context, mask, 3, true);

  fillMask(raster, cloth, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dx = (x - centerX) / (anatomy.headHalfWidth + 8);
    return 2.4 + Math.abs(dx) * 1.2 + (dx > 0 ? 0.5 : -0.5) + (y - anatomy.headTop) / 110
      + noise(x * 0.4 + y * 0.2) * 0.6;
  }, { dither: 0.5 });

  // A solid selvage all round, so the lace has an edge to be lace inside of.
  drawClothBorder(context, mask, 1);
  drapeFolds(context, cloth, anatomy.earTopY + 4, 3, spec.seed ^ 0x5ac3);
  applyContactShadow(raster, crown, book, { dx: 0, dy: 1, strength: 1, depth: 2 });
  return mask;
}

/**
 * The enclosing veils: a wimple, a chador, a nun's veil, a mourning veil. A
 * sheet of cloth over the whole head, framing the face and falling past the
 * shoulders — which is the only one of the four forms the old single drawing
 * was ever right about.
 *
 * What it was still missing was any evidence of being cloth: the sides ran
 * dead straight to the bottom of the frame and the edge round the face had no
 * thickness. Both are fixed here, and a wimple gets the band across the throat
 * that is the entire reason the word exists.
 */
function drawEnvelopingVeil(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const text = `${spec.headwear!.name} ${spec.headwear!.material}`.toLowerCase();
  const wimple = /wimple|barbette|nun|habit|coif/i.test(text);
  const noise = makeNoise1D(spec.seed ^ 0x77c1);

  const cap = crownMask(context, 2.6, 2, anatomy.browY - 4);
  const drape = makeMask(size, size);
  for (let y = anatomy.headTop + 2; y < size; y += 1) {
    const t = Math.max(0, (y - anatomy.headTop) / 44);
    // Flares as it falls and wanders a little, rather than ruling two vertical
    // lines from the ears to the frame edge.
    const outer = anatomy.headHalfWidth + 2 + Math.sqrt(t) * 11 + noise(y * 0.11) * 1.6;
    // A chador is held closed at the throat and open below it; a wimple's veil
    // hangs behind the shoulders. Either way the cloth parts over the chest,
    // and it has to part well above the collar or the garment underneath is
    // never seen at all.
    const below = Math.max(0, y - (anatomy.chinY + 2));
    const inner = below === 0 ? 0 : Math.min(outer - 2, anatomy.neckHalf + below * 0.7);
    for (const side of [-1, 1] as const) {
      for (let d = Math.round(inner); d <= Math.round(outer); d += 1) {
        const x = Math.round(centerX + side * d);
        if (x < 0 || x >= size) continue;
        drape[y * size + x] = 1;
      }
    }
  }
  const mask = maskSubtract(maskUnion(cap, drape), faceOpening(context, anatomy.browY - 4));

  const cloth = isSheerCloth(text) ? weaveGaps(context, mask, 4) : mask;
  fillMask(raster, cloth, ramps.headwear, MAT.HEADWEAR, (x, y) => {
    const dx = (x - centerX) / (anatomy.headHalfWidth + 8);
    return 3.1 + Math.abs(dx) * 1.5 + (dx > 0 ? 0.6 : -0.6) + (y - anatomy.headTop) / 90;
  }, { dither: 0.4 });

  // The turned edge framing the face.
  for (let y = anatomy.headTop; y < anatomy.chinY; y += 1) {
    for (const from of [-1, 1] as const) {
      for (let step = 0; step < anatomy.headHalfWidth; step += 1) {
        const x = Math.round(centerX + from * (anatomy.headHalfWidth - step));
        if (x < 1 || x >= size - 1 || !mask[y * size + x]) continue;
        if (mask[y * size + x - from]) continue;
        raster.shift(x, y, -2, book);
        if (mask[y * size + x + from]) raster.shift(x + from, y, 1, book);
        break;
      }
    }
  }

  drapeFolds(context, cloth, anatomy.headTop + 12, 5, spec.seed ^ 0x77c1);

  // A wimple is two garments: the veil over the head and the cloth wound under
  // the chin and up past the ears. Drawn as a band across the throat, lighter
  // than the veil, because it is a separate layer of linen catching the light.
  if (wimple) {
    // The cloth passes under the chin and climbs the cheeks to the ears, so it
    // is drawn column by column: its top edge is a curve rising at the sides,
    // not a line ruled across the throat. It sits lighter than the veil behind
    // it, which is the only way the two layers read as two.
    const half = anatomy.headHalfWidth - 1;
    const climb = Math.max(4, anatomy.chinY - anatomy.earBottomY + 2);
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      if (x < 0 || x >= size) continue;
      const dx = (x + 0.5 - centerX) / half;
      const top = Math.round(anatomy.chinY - 1 - dx * dx * climb);
      const bottom = Math.min(size - 1, Math.round(anatomy.collarY + 2 - dx * dx * 5));
      for (let y = Math.max(0, top); y < bottom; y += 1) {
        const t = (y - top) / Math.max(1, bottom - top);
        const index = Math.max(0, Math.min(6, Math.round(1 + Math.abs(dx) * 2.2 + t * 1.4)));
        raster.set(x, y, ramps.headwear.steps[index], MAT.HEADWEAR, index);
        mask[y * size + x] = 1;
      }
    }
  }

  applyClothPattern(context, cloth, clothPatternFor(spec.headwear!.name, spec.headwear!.material), spec.seed);
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
/**
 * A wreath or a garland: a chain of separate things worn round the head.
 *
 * This used to be the band above with a ragged top edge, which is a fair
 * description of a wreath and a terrible drawing of one. A wreath is not a
 * strip with texture on it — it is fifteen or twenty *objects* threaded
 * together, and what makes it delightful at portrait scale is precisely that
 * you can count them: individual blooms at individual sizes, each one throwing
 * its own shadow into the hair, with leaves showing between them where the
 * string has turned.
 *
 * The chain follows the top of the head found by looking, not by formula. The
 * hair is already drawn by this point, so the highest opaque pixel in each
 * column is exactly where a real garland would rest, and a wreath laid on that
 * line sits *in* the hair rather than hovering at some computed radius above a
 * skull it cannot see.
 */
function drawWreath(context: RenderContext, style: 'flower' | 'leaf'): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);
  const text = `${spec.headwear!.name} ${spec.headwear!.material}`.toLowerCase();
  const rng = makeRng(spec.seed ^ 0x71c5);
  const noise = makeNoise1D(spec.seed ^ 0x2f19);

  // Bronze laurel and a jasmine string are the same shape and nothing like the
  // same substance, so metal keeps the item's own ramp and anything growing
  // takes the foliage green.
  const metallic = /bronze|gold|gilt|silver|copper|brass|beaten|wrought/.test(text);
  const leafRamp = metallic ? ramps.headwear : ramps.foliage;
  const leafMat = metallic ? MAT.HEADWEAR : MAT.FOLIAGE;

  const reach = anatomy.headHalfWidth * 1.02;
  const left = Math.round(centerX - reach);
  const right = Math.round(centerX + reach);

  /**
   * Where the garland rests in this column: on top of whatever is there.
   *
   * Clamped at the brow, because the silhouette keeps falling past the temples
   * and a chain that follows it all the way down ends up hanging by the ears.
   * A wreath is worn on the crown; where the head turns away, the string turns
   * out of sight with it.
   */
  const restY = (x: number): number => {
    for (let y = Math.max(0, anatomy.headTop - 10); y < anatomy.browY - 3; y += 1) {
      const material = raster.matAt(x, y);
      if (material === MAT.HAIR || material === MAT.SKIN) return y;
    }
    return anatomy.browY - 4;
  };

  const put = (x: number, y: number, index: number, ramp: typeof ramps.headwear, material: number): void => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const step = Math.max(0, Math.min(6, Math.round(index)));
    raster.set(x, y, ramp.steps[step], material, step);
    mask[y * size + x] = 1;
  };

  /** One bloom: a ring of petals round a contrasting heart. */
  const blossom = (cx: number, cy: number, big: boolean, tone: number): void => {
    const petals: Array<[number, number]> = big
      ? [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]]
      : [[0, -1], [-1, 0], [1, 0], [0, 1]];
    for (const [dx, dy] of petals) {
      // The far side of each bloom is in its own shade; without that a flower
      // is a coloured blob and the string is a rope of blobs.
      put(cx + dx, cy + dy, tone + (dx + dy > 0 ? 1.5 : 0) + (dy > 0 ? 0.6 : 0), ramps.headwear, MAT.HEADWEAR);
    }
    // The heart, in the second colour — this is the pixel that makes it a
    // flower rather than a berry, and it is worth a whole material to get.
    put(cx, cy, 1.4, ramps.headwearAccent, MAT.HEADWEAR_ACCENT);
    if (big) put(cx - 1, cy - 2, tone - 1, ramps.headwear, MAT.HEADWEAR);
  };

  /** A leaf: a lozenge that leans away from the stem, lit along its spine. */
  const leaf = (cx: number, cy: number, side: -1 | 1, long: boolean): void => {
    const len = long ? 4 : 3;
    for (let i = 0; i < len; i += 1) {
      const x = cx + side * i;
      const y = cy - Math.round(i * 0.7);
      put(x, y, i === 0 ? 4 : 2.6, leafRamp, leafMat);
      if (i > 0 && i < len - 1) put(x, y + 1, 4.4, leafRamp, leafMat);
    }
  };

  // Walk the arc laying units down. Spacing is jittered, because a garland
  // strung by hand is not a rule of evenly spaced marks — and the eye reads the
  // unevenness as handmade rather than as error.
  let x = left;
  let unit = 0;
  while (x <= right) {
    const y = restY(x) + 1;
    const edge = Math.abs(x - centerX) / reach;
    const big = style === 'flower' && rng() > 0.3 && edge < 0.78;

    if (style === 'leaf' || (unit % 3 === 2 && style === 'flower')) {
      leaf(x, y, x < centerX ? -1 : 1, style === 'leaf');
      if (style === 'leaf') leaf(x, y + 2, x < centerX ? 1 : -1, false);
    } else {
      // Tone varies bloom to bloom: fresh flowers on a string are not one
      // colour, and two steps of spread is the difference between a garland
      // and a painted stripe.
      blossom(x, y + (big ? 0 : 1), big, 2.2 + noise(unit * 3.7) * 1.6);
    }

    // The string itself, showing between units where it dips.
    const gap = big ? 4 : style === 'leaf' ? 3 : 3;
    for (let i = 1; i < gap; i += 1) {
      const sx = x + i;
      if (sx > right) break;
      put(sx, restY(sx) + 2, 4.6, leafRamp, leafMat);
    }
    x += gap;
    unit += 1;
  }

  // Everything on the string sits down into the hair rather than on top of it.
  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  return mask;
}

const WREATH = /wreath|garland|laurel|chaplet|leaf|frond|vine|floral|flower|blossom|jasmine|marigold/i;

/** Whether an item is a chain of grown things rather than a strip or a crown. */
function isWreath(headwear: { kind: HeadwearKind; name: string; material: string }): boolean {
  if (headwear.kind !== 'band' && headwear.kind !== 'coronet') return false;
  return WREATH.test(`${headwear.name} ${headwear.material}`);
}

function drawBand(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);
  const name = spec.headwear!.name.toLowerCase();
  const beaded = /bead|pearl|shell|bone/.test(name);

  // A wreath is a different object from a band and gets its own drawing; what
  // is left here is the genuine strip-round-the-brow, which is most of the
  // table.
  if (WREATH.test(`${name} ${spec.headwear!.material.toLowerCase()}`)) {
    return drawWreath(context, /flower|floral|blossom|jasmine|marigold|rose/.test(name) ? 'flower' : 'leaf');
  }

  // Some of the things classified `band` are not bands at all. A hairpin, a
  // comb, a feather ornament or a flower is worn *in* the hair, and a strip
  // across the brow for one is both wrong and ugly — a hard grey bar over the
  // forehead of someone whose item is a kingfisher feather. Where the ornament
  // layer has already found the parts this item is actually made of, it *is*
  // the item, and the band adds nothing but a stripe. Names that genuinely
  // describe a circle of stuff round the head keep theirs.
  const encircles = /band|fillet|circlet|headband|wreath|garland|diadem|tiara|crown|chaplet|gele|tie/.test(name);
  if (spec.headwear!.ornaments.length > 0 && !encircles) {
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

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
  return mask;
}

function drawCoronet(context: RenderContext): Mask {
  const { anatomy, raster, ramps, spec } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);

  // A flower crown is a wreath that happens to be called a crown. Sent through
  // the fleuron code below it came out as a gold band with five spikes on it,
  // which is a coronation and not a garland of fresh flowers.
  if (WREATH.test(`${spec.headwear!.name} ${spec.headwear!.material}`.toLowerCase())) {
    return drawWreath(context, /flower|floral|blossom|jasmine|marigold|rose/i.test(spec.headwear!.name) ? 'flower' : 'leaf');
  }
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
