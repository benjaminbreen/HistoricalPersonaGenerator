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
const GAZE_MS = 1900;

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

function gaze(time: number, seed: number, mood: MoodSpec): [number, number] {
  const period = GAZE_MS * (1.4 - mood.energy * 0.6);
  const index = Math.floor(time / period);
  const roll = unit(seed, `gaze-${index}`);
  // Guarded people hold still; open ones look around.
  const stillness = 0.35 + mood.guarded * 0.35;
  if (roll < stillness) return [0, 0];
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

export function idleFrame(timeMs: number, options: IdleOptions): FrameState {
  const { seed, resting, mood, hairMoves, override, reducedMotion } = options;

  if (reducedMotion) {
    return { expression: override || resting, blink: 'none', gazeX: 0, gazeY: 0, sway: 0 };
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
  };
}
