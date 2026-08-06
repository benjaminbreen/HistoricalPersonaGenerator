/**
 * services/promptSourceService.ts
 *
 * Reads a short Source Studio prompt — "a person in 1896 New York city" — as
 * generation parameters instead of as evidence. Nothing here calls a model: if
 * the text names a year and a place the app already has tables for, the
 * procedural generator can answer on its own.
 *
 * Places resolve to the canonical strings in `geography.ts`. Downstream tables
 * (clothing, climate, strata) key on the exact region and area names, so the
 * user's own words must never reach `GenerationParams`.
 */
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { CITIES_DATA } from '../constants/gameData/cities';
import { CulturalZone } from '../types';

export interface PromptSourceParams {
  year?: number;
  culturalZone?: CulturalZone;
  region?: string;
  location?: string;
  /** What the parser recognised, for the status line. */
  matchedPlace?: string;
}

interface PlaceEntry {
  geographyKey: string;
  region: string;
  /** Absent when the prompt named a region rather than an area inside it. */
  area?: string;
  label: string;
}

const GEOGRAPHY_KEY_TO_ZONE: Record<string, CulturalZone> = {
  'Europe': 'EUROPEAN' as CulturalZone,
  'East Asia': 'EAST_ASIAN' as CulturalZone,
  'South Asia': 'SOUTH_ASIAN' as CulturalZone,
  'Southeast Asia': 'SOUTHEAST_ASIAN' as CulturalZone,
  'MENA': 'MENA' as CulturalZone,
  'Sub Saharan Africa': 'SUB_SAHARAN_AFRICAN' as CulturalZone,
  'Oceania': 'OCEANIA' as CulturalZone,
  'South America': 'SOUTH_AMERICAN' as CulturalZone,
};

/**
 * Country and colloquial names the geography tables do not carry. Cities are
 * not listed: `CITIES_DATA` already indexes ~330 of them by area.
 */
const PLACE_ALIASES: Record<string, string> = {
  'england': 'British Isles',
  'britain': 'British Isles',
  'great britain': 'British Isles',
  'united kingdom': 'British Isles',
  'scotland': 'Edinburgh',
  'ireland': 'Leinster Plain',
  'wales': 'British Isles',
  'spain': 'Iberian Peninsula',
  'portugal': 'Lisbon Coast',
  'germany': 'Germanic Lands',
  'netherlands': 'Low Countries',
  'holland': 'Low Countries',
  'belgium': 'Low Countries',
  'switzerland': 'Central Europe',
  'austria': 'Vienna',
  'hungary': 'Central Europe',
  'poland': 'Eastern Europe',
  'russia': 'Eastern Europe',
  'greece': 'Greece and Aegean',
  'norway': 'Scandinavia',
  'sweden': 'Scandinavia',
  'denmark': 'Scandinavia',
  'finland': 'Scandinavia',
  'iceland': 'Atlantic Islands',
  'united states': 'Northeastern Seaboard',
  'america': 'Northeastern Seaboard',
  'new york': 'New York City',
  'nyc': 'New York City',
  'manhattan': 'New York City',
  'canada': 'Canada',
  'mexico': 'Mexico and Central Highlands',
  'brazil': 'Rio de Janeiro',
  'argentina': 'Buenos Aires',
  'peru': 'Andes North',
  'chile': 'Andes South',
  'egypt': 'Nile Valley',
  'morocco': 'Maghreb',
  'algeria': 'Maghreb',
  'tunisia': 'Maghreb',
  'turkey': 'Anatolia',
  'syria': 'Levant',
  'palestine': 'Levant',
  'israel': 'Levant',
  'lebanon': 'Levant',
  'iraq': 'Mesopotamia',
  'iran': 'Persian Plateau',
  'persia': 'Persian Plateau',
  'saudi arabia': 'Arabian Peninsula',
  'arabia': 'Arabian Peninsula',
  'nigeria': 'Lower Guinea and Congo Basin',
  'ghana': 'Upper Guinea',
  'mali': 'Sahel',
  'ethiopia': 'Horn of Africa',
  'somalia': 'Horn of Africa',
  'kenya': 'East African Rift',
  'tanzania': 'East African Rift',
  'south africa': 'Southern Africa',
  'congo': 'Lower Guinea and Congo Basin',
  'madagascar': 'Madagascar and Islands',
  'india': 'Gangetic Plain',
  'pakistan': 'Indus Valley',
  'bangladesh': 'Gangetic Plain',
  'nepal': 'Himalayas and Northeast',
  'ceylon': 'Sri Lanka',
  'china': 'North China Plain',
  'mongolia': 'Mongolia and Manchuria',
  'tibet': 'West China and Tibet',
  'siam': 'Bangkok',
  'thailand': 'Bangkok',
  'burma': 'Yangon',
  'myanmar': 'Yangon',
  'vietnam': 'Hanoi',
  'cambodia': 'Angkor',
  'laos': 'Indochina Interior',
  'malaya': 'Singapore',
  'malaysia': 'Singapore',
  'indonesia': 'Maritime Southeast Asia',
  'java': 'Maritime Southeast Asia',
  'australia': 'Australia – Southeast',
  'hawaii': 'Hawaii and Central Pacific',
  'fiji': 'Polynesia',
};

let placeIndex: Map<string, PlaceEntry> | null = null;

/** First registration wins, so areas beat regions and both beat cities. */
function register(index: Map<string, PlaceEntry>, label: string, entry: PlaceEntry): void {
  const key = label.toLowerCase();
  if (key.length < 4 || index.has(key)) return;
  index.set(key, entry);
}

function buildPlaceIndex(): Map<string, PlaceEntry> {
  const index = new Map<string, PlaceEntry>();
  const areaToEntry = new Map<string, PlaceEntry>();

  for (const [geographyKey, regions] of Object.entries(GEOGRAPHICAL_DATA)) {
    for (const [region, areas] of Object.entries(regions)) {
      if (!areas || typeof areas !== 'object') continue;
      for (const areaKey of Object.keys(areas)) {
        const areaName = areas[areaKey]?.name || areaKey;
        const entry: PlaceEntry = { geographyKey, region, area: areaName, label: areaName };
        register(index, areaName, entry);
        if (!areaToEntry.has(areaName)) areaToEntry.set(areaName, entry);
      }
    }
  }

  for (const [geographyKey, regions] of Object.entries(GEOGRAPHICAL_DATA)) {
    for (const region of Object.keys(regions)) {
      register(index, region, { geographyKey, region, label: region });
    }
  }

  for (const [areaName, cities] of Object.entries(CITIES_DATA)) {
    const areaEntry = areaToEntry.get(areaName);
    if (!areaEntry) continue;
    for (const city of cities) {
      register(index, city.name, { ...areaEntry, label: city.name });
    }
  }

  return index;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

function findPlace(text: string): PlaceEntry | null {
  if (!placeIndex) placeIndex = buildPlaceIndex();
  const haystack = text.toLowerCase();

  const aliasKeys = Object.keys(PLACE_ALIASES).sort((a, b) => b.length - a.length);
  const directKeys = [...placeIndex.keys()].sort((a, b) => b.length - a.length);

  // Aliases first: "new york" must not lose to a longer table name that happens
  // to contain it.
  for (const key of aliasKeys) {
    if (!new RegExp(`\\b${escapeRegExp(key)}\\b`).test(haystack)) continue;
    const target = placeIndex.get(PLACE_ALIASES[key].toLowerCase());
    if (target) return { ...target, label: PLACE_ALIASES[key] };
  }

  for (const key of directKeys) {
    if (new RegExp(`\\b${escapeRegExp(key)}\\b`).test(haystack)) return placeIndex.get(key)!;
  }

  return null;
}

function findYear(text: string): number | null {
  const bce = text.match(/\b(\d{1,4})\s*(?:bce|bc|b\.c\.)\b/i);
  if (bce) return -Number(bce[1]);

  // "1890s" and "the 1500s" name a decade or a century; take the base year.
  const decade = text.match(/\b(\d{3,4})0s\b/i);
  if (decade) return Number(`${decade[1]}0`);

  const ce = text.match(/\b(\d{1,4})\s*(?:ce|ad|a\.d\.)\b/i);
  if (ce) return Number(ce[1]);

  const plain = text.match(/\b(\d{3,4})\b/);
  if (plain) {
    const year = Number(plain[1]);
    if (year >= 100 && year <= 2030) return year;
  }

  return null;
}

const PERSON_WORDS = /\b(person|people|man|men|woman|women|child|girl|boy|peasant|farmer|worker|labou?rer|merchant|soldier|sailor|someone|somebody|life|persona|character|inhabitant|resident|villager|townsperson)\b/i;
const REQUEST_OPENING = /^(a|an|some|any|random|generate|make|create|show|give|someone|somebody|imagine|I want|I'd like)\b/i;

/**
 * Read a Source Studio entry as a generation request, or return null to send it
 * down the normal source-ingestion path.
 *
 * Deliberately narrow. Real evidence is longer than 25 words, and a short quote
 * that happens to name a year and a place — "I saw the ships burn at Cadiz in
 * 1587" — should still be treated as a source, so a bare place or bare year
 * only counts when the text is phrased as a request.
 */
export function parsePromptSource(text: string): PromptSourceParams | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.split(/\s+/).length > 25) return null;

  const year = findYear(trimmed);
  const place = findPlace(trimmed);
  if (year === null && !place) return null;

  const looksLikeRequest = REQUEST_OPENING.test(trimmed) && PERSON_WORDS.test(trimmed);
  if ((year === null || !place) && !looksLikeRequest) return null;

  const params: PromptSourceParams = {};
  if (year !== null) params.year = year;

  if (place) {
    params.region = place.region;
    if (place.area) params.location = place.area;
    params.matchedPlace = place.label;

    if (place.geographyKey === 'North America') {
      // The two North American zones share one geography table; the year picks
      // which name pools, religions and professions apply.
      params.culturalZone = ((year ?? 1500) >= 1492
        ? 'NORTH_AMERICAN_COLONIAL'
        : 'NORTH_AMERICAN_PRE_COLUMBIAN') as CulturalZone;
    } else {
      params.culturalZone = GEOGRAPHY_KEY_TO_ZONE[place.geographyKey];
    }
  }

  return params;
}

/** "1896 New York City", for the status line. */
export function describePromptSource(params: PromptSourceParams): string {
  const year = params.year === undefined
    ? null
    : params.year < 0 ? `${Math.abs(params.year)} BCE` : String(params.year);
  return [year, params.matchedPlace].filter(Boolean).join(' ') || 'the prompt';
}
