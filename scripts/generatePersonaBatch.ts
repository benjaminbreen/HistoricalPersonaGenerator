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

function readCount(): number {
  const countIndex = process.argv.indexOf('--count');
  const raw = countIndex >= 0 ? process.argv[countIndex + 1] : process.argv[2];
  const parsed = Number.parseInt(raw || '20', 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 500)) : 20;
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

function hashSeed(value: string): number {
  const numeric = Number.parseInt(value, 10);
  if (/^-?\d+$/.test(value.trim()) && Number.isFinite(numeric)) return numeric >>> 0;

  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const originalLog = console.log;
const count = readCount();
const summaryOnly = process.argv.includes('--summary') || readOption('--format') === 'summary';
const seedInput = readOption('--seed') || '1977';
const baseSeed = hashSeed(seedInput);
const scenarioYear = readOption('--year');
const scenarioCulturalZone = readOption('--cultural-zone');
const scenarioRegion = readOption('--region');
const scenarioLocation = readOption('--location');
console.log = () => undefined;
console.warn = () => undefined;
const [
  { IDEOLOGIES },
  { EventImportance },
  {
    describeIdeology,
    describeLifeEvent,
    describeParents,
    describePhysicalAppearance,
    findNarrativeFailureModes,
    getNarrativePronouns,
  },
  { generateHistoricalPersona },
] = await Promise.all([
  import('../src/constants'),
  import('../src/constants/characterData/lifeHistoryService'),
  import('../src/services/narrativeTextService'),
  import('../src/services/personaGenerator'),
]);
const warningCounts = new Map<string, { count: number; examples: string[] }>();
const professionCounts = new Map<string, number>();
const religionCounts = new Map<string, number>();
const nativeRandom = Math.random;

for (let index = 0; index < count; index += 1) {
  // Character generation currently contains verbose development logging. Keep this
  // command's stdout valid JSONL so it can be redirected and searched reliably.
  const seed = (baseSeed + index) >>> 0;
  // The older generator still contains a few Math.random consumers. The batch
  // process is isolated, so temporarily route them through the same per-record
  // seed until those call sites are migrated to ValueNoise.
  Math.random = seededRandom(seed);
  let persona;
  try {
    persona = generateHistoricalPersona({
      seed,
      ...(scenarioYear ? { year: Number.parseInt(scenarioYear, 10) } : {}),
      ...(scenarioCulturalZone ? { culturalZone: scenarioCulturalZone as any } : {}),
      ...(scenarioRegion ? { region: scenarioRegion } : {}),
      ...(scenarioLocation ? { location: scenarioLocation } : {}),
    });
  } finally {
    Math.random = nativeRandom;
  }

  const character = persona.character;
  const pronouns = getNarrativePronouns(character.gender);
  const event = (persona.enhancedLifeEvents || [])
    .filter(item => item.kind !== 'birth' && item.kind !== 'apprenticeship')
    .filter(item => [
      EventImportance.MILESTONE,
      EventImportance.TRAGEDY,
      EventImportance.OPPORTUNITY,
    ].includes(item.importance))
    .sort((a, b) => a.year - b.year)[0];
  const eventAge = event ? character.age - (persona.year - event.year) : undefined;
  const father = character.family?.find(member => member.relation === 'father');
  const mother = character.family?.find(member => member.relation === 'mother');
  const ideology = IDEOLOGIES.find(item => item.id === character.ideology);

  const fragments = [
    describePhysicalAppearance(character.appearance, pronouns),
    event && eventAge !== undefined ? describeLifeEvent(event, eventAge, pronouns) : '',
    describeIdeology(ideology, pronouns),
    describeParents(father?.name, mother?.name, pronouns),
  ].filter(Boolean);
  const diagnosticText = [character.backstory, ...fragments].filter(Boolean).join(' ');

  const warnings = findNarrativeFailureModes(diagnosticText);
  professionCounts.set(character.profession, (professionCounts.get(character.profession) || 0) + 1);
  religionCounts.set(character.religion, (religionCounts.get(character.religion) || 0) + 1);
  for (const warning of warnings) {
    const entry = warningCounts.get(warning) || { count: 0, examples: [] };
    entry.count += 1;
    if (entry.examples.length < 3) entry.examples.push(character.name);
    warningCounts.set(warning, entry);
  }

  const record = {
    index: index + 1,
    seed,
    name: character.name,
    year: persona.year,
    location: persona.location,
    gender: character.gender,
    profession: character.profession,
    religion: character.religion,
    historical_context: persona.historicalContext,
    backstory: character.backstory,
    narrative_fragments: fragments,
    warnings,
  };
  if (!summaryOnly) originalLog(JSON.stringify(record));
}

if (summaryOnly) {
  originalLog(JSON.stringify({
    generated: count,
    seed_input: seedInput,
    base_seed: baseSeed,
    scenario: {
      year: scenarioYear ? Number.parseInt(scenarioYear, 10) : undefined,
      cultural_zone: scenarioCulturalZone,
      region: scenarioRegion,
      location: scenarioLocation,
    },
    warning_occurrences: Array.from(warningCounts.values()).reduce((total, item) => total + item.count, 0),
    failure_modes: Object.fromEntries(warningCounts),
    religions: Object.fromEntries([...religionCounts.entries()].sort((a, b) => b[1] - a[1])),
    professions: Object.fromEntries([...professionCounts.entries()].sort((a, b) => b[1] - a[1])),
  }, null, 2));
}
