/**
 * scripts/auditCulturalFit.ts
 *
 * Three questions this asks of a large sample of personas:
 *
 * 1. *Is the name from the right culture?* The region tables name an
 *    indigenous tradition and a colonial one side by side and draw between
 *    them, so a name that came from the colonial pool in a colonised place is
 *    the failure mode to count. Worse, several tables name a tradition that
 *    has no entry in CHARACTER_NAMES at all — a dangling key silently degrades
 *    to whatever the fallback supplies, which is how the only African option
 *    for the East African Rift lost to German.
 *
 * 2. *Is the language a language?* "Niger-Congo language of the region" is a
 *    family, not a mother tongue, and it is what the resolver falls back to
 *    whenever the attested table has nothing plausible for the place. It is an
 *    honest answer for 8000 BCE and a bad one for 1997.
 *
 * 3. *Was anyone there yet?* Map areas can declare a `minYear` for first
 *    settlement, and almost none did, so personas were being born on Iceland
 *    in 600 and in the Azores before any ship had reached them.
 *
 * The first two are reported as rates per zone and era so a change can be
 * measured rather than eyeballed. `--strict` fails the build on a dangling
 * reference or an unsettled birthplace, neither of which is ever intentional.
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

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const count = Number.parseInt(readOption('--count') || '600', 10);
const strict = process.argv.includes('--strict');
const verbose = process.argv.includes('--verbose');
const zoneFilter = readOption('--zone');

const originalLog = console.log;
console.log = () => undefined;
console.warn = () => undefined;

const [
  { CHARACTER_NAMES, REGION_NAME_MAPPING },
  { LANGUAGES, REGIONAL_LANGUAGE_MAPPINGS },
  { GEOGRAPHICAL_DATA },
  { generateHistoricalPersona },
  { gatedLanguageIds },
] = await Promise.all([
  import('../src/constants/characterData/names'),
  import('../src/constants/gameData/languages'),
  import('../src/constants/gameData/geography'),
  import('../src/services/personaGenerator'),
  import('../src/services/languagePlausibilityService'),
]);

/**
 * When each map area was first settled, for the areas that declare it. A
 * persona born on an island before anyone reached it is the clearest possible
 * generation error, and it was showing up as a language-family label rather
 * than as anything obviously wrong.
 */
const settledFrom = new Map<string, number>();
for (const regions of Object.values(GEOGRAPHICAL_DATA)) {
  for (const areas of Object.values(regions)) {
    for (const area of Object.values(areas)) {
      if (area?.minYear !== undefined) settledFrom.set(area.name, area.minYear);
    }
  }
}

// ---------------------------------------------------------------------------
// Static check: every tradition a region table names must actually exist.
// ---------------------------------------------------------------------------

const knownKeys = new Set(Object.keys(CHARACTER_NAMES));
const dangling = new Map<string, string[]>();
for (const [zone, regions] of Object.entries(REGION_NAME_MAPPING)) {
  for (const [region, rules] of Object.entries(regions)) {
    for (const rule of rules) {
      for (const key of rule.keys) {
        if (knownKeys.has(key)) continue;
        if (!dangling.has(key)) dangling.set(key, []);
        dangling.get(key)!.push(`${zone}/${region}`);
      }
    }
  }
}

/**
 * The same bug on the language side: a regional mapping naming a language id
 * that is not in LANGUAGES. It weighs nothing, so the region silently gets
 * whatever else the mapping lists — and where the dead reference was the
 * region's own vernacular, a language-family label.
 */
const deadLanguages = new Map<string, number>();
{
  const known = new Set(Object.keys(LANGUAGES));
  for (const mapping of REGIONAL_LANGUAGE_MAPPINGS) {
    for (const entry of mapping.languages) {
      if (!known.has(entry.id)) deadLanguages.set(entry.id, (deadLanguages.get(entry.id) ?? 0) + 1);
    }
    for (const entry of mapping.namePatterns ?? []) {
      const label = `${entry.language} (namePattern)`;
      if (!known.has(entry.language)) deadLanguages.set(label, (deadLanguages.get(label) ?? 0) + 1);
    }
  }
  // The same bug again on the gates rather than the mappings. A place or
  // register rule keyed on an id the table does not carry never runs, so the
  // language it was meant to constrain is unconstrained — which is the more
  // dangerous direction, because a dead mapping entry only loses a candidate
  // while a dead gate lets a wrong one through.
  for (const { id, table } of gatedLanguageIds()) {
    const label = `${id} (${table})`;
    if (!known.has(id)) deadLanguages.set(label, (deadLanguages.get(label) ?? 0) + 1);
  }
}

// ---------------------------------------------------------------------------
// Sampled check: what names and languages personas actually come out with.
// ---------------------------------------------------------------------------

/**
 * Name sets foreign to a zone, listed per zone because the same set means
 * different things in different places. Hindi names are the majority tradition
 * in South Asia and a small trader minority in colonial East Africa; Portuguese
 * names are foreign in Angola and unremarkable in Brazil, where three centuries
 * of settlement and forced conversion made them most people's names. Only the
 * genuinely foreign cases are counted, so the rate means what it says.
 *
 * South America is deliberately absent: after 1533 Iberian naming is the norm
 * across the zone, so counting it as a defect would measure history, not a bug.
 */
const FOREIGN_KEYS: Record<string, Set<string>> = {
  SUB_SAHARAN_AFRICAN: new Set(['ENGLISH', 'GERMAN', 'FRENCH', 'PORTUGUESE', 'DUTCH', 'ITALIAN', 'HINDI', 'RUSSIAN', 'SPANISH']),
  SOUTH_ASIAN: new Set(['ENGLISH', 'PORTUGUESE', 'FRENCH', 'DUTCH', 'GERMAN', 'RUSSIAN']),
  SOUTHEAST_ASIAN: new Set(['ENGLISH', 'DUTCH', 'FRENCH', 'SPANISH', 'PORTUGUESE', 'GERMAN']),
  OCEANIA: new Set(['ENGLISH', 'FRENCH', 'GERMAN', 'DUTCH', 'RUSSIAN']),
  NORTH_AMERICAN_PRE_COLUMBIAN: new Set(['ENGLISH', 'FRENCH', 'SPANISH', 'GERMAN', 'DUTCH', 'RUSSIAN']),
  EAST_ASIAN: new Set(['ENGLISH', 'RUSSIAN', 'GERMAN', 'FRENCH', 'PORTUGUESE']),
};

/** A family name, not a language: the resolver's answer of last resort. */
const VAGUE_LANGUAGE = /\b(language of the region|language of the islands|survival \(hypothetical\)|Unrecorded)\b/i;

/**
 * From when a family label counts against the total. "Indo-European language of
 * the region" is the honest answer for 4000 BCE — the whole point of the deep
 * time windows is to say what is not known — and a poor one for 1400 CE, by
 * which date every region in the app has attested languages with names.
 */
const VAGUE_IS_A_DEFECT_FROM = 500;

interface Bucket {
  total: number;
  /** Personas late enough that a family label is a defect rather than honesty. */
  datable: number;
  vagueLanguage: number;
  foreignName: number;
  examples: string[];
}

const byZoneEra = new Map<string, Bucket>();
/** Personas born somewhere nobody had reached yet. Should always be empty. */
const unsettled: string[] = [];
const vagueLabels = new Map<string, number>();

function eraBand(year: number): string {
  if (year < -3000) return 'deep time (<3000 BCE)';
  if (year < 0) return 'ancient (3000 BCE-0)';
  if (year < 1000) return 'classical (0-1000)';
  if (year < 1500) return 'medieval (1000-1500)';
  if (year < 1800) return 'early modern (1500-1800)';
  if (year < 1945) return 'colonial (1800-1945)';
  return 'modern (1945+)';
}

const nativeRandom = Math.random;
for (let index = 0; index < count; index += 1) {
  const seed = (0x5eed0000 + index) >>> 0;
  Math.random = seededRandom(seed);
  let persona;
  try {
    persona = generateHistoricalPersona({ seed });
  } catch {
    continue;
  } finally {
    Math.random = nativeRandom;
  }

  // The persona reports its zone with spaces for display; the name tables key
  // on the underscored form.
  const zone = String(persona.culturalZone ?? 'UNKNOWN').replace(/ /g, '_');
  if (zoneFilter && zone !== zoneFilter) continue;

  const label = (persona as any).languageAttribution?.label
    ?? (persona as any).languageData?.name
    ?? '';
  const nameKey = String((persona.character as any)?.nameKey ?? '');

  const key = `${zone} | ${eraBand(persona.year)}`;
  const bucket = byZoneEra.get(key) ?? { total: 0, datable: 0, vagueLanguage: 0, foreignName: 0, examples: [] };
  bucket.total += 1;

  if (persona.year >= VAGUE_IS_A_DEFECT_FROM) {
    bucket.datable += 1;
    if (VAGUE_LANGUAGE.test(label)) {
      bucket.vagueLanguage += 1;
      vagueLabels.set(label, (vagueLabels.get(label) ?? 0) + 1);
      if (bucket.examples.length < 3) {
        bucket.examples.push(`lang: "${label}" — ${persona.year} ${persona.location}`);
      }
    }
  }
  const settled = settledFrom.get(String(persona.location));
  if (settled !== undefined && persona.year < settled) {
    unsettled.push(`${persona.location} in ${persona.year} — first settled ${settled}`);
  }

  if (FOREIGN_KEYS[zone]?.has(nameKey)) {
    bucket.foreignName += 1;
    if (bucket.examples.length < 3) {
      bucket.examples.push(`name: ${persona.character?.name} [${nameKey}] — ${persona.year} ${persona.location}`);
    }
  }
  byZoneEra.set(key, bucket);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const pct = (n: number, d: number) => (d === 0 ? '  -  ' : `${((n / d) * 100).toFixed(1).padStart(5)}%`);

originalLog('\n=== Dangling name-set keys ===');
originalLog('A region table naming a tradition with no entry in CHARACTER_NAMES.');
originalLog('The draw silently degrades to the fallback pool, so the option is not merely');
originalLog('unavailable — it hands its share to whatever else the rule lists.\n');
if (dangling.size === 0) {
  originalLog('  none');
} else {
  for (const [key, uses] of [...dangling.entries()].sort((a, b) => b[1].length - a[1].length)) {
    originalLog(`  ${key.padEnd(20)} ${String(uses.length).padStart(3)} rules   ${uses.slice(0, 4).join(', ')}${uses.length > 4 ? ', …' : ''}`);
  }
}

originalLog('\n=== Personas born before their birthplace was settled ===');
if (unsettled.length === 0) {
  originalLog('  none');
} else {
  for (const line of unsettled.slice(0, 10)) originalLog(`  ${line}`);
  if (unsettled.length > 10) originalLog(`  … and ${unsettled.length - 10} more`);
}

originalLog('\n=== Dead language ids in regional mappings ===');
if (deadLanguages.size === 0) {
  originalLog('  none');
} else {
  for (const [id, uses] of [...deadLanguages.entries()].sort((a, b) => b[1] - a[1])) {
    originalLog(`  ${id.padEnd(32)} ${String(uses).padStart(3)} references`);
  }
}

originalLog('\n=== Name and language fit, by zone and era ===');
originalLog(`sample: ${count} personas`);
originalLog(`"vague lang" is the share of personas from ${VAGUE_IS_A_DEFECT_FROM} CE onward given a language family`);
originalLog('rather than a language. "foreign name" is the share named from a tradition');
originalLog('foreign to the zone. Both should be small and neither should be zero.');
originalLog(`\n${'zone | era'.padEnd(46)} ${'n'.padStart(4)}  ${'vague lang'.padStart(10)}  ${'foreign name'.padStart(12)}`);
const rows = [...byZoneEra.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [key, b] of rows) {
  originalLog(`${key.padEnd(46)} ${String(b.total).padStart(4)}  ${pct(b.vagueLanguage, b.datable).padStart(10)}  ${pct(b.foreignName, b.total).padStart(12)}`);
  if (verbose) for (const example of b.examples) originalLog(`      ${example}`);
}

const totals = rows.reduce(
  (acc, [, b]) => ({
    total: acc.total + b.total,
    datable: acc.datable + b.datable,
    vague: acc.vague + b.vagueLanguage,
    foreign: acc.foreign + b.foreignName,
  }),
  { total: 0, datable: 0, vague: 0, foreign: 0 },
);
originalLog(`\n${'ALL'.padEnd(46)} ${String(totals.total).padStart(4)}  ${pct(totals.vague, totals.datable).padStart(10)}  ${pct(totals.foreign, totals.total).padStart(12)}`);

originalLog('\n=== Most common vague language labels ===');
for (const [label, n] of [...vagueLabels.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  originalLog(`  ${String(n).padStart(4)}  ${label}`);
}
originalLog('');

if (strict && (dangling.size > 0 || deadLanguages.size > 0 || unsettled.length > 0)) {
  if (unsettled.length > 0) {
    originalLog(`FAIL: ${unsettled.length} personas were born somewhere not yet settled.`);
  }
  if (dangling.size > 0) {
    originalLog(`FAIL: ${dangling.size} name-set keys are referenced by a region table but not defined.`);
  }
  if (deadLanguages.size > 0) {
    originalLog(`FAIL: ${deadLanguages.size} language ids are referenced by a regional mapping but not defined.`);
  }
  process.exit(1);
}
