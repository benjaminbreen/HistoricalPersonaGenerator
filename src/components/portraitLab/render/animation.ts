/**
 * portraitLab/render/animation.ts
 *
 * Idle behaviour, derived entirely from the clock and the seed — no state, no
 * timers, no accumulated drift. Ask for the frame at time t and get the same
 * answer every time, which means a portrait can pause off-screen and resume
 * without a hitch.
 *
 * Everything is seeded per portrait, so a grid of forty faces never blinks in
 * unison. That single detail is the difference between "a page of animated
 * portraits" and "a page of animated GIFs".
 */

import { unit } from '../core/rng';
import { Expression, MoodSpec } from '../spec/types';
import { FrameState } from './pipeline';

export interface IdleOptions {
  seed: number;
  /** The face this persona wears at rest. */
  resting: Expression;
  mood: MoodSpec;
  /** Long hair drifts; short hair does not. */
  hairMoves: boolean;
  /** An expression the caller is forcing, e.g. a hover state. */
  override?: Expression | null;
  reducedMotion?: boolean;
}

const BLINK_MS = 170;
const GAZE_MS = 2400;

/** Blink cadence: slower when tired, faster when alert or anxious. */
function blinkPeriod(mood: MoodSpec): number {
  const base = 4200;
  const energy = (mood.energy - 0.5) * -1400;
  const nerves = mood.valence < -0.3 ? -600 : 0;
  return Math.max(2200, base + energy + nerves);
}

function blinkState(time: number, seed: number, mood: MoodSpec): FrameState['blink'] {
  const period = blinkPeriod(mood);
  const index = Math.floor(time / period);
  // Jitter each blink inside its own window so the rhythm is never metronomic.
  const offset = unit(seed, `blink-${index}`) * period * 0.72;
  let elapsed = time - (index * period + offset);

  // Roughly one blink in six comes in a pair.
  const doubled = unit(seed, `blink2-${index}`) > 0.84;
  if (doubled && elapsed > 260 && elapsed < 260 + BLINK_MS) elapsed -= 260;

  if (elapsed < 0 || elapsed > BLINK_MS) return 'none';
  // A blink is not a switch: the lid travels down and back up.
  if (elapsed < 40) return 'half';
  if (elapsed < 115) return 'closed';
  return 'half';
}

const GAZE_TARGETS: Array<[number, number]> = [
  [0, 0], [0, 0], [0, 0],
  [-1, 0], [1, 0],
  [-2, 0], [2, 0],
  [-1, 1], [1, -1],
  [0, 1], [0, -1],
];

/**
 * How directly this persona addresses whoever is looking at them.
 *
 * One trait, feeding both questions — where the eyes rest, and how well they
 * stay there. Keeping it in one place is the point: the two used to be decided
 * separately, so a persona could be given a level stare by `restingGaze` and
 * then a fidget rate by `gaze()` that broke it every other second. Whether
 * somebody holds your eye and whether they meet it in the first place are the
 * same fact about them.
 */
function directness(mood: MoodSpec): number {
  return Math.max(0, Math.min(1,
    (1 - mood.guarded) * 0.6 + mood.energy * 0.25 + (mood.valence + 1) * 0.15));
}

/**
 * Whether the eyes rest on the viewer, and how firmly.
 *
 * `steadiness` is the share of the time they stay put once they are there, and
 * it is deliberately non-linear: the top third of the population sit near 1 and
 * genuinely hold a stare, blinking but not glancing, while the guarded end
 * fidgets. A flat rate across everybody is what made even the level-gazed
 * personas break off every two seconds, which reads less like a person thinking
 * and more like a sprite on a timer.
 */
function gazeHabit(seed: number, mood: MoodSpec): { meets: boolean; steadiness: number } {
  const direct = directness(mood);
  // Most people look at the person in front of them. The bar sits well below
  // the average `direct` so that only the genuinely wary look away at rest —
  // the first version put it above the average and had a majority of the
  // population avoiding eye contact, which is a roomful of suspects rather than
  // a roomful of people.
  const meets = unit(seed, 'gaze-rest') < direct + 0.34;
  const steadiness = Math.max(0, Math.min(1, (direct - 0.34) / 0.34));
  return { meets, steadiness };
}

function gaze(time: number, seed: number, mood: MoodSpec): [number, number] {
  const { steadiness } = gazeHabit(seed, mood);
  // A steady person's eyes move on a longer clock as well as less often. Both
  // matter: raising stillness alone still asks the question every two seconds,
  // and a coin that comes up heads nine times in ten still lands tails inside
  // ten seconds if you keep flipping it.
  const period = GAZE_MS * (1.5 - mood.energy * 0.5) * (1 + steadiness);
  const index = Math.floor(time / period);
  const roll = unit(seed, `gaze-${index}`);
  // Settling back to the persona's *own* resting gaze rather than to dead
  // centre — otherwise an animated portrait spends most of its time staring out
  // of the frame no matter who it is, and the still and moving versions of the
  // same persona disagree about where they are looking.
  const stillness = 0.42 + steadiness * 0.5;
  if (roll < stillness) return restingGaze(seed, mood);
  const pick = GAZE_TARGETS[Math.floor(unit(seed, `gaze-pick-${index}`) * GAZE_TARGETS.length)];
  return pick;
}

/**
 * A rare flicker of what the persona is actually feeling — a cheerful one
 * catches themselves smiling, an exhausted one lets their eyes fall closed for
 * a moment longer than a blink.
 */
function microExpression(time: number, seed: number, mood: MoodSpec, resting: Expression): Expression | null {
  const period = 9800;
  const index = Math.floor(time / period);
  const start = index * period + unit(seed, `micro-${index}`) * period * 0.7;
  const elapsed = time - start;
  if (elapsed < 0 || elapsed > 1100) return null;
  if (unit(seed, `micro-roll-${index}`) > 0.42) return null;

  if (mood.valence > 0.3) return 'smile';
  if (mood.valence < -0.35) return 'concern';
  if (mood.energy < 0.3) return 'weary';
  return resting === 'neutral' ? 'content' : null;
}

/**
 * Where this persona's eyes sit when nothing is happening.
 *
 * The still frame used to be `gazeX: 0, gazeY: 0`, and still is most of what
 * anyone sees: contact sheets, cards at rest, reduced motion, and every PNG
 * export take this path. So a page of forty personas was forty people meeting
 * the reader's eye at the same instant, which is not a thing that happens in a
 * room and is most of why a grid of these read as a wall of staring.
 *
 * Whether a sitter meets the viewer is one of the oldest decisions in portrait
 * painting and it is a decision about *character*, so it is taken from the same
 * mood vector the resting face is: the open and the confident look out, and the
 * guarded look away. `energy` breaks the tie for the large middle, because
 * holding somebody's eye is an act rather than a state.
 *
 * Fixed per persona rather than random, for the reason the dropped shoulder is:
 * it reads as a fact about the person, and a fact that changed between renders
 * would not. Kept to one or two pixels — at this size the eye is nine across,
 * and three would not be a glance away but a squint at something off-stage.
 */
export function restingGaze(seed: number, mood: MoodSpec): [number, number] {
  if (gazeHabit(seed, mood).meets) return [0, 0];

  // Which way they look off is the persona's own, but biased to the viewer's
  // left — away from the key light, which is the side a sitter turns from.
  const away = unit(seed, 'gaze-side') < 0.62 ? -1 : 1;
  const far = mood.guarded > 0.62 || unit(seed, 'gaze-far') > 0.55;
  // The downcast eye is deference or defeat, and belongs only to the people the
  // rest of the vector already describes that way. Looking *up* is nobody's
  // resting state; it is a reaction, so it never appears here.
  const down = mood.valence < -0.2 && unit(seed, 'gaze-down') > 0.45 ? 1 : 0;
  return [away * (far ? 2 : 1), down];
}

/**
 * Where the catch of light has got to along a piece of jewellery, or -1 for the
 * long stretches when nothing is catching.
 *
 * Jewellery does not twinkle on a timer. It sits dark while the wearer is
 * still, and then the light runs along it — one bead, the next, the next — as
 * they shift their weight or turn their head, and is gone. So this is a *band*
 * travelling across the piece rather than a brightness applied to all of it:
 * the return value is a position, the frame step lights whichever beads are
 * near it, and a strand of ten catches in sequence over about a second.
 *
 * The band overshoots at both ends, entering at -0.25 and leaving at 1.25, so
 * the first and last beads get the same short catch as the ones in the middle
 * instead of the sweep appearing to begin and end on top of them.
 *
 * Rare on purpose. Once every five to eight seconds, seeded per portrait so a
 * contact sheet of forty never sparkles in chorus — the same rule the blink
 * follows, and for the same reason: simultaneity is what makes a grid of these
 * read as a screensaver.
 */
const GLINT_WINDOW = 0.2;

function glintSweep(time: number, seed: number): number {
  const period = 5000 + unit(seed, 'glint-period') * 3200;
  const offset = unit(seed, 'glint-phase') * period;
  const cycle = ((time + offset) % period) / period;
  if (cycle > GLINT_WINDOW) return -1;
  return (cycle / GLINT_WINDOW) * 1.5 - 0.25;
}

export function idleFrame(timeMs: number, options: IdleOptions): FrameState {
  const { seed, resting, mood, hairMoves, override, reducedMotion } = options;

  if (reducedMotion) {
    const [gazeX, gazeY] = restingGaze(seed, mood);
    return { expression: override || resting, blink: 'none', gazeX, gazeY, sway: 0, glint: -1 };
  }

  const [gazeX, gazeY] = gaze(timeMs, seed, mood);
  const micro = override ? null : microExpression(timeMs, seed, mood, resting);

  // Long hair drifts on a slow, seed-offset sine — two portraits side by side
  // never sway together.
  const phase = unit(seed, 'sway-phase') * Math.PI * 2;
  const sway = hairMoves ? Math.round(Math.sin(timeMs * 0.00052 + phase) * 1.4) : 0;

  return {
    expression: override || micro || resting,
    blink: blinkState(timeMs, seed, mood),
    gazeX,
    gazeY,
    sway: Math.max(-1, Math.min(1, sway)),
    glint: glintSweep(timeMs, seed),
  };
}
