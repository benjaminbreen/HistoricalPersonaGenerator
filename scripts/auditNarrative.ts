/**
 * scripts/auditNarrative.ts
 *
 * Invariants for the procedural systems, run against real generator output.
 *
 * These exist because a green `vite build` proves almost nothing here: the
 * build does not typecheck, so a missing import or an out-of-scope variable
 * ships silently, and a CSS or data change can be entirely inert while looking
 * applied. Every check below corresponds to a defect that actually reached the
 * screen and was found by a human looking at a card rather than by any test.
 *
 *   npm run narrative-audit           # all checks
 *   npm run narrative-audit -- --fast # fewer samples, for a quick loop
 *
 * Exits non-zero if any invariant fails, so it can gate a commit.
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

const originalLog = console.log;
console.log = () => undefined;
console.warn = () => undefined;

const [
  { generateHistoricalPersona },
  { generateNarrativeBiography },
  { findNarrativeFailureModes },
  { earnedEpithets, trailingEpithet, epithetRequiresEvidence },
  { AttributeBadgeService },
  { getAllAttributes },
  { hasCapability },
  { IDEOLOGIES },
  { sampleEliteOffice },
  { ELITE_TIERS, LOCAL_NOTABLE },
  { withSeed },
] = await Promise.all([
  import('../src/services/personaGenerator'),
  import('../src/services/narrativeBiographyService'),
  import('../src/services/narrativeTextService'),
  import('../src/constants/characterData/nameConventions'),
  import('../src/services/attributeBadgeService'),
  import('../src/constants/attributeDefinitions'),
  import('../src/constants/societyCapabilities'),
  import('../src/constants/gameData/beliefs'),
  import('../src/services/eliteOfficeService'),
  import('../src/constants/gameData/eliteOffices'),
  import('../src/utils/seededRandom'),
]);

console.log = originalLog;

const FAST = process.argv.includes('--fast');
const N = FAST ? 400 : 2000;

interface Check {
  name: string;
  /** Human-readable statement of what must hold. */
  invariant: string;
  measured: string;
  passed: boolean;
  detail?: string[];
}

const checks: Check[] = [];
const add = (c: Check) => checks.push(c);

// ---------------------------------------------------------------------------
// Generate one corpus and measure everything against it.
// ---------------------------------------------------------------------------

const quiet = <T,>(fn: () => T): T => {
  const log = console.log, warn = console.warn;
  console.log = () => undefined; console.warn = () => undefined;
  try { return fn(); } finally { console.log = log; console.warn = warn; }
};

const personas: any[] = quiet(() =>
  Array.from({ length: N }, (_, i) =>
    generateHistoricalPersona({ seed: 100000 + i * 13 } as any)));

const biographies: string[] = quiet(() =>
  personas.map(p => generateNarrativeBiography(p).replace(/<[^>]+>/g, '')));

// --- 1. Narrative failure modes -------------------------------------------
{
  const hits = new Map<string, number>();
  biographies.forEach(bio => {
    findNarrativeFailureModes(bio).forEach((mode: string) =>
      hits.set(mode, (hits.get(mode) ?? 0) + 1));
  });
  add({
    name: 'narrative-failure-modes',
    invariant: 'No biography trips a known prose failure mode',
    measured: hits.size === 0 ? '0 hits' : `${[...hits.values()].reduce((a, b) => a + b, 0)} hits`,
    passed: hits.size === 0,
    detail: [...hits].map(([k, v]) => `${v}x ${k}`),
  });
}

// --- 2. Every persona gets a language --------------------------------------
{
  const missing = personas.filter(p => !p.languageData?.name).length;
  const zoneViolations = personas.filter(p => {
    const ld = p.languageData;
    if (!ld || p.languageAttribution?.basis !== 'attested-table') return false;
    // Either zone is a correct answer for a displaced persona, and which one
    // depends on where they were born. Someone carried from Upper Guinea to
    // Charleston at seventeen speaks Mandinka in South Carolina, and a check
    // that reads the location zone alone calls that a fault — it is the whole
    // point of the ancestry axis. Their locally born grandchildren are held to
    // the location zone as before.
    const zones = [p.historicalContext.culturalZone];
    if (p.character.ancestry?.generation === 0) zones.push(p.character.ancestry.originZone);
    return Array.isArray(ld.culturalZones) && ld.culturalZones.length > 0
      && !ld.culturalZones.some(z => zones.includes(z));
  }).length;
  const periodViolations = personas.filter(p => {
    const ld = p.languageData;
    if (!ld || p.languageAttribution?.basis !== 'attested-table') return false;
    return Array.isArray(ld.period) && (p.year < ld.period[0] || p.year > ld.period[1]);
  }).length;

  add({
    name: 'language-coverage',
    invariant: 'Every persona has a language, inside its own declared zone and period',
    measured: `${missing} missing, ${zoneViolations} out of zone, ${periodViolations} out of period`,
    passed: missing === 0 && zoneViolations === 0 && periodViolations === 0,
  });
}

// --- 3. Bynames are earned -------------------------------------------------
{
  // Only the evidence-bearing bynames are checked. The neutral registers —
  // birth order, temper, the direction someone came from — need no evidence by
  // definition, and matching a trailing "the <Word>" by regex also caught the
  // place in generated names like "Mussel of the Marsh".
  const bad: string[] = [];
  personas.forEach(p => {
    const epithet = trailingEpithet(p.character.name || '');
    if (!epithet || !epithetRequiresEvidence(epithet)) return;
    const earned = earnedEpithets({
      attributeIds: (p.character.attributes ?? []).map((a: any) => a.id),
      age: p.character.age,
      heightCm: p.character.appearance?.height,
      birthSex: p.character.birthSex,
      hairColor: p.character.appearance?.hairColor,
    });
    if (!earned.includes(epithet)) bad.push(`${p.character.name}`);
  });
  add({
    name: 'earned-bynames',
    invariant: 'A physical byname is only given to a persona who has earned it',
    measured: `${bad.length} unearned`,
    passed: bad.length === 0,
    detail: bad.slice(0, 5),
  });
}

// --- 4. Appearance agrees with the cultural zone ---------------------------
{
  const PALE = /fair|light|very_pale|pale/;
  const offenders = personas.filter(p =>
    p.historicalContext.culturalZone === 'SUB_SAHARAN_AFRICAN'
    && PALE.test(String(p.character.appearance?.skinTone)));
  add({
    name: 'appearance-zone-agreement',
    invariant: 'No pale-skinned Sub-Saharan personas',
    measured: `${offenders.length} of ${personas.filter(p => p.historicalContext.culturalZone === 'SUB_SAHARAN_AFRICAN').length}`,
    passed: offenders.length === 0,
    detail: offenders.slice(0, 3).map(p => `${p.character.name} @ ${p.location}`),
  });
}

// --- 5. Society capabilities gate what they should -------------------------
{
  const RULES: Array<[cap: string, pattern: RegExp, label: string]> = [
    ['metallurgy', /smith|forge|founder|farrier/i, 'metalwork without metallurgy'],
    ['writing', /scribe|notary|copyist/i, 'letters without writing'],
  ];
  const bad: string[] = [];
  personas.forEach(p => {
    const ctx = {
      year: p.year,
      culturalZone: p.historicalContext.culturalZone,
      placeLower: `${p.location} ${p.region}`.toLowerCase(),
    };
    RULES.forEach(([cap, pattern, label]) => {
      if (pattern.test(p.character.profession || '') && !hasCapability(cap as any, ctx)) {
        bad.push(`${label}: ${p.character.profession} @ ${p.location} ${p.year}`);
      }
    });
  });
  add({
    name: 'capability-gating',
    invariant: 'No trade requiring a capability the society lacks',
    measured: `${bad.length} mismatches`,
    passed: bad.length === 0,
    detail: bad.slice(0, 5),
  });
}

// --- 6. Sex-specific causes of death ---------------------------------------
{
  const FEMALE_ONLY = /childbirth|puerperal|birthing/i;
  const MALE_SUBJECT = /\b(father|he|his|husband|brother|son)\b/i;
  const bad: string[] = [];
  personas.forEach(p => {
    (p.enhancedLifeEvents ?? []).forEach((e: any) => {
      if (!FEMALE_ONLY.test(e.text)) return;
      if (MALE_SUBJECT.test(e.text) || /\ba parent\b/i.test(e.text)) bad.push(e.text);
    });
  });
  add({
    name: 'sex-specific-death-causes',
    invariant: 'Childbirth is never the cause of a male or unsexed death',
    measured: `${bad.length} mismatches`,
    passed: bad.length === 0,
    detail: bad.slice(0, 3),
  });
}

// --- 7. Attribute pool: reachable and self-consistent ----------------------
{
  const ZONES = ['EUROPEAN', 'EAST_ASIAN', 'MENA', 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN',
    'OCEANIA', 'SOUTH_AMERICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'];
  const PLACES = ['London', 'Tyrol', 'Canton', 'Kano', 'Manchester', 'Stockholm', 'Cusco',
    'Cairo', 'Kyoto', 'Bengal', 'Yemen', 'Fiji', 'Seville', 'Nagasaki', 'Moscow', 'Boston',
    'Ireland', 'Potosi', 'Nile', 'Coast'];
  const JOBS = ['Shoemaker', 'Miner', 'Hatter', 'Weaver', 'Miller', 'Scribe', 'Tanner',
    'Painter', 'Sailor', 'Soldier', 'Merchant', 'Monk', 'Farmer', 'Midwife', 'Smith',
    'Clerk', 'Cook', 'Shepherd'];
  const YEARS = [-500, 200, 900, 1350, 1500, 1650, 1710, 1800, 1860, 1910, 1955, 1990];
  const BAD_PAIRS: Array<[string, string]> = [
    ['eldest', 'youngest'], ['blind', 'keen_eyed'], ['mute', 'singer'], ['strong', 'frail'],
    ['honest', 'cunning'], ['reckless', 'cautious'], ['never_left', 'wanderer'],
    ['proud', 'humble'], ['brave', 'coward'], ['corpulent', 'gaunt'],
    ['heavy_drinker', 'teetotal'], ['educated', 'learned_by_ear'],
  ];

  let seedState = 12345;
  const rnd = () => { seedState = (seedState * 1664525 + 1013904223) >>> 0; return seedState / 4294967296; };
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];

  const seen = new Set<string>();
  const clashes: string[] = [];
  // Not scaled down by `--fast`. This loop is synthetic — no persona is
  // generated — so it costs a second either way, and 40,000 draws is not enough
  // to reach the rarest attributes: `giant_boned` and one other were missing
  // from every fast run, which made the quick loop fail for a reason that had
  // nothing to do with the code being checked.
  const samples = 200000;
  for (let i = 0; i < samples; i++) {
    const female = rnd() < 0.5;
    const char: any = {
      age: 8 + (i * 13) % 70,
      gender: female ? 'Female' : 'Male',
      birthSex: female ? 'Female' : 'Male',
      profession: pick(JOBS),
      culturalZone: pick(ZONES),
      wealthLevel: pick(['poor', 'modest', 'comfortable', 'wealthy', 'noble']),
      socialClass: pick(['Peasant', 'Commoner', 'Merchant', 'Noble']),
      region: pick(PLACES),
      health: 20 + (i % 80),
      stats: { strength: 5 + (i % 16), dexterity: 5 + (i % 15), intelligence: 5 + (i % 17), charisma: 5 + (i % 14), perception: 5 + (i % 16) },
      personality: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: (i * 17) % 100 / 100 },
    };
    char.birthplace = char.region;
    // Inside a seed scope, as generation always is.
    //
    // `attributeBadgeService` reaches for `Math.random`, which `withSeed`
    // makes deterministic for the duration of a call — but this check was
    // calling it bare, so the run was unseeded and the reachable count came
    // out 219 or 220 depending on the day. A flaky commit gate is worse than
    // no gate, and the app itself was never affected: every persona is built
    // inside `withSeed` already.
    const year = pick(YEARS);
    const locale = pick(['rural', 'town', 'city']) as any;
    const ids = quiet(() => withSeed(0x5eed ^ i, () => AttributeBadgeService.generateAttributes(
      char, year, char.region, { localeType: locale },
    ))).map((b: any) => b.id);
    ids.forEach((id: string) => seen.add(id));
    BAD_PAIRS.forEach(([a, b]) => {
      if (ids.includes(a) && ids.includes(b)) clashes.push(`${a}+${b}`);
    });
  }
  const all = getAllAttributes();
  const unreachable = all.filter((a: any) => !seen.has(a.id)).map((a: any) => a.id);

  add({
    name: 'attribute-pool',
    invariant: 'Every attribute is reachable and no contradictory pair co-occurs',
    measured: `${seen.size}/${all.length} reachable, ${clashes.length} contradictions`,
    passed: unreachable.length === 0 && clashes.length === 0,
    detail: [...unreachable.slice(0, 8), ...Array.from(new Set(clashes)).slice(0, 5)],
  });
}

// --- 8. Biography shape ----------------------------------------------------
{
  const paragraphCounts = biographies.map(b => b.split(/\n{2,}/).filter(Boolean).length);
  const words = biographies.map(b => b.split(/\s+/).length);
  const avgWords = words.reduce((a, b) => a + b, 0) / words.length;
  // A long life with a lot to report earns a third paragraph. What is still
  // being guarded against is the collapse to one, and the biography that runs
  // to three sentences.
  const wrongShape = paragraphCounts.filter(c => c < 2 || c > 3).length;
  const tooShort = words.filter(w => w < 70).length;
  add({
    name: 'biography-shape',
    invariant: 'Every biography is two or three paragraphs, none under 70 words, averaging over 150',
    measured: `${wrongShape} outside 2–3 paragraphs, ${tooShort} under 70 words, ${avgWords.toFixed(0)} avg`,
    passed: wrongShape === 0 && tooShort === 0 && avgWords > 150,
  });
}

// --- 8b. Biography variety -------------------------------------------------
// The clause-gating work these numbers exist to protect was prompted by a
// measurement rather than by a defect report: on this same corpus, 46% of all
// generated sentences appeared in nearly every era. Gating childhood, world
// texture, trade, temperament and outlook brought that to 35%.
//
// The threshold is set just above what currently holds rather than at the 25%
// that would be good, because the remaining share is dominated by life-event
// text — "A brother's marriage brought valuable new trade connections", which
// fires equally in 22,000 BCE and 2021 — and the event templates in
// `lifeHistoryService` are not gated yet. Tighten this when they are.
{
  const skeleton = (sentence: string): string => sentence
    .replace(/<[^>]+>/g, '')
    .replace(/\b\d+\b/g, '#')
    .replace(/\b[A-Z][a-z']+\b/g, 'X')
    .replace(/\s+/g, ' ')
    .trim();

  const counts = new Map<string, number>();
  const erasFor = new Map<string, Set<string>>();
  personas.forEach((persona, index) => {
    const era = String(persona.historicalContext.era);
    for (const raw of biographies[index].split(/(?<=[.!?])\s+/)) {
      const key = skeleton(raw);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
      if (!erasFor.has(key)) erasFor.set(key, new Set());
      erasFor.get(key)!.add(era);
    }
  });

  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const eraCount = new Set(personas.map(p => String(p.historicalContext.era))).size;
  const leaked = [...counts.entries()]
    .filter(([key]) => (erasFor.get(key)?.size ?? 0) >= Math.max(2, eraCount - 1))
    .reduce((sum, [, n]) => sum + n, 0);
  const leakShare = leaked / total;
  const [topSentence, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  const topShare = topCount / total;

  add({
    name: 'biography-variety',
    invariant: 'No sentence is over 3% of the corpus, and under 40% of sentences span nearly every era',
    measured: `top ${(topShare * 100).toFixed(1)}%, era-agnostic ${(leakShare * 100).toFixed(1)}% (was 46%)`,
    passed: topShare <= 0.03 && leakShare < 0.40,
    detail: [`most repeated: ${topSentence.slice(0, 110)}`],
  });
}

// --- 9. Names carry a surname where the period expects one -----------------
{
  const byZone = new Map<string, { n: number; mono: number }>();
  personas.forEach(p => {
    if (p.year < 1700) return; // single names are correct in many earlier settings
    const zone = p.historicalContext.culturalZone;
    if (!byZone.has(zone)) byZone.set(zone, { n: 0, mono: 0 });
    const entry = byZone.get(zone)!;
    entry.n += 1;
    if (!/\s/.test(String(p.character.name || '').replace(/^\*/, ''))) entry.mono += 1;
  });
  // A zone counts as an offender only if it is majority-mononym by more than
  // its own sampling error. The flat `> 0.5` test was under-powered for the
  // small zones, which are exactly the ones at risk: the corpus gives OCEANIA
  // about thirty post-1700 personas, where one draw in three is roughly nine
  // points of rate, so a zone sitting honestly at 42% reads anywhere from 25%
  // to 60% between runs. It duly failed the audit once on 19 mononyms out of
  // 33 while the rate measured over six times the corpus was 42.6%. Raising the
  // `n` gate instead would have stopped watching the small zones altogether,
  // which is the opposite of what the invariant is for.
  //
  // One-sided 95% lower bound, normal approximation. A genuinely majority-
  // mononym zone still fails at any n the corpus produces; noise no longer does.
  const majorityBeyondNoise = (mono: number, n: number): boolean => {
    const rate = mono / n;
    return rate - 1.64 * Math.sqrt(rate * (1 - rate) / n) > 0.5;
  };
  const offenders = [...byZone]
    .filter(([, v]) => v.n >= 20 && majorityBeyondNoise(v.mono, v.n))
    .map(([k, v]) => `${k} ${(v.mono / v.n * 100).toFixed(0)}% of ${v.n}`);
  add({
    name: 'post-1700-surnames',
    invariant: 'After 1700 no zone is majority single-name',
    measured: offenders.length === 0 ? 'all zones under 50%' : offenders.join('; '),
    passed: offenders.length === 0,
    detail: offenders,
  });
}

// --- 10. Ornament ----------------------------------------------------------
{
  const METALS = new Set(['gold', 'silver', 'bronze']);
  const withNone = personas.filter(p => (p.character.appearance?.jewelry ?? []).length === 0).length;
  const anachronistic: string[] = [];
  personas.forEach(p => {
    const zone = p.historicalContext.culturalZone;
    (p.character.appearance?.jewelry ?? []).forEach((piece: any) => {
      // The place, not only the zone. `ornamentService` decides eligibility
      // with the full capability context, and the place overrides are where
      // most of the interesting answers live — Mesoamerican metallurgy is dated
      // from 800 CE by name, and a check that passed the zone alone read the
      // whole Valley of Mexico off the NORTH_AMERICAN_COLONIAL row and called a
      // correctly smelted brooch anachronistic.
      if (METALS.has(piece.material)
        && !hasCapability('metallurgy', {
          year: p.year,
          culturalZone: zone,
          placeLower: `${p.location ?? ''} ${p.region ?? ''}`.toLowerCase(),
        })) {
        anachronistic.push(`${p.year} ${zone} ${piece.material} ${piece.type}`);
      }
    });
  });
  const bareShare = withNone / personas.length;
  add({
    name: 'ornament',
    invariant: 'Most personas wear something, and nobody wears metal their society cannot smelt',
    measured: `${(bareShare * 100).toFixed(0)}% bare, ${anachronistic.length} anachronistic pieces`,
    passed: bareShare < 0.4 && anachronistic.length === 0,
    detail: Array.from(new Set(anachronistic)).slice(0, 8),
  });
}

// --- 11. Ideology fits the year and the station ----------------------------
{
  const byId = new Map<string, any>(IDEOLOGIES.filter(Boolean).map((i: any) => [i.id, i]));
  const offenders: string[] = [];
  personas.forEach(p => {
    const ideo = byId.get(p.character.ideology);
    if (!ideo) return;
    if (ideo.yearRange && (p.year < ideo.yearRange[0] || p.year > ideo.yearRange[1])) {
      offenders.push(`${ideo.id} in ${p.year} (declared ${ideo.yearRange[0]}-${ideo.yearRange[1]})`);
    }
    const privilege = p.character.socialContext?.privilege;
    if (ideo.minPrivilege !== undefined && privilege !== undefined && privilege < ideo.minPrivilege) {
      offenders.push(`${ideo.id} held at privilege ${privilege.toFixed(2)} (floor ${ideo.minPrivilege})`);
    }
  });
  add({
    name: 'ideology-fit',
    invariant: 'No persona holds an ideology outside its declared years or below its station floor',
    measured: `${offenders.length} mismatches`,
    passed: offenders.length === 0,
    detail: Array.from(new Set(offenders)).slice(0, 8),
  });
}

// --- 12. Households -------------------------------------------------------
{
  const kids = (p: any) => (p.character.family ?? []).filter(
    (f: any) => f.relation === 'son' || f.relation === 'daughter');

  // A parent who would have been a child themselves at the birth.
  const impossible: string[] = [];
  // Two children of the same parents born in the same year, absent twins.
  const collisions: string[] = [];
  personas.forEach(p => {
    const seen = new Map<number, number>();
    kids(p).forEach((c: any) => {
      const ageAtBirth = p.character.age - (p.year - (c.birthYear ?? p.year));
      if (ageAtBirth < 12) impossible.push(`${p.character.name} at ${ageAtBirth}`);
      seen.set(c.birthYear, (seen.get(c.birthYear) ?? 0) + 1);
    });
    [...seen.values()].filter(n => n > 2).forEach(() =>
      collisions.push(String(p.character.name)));
  });

  // Child mortality has to be visible in the pre-modern corpus. Its absence is
  // the whole reason householdService exists, so it is worth asserting.
  const early = personas.filter(p => p.year < 1700);
  const earlyBirths = early.flatMap(kids);
  const earlyDeaths = earlyBirths.filter((c: any) => c.isDeceased);
  const deathShare = earlyBirths.length > 0 ? earlyDeaths.length / earlyBirths.length : 0;

  const modern = personas.filter(p => p.year >= 1960).flatMap(kids);
  const modernShare = modern.length > 0
    ? modern.filter((c: any) => c.isDeceased).length / modern.length : 0;

  add({
    name: 'household',
    invariant: 'Children are spaced, possible, and buried at a rate their century would recognise',
    measured: `${impossible.length} impossible births, ${collisions.length} birth-year pileups, `
      + `${(deathShare * 100).toFixed(0)}% of pre-1700 children died, ${(modernShare * 100).toFixed(0)}% after 1960`,
    passed: impossible.length === 0 && collisions.length === 0
      && deathShare > 0.25 && deathShare < 0.6 && modernShare < 0.25,
    detail: [...impossible.slice(0, 5), ...collisions.slice(0, 3)],
  });
}

// --- 14. The elite, at the rate the sources give ---------------------------
//
// Two separate claims, because they fail separately.
//
// The rungs are measured against the *sampler*, over far more rolls than a
// persona corpus could afford: a rung at one in seventy-five thousand cannot be
// checked against two thousand people. Whether an office survives the rest of
// the pipeline is a different question, and is checked against the corpus.
//
// This check is the reason the frequencies stay honest. Before it, elite
// standing was decided by relative weights inside a profession pool, which
// meant nobody could say what rate anything was occurring at — and the answer
// turned out to be zero for most of the world.
{
  const ROLLS = FAST ? 200_000 : 1_000_000;
  const ZONES: any[] = [
    'EUROPEAN', 'EAST_ASIAN', 'SOUTH_ASIAN', 'MENA', 'SOUTHEAST_ASIAN',
    'SUB_SAHARAN_AFRICAN', 'SOUTH_AMERICAN', 'OCEANIA',
    'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL',
  ];
  // A spread of years each zone actually has offices for, so coverage gaps
  // show up as a low share rather than being sampled around.
  const YEARS = [-1500, -300, 200, 800, 1250, 1500, 1700, 1850, 1950, 2010];

  let seed = 12345;
  const rng = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };

  const counts: Record<string, number> = { district: 0, great: 0, sovereign: 0 };
  const zonesSeen = new Set<string>();
  for (let i = 0; i < ROLLS; i += 1) {
    const zone = ZONES[i % ZONES.length];
    const year = YEARS[(i / ZONES.length | 0) % YEARS.length];
    const sex = i % 2 === 0 ? 'Male' : 'Female';
    const office = sampleEliteOffice(zone, year, undefined, undefined, sex as any, rng);
    if (office) { counts[office.tier] += 1; zonesSeen.add(zone); }
  }

  const rungs = ELITE_TIERS.filter((t: any) => t.source === 'office-roll');
  const offRate = rungs.filter((t: any) => {
    const share = counts[t.tier] / ROLLS;
    return share < t.auditBand[0] || share > t.auditBand[1];
  });

  // Coverage: a zone with no offices in any era would silently lose its whole
  // elite, which is exactly the defect this table was written to fix.
  const uncovered = ZONES.filter(z => !zonesSeen.has(z));

  // And the pipeline: an office that is sampled but then overwritten by a
  // profession table, or that arrives with a commoner's social class, is
  // the same bug in a different place.
  const withOffice = personas.filter(p => p.office);
  const mismatched = withOffice.filter(p =>
    p.character.profession !== p.office.role
    || !/noble|gentry|upper class|lineage|chiefly/i.test(p.character.socialClass || ''));

  // The local rung is emergent — it comes from the profession tables, not from
  // an up-front roll — so it is reported rather than pinned.
  const localShare = personas
    .filter(p => LOCAL_NOTABLE.test(p.character.profession || '')).length / personas.length;

  add({
    name: 'elite-frequency',
    invariant: 'Each rung of office occurs at its stated rate, every zone has one, and offices survive generation',
    measured: rungs.map((t: any) =>
      `${t.tier} 1 in ${counts[t.tier] ? Math.round(ROLLS / counts[t.tier]).toLocaleString() : '∞'}`).join(', ')
      + `; local ${(localShare * 100).toFixed(1)}%`
      + `; ${uncovered.length} zones without offices, ${mismatched.length} mangled`,
    passed: offRate.length === 0 && uncovered.length === 0 && mismatched.length === 0
      && localShare > 0.001 && localShare < 0.08,
    detail: [
      ...offRate.map((t: any) =>
        `${t.tier}: 1 in ${Math.round(ROLLS / (counts[t.tier] || 1)).toLocaleString()}, wanted 1 in `
        + `${Math.round(1 / t.auditBand[1]).toLocaleString()}–${Math.round(1 / t.auditBand[0]).toLocaleString()}`),
      ...uncovered.map(z => `no office reachable in ${z}`),
      ...mismatched.slice(0, 5).map((p: any) =>
        `${p.character.name}: office ${p.office.role} but profession ${p.character.profession} / ${p.character.socialClass}`),
    ],
  });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const failed = checks.filter(c => !c.passed);

console.log(`\nnarrative audit — ${personas.length} personas${FAST ? ' (fast)' : ''}\n`);
for (const check of checks) {
  console.log(`${check.passed ? '  PASS' : '  FAIL'}  ${check.name}`);
  console.log(`        ${check.invariant}`);
  console.log(`        measured: ${check.measured}`);
  if (!check.passed && check.detail?.length) {
    check.detail.filter(Boolean).forEach(d => console.log(`          - ${d}`));
  }
}

console.log(`\n${checks.length - failed.length}/${checks.length} invariants hold\n`);
if (failed.length > 0) process.exit(1);
