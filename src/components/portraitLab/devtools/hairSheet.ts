/**
 * portraitLab/devtools/hairSheet.ts
 *
 * One portrait per hair arrangement, driven by the *app's* style names rather
 * than by the renderer's vocabulary — so this sheet also tests the classifier
 * in `buildSpec`, not just the drawing. If a style here comes out as a loose
 * mane, the keyword table is what is wrong.
 *
 *   npm run hair-sheet -- out.png
 *   npm run hair-sheet -- braid.png braid     # just the plaits, zoomed
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { CANVAS } from '../spec/anatomy';
import { idleFrame } from '../render/animation';
import { encodePNG, scaleRGBA } from './png';

const CELL = CANVAS;
const SCALE = 4;

interface HairCase {
  label: string;
  /** The raw style name as the app's `getHairstyle` would emit it. */
  style: string;
  length?: string;
  texture?: string;
  gender?: string;
  age?: number;
}

/**
 * Every entry is a real string from `getHairstyle` or `formatHairstyle` in the
 * app, not an invented one. The point of the sheet is to see what the app
 * actually produces.
 */
const HAIR: HairCase[] = [
  { label: 'loose', style: 'long_wild', length: 'long' },
  { label: 'bangs', style: 'short_combed_forward', length: 'medium' },
  { label: 'bowl', style: 'bowl_cut', length: 'medium' },
  { label: 'bob', style: 'blunt_jaw_length', length: 'medium', gender: 'Female' },
  { label: 'swept', style: 'side_part', length: 'medium' },
  { label: 'tied-back', style: 'tied_back', length: 'long' },
  { label: 'ponytail', style: 'ponytail', length: 'long' },
  { label: 'bun', style: 'gathered_bun', length: 'long', gender: 'Female' },
  { label: 'top-knot', style: 'warrior_knot', length: 'long' },
  { label: 'twin-buns', style: 'braided_buns', length: 'long', gender: 'Female' },
  { label: 'updo', style: 'high_pinned_updo', length: 'very_long', gender: 'Female' },
  { label: 'braid-single', style: 'elaborate_braids', length: 'very_long', gender: 'Female' },
  { label: 'braid-twin', style: 'long_plaits', length: 'very_long', gender: 'Female' },
  { label: 'braid-crown', style: 'braided_crown', length: 'long', gender: 'Female' },
  { label: 'locs', style: 'dreadlocks', length: 'long', texture: 'coily' },
  { label: 'cornrows', style: 'cornrows', length: 'short', texture: 'kinky' },
  { label: 'afro', style: 'afro', length: 'medium', texture: 'kinky' },
  { label: 'tonsure', style: 'shaved_crown', length: 'short', age: 55 },
  { label: 'shaved-sides', style: 'mohawk', length: 'medium' },
];

function renderOne(entry: HairCase): Raster {
  const character: any = {
    name: `Test ${entry.label}`,
    age: entry.age ?? 32,
    gender: entry.gender ?? 'Male',
    profession: 'Farmer',
    portraitSeed: 4242,
    appearance: {
      skinColor: '#c98d63',
      hairColor: '#3b2a1d',
      hairstyle: entry.style,
      hairLength: entry.length ?? 'medium',
      hairTexture: entry.texture ?? 'straight',
    },
    equippedItems: {
      torso: { name: 'Simple Tunic', material: 'Linen' },
    },
  };
  const spec = buildPortraitSpec(character);
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
  const outfile = process.argv[2] || 'hair-sheet.png';
  const filter = process.argv[3];
  const cases = filter ? HAIR.filter(h => h.label.includes(filter) || h.style.includes(filter)) : HAIR;
  if (!cases.length) {
    console.log(`no hair case matches "${filter}"`);
    return;
  }
  const columns = Math.min(5, cases.length);
  const rows = Math.ceil(cases.length / columns);
  const gap = 4;
  const width = columns * CELL + (columns + 1) * gap;
  const height = rows * CELL + (rows + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 26; out[i * 4 + 1] = 26; out[i * 4 + 2] = 30; out[i * 4 + 3] = 255;
  }

  cases.forEach((entry, index) => {
    const raster = renderOne(entry);
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x0 = gap + col * (CELL + gap);
    const y0 = gap + row * (CELL + gap);
    for (let y = 0; y < CELL; y += 1) {
      for (let x = 0; x < CELL; x += 1) {
        const src = (y * CELL + x) * 4;
        const dst = ((y0 + y) * width + (x0 + x)) * 4;
        out[dst] = raster.data[src]; out[dst + 1] = raster.data[src + 1];
        out[dst + 2] = raster.data[src + 2]; out[dst + 3] = 255;
      }
    }
  });

  const scale = filter ? 9 : SCALE;
  const scaled = scaleRGBA(out, width, height, scale);
  writeFileSync(outfile, encodePNG(scaled.data, scaled.width, scaled.height));
  console.log(`wrote ${outfile}  (${cases.map(h => h.label).join(', ')})`);
}

main();
