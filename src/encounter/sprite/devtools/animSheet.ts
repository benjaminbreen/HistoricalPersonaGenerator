/**
 * encounter/sprite/devtools/animSheet.ts
 *
 * Every animation, laid out flat on a white ground with the floor drawn in.
 *
 *   npm run anim-sheet                          # all ten, one persona
 *   npm run anim-sheet -- out.png lunge 4       # one animation, 4x
 *   npm run anim-sheet -- out.png all 3 12345   # a particular persona
 *   npm run anim-sheet -- out.png idle          # the idle cycle over a minute
 *
 * The animations were the least-examined part of the sprite for a simple
 * reason: nothing could render them but the browser, and the browser renders
 * them at 24fps for a third of a second. Sampling the same envelope the canvas
 * plays (`anim.ts`) and printing the samples side by side turns a thing you
 * have to catch into a thing you can look at.
 *
 * Three marks make the sheet diagnostic rather than decorative:
 *
 *  · **The ground line**, drawn at the same y in every cell. A sole that
 *    leaves it, or sinks below it, is instantly visible — and sinking is the
 *    failure nobody ever notices in motion.
 *  · **The rest plumb line**, at the figure's un-translated centre. The gap
 *    between it and the figure is the frame's `dx`, so a pose that travels
 *    without its feet moving reads as exactly what it is: skating.
 *  · **The elapsed time**, under each cell, so a sheet can be read against the
 *    envelope's own numbers.
 */

import '../../../components/portraitLab/devtools/nodeShims';
import { writeFileSync } from 'node:fs';
import { encodePNG, scaleRGBA } from '../../../components/portraitLab/devtools/png';
import { generateHistoricalPersona } from '../../../services/personaGenerator';
import { buildSpriteSource } from '../spriteSource';
import { compileSprite, FrameId, SPRITE_H, SPRITE_W } from '../drawSprite';
import { GROUND_Y } from '../skeleton';
import {
  ALL_ANIMS, animFrame, ANIM_MS, idleClock, idlePose, idleSway, SpriteAnim,
} from '../anim';
import { Canvas, Ground } from './sheet';

const args = process.argv.slice(2).filter(a => a !== '--');
const outPath = args[0] || 'anim-sheet.png';
const which = (args[1] || 'all').toLowerCase();
const scale = Number(args[2]) || 3;
const seed = Number(args[3]) || 4242;
const ground: Ground = args.includes('dark') ? 'dark' : 'white';

const persona = generateHistoricalPersona({ seed });
const source = buildSpriteSource(persona.character as never);
const compiled = compileSprite(source);

/** How many samples to take across an envelope. Enough to read, few enough to fit. */
const COLUMNS = 10;

interface Cell {
  raster: ReturnType<typeof compiled.frame>;
  dx: number;
  dy: number;
  label: string;
  /** The white impact flash, which is part of the timing and worth seeing. */
  flash: number;
  /** The fallen frame is the standing raster turned on its side, so it lays out differently. */
  fallen: boolean;
}

interface Row {
  title: string;
  cells: Cell[];
}

function sampleAnim(anim: SpriteAnim): Row {
  const total = ANIM_MS[anim];
  const cells: Cell[] = [];
  for (let i = 0; i < COLUMNS; i += 1) {
    const t = Math.round((i / (COLUMNS - 1)) * total);
    const f = animFrame(anim, t);
    // Past the end of the envelope the figure is back on the idle brain, which
    // is worth showing: an animation that does not return cleanly to `stand`
    // shows up here as a jump in the last cell.
    const pose: FrameId = f ? f.pose : 'stand';
    cells.push({
      raster: compiled.frame(pose),
      dx: f?.dx ?? 0,
      dy: f?.dy ?? 0,
      flash: f?.flash ?? 0,
      fallen: pose === 'fallen',
      label: `${t} ${pose}`,
    });
  }
  return { title: anim, cells };
}

function sampleIdle(): Row {
  const clock = idleClock(compiled.seed);
  const cells: Cell[] = [];
  // Across a full minute, so the blink and the glance — which are minutes
  // apart by design — actually appear on the sheet.
  for (let i = 0; i < COLUMNS; i += 1) {
    const t = Math.round((i / COLUMNS) * 60000);
    const pose = idlePose(clock, t, false);
    cells.push({
      raster: compiled.frame(pose),
      dx: idleSway(clock, t, pose),
      dy: 0,
      flash: 0,
      fallen: false,
      label: `${Math.round(t / 100) / 10}s ${pose}`,
    });
  }
  return { title: 'idle', cells };
}

const rows: Row[] = which === 'idle'
  ? [sampleIdle()]
  : which === 'all'
    ? [sampleIdle(), ...ALL_ANIMS.map(sampleAnim)]
    : ALL_ANIMS.includes(which as SpriteAnim)
      ? [sampleAnim(which as SpriteAnim)]
      : [];

if (!rows.length) {
  console.error(`Unknown animation "${which}". One of: idle, all, ${ALL_ANIMS.join(', ')}`);
  process.exit(1);
}

// The figures are cropped to their own content, so an empty band of sky over
// every cell is not paid for ten times.
const top = compiled.contentTop;
const cellW = SPRITE_W;
const cellH = SPRITE_H - top + 12;
const labelW = 46;
const gap = 3;
const width = labelW + COLUMNS * cellW + (COLUMNS + 1) * gap;
const height = rows.length * cellH + (rows.length + 1) * gap;
const canvas = new Canvas(width, height, ground);

const INK: [number, number, number] = ground === 'dark' ? [210, 200, 190] : [70, 70, 78];
const FLOOR: [number, number, number] = ground === 'dark' ? [120, 100, 84] : [196, 120, 110];
const PLUMB: [number, number, number] = ground === 'dark' ? [80, 92, 110] : [168, 184, 208];

rows.forEach((row, r) => {
  const y0 = gap + r * cellH;
  // Where row `top` of a sprite raster lands. Everything above it in the grid
  // is guaranteed empty, so the sheet does not pay for it eleven times over.
  const originY = y0 - top;
  const floorY = originY + GROUND_Y;
  canvas.text(row.title, 2, y0 + Math.round(cellH / 2) - 4, INK);
  row.cells.forEach((cell, c) => {
    const x0 = labelW + gap + c * (cellW + gap);
    // The floor, first, so the figure stands on it.
    canvas.hLine(floorY, x0, x0 + cellW - 1, FLOOR, 0.85);
    // The rest plumb line: where the figure would be with dx = 0.
    canvas.vLine(x0 + Math.round(SPRITE_W / 2), y0, floorY, PLUMB, 0.7, 3);
    if (cell.fallen) {
      // Fallen art is H wide × W tall, and it has to be sat on the ground line
      // rather than pinned to the grid's origin like everything else.
      canvas.blit(cell.raster, x0 + cell.dx + Math.round((cellW - SPRITE_H) / 2), floorY - SPRITE_W + cell.dy);
    } else {
      canvas.blit(cell.raster, x0 + cell.dx, originY + cell.dy);
    }
    if (cell.flash > 0) {
      for (let y = y0; y < y0 + cellH - 12; y += 1) {
        for (let x = x0; x < x0 + cellW; x += 1) canvas.pixel(x, y, 255, 240, 200, cell.flash * 0.30);
      }
    }
    canvas.text(cell.label, x0 + 1, y0 + cellH - 10, INK);
  });
});

const scaled = scaleRGBA(canvas.data, width, height, scale);
writeFileSync(outPath, encodePNG(scaled.data, scaled.width, scaled.height));
console.log(
  `${outPath}: ${rows.length} row(s) × ${COLUMNS} at ${scale}x — ` +
  `${persona.character.name}, ${persona.character.gender} ${persona.character.age}, ` +
  `${persona.character.equippedItems?.torso?.name ?? 'no torso item'} (seed ${seed})`,
);
rows.forEach(row => console.log(`  ${row.title}: ${row.cells.map(c => c.label.split(' ')[1]).join(' ')}`));
