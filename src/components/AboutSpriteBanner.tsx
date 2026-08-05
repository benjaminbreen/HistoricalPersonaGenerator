/**
 * components/AboutSpriteBanner.tsx
 *
 * The About panel's header, generated rather than illustrated: a crowd of
 * people the app made a second ago, standing on the rule that divides the
 * banner from the title. Stock art can say a project is about history; only
 * the generator's own output can say what this one actually produces, and
 * fourteen strangers in fourteen sets of clothes say it faster than the list
 * of features underneath them does.
 *
 * Two things shape the implementation. A figure costs about 40ms to draw —
 * 10ms to invent the person, 30ms to render them — so fourteen of them would
 * stall the modal for half a second if they were made up front; they are made
 * one per timeout instead, and the crowd assembles into a header that was
 * already on screen. And the whole scene is repainted from cached canvases
 * whenever a new figure lands, because the back rank has to sit behind the
 * haze and the front rank in front of it, which a single append cannot do.
 */

import React, { useEffect, useRef, useState } from 'react';
import { generateHistoricalPersona } from '../services/personaGenerator';
import { buildSpriteSource } from '../encounter/sprite/spriteSource';
import { compileSprite } from '../encounter/sprite/drawSprite';
import { makeRng } from './portraitLab/core/rng';

/**
 * Median height of a cropped standing sprite, over a 40-draw sample (the
 * spread is 160–232: this set contains children as well as adults). Scaling
 * every figure against one constant rather than against its own height is
 * what keeps that spread — normalising each to the rank height would stand a
 * six-year-old eye to eye with a blacksmith.
 */
const REF_HEIGHT = 200;

/** Who a figure is, for the tooltip. */
interface Identity {
  name: string;
  born: string;
  place: string;
}

interface Figure {
  /** The sprite, cropped to its own ink so the crowd can be packed tightly. */
  canvas: HTMLCanvasElement;
  w: number;
  h: number;
  /**
   * One byte per pixel, non-zero where the figure is.
   *
   * A bounding box is the wrong hit target here: a person in a wide skirt with
   * a fishing net in one hand claims a rectangle that is mostly the gap either
   * side of them, and their neighbour's shoulder falls inside it. Kept as a
   * mask so a hover can be resolved against the actual ink without a
   * `getImageData` readback on every mouse move.
   */
  mask: Uint8Array;
  who: Identity;
}

/** The app's year convention, matched exactly. */
function yearLabel(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

interface Slot {
  /** Centre of the figure, in CSS pixels. */
  x: number;
  /** The line the figure's feet stand on. */
  ground: number;
  /** Multiplier on `REF_HEIGHT`, so the back rank reads as further away. */
  scale: number;
  rank: 'back' | 'front';
  /** The art is drawn facing one way. A rank of it reads as a chorus line. */
  flip: boolean;
}

/** Crop a compiled frame to its alpha bounds and hand back a drawable canvas. */
function cropToInk(
  raster: { data: Uint8ClampedArray; width: number; height: number },
  who: Identity
): Figure | null {
  let x0 = raster.width;
  let x1 = -1;
  let y0 = raster.height;
  let y1 = -1;
  for (let y = 0; y < raster.height; y += 1) {
    for (let x = 0; x < raster.width; x += 1) {
      if (raster.data[(y * raster.width + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const full = document.createElement('canvas');
  full.width = raster.width;
  full.height = raster.height;
  const fullCtx = full.getContext('2d');
  if (!fullCtx) return null;
  fullCtx.putImageData(new ImageData(new Uint8ClampedArray(raster.data), raster.width, raster.height), 0, 0);

  const cut = document.createElement('canvas');
  cut.width = w;
  cut.height = h;
  const cutCtx = cut.getContext('2d');
  if (!cutCtx) return null;
  cutCtx.drawImage(full, x0, y0, w, h, 0, 0, w, h);

  // The ground shadow is part of the sprite's alpha, and hovering a patch of
  // shadow two feet from anybody is not hovering a person — so the mask takes
  // only pixels solid enough to be the figure itself.
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      mask[y * w + x] = raster.data[((y + y0) * raster.width + (x + x0)) * 4 + 3] > 128 ? 1 : 0;
    }
  }
  return { canvas: cut, w, h, mask, who };
}

/**
 * Where everyone stands.
 *
 * The two ranks are counted independently rather than split from one total,
 * so a phone gets a smaller crowd instead of the same crowd overlapping, and
 * the counts never divide evenly — six behind eight means the back rank shows
 * through the gaps rather than hiding directly behind someone.
 */
function layoutSlots(width: number, height: number, seed: number): Slot[] {
  const front = Math.max(3, Math.min(8, Math.round(width / 96)));
  const back = Math.max(2, Math.min(6, front - 2));
  const rng = makeRng(seed ^ 0x5eed);
  const slots: Slot[] = [];

  const backGround = height * 0.86;
  for (let i = 0; i < back; i += 1) {
    const step = width / back;
    slots.push({
      x: (i + 0.5) * step + (rng() - 0.5) * step * 0.34,
      ground: backGround + (rng() - 0.5) * height * 0.03,
      scale: 0.52 + rng() * 0.05,
      rank: 'back',
      flip: rng() < 0.45,
    });
  }

  const frontGround = height - 2;
  for (let i = 0; i < front; i += 1) {
    const step = width / front;
    slots.push({
      x: (i + 0.5) * step + (rng() - 0.5) * step * 0.24,
      ground: frontGround,
      scale: 0.76 + rng() * 0.06,
      rank: 'front',
      flip: rng() < 0.45,
    });
  }
  return slots;
}

/** Fisher–Yates over the slot indices, so the crowd fills in scattered. */
function shuffledOrder(count: number, seed: number): number[] {
  const rng = makeRng(seed ^ 0x0dd1e);
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** A figure as it was actually drawn, in CSS pixels. */
interface Placement {
  figure: Figure;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
  flip: boolean;
}

interface Hover {
  who: Identity;
  x: number;
  y: number;
}

interface Props {
  /** Pinned only by the sheet tools. Left off, the crowd is new every open. */
  seed?: number;
}

export default function AboutSpriteBanner({ seed: pinnedSeed }: Props) {
  const [seed] = useState(() => pinnedSeed ?? ((Math.random() * 0x7fffffff) >>> 0));
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  /** Slot index → figure. Sparse while the crowd is still assembling. */
  const figuresRef = useRef<Map<number, Figure>>(new Map());
  /** Written by the paint, read by the hover. Back rank first. */
  const placedRef = useRef<Placement[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Painting once after a batch is complete keeps the modal's opening
  // animation on a stable texture. Repainting after every generated person
  // made Chromium briefly composite a cleared canvas between frames.
  const [paintRevision, setPaintRevision] = useState(0);
  const [hover, setHover] = useState<Hover | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = (entry?: ResizeObserverEntry) => {
      // contentRect/clientWidth are layout dimensions. getBoundingClientRect
      // includes the modal's opening scale transform and could permanently
      // size the backing canvas from a transient animation frame.
      const w = Math.round(entry?.contentRect.width ?? wrap.clientWidth);
      const h = Math.round(entry?.contentRect.height ?? wrap.clientHeight);
      if (!w || !h) return;
      setSize((current) => (current.w === w && current.h === h ? current : { w, h }));
    };
    measure();
    const observer = new ResizeObserver((entries) => measure(entries[0]));
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  // Slots depend on the measured box, but the people do not: a resize
  // rearranges the crowd it already has rather than inventing a new one.
  const slots = React.useMemo(
    () => (size.w > 0 && size.h > 0 ? layoutSlots(size.w, size.h, seed) : []),
    [size.w, size.h, seed]
  );

  useEffect(() => {
    if (!slots.length) return;

    // Only the places that are still empty. A resize that adds a slot costs
    // one new person rather than a fresh crowd, and one that removes a slot
    // costs nothing — the figures are held by slot index, so shrinking and
    // growing again puts the same people back where they were standing.
    const order = shuffledOrder(slots.length, seed).filter((i) => !figuresRef.current.has(i));
    if (!order.length) return;
    let cancelled = false;
    let timer = 0;
    let idleRequest: number | null = null;
    let step = 0;

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const scheduleNext = (delay = 0) => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        if (idleWindow.requestIdleCallback) {
          idleRequest = idleWindow.requestIdleCallback(next, { timeout: 160 });
        } else {
          timer = window.setTimeout(next, 32);
        }
      }, delay);
    };

    const next = () => {
      if (cancelled) return;
      if (step >= order.length) {
        setPaintRevision((revision) => revision + 1);
        return;
      }
      const slot = order[step];
      try {
        const persona = generateHistoricalPersona({ seed: (seed + slot * 7919) >>> 0, samplingMode: 'explore' });
        const frame = compileSprite(buildSpriteSource(persona.character)).frame('stand');
        const age = Number(persona.character.age);
        const figure = cropToInk(frame, {
          name: persona.character.name,
          born: yearLabel(Number.isFinite(age) ? persona.year - age : persona.year),
          place: persona.location,
        });
        if (figure) figuresRef.current.set(slot, figure);
      } catch {
        // One unlucky draw should leave a gap in the crowd, not an empty header.
      }
      step += 1;
      scheduleNext();
    };

    // The modal finishes its 250ms entrance before sprite compilation begins.
    // Each figure is then compiled in a separate idle task, while the visible
    // canvas keeps showing the same painted ground until the whole batch lands.
    scheduleNext(300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleRequest !== null) idleWindow.cancelIdleCallback?.(idleRequest);
    };
    // `slots.length` rather than `slots`: a resize that keeps the same number
    // of places moves people, and needs no new ones.
  }, [seed, slots.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w || !size.h) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pixelWidth = Math.round(size.w * dpr);
    const pixelHeight = Math.round(size.h * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { w, h } = size;
    ctx.clearRect(0, 0, w, h);

    // Ground: the encounter scene's warm dark, lit from low and behind.
    const ground = ctx.createLinearGradient(0, 0, 0, h);
    ground.addColorStop(0, '#2b211a');
    ground.addColorStop(0.62, '#221a14');
    ground.addColorStop(1, '#15100b');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, w, h);

    const glow = ctx.createRadialGradient(w * 0.5, h * 0.92, 0, w * 0.5, h * 0.92, Math.max(w * 0.6, h * 1.4));
    glow.addColorStop(0, 'rgba(217, 119, 87, 0.30)');
    glow.addColorStop(0.42, 'rgba(197, 149, 99, 0.11)');
    glow.addColorStop(1, 'rgba(197, 149, 99, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.imageSmoothingEnabled = false;

    // Where everybody actually landed, kept for the hover test. Recording it
    // here rather than recomputing it on mouse move is what makes the two
    // agree: the clamp below is the sort of adjustment a second implementation
    // would forget, and a tooltip that names the wrong person is worse than no
    // tooltip. Front rank last, so a later entry is the one drawn on top.
    const placed: Placement[] = [];

    const drawRank = (rank: Slot['rank']) => {
      slots.forEach((slot, index) => {
        if (slot.rank !== rank) return;
        const figure = figuresRef.current.get(index);
        if (!figure) return;
        // Scaling against a constant keeps the spread in stature, which also
        // means the tallest draws can run past the top of the band — so the
        // scale is capped by the headroom rather than trusted.
        const scale = Math.min((h * slot.scale) / REF_HEIGHT, (slot.ground - 8) / figure.h);
        const dw = Math.round(figure.w * scale);
        const dh = Math.round(figure.h * scale);
        // The jitter is applied to a centre, and a wide figure in an outer
        // slot can carry its basket past the edge of the panel. Nudge it back
        // in: crowding a neighbour reads better than being sliced by the frame.
        const dx = Math.max(6, Math.min(w - dw - 6, Math.round(slot.x - dw / 2)));
        const dy = Math.round(slot.ground - dh);
        if (slot.flip) {
          ctx.save();
          ctx.translate(dx + dw, dy);
          ctx.scale(-1, 1);
          ctx.drawImage(figure.canvas, 0, 0, dw, dh);
          ctx.restore();
        } else {
          ctx.drawImage(figure.canvas, dx, dy, dw, dh);
        }
        placed.push({ figure, dx, dy, dw, dh, flip: slot.flip });
      });
    };

    drawRank('back');

    // Aerial perspective, done as one wash between the ranks rather than as a
    // per-figure alpha: it dims the ground behind the front rank too, which is
    // what actually reads as distance.
    const haze = ctx.createLinearGradient(0, 0, 0, h);
    haze.addColorStop(0, 'rgba(34, 26, 20, 0.5)');
    haze.addColorStop(1, 'rgba(34, 26, 20, 0.28)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);

    drawRank('front');

    // Vignette, and a darker floor so the feet meet the rule below.
    const edges = ctx.createLinearGradient(0, 0, w, 0);
    edges.addColorStop(0, 'rgba(15, 11, 8, 0.55)');
    edges.addColorStop(0.16, 'rgba(15, 11, 8, 0)');
    edges.addColorStop(0.84, 'rgba(15, 11, 8, 0)');
    edges.addColorStop(1, 'rgba(15, 11, 8, 0.55)');
    ctx.fillStyle = edges;
    ctx.fillRect(0, 0, w, h);

    const floor = ctx.createLinearGradient(0, h - 26, 0, h);
    floor.addColorStop(0, 'rgba(15, 11, 8, 0)');
    floor.addColorStop(1, 'rgba(15, 11, 8, 0.5)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, h - 26, w, 26);

    placedRef.current = placed;
  }, [size, slots, paintRevision]);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    // Back to front, so the person in front wins where two overlap.
    let found: Hover | null = null;
    for (let i = placedRef.current.length - 1; i >= 0; i -= 1) {
      const p = placedRef.current[i];
      if (px < p.dx || px >= p.dx + p.dw || py < p.dy || py >= p.dy + p.dh) continue;
      const local = p.flip ? p.dx + p.dw - 1 - px : px - p.dx;
      const sx = Math.floor((local / p.dw) * p.figure.w);
      const sy = Math.floor(((py - p.dy) / p.dh) * p.figure.h);
      if (!p.figure.mask[sy * p.figure.w + sx]) continue;
      found = { who: p.figure.who, x: px, y: py };
      break;
    }
    setHover((current) => {
      if (!found && !current) return current;
      if (found && current && current.who === found.who && Math.abs(current.x - found.x) < 2
        && Math.abs(current.y - found.y) < 2) return current;
      return found;
    });
  };

  // The tooltip grows away from whichever edge the pointer is nearest, which
  // is what keeps it inside the banner without anyone having to measure it:
  // capped at 46% of the width, a box anchored to the near side always fits.
  const above = hover ? hover.y > size.h * 0.55 : false;
  const rightward = hover ? hover.x > size.w * 0.5 : false;

  return (
    <div
      className={`about-crowd${hover ? ' is-hovering' : ''}`}
      ref={wrapRef}
      role="img"
      aria-label="A crowd of full-body figures, each one procedurally generated by this app"
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
      // A tap resolves the same way a hover does, so the invitation in the
      // caption is not a lie on a phone. Tapping a gap clears it again.
      onClick={handleMove}
    >
      <canvas ref={canvasRef} className="about-crowd-canvas" />
      {hover && (
        <div
          className="about-crowd-tip"
          style={{
            left: `${rightward ? hover.x - 12 : hover.x + 12}px`,
            top: `${above ? hover.y - 12 : hover.y + 16}px`,
            transform: `translate(${rightward ? '-100%' : '0'}, ${above ? '-100%' : '0'})`,
          }}
        >
          <b>{hover.who.name}</b>
          <span>born {hover.who.born}</span>
          <span>{hover.who.place}</span>
        </div>
      )}
    </div>
  );
}
