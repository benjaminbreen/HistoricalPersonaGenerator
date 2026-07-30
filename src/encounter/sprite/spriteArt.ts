/**
 * encounter/sprite/spriteArt.ts
 *
 * The authored layer, at the 192×352 grid. The portrait renderer's lesson,
 * applied to the body: shapes that matter are *drawn*, not computed — an eye
 * is a lash, a lid crease, a sclera, an iris with a pupil and a catchlight;
 * a nose has a bridge, a tip plane, and two nostrils; a beard is clumped
 * strands, not a rectangle. Everything here draws through the portrait core,
 * so a single authored construction reads correctly on any skin tone.
 */

import {
  applyContactShadow, dispersed, ellipsoidShader, fillMask, makeMask, Mask,
  maskFromProfile, MAT, Raster, RampBook,
} from '../../components/portraitLab/core/raster';
import { makeRng } from '../../components/portraitLab/core/rng';
import { beardRegions } from '../../components/portraitLab/art/hair';
import { PortraitRamps } from '../../components/portraitLab/art/palette';
import { PortraitSpec } from '../../components/portraitLab/spec/types';
import { SPRITE_H, SPRITE_W } from './skeleton';

export { SPRITE_H, SPRITE_W };

/** The geometry contract shared with drawSprite. */
export interface FigureRef {
  cx: number;
  headRx: number;
  headRy: number;
  headCy: number;
  chinY: number;
  ankleY: number;
  footY: number;
  hipY: number;
}

// ---------------------------------------------------------------------------
// The head: a skull with bones in it, turned toward the opponent.
// ---------------------------------------------------------------------------

/**
 * The skull, rebuilt to the mockups' construction: a wide *domed* cranium
 * that reaches nearly full width within the first sixth of its height and
 * holds it through the cheeks, then a compact lower face — the jaw tapers
 * quickly through the last quarter into a small firm chin. The old profile
 * was an egg: narrow at the top, widest mid-face, which read as a giant
 * forehead over crowded features. The lean pushes the lower face toward
 * the facing side, which is most of what "three-quarter view" means here.
 */
export function headMask(f: FigureRef, faceShape = 'oval'): Mask {
  const brow = faceShape === 'heart' ? 1.04 : faceShape === 'diamond' ? 0.96 : faceShape === 'square' ? 1.03 : 1;
  const cheek = faceShape === 'round' ? 1.05 : faceShape === 'diamond' ? 1.04 : faceShape === 'long' ? 0.95 : 1;
  const jaw = faceShape === 'square' ? 1.12 : faceShape === 'round' ? 1.05 : faceShape === 'heart' ? 0.85 : faceShape === 'diamond' ? 0.85 : faceShape === 'long' ? 0.92 : 1;
  return maskFromProfile(SPRITE_W, SPRITE_H, {
    keys: [
      [0.0, 0.6], [0.05, 0.84], [0.13, 0.96], [0.24, 1.0],
      [0.4, 1.0 * brow], [0.56, 0.97 * cheek], [0.68, 0.92 * cheek],
      [0.78, 0.82 * jaw], [0.88, 0.64 * jaw], [0.95, 0.46 * jaw], [1.0, 0.3 * jaw],
    ].map(([t, w]) => [t, Math.min(1.08, w) * f.headRx] as [number, number]),
    top: f.headCy - f.headRy,
    bottom: f.chinY,
    centerX: f.cx,
    lean: (t) => t * 4.8,
  });
}

/**
 * The portrait's three-zone skin, ported: warmth across the cheekbones,
 * coolness at the temples and below the mouth. Hue, never value — it can
 * never fight the modelling.
 */
export function drawSkinZonesSprite(
  raster: Raster, spec: PortraitSpec, ramps: PortraitRamps, f: FigureRef, head: Mask
): void {
  const top = f.headCy - f.headRy;
  const height = f.chinY - top;
  const shadowed = spec.facialHair ? 1 : 0.62;
  for (let y = top; y <= f.chinY + 2; y += 1) {
    for (let x = f.cx - f.headRx - 4; x <= f.cx + f.headRx + 8; x += 1) {
      if (y < 0 || y >= SPRITE_H || x < 0 || x >= SPRITE_W) continue;
      if (!head[y * SPRITE_W + x]) continue;
      if (raster.matAt(x, y) !== MAT.SKIN) continue;
      const shade = raster.shadeAt(x, y);
      if (shade > 6) continue;
      const t = (y - top) / Math.max(1, height);
      const across = Math.abs(x - f.cx) / Math.max(1, f.headRx);
      const warm = Math.exp(-Math.pow((t - 0.6) / 0.15, 2)) * (0.5 + across * 0.32);
      const cool = Math.max(
        t > 0.84 ? Math.min(1, (t - 0.84) / 0.16) * shadowed : 0,
        t < 0.26 ? Math.min(1, (0.26 - t) / 0.2) * across * 0.22 : 0
      );
      // Zones whisper at sprite scale, or they read as grime on the face.
      const net = warm * 0.2 - cool * 0.18;
      const ramp = net > 0 ? ramps.skinWarm : ramps.skinCool;
      const strength = Math.min(0.16, Math.abs(net));
      if (strength < 0.04) continue;
      raster.blend(x, y, ramp.steps[shade], strength, MAT.SKIN, shade);
    }
  }
}

// ---------------------------------------------------------------------------
// Facial hair: the portrait's region system, on the sprite's turned face.
// ---------------------------------------------------------------------------

export interface FacialHairGeometry {
  /** Where the skull's silhouette is centered. */
  skullCx: number;
  /** Where the features sit — toward the facing side of the turn. */
  faceCx: number;
  mouthY: number;
  chinY: number;
  cheekY: number;
  earTopY: number;
  headRx: number;
  headH: number;
  /** The head silhouette, so jaw growth ends at the jaw. */
  head: Mask;
}

/**
 * The beard start line rides high near the ears and dips to just above the
 * mouth corners in the middle — a horizontal cut-off gives every bearded
 * persona a rectangular bib. Measured from the skull center: the silhouette
 * is the skull's, even though the mouth has slid toward the facing side.
 */
function beardLineAt(g: FacialHairGeometry, dx: number): number {
  const u = Math.min(1, Math.abs(dx) / Math.max(1, g.headRx));
  const nearEar = g.cheekY + 1;
  const nearMouth = g.mouthY - 2;
  return nearMouth + (nearEar - nearMouth) * Math.pow(u, 0.75);
}

/**
 * The portrait's thirteen styles, drawn on the sprite: regions (mustache,
 * chin, jaw, sideburns, hang, fork, handlebar, soul patch) build a mask,
 * the lips are carved back out, stubble scatters instead of filling, and a
 * sparse beard lets skin through at its edges. Two centers, because the
 * face has turned: the jaw mass belongs to the skull, the mustache to the
 * mouth.
 */
export function drawFacialHairSprite(
  raster: Raster, ramps: PortraitRamps, spec: PortraitSpec, g: FacialHairGeometry
): void {
  const fh = spec.facialHair;
  if (!fh) return;
  const regions = beardRegions(fh.style);
  const stubbleOnly = fh.style === 'stubble';
  const density = fh.thickness === 'sparse' ? 0.55 : fh.thickness === 'thick' ? 1 : 0.82;
  // The chin the beard hangs from: between the skull's center and the
  // turned features, where the leaned head profile actually ends.
  const chinCx = Math.round((g.skullCx + g.faceCx) / 2) + 1;

  const mask = makeMask(SPRITE_W, SPRITE_H);
  const put = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    mask[y * SPRITE_W + x] = 1;
  };
  const onHead = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < SPRITE_W && y < SPRITE_H && g.head[y * SPRITE_W + x] === 1;

  if (regions.jaw) {
    for (let y = g.cheekY - 2; y <= g.chinY; y += 1) {
      for (let x = g.skullCx - g.headRx - 2; x <= g.skullCx + g.headRx + 2; x += 1) {
        if (!onHead(x, y)) continue;
        if (y + 0.5 < beardLineAt(g, x + 0.5 - g.skullCx)) continue;
        put(x, y);
      }
    }
  }

  // Below the jaw the beard hangs free of the head silhouette, so it needs
  // its own taper — clamped, or it spreads into a slab across the collar.
  if (regions.hang > 0) {
    const hang = regions.hang * 2;
    for (let y = g.chinY + 1; y <= g.chinY + hang; y += 1) {
      const t = (y - g.chinY) / Math.max(1, hang);
      const half = (regions.chin ? 12 : 15) * (1 - t * 0.62);
      for (let x = Math.round(chinCx - half); x <= Math.round(chinCx + half); x += 1) {
        if (regions.forked && t > 0.55 && Math.abs(x - chinCx) < 3) continue;
        put(x, y);
      }
    }
  }

  if (regions.sideburns) {
    for (const side of [-1, 1] as const) {
      for (let y = g.earTopY + 4; y <= g.cheekY + 2; y += 1) {
        for (let d = 0; d < 5; d += 1) {
          const x = Math.round(g.skullCx + side * (g.headRx - d));
          if (onHead(x, y)) put(x, y);
        }
      }
    }
  }

  if (regions.chin && !regions.jaw) {
    // A goatee is a small patch under the lower lip, not a bib.
    const hang = regions.hang * 2;
    for (let y = g.mouthY + 4; y <= g.chinY + hang; y += 1) {
      const t = (y - g.mouthY - 4) / Math.max(1, g.chinY + hang - g.mouthY - 4);
      const half = 7 - t * 2.4;
      for (let x = Math.round(g.faceCx - half); x <= Math.round(g.faceCx + half); x += 1) put(x, y);
    }
  }

  // The lips always show through. Carve them out before the moustache goes on.
  for (let y = g.mouthY - 4; y <= g.mouthY + 4; y += 1) {
    for (let x = g.faceCx - 10; x <= g.faceCx + 10; x += 1) {
      const dx = (x + 0.5 - g.faceCx) / 9;
      const dy = (y + 0.5 - g.mouthY) / 4;
      if (dx * dx + dy * dy <= 1) {
        if (y >= 0 && y < SPRITE_H && x >= 0) mask[y * SPRITE_W + x] = 0;
      }
    }
  }

  if (regions.mustache) {
    const top = g.mouthY - 6;
    const rows = fh.thickness === 'thick' ? 4 : 3;
    for (let i = 0; i < rows; i += 1) {
      const y = top + i;
      const half = 6 + i * 1.4;
      for (let x = Math.round(g.faceCx - half); x <= Math.round(g.faceCx + half); x += 1) put(x, y);
    }
    if (regions.handlebar) {
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < 5; i += 1) {
          put(Math.round(g.faceCx + side * (9 + i)), top + 3 - Math.floor(i / 2));
        }
      }
    }
  }

  if (regions.soulPatch) {
    for (let y = g.mouthY + 4; y <= g.mouthY + 7; y += 1) {
      for (let x = g.faceCx - 2; x <= g.faceCx + 2; x += 1) put(x, y);
    }
  }

  // Stubble is a scatter, not a shape: dither it and let skin show through.
  if (stubbleOnly) {
    const rng = makeRng(spec.seed ^ 0x3311);
    for (let y = g.cheekY - 4; y <= g.chinY + 2; y += 1) {
      for (let x = g.skullCx - g.headRx - 2; x <= g.skullCx + g.headRx + 4; x += 1) {
        if (!mask[y * SPRITE_W + x]) continue;
        if (rng() > density * 0.42) continue;
        raster.blend(x, y, ramps.beard.steps[5], 0.34, MAT.SKIN, raster.shadeAt(x, y));
      }
    }
    return;
  }

  const shader = ellipsoidShader(
    chinCx - 2,
    g.chinY - 12,
    g.headRx * 1.1,
    g.headH * 0.42,
    1,
    { base: 3, gain: 6.6, bounce: 0.22 }
  );
  fillMask(raster, mask, ramps.beard, MAT.BEARD, shader, { dither: 0.5 });

  // Sparse beards let skin through at the edges.
  if (density < 0.8) {
    const rng = makeRng(spec.seed ^ 0x88b1);
    for (let y = 0; y < SPRITE_H; y += 1) {
      for (let x = 1; x < SPRITE_W - 1; x += 1) {
        if (!mask[y * SPRITE_W + x]) continue;
        const edge = !mask[y * SPRITE_W + x - 1] || !mask[y * SPRITE_W + x + 1] || !mask[(y - 1) * SPRITE_W + x];
        if (edge && rng() > density) raster.shift(x, y, -1, ramps.book);
      }
    }
  }

  applyContactShadow(raster, mask, ramps.book, { dx: 0, dy: 1, strength: 1, depth: 2 });
}

// ---------------------------------------------------------------------------
// Ears.
// ---------------------------------------------------------------------------

const EAR_MID: number[][] = [
  [0, 3, 3, 4],
  [3, 4, 5, 4],
  [3, 5, 6, 5],
  [3, 5, 6, 4],
  [3, 4, 5, 4],
  [0, 3, 4, 4],
  [0, 3, 4, 0],
  [0, 0, 4, 0],
];

const EAR_LARGE: number[][] = [
  [0, 3, 3, 3, 4],
  [3, 4, 4, 5, 4],
  [3, 4, 6, 6, 5],
  [3, 5, 6, 6, 5],
  [3, 5, 6, 5, 4],
  [3, 4, 5, 4, 4],
  [0, 3, 4, 4, 4],
  [0, 3, 4, 5, 0],
  [0, 0, 4, 4, 0],
  [0, 0, 0, 4, 0],
];

/**
 * The far ear, seen edge-on in three-quarter view: a helix rim catching the
 * light, a shadowed bowl, an antihelix glint, a lobe. `x` is the head's
 * silhouette column; the ear grows outward and downward with size.
 */
export function drawEarSprite(
  raster: Raster, ramps: PortraitRamps, x: number, y: number, size: number
): void {
  if (size <= 0) return;
  const skin = ramps.skin;
  const put = (dx: number, dy: number, sh: number) =>
    raster.set(x + dx, y + dy, skin.steps[sh], MAT.SKIN, sh);
  if (size === 1) {
    put(-1, 0, 3); put(0, 0, 4);
    put(-1, 1, 4); put(0, 1, 6);
    put(-1, 2, 4); put(0, 2, 5);
    put(0, 3, 4);
    return;
  }
  const grid = size >= 3 ? EAR_LARGE : EAR_MID;
  const wOff = grid[0].length - 1;
  grid.forEach((row, dy) => row.forEach((sh, i) => {
    if (sh) put(i - wOff, dy, sh);
  }));
  // The antihelix catches one glint of the key light.
  put(-(wOff - 1), 1, 2);
}

// ---------------------------------------------------------------------------
// Hands.
// ---------------------------------------------------------------------------

/**
 * The hand's structure: a full relaxed mitt at the mockups' scale — wrist
 * tapering into a broad palm, fingers hanging as one mass that scallops
 * into knuckle bumps at the bottom, a real two-column thumb (3) lying
 * along the body side, and groove hints (2) only where the knuckles part.
 * Authored for the near hand, mirrored for the far one.
 */
const HAND_SHAPE: number[][] = [
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 3],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 2, 1, 1, 2, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0],
];

/**
 * A hand at the size a hand actually is against this body — roughly a
 * head-height's third, not a bead. One smooth turn from lit knuckle crown
 * to shadowed edge, scalloped fingertips turning under, the thumb reading
 * as its own plane. The ink pass supplies the outline. Light stays on the
 * viewer's left whichever arm it hangs from.
 */
export function drawHandSprite(
  raster: Raster, ramps: PortraitRamps, x: number, y: number, side: -1 | 1 = -1
): void {
  const skin = ramps.skin;
  const W = HAND_SHAPE[0].length;
  for (let dy = 0; dy < HAND_SHAPE.length; dy += 1) {
    for (let dx = 0; dx < W; dx += 1) {
      const cell = HAND_SHAPE[dy][side === -1 ? dx : W - 1 - dx];
      if (!cell) continue;
      const px = x - 5 + dx;
      const py = y + dy;
      let sh = dx <= 2 && dy <= 6 ? 2 : dx >= W - 3 || dy >= 8 ? 4 : 3;
      if (cell === 2) sh = 5;
      if (cell === 3) sh = dx >= W - 2 ? 4 : 3;
      if (dy >= 10) sh = Math.min(6, sh + 1);
      raster.set(px, py, skin.steps[sh], MAT.SKIN, sh);
    }
  }
  // The knuckle crown catches the light across the palm's top.
  for (const dx of [-3, -2, -1, 0, 1]) {
    if (raster.matAt(x + dx, y + 1) === MAT.SKIN) {
      raster.set(x + dx, y + 1, skin.steps[2], MAT.SKIN, 2);
    }
  }
  // The sleeve above casts onto the wrist.
  for (let dx = -5; dx <= 5; dx += 1) {
    if (raster.matAt(x + dx, y) === MAT.SKIN) raster.shift(x + dx, y, 1, ramps.book);
  }
}

// ---------------------------------------------------------------------------
// Cloth voices and the broad light.
// ---------------------------------------------------------------------------

const CLOTH_MATS = new Set<number>([MAT.CLOTH_A, MAT.CLOTH_B, MAT.CLOTH_C]);

interface FabricVoice {
  /** One dark speckle per this many pixels. */
  darkEvery: number;
  lightEvery: number;
  /** Dark speckles bring a neighbor along — fur clumps, knit ribs. */
  clump: boolean;
}

/** What the cloth is, read from its material name. One voice per fabric. */
function fabricVoice(material: string): FabricVoice {
  const m = material.toLowerCase();
  if (/fur|hide|pelt|fleece|sheepskin|bearskin|shag/.test(m)) return { darkEvery: 7, lightEvery: 11, clump: true };
  if (/wool|felt|tweed|homespun|kersey|frieze/.test(m)) return { darkEvery: 11, lightEvery: 17, clump: true };
  if (/silk|satin|damask|taffeta|velvet|brocade/.test(m)) return { darkEvery: 43, lightEvery: 13, clump: false };
  if (/linen|hemp|cotton|flax|muslin|calico|ramie|bark/.test(m)) return { darkEvery: 23, lightEvery: 31, clump: false };
  return { darkEvery: 15, lightEvery: 23, clump: false };
}

/**
 * The one texture system: a single material-aware mottle. Fur clumps, wool
 * ribs, linen breathes, silk keeps its counsel and catches light instead.
 */
export function materialTexture(
  raster: Raster, mask: Mask, book: RampBook, material: string, seed: number, amount = 1
): void {
  if (amount <= 0) return;
  // Half the old density: texture seasons the cloth as a quiet motif — the
  // broad light bands do the modelling, and dense mottle read as static.
  const voice = fabricVoice(material);
  const darkEvery = Math.max(8, Math.round((voice.darkEvery * 2) / amount));
  const lightEvery = Math.max(10, Math.round((voice.lightEvery * 2) / amount));
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!mask[y * SPRITE_W + x]) continue;
      if (!CLOTH_MATS.has(raster.matAt(x, y))) continue;
      const hash = (x * 2246822519 + y * 3266489917 + seed) >>> 0;
      if (hash % darkEvery === 0) {
        raster.shift(x, y, 1, book);
        if (voice.clump && (hash >> 8) % 3 === 0 && mask[y * SPRITE_W + x + 1]) {
          raster.shift(x + 1, y, 1, book);
        }
      } else if (hash % lightEvery === 1) {
        raster.shift(x, y, -1, book);
      }
    }
  }
}

/**
 * The broad read: a lit side and a shadow side. The reference figure is lit
 * from the upper left — the near side — with a wide core shadow falling down
 * the receding, facing side. Bands, not gradients: this is pixel art.
 */
export function formLight(
  raster: Raster, mask: Mask, book: RampBook, dir = 0, strength = 1
): void {
  if (strength <= 0) return;
  const bias = dir * 0.07;
  const litEnd = 0.1 + bias + (strength - 1) * 0.05;
  const litFade = 0.26 + bias + (strength - 1) * 0.06;
  const shadeStart = 0.68 + bias - (strength - 1) * 0.06;
  const shadeFull = 0.9 + bias - (strength - 1) * 0.05;
  for (let y = 0; y < SPRITE_H; y += 1) {
    let minX = -1;
    let maxX = -1;
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (mask[y * SPRITE_W + x]) {
        if (minX < 0) minX = x;
        maxX = x;
      }
    }
    if (minX < 0 || maxX - minX < 12) continue;
    for (let x = minX; x <= maxX; x += 1) {
      if (!mask[y * SPRITE_W + x]) continue;
      if (!CLOTH_MATS.has(raster.matAt(x, y))) continue;
      const u = (x - minX) / (maxX - minX);
      const d = dispersed(x, y);
      if (u < litEnd || (u < litFade && d > (u - litEnd) * 5.5)) {
        raster.shift(x, y, -1, book);
        if (strength >= 3 && u < litEnd * 0.5) raster.shift(x, y, -1, book);
      } else if (u > shadeFull || (u > shadeStart && d < (u - shadeStart) * 4)) {
        raster.shift(x, y, 1, book);
        if (strength >= 3 && u > (1 + shadeFull) / 2) raster.shift(x, y, 1, book);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Light: everything that anchors the figure in the scene.
// ---------------------------------------------------------------------------

/** Warm light kicked up from the lit ground onto the lowest edges. */
export function groundBounce(raster: Raster, book: RampBook): void {
  const floor = Math.round(SPRITE_H * 0.7);
  for (let y = floor; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      const i = y * SPRITE_W + x;
      if (raster.data[i * 4 + 3] === 0) continue;
      const below = y + 1 >= SPRITE_H || raster.data[(i + SPRITE_W) * 4 + 3] === 0;
      if (below) raster.shift(x, y, -1, book);
    }
  }
}
