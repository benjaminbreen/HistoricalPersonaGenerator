/**
 * encounter/sprite/devtools/poseSheet.ts
 *
 * Every compiled pose, on white, over a drawn floor — optionally with the
 * solved skeleton laid on top of it.
 *
 *   npm run pose-sheet                             # 3 personas × every pose
 *   npm run pose-sheet -- out.png 5 3 joints       # 5 personas, 3x, joint overlay
 *   npm run pose-sheet -- out.png 6 4 bare         # only bare-chested figures
 *   npm run pose-sheet -- out.png 4 3 joints robe  # filters compose
 *
 * The `joints` overlay is the reason this exists next to `sprite-sheet`. A
 * rendered arm tells you *that* an elbow looks wrong; it never tells you where
 * the renderer thinks the elbow is. Those are different faults with different
 * fixes — a bad chain, or a good chain with a bad capsule around it — and
 * without the overlay the only way to tell them apart is to guess.
 *
 * The filter matches the garment kind, the garment's own name, the
 * construction, the footwear and the gender, so `bare`, `dhoti`, `boot`,
 * `female` and `wrapped_lower` all work.
 */

import '../../../components/portraitLab/devtools/nodeShims';
import { writeFileSync } from 'node:fs';
import { encodePNG, scaleRGBA } from '../../../components/portraitLab/devtools/png';
import { generateHistoricalPersona } from '../../../services/personaGenerator';
import { buildSpriteSource, SpriteSource } from '../spriteSource';
import {
  compileSprite, FrameId, poseLandmarks, PoseLandmarks, SPRITE_H, SPRITE_W,
} from '../drawSprite';
import { GROUND_Y } from '../skeleton';
import { readShape } from '../construction';
import { Canvas, Ground } from './sheet';

const args = process.argv.slice(2).filter(a => a !== '--');
const outPath = args[0] || 'pose-sheet.png';
const count = Number(args[1]) || 3;
const scale = Number(args[2]) || 3;
const flags = args.slice(3).map(a => a.toLowerCase());
const joints = flags.includes('joints');
const ground: Ground = flags.includes('dark') ? 'dark' : 'white';
const only = flags.find(f => f.startsWith('poses:'))?.slice(6).split(',').filter(Boolean) ?? [];
const filter = flags
  .filter(f => f !== 'joints' && f !== 'dark' && !f.startsWith('poses:'))
  .join(' ').trim();

const ALL_POSES: FrameId[] = [
  'stand', 'stand2', 'standBreathe', 'standBreathe2', 'blink', 'talk', 'glance',
  'bowLight', 'bowDeep', 'reach', 'raise', 'offer',
  'stepFwd', 'stepBack', 'lunge', 'recoil', 'crouch', 'shrug',
];
// `poses:lunge,crouch` narrows the sheet so a handful can be looked at large,
// which at 6x is the only way to judge a joint at all.
// Matched case-insensitively: the flags are lower-cased on the way in and the
// pose ids are camelCase, so `poses:stepfwd` silently matched nothing.
const POSES = only.length
  ? ALL_POSES.filter(p => only.includes(p.toLowerCase()))
  : ALL_POSES;
if (!POSES.length) {
  console.error(`No poses match "${only.join(',')}". One of: ${ALL_POSES.join(', ')}`);
  process.exit(1);
}

interface Pick {
  label: string;
  source: SpriteSource;
}

/**
 * Everything the filter is allowed to match on, as one lower-case haystack.
 *
 * The resolved *construction* is in here alongside the garment's own kind and
 * name, plus the synthetic `barechest` / `baremidriff` tokens — because the
 * question one actually wants to ask this tool is "show me the figures with
 * skin on show", and no single field on the spec answers it. `bare` alone is
 * ambiguous (it is also a footwear kind), so the synthetic tokens are spelled
 * out rather than inferred.
 */
function haystack(source: SpriteSource, name: string): string {
  const g = source.spec.garment;
  const shape = readShape(source.spec, source.extras.worn?.name ?? '');
  return [
    name, g.kind, g.name, g.material, source.spec.gender, source.spec.build,
    `foot-${source.extras.footwear}`, source.extras.stance, shape.construction,
    source.spec.headwear?.kind ?? '',
    shape.bareChest ? 'barechest' : '',
    shape.bareMidriff ? 'baremidriff' : '',
  ].join(' ').toLowerCase();
}

const picks: Pick[] = [];
for (let i = 0; i < 6000 && picks.length < count; i += 1) {
  const persona = generateHistoricalPersona({ seed: 7000 + i * 4211 });
  const source = buildSpriteSource(persona.character as never);
  const label = `${persona.character.name} ${persona.character.profession}`;
  if (filter && !filter.split(' ').every(f => haystack(source, label).includes(f))) continue;
  picks.push({ label: `${persona.character.gender[0]}${persona.character.age} ${source.spec.garment.kind}`, source });
}

if (!picks.length) {
  console.error(`No personas match "${filter}".`);
  process.exit(1);
}

const compiled = picks.map(p => compileSprite(p.source));
// One crop for the whole sheet, so the floor line lands at the same row in
// every cell however tall the person in it is.
const top = Math.min(...compiled.map(c => c.contentTop));
const cellW = SPRITE_W;
const cellH = SPRITE_H - top + 11;
const labelW = 58;
const gap = 3;
const width = labelW + POSES.length * cellW + (POSES.length + 1) * gap;
const height = picks.length * cellH + (picks.length + 1) * gap + 11;
const canvas = new Canvas(width, height, ground);

const INK: [number, number, number] = ground === 'dark' ? [210, 200, 190] : [70, 70, 78];
const FLOOR: [number, number, number] = ground === 'dark' ? [120, 100, 84] : [196, 120, 110];
const BONE: [number, number, number] = [40, 150, 220];
const JOINT: [number, number, number] = [230, 60, 90];

function line(c: Canvas, a: [number, number], b: [number, number], rgb: [number, number, number]): void {
  const steps = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1])));
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    c.pixel(Math.round(a[0] + (b[0] - a[0]) * u), Math.round(a[1] + (b[1] - a[1]) * u), rgb[0], rgb[1], rgb[2], 0.85);
  }
}

function dot(c: Canvas, p: [number, number], rgb: [number, number, number]): void {
  c.pixel(p[0], p[1], rgb[0], rgb[1], rgb[2]);
  c.pixel(p[0] + 1, p[1], rgb[0], rgb[1], rgb[2], 0.6);
  c.pixel(p[0] - 1, p[1], rgb[0], rgb[1], rgb[2], 0.6);
  c.pixel(p[0], p[1] + 1, rgb[0], rgb[1], rgb[2], 0.6);
  c.pixel(p[0], p[1] - 1, rgb[0], rgb[1], rgb[2], 0.6);
}

/** `originY` is where sprite row 0 lands — the same frame the blit uses. */
function overlay(c: Canvas, lm: PoseLandmarks, x0: number, originY: number): void {
  const at = (p: [number, number]): [number, number] => [x0 + p[0], originY + p[1]];
  for (const key of ['far', 'near'] as const) {
    const a = lm.arms[key];
    line(c, at(a.shoulder), at(a.elbow), BONE);
    line(c, at(a.elbow), at(a.wrist), BONE);
    line(c, at(a.wrist), at(a.hand), BONE);
    [a.shoulder, a.elbow, a.wrist].forEach(p => dot(c, at(p), JOINT));
    const l = lm.legs[key];
    line(c, at(l.hip), at(l.knee), BONE);
    line(c, at(l.knee), at(l.ankle), BONE);
    [l.hip, l.knee, l.ankle].forEach(p => dot(c, at(p), JOINT));
  }
  line(c, at(lm.crown), at(lm.shoulder), BONE);
  line(c, at(lm.shoulder), at(lm.hipCentre), BONE);
}

POSES.forEach((id, c) => {
  canvas.text(id, labelW + gap + c * (cellW + gap) + 1, 2, INK);
});

picks.forEach((pick, r) => {
  const y0 = gap + 11 + r * cellH;
  // Sprite row `top` sits at `y0`, so sprite row 0 sits `top` rows above it.
  // Blit, floor line and joint overlay all read this one number; when they
  // each did their own arithmetic the skeleton floated above the head.
  const originY = y0 - top;
  canvas.text(pick.label, 2, y0 + Math.round(cellH / 2) - 4, INK);
  POSES.forEach((id, c) => {
    const x0 = labelW + gap + c * (cellW + gap);
    canvas.hLine(originY + GROUND_Y, x0, x0 + cellW - 1, FLOOR, 0.8);
    canvas.blit(compiled[r].frame(id), x0, originY);
    if (joints) overlay(canvas, poseLandmarks(pick.source, id), x0, originY);
  });
});

const scaled = scaleRGBA(canvas.data, width, height, scale);
writeFileSync(outPath, encodePNG(scaled.data, scaled.width, scaled.height));
console.log(`${outPath}: ${picks.length} personas × ${POSES.length} poses at ${scale}x${joints ? ' with joints' : ''}`);
picks.forEach(p => console.log(`  ${p.label} · ${p.source.spec.garment.name} · ${p.source.extras.footwear}`));
