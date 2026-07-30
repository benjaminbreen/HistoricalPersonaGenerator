/**
 * portraitLab/devtools/renderSheet.ts
 *
 * Renders the fixture set to a PNG contact sheet from the command line:
 *
 *   npx esbuild src/components/portraitLab/devtools/renderSheet.ts \
 *     --bundle --platform=node --format=esm --outfile=/tmp/renderSheet.mjs
 *   node /tmp/renderSheet.mjs out.png
 *
 * Being able to look at the art without a browser is what makes iterating on
 * five-pixel noses tractable.
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { CANVAS } from '../spec/anatomy';
import { idleFrame } from '../render/animation';
import { allFixtures, sheets, Fixture } from '../fixtures';
import { encodePNG, scaleRGBA } from './png';

const CELL = CANVAS;

function renderOne(fixture: Fixture, timeMs: number): Raster {
  const spec = buildPortraitSpec(fixture.character);
  const compiled = compilePortrait(spec);
  const target = new Raster(CELL, CELL);
  const state = idleFrame(timeMs, {
    seed: spec.seed,
    resting: restingExpression(spec.mood, spec.condition),
    mood: spec.mood,
    hairMoves: false,
    reducedMotion: timeMs === 0,
  });
  renderFrame(compiled, state, target);
  return target;
}

function composite(fixtures: Fixture[], columns: number, timeMs: number) {
  const rows = Math.ceil(fixtures.length / columns);
  const gap = 4;
  const width = columns * CELL + (columns + 1) * gap;
  const height = rows * CELL + (rows + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);

  // Neutral grey surround so the portrait edges are honestly visible.
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 26;
    out[i * 4 + 1] = 26;
    out[i * 4 + 2] = 30;
    out[i * 4 + 3] = 255;
  }

  fixtures.forEach((fixture, index) => {
    const raster = renderOne(fixture, timeMs);
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x0 = gap + col * (CELL + gap);
    const y0 = gap + row * (CELL + gap);
    for (let y = 0; y < CELL; y += 1) {
      for (let x = 0; x < CELL; x += 1) {
        const si = (y * CELL + x) * 4;
        const ti = ((y0 + y) * width + x0 + x) * 4;
        out[ti] = raster.data[si];
        out[ti + 1] = raster.data[si + 1];
        out[ti + 2] = raster.data[si + 2];
        out[ti + 3] = 255;
      }
    }
  });

  return { data: out, width, height };
}

const [, , target = 'portrait-sheet.png', mode = 'all', scaleArg = '3'] = process.argv;
const scale = Number(scaleArg) || 3;

// `mode` is a sheet id, `all`, or a substring matched against fixture names —
// the last one is for zooming in on a single face while iterating on it.
const bySheet = sheets.find(sheet => sheet.id === mode)?.fixtures;
const byName = allFixtures.filter(f => f.name.toLowerCase().includes(mode.toLowerCase()));
const fixtures = mode === 'all' ? allFixtures : bySheet ?? (byName.length ? byName : allFixtures);

const columns = mode === 'all' ? 6 : Math.min(6, fixtures.length);
const sheet = composite(fixtures, columns, 0);
const scaled = scaleRGBA(sheet.data, sheet.width, sheet.height, scale);
writeFileSync(target, encodePNG(scaled.data, scaled.width, scaled.height));

process.stdout.write(
  `wrote ${target} — ${fixtures.length} portraits, ${scaled.width}x${scaled.height}\n`
);
