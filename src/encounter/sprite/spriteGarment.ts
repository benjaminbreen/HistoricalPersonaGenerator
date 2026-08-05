/**
 * encounter/sprite/spriteGarment.ts
 *
 * What the figure's clothing is, drawn at full length.
 *
 * The bust has had this for a while: a table of named garment features — a
 * sari's pallu, a suit's lapels, an apron's bib — and a set of marks a place
 * and period puts on cloth whatever the item is called. The sprite had none of
 * it, so a persona's card carried two pictures that disagreed: lapels above,
 * a plain buttoned front below; clavi on the shoulders in one and not the
 * other. The card prints the garment's name in words beside both.
 *
 * Both verdicts now come off the spec (`spec/garmentConstruction.ts`), so this
 * file only draws. It is not a copy of the bust's drawing and should not become
 * one — a lapel at bust crop is fifteen pixels of notch and a lapel here is
 * three, and the whole figure below the ribs is visible to this renderer and
 * invisible to that one.
 *
 * Values, not colours. `resolveLight` re-resolves every lit material off the
 * ramp book, so writing a colour onto CLOTH_A does nothing; what shows is
 * either a *different* material — CLOTH_B for a facing, CLOTH_C for trim,
 * METAL for a fitting — or a push along the cloth's own ramp with
 * `form.addBias`. Both are used below, and mixing them up is silent.
 */

import { MAT, Mask, Raster } from '../../components/portraitLab/core/raster';
import { PortraitSpec } from '../../components/portraitLab/spec/types';
import { ContextMark } from '../../components/portraitLab/spec/garmentConstruction';
import { PortraitRamps } from '../../components/portraitLab/art/palette';
import { FormBuffer } from './spriteLight';
import { Skeleton } from './skeleton';
import { SPRITE_H, SPRITE_W } from './spriteArt';

/** The bits of the garment plan this file needs, so it can be called from anywhere. */
export interface GarmentSurfaceInfo {
  bare: boolean;
  /** Where the upper covering ends. */
  topHemY: number;
  hemY: number;
  /** Centre-front of the barrel, already swung by the figure's turn. */
  frontX: number;
}

type Paint = (x: number, y: number, mat: number, step: number, bias: number) => void;

/**
 * Paint one pixel of a named material onto the garment, where there is garment.
 *
 * The step index is written as well as the bias because the ink and outline
 * passes read the material index, not the colour — a metal button has to *be*
 * metal there or it is drawn as a fold in the cloth.
 */
function painter(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, m: Mask
): Paint {
  return (x, y, mat, step, bias) => {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= SPRITE_W || py >= SPRITE_H) return;
    if (!m[py * SPRITE_W + px]) return;
    const ramp = ramps.book[mat];
    if (ramp) raster.set(px, py, ramp.steps[Math.max(0, Math.min(6, Math.round(step)))], mat, step);
    if (bias !== 0) form.addBias(px, py, bias);
  };
}

// ---------------------------------------------------------------------------
// Context marks
// ---------------------------------------------------------------------------

/**
 * The marks a context pack puts on the cloth.
 *
 * Every one of these is drawn against the *torso mask*, so it stops where the
 * cloth stops and follows the figure's turn — a band drawn down the middle of
 * the silhouette on a three-quarter figure contradicts every other cue in the
 * drawing.
 */
export function drawSpriteContextMarks(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, info: GarmentSurfaceInfo, m: Mask
): void {
  if (info.bare || spec.contextMarks.length === 0) return;
  const put = painter(raster, form, ramps, m);
  const top = s.shoulderY - s.t.shoulderSlope;

  for (const mark of spec.contextMarks) {
    switch (mark as ContextMark) {
      case 'clavi': {
        // The pair of woven bands from the shoulders. On the bust they run out
        // of frame at the chest; here they run the length of the garment, which
        // is what they actually did.
        const offset = Math.max(3, Math.round(s.shoulderHalf * 0.42));
        for (const side of [-1, 1] as const) {
          const x = info.frontX + side * offset;
          for (let y = top + 1; y <= info.hemY; y += 1) {
            put(x, y, MAT.CLOTH_C, 2, -0.6);
            put(x + 1, y, MAT.CLOTH_C, 4, 0.8);
          }
        }
        break;
      }

      case 'strip_seams': {
        // Cloth built from narrow woven strips: vertical seams at a regular
        // pitch, and the pitch is the signature. A bias rather than a material,
        // because a seam is the same cloth folded, not a different cloth.
        const pitch = Math.max(4, Math.round(s.shoulderHalf * 0.3));
        for (let x = info.frontX - s.shoulderHalf; x <= info.frontX + s.shoulderHalf; x += 1) {
          if (((x - info.frontX) % pitch + pitch) % pitch !== 0) continue;
          for (let y = top; y <= info.hemY; y += 1) {
            if (x < 0 || x >= SPRITE_W || !m[y * SPRITE_W + x]) continue;
            form.addBias(x, y, 1);
          }
        }
        break;
      }

      case 'kerchief': {
        // Folded across the chest and tucked in: a triangle with its point at
        // the waist, in the second cloth.
        const depth = Math.max(4, Math.round((s.waistY - s.shoulderY) * 0.62));
        for (let i = 0; i < depth; i += 1) {
          const y = top + 1 + i;
          const half = Math.round(s.shoulderHalf * (0.9 - (i / depth) * 0.55));
          for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
            const edge = Math.abs(Math.abs(x - info.frontX) - half) < 1;
            put(x, y, MAT.CLOTH_B, edge ? 4 : 2, edge ? 1 : -0.5);
          }
        }
        break;
      }

      case 'neckcloth': {
        // A band of linen at the throat, showing in the coat's opening.
        const half = Math.max(2, Math.round(s.t.neckW / 2));
        for (let y = top; y < top + 4; y += 1) {
          for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
            put(x, y, MAT.CLOTH_B, y === top ? 2 : 3, y === top ? -0.8 : 0);
          }
        }
        break;
      }

      case 'coat_buttons': {
        const from = top + 4;
        const span = Math.max(6, info.hemY - from);
        const count = Math.min(6, Math.max(3, Math.round(span / 7)));
        for (let i = 0; i < count; i += 1) {
          const y = from + Math.round((i + 0.5) * span / count);
          put(info.frontX + 1, y, MAT.METAL, 1, -1.2);
          put(info.frontX + 2, y, MAT.METAL, 4, 0.6);
        }
        break;
      }

      case 'cross_band': {
        // Right panel over left: two bands meeting at the throat and running
        // down and apart. The construction, not an ornament — it is why a robe
        // from this half of the world does not look like a dressing gown.
        const depth = Math.max(5, Math.round((s.chestY - s.shoulderY) + 6));
        for (let i = 0; i < depth; i += 1) {
          const y = top + i;
          const spread = Math.round(s.shoulderHalf * 0.28 * (i / depth));
          for (let w = 0; w < 3; w += 1) {
            put(info.frontX - 1 - spread + w, y, MAT.CLOTH_B, w === 2 ? 4 : 2, w === 2 ? 0.7 : -0.5);
            put(info.frontX + 1 + spread - w, y, MAT.CLOTH_B, w === 2 ? 4 : 2, w === 2 ? 0.7 : -0.5);
          }
        }
        break;
      }

      case 'front_panel': {
        for (let y = s.chestY; y <= Math.min(info.hemY, s.waistY + 4); y += 1) {
          for (let w = -1; w <= 1; w += 1) {
            put(info.frontX + w, y, MAT.CLOTH_C, w === 1 ? 4 : 2, w === 1 ? 0.8 : -0.6);
          }
        }
        break;
      }

      case 'neck_panel': {
        // Embroidery worked around the opening, chequered so it reads as
        // stitching rather than as a second collar.
        const half = Math.max(3, Math.round(s.t.neckW / 2) + 2);
        for (let i = 0; i < 6; i += 1) {
          const y = top + 1 + i;
          const w = half - Math.abs(i - 3);
          for (let x = info.frontX - w; x <= info.frontX + w; x += 1) {
            if ((x + y) % 2 !== 0) continue;
            put(x, y, MAT.CLOTH_C, 3, -0.5);
          }
        }
        break;
      }

      case 'side_closure': {
        // A jama ties to one side, so the closure crosses the chest on a
        // diagonal and ends under the arm.
        const steps = Math.max(6, Math.round(s.waistY - s.shoulderY));
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const x = info.frontX + Math.round(t * s.shoulderHalf * 0.8);
          const y = top + i;
          put(x, y, MAT.CLOTH_B, 2, -0.6);
          put(x + 1, y, MAT.CLOTH_B, 4, 0.8);
        }
        break;
      }

      case 'closure_studs': {
        const steps = Math.max(6, Math.round(s.waistY - s.shoulderY));
        for (let i = 0; i <= steps; i += 4) {
          const t = i / steps;
          put(info.frontX + Math.round(t * s.shoulderHalf * 0.8) + 2, top + i, MAT.METAL, 1, -1);
        }
        break;
      }

      case 'front_opening': {
        // Two cut edges meeting at the centre with nothing sewn over them. The
        // absence is the point: a band or a row of buttons here would make it a
        // European coat, which is what these jackets used to be drawn as.
        for (let y = top + 2; y <= info.topHemY; y += 1) {
          form.addBias(info.frontX - 1, y, -1);
          form.addBias(info.frontX, y, 2);
          form.addBias(info.frontX + 1, y, 1);
        }
        break;
      }

      case 'collarless_band': {
        // The opening is bound with a narrow strip of its own cloth and stops
        // there — no collar stands on it, which is what separates this from
        // every European shirt of the same centuries.
        //
        // Followed off the cloth's own topmost row per column rather than drawn
        // at a fixed height: the shoulder slopes, and a straight band across it
        // sits in mid-air at the outside and inside the throat at the middle.
        const half = Math.max(3, Math.round(s.t.neckW / 2) + 3);
        for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
          if (x < 0 || x >= SPRITE_W) continue;
          let edge = -1;
          for (let y = Math.max(0, top - 2); y < s.chestY; y += 1) {
            if (m[y * SPRITE_W + x]) { edge = y; break; }
          }
          if (edge < 0) continue;
          form.addBias(x, edge, -1.4);
          form.addBias(x, edge + 1, 1.8);
          form.addBias(x, edge + 2, 0.6);
        }
        break;
      }

      case 'mantle': {
        // Folded over the left shoulder and hanging: a second cloth down one
        // side of the figure, widening as it falls.
        const side = -1;
        for (let y = top; y <= info.hemY; y += 1) {
          const t = Math.min(1, (y - top) / Math.max(1, s.waistY - top));
          const from = Math.round(s.shoulderHalf * 0.95);
          const to = Math.round(s.shoulderHalf * (0.25 - t * 0.35));
          for (let d = to; d <= from; d += 1) {
            const x = info.frontX + side * d;
            put(x, y, MAT.CLOTH_B, 3, d === to ? 1.4 : 0);
          }
        }
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Surface decoration
// ---------------------------------------------------------------------------

/**
 * How the cloth is decorated, as distinct from what it is cut into.
 *
 * `spec.garment.surfaces` has been on the spec for a while and the sprite read
 * none of it: a persona whose portrait showed a printed cotton in two colours
 * had a plain field of one colour in the figure beside it. The bust's version
 * is `art/garmentSurface.ts`; this is the same seven treatments at a third of
 * the scale, which mostly means smaller pitches and fewer pixels per motif.
 *
 * The field treatments (print, stripe, brocade) go over the whole trunk. The
 * edge treatments (embroidery, lace, beading, fur) go round the opening, which
 * is where they are on a real garment and the only place they read at this
 * size — a lace hem at 96px is one row of speckle and says nothing.
 */
export function drawSpriteSurfaces(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, info: GarmentSurfaceInfo, m: Mask
): void {
  if (info.bare || !spec.garment.surfaces.length) return;
  const put = painter(raster, form, ramps, m);
  const top = s.shoulderY - s.t.shoulderSlope;

  /** Only over cloth the garment itself is painted in — never over a feature. */
  const onGround = (x: number, y: number) => {
    const mat = raster.matAt(x, y);
    return mat === MAT.CLOTH_A || mat === MAT.CLOTH_B;
  };

  /** The top edge of the cloth per column, which is where an opening is. */
  const edgeAt = (x: number): number => {
    for (let y = Math.max(0, top - 2); y < s.waistY; y += 1) {
      if (m[y * SPRITE_W + x]) return y;
    }
    return -1;
  };

  for (const surface of spec.garment.surfaces) {
    const dense = surface.intensity > 0.5;
    const metallic = /gold|gilt|silver/.test(surface.material);

    switch (surface.kind) {
      case 'print': {
        // A repeating motif, staggered row to row. Four pixels is the smallest
        // thing that still has a shape rather than being a speck.
        const pitchX = dense ? 5 : 7;
        const pitchY = dense ? 5 : 6;
        for (let cy = top + 2; cy <= info.hemY; cy += pitchY) {
          const stagger = (((cy - top) / pitchY) | 0) % 2 ? (pitchX >> 1) : 0;
          for (let cx = stagger; cx < SPRITE_W; cx += pitchX) {
            for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0]] as const) {
              const x = cx + dx;
              const y = cy + dy;
              if (!onGround(x, y)) continue;
              put(x, y, MAT.CLOTH_C, dy < 0 || dx < 0 ? 2 : 4, dx > 0 ? 0.6 : -0.6);
            }
          }
        }
        break;
      }

      case 'stripe': {
        // Vertical, because that is how cloth is woven and how it hangs.
        const pitch = dense ? 4 : 6;
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (((x - info.frontX) % pitch + pitch) % pitch !== 0) continue;
          for (let y = top; y <= info.hemY; y += 1) {
            if (!onGround(x, y)) continue;
            put(x, y, MAT.CLOTH_C, 3, -0.5);
          }
        }
        break;
      }

      case 'brocade': {
        // A diaper lattice: a centre and its four points, offset row to row so
        // it reads as figured weave rather than as a grid.
        const pitchX = 4;
        const pitchY = 4;
        for (let y = top; y <= info.hemY; y += 1) {
          for (let x = 0; x < SPRITE_W; x += 1) {
            if (!onGround(x, y)) continue;
            const row = Math.floor(y / pitchY);
            const ox = (x + (row % 2 ? pitchX >> 1 : 0)) % pitchX;
            const oy = y % pitchY;
            if (ox !== 0 || oy !== 0) continue;
            // Cloth of gold is actually metal, so it takes the metal's own
            // colour rather than a step of the garment's third cloth.
            if (metallic && dense) put(x, y, MAT.METAL, 1, -1.2);
            else put(x, y, MAT.CLOTH_C, 2, -0.8);
          }
        }
        break;
      }

      case 'embroidery': {
        // Stitched round the opening, chequered so it reads as thread.
        const half = Math.max(4, Math.round(s.shoulderHalf * 0.6));
        for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
          if (x < 0 || x >= SPRITE_W) continue;
          const edge = edgeAt(x);
          if (edge < 0) continue;
          for (let i = 0; i < (dense ? 3 : 2); i += 1) {
            if ((x + i) % 2 !== 0) continue;
            put(x, edge + i, metallic ? MAT.METAL : MAT.CLOTH_C, metallic ? 1 : 2, -0.8);
          }
        }
        break;
      }

      case 'lace': {
        // A fringe, which is cloth with holes in it: alternate columns light,
        // and a broken line under them where the ground shows through.
        const half = Math.max(4, Math.round(s.shoulderHalf * 0.7));
        for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
          if (x < 0 || x >= SPRITE_W) continue;
          const edge = edgeAt(x);
          if (edge < 0) continue;
          put(x, edge, MAT.CLOTH_B, 1, -1.4);
          if ((x & 1) === 0) put(x, edge + 1, MAT.CLOTH_B, 2, -0.8);
          else form.addBias(x, edge + 1, 1.2);
        }
        break;
      }

      case 'beading': {
        // Beads are objects, not cloth, so they take an unlit material and keep
        // the colour written here — `resolveLight` would throw away a cloth one.
        const ramp = ramps.book[MAT.GEM];
        const half = Math.max(4, Math.round(s.shoulderHalf * 0.62));
        for (let x = info.frontX - half; x <= info.frontX + half; x += 2) {
          if (x < 0 || x >= SPRITE_W) continue;
          const edge = edgeAt(x);
          if (edge < 0 || !ramp) continue;
          for (let i = 0; i < (dense ? 2 : 1); i += 1) {
            const y = edge + i * 2;
            if (!m[y * SPRITE_W + x]) continue;
            raster.set(x, y, ramp.steps[1], MAT.GEM, 1);
            form.set(x, y, 0, -0.4, 0.85, 0.64);
            form.addBias(x + 1, y + 1, 1.2);
          }
        }
        break;
      }

      case 'furTrim': {
        // A physical thickness with a broken edge — the same reasoning as the
        // fur collar feature, and deliberately the same look.
        const half = Math.max(4, Math.round(s.shoulderHalf * 0.85));
        for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
          if (x < 0 || x >= SPRITE_W) continue;
          const edge = edgeAt(x);
          if (edge < 0) continue;
          const depth = 3 + ((x * 5 + spec.seed) % 3);
          for (let i = 0; i < depth; i += 1) {
            put(x, edge + i, MAT.CLOTH_B, i === depth - 1 ? 5 : 2, i === depth - 1 ? 1.4 : -0.7);
          }
        }
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Named garment features
// ---------------------------------------------------------------------------

/**
 * The features that are worth drawing on a whole figure.
 *
 * Not all twenty-three of the bust's. Several of them — a ruff, a fur collar, a
 * broad collar — are entirely at the throat, which this renderer already draws
 * through the neckline it takes from the same feature key; drawing them twice
 * would be drawing them wrong. What is here is what the *body* of the garment
 * shows: a bib, a pallu over the shoulder, frog closures down a chest, the cut
 * of a poncho.
 */
export function drawSpriteFeature(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, info: GarmentSurfaceInfo, m: Mask
): void {
  const feature = spec.garment.feature;
  if (!feature || info.bare) return;
  const put = painter(raster, form, ramps, m);
  const top = s.shoulderY - s.t.shoulderSlope;

  switch (feature.key) {
    case 'bib':
    case 'apron': {
      /**
       * Drawn inside out, the way the bust draws it: the bib keeps the
       * garment's own cloth and everything around it becomes the shirt
       * underneath. A bib is not a panel added to a chest — it is the part of
       * the chest the overalls still cover.
       */
      const overalls = feature.key === 'bib';
      const half = Math.max(3, Math.round(s.shoulderHalf * 0.5));
      const bibTop = s.chestY - 1;
      // An apron's strings meet at the neck; overalls' straps sit wide and
      // clip on, which is the whole difference between the two in silhouette.
      const strapAt = overalls
        ? Math.round(s.shoulderHalf * 0.55)
        : Math.max(2, Math.round(s.t.neckW / 2) + 1);
      const strapHalf = overalls ? 2 : 1;
      // An apron covers the front only and stops at the hem of the skirt; a
      // pair of overalls is the whole garment.
      const bibBot = overalls ? info.hemY : Math.round(s.hipY + (info.hemY - s.hipY) * 0.75);

      for (let y = top; y <= bibBot; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (!m[y * SPRITE_W + x]) continue;
          const dx = x - info.frontX;
          let covered: boolean;
          if (y >= bibTop) {
            covered = Math.abs(dx) <= half;
          } else {
            // The strap climbs outward as it rises, so it crosses the shoulder
            // instead of running up the middle of the chest like a brace.
            const t = (bibTop - y) / Math.max(1, bibTop - top);
            const at = half - (half - strapAt) * t;
            covered = Math.abs(Math.abs(dx) - at) <= strapHalf;
          }
          if (covered) continue;
          put(x, y, MAT.CLOTH_B, 3, 0);
        }
      }
      // The bib's own edge, which is what stops it reading as a colour block.
      for (let y = bibTop; y <= bibBot; y += 1) {
        for (const side of [-1, 1] as const) {
          form.addBias(info.frontX + side * half, y, -0.8);
          form.addBias(info.frontX + side * (half - 1), y, 1.2);
        }
      }
      for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
        form.addBias(x, bibTop, -1);
      }
      if (overalls) {
        // Two buckles where the straps meet the bib. Three pixels of metal is
        // what says work clothes.
        for (const side of [-1, 1] as const) {
          put(info.frontX + side * (half - 1), bibTop + 1, MAT.METAL, 1, -1.2);
          put(info.frontX + side * (half - 1), bibTop + 2, MAT.METAL, 4, 0.6);
        }
      } else {
        // The waist tape, and the gathers hanging off it: what makes the panel
        // read as tied on rather than sewn to the garment.
        const tapeY = s.waistY;
        for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
          form.addBias(x, tapeY, -1);
          form.addBias(x, tapeY + 1, 1.4);
        }
      }
      break;
    }

    case 'pallu': {
      // The loose end of a sari, over one shoulder and down the back. At bust
      // crop it is a diagonal across the chest; on a whole figure it is a fall
      // of cloth the length of the body, which is what it actually is.
      const side = s.nearSide;
      const topX = info.frontX + side * Math.round(s.shoulderHalf * 0.55);
      for (let y = top; y <= info.hemY; y += 1) {
        const t = Math.min(1, (y - top) / Math.max(1, info.hemY - top));
        const x0 = Math.round(topX + side * t * s.shoulderHalf * 0.35);
        const w = Math.max(3, Math.round(s.shoulderHalf * (0.32 + t * 0.2)));
        for (let d = 0; d < w; d += 1) {
          const x = x0 - side * d;
          put(x, y, MAT.CLOTH_C, d === 0 ? 2 : 3, d === 0 ? -1 : d === w - 1 ? 1 : 0);
        }
      }
      break;
    }

    case 'frogs': {
      // Braided toggle closures down the chest, and the standing collar they
      // start under. Small metal-free knots — the loop is cloth, so it reads as
      // a value step rather than as a fitting.
      const from = top + 3;
      const span = Math.max(6, s.waistY - from);
      for (let i = 0; i < 4; i += 1) {
        const y = from + Math.round((i + 0.5) * span / 4);
        for (let d = 0; d <= 3; d += 1) {
          put(info.frontX + d, y, MAT.CLOTH_C, d === 3 ? 4 : 2, d === 3 ? 0.8 : -0.8);
        }
      }
      break;
    }

    case 'poncho': {
      // One cloth with a hole for the head, so it has no armscye and no side
      // seam: the edge is a straight fall from the shoulder point, and the
      // whole recognition is that the arm disappears behind it.
      for (const side of [-1, 1] as const) {
        const x = info.frontX + side * Math.round(s.shoulderHalf * 0.92);
        for (let y = top + 2; y <= Math.min(info.hemY, s.hipY); y += 1) {
          form.addBias(x, y, 1.6);
          form.addBias(x - side, y, -0.6);
        }
      }
      break;
    }

    case 'strip_weave': {
      // Woven in narrow bands and sewn edge to edge, like `strip_seams` but
      // read off the item's own name rather than off where it was made.
      const pitch = Math.max(4, Math.round(s.shoulderHalf * 0.34));
      for (let x = info.frontX - s.shoulderHalf; x <= info.frontX + s.shoulderHalf; x += 1) {
        if (((x - info.frontX) % pitch + pitch) % pitch !== 0) continue;
        for (let y = top; y <= info.hemY; y += 1) {
          if (x < 0 || x >= SPRITE_W || !m[y * SPRITE_W + x]) continue;
          form.addBias(x, y, 1.2);
        }
      }
      break;
    }

    case 'tee':
    case 'knit': {
      /**
       * A ribbed crew neck, which is the whole of what these two garments have
       * at the throat — no collar, no opening, no facing. The bust draws three
       * rows of alternating value; at this scale it is two, and the alternation
       * is what keeps it from reading as a drawn-on line.
       *
       * Worth drawing precisely because it is so nearly nothing. A t-shirt with
       * a seam down the front is a button-down, and a t-shirt with no rib at
       * all is a hole cut in cloth.
       */
      const half = Math.max(3, Math.round(s.t.neckW / 2) + 2);
      for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
        if (x < 0 || x >= SPRITE_W) continue;
        let edge = -1;
        for (let y = Math.max(0, top - 2); y < s.chestY; y += 1) {
          if (m[y * SPRITE_W + x]) { edge = y; break; }
        }
        if (edge < 0) continue;
        form.addBias(x, edge, (x & 1) === 0 ? -1.3 : 0.4);
        form.addBias(x, edge + 1, (x & 1) === 0 ? 0.5 : 1.5);
      }
      // A jumper is ribbed at the hem too, and that is what tells it from a
      // t-shirt in silhouette: the cloth is gathered in rather than hanging.
      if (feature.key === 'knit') {
        for (let x = 0; x < SPRITE_W; x += 1) {
          for (let i = 0; i < 2; i += 1) {
            const y = info.hemY - i;
            if (y < 0 || !m[y * SPRITE_W + x]) continue;
            form.addBias(x, y, (x & 1) === 0 ? 1.4 : -0.5);
          }
        }
      }
      break;
    }

    case 'placket': {
      /**
       * A buttoned front opening: the largest feature group in the app — a
       * quarter of everyone — and the figure showed none of it. The neckline
       * pass gives it a turned collar and then the whole body below was blank
       * cloth, so a shirt, a blouse, a work coat and an anorak were one picture.
       *
       * A jacket and a shirt are drawn differently on purpose, and the
       * difference is the same one the bust makes: a shirt has a *band* sewn
       * down the centre, standing proud of the cloth either side of it; a
       * jacket has no band at all, just the edge where one front laps over the
       * other, and its buttons are objects rather than stitches.
       */
      const name = spec.garment.name.toLowerCase();
      const outer = /jacket|coat|windbreaker|anorak|slicker|oilskin/.test(name);
      const from = top + 3;
      // A coat is buttoned to the hem; a shirt is tucked in, so its placket
      // stops where the garment does.
      const to = Math.min(info.hemY - 1, outer ? info.hemY - 1 : info.topHemY - 1);
      if (to <= from) break;

      if (outer) {
        for (let y = from; y <= to; y += 1) {
          form.addBias(info.frontX, y, -1);
          form.addBias(info.frontX + 1, y, 1.5);
        }
      } else {
        for (let y = from; y <= to; y += 1) {
          form.addBias(info.frontX - 1, y, -1.2);
          form.addBias(info.frontX + 2, y, 1.5);
        }
      }

      const span = to - from;
      const count = Math.max(3, Math.min(7, Math.round(span / 6)));
      for (let i = 0; i < count; i += 1) {
        const y = from + Math.round((i + 0.5) * span / count);
        if (outer && spec.garment.ornament > 0.2) {
          // A coat button is a visible object, not a stitch of the cloth.
          put(info.frontX, y, MAT.METAL, 1, -1.4);
          put(info.frontX + 1, y, MAT.METAL, 4, 0.8);
        } else {
          form.addBias(info.frontX, y, -1.4);
          form.addBias(info.frontX + 1, y, 1.6);
        }
      }

      // A patch pocket at the chest, which is what a work shirt has and a
      // dress shirt does not, and is legible at this size where a cuff is not.
      if (!outer && /work|chambray|denim|utility|bush/.test(name)) {
        const px = info.frontX - Math.round(s.shoulderHalf * 0.55);
        const w = Math.max(3, Math.round(s.shoulderHalf * 0.32));
        const h = Math.max(3, Math.round(w * 0.9));
        for (let y = s.chestY - 1; y < s.chestY - 1 + h; y += 1) {
          for (let x = px; x < px + w; x += 1) {
            const edge = x === px || x === px + w - 1 || y === s.chestY - 1 + h - 1;
            form.addBias(x, y, edge ? 1.3 : 0);
          }
        }
        for (let x = px; x < px + w; x += 1) form.addBias(x, s.chestY - 2, -1);
      }
      break;
    }

    case 'wrapped_edge':
    case 'hide_edge': {
      /**
       * A length of cloth taken round the body and over one shoulder — the
       * largest single group in the whole table, and the sprite drew every one
       * of them as a plain shirt.
       *
       * What makes it read is the *edge*: uncut cloth has a selvedge, and a
       * hide has a torn one, and either way the eye follows a border running
       * diagonally across the body where a sewn garment would have a seam or
       * nothing at all. The border is drawn along the cloth's own outer edge
       * rather than at a fixed offset, so it follows the drape.
       */
      const hide = feature.key === 'hide_edge';
      const side = s.nearSide;
      const steps = Math.max(8, info.hemY - top);
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        // From the shoulder down across the chest to the far hip.
        const x = info.frontX + side * Math.round((0.7 - t * 1.25) * s.shoulderHalf);
        const y = top + i;
        // A hide is torn, so its edge wanders; a woven selvedge is straight.
        const wobble = hide ? ((i * 7) % 3) - 1 : 0;
        for (let d = 0; d < (hide ? 2 : 3); d += 1) {
          put(x + wobble + d, y, MAT.CLOTH_C, d === 0 ? 2 : 4, d === 0 ? -0.9 : 0.7);
        }
      }
      break;
    }

    case 'fur_collar': {
      // Fur round the neck and over the shoulders. Its whole signature is that
      // the edge is broken — a fur border with a clean line is a felt one — so
      // the depth is jittered per column off the seed rather than being a band.
      const half = Math.round(s.shoulderHalf * 0.85);
      for (let x = info.frontX - half; x <= info.frontX + half; x += 1) {
        const depth = 4 + ((x * 5 + spec.seed) % 3);
        for (let i = 0; i < depth; i += 1) {
          put(x, top + i, MAT.CLOTH_B, i === depth - 1 ? 5 : 2, i === depth - 1 ? 1.4 : -0.7);
        }
      }
      break;
    }

    case 'toga': {
      // A single length of cloth wound round the body and over the left
      // shoulder: the diagonal edge across the chest, and the fold of cloth
      // hanging inside it.
      const side = -1;
      const steps = Math.max(8, Math.round(s.hipY - top));
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = info.frontX - side * Math.round((0.75 - t * 0.9) * s.shoulderHalf);
        const y = top + i;
        form.addBias(x, y, 1.8);
        form.addBias(x + 1, y, -0.7);
      }
      break;
    }
  }
}
