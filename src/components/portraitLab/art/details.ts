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
 */

import { hexToRgb } from '../core/color';
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

function paint(
  raster: Raster,
  x: number,
  y: number,
  color: { r: number; g: number; b: number },
  alpha: number,
  material = MAT.PAINT
): void {
  if (raster.alphaAt(x, y) === 0) return;
  const under = raster.matAt(x, y);
  if (under !== MAT.SKIN && under !== MAT.PAINT) return;
  raster.blend(x, y, color, alpha, material, raster.shadeAt(x, y));
}

export function drawMarkings(context: RenderContext): void {
  const { raster, spec, anatomy, book } = context;
  const noise = makeNoise1D(spec.seed ^ 0x71a3);

  spec.markings.forEach((marking: MarkingSpec, index: number) => {
    if (marking.type === 'freckles') return; // handled with the complexion
    const anchor = anchorFor(context, marking.location);
    const scale = SIZE_SCALE[marking.size] ?? 1;
    const color = hexToRgb(marking.color || '#8b5a3c');
    const pattern = marking.pattern || 'solid';
    const rng = makeRng(spec.seed ^ (0x300 + index * 37));

    const strokeAlpha = marking.type === 'paint' ? 0.92 : marking.type === 'tattoo' ? 0.75 : 0.6;

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
            paint(raster, Math.round(cx + dx), anchor.y + dy, color, 0.42);
          }
        }
        break;
      }

      default: {
        // Paint, tattoo, and scarification share a pattern vocabulary.
        drawPattern(context, pattern, anchor, color, scale, strokeAlpha, rng);
        break;
      }
    }
  });
}

function drawPattern(
  context: RenderContext,
  pattern: string,
  anchor: Anchor,
  color: { r: number; g: number; b: number },
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
      paint(raster, Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), color, alpha);
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
              paint(raster, x, y, color, alpha);
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
        paint(raster, Math.round(anchor.x + Math.cos(angle) * r), Math.round(anchor.y + Math.sin(angle) * r * 0.6), color, alpha);
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
          paint(raster, Math.round(cx + Math.cos(angle) * r * side), Math.round(anchor.y + Math.sin(angle) * r * 0.75), color, alpha);
        }
      }
      break;
    }
    case 'solid': {
      for (let dy = -Math.round(3 * scale); dy <= Math.round(3 * scale); dy += 1) {
        line(anchor.x - half * 0.7, anchor.y + dy, anchor.x + half * 0.7, anchor.y + dy);
      }
      break;
    }
    default: {
      line(anchor.x - half * 0.6, anchor.y, anchor.x + half * 0.6, anchor.y);
      break;
    }
  }
}

export function drawJewelry(context: RenderContext): void {
  const { raster, spec, anatomy, ramps } = context;
  const { centerX } = anatomy;

  spec.jewelry.forEach((item: JewelrySpec, index: number) => {
    const ornate = item.style === 'ornate' || item.style === 'chunky';
    const ramp = item.material === 'gems' ? ramps.gem : ramps.metal;
    const material = item.material === 'gems' ? MAT.GEM : MAT.METAL;

    switch (item.type) {
      case 'earrings': {
        for (const side of [-1, 1] as const) {
          const x = centerX + side * (anatomy.earX - 1);
          const y = anatomy.earBottomY;
          raster.set(x, y, ramp.steps[1], material, 1);
          if (ornate) {
            raster.set(x, y + 1, ramp.steps[3], material, 3);
            raster.set(x, y + 2, ramp.steps[5], material, 5);
          }
        }
        break;
      }
      case 'necklace':
      case 'chain': {
        const radius = anatomy.neckHalf + (item.type === 'chain' ? 5 : 3);
        for (let a = -1.15; a <= 1.15; a += 0.06) {
          const x = Math.round(centerX + Math.sin(a) * radius);
          const y = Math.round(anatomy.collarY - 3 + Math.cos(a) * radius * 0.42);
          if (raster.alphaAt(x, y) === 0) continue;
          const index2 = Math.sin(a) < -0.2 ? 1 : Math.sin(a) > 0.3 ? 5 : 3;
          raster.set(x, y, ramp.steps[index2], material, index2);
        }
        if (ornate) {
          const y = Math.round(anatomy.collarY + 2);
          raster.set(centerX, y, ramps.gem.steps[1], MAT.GEM, 1);
          raster.set(centerX, y + 1, ramps.gem.steps[4], MAT.GEM, 4);
          raster.set(centerX - 1, y, ramps.gem.steps[3], MAT.GEM, 3);
          raster.set(centerX + 1, y, ramps.gem.steps[5], MAT.GEM, 5);
        }
        break;
      }
      case 'circlet': {
        if (spec.headwear) break; // a hat wins
        const y = anatomy.browY - 6;
        for (let x = centerX - anatomy.headHalfWidth * 0.8; x <= centerX + anatomy.headHalfWidth * 0.8; x += 1) {
          const px = Math.round(x);
          if (raster.matAt(px, y) === MAT.EMPTY) continue;
          const index2 = px < centerX ? 1 : 4;
          raster.set(px, y, ramp.steps[index2], material, index2);
        }
        if (ornate) raster.set(centerX, y - 1, ramps.gem.steps[2], MAT.GEM, 2);
        break;
      }
      case 'brooch': {
        const x = centerX - 8;
        const y = anatomy.collarY + 3;
        for (let dy = 0; dy < 2; dy += 1) {
          for (let dx = 0; dx < 2; dx += 1) {
            const idx = dx + dy === 0 ? 1 : dx + dy === 2 ? 5 : 3;
            raster.set(x + dx, y + dy, ramp.steps[idx], material, idx);
          }
        }
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
