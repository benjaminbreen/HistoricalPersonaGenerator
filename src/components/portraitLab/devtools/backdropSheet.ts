/**
 * portraitLab/devtools/backdropSheet.ts
 *
 * Every cultural zone crossed with every era, on one seed and one face.
 *
 * The backdrop carries two claims at once — hue says where, and value, chroma
 * and surface say when — and neither can be judged from a single portrait. Laid
 * out as a grid the failures are obvious in a second: a column that does not
 * change is an era doing nothing, a row that does not change is a zone doing
 * nothing, and a cell where the head stops separating from the ground is a
 * legibility bug that a hundred sampled personas might never have shown you.
 *
 *   npm run backdrop-sheet -- out.png
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { idleFrame } from '../render/animation';
import { encodePNG, scaleRGBA } from './png';

const CELL = 96;

const ZONES = [
  'EUROPEAN', 'MENA', 'SOUTH_ASIAN', 'EAST_ASIAN',
  'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'OCEANIA',
];

const ERAS = [
  'PREHISTORY', 'ANTIQUITY', 'MEDIEVAL',
  'RENAISSANCE_EARLY_MODERN', 'INDUSTRIAL_ERA', 'MODERN_ERA',
];

function renderOne(zone: string, era: string): Raster {
  const character: any = {
    name: `${zone}-${era}`,
    age: 38,
    gender: 'Male',
    profession: 'Farmer',
    portraitSeed: 4242,
    culturalZone: zone,
    era,
    appearance: {
      skinColor: '#b8825c',
      hairColor: '#2e2118',
      hairLength: 'short',
    },
    equippedItems: { torso: { name: 'Simple Tunic', material: 'Linen' } },
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
  const outfile = process.argv[2] || 'backdrop-sheet.png';
  const gap = 4;
  const width = ERAS.length * CELL + (ERAS.length + 1) * gap;
  const height = ZONES.length * CELL + (ZONES.length + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 18; out[i * 4 + 1] = 18; out[i * 4 + 2] = 22; out[i * 4 + 3] = 255;
  }

  ZONES.forEach((zone, row) => {
    ERAS.forEach((era, col) => {
      const raster = renderOne(zone, era);
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
  });

  const scaled = scaleRGBA(out, width, height, 3);
  writeFileSync(outfile, encodePNG(scaled.data, scaled.width, scaled.height));
  console.log(`wrote ${outfile}  (rows: ${ZONES.join(', ')} · columns: ${ERAS.join(', ')})`);
}

main();
