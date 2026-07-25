/**
 * portraitLab/art/face.ts
 *
 * The head as a solid. Everything else in the portrait is drawn on top of what
 * this file establishes: a skull silhouette from the anatomy profile, modelled
 * as an ellipsoid under a single key light, then worked over with the handful
 * of local forms that actually read at this size — brow ridge, eye sockets,
 * cheekbones, the plane change at the jaw, and the shadow the chin throws onto
 * the neck.
 */

import {
  applyContactShadow, ellipsoidShader, fillMask, makeMask, MAT, Mask, maskEllipse,
  maskFromProfile, maskUnion,
} from '../core/raster';
import { makeNoise1D, unit } from '../core/rng';
import { RenderContext } from '../render/context';
import { drawEar } from './ears';

export interface HeadMasks {
  head: Mask;
  neck: Mask;
  /** So short hairstyles can be cut back to expose the ears. */
  ears: Mask;
}

export function drawHeadAndNeck(context: RenderContext): HeadMasks {
  const { raster, spec, anatomy, ramps, book } = context;
  const { size } = anatomy;

  // --- neck ----------------------------------------------------------------
  // Drawn first so the jaw sits over it and can cast a shadow down onto it.
  const neck = maskFromProfile(size, size, {
    keys: [
      [0, anatomy.neckHalf * 0.82],
      [0.45, anatomy.neckHalf],
      [1, anatomy.neckHalf * 1.28],
    ],
    top: anatomy.neckTop,
    bottom: anatomy.neckBottom + 6,
    centerX: anatomy.centerX,
  });

  // The neck is a cylinder that lives mostly in the head's shadow.
  fillMask(raster, neck, ramps.skin, MAT.SKIN, (x, y) => {
    const dx = (x + 0.5 - anatomy.centerX) / anatomy.neckHalf;
    const nz = Math.sqrt(Math.max(0.05, 1 - Math.min(1, dx * dx)));
    const depth = Math.max(0, 1 - (y - anatomy.neckTop) / 14);
    return 4.9 - nz * 0.8 + depth * 0.7;
  });

  // --- head ----------------------------------------------------------------
  const head = maskFromProfile(size, size, {
    keys: anatomy.headProfile,
    top: anatomy.headTop,
    bottom: anatomy.chinY,
    centerX: anatomy.centerX,
  });

  const shader = ellipsoidShader(
    anatomy.centerX - 0.5,
    anatomy.headTop + anatomy.headHeight * 0.44,
    anatomy.headHalfWidth * 1.06,
    anatomy.headHeight * 0.56,
    1,
    { base: 3, gain: 6.4, bounce: 0.28, neutral: 0.78 }
  );

  // The jaw is a flatter plane than the cranium; blending toward the base tone
  // there keeps the lower face from looking like a ball.
  fillMask(raster, head, ramps.skin, MAT.SKIN, (x, y) => {
    const raw = shader(x, y);
    const t = (y - anatomy.headTop) / anatomy.headHeight;
    const flatten = t > 0.62 ? Math.min(1, (t - 0.62) / 0.38) * 0.45 : 0;
    return raw * (1 - flatten) + 3.15 * flatten;
  });

  // Chin onto neck. Without this the head reads as a sticker on a post.
  applyContactShadow(raster, head, book, { dx: 0, dy: 1, strength: 2, depth: 3 });
  applyContactShadow(raster, head, book, { dx: 1, dy: 1, strength: 1, depth: 1 });

  const ears = drawFacialModelling(context, head);

  return { head, neck, ears };
}

/**
 * The local forms. Each one is a small mask nudged along the skin ramp rather
 * than a colour, so they hold up on any complexion and inside any lighting.
 */
function drawFacialModelling(context: RenderContext, head: Mask): Mask {
  const { raster, spec, anatomy, book, ramps } = context;
  const { size, centerX } = anatomy;
  const female = spec.gender === 'Female';

  const shiftInside = (mask: Mask, amount: number) => {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (mask[y * size + x] && head[y * size + x]) raster.shift(x, y, amount, book);
      }
    }
  };

  // Temple hollows — subtle, but they stop the forehead reading as a dome.
  for (const side of [-1, 1] as const) {
    const temple = maskEllipse(
      size, size,
      centerX + side * anatomy.headHalfWidth * 0.78,
      anatomy.browY - 4,
      5, 6
    );
    shiftInside(temple, side === -1 ? 1 : 1);
  }

  // Brow ridge: a lit ledge with a shadow beneath it. Heavier on male faces.
  const ridgeLift = female ? -1 : -1;
  for (const side of [-1, 1] as const) {
    const eyeX = centerX + side * anatomy.eyeDX;
    for (let dx = -6; dx <= 6; dx += 1) {
      const falloff = 1 - Math.abs(dx) / 7;
      if (falloff <= 0.15) continue;
      raster.shift(eyeX + dx, anatomy.browY - 2, ridgeLift, book);
      if (!female) raster.shift(eyeX + dx, anatomy.browY - 3, ridgeLift, book);
    }
  }

  // Eye sockets. Deeper at the top where the lid sits under the ridge.
  for (const side of [-1, 1] as const) {
    const eyeX = centerX + side * anatomy.eyeDX;
    const socket = maskEllipse(size, size, eyeX, anatomy.eyeY - 2.4, 6.2, 3.6);
    shiftInside(socket, 1);
    const deep = maskEllipse(size, size, eyeX, anatomy.eyeY - 4, 5.2, 1.8);
    shiftInside(deep, 1);
  }

  // Just enough shadow between the sockets to set the eyes apart. The nose
  // stamp carries the bridge itself, so this stays short or the two stack up
  // into a smear running from the brow to the nostril.
  for (let y = anatomy.browY + 1; y < anatomy.browY + 4; y += 1) {
    raster.shift(centerX + 1, y, 1, book);
  }

  // Cheekbones catch the light; the hollow under them falls away.
  const cheekLift = spec.cheekbones === 'high' ? 2 : spec.cheekbones === 'low' ? 0 : 1;
  if (cheekLift > 0) {
    for (const side of [-1, 1] as const) {
      const cheek = maskEllipse(
        size, size,
        centerX + side * anatomy.headHalfWidth * 0.6,
        anatomy.cheekY - 3,
        6.5, 4
      );
      shiftInside(cheek, side === -1 ? -cheekLift : -Math.max(0, cheekLift - 1));
      if (spec.cheekbones === 'high') {
        const hollow = maskEllipse(
          size, size,
          centerX + side * anatomy.headHalfWidth * 0.66,
          anatomy.cheekY + 4,
          5.5, 3.5
        );
        shiftInside(hollow, 1);
      }
    }
  }

  // Chin: a small lit plane with the shadow of the lower lip above it.
  const chinMask = maskEllipse(size, size, centerX - 1, anatomy.chinY - 5, 5, 3.5);
  shiftInside(chinMask, -1);

  // Jowls and a slacker jawline with age.
  if (spec.ageLines > 0.55) {
    for (const side of [-1, 1] as const) {
      const jowl = maskEllipse(
        size, size,
        centerX + side * anatomy.headHalfWidth * 0.62,
        anatomy.chinY - 7,
        4.5, 4
      );
      shiftInside(jowl, 1);
    }
  }

  // Ears sit on the silhouette and protrude a couple of pixels past it.
  let ears = makeMask(size, size);
  for (const side of [-1, 1] as const) {
    const earMask = drawEar({
      raster,
      book,
      ramps,
      x: centerX + side * anatomy.earX,
      y: (anatomy.earTopY + anatomy.earBottomY) / 2,
      height: anatomy.earBottomY - anatomy.earTopY,
      side,
      ageLines: spec.ageLines,
    });
    ears = maskUnion(ears, earMask);
  }
  return ears;
}

/**
 * Weathering: the freckles, sun damage, and broken capillaries that come from
 * a life outdoors, plus the flush of a fever. All of it lands on the cheeks and
 * the bridge of the nose, which is where it lands on real faces.
 */
export function drawComplexion(context: RenderContext, head: Mask): void {
  const { raster, spec, anatomy, ramps, book } = context;
  const { size, centerX } = anatomy;
  const noise = makeNoise1D(spec.seed);

  const inHead = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < size && y < size && head[y * size + x] === 1;

  const texture = String((spec as any).skinTexture || '');
  const freckled = /freckled/.test(texture) || spec.markings.some(m => m.type === 'freckles');
  const weathered = /weathered|rough/.test(texture) || spec.ageLines > 0.7;

  if (freckled) {
    for (let i = 0; i < 34; i += 1) {
      const t = i / 34;
      const side = i % 2 === 0 ? -1 : 1;
      const x = Math.round(centerX + side * (7 + noise(i * 1.7) * 9 + 4));
      const y = Math.round(anatomy.cheekY - 6 + noise(i * 2.3 + 40) * 7 + t * 3);
      if (inHead(x, y)) raster.shift(x, y, 1, book);
    }
    for (let i = 0; i < 8; i += 1) {
      const x = Math.round(centerX - 3 + noise(i * 3.1 + 90) * 6);
      const y = Math.round(anatomy.noseBaseY - 8 + noise(i * 1.1 + 12) * 4);
      if (inHead(x, y)) raster.shift(x, y, 1, book);
    }
  }

  if (weathered) {
    // Sun-exposed planes go a step warmer and darker: forehead, nose, cheeks.
    for (let y = anatomy.headTop + 6; y < anatomy.browY - 2; y += 2) {
      for (let x = centerX - 12; x <= centerX + 12; x += 3) {
        if (inHead(x, y) && noise(x * 0.4 + y) > 0.1) raster.shift(x, y, 1, book);
      }
    }
  }

  // Fever and cold both put colour in the cheeks; illness drains it elsewhere.
  const flush = Math.max(spec.condition.fever, spec.mood.valence > 0.5 ? 0.2 : 0);
  if (flush > 0.15) {
    const strength = Math.min(0.55, flush * 0.6);
    for (const side of [-1, 1] as const) {
      const cx = centerX + side * (anatomy.headHalfWidth * 0.58);
      for (let dy = -3; dy <= 3; dy += 1) {
        for (let dx = -5; dx <= 5; dx += 1) {
          const x = Math.round(cx + dx);
          const y = anatomy.cheekY - 1 + dy;
          if (!inHead(x, y)) continue;
          const falloff = 1 - Math.hypot(dx / 5.5, dy / 3.5);
          if (falloff <= 0) continue;
          raster.blend(x, y, { r: 198, g: 92, b: 84 }, strength * falloff * 0.55, MAT.SKIN, raster.shadeAt(x, y));
        }
      }
    }
  }

}

/**
 * Crow's feet, forehead lines, and the fold beside the mouth. These are the
 * difference between an old face and a young face wearing grey hair.
 */
export function drawAgeLines(context: RenderContext, head: Mask): void {
  const { raster, spec, anatomy, book } = context;
  const { size, centerX } = anatomy;
  const strength = spec.ageLines;
  if (strength < 0.28) return;

  const inHead = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < size && y < size && head[y * size + x] === 1;

  // Forehead furrows arrive late and stay shallow.
  if (strength > 0.5) {
    const rows = strength > 0.78 ? 3 : 2;
    for (let r = 0; r < rows; r += 1) {
      const y = anatomy.browY - 7 - r * 3;
      const width = Math.round(11 - r * 1.5);
      for (let dx = -width; dx <= width; dx += 1) {
        const x = centerX + dx;
        // Lines sag at the ends rather than running dead straight.
        const sag = Math.round(Math.pow(Math.abs(dx) / width, 2) * 1.4);
        if (inHead(x, y + sag)) raster.shift(x, y + sag, 1, book);
      }
    }
  }

  // Crow's feet fan out from the outer corner of each eye.
  if (strength > 0.34) {
    const lines = strength > 0.7 ? 3 : 2;
    for (const side of [-1, 1] as const) {
      const x0 = centerX + side * (anatomy.eyeDX + 7);
      for (let l = 0; l < lines; l += 1) {
        const y = anatomy.eyeY - 2 + l * 3;
        const length = 2 + Math.round(strength * 2.5);
        for (let i = 0; i < length; i += 1) {
          const x = x0 + side * i;
          const yy = y + Math.round(i * (l - 1) * 0.45);
          if (inHead(x, yy)) raster.shift(x, yy, 1, book);
        }
      }
    }
  }

  // Under-eye hollows deepen with age and with exhaustion.
  const tired = Math.max(strength - 0.4, spec.condition.fatigueRatio - 0.3);
  if (tired > 0.1) {
    for (const side of [-1, 1] as const) {
      const x0 = centerX + side * anatomy.eyeDX;
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = x0 + dx;
        const y = anatomy.eyeY + 5;
        if (inHead(x, y)) raster.shift(x, y, 1, book);
        if (tired > 0.35 && inHead(x, y + 1)) raster.shift(x, y + 1, 1, book);
      }
    }
  }
}
