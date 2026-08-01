/**
 * encounter/sprite/drape.ts
 *
 * How cloth hangs, and how it moves.
 *
 * **A skirt is a barrel, not a panel with lines on it.** That sentence is the
 * whole module, and getting it wrong produced three separate-looking faults
 * that turned out to be one:
 *
 *  · Folds were spaced evenly *in x*. On a real cylinder they sit at even
 *    *angles*, and even angles project so that folds crowd toward the
 *    silhouette and open out down the front. Even x-spacing can only ever
 *    look like a flat panel, however well each fold is drawn.
 *
 *  · The hem was a ruled horizontal. The rim of a cone seen from slightly
 *    above projects as an **ellipse** — near front hanging lowest, sides
 *    riding up. A straight hem reads as a cut-out standing on a line, and it
 *    was the single loudest flatness cue in the figure.
 *
 *  · Every fold ridge got the same highlight. A ridge out on the turning edge
 *    is a *shadow-side* ridge; lighting it as brightly as one down the lit
 *    front turns modelling into stripes. `facingAt` fixes the value to where
 *    the cloth actually is on the barrel.
 *
 * Two things that are true independently of the barrel:
 *
 *  · **A fold is a valley with a lit ridge beside it**, never a dark line.
 *    Cloth turns away from the light into the crease and back coming out.
 *
 *  · **Folds own the hem.** Each valley pulls it down and the ridges let it
 *    ride up, so the plan has to be made *before* the garment mask exists.
 *
 * On top of that, long cloth is never quite still. `windAt` gives every fold a
 * slow pendulum, anchored at the waist and travelling most at the hem, so an
 * idle robe breathes without anyone appearing to move.
 */

import { unit } from '../../components/portraitLab/core/rng';
import { PortraitSpec } from '../../components/portraitLab/spec/types';
import { Skeleton, SPRITE_W } from './skeleton';

export interface Fold {
  /**
   * Where the fold sits **around the barrel**, in radians. −π/2 is the far
   * silhouette edge, 0 the front, +π/2 the near edge.
   *
   * This is the whole difference between cloth and a painted panel. Folds are
   * evenly spaced around a cylinder, and even angles project to x positions
   * that *bunch toward the edges* — which is what the reference shows and what
   * spacing them evenly in x can never produce.
   */
  theta: number;
  /** How much the angle opens out by the hem — the fan. */
  fan: number;
  /** Where down the fall it starts, 0 at the waist … 1 at the hem. */
  startT: number;
  /** Valley depth, in ramp steps. */
  depth: number;
  /** Whether the valley is wide enough to darken two columns. */
  wide: boolean;
  /** Which side of the valley carries the lit ridge. */
  ridge: -1 | 1;
  /** Pendulum phase, so the folds do not all swing together. */
  phase: number;
  /** Where down the fall it fades out, 0 … 1. */
  endT: number;
  /** Amplitude of the fold's own drift across the cloth, in px. */
  wander: number;
  wanderPhase: number;
}

export interface Drape {
  folds: Fold[];
  /**
   * How far the hem is *lower* at this column than at the silhouette edges.
   *
   * The rim of a cone seen from slightly above projects as an ellipse: the
   * near front hangs lowest on the screen and the sides ride up toward the
   * edges. Drawn as a ruled horizontal — as it was — the figure reads as a
   * flat cut-out standing on a line, and no amount of fold detail above it
   * recovers the volume.
   */
  hemCurveAt: (x: number) => number;
  /** Peak depth of that ellipse, in px. */
  hemCurveMax: number;
  /** Top of the fall — the belt, or the shoulders on an unbelted garment. */
  topY: number;
  hemY: number;
  /** How far the hem is displaced at this column, in px (positive = lower). */
  hemOffsetAt: (x: number, wind: number) => number;
  /** Lateral travel of cloth at this height for this wind phase. */
  windAt: (t: number, phase: number, wind: number) => number;
  /** Peak lateral travel at the hem, in px. */
  windAmp: number;
  /** Horizontal half-width of the fall at a given height. */
  halfAt: (y: number) => number;
  axis: number;
  /** Where the barrel's front projects — off-axis once the figure turns. */
  frontShift: number;
}

export interface DrapeInput {
  topY: number;
  hemY: number;
  hipY: number;
  hipHalf: number;
  hemHalf: number;
  axis: number;
  /** Floor-length cloth swings; a belted tunic barely does. */
  longFall: boolean;
}

/**
 * Cloth weight decides almost everything about a fall: heavy wool hangs in a
 * few deep straight folds that reach the floor, and light linen breaks into
 * many shallow ones that start and stop.
 */
export function planDrape(spec: PortraitSpec, s: Skeleton, input: DrapeInput): Drape {
  const t = s.t;
  const { topY, hemY, hipY, hipHalf, hemHalf, axis, longFall } = input;
  const fall = Math.max(1, hemY - topY);
  const heavy = t.clothWeight >= 2;

  const rnd = (tag: string) => unit(spec.seed, `drape-${tag}`);
  // Wide hems need more folds to fill; heavy cloth needs fewer to say the same
  // thing. Both are bounded — past about eight the skirt turns into a grating.
  // Fewer than before. Each fold now spreads its valley and ridge over five
  // columns, so packing six of them into a 60px skirt leaves no undisturbed
  // cloth between them and the modelling turns to interference.
  const base = heavy ? 3 : 4;
  const count = Math.max(2, Math.min(6,
    base + Math.round((hemHalf - 26) / 11) + Math.round(rnd('n') * 2 - 0.5)));

  const folds: Fold[] = [];
  for (let i = 0; i < count; i += 1) {
    // Spread across the fall with a little jitter, so they are not a comb.
    // Spread around the visible half of the barrel, with a little jitter.
    const even = (i + 0.5) / count;
    const theta = (even - 0.5) * Math.PI * (0.88 + rnd(`s${i}`) * 0.12);
    folds.push({
      theta,
      // Folds rotate outward as the skirt widens; the ones already near the
      // edge move least, because they are the most foreshortened.
      fan: Math.cos(theta) * (0.18 + rnd(`f${i}`) * 0.14),
      // Heavy cloth falls from the top; light cloth breaks partway down.
      startT: heavy ? rnd(`t${i}`) * 0.16 : rnd(`t${i}`) * 0.5,
      // …and a fold need not reach the hem. Every crease running the full
      // drop is what makes a skirt read as fluted rather than as cloth: real
      // folds die out where the fabric finds room.
      endT: 0.72 + rnd(`e${i}`) * 0.28,
      // A slow lateral wander, so no fold is a ruled vertical.
      wander: (rnd(`v${i}`) - 0.5) * 2.2,
      wanderPhase: rnd(`vp${i}`) * Math.PI * 2,
      depth: Math.max(1, Math.min(3, (heavy ? 2 : 1) + (rnd(`d${i}`) > 0.66 ? 1 : 0) + (t.foldStrength >= 3 ? 1 : 0))),
      wide: heavy && rnd(`w${i}`) > 0.45,
      // The lit ridge sits on whichever side the key light is coming from.
      ridge: (t.lightDir >= 0 ? 1 : -1) as -1 | 1,
      phase: rnd(`p${i}`) * Math.PI * 2,
    });
  }

  // Only cloth with room to swing swings. A knee-length tunic on a belt is
  // effectively rigid at this scale, and animating it reads as a glitch.
  const windAmp = longFall ? (heavy ? 1 : 2) : 0;

  // Where the front of the barrel projects. The turn swings it off the axis,
  // which is what makes the skirt asymmetric — more cloth on one side than
  // the other, as every turned figure has and no mirror-perfect cone does.
  const frontShift = Math.round(hemHalf * 0.20 * s.turn) * -s.nearSide;
  // Deeper on a wider skirt: the rim is a bigger circle, so its projection is
  // a bigger ellipse.
  const hemCurve = Math.max(3, Math.round(hemHalf * 0.34));
  const hemCurveAt = (x: number): number => {
    const k = (x - (axis + frontShift)) / Math.max(1, hemHalf);
    return Math.round(hemCurve * Math.sqrt(Math.max(0, 1 - k * k)));
  };

  const halfAt = (y: number): number => {
    if (y <= hipY) {
      const k = (y - topY) / Math.max(1, hipY - topY);
      return hipHalf * (0.86 + 0.14 * k);
    }
    const k = (y - hipY) / Math.max(1, hemY - hipY);
    return hipHalf + (hemHalf - hipHalf) * Math.pow(k, 1.3);
  };

  // Travel is anchored at the top of the fall and greatest at the hem — a
  // pendulum, not a translation. The exponent keeps the waist genuinely still.
  const windAt = (tt: number, phase: number, wind: number): number => {
    if (windAmp <= 0) return 0;
    return Math.sin(wind * Math.PI * 2 + phase) * windAmp * Math.pow(Math.max(0, tt), 1.7);
  };

  // Where each fold's valley lands on the hem, the hem hangs a pixel lower;
  // the ridges between them ride up. Cached per wind phase because the mask
  // builder asks for it column by column.
  const hemCache = new Map<number, Int8Array>();
  const hemOffsetAt = (x: number, wind: number): number => {
    const key = Math.round(wind * 16);
    let row = hemCache.get(key);
    if (!row) {
      row = new Int8Array(SPRITE_W);
      for (const f of folds) {
        const fx = Math.round(
          axis + frontShift + Math.sin(f.theta + f.fan) * halfAt(hemY)
            + windAt(1, f.phase, wind),
        );
        for (let d = -2; d <= 2; d += 1) {
          const px = fx + d;
          if (px < 0 || px >= SPRITE_W) continue;
          // A valley pulls the hem down; two columns out it lifts.
          const v = Math.abs(d) <= (f.wide ? 1 : 0) ? 1 : Math.abs(d) === 2 ? -1 : 0;
          row[px] = Math.max(-1, Math.min(2, row[px] + v));
        }
      }
      hemCache.set(key, row);
    }
    return x >= 0 && x < SPRITE_W ? row[x] : 0;
  };

  return { folds, topY, hemY, hemOffsetAt, hemCurveAt, hemCurveMax: hemCurve, windAt, windAmp, halfAt, axis, frontShift };
}

/**
 * The x of a fold's valley at a given row — the *projection* of its angle onto
 * the picture plane, not a fraction of the width. `sin` is doing the work: it
 * is why the folds crowd toward the silhouette and open out down the front.
 */
export function foldX(d: Drape, f: Fold, y: number, wind: number): number {
  const tt = (y - d.topY) / Math.max(1, d.hemY - d.topY);
  // The wander is what stops a fold being a ruled line: cloth hanging free
  // drifts a pixel or two either way over its length, and two folds drifting
  // out of phase never read as a comb.
  const drift = Math.sin(tt * 2.4 + f.wanderPhase) * f.wander;
  return Math.round(
    d.axis + d.frontShift + Math.sin(f.theta + f.fan * tt) * d.halfAt(y)
      + drift + d.windAt(tt, f.phase, wind),
  );
}

/**
 * How side-on the cloth is at this column, 0 facing the viewer … 1 at the
 * silhouette. Folds use it to scale their highlight: a ridge out on the
 * turning edge is a *shadow-side* ridge, and lighting it as brightly as one
 * down the lit front is what made the skirt read as stripes on a panel
 * rather than as a barrel with creases in it.
 */
export function facingAt(d: Drape, x: number, y: number): number {
  const k = (x - (d.axis + d.frontShift)) / Math.max(1, d.halfAt(y));
  return Math.min(1, Math.abs(k));
}
