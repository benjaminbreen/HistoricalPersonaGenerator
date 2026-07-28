/**
 * portraitLab/devtools/garmentSheet.ts
 *
 * The clothing axis: every garment kind crossed with every wealth level, on one
 * seed, with no context pack — so this is specifically the generic path that
 * nine personas in ten actually get.
 *
 * The chest is the bottom third of every card and the audit says 91.7% of real
 * output never matches a context pack, which makes this the largest and least
 * examined area of the portrait. Cropping the head off entirely would be
 * tempting, but the neckline only reads in relation to the neck above it.
 *
 *   npm run garment-sheet -- out.png
 *   npm run garment-sheet -- silk.png silk      # by material instead
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { idleFrame } from '../render/animation';
import { encodePNG, scaleRGBA } from './png';

const CELL = 96;

/** One representative item name per kind, so the classifier routes it there. */
const KINDS: Array<{ label: string; name: string; material: string }> = [
  { label: 'tunic', name: 'Simple Tunic', material: 'Linen' },
  { label: 'robe', name: 'Long Robe', material: 'Wool' },
  { label: 'gown', name: 'Plain Gown', material: 'Wool' },
  { label: 'doublet', name: 'Padded Doublet', material: 'Fustian' },
  { label: 'work_shirt', name: 'Work Shirt', material: 'Linen' },
  { label: 'wrapped', name: 'Shoulder Wrap', material: 'Cotton' },
  { label: 'jacket', name: 'Wool Jacket', material: 'Wool' },
];

const WEALTH = ['poor', 'modest', 'comfortable', 'wealthy', 'noble'] as const;

const MATERIALS = ['linen', 'wool', 'silk', 'velvet', 'barkcloth'] as const;

function renderOne(
  kind: { label: string; name: string; material: string },
  wealth: string,
  index: number
): Raster {
  const character: any = {
    name: `${kind.label}-${wealth}`,
    age: 33,
    gender: index % 2 === 0 ? 'Male' : 'Female',
    profession: 'Farmer',
    wealthLevel: wealth,
    // Seed varies per cell so the seeded neckline choice is exercised rather
    // than showing the same option seven times.
    portraitSeed: 1700 + index * 37,
    appearance: {
      skinColor: '#c98d63',
      hairColor: '#3b2a1d',
      hairLength: 'short',
      hairstyle: 'short_cropped',
      facialHairStyle: 'none',
    },
    equippedItems: {
      torso: { name: kind.name, material: kind.material },
    },
  };
  const spec = buildPortraitSpec(character);
  spec.facialHair = null;
  const compiled = compilePortrait(spec);
  const target = new Raster(CELL, CELL);
  const state = idleFrame(0, {
    seed: spec.seed,
    resting: restingExpression(spec.mood, spec.condition),
    mood: spec.mood,
    hairMoves: false,
    reducedMotion: true,
  });
  renderFrame(compiled, state, target);
  return target;
}

function main() {
  const outfile = process.argv[2] || 'garment-sheet.png';
  const mode = process.argv[3] || 'wealth';
  const scale = Number(process.argv[4]) || 5;

  // The garment occupies roughly the bottom quarter of a 96px bust, so a full
  // cell spends most of its pixels on a face we are not looking at. Cropping to
  // the neck and chest is what makes this sheet legible at all.
  const cropTop = process.argv.includes('--full') ? 0 : 52;
  const cellH = CELL - cropTop;

  const columns: readonly string[] = mode === 'material' ? MATERIALS : WEALTH;
  const cells: Array<{ kind: typeof KINDS[number]; second: string }> = [];
  for (const kind of KINDS) for (const second of columns) cells.push({ kind, second });

  const cols = columns.length;
  const rows = KINDS.length;
  const gap = 4;
  const width = cols * CELL + (cols + 1) * gap;
  const height = rows * cellH + (rows + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 26; out[i * 4 + 1] = 26; out[i * 4 + 2] = 30; out[i * 4 + 3] = 255;
  }

  cells.forEach((cell, index) => {
    const kind = mode === 'material'
      ? { ...cell.kind, material: cell.second }
      : cell.kind;
    const wealth = mode === 'material' ? 'modest' : cell.second;
    const raster = renderOne(kind, wealth, index);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x0 = gap + col * (CELL + gap);
    const y0 = gap + row * (cellH + gap);
    for (let y = 0; y < cellH; y += 1) {
      for (let x = 0; x < CELL; x += 1) {
        const src = ((y + cropTop) * CELL + x) * 4;
        const dst = ((y0 + y) * width + (x0 + x)) * 4;
        out[dst] = raster.data[src]; out[dst + 1] = raster.data[src + 1];
        out[dst + 2] = raster.data[src + 2]; out[dst + 3] = 255;
      }
    }
  });

  const scaled = scaleRGBA(out, width, height, scale);
  writeFileSync(outfile, encodePNG(scaled.data, scaled.width, scaled.height));
  console.log(`wrote ${outfile} — ${rows} kinds × ${cols} ${mode === 'material' ? 'materials' : 'wealth levels'}`);
}

main();
