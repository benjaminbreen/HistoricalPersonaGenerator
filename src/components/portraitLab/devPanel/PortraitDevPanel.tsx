/**
 * portraitLab/devPanel/PortraitDevPanel.tsx
 *
 * A contact sheet you can pull up over the running app with ⇧` .
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
 *
 * Two families of sheet, chosen by the first control:
 *
 *   Axis sheets   from `generators.ts`. Hand-built sources, everything held
 *                 fixed but the one thing under test.
 *   Live query    from `liveSheet.ts`. Real `generateHistoricalPersona` output
 *                 filtered to a population — all women, all noble, one era and
 *                 zone together, only the gold-starred. This is the one that
 *                 answers questions about the app rather than about the renderer.
 *
 * Either can be saved as a single PNG, which is the same artefact the
 * command-line sheets produce and the reason this panel exists at all.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PixelPortrait, { PixelPortraitHandle } from '../PixelPortrait';
import { Cell, CELL_COUNT, GRID_COLUMNS, GENERATORS } from './generators';
import {
  ANY, EMPTY_QUERY, LiveQuery, MarkFilter, SampleProgress,
  compositeSheet, sampleLive, sheetFilename,
} from './liveSheet';
import './PortraitDevPanel.css';

const SIZES = [64, 88, 112, 144];
const STORAGE_KEY = 'portraitDevPanel.enabled';

const ERAS = [
  'PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN',
  'INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA',
];
const ZONES = [
  'EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN',
  'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTHEAST_ASIAN',
  'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN',
];
const WEALTH = ['poor', 'modest', 'comfortable', 'wealthy', 'noble'];
const GENDERS = ['Male', 'Female', 'Non-binary'];

/**
 * The marks, in the words the portrait uses for them. `star` and `diamond` are
 * about the rarity of the *standing* a persona held; `unusual` is about the
 * person. See `art/distinctionMark.ts` — the panel deliberately reuses that
 * vocabulary rather than inventing labels of its own.
 */
const MARKS: Array<[MarkFilter, string]> = [
  ['any', 'any distinction'],
  // Listed second because it is the one to reach for when reviewing elite
  // *naming*: most of the orders that change a name — hidalgos at 10%, yangban
  // at 9% — are far too common to earn a badge.
  ['standing', 'in a privileged order'],
  ['marked', 'marked at all'],
  ['star', 'gold star or better'],
  ['diamond', 'diamond only (slow)'],
  ['unusual', 'unusually rare person'],
];

/** Human label for a select option value, with the blank as "any". */
const orAny = (value: string, blank: string) =>
  value === ANY ? blank : value.replace(/_/g, ' ').toLowerCase();

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

/** -1 is the live query; 0.. are the hand-built axis sheets. */
const LIVE = -1;

const PortraitDevPanel: React.FC = () => {
  const enabled = useMemo(isDevPanelEnabled, []);
  const [open, setOpen] = useState(false);
  // Opens on the live query, because that is the sheet that answers questions
  // about the app rather than about one drawing axis.
  const [generatorIndex, setGeneratorIndex] = useState<number>(LIVE);
  const [seed, setSeed] = useState(1);
  const [size, setSize] = useState(88);
  const [animated, setAnimated] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [query, setQuery] = useState<LiveQuery>(EMPTY_QUERY);
  const [live, setLive] = useState<Cell[]>([]);
  const [progress, setProgress] = useState<SampleProgress | null>(null);
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shotRefs = useRef<Array<PixelPortraitHandle | null>>([]);

  const isLive = generatorIndex === LIVE;
  // Wrapped both ways. `LIVE` is -1 and JavaScript's `%` keeps the sign, so the
  // old `index % length` handed back `GENERATORS[-1]` — undefined — the instant
  // the live sheet was selected, and every `generator.label` below it threw.
  // The value is unused while `isLive`; it still has to be a generator.
  const generator = GENERATORS[
    ((generatorIndex % GENERATORS.length) + GENERATORS.length) % GENERATORS.length
  ];

  // Rebuilding forty-two personas is cheap; rendering them is not. Keep the
  // list stable unless the axis or the seed actually changed.
  const axisCells = useMemo(
    () => (isLive ? [] : generator.build(seed)),
    [isLive, generator, seed]
  );
  const cells = isLive ? live : axisCells;

  // The live sheet fills in over time — a gold-star query is two thousand draws
  // — so it lands through state rather than through `useMemo`, and any run still
  // going when the query changes is cancelled rather than left to finish into a
  // sheet nobody is looking at any more.
  useEffect(() => {
    if (!open || !isLive) return undefined;
    setLive([]);
    setProgress({ found: 0, drawn: 0, budget: 0, done: false });
    const handle = sampleLive(query, CELL_COUNT, seed, (found, state) => {
      setLive(found);
      setProgress(state);
    });
    return () => handle.cancel();
  }, [open, isLive, query, seed]);

  const reroll = useCallback(() => setSeed(s => (s * 1103515245 + 12345) % 2147483647), []);
  const cycle = useCallback((delta: number) => {
    setGeneratorIndex(i => {
      // The live sheet sits at the front of the ring, before the axis sheets.
      const next = i + delta;
      if (next < LIVE) return GENERATORS.length - 1;
      if (next >= GENERATORS.length) return LIVE;
      return next;
    });
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const setField = useCallback(<K extends keyof LiveQuery>(key: K, value: LiveQuery[K]) => {
    setQuery(q => ({ ...q, [key]: value }));
  }, []);

  /**
   * Save the grid as one PNG.
   *
   * At 3× a full sheet is a few megabytes, which is fine for a download and far
   * too much for a data URI in the DOM — so the anchor is created, clicked and
   * dropped rather than rendered.
   */
  const saveSheet = useCallback(() => {
    const canvases = shotRefs.current.slice(0, cells.length).map(handle => handle?.canvas() ?? null);
    const url = compositeSheet(canvases, GRID_COLUMNS, 3);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = isLive
      ? sheetFilename(query, seed)
      : `portraits-${generator.id}-${seed}.png`;
    link.click();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }, [cells.length, isLive, query, seed, generator.id]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      // ⇧` is the way in. `code` rather than `key` throughout, because with
      // Shift held `key` reports the *shifted* character — `~` on a US layout
      // and something else again on others — while `Backquote` is the physical
      // key wherever it sits.
      //
      // The two older chords are kept: ⌘⇧D is claimed by the browser on most
      // setups (Chrome bookmarks every open tab with it) and so may not arrive
      // at all, and F2 needs no modifier, which is handy when a text field has
      // focus and Shift is going into it.
      const tilde = event.code === 'Backquote' && event.shiftKey && !event.metaKey && !event.ctrlKey;
      const chord = event.code === 'KeyD' && event.shiftKey && (event.metaKey || event.ctrlKey);
      const funcKey = event.code === 'F2';
      const tag = (event.target as HTMLElement | null)?.tagName;
      const typing = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
      // ⇧` is a character someone may legitimately be typing into the app's own
      // fields, so it only toggles when nothing is taking text.
      if ((tilde && !typing) || chord || funcKey) {
        event.preventDefault();
        setOpen(o => !o);
        return;
      }
      if (!open) return;
      // Don't steal keys from a focused control.
      if (typing) return;

      if (event.code === 'Escape') { event.preventDefault(); setOpen(false); }
      else if (event.code === 'KeyR') { event.preventDefault(); reroll(); }
      else if (event.code === 'KeyS') { event.preventDefault(); saveSheet(); }
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
  }, [enabled, open, reroll, cycle, saveSheet]);

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
          <strong>{isLive ? 'Live query' : generator.label}</strong>
          <span className="pdp__count">
            {isLive && progress
              // What it found, out of what was asked for, and what it cost. The
              // draw count is the useful half: "42 of 42 · 1,910 draws" is how
              // you learn that gold stars are rare without being told.
              ? `${progress.found} of ${CELL_COUNT}`
                + (progress.drawn > progress.found ? ` · ${progress.drawn.toLocaleString()} draws` : '')
                + (!progress.done ? ' · sampling…' : '')
              : `${CELL_COUNT} portraits`}
            {' · '}seed {seed}
          </span>
        </div>

        <p className="pdp__blurb">
          {isLive
            ? 'Real personas from the live generator, filtered to a population. '
              + 'Era, zone, gender, wealth and age are asked of the generator directly and cost nothing; '
              + 'the distinction filters have to be sampled for, so they take a moment and may come back short.'
            : generator.blurb}
        </p>

        <div className="pdp__controls">
          <select
            value={generatorIndex}
            onChange={e => { setGeneratorIndex(Number(e.target.value)); scrollRef.current?.scrollTo({ top: 0 }); }}
            aria-label="Sheet"
          >
            <option value={LIVE}>Live query — filter real personas</option>
            {GENERATORS.map((g, i) => <option key={g.id} value={i}>{g.label}</option>)}
          </select>

          <button type="button" onClick={reroll}>Reroll <kbd>R</kbd></button>
          <button type="button" onClick={saveSheet} disabled={!cells.length}>
            {saved ? 'saved ✓' : 'Save PNG'}<kbd>S</kbd>
          </button>
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

        {isLive && (
          <div className="pdp__filters">
            <label>
              gender
              <select value={query.gender} onChange={e => setField('gender', e.target.value)}>
                <option value={ANY}>any</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label>
              class
              <select value={query.wealth} onChange={e => setField('wealth', e.target.value)}>
                <option value={ANY}>any</option>
                {WEALTH.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>
            <label>
              era
              <select value={query.era} onChange={e => setField('era', e.target.value)}>
                <option value={ANY}>any</option>
                {ERAS.map(e2 => <option key={e2} value={e2}>{orAny(e2, 'any')}</option>)}
              </select>
            </label>
            <label>
              zone
              <select value={query.zone} onChange={e => setField('zone', e.target.value)}>
                <option value={ANY}>any</option>
                {ZONES.map(z => <option key={z} value={z}>{orAny(z, 'any')}</option>)}
              </select>
            </label>
            <label>
              mark
              <select
                value={query.mark}
                onChange={e => setField('mark', e.target.value as MarkFilter)}
              >
                {MARKS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="pdp__ages">
              age
              <input
                type="number" min={0} max={120} value={query.minAge}
                onChange={e => setField('minAge', Math.max(0, Number(e.target.value) || 0))}
              />
              –
              <input
                type="number" min={0} max={120} value={query.maxAge}
                onChange={e => setField('maxAge', Math.min(120, Number(e.target.value) || 120))}
              />
            </label>
            <button type="button" onClick={() => setQuery(EMPTY_QUERY)}>Clear</button>
          </div>
        )}
      </header>

      <div className="pdp__scroll" ref={scrollRef}>
        <div
          className="pdp__grid"
          style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}
        >
          {cells.map((cell, index) => (
            <figure key={`${isLive ? 'live' : generator.id}-${seed}-${index}`} className="pdp__cell">
              <button
                type="button"
                className="pdp__shot"
                onClick={() => copyCell(index)}
                title="Copy this persona's JSON"
              >
                <Portrait
                  ref={handle => { shotRefs.current[index] = handle; }}
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

        {/* Said plainly rather than left as a short grid the reader has to
          * count. A partial sheet is a fact about how rare the filter is, and
          * it is usually the most interesting thing on screen. */}
        {isLive && progress?.done && progress.found < CELL_COUNT && (
          <p className="pdp__short">
            {progress.found === 0
              ? `Nothing matched in ${progress.drawn.toLocaleString()} draws. `
                + 'If era and zone are both pinned, check the combination existed — '
                + 'a colonial zone in antiquity has no one to generate.'
              : `Only ${progress.found} of ${CELL_COUNT} matched in `
                + `${progress.drawn.toLocaleString()} draws — that is about `
                + `1 in ${Math.round(progress.drawn / progress.found)}. `
                + 'Reroll to sample again, or loosen the filter.'}
          </p>
        )}
      </div>

      <footer className="pdp__hint">
        <kbd>⇧`</kbd> toggle · <kbd>R</kbd> reroll · <kbd>S</kbd> save PNG ·
        <kbd>[</kbd><kbd>]</kbd> sheet · <kbd>−</kbd><kbd>+</kbd> size ·
        click a portrait to copy its JSON
      </footer>
    </div>
  );
};

export default PortraitDevPanel;
