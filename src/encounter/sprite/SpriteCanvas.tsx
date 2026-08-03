/**
 * encounter/sprite/SpriteCanvas.tsx
 *
 * The living figure — a player for the timeline in `anim.ts`, and nothing
 * more. Idle behaviour is seeded and clock-derived like the portraits (real
 * breathing, blinking off-beat, sidelong glances, a talk flap while their line
 * types out) and the battle animations are short envelopes over compiled pose
 * frames. Both live in `anim.ts` so the contact sheet can render exactly what
 * this component plays; frames compile lazily, so an idle figure costs four
 * rasters and a bow only pays for itself when someone bows.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Raster } from '../../components/portraitLab/core/raster';
import { HistoricalPersona } from '../../services/personaGenerator';
import { buildSpriteSource } from './spriteSource';
import { compileSprite, CompiledSprite, FrameId, SPRITE_H, SPRITE_W } from './drawSprite';
import { AnimFrame, animFrame, idleClock, idlePose, idleSway, SpriteAnim } from './anim';

export type { SpriteAnim };

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
    contentTop: compiled.contentTop,
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
    const h = (SPRITE_H - sheets.contentTop) * scale;
    const clock = idleClock(sheets.seed);

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
      const pose: FrameId = frame ? frame.pose
        : koSettled ? 'fallen'
        : idlePose(clock, now, talking);

      const dx = ((frame?.dx ?? 0) + idleSway(clock, now, pose)) * scale;
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
        // Shifted up by the crop, so the empty rows fall outside the canvas.
        ctx.drawImage(sheet, dx, dy - sheets.contentTop * scale, w, SPRITE_H * scale);
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
      height={(SPRITE_H - sheets.contentTop) * scale}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
