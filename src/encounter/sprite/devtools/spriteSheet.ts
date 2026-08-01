/**
 * encounter/sprite/devtools/spriteSheet.ts
 *
 * The sprite equivalent of `npm run portrait-sheet`: renders battle sprites
 * to a PNG from the terminal, which is what makes iterating on them
 * tractable.
 *
 *   npm run sprite-sheet -- out.png            # every fixture, standing
 *   npm run sprite-sheet -- out.png poses      # one fixture in every pose
 *   npm run sprite-sheet -- out.png hood 6     # name filter, 6x scale
 */

import '../../../components/portraitLab/devtools/nodeShims';
import { writeFileSync } from 'node:fs';
import { allFixtures, Fixture } from '../../../components/portraitLab/fixtures';
import { encodePNG, scaleRGBA } from '../../../components/portraitLab/devtools/png';
import { generateHistoricalPersona } from '../../../services/personaGenerator';
import { buildSpriteSource } from '../spriteSource';
import { compileSprite, FrameId, SPRITE_H, SPRITE_W } from '../drawSprite';
import { Raster } from '../../../components/portraitLab/core/raster';

const args = process.argv.slice(2).filter((a) => a !== '--');
const outPath = args[0] || 'sprite-sheet.png';
const filter = args[1] && !/^\d+$/.test(args[1]) ? args[1].toLowerCase() : '';
const posesMode = filter === 'poses';
// `random [count] [scale]` runs the app's real generator — real clothes, real
// colors — which is what the fixture set (one gray tunic) cannot show.
const randomMode = filter.startsWith('random');
const randomCount = randomMode ? Number(args[2]) || 16 : 0;
const scale = randomMode
  ? Number(args[3]) || 3
  : Number(args.find((a, i) => i >= 1 && /^\d+$/.test(a))) || 3;

interface Cell {
  label: string;
  raster: Raster;
}

const POSE_FRAMES: FrameId[] = [
  // The four idle frames first, in cycle order — this is the run to watch when
  // checking that the drape's wind actually travels.
  'stand', 'stand2', 'standBreathe', 'standBreathe2',
  'blink', 'talk', 'glance', 'bowLight', 'bowDeep', 'reach', 'raise', 'offer',
];

function cellsFor(fixture: Fixture): Cell[] {
  const source = buildSpriteSource(fixture.character as any);
  const compiled = compileSprite(source);
  if (!posesMode) return [{ label: fixture.name, raster: compiled.frame('stand') }];
  return POSE_FRAMES.map((id) => ({ label: id, raster: compiled.frame(id) }));
}

const fixtures: Fixture[] = randomMode
  ? Array.from({ length: randomCount }, (_, i) => {
      const persona = generateHistoricalPersona({ seed: 1000 + i * 7919 });
      return {
        name: `${persona.character.name} · ${persona.character.profession}`,
        note: `${persona.location} ${persona.year}`,
        character: persona.character as Fixture['character'],
      };
    })
  : posesMode
    ? allFixtures.slice(0, 4)
    : filter
      ? allFixtures.filter((f) => `${f.name} ${f.note}`.toLowerCase().includes(filter))
      : allFixtures;

if (!fixtures.length) {
  console.error(`No fixtures match "${filter}".`);
  process.exit(1);
}

const cells = fixtures.flatMap(cellsFor);
const columns = Math.min(cells.length, posesMode ? 10 : 8);
const rows = Math.ceil(cells.length / columns);
const gap = 6;
const cellW = SPRITE_W;
const cellH = SPRITE_H;
const width = columns * cellW + (columns + 1) * gap;
const height = rows * cellH + (rows + 1) * gap;
const out = new Uint8ClampedArray(width * height * 4);

// Warm dark ground, close to the encounter scene, so colors read in context.
for (let i = 0; i < width * height; i += 1) {
  out[i * 4] = 34;
  out[i * 4 + 1] = 26;
  out[i * 4 + 2] = 20;
  out[i * 4 + 3] = 255;
}

cells.forEach((cell, index) => {
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x0 = gap + col * (cellW + gap);
  const y0 = gap + row * (cellH + gap);
  const { raster } = cell;
  for (let y = 0; y < raster.height; y += 1) {
    for (let x = 0; x < raster.width; x += 1) {
      const si = (y * raster.width + x) * 4;
      if (raster.data[si + 3] === 0) continue;
      const ti = ((y0 + y) * width + x0 + x) * 4;
      out[ti] = raster.data[si];
      out[ti + 1] = raster.data[si + 1];
      out[ti + 2] = raster.data[si + 2];
      out[ti + 3] = 255;
    }
  }
});

const scaled = scaleRGBA(out, width, height, scale);
writeFileSync(outPath, encodePNG(scaled.data, scaled.width, scaled.height));
console.log(`${outPath}: ${cells.length} sprites (${fixtures.length} fixtures) at ${scale}x`);
cells.slice(0, columns * rows).forEach((c, i) => {
  if (i % columns === 0) console.log(`row ${Math.floor(i / columns) + 1}: ${cells.slice(i, i + columns).map((x) => x.label).join(' · ')}`);
});
