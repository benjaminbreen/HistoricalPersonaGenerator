/**
 * encounter/sprite/SpriteCanvas.tsx
 *
 * The living figure. Idle behaviour is seeded and clock-derived like the
 * portraits — real breathing (the chest rises, the waist holds), blinking
 * off-beat, sidelong glances, a talk flap while their line types out —
 * and the battle animations are short envelopes over compiled pose frames:
 * anticipate, thrust, return. Frames compile lazily, so an idle figure
 * costs four rasters and a bow only pays for itself when someone bows.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Raster } from '../../components/portraitLab/core/raster';
import { unit } from '../../components/portraitLab/core/rng';
import { HistoricalPersona } from '../../services/personaGenerator';
import { buildSpriteSource } from './spriteSource';
import { compileSprite, CompiledSprite, FrameId, SPRITE_H, SPRITE_W } from './drawSprite';

export type SpriteAnim =
  | 'lunge' | 'flinch' | 'dodge' | 'ko' | 'celebrate' | 'step'
  | 'reach' | 'shrug' | 'bow' | 'gesture';

export interface SpriteCommand {
  anim: SpriteAnim;
  /** Changing key replays the same anim. */
  key: number;
}

interface Props {
  persona: HistoricalPersona;
  /** Which way the figure faces. Native art faces right. */
  facing: 'right' | 'left';
  scale?: number;
  talking?: boolean;
  ko?: boolean;
  command?: SpriteCommand | null;
  onCommandDone?: (anim: SpriteAnim) => void;
}

const FRAME_MS = 1000 / 24;

function rasterToCanvas(raster: Raster): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(raster.data), raster.width, raster.height), 0, 0);
  return canvas;
}

/** Lazy sheet cache over the lazy frame cache. */
function makeSheets(compiled: CompiledSprite) {
  const cache = new Map<FrameId, HTMLCanvasElement>();
  return {
    seed: compiled.seed,
    sheet(id: FrameId): HTMLCanvasElement {
      const hit = cache.get(id);
      if (hit) return hit;
      const canvas = rasterToCanvas(compiled.frame(id));
      cache.set(id, canvas);
      return canvas;
    },
  };
}

type Sheets = ReturnType<typeof makeSheets>;

interface AnimFrame {
  dx: number;
  dy: number;
  pose: FrameId;
  flash: number;
}

/**
 * t is ms since the command started. Returns null when the envelope is over.
 * Distances are in sprite pixels on the 192×352 grid.
 */
function animFrame(anim: SpriteAnim, t: number): AnimFrame | null {
  const ease = (v: number) => 1 - (1 - v) * (1 - v);
  switch (anim) {
    case 'lunge': {
      if (t < 140) return { dx: -Math.round(8 * (t / 140)), dy: 0, pose: 'stand', flash: 0 };
      if (t < 320) return { dx: Math.round(-8 + 44 * ease((t - 140) / 180)), dy: -2, pose: 'reach', flash: 0 };
      if (t < 560) return { dx: Math.round(36 * (1 - (t - 320) / 240)), dy: 0, pose: 'stand', flash: 0 };
      return null;
    }
    case 'flinch': {
      if (t >= 420) return null;
      const shake = Math.round(Math.sin(t / 26) * 6 * (1 - t / 420));
      return { dx: shake - 6, dy: 0, pose: 'stand', flash: t < 110 ? 0.75 * (1 - t / 110) : 0 };
    }
    case 'dodge': {
      if (t < 120) return { dx: -Math.round(24 * ease(t / 120)), dy: 0, pose: 'stand', flash: 0 };
      if (t < 380) return { dx: -Math.round(24 * (1 - (t - 120) / 260)), dy: 0, pose: 'stand', flash: 0 };
      return null;
    }
    case 'ko': {
      if (t < 260) return { dx: 0, dy: 0, pose: 'stand', flash: t < 120 ? 0.6 : 0 };
      if (t < 700) {
        const drop = ease((t - 260) / 440);
        return { dx: Math.round(12 * drop), dy: Math.round(-20 * (1 - drop)), pose: 'fallen', flash: 0 };
      }
      return { dx: 12, dy: 0, pose: 'fallen', flash: 0 };
    }
    case 'celebrate': {
      if (t >= 900) return null;
      const hop = Math.abs(Math.sin(t / 145));
      return { dx: 0, dy: -Math.round(hop * 16), pose: 'raise', flash: 0 };
    }
    case 'step': {
      if (t < 160) return { dx: Math.round(14 * ease(t / 160)), dy: 0, pose: 'stand', flash: 0 };
      if (t < 420) return { dx: Math.round(14 * (1 - (t - 160) / 260)), dy: 0, pose: 'stand', flash: 0 };
      return null;
    }
    case 'reach': {
      if (t >= 700) return null;
      return { dx: t < 100 ? Math.round(6 * (t / 100)) : 6, dy: 0, pose: 'reach', flash: 0 };
    }
    case 'shrug': {
      if (t >= 360) return null;
      return { dx: 0, dy: -Math.round(Math.abs(Math.sin(t / 115)) * 4), pose: 'stand', flash: 0 };
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

function blinkNow(time: number, seed: number): boolean {
  const period = 3400 + unit(seed, 'blink-period') * 1600;
  const index = Math.floor(time / period);
  const offset = unit(seed, `blink-${index}`) * period * 0.7;
  const elapsed = time - (index * period + offset);
  return elapsed >= 0 && elapsed < 150;
}

/** A sidelong glance every so often, held for most of a second. */
function glanceNow(time: number, seed: number): boolean {
  const period = 6800 + unit(seed, 'glance-period') * 4200;
  const index = Math.floor(time / period);
  if (unit(seed, `glance-${index}`) < 0.45) return false;
  const offset = unit(seed, `glance-at-${index}`) * period * 0.6;
  const elapsed = time - (index * period + offset);
  return elapsed >= 0 && elapsed < 850;
}

export default function SpriteCanvas({
  persona, facing, scale = 1, talking = false, ko = false, command = null, onCommandDone,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const commandRef = useRef<{ cmd: SpriteCommand; startedAt: number } | null>(null);
  const doneRef = useRef(onCommandDone);
  doneRef.current = onCommandDone;

  const sheets: Sheets = useMemo(() => {
    const source = buildSpriteSource(persona.character);
    return makeSheets(compileSprite(source));
  }, [persona]);

  useEffect(() => {
    if (command) commandRef.current = { cmd: command, startedAt: performance.now() };
  }, [command]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let last = 0;
    const w = SPRITE_W * scale;
    const h = SPRITE_H * scale;
    const breathePeriod = 2800 + unit(sheets.seed, 'breath') * 1000;
    const swayPeriod = 5200 + unit(sheets.seed, 'sway') * 1800;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < FRAME_MS) return;
      last = now;

      let frame: AnimFrame | null = null;
      const active = commandRef.current;
      if (active) {
        frame = animFrame(active.cmd.anim, now - active.startedAt);
        if (!frame) {
          commandRef.current = null;
          doneRef.current?.(active.cmd.anim);
        }
      }

      const koSettled = ko && !frame;

      // The idle brain: breathing is the base layer; blinks, glances, and
      // the talk flap override the face while the chest keeps its rhythm.
      let pose: FrameId;
      if (frame) {
        pose = frame.pose;
      } else if (koSettled) {
        pose = 'fallen';
      } else {
        const inhale = Math.sin((now / breathePeriod) * Math.PI * 2) > 0.1;
        if (talking && Math.floor(now / 130) % 2 === 0) pose = 'talk';
        else if (blinkNow(now, sheets.seed)) pose = 'blink';
        else if (!talking && glanceNow(now, sheets.seed)) pose = 'glance';
        else pose = inhale ? 'standBreathe' : 'stand';
      }

      // A slow, one-pixel weight shift keeps the stance alive without
      // reading as movement.
      const sway = pose === 'stand' || pose === 'standBreathe' || pose === 'glance'
        ? Math.round(Math.sin((now / swayPeriod) * Math.PI * 2) * 1)
        : 0;
      const dx = ((frame?.dx ?? 0) + sway) * scale;
      const dy = (frame?.dy ?? 0) * scale;

      const sheet = sheets.sheet(pose);

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      if (facing === 'left') {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      if (pose === 'fallen') {
        // Fallen art is H wide × W tall; sit it on the ground line.
        ctx.drawImage(
          sheet,
          Math.round((w - SPRITE_H * scale) / 2) + dx,
          h - SPRITE_W * scale + dy,
          SPRITE_H * scale, SPRITE_W * scale
        );
      } else {
        ctx.drawImage(sheet, dx, dy, w, h);
      }
      if (frame && frame.flash > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = `rgba(255,255,255,${frame.flash})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [sheets, facing, scale, talking, ko]);

  return (
    <canvas
      ref={canvasRef}
      className="encounter-sprite"
      width={SPRITE_W * scale}
      height={SPRITE_H * scale}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
