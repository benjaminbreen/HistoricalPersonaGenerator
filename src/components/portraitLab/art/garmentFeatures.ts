/**
 * portraitLab/art/garmentFeatures.ts
 *
 * What makes a named garment recognisable, as opposed to what kind of garment
 * it is.
 *
 * The classifier sorts 393 distinct torso names into eight silhouettes, which
 * is the right thing for a silhouette to do and hopeless as a description: a
 * pair of denim overalls, a Savile Row three-piece and an aloha shirt all come
 * out `work_shirt`, and the card beside the portrait prints the name in words.
 * Someone reading "Black Denim Overalls" next to a plain dark shape is being
 * told the picture is not of this person.
 *
 * So this is a second layer, keyed on the item's own name, drawing the one
 * thing that would let you name the garment across a room. At bust crop that
 * is almost always the same short list: what happens at the neck, what crosses
 * the shoulders, and what runs down the front. A sari is its pallu, a suit is
 * its lapels, overalls are a bib and two straps, a toga is a diagonal.
 *
 * Each feature covers many names — that is the point of matching on words
 * rather than on items. Sixteen features carry about a hundred and fifty of the
 * three hundred and ninety-three names in the tables.
 */

import {
  applyContactShadow, fillMask, MAT, Mask, makeMask, maskDilate,
  maskIntersect, maskSubtract,
} from '../core/raster';
import { Ramp } from '../core/color';
import { makeNoise1D, makeRng } from '../core/rng';
import { RenderContext } from '../render/context';
import { GarmentSpec } from '../spec/types';

export interface GarmentFeature {
  key: string;
  /**
   * Whether this feature is itself the front of the garment. When it is, the
   * generic construction pass leaves the centre alone — a row of buttons down
   * the middle of a sari, or through the notch of a lapel, is worse than no
   * buttons at all.
   */
  ownsFront: boolean;
}

/**
 * Read in order, first match wins. The order is by how specific the word is:
 * "smoking jacket" has to be seen before "jacket", and "kente cloth" before
 * "cloth". Nothing here matches a material on its own, because a material is
 * not a garment — "silk" appears in ninety names across six shapes.
 */
const FEATURES: Array<[RegExp, string, boolean]> = [
  [/overall|dungaree|pinafore|bib/i, 'bib', true],
  [/apron|smock/i, 'apron', true],
  [/sari|saree|pallu|dupatta|odhani|angavastram|upper cloth/i, 'pallu', true],
  [/toga|palla|stola|chiton|peplos|himation|senator/i, 'toga', true],
  [/usekh|broad collar|pharaoh|egyptian/i, 'broad_collar', true],
  [/ruff|elizabethan|court doublet|spanish jacket/i, 'ruff', false],
  [/smoking jacket|dinner jacket|tuxedo|opera/i, 'shawl_lapel', true],
  [/suit|blazer|tailcoat|frock coat|morning coat|business|savile|dinner/i, 'lapels', true],
  [/nehru|zhongshan|mao|bandhgala|sherwani|achkan|jodhpuri/i, 'mandarin', true],
  [/qipao|cheongsam|changshan|magua|frog/i, 'frogs', true],
  [/kente|aso oke|aso ebi|ankara|adire|strip.?weav/i, 'strip_weave', false],
  [/feather|plume/i, 'feathered', false],
  [/fur|pelt|leopard|jaguar|lion mane|buffalo robe|ermine|sable|mink/i, 'fur_collar', false],
  [/shawl|stole|mantilla|fichu/i, 'shawl', false],
  [/poncho|ruana/i, 'poncho', true],
  [/guayabera|polo|aloha|formal shirt|designer shirt|dress shirt/i, 'placket', true],
  [/t-shirt|tank top|tee shirt|singlet|board short|resort wear/i, 'tee', true],
  [/embroider|zardozi|kundan|brocade|zari|beaded|jeweled|jewelled/i, 'yoke', false],
];

export function garmentFeatureFor(garment: GarmentSpec): GarmentFeature | null {
  const subject = `${garment.name} ${garment.material}`;
  for (const [pattern, key, ownsFront] of FEATURES) {
    if (pattern.test(subject)) return { key, ownsFront };
  }
  return null;
}

// ---------------------------------------------------------------------------

/**
 * Two masks, and which one a feature takes is the whole difference between it
 * appearing and not.
 *
 * `body` is the garment with its neckline cut out of it. That is the right
 * surface for anything lying *on* the cloth — a pallu, a woven strip, a fur
 * collar. It is exactly the wrong one for anything that happens *at* the
 * opening, because the opening is the hole: the first version of the lapels
 * drew a perfect shirt front and a tie into a region every pixel of which was
 * masked out, and a Savile Row suit came out identical to a sack.
 *
 * `shoulders` is the same silhouette before the neckline was subtracted, which
 * is what a collar, a lapel, a placket or a rib actually sits across.
 */
export function drawGarmentFeature(
  context: RenderContext,
  body: Mask,
  shoulders: Mask,
  feature: GarmentFeature
): void {
  switch (feature.key) {
    case 'bib': return drawBib(context, shoulders, true);
    case 'apron': return drawBib(context, shoulders, false);
    case 'pallu': return drawPallu(context, body);
    case 'toga': return drawToga(context, body);
    case 'broad_collar': return drawBroadCollar(context, shoulders);
    case 'ruff': return drawRuff(context, shoulders);
    case 'lapels': return drawLapels(context, shoulders, 'notch');
    case 'shawl_lapel': return drawLapels(context, shoulders, 'shawl');
    case 'mandarin': return drawMandarin(context, shoulders, false);
    case 'frogs': return drawMandarin(context, shoulders, true);
    case 'strip_weave': return drawStripWeave(context, body);
    case 'feathered': return drawFeathered(context, body);
    case 'fur_collar': return drawFurCollar(context, body);
    case 'shawl': return drawShawl(context, body);
    case 'poncho': return drawPoncho(context, shoulders);
    case 'placket': return drawPlacket(context, shoulders);
    case 'tee': return drawTee(context, shoulders);
    case 'yoke': return drawYoke(context, body);
    default: return;
  }
}

/**
 * Paint one pixel, where there is garment under it and it is low enough to be
 * garment at all. The floor matters once features are allowed to draw into the
 * neck opening: without it a standing collar climbs the throat and takes the
 * jaw with it.
 */
function painter(context: RenderContext, mask: Mask) {
  const { raster, anatomy } = context;
  const { size } = anatomy;
  const floor = anatomy.neckBottom - 4;
  return (x: number, y: number, ramp: Ramp, material: number, index: number) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < floor || px >= size || py >= size) return;
    if (!mask[py * size + px]) return;
    const step = Math.max(0, Math.min(6, Math.round(index)));
    raster.set(px, py, ramp.steps[step], material, step);
  };
}

// ---------------------------------------------------------------------------
// Front-of-garment features
// ---------------------------------------------------------------------------

/**
 * Overalls, dungarees, a pinafore, a work apron.
 *
 * Drawn inside out: the bib and its straps keep the garment's own colour and
 * everything *around* them is repainted as the shirt underneath. That is both
 * fewer pixels and the truer description — a bib is not a panel added to a
 * chest, it is the part of the chest the overalls still cover.
 */
function drawBib(context: RenderContext, body: Mask, buckles: boolean): void {
  const { raster, anatomy, ramps, book, spec } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);

  const half = Math.round(anatomy.neckHalf + 6);
  const strapHalf = 2;
  // Straps run from the top of the bib up and out over the shoulder. An apron's
  // are narrower and meet at the neck; overalls' sit wide and clip on.
  const strapOut = buckles ? anatomy.shoulderHalf * 0.42 : anatomy.neckHalf + 1;
  const bibTop = anatomy.collarY + 2;

  for (let y = anatomy.shoulderTop - 2; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!body[y * size + x]) continue;
      const dx = x + 0.5 - centerX;
      let covered = false;
      if (y >= bibTop) {
        covered = Math.abs(dx) <= half;
      } else {
        // The strap climbs outward as it rises, so it crosses the shoulder
        // rather than running up the middle of the chest like a brace.
        const t = Math.max(0, (bibTop - y) / Math.max(1, bibTop - anatomy.shoulderTop + 2));
        const at = half - (half - strapOut) * t;
        for (const side of [-1, 1] as const) {
          if (Math.abs(dx - side * at) <= strapHalf) covered = true;
        }
      }
      if (covered) continue;
      // Not overalls here: the shirt worn under them.
      const shade = raster.shadeAt(x, y);
      const step = Math.max(0, Math.min(6, (shade === 255 ? 3 : shade) - 1));
      raster.set(x, y, ramps.clothB.steps[step], MAT.CLOTH_B, step);
    }
  }

  // The bib's own edge, which is what stops it reading as a colour block.
  for (let y = bibTop; y < size; y += 1) {
    for (const side of [-1, 1] as const) {
      put(centerX + side * half, y, ramps.clothA, MAT.CLOTH_A, 1);
      put(centerX + side * (half - 1), y, ramps.clothA, MAT.CLOTH_A, 5);
    }
  }
  for (let x = centerX - half; x <= centerX + half; x += 1) {
    put(x, bibTop, ramps.clothA, MAT.CLOTH_A, 1);
  }

  if (buckles) {
    // Two square clips where the straps meet the bib. At this size a buckle is
    // three pixels, and three pixels of metal is what says "work clothes".
    for (const side of [-1, 1] as const) {
      const x = Math.round(centerX + side * (half - 2));
      for (let dy = 0; dy < 2; dy += 1) {
        raster.set(x, bibTop + 1 + dy, ramps.metal.steps[dy === 0 ? 1 : 4], MAT.METAL, dy === 0 ? 1 : 4);
        raster.set(x + 1, bibTop + 1 + dy, ramps.metal.steps[dy === 0 ? 2 : 5], MAT.METAL, dy === 0 ? 2 : 5);
      }
    }
    // A seam of contrast stitching down the bib — the detail that makes denim
    // read as denim rather than as blue cloth.
    if (spec.garment.ornament >= 0) {
      const noise = makeNoise1D(spec.seed ^ 0x51b3);
      for (let y = bibTop + 3; y < size; y += 2) {
        for (const side of [-1, 1] as const) {
          if (noise(y * 0.4 + side) < 0.25) continue;
          put(centerX + side * (half - 3), y, ramps.clothC, MAT.CLOTH_C, 2);
        }
      }
    }
  }

  applyContactShadow(raster, maskSubtract(body, makeMask(size, size)), book, { dx: 0, dy: 0, strength: 0, depth: 0 });
}

/**
 * A tailored jacket, which at this crop is entirely its lapels: two facings
 * turned back from the front edges, the shirt showing in the V between them,
 * and something knotted at the throat.
 */
function drawLapels(context: RenderContext, body: Mask, style: 'notch' | 'shawl'): void {
  const { raster, anatomy, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);

  const top = anatomy.neckBottom - 3;
  const depth = Math.min(size - top - 1, 17);
  const spread = anatomy.neckHalf + 6;

  // The V of shirt front. It narrows to nothing at the button stance.
  for (let i = 0; i < depth; i += 1) {
    const t = i / depth;
    const half = Math.max(0, spread * (1 - t) - 1);
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      // The shirt is the lightest thing on the chest. Anything less than the
      // top of its ramp disappears into the jacket at this size.
      put(x, top + i, ramps.clothB, MAT.CLOTH_B, 0.6 + t * 1.2);
    }
  }

  // The lapels themselves: the cloth folded back along each side of that V,
  // lit on the fold because it faces up and out.
  for (let i = 0; i < depth; i += 1) {
    const t = i / depth;
    const inner = spread * (1 - t);
    // A notch lapel steps outward a third of the way down; a shawl lapel runs
    // as one unbroken curve, which is the whole visual difference between a
    // dinner jacket and a business suit.
    const flare = style === 'notch'
      ? (t < 0.32 ? 5 : t < 0.42 ? 1.5 : 6)
      : 4.5 + Math.sin(t * Math.PI) * 3;
    for (const side of [-1, 1] as const) {
      for (let w = 0; w <= flare; w += 1) {
        const x = centerX + side * (inner + w);
        // The facing catches the light along its inner edge and falls away
        // toward the break — one flat value reads as a painted stripe.
        put(x, top + i, ramps.clothA, MAT.CLOTH_A, w < 1 ? 0.8 : 2 + w * 0.45);
      }
      put(centerX + side * (inner + flare), top + i, ramps.clothA, MAT.CLOTH_A, 6);
    }
  }

  // A tie, cravat or stock. Two pixels wide is all there is room for, so the
  // knot is what carries it — a wider block of three rows at the throat.
  const tieTop = top + 1;
  for (let dy = 0; dy < 3; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      put(centerX + dx, tieTop + dy, ramps.clothC, MAT.CLOTH_C, dy === 0 ? 1 : 2.5 + Math.abs(dx) * 0.6);
    }
  }
  for (let y = tieTop + 3; y < size; y += 1) {
    const t = (y - tieTop) / 14;
    const w = Math.min(2, 1 + Math.round(t * 2));
    for (let dx = -w; dx <= w; dx += 1) {
      put(centerX + dx, y, ramps.clothC, MAT.CLOTH_C, dx < 0 ? 1.8 : dx === w ? 5 : 3);
    }
  }

  // One button at the stance, if this is a jacket that fastens.
  if (spec.garment.ornament > 0.25 && top + depth + 1 < size) {
    const y = top + depth + 1;
    raster.set(centerX + 1, y, ramps.metal.steps[2], MAT.METAL, 2);
    raster.set(centerX + 2, y, ramps.metal.steps[5], MAT.METAL, 5);
  }
  applyContactShadow(raster, body, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
}

/**
 * A standing band collar and a centre closure: the Nehru jacket, the Zhongshan
 * suit, the sherwani, the achkan, the bandhgala. One shape, five continents,
 * and nothing else in the wardrobe looks like it.
 */
function drawMandarin(context: RenderContext, body: Mask, frogs: boolean): void {
  const { raster, anatomy, ramps, spec } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);

  // The band: three rows standing up against the neck, brighter than the body
  // because it faces the light square on rather than curving away.
  const bandTop = anatomy.neckBottom - 4;
  for (let dy = 0; dy < 5; dy += 1) {
    const y = bandTop + dy;
    const half = anatomy.neckHalf + 4 + dy * 0.5;
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      // The collar opens at the very centre front, which is where it fastens.
      if (Math.abs(x - centerX) < 1 && dy > 0) continue;
      put(x, y, ramps.clothA, MAT.CLOTH_A, dy === 0 ? 0.4 : dy === 4 ? 6 : 1.8);
    }
  }

  if (frogs) {
    // A diagonal closure running from the throat to the right underarm, held by
    // knotted loops. This is the line that says qipao rather than tunic.
    const steps = Math.round(anatomy.shoulderHalf * 0.7);
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = centerX + 1 + t * anatomy.shoulderHalf * 0.62;
      const y = bandTop + 4 + t * 9;
      put(x, y, ramps.clothA, MAT.CLOTH_A, 5.6);
      put(x, y - 1, ramps.clothA, MAT.CLOTH_A, 1.6);
      if (i % Math.max(3, Math.round(steps / 3)) === 0 && i > 0) {
        // A frog: a small knot with a loop beside it.
        put(x, y + 1, ramps.clothC, MAT.CLOTH_C, 2);
        put(x + 1, y + 1, ramps.clothC, MAT.CLOTH_C, 4);
      }
    }
  } else {
    // A row of small buttons straight down the centre.
    const metal = spec.garment.ornament > 0.3;
    for (let i = 0; i < 4; i += 1) {
      const y = bandTop + 6 + i * 5;
      // `viewHeight`: the canvas is drawn taller than it is shown.
      if (y >= anatomy.viewHeight - 1) break;
      if (metal) {
        raster.set(centerX, y, ramps.metal.steps[1], MAT.METAL, 1);
        raster.set(centerX + 1, y, ramps.metal.steps[4], MAT.METAL, 4);
      } else {
        put(centerX, y, ramps.clothC, MAT.CLOTH_C, 2);
        put(centerX + 1, y, ramps.clothC, MAT.CLOTH_C, 5);
      }
    }
  }
}

/**
 * The pallu: the decorated end of a sari carried over the left shoulder and
 * down across the chest. Also serves the dupatta, the odhani and the
 * angavastram, which are the same gesture with a different name.
 */
function drawPallu(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);
  const noise = makeNoise1D(spec.seed ^ 0x33a1);

  const band = makeMask(size, size);
  const width = 11;
  for (let y = anatomy.shoulderTop - 2; y < size; y += 1) {
    const t = (y - (anatomy.shoulderTop - 2)) / 30;
    // Falls from the point of the left shoulder and drifts inward as it hangs.
    const centre = centerX - anatomy.shoulderHalf * 0.62 + t * 9 + noise(y * 0.2) * 1.2;
    for (let dx = -width / 2; dx <= width / 2; dx += 1) {
      const x = Math.round(centre + dx);
      if (x < 0 || x >= size || !body[y * size + x]) continue;
      band[y * size + x] = 1;
    }
  }

  fillMask(raster, band, ramps.clothC, MAT.CLOTH_C, (x, y) => {
    const edge = !band[y * size + x - 1] || !band[y * size + x + 1];
    return edge ? 1.6 : 3 + noise(x * 0.4 + y * 0.2) * 0.8;
  }, { dither: 0.35 });

  // The zari border — a metallic line inset from each edge, which is the
  // single most recognisable thing about a sari at any distance.
  for (let y = 0; y < size; y += 1) {
    let first = -1;
    let last = -1;
    for (let x = 0; x < size; x += 1) {
      if (!band[y * size + x]) continue;
      if (first < 0) first = x;
      last = x;
    }
    if (first < 0 || last - first < 4) continue;
    for (const x of [first + 1, last - 1]) {
      raster.set(x, y, ramps.metal.steps[2], MAT.METAL, 2);
    }
    // A motif repeating down the middle of the band.
    if (y % 6 === 0 && spec.garment.ornament > 0.3) {
      const mid = Math.round((first + last) / 2);
      raster.set(mid, y, ramps.metal.steps[1], MAT.METAL, 1);
      raster.set(mid - 1, y + 1, ramps.metal.steps[3], MAT.METAL, 3);
      raster.set(mid + 1, y + 1, ramps.metal.steps[3], MAT.METAL, 3);
    }
  }
  applyContactShadow(raster, band, book, { dx: 1, dy: 1, strength: 2, depth: 2 });
  void put;
}

/**
 * The diagonal of a toga, palla, stola or himation — one length of cloth with
 * no seams and no fastenings, whose whole construction is the way it is thrown.
 */
function drawToga(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const name = spec.garment.name.toLowerCase();
  const noise = makeNoise1D(spec.seed ^ 0x6c21);

  // The overfold, running from the right shoulder down to the left side.
  const band = makeMask(size, size);
  const thickness = 9;
  for (let x = 0; x < size; x += 1) {
    const t = (x - (centerX - anatomy.shoulderHalf)) / Math.max(1, anatomy.shoulderHalf * 2);
    const y0 = anatomy.shoulderTop - 3 + (1 - t) * 26 + noise(x * 0.25) * 1.4;
    for (let dy = 0; dy < thickness; dy += 1) {
      const y = Math.round(y0 + dy);
      if (y < 0 || y >= size || !body[y * size + x]) continue;
      band[y * size + x] = 1;
    }
  }
  fillMask(raster, band, ramps.clothA, MAT.CLOTH_A, (x, y) => {
    const above = !band[(y - 1) * size + x];
    return above ? 1.4 : 4.4 + noise(x * 0.3 + y * 0.1) * 0.7;
  }, { dither: 0.4 });
  applyContactShadow(raster, band, book, { dx: 0, dy: 1, strength: 2, depth: 2 });

  // The clavus: the woven purple stripe that made a toga a statement of rank
  // rather than a length of wool. Only where the name claims one.
  if (/stripe|senator|formal|citizen|elegant|purple/.test(name)) {
    for (let y = anatomy.collarY - 2; y < size; y += 1) {
      const x = centerX - Math.round(anatomy.neckHalf * 0.8);
      if (!body[y * size + x]) continue;
      for (let dx = 0; dx < 3; dx += 1) {
        raster.set(x + dx, y, ramps.clothC.steps[dx === 0 ? 2 : dx === 2 ? 5 : 3], MAT.CLOTH_C, 3);
      }
    }
  }
}

/** The Egyptian broad collar: concentric strung rows from throat to shoulder. */
function drawBroadCollar(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);
  const cy = anatomy.collarY - 6;

  // Filled courses, not strung beads. A row of separated dots at this size is
  // read as noise on the cloth; the collar has to be a solid mass of colour
  // with the courses told apart by value, which is also what it looked like.
  const rx = anatomy.shoulderHalf * 0.72;
  const ry = 15;
  for (let y = cy; y < cy + ry; y += 1) {
    for (let x = Math.round(centerX - rx); x <= Math.round(centerX + rx); x += 1) {
      const u = (x - centerX) / rx;
      const v = (y - cy) / ry;
      const r = Math.sqrt(u * u + v * v);
      if (r > 1) continue;
      const ring = Math.floor(r * 5);
      const ramp = ring % 2 === 0 ? ramps.gem : ramps.metal;
      const material = ring % 2 === 0 ? MAT.GEM : MAT.METAL;
      put(x, y, ramp, material, ring % 2 === 0 ? 2 : 3.5);
    }
  }
  applyContactShadow(context.raster, body, context.book, { dx: 0, dy: 1, strength: 1, depth: 1 });
  void raster;
}

/** A pleated linen ruff, which stands away from the neck and holds a shadow. */
function drawRuff(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps, book } = context;
  const { size, centerX } = anatomy;
  const cy = anatomy.collarY - 5;
  const disc = makeMask(size, size);
  const rx = anatomy.neckHalf + 9;
  const ry = 6;

  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = centerX - rx; x <= centerX + rx; x += 1) {
      const dx = (x - centerX) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      if (Math.abs(x - centerX) < anatomy.neckHalf && y < cy) continue;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      disc[y * size + x] = 1;
    }
  }
  fillMask(raster, disc, ramps.clothB, MAT.CLOTH_B, (x, y) => {
    // Pleats: the value swings with the angle around the neck, which is what a
    // concertina of starched linen actually does to the light.
    const a = Math.atan2(y - cy, x - centerX);
    return 2.4 + (Math.sin(a * 9) > 0 ? 0 : 2.1);
  });
  applyContactShadow(raster, disc, book, { dx: 0, dy: 1, strength: 2, depth: 3 });
}

/** A woven-strip cloth: kente, aso oke, ankara. Narrow bands, blocked colour. */
function drawStripWeave(context: RenderContext, body: Mask): void {
  const { anatomy, ramps, spec } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);
  const rng = makeRng(spec.seed ^ 0x77c9);

  const strip = 5;
  for (let x = 0; x < size; x += 1) {
    const band = Math.floor((x - centerX + 400) / strip);
    for (let y = anatomy.shoulderTop - 2; y < size; y += 1) {
      const block = Math.floor(y / 6);
      // Two interlocking rhythms — the strip across and the block down — which
      // is how the cloth is actually made, one narrow length at a time.
      const pick = (band * 7 + block * 3) % 5;
      if (pick === 0) put(x, y, ramps.clothB, MAT.CLOTH_B, 2.4);
      else if (pick === 1) put(x, y, ramps.clothC, MAT.CLOTH_C, 3);
      else if (pick === 2 && (x - centerX) % strip === 0) {
        put(x, y, ramps.clothC, MAT.CLOTH_C, 1.6);
      }
      // The weft line where two strips are sewn edge to edge.
      if ((x - centerX + 400) % strip === 0) put(x, y, ramps.clothA, MAT.CLOTH_A, 5.4);
    }
  }
  void rng;
}

/** A feather cape: overlapping scalloped courses across the shoulders. */
function drawFeathered(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);
  const noise = makeNoise1D(spec.seed ^ 0x1d4e);

  for (let row = 0; row < 7; row += 1) {
    const y0 = anatomy.shoulderTop - 4 + row * 5;
    const stagger = row % 2 === 0 ? 0 : 3;
    for (let x = 0; x < size; x += 1) {
      const phase = ((x + stagger) % 6) / 6;
      // Each feather is a shallow arc; the tip sits lowest and catches light.
      const dip = Math.sin(phase * Math.PI) * 3.4;
      const y = Math.round(y0 + dip + noise(x * 0.4 + row) * 0.8);
      const ramp = row % 2 === 0 ? ramps.clothB : ramps.clothC;
      const material = row % 2 === 0 ? MAT.CLOTH_B : MAT.CLOTH_C;
      put(x, y, ramp, material, 5.2);
      put(x, y - 1, ramp, material, 2.2);
      put(x, y - 2, ramp, material, 3.4);
      if (phase > 0.45 && phase < 0.6) put(x, y + 1, ramp, material, 1.4);
    }
  }
  applyContactShadow(raster, body, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
}

/** Fur worn at the neck — a cape, a stole, a pelt, a lined collar. */
function drawFurCollar(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const rng = makeRng(spec.seed ^ 0x2a6d);
  const wander = makeNoise1D(spec.seed ^ 0x9911);

  // A band following the shoulders, with an edge that wanders instead of
  // running true. A clean outline reads as felt however it is shaded — the
  // same lesson the fur caps taught.
  const band = makeMask(size, size);
  for (let x = 0; x < size; x += 1) {
    const dx = (x + 0.5 - centerX) / Math.max(1, anatomy.shoulderHalf);
    if (Math.abs(dx) > 1.05) continue;
    const top = anatomy.shoulderTop - 3 + Math.abs(dx) * 6 + wander(x * 0.6) * 2.2;
    const depth = 11 + wander(x * 0.3 + 40) * 3.5;
    for (let y = Math.round(top); y < Math.round(top + depth); y += 1) {
      if (y < 0 || y >= size || !body[y * size + x]) continue;
      band[y * size + x] = 1;
    }
  }

  fillMask(raster, band, ramps.clothB, MAT.CLOTH_B, (x, y) => {
    // Clumped rather than graded: fur has no smooth surface to shade.
    const clump = wander(x * 0.9 + y * 0.35);
    return 2.2 + clump * 3.4;
  }, { dither: 0.55 });

  // Guard hairs at the boundary, which is what sells it at ten pixels.
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      if (!band[y * size + x]) continue;
      const open = !band[(y - 1) * size + x] || !band[(y + 1) * size + x];
      if (!open) continue;
      if (rng() > 0.5) raster.shift(x, y, -2, book);
      else raster.shift(x, y, 2, book);
    }
  }
  applyContactShadow(raster, band, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
}

/** A shawl or stole over both shoulders, with a fringed lower edge. */
function drawShawl(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const noise = makeNoise1D(spec.seed ^ 0x4b71);

  const band = makeMask(size, size);
  for (let x = 0; x < size; x += 1) {
    const dx = (x + 0.5 - centerX) / Math.max(1, anatomy.shoulderHalf);
    if (Math.abs(dx) > 1.04) continue;
    // Deep on the shoulders and open at the throat, the way a shawl hangs when
    // it is pulled round rather than pinned.
    const top = anatomy.shoulderTop - 2 + Math.max(0, (1 - Math.abs(dx)) * 9);
    const depth = 10 + Math.abs(dx) * 14;
    for (let y = Math.round(top); y < Math.round(top + depth); y += 1) {
      if (y < 0 || y >= size || !body[y * size + x]) continue;
      band[y * size + x] = 1;
    }
  }
  fillMask(raster, band, ramps.clothB, MAT.CLOTH_B, (x, y) => {
    const dx = (x + 0.5 - centerX) / Math.max(1, anatomy.shoulderHalf);
    return 2.6 + Math.abs(dx) * 1.6 + noise(y * 0.5 + x * 0.1) * 0.7;
  }, { dither: 0.45 });

  // The fringe: single threads hanging off the hem, at irregular lengths.
  for (let x = 0; x < size; x += 1) {
    let bottom = -1;
    for (let y = 0; y < size; y += 1) if (band[y * size + x]) bottom = y;
    // A band that reaches the bottom of the *frame* has no visible hem to fringe.
    // Testing against `size` instead let bands that run off the picture grow a
    // fringe in the rows past it, where nobody sees it.
    if (bottom < 0 || bottom >= anatomy.viewHeight - 1) continue;
    if (noise(x * 0.8) < 0.35) continue;
    const drop = 1 + Math.round(noise(x * 1.4 + 9) * 2.4);
    for (let i = 1; i <= drop; i += 1) {
      const y = bottom + i;
      if (y >= size || !body[y * size + x]) break;
      raster.shift(x, y, 2, book);
    }
  }
  applyContactShadow(raster, band, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
}

/** A poncho: one cloth, a slit for the head, and bands running across it. */
function drawPoncho(context: RenderContext, body: Mask): void {
  const { anatomy, ramps, spec } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);
  const rng = makeRng(spec.seed ^ 0x60d3);

  const rows = [3, 5, 4, 6, 4];
  let y = anatomy.collarY + 2;
  for (let i = 0; i < rows.length && y < size; i += 1) {
    const ramp = i % 2 === 0 ? ramps.clothB : ramps.clothC;
    const material = i % 2 === 0 ? MAT.CLOTH_B : MAT.CLOTH_C;
    for (let dy = 0; dy < rows[i]; dy += 1) {
      for (let x = 0; x < size; x += 1) {
        // A stepped motif inside the wider bands, rather than flat stripes.
        const motif = rows[i] >= 5 && dy > 0 && dy < rows[i] - 1 && (x + dy * 2) % 7 < 3;
        put(x, y + dy, ramp, material, motif ? 1.8 : dy === 0 ? 2.4 : 3.6);
      }
    }
    y += rows[i];
  }
  // The neck slit, which is the only construction a poncho has.
  for (let dx = -anatomy.neckHalf; dx <= anatomy.neckHalf; dx += 1) {
    put(centerX + dx, anatomy.collarY + 1, ramps.clothA, MAT.CLOTH_A, 5.6);
  }
  void rng;
}

/** A collared shirt: two points at the neck and a short buttoned placket. */
function drawPlacket(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps, spec } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);
  const name = spec.garment.name.toLowerCase();

  // Collar points, angled down and out from the neck opening.
  const top = anatomy.neckBottom - 4;
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 8; i += 1) {
      const x = centerX + side * (anatomy.neckHalf + 1 + i * 0.8);
      const y = top + i;
      for (let dy = -1; dy <= 1; dy += 1) {
        put(x, y + dy, ramps.clothA, MAT.CLOTH_A, dy === -1 ? 0.5 : dy === 1 ? 6 : 2);
      }
    }
  }

  // The placket: a raised strip down the centre with two or three buttons.
  for (let y = top + 2; y < Math.min(size, top + 16); y += 1) {
    put(centerX - 2, y, ramps.clothA, MAT.CLOTH_A, 0.8);
    put(centerX + 2, y, ramps.clothA, MAT.CLOTH_A, 6);
  }
  for (let i = 0; i < 3; i += 1) {
    const y = top + 5 + i * 5;
    // `viewHeight`: the canvas is drawn taller than it is shown.
    if (y >= anatomy.viewHeight - 1) break;
    put(centerX, y, ramps.clothA, MAT.CLOTH_A, 0.6);
    put(centerX + 1, y, ramps.clothA, MAT.CLOTH_A, 6);
  }

  // A guayabera's pintucks: paired vertical tucks either side of the placket,
  // which is the one thing that distinguishes it from any other white shirt.
  if (/guayabera/.test(name)) {
    for (const side of [-1, 1] as const) {
      for (const offset of [6, 9] as const) {
        for (let y = top + 3; y < size; y += 1) {
          put(centerX + side * offset, y, ramps.clothA, MAT.CLOTH_A, 5.4);
          put(centerX + side * offset + 1, y, ramps.clothA, MAT.CLOTH_A, 1.8);
        }
      }
    }
  }
  void raster;
}

/** Knitted modern casual: a ribbed crew neck and nothing else. */
function drawTee(context: RenderContext, body: Mask): void {
  const { anatomy, ramps } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);
  const top = anatomy.neckBottom - 3;

  // A rib is a band of alternating value, not a line. Three rows of it is the
  // difference between a t-shirt and a hole cut in cloth.
  for (let dy = 0; dy < 4; dy += 1) {
    const half = anatomy.neckHalf + 5 + dy * 0.6;
    for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
      const dip = Math.round(Math.pow(Math.abs(x - centerX) / half, 2) * 4);
      put(x, top + dy - dip + 4, ramps.clothA, MAT.CLOTH_A,
        dy === 0 ? 0.6 : dy === 3 ? 6 : x % 2 === 0 ? 1.8 : 3.6);
    }
  }
  void size;
}

/** A decorated band across the upper chest — embroidery, zari, bead work. */
function drawYoke(context: RenderContext, body: Mask): void {
  const { raster, anatomy, ramps, spec, book } = context;
  const { size, centerX } = anatomy;
  const put = painter(context, body);
  const rng = makeRng(spec.seed ^ 0x5f13);
  const motif = Math.floor(rng() * 3);

  const top = anatomy.collarY + 2;
  const rows = 6;
  for (let dy = 0; dy < rows; dy += 1) {
    const y = top + dy;
    for (let x = 0; x < size; x += 1) {
      if (!body[y * size + x]) continue;
      const t = (x - centerX + 400) % 6;
      let lit = false;
      // Three ways of arranging the same handful of pixels — a chevron, a
      // diamond, a running scroll. Which one a persona gets is theirs to keep.
      if (motif === 0) lit = t === (dy < rows / 2 ? dy : rows - 1 - dy);
      else if (motif === 1) lit = Math.abs(t - 2.5) + Math.abs(dy - 2.5) < 3;
      else lit = (t + dy) % 6 < 2;
      if (!lit) continue;
      put(x, y, ramps.clothC, MAT.CLOTH_C, 1);
      put(x, y + 1, ramps.clothC, MAT.CLOTH_C, 4.5);
    }
  }
  // Metal thread at the top and bottom edge of the band.
  if (spec.garment.ornament > 0.4) {
    for (let x = 0; x < size; x += 1) {
      for (const y of [top - 1, top + rows]) {
        if (y < 0 || y >= size || !body[y * size + x]) continue;
        raster.set(x, y, ramps.metal.steps[y === top - 1 ? 2 : 4], MAT.METAL, 3);
      }
    }
  }
  applyContactShadow(raster, body, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
  void maskDilate;
  void maskIntersect;
}
