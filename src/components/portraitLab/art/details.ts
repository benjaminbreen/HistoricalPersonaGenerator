/**
 * portraitLab/art/details.ts
 *
 * Markings, jewellery, glasses, and the visible signs of illness.
 *
 * The marking vocabulary here matches what `culturalMarkings.ts` already emits
 * — its locations (forehead, cheek, chin, nose, ear, neck, chest) and its
 * patterns (three_lines, eye_band, scarification, dots, geometric, and the
 * rest) — so cultural body art that the app has already researched and placed
 * renders as itself rather than as a generic smudge.
 *
 * Painted, pierced and modified faces are ordinary across human societies and
 * across the whole span this app covers, so they get drawn properly rather than
 * softened away. The rule that matters is that pigment applied to a face is
 * still on a *face*: it takes the light, so it is recoloured along the skin's
 * own shading rather than laid down as a flat patch. Bold and modelled, not
 * timid and not pasted on.
 */

import { buildRamp, hexToRgb, Ramp } from '../core/color';
import { METAL_BASE } from './palette';
import { MAT, Raster } from '../core/raster';
import { makeNoise1D, makeRng } from '../core/rng';
import { RenderContext } from '../render/context';
import { JewelrySpec, MarkingSpec } from '../spec/types';

const SIZE_SCALE: Record<string, number> = { small: 0.65, medium: 1, large: 1.45 };

interface Anchor {
  x: number;
  y: number;
  halfWidth: number;
}

function anchorFor(context: RenderContext, location: string): Anchor {
  const { anatomy } = context;
  const { centerX } = anatomy;
  switch (location) {
    case 'forehead':
      return { x: centerX, y: anatomy.browY - 7, halfWidth: anatomy.headHalfWidth * 0.62 };
    case 'cheek':
      return { x: centerX, y: anatomy.cheekY - 1, halfWidth: anatomy.headHalfWidth * 0.72 };
    case 'chin':
      return { x: centerX, y: anatomy.chinY - 5, halfWidth: 6 };
    case 'nose':
      return { x: centerX, y: anatomy.noseBaseY - 6, halfWidth: 4 };
    case 'neck':
      return { x: centerX, y: anatomy.neckTop + 9, halfWidth: anatomy.neckHalf };
    case 'ear':
      return { x: centerX + anatomy.earX, y: anatomy.earBottomY - 2, halfWidth: 2 };
    case 'chest':
      return { x: centerX, y: anatomy.collarY + 6, halfWidth: anatomy.shoulderHalf * 0.6 };
    default:
      return { x: centerX, y: anatomy.cheekY - 4, halfWidth: anatomy.headHalfWidth * 0.7 };
  }
}

/**
 * Lay pigment on skin.
 *
 * The pigment is built into its own ramp and sampled at whatever shade step the
 * skin underneath was already sitting at, so a stripe of ochre across a cheek
 * keeps the cheek's highlight and the cheek's shadow. Alpha-blending one flat
 * colour instead — the obvious implementation — flattens the face into a
 * sticker wherever the paint falls, which is what this used to do.
 */
function paint(
  raster: Raster,
  ramp: Ramp,
  x: number,
  y: number,
  alpha: number,
  material = MAT.PAINT
): void {
  if (raster.alphaAt(x, y) === 0) return;
  const under = raster.matAt(x, y);
  if (under !== MAT.SKIN && under !== MAT.PAINT) return;
  const shade = raster.shadeAt(x, y);
  const index = shade === 255 ? 3 : shade;
  raster.blend(x, y, ramp.steps[index], alpha, material, index);
}

export function drawMarkings(context: RenderContext): void {
  const { raster, spec, anatomy, book } = context;
  const noise = makeNoise1D(spec.seed ^ 0x71a3);

  spec.markings.forEach((marking: MarkingSpec, index: number) => {
    if (marking.type === 'freckles') return; // handled with the complexion
    const anchor = anchorFor(context, marking.location);
    const scale = SIZE_SCALE[marking.size] ?? 1;
    const pigment = buildRamp(marking.color || '#8b5a3c', { contrast: 0.9, shift: 0.3, saturation: 1.05 });
    const pattern = marking.pattern || 'solid';
    const rng = makeRng(spec.seed ^ (0x300 + index * 37));

    // Pigment sits on the skin at close to full strength — it is meant to be
    // seen. The form is preserved by the ramp, not by thinning the paint.
    const strokeAlpha =
      marking.type === 'paint' ? 0.94 :
      marking.type === 'henna' ? 0.66 :
      marking.type === 'tattoo' ? 0.82 : 0.7;

    switch (marking.type) {
      case 'beauty_mark':
      case 'mole': {
        const side = index % 2 === 0 ? -1 : 1;
        const x = Math.round(anchor.x + side * anchor.halfWidth * 0.55);
        raster.shift(x, anchor.y, 3, book);
        break;
      }

      case 'scar': {
        const side = index % 2 === 0 ? -1 : 1;
        const length = Math.round(5 * scale) + 3;
        const x0 = Math.round(anchor.x + side * anchor.halfWidth * 0.5);
        for (let i = 0; i < length; i += 1) {
          const x = x0 + Math.round(i * 0.35 * side);
          const y = anchor.y - Math.floor(length / 2) + i;
          // A scar is a pale ridge with a dark edge, not just a dark line.
          raster.shift(x, y, 2, book);
          raster.shift(x + 1, y, -1, book);
        }
        break;
      }

      case 'birthmark': {
        const rx = 4 * scale;
        const ry = 3 * scale;
        const side = index % 2 === 0 ? -1 : 1;
        const cx = anchor.x + side * anchor.halfWidth * 0.6;
        for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy += 1) {
          for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx += 1) {
            const wobble = noise(dx * 0.8 + dy * 1.3 + index * 5) * 0.3;
            if ((dx / rx) ** 2 + (dy / ry) ** 2 > 1 + wobble) continue;
            paint(raster, pigment, Math.round(cx + dx), anchor.y + dy, 0.55);
          }
        }
        break;
      }

      case 'piercing': {
        drawPiercing(context, marking, anchor, scale);
        break;
      }

      // Ochre and butterfat worked through the hair — Himba otjize and its
      // relatives. It belongs in the hair, not as a stripe on the face.
      case 'paint' as const:
        if (pattern === 'hair_ochre') {
          for (let y = 0; y < anatomy.size; y += 1) {
            for (let x = 0; x < anatomy.size; x += 1) {
              if (raster.matAt(x, y) !== MAT.HAIR) continue;
              const shade = raster.shadeAt(x, y);
              const step = shade === 255 ? 3 : shade;
              raster.blend(x, y, pigment.steps[step], 0.72, MAT.HAIR, step);
            }
          }
          break;
        }
        drawPattern(context, pattern, anchor, pigment, scale, strokeAlpha, rng);
        break;

      case 'structural': {
        drawStructural(context, marking, scale);
        break;
      }

      default: {
        // Paint, tattoo, henna and scarification share a pattern vocabulary.
        drawPattern(context, pattern, anchor, pigment, scale, strokeAlpha, rng);
        break;
      }
    }
  });
}

function drawPattern(
  context: RenderContext,
  pattern: string,
  anchor: Anchor,
  pigment: Ramp,
  scale: number,
  alpha: number,
  rng: () => number
): void {
  const { raster, anatomy, book } = context;
  const half = anchor.halfWidth;

  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i += 1) {
      const t = steps === 0 ? 0 : i / steps;
      paint(raster, pigment, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), alpha);
    }
  };

  switch (pattern) {
    case 'three_lines': {
      for (let i = -1; i <= 1; i += 1) {
        const x = anchor.x + i * Math.round(4 * scale);
        line(x, anchor.y - Math.round(4 * scale), x, anchor.y + Math.round(4 * scale));
      }
      break;
    }
    case 'vertical_lines':
    case 'lines':
    case 'scarification':
    case 'ritual_scar': {
      const count = Math.max(2, Math.round(3 * scale));
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < count; i += 1) {
          const x = Math.round(anchor.x + side * (half * 0.45 + i * 3));
          const top = anchor.y - Math.round(3 * scale);
          for (let y = top; y <= top + Math.round(7 * scale); y += 1) {
            if (pattern === 'scarification' || pattern === 'ritual_scar') {
              // Raised keloid scarring: a lit ridge beside a dark trough.
              raster.shift(x, y, 2, book);
              raster.shift(x + side, y, -1, book);
            } else {
              paint(raster, pigment, x, y, alpha);
            }
          }
        }
      }
      break;
    }
    case 'horizontal_lines':
    case 'stripes': {
      const count = Math.max(2, Math.round(3 * scale));
      for (let i = 0; i < count; i += 1) {
        const y = anchor.y - Math.round((count - 1) * 1.5) + i * 3;
        line(anchor.x - half * 0.85, y, anchor.x + half * 0.85, y);
      }
      break;
    }
    case 'eye_liner': {
      // Kohl. It follows the lash line of each eye and stops there — it is not
      // a stripe drawn across the face. Without this case it fell to the
      // default below, which paints one horizontal line straight over the
      // bridge of the nose.
      //
      // `paint` refuses any pixel that is not skin, so the eye itself is never
      // covered: the line is laid on the lid above the opening and along the
      // rim below it, and the parts that cross the eye simply do not take.
      for (const side of [-1, 1] as const) {
        const cx = anatomy.centerX + side * anatomy.eyeDX;
        const rx = Math.max(4, Math.round(5 * scale));
        for (let dx = -rx; dx <= rx; dx += 1) {
          const outward = side < 0 ? -dx : dx;
          const taper = (outward + rx) / (2 * rx);
          // Upper lid, heavier toward the outer corner as it is actually drawn.
          paint(raster, pigment, cx + dx, anatomy.eyeY - 5, alpha * (0.5 + 0.5 * taper));
          paint(raster, pigment, cx + dx, anatomy.eyeY - 4, alpha * (0.3 + 0.6 * taper));
          // Lower rim, lighter.
          paint(raster, pigment, cx + dx, anatomy.eyeY + 2, alpha * (0.25 + 0.35 * taper));
        }
        // The outer flick, which is what makes it read as kohl at 96 pixels.
        const tipX = cx + side * (rx + 1);
        paint(raster, pigment, tipX, anatomy.eyeY - 5, alpha);
        paint(raster, pigment, tipX, anatomy.eyeY - 6, alpha * 0.75);
        if (scale >= 1.1) paint(raster, pigment, tipX + side, anatomy.eyeY - 6, alpha * 0.6);
      }
      break;
    }
    case 'eye_band': {
      // Kohl or ochre drawn across the eyes. It sits *on* the lids, so it has
      // to stay thin — a solid bar just deletes the face.
      const rows = scale >= 1.4 ? 3 : scale >= 1 ? 2 : 1;
      const top = anatomy.eyeY - Math.floor(rows / 2) - 1;
      for (let dy = 0; dy < rows; dy += 1) {
        line(
          anatomy.centerX - anatomy.headHalfWidth * 0.86,
          top + dy,
          anatomy.centerX + anatomy.headHalfWidth * 0.86,
          top + dy
        );
      }
      break;
    }
    case 'dots':
    case 'dot':
    case 'spots': {
      const count = pattern === 'dot' ? 1 : Math.round(7 * scale);
      for (let i = 0; i < count; i += 1) {
        const angle = (i / Math.max(1, count)) * Math.PI * 2;
        const r = count === 1 ? 0 : half * 0.6 * (0.4 + rng() * 0.6);
        paint(raster, pigment, Math.round(anchor.x + Math.cos(angle) * r), Math.round(anchor.y + Math.sin(angle) * r * 0.6), alpha);
      }
      break;
    }
    case 'cross': {
      line(anchor.x - 3 * scale, anchor.y, anchor.x + 3 * scale, anchor.y);
      line(anchor.x, anchor.y - 3 * scale, anchor.x, anchor.y + 3 * scale);
      break;
    }
    case 'vertical_v': {
      line(anchor.x - 4 * scale, anchor.y - 4 * scale, anchor.x, anchor.y + 3 * scale);
      line(anchor.x + 4 * scale, anchor.y - 4 * scale, anchor.x, anchor.y + 3 * scale);
      break;
    }
    case 'zigzag': {
      let x = anchor.x - half * 0.8;
      let up = true;
      while (x < anchor.x + half * 0.8) {
        line(x, anchor.y + (up ? 2 : -2), x + 3, anchor.y + (up ? -2 : 2));
        x += 3;
        up = !up;
      }
      break;
    }
    case 'geometric':
    case 'berber': {
      line(anchor.x - 3 * scale, anchor.y - 3 * scale, anchor.x + 3 * scale, anchor.y - 3 * scale);
      line(anchor.x, anchor.y - 3 * scale, anchor.x, anchor.y + 4 * scale);
      line(anchor.x - 2 * scale, anchor.y + 4 * scale, anchor.x + 2 * scale, anchor.y + 4 * scale);
      break;
    }
    case 'swirls':
    case 'celtic':
    case 'maori_spiral':
    case 'maori_full': {
      // A spiral, stepped so it stays legible at a few pixels across.
      const turns = pattern === 'maori_full' ? 2.4 : 1.6;
      const steps = Math.round(26 * scale);
      for (const side of [-1, 1] as const) {
        const cx = anchor.x + side * half * 0.5;
        for (let i = 0; i < steps; i += 1) {
          const t = i / steps;
          const angle = t * Math.PI * 2 * turns;
          const r = t * 5 * scale;
          paint(raster, pigment, Math.round(cx + Math.cos(angle) * r * side), Math.round(anchor.y + Math.sin(angle) * r * 0.75), alpha);
        }
      }
      break;
    }
    case 'solid': {
      // Solid pigment is applied to a *region* — both cheeks, or the forehead —
      // not as a band straight across the middle of the face.
      const rows = Math.max(2, Math.round(2.5 * scale));
      for (const side of [-1, 1] as const) {
        const cx = anchor.x + side * half * 0.55;
        const rx = Math.max(2, half * 0.34);
        for (let dy = -rows; dy <= rows; dy += 1) {
          const spread = rx * Math.sqrt(Math.max(0, 1 - (dy / (rows + 0.5)) ** 2));
          line(cx - spread, anchor.y + dy, cx + spread, anchor.y + dy);
        }
      }
      break;
    }
    default: {
      // Twenty-one of the thirty-nine patterns the marking tables declare have
      // no case above. They used to land here, and a bar drawn clean across the
      // middle of the face is the most destructive possible way to render "we
      // do not know what this is". A short mark on one cheek is wrong quietly.
      const w = Math.max(2, Math.round(half * 0.28));
      line(anchor.x + half * 0.32, anchor.y, anchor.x + half * 0.32 + w, anchor.y);
      break;
    }
  }
}

/**
 * A stud, ring or bar through the nose, lip, ear or brow. This is the most
 * common marking the app generates by a wide margin, and it needs to be a
 * two-pixel piece of metal, not a stroke drawn across the cheek.
 */
function drawPiercing(
  context: RenderContext,
  marking: MarkingSpec,
  anchor: Anchor,
  scale: number
): void {
  const { raster, anatomy, ramps } = context;
  const { centerX } = anatomy;

  // The marking's own colour is the metal — a piercing described as gold should
  // be gold. The previous line branched on the colour and then returned the
  // same ramp either way, so every piercing came out the persona's one metal.
  const metal = marking.color
    ? buildRamp(marking.color, { contrast: 1.85, shift: 0.18, saturation: 1.05 })
    : ramps.metal;

  // Studs get the same treatment as jewellery: a highlight, and a dark pixel
  // underneath so the thing sits in the skin rather than on top of it.
  const place = (x: number, y: number) => {
    if (raster.alphaAt(x, y) === 0) return;
    if (scale > 1.2) bead(context, x, y, 2, metal, MAT.METAL);
    else {
      jewel(context, x, y, 1, metal, MAT.METAL, false);
      jewel(context, x, y + 1, 4.5, metal, MAT.METAL);
    }
  };

  switch (marking.location) {
    case 'nose':
      // Through the nostril wing, off to one side. A larger one is a ring that
      // hangs below the nostril, which is the commoner form at this size.
      place(centerX - 3, anatomy.noseBaseY);
      if (scale > 1.2) {
        jewel(context, centerX - 4, anatomy.noseBaseY + 1, 2, metal, MAT.METAL, false);
        jewel(context, centerX - 3, anatomy.noseBaseY + 2, 4, metal, MAT.METAL);
      }
      break;
    case 'ear':
      for (const side of [-1, 1] as const) {
        place(centerX + side * (anatomy.earX + 1), anatomy.earBottomY - 1);
      }
      break;
    case 'chin':
      place(centerX, anatomy.mouthY + 5);
      break;
    case 'forehead':
      place(centerX, anatomy.browY - 4);
      break;
    default:
      place(centerX - 4, anatomy.mouthY + 2);
      break;
  }
  void anchor;
}

/**
 * Lip plates, ear plugs and neck coils.
 *
 * Cranial elongation and dental modification are deliberately not drawn:
 * the first needs a different skull, and the second needs an open mouth. A
 * marking rendered wrongly is worse than one left out, and both are rare.
 */
function drawStructural(context: RenderContext, marking: MarkingSpec, scale: number): void {
  const { raster, anatomy, ramps } = context;
  const { centerX } = anatomy;
  const pattern = marking.pattern || '';

  if (/plate|plug|disc/.test(pattern)) {
    const radius = Math.max(2, Math.round((pattern === 'plate' ? 4 : 2.5) * scale));
    const lip = marking.location === 'ear';
    const cx = lip ? centerX + anatomy.earX - 1 : centerX;
    const cy = lip ? anatomy.earBottomY : anatomy.mouthY + 2;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const rim = dx * dx + dy * dy > (radius - 1) * (radius - 1);
        const index = rim ? 5 : dx + dy < 0 ? 2 : 3;
        raster.set(cx + dx, cy + dy, ramps.leather.steps[index], MAT.LEATHER, index);
      }
    }
    return;
  }

  if (/coil|ring/.test(pattern)) {
    const rings = Math.max(2, Math.round(3 * scale));
    for (let r = 0; r < rings; r += 1) {
      const y = anatomy.neckTop + 3 + r * 2;
      for (let dx = -anatomy.neckHalf; dx <= anatomy.neckHalf; dx += 1) {
        const x = centerX + dx;
        if (raster.matAt(x, y) !== MAT.SKIN) continue;
        const index = Math.abs(dx) > anatomy.neckHalf - 2 ? 5 : dx < 0 ? 1 : 3;
        raster.set(x, y, ramps.metal.steps[index], MAT.METAL, index);
      }
    }
  }
}

/**
 * Metal, per material rather than per persona.
 *
 * The ramp book carries a single `metal` built from whichever jewel happened to
 * be first in the list, so a persona wearing a gold chain and silver earrings
 * got gold for both. Cached because a portrait may carry several pieces of the
 * same material and the ramp maths is not free.
 */
const metalRampCache = new Map<string, Ramp>();
function metalRampFor(material: string): Ramp {
  const cached = metalRampCache.get(material);
  if (cached) return cached;
  // Pearl and bone are not specular — they are soft and low-contrast, and
  // giving them a hard metal highlight is what makes bone beads read as chrome.
  const soft = material === 'pearl' || material === 'bone' || material === 'wood';
  const ramp = buildRamp(METAL_BASE[material] || METAL_BASE.bronze, {
    contrast: soft ? 1.2 : 1.85,
    shift: soft ? 0.3 : 0.18,
    saturation: 1.05,
  });
  metalRampCache.set(material, ramp);
  return ramp;
}

/**
 * The single most important pixel in any piece of jewellery is not the
 * highlight — it is the dark one underneath. Metal laid straight onto skin
 * reads as a decal; the same metal with one shifted pixel below it reads as an
 * object resting on a surface. Everything here goes through this.
 */
function jewel(
  context: RenderContext,
  x: number, y: number, index: number,
  ramp: Ramp, mat: number,
  shade = true
): void {
  const { raster, book, anatomy } = context;
  if (x < 0 || y < 0 || x >= anatomy.size || y >= anatomy.size) return;
  raster.set(x, y, ramp.steps[Math.max(0, Math.min(6, Math.round(index)))], mat, index);
  if (!shade) return;
  const below = raster.matAt(x, y + 1);
  if (below !== mat && below !== MAT.EMPTY && below !== MAT.METAL && below !== MAT.GEM) {
    raster.shift(x, y + 1, 2, book);
  }
}

/**
 * A bead, stud or boss: the smallest thing that still reads as round rather
 * than as a stray pixel. Highlight up and left, core mid, shade down and right.
 */
function bead(
  context: RenderContext,
  cx: number, cy: number, size: number,
  ramp: Ramp, mat: number
): void {
  if (size <= 1) {
    jewel(context, cx, cy, 2, ramp, mat);
    return;
  }
  if (size === 2) {
    jewel(context, cx, cy, 0.5, ramp, mat, false);
    jewel(context, cx + 1, cy, 3, ramp, mat, false);
    jewel(context, cx, cy + 1, 3.5, ramp, mat);
    jewel(context, cx + 1, cy + 1, 5, ramp, mat);
    return;
  }
  // 3px: a diamond, which reads rounder than a square at this scale.
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (Math.abs(dx) + Math.abs(dy) > 1 && size < 4) continue;
      const index = 3 + dx * 1.3 + dy * 1.3;
      jewel(context, cx + dx, cy + dy, index, ramp, mat, dy === 1);
    }
  }
  jewel(context, cx - 1, cy - 1, 0, ramp, mat, false); // specular
}

export function drawJewelry(context: RenderContext): void {
  const { raster, spec, anatomy, ramps } = context;
  const { centerX } = anatomy;

  spec.jewelry.forEach((item: JewelrySpec) => {
    const ornate = item.style === 'ornate' || item.style === 'chunky';
    const chunky = item.style === 'chunky';
    const delicate = item.style === 'delicate';
    const isGem = item.material === 'gems';
    const ramp = isGem ? ramps.gem : metalRampFor(item.material);
    const mat = isGem ? MAT.GEM : MAT.METAL;

    switch (item.type) {
      case 'earrings': {
        // Hung just outside the lobe rather than on it. Silhouetted against the
        // background it reads at a glance; sitting on the ear it disappears
        // into the shading of the ear itself.
        for (const side of [-1, 1] as const) {
          const x = centerX + side * (anatomy.earX + 1);
          const y = anatomy.earBottomY;
          jewel(context, x, y, 2, ramp, mat);

          if (chunky || ornate) {
            // A hoop: two verticals and a rounded bottom.
            const drop = chunky ? 4 : 3;
            for (let i = 1; i <= drop; i += 1) {
              jewel(context, x, y + i, i < drop ? 1.5 : 3, ramp, mat, false);
              jewel(context, x + side * 2, y + i, i < drop ? 4 : 5, ramp, mat, false);
            }
            jewel(context, x + side, y + drop + 1, 4.5, ramp, mat);
            if (ornate) bead(context, x + (side < 0 ? -1 : 0), y + drop + 2, 2, ramps.gem, MAT.GEM);
          } else if (delicate) {
            // Still a drop, just a fine one. A bare stud is a single pixel and
            // vanishes completely at portrait size.
            jewel(context, x, y + 1, 1.5, ramp, mat, false);
            jewel(context, x, y + 2, 4, ramp, mat);
          } else {
            // A plain drop.
            for (let i = 1; i <= 2; i += 1) jewel(context, x, y + i, 2 + i, ramp, mat, i === 2);
          }
        }
        break;
      }

      case 'necklace':
      case 'chain': {
        const isChain = item.type === 'chain';
        const radius = anatomy.neckHalf + (isChain ? 5 : 3);
        const beadSize = chunky ? 2 : 1;
        // Discrete links rather than a swept 1px line. A continuous curve reads
        // as a drawn-on collar; spaced links read as a strung necklace.
        const step = delicate ? 0.11 : isChain ? 0.15 : 0.2;
        let lowest = { x: centerX, y: 0 };
        for (let a = -1.2; a <= 1.2; a += step) {
          const x = Math.round(centerX + Math.sin(a) * radius);
          const y = Math.round(anatomy.collarY - 3 + Math.cos(a) * radius * 0.42);
          if (raster.alphaAt(x, y) === 0) continue;
          if (y > lowest.y) lowest = { x, y };
          // Lit from the upper left, so the left of the curve catches and the
          // right falls away.
          const index = 1.4 + Math.sin(a) * 1.9;
          if (beadSize > 1) bead(context, x, y, 2, ramp, mat);
          else jewel(context, x, y, index, ramp, mat);
        }
        // A pendant at the low point. This is the part that actually reads at
        // portrait size, and the old version had none at all.
        if (lowest.y > 0 && (ornate || !delicate)) {
          const py = lowest.y + (chunky ? 2 : 1);
          jewel(context, lowest.x, lowest.y + 1, 3, ramp, mat, false);
          if (ornate) {
            bead(context, lowest.x, py + 1, 3, ramps.gem, MAT.GEM);
          } else {
            bead(context, lowest.x, py, 2, ramp, mat);
          }
        }
        break;
      }

      case 'circlet': {
        if (spec.headwear) break; // a hat wins
        const half = anatomy.headHalfWidth * 0.82;
        // Up on the forehead, not down on the brow ridge. At browY − 5 the band
        // landed across the eyebrows and read as a very odd monobrow.
        const baseY = Math.round(anatomy.browY - anatomy.headHeight * 0.17);
        // Two pixels thick and dipping at the centre, so it wraps the brow
        // instead of lying across it like a drawn line.
        for (let dx = -half; dx <= half; dx += 1) {
          const px = Math.round(centerX + dx);
          const t = dx / half;
          const y = Math.round(baseY + (1 - t * t) * 1.6);
          if (raster.matAt(px, y) === MAT.EMPTY) continue;
          jewel(context, px, y, 1 + t * 1.6, ramp, mat, false);
          jewel(context, px, y + 1, 3.4 + t * 1.4, ramp, mat);
        }
        if (ornate) {
          bead(context, centerX, baseY, 3, ramps.gem, MAT.GEM);
        } else if (chunky) {
          bead(context, centerX - 1, baseY + 1, 2, ramp, mat);
        }
        break;
      }

      case 'brooch': {
        // Pinned on the garment, off to one side. Made a proper disc — the old
        // 2×2 was smaller than a freckle.
        const cx = centerX - Math.round(anatomy.shoulderHalf * 0.42);
        const cy = anatomy.collarY + 4;
        const r = chunky ? 3 : 2;
        for (let dy = -r; dy <= r; dy += 1) {
          for (let dx = -r; dx <= r; dx += 1) {
            const d = Math.hypot(dx, dy);
            if (d > r + 0.3) continue;
            const rim = d > r - 0.85;
            const index = rim ? 4.6 + dy * 0.5 : 2.4 + dx * 0.5 + dy * 0.7;
            jewel(context, cx + dx, cy + dy, index, ramp, mat, dy === r);
          }
        }
        jewel(context, cx - r + 1, cy - r + 1, 0, ramp, mat, false); // specular
        if (ornate || isGem) bead(context, cx, cy, 2, ramps.gem, MAT.GEM);
        break;
      }

      default:
        break;
    }
  });
}

export function drawGlasses(context: RenderContext): void {
  const { raster, spec, anatomy, ramps } = context;
  if (!spec.glasses) return;
  const { centerX } = anatomy;
  const style = spec.glasses.style;
  const rx = 7;
  const ry = style === 'oval' ? 4 : 5;

  const frame = (x: number, y: number, index: number) => {
    raster.set(x, y, ramps.metal.steps[index], MAT.METAL, index);
  };

  for (const side of [-1, 1] as const) {
    const cx = centerX + side * anatomy.eyeDX;
    if (style === 'square' || style === 'half_rim') {
      for (let dx = -rx; dx <= rx; dx += 1) {
        frame(cx + dx, anatomy.eyeY - ry, 2);
        if (style === 'square') frame(cx + dx, anatomy.eyeY + ry, 5);
      }
      for (let dy = -ry; dy <= ry; dy += 1) {
        frame(cx - rx, anatomy.eyeY + dy, 3);
        frame(cx + rx, anatomy.eyeY + dy, 4);
      }
    } else {
      for (let a = 0; a < Math.PI * 2; a += 0.14) {
        const x = Math.round(cx + Math.cos(a) * rx);
        const y = Math.round(anatomy.eyeY + Math.sin(a) * ry);
        frame(x, y, Math.sin(a) < 0 ? 2 : 4);
      }
    }
    // Temple arm running back toward the ear.
    for (let i = 0; i < 4; i += 1) {
      frame(cx + side * (rx + i), anatomy.eyeY - ry + i, 4);
    }
  }
  // Bridge.
  for (let x = centerX - anatomy.eyeDX + rx; x <= centerX + anatomy.eyeDX - rx; x += 1) {
    frame(x, anatomy.eyeY - 1, 3);
  }

  // A single specular streak across each lens sells them as glass.
  for (const side of [-1, 1] as const) {
    const cx = centerX + side * anatomy.eyeDX;
    for (let i = 0; i < 3; i += 1) {
      raster.blend(cx - 4 + i, anatomy.eyeY - 3 + i, { r: 226, g: 236, b: 244 }, 0.5, MAT.GLASS, 1);
    }
  }
}

/**
 * Visible illness. Deliberately restrained: these are cues on a small portrait,
 * not a clinical illustration, and the app already states the diagnosis in the
 * health panel beside the face.
 */
export function drawAilments(context: RenderContext): void {
  const { raster, spec, anatomy, book } = context;
  const { severity, diseases } = spec.condition;
  if (severity === 0) return;

  const { centerX } = anatomy;
  const rng = makeRng(spec.seed ^ 0x5eed);
  const has = (name: string) => diseases.some(d => d.includes(name));

  const onFace = (x: number, y: number) => raster.matAt(x, y) === MAT.SKIN;

  if (has('smallpox') || has('measles')) {
    const pocked = has('smallpox');
    const count = severity >= 2 ? (pocked ? 26 : 34) : 14;
    for (let i = 0; i < count; i += 1) {
      const x = Math.round(centerX + (rng() * 2 - 1) * anatomy.headHalfWidth * 0.85);
      const y = Math.round(anatomy.headTop + 10 + rng() * (anatomy.headHeight - 16));
      if (!onFace(x, y)) continue;
      if (pocked) {
        // A pock is a pit: dark centre, lit rim.
        raster.shift(x, y, 2, book);
        raster.shift(x - 1, y - 1, -1, book);
      } else {
        raster.blend(x, y, { r: 186, g: 74, b: 66 }, 0.45, MAT.SKIN, raster.shadeAt(x, y));
      }
    }
  }

  if (has('leprosy')) {
    for (let i = 0; i < 10 * severity; i += 1) {
      const x = Math.round(centerX + (rng() * 2 - 1) * anatomy.headHalfWidth * 0.8);
      const y = Math.round(anatomy.browY + rng() * (anatomy.chinY - anatomy.browY));
      for (let dx = 0; dx < 2; dx += 1) {
        if (onFace(x + dx, y)) raster.blend(x + dx, y, { r: 208, g: 198, b: 186 }, 0.4, MAT.SKIN, raster.shadeAt(x + dx, y));
      }
    }
  }

  if (has('syphilis')) {
    for (let i = 0; i < 5 * severity; i += 1) {
      const x = Math.round(centerX + (rng() * 2 - 1) * anatomy.headHalfWidth * 0.7);
      const y = Math.round(anatomy.browY - 6 + rng() * 18);
      for (let dy = 0; dy < 2; dy += 1) {
        for (let dx = 0; dx < 2; dx += 1) {
          if (onFace(x + dx, y + dy)) raster.blend(x + dx, y + dy, { r: 158, g: 60, b: 58 }, 0.42, MAT.SKIN, raster.shadeAt(x + dx, y + dy));
        }
      }
    }
  }

  if (has('plague') && severity >= 2) {
    // Darkening at the jaw and neck where the buboes sit.
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < 6; i += 1) {
        const x = Math.round(centerX + side * (anatomy.neckHalf + 1 + i * 0.4));
        const y = anatomy.neckTop + 6 + i;
        raster.shift(x, y, 2, book);
      }
    }
  }

  if ((has('cholera') || has('tuberculosis')) && severity >= 2) {
    // Sunken eyes and hollow temples.
    for (const side of [-1, 1] as const) {
      const x0 = centerX + side * anatomy.eyeDX;
      for (let dx = -5; dx <= 5; dx += 1) {
        raster.shift(x0 + dx, anatomy.eyeY + 5, 1, book);
        raster.shift(x0 + dx, anatomy.eyeY + 6, 1, book);
      }
    }
  }

  if (has('jaundice') || has('hepatitis') || has('yellow fever')) {
    for (let y = anatomy.headTop; y < anatomy.chinY; y += 1) {
      for (let x = 0; x < anatomy.size; x += 1) {
        const mat = raster.matAt(x, y);
        if (mat !== MAT.SKIN && mat !== MAT.SCLERA) continue;
        raster.blend(x, y, { r: 214, g: 196, b: 92 }, mat === MAT.SCLERA ? 0.38 : 0.16, mat, raster.shadeAt(x, y));
      }
    }
  }

}
