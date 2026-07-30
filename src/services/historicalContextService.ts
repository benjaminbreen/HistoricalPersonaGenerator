import type { CulturalZone, HistoricalEra } from '../types';
import type { HistoricalContext, LocaleType } from '../types/historicalContext';

const stableId = (value: string): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '') || 'unknown';

/**
 * Whether a place is a settlement dense enough to hold urban institutions.
 *
 * The institution gates below used to ask `!== 'rural'`, which reads as a
 * reasonable test and is not one: `unknown` is the answer for 295 of the 569
 * areas in the geography, so more than half the world was quietly treated as
 * urban. A man in the Mekong Delta in 2001 was handed a university, a factory,
 * a railway station, a bureaucracy and chain retail, all on the strength of the
 * word "Delta" not being in a list. The question the gates mean to ask is
 * whether this is a town or a city, so that is what they now ask.
 */
const isUrban = (locale: LocaleType): boolean => locale === 'city' || locale === 'town';

/**
 * Named cities, for the areas that are cities rather than landforms.
 *
 * The list was drawn from the North Atlantic and its usual counterparts and had
 * no Southeast Asian entry at all — not Ayutthaya, Angkor, Bagan, Thăng Long,
 * Malacca, Batavia or Manila, several of which were among the largest cities on
 * earth in their day. Angkor may have been the largest pre-industrial city
 * anywhere.
 */
const CITY_NAMES = /\b(?:london|paris|rome|vienna|constantinople|istanbul|venice|prague|berlin|madrid|lisbon|amsterdam|cairo|alexandria|baghdad|damascus|jerusalem|mecca|medina|isfahan|tehran|beijing|nanjing|hangzhou|kyoto|edo|tokyo|seoul|delhi|agra|lahore|dhaka|timbuktu|kilwa|cuzco|lima|potosi|boston|philadelphia|montreal|moscow|new york|manhattan|hudson|kiev|kyiv|novgorod|warsaw|budapest|athens|naples|florence|milan|antwerp|bruges|hamburg|copenhagen|stockholm|dublin|edinburgh|bristol|liverpool|manchester|marseille|lyon|seville|barcelona|granada|fez|tunis|aleppo|smyrna|izmir|samarkand|bukhara|kabul|multan|calcutta|kolkata|bombay|mumbai|madras|chennai|canton|guangzhou|shanghai|nagasaki|osaka|kaifeng|xian|chang'an|tenochtitlan|mexico city|potosí|salvador|havana|charleston|quebec|ayutthaya|angkor|bagan|pagan|pegu|ava|mandalay|rangoon|yangon|bangkok|thonburi|phnom penh|thang long|thăng long|hanoi|hà nội|hue|huế|saigon|sài gòn|ho chi minh|malacca|melaka|batavia|jakarta|surabaya|palembang|makassar|manila|cebu|vientiane|luang prabang|singapore|penang|george town|brunei)\b/i;

function inferLocaleType(region: string, location: string): LocaleType {
  const place = `${region} ${location}`;
  // A water feature named after a city is not that city. The Strait of Malacca
  // is a shipping lane a hundred kilometres wide; Malacca is a port on it.
  if (/\b(?:strait|straits|gulf|bay|sea|isthmus|cape|mouths?|delta)\s+of\b/i.test(place)) return 'rural';
  if (CITY_NAMES.test(place)) return 'city';
  if (/\b(?:city|capital|metropolis|urban|port|harbor|harbour)\b/i.test(place)) return 'city';
  if (/\b(?:town|borough|market|settlement)\b/i.test(place)) return 'town';
  if (/\b(?:steppe|nomad|pastoral|caravan|migratory)\b/i.test(place)) return 'mobile';
  // Landforms, which is what most areas in the geography are named after. The
  // list stopped at nine words and so missed most of the world's coastlines:
  // deltas, straits, peninsulas, fjords, hills and archipelagos are countryside
  // as surely as a valley is.
  // The trailing `s?` matters as much as the vocabulary: the old list had
  // "highland" but not "highlands", so the Annam Highlands were unclassified.
  if (/\b(?:valley|plain|plateau|highland|lowland|forest|coast|coastal|basin|river|mountain|desert|island|isle|rural|village|delta|estuary|strait|sound|channel|peninsula|cordillera|range|ridge|foothill|hill|upland|down|moor|fen|marsh|swamp|bog|tundra|savanna|savannah|prairie|grassland|oasis|canyon|gorge|cape|bay|gulf|lagoon|lake|fjord|glacier|badland|break|archipelago|atoll|reef)s?\b/i.test(place)) return 'rural';
  return 'unknown';
}

/**
 * Earliest years are the earliest anywhere; the prose that consumes these
 * narrows further by zone, since diffusion dates differ by a century or more
 * between the North Atlantic and everywhere else.
 */
function technologiesForYear(year: number): string[] {
  const technologies: string[] = [];
  if (year >= 1450) technologies.push('printing_press');
  if (year >= 1760) technologies.push('mechanized_production');
  if (year >= 1830) technologies.push('railway');
  if (year >= 1840) technologies.push('telegraph');
  if (year >= 1878) technologies.push('telephone');
  if (year >= 1885) technologies.push('automobile');
  if (year >= 1890) technologies.push('electric_light');
  if (year >= 1900) technologies.push('motor_transport');
  if (year >= 1920) technologies.push('broadcast_radio');
  if (year >= 1930) technologies.push('television');
  if (year >= 1940) technologies.push('electronic_computing');
  // The list used to stop here, which is why every post-war persona had to be
  // described with nineteenth-century furniture.
  if (year >= 1945) technologies.push('antibiotics');
  if (year >= 1950) technologies.push('plastics');
  if (year >= 1958) technologies.push('jet_travel');
  if (year >= 1980) technologies.push('personal_computer');
  if (year >= 1992) technologies.push('mobile_telephone');
  if (year >= 1996) technologies.push('internet');
  if (year >= 2008) technologies.push('smartphone');
  return technologies;
}

function institutionsForYear(year: number, localeType: LocaleType): string[] {
  const institutions: string[] = [];
  if (year >= -3000) institutions.push('organized_religion');
  if (year >= 900 && year <= 1850 && isUrban(localeType)) institutions.push('craft_guild');
  if (year >= 1080 && isUrban(localeType)) institutions.push('university');
  if (year >= 1760 && isUrban(localeType)) institutions.push('factory');
  if (year >= 1800 && isUrban(localeType)) institutions.push('modern_bureaucracy');
  if (year >= 1830 && isUrban(localeType)) institutions.push('railway_station');
  if (year >= 1900 && isUrban(localeType)) institutions.push('mass_political_party');
  // The institutions below reach the countryside too — that reach is most of
  // what distinguishes a twentieth-century village from an earlier one — so
  // they are not gated on locale the way the urban ones above are.
  if (year >= 1870) institutions.push('compulsory_school');
  if (year >= 1900) institutions.push('public_clinic');
  if (year >= 1920) institutions.push('identity_papers');
  if (year >= 1930) institutions.push('mass_media');
  if (year >= 1945) institutions.push('welfare_state');
  if (year >= 1960 && isUrban(localeType)) institutions.push('chain_retail');
  if (year >= 2000) institutions.push('mobile_network');
  return institutions;
}

export function createHistoricalContext(input: {
  year: number;
  era: HistoricalEra;
  culturalZone: CulturalZone;
  region: string;
  location: string;
}): HistoricalContext {
  const localeType = inferLocaleType(input.region, input.location);
  return {
    ...input,
    regionId: stableId(input.region),
    localeId: stableId(input.location),
    localeType,
    technologies: technologiesForYear(input.year),
    institutions: institutionsForYear(input.year, localeType),
  };
}
