/**
 * portraitLab/art/garmentWear.ts
 *
 * What has happened to a garment, as distinct from what it is and how it was
 * decorated.
 *
 * `clothing.ts` has carried an `adjectives` field on every piece since it was
 * written, and the card prints it in words directly beside the picture — "Rough,
 * Patched Deer Hide Hide Wrap". The renderer never saw it, because the adapter's
 * `Piece` type had a name, a material and a colour and nothing else. So the text
 * said patched and the portrait drew new cloth.
 *
 * This matters more than it sounds. Ornament is how the rich are told apart from
 * each other, and this renderer had a lot of it: brocade, embroidery, metal
 * fittings, trim that widens with rank. Wear is how everybody else is told apart
 * from the rich, and there was none of it at all — a poor persona and a
 * comfortable one differed in dye saturation and the width of a collar band. For
 * an app about ordinary people in the past, that was the wrong asymmetry.
 *
 * Six treatments, and the constraint on all of them is the same one the surface
 * treatments work under: about twenty-seven rows of chest, most of it curving
 * away into shadow. Anything that needs more than four pixels to say what it is
 * does not belong here.
 */

import { MAT, Mask, bayer } from '../core/raster';
import { makeNoise2D, makeRng } from '../core/rng';
import { RenderContext } from '../render/context';
import { GarmentWearSpec } from '../spec/types';

/**
 * Where wear is allowed to land.
 *
 * Not the whole garment: the top few rows are collar and neckline band, which
 * are drawn after this and would paint over anything put there anyway, and the
 * outermost columns are the turn of the shoulder where the cloth is already at
 * the dark end of its ramp and a one-step mark is invisible. What is left is the
 * front of the chest, which is also where a real garment takes its punishment.
 */
function chestField(context: RenderContext): { top: number; bottom: number; half: number } {
  const { anatomy } = context;
  return {
    // Clear of the collar band. `drawCollar` runs after this and grows two or
    // three pixels inward from the neckline, so anything placed at `collarY + 4`
    // was liable to be half repainted as trim — which is why the first patches
    // came out as pale smudges with one edge missing.
    top: anatomy.collarY + 7,
    // `viewHeight`, not `size`. The canvas is drawn taller than it is shown, and
    // a field pass may as well run off the bottom of it — but a patch is one
    // discrete object in one place, and bounding it by the canvas put a share of
    // them entirely inside the rows nobody sees. A persona whose garment was
    // described as patched then had no patch on it, which is the specific bug
    // this whole file exists to fix, reintroduced from the other end.
    bottom: anatomy.viewHeight - 1,
    half: anatomy.shoulderHalf * 0.72,
  };
}

/**
 * A square of other cloth, set in and stitched round.
 *
 * Cut from the garment's *own* ramp and separated by value alone. `clothB` was
 * the obvious choice and the wrong one: it is the garment's secondary colour,
 * and the palette picks that for contrast — it is the trim, the facing, the
 * braid. A patch cut from it put a bright gold rectangle on a black coat, which
 * reads as a badge sewn on deliberately, the opposite of what a patch means. A
 * mend is cloth of much the same kind at a different stage of its life.
 *
 * The stitching is what makes it read as mended rather than as a stain — four
 * pixels of alternating value round the edge, which at this size is all a
 * running stitch can be.
 */
function drawPatch(context: RenderContext, body: Mask, spec: GarmentWearSpec): void {
  const { raster, anatomy, ramps, spec: portrait } = context;
  const { size, centerX } = anatomy;
  const field = chestField(context);
  const rng = makeRng(portrait.seed ^ 0x9c41);

  const count = spec.intensity > 0.6 ? 2 : 1;
  for (let i = 0; i < count; i += 1) {
    const w = 6 + Math.round(rng() * 2);
    const h = 4 + Math.round(rng() * 2);
    // Off the midline, because the midline is where the closure and every
    // context pack's collar band live.
    const side = rng() > 0.5 ? 1 : -1;
    const x0 = Math.round(centerX + side * (4 + rng() * Math.max(1, field.half - w - 4)));
    const y0 = Math.round(field.top + rng() * Math.max(1, field.bottom - field.top - h - 1));

    // Set against the cloth it is sewn to, rather than at an absolute value.
    //
    // The first version picked steps from the middle of the ramp and dropped
    // them onto cloth that was often already at those steps, so a patch on a
    // mid-toned chest was invisible and the whole treatment read as a smudge.
    // A patch is a *different piece of cloth* and the one thing that always
    // says so is that it does not match — so read what is underneath and go the
    // other way from it, far enough to survive the dither.
    const under = raster.shadeAt(Math.round(x0 + w / 2), Math.round(y0 + h / 2));
    // Which way it goes is seeded rather than always lighter. Mending cloth is
    // whatever was to hand, and a page of portraits where every patch is a pale
    // square reads as a rendering artefact; two thirds darker matches what a
    // second-hand scrap usually is, and the third that go lighter keep it from
    // looking like a rule.
    const lighter = rng() > 0.66;
    const away = lighter ? -2 : 2;
    // Never near the ends of the ramp. A patch that reaches step 0 is a white
    // hole punched in a dark coat and reads as a rendering fault rather than as
    // mending; step 6 is indistinguishable from the tear treatment.
    const clampStep = (v: number) => Math.max(2, Math.min(5, v));

    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        if (x < 0 || y < 0 || x >= size || y >= size || !body[y * size + x]) continue;
        if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
        // Modelled, not flat: lit from the same corner as everything else, so
        // the patch sits in the same light as the garment.
        const lit = (x - x0) / w * 0.5 + (y - y0) / h * 0.9;
        const step = clampStep(Math.round(under + away - 0.7 + lit * 1.6));
        // Material and ramp have to agree: the stitching below works by
        // `shift`, which looks the ramp up from the material plane, so tagging
        // these pixels CLOTH_B while colouring them from CLOTH_A would send
        // every stitch off into the secondary colour.
        raster.set(x, y, ramps.clothA.steps[step], MAT.CLOTH_A, step);
      }
    }

    // The stitches. Alternating so they read as separate passes of a needle
    // rather than as a drawn border.
    for (let x = x0; x < x0 + w; x += 1) {
      for (const y of [y0, y0 + h - 1]) {
        if (x < 0 || y < 0 || x >= size || y >= size || !body[y * size + x]) continue;
        if ((x + y) % 2 !== 0) continue;
        raster.shift(x, y, y === y0 ? -2 : 2, context.book);
      }
    }
    for (let y = y0; y < y0 + h; y += 1) {
      for (const x of [x0, x0 + w - 1]) {
        if (x < 0 || y < 0 || x >= size || y >= size || !body[y * size + x]) continue;
        if ((x + y) % 2 !== 0) continue;
        raster.shift(x, y, x === x0 ? -2 : 2, context.book);
      }
    }
  }
}

/**
 * A worked mend: the hole closed with thread rather than covered with cloth.
 *
 * Smaller than a patch and in the garment's own colour, so what shows is the
 * texture — a woven square where the thread crosses at a different angle from
 * the cloth around it. Cross-hatched at every other pixel, which is the smallest
 * mark that reads as woven rather than as dirty.
 */
function drawDarn(context: RenderContext, body: Mask, spec: GarmentWearSpec): void {
  const { raster, anatomy, book, spec: portrait } = context;
  const { size, centerX } = anatomy;
  const field = chestField(context);
  const rng = makeRng(portrait.seed ^ 0x3ba7);

  const w = 4;
  const h = 3;
  const side = rng() > 0.5 ? 1 : -1;
  const x0 = Math.round(centerX + side * (5 + rng() * (field.half - w - 5)));
  const y0 = Math.round(field.top + rng() * Math.max(1, field.bottom - field.top - h - 1));

  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      if (x < 0 || y < 0 || x >= size || y >= size || !body[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
      raster.shift(x, y, (x + y) % 2 === 0 ? -1 : 1, book);
    }
  }
  if (spec.intensity > 0.5) {
    for (let x = x0 - 1; x <= x0 + w; x += 1) {
      const y = y0 + h;
      if (x < 0 || y >= size || !body[y * size + x]) continue;
      raster.shift(x, y, 1, book);
    }
  }
}

/**
 * An unmended split.
 *
 * A tear is not a dark line either — it is cloth parting, so what shows is the
 * shadow *inside* the gap with a lit edge on the side the light reaches. The
 * same two-pixel logic as a fold, run harder and along a jagged path rather than
 * a smooth one, because a fold follows the weave and a tear does not.
 */
function drawTear(context: RenderContext, body: Mask, spec: GarmentWearSpec): void {
  const { raster, anatomy, book, spec: portrait } = context;
  const { size, centerX } = anatomy;
  const field = chestField(context);
  const rng = makeRng(portrait.seed ^ 0x77d3);

  const side = rng() > 0.5 ? 1 : -1;
  let x = Math.round(centerX + side * (5 + rng() * Math.max(1, field.half - 6)));
  const y0 = Math.round(field.top + rng() * 3);
  const length = Math.round(6 + spec.intensity * 8);

  for (let i = 0; i < length; i += 1) {
    const y = y0 + i;
    if (y >= size) break;
    // Wandering by a pixel at a time: a straight tear reads as a seam.
    if (i > 0 && rng() > 0.55) x += rng() > 0.5 ? 1 : -1;
    if (x < 1 || x >= size - 1 || !body[y * size + x]) continue;
    // Straight to the bottom of the ramp. A gap in cloth is not one step darker
    // than the cloth — it is the shadow inside the garment, and a relative shift
    // on cloth that is already dark had nowhere to go.
    raster.set(x, y, context.book[MAT.CLOTH_A].steps[6], MAT.CLOTH_A, 6);
    // Both lips of the split catch the light as the cloth curls back, the near
    // one harder than the far one.
    if (body[y * size + x - 1]) raster.shift(x - 1, y, -2, book);
    if (i % 2 === 0 && body[y * size + x + 1]) raster.shift(x + 1, y, -1, book);
  }
}

/**
 * Dye gone where the light reached it.
 *
 * Fading is not an even wash — cloth fades on the parts that faced the sun and
 * keeps its colour in the folds, which is exactly the information the raster's
 * shade plane is already carrying. So this reads the step a pixel is at and only
 * lifts the ones that were already lit. The folds stay dark and saturated and
 * the shoulders go pale, which is what an old coat looks like.
 */
function drawFading(context: RenderContext, body: Mask, spec: GarmentWearSpec): void {
  const { raster, anatomy, book } = context;
  const { size } = anatomy;
  const cutoff = spec.intensity > 0.6 ? 3 : 2;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!body[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
      const step = raster.shadeAt(x, y);
      if (step > cutoff) continue;
      // Dithered, so the boundary between faded and unfaded cloth is a gradient
      // rather than a contour line drawn across the chest.
      if (bayer(x, y) > spec.intensity) continue;
      raster.shift(x, y, -1, book);
    }
  }
}

/**
 * The nap rubbed off where the cloth sits over something.
 *
 * Different from fading, and worth both: fading is chemical and follows the
 * light, wear is mechanical and follows the *form* — the shoulder line, the
 * crest of a fold, the point of a collarbone. So this looks for pixels that are
 * lighter than their neighbours below, which is where the cloth is proud, and
 * thins them. What it leaves is a garment whose highlights have gone chalky
 * while its shadows are untouched.
 */
function drawRubbing(context: RenderContext, body: Mask, spec: GarmentWearSpec): void {
  const { raster, anatomy, book, spec: portrait } = context;
  const { size } = anatomy;
  const grain = makeNoise2D(portrait.seed ^ 0x21c8);

  for (let y = anatomy.shoulderTop; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!body[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
      const step = raster.shadeAt(x, y);
      const below = raster.shadeAt(x, y + 1);
      // Proud of what is under it, and not already at the top of the ramp.
      if (step > 3 || below <= step) continue;
      if (grain(x * 0.45, y * 0.4) < 0.55 - spec.intensity * 0.6) continue;
      raster.shift(x, y, -1, book);
    }
  }
}

/**
 * What the work leaves on the front of what you work in.
 *
 * Low on the chest and irregular, because it is splash and handling rather than
 * anything structural — a couple of soft blotches with no edge to them. Kept to
 * one step: two starts reading as a burn.
 */
function drawSoiling(context: RenderContext, body: Mask, spec: GarmentWearSpec): void {
  const { raster, anatomy, book, spec: portrait } = context;
  const { size, centerX } = anatomy;
  const grain = makeNoise2D(portrait.seed ^ 0x5e19);
  const top = anatomy.collarY + 6;

  for (let y = top; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!body[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
      // Heavier low down and toward the middle: it is where hands and work
      // reach, and it keeps the soil off the lit shoulder where it would read
      // as a shading mistake.
      const depth = Math.min(1, (y - top) / 14);
      const across = 1 - Math.min(1, Math.abs(x - centerX) / Math.max(1, anatomy.shoulderHalf * 0.8));
      const blotch = grain(x * 0.13, y * 0.15) + grain(x * 0.36, y * 0.31) * 0.35;
      if (blotch < 1.05 - spec.intensity * depth * across * 1.5) continue;
      raster.shift(x, y, 1, book);
    }
  }
}

/**
 * Everything the garment's adjectives said, in the order that stacks correctly.
 *
 * Fading and rubbing go first, because they act on the value the cloth was
 * given and everything after them is an object laid on top. Soil goes over
 * those and under the mends, because a patch put on last week is cleaner than
 * the coat it is on. Tears go last of all, since nothing covers a hole.
 */
export function drawGarmentWear(context: RenderContext, body: Mask): void {
  const wear = context.spec.garment.wear;
  if (!wear.length) return;

  const find = (kind: GarmentWearSpec['kind']) => wear.find(w => w.kind === kind);
  const faded = find('faded');
  const worn = find('worn');
  const stained = find('stained');
  const patched = find('patched');
  const darned = find('darned');
  const torn = find('torn');

  if (faded) drawFading(context, body, faded);
  if (worn) drawRubbing(context, body, worn);
  if (stained) drawSoiling(context, body, stained);
  if (patched) drawPatch(context, body, patched);
  if (darned) drawDarn(context, body, darned);
  if (torn) drawTear(context, body, torn);
}
