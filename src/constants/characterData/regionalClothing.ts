/**
 * constants/characterData/regionalClothing.ts
 *
 * What a *region* wore, where the cultural zone is too coarse to say.
 *
 * `CulturalZone` has ten values for the whole world, and three of them are
 * doing the work of a continent apiece. Measured over four thousand personas:
 *
 *   OCEANIA          217 personas across 10 regions — New Guinea and Melanesia
 *                    (88), the four Australian regions (79), and Polynesia,
 *                    Micronesia, Hawaii and New Zealand (50). Three unrelated
 *                    dress traditions sharing one table, which is why a New
 *                    Zealander was being offered a lava-lava.
 *   SOUTH_AMERICAN   389 across 9 — the Andes, the Atlantic coast, Amazonia,
 *                    the Chaco, Patagonia.
 *   SUB_SAHARAN      474 across 9 — the Sahel, the Horn, the Congo basin, the
 *                    Guinea forests, the southern grasslands.
 *
 * Adding zones was not an option: the union appears in seventy-one files and
 * thirty-one exhaustive `Record<CulturalZone, …>` types, so a new member breaks
 * every one of them. So the finer answer is a layer instead, keyed on the
 * region string the generators already carry and consulted by `getClothingData`
 * between the contemporary table and the zone table.
 *
 * **A region with no entry here loses nothing** — it falls through to the zone
 * table exactly as before. That is what makes this safe to fill in gradually,
 * and why partial coverage is an honest state to be in rather than a bug.
 *
 * The bar for an entry: it has to say something the zone table does not. A
 * region whose dress really is the zone's dress should be left out, because an
 * entry that merely restates the zone is a claim to precision that isn't there.
 */

import type { EraClothingMap } from './clothing';
import { OCEANIA_REGIONS } from './regionalClothing.oceania';
import { SOUTH_AMERICAN_REGIONS } from './regionalClothing.southAmerica';
import { AFRICAN_REGIONS } from './regionalClothing.africa';

/**
 * Region names are not unique across zones.
 *
 * "Atlantic Coast" is Brazil in the South American tables and Boston in the
 * North American ones, and the first version of this file keyed on the region
 * alone — so a New England persona in 1780 was issued a Bahian wardrobe. The
 * golden fixtures caught it; nothing in the region files was wrong.
 *
 * So the key carries the zone as well. The region files below stay keyed on
 * the plain region name, which is what their authors can check against a
 * generated sample, and the zone is added here.
 */
const scope = (
  zone: string, regions: Partial<Record<string, EraClothingMap>>
): Partial<Record<string, EraClothingMap>> =>
  Object.fromEntries(Object.entries(regions).map(([region, map]) => [`${zone}|${region}`, map]));

/** Look this up with `regionalKey(zone, region)`, never with the region alone. */
export const REGIONAL_CLOTHING: Partial<Record<string, EraClothingMap>> = {
  ...scope('OCEANIA', OCEANIA_REGIONS),
  ...scope('SOUTH_AMERICAN', SOUTH_AMERICAN_REGIONS),
  ...scope('SUB_SAHARAN_AFRICAN', AFRICAN_REGIONS),
};

export const regionalKey = (zone: string, region: string): string => `${zone}|${region}`;
