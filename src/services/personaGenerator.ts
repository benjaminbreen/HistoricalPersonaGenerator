/**
 * Standalone persona generator using the character generation system
 */
import { PlayerCharacter, HistoricalEra, CulturalZone, Gender, WealthLevel } from '../types';
import { generateCharacterWithSpec } from './characterGenerator';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { generateLifeHistory, EnhancedLifeEvent, EventImportance } from '../constants/characterData/lifeHistoryService';
import { getLanguageForCharacter, LanguageData } from '../constants/gameData/languages';

// Generate a backstory sentence based on a significant life event
function generateLifeEventBackstorySentence(
  events: EnhancedLifeEvent[],
  characterName: string
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
    ? priorityEvents[Math.floor(Math.random() * priorityEvents.length)]
    : significantEvents[Math.floor(Math.random() * significantEvents.length)];

  // Generate evocative sentence based on event type
  const templates: Record<string, string[]> = {
    battle: [
      "You still dream of the fighting—the chaos, the screams, the smell of blood.",
      "The battle left its mark on you, in ways both visible and hidden.",
      "You've seen combat. It changed something in you.",
      "War taught you lessons no book ever could."
    ],
    tragedy: [
      "Loss has visited you more than once. It no longer surprises you.",
      "There are griefs you carry that you've learned not to speak of.",
      "You know what it is to lose everything and start again.",
      "Some wounds heal. Others you learn to live with."
    ],
    injury: [
      "Your body remembers what your mind tries to forget.",
      "The old injury still aches when the weather turns.",
      "You carry a reminder of how quickly things can change.",
      "Pain has been a teacher, though a harsh one."
    ],
    plague: [
      "You survived when many did not. The guilt of it lingers.",
      "The sickness took so many. You were spared, though you're not sure why.",
      "You remember the smell of death, the empty streets, the prayers that went unanswered.",
      "The plague years haunt you still."
    ],
    romance: [
      "You once loved someone deeply. It ended, as such things do.",
      "There is a name you no longer speak, though you think of it often.",
      "Your heart has known both great joy and great sorrow.",
      "Love found you once. You're not sure it will again."
    ],
    journey: [
      "Travel has broadened your mind and thinned your purse.",
      "You've seen places most only dream of.",
      "The road has been your home more than once.",
      "Wandering has taught you that home is more idea than place."
    ],
    trade: [
      "Fortune has smiled on you, and frowned, in equal measure.",
      "You've learned that opportunity knocks softly and leaves quickly.",
      "Commerce has its own rhythms. You've learned to dance to them.",
      "Money comes and goes. You try not to hold too tightly."
    ],
    achievement: [
      "You've accomplished things you once thought impossible.",
      "Success came, eventually, though the path was never straight.",
      "You've proven yourself, at least to those who matter.",
      "Recognition found you. Whether you deserved it is another question."
    ],
    religious: [
      "Faith has sustained you through dark times.",
      "You've had moments of doubt, and moments of profound certainty.",
      "The divine works in ways you've stopped trying to understand.",
      "Your spiritual journey has been anything but simple."
    ],
    family: [
      "Family can be both burden and blessing. Yours has been both.",
      "Blood ties run deep, though they sometimes chafe.",
      "Your family shaped you more than you care to admit.",
      "Home and family—complicated words, for you."
    ],
    discovery: [
      "You've seen things that changed how you understand the world.",
      "Knowledge, once gained, cannot be ungained. You know this well.",
      "Curiosity has led you to strange places.",
      "What you've learned has set you apart from others."
    ],
    legal: [
      "You've had dealings with authorities that left their mark.",
      "Justice is not always just. You learned this the hard way.",
      "The law has touched your life in ways you'd rather forget.",
      "You know what it is to be judged, fairly or not."
    ]
  };

  const eventKind = eventToUse.kind as string;
  const eventTemplates = templates[eventKind] || templates['achievement'];

  return eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
}

export interface GenerationParams {
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
}

export interface HistoricalPersona {
  character: PlayerCharacter;
  era: string;
  culturalZone: string;
  location: string;
  region: string; // The broader region (e.g., "British Isles", "Southwest")
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  enhancedLifeEvents?: EnhancedLifeEvent[]; // New enhanced life events
  languageData?: LanguageData; // Native language data
}

// Helper to get random element from array
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to get random integer in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Map cultural zones to geography data keys
const culturalZoneToGeographyKey: Record<CulturalZone, string> = {
  'EUROPEAN': 'Europe',
  'EAST_ASIAN': 'East Asia',
  'SOUTH_ASIAN': 'South Asia',
  'MENA': 'MENA',
  'SUB_SAHARAN_AFRICAN': 'Sub Saharan Africa',
  'OCEANIA': 'Oceania',
  'NORTH_AMERICAN_PRE_COLUMBIAN': 'North America',
  'NORTH_AMERICAN_COLONIAL': 'North America',
  'SOUTH_AMERICAN': 'South America',
};

// Get a random location from a cultural zone, returns both region and specific area
// Filters out locations that have minYear constraints not met by the given year
function getRandomLocation(culturalZone: CulturalZone, year?: number): { area: string; region: string } {
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

  const randomRegion = randomElement(regionNames);
  const areas = regions[randomRegion];
  if (!areas || typeof areas !== 'object') return { area: randomRegion, region: randomRegion };

  // Filter areas that are valid for this year
  const areaNames = Object.keys(areas).filter(areaKey => {
    const area = areas[areaKey];
    return !area?.minYear || year === undefined || year >= area.minYear;
  });

  if (areaNames.length === 0) return { area: randomRegion, region: randomRegion };

  const randomAreaKey = randomElement(areaNames);
  const randomArea = areas[randomAreaKey];
  return {
    area: randomArea?.name || randomRegion,
    region: randomRegion
  };
}

// Get year range for an era
function getEraYearRange(era: HistoricalEra): { min: number; max: number } {
  const ranges: Record<HistoricalEra, { min: number; max: number }> = {
    PREHISTORY: { min: -4000, max: -3000 },
    ANTIQUITY: { min: -3000, max: 500 },
    MEDIEVAL: { min: 500, max: 1450 },
    RENAISSANCE_EARLY_MODERN: { min: 1450, max: 1750 },
    INDUSTRIAL_ERA: { min: 1750, max: 1900 },
    MODERN_ERA: { min: 1900, max: 2000 },
    FUTURE_ERA: { min: 2000, max: 2100 },
  };
  return ranges[era] || { min: 1500, max: 1800 };
}

// Get era from year
function getEraFromYear(year: number): HistoricalEra {
  if (year < -3000) return 'PREHISTORY' as HistoricalEra;
  if (year < 500) return 'ANTIQUITY' as HistoricalEra;
  if (year < 1450) return 'MEDIEVAL' as HistoricalEra;
  if (year < 1750) return 'RENAISSANCE_EARLY_MODERN' as HistoricalEra;
  if (year < 1900) return 'INDUSTRIAL_ERA' as HistoricalEra;
  if (year < 2000) return 'MODERN_ERA' as HistoricalEra;
  return 'FUTURE_ERA' as HistoricalEra;
}

export function generateHistoricalPersona(params: Partial<GenerationParams> = {}): HistoricalPersona {
  // Determine era
  let era: HistoricalEra;
  let year: number;

  if (params.year) {
    year = params.year;
    era = params.era || getEraFromYear(year);
  } else if (params.era) {
    era = params.era;
    const range = getEraYearRange(era);
    year = randomInt(range.min, range.max);
  } else {
    // Random era
    const eras: HistoricalEra[] = [
      'PREHISTORY' as HistoricalEra,
      'ANTIQUITY' as HistoricalEra,
      'MEDIEVAL' as HistoricalEra,
      'RENAISSANCE_EARLY_MODERN' as HistoricalEra,
      'INDUSTRIAL_ERA' as HistoricalEra,
      'MODERN_ERA' as HistoricalEra,
    ];
    era = randomElement(eras);
    const range = getEraYearRange(era);
    year = randomInt(range.min, range.max);
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

    culturalZone = randomElement(validZones);
  }

  // Determine location (both region and specific area)
  // Pass year to filter out locations that weren't settled yet (e.g., New Zealand before 1280)
  const locationData = getRandomLocation(culturalZone, year);
  const location = params.location || locationData.area;
  const region = params.region || locationData.region;

  // Determine gender
  const gender = params.gender || randomElement(['Male', 'Female', 'Non-binary'] as Gender[]);

  // Determine age
  const age = params.age !== undefined ? params.age : randomInt(params.minAge || 18, params.maxAge || 70);

  // Determine wealth level
  const wealthLevel = params.wealthLevel || randomElement(['poor', 'modest', 'comfortable', 'wealthy', 'noble'] as WealthLevel[]);

  // Generate random month and day
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  const dateString = `${month}/${day}/${year}`;

  // Determine social class from wealthLevel or params
  const socialClass = params.socialClass || (
    wealthLevel === 'noble' || wealthLevel === 'wealthy' ? 'noble' :
    wealthLevel === 'comfortable' ? 'merchant' : 'commoner'
  );

  // Generate the character
  const character = generateCharacterWithSpec(
    {
      date: dateString,
      location: location, // Specific area like "London"
      region: region,     // Broader region like "British Isles"
      era: era,          // Historical era for religion/culture lookup
      culturalZone: culturalZone, // Cultural zone for name/religion lookup
    },
    {
      name: params.name, // Use provided name if available
      gender: gender.toLowerCase() as 'male' | 'female',
      age,
      socialClass: socialClass,
      religion: params.religion, // Use provided religion if available
      profession: params.profession, // Use provided profession if available
      birthYear: params.birthYear, // Use provided birth year if available
      ethnicity: culturalZone, // Pass cultural zone as ethnicity to ensure proper character generation
    } as any
  );

  // Generate enhanced life events using the new service
  const enhancedLifeEvents = generateLifeHistory(
    character,
    year,
    culturalZone,
    era
  );

  // Append life event-based sentence to backstory if there's a significant event
  const lifeEventSentence = generateLifeEventBackstorySentence(enhancedLifeEvents, character.name);
  if (lifeEventSentence && character.backstory) {
    character.backstory = character.backstory + ' ' + lifeEventSentence;
  }

  // Get native language data
  const languageData = getLanguageForCharacter(
    culturalZone,
    year,
    region,
    location,
    character.name,
    character.profession
  );

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
  };
}
