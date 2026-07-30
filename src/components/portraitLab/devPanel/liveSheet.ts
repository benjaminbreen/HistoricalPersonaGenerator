/**
 * portraitLab/devPanel/liveSheet.ts
 *
 * Contact sheets of *real* personas, drawn to a query.
 *
 * The sheets in `generators.ts` build `PortraitSource` objects by hand, which is
 * the right tool for testing one axis: hold everything fixed, vary the nose, and
 * you can attribute what you see. But it cannot answer the other question —
 * "what do noblewomen of Ming China actually come out looking like" — because
 * the thing under test there is the whole generator, clothing tables, marking
 * tables, ornament traditions and all. A hand-built source has none of that.
 *
 * So this runs `generateHistoricalPersona` for real and fills a grid from it.
 *
 * Two kinds of filter, and the difference matters a great deal for speed:
 *
 *   Constraints  era, zone, gender, wealth, age. `GenerationParams` already
 *                accepts every one of these, so they cost nothing — the
 *                generator simply makes the person you asked for.
 *
 *   Rejections   the distinction mark. There is no way to ask for a persona
 *                whose standing was held by one in a thousand; you generate and
 *                you check. A gold star is about one draw in fifty and a diamond
 *                about one in eight hundred, so a full sheet of diamonds is tens
 *                of thousands of draws — call it half a minute of solid work.
 *
 * Which is why sampling is a chunked, cancellable loop rather than a function
 * that returns an array. It yields to the browser every few dozen draws, reports
 * what it has, and stops when it hits the budget instead of pretending. A sheet
 * that comes back with 26 of 42 says so; the alternative is a panel that hangs
 * and then lies about the population.
 */

import { portraitMarkFor, DistinctionTier } from '../art/distinctionMark';
import { generateHistoricalPersona } from '../../../services/personaGenerator';
import { Cell } from './generators';

/** Which marked personas a sheet will accept. See `art/distinctionMark.ts`. */
export type MarkFilter = 'any' | 'standing' | 'marked' | 'star' | 'diamond' | 'unusual';

export interface LiveQuery {
  era: string;
  zone: string;
  gender: string;
  wealth: string;
  mark: MarkFilter;
  minAge: number;
  maxAge: number;
}

export const ANY = '';

export const EMPTY_QUERY: LiveQuery = {
  era: ANY, zone: ANY, gender: ANY, wealth: ANY, mark: 'any', minAge: 0, maxAge: 120,
};

/**
 * How many draws a sheet may cost before it gives up.
 *
 * Sized off the measured rates rather than guessed: a gold star is 2.1% of
 * draws, so 42 of them needs about two thousand and this gives it six. A diamond
 * is 0.13% and would need thirty-two thousand, which is over the budget on
 * purpose — that sheet is meant to come back partial and say so, because the
 * alternative is a dev panel that appears to have frozen.
 */
const DRAW_BUDGET = 6000;

/** Draws per tick. Small enough that the panel stays responsive under it. */
const CHUNK = 24;

const MARK_TEST: Record<MarkFilter, (mark: DistinctionTier, character: any) => boolean> = {
  any: () => true,
  // Anyone in a privileged order at all, badge or no badge. This is the filter
  // for reviewing elite *naming*, because most of the orders that change a name
  // are far too common to earn a mark: the portrait's gold star wants 1 in 100
  // or rarer and the Castilian hidalguía was one in ten.
  standing: (_mark, character) => Boolean(character?.hasDistinction),
  // Anything the portrait puts a badge in the corner for.
  marked: mark => mark !== null,
  // The two standing marks, which are about the office rather than the person.
  star: mark => mark === 'star' || mark === 'diamond',
  diamond: mark => mark === 'diamond',
  // The personal-rarity marks: how unusual the person was, not what they held.
  unusual: mark => mark === 'notable' || mark === 'rare' || mark === 'legendary',
};

export interface SampleProgress {
  found: number;
  drawn: number;
  budget: number;
  done: boolean;
}

export interface SampleHandle {
  cancel: () => void;
}

/**
 * A short label for the cell caption.
 *
 * Whatever the sheet is *not* filtered on is the interesting thing about a
 * cell, so the label leads with the axes that are still free. A grid of Ming
 * noblewomen captioned "Female · noble · EAST_ASIAN" forty-two times tells you
 * nothing you did not type in yourself.
 */
function labelFor(character: any, query: LiveQuery, mark: DistinctionTier): string {
  const parts: string[] = [];
  if (query.gender === ANY && character.gender) parts.push(String(character.gender)[0]);
  if (character.age !== undefined) parts.push(`${character.age}`);
  if (query.wealth === ANY && character.wealthLevel) parts.push(String(character.wealthLevel));
  if (query.zone === ANY && character.culturalZone) {
    parts.push(String(character.culturalZone).replace(/_/g, ' ').toLowerCase());
  }
  if (query.mark === 'any' && mark) parts.push(mark);
  const trailer = parts.length ? ` · ${parts.join(' · ')}` : '';
  return `${character.name || 'unnamed'}${trailer}`;
}

/**
 * Fill a sheet, yielding between chunks.
 *
 * Returns a handle rather than a promise so the panel can cancel a diamond hunt
 * the moment the query changes under it. `onProgress` is called after every
 * chunk with what has been found so far, so the grid fills in visibly instead of
 * appearing all at once at the end — which for the expensive queries is the
 * difference between a tool and a spinner.
 */
export function sampleLive(
  query: LiveQuery,
  count: number,
  seed: number,
  onProgress: (cells: Cell[], progress: SampleProgress) => void
): SampleHandle {
  const cells: Cell[] = [];
  let lastReported: Cell[] = [];
  let drawn = 0;
  let cancelled = false;
  // Every draw gets its own seed derived from the sheet's, so a sheet is
  // reproducible from its seed and its query alone.
  let cursor = (seed >>> 0) || 1;

  // Only the axes the caller actually pinned are passed through. Sending
  // `era: ''` would be a request for an era named empty string rather than for
  // no constraint at all.
  const params: Record<string, unknown> = {};
  if (query.era !== ANY) params.era = query.era;
  if (query.zone !== ANY) params.culturalZone = query.zone;
  if (query.gender !== ANY) params.gender = query.gender;
  if (query.wealth !== ANY) params.wealthLevel = query.wealth;
  if (query.minAge > 0) params.minAge = query.minAge;
  if (query.maxAge < 120) params.maxAge = query.maxAge;

  const accepts = MARK_TEST[query.mark] ?? MARK_TEST.any;
  // With no rejection filter every draw lands, so the budget is exactly the
  // sheet — no point letting the loop run past it.
  const budget = query.mark === 'any' ? count : DRAW_BUDGET;

  const tick = () => {
    if (cancelled) return;
    for (let i = 0; i < CHUNK && cells.length < count && drawn < budget; i += 1) {
      cursor = (cursor * 1103515245 + 12345) >>> 0;
      drawn += 1;
      let character: any;
      try {
        character = generateHistoricalPersona({ ...params, seed: cursor } as never).character;
      } catch {
        // A constraint combination the generator cannot satisfy — a colonial
        // zone in prehistory, say. Skipping is right: the budget will run out
        // and the panel will report an empty sheet, which is the true answer.
        continue;
      }
      const mark = portraitMarkFor(character.distinctionShare, character.profession, character.rarityTier);
      if (!accepts(mark, character)) continue;
      cells.push({ label: labelFor(character, query, mark), character });
    }

    // A fresh array only when the sheet actually gained someone. A rejection
    // run — and a diamond hunt is thousands of them — would otherwise hand the
    // panel a new array identity every tick, re-rendering forty-two canvases to
    // show the same forty-two portraits. Holding the reference lets React skip
    // the grid while the draw counter keeps moving.
    const grew = cells.length !== lastReported.length;
    if (grew) lastReported = cells.slice();
    const done = cells.length >= count || drawn >= budget;
    onProgress(lastReported, { found: cells.length, drawn, budget, done });
    if (!done) window.setTimeout(tick, 0);
  };

  window.setTimeout(tick, 0);
  return { cancel: () => { cancelled = true; } };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Composite the rendered cells into one PNG, the way the command-line sheets do.
 *
 * Reads the live canvases rather than re-rendering. They are already on screen
 * at the size the panel is showing, they already carry the frame and the
 * distinction mark, and re-rendering would mean re-deriving forty-two specs to
 * produce pixels that are sitting right there.
 *
 * `image-rendering: pixelated` is a CSS property and does not survive into
 * `drawImage`, so smoothing is turned off explicitly — without it a 2× sheet
 * comes out blurred, which is a strange thing to hand someone as a record of
 * pixel art.
 */
export function compositeSheet(
  canvases: Array<HTMLCanvasElement | null>,
  columns: number,
  scale: number,
  gap = 2
): string | null {
  const present = canvases.filter((c): c is HTMLCanvasElement => Boolean(c));
  if (!present.length) return null;

  const cellW = present[0].width;
  const cellH = present[0].height;
  const rows = Math.ceil(present.length / columns);

  const out = document.createElement('canvas');
  out.width = (cellW * columns + gap * (columns - 1)) * scale;
  out.height = (cellH * rows + gap * (rows - 1)) * scale;
  const ctx = out.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = false;
  // The same near-black the panel uses, so the gutters read as a contact sheet
  // rather than as transparent holes in a PNG.
  ctx.fillStyle = '#171513';
  ctx.fillRect(0, 0, out.width, out.height);

  present.forEach((canvas, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    ctx.drawImage(
      canvas,
      (col * (cellW + gap)) * scale,
      (row * (cellH + gap)) * scale,
      cellW * scale,
      cellH * scale
    );
  });

  return out.toDataURL('image/png');
}

/** A filename that says what the sheet is, so a folder of them stays readable. */
export function sheetFilename(query: LiveQuery, seed: number): string {
  const parts = [
    query.gender !== ANY ? query.gender.toLowerCase() : null,
    query.wealth !== ANY ? query.wealth : null,
    query.zone !== ANY ? query.zone.toLowerCase() : null,
    query.era !== ANY ? query.era.toLowerCase() : null,
    query.mark !== 'any' ? query.mark : null,
    query.minAge > 0 || query.maxAge < 120 ? `${query.minAge}-${query.maxAge}` : null,
  ].filter(Boolean);
  return `portraits-${parts.length ? parts.join('-') : 'all'}-${seed}.png`;
}
