/**
 * services/waterAccessService.ts
 *
 * Whether there is water where this person lives, and what kind.
 *
 * The generator was putting dock labourers on the Persian plateau and fishers
 * on the Mongolian steppe, because the only signal the profession weighting had
 * was whether the place *name* contained a word like "coast" or "bay". Half the
 * world's inland regions are named after a river they sit nowhere near, and the
 * ports are mostly named after people.
 *
 * The map table already carries the answer. Every one of the app's 575 map areas
 * declares an archetype — `BAY`, `RIVER_PORT`, `ALL_LAND` — because the terrain
 * generator needs to know whether to draw an ocean. That is a far better source
 * than a regex over a name, and `personaGenerator` draws its `location` straight
 * out of the same table, so the lookup nearly always hits.
 *
 * The name test survives as the fallback for locations that are not map areas:
 * a pinned city, a caller-supplied string, an area added to the persona side
 * without a matching terrain entry.
 */

import { GEOGRAPHICAL_DATA } from '../constants/gameData/geography';
import { MapArchetype } from '../types/enums';

/** `dry` is a positive claim: this place has no coast, no river port, no lake. */
export type WaterAccess = 'sea' | 'fresh' | 'dry' | 'unknown';

const SEA_ARCHETYPES = new Set<string>([
  MapArchetype.ISLAND,
  MapArchetype.ATOLL,
  MapArchetype.PENINSULA,
  MapArchetype.BAY,
  MapArchetype.STRAITS,
  MapArchetype.DELTA,
  MapArchetype.SHOALS,
  MapArchetype.OPEN_OCEAN,
  MapArchetype.BARRIER_ISLAND,
]);

const FRESH_ARCHETYPES = new Set<string>([
  MapArchetype.RIVER_PORT,
  MapArchetype.FRESHWATER_LAKE,
  MapArchetype.SWAMP,
]);

const RANK: Record<WaterAccess, number> = { sea: 3, fresh: 2, dry: 1, unknown: 0 };

/** Names recur across zones. Where they disagree, keep the wetter reading. */
const wetter = (a: WaterAccess, b: WaterAccess): WaterAccess => (RANK[a] >= RANK[b] ? a : b);

const areaWater = new Map<string, WaterAccess>();
const regionWater = new Map<string, WaterAccess>();

for (const zone of Object.values(GEOGRAPHICAL_DATA)) {
  for (const [regionName, region] of Object.entries(zone)) {
    let regionBest: WaterAccess = 'dry';
    for (const [areaName, area] of Object.entries(region)) {
      const archetype = area.archetype as unknown as string;
      const water: WaterAccess = SEA_ARCHETYPES.has(archetype)
        ? 'sea'
        : FRESH_ARCHETYPES.has(archetype) || area.hasLakes
          ? 'fresh'
          : 'dry';
      const key = areaName.trim().toLowerCase();
      areaWater.set(key, wetter(areaWater.get(key) ?? 'unknown', water));
      regionBest = wetter(regionBest, water);
    }
    const key = regionName.trim().toLowerCase();
    regionWater.set(key, wetter(regionWater.get(key) ?? 'unknown', regionBest));
  }
}

const SEA_NAME = /\b(?:coast|bay|sea|ocean|island|isle|gulf|estuary|harbou?r|port|shore|fjord|sound|strait|lagoon|atoll|archipelago|maritime|reef|delta|peninsula)\b/i;
const FRESH_NAME = /\b(?:river|lake|marsh|swamp|nile|ganges|yangtze|mekong|danube|rhine|volga|amazon|tigris|euphrates|indus|niger|mississippi)\b/i;

/**
 * The locality decides, not the region.
 *
 * "Sierra Nevada Foothills" sits in the same region as San Francisco Bay, and
 * asking the region would let a man who has never left the foothills work the
 * docks. The region is consulted only when the locality is not a map area at
 * all, where the permissive answer is the right one — we know nothing.
 */
export function waterAccessFor(location?: string, region?: string): WaterAccess {
  const local = location?.trim().toLowerCase();
  if (local) {
    const known = areaWater.get(local);
    if (known) return known;
  }

  const regional = region?.trim().toLowerCase();
  if (regional) {
    const known = regionWater.get(regional);
    if (known) return known;
  }

  const text = `${location ?? ''} ${region ?? ''}`;
  if (SEA_NAME.test(text)) return 'sea';
  if (FRESH_NAME.test(text)) return 'fresh';
  return 'unknown';
}

/**
 * Work that has to happen where ships are unloaded or fish are caught. Absent
 * from a place with no water at all; a river port serves it as well as a coast
 * does — the Thames, the Hooghly and the Rhine all had dock labour.
 */
export const WATERFRONT_TRADE =
  /\b(?:dock ?(?:worker|labourer|laborer|hand)|dockhand|docker|stevedore|longshore\w*|wharf\w*|harbou?r \w+|port labourer|port laborer|lighterman|bargeman|boatman|ferryman|waterman|raftsman|fisher\w*|fishmonger|fishwife|net maker|oyster\w*|clam digger|shellfish gatherer)\b/i;

/**
 * And the part of it that needs open salt water. A river has boats on it; it
 * does not have whalers, pearl divers or deep-sea crews.
 */
export const SEAFARING_TRADE =
  /\b(?:sailor|seaman|mariner|seafarer|shipwright|ship builder|boatswain|caulker|rigger|whaler|sealer|pearl diver|sea trader|dhow sailor|master navigator|canoe paddler|coastguard|lighthouse keeper|sponge diver)\b/i;
