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
import { RGB } from '../../components/portraitLab/core/color';
import { unit } from '../../components/portraitLab/core/rng';
import {
  CONICAL_HAT_PATTERN, PortraitSpec,
} from '../../components/portraitLab/spec/types';
import { Skeleton, SPRITE_H, SPRITE_W } from './skeleton';
import { ellipsoidSurface, FormBuffer, planeSurface } from './spriteLight';

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
    eyeDX: Math.round(W * 0.26) + Math.round(t.eyeGap / 2),
    // How wide one eye is. Four pixels is the threshold at which an eye can
    // hold a lash line, a white, an iris and an inner corner all at once —
    // which is the single biggest legibility gain of the larger head.
    eyeW: Math.max(3, Math.round(W * 0.25)),
    mouthW: Math.max(4, Math.round(W * 0.31)),
    turn,
    turnAmt,
    hatY: t.hatY,
  };
}

/**
 * The skull's silhouette. `faceShape` sets the taper below the cheekbones and
 * `jawline` the corner it turns at the chin — at this scale those are the only
 * two decisions the outline can actually carry, but between them they are
 * enough to tell a long-jawed man from a round-faced one at a glance.
 */
export function headMask(spec: PortraitSpec, L: HeadLayout): Mask {
  const m = makeMask(SPRITE_W, SPRITE_H);
  const shape = spec.faceShape;
  const jaw = spec.jawline;
  const elongated = spec.skull === 'elongated';

  for (let y = L.crownY; y <= L.chinY; y += 1) {
    // 0 at the crown, 1 at the chin.
    const t = (y - L.crownY) / Math.max(1, L.chinY - L.crownY);
    let half = L.rx;
    if (t < 0.22) {
      // The cranium rounds off at the top — as a circular arc, not a linear
      // ramp, or the crown comes to a visible bevel instead of a curve.
      half = L.rx * Math.sqrt(Math.max(0.05, 1 - Math.pow(1 - t / 0.22, 2) * 0.72));
    } else if (t < 0.52) {
      // Temple to cheekbone: the widest part of the head.
      half = L.rx * (shape === 'diamond' || shape === 'heart' ? 0.96 + (t - 0.16) * 0.16 : 1);
    } else {
      // Cheekbone to chin: everything below is the face's taper.
      const fall = (t - 0.52) / 0.48;
      const taper =
        shape === 'round' ? 0.30
        : shape === 'square' ? 0.16
        : shape === 'long' ? 0.44
        : shape === 'heart' ? 0.62
        : shape === 'diamond' ? 0.58
        : 0.42;
      // A square or sharp jaw holds its width and then turns a corner; a soft
      // or round one curves away from the cheekbone immediately.
      const curve = jaw === 'square' || jaw === 'sharp'
        ? Math.pow(fall, 2.1)
        : jaw === 'round' || jaw === 'soft'
          ? Math.pow(fall, 0.78)
          : fall * fall;
      half = L.rx * (1 - taper * curve);
    }
    if (elongated && t < 0.3) half *= 0.9;
    // The turn. A head rotated toward the viewer's left shows more of its
    // right side: the far cheek becomes the broad visible plane and the near
    // cheek compresses toward the nose. Shifting the *features* across a
    // symmetric skull — which is all the renderer used to do — reads as a
    // squint, not a rotation; the skull itself has to be lopsided.
    const near = Math.max(1, Math.round(half * (1 - 0.20 * L.turnAmt)));
    const far = Math.max(1, Math.round(half * (1 + 0.13 * L.turnAmt)));
    const lo = L.hx + (L.turn < 0 ? -near : -far);
    const hi = L.hx + (L.turn < 0 ? far : near);
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
export function headSurface(form: FormBuffer, mask: Mask, L: HeadLayout, depth: number): void {
  ellipsoidSurface(form, mask, L.hx + L.turn, L.hy, L.rx + 1, L.ry + 1, depth, 0.72);
  faceOcclusion(form, mask, L);
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
function faceOcclusion(form: FormBuffer, mask: Mask, L: HeadLayout): void {
  const on = (x: number, y: number) =>
    x >= 0 && x < SPRITE_W && y >= 0 && y < SPRITE_H && mask[y * SPRITE_W + x] === 1;
  const cut = (x: number, y: number, by = 1) => { if (on(x, y)) form.addBias(x, y, by); };

  const eyeHalf = Math.max(2, Math.round(L.W * 0.20));
  // --- The sockets. The brow's shelf throws down onto the eye.
  for (const side of [-1, 1] as const) {
    const cx = L.fx + side * L.eyeDX;
    for (let dx = -eyeHalf; dx <= eyeHalf; dx += 1) {
      cut(cx + dx, L.eyeY - 1, Math.abs(dx) < eyeHalf - 1 ? 2 : 1);
      cut(cx + dx, L.eyeY - 2, 1);
    }
  }
  // --- The nose's flank, on the side away from the light, running from the
  // inner brow down to the nostril. This is the mark that breaks the
  // terminator's straight run more than any other.
  const noseSide = L.turn;
  for (let y = L.browY + 1; y <= L.noseY; y += 1) {
    // The deepest interior mark on the face. The nose casts hard onto the
    // cheek beside it and this line is most of what reads as a nose at all —
    // pitched level with the socket shadows it disappeared into them.
    cut(L.fx + noseSide * 2, y, 4);
    cut(L.fx + noseSide * 3, y, 2);
  }
  // …and the ball of the nose throws a short shadow onto the lip below it.
  cut(L.fx + noseSide, L.noseY + 1, 3);
  cut(L.fx, L.noseY + 1, 2);
  // --- Under the cheekbone: a shallow diagonal easing back toward the jaw.
  //
  // It starts high and *wide* — level with the nose's bridge, out near the
  // ear — and runs down and in. Begun at the nose's tip and only a third of
  // the head out, it sat right beside the mouth and read as a pair of jowls
  // rather than as the plane under a cheekbone.
  for (const side of [-1, 1] as const) {
    const from = Math.round(L.W * 0.42);
    const top = L.noseY - Math.round(L.H * 0.09);
    for (let i = 0; i < 5; i += 1) {
      cut(L.fx + side * (from - i), top + i, i < 3 ? 2 : 1);
    }
  }
  // --- Under the lower lip, and the chin's own shelf.
  for (let dx = -1; dx <= 1; dx += 1) cut(L.fx + dx, L.mouthY + 2, 1);
  // --- The jaw's underside, which is where the head ends and the neck begins.
  for (let dx = -Math.round(L.W * 0.34); dx <= Math.round(L.W * 0.34); dx += 1) {
    cut(L.fx + dx, L.chinY, 2);
    cut(L.fx + dx, L.chinY - 1, 1);
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
  drawEars(raster, form, spec, ramps, L, headM);
  drawAge(spec, L, carve);
  drawMarkings(raster, spec, ramps, L);
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
  const shape = spec.eyeShape;
  const wide = shape === 'round' || shape === 'wide';
  const narrow = shape === 'narrow' || shape === 'hooded';
  // Only a genuinely hooded eye loses its white. The old droop threshold
  // caught a large share of ordinary faces and left them with two dark slots
  // for eyes, which at a distance is the difference between a person and a
  // mask.
  const hooded = shape === 'hooded' || spec.lidDroop > 0.78;
  const dark = ramps.book[MAT.BROW]?.steps[5] ?? ramps.hair.steps[5];
  const lash = ramps.lash;

  for (const side of [-1, 1] as const) {
    // In a three-quarter turn the far eye narrows — foreshortening — but it
    // does NOT migrate toward the nose; it stays over its own socket. An
    // earlier version pulled it inward and both eyes ended up crowded onto
    // one side of the face.
    const far = side === -L.turn;
    const cx = L.fx + side * L.eyeDX;
    const ew = Math.max(3, L.eyeW + (wide ? 1 : narrow ? -1 : 0) - (far ? 1 : 0));
    const x0 = cx - Math.floor(ew / 2);
    // Which end of this eye is the inner (nose-side) corner.
    const innerX = side === 1 ? x0 : x0 + ew - 1;
    const outerX = side === 1 ? x0 + ew - 1 : x0;

    if (opts.frame === 'blink') {
      // A closed eye is one lash-coloured row, with the lashes reaching a
      // pixel past the outer corner.
      for (let i = 0; i < ew; i += 1) put(x0 + i, L.eyeY + 1, lash, MAT.BROW, 5);
      put(outerX + side, L.eyeY + 1, lash, MAT.BROW, 5);
      continue;
    }

    // Slant: almond and narrow eyes lift the outer corner, round ones sit
    // level. One pixel of offset reads clearly at this scale.
    const lift = shape === 'almond' || shape === 'narrow' ? 1 : 0;

    // Row 0 is the lash line — the heaviest mark, and the one that actually
    // draws the eye's shape. Row 1 is the aperture: white, iris, and the
    // inner corner. Row 2 is the lower lid, a shadow rather than a line.
    for (let i = 0; i < ew; i += 1) {
      const atOuter = (side === 1 ? i === ew - 1 : i === 0);
      put(x0 + i, L.eyeY - (atOuter ? lift : 0), lash, MAT.BROW, 5);
    }
    if (!hooded) {
      for (let i = 0; i < ew; i += 1) {
        put(x0 + i, L.eyeY + 1, ramps.sclera.steps[3], MAT.SCLERA, 3);
      }
      const gaze = Math.max(-1, Math.min(1, opts.gaze));
      // The iris: two pixels on a wide eye, one on a narrow one, and it
      // tracks the gaze without ever leaving the aperture.
      const irisW = ew >= 5 ? 2 : 1;
      const irisX = Math.max(x0, Math.min(x0 + ew - irisW, cx - Math.floor(irisW / 2) + gaze));
      for (let i = 0; i < irisW; i += 1) {
        put(irisX + i, L.eyeY + 1, ramps.iris.steps[4], MAT.IRIS, 4);
      }
      // The lacrimal caruncle — the warm fleck at the inner corner. It is one
      // pixel, and it is the difference between an eye and a bead.
      put(innerX, L.eyeY + 1, ramps.skinWarm.steps[4], MAT.SKIN, 4);
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
    const cx = L.fx + side * (L.eyeDX - (far ? 1 : 0));
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
  // Aquiline and roman noses carry a ridge highlight against that plane —
  // the one mark that distinguishes them at this size.
  if (long) {
    for (let y = top; y <= bottom - 1; y += 1) {
      if (raster.matAt(L.fx, y) === MAT.SKIN) form.addBias(L.fx, y, -1);
    }
    if (spec.noseShape === 'aquiline') carve(L.fx + shadowSide, top, 2);
  }
  // The base: nostrils and the shadow under the tip.
  const wide = spec.noseShape === 'broad';
  const half = wide ? 2 : 1;
  for (let dx = -half; dx <= half; dx += 1) {
    carve(L.fx + dx, bottom + 1, dx === 0 && !wide ? 1 : 2);
  }
  if (spec.noseShape === 'button') carve(L.fx, bottom, -1);
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
  // Upper lip: a body of colour above the seam, narrower than the seam and
  // peaked at the philtrum on a bow mouth.
  if (full || shape === 'medium') {
    for (let i = 1; i < w - 1; i += 1) {
      const peak = shape === 'bow' && Math.abs(x0 + i - L.fx) <= 1 ? 1 : 0;
      raster.set(x0 + i, y - 1 - peak, ramps.lip.steps[4], MAT.LIP, 4);
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
): void {
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

  // --- The hem, and the shadow the cloth throws on the shoulder. ----------
  for (let x = 0; x < SPRITE_W; x += 1) {
    for (let y = bottom - 1; y <= bottom; y += 1) {
      if (inMask(x, y)) form.addBias(x, y, y === bottom ? 2 : 1);
    }
  }
  // Under the jaw the veil turns back under itself and goes dark.
  for (let x = L.hx - L.rx; x <= L.hx + L.rx; x += 1) {
    for (let y = L.chinY; y <= L.chinY + 2; y += 1) {
      if (inMask(x, y)) form.addBias(x, y, 2);
    }
  }
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
function drawFacialHair(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  L: HeadLayout, headM: Mask
): void {
  const fh = spec.facialHair!;
  const dense = fh.thickness === 'thick' ? 0 : fh.thickness === 'medium' ? 3 : 2;
  const ramp = ramps.beard;
  // The moustache band, the chin patch and the jaw line are all fractions of
  // the head, not fixed offsets — on a 28px head fixed offsets left a goatee
  // floating above a bare chin.
  const stache = Math.max(2, Math.round(L.H * 0.09));
  const half = Math.max(2, Math.round(L.W * 0.16));
  const sideJaw = Math.max(3, Math.round(L.W * 0.22));
  const chinTop = Math.max(1, Math.round(L.H * 0.06));
  const top = L.mouthY - stache;

  const belongs = (x: number, y: number): boolean => {
    const dx = x - L.fx;
    const dy = y - L.mouthY;
    const ax = Math.abs(dx);
    const onStache = dy >= -stache && dy <= -1 && ax <= half;
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
        return onStache || (dy >= chinTop - 1 && ax <= sideJaw && ax !== 0);
      case 'stubble':
        return dy >= -1 && ax <= sideJaw + 2;
      case 'verdi':
      case 'full_beard':
      default:
        return onStache || dy >= 0;
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
  for (let y = top; y <= L.chinY + 2; y += 1) {
    for (let x = L.hx - L.rx - 1; x <= L.hx + L.rx + 1; x += 1) {
      if (!headM[y * SPRITE_W + x]) continue;
      if (raster.matAt(x, y) !== MAT.SKIN) continue;
      if (!belongs(x, y)) continue;
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
        // Half the pixels take the beard colour at its lightest, mixed toward
        // the skin — enough to read as growth, nowhere near a drawn beard.
        if (((x + y) & 1) === 0) {
          raster.set(x, y, ramp.steps[2], MAT.BEARD, 2);
          form.set(x, y, (x - L.fx) / (L.rx + 1), 0.35, 0.7, 0.46);
          form.addBias(x, y, 1);
        }
        continue;
      }
      // A sparse beard lets skin through on a checker; a thick one does not.
      if (dense && ((x * 3 + y) % dense === 0) && y > L.chinY - 2) continue;
      raster.set(x, y, ramp.steps[4], MAT.BEARD, 4);
      form.set(x, y, (x - L.fx) / (L.rx + 1), 0.35, 0.7, 0.46);
      shadeBeard(x, y);
    }
  }
}

function drawMarkings(
  raster: Raster, spec: PortraitSpec, ramps: PortraitRamps, L: HeadLayout
): void {
  for (const mark of spec.markings) {
    if (!/face|cheek|forehead|brow|chin|eye/i.test(mark.location)) continue;
    const side = unit(spec.seed, `mark-${mark.type}`) > 0.5 ? 1 : -1;
    const mx = L.fx + side * 3;
    if (mark.type === 'scar' || mark.type === 'scarification') {
      for (let i = 0; i < 3; i += 1) {
        if (raster.matAt(mx, L.eyeY + 1 + i) !== MAT.SKIN) continue;
        raster.set(mx, L.eyeY + 1 + i, ramps.skin.steps[6], MAT.SKIN, 6);
      }
    } else if (mark.type === 'tattoo' || mark.type === 'paint' || mark.type === 'henna') {
      const ink = ramps.book[MAT.PAINT]?.steps[3] ?? ramps.skin.steps[6];
      for (let i = 0; i < 3; i += 1) {
        if (raster.matAt(mx, L.eyeY + 1 + i) === MAT.EMPTY) continue;
        raster.set(mx, L.eyeY + 1 + i, ink, MAT.PAINT, 3);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Hair.
// ---------------------------------------------------------------------------

export interface HairResult {
  /** Everything drawn behind the head — drawn before the skull. */
  back: Mask;
  /** The cap and anything falling in front of the shoulders. */
  front: Mask;
}

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

  // Standing volume: how far the mass sits off the skull.
  const vol =
    sil === 'afro' ? 3
    : sil === 'updo' || sil === 'twin_buns' ? 2
    : spec.hairTexture === 'coily' || spec.hairTexture === 'kinky' ? 2
    : spec.hairTexture === 'curly' ? 1
    : 0;

  // The hairline. Placed by the schoolroom rule — a third of the way from
  // crown to chin — rather than relative to the brows, which put it one pixel
  // above them and left every figure with no forehead at all.
  const recede = Math.round(spec.recession * 3);
  const browLine = L.crownY + Math.round((L.chinY - L.crownY) * 0.3) - recede;
  const fringe = sil === 'bangs' || sil === 'bowl';

  // The cap itself.
  const capBottom =
    sil === 'bowl' || sil === 'bob' ? L.chinY - 3
    : sil === 'tonsure' ? L.eyeY
    : L.eyeY + 1;
  for (let y = L.crownY - vol; y <= capBottom; y += 1) {
    const t = (y - (L.crownY - vol)) / Math.max(1, capBottom - (L.crownY - vol));
    let half = L.rx + vol;
    if (t < 0.2) half = Math.round((L.rx + vol) * (0.6 + t * 2));
    // Above the brow the cap is full width; at the temples it pulls back
    // unless there is a blunt fringe holding it forward.
    if (y > browLine && !fringe && sil !== 'bob') {
      half = L.rx + vol - Math.round((y - browLine) * 0.6);
    }
    for (let x = L.hx - half; x <= L.hx + half; x += 1) {
      // The forehead is bare below the hairline, except under a fringe.
      const insideFace = y > browLine && Math.abs(x - L.hx) < L.rx - 1;
      if (insideFace && !(fringe && y <= browLine + 1)) continue;
      if (sil === 'tonsure' && y < L.crownY + 3 && Math.abs(x - L.hx) < L.rx - 2) continue;
      if (sil === 'shaved_sides' && y > L.crownY + 2 && Math.abs(x - L.hx) > 2) continue;
      put(y <= L.crownY + 1 ? back : front, x, y);
      if (y > L.crownY + 1) put(back, x, y);
    }
  }

  // Length falling behind the head.
  const fallTo =
    spec.hairLength === 'very_short' ? L.eyeY
    : spec.hairLength === 'short' ? L.chinY - Math.round(L.H * 0.1)
    : spec.hairLength === 'medium' ? L.chinY + Math.round(L.H * 0.2)
    : spec.hairLength === 'long' ? L.chinY + Math.round(L.H * 0.55)
    : L.chinY + Math.round(L.H * 0.95);
  const gathered = sil === 'bun' || sil === 'top_knot' || sil === 'updo'
    || sil === 'twin_buns' || sil === 'braid_crown' || sil === 'tied_back';
  if (!gathered && sil !== 'bob' && sil !== 'bowl' && spec.hairLength !== 'very_short') {
    for (let y = L.eyeY; y <= fallTo; y += 1) {
      const t = (y - L.eyeY) / Math.max(1, fallTo - L.eyeY);
      // The mass narrows as it falls, and curly hair keeps more width.
      const half = Math.round((L.rx + vol) * (1 - t * (vol ? 0.25 : 0.42)));
      for (let x = L.hx - half; x <= L.hx + half; x += 1) put(back, x, y);
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
  const conical = CONICAL_HAT_PATTERN.test(`${hw.name ?? ''} ${hw.material ?? ''}`.toLowerCase());

  switch (hw.kind) {
    case 'cap': {
      // A skullcap follows the crown and stops at the hairline.
      for (let y = top - 1; y <= L.browY - 1; y += 1) {
        const t = (y - (top - 1)) / Math.max(1, L.browY - top);
        const half = Math.round((L.rx + 1) * (0.55 + t * 0.5));
        for (let x = L.hx - half; x <= L.hx + half; x += 1) put(x, y);
      }
      break;
    }
    case 'brimmed_hat': {
      if (conical) {
        // A cone: width falls linearly from the brim to the point.
        const apex = top - rise - 2;
        const brimY = L.browY - 1;
        for (let y = apex; y <= brimY; y += 1) {
          const t = (y - apex) / Math.max(1, brimY - apex);
          const half = Math.round(t * (L.rx + 4));
          for (let x = L.hx - half; x <= L.hx + half; x += 1) put(x, y);
        }
      } else {
        const crownTop = top - rise;
        const brimY = L.browY - 1;
        for (let y = crownTop; y < brimY; y += 1) {
          const half = L.rx - 1;
          for (let x = L.hx - half; x <= L.hx + half; x += 1) put(x, y);
        }
        // The brim: wider than the head, one row, dropping at the edges.
        for (let x = L.hx - L.rx - 3; x <= L.hx + L.rx + 3; x += 1) {
          const away = Math.abs(x - L.hx) / (L.rx + 3);
          put(x, brimY + (away > 0.72 ? 1 : 0));
          band.push([x, brimY + (away > 0.72 ? 1 : 0)]);
        }
      }
      break;
    }
    case 'wrapped_cloth': {
      // A turban stands taller than the skull and shows its wraps.
      for (let y = top - rise - 1; y <= L.browY; y += 1) {
        const t = (y - (top - rise - 1)) / Math.max(1, L.browY - top + rise + 1);
        const half = Math.round((L.rx + 2) * (0.6 + t * 0.45));
        for (let x = L.hx - half; x <= L.hx + half; x += 1) put(x, y);
        // Every third row is the edge of a wrap.
        if ((y - top) % 3 === 0) for (let x = L.hx - half; x <= L.hx + half; x += 1) band.push([x, y]);
      }
      break;
    }
    case 'veil':
    case 'hood': {
      // A veil is not a trapezoid with a hole in it.
      //
      // The old construction widened linearly from the crown and punched a
      // rectangular face opening, which is why every veiled figure wore a
      // board. Real head-cloth does four things, and all four are legible even
      // at this size:
      //
      //   · it **hugs the skull** down to the ear line before it falls;
      //   · its face opening is an **arc**, curving round the brow, past the
      //     temple, and in under the jaw — never a straight-sided hole;
      //   · it **doubles back** along that opening, so the inner face of the
      //     cloth shows as a lit band a pixel or two wide;
      //   · it **falls in folds that radiate** from where it is pinned at the
      //     crown, spreading as it drops over the shoulders.
      const isHood = hw.kind === 'hood';
      // Down to the shoulders, and no further. A veil that keeps spreading
              // past them stops being head-cloth and becomes a lampshade —
              // which is exactly what a 1.35× fall coefficient produced.
      // Down the chest, not to the collarbone. Stopping at the shoulder made
      // it a bonnet; the reference veil covers the shoulders and falls well
      // past them, and that mass is most of what gives the head its weight.
      // Over the shoulders and a little past them. Falling a full head-height
      // below the chin buried the whole chest and the garment stopped being
      // visible at all — the reference veil covers the shoulders and leaves
      // the dress to speak below them.
      const drop = isHood ? L.chinY + Math.round(L.H * 0.5) : L.chinY + Math.round(L.H * 0.62);
      const earY = L.eyeY + Math.round(L.H * 0.12);
      const crown = top - Math.round(rise * 0.15);

      // The face opening: an ellipse, tilted with the turn so the far cheek is
      // covered more than the near one.
      const openCx = L.fx + Math.round(L.W * 0.04) * L.turn;
      const openCy = Math.round((L.browY + L.chinY) / 2) - 1;
      // The opening has to clear the whole face. Cut too tight it squeezes the
      // features into a slot and the figure reads as peering out of a tube.
      const openRx = Math.max(4, Math.round(L.rx * (isHood ? 0.98 : 0.92)));
      const openRy = Math.max(5, Math.round((L.chinY - L.browY) / 2) + 4);
      const insideOpening = (x: number, y: number): boolean => {
        const dx = (x - openCx) / openRx;
        const dy = (y - openCy) / openRy;
        return dx * dx + dy * dy < 1;
      };

      // The outer silhouette: skull-hugging above the ear, spreading below it.
      const halfAt = (y: number): number => {
        if (y <= crown + Math.max(2, Math.round(L.H * 0.14))) {
          // The cloth lies *on* the skull, so its top follows the same arc the
          // cranium does. The floor inside the sqrt matters: without it the
          // topmost row resolves to two pixels and the veil comes to a **point**
          // — a little pyramid apex above the head, which is what it was doing.
          // A head-cloth's crown is a dome that starts wide, not a spire.
          const span = Math.max(2, Math.round(L.H * 0.14));
          const k = 1 - (y - crown) / span;
          return Math.max(3, Math.round((L.rx + 1) * Math.sqrt(Math.max(0.42, 1 - k * k))));
        }
        if (y <= earY) {
          // Follows the cranium out to its widest.
          const k = (y - crown) / Math.max(1, earY - crown);
          return L.rx + 1 + Math.round(k * 1.5);
        }
        // Below the ear it falls away from the neck and over the shoulders,
        // on a curve — a straight taper is what made it read as a tent.
        // It clears the jaw and rests on the shoulders. At its widest it is
        // about half a head-radius broader than the skull — never wider than
        // the shoulders themselves, or it reads as a cape.
        // Spreading over the shoulders and then falling near-vertical: the
        // widening is front-loaded, so the cloth clears the jaw quickly and
        // then hangs rather than continuing to flare into a cape.
        const k = (y - earY) / Math.max(1, drop - earY);
        return L.rx + 1 + Math.round(Math.pow(Math.min(1, k * 1.7), 0.7) * L.rx * 0.5);
      };

      // The lower edge is a *hem*, not a cut.
      //
      // Ending the fall at a single row draws a ruled horizontal across the
      // shoulders — and because the veil is nearly as wide as they are, that
      // line was reading as the figure's shoulders being square. Cloth resting
      // on a shoulder hangs lowest at the point of contact and lifts away from
      // it, and the folds break the line further.
      const bottomAt = (x: number): number => {
        const k = (x - L.hx) / Math.max(1, halfAt(drop));
        // Lowest over each shoulder, riding up between them and at the edges.
        const shoulder = Math.abs(Math.abs(k) - 0.62);
        const lift = Math.round(Math.min(4, shoulder * 7) + (1 - Math.cos(k * Math.PI)) * 1.2);
        const jag = ((x * 5 + L.crownY) % 3) === 0 ? 1 : 0;
        return drop - lift - jag;
      };

      for (let y = crown; y <= drop; y += 1) {
        const half = halfAt(y);
        // The turn: more cloth falls on the far side, because that is the side
        // swinging away from us.
        const lo = L.hx - half - (L.turn > 0 ? 1 : 0);
        const hi = L.hx + half + (L.turn < 0 ? 1 : 0);
        for (let x = lo; x <= hi; x += 1) {
          if (insideOpening(x, y)) continue;
          if (y > bottomAt(x)) continue;
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
    // The skull it wraps is a tight dome; the fall below is a much broader,
    // flatter one. Lighting the whole thing as a single big ellipsoid — which
    // is what it used to do — averages the two and models neither.
    ellipsoidSurface(form, m, L.hx + L.turn, L.hy, L.rx + 4, L.ry + 10, 0.56, 0.55);
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
