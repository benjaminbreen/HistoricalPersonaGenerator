/**
 * Standalone persona generator using the character generation system
 */
import { PlayerCharacter, HistoricalEra, CulturalZone, Gender, WealthLevel } from '../types';
import { generateCharacterWithSpec } from './characterGenerator';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { generateLifeHistory, EnhancedLifeEvent, EventImportance } from '../constants/characterData/lifeHistoryService';
import { attributeLanguage, attributionToLanguageData, type LanguageAttribution } from './languageAttributionService';
import { getLanguageForCharacter, LanguageData } from '../constants/gameData/languages';
import { applyPortraitAuthenticity } from './portraitAuthenticityService';
import {
  DEFAULT_SAMPLING_MODE,
  DrawOdds,
  ERA_BOUNDS,
  SamplingMode,
  describeOdds,
  sampleAdultAge,
  sampleBirthSex,
  sampleCulturalZone,
  sampleEra,
  sampleGenderRole,
  sampleWealthLevel,
  sampleYearInEra,
  socialGender,
} from './demographyService';
import { polityFormFor, sampleSocialStatus } from './socialStatusService';
import { describeLifeEventSecondPerson } from './narrativeTextService';
import { createHistoricalContext } from './historicalContextService';
import type { HistoricalContext } from '../types/historicalContext';
import { withSeed } from '../utils/seededRandom';

// Generate a backstory sentence based on a significant life event
function generateLifeEventBackstorySentence(
  events: EnhancedLifeEvent[],
  characterAge: number,
  currentYear: number,
  random: () => number = Math.random,
): string | null {
  if (!events || events.length === 0) return null;

  // Find significant events (not birth, not mundane)
  const significantEvents = events.filter(e =>
    e.kind !== 'birth' &&
    e.importance !== EventImportance.MUNDANE &&
    e.year !== events[0]?.year // Not the birth year
  );

  if (significantEvents.length === 0) return null;

  // Prioritize tragedies and battles as they make for more evocative backstory
  const priorityEvents = significantEvents.filter(e =>
    e.importance === EventImportance.TRAGEDY ||
    e.importance === EventImportance.INJURY ||
    e.kind === 'battle' ||
    e.kind === 'romance' ||
    e.kind === 'plague'
  );

  const eventToUse = priorityEvents.length > 0
    ? priorityEvents[Math.floor(random() * priorityEvents.length)]
    : significantEvents[Math.floor(random() * significantEvents.length)];

  const ageAtEvent = characterAge - (currentYear - eventToUse.year);
  if (ageAtEvent < 0 || ageAtEvent > characterAge) return null;
  return describeLifeEventSecondPerson(eventToUse, ageAtEvent);
}

export interface GenerationParams {
  /**
   * True-frequency (default) samples eras and regions in proportion to how many
   * people actually lived in them; explore keeps the whole world reachable.
   * See docs/DEMOGRAPHY.md §4.
   */
  samplingMode?: SamplingMode;
  era?: HistoricalEra;
  culturalZone?: CulturalZone;
  gender?: Gender;
  wealthLevel?: WealthLevel;
  minAge?: number;
  maxAge?: number;
  year?: number;
  location?: string;
  region?: string;
  name?: string;
  socialClass?: string;
  religion?: string;
  birthYear?: number;
  age?: number;
  profession?: string;
  seed?: number;
}

export interface HistoricalPersona {
  character: PlayerCharacter;
  era: string;
  /**
   * Human-readable label ("SOUTH ASIAN"), not the `CulturalZone` enum. Any
   * table keyed by the enum — climate, geography, society capabilities — must
   * use `character.culturalZone` or `historicalContext.culturalZone` instead.
   */
  culturalZone: string;
  location: string;
  region: string; // The broader region (e.g., "British Isles", "Southwest")
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  enhancedLifeEvents?: EnhancedLifeEvent[]; // New enhanced life events
  languageData?: LanguageData; // Native language data
  /** How that language was arrived at, with its citations. */
  languageAttribution?: LanguageAttribution;
  historicalContext: HistoricalContext;
  /** How representative this draw actually was. Never hidden from the reader. */
  odds?: DrawOdds;
  samplingMode?: SamplingMode;
}

// Helper to get random element from array
function randomElement<T>(arr: T[], random: () => number = Math.random): T {
  return arr[Math.floor(random() * arr.length)];
}

// Helper to get random integer in range
function randomInt(min: number, max: number, random: () => number = Math.random): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

// Map cultural zones to geography data keys
const culturalZoneToGeographyKey: Record<CulturalZone, string> = {
  'EUROPEAN': 'Europe',
  'EAST_ASIAN': 'East Asia',
  'SOUTH_ASIAN': 'South Asia',
  'SOUTHEAST_ASIAN': 'Southeast Asia',
  'MENA': 'MENA',
  'SUB_SAHARAN_AFRICAN': 'Sub Saharan Africa',
  'OCEANIA': 'Oceania',
  'NORTH_AMERICAN_PRE_COLUMBIAN': 'North America',
  'NORTH_AMERICAN_COLONIAL': 'North America',
  'SOUTH_AMERICAN': 'South America',
};

// Get a random location from a cultural zone, returns both region and specific area
// Filters out locations that have minYear constraints not met by the given year
function getRandomLocation(culturalZone: CulturalZone, year?: number, random: () => number = Math.random): { area: string; region: string } {
  const geographyKey = culturalZoneToGeographyKey[culturalZone];
  if (!geographyKey) return { area: 'Unknown', region: 'Unknown' };

  const regions = GEOGRAPHICAL_DATA[geographyKey];
  if (!regions) return { area: 'Unknown', region: 'Unknown' };

  // Filter regions that have at least one valid area for this year
  const regionNames = Object.keys(regions).filter(regionName => {
    const areas = regions[regionName];
    if (!areas || typeof areas !== 'object') return true;
    // Check if any area in this region is valid for the year
    const areaKeys = Object.keys(areas);
    return areaKeys.some(areaKey => {
      const area = areas[areaKey];
      // If no minYear constraint, or year is undefined, or year >= minYear, it's valid
      return !area?.minYear || year === undefined || year >= area.minYear;
    });
  });

  if (regionNames.length === 0) return { area: 'Unknown', region: 'Unknown' };

  const randomRegion = randomElement(regionNames, random);
  const areas = regions[randomRegion];
  if (!areas || typeof areas !== 'object') return { area: randomRegion, region: randomRegion };

  // Filter areas that are valid for this year
  const areaNames = Object.keys(areas).filter(areaKey => {
    const area = areas[areaKey];
    return !area?.minYear || year === undefined || year >= area.minYear;
  });

  if (areaNames.length === 0) return { area: randomRegion, region: randomRegion };

  const randomAreaKey = randomElement(areaNames, random);
  const randomArea = areas[randomAreaKey];
  return {
    area: randomArea?.name || randomRegion,
    region: randomRegion
  };
}

// Get era from year
function getEraFromYear(year: number): HistoricalEra {
  if (year < -3000) return 'PREHISTORY' as HistoricalEra;
  if (year < 500) return 'ANTIQUITY' as HistoricalEra;
  if (year < 1450) return 'MEDIEVAL' as HistoricalEra;
  if (year < 1750) return 'RENAISSANCE_EARLY_MODERN' as HistoricalEra;
  if (year < 1900) return 'INDUSTRIAL_ERA' as HistoricalEra;
  if (year < 2030) return 'MODERN_ERA' as HistoricalEra;
  return 'FUTURE_ERA' as HistoricalEra;
}

export function generateHistoricalPersona(params: Partial<GenerationParams> = {}): HistoricalPersona {
  // One persona, one seed. Generation reaches for randomness in ~100 places
  // across nine modules; `withSeed` makes all of them deterministic for the
  // duration of this call, so the same seed always produces the same person.
  // Without it a shared persona link showed the recipient a different life
  // than the sender saw, and no regression test over generation could exist.
  const resolvedSeed = (params.seed ?? (Date.now() ^ Math.floor(Math.random() * 0x7fffffff))) >>> 0;
  return withSeed(resolvedSeed, () => generatePersonaWithSeed(params, resolvedSeed));
}

function generatePersonaWithSeed(
  params: Partial<GenerationParams>,
  resolvedSeed: number,
): HistoricalPersona {
  const samplingMode: SamplingMode = params.samplingMode ?? DEFAULT_SAMPLING_MODE;
  let seedState = resolvedSeed;
  const random = (): number => {
    seedState += 0x6D2B79F5;
    let value = seedState;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
  // Determine era
  let era: HistoricalEra;
  let year: number;

  if (params.year !== undefined) {
    year = params.year;
    era = params.era || getEraFromYear(year);
  } else if (params.era) {
    era = params.era;
    year = sampleYearInEra(era, samplingMode, random);
  } else {
    // Weighted by how many human lives began in each era, then flattened for
    // explorability unless true-frequency was asked for.
    era = sampleEra(samplingMode, random);
    year = sampleYearInEra(era, samplingMode, random);
  }

  // Determine cultural zone (respecting era for colonial vs pre-columbian)
  let culturalZone: CulturalZone;
  if (params.culturalZone) {
    culturalZone = params.culturalZone;
  } else {
    // Build list of valid cultural zones based on era
    const validZones: CulturalZone[] = [
      'EUROPEAN',
      'EAST_ASIAN',
      'SOUTH_ASIAN',
      'MENA',
      'SUB_SAHARAN_AFRICAN',
      'OCEANIA',
      'SOUTH_AMERICAN',
    ];

    // Only include colonial zones after 1492
    if (year >= 1492) {
      validZones.push('NORTH_AMERICAN_COLONIAL');
    } else {
      validZones.push('NORTH_AMERICAN_PRE_COLUMBIAN');
    }

    culturalZone = sampleCulturalZone(year, samplingMode, validZones, random);
  }

  // Determine location (both region and specific area)
  // Pass year to filter out locations that weren't settled yet (e.g., New Zealand before 1280)
  const locationData = getRandomLocation(culturalZone, year, random);
  const location = params.location || locationData.area;
  const region = params.region || locationData.region;

  // Sex, and — rarely, and only where one is attested — a recognised
  // third-gender social role held by someone of that sex. See
  // docs/DEMOGRAPHY.md; the previous code picked uniformly from three genders
  // and then silently collapsed the third into Female.
  const requestedSex =
    params.gender === 'Male' || params.gender === 'Female' ? params.gender : undefined;
  const birthSex = requestedSex || sampleBirthSex(random);
  const genderRole = params.gender
    ? null
    : sampleGenderRole(birthSex, culturalZone, `${region} ${location}`, year, random);
  const gender: Gender = socialGender(birthSex, genderRole);

  // Age, drawn from a survivorship curve rather than uniformly across 18-70.
  const age = params.age !== undefined
    ? params.age
    : sampleAdultAge(year, random, params.minAge, params.maxAge);

  // Determine wealth level
  const wealthLevel = params.wealthLevel || sampleWealthLevel(era, random);

  // Generate random month and day
  const month = randomInt(1, 12, random);
  const day = randomInt(1, 28, random);
  const dateString = `${month}/${day}/${year}`;

  const historicalContext = createHistoricalContext({
    year,
    era,
    culturalZone,
    region,
    location,
  });
  // Status and wealth are related but distinct. Locale type changes their
  // distribution without making unusual combinations impossible.
  const socialClass = params.socialClass || sampleSocialStatus(
    era,
    wealthLevel,
    random,
    historicalContext.localeType,
    polityFormFor({ year, culturalZone, placeLower: `${location} ${region}`.toLowerCase() }),
  );

  // Generate the character
  const generatedCharacter = generateCharacterWithSpec(
    {
      date: dateString,
      location: location, // Specific area like "London"
      region: region,     // Broader region like "British Isles"
      era: era,          // Historical era for religion/culture lookup
      culturalZone: culturalZone, // Cultural zone for name/religion lookup
      historicalContext,
      seed: params.seed === undefined ? Math.floor(random() * 0x7fffffff) : params.seed,
    },
    {
      name: params.name, // Use provided name if available
      gender: birthSex.toLowerCase() as 'male' | 'female',
      age,
      socialClass: socialClass,
      wealthLevel,
      religion: params.religion, // Use provided religion if available
      profession: params.profession, // Use provided profession if available
      birthYear: params.birthYear, // Use provided birth year if available
      ethnicity: culturalZone, // Pass cultural zone as ethnicity to ensure proper character generation
    } as any
  );
  const character = applyPortraitAuthenticity(generatedCharacter, {
    year,
    region,
    location,
  });

  // The character generator builds the body from birth sex; the social gender
  // is layered back on afterwards so a third-gender persona keeps a coherent
  // appearance while being presented as who they were in their own society.
  character.birthSex = birthSex;
  character.gender = gender;
  if (genderRole) character.genderRole = genderRole;

  // Generate enhanced life events using the new service
  const enhancedLifeEvents = generateLifeHistory(
    character,
    year,
    culturalZone,
    era,
    `${location} ${region}`,
  );

  // Append life event-based sentence to backstory if there's a significant event
  const lifeEventSentence = generateLifeEventBackstorySentence(enhancedLifeEvents, character.age, year, random);
  if (lifeEventSentence && character.backstory) {
    character.backstory = character.backstory + ' ' + lifeEventSentence;
  }

  // Native language. Every persona gets one: the attested tables where they
  // reach, a cited deep-time attribution where they do not.
  // See docs/LANGUAGE_ATTRIBUTION.md.
  const languageAttribution = attributeLanguage({
    culturalZone,
    year,
    region,
    location,
    characterName: character.name,
    profession: character.profession,
    religion: character.religion,
    seed: params.seed ?? 0,
  });
  const languageData = attributionToLanguageData(languageAttribution, culturalZone, year);

  return {
    character,
    era: era.replace(/_/g, ' '),
    culturalZone: culturalZone.replace(/_/g, ' '),
    location,
    region,
    year,
    month,
    day,
    enhancedLifeEvents,
    languageData,
    languageAttribution,
    historicalContext,
    odds: describeOdds(era, culturalZone, year),
    samplingMode,
  };
}
