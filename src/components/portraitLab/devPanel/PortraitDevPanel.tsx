/**
 * portraitLab/devPanel/PortraitDevPanel.tsx
 *
 * A contact sheet you can pull up over the running app with ⌘⇧D.
 *
 * The command-line sheet (`npm run portrait-sheet`) renders the *fixtures* —
 * a fixed cast, deliberately stable so diffs mean something. This panel is the
 * opposite tool: it draws forty-two personas straight out of the live
 * generators, in the real browser, with the pixel engine the app now uses
 * set to. It answers "what does this actually look like in the wild", which a
 * fixed cast can never tell you.
 *
 * Held open on one axis and rerolled a few times, it surfaces the
 * one-in-forty case that a hand-picked fixture set will never contain.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PixelPortrait from '../PixelPortrait';
import { CELL_COUNT, GRID_COLUMNS, GENERATORS } from './generators';
import './PortraitDevPanel.css';

const SIZES = [64, 88, 112, 144];
const STORAGE_KEY = 'portraitDevPanel.enabled';

/**
 * On in development. In a production build it stays dormant unless explicitly
 * switched on with `?devPanel` — so a deployed persona generator does not ship
 * a debug overlay one stray keystroke away, but you can still reach it on the
 * live site when you need to.
 */
export function isDevPanelEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (import.meta.env?.DEV) return true;
  const params = new URLSearchParams(window.location.search);
  if (params.has('devPanel')) {
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* private mode */ }
    return true;
  }
  try { return window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

const PortraitDevPanel: React.FC = () => {
  const enabled = useMemo(isDevPanelEnabled, []);
  const [open, setOpen] = useState(false);
  const [generatorIndex, setGeneratorIndex] = useState(0);
  const [seed, setSeed] = useState(1);
  const [size, setSize] = useState(88);
  const [animated, setAnimated] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generator = GENERATORS[generatorIndex % GENERATORS.length];

  // Rebuilding forty-two personas is cheap; rendering them is not. Keep the
  // list stable unless the axis or the seed actually changed.
  const cells = useMemo(() => generator.build(seed), [generator, seed]);

  const reroll = useCallback(() => setSeed(s => (s * 1103515245 + 12345) % 2147483647), []);
  const cycle = useCallback((delta: number) => {
    setGeneratorIndex(i => (i + delta + GENERATORS.length) % GENERATORS.length);
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      // Two ways in, because ⌘⇧D is claimed by the browser on most setups
      // (Chrome bookmarks every open tab with it) and never reaches the page.
      // F2 takes no modifiers and nothing else wants it.
      // `code` rather than `key`: modifiers change what `key` reports on
      // several keyboard layouts.
      const chord = event.code === 'KeyD' && event.shiftKey && (event.metaKey || event.ctrlKey);
      const funcKey = event.code === 'F2';
      if (chord || funcKey) {
        event.preventDefault();
        setOpen(o => !o);
        return;
      }
      if (!open) return;
      // Don't steal keys from a focused control.
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (event.code === 'Escape') { event.preventDefault(); setOpen(false); }
      else if (event.code === 'KeyR') { event.preventDefault(); reroll(); }
      else if (event.code === 'BracketRight' || event.code === 'ArrowRight') { event.preventDefault(); cycle(1); }
      else if (event.code === 'BracketLeft' || event.code === 'ArrowLeft') { event.preventDefault(); cycle(-1); }
      else if (event.code === 'Equal') {
        event.preventDefault();
        setSize(s => SIZES[Math.min(SIZES.length - 1, SIZES.indexOf(s) + 1)] ?? s);
      } else if (event.code === 'Minus') {
        event.preventDefault();
        setSize(s => SIZES[Math.max(0, SIZES.indexOf(s) - 1)] ?? s);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, open, reroll, cycle]);

  // A grid of forty-two animated canvases will happily eat a core. Pause the
  // app's own scrolling while the sheet is up.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  const copyCell = useCallback((index: number) => {
    const payload = JSON.stringify(cells[index].character, null, 2);
    navigator.clipboard?.writeText(payload).then(
      () => { setCopied(index); window.setTimeout(() => setCopied(null), 1200); },
      () => { /* clipboard blocked; nothing useful to do */ }
    );
  }, [cells]);

  if (!enabled || !open) return null;

  const Portrait = PixelPortrait;

  return (
    <div className="pdp" role="dialog" aria-label="Portrait dev panel">
      <header className="pdp__bar">
        <div className="pdp__title">
          <strong>{generator.label}</strong>
          <span className="pdp__count">{CELL_COUNT} portraits · seed {seed}</span>
        </div>

        <p className="pdp__blurb">{generator.blurb}</p>

        <div className="pdp__controls">
          <select
            value={generatorIndex}
            onChange={e => { setGeneratorIndex(Number(e.target.value)); scrollRef.current?.scrollTo({ top: 0 }); }}
            aria-label="Sheet"
          >
            {GENERATORS.map((g, i) => <option key={g.id} value={i}>{g.label}</option>)}
          </select>

          <button type="button" onClick={reroll}>Reroll <kbd>R</kbd></button>
          <label className="pdp__toggle">
            <input type="checkbox" checked={animated} onChange={e => setAnimated(e.target.checked)} />
            Animate
          </label>
          <div className="pdp__sizes">
            {SIZES.map(s => (
              <button
                key={s}
                type="button"
                className={s === size ? 'is-active' : ''}
                onClick={() => setSize(s)}
              >{s}</button>
            ))}
          </div>
          <button type="button" className="pdp__close" onClick={() => setOpen(false)}>
            Close <kbd>Esc</kbd>
          </button>
        </div>
      </header>

      <div className="pdp__scroll" ref={scrollRef}>
        <div
          className="pdp__grid"
          style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}
        >
          {cells.map((cell, index) => (
            <figure key={`${generator.id}-${seed}-${index}`} className="pdp__cell">
              <button
                type="button"
                className="pdp__shot"
                onClick={() => copyCell(index)}
                title="Copy this persona's JSON"
              >
                <Portrait
                  character={cell.character as any}
                  size={size}
                  animated={animated}
                  useEquippedItems
                />
              </button>
              <figcaption>{copied === index ? 'copied ✓' : cell.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>

      <footer className="pdp__hint">
        <kbd>F2</kbd> or <kbd>⌘⇧D</kbd> toggle · <kbd>R</kbd> reroll · <kbd>[</kbd><kbd>]</kbd> sheet ·
        <kbd>−</kbd><kbd>+</kbd> size · click a portrait to copy its JSON
      </footer>
    </div>
  );
};

export default PortraitDevPanel;
