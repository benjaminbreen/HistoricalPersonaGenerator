/**
 * portraitLab/art/ornaments.ts
 *
 * The decorative parts that headgear is made of.
 *
 * The clothing tables name 263 distinct head items and this renderer has nine
 * silhouettes to draw them with, so most of what makes an item *that item* was
 * being thrown away at the classifier: a Kingfisher-Feather Hair Ornament and a
 * plain linen fillet both arrived here as `band`. The fix is not more
 * silhouettes — the item list grows and the frame does not — it is to notice
 * that 263 names are assembled out of a much smaller pot of parts. Count the
 * words and the pot is obvious: feathers turn up 48 times, a precious metal 50,
 * a stone or bead 46, flowers 15. Eight primitives, composed, cover the corpus.
 *
 * Two rules run through everything here.
 *
 * **The dark pixel matters more than the bright one.** An ornament laid onto
 * hair or cloth reads as a sticker until something sits *under* it. Every
 * primitive in this file puts a contact shadow down before it puts a highlight
 * up, and the ones that look convincing are the ones where that shadow lands on
 * the right side.
 *
 * **Three pixels is a material.** A bead is three pixels; the illusion is
 * entirely in the relationship between them. Pearl is near-white with a warm
 * shadow and one hard specular; jade is waxy, cool and low-contrast so it
 * refuses a specular at all; gilt is a narrow, very bright hit on a warm body.
 * Get those relationships right and the same three pixels read as three
 * different substances, which is the whole reason the material table below is
 * longer than the shape table above it.
 */

import { buildRamp, mixRgb, Ramp, RGB } from '../core/color';
import { MAT } from '../core/raster';
import { makeRng, unit } from '../core/rng';
import { RenderContext } from '../render/context';
import { OrnamentMaterial, OrnamentPlacement, OrnamentSpec } from '../spec/types';

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

interface OrnamentMaterialDef {
  base: string;
  contrast: number;
  /** Hue the highlight drifts toward, for anything iridescent or gemlike. */
  sheen?: string;
  /** 0..1 — how far the top two steps are pulled toward `sheen`. */
  sheenAmount?: number;
  /** A single blown-out pixel at the highlight, for hard specular materials. */
  specular?: boolean;
  saturation?: number;
}

/**
 * Deliberately a touch brighter and more saturated than life.
 *
 * These are the objects a portrait is *about* — the thing a sitter chose to be
 * painted wearing — and at this size a materially accurate jade reads as grey-
 * green mud. Every entry here is pushed a step past its real chroma so that
 * three pixels of it still says jade, and the ramp's own shadow steps pull it
 * back toward plausibility. Heightened, not neon: the test is whether it still
 * looks like a substance and not like a UI element.
 */
const ORNAMENT_MATERIALS: Record<OrnamentMaterial, OrnamentMaterialDef> = {
  // Metals. Narrow, bright specular on a warm body; silver goes cooler and
  // keeps more of its value in shadow than gold does.
  gold: { base: '#e0a838', contrast: 1.9, sheen: '#fff2c0', sheenAmount: 0.5, specular: true, saturation: 1.15 },
  gilt: { base: '#d8a447', contrast: 1.75, sheen: '#ffeeb4', sheenAmount: 0.45, specular: true, saturation: 1.1 },
  silver: { base: '#c3c8d0', contrast: 1.8, sheen: '#f4f8ff', sheenAmount: 0.4, specular: true },
  bronze: { base: '#b07a3c', contrast: 1.6, sheen: '#f0cf8e', sheenAmount: 0.35, specular: true },
  copper: { base: '#c07048', contrast: 1.6, sheen: '#ffc79a', sheenAmount: 0.4, specular: true, saturation: 1.12 },

  // Stones. Jade and turquoise are waxy — low contrast, no hard hit. The
  // transparent stones get a bright sheen because light goes *into* them.
  jade: { base: '#5fae86', contrast: 1.05, sheen: '#c8f0d4', sheenAmount: 0.3, saturation: 1.2 },
  turquoise: { base: '#4bb3bd', contrast: 1.1, sheen: '#cdf4f4', sheenAmount: 0.34, saturation: 1.25 },
  lapis: { base: '#2f4f9e', contrast: 1.45, sheen: '#7fa8ff', sheenAmount: 0.42, saturation: 1.3 },
  coral: { base: '#d9603f', contrast: 1.25, sheen: '#ffb08a', sheenAmount: 0.34, saturation: 1.25 },
  amber: { base: '#d08a1e', contrast: 1.4, sheen: '#ffd977', sheenAmount: 0.48, specular: true, saturation: 1.3 },
  ruby: { base: '#a51f3c', contrast: 1.55, sheen: '#ff6d84', sheenAmount: 0.46, specular: true, saturation: 1.35 },
  emerald: { base: '#1f8a56', contrast: 1.5, sheen: '#69e8a4', sheenAmount: 0.46, specular: true, saturation: 1.35 },
  // Carnelian is the most-worn stone in the ancient world and was missing
  // entirely: banded, warm, translucent at the edges, and a full step oranger
  // than the garnet it kept being filed under.
  carnelian: { base: '#b8552a', contrast: 1.3, sheen: '#ffab6b', sheenAmount: 0.4, saturation: 1.28 },
  /**
   * Trade beads, and the one material here whose *colour* is not the point.
   *
   * Glass is defined by what it does to light rather than by a hue — it is the
   * only substance in this table with a hard specular on a body that is barely
   * saturated at all, which is exactly why a strand of them catches across a
   * room. The hue arrives from the piece it belongs to.
   */
  glass: { base: '#7f93a8', contrast: 1.7, sheen: '#eaf6ff', sheenAmount: 0.55, specular: true, saturation: 0.9 },
  /**
   * Egyptian faience — ground quartz, glazed and fired to a blue-green no
   * mineral in the ground is.
   *
   * The most-produced ornamental material of the ancient world and the reason
   * a broad collar reads at fifty paces. It is deliberately the brightest entry
   * in this table: the whole technology exists to make something *look* like
   * turquoise and lapis without being either, and a faience bead that reads as
   * a duller turquoise has failed at the one thing it was invented to do.
   */
  faience: { base: '#3fb8c4', contrast: 1.35, sheen: '#b6fbff', sheenAmount: 0.46, specular: true, saturation: 1.4 },
  // Jet is fossil wood polished to a mirror: near-black with a hard cold hit,
  // and nothing like the matte black of a dyed bead. Whitby jet in Bronze Age
  // Britain, and again on every Victorian widow.
  jet: { base: '#2b2a30', contrast: 1.9, sheen: '#b9c2d6', sheenAmount: 0.5, specular: true, saturation: 0.7 },

  // Pearl is the one everybody draws as chrome. It is not: the body is warm
  // and pale, the shadow is warmer still, and there is exactly one small hit.
  pearl: { base: '#eee2d6', contrast: 1.0, sheen: '#ffffff', sheenAmount: 0.55, specular: true, saturation: 0.85 },

  /**
   * Kingfisher feather — *tian-tsui*, cut and glued over gilt silver.
   *
   * The signature material of the whole table and the reason it has a `sheen`
   * field at all. Real kingfisher is structurally coloured, so it does not
   * merely get lighter toward the light, it changes hue: a deep teal body that
   * flares to cyan where it catches and drops toward violet where it does not.
   * A ramp that only lightens gives a nice blue-green and misses the point.
   */
  kingfisher: { base: '#1f8fa8', contrast: 1.5, sheen: '#7ff0ff', sheenAmount: 0.62, saturation: 1.4 },

  shell: { base: '#e6d9c2', contrast: 1.15, sheen: '#fff6e2', sheenAmount: 0.4, saturation: 0.9 },
  bone: { base: '#ded2b8', contrast: 1.0, saturation: 0.8 },
  wood: { base: '#7d5a3a', contrast: 1.15, saturation: 0.95 },
  lacquer: { base: '#8e1f22', contrast: 1.5, sheen: '#ff9d84', sheenAmount: 0.38, specular: true, saturation: 1.2 },

  // Feathers, by value band rather than by bird. A plume's identity at this
  // size is its shape and its value, not its species.
  plumeDark: { base: '#3a3f52', contrast: 1.25, sheen: '#8fa0c8', sheenAmount: 0.3 },
  plumeWhite: { base: '#e8e6dd', contrast: 0.95, saturation: 0.85 },
  plumeBright: { base: '#c2492f', contrast: 1.3, sheen: '#ffa878', sheenAmount: 0.34, saturation: 1.25 },

  cloth: { base: '#b9a887', contrast: 1.0 },
};

const rampCache = new Map<OrnamentMaterial, Ramp>();

export function ornamentRamp(material: OrnamentMaterial): Ramp {
  const cached = rampCache.get(material);
  if (cached) return cached;
  const def = ORNAMENT_MATERIALS[material] || ORNAMENT_MATERIALS.bronze;
  const ramp = buildRamp(def.base, {
    contrast: def.contrast,
    saturation: def.saturation ?? 1,
    shift: 0.26,
  });

  // The sheen pass. `buildRamp` climbs toward a warm or cool *light*, which is
  // right for cloth and wrong for anything that answers light with a colour of
  // its own — a gemstone, a glaze, a structurally coloured feather. Pulling the
  // top steps toward a named hue is what separates kingfisher from teal paint.
  if (def.sheen && def.sheenAmount) {
    const sheen = hexRgb(def.sheen);
    const steps = ramp.steps.slice();
    steps[0] = mixRgb(steps[0], sheen, def.sheenAmount);
    steps[1] = mixRgb(steps[1], sheen, def.sheenAmount * 0.55);
    steps[2] = mixRgb(steps[2], sheen, def.sheenAmount * 0.2);
    const withSheen: Ramp = { ...ramp, steps };
    rampCache.set(material, withSheen);
    return withSheen;
  }

  rampCache.set(material, ramp);
  return ramp;
}

function hexRgb(hex: string): RGB {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

/**
 * Whether this substance answers light with a hard point or a soft bloom.
 *
 * Exported because the jewellery draws from this table now, and because the
 * per-frame glint is only honest on the materials that have a specular to move
 * in the first place: jade and pearl and bone stay where they are put, and gold
 * and amber and glass are the ones that catch.
 */
export function isSpecular(material: OrnamentMaterial): boolean {
  return Boolean(ORNAMENT_MATERIALS[material]?.specular);
}

/**
 * The colour a highlight on this material reaches at its brightest.
 *
 * Not white. A blown highlight on gold is warm, on silver is cold, and on
 * kingfisher is cyan — the whole reason the `sheen` field exists is that these
 * substances *change hue* toward the light rather than merely lightening, and a
 * glint that resolves to white throws away the one property that distinguishes
 * them. It is pushed most of the way to the sheen and only a little toward
 * white, so the peak still says which substance it came from.
 */
export function ornamentGlintPeak(material: OrnamentMaterial): RGB {
  const def = ORNAMENT_MATERIALS[material] || ORNAMENT_MATERIALS.bronze;
  const top = ornamentRamp(material).steps[0];
  const toward = def.sheen ? hexRgb(def.sheen) : { r: 255, g: 252, b: 244 };
  return mixRgb(mixRgb(top, toward, 0.85), { r: 255, g: 255, b: 250 }, 0.3);
}

// ---------------------------------------------------------------------------
// The one primitive everything else is built from
// ---------------------------------------------------------------------------

/**
 * Set one pixel of ornament, and darken whatever it now sits on.
 *
 * The contact shadow is not decoration. Metal laid straight onto hair is a
 * decal; the same metal with a shifted pixel beneath it is an object resting on
 * a surface, and the difference costs one write. Everything in this file goes
 * through here.
 */
function put(
  context: RenderContext,
  x: number, y: number, index: number,
  ramp: Ramp, mat: number,
  shade = true
): void {
  const { raster, book, anatomy } = context;
  if (x < 0 || y < 0 || x >= anatomy.size || y >= anatomy.size) return;
  const i = Math.max(0, Math.min(6, Math.round(index)));
  raster.set(x, y, ramp.steps[i], mat, i);
  if (!shade) return;
  const below = raster.matAt(x, y + 1);
  if (below !== mat && below !== MAT.EMPTY && below !== MAT.METAL && below !== MAT.GEM) {
    raster.shift(x, y + 1, 2, book);
  }
}

/** A round bead, stud or boss — the smallest thing that still reads as a solid. */
function bead(
  context: RenderContext,
  cx: number, cy: number, size: number,
  material: OrnamentMaterial
): void {
  const ramp = ornamentRamp(material);
  const mat = MAT.GEM;
  if (size <= 1) {
    put(context, cx, cy, 2, ramp, mat);
    if (isSpecular(material)) put(context, cx, cy, 0, ramp, mat, false);
    return;
  }
  if (size === 2) {
    put(context, cx, cy, isSpecular(material) ? 0 : 1, ramp, mat, false);
    put(context, cx + 1, cy, 2.5, ramp, mat, false);
    put(context, cx, cy + 1, 3.5, ramp, mat);
    put(context, cx + 1, cy + 1, 5, ramp, mat);
    return;
  }
  // 3px reads rounder as a diamond than as a square at this scale.
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (Math.abs(dx) + Math.abs(dy) > 1) continue;
      const lit = dx <= 0 && dy <= 0;
      put(context, cx + dx, cy + dy, lit ? 1.5 : 4, ramp, mat, dy >= 0);
    }
  }
  put(context, cx, cy, 2.5, ramp, mat, false);
  // The hit goes up and left, one pixel, never two — two reads as a hole.
  if (isSpecular(material)) put(context, cx - 1, cy - 1, 0, ramp, mat, false);
}

// ---------------------------------------------------------------------------
// The parts
// ---------------------------------------------------------------------------

/**
 * A feather.
 *
 * Three things make five pixels read as a feather rather than as a blade: the
 * shaft is *lighter* than the vane on the lit side and darker on the other, the
 * vane is notched rather than smooth, and the whole thing curves. Draw it
 * straight and it is a knife; draw it without notches and it is a leaf. The
 * curve is why `lean` is quadratic in t — a linear one reads as a slanted stick.
 */
function drawFeather(
  context: RenderContext,
  x0: number, y0: number,
  length: number,
  side: -1 | 1,
  material: OrnamentMaterial,
  seed: number
): void {
  const ramp = ornamentRamp(material);
  const mat = MAT.HEADWEAR;
  const rng = makeRng(seed);
  const wobble = rng() * 0.5;

  for (let i = 0; i < length; i += 1) {
    const t = i / Math.max(1, length - 1);
    // Rises and bends away from the head as it goes.
    const x = Math.round(x0 + side * (t * t * (length * 0.42) + wobble));
    const y = Math.round(y0 - i);

    // The vane, widest at about a third of the way up and tapering to the tip.
    // Narrow: at a fifth of the length it came out as wide as it was tall and
    // read as a leaf. A feather is a long thin thing with a stiff middle.
    const spread = Math.round((1 - Math.abs(t - 0.3) * 1.5) * (length * 0.13));
    for (let d = 1; d <= Math.max(0, spread); d += 1) {
      // Notching: every third barb is missing, which is what stops the edge
      // reading as cut paper.
      if ((i + d) % 3 === 0 && d === spread) continue;
      put(context, x - side * d, y, 4, ramp, mat, false);
      put(context, x + side * d, y, 2.5, ramp, mat, false);
    }
    // The shaft, last so it survives the vane.
    put(context, x, y, 1.2, ramp, mat, i === 0);
  }
}

/** A spray of feathers, opening outward and back. */
function drawPlume(
  context: RenderContext,
  x0: number, y0: number,
  length: number,
  side: -1 | 1,
  material: OrnamentMaterial,
  count: number,
  seed: number
): void {
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    drawFeather(
      context,
      Math.round(x0 + side * (t * 3 - 1)),
      Math.round(y0 + t * 2),
      Math.round(length * (1 - t * 0.28)),
      side,
      material,
      seed + i * 977
    );
  }
}

/**
 * A pin: a shaft with a worked head.
 *
 * The shaft is deliberately only two pixels of value — a pin that is as
 * contrasty as its own finial stops being a fitting and becomes a nail.
 */
function drawPin(
  context: RenderContext,
  x0: number, y0: number,
  length: number,
  side: -1 | 1,
  material: OrnamentMaterial,
  headMaterial: OrnamentMaterial,
  scale: number
): void {
  const ramp = ornamentRamp(material);
  const mat = MAT.METAL;
  for (let i = 0; i < length; i += 1) {
    const t = i / Math.max(1, length - 1);
    const x = Math.round(x0 + side * i * 0.72);
    const y = Math.round(y0 - i * 0.62);
    put(context, x, y, t < 0.5 ? 2 : 3.2, ramp, mat, i > length - 3);
  }
  const hx = Math.round(x0 + side * (length - 1) * 0.72);
  const hy = Math.round(y0 - (length - 1) * 0.62);
  bead(context, hx, hy, scale > 0.55 ? 3 : 2, headMaterial);
}

/** A comb: a spine with teeth, set into the hair so only the crest shows. */
function drawComb(
  context: RenderContext,
  cx: number, cy: number,
  halfWidth: number,
  material: OrnamentMaterial
): void {
  const ramp = ornamentRamp(material);
  const mat = MAT.HEADWEAR;
  for (let dx = -halfWidth; dx <= halfWidth; dx += 1) {
    const t = Math.abs(dx) / Math.max(1, halfWidth);
    // The crest arcs; a flat comb reads as a headband with notches.
    const rise = Math.round((1 - t * t) * 3);
    for (let d = 0; d <= rise; d += 1) {
      const lit = d === rise;
      put(context, cx + dx, cy - d, lit ? 1.5 : 3.4, ramp, mat, d === 0);
    }
    // Teeth every other column, hanging below into the hair.
    if (dx % 2 === 0) put(context, cx + dx, cy + 1, 4.5, ramp, mat, false);
  }
}

/** Beads hung in a line, swinging free of the head. */
function drawBeadStrand(
  context: RenderContext,
  x0: number, y0: number,
  drop: number,
  material: OrnamentMaterial,
  seed: number
): void {
  const rng = makeRng(seed);
  const drift = rng() > 0.5 ? 1 : -1;
  for (let i = 0; i < drop; i += 1) {
    const x = Math.round(x0 + drift * Math.sin(i * 0.5) * 0.9);
    bead(context, x, y0 + i * 3, i === drop - 1 ? 3 : 2, material);
  }
}

/** A flower: petals around a contrasting centre. */
function drawFlower(
  context: RenderContext,
  cx: number, cy: number,
  material: OrnamentMaterial,
  heartMaterial: OrnamentMaterial
): void {
  const ramp = ornamentRamp(material);
  const mat = MAT.HEADWEAR;
  // Five petals, offset so it is not a plus sign.
  const petals: Array<[number, number, number]> = [
    [0, -2, 1.4], [2, -1, 2.2], [1, 2, 3.6], [-2, 1, 3.2], [-2, -1, 2],
  ];
  for (const [dx, dy, index] of petals) {
    put(context, cx + dx, cy + dy, index, ramp, mat, dy >= 1);
    put(context, cx + Math.round(dx * 0.5), cy + Math.round(dy * 0.5), index + 0.6, ramp, mat, false);
  }
  bead(context, cx, cy, 1, heartMaterial);
}

/** A flat disc, boss or plaque. */
function drawMedallion(
  context: RenderContext,
  cx: number, cy: number,
  radius: number,
  material: OrnamentMaterial,
  stone: OrnamentMaterial | null
): void {
  const ramp = ornamentRamp(material);
  const mat = MAT.METAL;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (dx * dx + dy * dy > radius * radius + 0.4) continue;
      const rim = dx * dx + dy * dy > (radius - 0.7) * (radius - 0.7);
      // A raised disc: lit rim on the upper left, shadowed on the lower right,
      // and a flatter field between them.
      const facing = (dx + dy) / Math.max(1, radius * 2);
      const index = rim ? (facing < 0 ? 1 : 4.6) : 2.8 + facing * 1.2;
      put(context, cx + dx, cy + dy, index, ramp, mat, dy === radius);
    }
  }
  if (stone) bead(context, cx, cy, radius >= 3 ? 3 : 2, stone);
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

interface Anchor { x: number; y: number; side: -1 | 1 }

function anchorFor(
  context: RenderContext,
  placement: OrnamentPlacement,
  side: -1 | 1,
  hairlineY: number
): Anchor {
  const { anatomy } = context;
  const w = anatomy.headHalfWidth;
  switch (placement) {
    case 'crown':
      // Set *into* the crown of the hair rather than balanced on top of the
      // skull. There are only nine pixels above the head and a feather is
      // twelve, so anchoring at the top edge sent every plume off the canvas;
      // anchoring it low also reads better, because a real one is pushed into
      // the hair and rises from inside the mass.
      return { x: Math.round(anatomy.centerX + side * w * 0.42), y: anatomy.headTop + 10, side };
    case 'temple':
      return { x: Math.round(anatomy.centerX + side * w * 0.82), y: hairlineY - 1, side };
    case 'brow':
      return { x: Math.round(anatomy.centerX + side * w * 0.34), y: hairlineY + 1, side };
    case 'side':
    default:
      return { x: Math.round(anatomy.centerX + side * (w + 1)), y: anatomy.earTopY + 2, side };
  }
}

/**
 * Draw everything an item is decorated with.
 *
 * Called after the covering itself, so ornaments sit on top of their own hat —
 * a plume rises out of the crown of a cap rather than being buried under it.
 * Where there is no covering at all the head is the surface, which is exactly
 * the hairpin-and-comb case that sent this whole exercise off.
 */
export function drawOrnaments(
  context: RenderContext,
  ornaments: OrnamentSpec[],
  hairlineY: number
): void {
  const { spec } = context;
  if (!ornaments.length) return;

  // The frame is the final authority on how much can be worn. Six pieces of
  // jewellery on one head is not opulence at this size, it is confetti.
  const budget = 3;
  let spent = 0;

  for (const ornament of ornaments) {
    if (spent >= budget) break;
    spent += 1;

    const seed = spec.seed ^ (ornament.kind.length * 7919) ^ (ornament.placement.length * 104729);
    const sides: Array<-1 | 1> = ornament.paired
      ? [-1, 1]
      : [unit(seed, 'ornament-side') > 0.5 ? 1 : -1];

    for (const side of sides) {
      const at = anchorFor(context, ornament.placement, side, hairlineY);
      const big = ornament.scale > 0.55;

      // Nothing may run off the top of the frame. A clipped plume does not read
      // as a tall plume, it reads as a mistake.
      const headroom = Math.max(4, at.y - 1);

      switch (ornament.kind) {
        case 'feather':
          drawFeather(context, at.x, at.y, Math.min(big ? 16 : 12, headroom), side, ornament.material, seed);
          break;
        case 'plume':
          drawPlume(context, at.x, at.y, Math.min(big ? 18 : 14, headroom), side, ornament.material,
            Math.max(2, Math.min(4, ornament.count)), seed);
          break;
        case 'pin':
          // Longer than life. A pin drawn at its true proportion is four
          // pixels of shaft and one of head, which at this size is a speck —
          // and a speck is not what someone chose to be painted wearing.
          drawPin(context, at.x, at.y, big ? 12 : 9, side, 'gilt', ornament.material, ornament.scale);
          break;
        case 'comb':
          drawComb(context, context.anatomy.centerX + side * 3, at.y - 1,
            big ? 8 : 6, ornament.material);
          break;
        case 'beadStrand':
          drawBeadStrand(context, at.x, at.y, big ? 5 : 3, ornament.material, seed);
          break;
        case 'gem':
          bead(context, at.x, at.y, 3, ornament.material);
          break;
        case 'flower':
          drawFlower(context, at.x, at.y, ornament.material, big ? 'gold' : 'amber');
          break;
        case 'medallion':
          drawMedallion(context, at.x, at.y, big ? 3 : 2, 'gold',
            ornament.material === 'gold' ? null : ornament.material);
          break;
        default:
          break;
      }
    }
  }
}
