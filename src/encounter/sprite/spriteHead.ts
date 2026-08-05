/**
 * encounter/sprite/spriteHead.ts
 *
 * The head, at sprite scale.
 *
 * The sprite used to import the portrait's eye, brow, nose and mouth stamps
 * wholesale. That worked only while the sprite's head was the same 58px the
 * portrait's is — and it was the reason the sprite's head had to *be* 58px,
 * which is what made the figure 4.7 heads tall and doll-like. Cutting the head
 * down means the portrait's stamps cannot come along: they place marks at
 * `eyeY - 12`, and on a 23px head that is above the crown.
 *
 * So this is a second renderer, not a scaled copy. What keeps the two in
 * agreement is not shared drawing code but a **shared spec and shared
 * palette**: both read the same `PortraitSpec` fields and the same ramps from
 * `buildPortraitRamps`, and each spends them at its own scale. An aquiline
 * nose is three pixels of ridge highlight here and a modelled bridge there;
 * it is the same nose because it came off the same field.
 *
 * Heads are not one size. `statureOf` gives a small old woman about 22px and
 * an imposing man about 28, so **every offset in this file is a fraction of
 * the resolved head**, never a constant. A face laid out on fixed offsets fits
 * exactly one head size and breaks on all the others.
 *
 * The vocabulary is still deliberately small. There are perhaps a dozen
 * legible eye states at this size and four legible noses, and inventing more
 * just produces mush — the same lesson the portrait learned about expressions.
 */

import { MAT, Mask, makeMask, Raster } from '../../components/portraitLab/core/raster';
import { PortraitRamps } from '../../components/portraitLab/art/palette';
import { buildRamp, luminance, Ramp, RGB, tintRamp } from '../../components/portraitLab/core/color';
import { unit } from '../../components/portraitLab/core/rng';
import {
  CHEEK_WIDTH, clamp01, crownFor, FACE_SHAPE_CURVES, JAW_WIDTH, shapeCurve,
  skullOutline, smoothstep,
} from '../../components/portraitLab/spec/faceShape';
import {
  HOOD_METRICS, PEAKED_CAP, peakedFormFor, veilFormFor, VEIL_METRICS,
  wrapFormFor, WRAP_METRICS,
} from '../../components/portraitLab/spec/headwearForm';
import {
  CONICAL_HAT_PATTERN, CONICAL_ZONES, HairSilhouette, PortraitSpec, WOVEN_HAT_PATTERN,
} from '../../components/portraitLab/spec/types';
import { Skeleton, SPRITE_H, SPRITE_W } from './skeleton';
import { ellipsoidSurface, FormBuffer, INK, planeSurface } from './spriteLight';

export type FaceFrame = 'open' | 'blink' | 'talk';

export interface HeadLayout {
  /** Head centre. */
  hx: number;
  hy: number;
  rx: number;
  ry: number;
  /** Resolved head height and width for this person. */
  H: number;
  W: number;
  crownY: number;
  chinY: number;
  /** Feature centre — the head's midline, carried by the three-quarter turn. */
  fx: number;
  eyeY: number;
  browY: number;
  noseY: number;
  mouthY: number;
  /** Half the distance between the eyes. */
  eyeDX: number;
  eyeW: number;
  mouthW: number;
  /** Which way the face is turned: -1 toward the viewer's left. */
  turn: number;
  /** How far, 0 frontal … 1 near profile. */
  turnAmt: number;
  /** How far the hat sits down over the crown. */
  hatY: number;
  /** How far the hair mass sits down over the skull. */
  hairY: number;
  /** Forced cheekbone level 0…4, or −1 to read it from the spec. */
  cheekOverride: number;
}

/**
 * Feature positions are *fractions of the resolved head*, never constants.
 * Heads on this grid run from about 22px on a small old woman to 28 on an
 * imposing man, and a face laid out on fixed offsets fits exactly one of
 * those — the small ones lose their chin, the large ones grow a forehead
 * like a helmet.
 */
export function headLayout(spec: PortraitSpec, s: Skeleton): HeadLayout {
  const t = s.t;
  const H = s.headH;
  const W = s.headW;
  // The head turns *against* `nearSide`, not with it.
  //
  // The body's near side is the shoulder swung toward the viewer, which is the
  // shoulder on the side the figure is turning **away** from. The face turns
  // the other way. Reading the head off `nearSide` directly — which is what it
  // did — produced a figure whose body addressed one direction and whose head
  // looked over the opposite shoulder.
  const turnAmt = s.turn;
  const turn = -s.nearSide as -1 | 1;
  const eyeY = s.eyeY + t.eyeDy;
  // The face's midline swings toward the near side as the head rotates, which
  // is what puts the far cheek on show. At a 21px head this is 2–3px of real
  // travel; on the old 16px head it was one pixel and read as a mistake.
  const faceOff = Math.round(W * 0.13 * turnAmt) * turn;
  return {
    hx: s.headCx,
    hy: s.crownY + s.headRy,
    rx: s.headRx,
    ry: s.headRy,
    H,
    W,
    crownY: s.crownY,
    chinY: s.chinY,
    fx: s.headCx + faceOff + t.faceShift,
    eyeY,
    browY: eyeY - Math.round(H * 0.10) + t.browDy,
    noseY: eyeY + Math.round(H * 0.17),
    mouthY: eyeY + Math.round(H * 0.30) + t.mouthDy,
    // The bust puts the pupils at 0.42 of its head *half*-width. This is a
    // fraction of the full width, so 0.26 here was 0.52 of a half — the sprite's
    // eyes sat a quarter further apart than the same persona's portrait, on the
    // one part of the figure a viewer reads hardest. 0.21 is the bust's number.
    eyeDX: Math.round(W * 0.21) + Math.round(t.eyeGap / 2),
    // How wide one eye is. Four pixels is the threshold at which an eye can
    // hold a lash line, a white, an iris and an inner corner all at once —
    // which is the single biggest legibility gain of the larger head.
    eyeW: Math.max(3, Math.round(W * 0.25)),
    mouthW: Math.max(4, Math.round(W * 0.31)),
    turn,
    turnAmt,
    hatY: t.hatY,
    hairY: t.hairY,
    cheekOverride: t.cheekLine,
  };
}

/**
 * The skull's silhouette.
 *
 * Composed the way the bust's is, out of the same tables: a base fall from the
 * cheekbone to the chin, then face shape, jaw and cheekbone as three
 * multipliers over it. It used to be six hand-picked `taper` constants and a
 * separate `curve` exponent, which is a perfectly good way to draw a head and
 * a bad way to draw *the same* head as another renderer — the two ended up
 * disagreeing about which face shape was the wide one. A `heart` face tapered
 * 0.62 here and 0.82 there; `square` was the widest jaw on the bust and the
 * second-narrowest here.
 *
 * The vault keeps its own arc rather than joining the multiplier stack: it is
 * the one part of the outline that has to change quickly, and the bust makes
 * the same exception for the same reason (see the note above `roundCrown`).
 */
/**
 * How far a turned head reaches either side of its centre, at a given
 * half-width.
 *
 * A head rotated toward the viewer's left shows more of its right side: the far
 * cheek becomes the broad visible plane and the near cheek compresses toward
 * the nose. Shifting the *features* across a symmetric skull reads as a squint
 * rather than a rotation; the skull itself has to be lopsided.
 *
 * Shared with the hair, which is the whole reason it is a function. The skull
 * turned and the cap on top of it did not: at `turnAmt` 0.8 the skull ran 10
 * pixels left of centre and 8 right while the hair ran a flat 11 and 11, so the
 * mass overhung the head by three or four pixels on one side and nothing on the
 * other. That overhang is the lopsided dark wedge beside the ear that reads as
 * a sideburn on one cheek and nothing on the opposite one.
 */
function turnedSpan(L: HeadLayout, half: number): { lo: number; hi: number } {
  const near = Math.max(1, Math.round(half * (1 - 0.20 * L.turnAmt)));
  const far = Math.max(1, Math.round(half * (1 + 0.13 * L.turnAmt)));
  return {
    lo: L.hx + (L.turn < 0 ? -near : -far),
    hi: L.hx + (L.turn < 0 ? far : near),
  };
}

export function headMask(spec: PortraitSpec, L: HeadLayout): Mask {
  const m = makeMask(SPRITE_W, SPRITE_H);
  const shape = spec.faceShape;
  const jaw = spec.jawline;
  const elongated = spec.skull === 'elongated';

  const shapeAt = shapeCurve(FACE_SHAPE_CURVES[shape] ?? [[0, 1], [1, 1]]);
  const jawW = JAW_WIDTH[jaw] ?? 1;
  const cheekW = CHEEK_WIDTH[spec.cheekbones] ?? 1;
  // The bust's own outline, domed by the bust's own axis. What stood here was a
  // circular arc over the top fifth, then a *constant* half-width until past
  // halfway, then a quadratic fall to 0.58 of the widest point. Two of those
  // three were the problem: a constant half-width is a dead-flat vertical side
  // down a third of the skull, and a chin at 0.58 where the bust puts it at
  // 0.34 is very nearly twice as wide. Between them they are the blocky head
  // and the flat square chin.
  const outline = skullOutline(crownFor(spec));

  for (let y = L.crownY; y <= L.chinY; y += 1) {
    // 0 at the crown, 1 at the chin.
    const t = (y - L.crownY) / Math.max(1, L.chinY - L.crownY);
    let half = L.rx * outline(t);
    // The three axes, in the bust's order and with the bust's numbers.
    half *= shapeAt(t);
    half *= 1 + (jawW - 1) * smoothstep(clamp01((t - 0.56) / 0.44));
    // Cheekbones are a bump, not a plateau: a Gaussian centred on the
    // zygomatic arch falls off to nothing in both directions on its own.
    half *= 1 + (cheekW - 1) * Math.exp(-Math.pow((t - 0.5) / 0.19, 2));
    if (elongated && t < 0.3) half *= 0.9;
    const { lo, hi } = turnedSpan(L, half);
    for (let x = lo; x <= hi; x += 1) {
      if (x < 0 || x >= SPRITE_W) continue;
      m[y * SPRITE_W + x] = 1;
    }
  }

  // The nose breaks the contour. In three-quarter view the profile is what
  // announces the turn, and a head whose outline is a clean oval reads as
  // frontal no matter where its features sit.
  if (L.turnAmt > 0.45) {
    const dir = L.turn < 0 ? -1 : 1;
    for (let y = L.noseY - 2; y <= L.noseY + 1; y += 1) {
      let edge = L.hx;
      for (let x = L.hx; x !== L.hx + dir * (L.rx + 3); x += dir) {
        if (m[y * SPRITE_W + x]) edge = x; else break;
      }
      const out = y === L.noseY || y === L.noseY - 1 ? 1 : 0;
      for (let i = 1; i <= out; i += 1) {
        const x = edge + dir * i;
        if (x >= 0 && x < SPRITE_W) m[y * SPRITE_W + x] = 1;
      }
    }
  }
  return m;
}

/** The skull as a lit ellipsoid, with the jaw reading as a slightly flatter plane. */
export function headSurface(
  form: FormBuffer, mask: Mask, L: HeadLayout, depth: number, spec: PortraitSpec
): void {
  ellipsoidSurface(form, mask, L.hx + L.turn, L.hy, L.rx + 1, L.ry + 1, depth, 0.72);
  /**
   * The lower face is a plane, not the bottom of a ball.
   *
   * The ellipsoid puts its south pole at the chin, so the chin's normal points
   * straight down, away from the lamp — measured against the bust, the sprite's
   * chin resolved to 0.61 of its own cheek where the bust's is 0.91. Every
   * sprite ended at the mouth with a dark smear under it, and no amount of
   * shading elsewhere could put the chin back, because the chin was the one
   * part of the head being lit as though it faced the floor.
   *
   * A jaw does not. From the mouth down the surface turns *under* but keeps
   * facing the viewer nearly to the point of the chin, so the downward
   * component of the normal is rolled back over that stretch and the forward
   * one restored. The occlusion pass then draws the corners, which is where a
   * jaw's shadow actually is.
   */
  const from = L.mouthY;
  const span = Math.max(1, L.chinY - from);
  for (let y = from; y <= L.chinY; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!mask[y * SPRITE_W + x]) continue;
      const i = y * SPRITE_W + x;
      if (!form.written[i]) continue;
      // Full effect at the chin, none at the mouth.
      const t = (y - from) / span;
      form.ny[i] *= 1 - 0.65 * t;
      const nx = form.nx[i];
      const ny = form.ny[i];
      form.nz[i] = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
    }
  }
  faceOcclusion(form, mask, L, spec);
}

/**
 * Shadow where the face actually hollows, on top of the skull's broad light.
 *
 * A head lit as a plain ellipsoid gets a terminator that runs more or less
 * straight down it, and the face reads as a painted egg. A real face's shadow
 * is not a boundary between a light half and a dark half — it collects in
 * *specific hollows*: the eye sockets, the flank of the nose, under the
 * cheekbone, under the lower lip, and along the underside of the jaw. Those
 * are the marks that make the terminator curve, because the terminator is what
 * happens between them.
 *
 * Every one is placed off the layout's own feature positions, so they follow
 * the head wherever it is and whatever size it is.
 */
function faceOcclusion(
  form: FormBuffer, mask: Mask, L: HeadLayout, spec: PortraitSpec
): void {
  const on = (x: number, y: number) =>
    x >= 0 && x < SPRITE_W && y >= 0 && y < SPRITE_H && mask[y * SPRITE_W + x] === 1;
  const cut = (x: number, y: number, by = 1) => { if (on(x, y)) form.addBias(x, y, by); };

  const eyeHalf = Math.max(2, Math.round(L.W * 0.20));
  // --- The sockets. The brow's shelf throws down onto the eye.
  for (const side of [-1, 1] as const) {
    const cx = L.fx + side * L.eyeDX;
    for (let dx = -eyeHalf; dx <= eyeHalf; dx += 1) {
      // The socket sits one level above the nose flank, not level with it.
      cut(cx + dx, L.eyeY - 1, Math.abs(dx) < eyeHalf - 1 ? 2 : 1);
      cut(cx + dx, L.eyeY - 2, 1);
    }
  }
  // --- The nose's flank, on the side away from the light, running from the
  // inner brow down to the nostril. This is the mark that breaks the
  // terminator's straight run more than any other.
  const noseSide = L.turn;
  for (let y = L.browY + 1; y <= L.noseY; y += 1) {
    // The deepest interior mark on the face — but *deepest* is relative, and
    // there is less room than the authored numbers assume. Biases are scaled
    // by `BIAS_SCALE` (2) onto the dense ramp, so a depth of 4 lands eight
    // steps below a base of about six: past the end. Measured over three
    // faces, **18.7% of all facial skin was pinned at the darkest step** —
    // socket, nose flank, cheekbone and jaw all bottoming out at the same
    // value with no hierarchy between them, which is exactly what makes a
    // face read as marked rather than modelled. Occlusion adds to this too,
    // so the marks have to leave it room.
    cut(L.fx + noseSide * 2, y, 3);
    cut(L.fx + noseSide * 3, y, 1);
  }
  // …and the ball of the nose throws a short shadow onto the lip below it.
  cut(L.fx + noseSide, L.noseY + 1, 2);
  cut(L.fx, L.noseY + 1, 1);
  // --- Under the cheekbone.
  //
  // Five authored levels, not one mark on every face. The bust shows some
  // faces with pronounced cheekbones and leaves others smooth; the sprite drew
  // the same diagonal on everyone, which made every persona look gaunt and
  // lost a real distinguishing feature. The level comes from the spec's own
  // `cheekbones` and can be forced from the tuning panel.
  //
  //   0  none — a smooth cheek
  //   1  subtle and short
  //   2  subtle and long
  //   3  strong and short
  //   4  strong and long
  const cheek = cheekLevel(spec, L);
  if (cheek > 0) {
    const strong = cheek >= 3;
    const long = cheek === 2 || cheek === 4;
    const len = long ? 6 : 3;
    for (const side of [-1, 1] as const) {
      const from = Math.round(L.W * 0.42);
      const top = L.noseY - Math.round(L.H * 0.09);
      for (let i = 0; i < len; i += 1) {
        // A strong bone carries two steps at its head and one as it fades; a
        // subtle one never exceeds one, so it reads as a plane change rather
        // than as a drawn line.
        const depth = strong ? (i < Math.ceil(len / 2) ? 2 : 1) : 1;
        cut(L.fx + side * (from - i), top + i, depth);
      }
      // The lit ridge above it — what makes it a bone rather than a smudge.
      if (strong) form.addBias(L.fx + side * (from + 1), L.noseY - Math.round(L.H * 0.12), -1);
    }
  }
  // --- Under the lower lip, and the chin's own shelf.
  for (let dx = -1; dx <= 1; dx += 1) cut(L.fx + dx, L.mouthY + 2, 1);
  /**
   * The jaw's underside, which is where the head ends and the neck begins.
   *
   * The *underside* — not the chin. This used to shade the full width of the
   * bottom two rows by two steps, which put the front plane of the chin into
   * the same shadow as the jaw beneath it: measured against the bust, the
   * sprite's chin came out at 0.61 of its own cheek value where the bust's is
   * 0.91. A chin as dark as the shadow under it is not a chin, and that is
   * most of why these faces read as ending at the mouth.
   *
   * So the corners go dark and the point stays lit. That contrast *is* the
   * chin; there is no room at this scale to draw it any other way.
   */
  const jawHalf = Math.round(L.W * 0.34);
  const chinHalf = Math.max(1, Math.round(L.W * 0.13));
  for (let dx = -jawHalf; dx <= jawHalf; dx += 1) {
    const underJaw = Math.abs(dx) > chinHalf;
    cut(L.fx + dx, L.chinY, underJaw ? 2 : 1);
    if (underJaw) cut(L.fx + dx, L.chinY - 1, 1);
  }
  // --- The temple, in under the hairline on the shadow side.
  for (let i = 0; i < 3; i += 1) {
    cut(L.hx + noseSide * (L.rx - 1), L.browY - 2 + i, 1);
  }
}

// ---------------------------------------------------------------------------
// The face.
// ---------------------------------------------------------------------------

interface FaceOpts {
  frame: FaceFrame;
  gaze: number;
  expression: string;
}

/**
 * Expression, reduced to the three things a face this size can say: what the
 * brows are doing, what the mouth corners are doing, and how open the eyes
 * are. Everything in the portrait's thirteen-state vocabulary maps onto some
 * point in that box.
 */
function readExpression(name: string): { brow: number; mouth: number; open: number } {
  switch (name) {
    case 'smile': return { brow: 0, mouth: 1, open: 0 };
    case 'grin': return { brow: 0, mouth: 2, open: 0 };
    case 'content': return { brow: 0, mouth: 1, open: 0 };
    case 'smirk': return { brow: -1, mouth: 1, open: 0 };
    case 'sad': return { brow: 1, mouth: -1, open: 0 };
    case 'concern': return { brow: 1, mouth: -1, open: 0 };
    case 'scowl': return { brow: -2, mouth: -1, open: 0 };
    case 'determined': return { brow: -1, mouth: 0, open: 0 };
    case 'weary': return { brow: 1, mouth: -1, open: -1 };
    case 'guarded': return { brow: -1, mouth: 0, open: -1 };
    case 'surprise': return { brow: 2, mouth: 0, open: 1 };
    case 'thinking': return { brow: 1, mouth: 0, open: 0 };
    default: return { brow: 0, mouth: 0, open: 0 };
  }
}

export function drawFace(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  L: HeadLayout, headM: Mask, opts: FaceOpts
): void {
  const ex = readExpression(opts.expression);
  const isSkin = (x: number, y: number) => raster.matAt(x, y) === MAT.SKIN;
  /** A shadow mark: never a colour, always a step along the skin's own ramp. */
  const carve = (x: number, y: number, by = 1) => {
    if (isSkin(x, y)) form.addBias(x, y, by);
  };

  drawBrows(raster, spec, ramps, L, ex.brow);
  drawEyes(raster, form, spec, ramps, L, opts, ex, headM);
  drawNose(raster, form, spec, ramps, L, carve);
  // Facial hair before the mouth, never after. Drawn last it buried the lips
  // in a mass of almost-the-same-value beard and every bearded man lost his
  // expression; drawn first, the mouth is laid *into* it and reads.
  if (spec.facialHair) drawFacialHair(raster, form, spec, ramps, L, headM);
  drawMouth(raster, form, spec, ramps, L, opts, ex);
  const lobe = drawEars(raster, form, spec, ramps, L, headM);
  drawAge(spec, L, carve);
  drawMarkings(raster, form, spec, ramps, L, headM, opts, lobe);
}

/** Where one eye sits, and how it is put together. */
interface EyeGeom {
  /** Eye centre. */
  cx: number;
  /** How wide this eye is, in pixels. */
  ew: number;
  /** Leftmost column. */
  x0: number;
  /** The nose-side and temple-side corners. */
  innerX: number;
  outerX: number;
  /** Rows of aperture below the lash line. */
  aperture: number;
  /** Whether the outer corner rides a pixel high. */
  lift: number;
  hooded: boolean;
}

/**
 * Eye geometry, resolved once and shared.
 *
 * Kohl has to land on the eye that was actually drawn, and at three pixels of
 * eye a second, independent guess at the same numbers is off by one — which is
 * the difference between a lined eye and a smudge beside one. So the liner
 * reads its placement from here rather than re-deriving it.
 */
function eyeGeom(spec: PortraitSpec, L: HeadLayout, side: -1 | 1): EyeGeom {
  const shape = spec.eyeShape;
  const wide = shape === 'round' || shape === 'wide' || shape === 'large';
  const narrow = shape === 'narrow' || shape === 'hooded';
  // In a three-quarter turn the far eye narrows — foreshortening — but it does
  // NOT migrate toward the nose; it stays over its own socket. An earlier
  // version pulled it inward and both eyes ended up crowded onto one side of
  // the face.
  const far = side === -L.turn;
  const cx = L.fx + side * L.eyeDX;
  const ew = Math.max(3, L.eyeW + (wide ? 1 : narrow ? -1 : 0) - (far ? 1 : 0));
  const x0 = cx - Math.floor(ew / 2);
  return {
    cx,
    ew,
    x0,
    innerX: side === 1 ? x0 : x0 + ew - 1,
    outerX: side === 1 ? x0 + ew - 1 : x0,
    aperture: ew >= 5 ? 2 : 1,
    // Slant: almond and narrow eyes lift the outer corner, round ones sit
    // level. One pixel of offset reads clearly at this scale.
    lift: shape === 'almond' || shape === 'narrow' ? 1 : 0,
    // Only a genuinely hooded eye loses its white. The old droop threshold
    // caught a large share of ordinary faces and left them with two dark slots
    // for eyes, which at a distance is the difference between a person and a
    // mask.
    hooded: shape === 'hooded' || spec.lidDroop > 0.78,
  };
}

/**
 * Eyes. At this size the eye is a dark mark two or three pixels wide, and the
 * single most important decision is *not* whether it has a visible iris — it
 * is where the mark sits and how tall it is. The old sprite ran the portrait's
 * full sclera-and-iris stamp here, which at 18px produced the bulging glass
 * beads the reference notably does not have.
 */
function drawEyes(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  L: HeadLayout, opts: FaceOpts, ex: { open: number }, headM: Mask
): void {
  // Nothing on the face may be drawn outside the face.
  //
  // The eye is placed from `eyeDX` and widened by `eyeShape`, and on a narrow
  // skull — or a turned one, where the near cheek compresses — the outer
  // corner lands past the silhouette. A white pixel outside the head reads as
  // a hole punched through the outline, and it is the first thing the eye goes
  // to on the whole figure.
  const put = (x: number, y: number, c: RGB, mat: number, step: number) => {
    if (x < 0 || x >= SPRITE_W || y < 0 || y >= SPRITE_H) return;
    if (headM[y * SPRITE_W + x] !== 1) return;
    raster.set(x, y, c, mat, step);
  };
  const dark = ramps.book[MAT.BROW]?.steps[5] ?? ramps.hair.steps[5];
  const lash = ramps.lash;

  for (const side of [-1, 1] as const) {
    const { cx, ew, x0, innerX, outerX, aperture, lift, hooded } = eyeGeom(spec, L, side);

    if (opts.frame === 'blink') {
      // A closed eye is one lash-coloured row, with the lashes reaching a
      // pixel past the outer corner.
      for (let i = 0; i < ew; i += 1) put(x0 + i, L.eyeY + 1, lash, MAT.BROW, 5);
      put(outerX + side, L.eyeY + 1, lash, MAT.BROW, 5);
      continue;
    }

    // Row 0 is the lash line — the heaviest mark, and the one that actually
    // draws the eye's shape. Row 1 is the aperture: white, iris, and the
    // inner corner. Row 2 is the lower lid, a shadow rather than a line.
    for (let i = 0; i < ew; i += 1) {
      const atOuter = (side === 1 ? i === ew - 1 : i === 0);
      put(x0 + i, L.eyeY - (atOuter ? lift : 0), lash, MAT.BROW, 5);
    }
    if (!hooded) {
      // A **two-row aperture**, which is what the larger head finally affords.
      //
      // One row can hold a white, an iris and a corner but it cannot hold a
      // lid: the iris has nothing to be tucked under, no catchlight has
      // anywhere to sit that is not also the pupil, and the result reads as a
      // correctly-placed mark rather than as an eye. Two rows buy an iris that
      // meets the lash above it — which is what real eyes do, the upper lid
      // always cuts the iris — a lower rim of white beneath it, and room for a
      // single specular pixel.
      for (let row = 0; row < aperture; row += 1) {
        for (let i = 0; i < ew; i += 1) {
          put(x0 + i, L.eyeY + 1 + row, ramps.sclera.steps[row === 0 ? 3 : 4], MAT.SCLERA, row === 0 ? 3 : 4);
        }
      }
      const gaze = Math.max(-1, Math.min(1, opts.gaze));
      // The iris is a *mass*, not a dot: three pixels across on a wide eye and
      // the full depth of the aperture, so it reads as a disc partly hidden
      // under the lid.
      const irisW = ew >= 7 ? 3 : ew >= 5 ? 2 : 1;
      const irisX = Math.max(x0, Math.min(x0 + ew - irisW, cx - Math.floor(irisW / 2) + gaze));
      for (let row = 0; row < aperture; row += 1) {
        for (let i = 0; i < irisW; i += 1) {
          // Darker at the top where the lid shades it, as an eye actually is.
          put(irisX + i, L.eyeY + 1 + row, ramps.iris.steps[row === 0 ? 5 : 4], MAT.IRIS, row === 0 ? 5 : 4);
        }
      }
      // The catchlight. One pixel, on the light side of the iris and hard
      // against the lash line — it is the single mark that makes an eye look
      // wet, and it costs nothing.
      if (irisW >= 2) {
        const lightSide = L.turn > 0 ? 0 : irisW - 1;
        put(irisX + lightSide, L.eyeY + 1, ramps.sclera.steps[0], MAT.SCLERA, 0);
      }
      // The lacrimal caruncle — the warm fleck at the inner corner. It is one
      // pixel, and it is the difference between an eye and a bead.
      put(innerX, L.eyeY + 1, ramps.skinWarm.steps[4], MAT.SKIN, 4);
      // The lower lid: a lit rim under the aperture, which is what gives the
      // eye a floor and stops it reading as a hole.
      for (let i = 1; i < ew - 1; i += 1) form.addBias(x0 + i, L.eyeY + 1 + aperture, -2);
      // The lower lid catches light along its rim.
      for (let i = 1; i < ew - 1; i += 1) form.addBias(x0 + i, L.eyeY + 2, 1);
    } else {
      // A hooded eye shows only a sliver of aperture under the fold — but it
      // keeps one pixel of white at the outer corner. Without it the eye is a
      // slot, and a face with two slots reads as a mask at any distance.
      for (let i = 1; i < ew - 1; i += 1) {
        put(x0 + i, L.eyeY + 1, ramps.iris.steps[5], MAT.IRIS, 5);
      }
      put(outerX, L.eyeY + 1, ramps.sclera.steps[3], MAT.SCLERA, 3);
    }

    // The socket above the lid, deepening toward the nose, and the crease of
    // the upper lid on a hooded eye.
    for (let i = 0; i < ew; i += 1) form.addBias(x0 + i, L.eyeY - 1, 1);
    form.addBias(innerX, L.eyeY - 2, 1);
    if (hooded) put(outerX, L.eyeY - 1, lash, MAT.BROW, 5);
    // Lashes: a pixel past the outer corner on a long-lashed face.
    if (spec.eyelashes === 'long') put(outerX + side, L.eyeY - lift, lash, MAT.BROW, 5);
  }
}

/**
 * Brows. Three or four pixels of hair-coloured stroke, whose *angle* carries
 * most of the expression — at this scale the brows say more than the mouth.
 */
function drawBrows(
  raster: Raster, spec: PortraitSpec, ramps: PortraitRamps, L: HeadLayout, mood: number
): void {
  // Only a genuinely bushy brow gets two rows. At this scale a second row is
  // a third of the distance from brow to eye, and spending it on "thick"
  // as well left half the population looking like they were glowering.
  const thick = spec.browThickness === 'bushy' ? 2 : 1;
  const len = spec.browThickness === 'thin' ? 3 : 4;
  const color = ramps.brow.steps[spec.browThickness === 'thin' ? 4 : 5];

  for (const side of [-1, 1] as const) {
    const far = side === -L.turn;
    // Centred on its own eye, exactly as `eyeGeom` centres the eye. The brow
    // used to shift one pixel inboard on the far side while the eye under it
    // deliberately does not — `eyeGeom` says so in as many words — so on every
    // three-quarter face one brow sat over its eye and the other sat between
    // the eye and the nose. At a four-pixel brow that misalignment is a quarter
    // of its length and reads as a mistake rather than as foreshortening.
    const cx = L.fx + side * L.eyeDX;
    // The far brow *is* foreshortened, though: it loses its outer pixel, the
    // same end the far eye loses.
    const bl = far ? len - 1 : len;
    for (let i = 0; i < bl; i += 1) {
      // i runs from the inner end outward.
      const x = cx - Math.floor(bl / 2) + (side === 1 ? i : bl - 1 - i);
      const tt = i / Math.max(1, bl - 1);
      let dy = 0;
      // Shape: where along the brow the high point falls.
      if (spec.browShape === 'arched') dy = tt > 0.3 && tt < 0.8 ? -1 : 0;
      else if (spec.browShape === 'angular') dy = tt > 0.6 ? -1 : 0;
      else if (spec.browShape === 'rounded') dy = tt > 0.5 ? -1 : 0;
      // Mood tilts the inner end: down and in for a scowl, up for concern.
      if (mood < 0) dy += tt < 0.4 ? -mood * 0 + 1 : 0;
      else if (mood > 0) dy -= tt < 0.4 ? mood : 0;
      raster.set(x, L.browY + dy, color, MAT.BROW, 5);
      if (thick > 1) raster.set(x, L.browY + dy + 1, color, MAT.BROW, 5);
    }
  }
  // The furrow between them: only when the brows are actually pulled together.
  if (mood < -1) {
    raster.set(L.fx, L.browY + 1, ramps.brow.steps[5], MAT.BROW, 5);
  }
}

/**
 * The nose is shadow, not line. Everything here is a bias on the skin ramp —
 * a drawn nose at 18px reads as a smudge of dirt, but a plane change reads as
 * a nose.
 */
function drawNose(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  L: HeadLayout, carve: (x: number, y: number, by?: number) => void
): void {
  const shadowSide = -L.turn;
  const top = L.eyeY + 1;
  const tip = L.noseY;

  const long = spec.noseShape === 'aquiline' || spec.noseShape === 'roman';
  const bottom = tip + (long ? 1 : 0);

  // The side plane, running down from the inner brow.
  for (let y = top; y <= bottom; y += 1) {
    carve(L.fx + shadowSide, y, 1);
  }

  // **The bridge.** A lit column down the ridge, on the light side of the
  // midline and opposite the shadow plane.
  //
  // Every nose had a shadow and nothing to cast it: a dark stripe beside a
  // flat cheek reads as a smudge, not as a form standing off the face. The
  // pair is what makes it a nose — one plane turned to the light, one turned
  // away, meeting along the ridge. Only aquiline and roman noses used to get
  // this, which is why every other face looked as though its nose had been
  // pressed flat.
  const litSide = L.turn;
  for (let y = top; y <= bottom - 1; y += 1) {
    // Faintest at the root between the brows, strongest over the ball.
    const k = (y - top) / Math.max(1, bottom - 1 - top);
    if (raster.matAt(L.fx, y) === MAT.SKIN) form.addBias(L.fx, y, k > 0.5 ? -2 : -1);
  }
  if (long) {
    // A high bridge catches a second column and casts harder at the root.
    for (let y = top; y <= bottom - 1; y += 1) {
      if (raster.matAt(L.fx + litSide, y) === MAT.SKIN) form.addBias(L.fx + litSide, y, -1);
    }
    if (spec.noseShape === 'aquiline') carve(L.fx + shadowSide, top, 2);
  }

  // **The ball.** The tip is a small sphere and it takes the brightest mark on
  // the nose, with the underside turning away directly beneath it.
  const wide = spec.noseShape === 'broad';
  if (raster.matAt(L.fx, bottom) === MAT.SKIN) form.addBias(L.fx, bottom, -3);
  if (wide && raster.matAt(L.fx + litSide, bottom) === MAT.SKIN) {
    form.addBias(L.fx + litSide, bottom, -2);
  }

  // The base: nostrils, and the shadow the ball throws under itself. The
  // nostril is a *hole* — the darkest single mark on the face after the lash
  // line — and it is what stops the base reading as a lip.
  const half = wide ? 2 : 1;
  for (let dx = -half; dx <= half; dx += 1) {
    carve(L.fx + dx, bottom + 1, dx === 0 ? 2 : 3);
  }
  if (spec.noseShape === 'button') carve(L.fx, bottom, -1);
  // The wings flare either side of the base on a broad nose.
  if (wide) {
    carve(L.fx - half - 1, bottom, 1);
    carve(L.fx + half + 1, bottom, 1);
  }
}

/** The mouth: a line, its corners, and — for full lips — one lit pixel below. */
function drawMouth(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  L: HeadLayout, opts: FaceOpts, ex: { mouth: number }
): void {
  const shape = spec.lipShape;
  const w = Math.max(3, L.mouthW + (shape === 'wide' ? 1 : shape === 'thin' ? -1 : 0));
  const y = L.mouthY;
  const x0 = L.fx - Math.floor(w / 2);
  const line = ramps.lip.steps[5];
  const full = shape === 'full' || shape === 'bow';

  if (opts.frame === 'talk') {
    // An open mouth: a dark aperture with a lit lower lip under it. Two rows
    // is the whole animation, and it reads from across the screen.
    for (let i = 0; i < w; i += 1) {
      raster.set(x0 + i, y, ramps.lip.steps[6], MAT.LIP, 6);
      if (i > 0 && i < w - 1) raster.set(x0 + i, y + 1, ramps.lip.steps[3], MAT.LIP, 3);
    }
    if (spec.dental) raster.set(x0 + 1, y, ramps.book[MAT.TEETH]?.steps[1] ?? line, MAT.TEETH, 1);
    return;
  }

  // The mouth is three rows now, which is what it takes to have two lips: an
  // upper lip in shadow, the seam between them, and a lower lip catching the
  // light. A one-row mouth can only ever be a seam, and every face wearing
  // one looked pursed.
  for (let i = 0; i < w; i += 1) {
    const tt = i / Math.max(1, w - 1);
    // Corners: a smile lifts them, a scowl drops them, and that single pixel
    // of vertical offset is most of what the expression is.
    const corner = tt < 0.18 || tt > 0.82;
    const dy = corner ? -ex.mouth : 0;
    raster.set(x0 + i, y + dy, line, MAT.LIP, 5);
  }
  // Upper lip: a body of colour above the seam, with a **cupid's bow** — two
  // peaks either side of the philtrum rather than one flat band. At this size
  // that is a single raised pixel on each side of centre, and it is the
  // difference between a mouth and a horizontal mark.
  if (full || shape === 'medium') {
    for (let i = 1; i < w - 1; i += 1) {
      const off = x0 + i - L.fx;
      // The bow peaks one pixel either side of the midline and dips at it.
      const peak = Math.abs(off) === 1 ? 1 : 0;
      raster.set(x0 + i, y - 1 - peak, ramps.lip.steps[4], MAT.LIP, 4);
      // The upper lip turns *under* toward the mouth, so it sits in its own
      // shadow — always darker than the lower one, whatever the light does.
      form.addBias(x0 + i, y - 1 - peak, 1);
    }
  }
  // Lower lip: lit, and one pixel narrower again, with its own cast beneath.
  if (ex.mouth >= 2) {
    for (let i = 1; i < w - 1; i += 1) {
      raster.set(x0 + i, y + 1, ramps.book[MAT.TEETH]?.steps[1] ?? line, MAT.TEETH, 1);
    }
  } else {
    for (let i = 1; i < w - 1; i += 1) {
      raster.set(x0 + i, y + 1, ramps.lip.steps[full ? 2 : 3], MAT.LIP, full ? 2 : 3);
      // The lower lip is a roll facing up and out: it catches the light, and
      // its centre catches most of it.
      const off = Math.abs(x0 + i - L.fx);
      form.addBias(x0 + i, y + 1, off <= 1 ? -2 : -1);
    }
  }
  // The philtrum above, and the shadow under the lower lip that seats the
  // whole mouth into the face rather than printing it on the surface.
  form.addBias(L.fx, y - 2, 1);
  for (let i = 1; i < w - 1; i += 1) {
    if (raster.matAt(x0 + i, y + 2) === MAT.SKIN) form.addBias(x0 + i, y + 2, 1);
  }
}

/** One ear, on the near side. The far one is behind the head's own turn. */
function drawEars(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  L: HeadLayout, headM: Mask
): { x: number; y: number } {
  const side = -L.turn;
  const y = L.eyeY + 1;
  // Root the ear on the head's actual silhouette, not its nominal radius —
  // the outline tapers by this row and a nominal ear floats off the jaw.
  let edge = L.hx + side * L.rx;
  for (let k = 0; k <= L.rx + 2; k += 1) {
    const x = L.hx + side * (L.rx + 2 - k);
    if (headM[y * SPRITE_W + x]) { edge = x; break; }
  }
  // An ear, not a nub: an outer rim two pixels proud of the skull with a
  // darker hollow inside it. At a 30px head there is room for the distinction
  // and it is one of the few marks that reads as anatomy from a distance.
  const h = Math.max(4, Math.round(L.H * 0.20));
  for (let dy = 0; dy < h; dy += 1) {
    const tt = dy / Math.max(1, h - 1);
    // The rim tucks back in toward the jaw at the lobe.
    const out = tt > 0.72 ? 1 : 2;
    // From k = 0, i.e. *overlapping* the skull's own edge column. Starting at
    // 1 put the ear's first column one pixel outside the silhouette, and where
    // the head's contour stepped inward on that row it left a visible gap of
    // background between ear and head.
    for (let k = 0; k <= out; k += 1) {
      const x = edge + side * k;
      const rim = k === out;
      raster.set(x, y + dy, ramps.skinWarm.steps[rim ? 3 : 5], MAT.SKIN, rim ? 3 : 5);
      form.set(x, y + dy, side * 0.85, -0.2, 0.45, 0.42);
    }
  }
  // Where the ear meets the skull is a crease, and the jaw behind it darkens.
  for (let dy = 0; dy < h; dy += 1) form.addBias(edge, y + dy, 1);
  // The lobe, for whatever gets hung from it. An ear stud is the most common
  // marking the generator produces by a wide margin, and it has to sit on the
  // ear that was actually drawn — the ear's root is found from the silhouette,
  // so a stud placed at the nominal head radius misses it on a turned head.
  return { x: edge + side, y: y + h - 1 };
}

/**
 * How pronounced this face's cheekbones are, 0…4.
 *
 * Read from the spec so the sprite agrees with the bust about whether this
 * person has visible cheekbones at all, with the tuning able to override for
 * eyeballing the range. Gauntness and age both sharpen them — a thin or old
 * face shows bone the same full young one hides.
 */
function cheekLevel(spec: PortraitSpec, L: HeadLayout): number {
  if (L.cheekOverride >= 0) return L.cheekOverride;
  const named = String(spec.cheekbones ?? '').toLowerCase();
  let level = /high|sharp|prominent|angular/.test(named) ? 3
    : /soft|full|round|low/.test(named) ? 0
    : 1;
  if (spec.traits?.gaunt) level += 1;
  if (spec.age >= 60) level += 1;
  if (spec.build === 'heavy' || spec.build === 'stocky') level -= 1;
  return Math.max(0, Math.min(4, level));
}

/** Age lives in three places at this scale, and nowhere else fits. */
function drawAge(
  spec: PortraitSpec, L: HeadLayout, carve: (x: number, y: number, by?: number) => void
): void {
  const a = spec.ageLines;
  if (a > 0.5) {
    // Nasolabial folds: one pixel each side, from the nostril toward the chin.
    for (const side of [-1, 1] as const) {
      const nx = L.fx + side * Math.round(L.W * 0.17);
      carve(nx, L.mouthY - 1, 1);
      if (a > 0.7) { carve(nx, L.mouthY, 1); carve(nx + side, L.mouthY - 2, 1); }
    }
  }
  if (a > 0.62) {
    for (const side of [-1, 1] as const) {
      for (let i = -1; i <= 1; i += 1) carve(L.fx + side * L.eyeDX + i, L.eyeY + 2, 1);
    }
  }
  if (a > 0.78) {
    // One forehead line, broken so it never rules across the brow.
    const fw = Math.round(L.W * 0.24);
    for (let dx = -fw; dx <= fw; dx += 1) {
      if (dx === 0) continue;
      carve(L.fx + dx, L.browY - 2, 1);
    }
  }
  if (spec.traits?.gaunt) {
    for (const side of [-1, 1] as const) {
      carve(L.fx + side * 3, L.eyeY + 3, 1);
      carve(L.fx + side * 3, L.eyeY + 4, 1);
    }
  }
  if (spec.weathering > 0.55) {
    // Sun across the cheekbones and the bridge.
    for (const side of [-1, 1] as const) carve(L.fx + side * 3, L.eyeY + 2, -1);
  }
}

/**
 * Facial hair, as mass rather than as strands. Each style is a predicate over
 * the lower face: which pixels below the nose belong to the beard.
 */
/** Things a beard hangs in front of nothing of: worn metal, gems, held goods. */
const BEARD_MUST_NOT_COVER = new Set<number>([
  MAT.METAL, MAT.GEM, MAT.WOOD, MAT.GLASS, MAT.HEADWEAR,
]);

function drawFacialHair(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  L: HeadLayout, headM: Mask
): void {
  const fh = spec.facialHair!;
  const ramp = ramps.beard;

  const thinning = fh.thickness === 'thick' ? 0 : fh.thickness === 'medium' ? 22 : 38;
  // The moustache band, the chin patch and the jaw line are all fractions of
  // the head, not fixed offsets — on a 28px head fixed offsets left a goatee
  // floating above a bare chin.
  const stache = Math.max(2, Math.round(L.H * 0.09));
  const half = Math.max(2, Math.round(L.W * 0.16));
  const sideJaw = Math.max(3, Math.round(L.W * 0.22));
  const chinTop = Math.max(1, Math.round(L.H * 0.06));
  const top = L.mouthY - stache;

  // How far below the jaw the beard hangs.
  //
  // Every style used to stop two rows under the chin, so a full beard's mass
  // centred *above* the jawline — measured, −3.3px — and read as shading on
  // the face rather than as hair hanging off it. A full beard is the longest
  // thing on a head after the hair itself; the mass below the jaw is most of
  // what it is.
  const hang =
    fh.style === 'full_beard' || fh.style === 'verdi' ? Math.round(L.H * 0.30)
    : fh.style === 'chin_curtain' || fh.style === 'forked_beard' ? Math.round(L.H * 0.22)
    : fh.style === 'goatee' || fh.style === 'van_dyke' ? Math.round(L.H * 0.14)
    : fh.style === 'mutton_chops' ? Math.round(L.H * 0.06)
    : 0;
  const bottomY = L.chinY + 2 + hang;

  /**
   * How wide the beard is where it leaves the jaw.
   *
   * Measured off the skull rather than assumed, because the two have to meet.
   * The hang used to open at a flat `0.82 × rx` whatever the jaw was doing, and
   * once the skull started tapering properly to a 0.34 chin the mass pinched to
   * eight pixels at the jaw and ballooned to seventeen below it — an hourglass,
   * with a wedge of collar showing through the waist on each side.
   *
   * Taken across the last few rows rather than at the chin point, plus a pixel:
   * a beard sits on the jaw and stands slightly proud of it, so its width there
   * is the jaw's width at the corner, not at the tip of the chin.
   */
  /**
   * Where the beard stops being bounded by the face and takes its own outline.
   *
   * At the chin, as it was, is too low. Between the jaw corner and the point of
   * the chin the skull narrows by half, and a beard clamped to it narrowed with
   * it — so the mass pinched to six pixels at the jaw and reopened to eighteen
   * below, with a wedge of collar showing through on each side. A beard does
   * not follow the chin inward; it covers the jaw at the corner's width and
   * hangs from there. So the handover moves up to the corner, for the styles
   * whose mass actually covers a jaw.
   */
  const coversJaw = fh.style === 'full_beard' || fh.style === 'verdi'
    || fh.style === 'chin_curtain' || fh.style === 'forked_beard';
  const jawY = coversJaw ? L.chinY - Math.max(2, Math.round(L.H * 0.09)) : L.chinY;

  // How wide the mass is where it leaves the face — measured off the skull
  // rather than assumed, because the two have to meet. The hang used to open at
  // a flat `0.82 × rx` whatever the jaw was doing.
  /**
   * How much wider the beard reaches on one side than the other.
   *
   * The head is turned, and `headMask` builds it lopsided to say so: the near
   * cheek gets 0.80 of the half-width and the far cheek 1.13. Every width test
   * in this function is `|x - fx| <= something`, which is symmetric — so the
   * beard reached the silhouette on the near cheek and stopped short of it on
   * the far one, leaving a bare strip of jaw down that side. That is the
   * lopsidedness. The cap and the falling hair already take this correction;
   * the beard never did.
   *
   * Applied by dividing the distance rather than multiplying the limit, so one
   * scale corrects every test below at once.
   */
  const turnScale = (dx: number): number => {
    const onFar = L.turn > 0 ? dx < 0 : dx > 0;
    return onFar ? 1 + 0.13 * L.turnAmt : 1 - 0.20 * L.turnAmt;
  };

  let jawHalf = 2;
  for (let y = Math.max(0, jawY - 2); y <= jawY; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!headM[y * SPRITE_W + x]) continue;
      const dx = x - L.fx;
      jawHalf = Math.max(jawHalf, Math.abs(dx) / turnScale(dx));
    }
  }
  jawHalf += 1;

  // On a turned full beard, the near edge of the face pulls inward before the
  // hanging mass begins. Join those two outlines with a small wedge; otherwise
  // the background shows through as a notch on that side of the jaw.
  const bridgeNearJaw = fh.style === 'full_beard' || fh.style === 'verdi';
  const bridgeTop = L.mouthY;
  const nearDir = L.turn < 0 ? -1 : 1;
  const headEdgeAt = (y: number, dir: -1 | 1): number => {
    for (let d = L.rx + 2; d >= 0; d -= 1) {
      const x = L.hx + dir * d;
      if (x >= 0 && x < SPRITE_W && headM[y * SPRITE_W + x]) return x;
    }
    return L.hx;
  };
  const bridgeAnchor = headEdgeAt(bridgeTop, nearDir);
  const nearScale = turnScale(nearDir);
  const hangingNearEdge = L.fx + nearDir * Math.floor(jawHalf * nearScale);
  const inNearJawBridge = (x: number, y: number): boolean => {
    if (!bridgeNearJaw || L.turnAmt <= 0 || y < bridgeTop || y > jawY) return false;
    const t = (y - bridgeTop) / Math.max(1, jawY - bridgeTop);
    const outer = Math.round(bridgeAnchor + (hangingNearEdge - bridgeAnchor) * t);
    const faceEdge = headEdgeAt(y, nearDir);
    return nearDir < 0 ? x < faceEdge && x >= outer : x > faceEdge && x <= outer;
  };

  // Continuous with the jaw, swelling a little under it, then tapering to a
  // rounded or forked end.
  const hangHalf = (y: number): number => {
    if (y <= jawY) return 99;
    const k = (y - jawY) / Math.max(1, bottomY - jawY);
    const taper = fh.style === 'forked_beard' ? 0.82 : 0.9;
    return Math.max(1, Math.round(jawHalf * (1 + 0.35 * k) * (1 - Math.pow(k, 1.9) * taper)));
  };

  /**
   * Where a thinner beard lets skin through.
   *
   * Two bugs met here. The pattern was `(x * 3 + y) % dense === 0`, and with
   * `dense` 3 for a medium beard, `3x + y` is congruent to `y` modulo 3 — the x
   * term vanishes, so every third row was skipped across the whole width and a
   * medium beard came out in horizontal bands. At `dense` 2 the same expression
   * is `(x + y) % 2`, which does not band but reads as woven gauze.
   *
   * And it was applied only where `y > chinY - 2`, which is the wrong half: the
   * face stayed solid and the mass *hanging off the jaw* was the part shot full
   * of holes, so a sparse beard was confetti falling onto the collar. Thinness
   * belongs on the cheeks, where skin genuinely shows through growth. Below the
   * jaw the mass is opaque where it leaves the chin and only breaks up toward
   * its end, which is what a beard does.
   *
   * A coordinate hash cannot degenerate into a lattice at any density, because
   * there is no modulus left to collapse.
   */
  const hashAt = (x: number, y: number): number => {
    let h = Math.imul(x, 0x1f1f1f1f) ^ Math.imul(y, 0x27d4eb2d) ^ Math.imul(spec.seed, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    return ((h ^ (h >>> 15)) >>> 0) % 100;
  };
  const showsSkin = (x: number, y: number): boolean => {
    if (thinning === 0) return false;
    const k = y <= L.chinY
      ? 0.85
      : Math.pow(Math.min(1, (y - L.chinY) / Math.max(1, bottomY - L.chinY)), 1.7);
    return hashAt(x, y) < thinning * k;
  };

  /**
   * Where the beard starts on the cheek.
   *
   * A full beard here was `onStache || dy >= 0` — a moustache strip four
   * pixels wide, then nothing until the mouth line, then the whole lower face.
   * That leaves a bare band of cheek three rows deep running from the sideburn
   * to the corner of the mouth on both sides, which is the chunk missing out
   * of every bearded sprite. The bust never had it because it draws a line
   * (`beardLineAt`, art/hair) that rides high near the ears and dips to just
   * above the mouth corners in the middle; a horizontal cut-off gives everyone
   * a rectangular bib with a gap over it. This is that line, on the sprite.
   */
  const cheekLineY = L.noseY - 1;
  const beardLine = (dx: number): number => {
    const u = Math.min(1, Math.abs(dx) / Math.max(1, L.rx));
    return top + (cheekLineY - top) * Math.pow(u, 0.75);
  };

  const belongs = (x: number, y: number): boolean => {
    const dx = x - L.fx;
    const dy = y - L.mouthY;
    const ax = Math.abs(dx) / turnScale(dx);
    const onStache = dy >= -stache && dy <= -1 && ax <= half;
    const onCheek = y + 0.5 >= beardLine(dx);
    switch (fh.style) {
      case 'mustache':
        return onStache;
      case 'handlebar':
        return onStache || (dy <= -stache + 1 && ax <= half + 1);
      case 'soul_patch':
        return dy >= chinTop && dy <= chinTop + 1 && ax <= 1;
      case 'goatee':
        return onStache || (dy >= chinTop && ax <= half);
      case 'van_dyke':
        return onStache || (dy >= chinTop && ax <= half - 1);
      case 'imperial':
        return dy >= -stache && dy <= -1 && ax <= half + 1;
      case 'mutton_chops':
        return ax >= sideJaw && dy >= -stache * 2;
      case 'chin_curtain':
        return (ax >= sideJaw && dy >= -stache * 2) || (dy >= chinTop && ax <= sideJaw);
      case 'forked_beard':
        return onStache || (onCheek && ax <= sideJaw && ax !== 0);
      case 'stubble':
        return onCheek;
      case 'verdi':
      case 'full_beard':
      default:
        return onStache || onCheek;
    }
  };

  // A beard is a *mass with a top and an underside*, not a stencil filled in.
  // Flat, it swallowed the mouth and read as a smear; the upper surface of a
  // moustache catches the light and the hair under the lip goes almost black,
  // and those two marks are what let the mouth sit inside it and still read.
  const shadeBeard = (x: number, y: number) => {
    const dy = y - L.mouthY;
    if (dy <= -stache) form.addBias(x, y, -1);        // lit top of the moustache
    else if (dy > 0 && dy < chinTop + 2) form.addBias(x, y, 2); // under the lip
    else if (dy >= chinTop + 2) form.addBias(x, y, 1);          // the mass below
  };
  // From the highest the growth can reach — the cheek line by the ears — not
  // from the top of the moustache, or `belongs` never gets asked about a cheek.
  for (let y = Math.min(top, cheekLineY); y <= bottomY; y += 1) {
    for (let x = L.hx - L.rx - 1; x <= L.hx + L.rx + 1; x += 1) {
      // Below the jaw the head mask has ended and there is no skin to test —
      // so the beard's own outline takes over. Testing the head mask first, as
      // this did, made the hang impossible: every candidate row under the chin
      // was rejected before the silhouette code could run, which is why
      // extending `bottomY` changed nothing at all.
      const below = y > jawY;
      if (below) {
        if (Math.abs(x - L.fx) / turnScale(x - L.fx) > hangHalf(y)) continue;
        // Only over the neck and the collar — never over jewellery or anything
        // the figure is holding.
        //
        // This was an allow-list of skin and the first two cloth materials,
        // which meant any pixel of collar drawn in a *third* cloth, or in
        // leather, punched a hole straight through the beard. Naming what a
        // beard must not cover is the shorter and the more robust list: the
        // width test above is what keeps it off a raised arm.
        if (BEARD_MUST_NOT_COVER.has(raster.matAt(x, y))) continue;
        // A forked beard splits into two tails over its lower half.
        if (fh.style === 'forked_beard' && y > L.chinY + hang * 0.4
            && Math.abs(x - L.fx) < 2) continue;
      } else {
        const bridge = inNearJawBridge(x, y);
        if (!bridge) {
          if (!headM[y * SPRITE_W + x]) continue;
          if (raster.matAt(x, y) !== MAT.SKIN) continue;
          if (!belongs(x, y)) continue;
        } else if (BEARD_MUST_NOT_COVER.has(raster.matAt(x, y))) continue;
      }
      // The mouth keeps its own aperture. Drawing the beard across it and
      // then laying the lips back on top gave a lip-coloured line inside a
      // beard-coloured mass at almost the same value — a brown smear where
      // the mouth should be. Leaving a hole means the mouth is framed by hair
      // rather than buried in it.
      {
        const mdx = (x - L.fx) / Math.max(2, Math.round(L.mouthW * 0.62));
        const mdy = (y - L.mouthY) / 1.6;
        if (mdx * mdx + mdy * mdy < 1) continue;
      }
      if (fh.style === 'stubble') {
        // Stubble is a *sparse beard*, not a shadow. Rendering it as skin one
        // step darker meant the sprite carried no beard material at all, so a
        // stubbled man read as clean-shaven beside a bust that showed growth.
        // Growth is scattered, not woven. `(x + y) & 1` is a perfect diamond
        // lattice, and at this size a lattice reads as gauze laid over the chin
        // rather than as stubble on it — the same complaint as the banding
        // above, in its other form.
        if (hashAt(x, y) < 46) {
          raster.set(x, y, ramp.steps[2], MAT.BEARD, 2);
          form.set(x, y, (x - L.fx) / (L.rx + 1), 0.35, 0.7, 0.46);
          form.addBias(x, y, 1);
        }
        continue;
      }
      // A sparse beard lets skin through; a thick one does not.
      if (showsSkin(x, y)) continue;
      raster.set(x, y, ramp.steps[4], MAT.BEARD, 4);
      form.set(x, y, (x - L.fx) / (L.rx + 1), 0.35, 0.7, 0.46);
      shadeBeard(x, y);
    }
  }
}

// ---------------------------------------------------------------------------
/**
 * Markings: paint, tattoo, henna, scarification, piercing.
 *
 * The sprite used to draw all of them the same way — one three-pixel vertical
 * stroke beside the nose, in one hardcoded terracotta — which meant a Berber
 * chin tattoo, a bindi, a row of white clay dots and a kohl line were the same
 * mark in the same place in the same colour, and none of them were where the
 * spec said they were. Two things fix that, and they are separate: **where**
 * a mark goes, which is `markAnchor` reading `location`, and **what shape** it
 * is, which is `drawPattern` reading `pattern`.
 *
 * The vocabulary here is deliberately smaller than the portrait's. A 20px face
 * has room for perhaps eight distinguishable marks, and the ones worth
 * spending it on are the ones the generator actually emits — by volume that is
 * ear studs, kohl, nose studs, white forehead dots, tilak lines, bindis and
 * Berber chin work, in that order. Everything rarer resolves to the nearest of
 * those or, where it names a feature the sprite does not draw at all, to
 * nothing.
 */

/** How much of its region a mark spends, by declared size. */
const MARK_SCALE: Record<string, number> = { small: 0.7, medium: 1, large: 1.45 };

/**
 * Patterns naming something the sprite has no surface for: filed, blackened or
 * inlaid teeth, a bound foot, an elongated skull — which the spec has already
 * resolved into the skull's shape and is not paint at all. Drawing nothing is
 * the honest answer. The alternative is a stroke on the cheek that means
 * something else entirely, which is what the fallback used to do.
 */
const NO_SURFACE = /^(teeth_|foot_binding|cranial_elongation|plate|plug|coils)/;

/** The region of the face a marking's `location` names. */
interface MarkAnchor {
  x: number;
  y: number;
  /** Half the width the mark may spread across. */
  half: number;
  /** The rows it may use, inclusive — clamped so a mark cannot leave its region. */
  top: number;
  bottom: number;
  /** Whether the region spans the face (forehead, cheeks) or is a spot (chin, nose). */
  broad: boolean;
  /**
   * Whether the region is really two — a left cheek and a right one, with a
   * nose between them. Pigment laid solid across a paired region has to be laid
   * on each half: one band straight over the bridge reads as a stripe painted
   * on a mask, not as colour on a face.
   */
  paired: boolean;
}

function markAnchor(location: string, L: HeadLayout, hairline: number): MarkAnchor | null {
  const w = (f: number) => Math.max(2, Math.round(L.W * f));
  switch (location) {
    case 'forehead': {
      // Between the hairline and the brows. Under a blunt fringe there is no
      // forehead left, and the mark is then genuinely not visible on that
      // person — the paint went on first and the hair went over it.
      const top = hairline + 1;
      const bottom = L.browY - 1;
      if (bottom < top) return null;
      return { x: L.fx, y: bottom, half: w(0.3), top, bottom, broad: true, paired: false };
    }
    case 'brow':
      return { x: L.fx, y: L.browY, half: w(0.3), top: L.browY - 1, bottom: L.browY + 1, broad: true, paired: false };
    case 'cheek':
    case 'face':
      // The cheekbone: below the lower lid, and well above the mouth. Running
      // the region all the way down to the lip line let every pattern that
      // builds upward from `bottom` — solid above all — settle around the
      // mouth instead, which reads as a smeared face rather than a painted one.
      // The old placement had the opposite fault and started one row under the
      // eye line, which at this scale is still inside the eye.
      return {
        x: L.fx, y: L.eyeY + 4, half: w(0.36),
        top: L.eyeY + 3, bottom: Math.min(L.eyeY + 6, Math.max(L.eyeY + 4, L.mouthY - 2)),
        broad: true, paired: true,
      };
    case 'chin':
      return { x: L.fx, y: L.chinY - 1, half: w(0.16), top: L.mouthY + 1, bottom: L.chinY, broad: false, paired: false };
    case 'nose':
      return { x: L.fx, y: L.noseY, half: 2, top: L.eyeY + 2, bottom: L.noseY + 1, broad: false, paired: false };
    case 'lip':
    case 'mouth':
      return {
        x: L.fx, y: L.mouthY, half: Math.max(2, Math.round(L.mouthW / 2)),
        top: L.mouthY - 1, bottom: L.mouthY + 1, broad: false, paired: false,
      };
    case 'eye':
    case 'eyes':
      return { x: L.fx, y: L.eyeY, half: w(0.36), top: L.eyeY - 1, bottom: L.eyeY + 2, broad: true, paired: true };
    case 'neck':
      return { x: L.hx, y: L.chinY + 2, half: w(0.2), top: L.chinY + 1, bottom: L.chinY + 4, broad: false, paired: false };
    default:
      // Arms and chest belong to the body renderer, not the head.
      return null;
  }
}

/**
 * The step of a pigment that will actually be seen on this skin.
 *
 * Pigment drawn at its nominal value disappears whenever it happens to sit
 * near the wearer's complexion — white clay on a pale face, a dark tattoo on a
 * dark one — and at three or four pixels a mark that is merely *present* is
 * not a mark. So the ramp is searched outward from the base step for the first
 * one that clears the skin by a visible margin. The colour is never changed,
 * only which shade of it is used, which is what a real pigment does anyway:
 * ochre laid on thick reads lighter than ochre rubbed in.
 */
function legibleInk(pigment: Ramp, skin: RGB): RGB {
  const target = luminance(skin);
  for (const step of [3, 2, 4, 1, 5, 0, 6]) {
    if (Math.abs(luminance(pigment.steps[step]) - target) >= 0.17) return floorToInk(pigment.steps[step]);
  }
  return floorToInk(luminance(pigment.steps[3]) > target ? pigment.steps[0] : pigment.steps[6]);
}

/** Hold a pigment at or above the figure's darkest value. See `INK`. */
function floorToInk(c: RGB): RGB {
  return { r: Math.max(c.r, INK.r), g: Math.max(c.g, INK.g), b: Math.max(c.b, INK.b) };
}

function drawMarkings(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  L: HeadLayout, headM: Mask, opts: FaceOpts, lobe: { x: number; y: number }
): void {
  const hairline = hairlineY(spec, L);
  const skin = ramps.skin.steps[3];

  spec.markings.forEach((mark, index) => {
    const pattern = String(mark.pattern ?? '');
    if (NO_SURFACE.test(pattern)) return;

    if (mark.type === 'piercing') {
      drawPiercing(raster, form, mark, pattern, L, lobe, headM);
      return;
    }
    if (mark.type === 'structural') return;
    // Ochre worked through the hair, and anything on a limb, are drawn after
    // this pass — the hair is not on the raster yet and the arms are another
    // renderer's. See `tintHairMarkings` and `drawLimbMarkings`.
    if (pattern === 'hair_ochre') return;

    const anchor = markAnchor(mark.location, L, hairline);
    if (!anchor) return;
    const scale = MARK_SCALE[mark.size] ?? 1;
    const rng = (k: number) => unit(spec.seed, `mark-${index}-${k}`);

    // Kohl, drawn on the eyes rather than near them.
    if (pattern === 'eye_liner' || pattern === 'eye_band') {
      const ink = legibleInk(pigmentOf(mark.color), skin);
      if (pattern === 'eye_liner') drawEyeLiner(raster, spec, ink, L, headM, opts);
      else drawEyeBand(raster, spec, ink, L, headM, scale);
      return;
    }

    // Raised scarring is *form*, not colour: a keloid is the skin's own value
    // pushed either side of a ridge. Painting it flat — which is what the old
    // branch did with `raster.set` on `MAT.SKIN` — writes a colour that the
    // light pass then resolves straight back over, so it drew nothing at all.
    if (mark.type === 'scar' || pattern === 'scarification' || pattern === 'ritual_scar') {
      drawScarring(raster, form, anchor, scale, rng, pattern);
      return;
    }

    if (mark.type === 'birthmark') {
      drawBirthmark(raster, form, anchor, scale, rng, pattern);
      return;
    }

    // Freckles are pigment in the skin, not on it, so they go through the form
    // buffer like the scarring does. Across the nose and the tops of the
    // cheeks, which is where they actually are and what tells them apart from
    // a rash or a scatter of dirt.
    if (mark.type === 'freckles') {
      for (let i = 0; i < 9; i += 1) {
        const x = L.fx + Math.round((rng(i * 2) * 2 - 1) * anchor.half * 0.9);
        const y = L.eyeY + 2 + Math.round(rng(i * 2 + 1) * 2);
        if (raster.matAt(x, y) === MAT.SKIN) form.addBias(x, y, 2);
      }
      return;
    }

    const ink = legibleInk(pigmentOf(mark.color), skin);
    // Pigment takes only skin, and only inside its own region. That single
    // guard is what stops a cheek stripe from being painted over an eyeball,
    // which is what the unguarded version did to whichever eye the seed chose.
    const stamp = (x: number, y: number) => {
      if (y < anchor.top || y > anchor.bottom) return;
      if (raster.matAt(x, y) !== MAT.SKIN && raster.matAt(x, y) !== MAT.PAINT) return;
      raster.set(x, y, ink, MAT.PAINT, 3);
    };
    drawPattern(pattern, anchor, scale, rng, stamp);
  });
}

/** Marking pigment, mixed to be worn rather than to be lit. */
function pigmentOf(color: string | undefined): Ramp {
  // Less drift toward the light and shadow tints than the portrait uses, and
  // more chroma. The portrait can afford a pigment that sits quietly into the
  // modelling because it has ninety pixels of face to say it across; the
  // sprite has twenty, and a mark that is not saturated is not seen.
  return buildRamp(color || '#8b5a3c', { contrast: 1.05, shift: 0.12, saturation: 1.4 });
}

function drawPattern(
  pattern: string, a: MarkAnchor, scale: number,
  rng: (k: number) => number, stamp: (x: number, y: number) => void
): void {
  const rows = (n: number) => Math.max(1, Math.min(a.bottom - a.top + 1, Math.round(n * scale)));
  const span = Math.max(1, Math.round(a.half * 0.9));
  const line = (y: number, halfW: number) => {
    for (let dx = -halfW; dx <= halfW; dx += 1) stamp(a.x + dx, y);
  };

  switch (pattern) {
    case 'dot': {
      // A bindi. One pixel is a speck of noise at this size and reads as dirt;
      // a 2×2 block is the smallest thing that reads as having been *put* there.
      for (let dy = 0; dy <= 1; dy += 1) {
        for (let dx = 0; dx <= 1; dx += 1) stamp(a.x + dx, a.bottom - dy);
      }
      if (scale >= 1.4) {
        for (const [dx, dy] of [[-1, 0], [-1, -1], [2, 0], [2, -1]] as const) {
          stamp(a.x + dx, a.bottom + dy);
        }
      }
      break;
    }
    case 'dots':
    case 'spots': {
      // Scattered, not ranked: a row of evenly spaced pixels reads as a seam.
      const count = Math.max(4, Math.round(7 * scale));
      const band = Math.min(2, a.bottom - a.top);
      for (let i = 0; i < count; i += 1) {
        const dx = Math.round((rng(i * 2) * 2 - 1) * a.half);
        const dy = Math.round(rng(i * 2 + 1) * band);
        stamp(a.x + dx, a.bottom - dy);
      }
      break;
    }
    case 'three_lines': {
      // Tilak. Three strokes, and the gap between them is what makes it three
      // rather than one wide bar.
      const h = rows(3);
      const gap = Math.max(2, Math.round(a.half * 0.42));
      for (const dx of [-gap, 0, gap]) {
        for (let i = 0; i < h; i += 1) stamp(a.x + dx, a.bottom - i);
      }
      break;
    }
    case 'vertical_v': {
      const depth = Math.max(2, Math.min(rows(4), Math.round(a.half * 0.7)));
      for (let i = 0; i < depth; i += 1) {
        stamp(a.x - i, a.bottom - i);
        stamp(a.x + i, a.bottom - i);
      }
      break;
    }
    case 'stripes':
    case 'horizontal_lines':
    case 'horizontal_stripes':
    case 'geometric_bands': {
      const count = Math.max(2, Math.min(3, Math.round(2.5 * scale)));
      for (let i = 0; i < count; i += 1) {
        const y = a.bottom - i * 2;
        if (y < a.top) break;
        line(y, span);
      }
      break;
    }
    case 'lines':
    case 'vertical_lines': {
      // On both flanks, never across the middle — a bar through the centre of
      // a face at this scale reads as damage.
      const h = rows(3);
      const count = Math.max(2, Math.round(2 * scale));
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < count; i += 1) {
          const x = a.x + side * (Math.round(a.half * 0.45) + i * 2);
          for (let k = 0; k < h; k += 1) stamp(x, a.bottom - k);
        }
      }
      break;
    }
    case 'solid': {
      const ry = Math.max(1, Math.min(rows(2), 3));
      if (a.paired) {
        // One patch per cheek, with the nose left bare between them. A single
        // band across the width — which is what this used to draw — puts solid
        // pigment over the bridge and the nostrils, and at twenty pixels that
        // is not a painted face, it is a bar laid across one.
        for (const side of [-1, 1] as const) {
          const cx = a.x + side * Math.round(a.half * 0.6);
          const rx = Math.max(1, Math.round(a.half * 0.38));
          for (let dy = 0; dy <= ry; dy += 1) {
            const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / (ry + 0.8)) ** 2)));
            for (let dx = -w; dx <= w; dx += 1) stamp(cx + dx, a.bottom - dy);
          }
        }
      } else if (a.broad) {
        // The forehead takes it across its whole width, which is what a band of
        // ochre or a smeared caste mark actually is.
        for (let dy = 0; dy <= ry; dy += 1) {
          const w = Math.round(span * Math.sqrt(Math.max(0, 1 - (dy / (ry + 1.6)) ** 2)));
          line(a.bottom - dy, w);
        }
      } else {
        for (let dy = 0; dy < rows(2); dy += 1) line(a.bottom - dy, Math.max(1, a.half - 1));
      }
      break;
    }
    case 'berber':
    case 'berber_geometric':
    case 'geometric': {
      // The Berber chin mark: a stem between two bars. Three pixels across is
      // enough to say it, and the chin has no more than that.
      const w = Math.max(1, Math.min(2, Math.round(1.5 * scale)));
      const h = rows(3);
      line(a.bottom, w);
      line(a.bottom - h + 1, w);
      for (let i = 0; i < h; i += 1) stamp(a.x, a.bottom - i);
      break;
    }
    case 'flower':
    case 'floral': {
      stamp(a.x, a.y);
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) stamp(a.x + dx, a.y + dy);
      if (scale >= 1.4) for (const dx of [-1, 1]) { stamp(a.x + dx, a.y - 1); stamp(a.x + dx, a.y + 1); }
      break;
    }
    case 'cross': {
      const arm = Math.max(1, Math.round(1.6 * scale));
      for (let i = -arm; i <= arm; i += 1) { stamp(a.x + i, a.y); stamp(a.x, a.y + i); }
      break;
    }
    case 'zigzag': {
      for (let dx = -span; dx <= span; dx += 1) stamp(a.x + dx, a.bottom - (((dx + span) & 2) ? 1 : 0));
      break;
    }
    case 'swirls':
    case 'celtic':
    case 'maori_spiral':
    case 'maori_full': {
      // A hook on each cheek. A spiral needs a turn and a half to read as one,
      // and a turn and a half needs more pixels than this face has — so it is
      // drawn as the part of a spiral that survives: a curl with a tail.
      for (const side of [-1, 1] as const) {
        const cx = a.x + side * Math.round(a.half * 0.55);
        for (const [dx, dy] of [[0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]] as const) {
          stamp(cx + dx * side, a.y + dy);
        }
      }
      break;
    }
    default: {
      // Twenty-odd of the patterns the marking tables declare have no case
      // here. A short mark on one cheek is wrong quietly; a bar across the
      // face is wrong loudly, and that is what the fallback used to be.
      const y = a.bottom;
      for (let dx = 0; dx < Math.max(2, Math.round(a.half * 0.5)); dx += 1) {
        stamp(a.x + Math.round(a.half * 0.4) + dx, y);
      }
      break;
    }
  }
}

/**
 * Raised scarring. Keloid work is a ridge with a trough beside it, and both are
 * the skin's own value — pigment would make it a tattoo. Everything here goes
 * through the form buffer, because a colour written onto `MAT.SKIN` is resolved
 * away by the light pass a moment later.
 */
function drawScarring(
  raster: Raster, form: FormBuffer, a: MarkAnchor, scale: number,
  rng: (k: number) => number, pattern: string
): void {
  const skinAt = (x: number, y: number) => raster.matAt(x, y) === MAT.SKIN;
  const cut = (x: number, y: number, by: number) => {
    if (y < a.top || y > a.bottom || !skinAt(x, y)) return;
    form.addBias(x, y, by);
  };
  const h = Math.max(2, Math.min(a.bottom - a.top + 1, Math.round(3 * scale)));

  if (pattern === 'scarification' || pattern === 'ritual_scar') {
    // Rows of raised cicatrice on both flanks.
    const count = Math.max(2, Math.round(2 * scale));
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < count; i += 1) {
        const x = a.x + side * (Math.round(a.half * 0.45) + i * 2);
        for (let k = 0; k < h; k += 1) {
          cut(x, a.bottom - k, -2);
          cut(x + side, a.bottom - k, 2);
        }
      }
    }
    return;
  }
  // An ordinary scar: one seam, off-centre, running down the cheek.
  const side = rng(0) > 0.5 ? 1 : -1;
  const x = a.x + side * Math.max(2, Math.round(a.half * 0.5));
  for (let k = 0; k < h + 1; k += 1) {
    cut(x, a.bottom - k, 3);
    cut(x + side, a.bottom - k, -2);
  }
}

/**
 * Vitiligo and birthmarks, drawn as depigmentation rather than as paint: the
 * skin's own ramp shifted, so the cheekbone under the patch survives. A fixed
 * pale hex is right for exactly one complexion and chalky on every other.
 */
function drawBirthmark(
  raster: Raster, form: FormBuffer, a: MarkAnchor, scale: number,
  rng: (k: number) => number, pattern: string
): void {
  const patches = pattern === 'patches' || pattern === 'vitiligo' ? 3 : 1;
  const dir = pattern === 'patches' || pattern === 'vitiligo' ? -3 : 2;
  for (let p = 0; p < patches; p += 1) {
    const side = p % 2 === 0 ? -1 : 1;
    const cx = a.x + side * Math.round(a.half * (0.35 + rng(p * 3) * 0.5));
    const cy = a.top + Math.round(rng(p * 3 + 1) * Math.max(0, a.bottom - a.top));
    const rx = Math.max(1, Math.round(1.6 * scale));
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -rx; dx <= rx; dx += 1) {
        // A ragged edge is the diagnostic part; a clean ellipse of pale skin is
        // a highlight, a torn one is loss of pigment.
        if (Math.abs(dx) === rx && rng(p * 7 + dx + dy) > 0.5) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (y < a.top || y > a.bottom) continue;
        if (raster.matAt(x, y) !== MAT.SKIN) continue;
        form.addBias(x, y, dir);
      }
    }
  }
}

/**
 * A stud, ring or bar. This is the most common marking the generator produces
 * by a wide margin — more than a third of all of them — and the sprite drew
 * none of it, because the location filter kept only marks on the face and a
 * piercing is by definition on an edge of it.
 */
function drawPiercing(
  raster: Raster, form: FormBuffer, mark: { location: string; color: string },
  pattern: string, L: HeadLayout, lobe: { x: number; y: number }, headM: Mask
): void {
  const metal = buildRamp(mark.color || '#ffd700', { contrast: 1.1, shift: 0.1, saturation: 1.3 });
  // `MAT.GEM` is unlit, so the metal keeps its own colour instead of being
  // resolved back to whatever the skin under it was doing. Two pixels of gold
  // is all a piercing gets and both of them have to be gold.
  const bead = (x: number, y: number, lit = false) => {
    if (x < 0 || x >= SPRITE_W || y < 0 || y >= SPRITE_H) return;
    if (raster.alphaAt(x, y) === 0) return;
    raster.set(x, y, metal.steps[lit ? 1 : 3], MAT.GEM, lit ? 1 : 3);
    form.set(x, y, 0, -0.4, 0.85, 0.9);
  };

  switch (mark.location) {
    case 'ear':
      // Two pixels, not one. A single lit pixel on the lobe is lost against the
      // ear's own rim highlight; the second makes it read as an object hanging
      // there. It goes *up* the lobe, not down — `lobe.y` is already the ear's
      // last row and a bead below it lands on background, where the alpha guard
      // drops it and the stud silently stays one pixel.
      bead(lobe.x, lobe.y, true);
      bead(lobe.x, lobe.y - 1);
      if (pattern === 'ring' || pattern === 'hoop') bead(lobe.x, lobe.y + 1);
      break;
    case 'nose':
      if (pattern === 'septum' || pattern === 'ring') {
        // Through the septum, hanging below the nose rather than beside it.
        bead(L.fx, L.noseY + 2, true);
        bead(L.fx - 1, L.noseY + 2);
      } else {
        // A nostril stud sits on the wing of the nose, on the lit side.
        bead(L.fx + (L.turn || 1) * 2, L.noseY + 1, true);
      }
      break;
    case 'lip':
      bead(L.fx, L.mouthY + 2, true);
      break;
    case 'brow':
      bead(L.fx + (L.turn || 1) * 3, L.browY - 1, true);
      break;
    default: {
      // On the face somewhere unspecified: the cheek, where it will be seen.
      const x = L.fx + (L.turn || 1) * 3;
      if (headM[(L.eyeY + 4) * SPRITE_W + x]) bead(x, L.eyeY + 4, true);
      break;
    }
  }
}

/**
 * Ochre and butterfat worked through the hair — Himba otjize and its
 * relatives. It belongs in the hair, not as a stripe on the face, and the
 * sprite's hair is by far the largest surface it has to say so with.
 *
 * It is applied to the **ramp**, not to the pixels. Hair is a lit material, so
 * a colour written onto `MAT.HAIR` pixels is resolved straight back off the
 * book by the light pass a moment later — the first version of this walked the
 * whole head recolouring hair and changed not one pixel of the output. Tinting
 * the ramp instead dyes the hair and keeps every bit of its modelling, which is
 * also what otjize does: it is worked *into* the hair, not painted onto it.
 */
export function applyHairOchre(spec: PortraitSpec, ramps: PortraitRamps): void {
  const mark = spec.markings.find(m => m.pattern === 'hair_ochre');
  if (!mark) return;
  const ochre = mark.color || '#cc4125';
  ramps.hair = tintRamp(ramps.hair, ochre, 0.72);
  ramps.beard = tintRamp(ramps.beard, ochre, 0.5);
  ramps.book[MAT.HAIR] = ramps.hair;
  ramps.book[MAT.BEARD] = ramps.beard;
}

/**
 * Mehndi, and anything else worn on the arms.
 *
 * Two hundred–odd of every six thousand people the generator makes have henna
 * on their hands, and the sprite drew none of it — the head renderer's location
 * filter kept only marks on the face, and there was nowhere else for an arm to
 * be handled. At this scale the lacework itself is not drawable; what is
 * drawable, and what is actually the thing you see across a room, is that the
 * hands are dyed and the colour stops at the wrist.
 */
export function drawLimbMarkings(
  raster: Raster, spec: PortraitSpec, ramps: PortraitRamps,
  limbs: Array<{ wrist: [number, number]; hand: [number, number] }>
): void {
  for (const mark of spec.markings) {
    if (mark.location !== 'arm' && mark.location !== 'hand') continue;
    if (mark.type !== 'henna' && mark.type !== 'tattoo' && mark.type !== 'paint') continue;
    const ink = legibleInk(pigmentOf(mark.color), ramps.skin.steps[3]);
    const reach = mark.size === 'large' ? 4 : mark.size === 'medium' ? 3 : 2;

    for (const limb of limbs) {
      const [hx, hy] = limb.hand;
      const [wx, wy] = limb.wrist;
      for (let dy = -reach; dy <= reach; dy += 1) {
        for (let dx = -reach; dx <= reach; dx += 1) {
          const d = Math.hypot(dx, dy);
          if (d > reach) continue;
          const x = hx + dx;
          const y = hy + dy;
          if (raster.matAt(x, y) !== MAT.SKIN) continue;
          // Solid across the back of the hand, breaking up as it runs onto the
          // wrist — a hand dyed to a hard edge reads as a mitten.
          if (d > reach * 0.6 && ((x * 5 + y * 3) & 1) === 0) continue;
          raster.set(x, y, ink, MAT.PAINT, 3);
        }
      }
      // The cuff at the wrist, which is where mehndi actually stops.
      for (let dx = -2; dx <= 2; dx += 1) {
        if (raster.matAt(wx + dx, wy) !== MAT.SKIN) continue;
        raster.set(wx + dx, wy, ink, MAT.PAINT, 3);
      }
    }
  }
}

/**
 * Kohl, at sprite scale.
 *
 * The portrait draws a tapered lash line with an outer flick. At three or four
 * pixels of eye there is no room for a taper and none for a flick, so what is
 * left is the one thing that still separates a lined eye from a bare one: the
 * eye is *ringed* rather than merely topped. The lash row takes the pigment
 * outright, the lower rim — ordinarily a lit edge, which is what gives the eye
 * its floor — goes dark instead, and the line runs a pixel past the outer
 * corner. Three pixels of difference per eye, and they read.
 *
 * `MAT.PAINT` is unlit, so these pixels survive `resolveLight` exactly as
 * written; the lower lid's highlight bias simply stops applying where the
 * pigment has replaced the skin.
 */
function drawEyeLiner(
  raster: Raster, spec: PortraitSpec, ink: RGB, L: HeadLayout,
  headM: Mask, opts: FaceOpts
): void {
  // Nothing on the face may be drawn outside the face — the same rule the eyes
  // themselves follow, and for the same reason: a stray mark past the
  // silhouette reads as a hole in the outline.
  const put = (x: number, y: number) => {
    if (x < 0 || x >= SPRITE_W || y < 0 || y >= SPRITE_H) return;
    if (headM[y * SPRITE_W + x] !== 1) return;
    raster.set(x, y, ink, MAT.PAINT, 3);
  };

  for (const side of [-1, 1] as const) {
    const { ew, x0, outerX, aperture, lift, hooded } = eyeGeom(spec, L, side);

    if (opts.frame === 'blink') {
      // A closed eye is a single row, and the liner is that row.
      for (let i = 0; i < ew; i += 1) put(x0 + i, L.eyeY + 1);
      put(outerX + side, L.eyeY + 1);
      continue;
    }

    // The lash line.
    for (let i = 0; i < ew; i += 1) {
      const atOuter = (side === 1 ? i === ew - 1 : i === 0);
      put(x0 + i, L.eyeY - (atOuter ? lift : 0));
    }
    // What survives of the flick: one pixel past the outer corner, on the same
    // row the corner sits on.
    put(outerX + side, L.eyeY - lift);
    // The lower rim. Inset by a pixel at each end so the ring closes on the
    // corners rather than overshooting them into the cheek.
    const rimY = hooded ? L.eyeY + 2 : L.eyeY + 1 + aperture;
    for (let i = 1; i < ew - 1; i += 1) put(x0 + i, rimY);
  }
}

/**
 * A band of pigment laid across both eyes — charcoal, ochre, mourning paint.
 * It sits *on* the lids, so it stays thin: a solid bar deletes the face, and
 * the eyes have to survive it or there is no one left behind the paint.
 */
function drawEyeBand(
  raster: Raster, spec: PortraitSpec, ink: RGB, L: HeadLayout, headM: Mask, scale: number
): void {
  const left = eyeGeom(spec, L, -1);
  const right = eyeGeom(spec, L, 1);
  const x1 = Math.min(left.x0, right.x0) - 1;
  const x2 = Math.max(left.x0 + left.ew, right.x0 + right.ew);
  const rows = scale >= 1.4 ? 2 : 1;
  for (let r = 0; r < rows; r += 1) {
    for (let x = x1; x <= x2; x += 1) {
      const y = L.eyeY - 1 + r;
      if (x < 0 || x >= SPRITE_W || y < 0 || y >= SPRITE_H) continue;
      if (headM[y * SPRITE_W + x] !== 1) continue;
      raster.set(x, y, ink, MAT.PAINT, 3);
    }
  }
}

// ---------------------------------------------------------------------------
// Hair.
// ---------------------------------------------------------------------------

/**
 * The hairline. Placed by the schoolroom rule — a third of the way from crown
 * to chin — rather than relative to the brows, which put it one pixel above
 * them and left every figure with no forehead at all. `hairY` slides the whole
 * mass down over the skull; the slider existed and did nothing, because the
 * hairline was computed purely from the head box.
 *
 * Forehead markings need this as much as the hair does. Paint goes on before
 * the hair does, so a caste mark placed at a fixed height above the brow lands
 * under the fringe of anyone with one and is never seen again.
 */
export function hairlineY(spec: PortraitSpec, L: HeadLayout): number {
  const recede = Math.round(spec.recession * 3);
  return L.crownY + Math.round((L.chinY - L.crownY) * 0.3) - recede + L.hairY;
}

export interface HairResult {
  /** Everything drawn behind the head — drawn before the skull. */
  back: Mask;
  /** The cap and anything falling in front of the shoulders. */
  front: Mask;
}

/**
 * The outline above the brow, per arrangement — see `buildHair`.
 *
 * `vol` stands the mass off the sides, `lift` raises it above the crown, `hug`
 * pulls it in at the temple (negative carries it forward instead). Every entry
 * has to be distinguishable from every other *in outline alone*, at this size,
 * on a head that may also be wearing a hat — which is the same bar the
 * `HairSilhouette` vocabulary itself was written to.
 */
const HAIR_MASS: Partial<Record<HairSilhouette, { vol: number; lift: number; hug: number }>> = {
  // Standing away from the skull all round; the loudest silhouette there is.
  afro:         { vol: 4, lift: 3, hug: 0 },
  // Hanging ropes have real thickness but do not rise.
  locs:         { vol: 2, lift: 1, hug: 0 },
  // Flat to the scalp — the one arrangement that is *narrower* than bare hair.
  cornrows:     { vol: 0, lift: 0, hug: 0.55 },
  // Piled above the crown, wider than the skull as it goes up.
  updo:         { vol: 1, lift: 4, hug: 0.3 },
  twin_buns:    { vol: 3, lift: 1, hug: 0 },
  top_knot:     { vol: 0, lift: 3, hug: 0.45 },
  bun:          { vol: 0, lift: 1, hug: 0.35 },
  // Bound back off the face: the temple is bared, which is half the read.
  tied_back:    { vol: 0, lift: 0, hug: 0.5 },
  ponytail:     { vol: 0, lift: 0, hug: 0.45 },
  braid_single: { vol: 0, lift: 0, hug: 0.3 },
  braid_twin:   { vol: 0, lift: 0, hug: 0.25 },
  // Plaits wound above the hairline sit up and out a little.
  braid_crown:  { vol: 1, lift: 1, hug: 0.2 },
  // Cut forms carry their weight forward over the temple.
  bowl:         { vol: 1, lift: 0, hug: -0.25 },
  bob:          { vol: 1, lift: 0, hug: -0.15 },
  bangs:        { vol: 1, lift: 1, hug: -0.1 },
  swept:        { vol: 1, lift: 2, hug: 0 },
  // Mass kept along the midline, nothing at the sides at all.
  shaved_sides: { vol: 0, lift: 2, hug: 0.85 },
  tonsure:      { vol: 0, lift: 0, hug: 0.1 },
  loose:        { vol: 1, lift: 1, hug: 0 },
};

/**
 * Nineteen silhouettes collapse into three decisions at this scale: where the
 * hairline sits, how much mass stands off the skull, and what is attached at
 * the back. That is genuinely all an 18px head can carry — and it is enough,
 * because a bowl cut and a top-knot differ in exactly those terms.
 */
export function buildHair(spec: PortraitSpec, L: HeadLayout): HairResult {
  const back = makeMask(SPRITE_W, SPRITE_H);
  const front = makeMask(SPRITE_W, SPRITE_H);
  if (spec.hairLength === 'bald') {
    // Bald is usually a *pattern*, not an absence: the horseshoe above the
    // ears and round the back survives, and the bust draws it. The sprite
    // returned empty, so the two views disagreed about whether the man had
    // any hair — the most visible way for them to look like different people.
    //
    // The one case with genuinely nothing left is the condition `hair.ts:209`
    // uses, and it is matched here rather than approximated: a deep recession
    // on anything that is not a tonsure. Guessing a different threshold just
    // moves the disagreement instead of removing it.
    if (spec.recession > 0.85 && spec.hairSilhouette !== 'tonsure') {
      return { back, front };
    }
    const band = Math.max(2, Math.round(L.H * 0.14));
    for (let y = L.eyeY - band; y <= L.eyeY + Math.round(L.H * 0.06); y += 1) {
      const t = (y - (L.eyeY - band)) / Math.max(1, band);
      const half = L.rx + 1;
      // Only the flanks: the crown is bare, which is the whole point.
      const inner = Math.round(half * (0.62 + t * 0.2));
      for (let x = L.hx - half; x <= L.hx + half; x += 1) {
        if (Math.abs(x - L.hx) < inner) continue;
        if (x < 0 || x >= SPRITE_W || y < 0 || y >= SPRITE_H) continue;
        back[y * SPRITE_W + x] = 1;
      }
    }
    return { back, front };
  }

  const sil = spec.hairSilhouette;
  const put = (m: Mask, x: number, y: number) => {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    m[y * SPRITE_W + x] = 1;
  };

  // How the mass sits on the skull, per arrangement.
  //
  // `vol` is how far it stands off the sides, `lift` how far it rises above
  // the crown, and `hug` how hard it pulls in at the temple. Between them
  // those three are the entire outline above the brow, which is the loudest
  // thing about a head at this size.
  //
  // This used to be `vol` alone and `vol` was 0 for fifteen of the nineteen
  // arrangements, so `loose`, `bun`, `tied_back`, `braid_twin`, `braid_crown`
  // and `bangs` — 80% of the population between them — all wore the same cap
  // at the same width, and only `bowl` and `top_knot` departed from it at all.
  // The attachments at the back were carrying the whole distinction, and the
  // back of a head is the part a viewer sees least.
  const mass = HAIR_MASS[sil] ?? { vol: 1, lift: 1, hug: 0 };
  // Texture adds to whatever the arrangement already does: coiled hair worn
  // in a bun still stands further off the skull than straight hair does.
  const texVol =
    spec.hairTexture === 'coily' || spec.hairTexture === 'kinky' ? 2
    : spec.hairTexture === 'curly' ? 1
    : 0;
  const vol = mass.vol + texVol;
  const lift = mass.lift;

  const browLine = hairlineY(spec, L);
  const fringe = sil === 'bangs' || sil === 'bowl';

  // The cap itself.
  //
  // How domed the top is comes from the bust's own axis. This used to be a
  // flat plateau with a four-row chamfer (`0.6 + t * 2`, then constant), which
  // is a trapezoid — and hair built on a trapezoid is the exact shape the
  // bust's `roundCrown` was written to eliminate: "a trapezoid wearing a
  // trapezoid… the reason a page of portraits had a page of flat-topped caps
  // that read as folded paper rather than as cloth over a head." Measured over
  // 200 personas the sprite's crown ran 0.445 flat against the bust's 0.332.
  //
  // Flatness is one end of an axis rather than a constant, which is the point:
  // some skulls really are flat on top and the old shape is a good one of
  // those. `crownFor` reads a pure hash of the same seed and label the bust
  // uses, so a persona domed there is domed here, at no cost to either.
  const dome = crownFor(spec);
  const capBottom =
    sil === 'bowl' || sil === 'bob' ? L.chinY - 3
    : sil === 'tonsure' ? L.eyeY
    : L.eyeY + 1;
  const capTop = L.crownY - vol - lift;
  // Hair lies *on* the skull, so its outline is the skull's offset outward by
  // however far the mass stands off — not, as it was, a constant half-width
  // with an arc chamfered onto the top. A cap built on a flat-sided box is a
  // box, which is what put square hair on a head whose own outline curves.
  const outline = skullOutline(dome);
  const skullSpan = Math.max(1, L.chinY - L.crownY);
  // What the cap measures where it ends, so the falling mass can start there
  // rather than at some width of its own.
  let capEndHalf = 0;
  for (let y = capTop; y <= capBottom; y += 1) {
    let half: number;
    if (y >= L.crownY) {
      half = L.rx * outline(clamp01((y - L.crownY) / skullSpan)) + vol;
    } else {
      // Above the crown there is no skull left to follow, so the mass rounds
      // over the top of itself. Anchored to the crown's own half-width, so the
      // two meet without a step at the join.
      const rise = Math.max(1, L.crownY - capTop);
      const u = (L.crownY - y) / rise;
      half = (L.rx * outline(0) + vol) * Math.sqrt(Math.max(0.04, 1 - u * u));
    }
    // Above the brow the cap follows the skull; at the temples it pulls back
    // unless there is a blunt fringe holding it forward. How fast it pulls
    // back is the arrangement's own — a bound style bares the temple, a
    // cut one carries its weight forward over it.
    if (y > browLine && !fringe && sil !== 'bob') {
      half -= (y - browLine) * (0.6 + mass.hug);
    }
    half = Math.round(half);
    capEndHalf = Math.max(1, half);
    // The cap lies on the skull, so it turns with it.
    const { lo, hi } = turnedSpan(L, half);
    for (let x = lo; x <= hi; x += 1) {
      // The forehead is bare below the hairline, except under a fringe.
      const insideFace = y > browLine && Math.abs(x - L.hx) < L.rx - 1;
      if (insideFace && !(fringe && y <= browLine + 1)) continue;
      if (sil === 'tonsure' && y < L.crownY + 3 && Math.abs(x - L.hx) < L.rx - 2) continue;
      if (sil === 'shaved_sides' && y > L.crownY + 2 && Math.abs(x - L.hx) > 2) continue;
      // The crown belongs to the **front** layer.
      //
      // These two rows used to go to `back` only — and `back` is painted
      // before the skull, so the head was drawn straight over its own hair and
      // every figure came out with a bald patch on top that the bust does not
      // have. Hair lying on the crown is in front of the skull from any angle
      // the sprite is seen at; only the mass falling *behind* the head is not.
      put(front, x, y);
      put(back, x, y);
    }
  }

  // Length falling behind the head.
  //
  // `short` used to reach to within a tenth of a head of the chin — down the
  // cheek and level with the jaw. Combined with a mass that started at the
  // skull's full width while the cap above it had already pulled back at the
  // temples, that drew a cap, then a bare gap at the temple, then a wedge of
  // hair reappearing beside the jaw out of nothing. Short hair ends at the ear.
  const fallTo =
    spec.hairLength === 'very_short' ? L.eyeY
    : spec.hairLength === 'short' ? L.eyeY + Math.round(L.H * 0.10)
    : spec.hairLength === 'medium' ? L.chinY + Math.round(L.H * 0.2)
    : spec.hairLength === 'long' ? L.chinY + Math.round(L.H * 0.55)
    : L.chinY + Math.round(L.H * 0.95);
  const gathered = sil === 'bun' || sil === 'top_knot' || sil === 'updo'
    || sil === 'twin_buns' || sil === 'braid_crown' || sil === 'tied_back';
  if (!gathered && sil !== 'bob' && sil !== 'bowl' && spec.hairLength !== 'very_short') {
    for (let y = L.eyeY; y <= fallTo; y += 1) {
      const t = (y - L.eyeY) / Math.max(1, fallTo - L.eyeY);
      // The mass narrows as it falls, and curly hair keeps more width.
      // Starting from where the cap ended, so the two are continuous. Starting
      // at the skull's full width made the fall wider than the cap it hangs
      // from, which is the step that read as a mass appearing beside the jaw.
      const half = Math.round(capEndHalf * (1 - t * (vol ? 0.25 : 0.42)));
      // Turned with the head, like the cap. Left symmetric, this is the mass
      // that showed four pixels of hair past the skull on the far cheek and
      // none on the near one.
      const { lo, hi } = turnedSpan(L, half);
      for (let x = lo; x <= hi; x += 1) put(back, x, y);
    }
  }

  // Attachments.
  const blob = (m: Mask, cx: number, cy: number, r: number) => {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (dx * dx + dy * dy > r * r + 1) continue;
        put(m, cx + dx, cy + dy);
      }
    }
  };
  if (sil === 'bun') blob(back, L.hx - L.turn * (L.rx - 1), L.crownY + 2, 3);
  if (sil === 'top_knot') blob(back, L.hx, L.crownY - 2, 3);
  if (sil === 'twin_buns') {
    blob(back, L.hx - L.rx, L.crownY + 2, 2);
    blob(back, L.hx + L.rx, L.crownY + 2, 2);
  }
  if (sil === 'ponytail') {
    for (let y = L.crownY + 3; y <= L.chinY + 10; y += 1) {
      const x = L.hx - L.turn * (L.rx + 1);
      put(back, x, y);
      put(back, x - L.turn, y);
    }
  }
  if (sil === 'braid_single') {
    for (let y = L.chinY - 2; y <= L.chinY + 14; y += 1) {
      const x = L.hx + L.turn * (L.rx - 1);
      put(front, x, y);
      if ((y & 1) === 0) put(front, x + L.turn, y);
    }
  }
  if (sil === 'braid_twin') {
    for (const side of [-1, 1] as const) {
      for (let y = L.chinY - 2; y <= L.chinY + 10; y += 1) {
        const x = L.hx + side * (L.rx - 1);
        put(front, x, y);
        if ((y & 1) === 0) put(front, x + side, y);
      }
    }
  }
  if (sil === 'braid_crown') {
    for (let x = L.hx - L.rx; x <= L.hx + L.rx; x += 1) put(front, x, browLine);
  }
  if (sil === 'locs' || sil === 'cornrows') {
    // Vertical separations through the mass, which is the whole read.
    for (let y = L.crownY; y <= fallTo; y += 1) {
      for (let x = L.hx - L.rx - vol; x <= L.hx + L.rx + vol; x += 3) {
        if (back[y * SPRITE_W + x]) back[y * SPRITE_W + x] = 2;
      }
    }
  }
  if (sil === 'swept') {
    for (let x = L.hx - L.rx; x <= L.hx + L.rx; x += 1) {
      const d = Math.round(((x - (L.hx - L.rx)) / (2 * L.rx)) * 2);
      put(front, x, browLine + (L.turn > 0 ? d : 2 - d));
    }
  }

  // Never over the eyes: a fringe that reaches the lash line reads as damage.
  for (let y = L.eyeY - 1; y <= L.chinY; y += 1) {
    for (let x = L.fx - L.eyeDX - 2; x <= L.fx + L.eyeDX + 2; x += 1) {
      if (x < 0 || x >= SPRITE_W) continue;
      if (Math.abs(x - L.hx) < L.rx - 1) front[y * SPRITE_W + x] = 0;
    }
  }
  return { back, front };
}

/**
 * Hair, in four values rather than one.
 *
 * The mask alone gives a shell over the skull, and painting it flat is what
 * made every head look like it was wearing a moulded cap. Real hair at this
 * size reads on three cues, none of which cost more than a few pixels:
 *
 *   · a **lit crown plane** where the mass turns up to the sky, brightest just
 *     off the top and falling away fast;
 *   · **strand grouping** — short dark strokes running *along the flow*, which
 *     is down and outward from the part, rather than a uniform tone;
 *   · a **dark underside** where the mass turns under at the temple and the
 *     nape, which is what gives it thickness instead of paint.
 *
 * The flow is the important one. Strokes that follow the skull's curve read as
 * hair; strokes at any other angle read as scratches.
 */
export function paintHair(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, mask: Mask,
  L: HeadLayout, depth: number, seed = 0
): void {
  const at = (x: number, y: number) =>
    x >= 0 && x < SPRITE_W && y >= 0 && y < SPRITE_H && mask[y * SPRITE_W + x];

  // How far this hair can be lifted before it stops being its own colour.
  //
  // A ramp's highlight steps climb toward the light, and for a near-black base
  // they climb *fast* — two steps off #1a1a1a lands in mid grey. Lifting the
  // crown plane by a flat two steps therefore turned every black-haired
  // persona silver in the sprite while the bust kept them black, which is
  // about the most conspicuous way for the two views to disagree. Dark hair
  // gets a single step of sheen; only genuinely light hair can afford two.
  const base = ramps.hair.steps[3];
  const lum = (base.r * 0.299 + base.g * 0.587 + base.b * 0.114) / 255;
  const sheen = lum < 0.22 ? 1 : lum < 0.45 ? 1 : 2;

  // The part: where the crown's light originates and the flow runs away from.
  const partX = L.hx + Math.round(L.W * 0.16) * L.turn;

  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      const v = mask[y * SPRITE_W + x];
      if (!v) continue;
      raster.set(x, y, ramps.hair.steps[4], MAT.HAIR, 4);
      // Hair is a shell over the skull: its normal is the skull's, pushed out.
      const u = (x - L.hx) / (L.rx + 2);
      const w = (y - L.hy) / (L.ry + 3);
      form.set(x, y, u, w * 0.6, Math.sqrt(Math.max(0.05, 1 - u * u)), depth);
      // Hair's calibration lives in `MATERIAL_BIAS` alongside skin's; only the
      // extra absorption gets added here, since hair is not a polished sphere
      // and its lit face is barely above its own colour.
      form.addBias(x, y, 1);
      if (v === 2) form.addBias(x, y, 2);

      // --- The crown plane. Bright where the mass faces the sky, and only
      // there: a highlight spread over the whole silhouette is a helmet.
      const aboveEye = y < L.eyeY;
      const nearCrown = y < L.crownY + Math.round(L.H * 0.30);
      if (nearCrown && Math.abs(x - partX) < L.rx * 0.85) {
        const k = (y - L.crownY) / Math.max(1, L.H * 0.30);
        form.addBias(x, y, k < 0.45 ? -sheen : -Math.min(1, sheen));
      }

      // --- The underside. Where the mass turns under at the temples and
      // below the ear line it goes dark — this is the thickness cue.
      if (!aboveEye) form.addBias(x, y, 1);
      if (Math.abs(u) > 0.78) form.addBias(x, y, 1);

      // --- Strand grouping, running along the flow. The stroke's phase
      // shifts with distance from the part, so the locks fan off the crown
      // instead of lying in parallel rows.
      const dx = x - partX;
      const flow = Math.round(y * 0.55 + dx * 1.15 + seed);
      if (((flow % 5) + 5) % 5 === 0) form.addBias(x, y, 1);
      if (sheen > 1 && ((flow % 11) + 11) % 11 === 0) form.addBias(x, y, -1);
    }
  }

  // --- The fringe: an uneven edge where the hair meets the forehead. A ruled
  // horizontal there is the single loudest "this is a wig" cue.
  for (let x = L.hx - L.rx; x <= L.hx + L.rx; x += 1) {
    for (let y = L.crownY; y <= L.eyeY; y += 1) {
      if (!at(x, y) || at(x, y + 1)) continue;
      // This is the lowest hair pixel in the column — the fringe's edge.
      form.addBias(x, y, 2);
      const jag = ((x * 7 + seed) % 3) === 0;
      if (jag && at(x, y - 1)) form.addBias(x, y - 1, 1);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Headwear.
// ---------------------------------------------------------------------------

/**
 * The band of cloth that must survive between the face opening and the veil's
 * outer edge, in pixels. Below two the turned edge and the cloth behind it land
 * on the same column and the whole side reads as a wire.
 */
const MIN_VEIL_BAND = 2;

/**
 * The fall of a veil, shaded as what it is: a curtain, not part of the skull.
 *
 * `ellipsoidSurface` clamps anything outside its radii to a grazing normal, and
 * every pixel below the ear line is outside the skull's — so the whole fall
 * resolved to the darkest band of the ramp and then took the fold and hem bias
 * on top of a value already at the floor. Measured on the veil fixture that was
 * 369 pixels at the ramp's last step against 105 at the next-most-common one:
 * two thirds of the cloth in a single flat colour, with no amount of crease
 * detail able to show in it.
 *
 * A hanging curtain is a shallow barrel that widens as it drops, so each row
 * gets its own — a single radius would put the upper fall on the flat of a
 * shape it has not reached yet.
 */
function veilFallSurface(form: FormBuffer, m: Mask, L: HeadLayout, depth: number): void {
  const fallTop = L.eyeY + Math.round(L.H * 0.12) + 1;
  for (let y = fallTop; y < SPRITE_H; y += 1) {
    let lo = -1;
    let hi = -1;
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!m[y * SPRITE_W + x]) continue;
      if (lo < 0) lo = x;
      hi = x;
    }
    if (lo < 0) continue;
    const axis = (lo + hi) / 2;
    const half = Math.max(1, (hi - lo) / 2);
    for (let x = lo; x <= hi; x += 1) {
      if (!m[y * SPRITE_W + x]) continue;
      const u = Math.max(-1, Math.min(1, (x - axis) / half));
      // Shallower than a limb: cloth hanging off a head turns away over its
      // width but nothing like as hard as a drum does.
      const nz = Math.sqrt(Math.max(0.05, 1 - u * u * 0.45));
      form.set(x, y, u * 0.94, 0.18, nz, depth + nz * 0.06);
    }
  }
}

/**
 * The folds of a veil, and the lit band where it doubles back.
 *
 * Two marks carry almost all of it. The **fold-back edge** — a one-to-two pixel
 * band of the cloth's inner face running along the opening — is what stops the
 * veil reading as a hole cut in a shell, because it says the cloth has a
 * thickness and a reverse. The **radiating folds** fan from the pin at the
 * crown rather than falling plumb, which is what cloth suspended from a point
 * actually does and what distinguishes a veil from a curtain.
 */
function drapeVeil(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, L: HeadLayout, m: Mask
): void {
  const inMask = (x: number, y: number) =>
    x >= 0 && x < SPRITE_W && y >= 0 && y < SPRITE_H && m[y * SPRITE_W + x] === 1;

  // --- Sky light on the crown. ---------------------------------------------
  //
  // The key lamp is near-horizontal, so on a dome its lambert barely changes
  // with height: three rows down the centre of the veil resolved to the same
  // value, which is why the crown read as a flat plate. Cloth lying over a
  // skull outdoors is lit from *above* as well, and that vertical term is what
  // rounds it — brightest at the top, falling away toward the ear line.
  const domeTop = L.crownY;
  const domeBot = L.eyeY;
  for (let y = domeTop; y <= domeBot; y += 1) {
    const k = (y - domeTop) / Math.max(1, domeBot - domeTop);
    // Darkening only. The crown already resolves at the top of its ramp, so
    // *lifting* it — which is what the first version of this did — drove a
    // rust veil to #d6b89e, paler than the salmon it was meant to fix. The
    // crown holds its own colour and the cloth falls away from it into shade.
    const lift = k < 0.25 ? 0 : k < 0.55 ? 1 : k < 0.85 ? 2 : 3;
    if (lift === 0) continue;
    for (let x = L.hx - L.rx - 3; x <= L.hx + L.rx + 3; x += 1) {
      if (inMask(x, y)) form.addBias(x, y, lift);
    }
  }

  // --- The fold-back edge along the face opening. -------------------------
  // Walk each row inward from both sides; the first cloth pixel bordering the
  // opening is the turned edge, and it catches the light because it faces up
  // and out toward the sky.
  for (let y = L.crownY; y <= L.chinY + 2; y += 1) {
    for (const dir of [-1, 1] as const) {
      for (let step = 0; step <= L.rx + 2; step += 1) {
        const x = L.hx + dir * (L.rx + 2 - step);
        if (!inMask(x, y)) continue;
        if (inMask(x - dir, y)) continue; // not the inner edge yet
        form.addBias(x, y, -2);
        if (inMask(x + dir, y)) form.addBias(x + dir, y, -1);
        break;
      }
    }
  }

  // --- Folds radiating from the pin at the crown. -------------------------
  const pinX = L.hx + Math.round(L.W * 0.1) * L.turn;
  const pinY = L.crownY + Math.round(L.H * 0.1);
  // Find how far down the cloth actually reaches, so folds stop with it.
  let bottom = L.chinY;
  for (let y = L.chinY; y < SPRITE_H; y += 1) {
    let any = false;
    for (let x = 0; x < SPRITE_W && !any; x += 1) if (m[y * SPRITE_W + x]) any = true;
    if (any) bottom = y; else break;
  }
  const span = Math.max(1, bottom - pinY);

  // Five folds across the visible fall, angled outward. The two nearest the
  // silhouette are the deepest — that is where the cloth turns hardest away.
  for (let i = 0; i < 5; i += 1) {
    const spread = (i / 4 - 0.5) * 2;            // −1 … 1
    const edgeness = Math.abs(spread);
    const depth = edgeness > 0.7 ? 3 : edgeness > 0.35 ? 2 : 1;
    for (let k = 0; k <= span; k += 1) {
      const y = pinY + k;
      const t = k / span;
      // Radiating: the further down, the further out — and the fall widens
      // faster below the jaw, where the cloth clears the shoulders.
      const reach = L.rx * (0.35 + Math.pow(t, 0.8) * 1.5);
      const x = Math.round(pinX + spread * reach);
      if (!inMask(x, y)) continue;
      // Folds fade in below the crown: right at the pin the cloth is gathered
      // too tightly for any one crease to read.
      if (t < 0.12) continue;
      form.addBias(x, y, depth);
      // The lit shoulder of each fold, on the side facing the key light.
      const r = x + 1;
      if (inMask(r, y) && edgeness < 0.75) form.addBias(r, y, -1);
      if (depth >= 2 && inMask(x - 1, y)) form.addBias(x - 1, y, depth - 1);
    }
  }

  // --- Separation from the face. A pale veil on pale skin merges into one
  // shape unless the cloth's inner edge casts onto the face it frames; this
  // is the cue that says the cloth is in front and the face behind it.
  for (let y = L.crownY; y <= L.chinY; y += 1) {
    for (const dir of [-1, 1] as const) {
      for (let step = 0; step <= L.rx + 2; step += 1) {
        const x = L.hx + dir * (L.rx + 2 - step);
        if (!inMask(x, y)) continue;
        // Keep walking until the *inner* edge — the one bordering the face
        // opening. Without this guard the loop stops at the outer silhouette
        // and darkens both flanks of the veil into a brown mass that reads as
        // hair hanging out from under it.
        if (inMask(x - dir, y)) continue;
        form.addBias(x - dir, y, 2);
        form.addBias(x - dir * 2, y, 1);
        break;
      }
    }
  }

  // --- The fall's own folds, below the ear. --------------------------------
  //
  // The radiating creases above start at the crown and are largely spent by
  // the time the cloth clears the jaw, which left the two panels hanging past
  // the shoulders as flat sheets — the single most obviously unmodelled area
  // on a veiled figure. Cloth hanging free creases along its length, and the
  // creases are closer together near the edge where it is gathered.
  //
  // Authored small. These used to be two and three ramp steps — eight and
  // twelve dense ones — on a surface that was already pinned at the ramp's
  // floor, so they were both invisible and, where they did land, a terrace.
  // Now that `veilFallSurface` gives the fall somewhere to sit, a crease is
  // worth about one step.
  const fallTop = L.eyeY + Math.round(L.H * 0.15);
  for (const side of [-1, 1] as const) {
    for (let f = 0; f < 3; f += 1) {
      // Bunched toward the outer edge, spread toward the face.
      const u = 0.30 + f * 0.26;
      for (let y = fallTop; y <= bottom; y += 1) {
        const t = (y - fallTop) / Math.max(1, bottom - fallTop);
        // The panel widens as it falls, so the creases splay with it.
        const reach = L.rx * (0.55 + t * 0.75);
        const sway = Math.round(Math.sin(t * Math.PI * 1.3 + f * 1.7) * 1.2);
        const x = Math.round(L.hx + side * u * reach) + sway;
        if (!inMask(x, y)) continue;
        const deep = f === 1 ? 1.5 : 1.1;
        form.addBias(x, y, deep);
        // A crease is a valley with shoulders, not a ruled dark line: the cloth
        // rolls into it over three columns and back out of it.
        for (const dx of [-1, 1] as const) {
          if (inMask(x + dx, y)) form.addBias(x + dx, y, deep * 0.45);
        }
        // Its lit shoulder, on the side facing the lamp.
        if (inMask(x + 2, y)) form.addBias(x + 2, y, -0.6);
      }
    }
  }

  // --- The hem, and the shadow the cloth throws on the shoulder. ----------
  for (let x = 0; x < SPRITE_W; x += 1) {
    for (let y = bottom - 1; y <= bottom; y += 1) {
      if (inMask(x, y)) form.addBias(x, y, y === bottom ? 1.2 : 0.6);
    }
  }
  // Under the jaw the veil turns back under itself and goes dark.
  for (let x = L.hx - L.rx; x <= L.hx + L.rx; x += 1) {
    for (let y = L.chinY; y <= L.chinY + 2; y += 1) {
      if (inMask(x, y)) form.addBias(x, y, 1.4);
    }
  }
}


/**
 * Nine kinds of head covering, each a silhouette plus at most one band. At
 * portrait scale a hat is a study in weave and brim curvature; here it is six
 * pixels, and the only question that matters is which six.
 */
export function drawHeadwear(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps, L: HeadLayout
): Mask | null {
  const hw = spec.headwear;
  if (!hw || hw.kind === 'none') return null;

  const m = makeMask(SPRITE_W, SPRITE_H);
  const put = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    m[y * SPRITE_W + x] = 1;
  };
  const band: Array<[number, number]> = [];
  const top = L.crownY + L.hatY;
  // Crown heights as fractions of the head, so a hat on an imposing man is a
  // hat and not a skullcap.
  const rise = Math.max(2, Math.round(L.H * 0.16));
  // Where a close-fitting hat's lower edge sits. Anything that is not a brimmed
  // hat stops here rather than at the brows: the forehead below a cap or a
  // turban is bare skin on a real head, and it is the only surface a caste
  // mark, a tilak or a row of clay dots has to be drawn on.
  const brim = Math.max(top + 1, hairlineY(spec, L));
  // Woven plant fibre is one material and several hats, and the split is the
  // bust's: a name that states the shape — douli, salakot, sugegasa — is a cone
  // anywhere on earth; a name that states only the fibre is a cone in the
  // places that plait cones and a round-crowned sunhat everywhere else.
  //
  // The sprite used to test the first clause only, having no access to the
  // second, so every woven hat outside the named forms fell through to the
  // default branch below. That is one persona in seven.
  const hatText = `${hw.name ?? ''} ${hw.material ?? ''}`.toLowerCase();
  const woven = WOVEN_HAT_PATTERN.test(hatText);
  const conical = CONICAL_HAT_PATTERN.test(hatText)
    || (woven && CONICAL_ZONES.has(spec.culturalZone || ''));

  switch (hw.kind) {
    case 'cap': {
      const peak = PEAKED_CAP.test(hatText) ? peakedFormFor(hatText) : null;
      // A skullcap follows the crown and stops at the hairline — which is what
      // this always claimed to do and did not: the loop ran to `browY - 1`, one
      // row above the eyebrows. A cap pulled down to the brows leaves no
      // forehead at all, and it took every forehead marking with it.
      //
      // A newsboy is gathered onto a button and stands wider than the skull; a
      // service cap flares to a stiff flat top; a baseball cap and a flat cap
      // are fitted. A visor is nothing but the peak.
      const crown = peak === 'newsboy' ? 1.16 : peak === 'service' ? 1.06 : 1;
      const domeTop = peak === 'flat' ? 0.72 : peak === 'service' ? 0.9 : 0.55;
      if (peak !== 'visor') {
        for (let y = top - 1; y <= brim; y += 1) {
          const t = (y - (top - 1)) / Math.max(1, brim - top + 1);
          const half = Math.round((L.rx + 1) * crown * (domeTop + t * (1.05 - domeTop)));
          for (let x = L.hx - half; x <= L.hx + half; x += 1) put(x, y);
        }
      }
      if (peak) {
        // The bill. It reaches out over the brow on the side the face is
        // turned toward, because that is the direction it is pointing — a peak
        // drawn symmetrically about the skull reads as a brim, which is the
        // one thing none of these caps has.
        //
        // A baseball bill is long and curves down at the ends; a flat cap's is
        // short and sewn nearly flush; a service cap's is short and flat.
        const reach = peak === 'ball' ? Math.round(L.rx * 0.95)
          : peak === 'newsboy' ? Math.round(L.rx * 0.7)
          : Math.round(L.rx * 0.55);
        const y0 = brim - (peak === 'flat' ? 0 : 1);
        for (let i = 1; i <= reach; i += 1) {
          const u = i / reach;
          // The bill droops as it goes out, and a moulded one droops faster.
          const drop = Math.round(u * u * (peak === 'ball' ? 3 : 1.4));
          // How *deep* the bill is, top to bottom, before the 0.35 foreshorten
          // below. At 0.55 of the skull radius the inner end was fifteen pixels
          // tall — five rows of solid accent colour hanging over one brow,
          // which read as a patch stuck to the face rather than as a peak. A
          // bill seen at three-quarters is a thin wedge: two or three rows.
          const halfW = Math.round((1 - u * 0.55) * L.rx * (peak === 'ball' ? 0.34 : 0.26));
          const x = L.hx + L.turn * (Math.round(L.rx * 0.25) + i);
          for (let dy = -halfW; dy <= halfW; dy += 1) {
            const y = y0 + drop + Math.round(dy * 0.35);
            put(x, y);
            band.push([x, y]);
          }
        }
      }
      break;
    }
    case 'brimmed_hat': {
      if (conical) {
        // A shallow cone, which is what a sunhat is. Measured against the bust
        // the old one opened at 0.70px of half-width per row where the bust
        // opens at 1.46 — less than half the angle — so it came to a steep
        // point over the crown and read as a witch's hat rather than a douli.
        // It also started at zero width, which made the top rows a one-pixel
        // needle; a plaited apex is a small disc, not a spike.
        const brimY = L.browY - 1;
        const apex = top - rise + 1;
        const wide = L.rx + 8;
        for (let y = apex; y <= brimY; y += 1) {
          const t = (y - apex) / Math.max(1, brimY - apex);
          const half = Math.round(1 + t * (wide - 1));
          for (let x = L.hx - half; x <= L.hx + half; x += 1) put(x, y);
          // The rim is its own plane, the way the brim is below.
          if (y >= brimY - 1) for (let x = L.hx - half; x <= L.hx + half; x += 1) band.push([x, y]);
        }
      } else {
        const crownTop = top - rise;
        const brimY = L.browY - 1;
        for (let y = crownTop; y < brimY; y += 1) {
          const t = (y - crownTop) / Math.max(1, brimY - crownTop);
          // A crown turns over at the top and falls near-vertically below it.
          // `half = L.rx - 1` on every row — which is what this was — is a
          // cylinder with a flat lid, and it drew every straw sunhat in the
          // app as a pot. How far it domes is the difference between plaited
          // fibre, which is a shallow bowl, and blocked felt, which is not.
          let half = L.rx - 1;
          if (t < 0.34) {
            const u = 1 - t / 0.34;
            half *= Math.sqrt(Math.max(0.05, 1 - u * u * (woven ? 0.80 : 0.55)));
          }
          const h = Math.round(half);
          for (let x = L.hx - h; x <= L.hx + h; x += 1) put(x, y);
        }
        // The brim. Wider on a sunhat than on a felt hat — shade is the whole
        // point of the one and not of the other — and with thickness where it
        // overhangs, because a single row of it read as wire.
        const brimHalf = L.rx + (woven ? 7 : 4);
        for (let x = L.hx - brimHalf; x <= L.hx + brimHalf; x += 1) {
          const away = Math.abs(x - L.hx) / brimHalf;
          const y = brimY + (away > 0.60 ? 1 : 0);
          put(x, y);
          band.push([x, y]);
          if (away > 0.60) { put(x, y - 1); band.push([x, y - 1]); }
        }
      }
      break;
    }
    case 'wrapped_cloth': {
      // Six wraps, not one.
      //
      // This drew every `wrapped_cloth` as the same modest turban — a Sikh
      // safa, a Yoruba gele, a Palestinian keffiyeh and a Russian babushka all
      // came out as one shape at one size, while the bust had been telling
      // them apart for as long as it has had `wrapFormFor`. The metrics are
      // that classifier's, read at this scale.
      const w = WRAP_METRICS[wrapFormFor(hatText)];
      const wrapRise = Math.max(1, Math.round(L.H * w.rise));
      const wrapHalf = (L.rx + 1) * w.wide;
      // A turban's lower edge sits a wrap's width below the hairline — not on
      // the eyebrows, which is where this used to end and which is why a tilak
      // or a caste mark was never once visible under one.
      const bottom = brim + 1;
      const wrapTop = top - wrapRise - 1;
      for (let y = wrapTop; y <= bottom; y += 1) {
        const t = (y - wrapTop) / Math.max(1, bottom - wrapTop);
        // A gele flares as it rises; everything else swells toward the brow.
        const shape = w.wide > 1.3 ? 1.05 - t * 0.42 : 0.62 + t * 0.43;
        const half = Math.round(wrapHalf * shape);
        for (let x = L.hx - half; x <= L.hx + half; x += 1) put(x, y);
        // Every third row is the edge of a wrap. A keffiyeh is laid, not
        // wound, so it has no wrap edges to show.
        if (w.fall < 0.4 && (y - top) % 3 === 0) {
          for (let x = L.hx - half; x <= L.hx + half; x += 1) band.push([x, y]);
        }
      }
      // Cloth falling past the ears — the keffiyeh's sides, a headcloth's tail.
      if (w.fall > 0) {
        const fallTo = L.chinY + Math.round(L.H * w.fall);
        const halfAtBrim = Math.round(wrapHalf * (w.wide > 1.3 ? 0.63 : 1.05));
        for (let y = bottom + 1; y <= fallTo; y += 1) {
          const t = (y - bottom) / Math.max(1, fallTo - bottom);
          const half = Math.round(halfAtBrim * (1 - t * 0.25));
          for (let x = L.hx - half; x <= L.hx + half; x += 1) {
            // Never across the face: this hangs beside it.
            if (Math.abs(x - L.hx) < L.rx - 1 && y < L.chinY) continue;
            put(x, y);
          }
        }
      }
      // The cord or knot that holds it: an agal, a kerchief's tie.
      if (w.band) {
        const y = brim;
        const half = Math.round(wrapHalf * 1.0);
        for (let x = L.hx - half; x <= L.hx + half; x += 1) band.push([x, y]);
      }
      break;
    }
    case 'veil':
    case 'hood': {
      // A veil is not a trapezoid with a hole in it. Real head-cloth:
      //
      //   · **hugs the skull** down to the ear line before it falls;
      //   · has a face opening that is an **arc**, curving round the brow, past
      //     the temple and in under the jaw — never a straight-sided hole;
      //   · **doubles back** along that opening, so the inner face of the cloth
      //     shows as a lit band a pixel or two wide;
      //   · **falls in folds** that spread as it drops over the shoulders.
      //
      // Four veils, not one: a dupatta laid over the head, a pinned hijab, a
      // mantilla high on a comb and an enveloping chador were all drawn as the
      // same sheet with the same hole in it. `veilFormFor` is the bust's
      // classifier and has told them apart for as long as it has existed; the
      // sprite simply never asked. A hood is a garment, not a veil, and keeps
      // its own numbers.
      const isHood = hw.kind === 'hood';
      const v = isHood ? HOOD_METRICS : VEIL_METRICS[veilFormFor(hatText)];
      const drop = L.chinY + Math.round(L.H * v.drop);
      const earY = L.eyeY + Math.round(L.H * 0.12);
      const crown = top - Math.round(rise * 0.15);

      // The outer silhouette: skull-hugging above the ear, spreading below it.
      const halfAt = (y: number): number => {
        if (y <= crown + Math.max(2, Math.round(L.H * 0.14))) {
          // The cloth lies *on* the skull, so its top follows the same arc the
          // cranium does. The floor inside the sqrt is what keeps the topmost
          // row a small disc rather than a two-pixel spire.
          const span = Math.max(2, Math.round(L.H * 0.14));
          const k = 1 - (y - crown) / span;
          return Math.max(3, Math.round((L.rx + 1) * Math.sqrt(Math.max(0.42, 1 - k * k))));
        }
        if (y <= earY) {
          const k = (y - crown) / Math.max(1, earY - crown);
          return L.rx + 1 + Math.round(k * 1.5);
        }
        // Below the ear it falls away from the neck and over the shoulders on a
        // curve — front-loaded, so it clears the jaw quickly and then hangs
        // rather than continuing to flare into a cape. How far it swings clear
        // is the difference between cloth pinned to the skull and cloth merely
        // laid on it.
        const k = (y - earY) / Math.max(1, drop - earY);
        const swing = 0.5 * (1.35 - v.hug * 0.7);
        return L.rx + 1 + Math.round(Math.pow(Math.min(1, k * 1.7), 0.7) * L.rx * swing);
      };

      // The face opening, in the vocabulary `VeilMetrics` sets out. `open` is
      // how much of the head's half-width the gap spans at the cheek; `lead` is
      // where the cloth's front edge crosses the skull, 0 at the crown and 1 at
      // the brow — the number that tells a mantilla from a wimple; `chin` is
      // how far below the jaw the opening reaches before the cloth closes.
      const openCx = L.fx + Math.round(L.W * 0.04) * L.turn;
      // Never tight enough to eat an eye. `open` low enough to be a chador on a
      // broad head is low enough to clip the outer corner of both eyes on a
      // narrow one, and at this size one lost eye is most of the face.
      const openRx = Math.max(
        4, L.eyeDX + Math.ceil(L.eyeW / 2) + 1, Math.round(L.rx * v.open),
      );
      const leadY = L.crownY + Math.round((L.browY - L.crownY) * Math.min(1.2, v.lead));
      const openBottom = L.chinY + Math.round(L.H * v.chin);
      const openCy = Math.round((leadY + openBottom) / 2);
      const openRy = Math.max(5, Math.round((openBottom - leadY) / 2));
      // The opening yields to the cloth, always.
      //
      // It is an ellipse about the *face's* midline; the silhouette above is an
      // arc about the *head's*. On a three-quarter head those centres are three
      // pixels apart, and with `openRx` near `L.rx` the far side worked out to
      // **minus two pixels of cloth** — the opening cut clean through the
      // silhouette. That is the thread of stranded pixels down the far side of
      // every veiled figure in the app, and the stripe of background between
      // the cloth and the cheek it is supposed to be touching. Clamping here
      // rather than moving either centre keeps the ellipse's shape and makes a
      // band narrower than two pixels unrepresentable.
      // …and it stops at the head. Clamping only against the silhouette left
      // the opening reaching past the cheek on the far side of a turned head,
      // so three columns of it fell outside the skull altogether and showed
      // *background* between the cloth and the face — the gap in the reference
      // shot. The skull is lopsided once the head turns and the ellipse is not,
      // so the only thing that knows where the cheek actually is is the mask.
      const skull = headMask(spec, L);
      const skullEdge = (y: number, dir: -1 | 1): number => {
        if (y < L.crownY || y > L.chinY) return L.hx + dir * (L.rx + 1);
        for (let i = L.rx + 3; i >= 0; i -= 1) {
          const x = L.hx + dir * i;
          if (x >= 0 && x < SPRITE_W && skull[y * SPRITE_W + x]) return x;
        }
        return L.hx;
      };
      const insideOpening = (x: number, y: number): boolean => {
        const dy = (y - openCy) / openRy;
        if (dy * dy >= 1) return false;
        const half = openRx * Math.sqrt(1 - dy * dy);
        const edge = halfAt(y);
        const lo = Math.max(openCx - half, L.hx - edge + MIN_VEIL_BAND, skullEdge(y, -1));
        const hi = Math.min(openCx + half, L.hx + edge - MIN_VEIL_BAND, skullEdge(y, 1));
        return x > lo && x < hi;
      };

      // The lower edge is a *hem*, not a cut. Ending the fall on one row draws
      // a ruled horizontal across the shoulders, and because the veil is nearly
      // as wide as they are that line read as the shoulders being square.
      const bottomAt = (x: number): number => {
        const k = (x - L.hx) / Math.max(1, halfAt(drop));
        const shoulder = Math.abs(Math.abs(k) - 0.62);
        const lift = Math.round(Math.min(4, shoulder * 7) + (1 - Math.cos(k * Math.PI)) * 1.2);
        const jag = ((x * 5 + L.crownY) % 3) === 0 ? 1 : 0;
        return drop - lift - jag;
      };

      // A split veil hangs as two panels with the chest between them; a chador
      // is one sheet and does not part. Without this a dupatta buried the
      // garment it is supposed to be worn *over*.
      const partFrom = L.chinY + Math.round(L.H * v.chin);
      for (let y = crown; y <= drop; y += 1) {
        const half = halfAt(y);
        // The turn: more cloth falls on the far side, because that is the side
        // swinging away from us.
        const lo = L.hx - half - (L.turn > 0 ? 1 : 0);
        const hi = L.hx + half + (L.turn < 0 ? 1 : 0);
        // How far the panels have drawn apart by this row.
        const gap = v.split && y > partFrom
          ? Math.round(L.rx * 0.45 * Math.min(1, (y - partFrom) / Math.max(1, drop - partFrom)) + 1)
          : 0;
        for (let x = lo; x <= hi; x += 1) {
          if (insideOpening(x, y)) continue;
          if (y > bottomAt(x)) continue;
          if (gap > 0 && Math.abs(x - L.hx) < gap) continue;
          put(x, y);
        }
      }
      break;
    }
    case 'helmet': {
      for (let y = top - rise; y <= L.eyeY - 1; y += 1) {
        const t = (y - (top - rise)) / Math.max(1, L.eyeY - top + rise - 1);
        const half = Math.round((L.rx + 1) * (0.5 + t * 0.6));
        for (let x = L.hx - half; x <= L.hx + half; x += 1) put(x, y);
      }
      // The nasal bar — the one detail that says helmet and not cap.
      for (let y = L.eyeY - 1; y <= L.noseY; y += 1) put(L.fx, y);
      break;
    }
    case 'coronet': {
      for (let x = L.hx - L.rx; x <= L.hx + L.rx; x += 1) {
        put(x, L.browY - 1);
        put(x, L.browY - 2);
        if ((x - L.hx) % 3 === 0) put(x, L.browY - 3);
      }
      break;
    }
    case 'band': {
      for (let x = L.hx - L.rx; x <= L.hx + L.rx; x += 1) {
        put(x, L.browY - 1);
        put(x, L.browY - 2);
      }
      break;
    }
  }

  const metal = hw.kind === 'helmet' || hw.kind === 'coronet';
  const ramp = metal ? ramps.metal : ramps.headwear;
  const mat = metal ? MAT.METAL : MAT.HEADWEAR;
  for (let y = 0; y < SPRITE_H; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!m[y * SPRITE_W + x]) continue;
      raster.set(x, y, ramp.steps[3], mat, 3);
    }
  }
  // A hat is a dome over the skull; a veil is cloth hanging off one.
  if (hw.kind === 'veil' || hw.kind === 'hood') {
    // The skull it wraps is a tight dome, so the skull's radii are what the
    // cloth over it is shaded against — given the whole veil's bounding box the
    // curvature over the crown is almost nil and every pixel of it resolves to
    // one flat plate of colour.
    ellipsoidSurface(form, m, L.hx + L.turn, L.hy, L.rx + 2, L.ry + 3, 0.56, 0.85);
    veilFallSurface(form, m, L, 0.56);
    drapeVeil(raster, form, ramps, L, m);
  } else if (hw.kind === 'coronet' || hw.kind === 'band') {
    planeSurface(form, m, L.turn * 0.3, -0.2, 0.58);
  } else {
    ellipsoidSurface(form, m, L.hx + L.turn, L.crownY + 2, L.rx + 3, L.ry, 0.58, 0.8);
  }
  // Bands and brims are their own plane, one step down, in the accent colour
  // where the hat has one.
  for (const [bx, by] of band) {
    if (!m[by * SPRITE_W + bx]) continue;
    raster.set(bx, by, ramps.headwearAccent.steps[4], MAT.HEADWEAR_ACCENT, 4);
    form.addBias(bx, by, 1);
  }
  return m;
}
