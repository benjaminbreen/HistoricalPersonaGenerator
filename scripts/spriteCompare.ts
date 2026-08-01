/**
 * scripts/spriteCompare.ts — a rank of generated figures on a light ground,
 * which is how they get compared against the style mockups.
 *
 *   npm run sprite-compare -- out.png [count] [scale] [filter]
 *
 * `filter` picks a garment kind (robe, tunic, …) so a change to one garment
 * type can be looked at without hunting through random draws.
 */
import '../src/components/portraitLab/devtools/nodeShims';
import { writeFileSync } from 'node:fs';
import { encodePNG, scaleRGBA } from '../src/components/portraitLab/devtools/png';
import { generateHistoricalPersona } from '../src/services/personaGenerator';
import { buildSpriteSource } from '../src/encounter/sprite/spriteSource';
import { compileSprite, SPRITE_H, SPRITE_W } from '../src/encounter/sprite/drawSprite';
import { buildSkeleton } from '../src/encounter/sprite/skeleton';

const args = process.argv.slice(2).filter(a => a !== '--');
const out = args[0] || 'sprite-compare.png';
const want = Number(args[1]) || 6;
const scale = Number(args[2]) || 4;
const filter = (args[3] || '').toLowerCase();

const picks: any[] = [];
for (let i = 0; i < 4000 && picks.length < want; i += 1) {
  const p = generateHistoricalPersona({ seed: 2000 + i * 6113 });
  const src = buildSpriteSource(p.character as any);
  if (filter && !`${src.spec.garment.kind} ${src.spec.garment.name} ${src.spec.headwear?.kind ?? ''}`.toLowerCase().includes(filter)) continue;
  picks.push({ p, src });
}
picks.forEach(x => {
  const sk = buildSkeleton(x.src.spec);
  console.log(
    `${x.p.character.name} · ${x.src.spec.garment.name} · ${x.src.spec.build}`,
    `head=${sk.headH} h=${sk.floorY - sk.crownY} heads=${((sk.floorY - sk.crownY) / sk.headH).toFixed(2)}`,
  );
});

const frames = picks.map(x => compileSprite(x.src).frame('stand'));
const gap = 3, cols = Math.max(1, frames.length);
const W = cols * SPRITE_W + (cols + 1) * gap, H = SPRITE_H + 2 * gap;
const buf = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < W * H; i += 1) { buf[i*4]=242; buf[i*4+1]=242; buf[i*4+2]=240; buf[i*4+3]=255; }
frames.forEach((r, i) => {
  const x0 = gap + i * (SPRITE_W + gap);
  for (let y = 0; y < SPRITE_H; y += 1) for (let x = 0; x < SPRITE_W; x += 1) {
    const si = (y * SPRITE_W + x) * 4; if (r.data[si+3] === 0) continue;
    const ti = ((gap + y) * W + x0 + x) * 4;
    buf[ti]=r.data[si]; buf[ti+1]=r.data[si+1]; buf[ti+2]=r.data[si+2]; buf[ti+3]=255;
  }
});
const s = scaleRGBA(buf, W, H, scale);
writeFileSync(out, encodePNG(s.data, s.width, s.height));
