/**
 * encounter/sprite/anim.ts
 *
 * The animation timeline, headless.
 *
 * This used to live inside `SpriteCanvas.tsx`, where the only way to look at it
 * was to open the app and hope to catch a 300ms envelope with the eye. That is
 * why the animations have gone unexamined for so long: nothing could render
 * them but the browser, and nothing could render them *still*. Moving the
 * envelopes into a plain module makes them a data structure — `npm run
 * anim-sheet` samples this file, the canvas plays it, and both agree by
 * construction.
 *
 * An envelope is a function of elapsed milliseconds returning where the figure
 * is and which compiled pose it wears. It returns null when the envelope is
 * over, which is how the canvas knows to hand control back to the idle brain.
 */

import { unit } from '../../components/portraitLab/core/rng';
import { FrameId } from './drawSprite';

export type SpriteAnim =
  | 'lunge' | 'flinch' | 'dodge' | 'ko' | 'celebrate' | 'step'
  | 'reach' | 'shrug' | 'bow' | 'gesture';

export const ALL_ANIMS: SpriteAnim[] = [
  'lunge', 'flinch', 'dodge', 'ko', 'celebrate', 'step',
  'reach', 'shrug', 'bow', 'gesture',
];

export interface AnimFrame {
  /** Horizontal travel from the figure's rest position, in sprite pixels. */
  dx: number;
  /** Vertical travel. Negative is up. */
  dy: number;
  pose: FrameId;
  /** White flash over the figure, 0…1 — impact and the moment of a KO. */
  flash: number;
}

/**
 * How long each envelope runs, in ms. `ko` has no end — the figure stays down —
 * so its entry is how long it takes to *settle*, which is what a contact sheet
 * wants to show.
 */
export const ANIM_MS: Record<SpriteAnim, number> = {
  lunge: 560,
  flinch: 420,
  dodge: 380,
  ko: 900,
  celebrate: 900,
  step: 420,
  reach: 700,
  shrug: 360,
  bow: 1350,
  gesture: 1100,
};

/**
 * t is ms since the command started. Returns null when the envelope is over.
 * Distances are in sprite pixels on the 220×330 grid.
 */
export function animFrame(anim: SpriteAnim, t: number): AnimFrame | null {
  const ease = (v: number) => 1 - (1 - v) * (1 - v);
  switch (anim) {
    case 'lunge': {
      // Wind up onto the back foot, drive off it, recover. The step poses carry
      // the legs: a figure that crosses forty pixels with its feet nailed to
      // the floor is skating, and that was the loudest fault in the set.
      if (t < 140) return { dx: -Math.round(8 * (t / 140)), dy: 0, pose: 'stepBack', flash: 0 };
      if (t < 320) return { dx: Math.round(-8 + 44 * ease((t - 140) / 180)), dy: -2, pose: 'lunge', flash: 0 };
      if (t < 440) return { dx: Math.round(36 * (1 - (t - 320) / 240)), dy: 0, pose: 'stepFwd', flash: 0 };
      if (t < 560) return { dx: Math.round(36 * (1 - (t - 320) / 240)), dy: 0, pose: 'stand', flash: 0 };
      return null;
    }
    case 'flinch': {
      if (t >= 420) return null;
      const shake = Math.round(Math.sin(t / 26) * 6 * (1 - t / 420));
      // The recoil is a pose, not just a shake: the near shoulder comes up and
      // the weight goes onto the back foot for the first third.
      const pose: FrameId = t < 200 ? 'recoil' : 'stand';
      return { dx: shake - 6, dy: 0, pose, flash: t < 110 ? 0.75 * (1 - t / 110) : 0 };
    }
    case 'dodge': {
      if (t < 120) return { dx: -Math.round(24 * ease(t / 120)), dy: 0, pose: 'stepBack', flash: 0 };
      if (t < 300) return { dx: -Math.round(24 * (1 - (t - 120) / 260)), dy: 0, pose: 'stepBack', flash: 0 };
      if (t < 380) return { dx: -Math.round(24 * (1 - (t - 120) / 260)), dy: 0, pose: 'stand', flash: 0 };
      return null;
    }
    case 'ko': {
      if (t < 260) return { dx: 0, dy: 0, pose: 'recoil', flash: t < 120 ? 0.6 : 0 };
      if (t < 700) {
        const drop = ease((t - 260) / 440);
        return { dx: Math.round(12 * drop), dy: Math.round(-20 * (1 - drop)), pose: 'fallen', flash: 0 };
      }
      return { dx: 12, dy: 0, pose: 'fallen', flash: 0 };
    }
    case 'celebrate': {
      if (t >= 900) return null;
      // Crouch, then leave the ground. A hop whose legs never bend is a figure
      // being lifted by something, not one jumping.
      const hop = Math.abs(Math.sin(t / 145));
      const pose: FrameId = hop < 0.25 ? 'crouch' : 'raise';
      return { dx: 0, dy: -Math.round(hop * 16), pose, flash: 0 };
    }
    case 'step': {
      if (t < 160) return { dx: Math.round(14 * ease(t / 160)), dy: 0, pose: 'stepFwd', flash: 0 };
      if (t < 300) return { dx: Math.round(14 * (1 - (t - 160) / 260)), dy: 0, pose: 'stepFwd', flash: 0 };
      if (t < 420) return { dx: Math.round(14 * (1 - (t - 160) / 260)), dy: 0, pose: 'stand', flash: 0 };
      return null;
    }
    case 'reach': {
      if (t >= 700) return null;
      return { dx: t < 100 ? Math.round(6 * (t / 100)) : 6, dy: 0, pose: 'reach', flash: 0 };
    }
    case 'shrug': {
      if (t >= 360) return null;
      return { dx: 0, dy: -Math.round(Math.abs(Math.sin(t / 115)) * 4), pose: 'shrug', flash: 0 };
    }
    case 'bow': {
      // Dip in, hold the deep bow (eyes closed), rise back through the
      // light bend — a real bend at the waist, not a translated sprite.
      if (t < 200) return { dx: 0, dy: 0, pose: 'bowLight', flash: 0 };
      if (t < 1050) return { dx: 2, dy: 0, pose: 'bowDeep', flash: 0 };
      if (t < 1350) return { dx: 0, dy: 0, pose: 'bowLight', flash: 0 };
      return null;
    }
    case 'gesture': {
      // The open-handed offer, held through a beat of speech.
      if (t >= 1100) return null;
      return { dx: t < 120 ? Math.round(3 * (t / 120)) : 3, dy: 0, pose: 'offer', flash: 0 };
    }
  }
}

// ---------------------------------------------------------------------------
// The idle brain. Also headless, for the same reason.
// ---------------------------------------------------------------------------

export function blinkNow(time: number, seed: number): boolean {
  const period = 3400 + unit(seed, 'blink-period') * 1600;
  const index = Math.floor(time / period);
  const offset = unit(seed, `blink-${index}`) * period * 0.7;
  const elapsed = time - (index * period + offset);
  return elapsed >= 0 && elapsed < 150;
}

/** A sidelong glance every so often, held for most of a second. */
export function glanceNow(time: number, seed: number): boolean {
  const period = 6800 + unit(seed, 'glance-period') * 4200;
  const index = Math.floor(time / period);
  if (unit(seed, `glance-${index}`) < 0.45) return false;
  const offset = unit(seed, `glance-at-${index}`) * period * 0.6;
  const elapsed = time - (index * period + offset);
  return elapsed >= 0 && elapsed < 850;
}

/** The four idle frames, in cycle order. */
export const IDLE_FRAMES: FrameId[] = ['stand', 'stand2', 'standBreathe', 'standBreathe2'];

export interface IdleClock {
  seed: number;
  breathePeriod: number;
  swayPeriod: number;
}

export function idleClock(seed: number): IdleClock {
  return {
    seed,
    breathePeriod: 2800 + unit(seed, 'breath') * 1000,
    swayPeriod: 5200 + unit(seed, 'sway') * 1800,
  };
}

/**
 * Which pose an un-commanded figure wears at this instant. Breathing is the
 * base layer; blinks, glances and the talk flap override the face while the
 * chest keeps its rhythm.
 */
export function idlePose(clock: IdleClock, now: number, talking: boolean): FrameId {
  if (talking && Math.floor(now / 130) % 2 === 0) return 'talk';
  if (blinkNow(now, clock.seed)) return 'blink';
  if (!talking && glanceNow(now, clock.seed)) return 'glance';
  const cycle = ((now / clock.breathePeriod) % 1 + 1) % 1;
  return IDLE_FRAMES[Math.floor(cycle * 4) % 4];
}

/** A slow, one-pixel weight shift that keeps a stance alive without reading as movement. */
export function idleSway(clock: IdleClock, now: number, pose: FrameId): number {
  const settled = pose === 'stand' || pose === 'standBreathe' || pose === 'glance';
  return settled ? Math.round(Math.sin((now / clock.swayPeriod) * Math.PI * 2) * 1) : 0;
}
