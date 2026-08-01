/**
 * encounter/sprite/drawSprite.ts
 *
 * Part-based figure assembly on the tunable skeleton (skeleton.ts).
 *
 * Two rules the previous renderer broke, and this one is built around:
 *
 *  1. **Parts declare surfaces, not colours.** Every mask goes down flat and
 *     writes a normal and a depth into the form buffer; `resolveLight` shades
 *     the whole figure against one lamp at the end. Detail — folds, seams,
 *     weave — is a *bias* applied before that pass, so a crease in shadow
 *     stays in shadow instead of fighting the modelling.
 *
 *  2. **Poses move joints, not pixels.** A bow is a spine angle and every
 *     limb is two capsules struck from shoulder, elbow and wrist positions.
 *     The old code sheared the finished raster for bends and leans, and drew
 *     hanging arms with a strip extruder while drawing reaching arms with
 *     capsules — so the same arm never looked like itself twice.
 *
 * Iterate with `npm run sprite-sheet`, tune live with Shift+1 in the app.
 */

import {
  fillMask, makeMask, Mask, maskSubtract, maskUnion, MAT, Raster,
} from '../../components/portraitLab/core/raster';
import { buildPortraitRamps, PortraitRamps } from '../../components/portraitLab/art/palette';
import { Ramp } from '../../components/portraitLab/core/color';
import { unit } from '../../components/portraitLab/core/rng';
import { PortraitSpec } from '../../components/portraitLab/spec/types';
import { restingExpression } from '../../components/portraitLab/spec/buildSpec';
import { ArmWear, FootwearKind, RestStance, SpriteExtras, SpriteSource } from './spriteSource';
import {
  ArmPose, buildSkeleton, getTuning, HandShape, Posture, Skeleton,
  SPRITE_H, SPRITE_HEADROOM, SPRITE_W, SpriteTuning,
} from './skeleton';
import {
  applyRim, buildRig, cylinderSurface, ellipsoidSurface, FormBuffer,
  groundBounce, groundShadow, inkInterior, inkSilhouette, limbSurface,
  planeSurface, resolveLight, weaveBias,
} from './spriteLight';
import {
  buildHair, drawFace, drawHeadwear, FaceFrame, headLayout, HeadLayout,
  headMask, headSurface, paintHair,
} from './spriteHead';
import { Drape, facingAt, foldX, planDrape } from './drape';
import { Construction, GarmentShape, hemFraction, OverLayer, readShape } from './construction';
import { ornamentRamp } from '../../components/portraitLab/art/ornaments';
import { densifyBook } from './denseRamp';

export { SPRITE_H, SPRITE_W };

/**
 * Depth ordering, as one table rather than scattered magic numbers. Higher is
 * nearer the viewer, and the occlusion pass reads these directly — so "the
 * near sleeve casts on the coat" is a consequence of this list, not of a
 * hand-placed shadow.
 */
const DEPTH = {
  hairBack: 0.20,
  farArm: 0.30,
  legFar: 0.34,
  legNear: 0.40,
  torso: 0.50,
  neck: 0.46,
  head: 0.62,
  hairFront: 0.66,
  headwear: 0.70,
  // Only a little in front of the torso. At 0.74 the depth step across the
  // shoulder was large enough for the occlusion pass to lay a hard band of
  // shadow along it — a sleeve hanging against the body stands a centimetre
  // proud of it, not a hand's breadth, and the ordering is all that matters.
  nearArm: 0.58,
  hand: 0.80,
  held: 0.86,
} as const;

/**
 * Every animation frame is a point in pose space. Frames compile lazily and
 * cache, so an idle figure costs four rasters and a bow only pays for itself
 * when someone bows.
 */
export type FrameId =
  | 'stand' | 'standBreathe' | 'stand2' | 'standBreathe2'
  | 'blink' | 'talk' | 'glance'
  | 'bowLight' | 'bowDeep' | 'reach' | 'raise' | 'offer' | 'fallen';

export interface FramePose {
  face: FaceFrame;
  gazeX: number;
  posture: Posture;
  /**
   * Idle wind phase, 0…1. Long cloth is never still, and a figure whose robe
   * is frozen while its chest rises reads as a cardboard cutout with a pump
   * behind it. Short garments ignore this — `planDrape` zeroes the amplitude —
   * so a tunic's wind frames alias to the same picture and cost nothing.
   */
  wind: number;
}

// A hanging arm still swings a few degrees clear of the ribs — the gap of
// daylight between sleeve and body below the waist is most of what reads as
// three dimensions in the reference, and an arm at 0° never opens it.
const rest = (hand: HandShape = 'rest'): ArmPose => ({ swing: 7, elbow: 6, forward: 0.1, hand });

interface PoseOverride {
  spineBend?: number;
  lean?: number;
  headNod?: number;
  bob?: number;
  arms?: Partial<Record<'near' | 'far', ArmPose>>;
}

function pose(over: PoseOverride = {}): Posture {
  return {
    spineBend: over.spineBend ?? 0,
    lean: over.lean ?? 0,
    headNod: over.headNod ?? 0,
    bob: over.bob ?? 0,
    arms: { near: over.arms?.near ?? rest(), far: over.arms?.far ?? rest() },
  };
}

const FRAME_POSES: Record<Exclude<FrameId, 'fallen'>, FramePose> = {
  stand: { face: 'open', gazeX: 0, wind: 0, posture: pose() },
  // The idle cycle runs stand → stand2 → standBreathe → standBreathe2, which
  // walks the drape through a full swing while the chest rises and falls once.
  // Breathing and the wind share one period on purpose: two slow idle motions
  // at different rates read as a fault rather than as life.
  stand2: { face: 'open', gazeX: 0, wind: 0.25, posture: pose() },
  standBreathe: { face: 'open', gazeX: 0, wind: 0.5, posture: pose({ bob: 1 }) },
  standBreathe2: { face: 'open', gazeX: 0, wind: 0.75, posture: pose({ bob: 1 }) },
  blink: { face: 'blink', gazeX: 0, wind: 0, posture: pose() },
  talk: { face: 'talk', gazeX: 0, wind: 0, posture: pose() },
  glance: { face: 'open', gazeX: 1, wind: 0, posture: pose({ headNod: -1 }) },
  bowLight: { face: 'open', gazeX: 0, wind: 0, posture: pose({ spineBend: 16, headNod: 2 }) },
  // A deep bow closes the eyes — respect, drawn in one pixel row — and the
  // arms fall forward as the spine folds, because they hang from it.
  bowDeep: {
    face: 'blink', gazeX: 0, wind: 0,
    posture: pose({
      spineBend: 38, headNod: 4,
      arms: {
        near: { swing: 14, elbow: 14, forward: 0.2, hand: 'open' },
        far: { swing: 12, elbow: 12, forward: 0.2, hand: 'open' },
      },
    }),
  },
  reach: {
    face: 'open', gazeX: 0, wind: 0,
    posture: pose({ arms: { far: { swing: 42, elbow: 26, forward: 0.75, hand: 'open' } } }),
  },
  raise: {
    face: 'open', gazeX: 0, wind: 0,
    posture: pose({ spineBend: -4, arms: { far: { swing: 148, elbow: 22, forward: 0.1, hand: 'fist' } } }),
  },
  offer: {
    face: 'talk', gazeX: 1, wind: 0,
    posture: pose({ arms: { far: { swing: 26, elbow: 62, forward: 0.7, hand: 'present' } } }),
  },
};

// ---------------------------------------------------------------------------
// Garment planning.
// ---------------------------------------------------------------------------

interface GarmentPlan {
  kind: PortraitSpec['garment']['kind'];
  hemY: number;
  hemHalf: number;
  belted: boolean;
  /** Where the sleeve's cloth ends and the forearm or hand begins. */
  sleeveT: number;
  bell: boolean;
  clasped: boolean;
  bare: boolean;
  /** What shape the garment actually is, read off its own name. */
  shape: GarmentShape;
  construction: Construction;
  over: OverLayer;
  /** Where the torso covering starts and stops — a crop top ends at the ribs. */
  topHemY: number;
  /** How the skirt falls — planned before the mask, because it shapes the hem. */
  drape: Drape;
  /** Idle wind phase, 0…1. */
  wind: number;
}

/**
 * The spec carries no sleeve or belt field, so both are read the way the
 * portrait reads its own trim: off the item's name first, and off the
 * garment kind when the name is silent.
 */
function planGarment(spec: PortraitSpec, s: Skeleton, wind: number, extrasName: string): GarmentPlan {
  const kind = spec.garment.kind;
  const t = s.t;
  const name = `${spec.garment.name} ${spec.garment.material}`.toLowerCase();
  const legSpan = s.ankleY - s.hipY;

  // The construction, read off the garment's own name rather than its coarse
  // kind. A choli and a robe are both `wrapped_garment` to the spec and are
  // not remotely the same shape.
  const shape = readShape(spec, extrasName);
  const con = shape.construction;
  const floorLen = con === 'robe' || con === 'gown' || con === 'skirted' || con === 'crop_top';
  const hemY = con === 'bare'
    ? s.hipY + 2
    : s.hipY + Math.round(legSpan * hemFraction(con, spec, t));

  // Where the *upper* covering ends. For most garments that is the hem; a
  // cropped blouse stops under the ribs, and a wrapped lower garment has no
  // upper covering at all.
  const topHemY = con === 'crop_top'
    ? s.waistY - Math.round((s.waistY - s.chestY) * 0.35)
    : con === 'wrapped_lower' ? s.hipY - Math.round((s.hipY - s.waistY) * 0.4)
    : hemY;

  // How far down the arm the sleeve reaches, 0 shoulder … 1 wrist.
  const sleeveT = con === 'bare' || con === 'wrapped_lower' ? 0
    : con === 'crop_top' ? 0.34
    : /sleeveless|vest|tabard|singlet|toga|himation|chiton/.test(name) ? 0.12
    : /short.sleeve|tee|shift/.test(name) ? 0.44
    : con === 'robe' || con === 'gown' || con === 'jacket' ? 0.95
    : 0.86;

  const hemHalf = floorLen ? t.robeHemHalf
    : con === 'wrapped_lower' ? s.hipHalf + 2
    : Math.min(s.shoulderHalf, s.hipHalf + 1);
  const belted = kind !== 'bare' && (/belt|sash|girdle|obi|cinch/.test(name)
    || kind === 'tunic' || kind === 'jacket' || kind === 'doublet' || kind === 'work_shirt');
  const drape = planDrape(spec, s, {
    // Cloth falls from wherever it is last supported: the belt if there is
    // one, the shoulders if there is not.
    topY: belted ? s.waistY : s.shoulderY + 4,
    hemY,
    hipY: s.hipY,
    hipHalf: s.hipHalf,
    hemHalf,
    axis: s.cx + t.hipSkew,
    longFall: floorLen,
  });

  return {
    kind,
    shape,
    construction: con,
    over: shape.over,
    topHemY,
    hemY,
    // A short garment's hem must not out-span the shoulders, or the figure
    // reads as wearing a skirt however short it is.
    hemHalf,
    drape,
    wind,
    belted,
    sleeveT,
    bell: kind === 'robe' || kind === 'gown',
    // Some personas rest with their hands clasped at the waist — a composed
    // stance. Seeded, so a persona always carries the same bearing.
    clasped: kind !== 'bare' && unit(spec.seed, 'rest-clasp') < 0.26,
    bare: con === 'bare',
  };
}

// ---------------------------------------------------------------------------
// Limbs: one chain, every pose.
// ---------------------------------------------------------------------------

interface ArmChain {
  shoulder: [number, number];
  elbow: [number, number];
  wrist: [number, number];
  hand: [number, number];
}

const RAD = Math.PI / 180;

/**
 * The trunk's half-width on one side at one height, and the axis it is
 * measured from. Both the torso mask and the arm roots read this, because the
 * moment they disagree the shoulder shows a notch — which is exactly what
 * happened when the turn was added to the torso alone and the arms went on
 * rooting themselves against a symmetric body.
 */
function trunkEdge(s: Skeleton, half: number, side: -1 | 1, skew: number): { axis: number; half: number; x: number } {
  const axis = s.cx + skew + Math.round(s.turn * half * 0.10) * -s.nearSide;
  const foreshorten = 1 - 0.07 * s.turn;
  const near = side === s.nearSide;
  // `shoulderAsym` is a manual thumb on the scale the turn already sets: the
  // turn decides the asymmetry, this widens or narrows the near side against
  // it. Superseded controls are better re-aimed than deleted — the slider was
  // there and inert, which reads as a broken panel rather than a tidy one.
  const manual = (near ? 1 : -1) * s.t.shoulderAsym * 0.5;
  const h = Math.max(2, Math.round(half * foreshorten * (1 + (near ? 0.17 : -0.19) * s.turn) + manual));
  return { axis, half: h, x: axis + side * h };
}

/**
 * Shoulder → elbow → wrist. `side` is −1 for the viewer's left and +1 for the
 * right; `swing` is measured in the image plane, so every pose can be authored
 * by looking at it. `forward` foreshortens the segments and pushes the arm's
 * depth toward the viewer, which is how a reach reads as coming *at* you
 * rather than as a limb laid out sideways.
 */
function armChain(s: Skeleton, side: -1 | 1, arm: ArmPose, spineBend: number): ArmChain {
  // Shoulder to elbow, as a fraction of the trunk. 0.72 put the fingertips
  // near the knee; a resting hand belongs at mid-thigh.
  // Limb ratios are tunable now. They were fixed constants, which meant every
  // pose in the frame table was authored against one arm and there was no way
  // to say "the forearm is too long" without editing the poses themselves.
  const upperLen = Math.round((s.waistY - s.shoulderY) * s.t.upperArmLen) + 2;
  const foreLen = Math.max(4, Math.round(upperLen * s.t.foreArmRatio));
  // The arm hangs from the shoulder, so a folding spine carries it forward.
  const carry = spineBend * s.t.spineCarry;
  // The joint sits just inside the silhouette; the deltoid cap drawn over it
  // is what closes the gap out to the garment's edge.
  // Rooted on the torso's *actual* turned edge, so the deltoid cap always
  // closes against cloth instead of hanging off the silhouette.
  // `farArmTuck` pulls the far arm further behind the ribs than the turn alone
  // puts it — the other half of the pair with `shoulderAsym`.
  const tuck = side === s.nearSide ? 0 : s.t.farArmTuck;
  const rootX = trunkEdge(s, s.shoulderHalf, side, s.t.torsoSkew + s.stoopTopSkew).x - side * (2 + tuck);
  // The near shoulder drops — foreshortening, not a tilt.
  // The joint sits *below* the shoulder line, never level with it. Rooted at
  // +2 the cap's upper half rose above the trapezius and left a few orphaned
  // pixels floating off the top of the shoulder.
  const rootY = s.shoulderY + 3 + (side === s.nearSide ? s.t.shoulderDrop : 0);

  const upper = upperLen * (1 - arm.forward * 0.42);
  const fore = foreLen * (1 - arm.forward * 0.46);

  // `motionScale` rides every authored angle, and `armSwing` sets how far a
  // *resting* arm hangs clear — the two knobs most likely to fix "the
  // animation looks off" without re-authoring a single frame.
  const swing = (arm.swing <= 12 ? s.t.armSwing : arm.swing * s.t.motionScale);
  const a1 = (swing + carry) * RAD;
  const ex = rootX + Math.round(Math.sin(a1) * upper * side);
  const ey = rootY + Math.round(Math.cos(a1) * upper);
  // Flexion shows in-plane only to the extent the arm is *not* pointing at
  // the viewer; a fully forward forearm folds toward the camera instead.
  // An arm is never straight: `elbowRest` is the flexion that is always there.
  const elbow = Math.max(arm.elbow * s.t.motionScale, s.t.elbowRest);
  const a2 = a1 - elbow * RAD * (1 - arm.forward * 0.55);
  const wx = ex + Math.round(Math.sin(a2) * fore * side);
  const wy = ey + Math.round(Math.cos(a2) * fore);
  // The hand continues the forearm's direction.
  // The wrist is a joint, not a weld: `wristBend` rotates the hand off the
  // forearm's line, which is most of what stops a hanging hand reading as the
  // end of a stick.
  const wr = s.t.wristBend * RAD;
  const rdx = wx - ex;
  const rdy = wy - ey;
  const dx = rdx * Math.cos(wr) - rdy * Math.sin(wr) * side;
  const dy = rdx * Math.sin(wr) * side + rdy * Math.cos(wr);
  const dl = Math.hypot(dx, dy) || 1;
  return {
    shoulder: [rootX, rootY],
    elbow: [ex, ey],
    wrist: [wx, wy],
    // Seated *on* the wrist, not two pixels past it: the gap that left read
    // as a severed hand floating below the sleeve.
    hand: [wx + Math.round((dx / dl)), wy + Math.round((dy / dl))],
  };
}

/** A tapered capsule between two joints. */
function capsuleMask(
  x0: number, y0: number, x1: number, y1: number, w0: number, w1: number
): Mask {
  const m = makeMask(SPRITE_W, SPRITE_H);
  const len = Math.max(1, Math.hypot(x1 - x0, y1 - y0));
  const steps = Math.ceil(len * 2);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const cx = x0 + (x1 - x0) * t;
    const cy = y0 + (y1 - y0) * t;
    const half = (w0 + (w1 - w0) * t) / 2;
    for (let k = -half; k <= half; k += 0.5) {
      const px = Math.round(cx + nx * k);
      const py = Math.round(cy + ny * k);
      if (px < 0 || py < 0 || px >= SPRITE_W || py >= SPRITE_H) continue;
      m[py * SPRITE_W + px] = 1;
    }
  }
  return m;
}

/**
 * One arm, whatever it is doing. Cloth to the sleeve's end, skin past it, a
 * deltoid cap where it meets the shoulder — the cap being the single fix that
 * stopped arms reading as planks stapled to a trapezoid.
 */
/**
 * Bangles, bracelets and armlets, on the forearm where they are actually worn.
 *
 * Bangles are the interesting case and the one the renderer was silently
 * dropping: a stack of thin rings climbing the forearm, alternating lit and
 * dark so the eye reads *several* of them rather than one wide band. A single
 * cuff is the opposite — one broad ring with a highlight across its crown.
 * Both are skipped where a sleeve already covers the wrist, because a bangle
 * under a sleeve is not visible and drawing it there reads as a mistake.
 */
function drawArmWear(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, extras: SpriteExtras,
  chain: ArmChain, w: number, plan: GarmentPlan, spec: PortraitSpec
): void {
  // Bracelets come from `spec.jewelry`, not `equippedItems`.
  //
  // This read the inventory's accessory slot, and measuring it showed why
  // nothing ever appeared: across 3000 personas that slot holds no arm
  // ornament at all — the only arm-ish items are torcs, in the necklace slot.
  // The generator puts bracelets in the spec's jewelry list, 93 of them per
  // 1500 people, and every one was being dropped. The inventory is still
  // honoured when it does carry something.
  const jewel = spec.jewelry?.find(j => j.type === 'bracelet');
  const aw = extras.armWear && extras.armWear.kind !== 'none'
    ? extras.armWear
    : jewel
      ? {
          // A stack of thin rings is the common form; a single broad band is
          // what 'chunky' means here.
          kind: (jewel.style === 'chunky' || jewel.style === 'ornate'
            ? 'bracelet' : 'bangles') as ArmWear,
          name: jewel.material ?? '',
          metal: /gold|silver|bronze|brass|copper|iron/i.test(jewel.material ?? ''),
        }
      : null;
  if (!aw || aw.kind === 'none') return;
  // Long sleeves hide the wrist entirely.
  if (plan.sleeveT > 0.82 && aw.kind !== 'armlet') return;

  const ramp = aw.metal ? ramps.metal : ramps.gem;
  const mat = aw.metal ? MAT.METAL : MAT.GEM;
  const [ex, ey] = chain.elbow;
  const [wx, wy] = chain.wrist;
  const len = Math.max(1, Math.hypot(wx - ex, wy - ey));
  const nx = -(wy - ey) / len;
  const ny = (wx - ex) / len;

  // Where along the forearm, and how many.
  const spots = aw.kind === 'bangles' ? [0.98, 0.9, 0.82, 0.74, 0.66]
    : aw.kind === 'armlet' ? [0.06]
    : [0.95];
  const half = w / 2 + 0.5;

  spots.forEach((u, i) => {
    const cx = ex + (wx - ex) * u;
    const cy = ey + (wy - ey) * u;
    for (let k = -half; k <= half; k += 0.5) {
      const x = Math.round(cx + nx * k);
      const y = Math.round(cy + ny * k);
      if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) continue;
      if (raster.matAt(x, y) !== MAT.SKIN) continue;
      // Alternating value up the stack is what makes five rings read as five
      // rather than as one thick band.
      const step = aw.kind === 'bangles' ? (i % 2 === 0 ? 2 : 4) : 2;
      raster.set(x, y, ramp.steps[step], mat, step);
      form.set(x, y, nx * 0.5, ny * 0.5, 0.8, DEPTH.hand - 0.01);
    }
    // A broad cuff has a second row and a lit crown; bangles are one pixel.
    if (aw.kind !== 'bangles') {
      const cx2 = ex + (wx - ex) * (u - 0.06);
      const cy2 = ey + (wy - ey) * (u - 0.06);
      for (let k = -half; k <= half; k += 0.5) {
        const x = Math.round(cx2 + nx * k);
        const y = Math.round(cy2 + ny * k);
        if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) continue;
        if (raster.matAt(x, y) !== MAT.SKIN) continue;
        raster.set(x, y, ramp.steps[4], mat, 4);
        form.set(x, y, nx * 0.5, ny * 0.5, 0.8, DEPTH.hand - 0.01);
      }
    }
  });
}

function drawArm(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, side: -1 | 1, arm: ArmPose, chain: ArmChain,
  depth: number, extras: SpriteExtras
): void {
  // The far arm is a touch thinner: it is further away.
  const w = s.armW + (side === s.nearSide ? 0 : -1);
  const [sx, sy] = chain.shoulder;
  const [ex, ey] = chain.elbow;
  const [wx, wy] = chain.wrist;

  const upperM = capsuleMask(sx, sy, ex, ey, w + 1, w);
  // The forearm tapers hard into the wrist. Held at near-constant width it
  // met the hand as a step, and the hand read as a mitten pinned on.
  const foreM = capsuleMask(ex, ey, wx, wy, w, Math.max(3, w - 3));

  // Where the cloth stops along the whole chain.
  const sleeveEndsInUpper = plan.sleeveT < 0.5;
  const cutT = sleeveEndsInUpper ? plan.sleeveT / 0.5 : (plan.sleeveT - 0.5) / 0.5;
  const cutX = sleeveEndsInUpper ? sx + (ex - sx) * cutT : ex + (wx - ex) * cutT;
  const cutY = sleeveEndsInUpper ? sy + (ey - sy) * cutT : ey + (wy - ey) * cutT;

  const clothM = makeMask(SPRITE_W, SPRITE_H);
  const skinM = makeMask(SPRITE_W, SPRITE_H);
  const along = (x: number, y: number): number => {
    // Rough parameter along the chain, used only to split cloth from skin.
    const d1 = Math.hypot(x - sx, y - sy);
    const dc = Math.hypot(cutX - sx, cutY - sy);
    return d1 <= dc ? 0 : 1;
  };
  for (const m of [upperM, foreM]) {
    for (let y = 0; y < SPRITE_H; y += 1) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        if (!m[y * SPRITE_W + x]) continue;
        const target = plan.bare || along(x, y) === 1 ? skinM : clothM;
        target[y * SPRITE_W + x] = 1;
      }
    }
  }

  const paint = (m: Mask, ramp: Ramp, mat: number) => {
    for (let y = 0; y < SPRITE_H; y += 1) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        if (m[y * SPRITE_W + x]) raster.set(x, y, ramp.steps[3], mat, 3);
      }
    }
  };
  paint(clothM, ramps.clothA, MAT.CLOTH_A);
  paint(skinM, ramps.skin, MAT.SKIN);

  // Surfaces, per segment, so the elbow reads as a bend and not a kink.
  limbSurface(form, upperM, sx, sy, ex, ey, (w + 1) / 2, depth);
  limbSurface(form, foreM, ex, ey, wx, wy, w / 2, depth + 0.02);
  // The deltoid: a small ellipsoid over the joint, which is what makes the
  // shoulder round instead of a right angle.
  //
  // Its radius is the arm's, not the arm's plus two. Oversized, the cap stood
  // proud of both the sleeve below it and the torso beside it and resolved
  // brighter than either — a lit parallelogram jutting off the shoulder, which
  // was the most conspicuous artefact left on the figure.
  // The cap has to *bridge* — from the garment's edge out over the joint —
  // so it spans a little more than the arm and reaches a row higher than the
  // joint sits. Sized exactly to the arm it left a notch at the top of the
  // shoulder; sized w+2 it stood proud of both. This is the middle.
  const capM = capsuleMask(sx, sy - 2, sx, sy + 1, w + 1, w + 1);
  ellipsoidSurface(form, maskSubtract(capM, skinM), sx, sy - 1, (w + 1) / 2, (w + 1) / 2, depth);
  // And the elbow, one step down in its crook.
  form.addBias(ex, ey + 1, 1);

  if (!plan.bare && clothM.some((v) => v)) {
    weaveBias(form, clothM, spec.garment.material, spec.seed + side, s.t.textureAmt);
    // The cuff: one darker row where the sleeve ends.
    for (let dx = -w; dx <= w; dx += 1) {
      form.addBias(Math.round(cutX) + dx, Math.round(cutY), 1);
    }
  }
  // `armGap` carves daylight between the sleeve and the body below the waist.
  // The gap is most of what reads as three dimensions on a hanging arm, and
  // the slider for it had been doing nothing at all.
  if (s.t.armGap > 0 && arm.swing < 20) {
    const inner = side === s.nearSide ? -1 : 1;
    for (let y = s.waistY; y <= Math.min(SPRITE_H - 1, chain.wrist[1]); y += 1) {
      for (let g = 0; g < s.t.armGap; g += 1) {
        const x = chain.shoulder[0] - side * 0 + inner * (w / 2 + 1 + g) * -side;
        const px = Math.round(x);
        if (px < 0 || px >= SPRITE_W) continue;
        if (raster.matAt(px, y) === MAT.CLOTH_A) form.addBias(px, y, 3);
      }
    }
  }
  drawCuff(raster, form, spec, ramps, s, plan, chain, w);
  drawArmWear(raster, form, ramps, extras, chain, w, plan, spec);
  drawHand(raster, form, ramps, chain.hand[0], chain.hand[1], side, arm.hand, w, s.headH, s.t);
}

// ---------------------------------------------------------------------------
// Hands.
// ---------------------------------------------------------------------------

/**
 * A vocabulary, not a stamp.
 *
 * The old renderer had exactly one hand bitmap, mirrored — so every figure in
 * every pose held its hands the same way. Six by seven is the smallest grid on
 * which a hand can show separated fingers *and* a thumb on its own plane;
 * below that every shape collapses into the same mitten, which is why the
 * first pass at this renderer had to be reproportioned before hands were
 * worth authoring at all.
 *
 * Rows read top (knuckles) to bottom (fingertips) for a hanging hand, and are
 * mirrored for the right side. 1 = flesh, 2 = a lit knuckle or thumb-pad,
 * 3 = a shadowed separation between fingers.
 */
const HANDS: Record<Exclude<HandShape, 'hidden'>, number[][]> = {
  // Hanging loose, fingers curled toward the palm.
  rest: [
    [0, 2, 2, 1, 1, 0],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 3, 1, 3, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 3, 1, 1, 0],
    [0, 0, 1, 1, 0, 0],
  ],
  // Palm forward, fingers spread — three separations, which is what makes
  // this unmistakably an open hand rather than a paddle.
  open: [
    [0, 1, 1, 1, 1, 0],
    [1, 2, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 3, 1, 3, 1, 3],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 0],
  ],
  // Folded at the waist, one hand laid over the other.
  clasp: [
    [0, 1, 1, 1, 1, 0],
    [1, 2, 2, 1, 1, 1],
    [1, 1, 3, 1, 3, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // Closed around a haft, thumb over the knuckles.
  grip: [
    [0, 1, 1, 1, 0, 0],
    [1, 2, 1, 1, 1, 0],
    [1, 1, 3, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 3, 1, 1, 0],
    [0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // Turned up and forward, offering: the fingers read as a lit rim below.
  present: [
    [1, 1, 1, 1, 1, 0],
    [1, 3, 1, 3, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 2, 2, 2, 1, 0],
    [0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
  // A closed fist, raised.
  fist: [
    [0, 1, 1, 1, 0, 0],
    [1, 2, 2, 1, 1, 0],
    [1, 1, 1, 1, 1, 1],
    [1, 3, 1, 3, 1, 1],
    [0, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0],
  ],
};

function drawHand(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps,
  x: number, y: number, side: -1 | 1, shape: HandShape, armW: number, headH: number,
  tune: SpriteTuning
): void {
  if (shape === 'hidden') return;
  const grid = HANDS[shape];
  const gw = grid[0].length;
  const gh = grid.length;

  // The authored grid is a *shape*, not a size. It gets sampled to a box
  // derived from the head, because a hand that stays 6px while the figure
  // grows from a small woman to an imposing man is a hand that belongs to
  // neither of them. A third of a head-height is the stylised length these
  // sprites want — anatomically a hand is nearer a full face, but drawn that
  // long at this scale it reads as a paddle.
  const tw = Math.max(4, Math.round(headH * tune.handSize));
  const th = Math.max(5, Math.round(tw * tune.handLong));
  const cellAt = (tx: number, ty: number): number => {
    const gx = Math.min(gw - 1, Math.floor((tx * gw) / tw));
    const gy = Math.min(gh - 1, Math.floor((ty * gh) / th));
    return grid[gy][side === -1 ? gx : gw - 1 - gx];
  };

  const m = makeMask(SPRITE_W, SPRITE_H);
  const px0 = x - Math.floor(tw / 2);
  for (let ty = 0; ty < th; ty += 1) {
    for (let tx = 0; tx < tw; tx += 1) {
      if (!cellAt(tx, ty)) continue;
      const px = px0 + tx;
      const py = y + ty;
      if (px < 0 || py < 0 || px >= SPRITE_W || py >= SPRITE_H) continue;
      raster.set(px, py, ramps.skin.steps[3], MAT.SKIN, 3);
      m[py * SPRITE_W + px] = 1;
    }
  }
  // The hand is a small rounded mass, nearer the viewer than the arm it hangs
  // from — so it takes the light first and casts onto whatever it crosses.
  ellipsoidSurface(form, m, x, y + Math.round(th * 0.4), Math.max(2, tw / 2), th / 2, DEPTH.hand, 0.85);
  for (let ty = 0; ty < th; ty += 1) {
    for (let tx = 0; tx < tw; tx += 1) {
      const cell = cellAt(tx, ty);
      if (cell !== 2 && cell !== 3) continue;
      const px = px0 + tx;
      const py = y + ty;
      form.addBias(px, py, cell === 2 ? -1 : tune.fingerSplit);
    }
  }
  // The sleeve above casts onto the wrist.
  for (let dx = -Math.ceil(armW / 2); dx <= Math.ceil(armW / 2); dx += 1) {
    form.addBias(x + dx, y, 1);
  }
}

// ---------------------------------------------------------------------------
// Torso.
// ---------------------------------------------------------------------------

/**
 * The garment's silhouette. The top edge *slopes*: from the neck out and down
 * to the shoulder point, then around the deltoid. A horizontal shoulder line
 * was the single loudest paper-doll tell in the old figure, and it cost one
 * interpolation to fix.
 */
function torsoMask(s: Skeleton, plan: GarmentPlan): Mask {
  const m = makeMask(SPRITE_W, SPRITE_H);
  const t = s.t;
  const neckHalf = Math.round(t.neckW / 2) + 1;

  // Where the cloth actually starts.
  //
  // A wrapped lower garment — dhoti, lungi, kilt — begins at the waist and the
  // chest above it is bare. Starting every construction at the shoulders is
  // why those came out as full robes, which is about as wrong as a garment can
  // be rendered while still being cloth.
  const topY = plan.construction === 'wrapped_lower'
    ? s.waistY - 2
    : s.shoulderY - t.shoulderSlope;

  for (let y = topY; y <= plan.hemY; y += 1) {
    // A cropped blouse covers the ribs and stops; the skirt picks up again at
    // the hip, and the midriff between them is skin.
    if (plan.construction === 'crop_top' && y > plan.topHemY && y < s.hipY - 2) continue;
    let half: number;
    let skew: number;
    if (y < s.shoulderY) {
      // The trapezius: interpolate from the neck's width at the top of the
      // slope out to the full shoulder at the shoulder line.
      // The trapezius. `pow(tt, 0.62)` reaches full shoulder width almost at
      // once and then runs flat, which draws a square corner — the boxy
      // shoulders that read as a coat hanger. A gentler exponent keeps the
      // line sloping the whole way from neck to deltoid, which is what the
      // reference does and what stops the garment looking hung on a frame.
      const tt = (y - (s.shoulderY - t.shoulderSlope)) / Math.max(1, t.shoulderSlope);
      half = Math.round(neckHalf + (s.shoulderHalf - neckHalf) * Math.pow(tt, 1.35));
      skew = t.torsoSkew + s.stoopTopSkew;
    } else if (y <= s.waistY) {
      const tt = (y - s.shoulderY) / Math.max(1, s.waistY - s.shoulderY);
      half = Math.round(s.shoulderHalf + (s.waistHalf - s.shoulderHalf) * Math.pow(tt, 0.8));
      skew = t.torsoSkew + Math.round(s.stoopTopSkew * (1 - tt));
    } else if (y <= s.hipY) {
      const tt = (y - s.waistY) / Math.max(1, s.hipY - s.waistY);
      half = Math.round(s.waistHalf + (s.hipHalf - s.waistHalf) * tt);
      skew = t.torsoSkew + Math.round((t.hipSkew - t.torsoSkew) * tt);
    } else {
      // Below the hip the garment is drape, flaring toward its own hem.
      const tt = (y - s.hipY) / Math.max(1, plan.hemY - s.hipY);
      // Gradually. `pow(tt, 1.7)` held the skirt near hip-width and then
      // flared it over the last third, and because the barrel's shading
      // depends on its width the value shifted across the whole garment inside
      // one or two rows — a horizontal band at knee height that no amount of
      // fold work could hide. A gentler exponent spreads the same total flare
      // over the whole fall, so the shading changes as gradually as the shape.
      half = Math.round(s.hipHalf + (plan.hemHalf - s.hipHalf) * Math.pow(tt, 1.15));
      skew = t.hipSkew;
    }
    // The turn, applied where it actually lives: the two halves of the trunk
    // are different widths. The near side swings toward the viewer and reads
    // wider; the far side recedes and is foreshortened; and the whole barrel
    // narrows a little because we are no longer seeing it across its full
    // diameter. Drawing one `half` either side of an axis — which is what
    // this did — can only ever produce a figure standing square-on, however
    // many one-pixel skews are stacked on top of it.
    const lo = trunkEdge(s, half, -1, skew);
    const hi = trunkEdge(s, half, 1, skew);
    for (let x = lo.x; x <= hi.x; x += 1) {
      if (x < 0 || x >= SPRITE_W) continue;
      m[y * SPRITE_W + x] = 1;
    }
  }

  // The hem belongs to the folds. Each valley pulls it down and the ridges
  // between let it ride up, so the bottom edge is a scallop rather than a
  // ruled line the folds happen to cross — which is the single clearest
  // difference between the reference's skirts and a filled trapezoid.
  if (!plan.bare) {
    // The rim is an ellipse and it is *cut*, not added.
    //
    // The previous attempt computed the curve and then tried to express it in
    // the four rows around `hemY` — but the body loop above stops at `hemY`,
    // so there were no rows below it to occupy and the deepest the ellipse
    // could ever get was one pixel. The hem stayed a ruled line no matter what
    // the maths said. Anchoring the *front* at `hemY` and lifting the sides
    // away from it keeps the figure's height unchanged and gives the curve
    // somewhere to live.
    const d = plan.drape;
    for (let x = 0; x < SPRITE_W; x += 1) {
      // 0 at the front of the barrel, up to hemCurveMax out at the edges.
      const lift = d.hemCurveMax - d.hemCurveAt(x);
      const scallop = d.hemOffsetAt(x, plan.wind);
      const broke = s.t.hemBreak > 0 && ((x * 7) % 5) < s.t.hemBreak ? 1 : 0;
      const bottom = plan.hemY - lift + scallop - broke;
      for (let y = bottom + 1; y <= plan.hemY; y += 1) {
        if (y >= 0 && y < SPRITE_H) m[y * SPRITE_W + x] = 0;
      }
    }
  }
  return m;
}

function drawTorso(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan
): Mask {
  const m = torsoMask(s, plan);
  const t = s.t;
  const ramp = plan.bare ? ramps.skin : ramps.clothA;
  const mat = plan.bare ? MAT.SKIN : MAT.CLOTH_A;
  fillMask(raster, m, ramp, mat, () => 3);

  // A skirted construction is **two garments**, and the eye reads the join.
  //
  // A blouse tucked into a skirt is the single most common way clothing is put
  // together and it was rendering as one unbroken column of cloth from
  // shoulder to hem — 11% of everyone wearing what looked like a robe. The
  // upper takes the secondary colour, the skirt keeps the primary, and the
  // waistband between them is what says they are separate things rather than
  // one thing in two tones.
  if (plan.construction === 'skirted' && !plan.bare) {
    const bandTop = s.waistY - 1;
    const bandBot = s.waistY + 1;
    for (let y = s.shoulderY - t.shoulderSlope; y <= bandBot; y += 1) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        if (!m[y * SPRITE_W + x]) continue;
        if (y >= bandTop) {
          // The waistband itself: a darker band the skirt gathers into.
          raster.set(x, y, ramps.clothC.steps[4], MAT.CLOTH_C, 4);
          form.addBias(x, y, y === bandBot ? 2 : 1);
        } else {
          raster.set(x, y, ramps.clothB.steps[3], MAT.CLOTH_B, 3);
        }
      }
    }
  }

  // The trunk is one cylinder from the shoulders to the hem, so the light
  // crosses it continuously instead of restarting at the waist.
  // The barrel's axis is not the silhouette's centre once the body turns —
  // the lit ridge rides toward the near shoulder and the core shadow gathers
  // on the receding far side. Lighting a turned torso down its middle is what
  // made the old figure read as a flat board with a stripe on it.
  cylinderSurface(
    form, m,
    s.cx + Math.round((t.torsoSkew + t.hipSkew) / 2) + Math.round(s.turn * s.shoulderHalf * 0.22) * s.nearSide,
    s.shoulderHalf + 1, DEPTH.torso,
  );

  if (!plan.bare) {
    weaveBias(form, m, spec.garment.material, spec.seed, t.textureAmt);
    drawFolds(form, m, s, plan);
    drawClosure(raster, form, spec, ramps, s, plan, m);
    drawTrim(raster, form, spec, ramps, s, plan, m);
  }
  if (plan.belted) drawBelt(raster, form, ramps, s, plan, m);
  return m;
}

/**
 * Folds fall from where the cloth is gathered — the belt if there is one, the
 * shoulders if not — and swing as they fall. They are biases, so they band
 * with the light rather than sitting on top of it as scratches.
 */
/**
 * The fall of the skirt.
 *
 * Each fold is drawn as a **valley with a lit ridge beside it** — cloth turns
 * away from the light into the crease and back toward it coming out. Drawing
 * only the dark half, which is what this used to do, gives pinstripes; it is
 * the pair that reads as a surface bending.
 *
 * Everything about where they go — fan, start height, depth, sway — is decided
 * in `planDrape`, because the hem needs the same answers before the mask
 * exists.
 */
function drawFolds(form: FormBuffer, m: Mask, s: Skeleton, plan: GarmentPlan): void {
  const t = s.t;
  if (t.foldStrength <= 0) return;
  const d = plan.drape;

  // Row by row, not fold by fold.
  //
  // The previous model gave every crease a fixed two-column highlight a fixed
  // distance off its valley, which produced identical parallel bands — cloth
  // that read as rope laid side by side. But the lit part of a fold is not a
  // property of the fold at all: it is *the cloth between two creases*, and
  // its width is therefore whatever the gap between them happens to be. Wide
  // gaps get broad soft shoulders, tight ones get a narrow ridge, and the
  // variation comes free from the fold spacing rather than having to be
  // invented. Walking each row and looking at consecutive valleys is what
  // makes that available.
  const xs: number[] = [];
  const deep: number[] = [];

  for (let y = d.topY; y <= plan.hemY; y += 1) {
    xs.length = 0;
    deep.length = 0;
    for (const f of d.folds) {
      const from = Math.round(d.topY + (d.hemY - d.topY) * f.startT);
      const to = Math.round(d.topY + (d.hemY - d.topY) * f.endT);
      if (y < from || y > to) continue;
      const x = foldX(d, f, y, plan.wind);
      if (x < 1 || x >= SPRITE_W - 1 || !m[y * SPRITE_W + x]) continue;
      const tt = (y - from) / Math.max(1, to - from);
      // Deepening as it falls, then fading over the last fifth — a fold that
      // simply stops leaves a visible tick across the cloth.
      const fade = tt > 0.8 ? (1 - tt) / 0.2 : 1;
      xs.push(x);
      deep.push(Math.max(1, Math.round((f.depth + (tt > 0.55 ? 1 : 0)) * fade)));
    }
    if (!xs.length) continue;
    // Sorted, so "the next crease along" is meaningful.
    const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);

    // --- The valleys. Three columns on a falling weight, so a crease rolls
    // into the cloth rather than being ruled onto it.
    for (const i of order) {
      const x = xs[i];
      form.addBias(x, y, deep[i]);
      for (const dx of [-1, 1] as const) {
        const px = x + dx;
        if (px > 0 && px < SPRITE_W && m[y * SPRITE_W + px]) form.addBias(px, y, deep[i] - 1);
      }
    }

    // --- The lit cloth between them, as a cosine hump across each gap.
    for (let k = 0; k + 1 < order.length; k += 1) {
      const a = xs[order[k]];
      const b = xs[order[k + 1]];
      const span = b - a;
      // Adjacent creases with nothing between them have no shoulder to light.
      if (span < 4) continue;
      for (let x = a + 2; x < b - 1; x += 1) {
        if (!m[y * SPRITE_W + x]) continue;
        // 0 at either crease, 1 at the crest between them.
        const u = (x - a) / span;
        const hump = Math.sin(u * Math.PI);
        // …and how brightly that crest can read depends on where it sits on
        // the barrel. Out at the silhouette the cloth has already turned away
        // from the lamp, and lighting a crest there as hard as one down the
        // lit front is what turned the skirt into stripes on a board.
        const facing = facingAt(d, x, y);
        const room = facing > 0.72 ? 0 : facing > 0.44 ? 1 : 2;
        if (room === 0) continue;
        const lift = Math.round(hump * room + 0.15);
        if (lift > 0) form.addBias(x, y, -lift);
      }
    }
  }

  // Where the fall is gathered — at the belt, or the shoulders — the cloth
  // bunches into short creases that die out within a few rows.
  const gatherY = d.topY;
  for (const f of d.folds) {
    const x = foldX(d, f, gatherY + 2, plan.wind);
    for (let i = 0; i < 3; i += 1) {
      if (m[(gatherY + i) * SPRITE_W + x]) form.addBias(x, gatherY + i, 2 - i);
    }
  }

  // The hem's own gather line, and — more importantly — the shadow it throws
  // onto whatever is under it.
  //
  // Where a hem crosses the legs it is cloth suspended in front of skin with a
  // gap of air behind, so the leg beneath goes markedly dark and the hem's own
  // underside darkens with it. Left level with the surrounding cloth the two
  // read as one flat plane and the garment appears painted onto the leg.
  for (let x = 0; x < SPRITE_W; x += 1) {
    let hem = -1;
    for (let y = plan.hemY + 2; y >= plan.hemY - 14; y -= 1) {
      if (y >= 0 && y < SPRITE_H && m[y * SPRITE_W + x]) { hem = y; break; }
    }
    if (hem < 0) continue;
    if (t.hemLine > 0) {
      // Graded over four rows rather than slammed into two.
      //
      // Bisecting the passes put the garment's single largest row-to-row value
      // jump right here — 2.55 ramp steps in one row, which is a hard dark
      // stripe across the whole hem and reads as the skirt being cut off
      // rather than as cloth gathering. The gather is real, but it eases in.
      for (let i = 0; i < 4; i += 1) {
        form.addBias(x, hem - i, Math.max(0, Math.round(t.hemLine * (1 - i / 4))));
      }
    }
    // The cast, falling off over three rows onto the leg below.
    for (let i = 1; i <= 3; i += 1) form.addBias(x, hem + i, 4 - i);
  }
}

/**
 * Jewellery, in the piece's own material.
 *
 * The sprite was drawing every necklace as two ramp steps of generic metal and
 * every earring as one pixel of generic gem, while the bust renders the same
 * pieces through `ornamentRamp` — a table of turquoise, jade, amber, coral,
 * shell, gold, each pushed a touch past its real chroma so three pixels still
 * says what substance it is. A portrait showing a vivid turquoise multi-strand
 * collar beside a sprite showing a grey dash is not two views of one person.
 *
 * `scale` and `style` decide how much of the wearer the piece takes: a chunky
 * ceremonial collar is several strands deep and reaches the collarbone, a
 * delicate chain is one strand at the throat.
 */
function drawJewelry(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, s: Skeleton, L: HeadLayout
): void {
  for (const piece of spec.jewelry) {
    const ramp = ornamentRamp(piece.material);
    const stone = piece.stone ? ornamentRamp(piece.stone) : null;
    const chunky = piece.style === 'chunky' || piece.style === 'ornate';
    // `scale` is how much of the wearer the piece takes up, not how finely
    // it is worked — a large plain torc and a small ornate one are different
    // questions and the spec keeps them apart.
    const scale = piece.scale === 'large' ? 1.5 : piece.scale === 'small' ? 0.6 : 1;

    const bead = (x: number, y: number, r: Ramp, lit = false) => {
      if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
      if (raster.alphaAt(x, y) === 0) return;
      const step = lit ? 1 : 3;
      raster.set(x, y, r.steps[step], MAT.GEM, step);
      // Nearer the viewer than the cloth it lies on, so it takes the ink line
      // and casts its own small shadow.
      form.set(x, y, 0, -0.4, 0.85, DEPTH.torso + 0.14);
    };

    if (piece.type === 'necklace' || piece.type === 'chain') {
      // Strands: one for a delicate chain, up to four for a heavy collar.
      const strands = piece.type === 'chain' ? 1
        : Math.max(1, Math.min(4, Math.round((chunky ? 3 : 1.6) * scale)));
      const half = Math.round(s.t.neckW * 0.62 * (chunky ? 1.25 : 1));
      for (let k = 0; k < strands; k += 1) {
        const w = half + k;
        for (let dx = -w; dx <= w; dx += 1) {
          // Each strand hangs lower at the front than at the sides.
          const sag = Math.round((1 - (dx / Math.max(1, w)) ** 2) * (1.5 + k * 1.4));
          const y = s.shoulderY + 1 + k + sag;
          // Alternating value along the strand reads as separate beads.
          bead(s.headCx + dx, y, ramp, ((dx + k) & 1) === 0);
        }
      }
      // The pendant, where the piece has a stone set in it.
      if (stone) {
        const y = s.shoulderY + 2 + strands + Math.round(1.5 + strands * 1.4);
        bead(s.headCx, y, stone, true);
        bead(s.headCx, y + 1, stone);
        if (chunky) { bead(s.headCx - 1, y, stone); bead(s.headCx + 1, y, stone); }
      }
    } else if (piece.type === 'earrings') {
      // On the visible ear, and hanging below it if the piece is a drop.
      const ex = L.hx - L.turn * (L.rx + 1);
      bead(ex, L.eyeY + 3, stone ?? ramp, true);
      if (chunky || scale > 1) bead(ex, L.eyeY + 4, stone ?? ramp);
    } else if (piece.type === 'circlet') {
      for (let dx = -L.rx; dx <= L.rx; dx += 1) {
        bead(L.hx + dx, L.browY - 2, ramp, (dx & 1) === 0);
      }
      if (stone) bead(L.fx, L.browY - 2, stone, true);
    } else if (piece.type === 'brooch') {
      const bx = s.cx - s.nearSide * Math.round(s.shoulderHalf * 0.55);
      bead(bx, s.shoulderY + 4, stone ?? ramp, true);
      bead(bx + 1, s.shoulderY + 4, ramp);
      bead(bx, s.shoulderY + 5, ramp);
    } else if (piece.type === 'anklet') {
      for (const side of [-1, 1] as const) {
        const ax = s.cx + s.t.hipSkew + side * (Math.round(s.legW / 2) + s.legGap);
        for (let dx = -2; dx <= 2; dx += 1) bead(ax + dx, s.ankleY - 2, ramp, (dx & 1) === 0);
      }
    }
  }
}

/**
 * The second layer: a drape over one shoulder, an apron over the front, or a
 * cloak over both.
 *
 * These are what most distinguish a sari from a skirt, or a working woman from
 * the same woman on a feast day, and all three were falling through to the
 * base garment. The drape is the important one — a `pallu` or `odhani` crosses
 * the chest from one shoulder and falls past the hip, and that single diagonal
 * is the most recognisable line in the whole costume.
 *
 * Drawn after the torso and before the near arm, so the near arm laps over it
 * the way a real arm laps over cloth lying on the chest.
 */
function drawOverLayer(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, bodyM: Mask
): void {
  if (plan.over === 'none' || plan.bare) return;
  const d = plan.drape;
  // The over-layer is its own cloth: a second colour, or the same one a step
  // apart when the palette gives only one.
  // The *secondary*, never the accent.
  //
  // `clothC` is `garment.colors.accent` — a saturated thread colour chosen to
  // sit against the cloth in buttons and embroidery, and it is picked for
  // contrast. On this persona it is #49c3db: perfect as a stitch on charcoal,
  // and a neon cyan sheet when it covers half the figure. A shawl is cloth
  // from the same wardrobe as the robe, so it takes the secondary; the accent
  // is left where it belongs, on the drape's border.
  const ramp = ramps.clothB ?? ramps.clothA;
  const borderRamp = ramps.clothC ?? ramps.clothB;
  // The **material**, not just the fill ramp, has to change.
  //
  // `resolveLight` looks the ramp up from `raster.mat` when it recomputes, so
  // filling with `clothB` while tagging the pixels `CLOTH_C` left every one of
  // them resolving back to the accent — 2247 pixels of #49c3db across the
  // figure, unchanged by the fill. The same trap the shoe bands fell into.
  const mat = MAT.CLOTH_B;
  const m = makeMask(SPRITE_W, SPRITE_H);
  const lay = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    if (!bodyM[y * SPRITE_W + x]) return;
    m[y * SPRITE_W + x] = 1;
    raster.set(x, y, ramp.steps[3], mat, 3);
  };

  if (plan.over === 'drape') {
    // From the far shoulder, across the chest, and down past the near hip —
    // widening as it falls, because the cloth is gathered at the shoulder and
    // free below.
    const from = s.nearSide;
    const topX = s.cx - from * Math.round(s.shoulderHalf * 0.75);
    const topY = s.shoulderY - Math.round(s.t.shoulderSlope * 0.5);
    const botY = Math.min(plan.hemY, s.hipY + Math.round((plan.hemY - s.hipY) * 0.55));
    const span = Math.max(1, botY - topY);
    for (let i = 0; i <= span; i += 1) {
      const t = i / span;
      const cx = Math.round(topX + from * t * s.shoulderHalf * 1.5);
      // Narrower than it was. At 0.34–0.70 of the shoulder half-width the band
      // covered most of the chest and read as a bib; a pallu is a length of
      // the sari thrown over one shoulder, and it is the *diagonal* that says
      // so, not the area.
      // Tapering to a point over the last fifth, so the cloth ends in a
      // hanging corner rather than a cut edge. A drape that stops at full
      // width draws a horizontal line across the skirt.
      const taper = t > 0.8 ? 1 - (t - 0.8) / 0.2 : 1;
      const w = Math.max(0, Math.round(s.shoulderHalf * (0.22 + t * 0.20) * taper));
      for (let k = -w; k <= w; k += 1) lay(cx + k, topY + i);
    }

    // Folds down its length. A drape hung flat is a painted panel; the whole
    // reason the reference's pallu reads as cloth is that it creases along the
    // line of the fall, and those creases run with the diagonal rather than
    // straight down.
    const nFolds = 3;
    for (let f = 0; f < nFolds; f += 1) {
      const u = (f + 1) / (nFolds + 1);
      const phase = unit(spec.seed, `pallu-${f}`) * 2 - 1;
      for (let i = 2; i <= span - 2; i += 1) {
        const t = i / span;
        const cx = Math.round(topX + from * t * s.shoulderHalf * 1.5);
        const w = Math.round(s.shoulderHalf * (0.22 + t * 0.20));
        const wobble = Math.round(Math.sin(t * Math.PI * 1.6 + phase * 2) * 1.4);
        const x = Math.round(cx + (u - 0.5) * 2 * w) + wobble;
        const y = topY + i;
        if (!m[y * SPRITE_W + x]) continue;
        form.addBias(x, y, 2);
        if (m[y * SPRITE_W + x + from]) form.addBias(x + from, y, -1);
      }
    }
    // The free edge catches light; the fold behind it goes dark. And the
    // accent finally gets its proper job: a border thread along the free edge,
    // which is where a sari's zari actually runs and what the reference's gold
    // band is doing.
    const trimmed = spec.garment.ornament > 0.2;
    for (let i = 0; i <= span; i += 1) {
      const t = i / span;
      const cx = Math.round(topX + from * t * s.shoulderHalf * 1.5);
      const w = Math.round(s.shoulderHalf * (0.34 + t * 0.36));
      // Both edge marks stay *inside* the drape's own mask. Spilled onto the
      // skirt beside it they darkened a band that stopped dead where the drape
      // did, and the seam between the two read as a horizontal step across the
      // whole garment.
      const ex = cx + from * w;
      const ix = cx - from * w;
      if (m[(topY + i) * SPRITE_W + ex]) form.addBias(ex, topY + i, -2);
      if (m[(topY + i) * SPRITE_W + ix]) form.addBias(ix, topY + i, 2);
      if (trimmed && m[(topY + i) * SPRITE_W + ex]) {
        const step = (i % 3) === 0 ? 4 : 2;
        raster.set(ex, topY + i, borderRamp.steps[step], MAT.CLOTH_B, step);
      }
    }
  } else if (plan.over === 'apron') {
    // A panel hung from the waist over the front of the skirt, narrower than
    // the body and stopping short of the hem.
    const half = Math.round(s.hipHalf * 0.72);
    const top = s.waistY - 1;
    // Almost to the hem. An apron is a working garment and it covers the
    // skirt it is protecting; stopping four-fifths of the way down left a band
    // of clean cloth below it, which is the opposite of the point.
    const bot = Math.max(top + 6, plan.hemY - 2);
    const axis = d.axis + d.frontShift;
    for (let y = top; y <= bot; y += 1) {
      const t = (y - top) / Math.max(1, bot - top);
      const w = Math.round(half * (0.86 + t * 0.14));
      for (let x = axis - w; x <= axis + w; x += 1) lay(x, y);
    }
    // Its edges and its own hem sit proud of the skirt behind it.
    for (let y = top; y <= bot; y += 1) {
      const t = (y - top) / Math.max(1, bot - top);
      const w = Math.round(half * (0.86 + t * 0.14));
      form.addBias(axis - w, y, 2);
      form.addBias(axis + w, y, 2);
    }
    for (let x = axis - half; x <= axis + half; x += 1) form.addBias(x, bot, 3);
    // The waist tie.
    for (let x = axis - half; x <= axis + half; x += 1) form.addBias(x, top, 2);
  } else if (plan.over === 'cloak') {
    // Over both shoulders and down the back, so it reads as a mass *behind*
    // the arms — only its edges show past the body.
    const top = s.shoulderY - s.t.shoulderSlope;
    const bot = Math.min(plan.hemY, s.hipY + Math.round((plan.hemY - s.hipY) * 0.7));
    for (let y = top; y <= bot; y += 1) {
      const t = (y - top) / Math.max(1, bot - top);
      const half = Math.round(s.shoulderHalf * (1 + t * 0.22));
      for (let k = 0; k <= 4; k += 1) {
        lay(s.cx - half + k, y);
        lay(s.cx + half - k, y);
      }
    }
    // The neck opening, and the fall of the collar over the shoulders.
    for (let dx = -s.shoulderHalf; dx <= s.shoulderHalf; dx += 1) {
      form.addBias(s.cx + dx, top + 1, 2);
    }
  }

  if (m.some((v) => v)) {
    weaveBias(form, m, spec.garment.material, spec.seed + 91, s.t.textureAmt);
  }
}

/**
 * The trunk as skin, for the parts of it a garment does not cover.
 *
 * A narrower barrel than the clothed torso — cloth stands off the body — and
 * it carries the same cylinder light so the lit side agrees with the arms and
 * the neck either side of it.
 */
function drawBareTorso(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, s: Skeleton, plan: GarmentPlan
): void {
  const t = s.t;
  const from = plan.shape.bareChest ? s.shoulderY - 1 : s.chestY;
  const to = plan.shape.bareMidriff ? s.hipY + 2 : s.waistY + 4;
  const m = makeMask(SPRITE_W, SPRITE_H);
  for (let y = from; y <= to; y += 1) {
    const tt = (y - s.shoulderY) / Math.max(1, s.waistY - s.shoulderY);
    const half = Math.round(
      (s.shoulderHalf + (s.waistHalf - s.shoulderHalf) * Math.max(0, Math.min(1, tt))) * 0.86,
    );
    const lo = trunkEdge(s, half, -1, t.torsoSkew);
    const hi = trunkEdge(s, half, 1, t.torsoSkew);
    for (let x = lo.x; x <= hi.x; x += 1) {
      if (x < 0 || x >= SPRITE_W) continue;
      m[y * SPRITE_W + x] = 1;
      raster.set(x, y, ramps.skin.steps[3], MAT.SKIN, 3);
    }
  }
  cylinderSurface(form, m, s.cx + Math.round(s.turn * s.shoulderHalf * 0.22) * s.nearSide,
    s.shoulderHalf + 1, DEPTH.torso - 0.02);
  // The collarbones, and the shadow the ribs sit in — two marks, and a bare
  // chest stops being a plain cylinder.
  if (plan.shape.bareChest) {
    for (let dx = -Math.round(s.shoulderHalf * 0.5); dx <= Math.round(s.shoulderHalf * 0.5); dx += 1) {
      form.addBias(s.cx + dx, s.shoulderY + 3, Math.abs(dx) > 2 ? 2 : 0);
    }
    for (let dx = -2; dx <= 2; dx += 1) form.addBias(s.cx + dx, s.chestY + 4, 1);
  }
  // Where cloth meets skin the cloth casts, exactly as the hem does on legs.
  const edgeY = plan.shape.bareChest ? s.waistY - 2 : plan.topHemY;
  for (let x = 0; x < SPRITE_W; x += 1) {
    for (let i = 1; i <= 3; i += 1) {
      if (m[(edgeY + i) * SPRITE_W + x]) form.addBias(x, edgeY + i, 4 - i);
    }
  }
}

/**
 * What the person is carrying at the waist.
 *
 * The mockup's drover has a pouch on his belt and it does a surprising amount
 * of work: it breaks the flat plane of the coat, it puts a second material
 * next to the cloth, and it says something about the man. All of that is
 * available from the inventory the generator already fills in — nothing here
 * is invented, and a character carrying nothing gets nothing.
 */
function drawWorn(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, extras: SpriteExtras
): void {
  const worn = extras.worn;
  if (!worn || worn.kind === 'none' || plan.bare) return;

  const leather = ramps.leather;
  const d = plan.drape;
  // Slung on the near hip, clear of the placket and forward of the far arm.
  const side = s.nearSide;
  const hipX = d.axis + d.frontShift + side * Math.round(s.hipHalf * 0.72);
  const beltY = plan.belted ? s.waistY : s.waistY + 2;

  const box = (x0: number, y0: number, w: number, h: number, ramp: Ramp, mat: number) => {
    const m = makeMask(SPRITE_W, SPRITE_H);
    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) continue;
        raster.set(x, y, ramp.steps[3], mat, 3);
        m[y * SPRITE_W + x] = 1;
      }
    }
    // Rounded, and nearer the viewer than the cloth it hangs on — so the ink
    // pass separates it and it casts its own small shadow.
    ellipsoidSurface(form, m, x0 + w / 2 - 0.5, y0 + h * 0.45, w / 2 + 0.5, h / 2 + 0.5,
      DEPTH.torso + 0.10, 0.7);
    return m;
  };

  switch (worn.kind) {
    case 'pouch':
    case 'purse': {
      const w = Math.max(4, Math.round(s.hipHalf * 0.42));
      const h = Math.max(4, Math.round(w * (worn.kind === 'purse' ? 0.9 : 1.15)));
      box(hipX - Math.floor(w / 2), beltY + 1, w, h, leather, MAT.LEATHER);
      // The flap: a darker band across the top third, which is what makes it
      // a pouch rather than a rectangle.
      for (let x = hipX - Math.floor(w / 2); x < hipX - Math.floor(w / 2) + w; x += 1) {
        for (let i = 0; i < 2; i += 1) {
          form.addBias(x, beltY + 1 + Math.round(h * 0.34) + i, i === 0 ? 2 : 1);
        }
      }
      // …and the strap that carries it over the belt.
      for (let i = 0; i < 2; i += 1) form.addBias(hipX + i - 1, beltY, 2);
      break;
    }
    case 'scrip':
    case 'satchel': {
      const w = Math.max(5, Math.round(s.hipHalf * 0.62));
      const h = Math.max(5, Math.round(w * 0.85));
      const y0 = beltY + (worn.kind === 'satchel' ? 3 : 1);
      box(hipX - Math.floor(w / 2), y0, w, h, leather, MAT.LEATHER);
      for (let x = hipX - Math.floor(w / 2); x < hipX - Math.floor(w / 2) + w; x += 1) {
        form.addBias(x, y0 + Math.round(h * 0.4), 2);
      }
      // A satchel hangs from a strap that crosses the chest.
      if (worn.kind === 'satchel') {
        const topX = s.cx - side * Math.round(s.shoulderHalf * 0.55);
        const steps = Math.max(1, y0 - s.shoulderY);
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const x = Math.round(topX + (hipX - topX) * t);
          const y = s.shoulderY + i;
          raster.set(x, y, leather.steps[4], MAT.LEATHER, 4);
          form.set(x, y, 0, -0.3, 0.9, DEPTH.torso + 0.08);
        }
      }
      break;
    }
    case 'horn': {
      const w = Math.max(3, Math.round(s.hipHalf * 0.3));
      const h = Math.max(5, w * 2);
      box(hipX - Math.floor(w / 2), beltY + 2, w, h, ramps.book[MAT.WOOD] ?? leather, MAT.WOOD);
      break;
    }
    case 'tools': {
      // A roll of tools: three short metal glints on a leather backing.
      const w = Math.max(4, Math.round(s.hipHalf * 0.5));
      const h = Math.max(3, Math.round(w * 0.6));
      box(hipX - Math.floor(w / 2), beltY + 1, w, h, leather, MAT.LEATHER);
      for (let i = 0; i < 3; i += 1) {
        const x = hipX - Math.floor(w / 2) + 1 + i * 2;
        raster.set(x, beltY, ramps.metal.steps[2], MAT.METAL, 2);
        form.set(x, beltY, 0, -0.5, 0.8, DEPTH.torso + 0.12);
      }
      break;
    }
    default: break;
  }
}

/**
 * Embroidery: a placket band down the front and a border at the hem.
 *
 * Trim is not only decoration — it is *structure*. The hem band follows the
 * rim's ellipse, so it draws the curve of the barrel across the whole width of
 * the skirt; the placket runs down the front of the fall, so it says where the
 * front *is* on a form that is otherwise symmetrical. Removing the trim from
 * the reference robe costs it more volume than it costs it ornament.
 */
function drawTrim(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, m: Mask
): void {
  const orn = spec.garment.ornament;
  // Ornament is quantised in practice — measured over 600 personas it is
  // almost always 0.00, 0.15, 0.35 or 1.00, with a median of 0.15. A gate at
  // 0.25 therefore excluded *84%* of everyone from having any trim at all,
  // which is most of why the figures read as plainer than the reference: not
  // because the trim was drawn badly but because it was almost never drawn.
  //
  // So this scales rather than gates. Genuinely unornamented cloth — a
  // labourer's smock at 0.00 — stays plain, which it should; everything above
  // that gets trim proportionate to how much it has.
  if (orn < 0.05 || plan.bare) return;
  const d = plan.drape;
  const rich = orn > 0.55;
  /** Hem band only at the bottom of the range; placket and cuffs come later. */
  const hasPlacket = orn >= 0.3;
  const trim = ramps.clothB;

  const lay = (x: number, y: number, alt: boolean) => {
    if (x < 0 || x >= SPRITE_W || y < 0 || y >= SPRITE_H) return;
    if (!m[y * SPRITE_W + x]) return;
    const step = alt ? 2 : 4;
    raster.set(x, y, trim.steps[step], MAT.CLOTH_B, step);
    form.addBias(x, y, alt ? -1 : 1);
  };

  // --- The hem border, riding the rim's ellipse. --------------------------
  const bandH = rich ? 3 : orn >= 0.3 ? 2 : 1;
  for (let x = 0; x < SPRITE_W; x += 1) {
    // Find the garment's actual lowest row in this column — the hem is a
    // curve plus a scallop, so it has to be read, not assumed.
    let hem = -1;
    for (let y = plan.hemY + 2; y >= plan.hemY - 14; y -= 1) {
      if (y >= 0 && y < SPRITE_H && m[y * SPRITE_W + x]) { hem = y; break; }
    }
    if (hem < 0) continue;
    for (let i = 0; i < bandH; i += 1) {
      // The pattern alternates along the band and steps with the row, which
      // at this size is enough to read as a repeating motif.
      lay(x, hem - i, ((x + i * 2) % 4) < 2);
    }
    // A thread of shadow above the band, so it sits *on* the cloth.
    if (hem - bandH >= 0 && m[(hem - bandH) * SPRITE_W + x]) form.addBias(x, hem - bandH, 1);
  }

  if (!hasPlacket) return;

  // --- The placket, down the front of the fall. ---------------------------
  // It follows the barrel's front, which the turn has swung off the axis — a
  // placket drawn down the middle of the silhouette contradicts every other
  // cue that the figure is turned. Three pixels wide on an ornamented garment:
  // a single column reads as a scratch, and the reference's band is broad
  // enough to carry its own pattern.
  const px = d.axis + d.frontShift - 1;
  const pw = rich ? 3 : 2;
  for (let y = s.shoulderY + 4; y <= plan.hemY; y += 1) {
    for (let i = 0; i < pw; i += 1) {
      const edge = i === 0 || i === pw - 1;
      lay(px + i, y, edge || ((y % 4) < 2));
    }
    if (px > 0 && m[y * SPRITE_W + px - 1]) form.addBias(px - 1, y, 1);
    if (px + pw < SPRITE_W && m[y * SPRITE_W + px + pw]) form.addBias(px + pw, y, 1);
  }
}

/**
 * The cuff, banded across the sleeve's actual end.
 *
 * An earlier version guessed the wrist's position from the shoulder and the
 * waist and painted a band there, which on most poses landed in mid-air. It
 * has to be given the arm's own chain — the same one that drew the sleeve —
 * and lay the band perpendicular to the forearm's direction.
 */
function drawCuff(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, chain: ArmChain, w: number
): void {
  // 0.45 reached 3% of personas. A cuff is the most ordinary garment finish
  // there is — most sleeves that reach the wrist have one.
  if (spec.garment.ornament < 0.28 || plan.bare || plan.sleeveT < 0.5) return;
  void s;
  const [ex, ey] = chain.elbow;
  const [wx, wy] = chain.wrist;
  // Where the cloth stops along the forearm.
  const t = (plan.sleeveT - 0.5) / 0.5;
  const cx = ex + (wx - ex) * t;
  const cy = ey + (wy - ey) * t;
  const len = Math.max(1, Math.hypot(wx - ex, wy - ey));
  // Perpendicular to the limb, so the band wraps rather than cutting across.
  const nx = -(wy - ey) / len;
  const ny = (wx - ex) / len;
  const trim = ramps.clothB;
  const depth = spec.garment.ornament > 0.7 ? 3 : 2;

  for (let d = -depth; d <= 0; d += 1) {
    for (let k = -w / 2 - 1; k <= w / 2 + 1; k += 0.5) {
      const x = Math.round(cx + nx * k + ((wx - ex) / len) * d);
      const y = Math.round(cy + ny * k + ((wy - ey) / len) * d);
      if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) continue;
      if (raster.matAt(x, y) !== MAT.CLOTH_A) continue;
      const alt = ((Math.round(k) + d) % 3) !== 0;
      raster.set(x, y, trim.steps[alt ? 2 : 4], MAT.CLOTH_B, alt ? 2 : 4);
      form.addBias(x, y, alt ? -1 : 1);
    }
  }
}

/**
 * The neckline — read off the garment, and elaborated when the garment is
 * silent about it.
 *
 * Every figure was wearing the same two-row collar, which is both dull and
 * wrong: a kurta has a narrow standing band, a chiton falls off the shoulder,
 * a kaftan crosses over, a shift is a plain round scoop. The shape is taken
 * from the item's own name first, then from the garment kind, and only then
 * from a seeded choice among the necklines that kind could plausibly have —
 * so the same persona always wears the same collar, and a named garment is
 * never contradicted.
 */
type Neckline = 'round' | 'vee' | 'stand' | 'cross' | 'square' | 'boat' | 'keyhole';

function readNeckline(spec: PortraitSpec, kind: string): Neckline {
  const n = `${spec.garment.name} ${spec.garment.material}`.toLowerCase();
  if (/mandarin|stand|band collar|kurta|achkan|sherwani|cheongsam|changshan/.test(n)) return 'stand';
  if (/kaftan|caftan|kimono|hanbok|wrap|cross|angarkha|dhoti|toga|himation/.test(n)) return 'cross';
  if (/cotehardie|houppelande|doublet|jerkin/.test(n)) return 'vee';
  if (/chiton|peplos|stola|tunica/.test(n)) return 'boat';
  if (/shift|smock|chemise|shirt|blouse/.test(n)) return 'round';
  // Nothing in the name: pick from what this construction could carry.
  const pool: Neckline[] =
    kind === 'robe' || kind === 'gown' ? ['round', 'vee', 'keyhole', 'stand']
    : kind === 'wrapped_garment' ? ['cross', 'boat']
    : kind === 'jacket' || kind === 'doublet' ? ['vee', 'stand', 'square']
    : ['round', 'vee', 'boat'];
  return pool[Math.floor(unit(spec.seed, 'neckline') * pool.length) % pool.length];
}

function drawNeckline(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, m: Mask
): void {
  const t = s.t;
  const style = readNeckline(spec, plan.kind);
  const hx = s.headCx;
  const half = Math.round(t.neckW / 2) + 1;
  const top = s.shoulderY - t.shoulderSlope;
  const trimmed = spec.garment.ornament > 0.4;
  const ramp = trimmed ? ramps.clothB : ramps.clothA;
  const mat = trimmed ? MAT.CLOTH_B : MAT.CLOTH_A;

  const lay = (x: number, y: number, deep = 1) => {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    if (!m[y * SPRITE_W + x]) return;
    raster.set(x, y, ramp.steps[trimmed ? 3 : 4], mat, trimmed ? 3 : 4);
    form.addBias(x, y, deep);
  };

  switch (style) {
    case 'stand': {
      // A band standing up around the throat, two rows, closed at the front.
      for (let dx = -half; dx <= half; dx += 1) {
        lay(hx + dx, top, 1);
        lay(hx + dx, top + 1, 2);
      }
      break;
    }
    case 'vee': {
      const depth = Math.max(3, Math.round((s.waistY - s.shoulderY) * 0.30));
      for (let i = 0; i <= depth; i += 1) {
        const w = Math.max(0, Math.round(half * (1 - i / depth)));
        lay(hx - w, top + i, 2);
        lay(hx + w, top + i, 2);
      }
      break;
    }
    case 'cross': {
      // One lapel laid over the other, running from the far shoulder down
      // across the chest — the single most recognisable neckline there is.
      const dir = s.nearSide;
      const depth = Math.max(4, Math.round((s.waistY - s.shoulderY) * 0.42));
      for (let i = 0; i <= depth; i += 1) {
        const x = hx - dir * half + Math.round(dir * i * 0.9);
        lay(x, top + i, 2);
        lay(x + dir, top + i, 1);
      }
      for (let i = 0; i <= Math.round(depth * 0.55); i += 1) {
        lay(hx + dir * half - Math.round(dir * i * 0.5), top + i, 2);
      }
      break;
    }
    case 'square': {
      for (let dx = -half; dx <= half; dx += 1) lay(hx + dx, top + 2, 2);
      for (let i = 0; i <= 2; i += 1) { lay(hx - half, top + i, 2); lay(hx + half, top + i, 2); }
      break;
    }
    case 'boat': {
      // Wide and shallow, running out toward the shoulder points.
      for (let dx = -half - 3; dx <= half + 3; dx += 1) {
        const lift = Math.round(Math.abs(dx) * 0.22);
        lay(hx + dx, top + 1 - lift, 2);
      }
      break;
    }
    case 'keyhole': {
      for (let dx = -half; dx <= half; dx += 1) lay(hx + dx, top, 1);
      for (let i = 1; i <= 3; i += 1) { lay(hx, top + i, 2); lay(hx + 1, top + i, 1); }
      break;
    }
    case 'round':
    default: {
      for (let dx = -half - 1; dx <= half + 1; dx += 1) {
        const drop = Math.round((1 - Math.pow(dx / (half + 1), 2)) * 2);
        lay(hx + dx, top + drop, 2);
        if (trimmed) lay(hx + dx, top + drop - 1, 1);
      }
      break;
    }
  }
}

function drawClosure(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, m: Mask
): void {
  const t = s.t;
  const open = plan.kind === 'jacket' || plan.kind === 'doublet' || plan.kind === 'robe'
    || plan.kind === 'gown' || plan.kind === 'wrapped_garment';
  const cx = s.cx + t.torsoSkew + 1;

  drawNeckline(raster, form, spec, ramps, s, plan, m);

  // The collar's cast onto the throat. Cloth standing in front of the neck
  // shades what is behind it for the same reason the hem shades the legs, and
  // without it the head sits on the garment rather than inside it.
  {
    const nh = Math.round(t.neckW / 2) + 2;
    for (let dx = -nh; dx <= nh; dx += 1) {
      for (let i = 0; i < 3; i += 1) {
        form.addBias(s.headCx + dx, s.shoulderY - t.shoulderSlope - 1 - i, 3 - i);
      }
    }
  }

  if (!open) {
    // A closed tunic still has a placket, and buttons if it can afford them.
    for (let y = s.shoulderY + 2; y <= s.waistY - 1; y += 1) {
      if (m[y * SPRITE_W + cx]) form.addBias(cx, y, 1);
    }
    if (spec.garment.ornament > 0.25) {
      for (let y = s.shoulderY + 3; y <= s.waistY - 2; y += 3) {
        if (m[y * SPRITE_W + cx]) raster.set(cx, y, ramps.metal.steps[2], MAT.METAL, 2);
      }
    }
    return;
  }
  // An open garment shows the overlap: one edge in front of the other, with
  // the far panel a step down.
  for (let y = s.shoulderY + 1; y <= plan.hemY - 1; y += 1) {
    const lean = Math.round((y - s.shoulderY) * 0.08);
    const x = cx + lean;
    if (!m[y * SPRITE_W + x]) continue;
    form.addBias(x, y, 2);
    if (m[y * SPRITE_W + x - 1]) form.addBias(x - 1, y, -1);
    for (let k = 1; k <= 3; k += 1) if (m[y * SPRITE_W + x + k]) form.addBias(x + k, y, 1);
  }
  if (spec.garment.ornament > 0.4) {
    for (let y = s.shoulderY + 2; y <= plan.hemY - 2; y += 1) {
      const x = cx + Math.round((y - s.shoulderY) * 0.08) + 1;
      if (m[y * SPRITE_W + x]) raster.set(x, y, ramps.clothC.steps[2], MAT.CLOTH_C, 2);
    }
  }
}

function drawBelt(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, m: Mask
): void {
  const y0 = s.waistY;
  const beltM = makeMask(SPRITE_W, SPRITE_H);
  for (let y = y0; y <= y0 + 1; y += 1) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!m[y * SPRITE_W + x]) continue;
      raster.set(x, y, ramps.leather.steps[4], MAT.LEATHER, 4);
      beltM[y * SPRITE_W + x] = 1;
    }
  }
  // The belt is a band around a cylinder, not a stripe painted on one.
  cylinderSurface(form, beltM, s.cx + s.t.torsoSkew, s.waistHalf + 1, DEPTH.torso + 0.04);
  // The buckle, and the cloth gathering above the belt.
  const bx = s.cx + s.t.torsoSkew + 2;
  raster.set(bx, y0, ramps.metal.steps[2], MAT.METAL, 2);
  raster.set(bx, y0 + 1, ramps.metal.steps[3], MAT.METAL, 3);
  for (let x = 0; x < SPRITE_W; x += 1) {
    if (m[(y0 - 1) * SPRITE_W + x]) form.addBias(x, y0 - 1, 1);
  }
}

// ---------------------------------------------------------------------------
// Legs and feet.
// ---------------------------------------------------------------------------

function drawLegs(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, s: Skeleton,
  extras: SpriteExtras, plan: GarmentPlan
): void {
  if (plan.hemY >= s.ankleY - 1) return;
  const t = s.t;
  // A trousered construction *is* legwear, whatever the inventory says — the
  // garment named in the spec is the thing on the legs.
  const legged = extras.hasLegwear || plan.construction === 'trousered';
  const ramp = legged ? ramps.clothB : ramps.skin;
  const mat = legged ? MAT.CLOTH_B : MAT.SKIN;

  for (const side of [-1, 1] as const) {
    const near = side === s.nearSide;
    // Legs stand plumb. An earlier version angled them toward each other by
    // half the stride and they crossed at the knee — at a near-frontal view a
    // stride is *depth*, which the foot stagger and the depth buffer carry,
    // not a horizontal splay.
    const legX = s.cx + t.hipSkew + side * (Math.round(s.legW / 2) + s.legGap);
    const top = plan.hemY - 4;
    const bottom = s.ankleY - (near ? 0 : t.footStagger);
    // The thigh is fuller than the calf, and the calf tapers into the ankle.
    const m = maskUnion(
      capsuleMask(legX, top, legX, s.kneeY, s.legW + 1, s.legW),
      capsuleMask(legX, s.kneeY, legX, bottom, s.legW, s.legW - 3)
    );
    for (let y = 0; y < SPRITE_H; y += 1) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        if (m[y * SPRITE_W + x]) raster.set(x, y, ramp.steps[3], mat, 3);
      }
    }
    limbSurface(form, m, legX, top, legX, bottom, s.legW / 2, near ? DEPTH.legNear : DEPTH.legFar);
    // The knee: a lit cap, a hollow behind it, and a darkened edge either
    // side so the joint reads as a swelling rather than a change of tone. A
    // bare leg without this is a dowel — the knee is the only landmark it has.
    const kw = Math.max(1, Math.round(s.legW * 0.28));
    for (let dx = -kw; dx <= kw; dx += 1) {
      const near0 = Math.abs(dx) <= Math.max(1, kw - 1);
      form.addBias(legX + dx, s.kneeY - 1, near0 ? -2 : 0);
      form.addBias(legX + dx, s.kneeY, near0 ? -1 : 1);
      form.addBias(legX + dx, s.kneeY + 2, near0 ? 2 : 1);
    }
    // The calf swells below it and the shin stays flat — one more landmark.
    for (let y = s.kneeY + 4; y < s.ankleY - 4; y += 1) {
      const t = (y - s.kneeY - 4) / Math.max(1, s.ankleY - 8 - s.kneeY);
      if (t < 0.45) form.addBias(legX - side * Math.round(s.legW * 0.3), y, -1);
    }
    // The gap between the legs takes the deepest occlusion.
    if (near) {
      for (let y = top; y <= bottom; y += 1) form.addBias(legX - side * (s.legW / 2), y, 1);
    }
  }
}

/**
 * Footwear, built the way the reference builds it.
 *
 * The old version extruded one tapering wedge per foot and darkened the bottom
 * row, which produced a lump. A shoe that reads as a shoe has four separable
 * parts and needs all four:
 *
 *   · a **sole plate** — its own slab, its own material, overhanging the upper
 *     front and back, so the keyline draws a line under the whole shoe;
 *   · an **upper** whose height falls from a tall heel through the instep to a
 *     low toe, on a curve, not a ramp;
 *   · a **toe cap** that catches the light on its dome;
 *   · a **vamp seam** raking back from the toe to the ankle, which is the one
 *     interior line that says "shoe" rather than "foot-shaped object".
 *
 * Bare feet get the same skeleton minus the sole and vamp, plus toes.
 */
function drawFeet(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, s: Skeleton, extras: SpriteExtras
): void {
  const t = s.t;
  const kind: FootwearKind = extras.footwear;
  const bare = kind === 'bare';
  const soft = kind === 'straw' || kind === 'wrap';
  const boot = kind === 'boot';
  const clog = kind === 'clog';
  const sandal = kind === 'sandal' || kind === 'straw';

  const ramp = bare ? ramps.skin
    : soft ? ramps.clothC
    : clog ? ramps.book[MAT.WOOD] ?? ramps.leather
    : ramps.leather;
  const mat = bare ? MAT.SKIN : soft ? MAT.CLOTH_C : clog ? MAT.WOOD : MAT.LEATHER;
  // The sole is a different material from the upper so the ink pass separates
  // them — the welt line is the single cheapest cue that this is footwear.
  const soleRamp = clog ? ramps.book[MAT.WOOD] ?? ramps.leather : ramps.leather;

  // Both toes point the way the figure *faces*, which is away from `nearSide`
  // — the same inversion the head had. `nearSide` names the shoulder swung
  // toward the viewer, not the direction of travel, and reading toe direction
  // off it directly gave a figure walking backwards out of its own stance.
  const toeDir: -1 | 1 = -s.nearSide as -1 | 1;

  /**
   * The two feet are drawn at **different angles**, which is the whole thing.
   *
   * A figure turned three-quarters does not present two identical shoes at
   * different heights — that is what this used to do, and staggering them
   * vertically only made it read as one shoe pasted twice. The far foot
   * (behind the body, pointing across the frame) is seen almost in profile:
   * long, low, the classic heel-to-toe shoe silhouette. The near foot points
   * toward the camera and is therefore **foreshortened** — short along the
   * ground, taller, with the toe box swung round to face the viewer as a
   * rounded end-cap and the top of the foot showing as a lit plane.
   *
   * `profileFar` runs heel→toe across the frame. `profileNear` is the same
   * foot rotated: it loses most of its length and gains height and bulk.
   */
  const profileFar = (u: number): number => {
    if (u < 0.12) {
      const k = 1 - u / 0.12;
      return 0.58 + Math.sqrt(Math.max(0, 1 - k * k)) * 0.42;
    }
    if (u < 0.62) return 1;
    const k = (u - 0.62) / 0.38;
    return 0.20 + Math.sqrt(Math.max(0, 1 - k * k)) * 0.80;
  };
  // Pointed at the viewer: the ankle end is narrow and tall, the toe end is a
  // broad dome, and there is very little in between because it is compressed
  // along the line of sight.
  const profileNear = (u: number): number => {
    if (u < 0.18) {
      const k = 1 - u / 0.18;
      return 0.70 + Math.sqrt(Math.max(0, 1 - k * k)) * 0.30;
    }
    if (u < 0.48) return 1;
    const k = (u - 0.48) / 0.52;
    return 0.46 + Math.sqrt(Math.max(0, 1 - k * k)) * 0.54;
  };

  // Far foot first, so the near one overlaps it rather than the other way
  // round — the loop used to run left-to-right and let the far shoe draw on
  // top of the near one wherever they met.
  for (const side of [-s.nearSide, s.nearSide] as const) {
    const near = side === s.nearSide;
    const cx = s.cx + t.hipSkew + side * (Math.round(s.legW / 2) + s.legGap);
    const soleY = s.floorY - (near ? 0 : t.footStagger);
    // The heel projects *barely* behind the ankle. Given the leg's full
    // half-width it ran back almost as far as the toe ran forward, which put
    // the ankle in the middle of the foot instead of over its back third —
    // a foot is a lever with a short heel arm and a long toe arm.
    const lenScale = t.shoeLen / 23;
    const heel = Math.max(2, Math.round(s.legW * 0.34 * lenScale) + (near ? 1 + t.footSplay : 0));
    // The near foot is closer to the camera: longer, and its sole reads thicker.
    // Foreshortening, the right way round: the NEAR foot is the short one,
    // because it is the one pointing at the camera. The far foot is seen
    // across its full length.
    const profile = near ? profileNear : profileFar;
    // The near foot is pointed further toward the viewer than the far one —
    // it is on the side that swung forward, so it is more foreshortened along
    // the ground and reads more end-on. 0.62 was still too side-on; at 0.46 it
    // is unmistakably a foot coming at you next to one seen in profile.
    // `shoeLen` scales the whole foot, `footToe` its reach, `footSplay` the
    // extra width the near foot gains from being closer. All three were
    // stranded when the two-perspective feet went in.
    const toe = Math.max(3, Math.round(
      t.footToe * lenScale * (near ? 0.46 : 1.1) * (0.6 + s.turn * 0.5),
    ));
    // Each construction has its own proportions. A clog is mostly sole; a
    // sandal is almost none; a boot's upper is the whole thing. Running them
    // all through one shape with a couple of ternaries is why every figure
    // looked like it was wearing the same slipper in different colours.
    const soleH = clog ? Math.max(3, Math.round(s.shoeH * 0.42))
      : kind === 'straw' ? 1
      : sandal ? 1
      : kind === 'wrap' ? 1
      : 2;
    // The near foot is taller in the frame for the same reason it is shorter:
    // rotating it toward the camera trades length for height.
    const upperH = Math.max(3, Math.round((s.shoeH - soleH) * (near ? 1.08 : 0.9)));
    const shaftTop = boot ? soleY - s.shoeH - Math.round(s.shoeH * 1.1) : null;

    const backX = cx - (toeDir > 0 ? heel : heel + toe);
    const frontX = cx + (toeDir > 0 ? heel + toe : heel);
    // The sole overhangs only at the toe, and only by a pixel. Overhanging
    // both ends made it read as a plank the shoe was resting on.
    const soleBack = backX - (toeDir > 0 ? 0 : 1);
    const soleFront = frontX + (toeDir > 0 ? 1 : 0);
    const len = Math.max(1, frontX - backX);
    // 0 at the heel, 1 at the toe, whichever way the foot points.
    const along = (x: number) => (toeDir > 0 ? (x - backX) / len : (frontX - x) / len);

    const upperM = makeMask(SPRITE_W, SPRITE_H);
    const soleM = makeMask(SPRITE_W, SPRITE_H);
    const soleTopY = soleY - soleH + 1;

    for (let x = backX; x <= frontX; x += 1) {
      if (x < 0 || x >= SPRITE_W) continue;
      const u = along(x);
      // The sole overhangs the upper at both ends; the upper stops short of it.
      const top = soleTopY - Math.round(upperH * profile(u));
      for (let y = top; y < soleTopY; y += 1) upperM[y * SPRITE_W + x] = 1;
    }
    for (let x = soleBack; x <= soleFront; x += 1) {
      if (x < 0 || x >= SPRITE_W) continue;
      for (let y = soleTopY; y <= soleY; y += 1) soleM[y * SPRITE_W + x] = 1;
    }

    // A boot carries a shaft up the calf, and the upper is just its foot.
    if (shaftTop !== null) {
      for (let y = shaftTop; y < soleTopY; y += 1) {
        const tt = (y - shaftTop) / Math.max(1, soleTopY - shaftTop);
        const half = heel + Math.round(tt * 1.5);
        for (let x = cx - half; x <= cx + half; x += 1) {
          if (x >= 0 && x < SPRITE_W) upperM[y * SPRITE_W + x] = 1;
        }
      }
    }

    const put = (m: Mask, r: Ramp, mt: number) => {
      for (let y = 0; y < SPRITE_H; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.set(x, y, r.steps[3], mt, 3);
        }
      }
    };
    // A sandal is a sole with straps: the foot itself stays skin.
    put(upperM, sandal ? ramps.skin : ramp, sandal ? MAT.SKIN : mat);
    if (!bare) put(soleM, soleRamp, clog ? MAT.WOOD : MAT.LEATHER);
    else put(soleM, ramps.skin, MAT.SKIN);

    const depth = (near ? DEPTH.legNear : DEPTH.legFar) + 0.06;
    // The upper is a dome lying along the ground — long axis down the foot,
    // crown over the instep, rolling away at the toe.
    ellipsoidSurface(
      form, upperM,
      cx + toeDir * Math.round(toe * 0.30), soleTopY - Math.round(upperH * 0.55),
      Math.max(3, Math.round((heel + toe) * 0.72)), Math.max(2, Math.round(upperH * 0.95)),
      depth, 0.62,
    );

    // Modelling goes through the form buffer, never through raster.set.
    //
    // An earlier pass tried to state the shoe's bands outright — lit crown,
    // body, turned side — and none of it survived: `resolveLight` recomputes
    // every pixel that carries a normal, so painted values are discarded. The
    // giveaway was the sole coming out *brighter* than the upper. Detail here
    // is expressed as bias, and bias only.
    // The sole is a band seen edge-on — it faces the *viewer*, and slightly
    // down. Given an upward normal it caught the key light and came out the
    // brightest thing on the figure, which is precisely backwards for the one
    // surface the sky never reaches.
    planeSurface(form, soleM, 0, 0.35, depth + 0.01);
    for (let y = soleTopY; y <= soleY; y += 1) {
      for (let x = soleBack; x <= soleFront; x += 1) {
        if (x < 0 || x >= SPRITE_W || !soleM[y * SPRITE_W + x]) continue;
        // The welt catches a little light along its top edge; everything below
        // it is the one plane the sky never reaches.
        // The welt keeps a hint of light along its top edge; the rest is the
        // darkest band on the shoe.
        raster.set(x, y, soleRamp.steps[3], clog ? MAT.WOOD : MAT.LEATHER, 3);
        form.addBias(x, y, y === soleTopY ? 1 : 3);
      }
    }

    // --- Per-construction detail. This is what tells them apart at a glance.
    if (kind === 'wrap') {
      // Cloth bindings: bands crossing the foot at an angle, all the way up.
      for (let i = 0; i < 4; i += 1) {
        const u = 0.18 + i * 0.19;
        const x = toeDir > 0 ? backX + Math.round(u * len) : frontX - Math.round(u * len);
        for (let j = 0; j < 2; j += 1) {
          const y = soleTopY - 1 - Math.round(upperH * (0.25 + i * 0.16)) + j;
          if (x >= 0 && x < SPRITE_W && upperM[y * SPRITE_W + x]) {
            form.addBias(x, y, j === 0 ? -1 : 2);
            if (upperM[y * SPRITE_W + x + toeDir]) form.addBias(x + toeDir, y, j === 0 ? 0 : 1);
          }
        }
      }
    } else if (kind === 'straw') {
      // Woven fibre: a coarse basketweave, plus a rope tie over the instep.
      for (let y = soleTopY - upperH; y < soleTopY; y += 1) {
        for (let x = backX; x <= frontX; x += 1) {
          if (x < 0 || x >= SPRITE_W || !upperM[y * SPRITE_W + x]) continue;
          if (((x + y * 2) % 3) === 0) form.addBias(x, y, 1);
          else if (((x * 2 + y) % 5) === 0) form.addBias(x, y, -1);
        }
      }
      const tieX = cx + toeDir * Math.round(toe * 0.2);
      for (let y = soleTopY - upperH; y < soleTopY; y += 1) form.addBias(tieX, y, 2);
    } else if (clog) {
      // A wooden sole with a plain leather band over it — the band is the
      // only soft thing on the shoe and it should read as a separate piece.
      const bandY = soleTopY - Math.max(1, Math.round(upperH * 0.55));
      for (let x = backX; x <= frontX; x += 1) {
        if (x < 0 || x >= SPRITE_W) continue;
        if (upperM[bandY * SPRITE_W + x]) form.addBias(x, bandY, 2);
        if (upperM[(bandY + 1) * SPRITE_W + x]) form.addBias(x, bandY + 1, -1);
      }
      // The sole's grain runs along its length.
      for (let x = soleBack; x <= soleFront; x += 2) {
        if (x >= 0 && x < SPRITE_W && soleM[(soleTopY + 1) * SPRITE_W + x]) {
          form.addBias(x, soleTopY + 1, 1);
        }
      }
    }

    if (!bare && !sandal && kind !== 'wrap') {
      // The vamp: a raking seam from just behind the toe back up to the ankle
      // opening. Two or three pixels, and the shoe acquires a front.
      const dark = (x: number, y: number, by = 2) => {
        if (x < 0 || x >= SPRITE_W || !upperM[y * SPRITE_W + x]) return;
        form.addBias(x, y, by);
      };
      const lite = (x: number, y: number) => {
        if (x < 0 || x >= SPRITE_W || !upperM[y * SPRITE_W + x]) return;
        form.addBias(x, y, -2);
      };
      if (near) {
        // Facing the viewer, the toe cap's seam runs *across* the foot as a
        // near-horizontal line, and the whole cap sits below it.
        const seamY = soleTopY - Math.max(1, Math.round(upperH * 0.42));
        const capStart = toeDir > 0 ? backX + Math.round(len * 0.46) : backX;
        const capEnd = toeDir > 0 ? frontX : frontX - Math.round(len * 0.46);
        for (let x = capStart; x <= capEnd; x += 1) {
          const drop = Math.abs(x - (toeDir > 0 ? capEnd : capStart)) > len * 0.4 ? 1 : 0;
          dark(x, seamY + drop, 3);
        }
        // The instep is the lit plane running back from the seam to the ankle.
        for (let x = capStart - toeDir * 3; x !== capStart; x += toeDir) {
          lite(x, soleTopY - Math.max(1, Math.round(upperH * 0.72)));
        }
        // And the cap's own crown, nearest the viewer, takes the key light.
        const capMid = Math.round((capStart + capEnd) / 2);
        lite(capMid, seamY + 2);
        lite(capMid + toeDir, seamY + 2);
      } else {
        // In profile the vamp rakes back from the toe box to the ankle.
        for (let i = 0; i < Math.max(2, Math.round(upperH * 0.7)); i += 1) {
          const u = 0.54 + i * 0.045;
          const x = toeDir > 0 ? backX + Math.round(u * len) : frontX - Math.round(u * len);
          dark(x, soleTopY - 1 - i);
        }
        const capX = cx + toeDir * Math.round(toe * 0.66);
        lite(capX, soleTopY - Math.max(1, Math.round(upperH * 0.5)));
        lite(capX - toeDir, soleTopY - Math.max(1, Math.round(upperH * 0.58)));
      }
    }

    if (sandal) {
      // Straps: two bands across the instep, dark against the skin.
      for (const u of [0.42, 0.62]) {
        const x = toeDir > 0 ? backX + Math.round(u * len) : frontX - Math.round(u * len);
        for (let y = soleTopY - upperH; y < soleTopY; y += 1) form.addBias(x, y, 2);
      }
    }

    if (boot) {
      // The cuff turns over at the top of the shaft.
      const cy = shaftTop ?? soleTopY;
      for (let x = cx - heel - 2; x <= cx + heel + 2; x += 1) {
        form.addBias(x, cy, -1);
        form.addBias(x, cy + 1, 2);
      }
      // Lacing up the front of the shaft: paired ticks, which at this size is
      // the whole difference between a boot and a tall sock.
      for (let y = cy + 3; y < soleTopY - 1; y += 3) {
        form.addBias(cx - 1, y, 2);
        form.addBias(cx + 1, y, 2);
        form.addBias(cx, y + 1, 1);
      }
    } else if (kind === 'shoe') {
      // A heel block under the back of the sole — a raised heel is the mark
      // of a made shoe as against a slipper or a sandal.
      const hx0 = toeDir > 0 ? soleBack : soleFront - 2;
      for (let x = hx0; x < hx0 + 3; x += 1) {
        for (let y = soleTopY; y <= soleY; y += 1) {
          if (x >= 0 && x < SPRITE_W && soleM[y * SPRITE_W + x]) form.addBias(x, y, 1);
        }
      }
    }
    if (!boot) {
      // Where the leg enters the shoe: the collar's shadow, which is what
      // seats the ankle inside rather than on top of it.
      const collarY = soleTopY - upperH;
      for (let x = cx - heel; x <= cx + heel; x += 1) form.addBias(x, collarY, 2);
    }

    if (bare) {
      // Toes: a scalloped front edge on the near foot only — on the far one
      // they are below the threshold of legibility and read as damage.
      if (near) {
        for (let i = 0; i < 3; i += 1) {
          const x = cx + toeDir * (heel + toe - 1 - i * 2);
          form.addBias(x, soleY - 1, 2);
        }
      }
      // The arch lifts off the ground between heel and ball.
      const archX = cx - toeDir * Math.round(heel * 0.2);
      form.addBias(archX, soleY, 2);
    }
  }
}

// ---------------------------------------------------------------------------
// Held items.
// ---------------------------------------------------------------------------

function drawHeldItem(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, extras: SpriteExtras,
  s: Skeleton, hand: [number, number]
): void {
  if (!extras.held) return;
  const [hx, hy] = hand;
  const wood = ramps.book[MAT.WOOD] ?? ramps.leather;
  const m = makeMask(SPRITE_W, SPRITE_H);
  const put = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    // A staff is held at the side and passes *behind* the head, not across
    // it. Held items draw last and at the greatest depth, so without this a
    // pole ran straight down the middle of the face.
    const under = raster.matAt(x, y);
    if (under === MAT.SKIN || under === MAT.HAIR || under === MAT.BEARD
      || under === MAT.HEADWEAR || under === MAT.HEADWEAR_ACCENT
      || under === MAT.SCLERA || under === MAT.IRIS || under === MAT.BROW || under === MAT.LIP) {
      if (y < s.shoulderY + 2) return;
    }
    m[y * SPRITE_W + x] = 1;
  };

  switch (extras.held.kind) {
    case 'staff':
    case 'pole': {
      const top = Math.max(2, s.crownY - 8);
      const bottom = s.floorY;
      for (let y = top; y <= bottom; y += 1) {
        put(hx, y);
        put(hx + 1, y);
      }
      for (let y = 0; y < SPRITE_H; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.set(x, y, wood.steps[3], MAT.WOOD, 3);
        }
      }
      cylinderSurface(form, m, hx, 1.2, DEPTH.held);
      if (extras.held.kind === 'pole') {
        for (let i = 0; i < 4; i += 1) {
          raster.set(hx, top - 3 + i, ramps.metal.steps[2], MAT.METAL, 2);
          raster.set(hx + 1, top - 3 + i, ramps.metal.steps[3], MAT.METAL, 3);
        }
      }
      break;
    }
    case 'blade': {
      for (let y = hy - 2; y <= hy + 12; y += 1) { put(hx, y); put(hx + 1, y); }
      for (let y = 0; y < SPRITE_H; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.set(x, y, ramps.metal.steps[2], MAT.METAL, 2);
        }
      }
      cylinderSurface(form, m, hx, 1.2, DEPTH.held);
      for (let dx = -2; dx <= 3; dx += 1) raster.set(hx + dx, hy - 2, ramps.metal.steps[4], MAT.METAL, 4);
      break;
    }
    case 'book': {
      for (let y = hy - 2; y <= hy + 3; y += 1) for (let x = hx - 3; x <= hx + 2; x += 1) put(x, y);
      for (let y = 0; y < SPRITE_H; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.set(x, y, ramps.leather.steps[3], MAT.LEATHER, 3);
        }
      }
      planeSurface(form, m, -0.25, -0.3, DEPTH.held);
      for (let y = hy - 2; y <= hy + 3; y += 1) form.addBias(hx + 2, y, 2);
      break;
    }
    case 'bag': {
      for (let y = hy; y <= hy + 6; y += 1) {
        const half = 3 - Math.abs(y - (hy + 3)) * 0.3;
        for (let x = hx - half; x <= hx + half; x += 1) put(Math.round(x), y);
      }
      for (let y = 0; y < SPRITE_H; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.set(x, y, ramps.clothC.steps[3], MAT.CLOTH_C, 3);
        }
      }
      ellipsoidSurface(form, m, hx, hy + 3, 3, 3, DEPTH.held, 0.9);
      break;
    }
    default: {
      for (let y = hy - 1; y <= hy + 7; y += 1) { put(hx, y); put(hx + 1, y); }
      for (let y = 0; y < SPRITE_H; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.set(x, y, wood.steps[3], MAT.WOOD, 3);
        }
      }
      cylinderSurface(form, m, hx, 1.2, DEPTH.held);
      for (let dx = -1; dx <= 2; dx += 1) raster.set(hx + dx, hy - 1, ramps.metal.steps[3], MAT.METAL, 3);
    }
  }
}

// ---------------------------------------------------------------------------
// Assembly.
// ---------------------------------------------------------------------------

/**
 * The spine fold. Unlike the old raster shear this runs *before* anything is
 * drawn: it moves the skeleton's own landmarks, so limbs and head are built
 * in their folded positions and the silhouette stays a body.
 */
function foldSpine(s: Skeleton, posture: Posture): Skeleton {
  if (posture.spineBend === 0 && posture.lean === 0 && posture.bob === 0) return s;
  // Every authored angle rides `motionScale`, so the whole animation set can be
  // damped or exaggerated from one slider without re-authoring a frame.
  const a = posture.spineBend * s.t.motionScale * RAD;
  const spineLen = s.waistY - s.crownY;
  // Rotate everything above the waist about the waist.
  const carry = Math.round(Math.sin(a) * spineLen * 0.42);
  const settle = Math.round((1 - Math.cos(a)) * spineLen * 0.5);
  // The head does not simply ride the spine: a person bowing keeps their gaze
  // up a little, so the neck counter-rotates. Without it a bow looks like the
  // figure has been folded in half by something rather than performed by them,
  // which is most of why the deep bow reads as wrong.
  const counter = Math.round(carry * s.t.headCounter);
  const headCarry = carry - counter + Math.round(posture.headNod * s.t.motionScale);
  return {
    ...s,
    headCx: s.headCx + headCarry + posture.lean,
    faceCx: s.faceCx + headCarry + posture.lean,
    cx: s.cx + Math.round(posture.lean * 0.3),
    crownY: s.crownY + settle + posture.bob,
    eyeY: s.eyeY + settle + posture.bob,
    chinY: s.chinY + settle + posture.bob,
    neckTopY: s.neckTopY + settle + posture.bob,
    shoulderY: s.shoulderY + Math.round(settle * 0.7) + posture.bob,
    chestY: s.chestY + Math.round(settle * 0.5) + posture.bob,
    stoopTopSkew: s.stoopTopSkew + Math.round(carry * 0.8),
  };
}

function compilePose(source: SpriteSource, ramps: PortraitRamps, fp: FramePose): Raster {
  const { spec, extras } = source;
  const base = buildSkeleton(spec, getTuning());
  const s = foldSpine(base, fp.posture);
  const t = s.t;
  const plan = planGarment(spec, s, fp.wind, extras.worn?.name ?? extras.armWear?.name ?? '');
  const raster = new Raster(SPRITE_W, SPRITE_H);
  const form = new FormBuffer();
  const rig = buildRig(t);
  const L = headLayout(spec, s);

  // The ground first: it lives behind everything and never touches the figure.
  groundShadow(raster, s.cx, base.floorY + 2, s.hipHalf + t.strideX, t.groundShadow);

  // Hair behind the skull.
  const hair = buildHair(spec, L);
  // A veil covers the hair — and this has to happen *before* either layer is
  // painted. Clipping after `paintHair` only ever removed the front layer; the
  // back one was already on the raster, which left a tuft of hair standing
  // above the cloth that read as a spike on top of the head. The range starts
  // well above the crown because hair carries volume over the skull.
  if (spec.headwear && (spec.headwear.kind === 'veil' || spec.headwear.kind === 'hood')) {
    // Clip only the skull and the face opening — not everything down to the
    // chest.
    //
    // A veil hides the hair it covers and leaves what falls below it. Wiping a
    // whole rectangular band removed the second part too, so long-haired
    // veiled women showed no hair at all in the sprite while the bust showed
    // it framing the face. The band below the jaw is left alone; the headwear
    // paints over anything it genuinely covers, since it is drawn later and
    // at greater depth.
    const lo = L.crownY - Math.round(L.H * 0.6);
    const hi = L.chinY;
    const rx = L.rx + Math.round(L.H * 0.22);
    for (let y = lo; y <= hi; y += 1) {
      if (y < 0 || y >= SPRITE_H) continue;
      for (let x = L.hx - rx; x <= L.hx + rx; x += 1) {
        if (x < 0 || x >= SPRITE_W) continue;
        const i = y * SPRITE_W + x;
        hair.back[i] = 0;
        hair.front[i] = 0;
      }
    }
  }

  paintHair(raster, form, ramps, hair.back, L, DEPTH.hairBack, spec.seed);

  // Arms: chains first, so draw order can depend on where they ended up.
  // Hands clasped at the waist: the forearms fold across the body, so the
  // elbow flexes hard and the whole arm comes a little toward the viewer.
  // The character's own way of standing, from their personality vector. Only
  // applied when the frame is a *resting* one — a bow or a reach has already
  // said what the arms are doing and must not be overridden by temperament.
  const STANCES: Record<Exclude<RestStance, 'hang'>, { near: ArmPose; far: ArmPose }> = {
    // Guarded: forearms across the chest, the near one laid over the far.
    fold: {
      near: { swing: 16, elbow: 112, forward: 0.42, hand: 'clasp' },
      far: { swing: 14, elbow: 104, forward: 0.30, hand: 'hidden' },
    },
    // Composed: hands together at the waist.
    clasp: {
      near: { swing: 11, elbow: 96, forward: 0.35, hand: 'clasp' },
      far: { swing: 11, elbow: 96, forward: 0.35, hand: 'clasp' },
    },
    // Formal: both hands behind the back, so neither reads in front.
    behind: {
      near: { swing: -6, elbow: 84, forward: -0.35, hand: 'hidden' },
      far: { swing: -5, elbow: 80, forward: -0.35, hand: 'hidden' },
    },
    // Confident: one hand on the hip, the other hanging.
    hip: {
      near: { swing: 26, elbow: 88, forward: 0.15, hand: 'grip' },
      far: rest(),
    },
  };
  const resting = (a: ArmPose) => a.swing < 20 && a.forward < 0.3;
  const idle = resting(fp.posture.arms.near) && resting(fp.posture.arms.far);
  // The garment can still insist: a clasped-rest robe overrides a hanging one.
  const stance: RestStance = !idle ? 'hang'
    : extras.stance !== 'hang' ? extras.stance
    : plan.clasped ? 'clasp' : 'hang';
  const chosen = stance === 'hang' ? null : STANCES[stance];
  const nearArm = chosen ? chosen.near : fp.posture.arms.near;
  const farArm = chosen ? chosen.far : fp.posture.arms.far;
  // Which arm is which is the skeleton's call, not a literal — the figure's
  // orientation lives in one place and everything else asks it.
  const nearSide = s.nearSide;
  const farSide = -nearSide as -1 | 1;
  const nearChain = armChain(s, nearSide, nearArm, fp.posture.spineBend);
  const farChain = armChain(s, farSide, farArm, fp.posture.spineBend);

  // A resting far arm lives behind the torso; an acting one crosses in front
  // of it — so the draw order follows the pose, and a reaching arm shows its
  // whole length instead of a forearm sprouting from the coat.
  const farActs = !resting(farArm);
  if (!farActs) drawArm(raster, form, spec, ramps, s, plan, farSide, farArm, farChain, DEPTH.farArm, extras);

  drawLegs(raster, form, ramps, s, extras, plan);
  drawFeet(raster, form, ramps, s, extras);
  // The body under the clothes.
  //
  // Only drawn where a construction actually leaves skin — a bare chest above
  // a dhoti, a midriff between a choli and its skirt. Without it the gap the
  // garment mask leaves is a *hole* rather than a person: the first attempt at
  // a cropped blouse cut a window straight through the figure to the
  // background, because the torso mask and the garment were the same mask.
  if (plan.shape.bareChest || plan.shape.bareMidriff) {
    drawBareTorso(raster, form, ramps, s, plan);
  }
  const bodyM = drawTorso(raster, form, spec, ramps, s, plan);
  drawOverLayer(raster, form, spec, ramps, s, plan, bodyM);
  drawWorn(raster, form, ramps, s, plan, extras);

  if (farActs) drawArm(raster, form, spec, ramps, s, plan, farSide, farArm, farChain, DEPTH.nearArm, extras);
  drawArm(raster, form, spec, ramps, s, plan, nearSide, nearArm, nearChain, DEPTH.nearArm, extras);

  // Neck, then head, then the face on it.
  const neckM = makeMask(SPRITE_W, SPRITE_H);
  const neckHalf = Math.floor(t.neckW / 2);
  for (let y = s.neckTopY; y <= s.shoulderY + 1; y += 1) {
    for (let x = s.headCx - neckHalf; x <= s.headCx + neckHalf; x += 1) {
      if (x < 0 || x >= SPRITE_W) continue;
      neckM[y * SPRITE_W + x] = 1;
      raster.set(x, y, ramps.skin.steps[3], MAT.SKIN, 3);
    }
  }
  cylinderSurface(form, neckM, s.headCx, neckHalf + 1, DEPTH.neck);
  // The jaw's cast. A neck lit as brightly as the face above it is the single
  // cheapest way to make a head look pasted on, and it was one of the loudest
  // flatness cues left in the figure — the reference puts the whole throat in
  // shadow, deepest right under the chin and easing off toward the collar.
  for (let y = s.neckTopY; y <= s.shoulderY + 1; y += 1) {
    const k = (y - s.neckTopY) / Math.max(1, s.shoulderY + 1 - s.neckTopY);
    const cast = k < 0.35 ? 3 : k < 0.7 ? 2 : 1;
    for (let x = s.headCx - neckHalf; x <= s.headCx + neckHalf; x += 1) {
      form.addBias(x, y, cast);
    }
  }

  const headM = headMask(spec, L);
  fillMask(raster, headM, ramps.skin, MAT.SKIN, () => 3);
  headSurface(form, headM, L, DEPTH.head, spec);
  // The face's calibration against the bust lives in `MATERIAL_BIAS`, applied
  // to all skin at once — biasing only the head left the hands and neck a
  // different colour from it.
  drawFace(raster, form, spec, ramps, L, headM, {
    frame: fp.face,
    gaze: fp.gazeX,
    expression: restingExpression(spec.mood, spec.condition),
  });

  paintHair(raster, form, ramps, hair.front, L, DEPTH.hairFront, spec.seed);
  const hatM = drawHeadwear(raster, form, spec, ramps, L);
  if (hatM) {
    // A hat casts into the face it frames — one quiet step where cloth meets
    // skin, which is what seats it on the head instead of over it.
    for (let y = L.crownY; y <= L.chinY; y += 1) {
      for (let x = L.hx - L.rx; x <= L.hx + L.rx; x += 1) {
        if (raster.matAt(x, y) !== MAT.SKIN) continue;
        if (hatM[(y - 1) * SPRITE_W + x] || hatM[(y - 2) * SPRITE_W + x]) form.addBias(x, y, 1);
      }
    }
  }

  drawJewelry(raster, form, spec, s, L);

  drawHeldItem(raster, form, ramps, extras, s, farActs ? farChain.hand : nearChain.hand);

  // --- One lamp, applied to everything at once. ---
  //
  // From here on the raster's shade plane is indexed against the *dense* book
  // (13 steps), so every pass after `resolveLight` has to be handed the same
  // book — handing one of them the coarse ramp would index a 13-value shade
  // into a 7-value array and read off the end.
  // Contrast widening lives in `denseRamp`'s own table, not here.
  //
  // Passing an inline object *replaced* that table rather than adding to it,
  // so every entry added there was silently ignored — cloth was widened in one
  // file and the widening discarded in another, and the measured tonal range
  // did not move. One source of truth, and the call site takes the default.
  const dense = densifyBook(ramps.book, t.clothContrast);
  resolveLight(raster, form, dense, rig, t.contactShade / 3);
  applyRim(raster, form, dense, rig);
  if (t.outline >= 2) inkInterior(raster, form, dense);
  if (t.outline >= 1) inkSilhouette(raster, form, dense, rig, t.inkWeight);
  groundBounce(raster, dense, base.floorY);
  void bodyM;
  return raster;
}

export interface CompiledSprite {
  /** Lazily compiles and caches the requested frame. */
  frame(id: FrameId): Raster;
  seed: number;
  /**
   * The first row this figure can occupy. Everything above is guaranteed
   * empty, so a canvas may start here and be that much shorter — which is what
   * lets the encounter show the figures large without the element growing.
   */
  contentTop: number;
}

function rotateFallen(stand: Raster): Raster {
  const out = new Raster(SPRITE_H, SPRITE_W);
  for (let y = 0; y < stand.height; y += 1) {
    for (let x = 0; x < stand.width; x += 1) {
      const si = y * stand.width + x;
      if (stand.data[si * 4 + 3] === 0) continue;
      const tx = stand.height - 1 - y;
      const ty = x;
      const ti = ty * out.width + tx;
      out.data[ti * 4] = stand.data[si * 4];
      out.data[ti * 4 + 1] = stand.data[si * 4 + 1];
      out.data[ti * 4 + 2] = stand.data[si * 4 + 2];
      out.data[ti * 4 + 3] = stand.data[si * 4 + 3];
      out.mat[ti] = stand.mat[si];
      out.shade[ti] = stand.shade[si];
    }
  }
  return out;
}

export function compileSprite(source: SpriteSource): CompiledSprite {
  const ramps = buildPortraitRamps(source.spec);
  const cache = new Map<FrameId, Raster>();
  const frame = (id: FrameId): Raster => {
    const hit = cache.get(id);
    if (hit) return hit;
    const raster = id === 'fallen'
      ? rotateFallen(frame('stand'))
      : compilePose(source, ramps, FRAME_POSES[id]);
    cache.set(id, raster);
    return raster;
  };
  const base = buildSkeleton(source.spec, getTuning());
  return {
    frame,
    seed: source.spec.seed,
    contentTop: Math.max(0, base.crownY - SPRITE_HEADROOM),
  };
}

// Kept for the tuner panel, which lists poses by name.
export const ALL_FRAMES: FrameId[] = [...Object.keys(FRAME_POSES) as FrameId[], 'fallen'];
