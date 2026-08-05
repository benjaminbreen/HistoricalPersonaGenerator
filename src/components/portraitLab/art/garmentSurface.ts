/**
 * portraitLab/art/garmentSurface.ts
 *
 * How a cloth is decorated, as opposed to what it is cut into.
 *
 * The same collapse the ornaments fixed for headgear: 490 garment names, eight
 * silhouettes, so a Court Doublet in silk brocade and a peasant's rough wool
 * arrived here as the same shape in a different colour. 23% of the entries in
 * `clothing.ts` name a surface treatment and they group tightly enough to be
 * worth seven primitives.
 *
 * The frame decides which of them matter. There are about seventeen rows of
 * chest below the collar and most of that is in shadow, so a field treatment —
 * brocade, print, stripe — gets a small, half-lit area to work in, while an
 * edge treatment sits exactly where the eye already is. That is why four of the
 * seven follow the neckline: at a bust crop the neckline *is* the garment.
 *
 * Everything here draws in the ornament palette, so gold thread in an
 * embroidered band is the same gold as a gilt hairpin, and a pearl at the
 * collar matches a pearl in the hair. One material table, two layers.
 */

import { MAT, Mask, maskDilate, maskIntersect, maskSubtract, makeMask } from '../core/raster';
import { makeNoise2D, makeRng } from '../core/rng';
import { RenderContext } from '../render/context';
import { GarmentSurfaceSpec } from '../spec/types';
import { ornamentRamp } from './ornaments';

/**
 * The band of cloth just inside the neckline, which is where every edge
 * treatment goes. Grown from the opening rather than drawn as a shape, so it
 * follows a cross collar or a boat neck without knowing which it is.
 */
function necklineBand(context: RenderContext, body: Mask, opening: Mask, width: number): Mask {
  const { anatomy } = context;
  const { size } = anatomy;
  let grown = opening;
  for (let i = 0; i < width; i += 1) grown = maskDilate(grown, size, size, true);
  const band = maskIntersect(maskSubtract(grown, opening), body);
  // Never below the collarbone: an edge treatment that keeps going down the
  // chest stops reading as an edge and starts reading as a bib.
  for (let y = anatomy.collarY + 10; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) band[y * size + x] = 0;
  }
  return band;
}

/**
 * A woven motif, tone on tone.
 *
 * The whole difficulty of brocade at this size is that it must not become a
 * pattern of dots. Real figured silk is the *same* colour as its ground and
 * shows only because the floats lie at a different angle and catch the light —
 * so this shifts value by a single step and never paints a hue. What sells it
 * is that the motif sits on a regular lattice: the eye reads periodicity long
 * before it can resolve the shape, and periodicity is what says "woven" rather
 * than "stained".
 */
function drawBrocade(context: RenderContext, body: Mask, surface: GarmentSurfaceSpec): void {
  const { raster, anatomy, book, spec } = context;
  const { size } = anatomy;
  const metallic = /gold|gilt|silver/.test(surface.material);
  const ramp = ornamentRamp(surface.material);
  const pitchX = 6;
  const pitchY = 5;

  for (let y = anatomy.shoulderTop; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!body[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
      // Offset alternate rows, so the lattice is a diaper rather than a grid.
      const row = Math.floor(y / pitchY);
      const ox = (x + (row % 2 ? Math.floor(pitchX / 2) : 0)) % pitchX;
      const oy = y % pitchY;
      // A small lozenge: centre, and the four points around it.
      const centre = ox === 0 && oy === 0;
      const arm = (ox === 0 && Math.abs(oy - 0) === 1) || (Math.abs(ox) === 1 && oy === 0);
      if (!centre && !arm) continue;

      if (metallic && centre && surface.intensity > 0.55) {
        // Cloth of gold: the motif is actually metal, so it takes the metal's
        // own colour rather than the ground's value.
        raster.set(x, y, ramp.steps[1], MAT.CLOTH_C, 1);
      } else {
        raster.shift(x, y, centre ? -1 : 1, book);
      }
    }
  }
  void spec;
}

/**
 * A printed or painted repeat.
 *
 * Unlike brocade this *is* a different colour — dye sitting on top of cloth —
 * so it paints in the garment's accent and is allowed to be bold. The motif is
 * bigger and sparser than the brocade lattice, because a print is applied with
 * a block and a block is a large object.
 */
function drawPrint(context: RenderContext, body: Mask, surface: GarmentSurfaceSpec): void {
  const { raster, anatomy, ramps, spec } = context;
  const { size } = anatomy;
  const rng = makeRng(spec.seed ^ 0x51a3);
  const pitchX = 9;
  const pitchY = 8;
  const jitter = Math.floor(rng() * 4);

  const motif: Array<[number, number]> = [
    [0, -1], [-1, 0], [0, 0], [1, 0], [0, 1],
    [-1, -1], [1, 1],
  ];

  for (let cy = anatomy.shoulderTop + 3; cy < size; cy += pitchY) {
    for (let cx = jitter; cx < size; cx += pitchX) {
      const stagger = ((cy / pitchY) | 0) % 2 ? Math.floor(pitchX / 2) : 0;
      for (const [dx, dy] of motif) {
        const x = cx + dx + stagger;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        if (!body[y * size + x]) continue;
        if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
        // Two values inside the motif, so it has form rather than being a blob.
        const index = dy < 0 || dx < 0 ? 2 : 4;
        raster.set(x, y, ramps.clothC.steps[index], MAT.CLOTH_C, index);
      }
    }
  }
}

/** Woven bands. Vertical, because that is how cloth is worn and how it hangs. */
function drawStripe(context: RenderContext, body: Mask, surface: GarmentSurfaceSpec): void {
  const { raster, anatomy, ramps, book } = context;
  const { size, centerX } = anatomy;
  const pitch = surface.intensity > 0.6 ? 7 : 9;
  const bold = surface.intensity > 0.5;

  for (let x = 0; x < size; x += 1) {
    const offset = Math.abs(x - centerX) % pitch;
    if (offset !== 0 && offset !== 1) continue;
    for (let y = anatomy.shoulderTop; y < size; y += 1) {
      if (!body[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
      if (bold && offset === 0) {
        raster.set(x, y, ramps.clothC.steps[3], MAT.CLOTH_C, 3);
      } else {
        raster.shift(x, y, offset === 0 ? 1 : -1, book);
      }
    }
  }
}

/**
 * A worked band along the neckline.
 *
 * Two rows: the outer one carries the stitch pattern, the inner one is a plain
 * couched line holding it down. That inner line is what makes it read as
 * applied rather than as a change of cloth — embroidery has an edge, and the
 * edge is the evidence.
 */
function drawEmbroidery(context: RenderContext, band: Mask, surface: GarmentSurfaceSpec): void {
  const { raster, anatomy } = context;
  const { size } = anatomy;
  const ramp = ornamentRamp(surface.material);
  const dense = surface.intensity > 0.55;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!band[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A && raster.matAt(x, y) !== MAT.CLOTH_C) continue;
      // A running stitch: two on, one off, staggered by row so the pattern
      // travels diagonally the way real couching does.
      //
      // On a rich garment it closes up into solid goldwork. Court embroidery
      // is not a line of stitches with cloth showing between them — it is a
      // surface, worked until the ground disappears, and at this size that is
      // the whole difference between a trimmed collar and an expensive one.
      const phase = (x + y * 2) % 3;
      if (!dense && phase === 0) continue;
      const index = dense ? (phase === 1 ? 0 : 2) : (phase === 1 ? 1 : 3);
      raster.set(x, y, ramp.steps[index], MAT.CLOTH_C, index);
    }
  }
}

/**
 * Openwork at the edge.
 *
 * Lace is holes. Drawing it as a pale band gets it exactly wrong — what the eye
 * reads is the ground showing *through*, so this alternates a lit thread
 * against pixels left at the shadow value, and scallops the outer edge.
 */
function drawLace(context: RenderContext, band: Mask, surface: GarmentSurfaceSpec): void {
  const { raster, anatomy, book } = context;
  const { size } = anatomy;
  const ramp = ornamentRamp(surface.material);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!band[y * size + x]) continue;
      const mat = raster.matAt(x, y);
      if (mat !== MAT.CLOTH_A && mat !== MAT.CLOTH_C) continue;
      // A net: threads on the diagonals, holes between them.
      const onThread = (x + y) % 3 === 0 || (x - y + 300) % 3 === 0;
      if (onThread) {
        raster.set(x, y, ramp.steps[1], MAT.CLOTH_C, 1);
      } else {
        // The hole is not empty — it is the shadow under the lace.
        raster.shift(x, y, 2, book);
      }
    }
  }
}

/**
 * A fur edge.
 *
 * Fur has no outline. Everything that reads as fur here is in the boundary:
 * the edge is broken rather than smooth, and the value clumps into locks
 * instead of grading. A clean band in a warm colour is a leather trim.
 */
function drawFurTrim(context: RenderContext, band: Mask, surface: GarmentSurfaceSpec): void {
  const { raster, anatomy, ramps, spec, book } = context;
  const { size } = anatomy;
  const locks = makeNoise2D(spec.seed ^ 0x3f5b);
  const rng = makeRng(spec.seed ^ 0x1c9d);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!band[y * size + x]) continue;
      const mat = raster.matAt(x, y);
      if (mat !== MAT.CLOTH_A && mat !== MAT.CLOTH_C) continue;
      // Clumped rather than graded: neighbouring pixels agree, distant ones do
      // not, which is what a lock of hair looks like from across a room.
      // Wider apart than a cloth grain, so the clumps read as locks rather than
      // as noise, and pushed to the ends of the ramp — fur is the highest-
      // contrast surface on a garment, which is exactly why it signalled rank.
      const n = locks(x * 0.38, y * 0.38);
      const index = n > 0.2 ? 0 : n < -0.25 ? 5 : 2;
      raster.set(x, y, ramps.clothB.steps[index], MAT.CLOTH_B, index);
      // Guard hairs breaking the outer edge.
      if (rng() > 0.82 && !band[(y - 1) * size + x] && raster.matAt(x, y - 1) === MAT.SKIN) {
        raster.shift(x, y - 1, 2, book);
      }
    }
  }
  void surface;
}

/** Beads or spangles sewn along the neck. */
function drawBeading(context: RenderContext, band: Mask, surface: GarmentSurfaceSpec): void {
  const { raster, anatomy, book } = context;
  const { size } = anatomy;
  const ramp = ornamentRamp(surface.material);
  const step = surface.intensity > 0.55 ? 2 : 3;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!band[y * size + x]) continue;
      if ((x + y) % step !== 0) continue;
      const mat = raster.matAt(x, y);
      if (mat !== MAT.CLOTH_A && mat !== MAT.CLOTH_C) continue;
      raster.set(x, y, ramp.steps[1], MAT.GEM, 1);
      // The dark pixel under a bead is what lifts it off the cloth. Same rule
      // as every ornament: the shadow does more than the highlight.
      if (raster.matAt(x + 1, y + 1) === MAT.CLOTH_A) raster.shift(x + 1, y + 1, 2, book);
    }
  }
}

export function drawGarmentSurface(
  context: RenderContext,
  body: Mask,
  opening: Mask
): void {
  const { spec, anatomy } = context;
  const surfaces = spec.garment.surfaces;
  if (!surfaces.length || spec.garment.kind === 'bare') return;

  // One edge treatment needs a wider band than another: fur is a physical
  // thickness, lace is a fringe, beadwork is a worked yoke several rows deep,
  // embroidery is a stitched line.
  const bandWidth = (kind: string) =>
    (kind === 'furTrim' ? 4 : kind === 'lace' || kind === 'beading' ? 3 : 2);

  for (const surface of surfaces) {
    switch (surface.kind) {
      case 'brocade':
        drawBrocade(context, body, surface);
        break;
      case 'print':
        drawPrint(context, body, surface);
        break;
      case 'stripe':
        drawStripe(context, body, surface);
        break;
      case 'embroidery':
        drawEmbroidery(context, necklineBand(context, body, opening, bandWidth('embroidery')), surface);
        break;
      case 'lace':
        drawLace(context, necklineBand(context, body, opening, bandWidth('lace')), surface);
        break;
      case 'furTrim':
        drawFurTrim(context, necklineBand(context, body, opening, bandWidth('furTrim')), surface);
        break;
      case 'beading':
        drawBeading(context, necklineBand(context, body, opening, bandWidth('beading')), surface);
        break;
      default:
        break;
    }
  }
  void anatomy;
  void makeMask;
}
