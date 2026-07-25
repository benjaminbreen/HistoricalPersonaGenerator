/**
 * services/birthplaceService.ts
 *
 * Where a persona was actually born.
 *
 * "Born in Moscow Basin" names a map region, not a place anyone lived. People
 * are born in a camp, a hamlet, a market town, a tenement block. This composes
 * that from what the generator already knows — the settlement register, the
 * wealth level, the era and the region — and names the city when there was a
 * city there to name.
 */

import type { CulturalZone } from '../types/characterData';
import { settlementRegister, hasCapability } from '../constants/societyCapabilities';

export interface BirthplaceContext {
  year: number;
  culturalZone?: CulturalZone;
  region?: string;
  location?: string;
  wealthLevel?: string;
  localeType?: 'rural' | 'town' | 'city' | 'mobile' | 'unknown';
}

/**
 * Cities worth naming, with the year from which the name applies. A persona
 * born near one gets the city rather than the map region.
 */
const NAMED_SETTLEMENTS: Array<{ match: RegExp; from: number; until?: number; name: string }> = [
  { match: /moscow/i, from: 1147, name: 'Moscow' },
  { match: /london|thames/i, from: 50, name: 'London' },
  { match: /latium|roman campagna|tiber/i, from: -753, name: 'Rome' },
  { match: /seine|île de france|ile de france|paris/i, from: 300, name: 'Paris' },
  { match: /attica|athens/i, from: -800, name: 'Athens' },
  { match: /bosphorus|marmara|constantinople|istanbul/i, from: 330, name: 'Constantinople' },
  { match: /nile delta|lower egypt/i, from: 969, name: 'Cairo' },
  { match: /upper egypt|thebes|luxor/i, from: -2000, until: 400, name: 'Thebes' },
  { match: /mesopotamia|tigris|euphrates/i, from: -2000, until: 700, name: 'Babylon' },
  { match: /mesopotamia|tigris|euphrates/i, from: 762, name: 'Baghdad' },
  { match: /levant|judea|palestine/i, from: -1000, name: 'Jerusalem' },
  { match: /damascus|syrian/i, from: -1000, name: 'Damascus' },
  { match: /hejaz|arabian/i, from: -400, name: 'Mecca' },
  { match: /persian plateau|isfahan/i, from: 1050, name: 'Isfahan' },
  { match: /yellow river|north china|hebei/i, from: 1272, name: 'Beijing' },
  { match: /yangtze|jiangnan|lower yangtze/i, from: -495, name: 'Suzhou' },
  { match: /pearl river|guangdong|south china/i, from: -200, name: 'Guangzhou' },
  { match: /kansai|yamato|kinai/i, from: 794, until: 1868, name: 'Kyoto' },
  { match: /kanto/i, from: 1603, name: 'Edo' },
  { match: /han river|gyeonggi/i, from: 1394, name: 'Seoul' },
  { match: /ganges|doab|uttar/i, from: -600, name: 'Varanasi' },
  { match: /indus|punjab/i, from: 1021, name: 'Lahore' },
  { match: /bengal delta/i, from: 1610, name: 'Dhaka' },
  { match: /deccan|maharashtra/i, from: 1600, name: 'Pune' },
  { match: /valley of mexico|lake texcoco/i, from: 1325, until: 1521, name: 'Tenochtitlan' },
  { match: /valley of mexico|lake texcoco/i, from: 1521, name: 'Mexico City' },
  { match: /yucat|maya lowland|mayan lowland/i, from: 600, until: 900, name: 'Chichen Itza' },
  { match: /andes|cusco|cuzco|urubamba/i, from: 1200, name: 'Cusco' },
  { match: /peruvian coast|rimac/i, from: 1535, name: 'Lima' },
  { match: /altiplano|titicaca/i, from: -200, until: 1000, name: 'Tiwanaku' },
  { match: /niger bend|middle niger/i, from: 1100, name: 'Timbuktu' },
  { match: /swahili coast|zanzibar/i, from: 1000, name: 'Kilwa' },
  { match: /ethiopian highlands|abyssin/i, from: -100, until: 900, name: 'Aksum' },
  { match: /hausa|kano/i, from: 999, name: 'Kano' },
  { match: /lower guinea|benin/i, from: 1200, name: 'Benin City' },
  { match: /atlantic coast|chesapeake|tidewater/i, from: 1607, name: 'Jamestown' },
  { match: /northeast woodlands|hudson/i, from: 1625, name: 'New York' },
  { match: /iberian|castile|guadalquivir/i, from: 1248, name: 'Seville' },
  { match: /low countries|scheldt/i, from: 1200, name: 'Antwerp' },
  { match: /venet|adriatic|lagoon/i, from: 800, name: 'Venice' },
  { match: /aegean|ionia|smyrna/i, from: -1000, name: 'Smyrna' },
];

function namedSettlement(ctx: BirthplaceContext): string | undefined {
  const place = `${ctx.location ?? ''} ${ctx.region ?? ''}`;
  const matches = NAMED_SETTLEMENTS.filter(entry =>
    entry.match.test(place)
    && ctx.year >= entry.from
    && (entry.until === undefined || ctx.year < entry.until));
  return matches.length > 0 ? matches[matches.length - 1].name : undefined;
}

const rich = (ctx: BirthplaceContext): boolean =>
  ctx.wealthLevel === 'wealthy' || ctx.wealthLevel === 'noble';
const poor = (ctx: BirthplaceContext): boolean => ctx.wealthLevel === 'poor';

/**
 * The kind of place, before any city is named. Deliberately concrete: a reader
 * should be able to picture the room.
 */
function dwelling(ctx: BirthplaceContext, register: string, named: boolean, pick: <T>(v: T[]) => T): string {
  if (register === 'band') {
    return pick(['a camp', 'a winter camp', 'a shelter', 'a camp of a few families']);
  }

  const industrial = ctx.year >= 1780;
  const modern = ctx.year >= 1920;

  if (register === 'village') {
    if (rich(ctx)) return pick(['a longhouse', 'the largest house in a hamlet', 'a farmstead of some standing']);
    return pick(['a hamlet', 'a village of a few dozen households', 'a farmstead', 'a fishing settlement']);
  }

  // Settled districts and towns.
  if (modern) {
    if (rich(ctx)) return pick(['a villa', 'a house with a garden', 'an apartment on a good street']);
    if (poor(ctx)) return pick(['an apartment block', 'a workers\' block', 'a tenement flat', 'a room in a communal flat']);
    return pick(['an apartment block', 'a terraced house', 'a flat above a shop']);
  }
  if (industrial) {
    if (rich(ctx)) return pick(['a townhouse', 'a merchant\'s house', 'a house on the square']);
    if (poor(ctx)) return pick(['a back court', 'a tenement', 'a room in a lodging house', 'a cottage at the works']);
    return pick(['a terraced cottage', 'a house on a narrow street', 'rooms above a workshop']);
  }
  if (rich(ctx)) return pick(['a stone house', 'a merchant\'s house', 'a house within the walls', 'a manor']);
  // "a hut at the edge of the settlement in Cairo" reads as a contradiction, so
  // the vaguer phrasings are held back when a city is about to be named.
  if (poor(ctx)) {
    return named
      ? pick(['a single room', 'a room off a courtyard', 'a lean-to against a wall'])
      : pick(['a single room', 'a hut at the edge of the settlement', 'a cottage of one room']);
  }
  return pick(['a house of two rooms', 'a workshop dwelling', 'a house near the market', 'a cottage']);
}

/**
 * A birthplace phrase: "an apartment block in Moscow", "a camp in the Kunlun
 * Mountains", "a hamlet in the Galilee Basin".
 *
 * `regionLabel` is the display name the caller is already using, so the period
 * place-label substitutions carry through.
 */
export function describeBirthplace(
  ctx: BirthplaceContext,
  regionLabel: string,
  pick: <T>(values: T[]) => T,
): string {
  const capabilityCtx = {
    year: ctx.year,
    culturalZone: ctx.culturalZone,
    placeLower: `${ctx.location ?? ''} ${ctx.region ?? ''}`.toLowerCase(),
  };

  let register: string = settlementRegister(capabilityCtx);
  // The locale the world model assigned wins where it is specific.
  if (ctx.localeType === 'city' || ctx.localeType === 'town') register = 'district';
  if (ctx.localeType === 'rural' && register === 'district') register = 'village';
  if (!hasCapability('settled_agriculture', capabilityCtx)) register = 'band';

  // If there is a city of this name here in this year, this is a city — not
  // least because `inferLocaleType`'s own list of cities is incomplete and had
  // been calling the Moscow Basin rural.
  const candidate = namedSettlement(ctx);
  if (candidate && register !== 'band') register = 'district';

  const city = register === 'district' ? candidate : undefined;
  const place = dwelling(ctx, register, !!city, pick);

  if (city) {
    // Naming both the city and the region reads as a postal address; the city
    // is the more useful of the two.
    return `${place} in ${city}`;
  }
  return `${place} in ${regionLabel}`;
}
