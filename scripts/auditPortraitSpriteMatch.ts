/**
 * scripts/auditPortraitSpriteMatch.ts
 *
 * Do the bust and the sprite show the same person?
 *
 * They are two renderers over one `PortraitSpec`, which is supposed to make
 * agreement automatic. It does not: each view decides for itself what it can
 * show, and those decisions have drifted apart — a headscarf the sprite draws
 * and the portrait crops away, a garment colour the two sample differently, a
 * beard one of them declines to render. The card puts both images side by side,
 * so every one of those reads as a bug to whoever is looking at it.
 *
 * This is a *measurement*, not a fix. It renders both views of the same
 * persona, samples each for the facts that ought to agree, and reports where
 * they do not — so the disagreements can be ranked by how often they happen
 * rather than by which one was noticed first.
 *
 *   npm run match-audit            # 120 personas, summary
 *   npm run match-audit -- 400     # more
 *   npm run match-audit -- 120 -v  # list every mismatch
 */

import '../src/components/portraitLab/devtools/nodeShims';
import { generateHistoricalPersona } from '../src/services/personaGenerator';
import { buildSpriteSource, SpriteSource } from '../src/encounter/sprite/spriteSource';
import { compileSprite, SPRITE_W } from '../src/encounter/sprite/drawSprite';
import { buildSkeleton } from '../src/encounter/sprite/skeleton';
import { headLayout } from '../src/encounter/sprite/spriteHead';
import { compilePortrait, renderFrame, RESTING_FRAME } from '../src/components/portraitLab/render/pipeline';
import { buildAnatomy } from '../src/components/portraitLab/spec/anatomy';
import { MAT, Raster } from '../src/components/portraitLab/core/raster';
import { RGB } from '../src/components/portraitLab/core/color';
import { PortraitSpec } from '../src/components/portraitLab/spec/types';

const args = process.argv.slice(2).filter(a => a !== '--');
const COUNT = Number(args.find(a => /^\d+$/.test(a))) || 120;
const VERBOSE = args.includes('-v');

/**
 * The mean colour of a material in a raster.
 *
 * Deliberately the mean and not the mode. The sprite stretches skin and cloth
 * contrast beyond what the bust uses — a 32px head needs a wider range than a
 * face that fills the frame — which moves the *most common* value even when
 * the two views are showing exactly the same person under the same lamp.
 * Averaging is blind to that redistribution and only reports a genuine shift
 * in what colour the thing is.
 */
function dominant(r: Raster, mat: number): RGB | null {
  let n = 0; let sr = 0; let sg = 0; let sb = 0;
  for (let i = 0; i < r.width * r.height; i += 1) {
    if (r.mat[i] !== mat || r.data[i * 4 + 3] === 0) continue;
    sr += r.data[i * 4]; sg += r.data[i * 4 + 1]; sb += r.data[i * 4 + 2]; n += 1;
  }
  if (n < 6) return null;
  return { r: Math.round(sr / n), g: Math.round(sg / n), b: Math.round(sb / n) };
}

function has(r: Raster, mat: number, min = 4): boolean {
  let n = 0;
  for (let i = 0; i < r.width * r.height; i += 1) {
    if (r.mat[i] === mat && r.data[i * 4 + 3] !== 0) { n += 1; if (n >= min) return true; }
  }
  return false;
}

/**
 * Hue and value are reported separately, because they mean different things.
 *
 * The sprite carries far more shadow than the bust — folds, the hem's cast,
 * an inked contour, occlusion at every part join — so its mean is reliably
 * *darker* for the same bolt of cloth. That is a lighting difference and a
 * viewer reads it as one figure standing in deeper shade. A **hue** shift is
 * something else entirely: it means the two views picked different colours,
 * and that reads as different clothes on different people. Only the second is
 * a bug, and lumping them together buried it.
 */
function hueOf(c: RGB): number {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  if (max === min) return -1; // greyscale: no meaningful hue
  const d = max - min;
  let h: number;
  if (max === c.r) h = ((c.g - c.b) / d) % 6;
  else if (max === c.g) h = (c.b - c.r) / d + 2;
  else h = (c.r - c.g) / d + 4;
  return ((h * 60) + 360) % 360;
}

/** Chroma, 0…1. Hue is meaningless below about 0.12 of it. */
function chroma(c: RGB): number {
  const max = Math.max(c.r, c.g, c.b);
  const min = Math.min(c.r, c.g, c.b);
  return max === 0 ? 0 : (max - min) / max;
}

function hueGap(a: RGB | null, b: RGB | null): number {
  if (!a || !b) return 0;
  // Near-grey colours have a hue, arithmetically, and it is noise: black hair
  // at (31,30,32) versus (30,31,30) reports a hundred degrees of difference
  // while being visually identical. Most hair in this generator is dark, so
  // without this guard the hair mismatch rate is almost entirely an artefact
  // of measuring hue on greys.
  // 0.12 was still far too permissive. Most hair in this generator is very
  // dark, and a near-black mean carries just enough chroma to clear a low bar
  // while its hue remains numerically unstable — two visually identical blacks
  // reporting a hundred degrees apart. At 0.28 the comparison only fires on
  // hair that actually has a colour.
  if (chroma(a) < 0.28 || chroma(b) < 0.28) return 0;
  const ha = hueOf(a); const hb = hueOf(b);
  if (ha < 0 || hb < 0) return 0;
  const d = Math.abs(ha - hb);
  return Math.min(d, 360 - d);
}

function valueGap(a: RGB | null, b: RGB | null): number {
  if (!a || !b) return 0;
  const la = (a.r + a.g + a.b) / 3;
  const lb = (b.r + b.g + b.b) / 3;
  return Math.round(lb - la); // positive: the portrait is lighter
}

function dist(a: RGB | null, b: RGB | null): number {
  if (!a || !b) return 0;
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

/**
 * Form, as distinct from colour.
 *
 * Everything above this line samples materials: is the skin the same hue, is
 * there hair, is there a hat. None of it can see *shape*, and the only shape
 * check the audit had was `proportion` — heads-tall between 4.6 and 6.4 — which
 * passed on 100% of personas while `faceShape` was moving the bust's skull by
 * 44% and the sprite's by nothing at all. A round-faced woman was drawn round
 * in her portrait and long in her sprite, on one card, and this file reported
 * no mismatch.
 */

/** Materials that make up the head's outline in either view. */
const HEAD_MATS = new Set<number>([
  MAT.SKIN, MAT.HAIR, MAT.BEARD, MAT.HEADWEAR, MAT.HEADWEAR_ACCENT,
  MAT.METAL, MAT.FOLIAGE, MAT.GEM,
]);

/** Width of the head silhouette per row, crown to chin, resampled to 20. */
function headProfile(r: Raster, topY: number, botY: number): number[] {
  const rows: number[] = [];
  for (let y = Math.max(0, topY); y <= Math.min(r.height - 1, botY); y += 1) {
    let lo = -1; let hi = -1;
    for (let x = 0; x < r.width; x += 1) {
      const i = y * r.width + x;
      if (r.data[i * 4 + 3] === 0 || !HEAD_MATS.has(r.mat[i])) continue;
      if (lo < 0) lo = x;
      hi = x;
    }
    rows.push(lo < 0 ? 0 : hi - lo + 1);
  }
  let s = 0;
  while (s < rows.length && rows[s] === 0) s += 1;
  const live = rows.slice(s);
  if (live.length < 8) return [];
  const out: number[] = [];
  for (let i = 0; i < 20; i += 1) {
    out.push(live[Math.min(live.length - 1, Math.round((i / 19) * (live.length - 1)))]);
  }
  return out;
}

/**
 * How far this persona's skull departs from the same persona's *oval* skull,
 * in the renderer's own units.
 *
 * Compared as a ratio rather than an absolute aspect because the two views do
 * not share a base proportion and are not meant to: the bust is a head that
 * fills a frame and the sprite is a head on a five-heads-tall figure. What has
 * to agree is the *departure* — if the card says `round`, both views should be
 * proportionally as much wider-and-shorter than their own oval.
 */
function shapeDeparture(
  spec: PortraitSpec,
  aspectOf: (s: PortraitSpec) => number
): number {
  const base = aspectOf({ ...spec, faceShape: 'oval' });
  return base > 0 ? aspectOf(spec) / base : 1;
}

/** How many pixels a spec change moves in each view. */
interface Moved { portrait: number; sprite: number }

function differing(a: Raster, b: Raster): number {
  let n = 0;
  for (let i = 0; i < a.width * a.height; i += 1) {
    if (a.data[i * 4] !== b.data[i * 4] || a.data[i * 4 + 1] !== b.data[i * 4 + 1]
      || a.data[i * 4 + 2] !== b.data[i * 4 + 2] || a.data[i * 4 + 3] !== b.data[i * 4 + 3]) n += 1;
  }
  return n;
}

function bustOf(spec: PortraitSpec): Raster {
  const compiled = compilePortrait(spec);
  const out = new Raster(compiled.size, compiled.size);
  renderFrame(compiled, RESTING_FRAME, out);
  return out;
}

function movedPixels(
  source: SpriteSource, spec: PortraitSpec, without: PortraitSpec
): Moved {
  const spriteOf = (s: PortraitSpec) => compileSprite({ ...source, spec: s }).frame('stand');
  return {
    portrait: differing(bustOf(spec), bustOf(without)),
    sprite: differing(spriteOf(spec), spriteOf(without)),
  };
}

/** Per-key totals, so a key drawn by neither renderer is visible as a row. */
type Reach = Map<string, { n: number; portrait: number; sprite: number }>;
const featureReach: Reach = new Map();
const markReach: Reach = new Map();
function coverage(into: Reach, key: string, moved: Moved): void {
  const at = into.get(key) ?? { n: 0, portrait: 0, sprite: 0 };
  at.n += 1;
  at.portrait += moved.portrait;
  at.sprite += moved.sprite;
  into.set(key, at);
}

interface Row { name: string; kind: string; detail: string }
const rows: Row[] = [];
const valueSum: number[] = [];
/** [bust, sprite] departure from that renderer's own oval skull. */
const shapeSpread: Array<[number, number]> = [];
/** [bust, sprite] crown flatness, 1.0 being a flat slab. */
const crownFlat: Array<[number, number]> = [];
const counts = new Map<string, number>();
const bump = (k: string) => counts.set(k, (counts.get(k) ?? 0) + 1);

for (let i = 0; i < COUNT; i += 1) {
  const persona = generateHistoricalPersona({ seed: 11000 + i * 5171 });
  const source = buildSpriteSource(persona.character as any);
  const spec = source.spec;
  const sprite = compileSprite(source).frame('stand');
  const compiled = compilePortrait(spec);
  const portrait = new Raster(compiled.size, compiled.size);
  renderFrame(compiled, RESTING_FRAME, portrait);
  const name = `${persona.character.name} (${persona.location} ${persona.year})`;

  // --- Headwear. The spec says whether there is any; both views should agree.
  const wants = !!spec.headwear && spec.headwear.kind !== 'none';
  const inSprite = has(sprite, MAT.HEADWEAR);
  const inPortrait = has(portrait, MAT.HEADWEAR);
  if (wants !== inSprite) {
    bump('headwear-sprite'); rows.push({ name, kind: 'headwear-sprite', detail: `spec says ${spec.headwear?.kind}, sprite ${inSprite ? 'drew' : 'omitted'}` });
  }
  if (wants !== inPortrait) {
    bump('headwear-portrait'); rows.push({ name, kind: 'headwear-portrait', detail: `spec says ${spec.headwear?.kind}, portrait ${inPortrait ? 'drew' : 'omitted'}` });
  }
  if (inSprite !== inPortrait) {
    bump('headwear-disagree'); rows.push({ name, kind: 'headwear-disagree', detail: `sprite ${inSprite}, portrait ${inPortrait}` });
  }

  // --- Garment colour. Same bolt of cloth, so the dominant value should be
  // close; light and fold detail move it a little, wholesale disagreement is
  // a different garment.
  const gs = dominant(sprite, MAT.CLOTH_A);
  const gp = dominant(portrait, MAT.CLOTH_A);
  const gh = hueGap(gs, gp);
  if (gh > 25) { bump('garment-hue'); rows.push({ name, kind: 'garment-hue', detail: `${gh.toFixed(0)}° · ${spec.garment.name}` }); }
  valueSum.push(valueGap(gs, gp));

  // --- Skin. The one thing that must never differ.
  const ss = dominant(sprite, MAT.SKIN);
  const sp = dominant(portrait, MAT.SKIN);
  const sh = hueGap(ss, sp);
  if (sh > 18) { bump('skin-hue'); rows.push({ name, kind: 'skin-hue', detail: `${sh.toFixed(0)}°` }); }
  // Skin value, like hair value and unlike cloth value, is not forgiven.
  // A garment may legitimately sit in deeper shade in the sprite; a face that
  // renders lighter than the same person's bust is a different complexion.
  const sv = valueGap(ss, sp);
  if (Math.abs(sv) > 26) {
    bump('skin-value');
    rows.push({ name, kind: 'skin-value', detail: `Δ${Math.abs(sv)} ${sv > 0 ? 'portrait lighter' : 'SPRITE lighter'}` });
  }

  // --- Hair colour, and whether both drew hair at all.
  const hairS = has(sprite, MAT.HAIR);
  const hairP = has(portrait, MAT.HAIR);
  if (hairS !== hairP) {
    bump('hair-presence'); rows.push({ name, kind: 'hair-presence', detail: `sprite ${hairS}, portrait ${hairP} · ${spec.hairLength}` });
  } else if (hairS) {
    const hs = dominant(sprite, MAT.HAIR);
    const hp = dominant(portrait, MAT.HAIR);
    const hh = hueGap(hs, hp);
    if (hh > 30) { bump('hair-hue'); rows.push({ name, kind: 'hair-hue', detail: `${hh.toFixed(0)}°` }); }
    // Hair needs a *value* check as well, and it is the one that matters most.
    // The chroma guard above deliberately ignores near-greys — which is every
    // black-haired persona in the set — so a bug that renders black hair as
    // silver passes the hue test untouched. That is precisely the bug this
    // audit was shown and failed to catch. Value is not forgiven the way the
    // garment's is: cloth is allowed to sit in deeper shade in the sprite,
    // but hair changing lightness means it changed colour.
    const hv = Math.abs(valueGap(hs, hp));
    if (hv > 42) {
      bump('hair-value');
      const dir = valueGap(hs, hp) > 0 ? 'portrait lighter' : 'SPRITE lighter';
      rows.push({ name, kind: 'hair-value', detail: `Δ${hv} ${dir} · ${spec.hairColor}` });
    }
  }

  // --- Facial hair.
  //
  // Stubble is excluded, and not because it does not matter. The two views
  // render it by deliberately different means — the sprite as sparse
  // beard-coloured pixels, the bust as a darkening of the jaw — so a check on
  // the beard material plane reports one of them as bare no matter which way
  // it is written, while a viewer sees growth on both. This measures *drawn
  // beards*, which both views agree to render as MAT.BEARD; stubble parity is
  // not something a material sample can speak to.
  const drawnBeard = !!spec.facialHair && spec.facialHair.style !== 'stubble';
  const beardS = has(sprite, MAT.BEARD);
  const beardP = has(portrait, MAT.BEARD);
  if (drawnBeard !== beardS && spec.facialHair?.style !== 'stubble') {
    bump('beard-sprite'); rows.push({ name, kind: 'beard-sprite', detail: `spec ${spec.facialHair?.style ?? 'none'}, sprite ${beardS}` });
  }
  if (drawnBeard !== beardP && spec.facialHair?.style !== 'stubble') {
    bump('beard-portrait'); rows.push({ name, kind: 'beard-portrait', detail: `spec ${spec.facialHair?.style ?? 'none'}, portrait ${beardP}` });
  }

  // --- Head proportion sanity, so a regression in stature shows up here too.
  const sk = buildSkeleton(spec);
  const L = headLayout(spec, sk);
  const heads = (sk.floorY - sk.crownY) / Math.max(1, L.H);
  if (heads < 4.6 || heads > 6.4) {
    bump('proportion'); rows.push({ name, kind: 'proportion', detail: `${heads.toFixed(2)} heads · ${spec.build}` });
  }

  // --- Does `faceShape` reach both skulls, by the same proportion?
  const spriteDep = shapeDeparture(spec, (s) => {
    const l = headLayout(s, buildSkeleton(s));
    return l.W / Math.max(1, l.H);
  });
  const bustDep = shapeDeparture(spec, (s) => {
    const a = buildAnatomy(s);
    return (a.headHalfWidth * 2) / Math.max(1, a.headHeight);
  });
  shapeSpread.push([bustDep, spriteDep]);
  if (Math.abs(bustDep - spriteDep) > 0.12) {
    bump('skull-shape');
    rows.push({
      name, kind: 'skull-shape',
      detail: `${spec.faceShape}: bust ${bustDep.toFixed(2)}× oval, sprite ${spriteDep.toFixed(2)}×`,
    });
  }

  // --- The vault. A flat-topped crown reads as a moulded cap in either view,
  // and the two should be flat or domed together.
  const sProf = headProfile(sprite, sk.crownY - 26, sk.chinY);
  const pProf = headProfile(portrait, 0, Math.round(compiled.anatomy.chinY));
  if (sProf.length && pProf.length) {
    const flat = (p: number[]) => p[0] / Math.max(1, Math.max(...p));
    const sf = flat(sProf); const pf = flat(pProf);
    crownFlat.push([pf, sf]);
    if (Math.abs(sf - pf) > 0.38) {
      bump('crown-flatness');
      rows.push({
        name, kind: 'crown-flatness',
        detail: `bust ${pf.toFixed(2)}, sprite ${sf.toFixed(2)} (1.0 is a flat slab)`,
      });
    }
    // --- Headgear form. A cone and a cylinder are the same material and the
    // same colour, so nothing above this line can tell them apart.
    if (wants && inSprite && inPortrait) {
      const widest = (p: number[]) => Math.max(...p);
      const sRel = widest(sProf) / Math.max(1, L.W);
      const pRel = widest(pProf) / Math.max(1, buildAnatomy(spec).headHalfWidth * 2);
      if (Math.abs(sRel - pRel) > 0.42) {
        bump('headwear-form');
        rows.push({
          name, kind: 'headwear-form',
          detail: `${spec.headwear?.kind} "${spec.headwear?.name}" · bust ${pRel.toFixed(2)}× head, sprite ${sRel.toFixed(2)}×`,
        });
      }
    }
  }
  // --- Does the construction verdict reach both renderers?
  //
  // The feature key and the context marks are decided once, on the spec, so the
  // two views cannot disagree about *what* the garment is any more. What they
  // can still do is silently draw nothing for it — a key with no case in one
  // renderer, or a mark painted onto a lit material where `resolveLight` throws
  // the colour away. Both failures look exactly like the old bug on the card
  // and neither shows up in any colour sample.
  //
  // So this measures the only thing that settles it: render the same persona
  // with the verdict removed and count the pixels that moved. Zero means that
  // renderer has no expression of it.
  //
  // The feature figure is reported as reach only, never as a per-persona
  // mismatch. A zero there does not prove the sprite drew nothing: both
  // renderers still have name-based fallbacks for the neckline, so a suit whose
  // feature is taken away is drawn with lapels anyway and the differential is
  // legitimately zero. The marks have no such fallback — nothing else in either
  // renderer reads a context pack — so a zero there does mean absent.
  const feature = spec.garment.feature;
  if (feature) {
    const blank = { ...spec, garment: { ...spec.garment, feature: null } };
    coverage(featureReach, feature.key, movedPixels(source, spec, blank));
  }
  if (spec.contextMarks.length) {
    const blank = { ...spec, contextMarks: [] };
    const moved = movedPixels(source, spec, blank);
    for (const mark of spec.contextMarks) coverage(markReach, mark, moved);
    if (moved.sprite === 0) {
      bump('marks-sprite');
      rows.push({ name, kind: 'marks-sprite', detail: `${spec.contextMarks.join(', ')} drawn in bust only` });
    }
    if (moved.portrait === 0) {
      bump('marks-portrait');
      rows.push({ name, kind: 'marks-portrait', detail: `${spec.contextMarks.join(', ')} drawn in sprite only` });
    }
  }

  void SPRITE_W;
}

const ORDER = [
  'skin-hue', 'skin-value', 'garment-hue', 'hair-hue', 'hair-value', 'hair-presence',
  'headwear-disagree', 'headwear-sprite', 'headwear-portrait',
  'beard-sprite', 'beard-portrait', 'proportion',
  'skull-shape', 'crown-flatness', 'headwear-form',
  'marks-sprite', 'marks-portrait',
];

console.log(`\nPortrait ↔ sprite agreement, ${COUNT} personas\n`);
let worst = 0;
for (const k of ORDER) {
  const n = counts.get(k) ?? 0;
  const pct = (n / COUNT) * 100;
  worst = Math.max(worst, pct);
  const bar = '█'.repeat(Math.round(pct / 2)).padEnd(20, '·');
  console.log(`  ${n === 0 ? 'ok  ' : 'MISM'}  ${k.padEnd(20)} ${bar} ${n} (${pct.toFixed(1)}%)`);
}

if (VERBOSE) {
  console.log('');
  for (const r of rows) console.log(`  ${r.kind.padEnd(20)} ${r.name}\n${' '.repeat(24)}${r.detail}`);
}

const mean = valueSum.reduce((a, b) => a + b, 0) / Math.max(1, valueSum.length);
console.log(`\n  garment value offset: portrait is ${mean > 0 ? '+' : ''}${mean.toFixed(0)} lighter on average`);
console.log('  (a value offset is lighting, not a mismatch — hue is what says "different clothes")');

// Form, reported as spreads rather than as pass/fail. A rate says how often the
// two views disagree; these say how much of the axis each one is using at all,
// which is the thing that was silently zero.
const span = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
if (shapeSpread.length) {
  console.log(`\n  faceShape reach (skull aspect ÷ same persona's oval):`);
  console.log(`    bust   ${span(shapeSpread.map(p => p[0])).toFixed(3)} spread`);
  console.log(`    sprite ${span(shapeSpread.map(p => p[1])).toFixed(3)} spread`);
  console.log('    (a spread near zero means the axis is not reaching that renderer)');
}
if (crownFlat.length) {
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  console.log(`\n  crown flatness (1.0 is a flat slab, low is a dome):`);
  console.log(`    bust   ${avg(crownFlat.map(p => p[0])).toFixed(3)} mean`);
  console.log(`    sprite ${avg(crownFlat.map(p => p[1])).toFixed(3)} mean`);
}
void dist;

// Construction reach, per key: mean pixels each view moves when the verdict is
// taken away. A zero column is a key that renderer cannot express — which is
// the whole failure this seam exists to prevent, and it is invisible to every
// colour check above.
const reachTable = (title: string, reach: Reach) => {
  if (!reach.size) return;
  console.log(`\n  ${title} (mean pixels the verdict moves in each view):`);
  const keys = [...reach.keys()].sort();
  for (const k of keys) {
    const at = reach.get(k)!;
    const bust = Math.round(at.portrait / at.n);
    const sprite = Math.round(at.sprite / at.n);
    const flag = bust === 0 || sprite === 0 ? '  ←' : '';
    console.log(`    ${k.padEnd(16)} bust ${String(bust).padStart(5)}   sprite ${String(sprite).padStart(5)}   ×${at.n}${flag}`);
  }
};
reachTable('garment features', featureReach);
reachTable('context marks', markReach);

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(`\n${total} mismatches across ${COUNT} personas\n`);
