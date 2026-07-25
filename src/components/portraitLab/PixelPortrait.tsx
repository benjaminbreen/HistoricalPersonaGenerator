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
import { buildPortraitSpec, normalizeExpression, PortraitSource, restingExpression } from './spec/buildSpec';
import { Expression } from './spec/types';
import { compilePortrait, renderFrame, FrameState } from './render/pipeline';
import { idleFrame } from './render/animation';

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
    const n = compiled.size;
    if (breath === 0) {
      ctx.drawImage(off, 0, 0);
    } else {
      // Shift the whole bust by a pixel, then repeat the edge row so the
      // vacated line never shows as a seam.
      ctx.drawImage(off, 0, 0, n, n - 1, 0, breath > 0 ? 1 : 0, n, n - 1);
      const srcRow = breath > 0 ? 0 : n - 1;
      const destRow = breath > 0 ? 0 : n - 1;
      ctx.drawImage(off, 0, srcRow, n, 1, 0, destRow, n, 1);
    }
  }, [compiled]);

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
      out.height = compiled.size * scale;
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
      height={compiled.size}
      className={className}
      style={{
        width: size,
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
