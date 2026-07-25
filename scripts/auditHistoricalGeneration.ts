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

  for (let index = 0; index < scenario.count; index += 1) {
    const seed = 10_000 * (scenarioIndex + 1) + index;
    Math.random = seededRandom(seed);
    const persona = generateHistoricalPersona({ ...scenario.params, seed });
    const religion = persona.character.religion;
    const profession = persona.character.profession;
    religions.set(religion, (religions.get(religion) || 0) + 1);
    professions.set(profession, (professions.get(profession) || 0) + 1);

    if (scenario.forbiddenReligion?.test(religion)) violations.push(`${religion} (seed ${seed})`);
    if (scenario.forbiddenProfession?.test(profession)) violations.push(`${profession} (seed ${seed})`);
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
