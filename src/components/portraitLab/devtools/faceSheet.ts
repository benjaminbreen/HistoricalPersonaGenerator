/**
 * portraitLab/devtools/faceSheet.ts
 *
 * The skull axis, laid out as a grid: every face shape crossed with every
 * jawline, on one seed, bald, with no garment or headwear to look at instead.
 *
 * This is the sheet that should have existed before the shape modifiers were
 * ever touched. The `features` fixture sheet varies five things at once and
 * shows twelve portraits in a row, which is enough to tell you the axis is too
 * subtle and not enough to tell you it has gone wrong — a corner in one
 * silhouette hides among eleven neighbours. A grid with one variable per axis
 * makes a deformed outline obvious at a glance.
 *
 *   npm run face-sheet -- out.png
 *   npm run face-sheet -- cheeks.png cheeks    # shapes × cheekbones instead
 */

import { writeFileSync } from 'node:fs';
import { Raster } from '../core/raster';
import { buildPortraitSpec, restingExpression } from '../spec/buildSpec';
import { compilePortrait, renderFrame } from '../render/pipeline';
import { CANVAS } from '../spec/anatomy';
import { idleFrame } from '../render/animation';
import { encodePNG, scaleRGBA } from './png';

const CELL = CANVAS;

const SHAPES = ['oval', 'round', 'square', 'long', 'heart', 'diamond'] as const;
const JAWLINES = ['sharp', 'soft', 'square', 'round', 'oval'] as const;
const CHEEKBONES = ['low', 'average', 'high'] as const;

function renderOne(shape: string, jawline: string, cheekbones: string, build: string): Raster {
  const character: any = {
    name: `${shape}-${jawline}`,
    age: 34,
    gender: 'Male',
    profession: 'Farmer',
    portraitSeed: 909,
    appearance: {
      skinColor: '#c98d63',
      hairColor: '#3b2a1d',
      // Bald and bare: the whole point is to see the skull, and hair is the
      // single most effective thing at hiding a bad one.
      hairLength: 'bald',
      hairstyle: 'shaved_head',
      faceShape: shape,
      jawline,
      cheekbones,
      build,
      facialHairStyle: 'none',
    },
    equippedItems: { torso: { name: 'Simple Tunic', material: 'Linen' } },
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
  const outfile = process.argv[2] || 'face-sheet.png';
  const mode = process.argv[3] || 'jaw';
  const scale = Number(process.argv[4]) || 5;

  // Rows are face shapes; columns are whichever second axis was asked for.
  const columns = mode === 'cheeks' ? CHEEKBONES : JAWLINES;
  const cells: Array<{ shape: string; second: string }> = [];
  for (const shape of SHAPES) {
    for (const second of columns) cells.push({ shape, second });
  }

  const cols = columns.length;
  const rows = SHAPES.length;
  const gap = 4;
  const width = cols * CELL + (cols + 1) * gap;
  const height = rows * CELL + (rows + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 26; out[i * 4 + 1] = 26; out[i * 4 + 2] = 30; out[i * 4 + 3] = 255;
  }

  cells.forEach((cell, index) => {
    const raster = mode === 'cheeks'
      ? renderOne(cell.shape, 'soft', cell.second, 'average')
      : renderOne(cell.shape, cell.second, 'average', 'average');
    const col = index % cols;
    const row = Math.floor(index / cols);
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

  const scaled = scaleRGBA(out, width, height, scale);
  writeFileSync(outfile, encodePNG(scaled.data, scaled.width, scaled.height));
  console.log(
    `wrote ${outfile} — ${SHAPES.length} shapes × ${cols} ${mode === 'cheeks' ? 'cheekbones' : 'jawlines'}`
  );
}

main();
