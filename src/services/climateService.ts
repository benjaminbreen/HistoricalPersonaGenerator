/**
 * services/climateService.ts
 *
 * What the weather was doing where and when the persona lived, and what that
 * implies about what they were wearing.
 *
 * Two problems this fixes.
 *
 * First, seasons were computed from the calendar month alone, so every persona
 * south of the equator had them inverted — a Māori or Mapuche persona on
 * 26 December was described as being in "the depths of winter" on what was in
 * fact midsummer. That affected roughly a sixth of all output.
 *
 * Second, nothing connected climate to clothing. A hunter in the Tarim Basin —
 * a cold desert where January means −10°C — was generated bare-chested in
 * December, because the wardrobe tables are indexed by culture and wealth and
 * had no idea it was winter in a continental interior.
 */

import { ClimateType } from '../types/enums';
import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';

export type Hemisphere = 'north' | 'south';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn' | 'wet' | 'dry';

/**
 * How much insulation the persona needs. Deliberately coarse — four states is
 * as much as the wardrobe tables can meaningfully act on.
 */
export type ThermalNeed = 'freezing' | 'cold' | 'temperate' | 'hot';

const culturalZoneToGeographyKey: Record<string, string> = {
  EUROPEAN: 'Europe',
  EAST_ASIAN: 'East Asia',
  SOUTH_ASIAN: 'South Asia',
  MENA: 'MENA',
  SUB_SAHARAN_AFRICAN: 'Sub Saharan Africa',
  OCEANIA: 'Oceania',
  NORTH_AMERICAN_PRE_COLUMBIAN: 'North America',
  NORTH_AMERICAN_COLONIAL: 'North America',
  SOUTH_AMERICAN: 'South America',
};

/** The climate recorded for this specific area, if the geography knows it. */
export function getAreaClimate(
  culturalZone: string,
  region: string,
  location?: string
): ClimateType | undefined {
  const key = culturalZoneToGeographyKey[culturalZone];
  const regions = key ? (GEOGRAPHICAL_DATA as any)[key] : undefined;
  const areas = regions?.[region];
  if (!areas || typeof areas !== 'object') return undefined;

  if (location && areas[location]?.climate) return areas[location].climate;
  // Fall back to any area in the region — better than assuming temperate.
  for (const area of Object.values<any>(areas)) {
    if (area?.climate) return area.climate;
  }
  return undefined;
}

/**
 * Which side of the equator.
 *
 * Approximate, and deliberately so: the app's regions are coarse and several
 * straddle the line. Where a zone is mixed, the exceptions are listed rather
 * than the rule, because the exceptions are shorter.
 */
export function hemisphereFor(culturalZone: string, region: string): Hemisphere {
  const place = (region || '').toLowerCase();
  switch (culturalZone) {
    case 'SOUTH_AMERICAN':
      return /caribbean|guiana|venezuela|colombia|orinoco|isthmus|panama/.test(place)
        ? 'north'
        : 'south';
    case 'OCEANIA':
      return /hawai|micronesia|mariana|marshall|caroline|guam|palau/.test(place)
        ? 'north'
        : 'south';
    case 'SUB_SAHARAN_AFRICAN':
      return /southern africa|kalahari|cape|zambezi|limpopo|namib|botswana|zimbabwe|south africa|madagascar|angola|mozambique/.test(place)
        ? 'south'
        : 'north';
    default:
      return 'north';
  }
}

/**
 * The season, corrected for hemisphere.
 *
 * Tropical regions get wet and dry rather than four temperate seasons, because
 * that is how the year is actually divided there and "the depths of winter" in
 * equatorial Africa is simply wrong.
 */
export function seasonFor(month: number, hemisphere: Hemisphere, climate?: ClimateType): Season {
  if (climate === ClimateType.TROPICAL) {
    // Broadly: monsoon and equatorial rains fall in the local high-sun months.
    const highSun = hemisphere === 'north' ? month >= 5 && month <= 10 : month >= 11 || month <= 4;
    return highSun ? 'wet' : 'dry';
  }

  const shifted = hemisphere === 'south' ? ((month + 5) % 12) + 1 : month;
  if (shifted === 12 || shifted <= 2) return 'winter';
  if (shifted <= 5) return 'spring';
  if (shifted <= 8) return 'summer';
  return 'autumn';
}

/**
 * How cold it is, roughly, given the climate and the season.
 *
 * Continental and high-altitude interiors are the cases that matter: an arid
 * basin is punishing in both directions, baking in July and freezing in
 * January, and treating "arid" as "hot" year-round is what left a Tarim Basin
 * hunter bare-chested at midwinter.
 */
export function thermalNeed(climate: ClimateType | undefined, season: Season): ThermalNeed {
  const cold = season === 'winter';
  const warm = season === 'summer' || season === 'dry' || season === 'wet';

  switch (climate) {
    case ClimateType.POLAR:
      return cold ? 'freezing' : 'cold';
    case ClimateType.COLD:
      return cold ? 'freezing' : warm ? 'temperate' : 'cold';
    case ClimateType.ARID:
      // Cold deserts swing hard. Hot by day in summer, below freezing in winter.
      return cold ? 'cold' : warm ? 'hot' : 'temperate';
    case ClimateType.TROPICAL:
      return 'hot';
    case ClimateType.SEMITROPICAL:
      return cold ? 'temperate' : 'hot';
    case ClimateType.MEDITERRANEAN:
      return cold ? 'temperate' : warm ? 'hot' : 'temperate';
    case ClimateType.TEMPERATE:
    default:
      return cold ? 'cold' : warm ? 'temperate' : 'temperate';
  }
}

/** Clothing that keeps heat in. */
export const WARM_CLOTHING =
  /\b(?:fur|pelt|hide|sheepskin|shearling|wool|felt|cloak|mantle|coat|parka|anorak|padded|quilted|lined|heavy|winter|boots?|hood|mittens?)\b/i;

/** Clothing that sheds heat, and would be lethal in a hard winter. */
export const COOL_CLOTHING =
  /\b(?:loincloth|breechcloth|grass skirt|barkcloth|bark cloth|tapa|linen|muslin|light|thin|sleeveless|bare|barefoot|sandals?)\b/i;

/**
 * Rank a garment for the conditions. Positive is better suited.
 *
 * Used as a preference rather than a prohibition — people did wear the wrong
 * thing, and poverty in particular meant wearing whatever there was. But the
 * distribution should lean the right way.
 */
export function thermalScore(description: string, need: ThermalNeed): number {
  const warm = WARM_CLOTHING.test(description);
  const cool = COOL_CLOTHING.test(description);
  if (need === 'freezing') return warm ? 2 : cool ? -3 : 0;
  if (need === 'cold') return warm ? 1 : cool ? -2 : 0;
  if (need === 'hot') return cool ? 1 : warm ? -2 : 0;
  return 0;
}

/** What to fall back on when nothing in the tables suits a hard winter. */
export const COLD_WEATHER_FALLBACK: Record<string, Array<{ name: string; material: string }>> = {
  garment: [
    { name: 'Fur Cloak Over Hide Tunic', material: 'Fur and Hide' },
    { name: 'Heavy Hide Coat', material: 'Hide' },
  ],
  headgear: [{ name: 'Fur Hood', material: 'Fur' }],
  footwear: [{ name: 'Hide Boots', material: 'Hide' }, { name: 'Fur-Lined Foot Wrappings', material: 'Hide and Fur' }],
  belt: [{ name: 'Hide Thong', material: 'Hide' }],
  accessory: [{ name: 'None', material: 'None' }],
};
