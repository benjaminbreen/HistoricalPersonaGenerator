/**
 * portraitLab/PixelPortrait.tsx
 *
 * The React surface. Deliberately prop-compatible with the existing
 * ProceduralPortrait so the two can be swapped at any call site.
 *
 * The canvas backing store is the art's own 96×96; CSS scales it up with
 * `image-rendering: pixelated`, so a pixel is always a pixel no matter what
 * size the layout asks for. Animation runs at 24fps — high enough for a blink
 * to read, low enough that a page of portraits costs nothing — and stops
 * entirely when the portrait scrolls out of view or the reader has asked for
 * reduced motion.
 */

import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import { Raster } from './core/raster';
import {
  portraitMarkFor,
  drawDistinctionMark,
  drawPortraitFrame,
  FRAME_WIDTH,
  MARK_SIZE,
  MOUNT_Y,
} from './art/distinctionMark';
import { buildPortraitSpec, normalizeExpression, PortraitSource, restingExpression } from './spec/buildSpec';
import { CANVAS, VIEW_HEIGHT } from './spec/anatomy';
import { Expression } from './spec/types';
import { compilePortrait, renderFrame, FrameState } from './render/pipeline';
import { idleFrame } from './render/animation';

/**
 * Where the corner mark lands, in percentages of the displayed canvas.
 *
 * The mark is painted into the canvas rather than laid over it in the DOM,
 * which is right — it is part of the picture and it has to survive a PNG export
 * — but it means nothing can be hovered. So the card puts an invisible target
 * over it, and takes the arithmetic from here rather than repeating the
 * constants, which is how a hotspot ends up two pixels off the thing it is
 * supposed to be on.
 */
export const MARK_HOTSPOT = (() => {
  const inset = Math.max(FRAME_WIDTH + 1, MOUNT_Y + 2);
  return {
    rightPct: (inset / CANVAS) * 100,
    topPct: (inset / VIEW_HEIGHT) * 100,
    widthPct: (MARK_SIZE / CANVAS) * 100,
    heightPct: (MARK_SIZE / VIEW_HEIGHT) * 100,
  };
})();

export interface PixelPortraitHandle {
  /** A PNG of the current frame, for PDF export and downloads. */
  toDataURL: (scale?: number) => string | null;
  canvas: () => HTMLCanvasElement | null;
}

export interface PixelPortraitProps {
  character: PortraitSource;
  size?: number;
  className?: string;
  temporaryExpression?: string | null;
  onExpressionComplete?: () => void;
  /** Accepted for parity with ProceduralPortrait; the spec adapter honours it. */
  useEquippedItems?: boolean;
  animated?: boolean;
  /** How long a temporary expression holds before returning to rest. */
  expressionHoldMs?: number;
  title?: string;
  /** Reports the generated portrait's dominant backdrop color to its layout. */
  onBackdropColor?: (color: string) => void;
}

const FRAME_MS = 1000 / 24;

/** Everything that changes what gets drawn, and nothing that does not. */
function portraitSignature(character: PortraitSource): string {
  return JSON.stringify([
    character.portraitSeed,
    character.name,
    character.age,
    character.gender,
    character.health,
    character.maxHealth,
    character.fatigue,
    character.wealthLevel,
    character.culturalZone,
    character.era,
    character.profession,
    character.appearance,
    character.equippedItems?.head,
    character.equippedItems?.torso,
    character.portraitVisualOverrides,
    character.diseaseHealth,
    character.personality,
    // Both touch the backdrop, so a persona that gains a standing must
    // recompile — otherwise the ground stays whatever the last one had.
    character.rarityTier,
    character.hasDistinction,
    character.distinctionShare,
  ]);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const PixelPortrait = forwardRef<PixelPortraitHandle, PixelPortraitProps>(function PixelPortrait(
  {
    character,
    size = 192,
    className = '',
    temporaryExpression = null,
    onExpressionComplete,
    animated = true,
    expressionHoldMs = 2200,
    title,
    onBackdropColor,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const workRef = useRef<Raster | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const [visible, setVisible] = useState(true);

  // Memoising on object identity would recompile (~10-30ms) whenever a caller
  // rebuilds the character object, which several places in the app do on every
  // render. Keying on the fields that actually affect the drawing is cheap and
  // makes the component safe to drop anywhere.
  const signature = portraitSignature(character);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const spec = useMemo(() => buildPortraitSpec(character), [signature]);
  const compiled = useMemo(() => compilePortrait(spec), [spec]);
  const resting = useMemo(() => restingExpression(spec.mood, spec.condition), [spec]);

  useEffect(() => {
    onBackdropColor?.(spec.background.base);
  }, [onBackdropColor, spec.background.base]);

  // Only the rarest standings are marked, and the threshold is the share of the
  // population that held them rather than the fact of holding one. Failing
  // that, the persona's own rarity — the figure the card states in words.
  const distinction = portraitMarkFor(
    (character as { distinctionShare?: number }).distinctionShare,
    (character as { profession?: string }).profession,
    (character as { rarityTier?: string }).rarityTier,
  );

  const [override, setOverride] = useState<Expression | null>(null);

  // A temporary expression from the app (hover, click-to-cycle) wins until it
  // times out, then the persona settles back into its own resting face.
  useEffect(() => {
    const mapped = normalizeExpression(temporaryExpression);
    setOverride(mapped);
    if (!mapped) return undefined;
    const timer = window.setTimeout(() => {
      setOverride(null);
      onExpressionComplete?.();
    }, expressionHoldMs);
    return () => window.clearTimeout(timer);
  }, [temporaryExpression, expressionHoldMs, onExpressionComplete]);

  const paint = useCallback((state: FrameState, breath: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!workRef.current) workRef.current = new Raster(compiled.size, compiled.size);
    const work = workRef.current;
    renderFrame(compiled, state, work);

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement('canvas');
      offscreenRef.current.width = compiled.size;
      offscreenRef.current.height = compiled.size;
    }
    const off = offscreenRef.current;
    const offCtx = off.getContext('2d');
    if (!offCtx) return;
    const image = offCtx.createImageData(compiled.size, compiled.size);
    image.data.set(work.data);
    offCtx.putImageData(image, 0, 0);

    ctx.imageSmoothingEnabled = false;
    const width = compiled.size;
    const height = VIEW_HEIGHT;

    // The canvas is drawn square and shown short: the mount is already part of
    // the anatomy, so the figure — background, shoulders, chest and all — is
    // painted at its final position and the rows past `VIEW_HEIGHT` simply run
    // off the bottom the way the shoulders always did.
    if (breath === 0) {
      ctx.drawImage(off, 0, 0, width, height, 0, 0, width, height);
    } else {
      // Shift the whole bust by a pixel, then repeat the edge row so the
      // vacated line never shows as a seam.
      ctx.drawImage(off, 0, 0, width, height - 1, 0, 1, width, height - 1);
      ctx.drawImage(off, 0, 0, width, 1, 0, 0, width, 1);
    }

    // Painted last and over the finished bust, so neither rides the breath
    // shift above. A badge that bobbed with the chest would read as part of the
    // drawing rather than as a note about it.
    drawPortraitFrame(ctx, width, height, distinction);
    drawDistinctionMark(
      ctx,
      // Inside the frame and inside the mount, so the mark sits on the picture
      // rather than on its edge.
      { width, height, inset: Math.max(FRAME_WIDTH + 1, MOUNT_Y + 2) },
      distinction,
      performance.now(),
    );
  }, [compiled, distinction]);

  // Static render whenever the portrait, expression, or animation flag changes.
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const shouldAnimate = animated && visible && !reduced;

    if (!shouldAnimate) {
      paint(
        idleFrame(0, {
          seed: spec.seed,
          resting,
          mood: spec.mood,
          hairMoves: false,
          override,
          reducedMotion: true,
        }),
        0
      );
      return undefined;
    }

    if (!startRef.current) startRef.current = performance.now();
    const hairMoves = spec.hairLength === 'long' || spec.hairLength === 'very_long';
    const breathPhase = (spec.seed % 1000) / 1000 * Math.PI * 2;
    let last = 0;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      const t = now - startRef.current;
      const state = idleFrame(t, {
        seed: spec.seed,
        resting,
        mood: spec.mood,
        hairMoves,
        override,
      });
      const breath = Math.sin(t * 0.00095 + breathPhase) > 0.62 ? 1 : 0;
      paint(state, breath);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [animated, visible, paint, spec, resting, override]);

  // Portraits off screen do no work at all.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      entries => setVisible(entries.some(entry => entry.isIntersecting)),
      { rootMargin: '96px' }
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useImperativeHandle(ref, () => ({
    toDataURL: (scale = 4) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const out = document.createElement('canvas');
      out.width = compiled.size * scale;
      out.height = VIEW_HEIGHT * scale;
      const ctx = out.getContext('2d');
      if (!ctx) return null;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(canvas, 0, 0, out.width, out.height);
      return out.toDataURL('image/png');
    },
    canvas: () => canvasRef.current,
  }), [compiled.size]);

  return (
    <canvas
      ref={canvasRef}
      width={compiled.size}
      height={VIEW_HEIGHT}
      className={className}
      style={{
        // `size` stays the caller's idea of how tall a portrait is, so every
        // existing call site keeps its layout; the mount adds width.
        width: Math.round(size * compiled.size / VIEW_HEIGHT),
        height: size,
        imageRendering: 'pixelated',
        display: 'block',
      }}
      role="img"
      aria-label={title || `Portrait of ${character.name || 'a historical persona'}`}
    />
  );
});

export default PixelPortrait;
