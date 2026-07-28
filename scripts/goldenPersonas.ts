/**
 * scripts/goldenPersonas.ts
 *
 * A regression net for persona generation.
 *
 * The repo had audits but no regression tests: the audits assert properties
 * ("no Islam in pre-Islamic Arabia") and so only catch faults someone already
 * thought to name. Every defect found by hand this week — a Japanese sedge hat
 * on a Formosan farmer, a Swedish Muslim in 1920, "a sprained ankle in his
 * ankle", "Vigfussson" — passed every property assertion in the suite. They
 * were caught by a person reading one card.
 *
 * So: pin a fixed matrix of personas and diff the whole rendered shape. Nobody
 * has to predict the fault; they only have to notice a line changed.
 *
 *   npm run golden:verify    diff against the committed file (use in CI)
 *   npm run golden:accept    rewrite it (after an intended change)
 *
 * Determinism comes from the generator itself: `generateHistoricalPersona`
 * opens a seeded scope (`utils/seededRandom`) for the whole of its work, so a
 * seed reproduces a persona exactly. This harness used to swap in a seeded
 * `Math.random` to fake that; it no longer needs to, and deliberately does not,
 * because a test that installs its own determinism cannot detect the loss of
 * the real thing.
 */

if (!('localStorage' in globalThis)) {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
  });
}

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const originalLog = console.log;
console.log = () => undefined;
console.warn = () => undefined;
console.info = () => undefined;

const { generateHistoricalPersona } = await import('../src/services/personaGenerator');
const { buildPortraitSpec } = await import('../src/components/portraitLab/spec/buildSpec');

const GOLDEN = 'tests/golden/personas.json';

/**
 * The matrix. Chosen to cover every cultural zone, the full era range, and —
 * importantly — the specific places whose defects prompted this file, so a
 * regression on any of them shows up as a diff rather than as a surprise.
 */
const CASES: Array<{ name: string; year: number; culturalZone: string; region: string; location: string }> = [
  { name: 'formosan-highlands-1306', year: 1306, culturalZone: 'EAST_ASIAN', region: 'Taiwan and Ryukyu', location: 'Central Mountains' },
  { name: 'japan-kyoto-1306', year: 1306, culturalZone: 'EAST_ASIAN', region: 'Japan', location: 'Kyoto' },
  { name: 'stockholm-1920', year: 1920, culturalZone: 'EUROPEAN', region: 'Scandinavia', location: 'Stockholm Archipelago' },
  { name: 'stockholm-1150', year: 1150, culturalZone: 'EUROPEAN', region: 'Scandinavia', location: 'Stockholm Archipelago' },
  { name: 'anatolia-1952', year: 1952, culturalZone: 'MENA', region: 'Anatolia', location: 'Cappadocian Highlands' },
  { name: 'anatolia-1650', year: 1650, culturalZone: 'MENA', region: 'Anatolia', location: 'Cappadocian Highlands' },
  { name: 'sahel-1350', year: 1350, culturalZone: 'SUB_SAHARAN_AFRICAN', region: 'Sahel', location: 'Niger Bend' },
  { name: 'london-1740', year: 1740, culturalZone: 'EUROPEAN', region: 'British Isles', location: 'London' },
  { name: 'london-1870', year: 1870, culturalZone: 'EUROPEAN', region: 'British Isles', location: 'London' },
  { name: 'arabia-500', year: 500, culturalZone: 'MENA', region: 'Arabian Peninsula', location: 'Najd Plateau' },
  { name: 'indus-2000bce', year: -2000, culturalZone: 'SOUTH_ASIAN', region: 'Indus Valley', location: 'Punjab Plains' },
  { name: 'arnhem-1200', year: 1200, culturalZone: 'OCEANIA', region: 'Australia', location: 'Arnhem Land' },
  { name: 'tahiti-1200', year: 1200, culturalZone: 'OCEANIA', region: 'Polynesia', location: 'Tahiti' },
  { name: 'andes-1500', year: 1500, culturalZone: 'SOUTH_AMERICAN', region: 'Andes', location: 'Cusco Highlands' },
  { name: 'southwest-1200', year: 1200, culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN', region: 'Southwest', location: 'Colorado Plateau' },
  { name: 'newengland-1780', year: 1780, culturalZone: 'NORTH_AMERICAN_COLONIAL', region: 'Atlantic Coast', location: 'Boston' },
  { name: 'ming-china-1500', year: 1500, culturalZone: 'EAST_ASIAN', region: 'North China', location: 'Yellow River Plain' },
  { name: 'bengal-1900', year: 1900, culturalZone: 'SOUTH_ASIAN', region: 'Ganges', location: 'Bengal Lowlands' },
  // Years that used to fall past the end of their region's year-bands and
  // land on a coarse modern bucket. Pinned so the new bands stay honest.
  { name: 'london-2020', year: 2020, culturalZone: 'EUROPEAN', region: 'British Isles', location: 'London' },
  { name: 'paris-1850', year: 1850, culturalZone: 'EUROPEAN', region: 'France', location: 'Paris' },
  { name: 'balkans-1900', year: 1900, culturalZone: 'EUROPEAN', region: 'Balkans', location: 'Sarajevo' },
  { name: 'andes-1990', year: 1990, culturalZone: 'SOUTH_AMERICAN', region: 'Andes North', location: 'Quito' },
  { name: 'newzealand-2010', year: 2010, culturalZone: 'OCEANIA', region: 'New Zealand', location: 'Wellington' },

  // Breadth. The cases above are places a defect was already found; these
  // spread across the zone x era grid so the next defect has somewhere to
  // show up. Coverage was 23 of roughly 500 zone/era combinations, which is
  // thin enough that most regressions would have landed unobserved.
  { name: 'kazakh-steppe-636bce', year: -636, culturalZone: 'EAST_ASIAN', region: 'Kazakh Steppes', location: 'Dzungarian Basin' },
  { name: 'fujian-7000bce', year: -7000, culturalZone: 'EAST_ASIAN', region: 'South China', location: 'Fujian Coast' },
  { name: 'korea-1400', year: 1400, culturalZone: 'EAST_ASIAN', region: 'Korea', location: 'Han River' },
  { name: 'mongolia-1250', year: 1250, culturalZone: 'EAST_ASIAN', region: 'Mongolia and Manchuria', location: 'Mongolian Steppes' },
  { name: 'japan-1870', year: 1870, culturalZone: 'EAST_ASIAN', region: 'Japan', location: 'Kanto Plain' },
  { name: 'europe-8000bce', year: -8000, culturalZone: 'EUROPEAN', region: 'Central Europe', location: 'Danube Corridor' },
  { name: 'greece-430bce', year: -430, culturalZone: 'EUROPEAN', region: 'Greece and Aegean', location: 'Attica' },
  { name: 'rome-100', year: 100, culturalZone: 'EUROPEAN', region: 'Italy', location: 'Latium' },
  { name: 'ireland-900', year: 900, culturalZone: 'EUROPEAN', region: 'British Isles', location: 'Irish Midlands' },
  { name: 'iberia-1480', year: 1480, culturalZone: 'EUROPEAN', region: 'Iberian Peninsula', location: 'Andalusian Plain' },
  { name: 'russia-1600', year: 1600, culturalZone: 'EUROPEAN', region: 'Eastern Europe', location: 'Muscovy' },
  { name: 'lowcountries-1650', year: 1650, culturalZone: 'EUROPEAN', region: 'Low Countries', location: 'Holland' },
  { name: 'germany-1930', year: 1930, culturalZone: 'EUROPEAN', region: 'Germanic Lands', location: 'Rhine Valley' },
  { name: 'egypt-1350bce', year: -1350, culturalZone: 'MENA', region: 'Nile Valley', location: 'Thebes' },
  { name: 'mesopotamia-1750bce', year: -1750, culturalZone: 'MENA', region: 'Mesopotamia', location: 'Diyala Valley' },
  { name: 'persia-500bce', year: -500, culturalZone: 'MENA', region: 'Persian Plateau', location: 'Fars' },
  { name: 'levant-30', year: 30, culturalZone: 'MENA', region: 'Levant', location: 'Galilee' },
  { name: 'maghreb-620bce', year: -620, culturalZone: 'MENA', region: 'Maghreb', location: 'Rif Coast' },
  { name: 'baghdad-1924', year: 1924, culturalZone: 'MENA', region: 'Mesopotamia', location: 'Baghdad' },
  { name: 'sahel-9000bce', year: -9000, culturalZone: 'SUB_SAHARAN_AFRICAN', region: 'Sahel', location: 'Niger Bend' },
  { name: 'kongo-4300bce', year: -4300, culturalZone: 'SUB_SAHARAN_AFRICAN', region: 'Lower Guinea and Congo Basin', location: 'Kongo Coast' },
  { name: 'ethiopia-1100', year: 1100, culturalZone: 'SUB_SAHARAN_AFRICAN', region: 'Horn of Africa', location: 'Ethiopian Highlands' },
  { name: 'swahili-1400', year: 1400, culturalZone: 'SUB_SAHARAN_AFRICAN', region: 'East African Coast', location: 'Zanzibar' },
  { name: 'southafrica-1890', year: 1890, culturalZone: 'SUB_SAHARAN_AFRICAN', region: 'Southern Africa', location: 'Highveld' },
  { name: 'deccan-1650', year: 1650, culturalZone: 'SOUTH_ASIAN', region: 'Deccan', location: 'Deccan Plateau' },
  { name: 'tamil-1200', year: 1200, culturalZone: 'SOUTH_ASIAN', region: 'Ganges', location: 'Coromandel Coast' },
  { name: 'indus-8000bce', year: -8000, culturalZone: 'SOUTH_ASIAN', region: 'Indus Valley', location: 'Punjab Plains' },
  { name: 'mesoamerica-700', year: 700, culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN', region: 'Mexico and Central Highlands', location: 'Central Highlands' },
  { name: 'plains-1500', year: 1500, culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN', region: 'Great Plains', location: 'Missouri Breaks' },
  { name: 'arctic-1400', year: 1400, culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN', region: 'Arctic and Subarctic', location: 'Baffin Coast' },
  { name: 'california-1000', year: 1000, culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN', region: 'Northern California', location: 'Central Valley' },
  { name: 'newengland-1870', year: 1870, culturalZone: 'NORTH_AMERICAN_COLONIAL', region: 'Northeastern Seaboard', location: 'Boston' },
  { name: 'louisiana-1820', year: 1820, culturalZone: 'NORTH_AMERICAN_COLONIAL', region: 'Mississippi Valley', location: 'New Orleans' },
  { name: 'amazon-1200', year: 1200, culturalZone: 'SOUTH_AMERICAN', region: 'Amazonia', location: 'Rio Negro' },
  { name: 'patagonia-1600', year: 1600, culturalZone: 'SOUTH_AMERICAN', region: 'Southern Cone', location: 'Patagonia' },
  { name: 'brazil-1880', year: 1880, culturalZone: 'SOUTH_AMERICAN', region: 'Atlantic Brazil', location: 'Rio de Janeiro' },
  { name: 'newguinea-1500', year: 1500, culturalZone: 'OCEANIA', region: 'New Guinea and Melanesia', location: 'Sepik' },
  { name: 'hawaii-1700', year: 1700, culturalZone: 'OCEANIA', region: 'Hawaii and Central Pacific', location: 'Big Island' },
  { name: 'australia-20000bce', year: -20000, culturalZone: 'OCEANIA', region: 'Australia', location: 'Arnhem Land' },
];

/** Seeds per case — a few each, so one unlucky draw does not define the pin. */
const SEEDS = [1, 2, 3];

/**
 * What gets pinned. Deliberately the *visible* surface — what a person would
 * read off the card — rather than the whole object, so the file stays
 * reviewable and an internal refactor does not churn it.
 */
function snapshot(persona: any): Record<string, unknown> {
  const character = persona.character ?? {};
  const spec = (() => {
    try {
      return buildPortraitSpec(character);
    } catch (error) {
      return { error: String((error as Error).message) };
    }
  })();

  const equipped = character.equippedItems ?? {};
  const item = (slot: string) => {
    const piece = equipped[slot];
    return piece ? `${piece.name ?? '?'} [${piece.material ?? '?'}]` : null;
  };

  return {
    name: character.name ?? null,
    gender: character.gender ?? null,
    age: character.age ?? null,
    profession: character.profession ?? null,
    religion: character.religion ?? null,
    language: persona.languageData?.name ?? null,
    languageBasis: persona.languageAttribution?.basis ?? null,
    languageConfidence: persona.languageAttribution?.confidence ?? null,
    odds: persona.odds?.scope ?? null,
    head: item('head'),
    torso: item('torso'),
    feet: item('feet'),
    portrait: 'error' in (spec as any) ? spec : {
      headwearKind: (spec as any).headwear?.kind ?? null,
      headwearColor: (spec as any).headwear?.color ?? null,
      garmentKind: (spec as any).garment?.kind ?? null,
      garmentColor: (spec as any).garment?.colors?.primary ?? null,
      backgroundBase: (spec as any).background?.base ?? null,
    },
    // One member per relation kind rather than the first four. `family` is
    // ordered parents, siblings, spouse, children, and sibships now average
    // five, so a flat slice of four could never reach a spouse or a child
    // again — retiring them from the snapshot without anyone noticing.
    family: Object.values(
      (character.family ?? []).reduce((first: Record<string, string>, member: any) => {
        if (!(member.relation in first)) {
          first[member.relation] = `${member.relation}: ${member.name}`;
        }
        return first;
      }, {} as Record<string, string>)
    ),
    // Life events carry most of the prose defects seen so far — the samurai
    // in-law, World War I in 1897, the court-scribe apprenticeship.
    events: (persona.enhancedLifeEvents ?? [])
      .slice(0, 8)
      .map((event: any) => `${event.year ?? '?'}: ${event.description ?? event.text ?? event.title ?? ''}`),
  };
}

/**
 * Generation must draw only from the persona's seeded scope. Anything reaching
 * for `Math.random` directly is outside it and makes the persona
 * irreproducible — which is how attribute selection, and therefore earned
 * epithets, stayed random for several runs after seeding was supposedly done.
 * Counting here turns that from an intermittent golden-file flap into a
 * pointed failure.
 */
const nativeRandom = Math.random;
let unseededDraws = 0;
const unseededSites = new Map<string, number>();
Math.random = () => {
  unseededDraws += 1;
  const frames = (new Error().stack || '').split('\n').slice(2, 5).map(l => l.trim()).join('\n        ');
  unseededSites.set(frames, (unseededSites.get(frames) ?? 0) + 1);
  return nativeRandom();
};

const generated: Record<string, unknown> = {};
for (const testCase of CASES) {
  for (const seed of SEEDS) {
    try {
      const persona = generateHistoricalPersona({
        year: testCase.year,
        culturalZone: testCase.culturalZone as any,
        region: testCase.region,
        location: testCase.location,
        seed,
      } as any);
      generated[`${testCase.name}#${seed}`] = snapshot(persona);
    } catch (error) {
      generated[`${testCase.name}#${seed}`] = { CRASHED: String((error as Error).message) };
    }
  }
}

Math.random = nativeRandom;

if (unseededDraws > 0) {
  originalLog(`${unseededDraws} un-seeded Math.random call(s) — generation is not reproducible.`);
  originalLog('Route these through `random()` from src/utils/seededRandom:\n');
  for (const [site, count] of [...unseededSites.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
    originalLog(`  ${count}×\n        ${site}\n`);
  }
  process.exit(1);
}

const serialized = `${JSON.stringify(generated, null, 2)}\n`;
const accept = process.argv.includes('--accept');

if (accept) {
  mkdirSync(dirname(GOLDEN), { recursive: true });
  writeFileSync(GOLDEN, serialized);
  originalLog(`golden file written: ${Object.keys(generated).length} personas → ${GOLDEN}`);
  process.exit(0);
}

if (!existsSync(GOLDEN)) {
  originalLog(`No ${GOLDEN}. Run: npm run golden:accept`);
  process.exit(2);
}

const expected = JSON.parse(readFileSync(GOLDEN, 'utf8'));
const differences: string[] = [];
const keys = new Set([...Object.keys(expected), ...Object.keys(generated)]);

for (const key of [...keys].sort()) {
  const before = JSON.stringify(expected[key], null, 2);
  const after = JSON.stringify(generated[key], null, 2);
  if (before === after) continue;
  const beforeLines = (before ?? '').split('\n');
  const afterLines = (after ?? '').split('\n');
  const changed: string[] = [];
  for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i += 1) {
    if (beforeLines[i] === afterLines[i]) continue;
    if (beforeLines[i] !== undefined) changed.push(`      - ${beforeLines[i].trim()}`);
    if (afterLines[i] !== undefined) changed.push(`      + ${afterLines[i].trim()}`);
  }
  differences.push(`  ${key}\n${changed.slice(0, 14).join('\n')}`);
}

const crashes = Object.entries(generated).filter(([, value]) => (value as any)?.CRASHED);
if (crashes.length > 0) {
  originalLog(`${crashes.length} persona(s) crashed during generation:`);
  for (const [key, value] of crashes.slice(0, 5)) {
    originalLog(`  ${key}: ${(value as any).CRASHED}`);
  }
}

if (differences.length > 0) {
  originalLog(`${differences.length} of ${keys.size} golden personas changed:\n`);
  originalLog(differences.slice(0, 12).join('\n\n'));
  if (differences.length > 12) originalLog(`\n… and ${differences.length - 12} more`);
  originalLog('\nIf these changes are intended, run: npm run golden:accept');
  process.exit(1);
}

originalLog(`All ${keys.size} golden personas unchanged.`);
