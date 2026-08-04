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
import {
  ArmWear, FootwearKind, HeldMaterial, RestStance, SpriteExtras, SpriteSource,
} from './spriteSource';
import {
  ArmPose, buildSkeleton, getTuning, HandShape, LegPose, Posture, Skeleton,
  SPRITE_H, SPRITE_HEADROOM, SPRITE_W, SpriteTuning,
} from './skeleton';
import {
  applyRim, buildRig, cylinderSurface, ellipsoidSurface, FormBuffer,
  groundBounce, groundShadow, inkInterior, inkSilhouette, limbSurface,
  planeSurface, resolveLight, weaveBias,
} from './spriteLight';
import {
  applyHairOchre, buildHair, drawFace, drawHeadwear, drawLimbMarkings, FaceFrame,
  headLayout, HeadLayout, headMask, headSurface, paintHair,
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
  | 'bowLight' | 'bowDeep' | 'reach' | 'raise' | 'offer' | 'fallen'
  // Weight-bearing frames. Every one of these exists because an animation was
  // translating the whole raster across the ground with both soles nailed to
  // it, which is skating, not walking.
  | 'stepFwd' | 'stepBack' | 'lunge' | 'recoil' | 'crouch' | 'shrug';

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
const planted: LegPose = { step: 0, lift: 0 };

interface PoseOverride {
  spineBend?: number;
  lean?: number;
  headNod?: number;
  bob?: number;
  drop?: number;
  shoulderLift?: number;
  arms?: Partial<Record<'near' | 'far', ArmPose>>;
  legs?: Partial<Record<'near' | 'far', LegPose>>;
}

function pose(over: PoseOverride = {}): Posture {
  return {
    spineBend: over.spineBend ?? 0,
    lean: over.lean ?? 0,
    headNod: over.headNod ?? 0,
    bob: over.bob ?? 0,
    drop: over.drop ?? 0,
    shoulderLift: over.shoulderLift ?? 0,
    arms: { near: over.arms?.near ?? rest(), far: over.arms?.far ?? rest() },
    legs: { near: over.legs?.near ?? planted, far: over.legs?.far ?? planted },
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

  // --- Weight-bearing frames. ---------------------------------------------
  //
  // A step is a foot placement and a hip drop; the knees are solved. The arms
  // counter-swing, because they do — a figure whose arms hang plumb while its
  // legs stride reads as being pushed on a trolley.
  // Step values are in ground distance, not screen pixels — `legChain`
  // projects them, so these read larger than the travel they produce.
  //
  // The **far** leg leads every forward move and the near leg every retreat,
  // for the reason given in `legChain`: each is the one with open ground on
  // the side it is travelling toward. Authored the other way round the two
  // feet converge on one column at a middling step and `planLegs` has to prise
  // them apart, which caps the stride and wastes the pose.
  stepFwd: {
    face: 'open', gazeX: 0, wind: 0.3,
    posture: pose({
      drop: 2,
      legs: { near: { step: -5, lift: 2 }, far: { step: 14, lift: 0 } },
      arms: { near: { swing: -6, elbow: 12, forward: 0.1, hand: 'rest' }, far: { swing: 17, elbow: 16, forward: 0.15, hand: 'rest' } },
    }),
  },
  stepBack: {
    face: 'open', gazeX: 0, wind: 0.6,
    posture: pose({
      drop: 3, spineBend: -3,
      legs: { near: { step: -17, lift: 0 }, far: { step: -2, lift: 0 } },
      arms: { near: { swing: 15, elbow: 20, forward: 0.15, hand: 'rest' }, far: { swing: 4, elbow: 14, forward: 0.1, hand: 'rest' } },
    }),
  },
  // The full extension: back leg straight and driving, front knee deep over
  // the toe, the whole trunk carried forward after the leading arm.
  lunge: {
    face: 'talk', gazeX: 1, wind: 0.5,
    posture: pose({
      drop: 7, spineBend: 12,
      legs: { near: { step: -13, lift: 2 }, far: { step: 24, lift: 0 } },
      arms: {
        near: { swing: 62, elbow: 12, forward: 0.7, hand: 'fist' },
        far: { swing: -18, elbow: 34, forward: 0.1, hand: 'rest' },
      },
    }),
  },
  // Struck: the weight goes back onto the heels, the chest opens, the arms
  // come up short. Not a shake — a shake is the canvas's job.
  recoil: {
    face: 'blink', gazeX: 0, wind: 0.5,
    posture: pose({
      drop: 2, spineBend: -9, headNod: -2, shoulderLift: 2,
      legs: { near: { step: -14, lift: 0 }, far: { step: -6, lift: 0 } },
      arms: {
        near: { swing: 24, elbow: 54, forward: 0.4, hand: 'open' },
        far: { swing: 20, elbow: 46, forward: 0.35, hand: 'open' },
      },
    }),
  },
  // The gather before a jump, and the landing after it.
  crouch: {
    face: 'open', gazeX: 0, wind: 0.2,
    posture: pose({
      drop: 11, spineBend: 9,
      arms: {
        near: { swing: -14, elbow: 26, forward: 0.1, hand: 'fist' },
        far: { swing: -12, elbow: 24, forward: 0.1, hand: 'fist' },
      },
    }),
  },
  // A shrug is shoulders, not a hop: they rise toward the ears, the neck
  // shortens, and the hands turn out.
  shrug: {
    face: 'talk', gazeX: 0, wind: 0,
    posture: pose({
      shoulderLift: 4, headNod: 1,
      arms: {
        near: { swing: 22, elbow: 58, forward: 0.5, hand: 'present' },
        far: { swing: 20, elbow: 54, forward: 0.45, hand: 'present' },
      },
    }),
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
function planGarment(
  spec: PortraitSpec, s: Skeleton, wind: number, extrasName: string
): GarmentPlan {
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
    : s.hipY + Math.round(legSpan * hemFraction(con, spec, t, shape.legs));

  // Where the *upper* covering ends. For most garments that is the hem; a
  // cropped blouse stops under the ribs, and a wrapped lower garment has no
  // upper covering at all.
  const topHemY = con === 'crop_top'
    ? s.waistY - Math.round((s.waistY - s.chestY) * 0.35)
    : con === 'wrapped_lower' ? s.hipY - Math.round((s.hipY - s.waistY) * 0.4)
    : hemY;

  // How far down the arm the sleeve reaches, 0 shoulder … 1 wrist.
  // A wrapped cloth has no armscye to hang a sleeve from, so it has none: at
  // most it falls a little way over the shoulder it is knotted at.
  const sleeveT = con === 'bare' || con === 'wrapped_lower' ? 0
    : con === 'wrapped_cloth' ? 0.08
    : con === 'crop_top' ? 0.34
    : /sleeveless|vest|tabard|singlet|tank top|toga|himation|chiton/.test(name) ? 0.12
    // Modern casual shirts are cut short in the sleeve, and at this size that
    // is most of what separates a polo from a dress shirt in silhouette.
    : /short.sleeve|t-?shirt|\btee\b|shift|polo|aloha|guayabera|bush shirt/.test(name) ? 0.44
    : con === 'robe' || con === 'gown' || con === 'jacket' ? 0.95
    : 0.86;

  const hemHalf = floorLen ? t.robeHemHalf
    : con === 'wrapped_lower' ? s.hipHalf + 2
    // A wrap hangs from the hip rather than being cut to flare from it, so it
    // falls nearly straight — narrower at the hem than a robe of the same
    // length, which is most of what separates the two at a glance.
    : con === 'wrapped_cloth' ? s.hipHalf + 3
    : Math.min(s.shoulderHalf, s.hipHalf + 1);
  // A garment worn over separate legwear takes its belt from the *lower*
  // garment, and that waistband is under the hem. Drawing one at the waist
  // regardless put a leather band across the middle of every t-shirt in the
  // app, and buckled a suit jacket shut over its own trousers.
  const belted = kind !== 'bare' && (/belt|sash|girdle|obi|cinch/.test(name)
    || ((shape.legs === null || shape.construction === 'skirted')
      && (kind === 'tunic' || kind === 'jacket' || kind === 'doublet' || kind === 'work_shirt')));
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

interface LegChain {
  hip: [number, number];
  knee: [number, number];
  ankle: [number, number];
  /** How far this foot is off the ground, px — the foot draws shorter when lifted. */
  lift: number;
}

const RAD = Math.PI / 180;

/**
 * Hip → knee → ankle, solved from where the foot is.
 *
 * Two-bone IK, and the reason for it is in `LegPose`: the constraint that
 * actually matters on a walking figure is that the sole meets the floor. State
 * the foot, solve the knee, and it cannot be violated. State the joint angles
 * instead — which is how the arms work, correctly, for their own reasons — and
 * every stride is a pair of numbers that have to be re-guessed together each
 * time the leg length changes, which on this figure it does per persona.
 */
function legChain(
  s: Skeleton, base: Skeleton, side: -1 | 1, leg: LegPose, nudge = 0
): LegChain {
  const t = s.t;
  const near = side === s.nearSide;
  // The way the figure faces, which is away from the shoulder swung toward the
  // viewer — the same inversion the feet already make.
  const fwd = -s.nearSide;
  const legX = s.cx + t.hipSkew + side * (Math.round(s.legW / 2) + s.legGap);
  const restAnkleY = base.ankleY - (near ? 0 : t.footStagger);
  // Bone lengths come off the *unfolded* skeleton. `foldSpine` lowers the hip
  // for a crouch and leaves the floor alone — read the thigh from the folded
  // one and the bone would shorten by exactly the amount the knee is supposed
  // to be taking up, so the squat would solve to a straight leg and go
  // nowhere.
  const thigh = Math.max(4, base.kneeY - base.hipY);
  const shin = Math.max(4, restAnkleY - base.kneeY);

  const m = t.motionScale;
  const hx = legX;
  const hy = s.hipY;
  const lift = Math.max(0, Math.round(leg.lift * m));
  /**
   * A stride is a distance along the **ground**, and this figure is seen
   * almost square-on — so most of that distance is depth, and only a fraction
   * of it can show as horizontal travel.
   *
   * Two things come out of that:
   *
   *  · **Projection.** Stated at full width the legs simply swap sides: a 24px
   *    lunge on a stance 16px wide put the near foot well past the far one and
   *    the figure scissored itself. The factor rises with `turn`, because a
   *    figure seen more side-on genuinely shows more of its stride.
   *
   *  · **The back foot recedes.** The distance that is *not* horizontal is
   *    depth, and depth on this ground plane is height in the frame — so the
   *    retreating foot rides up, the same cue `footStagger` already uses to
   *    seat the resting far foot behind the near one.
   *
   * Which leg may lead is not a free choice, and getting it wrong is what made
   * the first version of this scissor. The figure faces `fwd`, the far leg is
   * the one standing on that side, and so **the far leg is the only one with
   * room to step forward**: a near leg striding forward walks straight into
   * its partner, and no amount of projection fixes that — it is the stance's
   * own 16px of width being spent. See `planLegs`, which enforces it.
   */
  const project = 0.34 + s.turn * 0.30;
  const recede = Math.round(Math.max(0, -leg.step) * m * 0.20);
  // `nudge` is `planLegs` separating a pair that would have merged.
  const ax = legX + fwd * Math.round(leg.step * m * project) + nudge;
  const ay = restAnkleY - lift - recede;

  let dx = ax - hx;
  let dy = ay - hy;
  let d = Math.hypot(dx, dy) || 1;
  // A leg cannot reach further than it is long, nor fold past its own shin.
  // Clamping the *foot* rather than failing the solve means an over-ambitious
  // pose degrades into the nearest possible one instead of producing NaNs.
  //
  // The reach is the bones' exact sum, with **no safety margin**. A margin
  // here is not conservative, it is a permanent bug: a standing leg's hip and
  // ankle are exactly `thigh + shin` apart, so shortening the reach by even
  // half a percent folds every standing knee a little — which measured as a
  // 4px forward kick on the most-used frame in the game. At d exactly equal to
  // the sum the law of cosines gives h = 0 and the leg comes out plumb, which
  // is the whole point.
  const reach = thigh + shin;
  const fold = Math.abs(thigh - shin) + 2;
  if (d > reach) { const k = reach / d; dx *= k; dy *= k; d = reach; }
  if (d < fold) { const k = fold / d; dx *= k; dy *= k; d = fold; }

  const ux = dx / d;
  const uy = dy / d;
  // Where along the hip→foot line the knee's perpendicular drops, and how far
  // out it stands. Straight leg → h is 0, so a standing figure's knee lands
  // exactly where it did before any of this existed.
  const a = (d * d + thigh * thigh - shin * shin) / (2 * d);
  const h = Math.sqrt(Math.max(0, thigh * thigh - a * a)) * t.kneeLead;
  // The perpendicular, pointed the way the figure faces: a knee bends forward.
  let px = -uy;
  let py = ux;
  if (px * fwd < 0) { px = -px; py = -py; }

  return {
    hip: [Math.round(hx), Math.round(hy)],
    knee: [Math.round(hx + ux * a + px * h), Math.round(hy + uy * a + py * h)],
    ankle: [Math.round(hx + dx), Math.round(hy + dy)],
    lift,
  };
}

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
  /**
   * Which way the elbow folds. This was a fixed minus sign, and it was wrong
   * for every arm raised past horizontal.
   *
   * The elbow always brings the hand *toward the shoulder*. With `swing`
   * measured from straight-down, that means decreasing the angle while the arm
   * hangs below the shoulder — and increasing it once the arm is above, where
   * the hand is already overhead and folding brings it back down. Subtracting
   * unconditionally made the raised fist bend outward and away, which drew the
   * arm as a rainbow with a hand dangling off the end of it: the single most
   * conspicuously broken joint in the animation set.
   *
   * `-cos(a1)` is that sign, smoothly: −1 straight down, 0 at horizontal —
   * where flexion genuinely has no in-plane component and folds toward the
   * camera — and +1 straight up.
   */
  const fold = -Math.cos(a1);
  const a2 = a1 + fold * elbow * RAD * (1 - arm.forward * 0.55);
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

/**
 * Both legs at once, because the constraint that matters is between them.
 *
 * `legChain` can only see one leg, and the fault it cannot see is the pair
 * landing on the same column — which at this near-frontal angle is not a
 * near-miss but the difference between a figure striding and a figure with one
 * thick post under it. So the feet are placed together and a minimum seam is
 * enforced: the near leg stays on the near side of the far one by at least a
 * leg's width, and an over-ambitious pose degrades into the nearest possible
 * one rather than crossing.
 *
 * Legs crossing is a real thing that real walking does. It is left out on
 * purpose: seen this close to square-on it reads as a mistake every time, and
 * the honest way to sell a long stride here is the hip drop and the arm, not
 * horizontal travel the camera angle cannot show.
 */
function planLegs(
  s: Skeleton, base: Skeleton, posture: Posture
): Record<'near' | 'far', LegChain> {
  const nearSide = s.nearSide;
  const farSide = -nearSide as -1 | 1;
  const near = legChain(s, base, nearSide, posture.legs.near);
  const far = legChain(s, base, farSide, posture.legs.far);
  // `nearSide` is which side of the body faces the viewer, and it is also the
  // side the near leg stands on — so the seam runs in that direction.
  const gap = (far.ankle[0] - near.ankle[0]) * -nearSide;
  const want = s.legW;
  if (gap >= want) return { near, far };
  // Push the pair apart about their midpoint and re-solve, so the knees follow
  // the corrected feet instead of pointing at where they were asked to go.
  const push = Math.ceil((want - gap) / 2);
  return {
    near: legChain(s, base, nearSide, posture.legs.near, nearSide * push),
    far: legChain(s, base, farSide, posture.legs.far, -nearSide * push),
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
  // The elbow itself. Two capsules meeting at a point cover the joint but
  // leave a concave notch on the *outside* of a sharp bend, and the eye reads
  // that notch as a break in the limb rather than as a fold. A small disc over
  // the junction fills it, exactly as the deltoid does at the shoulder — and
  // like the deltoid it is sized to the limb, not larger, so a straight arm
  // gains nothing visible from it.
  const elbowM = capsuleMask(ex, ey - 1, ex, ey + 1, w, w);

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
  for (const m of [upperM, foreM, elbowM]) {
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
  // The elbow gets the same treatment: a rounded mass over the junction, at
  // the forearm's depth so it sits in front of the upper arm on a fold.
  ellipsoidSurface(form, elbowM, ex, ey, w / 2, w / 2, depth + 0.03);
  // And a shadow in its crook — the inside of the bend, which is the side the
  // light cannot reach. Which side that is depends on which way it folded, so
  // it is read off the geometry rather than assumed.
  const crookX = Math.sign((sx - ex) + (wx - ex)) || 0;
  const crookY = Math.sign((sy - ey) + (wy - ey)) || 1;
  form.addBias(ex + crookX, ey + crookY, 2);
  form.addBias(ex, ey + crookY, 1);

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

  // A single cloth knotted at one shoulder: its top edge is a diagonal from
  // that shoulder down to the opposite armpit, and the triangle of chest above
  // the diagonal is skin. This is drawn as a *cut* into the trunk rather than
  // as a shape in its own right, so the wrap keeps the body's silhouette
  // everywhere else and differs from a robe only where it should.
  const bareSide = plan.shape.bareShoulder;
  const armpitY = s.chestY + Math.round((s.waistY - s.chestY) * 0.22);
  const knotTop = s.shoulderY - Math.round(t.shoulderSlope * 0.4);

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
      // The diagonal. Above the armpit the cloth's edge slopes from the knotted
      // shoulder across to the bare one; a pixel on the bare side of that line
      // is skin. `u` runs 0 at the knot to 1 at the far edge of the trunk.
      if (bareSide !== 0 && y < armpitY) {
        const span = Math.max(1, hi.x - lo.x);
        const u = bareSide > 0 ? (x - lo.x) / span : (hi.x - x) / span;
        const drop = (y - knotTop) / Math.max(1, armpitY - knotTop);
        // A cloth pulled over one shoulder is not a straight edge — it curves,
        // because the fold gathers at the knot and spreads as it falls.
        if (u > Math.pow(Math.max(0, drop), 0.72)) continue;
      }
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

  // Two garments, and the eye reads the join.
  //
  // A blouse tucked into a skirt is the single most common way clothing is put
  // together and it was rendering as one unbroken column of cloth from
  // shoulder to hem — 11% of everyone wearing what looked like a robe. One
  // half takes the secondary colour, the other keeps the primary, and the
  // waistband between them is what says they are separate things rather than
  // one thing in two tones.
  //
  // A skirted trunk holds both garments, so the recolouring stops at the waist
  // and the band between them is drawn. Which half keeps the garment's own
  // cloth depends on which one the card names: `bodice === 'separate'` is the
  // sari-and-lehenga case, where the *skirt* was named and the blouse above it
  // is the unnamed one; a separately named skirt is the other way round.
  // Getting that backwards is what put a cream chest on a walnut sari while the
  // bust beside it drew walnut to the collar.
  const namedSkirt = plan.shape.legs === 'skirt' || plan.shape.legs === 'wrapped';
  const skirtedTrunk = plan.construction === 'skirted'
    && (spec.garment.bodice === 'separate' || namedSkirt);
  if (!plan.bare && skirtedTrunk) {
    const bandTop = s.waistY - 1;
    const bandBot = s.waistY + 1;
    const secondHalfIsUpper = spec.garment.bodice === 'separate';
    const second = namedSkirt && !secondHalfIsUpper ? ramps.legwear : ramps.clothB;
    const secondMat = namedSkirt && !secondHalfIsUpper ? MAT.LEGWEAR : MAT.CLOTH_B;
    for (let y = s.shoulderY - t.shoulderSlope; y <= plan.hemY; y += 1) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        if (!m[y * SPRITE_W + x]) continue;
        if (y >= bandTop && y <= bandBot) {
          // The waistband itself: a darker band the skirt gathers into.
          raster.set(x, y, ramps.clothC.steps[4], MAT.CLOTH_C, 4);
          form.addBias(x, y, y === bandBot ? 2 : 1);
        } else if ((y < bandTop) === secondHalfIsUpper) {
          raster.set(x, y, second.steps[3], secondMat, 3);
        }
      }
    }
  }

  // A shirt over named trousers: the trunk is *all* the unnamed garment, so it
  // is repainted whole rather than split. Leaving it in the primary painted the
  // shirt in the trousers' colour and the trousers in it too, which is a
  // tracksuit and rarely what the card said.
  if (!plan.bare && plan.shape.lowerNamed && plan.construction === 'shirt') {
    for (let y = 0; y < SPRITE_H; y += 1) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        if (m[y * SPRITE_W + x]) raster.set(x, y, ramps.clothB.steps[3], MAT.CLOTH_B, 3);
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

  // The wrap's diagonal edge, and what it does to the chest above it.
  //
  // Two marks, and between them they are what makes the cut read as a hem
  // rather than as a hole punched in the garment: the topmost row of cloth in
  // each column stands proud, because a cut edge is a *thickness*; and the skin
  // just above it goes into shadow, because the cloth is in front of it.
  if (plan.shape.bareShoulder !== 0) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      let top = -1;
      for (let y = 0; y < SPRITE_H; y += 1) {
        if (m[y * SPRITE_W + x]) { top = y; break; }
      }
      // Only where the edge is the diagonal — at the shoulder the cloth simply
      // starts at the top of the trunk and there is nothing above it to shade.
      if (top < 0 || top <= s.shoulderY - t.shoulderSlope) continue;
      form.addBias(x, top, 2);
      for (let i = 1; i <= 3; i += 1) form.addBias(x, top - i, 4 - i);
    }
  }

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
      // Fold depth is in ramp *steps*, but a step is not a fixed amount of
      // luminance — widening `clothContrast` stretches the ramp, so the same
      // depth becomes a deeper crease. Measured, that put 28% of adjacent
      // pixel pairs across a skirt jumping 44 luminance in one column, against
      // the reference's 8.9 overall; the lighting gradient either side was
      // smooth (3.9), so the terraced look was entirely the creases. Dividing
      // by the stretch keeps a fold the same *visual* weight whatever range
      // the cloth is spanning.
      const weight = Math.max(1, s.t.clothContrast);
      deep.push(Math.max(1, Math.round(((f.depth + (tt > 0.55 ? 1 : 0)) * fade) / weight)));
    }
    if (!xs.length) continue;
    // Sorted, so "the next crease along" is meaningful.
    const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);

    // --- The valleys. Three columns on a falling weight, so a crease rolls
    // into the cloth rather than being ruled onto it.
    for (const i of order) {
      const x = xs[i];
      form.addBias(x, y, deep[i]);
      // Shoulders at 55% and 22% of the valley, so a crease rolls into the
      // cloth over three columns instead of dropping into it in one.
      for (const dx of [-1, 1] as const) {
        for (const [k, frac] of [[1, 0.55], [2, 0.22]] as const) {
          const px = x + dx * k;
          if (px > 0 && px < SPRITE_W && m[y * SPRITE_W + px]) {
            form.addBias(px, y, deep[i] * frac);
          }
        }
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
        // No rounding: the hump is a curve and the buffer can now hold one.
        const lift = hump * room;
        if (lift > 0.05) form.addBias(x, y, -lift);
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
 *
 * **Everything below the barrel is anatomy, and it is not optional.** The
 * previous version drew the cylinder, one collarbone row and a five-pixel
 * sternum tick, which is to say: a bare-chested man was a blank plane of skin
 * with a head on it. A dressed figure gets away with an unmodelled trunk
 * because folds, a hem and a belt are doing the work; strip the cloth off and
 * there is nothing left carrying the form at all, so the figure reads as
 * unfinished exactly where the eye goes first.
 *
 * The marks below are the ones a life-drawing puts down in its first minute,
 * and no more than that — at ~44px across the chest, anything finer than a
 * pectoral is below the threshold where it reads as anatomy rather than as
 * noise. Every one goes through `form.addBias`, never `raster.set`: the lamp
 * recomputes each pixel that carries a normal, so a painted highlight here
 * would simply be discarded (see the note in `drawFeet`).
 */
function drawBareTorso(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, s: Skeleton, plan: GarmentPlan,
  spec: PortraitSpec
): void {
  const t = s.t;
  // A bared shoulder shows the same landmarks a bare chest does — clavicle,
  // deltoid, the near pectoral — just less of them. What the cloth covers is
  // repainted over the top of this, and `form.set` clears the bias underneath
  // it, so drawing the whole chest and then hiding most of it costs nothing.
  const showsChest = plan.shape.bareChest || plan.shape.bareShoulder !== 0;
  const from = showsChest ? s.shoulderY - 1 : s.chestY;
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

  const inside = (x: number, y: number) =>
    x >= 0 && x < SPRITE_W && y >= 0 && y < SPRITE_H && m[y * SPRITE_W + x] === 1;
  const bias = (x: number, y: number, d: number) => { if (inside(x, y)) form.addBias(x, y, d); };

  // The body's midline, which is not the canvas's. Every landmark below hangs
  // off it, so a turned figure's chest turns with it instead of sliding out
  // from under its own shoulders.
  const mid = s.cx + t.torsoSkew + Math.round(s.turn * s.shoulderHalf * 0.10) * -s.nearSide;
  // Which side is lit, so the softer half of each paired mass goes to the
  // shadow side rather than both being stated equally.
  const litSide: -1 | 1 = t.lightDir >= 0 ? 1 : -1;

  /**
   * How the trunk is built, in two numbers off the persona.
   *
   * `soft` is fat over the muscle: it swallows the abdominal blocks and the
   * rib arch, and turns the chest's lower border from a hard line into a
   * curve. `slack` is age: the same landmarks, lower and less certain. A
   * seventy-year-old labourer and a twenty-year-old one have the same
   * anatomy and it does not read the same way, and drawing them identically
   * is the sort of thing that makes a crowd look procedural.
   */
  const soft = Math.max(0, Math.min(1, (s.stature.girth - 0.95) * 2.6));
  const slack = spec.age >= 60 ? 0.8 : spec.age >= 45 ? 0.45 : spec.age <= 22 ? 0.1 : 0.25;
  const female = spec.gender === 'Female';

  if (showsChest) {
    const halfAt = (y: number) => {
      const tt = Math.max(0, Math.min(1, (y - s.shoulderY) / Math.max(1, s.waistY - s.shoulderY)));
      return Math.round((s.shoulderHalf + (s.waistHalf - s.shoulderHalf) * tt) * 0.86);
    };
    const chestTop = s.shoulderY + 2;
    const chestBot = s.chestY + Math.round((s.waistY - s.chestY) * 0.30) + Math.round(slack * 2);
    const chestH = Math.max(4, chestBot - chestTop);
    const halfW = halfAt(s.chestY);

    // --- The clavicles. -----------------------------------------------------
    //
    // A shallow V from the pit of the throat out to each shoulder, sitting a
    // little proud of the chest below. This is the mark that separates the
    // neck from the trunk; without it the head grows straight out of a slab.
    const clavSpan = Math.round(halfW * 0.78);
    for (let dx = -clavSpan; dx <= clavSpan; dx += 1) {
      const u = Math.abs(dx) / Math.max(1, clavSpan);
      // Rises toward the shoulder, dips at the throat.
      const y = chestTop + Math.round((1 - u) * 2);
      bias(mid + dx, y, u > 0.25 ? 2 : 3);
      bias(mid + dx, y + 1, -1);
    }

    // --- The chest masses. --------------------------------------------------
    //
    // Two of them, either side of the sternum. On a man they are pectorals:
    // wide, flat-topped, and defined almost entirely by the hard shadow along
    // their lower border. On a woman they are lower, rounder and set closer
    // in, and the border is a soft crease rather than a line. Same three
    // marks, different proportions — which is the point of doing it with
    // geometry instead of two hand-drawn bitmaps.
    // Each mass has to sit *beside* the sternum, not across it. The half-width
    // was 0.72 of the chest against an offset of 0.46, so the two ellipses
    // overlapped by half their width and met in a lens — the pair read as a
    // Venn diagram drawn on the ribs. Both meet the midline instead and the
    // clip below keeps them there, which is also what the anatomy does: the
    // pectorals insert *on* the breastbone, and a breast has a gap at it.
    const massW = female ? Math.round(halfW * 0.44) : Math.round(halfW * 0.54);
    const massH = female ? Math.round(chestH * 0.62) : Math.round(chestH * 0.52);
    const massY = chestTop + Math.round(chestH * (female ? 0.52 : 0.40)) + Math.round(slack * 2);
    const massX = female ? Math.round(halfW * 0.50) : Math.round(halfW * 0.55);
    for (const side of [-1, 1] as const) {
      const cx0 = mid + side * massX;
      const mass = makeMask(SPRITE_W, SPRITE_H);
      for (let y = massY - massH; y <= massY + massH; y += 1) {
        for (let x = cx0 - massW; x <= cx0 + massW; x += 1) {
          if (!inside(x, y)) continue;
          // Nothing crosses the midline. Without this the second mass's
          // `ellipsoidSurface` overwrote the first's normals wherever they met,
          // so the overlap lit as a third dome standing between them.
          if (side * (x - mid) < 0) continue;
          const u = (x - cx0) / Math.max(1, massW);
          const v = (y - massY) / Math.max(1, massH);
          if (u * u + v * v <= 1) mass[y * SPRITE_W + x] = 1;
        }
      }
      // Its own dome, in front of the barrel — so it catches the key light on
      // its crown and turns away at its edges independently of the ribcage.
      ellipsoidSurface(form, mass, cx0, massY - Math.round(massH * 0.2),
        massW, massH, DEPTH.torso - 0.01, female ? 0.7 : 0.5);
      // The lower border. On a man this is the single most legible line on the
      // whole trunk and it should be stated hard; fat softens it, and so does
      // age. The shadow side of the body takes it a step deeper.
      const edge = Math.max(1, Math.round((female ? 2.4 : 3.4) - soft * 1.6));
      const deeper = side === litSide ? 0 : 1;
      for (let dx = -massW; dx <= massW; dx += 1) {
        const u = Math.abs(dx) / Math.max(1, massW);
        if (u > 0.94) continue;
        // Same rule as the mass itself: the border stops at the breastbone.
        // Carried across it, the two arcs met and crossed, which drew the lower
        // half of the lens even after the masses themselves stopped overlapping.
        if (side * (cx0 + dx - mid) < 0) continue;
        const y = massY + Math.round(massH * Math.sqrt(Math.max(0, 1 - u * u)));
        bias(cx0 + dx, y, edge + deeper);
        bias(cx0 + dx, y + 1, Math.max(1, edge - 1));
        // …and a lit lip just above it, which is what makes the mass sit *on*
        // the ribs rather than being a smudge drawn across them.
        bias(cx0 + dx, y - 1, -1);
      }
      // The armpit's hollow, where the mass tucks under the arm.
      bias(cx0 + side * massW, massY - Math.round(massH * 0.5), 2);
      // The nipple: one pixel, on the mass's lower-outer quarter. Below the
      // pectoral line it reads as dirt; on it, it reads as a body.
      if (!female) {
        const nx = cx0 + side * Math.round(massW * 0.28);
        const ny = massY + Math.round(massH * 0.34);
        bias(nx, ny, 3);
        bias(nx, ny - 1, -1);
      }
    }

    // --- The sternum. -------------------------------------------------------
    //
    // The groove between the two masses, from the throat's pit down to where
    // the ribs part. Narrow — two pixels of shadow with a lit ridge is a
    // breastbone; four is a canyon.
    for (let y = chestTop + 2; y <= massY + Math.round(massH * 0.6); y += 1) {
      bias(mid, y, 2);
      bias(mid + 1, y, 1);
    }
  }

  // --- The abdomen. ---------------------------------------------------------
  //
  // Drawn whenever the midriff is on show, which is the choli case as well as
  // the bare-chested one.
  if (plan.shape.bareMidriff || plan.shape.bareChest) {
    const top = plan.shape.bareChest
      ? s.chestY + Math.round((s.waistY - s.chestY) * 0.42)
      : Math.max(from, plan.topHemY);
    const bot = Math.min(to, s.hipY);
    const span = Math.max(3, bot - top);
    const waistHalf = Math.round(s.waistHalf * 0.86);
    // The navel sits above the hip line, not at the waist's narrowest point —
    // a common enough error that it is worth being explicit about.
    const navelY = top + Math.round(span * 0.66);

    // The rib arch: a shallow inverted V where the ribcage ends, which is the
    // landmark that stops the trunk being one tube from armpit to hip. Fat
    // buries it entirely, and on a heavy figure drawing it anyway is worse
    // than leaving it out.
    if (soft < 0.55 && plan.shape.bareChest) {
      const archW = Math.round(waistHalf * 0.66);
      for (let dx = -archW; dx <= archW; dx += 1) {
        const u = Math.abs(dx) / Math.max(1, archW);
        bias(mid + dx, top + Math.round(u * 3), 1 + (u > 0.5 ? 1 : 0));
      }
    }

    // The linea alba, from the ribs to the navel. One pixel, and it does more
    // for a bare trunk than any amount of shading either side of it.
    for (let y = top + 2; y < navelY; y += 1) bias(mid, y, 1);

    if (soft > 0.5) {
      // A soft belly is a *mass*, not a set of blocks: one dome standing
      // proud below the ribs, with the fold under it taking the shadow.
      const belly = makeMask(SPRITE_W, SPRITE_H);
      const bw = Math.round(waistHalf * 0.86);
      const bh = Math.round(span * 0.46);
      const by = navelY - 1;
      for (let y = by - bh; y <= by + bh; y += 1) {
        for (let x = mid - bw; x <= mid + bw; x += 1) {
          if (!inside(x, y)) continue;
          const u = (x - mid) / Math.max(1, bw);
          const v = (y - by) / Math.max(1, bh);
          if (u * u + v * v <= 1) belly[y * SPRITE_W + x] = 1;
        }
      }
      ellipsoidSurface(form, belly, mid, by, bw, bh, DEPTH.torso - 0.01, 0.8);
      for (let dx = -bw + 1; dx <= bw - 1; dx += 1) {
        const u = Math.abs(dx) / Math.max(1, bw);
        bias(mid + dx, by + Math.round(bh * Math.sqrt(Math.max(0, 1 - u * u))), 2);
      }
    } else {
      // Lean: paired blocks either side of the midline, separated by the
      // tendinous bands.
      //
      // The bands are drawn as **short, broken, per-side segments that stop
      // clear of the linea alba**, and that is the whole difference between
      // abdominal muscle and a striped jumper. Run each row edge to edge and
      // the two halves meet across the midline into one unbroken horizontal
      // rule; three of those stacked up read as ribs on a xylophone. Real
      // ones are interrupted at the centre, shorter than the belly is wide,
      // and fainter as they descend — which is what these are.
      const rows = span > 26 && slack < 0.5 ? 3 : 2;
      const bw = Math.round(waistHalf * 0.42);
      for (let r = 0; r < rows; r += 1) {
        const y = top + 4 + Math.round((navelY - top - 5) * ((r + 0.5) / rows));
        // Lower bands are shorter — the blocks narrow toward the navel — and
        // quieter, so the eye reads a sequence rather than a grating.
        const half = Math.max(1, Math.round(bw * (0.62 - r * 0.10)));
        const depth = Math.max(1, 2 - Math.round(r * 0.5) - Math.round(slack));
        for (const side of [-1, 1] as const) {
          const cx0 = mid + side * Math.round(bw * 0.66);
          for (let dx = -half; dx <= half; dx += 1) {
            // Stop short of the midline: the groove there is its own mark and
            // the bands must not run into it.
            if (Math.abs(cx0 + dx - mid) < 2) continue;
            bias(cx0 + dx, y, depth + (side === litSide ? 0 : 1));
          }
          // The block below catches the light on its crown.
          bias(cx0, y + 2, -1);
        }
      }
    }

    // The navel, and the lit skin under it.
    bias(mid, navelY, 3);
    bias(mid, navelY + 1, -1);

    // The iliac crest: the diagonal raking down and in from each flank toward
    // the groin. This is what makes a trunk end in *hips* instead of running
    // straight into the garment as a tube, and it is the mark most often
    // missing from a figure that reads as "unfinished below the ribs".
    const crestLen = Math.max(3, Math.round(span * 0.42));
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < crestLen; i += 1) {
        const u = i / Math.max(1, crestLen - 1);
        const x = mid + side * (waistHalf - Math.round(u * waistHalf * 0.52));
        const y = navelY - 1 + Math.round(u * crestLen * 0.9);
        bias(x, y, side === litSide ? 2 : 3);
        bias(x - side, y, 1);
      }
    }

    // The flank, below the ribs and above the hip: the softest turn on the
    // whole trunk, and it wants a step of shadow on the shadow side to keep
    // the cylinder from flattening out where the mask is widest.
    for (let y = top; y <= bot; y += 1) {
      bias(mid - litSide * waistHalf, y, 1);
    }
  }

  // Where cloth meets skin the cloth casts, exactly as the hem does on legs.
  // A wrap's edge is a diagonal rather than a row, so its cast is drawn against
  // the garment mask in `drawTorso` instead of here.
  if (plan.shape.bareShoulder !== 0 && !plan.shape.bareChest) return;
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
  // A shirt or a coat worn over trousers is not trimmed along the bottom. The
  // hem band below is a two-tone repeat in the *second* cloth, which on a
  // two-piece outfit is the colour of the legwear — so every modern shirt in
  // the app came out with a contrasting frill along its hem in the colour of
  // its own trousers, and every suit jacket wore a lace edge. What those hems
  // actually have is a turn: one row of shadow under one row of light.
  const overTrousers = plan.shape.legs === 'trousers' || plan.shape.legs === 'shorts'
    || plan.shape.legs === 'hose';
  if (plan.construction === 'shirt' || (overTrousers && plan.construction === 'jacket')) {
    for (let x = 0; x < SPRITE_W; x += 1) {
      let hem = -1;
      for (let y = plan.hemY + 2; y >= plan.hemY - 10; y -= 1) {
        if (y >= 0 && y < SPRITE_H && m[y * SPRITE_W + x]) { hem = y; break; }
      }
      if (hem < 1) continue;
      form.addBias(x, hem, 1.6);
      form.addBias(x, hem - 1, -0.8);
    }
    return;
  }
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
type Neckline = 'round' | 'vee' | 'stand' | 'cross' | 'square' | 'boat' | 'keyhole' | 'lapel' | 'collar';

function readNeckline(spec: PortraitSpec, kind: string): Neckline {
  const n = `${spec.garment.name} ${spec.garment.material}`.toLowerCase();
  // A tailored jacket is entirely its lapels at any scale, and the sprite had
  // no case for them: every suit in the app came out as a plain buttoned coat,
  // while the bust beside it drew a shirt front and a tie. The two pictures
  // were of different garments.
  if (/suit|blazer|tuxedo|dinner jacket|tailcoat|frock coat|morning coat|sport coat|sack coat|savile|lounge/.test(n)) return 'lapel';
  // A turned collar with points — the shirt of the last two centuries.
  if (/formal shirt|dress shirt|designer shirt|polo|guayabera|aloha|work shirt|flannel|chambray|shirtwaist|collar/.test(n)) return 'collar';
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
): Neckline {
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
    case 'lapel': {
      // A tailored jacket: the facings turned back from the front edges, the
      // shirt showing in the V between them, and something knotted at the
      // throat. The same three parts the bust draws, at a third the size, so
      // the two pictures of one suit agree.
      const depth = Math.max(6, Math.round((s.waistY - s.shoulderY) * 0.44));
      const spread = half + 3;
      const cx = s.cx + t.torsoSkew + 1;
      const shirt = (x: number, y: number, step: number) => {
        if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
        if (!m[y * SPRITE_W + x]) return;
        raster.set(x, y, ramps.clothB.steps[step], MAT.CLOTH_B, step);
        form.addBias(x, y, 0.6);
      };
      for (let i = 0; i <= depth; i += 1) {
        const w = Math.max(0, Math.round(spread * (1 - i / depth)));
        for (let dx = -w; dx <= w; dx += 1) shirt(cx + dx, top + i, 2);
        // The facing itself: a lit fold along the inner edge, falling away
        // toward the break. One flat value there reads as a painted stripe.
        for (const side of [-1, 1] as const) {
          for (let k = 0; k <= 2; k += 1) {
            const x = cx + side * (w + k);
            if (x < 0 || x >= SPRITE_W || !m[(top + i) * SPRITE_W + x]) continue;
            form.addBias(x, top + i, k === 0 ? -1.6 : 1);
          }
        }
      }
      // The tie: two rows of knot at the throat and a narrow blade down the V.
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = 1; dy <= 2; dy += 1) {
          const x = cx + dx;
          const y = top + dy;
          if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H || !m[y * SPRITE_W + x]) continue;
          raster.set(x, y, ramps.clothC.steps[dy === 1 ? 2 : 3], MAT.CLOTH_C, dy === 1 ? 2 : 3);
        }
      }
      for (let i = 3; i <= depth; i += 1) {
        const y = top + i;
        if (y < 0 || y >= SPRITE_H) continue;
        for (const dx of [0, 1] as const) {
          const x = cx + dx;
          if (!m[y * SPRITE_W + x]) continue;
          raster.set(x, y, ramps.clothC.steps[dx === 0 ? 2 : 4], MAT.CLOTH_C, dx === 0 ? 2 : 4);
        }
      }
      break;
    }
    case 'collar': {
      // Two points angled down and out from the neck opening, and a short
      // buttoned placket under them.
      for (const side of [-1, 1] as const) {
        for (let i = 0; i < 5; i += 1) {
          const x = hx + side * (half - 1 + Math.round(i * 0.6));
          lay(x, top + i, i === 0 ? 1 : 2);
          if (i > 0) form.addBias(x, top + i - 1, -0.8);
        }
      }
      for (let dx = -half; dx <= half; dx += 1) lay(hx + dx, top, 1);
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
  return style;
}

function drawClosure(
  raster: Raster, form: FormBuffer, spec: PortraitSpec, ramps: PortraitRamps,
  s: Skeleton, plan: GarmentPlan, m: Mask
): void {
  const t = s.t;
  // A wrapped cloth has no front. It is closed by being tucked into itself, so
  // neither the overlapping panels of an open garment nor the placket of a
  // closed one belongs on it — and where it is knotted at one shoulder there is
  // no neck opening either, because the diagonal edge already is the opening.
  // Drawing a collar and a centre-front seam over that was what kept every hide
  // wrap in the app reading as a coat somebody had left undone.
  if (plan.construction === 'wrapped_cloth') {
    if (plan.shape.bareShoulder === 0) drawNeckline(raster, form, spec, ramps, s, plan, m);
    return;
  }
  const open = plan.kind === 'jacket' || plan.kind === 'doublet' || plan.kind === 'robe'
    || plan.kind === 'gown' || plan.kind === 'wrapped_garment';
  const cx = s.cx + t.torsoSkew + 1;

  const neckline = drawNeckline(raster, form, spec, ramps, s, plan, m);
  // A lapel *is* the front of the garment down as far as it reaches, so the
  // opening picks up below it. Run from the shoulder as usual and the coat gets
  // a second front edge straight through its own shirt and tie.
  const openTop = neckline === 'lapel'
    ? s.shoulderY + Math.round((s.waistY - s.shoulderY) * 0.5)
    : s.shoulderY + 1;

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
  // the far panel a step down. It stops at the waist where the lower half is a
  // skirt of its own — a jacket's front edge carried on down through the skirt
  // under it, drawing one continuous opening through two garments.
  const frontBottom = plan.shape.legs === 'skirt' || plan.shape.legs === 'wrapped'
    ? s.waistY - 2 : plan.hemY - 1;
  for (let y = openTop; y <= frontBottom; y += 1) {
    const lean = Math.round((y - s.shoulderY) * 0.08);
    const x = cx + lean;
    if (!m[y * SPRITE_W + x]) continue;
    form.addBias(x, y, 2);
    if (m[y * SPRITE_W + x - 1]) form.addBias(x - 1, y, -1);
    for (let k = 1; k <= 3; k += 1) if (m[y * SPRITE_W + x + k]) form.addBias(x + k, y, 1);
  }
  if (spec.garment.ornament > 0.4) {
    for (let y = openTop + 1; y <= frontBottom - 1; y += 1) {
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
  extras: SpriteExtras, plan: GarmentPlan, chains: Record<'near' | 'far', LegChain>
): void {
  if (plan.hemY >= s.ankleY - 1) return;
  // What is actually on the legs. `skirt` and `wrapped` are drawn by the trunk
  // — they are a fall of cloth from the waist, not a covering of the limbs —
  // so as far as this function is concerned those legs are bare below the hem.
  const wear = plan.shape.legs === 'skirt' || plan.shape.legs === 'wrapped'
    ? null : plan.shape.legs;
  const legged = wear !== null;
  // Named legwear brings its own cloth — denim is indigo whatever the shirt
  // above it is. Where the *torso* garment turned out to be the trousers there
  // is no second item to read, so they keep the primary and the shirt above was
  // repainted in the secondary.
  const clothed = plan.shape.lowerNamed ? ramps.clothA : ramps.legwear;
  const clothMat = plan.shape.lowerNamed ? MAT.CLOTH_A : MAT.LEGWEAR;
  const ramp = legged ? clothed : ramps.skin;
  const mat = legged ? clothMat : MAT.SKIN;

  // Trousers hang off the hip and clear the leg; hose and bare skin follow it.
  // That difference is most of what tells them apart at this size, and it is
  // why a pair of jeans drawn on the bare-leg capsules read as long johns.
  const slack = wear === 'trousers' || wear === 'shorts' ? 3 : 0;
  // Where the cloth stops. Shorts break above the knee, trousers over the shoe.
  const legSpan = s.ankleY - s.hipY;
  const clothStop = wear === 'shorts'
    ? s.hipY + Math.round(legSpan * 0.42)
    : SPRITE_H;
  const seat = slack > 0 ? makeMask(SPRITE_W, SPRITE_H) : null;

  // Far leg first, so the near one paints over it where they overlap. This ran
  // left-to-right, which on a figure whose near side is the viewer's left meant
  // the *far* leg was drawn last and covered the near one — invisible while
  // both legs stood plumb in the same column, and unmistakable the moment a
  // stride put one in front of the other. `drawFeet` had already been fixed
  // for exactly this and the legs above them had not.
  for (const side of [-s.nearSide, s.nearSide] as const) {
    const near = side === s.nearSide;
    const chain = near ? chains.near : chains.far;
    const [hx, hy] = chain.hip;
    const [kx, ky] = chain.knee;
    const [ax, ay] = chain.ankle;
    // The thigh is fuller than the calf, and the calf tapers into the ankle.
    // Both segments now run along the solved chain, so a stride bends them
    // instead of leaving two dowels under a moving body.
    const bare = maskUnion(
      capsuleMask(hx, hy, kx, ky, s.legW + 1, s.legW),
      capsuleMask(kx, ky, ax, ay, s.legW, s.legW - 3)
    );
    // Cloth that hangs rather than clings: a wider, near-parallel tube over the
    // same bones, drawn from the hip down to wherever this garment stops. A
    // trouser leg does not taper the way a calf does — that lack of taper is
    // most of the silhouette, and drawing jeans on the bare-leg capsules is why
    // they read as long johns.
    const cloth = slack > 0
      ? maskUnion(
        capsuleMask(hx, hy, kx, ky, s.legW + 1 + slack, s.legW + slack),
        capsuleMask(kx, ky, ax, ay, s.legW + slack, s.legW + slack - 1)
      )
      : null;
    // The garment covers the top of the leg: rows above the hem belong to the
    // skirt, not the thigh. Clipping the mask rather than starting the capsule
    // at the hem keeps the *taper* anchored to the hip, so a short tunic and a
    // long one show the same leg at the same width where they overlap.
    const top = Math.max(0, (cloth ? Math.min(plan.hemY, s.hipY + 2) : plan.hemY) - 4);
    const clip = (mask: Mask, from: number, to: number) => {
      for (let y = 0; y < SPRITE_H; y += 1) {
        if (y >= from && y < to) continue;
        for (let x = 0; x < SPRITE_W; x += 1) mask[y * SPRITE_W + x] = 0;
      }
    };
    clip(bare, cloth ? clothStop : top, SPRITE_H);
    if (cloth) clip(cloth, top, clothStop);
    if (cloth && seat) for (let i = 0; i < seat.length; i += 1) if (cloth[i]) seat[i] = 1;

    const m = cloth ? maskUnion(bare, cloth) : bare;
    for (let y = 0; y < SPRITE_H; y += 1) {
      for (let x = 0; x < SPRITE_W; x += 1) {
        if (!m[y * SPRITE_W + x]) continue;
        const covered = cloth ? cloth[y * SPRITE_W + x] === 1 : legged;
        if (covered) raster.set(x, y, clothed.steps[3], clothMat, 3);
        else raster.set(x, y, ramp.steps[3], mat, 3);
      }
    }
    const depth = near ? DEPTH.legNear : DEPTH.legFar;
    // Per segment, so the knee reads as a bend rather than one long cylinder
    // lit as though it were straight. A clothed segment is modelled at the
    // cloth's radius, not the limb's, or the shading rolls off before it
    // reaches the trouser's edge and the leg comes out with a flat rim.
    const shinClothed = clothStop > ky;
    limbSurface(form, m, hx, hy, kx, ky, (s.legW + slack) / 2, depth);
    limbSurface(form, m, kx, ky, ax, ay, (s.legW + (shinClothed ? slack : 0)) / 2, depth + 0.01);
    // The knee: a lit cap, a hollow behind it, and a darkened edge either
    // side so the joint reads as a swelling rather than a change of tone. A
    // bare leg without this is a dowel — the knee is the only landmark it has.
    // Under cloth it is a *bag* rather than a bone, so the same construction
    // runs at a fraction of the depth: enough to say there is a joint there,
    // not enough to draw a kneecap through a pair of flannels.
    const cover = shinClothed ? 0.4 : 1;
    const kw = Math.max(1, Math.round(s.legW * 0.28));
    for (let dx = -kw; dx <= kw; dx += 1) {
      const near0 = Math.abs(dx) <= Math.max(1, kw - 1);
      form.addBias(kx + dx, ky - 1, (near0 ? -2 : 0) * cover);
      form.addBias(kx + dx, ky, (near0 ? -1 : 1) * cover);
      form.addBias(kx + dx, ky + 2, (near0 ? 2 : 1) * cover);
    }
    // The calf swells on the back of the shin — which is behind the *chain*,
    // not at a fixed x, so it follows the leg when it folds. A trouser leg has
    // no calf, so this is skipped where the cloth reaches.
    if (!shinClothed) {
      const shinLen = Math.max(1, Math.hypot(ax - kx, ay - ky));
      const backX = -(ay - ky) / shinLen;
      const backY = (ax - kx) / shinLen;
      const heel = -(-s.nearSide);
      for (let i = 4; i < shinLen - 4; i += 1) {
        const u = (i - 4) / Math.max(1, shinLen - 8);
        if (u >= 0.45) continue;
        const px = Math.round(kx + (ax - kx) * (i / shinLen) + backX * heel * s.legW * 0.3);
        const py = Math.round(ky + (ay - ky) * (i / shinLen) + backY * heel * s.legW * 0.3);
        form.addBias(px, py, -1);
      }
    }
    if (cloth) drawTrouserLeg(form, s, plan, cloth, chain, near, slack, clothStop);
    // The gap between the legs takes the deepest occlusion — down the *inner*
    // edge of the near leg, which follows the chain rather than hanging at the
    // hip's x. Pinned there it drew a line of shadow through open air the
    // moment the leg strode out from under the hip.
    if (near) {
      for (let y = top; y <= Math.max(ky, ay); y += 1) {
        const u = Math.max(0, Math.min(1, (y - hy) / Math.max(1, ay - hy)));
        const axis = u < 0.5
          ? hx + (kx - hx) * (u / 0.5)
          : kx + (ax - kx) * ((u - 0.5) / 0.5);
        const px = Math.round(axis - side * ((s.legW + slack) / 2));
        if (px >= 0 && px < SPRITE_W && m[y * SPRITE_W + px]) form.addBias(px, y, 1);
      }
    }
  }

  if (seat) closeFork(raster, form, s, plan, seat, clothed, clothMat);
}

/**
 * The seat of a pair of trousers: the part that is not a leg.
 *
 * Two capsules struck from the hip joints leave a wedge of nothing between them
 * above the crotch, because the legs only become separate down there. On a bare
 * figure that wedge is where the garment's hem hangs and nothing is missing; on
 * a trousered one it is a hole straight through the figure.
 *
 * The fix is only to *close* that wedge — fill from the outer edge of one
 * trouser leg to the outer edge of the other, row by row, and no further. An
 * earlier version drew the seat as its own block spanning the hips, which
 * introduced a width neither leg had and gave every figure in trousers a
 * squared-off box below the shirt. The silhouette has to stay the union of the
 * two legs; the fork is a gap being filled, not a part being added.
 */
function closeFork(
  raster: Raster, form: FormBuffer, s: Skeleton, plan: GarmentPlan,
  cloth: Mask, ramp: Ramp, mat: number
): void {
  const legSpan = s.ankleY - s.hipY;
  const crotchY = s.hipY + Math.round(legSpan * 0.15);
  const axis = s.cx + s.t.hipSkew;
  const filled = makeMask(SPRITE_W, SPRITE_H);
  let top = SPRITE_H;

  for (let y = 0; y <= crotchY; y += 1) {
    let lo = -1;
    let hi = -1;
    for (let x = 0; x < SPRITE_W; x += 1) {
      if (!cloth[y * SPRITE_W + x]) continue;
      if (lo < 0) lo = x;
      hi = x;
    }
    if (lo < 0 || hi - lo < 2) continue;
    if (y < top) top = y;
    for (let x = lo; x <= hi; x += 1) {
      const i = y * SPRITE_W + x;
      if (cloth[i]) continue;
      filled[i] = 1;
      raster.set(x, y, ramp.steps[3], mat, 3);
    }
  }
  if (top >= crotchY) return;
  // Shaded as one barrel with the legs it joins, so the seat is not a flat
  // panel between two modelled tubes.
  cylinderSurface(form, filled, axis, s.hipHalf + 1, DEPTH.legNear - 0.02);

  // The fly, and the two creases running from it into the fork. At this size
  // that is the whole of what says "trousers" rather than "a tube of cloth",
  // and it costs about a dozen pixels.
  for (let y = top + 3; y < crotchY - 1; y += 1) {
    form.addBias(axis + 1, y, 1.2);
    form.addBias(axis, y, -0.7);
  }
  for (let i = 0; i < 5; i += 1) {
    const y = crotchY - i;
    form.addBias(axis + 1 - i, y, 0.9);
    form.addBias(axis + 2 + i, y, 0.9);
  }
}

/**
 * What a trouser leg has that a bare one does not.
 *
 * Three things, in the order they matter: the **break** where the cloth lands
 * on the shoe and buckles, the **cuff** or turn-up that ends it, and a
 * **crease** down the front where the cloth has been pressed. The crease is the
 * one that separates tailored wool from denim, so it is drawn only where the
 * cloth would hold one.
 */
function drawTrouserLeg(
  form: FormBuffer, s: Skeleton, plan: GarmentPlan, cloth: Mask,
  chain: LegChain, near: boolean, slack: number, clothStop: number
): void {
  const [kx, ky] = chain.knee;
  const [ax, ay] = chain.ankle;
  const on = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < SPRITE_W && y < SPRITE_H && cloth[y * SPRITE_W + x] === 1;

  const shorts = clothStop < SPRITE_H;
  const hemY = shorts ? clothStop - 1 : Math.min(SPRITE_H - 1, ay + 1);
  const half = Math.round((s.legW + slack) / 2) + 1;
  const hemX = shorts
    ? Math.round(kx + (ax - kx) * ((clothStop - ky) / Math.max(1, ay - ky)))
    : ax;

  // The hem: a lit lip over a shadowed turn-under, which is the same
  // construction the garment hems use and for the same reason — one dark row
  // on its own is a line ruled across the leg, not cloth stopping. Written as
  // bias rather than colour: the light pass resolves cloth from its ramp and
  // whatever `raster.set` puts there is discarded.
  for (let dx = -half; dx <= half; dx += 1) {
    const x = hemX + dx;
    if (on(x, hemY)) form.addBias(x, hemY, 1.3);
    if (on(x, hemY - 1)) form.addBias(x, hemY - 1, -0.7);
  }

  // The break: the cloth is longer than the leg and gathers where it lands, so
  // the last few rows above the hem take a fold. Only long trousers break —
  // shorts have nothing to land on.
  if (!shorts) {
    for (let i = 2; i < 7; i += 1) {
      const y = hemY - i;
      const x = hemX + (i % 2 === 0 ? -1 : 1);
      form.addBias(x, y, 1.2 - i * 0.12);
      form.addBias(x - 1, y, -0.7);
    }
  }

  // The crease, on the near leg only: the far one is turned away and a second
  // vertical highlight on it reads as a seam rather than a press.
  if (near && !shorts) {
    const creaseAt = (y: number) => {
      const u = Math.max(0, Math.min(1, (y - ky) / Math.max(1, ay - ky)));
      return Math.round(kx + (ax - kx) * u) - 1;
    };
    for (let y = Math.max(0, plan.hemY); y < hemY - 4; y += 1) {
      const x = creaseAt(y);
      if (!on(x, y)) continue;
      form.addBias(x, y, -1.1);
      if (on(x + 1, y)) form.addBias(x + 1, y, 0.7);
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
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, s: Skeleton, extras: SpriteExtras,
  chains: Record<'near' | 'far', LegChain>
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
    // The foot goes where the leg's ankle ended up. Standing, that is exactly
    // where it was drawn before; striding, it is under the leg rather than
    // under the hip, which is the whole point.
    const chain = near ? chains.near : chains.far;
    const cx = chain.ankle[0];
    const soleY = chain.ankle[1] + s.shoeH;
    // A foot off the ground is a foot rolling onto its toe, so it presents
    // less of its length to the camera. Without this a lifted foot reads as
    // the whole shoe being levitated flat, which is worse than not lifting it.
    const liftShorten = chain.lift > 0 ? 0.62 : 1;
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
      t.footToe * lenScale * (near ? 0.46 : 1.1) * (0.6 + s.turn * 0.5) * liftShorten,
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
// Held and carried objects.
//
// What a person is holding is, at this size, the single most informative thing
// about them after their clothes. Nothing else in the figure says farmer rather
// than fisherman rather than spinner: the face is 22px across, the garment is
// often the same undyed cloth for all three, and the one thing that differs is
// the object in the hand. So these are drawn as objects — a hoe with a socket
// and a blade, a bow with a string standing off the grip, a net with mesh in it
// — and not as the two-pixel vertical stick that used to stand in for eleven
// different tools.
// ---------------------------------------------------------------------------

/** The ramp and material id for a substance a carried object is made of. */
function substance(ramps: PortraitRamps, m: HeldMaterial): [Ramp, number] {
  switch (m) {
    // `iron` is what a tool is made of and `metal` is what a *bangle* is made
    // of, and they are deliberately different substances: see MAT.IRON.
    case 'iron': return [ramps.book[MAT.IRON] ?? ramps.metal, MAT.IRON];
    case 'metal': return [ramps.metal, MAT.METAL];
    case 'stone': return [ramps.book[MAT.STONE] ?? ramps.metal, MAT.STONE];
    case 'bone': return [ramps.book[MAT.BONE] ?? ramps.leather, MAT.BONE];
    case 'fibre': return [ramps.book[MAT.CORD] ?? ramps.leather, MAT.CORD];
    case 'leather': return [ramps.leather, MAT.LEATHER];
    // Only for things that really are a bolt of the wearer's own cloth — a
    // bound grip, a bundle. Anything else picks up their trim colour.
    case 'cloth': return [ramps.clothC, MAT.CLOTH_C];
    // Terracotta. `PAINT` is already a warm red-orange and already outlined
    // with the figure, which is exactly what fired clay wants.
    case 'clay': return [ramps.book[MAT.PAINT] ?? ramps.leather, MAT.PAINT];
    default: return [ramps.book[MAT.WOOD] ?? ramps.leather, MAT.WOOD];
  }
}

/**
 * A drawing surface for one object, so each form below can describe its shape
 * and nothing else.
 *
 * `plot` carries the rule that mattered most in the old code and still does: a
 * held thing passes *behind* the head, never across the face. Held items are
 * drawn last and nearest, so without it a staff ran a wooden stripe down the
 * middle of somebody's nose.
 */
interface Chisel {
  /** Mark a pixel, subject to the head rule. */
  plot(x: number, y: number): void;
  /** Fill a disc — the swept cross-section of a shaft or cord. */
  disc(cx: number, cy: number, r: number): void;
  /** Sweep a disc of radius `r` along a line: any shaft, haft, cord or limb. */
  bar(x0: number, y0: number, x1: number, y1: number, r: number): void;
  /** Sweep with the radius easing from `r0` to `r1` — a taper. */
  taper(x0: number, y0: number, x1: number, y1: number, r0: number, r1: number): void;
  /** Paint everything marked so far in one substance, then clear the buffer. */
  cast(mat: HeldMaterial, shade?: number): Mask;
}

/**
 * `sparesTheHead` is the default and is what keeps a spear from being driven
 * through somebody's nose. It has to be switchable, because the things a
 * persona wears *in their hair* — a comb, a pin, a pipe at the lip — are
 * exactly the pixels it forbids, and with it on they were all silently erased:
 * every comb and hairpin in the app drew nothing at all.
 */
function chisel(
  raster: Raster, ramps: PortraitRamps, s: Skeleton, sparesTheHead = true
): Chisel {
  let m = makeMask(SPRITE_W, SPRITE_H);
  const plot = (x: number, y: number) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= SPRITE_W || y >= SPRITE_H) return;
    const under = raster.matAt(x, y);
    if (sparesTheHead
      && (under === MAT.SKIN || under === MAT.HAIR || under === MAT.BEARD
        || under === MAT.HEADWEAR || under === MAT.HEADWEAR_ACCENT
        || under === MAT.SCLERA || under === MAT.IRIS || under === MAT.BROW
        || under === MAT.LIP)) {
      if (y < s.shoulderY + 2) return;
    }
    m[y * SPRITE_W + x] = 1;
  };
  const disc = (cx: number, cy: number, r: number) => {
    const lim = Math.ceil(r);
    for (let dy = -lim; dy <= lim; dy += 1) {
      for (let dx = -lim; dx <= lim; dx += 1) {
        if (dx * dx + dy * dy <= r * r + 0.3) plot(cx + dx, cy + dy);
      }
    }
  };
  const taper = (x0: number, y0: number, x1: number, y1: number, r0: number, r1: number) => {
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * 1.4));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r0 + (r1 - r0) * t);
    }
  };
  return {
    plot,
    disc,
    taper,
    bar: (x0, y0, x1, y1, r) => taper(x0, y0, x1, y1, r, r),
    cast(mat: HeldMaterial, shade = 3): Mask {
      const [ramp, id] = substance(ramps, mat);
      for (let y = 0; y < SPRITE_H; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (m[y * SPRITE_W + x]) raster.set(x, y, ramp.steps[shade], id, shade);
        }
      }
      const done = m;
      m = makeMask(SPRITE_W, SPRITE_H);
      return done;
    },
  };
}

/** How long a shaft is, as a share of the figure, so it scales with the person. */
const reach = (s: Skeleton, frac: number) => Math.round((s.floorY - s.crownY) * frac);

function drawHeldItem(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, extras: SpriteExtras,
  s: Skeleton, hand: [number, number]
): void {
  const held = extras.held;
  if (!held || !held.kind) return;
  const [hx, hy] = hand;
  const n = held.name.toLowerCase();
  const c = chisel(raster, ramps, s);
  // Which way the object leans and where its working end goes: out from the
  // body, on the side the holding hand is already on.
  const dir: -1 | 1 = hx === s.cx ? s.nearSide : (hx > s.cx ? 1 : -1);
  const wood = held.material === 'metal' ? 'wood' : held.material;

  /** Wrap a cast mask in a round cross-section along the given axis. */
  const round = (mask: Mask, x0: number, y0: number, x1: number, y1: number, r: number) =>
    limbSurface(form, mask, x0, y0, x1, y1, r, DEPTH.held);
  const flat = (mask: Mask, nx: number, ny: number) =>
    planeSurface(form, mask, nx, ny, DEPTH.held);
  /** One dark line along a mask's own axis: a seam, a fuller, a bound grip. */
  const groove = (x: number, y0: number, y1: number, d: number) => {
    for (let y = y0; y <= y1; y += 1) form.addBias(x, y, d);
  };

  switch (held.kind) {
    // -----------------------------------------------------------------------
    case 'pole': {
      // Butt on the ground, tip above the head. A pole arm at rest is stood on
      // its end, and that is also what puts its head clear of the figure where
      // it can be read against the background.
      const isPaddle = /paddle|oar|punt/.test(n);
      const isSpear = /spear|harpoon|lance|pike|javelin/.test(n);
      const isFork = /fork|rake|trident/.test(n);
      const isGun = /musket|flintlock|matchlock|rifle|arquebus/.test(n);
      const top = isPaddle ? hy - reach(s, 0.30) : s.crownY - reach(s, 0.10);
      const bot = isPaddle ? s.floorY - reach(s, 0.20) : s.floorY - 2;
      c.taper(hx, top, hx, bot, 2.6, 3.1);
      round(c.cast(wood), hx, top, hx, bot, 3);

      if (isSpear) {
        // A leaf blade: widest a third of the way down from the point, and
        // *narrower than the shaft is long* — a spearhead that reads as a
        // spearhead is mostly point.
        const len = reach(s, 0.13);
        const tip = top - len;
        for (let i = 0; i <= len; i += 1) {
          const t = i / len;                     // 0 at the tip, 1 at the socket
          const w = Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) * 5.2;
          for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx, tip + i);
        }
        const blade = c.cast(held.material === 'stone' ? 'stone' : 'iron', 2);
        round(blade, hx, tip, hx, top, 5);
        // The midrib, which is the whole reason a blade reads as metal rather
        // than as a grey leaf.
        groove(hx, tip + 2, top - 1, -2);
        // …and the binding that holds the socket on.
        c.bar(hx, top, hx, top + 4, 3.4);
        flat(c.cast('fibre', 4), 0, -0.2);
      } else if (isPaddle) {
        // The blade is at the bottom, because a paddle is carried blade-down
        // and a paddle drawn blade-up is a shovel.
        const bl = reach(s, 0.20);
        for (let i = 0; i <= bl; i += 1) {
          const t = i / bl;
          const w = Math.sin(Math.min(1, 0.12 + t * 1.05) * Math.PI) * 8.5;
          for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx, bot + i);
        }
        const blade = c.cast(wood, 3);
        flat(blade, dir * 0.22, -0.12);
        groove(hx, bot + 2, bot + bl - 2, -2);
      } else if (isFork) {
        for (const off of [-5, 0, 5]) {
          c.taper(hx + off, top + 12, hx + off * 1.4, top - 10, 1.6, 1.1);
        }
        round(c.cast('iron', 2), hx, top, hx, top - 10, 6);
      } else if (isGun) {
        // The stock: a thickening at the lower half with a dropped heel.
        c.taper(hx, hy + 6, hx - dir * 3, bot, 3.2, 5.4);
        round(c.cast('wood', 4), hx, hy, hx, bot, 5);
        c.bar(hx + dir * 2, hy - 4, hx + dir * 2, hy + 8, 2.2);
        flat(c.cast('iron', 3), dir * 0.3, 0);
      } else {
        // A plain shaft — a carrying pole, a digging stick. Its tip is worked,
        // and one dark band is all it takes to say so.
        for (let i = 0; i < 3; i += 1) {
          for (let dx = -3; dx <= 3; dx += 1) form.addBias(hx + dx, bot - i, 2 - i);
        }
      }
      break;
    }

    // -----------------------------------------------------------------------
    case 'hafted': {
      // Head uppermost. Stood on its butt with the head at the bottom, the tool
      // fights the feet and the ground shadow for the same few rows; up here it
      // is silhouetted against nothing but background and reads at a glance.
      const top = s.shoulderY - reach(s, 0.12);
      const bot = s.floorY - 3;
      c.taper(hx, top, hx, bot, 2.4, 2.9);
      round(c.cast('wood'), hx, top, hx, bot, 2.8);

      // Iron, not `metal`: `metal` is the persona's ornament ramp, so a woman
      // in gold earrings was issued a gold hoe.
      const headMat: HeldMaterial = held.material === 'stone' ? 'stone'
        : held.material === 'bone' ? 'bone' : 'iron';
      // Heads are cast dark and given a *curved* surface across their width.
      // Both matter. A tool head lit by `planeSurface` takes one constant
      // normal, and a constant normal facing the viewer resolves to the top of
      // the ramp everywhere at once — every axe, hoe and hammer in the app came
      // out as the same white pennant on a stick, which at a glance is a flag.
      // A cylinder gives it a lit edge and a shadow side, which is what makes
      // eighteen pixels of grey read as forged iron.
      const forged = (mask: Mask, ax: number, ay: number, bx: number, by: number, r: number) =>
        limbSurface(form, mask, ax, ay, bx, by, r, DEPTH.held);
      const eye = () => {
        // The socket the haft passes through: a narrow band, and narrow is the
        // point. Cast as wide as the head itself it merged with it, and a hoe,
        // an axe and a pick all came out as the same solid rectangle — the eye
        // has to be a *neck* for anything hung off it to read as a separate
        // shape.
        c.bar(hx, top + 3, hx, top + 11, 2.9);
        forged(c.cast(headMat, 5), hx, top + 3, hx, top + 11, 2.9);
        for (let i = 3; i <= 11; i += 1) form.addBias(hx - dir * 2, top + i, 2);
      };

      // Pickaxe first: "pickaxe" contains "axe", and tested the other way round
      // it never reached its own branch at all — every pick in the app was
      // drawn as a hatchet. The same trap as "sickle" under "blade".
      if (/pickaxe|\bpick\b|mattock/.test(n)) {
        // Two swept spikes, one longer than the other. Length is what says
        // pick: drawn stubby they are an axe with two bits.
        for (const [len, lift, side] of [[0.135, 0.05, 1], [0.09, 0.028, -1]] as const) {
          const L = reach(s, len);
          const rise = reach(s, lift);
          for (let k = 0; k <= L; k += 1) {
            const t = k / L;
            c.disc(hx + dir * side * k, top + 8 - rise * t * t, 3.4 * (1 - t) ** 0.85 + 0.7);
          }
        }
        const pick = c.cast(headMat, 4);
        forged(pick, hx - dir * reach(s, 0.09), top + 8,
          hx + dir * reach(s, 0.135), top + 8 - reach(s, 0.05), 3);
        eye();
      } else if (/hoe|spade|shovel/.test(n)) {
        // A plate hung off the eye and swung down and out. Compact: the first
        // attempt tapered it away over twenty-odd pixels and the result drooped
        // like a pennant. A hoe blade is a short flat sheet with a straight
        // working edge, and the straightness of that edge is what reads.
        const L = reach(s, 0.085);
        const D = reach(s, 0.058);
        for (let k = 0; k <= L; k += 1) {
          const t = k / L;
          const y0 = top + 6 + t * D * 0.55;
          const y1 = top + 6 + D * 0.45 + t * D * 0.85;
          for (let y = y0; y <= y1; y += 1) c.plot(hx + dir * k, y);
        }
        const blade = c.cast(headMat, 4);
        forged(blade, hx, top + 6, hx + dir * L, top + 6 + D, 4);
        // The ground edge, bright and worn thin.
        for (let y = top + 6 + D * 0.55; y <= top + 6 + D * 1.3; y += 1) {
          form.addBias(hx + dir * L, y, -4);
        }
        eye();
      } else if (/axe|hatchet|adze|maul|tomahawk/.test(n)) {
        // A crescent bit: a small poll at the haft, a waisted neck, then a fan
        // out to a convex edge with the horns swept back.
        const w = reach(s, 0.105);
        const h = reach(s, 0.062);
        for (let i = -h; i <= h; i += 1) {
          const v = Math.abs(i) / h;
          // The cutting edge bulges — that arc is the single most recognisable
          // thing about an axe and a straight edge loses it entirely.
          const outer = w * (1 - 0.16 * v * v);
          // Where the metal starts on this row. Zero across the poll, then
          // running outward so the bit tapers to its horns.
          const inner = v < 0.30 ? 0 : w * 0.82 * ((v - 0.30) / 0.70) ** 0.85;
          for (let k = inner; k <= outer; k += 1) c.plot(hx + dir * k, top + 8 + i);
        }
        const bit = c.cast(headMat, 4);
        forged(bit, hx, top + 8, hx + dir * w, top + 8, h);
        // The bevel: the outer edge takes the light.
        for (let i = -h; i <= h; i += 1) {
          const v = Math.abs(i) / h;
          form.addBias(hx + dir * Math.round(w * (1 - 0.16 * v * v)), top + 8 + i, -4);
        }
        eye();
      } else if (/sickle|scythe|hook/.test(n)) {
        // An arc opening back toward the holder, thick at the tang and thinning
        // to the point.
        const r = reach(s, 0.105);
        for (let a = -0.3; a <= 1.62; a += 0.015) {
          const t = (a + 0.3) / 1.92;
          c.disc(hx + dir * r * Math.sin(a), top + 6 - r * Math.cos(a) + r, 2.6 - t * 1.3);
        }
        const arc = c.cast(headMat, 4);
        forged(arc, hx, top + 6, hx + dir * r, top + 6 + r, 2.4);
        // The inside of the curve is the edge, so it takes the light.
        for (let a = -0.2; a <= 1.5; a += 0.03) {
          form.addBias(hx + dir * (r - 2) * Math.sin(a), top + 6 - (r - 2) * Math.cos(a) + r, -3);
        }
        eye();
      } else {
        // Hammer, mallet, shears: a squat head with a face on one side and a
        // tapering peen on the other, so its outline is asymmetric and it does
        // not read as a signboard. Small — a hammer head is a *fist* of metal,
        // and drawn as wide as an axe bit it stops being one.
        // The face is a *square* block — no taper at all, because the one
        // thing a hammer has that an axe does not is a flat end. The peen
        // opposite it tapers hard, so the outline is blocky on one side and
        // pointed on the other and cannot be mistaken for a bit.
        const w = reach(s, 0.042);
        const h = reach(s, 0.034);
        for (let k = 0; k <= w; k += 1) {
          for (let i = -h; i <= h; i += 1) c.plot(hx + dir * k, top + 8 + i);
        }
        const pw = reach(s, 0.050);
        for (let k = 0; k <= pw; k += 1) {
          const half = h * (0.9 - (k / pw) * 0.62);
          for (let i = -half; i <= half; i += 1) c.plot(hx - dir * k, top + 8 + i);
        }
        const block = c.cast(headMat, 4);
        forged(block, hx - dir * pw, top + 8, hx + dir * w, top + 8, h);
        // The face, worn bright by use.
        for (let i = -h; i <= h; i += 1) form.addBias(hx + dir * w, top + 8 + i, -4);
        eye();
      }
      // The grip: two bindings where the hand actually closes.
      for (const gy of [hy - 3, hy + 4]) {
        c.bar(hx, gy, hx, gy + 2, 3.1);
        flat(c.cast('fibre', 4), 0, 0);
      }
      break;
    }

    // -----------------------------------------------------------------------
    case 'staff': {
      const top = s.crownY - reach(s, 0.09);
      const bot = s.floorY - 1;
      c.taper(hx, top + 6, hx, bot, 2.9, 3.4);
      round(c.cast(wood), hx, top, hx, bot, 3.2);
      if (/crook|shepherd|crozier/.test(n)) {
        // The hook, which is the entire difference between a shepherd and a
        // man standing next to a pole.
        const r = reach(s, 0.055);
        for (let a = 0; a <= Math.PI * 1.15; a += 0.03) {
          c.disc(hx - dir * r * Math.sin(a), top + 6 - r + r * Math.cos(a) * -1, 2.5);
        }
        round(c.cast(wood, 3), hx, top, hx - dir * r, top, 2.5);
      } else {
        c.disc(hx, top + 5, 4.4);
        const knob = c.cast(/gold|silver|bronze|brass/.test(n) ? 'metal' : wood, 3);
        ellipsoidSurface(form, knob, hx, top + 5, 4.4, 4.4, DEPTH.held, 1);
      }
      break;
    }

    // -----------------------------------------------------------------------
    case 'bow': {
      // The grip sits in the fist and the limbs curve *back* from it, so the
      // string stands off the hand by the depth of the bow. That gap is the
      // whole read: without it the thing is a bent stick.
      const half = reach(s, 0.33);
      const bend = reach(s, 0.07);
      const gy = hy - reach(s, 0.05);
      const limbX = (t: number) => hx - dir * bend * t * t;
      for (let i = -100; i <= 100; i += 1) {
        const t = i / 100;
        c.disc(limbX(t), gy + t * half, 1.4 + (1 - Math.abs(t)) * 1.5);
      }
      const limb = c.cast(wood, 3);
      round(limb, hx, gy - half, hx, gy + half, 2.6);
      // The string: one pixel, taut, from nock to nock.
      const sx = limbX(1);
      c.bar(sx, gy - half + 1, sx, gy + half - 1, 0.6);
      flat(c.cast('fibre', 2), dir * 0.4, 0);
      // Nocks, and the wrapped grip the hand is closed on.
      for (const t of [-1, 1]) c.disc(limbX(t), gy + t * (half - 1), 1.9);
      flat(c.cast('bone', 2), 0, 0);
      c.bar(hx, gy - 5, hx, gy + 5, 2.8);
      flat(c.cast('fibre', 4), dir * 0.3, 0);
      break;
    }

    // -----------------------------------------------------------------------
    case 'net': {
      // Gathered in the fist and hanging as a bag of mesh.
      //
      // Drawn as actual strands with the background between them, which was not
      // the first attempt: filling the envelope solid and cutting the weave in
      // as shading gave a pale ellipse that read as a shield. A net is defined
      // by being *mostly holes*, and no amount of tonal work on a solid mass
      // will say that — the gaps have to be real gaps.
      const drop = reach(s, 0.32);
      const wide = reach(s, 0.125);
      const pitch = 6;
      const envelope: Array<[number, number, number]> = [];
      for (let i = 0; i <= drop; i += 1) {
        const t = i / drop;
        // Narrow at the fist, belling out, then drawn back in by its own weight.
        const w = wide * Math.sin(Math.min(1, 0.10 + t * 0.95) * Math.PI * 0.92);
        // The hem sags away from the body — a net hangs, it does not stand.
        const lean = dir * t * t * reach(s, 0.035);
        envelope.push([i, w, lean]);
      }
      for (const [i, w, lean] of envelope) {
        for (let dx = -w; dx <= w; dx += 1) {
          const px = Math.round(hx + dx + lean);
          const py = hy + i;
          // Two crossing families of strands. Everything else is air.
          const a = ((px + py) % pitch + pitch) % pitch < 2;
          const b = ((px - py) % pitch + pitch) % pitch < 2;
          // The selvedge: the outermost pixel of each row is always cloth, so
          // the mass keeps a continuous edge for the ink pass to follow and
          // does not dissolve into confetti at the rim.
          const rim = Math.abs(dx) >= w - 1;
          if (a || b || rim) c.plot(px, py);
        }
      }
      const mesh = c.cast('fibre', 3);
      cylinderSurface(form, mesh, hx, wide, DEPTH.held);
      // Knots where the two families cross, and shadow inside the bag.
      for (let y = 0; y < SPRITE_H; y += 1) {
        for (let x = 0; x < SPRITE_W; x += 1) {
          if (!mesh[y * SPRITE_W + x]) continue;
          const a = ((x + y) % pitch + pitch) % pitch < 2;
          const b = ((x - y) % pitch + pitch) % pitch < 2;
          if (a && b) form.addBias(x, y, 3);
          else if (b) form.addBias(x, y, 1);
        }
      }
      // Floats along the foot rope, which is what stops the bottom edge being a
      // ruled line and says the thing has weight.
      for (let k = -2; k <= 2; k += 1) {
        const fx = hx + dir * reach(s, 0.035) + k * 5;
        const fy = hy + drop - 2 - Math.abs(k);
        c.disc(fx, fy, 2.2);
      }
      const floats = c.cast(held.material === 'stone' ? 'stone' : 'wood', 4);
      ellipsoidSurface(form, floats, hx, hy + drop - 2, wide, 3, DEPTH.held + 0.02, 1);
      // The gather: every strand runs into the fist, so the top is solid.
      c.taper(hx, hy - 2, hx, hy + 7, 3.4, 2.4);
      const collar = c.cast('fibre', 4);
      limbSurface(form, collar, hx, hy - 2, hx, hy + 7, 3.4, DEPTH.held + 0.01);
      break;
    }

    // -----------------------------------------------------------------------
    case 'sling': {
      // Two cords and a pouch, hanging slack. The slack is the point: a sling
      // drawn taut is a whip.
      const drop = reach(s, 0.26);
      for (const off of [-3, 3]) {
        for (let i = 0; i <= drop; i += 1) {
          const t = i / drop;
          // A catenary, pulled out from the body as it falls.
          c.disc(hx + off * (1 - t) + dir * Math.sin(t * Math.PI) * reach(s, 0.045), hy + i, 0.7);
        }
      }
      flat(c.cast('fibre', 3), dir * 0.3, 0);
      const py = hy + drop;
      for (let dy = -3; dy <= 3; dy += 1) {
        const w = Math.round(4.5 * Math.sqrt(Math.max(0, 1 - (dy / 3.4) ** 2)));
        for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx, py + dy);
      }
      const pouch = c.cast('leather', 3);
      ellipsoidSurface(form, pouch, hx, py, 4.5, 3.4, DEPTH.held, 1);
      break;
    }

    // -----------------------------------------------------------------------
    case 'spindle': {
      if (/broom|besom|whisk/.test(n)) {
        const top = s.shoulderY - reach(s, 0.05);
        const bristle = s.floorY - reach(s, 0.13);
        c.taper(hx, top, hx, bristle, 2.2, 2.6);
        round(c.cast('wood'), hx, top, hx, bristle, 2.4);
        // A fan of straw, spreading as it falls and ragged along the bottom.
        const span = reach(s, 0.075);
        for (let k = -9; k <= 9; k += 1) {
          const t = k / 9;
          const len = reach(s, 0.115) * (1 - Math.abs(t) * 0.28);
          c.taper(hx + t * 2, bristle - 2, hx + t * span, bristle + len, 1.4, 0.7);
        }
        const straw = c.cast('fibre', 3);
        flat(straw, 0, -0.35);
        // The binding that holds the head on.
        c.bar(hx, bristle - 3, hx, bristle + 1, 3.4);
        flat(c.cast('fibre', 5), 0, 0);
      } else {
        // A drop spindle: shaft, whorl low down, and a cone of spun thread
        // above it. The cone is what says it is in use.
        const top = hy - reach(s, 0.06);
        const bot = hy + reach(s, 0.22);
        c.taper(hx, top, hx, bot, 1.5, 1.1);
        round(c.cast('wood'), hx, top, hx, bot, 1.5);
        const wy = bot - reach(s, 0.045);
        for (let dy = -2; dy <= 2; dy += 1) {
          const w = Math.round(6.5 * Math.sqrt(Math.max(0, 1 - (dy / 2.6) ** 2)));
          for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx, wy + dy);
        }
        const whorl = c.cast(held.material === 'wood' ? 'clay' : held.material, 3);
        ellipsoidSurface(form, whorl, hx, wy, 6.5, 2.6, DEPTH.held, 1);
        // The cop of thread.
        const ct = wy - reach(s, 0.10);
        for (let i = 0; i <= wy - ct; i += 1) {
          const w = 1 + (i / Math.max(1, wy - ct)) * 4.5;
          for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx, ct + i);
        }
        const cop = c.cast('fibre', 3);
        cylinderSurface(form, cop, hx, 5, DEPTH.held);
        for (let i = 0; i <= wy - ct; i += 3) groove(hx - 3, ct + i, ct + i, 2);
        // …and the single thread running up to the other hand.
        for (let i = 0; i < reach(s, 0.09); i += 1) c.plot(hx - dir * i * 0.4, ct - i);
        flat(c.cast('fibre', 2), 0, 0);
      }
      break;
    }

    // -----------------------------------------------------------------------
    case 'blade': {
      // Point down beside the leg. Pommel, grip, guard, blade — four parts,
      // and a sword missing any one of them reads as a metal ruler.
      const len = reach(s, 0.32);
      const curve = /scimitar|sabre|saber|kukri|falchion/.test(n) ? dir * reach(s, 0.05) : 0;
      const bladeTop = hy + 7;
      for (let i = 0; i <= len; i += 1) {
        const t = i / len;
        const w = 3.6 * (1 - t * 0.78);
        const off = curve * t * t;
        for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx + off, bladeTop + i);
      }
      const blade = c.cast(held.material === 'stone' ? 'stone' : 'iron', 2);
      round(blade, hx, bladeTop, hx + curve, bladeTop + len, 3.6);
      // The fuller: a lit groove down the spine, and the two edges going bright.
      for (let i = 2; i < len - 2; i += 1) {
        const off = Math.round(curve * (i / len) ** 2);
        form.addBias(hx + off, bladeTop + i, 2);
        const w = Math.round(3.6 * (1 - (i / len) * 0.78));
        form.addBias(hx + off - w, bladeTop + i, -3);
        form.addBias(hx + off + w, bladeTop + i, -3);
      }
      // Guard.
      const gw = reach(s, 0.055);
      for (let dx = -gw; dx <= gw; dx += 1) for (let dy = 0; dy < 3; dy += 1) c.plot(hx + dx, hy + 4 + dy);
      flat(c.cast('iron', 3), 0, -0.6);
      // Grip and pommel.
      c.bar(hx, hy - 6, hx, hy + 4, 2.4);
      round(c.cast('leather', 4), hx, hy - 6, hx, hy + 4, 2.4);
      c.disc(hx, hy - 7, 3.2);
      const pommel = c.cast('metal', 3);
      ellipsoidSurface(form, pommel, hx, hy - 7, 3.2, 3.2, DEPTH.held, 1);
      break;
    }

    // -----------------------------------------------------------------------
    case 'tusk': {
      // Carried up against the shoulder, curving as ivory does.
      const len = reach(s, 0.42);
      const x0 = hx;
      const y0 = hy + 4;
      for (let i = 0; i <= len; i += 1) {
        const t = i / len;
        // Quadratic sweep: nearly vertical at the butt, swinging out at the tip.
        const px = x0 + dir * (t * t * reach(s, 0.16) - t * reach(s, 0.02));
        c.disc(px, y0 - i, 3.8 * (1 - t * 0.82) + 0.9);
      }
      const ivory = c.cast('bone', 3);
      round(ivory, x0, y0, x0 + dir * reach(s, 0.14), y0 - len, 4);
      // Growth rings near the butt, which is where they show.
      for (let i = 2; i < len * 0.35; i += 4) {
        for (let dx = -4; dx <= 4; dx += 1) form.addBias(x0 + dx, y0 - i, 1);
      }
      break;
    }

    // -----------------------------------------------------------------------
    case 'small': {
      // Inside the fist, so what shows is short and mostly points one way.
      if (/\bpen\b|stylus|needle|brush/.test(n)) {
        c.taper(hx, hy + 2, hx + dir * 4, hy - reach(s, 0.075), 1.5, 0.8);
        round(c.cast(held.material === 'metal' ? 'iron' : 'wood', 3),
          hx, hy + 2, hx + dir * 4, hy - reach(s, 0.06), 1.5);
      } else if (/seal\b|scale\b|balance|amulet|disc/.test(n)) {
        c.disc(hx + dir * 3, hy + 2, 4.2);
        const disc = c.cast(held.material, 3);
        ellipsoidSurface(form, disc, hx + dir * 3, hy + 2, 4.2, 4.2, DEPTH.held, 1);
        form.addBias(hx + dir * 3, hy + 2, 2);
      } else {
        // A knife: short grip below the fist, blade above it and angled out.
        const bl = reach(s, 0.10);
        for (let i = 0; i <= bl; i += 1) {
          const t = i / bl;
          const w = 2.6 * (1 - t * 0.72);
          for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx + dir * t * 3, hy - 3 - i);
        }
        const edge = c.cast(held.material === 'stone' ? 'stone' : 'iron', 2);
        round(edge, hx, hy - 3, hx + dir * 3, hy - 3 - bl, 2.6);
        for (let i = 1; i < bl; i += 1) {
          form.addBias(hx + Math.round(dir * (i / bl) * 3) + 2, hy - 3 - i, -3);
        }
        c.bar(hx, hy + 1, hx, hy + 6, 2.2);
        round(c.cast('wood', 4), hx, hy + 1, hx, hy + 6, 2.2);
      }
      break;
    }

    // -----------------------------------------------------------------------
    case 'book': {
      const w = reach(s, 0.08);
      const h = reach(s, 0.115);
      const bx = hx + dir * 2;
      const by = hy - Math.round(h * 0.55);
      if (/scroll|roll/.test(n)) {
        c.bar(bx, by, bx, by + h, 4.2);
        const roll = c.cast('bone', 3);
        round(roll, bx, by, bx, by + h, 4.2);
        // The lap of the outer turn, and the darkness inside the tube.
        groove(bx + dir * 2, by + 1, by + h - 1, 2);
        for (let dx = -4; dx <= 4; dx += 1) form.addBias(bx + dx, by, 2);
      } else {
        for (let dy = 0; dy <= h; dy += 1) for (let dx = -w; dx <= w; dx += 1) c.plot(bx + dx, by + dy);
        const cover = c.cast('leather', 3);
        flat(cover, -dir * 0.3, -0.15);
        // The page block: a pale edge down the fore-edge side, which is the one
        // mark that separates a book from a brick.
        for (let dy = 1; dy < h; dy += 1) {
          for (let k = 0; k < 3; k += 1) c.plot(bx + dir * (w - k), by + dy);
        }
        const pages = c.cast('bone', 2);
        flat(pages, dir * 0.7, 0);
        for (let dy = 2; dy < h; dy += 3) form.addBias(bx + dir * (w - 1), by + dy, 2);
        // The spine, opposite.
        groove(bx - dir * w, by + 1, by + h - 1, 2);
      }
      break;
    }

    // -----------------------------------------------------------------------
    case 'bag': {
      // Gathered at the fist and bellying out below it.
      const drop = reach(s, 0.22);
      const wide = reach(s, 0.085);
      for (let i = 0; i <= drop; i += 1) {
        const t = i / drop;
        const w = wide * Math.sin(Math.min(1, 0.14 + t * 0.9) * Math.PI * 0.95);
        for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx + dir * t * 3, hy + 3 + i);
      }
      const sack = c.cast(held.material === 'cloth' ? 'cloth' : 'fibre', 3);
      ellipsoidSurface(form, sack, hx + dir * 2, hy + 3 + drop * 0.55, wide, drop * 0.5,
        DEPTH.held, 0.85);
      // The neck, tied. Three creases radiating from the tie is what turns a
      // bulge into a sack.
      c.bar(hx, hy + 2, hx, hy + 5, 3.0);
      flat(c.cast('fibre', 5), 0, 0);
      for (const k of [-3, 0, 3]) {
        for (let i = 0; i < Math.round(drop * 0.4); i += 1) {
          form.addBias(hx + k + Math.round(k * i * 0.12), hy + 6 + i, k === 0 ? -1 : 2);
        }
      }
      break;
    }
  }
}

/**
 * The object accessories: what a person carries that is neither tool nor
 * ornament.
 *
 * Drawn from `appearance.accessory`, which is filled on every persona in the
 * app and which no renderer had ever read — see `pieceIn` in `spriteSource.ts`.
 * Only the forms that are *objects* come through here; the beads, pendants and
 * amulets that make up most of that slot are ornament and go through the
 * jewelry pass, where they belong.
 */
function drawCarried(
  raster: Raster, form: FormBuffer, ramps: PortraitRamps, extras: SpriteExtras,
  s: Skeleton, L: HeadLayout, freeHand: [number, number]
): void {
  const worn = extras.carried;
  if (!worn) return;
  // Head-worn objects are allowed over the head; hand-held ones are not.
  const onHead = worn.kind === 'comb' || worn.kind === 'hairpin' || worn.kind === 'pipe';
  const c = chisel(raster, ramps, s, !onHead);
  const [hx, hy] = freeHand;
  const dir: -1 | 1 = hx === s.cx ? s.nearSide : (hx > s.cx ? 1 : -1);
  const flat = (mask: Mask, nx: number, ny: number, depth: number = DEPTH.held) =>
    planeSurface(form, mask, nx, ny, depth);

  switch (worn.kind) {
    case 'comb': {
      // Set into the hair above and behind the ear, teeth inward. Drawn at the
      // headwear depth rather than the held depth: it is *in* the hair, and at
      // held depth it floated in front of the skull.
      const side = -s.nearSide;
      const cx = L.hx + side * Math.round(L.rx * 0.72);
      const cy = L.crownY + Math.round((L.chinY - L.crownY) * 0.18);
      const w = Math.max(5, Math.round(L.rx * 0.5));
      for (let dy = 0; dy < 4; dy += 1) for (let dx = -w; dx <= w; dx += 1) c.plot(cx + dx, cy + dy);
      const spine = c.cast(worn.material === 'wood' ? 'wood' : worn.material, 3);
      planeSurface(form, spine, side * 0.4, -0.5, DEPTH.headwear + 0.02);
      for (let k = -w + 1; k < w; k += 2) {
        for (let i = 0; i < 4; i += 1) c.plot(cx + k, cy + 4 + i);
      }
      const teeth = c.cast(worn.material === 'wood' ? 'wood' : worn.material, 4);
      planeSurface(form, teeth, side * 0.4, 0, DEPTH.headwear + 0.02);
      break;
    }
    case 'hairpin': {
      // Through the knot, on the diagonal, with the head of the pin showing.
      const side = -s.nearSide;
      const px = L.hx + side * Math.round(L.rx * 0.55);
      const py = L.crownY + Math.round((L.chinY - L.crownY) * 0.12);
      const len = Math.round(L.rx * 1.15);
      c.taper(px - side * len * 0.5, py + 5, px + side * len * 0.5, py - 3, 1.4, 0.8);
      const shaft = c.cast(worn.material === 'cloth' ? 'bone' : worn.material, 3);
      planeSurface(form, shaft, side * 0.4, -0.4, DEPTH.headwear + 0.03);
      c.disc(px - side * len * 0.5, py + 5, 2.6);
      const head = c.cast(worn.material === 'cloth' ? 'bone' : worn.material, 2);
      ellipsoidSurface(form, head, px - side * len * 0.5, py + 5, 2.6, 2.6,
        DEPTH.headwear + 0.04, 1);
      break;
    }
    case 'pipe': {
      // At the mouth: stem angled down and out, bowl standing up at the end of
      // it. Six pixels of clay, and no other accessory in the set changes a
      // face this much for so little.
      //
      // Kaolin, not terracotta. Clay elsewhere in the app is the fired red of a
      // spindle whorl, which on a pipe reads as a chilli hanging off the lip;
      // the pipes people actually smoked were white.
      const mat: HeldMaterial = worn.material === 'clay' ? 'bone' : worn.material;
      const side = s.nearSide;
      const mx = L.fx + side * Math.round(L.rx * 0.46);
      const my = L.chinY - Math.round((L.chinY - L.crownY) * 0.20);
      const len = Math.max(7, Math.round(L.rx * 0.85));
      const bx = mx + side * len;
      const by = my + Math.round(len * 0.42);
      c.taper(mx, my, bx, by, 1.6, 1.3);
      const stem = c.cast(mat, 3);
      planeSurface(form, stem, 0, -0.55, DEPTH.head + 0.10);
      // The bowl rises from the end of the stem, leaning outward.
      const bh = Math.max(6, Math.round(L.rx * 0.55));
      for (let i = 0; i <= bh; i += 1) {
        const t = i / bh;
        const w = 1.9 + t * 1.7;
        for (let dx = -w; dx <= w; dx += 1) c.plot(bx + dx + side * t * 1.6, by - i);
      }
      const bowl = c.cast(mat, 3);
      cylinderSurface(form, bowl, bx + side, 3.4, DEPTH.head + 0.11);
      // The mouth of it, dark, with char round the rim.
      for (let dx = -3; dx <= 3; dx += 1) form.addBias(bx + dx + side * 2, by - bh, 4);
      break;
    }
    case 'watch': {
      if (/pocket/.test(worn.name.toLowerCase())) {
        // On a chain into the waistcoat: the chain is the visible part, and it
        // is the swag between two points that reads, not the watch itself.
        const ax = s.cx + s.nearSide * Math.round(s.hipHalf * 0.55);
        const bx2 = s.cx - s.nearSide * Math.round(s.hipHalf * 0.1);
        for (let i = 0; i <= 20; i += 1) {
          const t = i / 20;
          c.disc(ax + (bx2 - ax) * t, s.waistY - 2 + Math.sin(t * Math.PI) * 7, 0.7);
        }
        flat(c.cast('metal', 2), 0, -0.4, DEPTH.torso + 0.12);
      } else {
        // At the wrist, on the side the viewer can see.
        for (let dy = -3; dy <= 3; dy += 1) {
          const w = Math.round(3.4 * Math.sqrt(Math.max(0, 1 - (dy / 3.4) ** 2)));
          for (let dx = -w; dx <= w; dx += 1) c.plot(hx + dx, hy - 8 + dy);
        }
        const face = c.cast('metal', 2);
        ellipsoidSurface(form, face, hx, hy - 8, 3.4, 3.4, DEPTH.hand + 0.02, 1);
        form.addBias(hx, hy - 8, -3);
      }
      break;
    }
    case 'phone': {
      // In the free hand, tilted up. A slab with a lit face — the only object
      // in the app that emits rather than reflects, and drawing it dark would
      // make it a whetstone.
      const w = 3;
      const h = Math.max(7, Math.round(reach(s, 0.045)));
      const px = hx + dir * 2;
      const py = hy - 2;
      for (let dy = -h; dy <= h; dy += 1) for (let dx = -w; dx <= w; dx += 1) c.plot(px + dx, py + dy);
      const body = c.cast('metal', 5);
      flat(body, -dir * 0.35, -0.2, DEPTH.hand + 0.04);
      for (let dy = -h + 1; dy <= h - 1; dy += 1) {
        for (let dx = -w + 1; dx <= w - 1; dx += 1) c.plot(px + dx, py + dy);
      }
      const screen = c.cast('cloth', 0);
      flat(screen, -dir * 0.35, -0.2, DEPTH.hand + 0.05);
      for (let dy = -h + 1; dy <= h - 1; dy += 1) {
        for (let dx = -w + 1; dx <= w - 1; dx += 1) form.addBias(px + dx, py + dy, -4);
      }
      break;
    }
    case 'fan': {
      // Held open at the chest, ribs radiating from the wrist.
      const r = Math.max(9, reach(s, 0.10));
      const ax = hx;
      const ay = hy - 4;
      for (let k = -5; k <= 5; k += 1) {
        const a = -Math.PI / 2 + dir * k * 0.13;
        c.taper(ax, ay, ax + Math.cos(a) * r, ay + Math.sin(a) * r, 1.5, 0.9);
      }
      const ribs = c.cast(worn.material === 'metal' ? 'metal' : 'wood', 4);
      flat(ribs, -dir * 0.2, -0.4, DEPTH.hand + 0.03);
      for (let k = -50; k <= 50; k += 1) {
        const a = -Math.PI / 2 + dir * k * 0.013;
        for (let d = r * 0.52; d <= r; d += 0.6) {
          c.plot(ax + Math.cos(a) * d, ay + Math.sin(a) * d);
        }
      }
      const leaf = c.cast('cloth', 2);
      flat(leaf, -dir * 0.2, -0.5, DEPTH.hand + 0.02);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Assembly.
// ---------------------------------------------------------------------------

/**
 * The character's own way of standing, from their personality vector.
 *
 * Only applied when the frame is a *resting* one — a bow or a reach has
 * already said what the arms are doing and must not be overridden by
 * temperament. Shared with `poseLandmarks`, which would otherwise report the
 * frame's nominal arms while the renderer drew the stance's, and quietly
 * mislead exactly the diagnostic it exists to serve.
 */
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

function restingArms(
  fp: FramePose, extras: SpriteExtras, clasped: boolean
): { near: ArmPose; far: ArmPose } {
  const isRest = (a: ArmPose) => a.swing < 20 && a.forward < 0.3;
  const idle = isRest(fp.posture.arms.near) && isRest(fp.posture.arms.far)
    // A frame that places its feet is doing something, whatever its arms say —
    // a stride with its hands folded across the chest is a person being wheeled
    // about. Temperament yields to action.
    && fp.posture.legs.near.step === 0 && fp.posture.legs.far.step === 0
    && fp.posture.drop === 0 && fp.posture.shoulderLift === 0;
  // The garment can still insist: a clasped-rest robe overrides a hanging one.
  // Unless there is something in the hand, which overrules both it and
  // temperament — see the note on `readStance`. A robe cannot fold the arms of
  // a person carrying a hoe, and drawing it that way put the hoe through them.
  const stance: RestStance = !idle ? 'hang'
    : extras.stance !== 'hang' ? extras.stance
    : clasped && !extras.held ? 'clasp' : 'hang';
  if (stance === 'hang') return { near: fp.posture.arms.near, far: fp.posture.arms.far };
  return STANCES[stance];
}

/**
 * The spine fold. Unlike the old raster shear this runs *before* anything is
 * drawn: it moves the skeleton's own landmarks, so limbs and head are built
 * in their folded positions and the silhouette stays a body.
 */
function foldSpine(s: Skeleton, posture: Posture): Skeleton {
  const still = posture.spineBend === 0 && posture.lean === 0 && posture.bob === 0
    && posture.drop === 0 && posture.shoulderLift === 0;
  if (still) return s;
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
  // The squat. Everything from the hips up comes down together and the feet
  // stay where they are — `legChain` folds the knees to make up the
  // difference, which is why a crouch needs no leg numbers at all.
  const drop = Math.round(posture.drop * s.t.motionScale);
  // A shrug raises the shoulders toward a head that does not move, so the neck
  // shortens. Applied *after* the drop, because a person can shrug while
  // crouching and the two are independent.
  const lift = Math.round(posture.shoulderLift * s.t.motionScale);
  const upper = settle + posture.bob + drop;
  return {
    ...s,
    headCx: s.headCx + headCarry + posture.lean,
    faceCx: s.faceCx + headCarry + posture.lean,
    cx: s.cx + Math.round(posture.lean * 0.3),
    crownY: s.crownY + upper,
    eyeY: s.eyeY + upper,
    chinY: s.chinY + upper,
    neckTopY: s.neckTopY + upper,
    shoulderY: s.shoulderY + Math.round(settle * 0.7) + posture.bob + drop - lift,
    chestY: s.chestY + Math.round(settle * 0.5) + posture.bob + drop - Math.round(lift * 0.5),
    waistY: s.waistY + drop,
    hipY: s.hipY + drop,
    stoopTopSkew: s.stoopTopSkew + Math.round(carry * 0.8),
  };
}

function compilePose(source: SpriteSource, ramps: PortraitRamps, fp: FramePose): Raster {
  const { spec, extras } = source;
  const base = buildSkeleton(spec, getTuning());
  const s = foldSpine(base, fp.posture);
  const t = s.t;
  // The accessory's raw name, first: a shawl or a bandana in that slot is an
  // over-layer, and it reaches `readShape` nowhere else.
  const plan = planGarment(spec, s, fp.wind,
    extras.accessoryName || extras.worn?.name || extras.armWear?.name || '');
  const raster = new Raster(SPRITE_W, SPRITE_H);
  const form = new FormBuffer();
  const rig = buildRig(t);
  const L = headLayout(spec, s);

  // Legs are solved once, up front, and shared: the leg, the shoe on it and
  // the shadow under it must all agree about where the ankle is, and the only
  // way to guarantee that is for each to read the same chain rather than
  // recomputing a foot position of its own.
  const legs = planLegs(s, base, fp.posture);

  // The ground first: it lives behind everything and never touches the figure.
  // It spans the *feet*, so a figure mid-stride casts a long shadow and one
  // standing casts a compact one — a stride whose shadow does not move is the
  // cue that gives away a translated sprite even when the legs are right.
  const footL = Math.min(legs.near.ankle[0], legs.far.ankle[0]);
  const footR = Math.max(legs.near.ankle[0], legs.far.ankle[0]);
  groundShadow(
    raster, Math.round((footL + footR) / 2), base.floorY + 2,
    s.hipHalf + t.strideX + Math.round((footR - footL) / 2), t.groundShadow,
  );

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
  const { near: nearArm, far: farArm } = restingArms(fp, extras, plan.clasped);
  // Which arm is which is the skeleton's call, not a literal — the figure's
  // orientation lives in one place and everything else asks it.
  const nearSide = s.nearSide;
  const farSide = -nearSide as -1 | 1;
  const nearChain = armChain(s, nearSide, nearArm, fp.posture.spineBend);
  const farChain = armChain(s, farSide, farArm, fp.posture.spineBend);

  // A resting far arm lives behind the torso; an acting one crosses in front
  // of it — so the draw order follows the pose, and a reaching arm shows its
  // whole length instead of a forearm sprouting from the coat.
  const farActs = !(farArm.swing < 20 && farArm.forward < 0.3);
  if (!farActs) drawArm(raster, form, spec, ramps, s, plan, farSide, farArm, farChain, DEPTH.farArm, extras);

  drawLegs(raster, form, ramps, s, extras, plan, legs);
  drawFeet(raster, form, ramps, s, extras, legs);
  // The body under the clothes.
  //
  // Only drawn where a construction actually leaves skin — a bare chest above
  // a dhoti, a midriff between a choli and its skirt. Without it the gap the
  // garment mask leaves is a *hole* rather than a person: the first attempt at
  // a cropped blouse cut a window straight through the figure to the
  // background, because the torso mask and the garment were the same mask.
  // A one-shouldered wrap leaves a triangle of chest showing, and it needs the
  // body under it for the same reason the dhoti does: the garment mask is a cut
  // through the trunk, so whatever the cut exposes has to already be a person.
  if (plan.shape.bareChest || plan.shape.bareMidriff || plan.shape.bareShoulder !== 0) {
    drawBareTorso(raster, form, ramps, s, plan, spec);
  }
  const bodyM = drawTorso(raster, form, spec, ramps, s, plan);
  drawOverLayer(raster, form, spec, ramps, s, plan, bodyM);
  drawWorn(raster, form, ramps, s, plan, extras);

  if (farActs) drawArm(raster, form, spec, ramps, s, plan, farSide, farArm, farChain, DEPTH.nearArm, extras);
  drawArm(raster, form, spec, ramps, s, plan, nearSide, nearArm, nearChain, DEPTH.nearArm, extras);

  // Neck, then head, then the face on it.
  //
  // The head mask is built first because the neck has to be measured against
  // it. Drawn as a straight column — which is what this was — the neck is wider
  // than the jaw it meets: eleven pixels against a chin of eight. So the
  // outline of the lower face is the neck's own parallel sides, the skull's
  // taper never appears, and every figure ends in a box. That, and not the
  // shape of the jaw, is why sprite chins read as flat and square; the jaw
  // itself has been the bust's for as long as the two have shared a profile.
  const headM = headMask(spec, L);
  const headHalfAt = (y: number): number => {
    if (y < L.crownY || y > L.chinY) return -1;
    let n = 0;
    for (let x = 0; x < SPRITE_W; x += 1) if (headM[y * SPRITE_W + x]) n += 1;
    return n > 0 ? Math.floor((n - 1) / 2) : -1;
  };

  const neckM = makeMask(SPRITE_W, SPRITE_H);
  const neckHalf = Math.floor(t.neckW / 2);
  const chinHalf = Math.max(1, headHalfAt(L.chinY));
  // `t.neckW` stays the neck's width — it is just no longer its width
  // everywhere. Under the jaw the throat is bounded by the jaw; below the chin
  // it eases back out to full over four rows, which is a throat widening into
  // a collar rather than a step.
  const neckHalfAt = (y: number): number => {
    const jaw = headHalfAt(y);
    if (jaw >= 0) return Math.max(1, Math.min(neckHalf, jaw));
    const u = Math.min(1, Math.max(0, (y - L.chinY) / 4));
    const eased = u * u * (3 - 2 * u);
    return Math.max(1, Math.round(chinHalf + (neckHalf - chinHalf) * eased));
  };

  for (let y = s.neckTopY; y <= s.shoulderY + 1; y += 1) {
    const half = neckHalfAt(y);
    for (let x = s.headCx - half; x <= s.headCx + half; x += 1) {
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
    const half = neckHalfAt(y);
    for (let x = s.headCx - half; x <= s.headCx + half; x += 1) {
      form.addBias(x, y, cast);
    }
  }

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
  // Mehndi and arm work, after the arms and hands are on the raster and before
  // anything is put in them.
  drawLimbMarkings(raster, spec, ramps, farActs ? [nearChain, farChain] : [nearChain]);

  // The tool goes in the acting hand; anything else the persona carries goes in
  // the other one, so a fisherman with a watch does not wear it through his net.
  const toolHand = farActs ? farChain.hand : nearChain.hand;
  const otherHand = farActs ? nearChain.hand : farChain.hand;
  drawHeldItem(raster, form, ramps, extras, s, toolHand);
  drawCarried(raster, form, ramps, extras, s, L, extras.held ? otherHand : toolHand);

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
  // Ochre worked through the hair dyes the material, so it belongs to the
  // palette rather than to a drawing pass — the light resolves hair off the
  // ramp book, and anything painted onto the pixels is resolved back off.
  applyHairOchre(source.spec, ramps);
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

/**
 * Where the joints ended up, for a frame that has already been drawn.
 *
 * Purely diagnostic — nothing in the app calls it. A rendered figure tells you
 * *that* an elbow looks wrong and never *where* the renderer thinks the elbow
 * is, and those are different questions: an arm can read as broken because the
 * chain is wrong, or because the chain is right and the capsule around it is
 * not. Overlaying these on a contact sheet separates the two in one glance,
 * which is worth the small surface of re-running the solve.
 */
export interface PoseLandmarks {
  crown: [number, number];
  shoulder: [number, number];
  hipCentre: [number, number];
  arms: Record<'near' | 'far', ArmChain>;
  legs: Record<'near' | 'far', LegChain>;
  floorY: number;
}

export function poseLandmarks(source: SpriteSource, id: FrameId): PoseLandmarks {
  const fp = FRAME_POSES[id === 'fallen' ? 'stand' : id];
  const base = buildSkeleton(source.spec, getTuning());
  const s = foldSpine(base, fp.posture);
  const plan = planGarment(source.spec, s, fp.wind,
    source.extras.accessoryName || source.extras.worn?.name || '');
  const arms = restingArms(fp, source.extras, plan.clasped);
  const nearSide = s.nearSide;
  const farSide = -nearSide as -1 | 1;
  const legs = planLegs(s, base, fp.posture);
  return {
    crown: [s.headCx, s.crownY],
    shoulder: [s.cx + s.t.torsoSkew + s.stoopTopSkew, s.shoulderY],
    hipCentre: [s.cx + s.t.hipSkew, s.hipY],
    arms: {
      near: armChain(s, nearSide, arms.near, fp.posture.spineBend),
      far: armChain(s, farSide, arms.far, fp.posture.spineBend),
    },
    legs,
    floorY: base.floorY,
  };
}
