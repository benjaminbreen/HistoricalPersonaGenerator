/**
 * portraitLab/devtools/distinctionSheet.ts
 *
 * The corner mark, on a portrait, at a size you can actually judge.
 *
 * `drawDistinctionMark` paints onto the visible canvas rather than into the
 * raster, which is the right call in the app — the badge must not ride the
 * breathing shift — but it means the mark never appears in any of the other
 * sheets, and a nine-pixel sprite is not something to sign off from a source
 * diff. This renders one row of three: no mark, the star, the diamond, each on
 * a real compiled portrait, so the contrast against the backdrop and the
 * placement in the corner can be checked rather than assumed.
 *
 *   npm run distinction-sheet -- out.png
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { idleFrame } from '../render/animation';
import { drawDistinctionMark, type DistinctionTier } from '../art/distinctionMark';
import { encodePNG, scaleRGBA } from './png';

const CELL = 96;
const SCALE = 6;

/**
 * A canvas context that writes single pixels into a Raster.
 *
 * The mark is authored against `CanvasRenderingContext2D` because that is what
 * the component has; this is the four lines of it the sprite actually uses.
 */
function rasterContext(raster: Raster) {
  const ctx = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number): void {
      const hex = ctx.fillStyle.replace('#', '');
      const rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) {
          const px = x + dx;
          const py = y + dy;
          if (!raster.inside(px, py)) continue;
          const at = (py * raster.width + px) * 4;
          raster.data[at] = rgb[0];
          raster.data[at + 1] = rgb[1];
          raster.data[at + 2] = rgb[2];
          raster.data[at + 3] = 255;
        }
      }
    },
  };
  return ctx;
}

function renderOne(label: string, tier: DistinctionTier, profession: string, phase = 0): Raster {
  const character: any = {
    name: label,
    age: 44,
    gender: 'Male',
    profession,
    culturalZone: 'EUROPEAN',
    era: 'RENAISSANCE_EARLY_MODERN',
    year: 1650,
    region: 'France',
    wealthLevel: tier ? 'wealthy' : 'modest',
    hasDistinction: Boolean(tier),
    rarityTier: tier === 'diamond' ? 'legendary' : 'ordinary',
    appearance: { skinColor: '#e8c5a0', hairColor: '#3a2a18', eyeColor: '#4a3a24', build: 'average' },
    portraitSeed: 20482,
  };

  const spec = buildPortraitSpec(character);
  const compiled = compilePortrait(spec);
  const raster = new Raster(compiled.size, compiled.size);
  renderFrame(
    compiled,
    idleFrame(0, {
      seed: spec.seed,
      resting: restingExpression(spec.mood, spec.condition),
      mood: spec.mood,
      hairMoves: false,
      override: null,
      reducedMotion: true,
    }),
    raster,
  );

  drawDistinctionMark(rasterContext(raster) as any, compiled.size, tier, phase);
  return raster;
}

/**
 * The corner, magnified, across one sweep.
 *
 * The first version of this sheet showed whole portraits, and at that size the
 * mark is eleven pixels in a ninety-six pixel cell — too small to judge the
 * thing the sheet exists to judge. Cropping to the corner and scaling hard is
 * the point: a sheen that does not read, a silhouette with spindly legs or a
 * twinkle that fires too often are all invisible at portrait scale and obvious
 * here. The last frame of each row is the resting state.
 */
// `--full` swaps the magnified corner for whole portraits, which is the only
// way to judge whether the mark is the right size *relative to a face* rather
// than pretty in isolation.
const FULL = process.argv.includes('--full');
const CROP = FULL ? CELL : 20;
const FRAMES = FULL ? 3 : 7;

function corner(cell: Raster): Uint8ClampedArray {
  const out = new Uint8ClampedArray(CROP * CROP * 4);
  for (let y = 0; y < CROP; y += 1) {
    for (let x = 0; x < CROP; x += 1) {
      const from = (y * cell.width + (cell.width - CROP + x)) * 4;
      out.set(cell.data.subarray(from, from + 4), (y * CROP + x) * 4);
    }
  }
  return out;
}

// Sampled across the sweep rather than the whole cycle, because the shape is at
// rest for most of the cycle by design and six identical frames prove nothing.
const rows: Uint8ClampedArray[][] = FULL
  ? [[
    corner(renderOne('none', null, 'Farmer', 0)),
    corner(renderOne('star', 'star', 'Magistrate', 2600 * 0.17)),
    corner(renderOne('diamond', 'diamond', 'Viceroy', 3400 * 0.05)),
  ]]
  : [
    Array.from({ length: FRAMES }, (_, i) =>
      corner(renderOne('star', 'star', 'Magistrate', (2600 * 0.34 * i) / (FRAMES - 2)))),
    Array.from({ length: FRAMES }, (_, i) =>
      corner(renderOne('diamond', 'diamond', 'Viceroy', (3400 * 0.14 * i) / (FRAMES - 2)))),
  ];

const cols = rows[0].length;
const width = CROP * cols;
const height = CROP * rows.length;
const sheet = new Uint8ClampedArray(width * height * 4);
rows.forEach((row, rowIndex) => {
  row.forEach((cell, colIndex) => {
    for (let y = 0; y < CROP; y += 1) {
      for (let x = 0; x < CROP; x += 1) {
        const from = (y * CROP + x) * 4;
        const to = ((rowIndex * CROP + y) * width + colIndex * CROP + x) * 4;
        sheet.set(cell.subarray(from, from + 4), to);
      }
    }
  });
});

const scaled = scaleRGBA(sheet, width, height, FULL ? 5 : 14);
const outfile = process.argv[2] || 'distinction-sheet.png';
writeFileSync(outfile, encodePNG(scaled.data, scaled.width, scaled.height));
console.log(`distinction sheet written: ${outfile} (${scaled.width}x${scaled.height})`);
