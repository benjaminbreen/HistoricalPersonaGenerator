/**
 * portraitLab/art/hair.ts
 *
 * Hair is built as a silhouette rather than as strands. At 96px you are drawing
 * a *mass* with a lit side, a shadow side, and one specular arc following the
 * curve of the skull — the shine band is what sells hair in pixel art, and it
 * is the thing most procedural systems leave out entirely.
 *
 * Texture changes the edge, not the interior: straight hair has a clean
 * silhouette, wavy hair a rolling one, and coily and kinky hair a dense soft
 * halo whose highlight breaks into clusters instead of running as a ribbon.
 * Treating textured hair as "straight hair plus noise" is the usual failure,
 * and it is why so many generators render it as a helmet.
 */

import {
  applyContactShadow, ellipsoidShader, fillMask, MAT, Mask, makeMask,
  maskDilate, maskEllipse, maskFromProfile, maskIntersect, maskSubtract, Raster,
  sampleProfile,
} from '../core/raster';
import { makeNoise1D, makeRng, unit } from '../core/rng';
import { RenderContext } from '../render/context';
import { HairLength, HairSilhouette, HairTexture } from '../spec/types';

export interface HairMasks {
  /** Everything behind the head — drawn before the skull. */
  back: Mask;
  /** Everything in front — the cap, the fringe, the strands over the temples. */
  front: Mask;
  /** Long hair past the jaw, which lies *over* the garment rather than under. */
  overShoulder: Mask;
  /**
   * Plaits and locs, wherever they ended up. Kept separately because a braid
   * only reads as a braid if it gets its own segmentation pass — a plain filled
   * rope is indistinguishable from a lock of loose hair at this size.
   */
  braids: Mask;
  /** Buns and knots, which take their own rounded shading rather than the skull's. */
  knots: Mask;
  /** Where the hairline crosses the forehead, for headwear to sit against. */
  hairlineY: number;
}

// ---------------------------------------------------------------------------
// Arrangement
// ---------------------------------------------------------------------------

/**
 * What an arrangement does to the underlying mass, before any of it is drawn.
 *
 * Almost every style is some combination of four moves: pull the hair tighter
 * to the skull or let it stand off, gather what would otherwise fall, move the
 * hairline, and break the symmetry of the part. Getting those four right first
 * means the added shapes — knots, plaits, tails — sit on a head that is already
 * wearing the style, instead of on a loose mane with a bun balanced on top.
 */
interface StyleProfile {
  /** Multiplier on how far the hair stands off the skull. */
  puff: number;
  /** Multiplier on the mass falling past the jaw. 0 gathers all of it up. */
  fall: number;
  /** Pixels the hairline moves down over the forehead; negative pulls it back. */
  hairlineShift: number;
  /** 0 keeps the natural temple dip, 1 cuts it flat across as a fringe. */
  fringeFlat: number;
  /** Sideways bias of the parting, -1..1. Non-zero breaks the mirror. */
  sweep: number;
  /** Whether the sides are kept close, exposing the ears and jaw. */
  tight: boolean;
}

const BASE_STYLE: StyleProfile = {
  puff: 1, fall: 1, hairlineShift: 0, fringeFlat: 0, sweep: 0, tight: false,
};

function styleProfile(silhouette: HairSilhouette, seed: number): StyleProfile {
  // Which shoulder a one-sided style falls over. Seeded, so it is stable for a
  // persona but not always the same side across a page of them.
  const side = unit(seed, 'hair-side') > 0.5 ? 1 : -1;

  switch (silhouette) {
    case 'bangs':
      return { ...BASE_STYLE, hairlineShift: 4.5, fringeFlat: 0.85 };
    case 'bowl':
      return { ...BASE_STYLE, hairlineShift: 4, fringeFlat: 1, fall: 0.35, puff: 1.1 };
    case 'bob':
      return { ...BASE_STYLE, fall: 0.5, tight: true, sweep: side * 0.35 };
    case 'swept':
      return { ...BASE_STYLE, sweep: side, hairlineShift: 1.2, puff: 1.05 };
    case 'tied_back':
      return { ...BASE_STYLE, puff: 0.6, fall: 0.15, hairlineShift: -2, tight: true };
    case 'ponytail':
      return { ...BASE_STYLE, puff: 0.55, fall: 0, hairlineShift: -1.5, tight: true };
    case 'bun':
      return { ...BASE_STYLE, puff: 0.55, fall: 0, hairlineShift: -1.5, tight: true };
    case 'top_knot':
      return { ...BASE_STYLE, puff: 0.5, fall: 0, hairlineShift: -2.5, tight: true };
    case 'twin_buns':
      return { ...BASE_STYLE, puff: 0.6, fall: 0, hairlineShift: -1, tight: true };
    case 'updo':
      return { ...BASE_STYLE, puff: 0.7, fall: 0, hairlineShift: -2, tight: true };
    case 'braid_single':
      return { ...BASE_STYLE, puff: 0.75, fall: 0.2, hairlineShift: -1, tight: true, sweep: side * 0.4 };
    case 'braid_twin':
      return { ...BASE_STYLE, puff: 0.8, fall: 0.15, hairlineShift: 0.5 };
    case 'braid_crown':
      return { ...BASE_STYLE, puff: 0.7, fall: 0.2, hairlineShift: -0.5, tight: true };
    case 'locs':
      return { ...BASE_STYLE, puff: 1.15, fall: 0.9 };
    case 'cornrows':
      return { ...BASE_STYLE, puff: 0.35, fall: 0.2, hairlineShift: -0.5, tight: true };
    case 'afro':
      return { ...BASE_STYLE, puff: 2.6, fall: 0.25, hairlineShift: -0.5 };
    case 'tonsure':
      return { ...BASE_STYLE, puff: 0.7, fall: 0.3, hairlineShift: -1 };
    case 'shaved_sides':
      // Puffed well past the skull so the crest has somewhere to stand. The
      // carve narrows it back down, so the extra width costs nothing.
      return { ...BASE_STYLE, puff: 2.2, fall: 0.25, tight: true };
    default:
      return BASE_STYLE;
  }
}

/** Which shoulder the one-sided arrangements fall over. */
function styleSide(seed: number): -1 | 1 {
  return unit(seed, 'hair-side') > 0.5 ? 1 : -1;
}

interface LengthProfile {
  /** How far the hair stands off the skull. */
  puff: number;
  /** How far the crown rises above the skull. */
  crown: number;
  /** Bottom of the hair mass, as a y coordinate. */
  bottom: (context: RenderContext) => number;
  /** Half width at the bottom, if the hair falls past the jaw. */
  fallWidth: number;
}

const LENGTHS: Record<HairLength, LengthProfile> = {
  bald: { puff: 0.4, crown: 0, bottom: c => c.anatomy.earTopY, fallWidth: 0 },
  very_short: { puff: 1.4, crown: 1, bottom: c => c.anatomy.earTopY + 2, fallWidth: 0 },
  short: { puff: 2.2, crown: 2, bottom: c => c.anatomy.earBottomY, fallWidth: 0 },
  medium: { puff: 2.8, crown: 3, bottom: c => c.anatomy.chinY + 4, fallWidth: 0.92 },
  long: { puff: 3.2, crown: 3, bottom: c => c.anatomy.size, fallWidth: 1.06 },
  very_long: { puff: 3.6, crown: 4, bottom: c => c.anatomy.size, fallWidth: 1.2 },
};

function edgeJitter(texture: HairTexture, seed: number): (t: number, side: -1 | 1) => number {
  const noise = makeNoise1D(seed);
  switch (texture) {
    case 'wavy':
      return (t, side) => Math.sin(t * 11 + (side === 1 ? 1.7 : 0)) * 1.1 + noise(t * 6) * 0.5;
    case 'curly':
      return (t, side) => noise(t * 13 + (side === 1 ? 30 : 0)) * 1.9 + 0.6;
    case 'coily':
      return (t, side) => noise(t * 17 + (side === 1 ? 50 : 0)) * 1.1 + 1.6;
    case 'kinky':
      return (t, side) => noise(t * 21 + (side === 1 ? 70 : 0)) * 1.0 + 2.1;
    default:
      return (t, side) => noise(t * 4 + (side === 1 ? 12 : 0)) * 0.35;
  }
}

/**
 * The hairline. It dips lower over the temples than at the centre, which is why
 * a straight horizontal hairline always looks like a wig — and recession eats
 * into it from the temples inward, not from the front.
 */
function hairlineAt(context: RenderContext, dx: number, style: StyleProfile): number {
  const { anatomy, spec } = context;
  const t = Math.min(1, Math.abs(dx) / Math.max(1, anatomy.headHalfWidth));
  // A bound skull carries its hairline up with it. The vault is what the
  // binding lengthened, and a hairline left at its usual distance above the
  // brow buries the whole modification under hair — the head reads as an odd
  // hairstyle rather than as a shaped skull, which is the one thing this must
  // not do. Two thirds of the rise, so a tall bare forehead shows and the hair
  // still sits on the crown rather than being pushed off the top of it.
  const bound = anatomy.craniumRise * 0.66;
  const base = anatomy.browY - 8 - bound + spec.recession * 4 - style.hairlineShift;
  const templeDip = 3.4 * t * t;
  const recessionBump = spec.recession * 8 * Math.exp(-((t - 0.66) ** 2) / 0.09);
  // A slight widow's peak keeps the centre from reading as a straight cut.
  const peak = Math.exp(-(t ** 2) / 0.03) * 0.9;
  const natural = base + templeDip - recessionBump + peak;

  // A cut fringe overrides the natural hairline rather than adding to it: the
  // whole point of bangs is that they ignore where the hair actually grows.
  // Blending toward a flat line, instead of replacing it, keeps a fringe from
  // ending in a hard corner where it meets the temple.
  const flat = base + 0.6;
  const withFringe = natural * (1 - style.fringeFlat) + flat * style.fringeFlat;

  // A parting sits the hair lower on one side than the other. This is the
  // cheapest asymmetry in the whole portrait and one of the most effective —
  // a centred hairline is the single strongest "generated" tell.
  const sweepTilt = style.sweep * (dx / Math.max(1, anatomy.headHalfWidth)) * 2.6;
  return withFringe + sweepTilt;
}

export function computeHairMasks(context: RenderContext): HairMasks {
  const { spec, anatomy } = context;
  const { size, centerX } = anatomy;
  const lengths = LENGTHS[spec.hairLength] || LENGTHS.short;
  const style = styleProfile(spec.hairSilhouette, spec.seed);
  const hairlineY = Math.round(hairlineAt(context, 0, style));

  if (spec.hairLength === 'bald' && spec.recession > 0.85 && spec.hairSilhouette !== 'tonsure') {
    const empty = makeMask(size, size);
    return {
      back: empty,
      front: makeMask(size, size),
      overShoulder: makeMask(size, size),
      braids: makeMask(size, size),
      knots: makeMask(size, size),
      hairlineY,
    };
  }

  // A gathered arrangement pulls the mass in against the skull and shortens
  // what hangs, so the profile the silhouette is built from is the *arranged*
  // one, not the natural one.
  const profile: LengthProfile = {
    ...lengths,
    puff: lengths.puff * style.puff,
    crown: lengths.crown * (style.puff > 1 ? style.puff : 1),
    fallWidth: lengths.fallWidth,
  };

  const jitter = edgeJitter(spec.hairTexture, spec.seed ^ 0x51ed);
  const top = anatomy.headTop - profile.crown;
  const naturalBottom = lengths.bottom(context);
  // `fall` shortens the hanging mass toward the jaw rather than toward the
  // crown — gathering hair up does not shrink the cap on the head.
  const jawLine = anatomy.chinY;
  const bottom = naturalBottom > jawLine
    ? jawLine + (naturalBottom - jawLine) * style.fall
    : naturalBottom;
  const span = bottom - top;
  const headSpan = anatomy.chinY - anatomy.headTop;

  // Reuse the skull profile so the hair genuinely sits on this head, then
  // inflate it by the puff and let it fall past the jaw if it is long enough.
  const keys: Array<[number, number]> = [];
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    const y = top + t * span;
    const headT = (y - anatomy.headTop) / headSpan;
    let half: number;
    if (headT <= 1) {
      const clamped = Math.max(0, Math.min(1, headT));
      const source = anatomy.headProfile;
      let idx = 0;
      while (idx < source.length - 2 && source[idx + 1][0] < clamped) idx += 1;
      const [t0, h0] = source[idx];
      const [t1, h1] = source[idx + 1];
      const u = t1 === t0 ? 0 : (clamped - t0) / (t1 - t0);
      half = h0 + (h1 - h0) * u + profile.puff;
      // Above the crown the hair rounds over the top of the skull. On a bound
      // skull the cap has to follow the vault instead: that vault is far
      // narrower than half the head's width, so the usual figure flares the
      // hair out into a chimney standing above the head.
      if (headT < 0) {
        half = anatomy.craniumRise > 0
          ? anatomy.headProfile[0][1] * 0.95
          : anatomy.headHalfWidth * 0.55;
      }
    } else {
      // Past the jaw: hair falls, widening slightly toward the shoulders.
      const fall = Math.min(1, (headT - 1) / 0.6);
      half = anatomy.headHalfWidth * (0.94 + fall * (profile.fallWidth - 0.6));
    }
    keys.push([t, Math.max(1, half)]);
  }

  // Hair that ends inside the frame has to round off. Without this, a
  // shoulder-length cut ends in a flat horizontal slab across the chest.
  if (bottom < size - 3) {
    for (const key of keys) {
      if (key[0] <= 0.7) continue;
      const u = (key[0] - 0.7) / 0.3;
      key[1] *= 1 - u * u * 0.78;
    }
  }

  let silhouette = maskFromProfile(size, size, {
    keys,
    top,
    bottom,
    centerX,
    jitter,
  });

  // Textured hair gets its volume from a soft, dense halo rather than a hard
  // outline; dilating and then eroding stochastically produces that read.
  if (spec.hairTexture === 'coily' || spec.hairTexture === 'kinky') {
    const puffed = maskDilate(silhouette, size, size, true);
    const rng = makeRng(spec.seed ^ 0x9a71);
    for (let i = 0; i < puffed.length; i += 1) {
      if (puffed[i] && !silhouette[i] && rng() > 0.62) puffed[i] = 0;
    }
    silhouette = puffed;
  }

  // Carve out the face. Everything below the hairline and inside the skull is
  // skin, except at the very edges where sideburns and framing strands survive.
  const faceOpening = makeMask(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x + 0.5 - centerX;
      if (y + 0.5 < hairlineAt(context, dx, style)) continue;
      const t = Math.abs(dx) / Math.max(1, anatomy.headHalfWidth);
      // Sideburn corridor: hair keeps a strip against the silhouette edge.
      // Hair that has been gathered back keeps almost none of it, which is what
      // exposes the ears and the line of the jaw — half of why a bound style
      // reads as bound at all.
      const sideburn = spec.hairLength === 'bald' ? 1 : style.tight ? 0.98 : 0.9;
      if (t > sideburn) continue;
      if (y > anatomy.chinY) continue;
      faceOpening[y * size + x] = 1;
    }
  }

  const hair = maskSubtract(silhouette, faceOpening);
  carveArrangement(context, hair, style);

  // Below the jaw, hair parts around the neck and falls to either side rather
  // than swallowing the chest.
  //
  // The parting has to be clamped against the hair's own outer edge. An
  // unbounded opening curve eventually overtakes the silhouette and leaves a
  // pair of one-pixel crescents floating at the shoulders — which read as a
  // strange little cape rather than as hair.
  const MIN_FALL_WIDTH = 7;
  for (let y = Math.max(0, anatomy.chinY - 3); y < size; y += 1) {
    let outer = 0;
    for (let x = 0; x < size; x += 1) {
      if (!hair[y * size + x]) continue;
      outer = Math.max(outer, Math.abs(x + 0.5 - centerX));
    }
    const t = Math.max(0, (y - (anatomy.chinY - 3)) / 26);
    const curve = anatomy.neckHalf + 1 + t * 9;
    // Two rules, and the order matters. Keep a solid fall on each side where
    // the hair is wide enough to have one — but never let the parting close in
    // past the neck, or a shoulder-length cut ends with its two tips meeting
    // across the throat and reading as a collar.
    const open = Math.max(
      anatomy.neckHalf + 1,
      outer > MIN_FALL_WIDTH ? Math.min(curve, outer - MIN_FALL_WIDTH) : curve
    );

    for (let x = 0; x < size; x += 1) {
      if (Math.abs(x + 0.5 - centerX) <= open) hair[y * size + x] = 0;
    }
  }

  // Three layers, because hair is not simply in front of or behind a head:
  // it sits on the skull, spills out beside it, and — if it is long enough —
  // falls forward over the shoulders on top of the clothing.
  const front = makeMask(size, size);
  const back = makeMask(size, size);
  const overShoulder = makeMask(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      if (!hair[i]) continue;
      if (y >= anatomy.chinY) {
        overShoulder[i] = 1;
        continue;
      }
      const dx = Math.abs(x + 0.5 - centerX);
      if (dx < anatomy.headHalfWidth + 2) front[i] = 1;
      else back[i] = 1;
    }
  }

  // What the arrangement adds, rather than what it moves: knots that stand off
  // the skull and plaits that hang free of it. These are placed against the
  // finished layers so a plait knows where the shoulder is and a knot knows
  // where the crown ended up.
  const knots = buildKnots(context, style);
  const braids = buildBraids(context, style);

  for (let i = 0; i < knots.length; i += 1) {
    if (!knots[i]) continue;
    // A knot sits behind the skull's outline, so the head occludes its base and
    // it reads as attached rather than as a ball resting on top of the hair.
    back[i] = 1;
    // But the cap of hair is drawn *after* the skull, and it would paint
    // straight over any part of a knot that overlaps it — which is why the
    // first version of the piled updo came out as an ordinary head of hair.
    // Anything above the hairline is therefore drawn in front as well. The
    // hairline is the bound: it keeps a knot from ever creeping onto a cheek.
    if (Math.floor(i / size) < hairlineY) front[i] = 1;
  }
  // Where a plait crosses the head it goes *behind* it, not in front. Getting
  // this wrong is spectacular rather than subtle: the first version routed
  // every hanging rope into the front layer, and a braid that started at the
  // temple came down across the eye like a bar drawn over the face.
  const headSpanY = Math.max(1, anatomy.chinY - anatomy.headTop);
  const headHalfAt = (y: number): number => {
    if (y < anatomy.headTop || y > anatomy.chinY) return 0;
    return sampleProfile(anatomy.headProfile, (y - anatomy.headTop) / headSpanY);
  };

  for (let i = 0; i < braids.length; i += 1) {
    if (!braids[i]) continue;
    const y = Math.floor(i / size);
    const x = i - y * size;
    if (y >= anatomy.chinY) {
      overShoulder[i] = 1;
    } else if (Math.abs(x + 0.5 - centerX) < headHalfAt(y) - 1) {
      back[i] = 1;
    } else {
      front[i] = 1;
    }
  }

  return { back, front, overShoulder, braids, knots, hairlineY };
}

// ---------------------------------------------------------------------------
// What an arrangement takes away
// ---------------------------------------------------------------------------

/**
 * The two styles that are defined by absence. Both are cut *into* the finished
 * cap, after the hairline has been resolved, because both are barbering rather
 * than growth — a tonsure ignores where the hair would naturally sit, which is
 * the entire social point of one.
 */
function carveArrangement(context: RenderContext, hair: Mask, style: StyleProfile): void {
  const { spec, anatomy } = context;
  const { size, centerX } = anatomy;

  if (spec.hairSilhouette === 'tonsure') {
    // A shaved disc on the crown inside a ring of remaining hair. The disc is
    // an ellipse rather than a circle because the crown is seen foreshortened
    // from the front — a circular tonsure drawn flat reads as a bald patch.
    const cx = centerX;
    const cy = anatomy.headTop + anatomy.headHeight * 0.14;
    const rx = anatomy.headHalfWidth * 0.62;
    const ry = anatomy.headHeight * 0.17;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) hair[y * size + x] = 0;
      }
    }
    return;
  }

  if (spec.hairSilhouette === 'shaved_sides') {
    // A crest along the midline, rounded at the tip and holding its width from
    // about a third of the way down. The first version tapered by a couple of
    // pixels across the whole height, which is not a taper at all — it drew a
    // literal rectangle standing on the skull. What sells a crest is the tip:
    // it has to come to a rounded point clear of the crown.
    const w = anatomy.headHalfWidth;
    let tip = size;
    for (let y = 0; y < size && tip === size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (hair[y * size + x]) { tip = y; break; }
      }
    }
    const base = Math.max(tip + 4, anatomy.browY - 4);
    for (let y = 0; y < size; y += 1) {
      if (y > anatomy.chinY) continue;
      const u = Math.max(0, (y - tip) / Math.max(1, base - tip));
      const half = w * 0.36 * Math.min(1, Math.sqrt(u * 2.4 + 0.04));
      for (let x = 0; x < size; x += 1) {
        if (Math.abs(x + 0.5 - centerX) > Math.max(1, half)) hair[y * size + x] = 0;
      }
    }
    return;
  }

  // `tight` styles lose the wisps that would otherwise cover the ear.
  if (style.tight) {
    for (let y = anatomy.earTopY; y <= anatomy.earBottomY; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const t = Math.abs(x + 0.5 - centerX) / Math.max(1, anatomy.headHalfWidth);
        if (t > 0.86 && t < 1.04) hair[y * size + x] = 0;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// What an arrangement adds
// ---------------------------------------------------------------------------

/**
 * Knots: the gathered mass, drawn behind the skull so its base is occluded.
 *
 * That occlusion is doing more work than the shape is. A bun placed in front of
 * the head silhouette is a circle sitting on a head; the same bun placed behind
 * it, so the skull cuts across its lower edge, is hair that has been gathered.
 */
function buildKnots(context: RenderContext, style: StyleProfile): Mask {
  const { spec, anatomy } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);
  const side = styleSide(spec.seed);
  const w = anatomy.headHalfWidth;

  // Thick, textured hair makes a bigger knot than fine straight hair does.
  const bulk =
    spec.hairTexture === 'coily' || spec.hairTexture === 'kinky' ? 1.22 :
    spec.hairTexture === 'curly' ? 1.1 : 1;
  const longer = spec.hairLength === 'very_long' ? 1.12 : spec.hairLength === 'long' ? 1.05 : 1;
  const scale = bulk * longer;

  // The frame is a tight bust: the crown sits about nine pixels below the top
  // edge, and that is the entire budget for anything standing above the head.
  // A pile tall enough to look like a pile gets its top cropped off, so knots
  // have to earn their read by breaking the silhouette *sideways* instead —
  // which is also the more legible direction at this size.
  const headroom = anatomy.headTop - 1;

  const blob = (cx: number, cy: number, rx: number, ry: number) => {
    const e = maskEllipse(size, size, cx, cy, rx * scale, ry * scale);
    for (let i = 0; i < e.length; i += 1) if (e[i]) mask[i] = 1;
  };

  switch (spec.hairSilhouette) {
    case 'bun':
      // Set high and well off the midline, so it breaks the crown's outline on
      // one side rather than balancing on top of it — which is both what a
      // pinned bun actually does and the only version that survives the crop.
      blob(centerX + side * w * 0.52, anatomy.headTop - headroom * 0.42, w * 0.44, w * 0.36);
      break;

    case 'top_knot':
      // Standing on the crown, bound at the base. Narrow, so the binding below
      // it has something to read against.
      blob(centerX + side * 1.5, anatomy.headTop - headroom * 0.62, w * 0.25, w * 0.28);
      break;

    case 'twin_buns':
      for (const s of [-1, 1] as const) {
        blob(centerX + s * w * 0.95, anatomy.headTop + anatomy.headHeight * 0.06, w * 0.34, w * 0.32);
      }
      break;

    case 'tied_back':
      // Not a knot so much as the evidence of one: the gathered mass shows at
      // the sides of the head, below the ear. Without it, hair pulled back is
      // indistinguishable from hair that is simply short.
      for (const s of [-1, 1] as const) {
        blob(centerX + s * w * 0.9, anatomy.earBottomY - 2, w * 0.2, w * 0.26);
      }
      break;

    case 'updo': {
      // Piled — but piled *outward*, because there is no room to pile upward.
      // A roll wider than the skull, sitting just above the crown, reads as
      // dressed hair; the same mass drawn tall simply loses its top to the
      // frame and comes back looking like an ordinary head of hair.
      const top = Math.max(1, anatomy.headTop - headroom * 0.85);
      const bottom = anatomy.headTop + anatomy.headHeight * 0.22;
      const rolled = maskFromProfile(size, size, {
        keys: [
          [0, w * 0.62],
          [0.3, w * 0.98],
          [0.62, w * 1.12],
          [1, w * 0.92],
        ],
        top,
        bottom,
        centerX: centerX + side * 1.2,
        jitter: (t) => Math.sin(t * 7 + side) * 0.7,
      });
      for (let i = 0; i < rolled.length; i += 1) if (rolled[i]) mask[i] = 1;

      // And a roll across the front, sitting on the hairline. With only eight
      // pixels of headroom the crown alone cannot say "dressed" — but a roll
      // above the brow can, and it is the shape most of the styles that land
      // here actually had: the pompadour, the Gibson pile, hair rolled at the
      // temples. It also gives `seatKnots` a long horizontal join to shade,
      // which is what finally separated the pile from the cap behind it.
      blob(centerX, anatomy.browY - 9, w * 0.82, w * 0.24);
      break;
    }

    default:
      break;
  }

  return mask;
}

/**
 * Lay a tapering rope of hair down the frame. Plaits, tails and locs are all
 * the same primitive with different widths, drifts and counts.
 */
function drawRope(
  mask: Mask,
  size: number,
  options: {
    x0: number; y0: number; y1: number;
    drift: number; halfTop: number; halfBottom: number;
    wobble?: (t: number) => number;
  }
): void {
  const { x0, y0, y1, drift, halfTop, halfBottom, wobble } = options;
  const span = Math.max(1, y1 - y0);
  for (let y = Math.max(0, Math.round(y0)); y <= Math.min(size - 1, Math.round(y1)); y += 1) {
    const t = (y - y0) / span;
    // Ease the drift so the rope leaves the head vertically and swings out
    // lower down, the way weight actually hangs.
    const cx = x0 + drift * t * t + (wobble ? wobble(t) : 0);
    const half = halfTop + (halfBottom - halfTop) * t;
    if (half <= 0) continue;
    for (let x = Math.max(0, Math.floor(cx - half)); x <= Math.min(size - 1, Math.ceil(cx + half)); x += 1) {
      if (x + 0.5 >= cx - half && x + 0.5 <= cx + half) mask[y * size + x] = 1;
    }
  }
}

/** Plaits, tails and locs — everything that hangs free of the skull. */
function buildBraids(context: RenderContext, style: StyleProfile): Mask {
  const { spec, anatomy } = context;
  const { size, centerX } = anatomy;
  const mask = makeMask(size, size);
  const side = styleSide(spec.seed);
  const noise = makeNoise1D(spec.seed ^ 0x6b41);
  const w = anatomy.headHalfWidth;

  switch (spec.hairSilhouette) {
    case 'ponytail':
      // Gathered at the back and falling behind the shoulder. It starts at the
      // silhouette edge rather than inside it, so it emerges from behind the
      // head instead of appearing to grow out of the cheek.
      drawRope(mask, size, {
        x0: centerX + side * w * 1.02,
        y0: anatomy.earTopY - 2,
        y1: anatomy.chinY + 16,
        drift: side * 4,
        halfTop: 3.6,
        halfBottom: 2.2,
        wobble: t => noise(t * 4) * 0.7,
      });
      break;

    case 'braid_single':
      drawRope(mask, size, {
        x0: centerX + side * w * 0.98,
        y0: anatomy.earTopY + 1,
        y1: size - 1,
        drift: side * 6,
        halfTop: 3.4,
        halfBottom: 1.8,
        wobble: t => noise(t * 3) * 0.6,
      });
      break;

    case 'braid_twin':
      for (const s of [-1, 1] as const) {
        drawRope(mask, size, {
          x0: centerX + s * w * 1.04,
          y0: anatomy.earTopY,
          y1: size - 1,
          drift: s * 3,
          halfTop: 3,
          halfBottom: 1.6,
          wobble: t => noise(t * 3 + (s === 1 ? 9 : 0)) * 0.5,
        });
      }
      break;

    case 'locs': {
      // Only the ropes clear of the skull are drawn. Locs hanging down the
      // centre of the face would be occluded anyway, and the ones that are not
      // occluded read as bars across the eyes — so the middle of the head keeps
      // its cap of hair and the ropes start where the cap ends.
      const perSide = 3;
      for (const s of [-1, 1] as const) {
        for (let i = 0; i < perSide; i += 1) {
          const u = i / (perSide - 1);
          const x0 = centerX + s * w * (0.72 + u * 0.36);
          drawRope(mask, size, {
            x0,
            y0: anatomy.headTop + anatomy.headHeight * (0.2 + u * 0.22),
            y1: anatomy.chinY + 10 + noise(i * 2.1 + (s === 1 ? 7 : 0)) * 13,
            drift: s * (1.5 + u * 3),
            halfTop: 1.8,
            halfBottom: 1.4,
            wobble: t => noise(t * 5 + i * 3 + (s === 1 ? 11 : 0)) * 0.8,
          });
        }
      }
      break;
    }

    case 'braid_crown': {
      // Wound around the head, just above the hairline. Not hanging at all —
      // but it wants the same segmentation pass a plait gets, so it lives here.
      for (let x = 0; x < size; x += 1) {
        const dx = (x + 0.5 - centerX) / Math.max(1, w);
        if (Math.abs(dx) > 1.02) continue;
        // Follow the curve of the skull rather than cutting straight across.
        const yc = hairlineAt(context, x + 0.5 - centerX, style) - 2.2 - (1 - dx * dx) * 1.6;
        for (let d = -2; d <= 2; d += 1) {
          const y = Math.round(yc + d);
          if (y < 0 || y >= size) continue;
          mask[y * size + x] = 1;
        }
      }
      break;
    }

    default:
      break;
  }

  return mask;
}

function fillHair(context: RenderContext, mask: Mask): void {
  const { raster, ramps, anatomy, spec } = context;
  const shader = ellipsoidShader(
    anatomy.centerX - 2,
    anatomy.headTop + anatomy.headHeight * 0.3,
    anatomy.headHalfWidth * 1.18,
    anatomy.headHeight * 0.62,
    1,
    { base: 3, gain: 7.2, bounce: 0.18, neutral: 0.8 }
  );
  const dither = spec.hairTexture === 'coily' || spec.hairTexture === 'kinky' ? 0.6 : 0.25;
  fillMask(raster, mask, ramps.hair, MAT.HAIR, (x, y) => {
    // Hair falling past the jaw loses some light — but only about a step, or
    // ginger hair turns brown on the way down and stops reading as the same
    // head of hair.
    const drop = y > anatomy.chinY ? Math.min(1.1, (y - anatomy.chinY) / 18) : 0;
    return shader(x, y) + drop;
  }, { dither });
}

/**
 * The shine. A single arc riding the curve of the skull on the lit side, broken
 * into clusters for textured hair. Nothing else does as much for hair at this
 * resolution.
 */
function drawSheen(context: RenderContext, mask: Mask): void {
  const { raster, ramps, anatomy, spec } = context;
  const { size, centerX } = anatomy;
  if (spec.hairLength === 'bald') return;

  const noise = makeNoise1D(spec.seed ^ 0x2f19);
  const clustered = spec.hairTexture === 'coily' || spec.hairTexture === 'kinky' || spec.hairTexture === 'curly';
  const startX = Math.round(centerX - anatomy.headHalfWidth * 0.92);
  const endX = Math.round(centerX + anatomy.headHalfWidth * 0.15);

  for (let x = startX; x <= endX; x += 1) {
    // Find the top of the hair mass in this column.
    let topY = -1;
    for (let y = 0; y < size; y += 1) {
      if (mask[y * size + x]) { topY = y; break; }
    }
    if (topY < 0) continue;

    const t = (x - startX) / Math.max(1, endX - startX);
    // The band dips as it wraps around the skull.
    const depth = 2 + Math.round(Math.sin(t * Math.PI) * 2.4 + noise(x * 0.5) * 0.8);
    const y = topY + depth;
    if (!mask[y * size + x]) continue;

    if (clustered && noise(x * 0.9 + 20) < 0.05) continue;
    if (clustered && (x - startX) % 3 === 2) continue;

    raster.set(x, y, ramps.hair.steps[1], MAT.HAIR, 1);
    if (!clustered && mask[(y + 1) * size + x] && Math.sin(t * Math.PI) > 0.55) {
      raster.set(x, y + 1, ramps.hair.steps[2], MAT.HAIR, 2);
    }
    if (clustered && mask[(y + 1) * size + x] && noise(x * 1.3) > 0.4) {
      raster.set(x, y + 1, ramps.hair.steps[2], MAT.HAIR, 2);
    }
  }
}

/** Strand separations — a few dark breaks so the mass is not a solid blob. */
function drawStrands(context: RenderContext, mask: Mask): void {
  const { raster, ramps, anatomy, spec } = context;
  const { size, centerX } = anatomy;
  if (spec.hairLength === 'bald' || spec.hairLength === 'very_short') return;

  const rng = makeRng(spec.seed ^ 0x7c3d);
  const count = spec.hairLength === 'long' || spec.hairLength === 'very_long' ? 9 : 5;
  const wavy = spec.hairTexture === 'wavy' || spec.hairTexture === 'curly';

  for (let i = 0; i < count; i += 1) {
    const x0 = Math.round(centerX + (rng() * 2 - 1) * anatomy.headHalfWidth * 1.15);
    const y0 = Math.round(anatomy.headTop + rng() * anatomy.headHeight * 0.55);
    const length = 4 + Math.floor(rng() * 10);
    for (let s = 0; s < length; s += 1) {
      const x = Math.round(x0 + (wavy ? Math.sin((y0 + s) * 0.55 + i) * 1.4 : (x0 - centerX) * 0.012 * s));
      const y = y0 + s;
      if (x < 0 || y < 0 || x >= size || y >= size) break;
      if (!mask[y * size + x]) continue;
      raster.shift(x, y, 1, context.book);
    }
  }
}

/**
 * A knot is its own solid, not part of the skull, so it gets its own light.
 *
 * Filling it with the head's ellipsoid shader is what makes a bun look painted
 * on: it takes the crown's gradient and so has no near side. Re-shading it
 * around its own centre gives it a lit top-left, a turned edge, and a dark
 * underside, and it detaches from the head immediately.
 */
function shadeKnots(context: RenderContext, knots: Mask): void {
  const { raster, ramps, anatomy, spec, book } = context;
  const { size } = anatomy;
  if (!knots.some(v => v === 1)) return;

  // Find each knot's own bounding box so several buns each light correctly.
  const seen = new Uint8Array(knots.length);
  const noise = makeNoise1D(spec.seed ^ 0x33af);

  for (let sy = 0; sy < size; sy += 1) {
    for (let sx = 0; sx < size; sx += 1) {
      const start = sy * size + sx;
      if (!knots[start] || seen[start]) continue;

      // Flood the connected blob.
      const cells: number[] = [start];
      seen[start] = 1;
      let minX = sx; let maxX = sx; let minY = sy; let maxY = sy;
      for (let head = 0; head < cells.length; head += 1) {
        const i = cells[head];
        const y = Math.floor(i / size);
        const x = i - y * size;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        const around = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
        for (const [dx, dy] of around) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
          const ni = ny * size + nx;
          if (!knots[ni] || seen[ni]) continue;
          seen[ni] = 1;
          cells.push(ni);
        }
      }
      if (cells.length < 12) continue;

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const rx = Math.max(2, (maxX - minX) / 2);
      const ry = Math.max(2, (maxY - minY) / 2);
      const shader = ellipsoidShader(cx - rx * 0.28, cy - ry * 0.3, rx * 1.15, ry * 1.15, 1, {
        base: 3, gain: 6.4, bounce: 0.2, neutral: 0.82,
      });

      for (const i of cells) {
        const y = Math.floor(i / size);
        const x = i - y * size;
        if (raster.matAt(x, y) !== MAT.HAIR) continue;
        // A wound knot is not smooth: coils catch the light unevenly around it.
        const coil = noise((x * 0.9 + y * 1.7) * 0.4) * 0.55;
        const index = Math.max(0, Math.min(6, Math.round(shader(x, y) + coil)));
        raster.set(x, y, ramps.hair.steps[index], MAT.HAIR, index);
      }
    }
  }

  // The knot sits against the head, so it throws onto whatever is behind it.
  applyContactShadow(raster, knots, book, { dx: 1, dy: 1, strength: 1, depth: 1 });
}

/**
 * Seat a knot against the cap of hair in front of it.
 *
 * The knot is drawn behind the skull and the cap is drawn over it, both in the
 * same hair ramp — so where they meet above the crown there is no boundary at
 * all, and a piled updo reads as nothing more than slightly taller hair. One
 * dark row along the join fixes it: the cap is nearer the light, so it throws
 * up onto the pile behind it, and that shadow is the whole read.
 */
function seatKnots(context: RenderContext, masks: HairMasks): void {
  const { raster, anatomy, book } = context;
  const { size } = anatomy;
  const { knots } = masks;
  if (!knots.some(v => v === 1)) return;

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      if (!knots[i]) continue;
      // The seam is the knot's own lower edge, where it meets the hair behind.
      if (knots[(y + 1) * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.HAIR) continue;
      if (raster.matAt(x, y + 1) !== MAT.HAIR) continue;
      raster.shift(x, y + 1, 2, book);
      if (y + 2 < size && raster.matAt(x, y + 2) === MAT.HAIR && !knots[(y + 2) * size + x]) {
        raster.shift(x, y + 2, 1, book);
      }
    }
  }
}

/**
 * Stubble over a shaved scalp.
 *
 * Without it, shaved sides read as male-pattern baldness with a strip left on
 * top — the scalp is clean skin, and clean skin at the temples of a young face
 * is not what a razor leaves. A dithered scatter in the hair colour is enough,
 * and it also breaks up the flat plane the crest is sitting against.
 */
function drawShavedStubble(context: RenderContext): void {
  const { raster, ramps, anatomy, spec, book } = context;
  const { size, centerX } = anatomy;
  if (spec.hairSilhouette !== 'shaved_sides') return;

  const rng = makeRng(spec.seed ^ 0x71c2);
  for (let y = anatomy.headTop; y <= anatomy.earBottomY; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (raster.matAt(x, y) !== MAT.SKIN) continue;
      // Only over the cranium, never down onto the cheek.
      if (y + 0.5 > hairlineAt(context, x + 0.5 - centerX, BASE_STYLE) + 2) continue;
      if (rng() > 0.42) continue;
      raster.blend(x, y, ramps.hair.steps[4], 0.4, MAT.SKIN, raster.shadeAt(x, y));
    }
  }

  // The crest stands off the scalp, so it throws to either side of itself.
  // Hair over skin gets no outline pass, and without this the lit edge of the
  // crest melts into the lit scalp and the whole thing looks off-centre.
  for (let y = 0; y < size; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      if (raster.matAt(x, y) !== MAT.HAIR) continue;
      for (const dx of [-1, 1] as const) {
        if (raster.matAt(x + dx, y) !== MAT.SKIN) continue;
        raster.shift(x + dx, y, 2, book);
      }
    }
  }
}

/**
 * Every hanging rope is a cylinder, and the skull's shader has no idea it is
 * there — it hands a plait at the edge of the frame a single flat value, which
 * is why the first pass drew tails and braids as black bars. Re-shading each
 * rope across its own width, lit side to shadow side, is what turns the bar
 * back into hair. It matters more than the segmentation on top of it.
 */
function shadeRopes(context: RenderContext, braids: Mask): void {
  const { raster, ramps, anatomy, spec } = context;
  const { size } = anatomy;
  if (spec.hairSilhouette === 'braid_crown') return;

  for (let y = 0; y < size; y += 1) {
    let x = 0;
    while (x < size) {
      if (!braids[y * size + x]) { x += 1; continue; }
      const left = x;
      while (x < size && braids[y * size + x]) x += 1;
      const right = x - 1;
      const width = right - left;
      if (width < 1) continue;

      for (let px = left; px <= right; px += 1) {
        if (raster.matAt(px, y) !== MAT.HAIR) continue;
        // -1 at the lit edge, +1 at the shadowed one. The key light is upper
        // left, so the near edge of a rope catches it and the far edge turns.
        const u = (px - left) / width * 2 - 1;
        // Hair falling past the jaw sits in the body's shadow, like the mass.
        const drop = y > anatomy.chinY ? Math.min(1, (y - anatomy.chinY) / 22) : 0;
        const index = Math.max(0, Math.min(6, Math.round(2.4 + u * 1.9 + u * u * 0.9 + drop)));
        raster.set(px, y, ramps.hair.steps[index], MAT.HAIR, index);
      }
    }
  }
}

/**
 * Braid segmentation.
 *
 * A plait is the one hair form that is defined by its *interior* rather than
 * its outline — a filled rope of the right width and taper still reads as a
 * loose lock. What makes it a braid is the alternating diagonal: each segment
 * crosses the other way, so the shadow between them zig-zags down the length.
 * Three rows per segment is the smallest pitch that survives at this scale;
 * two reads as noise and four reads as a rope with notches cut in it.
 */
function drawBraidTexture(context: RenderContext, braids: Mask): void {
  const { raster, ramps, anatomy, spec, book } = context;
  const { size } = anatomy;
  if (!braids.some(v => v === 1)) return;

  // A tail is gathered, not plaited, and locs are twisted rather than crossed —
  // both want the cylinder they already have and nothing else cut into them.
  const plaited =
    spec.hairSilhouette === 'braid_single' ||
    spec.hairSilhouette === 'braid_twin' ||
    spec.hairSilhouette === 'braid_crown';
  if (!plaited) {
    applyContactShadow(raster, braids, book, { dx: 1, dy: 1, strength: 1, depth: 1 });
    return;
  }

  const horizontal = spec.hairSilhouette === 'braid_crown';

  if (horizontal) {
    // A crown braid runs across rather than down, so the segments march along x.
    for (let x = 0; x < size; x += 1) {
      let top = -1; let bottom = -1;
      for (let y = 0; y < size; y += 1) {
        if (!braids[y * size + x]) continue;
        if (top < 0) top = y;
        bottom = y;
      }
      if (top < 0 || bottom <= top) continue;
      const phase = Math.floor(x / 3) % 2;
      const u = (x % 3) / 3;
      const notchY = Math.round(top + (bottom - top) * (phase ? u : 1 - u));
      // A crown braid is read against the cap of hair right behind it, so it
      // needs more separation than a plait hanging against the background.
      for (let d = 0; d < 2; d += 1) {
        if (raster.matAt(x, notchY + d) === MAT.HAIR) raster.shift(x, notchY + d, 2, book);
      }
      if (raster.matAt(x, top) === MAT.HAIR) raster.shift(x, top, -2, book);
      if (raster.matAt(x, bottom) === MAT.HAIR) raster.shift(x, bottom, 1, book);
    }
    applyContactShadow(raster, braids, book, { dx: 0, dy: 1, strength: 2, depth: 2 });
    return;
  }

  for (let y = 0; y < size; y += 1) {
    // Each rope on this row is handled separately, so twin plaits do not get
    // one notch spanning the gap between them.
    let x = 0;
    while (x < size) {
      if (!braids[y * size + x]) { x += 1; continue; }
      const left = x;
      while (x < size && braids[y * size + x]) x += 1;
      const right = x - 1;
      const width = right - left;
      if (width < 1) continue;

      const phase = Math.floor(y / 3) % 2;
      const u = (y % 3) / 3;
      const notch = Math.round(left + width * (phase ? u : 1 - u));

      // The crossing shadow, and a lit ridge on the opposite side of it —
      // a notch alone reads as damage, a notch with a ridge reads as weave.
      if (raster.matAt(notch, y) === MAT.HAIR) raster.shift(notch, y, 2, book);
      const ridge = phase ? notch - 2 : notch + 2;
      if (ridge >= left && ridge <= right && raster.matAt(ridge, y) === MAT.HAIR) {
        raster.shift(ridge, y, -1, book);
      }
      // Both edges of a rope turn away from the light.
      if (raster.matAt(right, y) === MAT.HAIR) raster.shift(right, y, 1, book);
    }
  }

  applyContactShadow(raster, braids, book, { dx: 1, dy: 1, strength: 1, depth: 1 });
}

/**
 * Cornrows: furrows following the curve of the skull front to back.
 *
 * Drawn as partings rather than as rows — the visible thing is the scalp
 * showing between the braids, not the braids themselves, and lightening the
 * hair to suggest rows gets it exactly backwards.
 */
function drawCornrows(context: RenderContext, mask: Mask): void {
  const { raster, anatomy, spec, book } = context;
  const { size, centerX } = anatomy;
  const noise = makeNoise1D(spec.seed ^ 0x2c71);

  const rows = 6;
  for (let i = 0; i < rows; i += 1) {
    // Rows fan out from the crown, so they are not evenly spaced across the
    // width — they bunch toward the middle and splay at the temples.
    const u = (i / (rows - 1)) * 2 - 1;
    const spread = Math.sign(u) * Math.pow(Math.abs(u), 0.78);
    for (let y = anatomy.headTop - 2; y < anatomy.earBottomY; y += 1) {
      const t = Math.max(0, Math.min(1, (y - anatomy.headTop) / Math.max(1, anatomy.headHeight * 0.6)));
      // Each furrow bows outward as it travels back over the skull.
      const x = Math.round(
        centerX + spread * anatomy.headHalfWidth * (0.34 + t * 0.66) + noise(i * 3 + t) * 0.5
      );
      if (x < 0 || x >= size || y < 0 || y >= size) continue;
      if (!mask[y * size + x]) continue;
      if (raster.matAt(x, y) !== MAT.HAIR) continue;
      raster.shift(x, y, 2, book);
      // A lit ridge on one side turns a scratch into a raised braid.
      if (mask[y * size + x + 1] && raster.matAt(x + 1, y) === MAT.HAIR) {
        raster.shift(x + 1, y, -1, book);
      }
    }
  }
}

/**
 * The tie at the base of a knot or a tail. Two dark rows and a lit one: small,
 * but it is the difference between hair that has been bound and hair that
 * happens to be bunched.
 */
function drawBinding(context: RenderContext): void {
  const { raster, anatomy, spec, book } = context;
  const { size, centerX } = anatomy;
  const silhouette = spec.hairSilhouette;
  if (silhouette !== 'top_knot' && silhouette !== 'ponytail' && silhouette !== 'braid_single') return;

  const side = styleSide(spec.seed);
  const w = anatomy.headHalfWidth;
  const cx = silhouette === 'top_knot' ? centerX + side * 1.5 : centerX + side * w * 0.74;
  const cy = silhouette === 'top_knot'
    ? anatomy.headTop + 1
    : anatomy.earTopY + (silhouette === 'braid_single' ? 2 : 0);
  const half = silhouette === 'top_knot' ? 4 : 4.2;

  for (let d = 0; d < 3; d += 1) {
    const y = Math.round(cy + d);
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x += 1) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      if (raster.matAt(x, y) !== MAT.HAIR) continue;
      raster.shift(x, y, d === 1 ? -1 : 2, book);
    }
  }
}

/**
 * Cut the hair down to what a covering leaves showing.
 *
 * Headwear is drawn over the hair, so anything the two share is hidden already.
 * What is not hidden is hair that ends up *above* the covering — a bun, a
 * topknot, the crown of an afro — because there is nothing over it to hide
 * behind. A pinned bun sitting a clean inch above the crown of a felt cap was
 * the commonest version, and it reads as the hat having been drawn on top of a
 * finished head rather than worn on one.
 *
 * The cut is per column rather than one horizontal line across the portrait.
 * A single line has to be drawn at the covering's highest point to work at all,
 * and at the sides — where a hat's crown is far lower than its centre — that
 * line sits well above the felt and lets the same tuft through. Column by
 * column, hair may not rise past whatever is worn over that column; past the
 * edge of the covering the line carries on at the height it left off, so what
 * survives is the hair coming out from *under* the hat. An afro still spreads
 * wider than a narrow cap, it just spreads from below the cap's edge rather
 * than sprouting out of its crown.
 */
export function clipHairUnderCovering(masks: HairMasks, covering: Mask, size: number): void {
  // The cut line: the covering's own upper edge, column by column.
  const cut = new Int16Array(size).fill(-1);
  for (let x = 0; x < size; x += 1) {
    for (let y = 0; y < size; y += 1) {
      if (covering[y * size + x]) { cut[x] = y; break; }
    }
  }

  // Carry the line out past the covering at the height of its outermost edge,
  // instead of stopping dead where the felt stops. Stopping there leaves the
  // column just outside the hat uncut while its neighbour is cut low, and the
  // sliver of hair between the two reads as a fin stuck to the side of the
  // head. Carried outward, the same rule says what it should: hair comes out
  // from *under* the edge of a cap, not from beside its crown.
  const covered = cut.slice();
  let edge = -1;
  for (let x = 0; x < size; x += 1) {
    if (covered[x] >= 0) edge = covered[x];
    else if (edge >= 0) cut[x] = edge;
  }
  edge = -1;
  for (let x = size - 1; x >= 0; x -= 1) {
    if (covered[x] >= 0) edge = covered[x];
    else if (edge >= 0) cut[x] = Math.max(cut[x], edge);
  }

  const layers = [masks.back, masks.front, masks.knots, masks.braids];
  for (let x = 0; x < size; x += 1) {
    // Inclusive of the covering's own first row: a fur cap's silhouette is
    // tufted rather than solid, and hair level with a single guard hair shows
    // through the gaps beside it.
    for (let y = 0; y <= cut[x]; y += 1) {
      const i = y * size + x;
      for (const layer of layers) layer[i] = 0;
    }
  }
}

export function drawHairBack(context: RenderContext, masks: HairMasks): void {
  const { spec } = context;
  if (spec.hairLength === 'bald' && spec.recession > 0.85 && spec.hairSilhouette !== 'tonsure') return;
  fillHair(context, masks.back);
}

/** Long hair falling forward over the clothing. Drawn after the garment. */
export function drawHairOverShoulder(context: RenderContext, masks: HairMasks): void {
  const { spec } = context;
  if (spec.hairLength === 'bald') return;
  fillHair(context, masks.overShoulder);
  drawStrands(context, masks.overShoulder);
  applyContactShadow(context.raster, masks.overShoulder, context.book, { dx: 1, dy: 1, strength: 1, depth: 1 });
}

export function drawHairFront(context: RenderContext, masks: HairMasks): void {
  const { spec } = context;
  if (spec.hairLength === 'bald' && spec.recession > 0.85 && spec.hairSilhouette !== 'tonsure') return;
  fillHair(context, masks.front);
  drawSheen(context, masks.front);
  drawStrands(context, masks.front);

  if (spec.hairSilhouette === 'cornrows') drawCornrows(context, masks.front);
  // Knots are shaded after the cap, not before it: the cap is drawn over
  // anything they share, so shading them any earlier gets painted away.
  shadeKnots(context, masks.knots);
  seatKnots(context, masks);
  drawShavedStubble(context);

  // Ropes are shaded and textured last of the hair passes, so the cylinder and
  // the weave sit on top of the sheen rather than being overwritten by it.
  if (masks.braids.some(v => v === 1)) {
    shadeRopes(context, masks.braids);
    drawBraidTexture(context, masks.braids);
  }
  drawBinding(context);

  // Hair throws a real shadow onto the forehead. This is the single cheapest
  // way to stop hair looking like a decal pasted on the skull.
  applyContactShadow(context.raster, masks.front, context.book, { dx: 0, dy: 1, strength: 2, depth: 2 });
  applyContactShadow(context.raster, masks.front, context.book, { dx: 1, dy: 1, strength: 1, depth: 1 });
}

// ---------------------------------------------------------------------------
// Facial hair
// ---------------------------------------------------------------------------

interface BeardRegions {
  mustache: boolean;
  chin: boolean;
  jaw: boolean;
  sideburns: boolean;
  /** How far the beard hangs below the chin, in pixels. */
  hang: number;
  soulPatch: boolean;
  forked: boolean;
  handlebar: boolean;
}

export function beardRegions(style: string): BeardRegions {
  const base: BeardRegions = {
    mustache: false, chin: false, jaw: false, sideburns: false,
    hang: 0, soulPatch: false, forked: false, handlebar: false,
  };
  switch (style) {
    case 'full_beard': return { ...base, mustache: true, chin: true, jaw: true, sideburns: true, hang: 6 };
    case 'verdi': return { ...base, mustache: true, chin: true, jaw: true, sideburns: true, hang: 4 };
    case 'forked_beard': return { ...base, mustache: true, chin: true, jaw: true, sideburns: true, hang: 8, forked: true };
    case 'chin_curtain': return { ...base, chin: true, jaw: true, sideburns: true, hang: 3 };
    case 'mutton_chops': return { ...base, jaw: true, sideburns: true };
    case 'goatee': return { ...base, mustache: true, chin: true, hang: 3 };
    case 'van_dyke': return { ...base, mustache: true, chin: true, hang: 2 };
    case 'imperial': return { ...base, mustache: true, handlebar: true };
    case 'handlebar': return { ...base, mustache: true, handlebar: true };
    case 'mustache': return { ...base, mustache: true };
    case 'soul_patch': return { ...base, soulPatch: true };
    case 'stubble': return { ...base, mustache: true, chin: true, jaw: true, sideburns: true };
    default: return { ...base, chin: true, jaw: true };
  }
}

/**
 * The line where a beard starts. It rides high near the ears and dips to just
 * above the corners of the mouth in the middle — a horizontal cut-off, which is
 * the naive implementation, gives every bearded persona a rectangular bib.
 */
function beardLineAt(context: RenderContext, dx: number): number {
  const { anatomy } = context;
  const u = Math.min(1, Math.abs(dx) / Math.max(1, anatomy.headHalfWidth));
  const nearEar = anatomy.cheekY + 1;
  const nearMouth = anatomy.mouthY - 2;
  return nearMouth + (nearEar - nearMouth) * Math.pow(u, 0.75);
}

export function drawFacialHair(context: RenderContext, headMask: Mask): void {
  const { raster, spec, anatomy, ramps, book } = context;
  if (!spec.facialHair) return;

  const { size, centerX } = anatomy;
  const regions = beardRegions(spec.facialHair.style);
  const stubbleOnly = spec.facialHair.style === 'stubble';
  const density =
    spec.facialHair.thickness === 'sparse' ? 0.55 :
    spec.facialHair.thickness === 'thick' ? 1 : 0.82;

  const mask = makeMask(size, size);
  const put = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    mask[y * size + x] = 1;
  };
  const onHead = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < size && y < size && headMask[y * size + x] === 1;

  if (regions.jaw) {
    for (let y = anatomy.cheekY - 2; y <= anatomy.chinY; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!onHead(x, y)) continue;
        if (y + 0.5 < beardLineAt(context, x + 0.5 - centerX)) continue;
        put(x, y);
      }
    }
  }

  // Below the jaw the beard hangs free of the head silhouette, so it needs its
  // own taper — clamped, or it spreads into a slab across the shoulders.
  if (regions.hang > 0) {
    for (let y = anatomy.chinY + 1; y <= anatomy.chinY + regions.hang; y += 1) {
      const t = (y - anatomy.chinY) / Math.max(1, regions.hang);
      const half = (regions.chin ? 8 : 10) * (1 - t * 0.62);
      for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) {
        if (regions.forked && t > 0.55 && Math.abs(x - centerX) < 2) continue;
        put(x, y);
      }
    }
  }

  if (regions.sideburns) {
    for (const side of [-1, 1] as const) {
      for (let y = anatomy.earTopY + 3; y <= anatomy.cheekY + 1; y += 1) {
        for (let d = 0; d < 3; d += 1) {
          const x = Math.round(centerX + side * (anatomy.headHalfWidth - d));
          if (onHead(x, y)) put(x, y);
        }
      }
    }
  }

  if (regions.chin && !regions.jaw) {
    // A goatee is a small patch under the lower lip, not a bib.
    for (let y = anatomy.mouthY + 3; y <= anatomy.chinY + regions.hang; y += 1) {
      const t = (y - anatomy.mouthY - 3) / Math.max(1, anatomy.chinY + regions.hang - anatomy.mouthY - 3);
      const half = 5 - t * 1.6;
      for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) put(x, y);
    }
  }

  // The lips always show through. Carve them out before the moustache goes on.
  for (let y = anatomy.mouthY - 4; y <= anatomy.mouthY + 4; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5 - centerX) / 8;
      const dy = (y + 0.5 - anatomy.mouthY) / 4;
      if (dx * dx + dy * dy <= 1) mask[y * size + x] = 0;
    }
  }

  if (regions.mustache) {
    const top = anatomy.mouthY - 6;
    const rows = spec.facialHair.thickness === 'thick' ? 4 : 3;
    for (let i = 0; i < rows; i += 1) {
      const y = top + i;
      const half = 6 + i * 1.4;
      for (let x = Math.round(centerX - half); x <= Math.round(centerX + half); x += 1) put(x, y);
    }
    if (regions.handlebar) {
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < 4; i += 1) {
          put(Math.round(centerX + side * (9 + i)), top + 2 - Math.floor(i / 2));
        }
      }
    }
  }

  if (regions.soulPatch) {
    for (let y = anatomy.mouthY + 4; y <= anatomy.mouthY + 6; y += 1) {
      for (let x = centerX - 2; x <= centerX + 2; x += 1) put(x, y);
    }
  }

  // Stubble is a scatter, not a shape: dither it and let skin show through.
  if (stubbleOnly) {
    const rng = makeRng(spec.seed ^ 0x3311);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!mask[y * size + x]) continue;
        if (rng() > density * 0.42) continue;
        raster.blend(x, y, ramps.beard.steps[5], 0.34, MAT.SKIN, raster.shadeAt(x, y));
      }
    }
    return;
  }

  const shader = ellipsoidShader(
    centerX - 1,
    anatomy.chinY - 6,
    anatomy.headHalfWidth * 1.1,
    anatomy.headHeight * 0.42,
    1,
    { base: 3, gain: 6.6, bounce: 0.22 }
  );
  fillMask(raster, mask, ramps.beard, MAT.BEARD, shader, { dither: 0.5 });

  // Sparse beards let skin through at the edges.
  if (density < 0.8) {
    const rng = makeRng(spec.seed ^ 0x88b1);
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!mask[y * size + x]) continue;
        const edge = !mask[y * size + x - 1] || !mask[y * size + x + 1] || !mask[(y - 1) * size + x];
        if (edge && rng() > density) raster.shift(x, y, -1, book);
      }
    }
  }

  applyContactShadow(raster, mask, book, { dx: 0, dy: 1, strength: 1, depth: 1 });
}
