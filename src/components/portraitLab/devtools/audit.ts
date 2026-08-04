/**
 * portraitLab/devtools/audit.ts
 *
 * Renders portraits for personas produced by the app's *real* generator, not by
 * hand-written fixtures, and reports on what it found.
 *
 * This exists because the fixtures can only test what I already thought of.
 * The first two bugs found by pointing the renderer at an actual persona — a
 * generic "Ivory Feathered Hat" classifying as a skullcap pulled over the eyes,
 * and an ochre eye band deleting the eyes entirely — were both invisible to a
 * fixture suite, because I would have had to guess those inputs to write them
 * down. The app's clothing and marking tables are far larger than any list one
 * person can hold in their head, so the only honest test is the real thing at
 * volume.
 *
 * Two outputs:
 *
 *   Contact sheets    every persona rendered, paginated, for eyeballing
 *   A coverage report which garment kinds, coverings and context packs
 *                     actually occur, which names the adapter failed to
 *                     recognise, and which portraits came out structurally
 *                     broken (no visible eyes, no mouth, no face)
 *
 * Usage:
 *   npm run portrait-audit               200 personas
 *   npm run portrait-audit -- 500 7      500 personas, seed 7
 */

// Must precede the generator import: it installs the browser globals the app
// reaches for while generating.
import './nodeShims';
import { writeFileSync } from 'node:fs';
import { generateHistoricalPersona } from '../../../services/personaGenerator';
import { diseaseService } from '../../../services/diseaseService';
import { auditNameRules } from '../../../constants/characterData/nameSetEras';
import { REGION_NAME_MAPPING } from '../../../constants/characterData/names';
import { ERA_BOUNDS } from '../../../services/demographyService';
import { HistoricalEra } from '../../../types/enums';
import { BODY_MATS, MAT, Raster } from '../core/raster';
import {
  buildPortraitSpec, classifyGarmentName, classifyHairstyleName, classifyHeadwearName, restingExpression,
} from '../spec/buildSpec';
import { Expression, PortraitSpec } from '../spec/types';
import { compilePortrait, poseForExpression, renderFrame } from '../render/pipeline';
import { buildAnatomy, CANVAS, VIEW_HEIGHT } from '../spec/anatomy';
import { idleFrame, restingGaze } from '../render/animation';
import { encodePNG, scaleRGBA } from './png';

const CELL = CANVAS;

// ---------------------------------------------------------------------------
// Deterministic runs
// ---------------------------------------------------------------------------

/**
 * The app's generator reaches for Math.random directly, so the only way to get
 * a reproducible audit is to replace it. Worth it: a flagged portrait is
 * useless if you cannot regenerate the persona that produced it.
 */
function seedGlobalRandom(seed: number): void {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Structural checks
// ---------------------------------------------------------------------------

interface Finding {
  index: number;
  name: string;
  detail: string;
}

interface Counted {
  [key: string]: number;
}

const bump = (table: Counted, key: string) => {
  table[key] = (table[key] || 0) + 1;
};

/**
 * Half the width of the figure across the shoulder line, measured off the
 * finished raster.
 *
 * Two decisions here, both learned the hard way.
 *
 * It reads the raster rather than the anatomy because `shoulderHalf` is a claim
 * and this is the outcome — the silhouette profile, the pose and the crop all
 * get a say in between, and it was exactly that gap which let a torso render
 * barely wider than its own head while the number said 33 pixels.
 *
 * And it samples one band of rows just below the chin rather than taking the
 * widest row in the crop. The maximum is not discriminating: the old profile
 * reached its full width too, only at t = 0.78, which is off the bottom of the
 * frame — a portrait can be head-on-a-post where anyone looks at it and still
 * score well on a measurement taken at the very last visible row. The shoulder
 * line is where a viewer reads the shoulders, so that is where to measure.
 */
function shoulderReach(raster: Raster, shoulderTop: number): number {
  let widest = 0;
  for (let y = shoulderTop + 11; y <= shoulderTop + 16; y += 1) {
    if (y < 0 || y >= Math.min(VIEW_HEIGHT, CANVAS)) continue;
    let left = -1;
    let right = -1;
    for (let x = 0; x < CANVAS; x += 1) {
      if (!BODY_MATS.has(raster.mat[y * CANVAS + x])) continue;
      if (left < 0) left = x;
      right = x;
    }
    if (left >= 0) widest = Math.max(widest, (right - left + 1) / 2);
  }
  return widest;
}

/**
 * Things that are unambiguously wrong regardless of taste. At two hundred
 * portraits nobody is going to catch these by eye, but they are trivial to
 * catch by counting materials in the finished raster.
 */
function inspect(raster: Raster, spec: PortraitSpec, expression: Expression): string[] {
  const counts: Counted = {};
  for (let i = 0; i < raster.mat.length; i += 1) {
    bump(counts, String(raster.mat[i]));
  }
  const at = (material: number) => counts[String(material)] || 0;
  const problems: string[] = [];

  if (at(MAT.SKIN) < 220) problems.push(`almost no visible skin (${at(MAT.SKIN)}px)`);
  // The occlusion check exists to catch a hat brim or a hank of hair sitting
  // over the eyes. It is not supposed to catch the renderer doing exactly what
  // it was told: a weary face is half-lidded and a smile squints, and both
  // legitimately show a fraction of the sclera an open eye does. Wiring illness
  // through to the resting face turned 353 correct half-lidded portraits into
  // 353 findings, which is a report calling its own art a bug.
  const eyeState = poseForExpression(expression).eyes;
  const narrowed = eyeState === 'half' || eyeState === 'squint' || eyeState === 'closed';
  const floor = narrowed ? 3 : 14;
  if (at(MAT.SCLERA) === 0 && eyeState !== 'closed') problems.push('no visible eyes');
  else if (at(MAT.SCLERA) > 0 && at(MAT.SCLERA) < floor) {
    problems.push(`eyes almost fully occluded (${at(MAT.SCLERA)}px, ${expression})`);
  }
  if (at(MAT.IRIS) === 0 && at(MAT.SCLERA) > 0) problems.push('sclera but no iris');
  const wearsLipPlate = spec.markings.some(
    m => m.type === 'structural' && /plate|plug|disc/.test(m.pattern || '') && m.location !== 'ear'
  );
  if (at(MAT.LIP) === 0 && !wearsLipPlate) problems.push('no visible mouth');
  if (spec.hairLength !== 'bald' && at(MAT.HAIR) === 0 && !spec.headwear) {
    problems.push('hair specified but none drawn');
  }
  if (spec.headwear && at(MAT.HEADWEAR) === 0 && at(MAT.METAL) === 0) {
    problems.push(`headwear "${spec.headwear.name}" drew nothing`);
  }
  if (at(MAT.CLOTH_A) + at(MAT.CLOTH_B) + at(MAT.CLOTH_C) < 60 && spec.garment.kind !== 'bare') {
    problems.push('garment barely drawn');
  }

  // Below about 1.15 an adult reads as a head balanced on a post, whatever the
  // build label says. Two hundred personas on the profile this replaced ran a
  // median of 1.21 and a fifth percentile of 0.92; the same two hundred on the
  // current one run 1.62 and 1.27. So the threshold sits under everything the
  // renderer now produces and over two fifths of what it used to — a regression
  // in either the widths or the curve lights up dozens of portraits at once.
  //
  // Not a way of pinning the numbers, which are a matter of taste and should
  // stay adjustable. The floor is for the silhouette collapsing.
  if (spec.age >= 16) {
    const anatomy = buildAnatomy(spec);
    const ratio = shoulderReach(raster, anatomy.shoulderTop) / anatomy.headHalfWidth;
    if (ratio < 1.15) {
      problems.push(`shoulders barely wider than head (${ratio.toFixed(2)}×, build ${spec.build})`);
    }
  }
  return problems;
}

/** Patterns the renderer draws deliberately. Anything else falls to a stroke. */
const KNOWN_PATTERNS = new Set([
  'three_lines', 'vertical_lines', 'lines', 'scarification', 'ritual_scar',
  'horizontal_lines', 'horizontal_stripes', 'geometric_bands', 'stripes',
  'eye_liner', 'eye_band', 'dots', 'dot', 'spots', 'cross',
  'vertical_v', 'zigzag', 'geometric', 'berber', 'berber_geometric',
  'flower', 'floral', 'handprint', 'swirls', 'celtic',
  'maori_spiral', 'maori_full', 'solid', 'hair_ochre',
  // Structural: the disc and the flesh stretched around it.
  'plate', 'plug', 'disc', 'cheek_plug', 'coils', 'ring',
  // Lifted out of the marking list entirely — see `skull` and `dental` on the
  // spec. Listed as known because they are drawn, just not from here.
  'cranial_elongation', 'teeth_black', 'teeth_filed', 'teeth_inlay',
]);

/** Marking types handled as a whole, whatever pattern string they carry. */
const TYPES_HANDLED_WHOLESALE = new Set([
  'piercing', 'scar', 'mole', 'beauty_mark', 'birthmark',
]);

/**
 * Modifications left undrawn on purpose — because the portrait is cropped above
 * them, not because they are hard. Bound feet and a mourning amputation are
 * both real and both below the frame. Reported separately so the distinction
 * between "not done yet" and "cannot be seen from here" stays visible.
 */
const DELIBERATELY_SKIPPED = new Set([
  'foot_binding', 'amputation',
]);

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const count = Number(process.argv[2]) || 200;
const seed = Number(process.argv[3]) || 1;
const outPrefix = process.argv[4] || 'portrait-audit';

// The disease module loads asynchronously. Racing it makes every persona look
// healthy, which is exactly the false reading an earlier version of this audit
// produced and reported as "nobody is ever ill".
await diseaseService.preloadDiseaseModule();

seedGlobalRandom(seed);

const garmentKinds: Counted = {};
const headwearKinds: Counted = {};
const contextPacks: Counted = {};
const hairLengths: Counted = {};
const hairTextures: Counted = {};
const hairSilhouettes: Counted = {};
const unmatchedHairstyles: Counted = {};
const eras: Counted = {};
const zones: Counted = {};
const markingPatterns: Counted = {};
const diseases: Counted = {};
const ageBands: Counted = {};
const greyBands: Counted = {};
const weatherBands: Counted = {};
const gazeHabits: Counted = {};
const restingFaces: Counted = {};
const crownBands: Counted = {};
const poseReasons: Counted = {};
const ornamentKinds: Counted = {};
const garmentSurfaces: Counted = {};
const garmentWear: Counted = {};
const ornamentMaterials: Counted = {};
const plainHeadwear: Counted = {};
const severities: Counted = {};

const unmatchedGarments: Counted = {};
const unmatchedHeadwear: Counted = {};
const unknownPatterns: Counted = {};
const skippedPatterns: Counted = {};
const findings: Finding[] = [];
const crashes: Finding[] = [];

const rasters: Array<{ raster: Raster; label: string }> = [];
let compileTotal = 0;

// The app's generator narrates itself at length. Useful in a browser, ruinous
// when generating two hundred personas — the report would be buried.
const realLog = console.log;
const realInfo = console.info;
const realWarn = console.warn;
console.log = () => {};
console.info = () => {};
console.warn = () => {};
const restoreConsole = () => {
  console.log = realLog;
  console.info = realInfo;
  console.warn = realWarn;
};

for (let i = 0; i < count; i += 1) {
  let personaName = `#${i}`;
  try {
    // An explicit per-persona seed, derived from the run seed and the index.
    //
    // Seeding `Math.random` is not sufficient on its own, which the audit had
    // been assuming since it was written. `generateHistoricalPersona` derives
    // its own seed as `Date.now() ^ Math.random()` when none is supplied, and
    // the clock half of that survives any amount of RNG stubbing — so the same
    // command produced a different three hundred people every time it ran.
    // Three consecutive runs at `300 11` reported 0, 1 and 0 structural
    // findings, which makes the headline counts noise rather than the
    // regression test the README says they are.
    const persona = generateHistoricalPersona({ seed: (seed * 0x9e3779b1 + i) >>> 0 });
    const spec = buildPortraitSpec(persona.character as any);
    // Label findings with what the persona was *wearing*, not just who they
    // were — a report saying "17 garments barely drawn" is useless without it.
    personaName =
      `${persona.character.name} · ${spec.culturalZone} · ` +
      `garment ${spec.garment.kind} "${spec.garment.name}" · ` +
      `head ${spec.headwear ? `${spec.headwear.kind} "${spec.headwear.name}"` : 'none'} · ` +
      `hair ${spec.hairLength}`;

    bump(garmentKinds, spec.garment.kind);
    bump(headwearKinds, spec.headwear ? spec.headwear.kind : 'none');
    bump(contextPacks, spec.contextPackId || '(no pack)');
    bump(hairLengths, spec.hairLength);
    bump(hairTextures, spec.hairTexture);
    bump(hairSilhouettes, spec.hairSilhouette);
    bump(poseReasons, spec.pose.reason ?? '(canonical bust)');
    bump(eras, String(spec.era));
    bump(zones, String(spec.culturalZone));
    const band = spec.age < 20 ? '00-19' : spec.age < 35 ? '20-34' : spec.age < 50 ? '35-49'
      : spec.age < 65 ? '50-64' : '65+';
    bump(ageBands, band);
    bump(greyBands, spec.grayAmount < 0.05 ? 'none' : spec.grayAmount < 0.35 ? 'some' : 'mostly grey');
    // How domed the vault is. Reported because the whole point of the axis is
    // that flatness stopped being universal, and a distribution is the only way
    // to see whether it did — a table that came out 90% flat would mean the
    // seeded spread had been swallowed somewhere downstream.
    const crown = buildAnatomy(spec).crown;
    bump(crownBands, crown < 0.25 ? 'flat' : crown < 0.5 ? 'shallow'
      : crown < 0.75 ? 'domed' : 'round');
    // The trade-and-years axis. Worth a table of its own because it is derived
    // from profession *names* by regex, so the only way to know the tiers are
    // reaching real output — rather than matching a handful of tidy examples —
    // is to count what the app actually generates.
    bump(weatherBands, spec.weathering < 0.12 ? 'indoors'
      : spec.weathering < 0.34 ? 'a little'
      : spec.weathering < 0.62 ? 'partly out'
      : spec.weathering < 0.78 ? 'outdoor work' : 'a life in the weather');
    // Which face the population actually rests on, and how ill it is. Both
    // exist because a threshold was once calibrated against a range the app
    // never produced, and nothing reported the resulting zero.
    bump(restingFaces, restingExpression(spec.mood, spec.condition));
    // Whether the still frame — a contact sheet, a card at rest, any export —
    // has this persona meeting the reader's eye. Tracked because the balance is
    // a *tuned* number rather than a derived one: most people look at the person
    // in front of them, and a build that quietly drifts back toward a majority
    // looking away turns a page of these into a room full of suspects.
    const rest = restingGaze(spec.seed, spec.mood);
    bump(gazeHabits, rest[0] === 0 && rest[1] === 0 ? 'meets the viewer'
      : rest[1] > 0 ? 'eyes down' : 'looking away');
    // Which decorative parts the item vocabulary actually produces, and which
    // named head items still come out undecorated. The second list is the one
    // that matters: it is where the next batch of keywords comes from, and it
    // is what stops 263 named items quietly reverting to plain bands.
    for (const s2 of spec.garment.surfaces) bump(garmentSurfaces, `${s2.kind}/${s2.material}`);
    for (const w of spec.garment.wear) bump(garmentWear, w.kind);
    if (!spec.garment.wear.length) bump(garmentWear, '(new cloth)');
    if (spec.headwear) {
      if (spec.headwear.ornaments.length === 0) bump(plainHeadwear, spec.headwear.name);
      for (const o of spec.headwear.ornaments) {
        bump(ornamentKinds, o.kind);
        bump(ornamentMaterials, o.material);
      }
    }
    bump(severities, `severity ${spec.condition.severity}`);
    for (const disease of spec.condition.diseases) bump(diseases, disease);

    // Where did the adapter have to guess?
    const g = classifyGarmentName(`${spec.garment.name} ${spec.garment.material}`);
    if (!g.matched) bump(unmatchedGarments, spec.garment.name);
    // A style the keyword table does not know falls through to loose hair,
    // which is exactly the failure the silhouette axis was added to fix — so
    // it has to be visible here rather than silently reverting.
    if (!classifyHairstyleName(spec.hairstyle).matched) bump(unmatchedHairstyles, spec.hairstyle);
    if (spec.headwear) {
      const h = classifyHeadwearName(`${spec.headwear.name} ${spec.headwear.material}`);
      if (!h.matched) bump(unmatchedHeadwear, spec.headwear.name);
    }
    for (const marking of spec.markings) {
      if (marking.type === 'freckles') continue;
      const pattern = marking.pattern || 'solid';
      bump(markingPatterns, `${marking.type}:${pattern}`);
      if (DELIBERATELY_SKIPPED.has(pattern)) {
        bump(skippedPatterns, pattern);
      } else if (marking.type === 'structural') {
        // The skull and the teeth are drawn from the spec's own `skull` and
        // `dental` fields rather than from this list, so they count as handled
        // here even though nothing in `details.ts` touches them.
        const elsewhere = /cranial_elongation|teeth_black|teeth_filed|teeth_inlay/.test(pattern);
        if (!elsewhere && !/plate|plug|disc|coil|ring/.test(pattern)) {
          bump(unknownPatterns, `structural:${pattern}`);
        }
      } else if (!TYPES_HANDLED_WHOLESALE.has(marking.type) && !KNOWN_PATTERNS.has(pattern)) {
        bump(unknownPatterns, pattern);
      }
    }

    const started = Date.now();
    const compiled = compilePortrait(spec);
    compileTotal += Date.now() - started;

    const target = new Raster(CELL, CELL);
    const frame = idleFrame(0, {
      seed: spec.seed,
      resting: restingExpression(spec.mood, spec.condition),
      mood: spec.mood,
      hairMoves: false,
      reducedMotion: true,
    });
    renderFrame(compiled, frame, target);

    for (const problem of inspect(target, spec, frame.expression)) {
      findings.push({ index: i, name: personaName, detail: problem });
    }
    rasters.push({ raster: target, label: personaName });
  } catch (error) {
    crashes.push({
      index: i,
      name: personaName,
      detail: error instanceof Error ? `${error.message}` : String(error),
    });
  }
}

restoreConsole();

// ---------------------------------------------------------------------------
// Contact sheets
// ---------------------------------------------------------------------------

const COLUMNS = 10;
const PER_SHEET = COLUMNS * 10;
const scale = 2;
let sheetIndex = 0;

for (let start = 0; start < rasters.length; start += PER_SHEET) {
  const page = rasters.slice(start, start + PER_SHEET);
  const rows = Math.ceil(page.length / COLUMNS);
  const gap = 3;
  const width = COLUMNS * CELL + (COLUMNS + 1) * gap;
  const height = rows * CELL + (rows + 1) * gap;
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    out[i * 4] = 24; out[i * 4 + 1] = 24; out[i * 4 + 2] = 28; out[i * 4 + 3] = 255;
  }
  page.forEach((entry, index) => {
    const col = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const x0 = gap + col * (CELL + gap);
    const y0 = gap + row * (CELL + gap);
    for (let y = 0; y < CELL; y += 1) {
      for (let x = 0; x < CELL; x += 1) {
        const si = (y * CELL + x) * 4;
        const ti = ((y0 + y) * width + x0 + x) * 4;
        out[ti] = entry.raster.data[si];
        out[ti + 1] = entry.raster.data[si + 1];
        out[ti + 2] = entry.raster.data[si + 2];
        out[ti + 3] = 255;
      }
    }
  });
  const scaled = scaleRGBA(out, width, height, scale);
  const file = `${outPrefix}-${String(sheetIndex + 1).padStart(2, '0')}.png`;
  writeFileSync(file, encodePNG(scaled.data, scaled.width, scaled.height));
  process.stdout.write(`sheet ${file} — ${page.length} portraits\n`);
  sheetIndex += 1;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const lines: string[] = [];
const rule = (title: string) => lines.push('', `── ${title} ${'─'.repeat(Math.max(0, 58 - title.length))}`);

const table = (counted: Counted, total: number) => {
  const entries = Object.entries(counted).sort((a, b) => b[1] - a[1]);
  for (const [key, n] of entries) {
    const pct = ((n / Math.max(1, total)) * 100).toFixed(1).padStart(5);
    lines.push(`  ${pct}%  ${String(n).padStart(4)}  ${key}`);
  }
  if (entries.length === 0) lines.push('  (none)');
};

const rendered = rasters.length;
lines.push(`portraitLab audit — ${count} personas, seed ${seed}`);
lines.push(`${rendered} rendered, ${crashes.length} crashed, ${findings.length} structural findings`);
lines.push(`mean compile ${(compileTotal / Math.max(1, rendered)).toFixed(1)}ms`);

rule('Garment kinds');
table(garmentKinds, rendered);
rule('Head coverings');
table(headwearKinds, rendered);
rule('Context packs');
table(contextPacks, rendered);
rule('Hair length');
table(hairLengths, rendered);
rule('Hair texture');
table(hairTextures, rendered);
rule('Hair arrangement');
table(hairSilhouettes, rendered);
rule('Age');
table(ageBands, rendered);
rule('Greying');
table(greyBands, rendered);
rule('Resting gaze');
table(gazeHabits, rendered);
rule('Weathering (profession \u00d7 years)');
table(weatherBands, rendered);
rule('Garment surfaces drawn');
table(garmentSurfaces, rendered);
rule('Garment wear drawn');
table(garmentWear, rendered);
rule('Ornament parts drawn');
table(ornamentKinds, rendered);
rule('Ornament materials drawn');
table(ornamentMaterials, rendered);
rule('UNDECORATED head items (no ornament found in the name)');
table(plainHeadwear, rendered);
rule('Resting expression');
table(restingFaces, rendered);
rule('Crown — how domed the vault is');
table(crownBands, rendered);
rule('Pose — what departs from the canonical bust, and why');
table(poseReasons, rendered);
rule('Illness severity');
table(severities, rendered);
rule('Cultural zones');
table(zones, rendered);
rule('Eras');
table(eras, rendered);
rule('Markings seen');
table(markingPatterns, rendered);
rule('Diseases seen');
table(diseases, rendered);

rule('UNRECOGNISED garment names (fell back to "tunic")');
table(unmatchedGarments, rendered);
rule('UNRECOGNISED headwear names (fell back to "cap")');
table(unmatchedHeadwear, rendered);
rule('UNRECOGNISED hairstyle names (fell back to loose hair)');
table(unmatchedHairstyles, rendered);
rule('UNHANDLED marking patterns (drew a generic stroke)');
table(unknownPatterns, rendered);
rule('Deliberately not drawn');
table(skippedPatterns, rendered);

// Data warnings: region rules that *can* hand out a naming tradition before it
// existed. `resolveNameKey` stops these reaching a persona, so this is a "your
// table says something it does not mean" report rather than a live bug — but an
// unbounded rule is a trap for whoever edits it next.
const nameWarnings = auditNameRules(
  REGION_NAME_MAPPING as any,
  ERA_BOUNDS[HistoricalEra.PREHISTORY].min
);
rule('Name rules reaching past their tradition (data warning)');
const unboundedRules = nameWarnings.filter(w => w.kind === 'unbounded');
const overlapRules = nameWarnings.filter(w => w.kind === 'overlap');
const lapsedRules = nameWarnings.filter(w => w.kind === 'lapsed');
lines.push(`  ${unboundedRules.length} rules with no lower bound, ${overlapRules.length} bounded rules starting early`);
if (unboundedRules.length > 0) {
  lines.push('  Unbounded — these reach to the era floor:');
  for (const w of unboundedRules.slice(0, 10)) {
    lines.push(`    ${w.zone}/${w.region} [${w.rule}] → ${w.implausibleKeys.join(', ')}`);
  }
  if (unboundedRules.length > 10) lines.push(`    … and ${unboundedRules.length - 10} more`);
}
// The other direction, and the one that leaves no trace at generation time:
// the set is dropped by the era gate on every draw this rule makes, so the
// rule reads as though it includes a people it silently cannot produce.
lines.push(`  ${lapsedRules.length} rules naming a tradition that had already lapsed`);
if (lapsedRules.length > 0) {
  lines.push('  Lapsed — dead on every draw, their share goes to the other keys:');
  for (const w of lapsedRules.slice(0, 12)) {
    lines.push(`    ${w.zone}/${w.region} [${w.rule}] → ${w.implausibleKeys.join(', ')}`);
  }
  if (lapsedRules.length > 12) lines.push(`    … and ${lapsedRules.length - 12} more`);
}

rule('Structural findings');
if (findings.length === 0) lines.push('  (none)');
const grouped: Record<string, Finding[]> = {};
for (const finding of findings) {
  (grouped[finding.detail.replace(/"[^"]*"/, '"…"')] ||= []).push(finding);
}
for (const [detail, group] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)) {
  lines.push(`  ${String(group.length).padStart(4)}×  ${detail}`);
  for (const finding of group.slice(0, 4)) {
    lines.push(`          #${finding.index} ${finding.name}`);
  }
  if (group.length > 4) lines.push(`          … and ${group.length - 4} more`);
}

if (crashes.length > 0) {
  rule('Crashes');
  for (const crash of crashes.slice(0, 12)) {
    lines.push(`  #${crash.index} ${crash.name}: ${crash.detail}`);
  }
}

const report = lines.join('\n');
writeFileSync(`${outPrefix}-report.txt`, `${report}\n`);
process.stdout.write(`${report}\n\nreport written to ${outPrefix}-report.txt\n`);
