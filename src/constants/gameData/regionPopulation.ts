/**
 * constants/gameData/regionPopulation.ts
 *
 * How many people actually lived in each region, so that draws land where they
 * lived rather than where the map has boxes.
 *
 * `getRandomLocation` picked a region uniformly and then an area uniformly
 * inside it. The regions are drawn by geography, so that is a claim that
 * population is evenly spread across landforms, and the results are what you
 * would expect from that claim:
 *
 *   - East Asia has twelve regions. Five of them — Siberia, the Kazakh
 *     Steppes, Xinjiang, Mongolia and Manchuria, West China and Tibet — are
 *     among the emptiest land on earth, and together they took 42% of every
 *     East Asian draw. The North China Plain and South China, between them
 *     home to several hundred million people, took 17%.
 *   - North America has sixteen. The Northeastern Seaboard took one sixteenth
 *     of the continent in 1900, the same share as Arctic and Subarctic, which
 *     is why nineteenth and twentieth century personas so rarely turned up in
 *     the place where most North Americans were.
 *   - South Asia has six, so Sri Lanka drew level with the Gangetic Plain.
 *
 * The weights below are relative shares of a zone's population, normalised at
 * use, and banded by year where the distribution genuinely moved. Most zones
 * need two or three bands; North America and Oceania need more, because
 * colonisation redrew them completely.
 *
 * These are order-of-magnitude judgements from standard population history, not
 * measurements, and they are meant to be argued with. What they are replacing
 * is not a better estimate — it is the implicit claim that the Sonoran Desert
 * and the Ganges delta held the same number of people.
 *
 * Each band is `[fromYear, weight]`, and the last band whose year has arrived
 * applies. A region absent from the table falls back to the mean of its zone's
 * listed weights, so adding a region to `geography.ts` degrades to the old
 * uniform behaviour for that region rather than erasing it.
 */

/** `[fromYear, relativeWeight]`, ordered, earliest first. */
export type PopulationBands = Array<[number, number]>;

export const REGION_POPULATION_WEIGHTS: Record<string, Record<string, PopulationBands>> = {

  Europe: {
    // Antiquity is Mediterranean; the centre of gravity moves north and east
    // across the medieval and industrial periods.
    'Italy': [[-10000, 16], [500, 12], [1800, 9]],
    'Greece and Aegean': [[-10000, 12], [500, 6], [1800, 3]],
    'Iberian Peninsula': [[-10000, 10], [500, 8], [1800, 7]],
    'France': [[-10000, 13], [500, 15], [1800, 12]],
    'British Isles': [[-10000, 5], [500, 7], [1800, 13]],
    'Germanic Lands': [[-10000, 9], [500, 13], [1800, 16]],
    'Low Countries': [[-10000, 2], [500, 4], [1800, 4]],
    'Central Europe': [[-10000, 7], [500, 9], [1800, 9]],
    'Eastern Europe': [[-10000, 9], [500, 12], [1800, 18]],
    'Balkans': [[-10000, 9], [500, 8], [1800, 6]],
    'Scandinavia': [[-10000, 3], [500, 3], [1800, 4]],
    'Ural and Arctic Europe': [[-10000, 1], [1800, 2]],
    'Atlantic Islands': [[-10000, 0.3]],
  },

  'North America': {
    // Before contact the continent's people are overwhelmingly Mesoamerican:
    // the Valley of Mexico alone held more people than everything north of the
    // Rio Grande. After 1800 the weight swings to the eastern United States.
    'Mexico and Central Highlands': [[-10000, 42], [1500, 40], [1800, 18]],
    'Central America': [[-10000, 9], [1500, 6], [1800, 3]],
    'The Caribbean': [[-10000, 5], [1500, 8], [1800, 4]],
    'Southeast': [[-10000, 10], [1500, 8], [1800, 14]],
    'Mississippi Valley': [[-10000, 8], [1500, 6], [1800, 14]],
    'Northeastern Seaboard': [[-10000, 5], [1500, 10], [1800, 22]],
    'Atlantic Coast': [[-10000, 3], [1500, 6], [1800, 8]],
    'Canada': [[-10000, 2], [1500, 3], [1800, 5]],
    'Great Plains': [[-10000, 3], [1500, 3], [1800, 6]],
    'Southwest': [[-10000, 5], [1500, 4], [1800, 3]],
    'Southern California': [[-10000, 1.5], [1800, 4]],
    'Northern California': [[-10000, 2], [1800, 2.5]],
    'Central California Coast': [[-10000, 1.5], [1800, 2]],
    'Pacific Coast': [[-10000, 4], [1500, 2], [1800, 2]],
    'Northern Rockies': [[-10000, 1]],
    'Arctic and Subarctic': [[-10000, 0.6], [1800, 0.3]],
  },

  'South America': {
    // Andean until the Atlantic sugar and coffee economies, then coastal
    // Brazil and the Plata become the demographic centre.
    'Andes North': [[-10000, 30], [1800, 18]],
    'Andes South': [[-10000, 22], [1800, 12]],
    'Atlantic Coast': [[-10000, 10], [1550, 20], [1800, 38]],
    'Gran Chaco and Pampas': [[-10000, 6], [1800, 15]],
    'Southern Highlands': [[-10000, 8], [1800, 6]],
    'Amazon Basin': [[-10000, 15], [1550, 8], [1800, 4]],
    'Llanos and Orinoco': [[-10000, 5], [1800, 3]],
    'Guiana Shield': [[-10000, 3], [1800, 1.5]],
    'Patagonia': [[-10000, 1]],
  },

  MENA: {
    'Nile Valley': [[-10000, 26]],
    'Anatolia': [[-10000, 15], [500, 18]],
    'Levant': [[-10000, 13], [500, 11]],
    'Mesopotamia': [[-10000, 16], [500, 11]],
    'Maghreb': [[-10000, 12], [500, 15]],
    'Persian Plateau': [[-10000, 12]],
    'Caucasus': [[-10000, 5]],
    'Arabian Peninsula': [[-10000, 4]],
    'Nubian Corridor': [[-10000, 2]],
    'Eastern Desert and Red Sea': [[-10000, 1]],
  },

  'Sub Saharan Africa': {
    'West African Forests': [[-10000, 18]],
    'Lower Guinea and Congo Basin': [[-10000, 16]],
    'East African Rift': [[-10000, 15]],
    'Sahel': [[-10000, 14]],
    'Upper Guinea': [[-10000, 12]],
    'Horn of Africa': [[-10000, 10]],
    'Southern Africa': [[-10000, 7]],
    'Central Africa': [[-10000, 5]],
    'Madagascar and Islands': [[-10000, 3]],
  },

  'South Asia': {
    // The Gangetic plain has been the demographic heart of South Asia for
    // three thousand years and is not one region among six.
    'Gangetic Plain': [[-10000, 30], [-500, 42]],
    'Deccan Plateau': [[-10000, 20], [-500, 22]],
    'Indus Valley': [[-10000, 26], [-500, 14]],
    'Central India': [[-10000, 14], [-500, 12]],
    'Himalayas and Northeast': [[-10000, 5]],
    'Sri Lanka': [[-10000, 5]],
  },

  'Southeast Asia': {
    'Maritime Southeast Asia': [[-10000, 38]],
    'Mainland Southeast Asia': [[-10000, 32]],
    'Philippines': [[-10000, 16]],
    'Indochina Interior': [[-10000, 12]],
  },

  'East Asia': {
    'North China Plain': [[-10000, 32]],
    'South China': [[-10000, 22], [500, 30]],
    'Japan': [[-10000, 7], [500, 12], [1800, 14]],
    'Korea': [[-10000, 5], [500, 6]],
    'West China and Tibet': [[-10000, 8], [500, 6]],
    'Mongolia and Manchuria': [[-10000, 4], [500, 3]],
    'Central Asian Oases': [[-10000, 4], [500, 2.5]],
    'Kazakh Steppes': [[-10000, 2], [500, 1.5]],
    'Xinjiang': [[-10000, 1.5], [500, 1]],
    'Taiwan and East China Sea': [[-10000, 1], [1650, 2]],
    'Taiwan and Ryukyu': [[-10000, 1], [1650, 1.5]],
    'Siberia': [[-10000, 1]],
  },

  Oceania: {
    // New Guinea has always held most of the people in this zone — highland
    // horticulture supported densities nothing in Australia or the remote
    // Pacific could match — and settler Australia only overtakes parts of it
    // in the twentieth century.
    'New Guinea and Melanesia': [[-10000, 36], [1800, 30]],
    'Indonesian and Melanesian Islands': [[-10000, 9], [1800, 15]],
    'Australia – Southeast': [[-10000, 12], [1800, 20]],
    'Australia – North and Queensland': [[-10000, 10], [1800, 6]],
    'Australia – Outback and Center': [[-10000, 8], [1800, 2]],
    'Australia – West and Desert': [[-10000, 6], [1800, 4]],
    'New Zealand': [[-1500, 0], [1280, 6], [1800, 10]],
    'Polynesia': [[-10000, 8], [1800, 6]],
    'Hawaii and Central Pacific': [[-10000, 4], [1800, 5]],
    'Micronesia': [[-10000, 2]],
  },
};

/**
 * The weight for a region in a given year.
 *
 * Falls back to the mean of the zone's listed weights when a region is not in
 * the table, so a region added to `geography.ts` later behaves as it did
 * before — averagely — rather than becoming unreachable.
 */
export function regionPopulationWeight(
  zoneKey: string,
  region: string,
  year: number,
): number {
  const zone = REGION_POPULATION_WEIGHTS[zoneKey];
  if (!zone) return 1;

  const bands = zone[region];
  if (bands) {
    let weight = bands[0]?.[1] ?? 1;
    for (const [from, value] of bands) {
      if (year >= from) weight = value;
    }
    return weight;
  }

  const listed = Object.values(zone).map(b => b[b.length - 1][1]);
  return listed.length > 0 ? listed.reduce((a, b) => a + b, 0) / listed.length : 1;
}

/** Roughly how many rural districts a city of each size is worth. */
const DENSITY_WEIGHT: Record<string, number> = {
  small: 1.5,
  moderate: 4,
  large: 12,
  massive: 30,
};

/**
 * The weight for one area inside its region, in a given year.
 *
 * The same problem as regions, one level down: areas are landforms, so Long
 * Island and the Adirondacks drew level in 1900. `CITIES_DATA` already records
 * which areas hold cities, when those cities were founded and how big they got,
 * which is the information this needs — so an area's weight is one share for
 * its countryside plus a share for every city standing in it that year.
 *
 * This is what makes urbanisation visible in the draw. Before a city is founded
 * its area is ordinary countryside; after it, the area pulls people in
 * proportion to the city's size, which is the entire demographic story of the
 * nineteenth century and was previously invisible.
 */
export function areaPopulationWeight(
  areaName: string,
  year: number,
  cities: Record<string, Array<{
    foundingYear: number;
    declineYear?: number;
    urbanDensity?: string;
  }>>,
): number {
  // One share of countryside. Everything below is added on top, so an area
  // with no city keeps exactly the weight it had before.
  let weight = 1;

  for (const city of cities[areaName] ?? []) {
    if (year < city.foundingYear) continue;
    if (city.declineYear !== undefined && year > city.declineYear) continue;
    weight += DENSITY_WEIGHT[city.urbanDensity ?? 'moderate'] ?? 4;
  }

  return weight;
}
