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

const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
};

const originalLog = console.log;
const nativeRandom = Math.random;
console.log = () => undefined;
console.warn = () => undefined;
const { generateHistoricalPersona } = await import('../src/services/personaGenerator');
const { trailingEpithet } = await import('../src/constants/characterData/nameConventions');

interface Scenario {
  name: string;
  count: number;
  params: {
    year: number;
    culturalZone: any;
    region: string;
    location: string;
  };
  forbiddenReligion?: RegExp;
  forbiddenProfession?: RegExp;
  minimumReligionShare?: { pattern: RegExp; share: number };
  maximumProfessionShare?: { pattern: RegExp; share: number };
  /** No persona may be given this name. */
  forbiddenName?: RegExp;
  /** No persona may be given this language. */
  forbiddenLanguage?: RegExp;
  /** No persona may be carrying this. */
  forbiddenInventory?: RegExp;
  /** Work one sex was effectively excluded from in this place and period. */
  forbiddenProfessionForGender?: { gender: string; pattern: RegExp };
  /** Distinct names as a fraction of the sample, against name-pool exhaustion. */
  minimumDistinctNames?: number;
  /** No single byname may exceed this share, against a too-narrow pool. */
  maximumBynameShare?: number;
}

const scenarios: Scenario[] = [
  {
    name: 'pre-Islamic Arabia',
    count: 120,
    params: { year: 500, culturalZone: 'MENA', region: 'Arabian Peninsula', location: 'Najd Plateau' },
    forbiddenReligion: /\b(?:islam|sunni|shia|sufi)\b/i,
  },
  {
    name: 'medieval Indochina',
    count: 120,
    params: { year: 981, culturalZone: 'EAST_ASIAN', region: 'Indochina Interior', location: 'Annamite Cordillera' },
    forbiddenReligion: /\b(?:islam|sunni|shia)\b/i,
  },
  {
    name: 'London before telephony',
    count: 120,
    params: { year: 1870, culturalZone: 'EUROPEAN', region: 'British Isles', location: 'London' },
    forbiddenProfession: /\b(?:telephone operator|farmer|shepherd|herder|luddite|chartist|resurrectionist)\b/i,
  },
  {
    name: 'industrial London',
    count: 120,
    params: { year: 1880, culturalZone: 'EUROPEAN', region: 'British Isles', location: 'London' },
    forbiddenProfession: /\b(?:farmer|shepherd|herder|luddite|chartist|resurrectionist)\b/i,
  },
  {
    name: 'Lower Elbe conversion frontier',
    count: 160,
    params: { year: 685, culturalZone: 'EUROPEAN', region: 'Germanic Lands', location: 'Hamburg Coast' },
    minimumReligionShare: { pattern: /Germanic Paganism/i, share: 0.8 },
  },
  {
    name: 'Bronze Age South Asia',
    count: 100,
    params: { year: -2000, culturalZone: 'SOUTH_ASIAN', region: 'Indus Valley', location: 'Punjab Plains' },
    forbiddenReligion: /\b(?:hindu|buddh|jain|islam|sikh|christian)\b/i,
  },
  // The five faults reported from the first classroom test, kept as scenarios
  // so they cannot come back quietly.
  {
    // Wage construction, welding, driving and policing in interwar Peru were
    // trades women were essentially absent from, not ones they were a small
    // minority of. See services/genderedLaborService.ts.
    name: 'interwar Peru, women in closed trades',
    count: 200,
    params: { year: 1935, culturalZone: 'SOUTH_AMERICAN', region: 'Andes', location: 'Cusco Valley' },
    forbiddenProfessionForGender: {
      gender: 'Female',
      pattern: /\b(?:construction worker|welder|truck driver|taxi driver|police officer|civil engineer|miner|dock worker|plantation manager)\b/i,
    },
  },
  {
    // Content creators and cybercriminals in the 1920s, and Puritan virtue
    // names — Thankful, Ebenezer, Experience — a century after that naming
    // world ended.
    name: '1920s California',
    count: 200,
    params: { year: 1925, culturalZone: 'NORTH_AMERICAN_COLONIAL', region: 'Southern California' },
    forbiddenProfession: /\b(?:content creator|influencer|cybercriminal|crypto|barista|software|web developer|uber)\b/i,
    forbiddenName: /\b(?:Thankful|Ebenezer|Experience|Mehitable|Submit|Temperance|Deliverance|Hezekiah|Obadiah|Keturah|Bathsheba)\b/,
  },
  {
    // A non-Muslim woman in the eighth-century Guinea forest is not a Classical
    // Arabic speaker, and Hausa is a Chadic language of a different region
    // altogether. See services/languagePlausibilityService.ts.
    name: 'Ivory Coast in 709',
    count: 200,
    params: { year: 709, culturalZone: 'SUB_SAHARAN_AFRICAN', region: 'West African Forests', location: 'Ivory Coast' },
    forbiddenLanguage: /classical arabic|hausa|swahili|bantu|ge.ez/i,
  },
  {
    // The deep-time American pool used to be bare English nature nouns, and
    // returned about eighty distinct names in two hundred draws.
    name: 'Palaeolithic Great Basin',
    count: 200,
    params: { year: -14000, culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN', region: 'Great Basin', location: 'Great Basin' },
    forbiddenName: /^(?:Chief|Shaman|Warrior|Hunter|Raven|Dove|Star|Moon|Sky|Bear|Wolf|Eagle)$/,
    minimumDistinctNames: 0.7,
  },
  {
    // One byname pool of twenty-two English glosses served every culture, and
    // five of them that needed no evidence carried most of the traffic.
    name: 'Bronze Age Europe bynames',
    count: 200,
    params: { year: -1500, culturalZone: 'EUROPEAN', region: 'Central Europe', location: 'Danube Valley' },
    maximumBynameShare: 0.06,
  },
  {
    // The Philippines were filed under the South Asian continent, so an
    // islander was given reconstructed Proto-Dravidian names, Proto-Indo-Iranian
    // as a mother tongue, a lungi and a Vaishnava forehead mark.
    name: 'Bronze Age Sulu Sea',
    count: 150,
    params: { year: -1926, culturalZone: 'SOUTHEAST_ASIAN', region: 'Philippines', location: 'Sulu Sea' },
    forbiddenLanguage: /indo-iranian|dravidian|indo-aryan|sanskrit/i,
    forbiddenReligion: /\b(?:hindu|vaishnav|shaiv|sikh|jain)\b/i,
  },
  {
    // Ryukyu existed under both East Asia and South Asia; the South Asian copy
    // won, and a twelfth-century islander came out Sunni with a Tripundra.
    name: 'Ryukyu in 1136',
    count: 150,
    params: { year: 1136, culturalZone: 'EAST_ASIAN', region: 'Taiwan and East China Sea', location: 'East China Sea' },
    forbiddenReligion: /\b(?:sunni|shia|islam|hindu)\b/i,
    forbiddenLanguage: /dravidian|indo-aryan/i,
  },
  {
    // Wheat, barley, a threshing flail and a cow, in a region with no
    // agriculture at all and no Old World livestock.
    name: 'Northern Rockies in 285',
    count: 150,
    params: { year: 285, culturalZone: 'NORTH_AMERICAN_PRE_COLUMBIAN', region: 'Northern Rockies', location: 'Glacier Foothills' },
    forbiddenProfession: /\b(?:farmer|field hand|peasant|cultivator|shepherd|herder|cacao|chinampero|jade carver|ball court)\b/i,
    forbiddenInventory: /\b(?:wheat|barley|grain flail)\b/i,
  },
  {
    name: 'Narmada Valley in 1930',
    count: 120,
    params: { year: 1930, culturalZone: 'SOUTH_ASIAN', region: 'Central India', location: 'Narmada Valley' },
    forbiddenProfession: /\b(?:computer|software|programmer|television)\b/i,
    maximumProfessionShare: { pattern: /\b(?:maharaja|nawab|oil baron|bank president)\b/i, share: 0.03 },
  },
];

const failures: string[] = [];
const results: Record<string, unknown> = {};

for (let scenarioIndex = 0; scenarioIndex < scenarios.length; scenarioIndex += 1) {
  const scenario = scenarios[scenarioIndex];
  const religions = new Map<string, number>();
  const professions = new Map<string, number>();
  const violations: string[] = [];
  const distinctNames = new Set<string>();
  const bynames = new Map<string, number>();

  for (let index = 0; index < scenario.count; index += 1) {
    const seed = 10_000 * (scenarioIndex + 1) + index;
    Math.random = seededRandom(seed);
    const persona = generateHistoricalPersona({ ...scenario.params, seed });
    const religion = persona.character.religion;
    const profession = persona.character.profession;
    const name = persona.character.name ?? '';
    const gender = persona.character.gender;
    const language = persona.languageData?.name ?? '';
    religions.set(religion, (religions.get(religion) || 0) + 1);
    professions.set(profession, (professions.get(profession) || 0) + 1);
    distinctNames.add(name);
    const byname = trailingEpithet(name);
    if (byname) bynames.set(byname, (bynames.get(byname) || 0) + 1);

    if (scenario.forbiddenReligion?.test(religion)) violations.push(`${religion} (seed ${seed})`);
    if (scenario.forbiddenProfession?.test(profession)) violations.push(`${profession} (seed ${seed})`);
    if (scenario.forbiddenName?.test(name)) violations.push(`name "${name}" (seed ${seed})`);
    if (scenario.forbiddenLanguage?.test(language)) violations.push(`language "${language}" (seed ${seed})`);
    if (scenario.forbiddenInventory) {
      const carried = ((persona.character as any).inventory ?? []).map((item: any) => item.name).join(', ');
      if (scenario.forbiddenInventory.test(carried)) violations.push(`carrying "${carried}" (seed ${seed})`);
    }
    if (scenario.forbiddenProfessionForGender
      && gender === scenario.forbiddenProfessionForGender.gender
      && scenario.forbiddenProfessionForGender.pattern.test(profession)) {
      violations.push(`${gender} ${profession} (seed ${seed})`);
    }
  }

  if (scenario.minimumDistinctNames) {
    const ratio = distinctNames.size / scenario.count;
    if (ratio < scenario.minimumDistinctNames) {
      violations.push(`only ${distinctNames.size} distinct names in ${scenario.count} (${ratio.toFixed(2)} < ${scenario.minimumDistinctNames})`);
    }
  }
  if (scenario.maximumBynameShare) {
    for (const [byname, count] of bynames) {
      const share = count / scenario.count;
      if (share > scenario.maximumBynameShare) {
        violations.push(`byname "${byname}" on ${share.toFixed(3)} of the sample (max ${scenario.maximumBynameShare})`);
      }
    }
  }

  if (scenario.minimumReligionShare) {
    const matching = [...religions.entries()]
      .filter(([religion]) => scenario.minimumReligionShare!.pattern.test(religion))
      .reduce((sum, [, count]) => sum + count, 0);
    const actualShare = matching / scenario.count;
    if (actualShare < scenario.minimumReligionShare.share) {
      violations.push(`religion share ${actualShare.toFixed(3)} below ${scenario.minimumReligionShare.share}`);
    }
  }
  if (scenario.maximumProfessionShare) {
    const matching = [...professions.entries()]
      .filter(([profession]) => scenario.maximumProfessionShare!.pattern.test(profession))
      .reduce((sum, [, count]) => sum + count, 0);
    const actualShare = matching / scenario.count;
    if (actualShare > scenario.maximumProfessionShare.share) {
      violations.push(`profession share ${actualShare.toFixed(3)} above ${scenario.maximumProfessionShare.share}`);
    }
  }

  if (violations.length > 0) failures.push(`${scenario.name}: ${violations.slice(0, 5).join(', ')}`);
  results[scenario.name] = {
    generated: scenario.count,
    violations: violations.length,
    religions: Object.fromEntries([...religions.entries()].sort((a, b) => b[1] - a[1])),
    professions: Object.fromEntries([...professions.entries()].sort((a, b) => b[1] - a[1])),
  };
}

Math.random = nativeRandom;
originalLog(JSON.stringify({ passed: failures.length === 0, scenarios: results }, null, 2));
if (failures.length > 0) {
  throw new Error(`Historical generation audit failed:\n${failures.join('\n')}`);
}
