/**
 * portraitLab/devtools/hatSheet.ts
 *
 * Renders one portrait per head covering so a single hat can be worked on
 * without hunting for a persona that happens to be wearing it.
 *
 *   npm run hat-sheet -- out.png
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { idleFrame } from '../render/animation';
import { encodePNG, scaleRGBA } from './png';

const CELL = 96;
const SCALE = 4;

interface HatCase {
  label: string;
  name: string;
  material: string;
  color?: string;
}

const HATS: HatCase[] = [
  { label: 'bamboo-hat', name: 'Bamboo Hat', material: 'Woven Bamboo' },
  { label: 'douli', name: 'Douli', material: 'Bamboo Strips' },
  { label: 'bamboo-douli', name: 'Bamboo Dou Li', material: 'Split Bamboo' },
  { label: 'straw-hat', name: 'Straw Hat', material: 'Straw' },
  { label: 'fur-cap', name: 'Fur Cap', material: 'Fur' },
  { label: 'fur-hat', name: 'Fur Hat', material: 'Sable Fur' },
  { label: 'wolf-pelt', name: 'Wolf Pelt', material: 'Wolf Fur' },
  { label: 'felt-cap', name: 'Felt Cap', material: 'Felt' },
  { label: 'wide-brim', name: 'Wide Brimmed Hat', material: 'Felt' },
  { label: 'coif', name: 'Linen Coif', material: 'Linen' },
];

function renderOne(hat: HatCase): Raster {
  const character: any = {
    name: `Test ${hat.label}`,
    age: 40,
    gender: 'Male',
    profession: 'Farmer',
    portraitSeed: 12345,
    appearance: { skinColor: '#c98d63', hairColor: '#3b2a1d' },
    equippedItems: {
      head: { name: hat.name, material: hat.material, color: hat.color },
      torso: { name: 'Simple Robe', material: 'Wool' },
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
  const outfile = process.argv[2] || 'hat-sheet.png';
  const filter = process.argv[3];
  const cases = filter ? HATS.filter(h => h.label.includes(filter)) : HATS;
  const columns = Math.min(5, cases.length);
  const rows = Math.ceil(cases.length / columns);
  const gap = 4;
  const width = columns * CELL + (columns + 1) * gap;
  const height = rows * CELL + (rows + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 26; out[i * 4 + 1] = 26; out[i * 4 + 2] = 30; out[i * 4 + 3] = 255;
  }

  cases.forEach((hat, index) => {
    const raster = renderOne(hat);
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

  const scale = filter ? 10 : SCALE;
  const scaled = scaleRGBA(out, width, height, scale);
  writeFileSync(outfile, encodePNG(scaled.data, scaled.width, scaled.height));
  console.log(`wrote ${outfile}  (${cases.map(h => h.label).join(', ')})`);
}

main();
