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

import { buildRamp, hexToRgb, Ramp, RGB } from '../core/color';
import { isSpecular, ornamentGlintPeak, ornamentRamp } from './ornaments';
import { MAT, Raster } from '../core/raster';
import { makeNoise1D, makeRng } from '../core/rng';
import { RenderContext } from '../render/context';
import { JewelrySpec, MarkingSpec, OrnamentMaterial } from '../spec/types';

/**
 * Which substances are drawn as the body of a piece rather than as a stone in
 * it. The distinction is not decorative: `MAT.METAL` and `MAT.GEM` shade and
 * outline differently, and a jade bead outlined as metal reads as painted tin.
 */
const METAL_MATERIALS = new Set<OrnamentMaterial>([
  'gold', 'gilt', 'silver', 'bronze', 'copper',
]);

const SIZE_SCALE: Record<string, number> = { small: 0.65, medium: 1, large: 1.45 };

interface Anchor {
  x: number;
  y: number;
  halfWidth: number;
}

function anchorFor(context: RenderContext, location: string, hairlineY: number): Anchor {
  const { anatomy } = context;
  const { centerX } = anatomy;
  switch (location) {
    case 'forehead':
      // Below the hairline, wherever that turned out to be. A bindi, a mehndi
      // rosette or a caste mark drawn at a fixed height above the brow lands
      // under the fringe of anyone with one and is never seen again — the paint
      // goes down before the hair does.
      return {
        x: centerX,
        y: Math.max(anatomy.browY - 7, Math.round(hairlineY) + 2),
        halfWidth: anatomy.headHalfWidth * 0.62,
      };
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

export function drawMarkings(context: RenderContext, hairlineY: number): void {
  const { raster, spec, anatomy, book } = context;
  const noise = makeNoise1D(spec.seed ^ 0x71a3);

  spec.markings.forEach((marking: MarkingSpec, index: number) => {
    if (marking.type === 'freckles') return; // handled with the complexion
    const anchor = anchorFor(context, marking.location, hairlineY);
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
        // Vitiligo is a birthmark in the type system and nothing like one on a
        // face. A birthmark is one mark; this is *loss of pigment*, in several
        // patches, and the two things it needs are that there be more than one
        // and that they be paler than whatever complexion they land on.
        //
        // So it shifts along the skin's own ramp rather than painting a colour.
        // A fixed pale hex is right for exactly one skin tone and chalky on
        // every other, and this face has already been modelled — lightening
        // what is there keeps the cheekbone under the patch.
        if (pattern === 'vitiligo') {
          const patches = 4;
          for (let p = 0; p < patches; p += 1) {
            // Spread across the face rather than clustered on one cheek, and
            // never over the eyes: a pale patch on a lash line reads as the
            // eye having been erased.
            const side = p % 2 === 0 ? -1 : 1;
            const px = anchor.x + side * anchor.halfWidth * (0.28 + rng() * 0.5);
            const py = anchor.y + Math.round((rng() * 2 - 1) * 9);
            const prx = (2.6 + rng() * 2.4) * scale;
            const pry = (2.2 + rng() * 2) * scale;
            for (let dy = -Math.ceil(pry); dy <= Math.ceil(pry); dy += 1) {
              for (let dx = -Math.ceil(prx); dx <= Math.ceil(prx); dx += 1) {
                // The ragged edge is the diagnostic part. A clean ellipse of
                // pale skin is a highlight; a torn one is depigmentation.
                const wobble = noise(dx * 1.1 + dy * 1.7 + p * 11) * 0.42;
                if ((dx / prx) ** 2 + (dy / pry) ** 2 > 1 + wobble) continue;
                const x = Math.round(px + dx);
                const y = py + dy;
                if (raster.matAt(x, y) !== MAT.SKIN) continue;
                raster.shift(x, y, -2, book);
              }
            }
          }
          break;
        }
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
    case 'horizontal_stripes':
    case 'geometric_bands':
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
        const cx = anatomy.faceX + side * anatomy.eyeDX;
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
    case 'flower':
    case 'floral': {
      // A rosette — the mehndi motif and the flower-shaped forehead mark are
      // the same drawing at this size: a centre with petals set round it.
      const r = Math.max(2, 2.4 * scale);
      paint(raster, pigment, Math.round(anchor.x), anchor.y, alpha);
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2;
        paint(
          raster, pigment,
          Math.round(anchor.x + Math.cos(angle) * r),
          Math.round(anchor.y + Math.sin(angle) * r * 0.8),
          alpha
        );
      }
      break;
    }
    case 'handprint': {
      // A hand laid on the face in paint. It has to be drawn at the size a
      // hand actually is — palm across the cheek, fingers reaching up past the
      // brow — because a hand scaled down to fit politely inside one cheek is
      // not a hand, it is a red smear under an eye, which is what the first
      // version of this looked like. Offset to one side, never centred:
      // symmetry would turn a gesture into a pattern.
      const side = rng() > 0.5 ? 1 : -1;
      const cx = Math.round(anchor.x + side * half * 0.3);
      const w = Math.max(5, Math.round(half * 0.55));
      const palmTop = anchor.y - 3;
      const palmDepth = Math.max(4, Math.round(half * 0.42));
      for (let dy = 0; dy <= palmDepth; dy += 1) {
        // The heel of the hand narrows toward the jaw.
        const taper = Math.round((dy / palmDepth) ** 2 * 3);
        line(cx - w + taper, palmTop + dy, cx + w - taper, palmTop + dy);
      }
      for (let f = 0; f < 4; f += 1) {
        const fx = Math.round(cx - w + 1 + f * ((2 * w - 2) / 3));
        // The outer fingers are shorter, which is most of what makes a row of
        // strokes read as a hand rather than as a comb.
        const reach = Math.round((f === 0 || f === 3 ? 7 : 10) * scale);
        for (let dy = 1; dy <= reach; dy += 1) {
          paint(raster, pigment, fx, palmTop - dy, alpha);
          paint(raster, pigment, fx + 1, palmTop - dy, alpha);
        }
      }
      // Thumb, swung out and down away from the fingers.
      for (let i = 0; i < Math.round(5 * scale); i += 1) {
        paint(raster, pigment, cx - side * (w + i - 1), palmTop + 1 + i, alpha);
        paint(raster, pigment, cx - side * (w + i - 1), palmTop + 2 + i, alpha);
      }
      break;
    }
    // The marking tables spell several of these out more fully than the
    // renderer's vocabulary does. Two names for one drawing is how a Berber
    // chin tattoo and a row of war paint ended up as the fallback stroke.
    case 'berber_geometric':
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
 * Lip plates, cheek plugs, stretched lobes and neck coils.
 *
 * Cranial elongation and dental modification arrive here too, and are handled
 * nowhere in this file: neither can be laid onto a finished face. The skull is
 * reshaped in `anatomy.ts` and the teeth are drawn with the mouth, both off
 * fields the spec lifts out of the marking list. They are silently ignored here
 * rather than falling to a stroke.
 */
function drawStructural(context: RenderContext, marking: MarkingSpec, scale: number): void {
  const { raster, anatomy, ramps } = context;
  const { centerX } = anatomy;
  const pattern = marking.pattern || '';

  // A disc of clay, wood or bone, and — the part that matters — the flesh it
  // has been stretched through. Drawn as a disc alone it reads as a coin held
  // against a face; what makes it read as a modification is the ring of the
  // person's own lip or lobe carried around it.
  const disc = (cx: number, cy: number, radius: number, collar: Ramp | null) => {
    for (let dy = -radius - 1; dy <= radius + 1; dy += 1) {
      for (let dx = -radius - 1; dx <= radius + 1; dx += 1) {
        const d2 = dx * dx + dy * dy;
        if (d2 > (radius + 1) * (radius + 1)) continue;
        if (d2 > radius * radius) {
          // The stretched flesh: thinner at the top where it is under most
          // tension, and taking the light from above like any other surface.
          if (!collar || raster.alphaAt(cx + dx, cy + dy) === 0) continue;
          raster.set(cx + dx, cy + dy, collar.steps[dy < 0 ? 2 : 5], MAT.SKIN, dy < 0 ? 2 : 5);
          continue;
        }
        const rim = d2 > (radius - 1) * (radius - 1);
        const index = rim ? 5 : dx + dy < 0 ? 2 : 3;
        raster.set(cx + dx, cy + dy, ramps.leather.steps[index], MAT.LEATHER, index);
      }
    }
  };

  if (/cheek/.test(pattern) || (marking.location === 'cheek' && /plug|disc/.test(pattern))) {
    // Through the cheek, one each side, sitting level with the mouth.
    const radius = Math.max(3, Math.round(3 * scale));
    for (const side of [-1, 1] as const) {
      disc(
        Math.round(centerX + side * anatomy.headHalfWidth * 0.54),
        anatomy.mouthY - 2,
        radius,
        ramps.skin
      );
    }
    return;
  }

  if (/plate/.test(pattern)) {
    // A lip plate is worn in the lower lip, which it holds open and carries
    // forward — so it hangs *below* the mouth line rather than covering it, and
    // the lip itself is the ring around it.
    const radius = Math.max(3, Math.round(4.5 * scale));
    disc(centerX, anatomy.mouthY + radius, radius, ramps.lip);
    return;
  }

  if (/plug|disc/.test(pattern)) {
    // Stretched lobes. The plug fills the opening and the lobe survives as a
    // loop of skin under it, which is the whole silhouette of the thing.
    const radius = Math.max(2, Math.round(2.6 * scale));
    for (const side of [-1, 1] as const) {
      disc(centerX + side * (anatomy.earX - 1), anatomy.earBottomY, radius, ramps.skin);
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
 *
 * `glint` is where the light lands, and it is passed in rather than derived
 * because whether this bead catches at all is a fact about its substance:
 * jade and pearl and bone are waxy and hold a soft bloom, gold and amber and
 * glass throw a hard point. Handing every bead the same white pixel is what
 * makes bone read as chrome.
 */
function bead(
  context: RenderContext,
  cx: number, cy: number, size: number,
  ramp: Ramp, mat: number,
  glint?: GlintSink
): void {
  if (size <= 1) {
    jewel(context, cx, cy, 2, ramp, mat);
    glint?.(cx, cy);
    return;
  }
  if (size === 2) {
    jewel(context, cx, cy, 0.5, ramp, mat, false);
    jewel(context, cx + 1, cy, 3, ramp, mat, false);
    jewel(context, cx, cy + 1, 3.5, ramp, mat);
    jewel(context, cx + 1, cy + 1, 5, ramp, mat);
    glint?.(cx, cy);
    return;
  }
  if (size <= 3) {
    // 3px: a diamond, which reads rounder than a square at this scale.
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) > 1) continue;
        const index = 3 + dx * 1.3 + dy * 1.3;
        jewel(context, cx + dx, cy + dy, index, ramp, mat, dy === 1);
      }
    }
    jewel(context, cx - 1, cy - 1, 0, ramp, mat, false); // specular
    glint?.(cx - 1, cy - 1);
    return;
  }

  /**
   * A pendant proper: a boss, a gorget, a whale tooth, the drop of a collar.
   *
   * Modelled as a sphere rather than shaded as a disc — the value falls with
   * distance from the light, not with distance from the centre — because at
   * five or six pixels the difference between the two is the difference
   * between an object and a coin painted on the chest.
   */
  const r = size / 2;
  for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy += 1) {
    for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx += 1) {
      if (Math.hypot(dx, dy) > r + 0.25) continue;
      const lit = (-dx - dy) / Math.max(1, r);
      jewel(context, cx + dx, cy + dy, 3.4 - lit * 2.4, ramp, mat, dy >= r - 1);
    }
  }
  const hx = cx - Math.round(r * 0.45);
  const hy = cy - Math.round(r * 0.45);
  jewel(context, hx, hy, 0, ramp, mat, false);
  glint?.(hx, hy);
}

/** Records a pixel where a highlight sits, for the per-frame catch of light. */
type GlintSink = (x: number, y: number) => void;

/**
 * Where a piece of jewellery catches the light, in the order the light reaches
 * it.
 *
 * A strand of beads does not flash all at once — the catch runs along it as the
 * wearer shifts, and reproducing that is the entire difference between jewellery
 * that sparkles and jewellery that blinks. So the order these are recorded in is
 * load-bearing: the frame step spaces their phases by index, and `drawJewelry`
 * walks a necklace from one end to the other.
 */
export interface GlintSite {
  x: number;
  y: number;
  /** The colour this pixel reaches at the peak of the catch. */
  peak: RGB;
  /** Position along its own piece, 0..1, so the catch travels rather than pulses. */
  along: number;
}

/**
 * How much of the wearer a piece takes up.
 *
 * The single number that was missing. Everything here used to be drawn at one
 * size with small variations for style, so a Melanesian boar-tusk breastplate,
 * an Egyptian broad collar and a Victorian mourning locket were all a one-pixel
 * line at the collarbone. That is not a rendering shortcut, it is a claim —
 * that adornment across all of human history was modest and tasteful — and it
 * is false nearly everywhere. Most people who owned ornament owned *one* piece,
 * wore it constantly, and meant it to be seen from across a village.
 *
 * `bead` is the width of a link, `rows` how many strands deep a collar sits,
 * `drop` how far an earring hangs, `boss` the size of the centrepiece, and
 * `spread` how far a collar reaches out toward the shoulders.
 */
interface PieceScale {
  bead: number;
  rows: number;
  drop: number;
  boss: number;
  spread: number;
}

/**
 * `drop` is earring-only, and it was set for a piece that reads at 256px and
 * disappears at 96. Doubled: an earring is the one ornament that hangs against
 * open background rather than against cloth, so it can afford the length, and
 * at the old scale a "large" ear ornament was five pixels of jaw-coloured
 * jewellery beside a jaw.
 */
const PIECE_SCALE: Record<JewelrySpec['scale'], PieceScale> = {
  small: { bead: 1, rows: 1, drop: 4, boss: 2, spread: 0.85 },
  // Two strands. The middle of a three-step gradient has to be visibly the
  // middle: at one strand it was indistinguishable from `small` and the scale
  // had two values pretending to be three.
  medium: { bead: 1, rows: 2, drop: 6, boss: 3, spread: 1 },
  // Three strands, wider beads and a real pendant. At 120px this is the
  // difference between "is that person wearing something?" and "that person is
  // wearing a collar".
  large: { bead: 2, rows: 3, drop: 9, boss: 5, spread: 1.22 },
};

export function drawJewelry(context: RenderContext, glints?: GlintSite[]): void {
  const { raster, spec, anatomy } = context;
  const { centerX } = anatomy;

  spec.jewelry.forEach((item: JewelrySpec) => {
    const ornate = item.style === 'ornate' || item.style === 'chunky';
    const chunky = item.style === 'chunky';
    const delicate = item.style === 'delicate';
    const size = PIECE_SCALE[item.scale] || PIECE_SCALE.medium;
    const ramp = ornamentRamp(item.material);
    // The stone set into the piece, or the piece itself where it is all one
    // substance. Every `ramps.gem` in this function used to be the same
    // hardcoded amethyst regardless of what the persona was wearing.
    const stone = item.stone || item.material;
    const stoneRamp = ornamentRamp(stone);
    const mat = METAL_MATERIALS.has(item.material) ? MAT.METAL : MAT.GEM;

    // Collected per piece so `along` can be normalised once the piece is drawn
    // and the total is known.
    const sites: Array<{ x: number; y: number; peak: RGB }> = [];
    const catches = (material: OrnamentMaterial): GlintSink | undefined => {
      if (!glints || !isSpecular(material)) return undefined;
      const peak = ornamentGlintPeak(material);
      return (x, y) => sites.push({ x, y, peak });
    };
    const bodyGlint = catches(item.material);
    const stoneGlint = catches(stone);

    switch (item.type) {
      case 'earrings': {
        // Hung just outside the lobe rather than on it. Silhouetted against the
        // background it reads at a glance; sitting on the ear it disappears
        // into the shading of the ear itself.
        for (const side of [-1, 1] as const) {
          const x = centerX + side * (anatomy.earX + 1);
          const y = anatomy.earBottomY;
          // The stud, which was a single pixel and read as a speck of dust on
          // the ear. A bead of two or three carries its own highlight and its
          // own shadow, which is what makes it an object hanging in front of
          // the background rather than a lit pixel.
          const stud = delicate || item.scale === 'small' ? 2 : 3;
          // `bead` at size 2 grows down and to the right, so on the sitter's
          // right ear it has to start a pixel further out or it grows inward
          // over the lobe.
          bead(context, stud === 2 && side < 0 ? x - 1 : x, y, stud, ramp, mat, bodyGlint);

          if (item.scale === 'large') {
            /**
             * A flare, a spool, a jhumka, a Moche ear ornament — the pieces
             * that stretched a lobe rather than hung from it. These are the
             * largest thing anybody wears on a face and they were drawn as a
             * three-pixel hoop.
             *
             * Widened outward rather than downward: the space beside the jaw is
             * empty background, so the piece silhouettes there, while length
             * alone runs it into the shoulder.
             */
            const w = 3;
            for (let dy = 0; dy <= size.drop; dy += 1) {
              const t = dy / size.drop;
              // Widest a third of the way down, tapering to a rounded base.
              const half = Math.round(w * (1 - Math.abs(t - 0.35) * 0.9));
              for (let dx = -half; dx <= half; dx += 1) {
                const lit = dx <= 0;
                jewel(context, x + side * dx, y + dy, lit ? 1.4 : 4.2, ramp, mat, dy === size.drop);
              }
              if (dy % 2 === 0) bodyGlint?.(x - 1, y + dy);
            }
            bead(context, x, y + size.drop + 1, size.boss, stoneRamp, MAT.GEM, stoneGlint);
          } else if (chunky || ornate) {
            // A hoop: two verticals and a rounded bottom.
            const drop = size.drop;
            const span = chunky ? 3 : 2;
            for (let i = 1; i <= drop; i += 1) {
              jewel(context, x, y + i, i < drop ? 1.5 : 3, ramp, mat, false);
              jewel(context, x + side * span, y + i, i < drop ? 4 : 5, ramp, mat, false);
            }
            for (let d = 1; d < span; d += 1) jewel(context, x + side * d, y + drop + 1, 4.5, ramp, mat);
            jewel(context, x + side * span, y + drop + 1, 5, ramp, mat);
            if (ornate) {
              bead(context, x + (side < 0 ? -1 : 0), y + drop + 2, 2,
                stoneRamp, MAT.GEM, stoneGlint);
            }
          } else if (delicate || item.scale === 'small') {
            // Still a drop, just a fine one. A bare stud is a single pixel and
            // vanishes completely at portrait size.
            jewel(context, x, y + 1, 1.5, ramp, mat, false);
            jewel(context, x, y + 2, 4, ramp, mat);
          } else {
            // A plain drop.
            const drop = Math.max(2, Math.round(size.drop * 0.5));
            for (let i = 1; i <= drop; i += 1) {
              jewel(context, x, y + i, 2 + Math.min(2, i), ramp, mat, i === drop);
            }
          }
        }
        break;
      }

      case 'necklace':
      case 'chain': {
        const isChain = item.type === 'chain';
        /**
         * One strand, or a collar.
         *
         * `rows` is what turns a necklace into a broad collar: each strand
         * hangs a little lower and a little wider than the one above it, which
         * is how every multi-strand piece in the world is actually built, from
         * a faience wesekh to a Maasai beadwork disc to a Naga shell collar.
         * Drawn outermost-first so the inner strands overlap the outer ones the
         * way they do on a body.
         */
        let lowest = { x: centerX, y: 0 };
        for (let row = size.rows - 1; row >= 0; row -= 1) {
          const radius = (anatomy.neckHalf + (isChain ? 5 : 3) + row * 2.6) * size.spread;
          // Discrete links rather than a swept 1px line. A continuous curve
          // reads as a drawn-on collar; spaced links read as a strung necklace.
          const step = delicate ? 0.11 : isChain ? 0.15 : size.bead > 1 ? 0.17 : 0.2;
          // The outer strands of a collar reach further round toward the
          // shoulders; a single strand sits in front of the throat.
          const arc = 1.2 + row * 0.16;
          for (let a = -arc; a <= arc; a += step) {
            const x = Math.round(centerX + Math.sin(a) * radius);
            const y = Math.round(anatomy.collarY - 3 + Math.cos(a) * radius * 0.42 + row * 1.4);
            if (raster.alphaAt(x, y) === 0) continue;
            if (row === 0 && y > lowest.y) lowest = { x, y };
            // Lit from the upper left, so the left of the curve catches and the
            // right falls away.
            const index = 1.4 + Math.sin(a) * 1.9;
            if (size.bead > 1) bead(context, x, y, 2, ramp, mat, row === 0 ? bodyGlint : undefined);
            else {
              jewel(context, x, y, index, ramp, mat);
              // Only the left half of the arc is turned toward the key light,
              // so only that half has a highlight for the catch to travel
              // along. A strand that glints all the way round is a strand lit
              // from inside.
              if (a < 0.2 && row === 0) bodyGlint?.(x, y);
            }
          }
        }
        // A pendant at the low point. This is the part that actually reads at
        // portrait size, and the old version had none at all.
        if (lowest.y > 0 && (ornate || !delicate || item.scale === 'large')) {
          const py = lowest.y + (size.bead > 1 ? 2 : 1);
          jewel(context, lowest.x, lowest.y + 1, 3, ramp, mat, false);
          if (ornate || item.scale === 'large') {
            bead(context, lowest.x, py + 1, size.boss, stoneRamp, MAT.GEM, stoneGlint);
          } else {
            bead(context, lowest.x, py, 2, ramp, mat, bodyGlint);
          }
        }
        break;
      }

      case 'circlet': {
        if (spec.headwear) break; // a hat wins
        const half = anatomy.headHalfWidth * 0.82 * (item.scale === 'large' ? 1.05 : 1);
        // Up on the forehead, not down on the brow ridge. At browY − 5 the band
        // landed across the eyebrows and read as a very odd monobrow.
        const baseY = Math.round(anatomy.browY - anatomy.headHeight * 0.17);
        // Two pixels thick and dipping at the centre, so it wraps the brow
        // instead of lying across it like a drawn line. A large one — a feather
        // headband, a coral diadem, a kingfisher tiara — is three deep and
        // rises above the hairline, because those pieces stand up off the head
        // rather than lying flat against it.
        const thickness = item.scale === 'large' ? 3 : item.scale === 'small' ? 1 : 2;
        let step = 0;
        for (let dx = -half; dx <= half; dx += 1) {
          const px = Math.round(centerX + dx);
          const t = dx / half;
          const y = Math.round(baseY + (1 - t * t) * 1.6);
          step += 1;
          if (raster.matAt(px, y) === MAT.EMPTY) continue;
          for (let d = 2; d < thickness; d += 1) {
            // The rise sits proud of the band and tapers toward the temples,
            // so a large piece is a crown shape rather than a thicker stripe.
            if (Math.abs(t) > 0.72) continue;
            jewel(context, px, y - (d - 1), 0.8 + t * 1.4, ramp, mat, false);
          }
          jewel(context, px, y, 1 + t * 1.6, ramp, mat, false);
          if (thickness > 1) jewel(context, px, y + 1, 3.4 + t * 1.4, ramp, mat);
          // A band wrapping a brow is the one piece here that is genuinely
          // continuous, so the catch runs the whole way round it rather than
          // hopping between beads. Every third pixel: a solid lit strip reads
          // as a white line ruled across the forehead. Counted rather than
          // tested on `dx`, which starts at a fraction of the head's width and
          // is therefore never a multiple of anything.
          if (step % 3 === 0) bodyGlint?.(px, y);
        }
        if (ornate || item.scale === 'large') {
          bead(context, centerX, baseY - (thickness > 2 ? 1 : 0), size.boss, stoneRamp, MAT.GEM, stoneGlint);
        } else if (chunky) {
          bead(context, centerX - 1, baseY + 1, 2, ramp, mat, bodyGlint);
        }
        break;
      }

      case 'brooch': {
        // Pinned on the garment, off to one side. Made a proper disc — the old
        // 2×2 was smaller than a freckle, and a Berber fibula or a Mississippian
        // copper plate is a hand's breadth of metal.
        const cx = centerX - Math.round(anatomy.shoulderHalf * 0.42);
        const cy = anatomy.collarY + 4;
        const r = item.scale === 'large' ? 4 : item.scale === 'small' ? 2 : chunky ? 3 : 2;
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
        bodyGlint?.(cx - r + 1, cy - r + 1);
        if (ornate || item.stone) bead(context, cx, cy, 2, stoneRamp, MAT.GEM, stoneGlint);
        break;
      }

      default:
        break;
    }

    // Spaced along the piece in draw order, so a necklace catches from one end
    // to the other rather than flashing as a unit.
    if (glints && sites.length > 0) {
      const last = Math.max(1, sites.length - 1);
      sites.forEach((site, i) => glints.push({ ...site, along: i / last }));
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
    const cx = anatomy.faceX + side * anatomy.eyeDX;
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
  for (let x = anatomy.faceX - anatomy.eyeDX + rx; x <= anatomy.faceX + anatomy.eyeDX - rx; x += 1) {
    frame(x, anatomy.eyeY - 1, 3);
  }

  // A single specular streak across each lens sells them as glass.
  for (const side of [-1, 1] as const) {
    const cx = anatomy.faceX + side * anatomy.eyeDX;
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
      const x0 = anatomy.faceX + side * anatomy.eyeDX;
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

/**
 * The permanent marks — what a life left on a face, rather than what is wrong
 * with it today.
 *
 * Drawn after `drawAilments` and before anything is laid over the face, so an
 * old pock and a current rash can coexist on the same cheek without one
 * overwriting the other. That happens: a persona can be `pox_scarred` from
 * childhood and have typhoid now, and both are true of them.
 */
export function drawFaceTraits(context: RenderContext): void {
  const { raster, spec, anatomy, book } = context;
  const { gaunt, poxScarred, goiter } = spec.traits;
  if (goiter) drawGoiter(context);
  if (!gaunt && !poxScarred) return;

  const { centerX } = anatomy;
  const rng = makeRng(spec.seed ^ 0x9f21);
  const onFace = (x: number, y: number) => raster.matAt(x, y) === MAT.SKIN;

  if (gaunt) {
    // Three hollows, in the order they actually read at this size: under the
    // cheekbone first, then the temple, then the eye socket. Drawing them as
    // shadow rather than as line matters — a gaunt face is not a face with
    // extra creases in it, it is a face with less under the skin, and the
    // difference between those two readings is whether the dark areas have
    // edges. These do not.
    for (const side of [-1, 1] as const) {
      // The hollow beneath the zygomatic arch, curving down toward the jaw.
      for (let i = 0; i < 9; i += 1) {
        const t = i / 8;
        const x = Math.round(centerX + side * (anatomy.headHalfWidth * (0.72 - t * 0.16)));
        const y = Math.round(anatomy.cheekY + t * 7);
        for (let d = 0; d < 3; d += 1) {
          const px = x - side * d;
          if (!onFace(px, y)) continue;
          raster.shift(px, y, d === 0 ? 2 : 1, book);
        }
      }
      // The temple, above the cheekbone and behind the brow.
      for (let i = 0; i < 5; i += 1) {
        const x = Math.round(centerX + side * (anatomy.headHalfWidth * 0.76));
        const y = anatomy.browY - 2 + i;
        for (let d = 0; d < 2; d += 1) {
          const px = x - side * d;
          if (!onFace(px, y)) continue;
          raster.shift(px, y, 1, book);
        }
      }
    }
    // A lit ridge along the cheekbone itself. Without it the hollows read as
    // dirt; with it they read as bone showing through.
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < 6; i += 1) {
        const x = Math.round(centerX + side * (anatomy.headHalfWidth * (0.5 + i * 0.045)));
        const y = anatomy.cheekY - 2 - Math.round(i * 0.4);
        if (!onFace(x, y)) continue;
        raster.shift(x, y, -1, book);
      }
    }
  }

  if (poxScarred) {
    // Healed pits, not an active rash: no colour, only the pit and its lit rim.
    // They cluster on the forehead and cheeks, which is where they scar worst
    // and — conveniently — where the face has room to show them.
    const count = 22;
    for (let i = 0; i < count; i += 1) {
      const onForehead = rng() > 0.55;
      const x = Math.round(centerX + (rng() * 2 - 1) * anatomy.headHalfWidth * 0.78);
      const y = onForehead
        ? Math.round(anatomy.browY - 3 - rng() * 7)
        : Math.round(anatomy.cheekY - 3 + rng() * 12);
      if (!onFace(x, y)) continue;
      // Never on the lash line: pocks over an eye read as damage to the
      // drawing rather than to the person.
      if (Math.abs(y - anatomy.eyeY) < 3) continue;
      raster.shift(x, y, 2, book);
      if (onFace(x - 1, y - 1)) raster.shift(x - 1, y - 1, -1, book);
    }
  }
}

/**
 * Endemic goitre: the thyroid swollen at the base of the throat.
 *
 * Drawn as modelling on the neck rather than as a mark on it. The swelling is
 * *under* the skin, so what you actually see is a lit dome where the throat
 * should be flat and a crease beneath it where the mass overhangs — the same
 * grammar as the gaunt hollows above, run the other way. Painting a shape on
 * the neck instead would read as a bib or a wound.
 *
 * It sits low and slightly to one side, which is where a goitre sits, and it
 * has to be drawn before the garment: the collar rides over it, so on a persona
 * in a high-necked robe only the top of the swelling shows, which is correct.
 *
 * Iodine deficiency in mountain and inland valleys made this ordinary — Alpine,
 * Andean, Himalayan and Great Lakes populations all carried it in numbers — and
 * a portrait set that never shows one is quietly asserting it did not happen.
 */
function drawGoiter(context: RenderContext): void {
  const { raster, anatomy, book, spec } = context;
  const rng = makeRng(spec.seed ^ 0x901e);
  // Which side it leans, and how far it has grown. Both are seeded: a goitre
  // is rarely symmetrical and rarely the same size twice.
  const lean = rng() > 0.5 ? 1 : -1;
  const size = 0.75 + rng() * 0.5;

  const cx = anatomy.centerX + lean * Math.round(anatomy.neckHalf * 0.28);
  // Low on the throat, just above where the collar will cross.
  const cy = anatomy.neckBottom - 2;
  const rx = anatomy.neckHalf * 0.82 * size;
  const ry = 5.2 * size;

  const onNeck = (x: number, y: number) => raster.matAt(x, y) === MAT.SKIN;

  for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy += 1) {
    for (let dx = -Math.ceil(rx); dx <= Math.ceil(rx); dx += 1) {
      const t = (dx / rx) ** 2 + (dy / ry) ** 2;
      if (t > 1) continue;
      const x = Math.round(cx + dx);
      const y = cy + dy;
      if (!onNeck(x, y)) continue;
      // Lit from the upper left like everything else, and lit most where the
      // dome turns toward the light. The rim on the far side falls away.
      const facing = -(dx / rx) * 0.6 - (dy / ry) * 0.7;
      const delta = facing > 0.45 ? -2 : facing > 0.05 ? -1 : facing > -0.5 ? 0 : 1;
      if (delta !== 0) raster.shift(x, y, delta, book);
    }
  }

  // The crease under the overhang. This is the line that makes it read as a
  // mass rather than as a highlight on a cylinder.
  for (let dx = -Math.ceil(rx * 0.8); dx <= Math.ceil(rx * 0.8); dx += 1) {
    const x = Math.round(cx + dx);
    const y = cy + Math.round(ry * Math.sqrt(Math.max(0, 1 - (dx / (rx * 0.85)) ** 2)));
    if (!onNeck(x, y)) continue;
    raster.shift(x, y, 2, book);
  }
}
