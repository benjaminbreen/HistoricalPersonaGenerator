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
import { CITIES_DATA, type CityDefinition } from '../constants/gameData/cities';

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
 *
 * `zones` exists because the map has one region name in two hemispheres:
 * "Atlantic Coast" is a region of both North and South America in
 * `geography.ts`. The place patterns here are matched against the region
 * string alone, so a persona on the São Paulo Plateau in 1681 matched
 * /atlantic coast/ and was born in Jamestown, Virginia. Any pattern that could
 * describe two continents must say which one it means.
 */
const NAMED_SETTLEMENTS: Array<{
  match: RegExp;
  from: number;
  until?: number;
  name: string;
  zones?: CulturalZone[];
}> = [
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
  { match: /atlantic coast|chesapeake|tidewater/i, from: 1607, name: 'Jamestown',
    zones: ['NORTH_AMERICAN_COLONIAL', 'NORTH_AMERICAN_PRE_COLUMBIAN'] },
  { match: /northeast woodlands|hudson/i, from: 1625, name: 'New York',
    zones: ['NORTH_AMERICAN_COLONIAL', 'NORTH_AMERICAN_PRE_COLUMBIAN'] },
  // More specific than the coast-wide rule above, and listed after it because
  // the last match wins.
  { match: /boston|massachusetts bay|cape cod/i, from: 1630, name: 'Boston',
    zones: ['NORTH_AMERICAN_COLONIAL'] },
  { match: /delaware|pine barrens|philadelphia/i, from: 1682, name: 'Philadelphia',
    zones: ['NORTH_AMERICAN_COLONIAL'] },
  { match: /carolina|low ?country|charleston/i, from: 1670, name: 'Charleston',
    zones: ['NORTH_AMERICAN_COLONIAL'] },
  // The other Atlantic coast.
  { match: /são paulo|sao paulo|piratininga/i, from: 1554, name: 'São Paulo', zones: ['SOUTH_AMERICAN'] },
  { match: /rio de janeiro|guanabara/i, from: 1565, name: 'Rio de Janeiro', zones: ['SOUTH_AMERICAN'] },
  { match: /bahia|recôncavo|reconcavo/i, from: 1549, name: 'Salvador', zones: ['SOUTH_AMERICAN'] },
  { match: /pernambuco/i, from: 1537, name: 'Recife', zones: ['SOUTH_AMERICAN'] },
  { match: /paraná delta|parana delta|rio de la plata|plata/i, from: 1580, name: 'Buenos Aires', zones: ['SOUTH_AMERICAN'] },
  { match: /iberian|castile|guadalquivir/i, from: 1248, name: 'Seville' },
  { match: /low countries|scheldt/i, from: 1200, name: 'Antwerp' },
  { match: /venet|adriatic|lagoon/i, from: 800, name: 'Venice' },
  { match: /aegean|ionia|smyrna/i, from: -1000, name: 'Smyrna' },
];

/**
 * `scope: 'location'` matches the map area alone. A region-wide pattern is a
 * coarse instrument — /south china/ names Guangzhou for the Yangtze Delta,
 * eight hundred miles away — so the caller tries the locale first and only
 * falls back to the region when nothing more local is known.
 */
function namedSettlement(ctx: BirthplaceContext, scope: 'location' | 'any' = 'any'): string | undefined {
  const place = scope === 'location' ? `${ctx.location ?? ''}` : `${ctx.location ?? ''} ${ctx.region ?? ''}`;
  const matches = NAMED_SETTLEMENTS.filter(entry =>
    entry.match.test(place)
    && ctx.year >= entry.from
    && (entry.until === undefined || ctx.year < entry.until)
    && (!entry.zones || !ctx.culturalZone || entry.zones.includes(ctx.culturalZone)));
  return matches.length > 0 ? matches[matches.length - 1].name : undefined;
}

const DENSITY_RANK: Record<string, number> = { massive: 4, large: 3, moderate: 2, small: 1 };

/**
 * The city the map itself puts in this locale, if one was standing this year.
 *
 * `CITIES_DATA` is keyed by map area and carries a founding year and often a
 * decline year, which is exactly the question being asked here — so the
 * hand-written `NAMED_SETTLEMENTS` list above only needs to cover the cases
 * where it disagrees (Tenochtitlan before 1521 and Mexico City after, Edo
 * rather than Tokyo) and the regions the city data does not reach.
 *
 * The largest cities are preferred, because a persona born near both a capital
 * and a market town is more likely to say the capital.
 *
 * Ties are broken by hashing the locale and year rather than by a caller's
 * random stream, so that two callers asking the same question get the same
 * answer. The header badge and the biography name the same city — which they
 * would not if this drew from the biography's own noise — while personas born
 * in different years still see the area's several cities.
 */
export function principalCity(ctx: BirthplaceContext): CityDefinition | undefined {
  const area = ctx.location ? CITIES_DATA[ctx.location] : undefined;
  const standing = (area ?? []).filter(city =>
    ctx.year >= city.foundingYear && (city.declineYear === undefined || ctx.year <= city.declineYear));
  if (standing.length === 0) return undefined;

  const densityOf = (city: CityDefinition): number => {
    const era = ctx.year >= 1900 ? city.eraSpecificDensity?.modern : undefined;
    return DENSITY_RANK[era ?? city.urbanDensity ?? 'moderate'] ?? 2;
  };
  // Some map areas bundle a city with a distant one — Palermo sits under "Bay
  // of Naples" — so a city the area is named for wins outright.
  const eponymous = standing.filter(city => ctx.location!.includes(city.name));
  if (eponymous.length > 0) return eponymous[0];

  const best = Math.max(...standing.map(densityOf));
  const equals = standing.filter(city => densityOf(city) === best);
  if (equals.length === 1) return equals[0];

  const key = `${ctx.location ?? ''}|${ctx.year}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return equals[Math.abs(hash) % equals.length];
}

/**
 * Who governed a city in a given year, from its `allegianceHistory` — the last
 * entry whose start year has arrived. Undefined before the first entry.
 */
export function cityAllegiance(city: CityDefinition, year: number): string | undefined {
  const entries = Object.entries(city.allegianceHistory)
    .map(([from, polity]) => [Number(from), polity] as const)
    .filter(([from]) => Number.isFinite(from))
    .sort((a, b) => a[0] - b[0]);
  let current: string | undefined;
  for (const [from, polity] of entries) {
    if (year >= from) current = polity; else break;
  }
  return current;
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
  //
  // Order of authority: a curated name for this exact locale (which is where
  // the era-correct forms live — Tenochtitlan before 1521, Edo before 1868),
  // then the city data for the locale, then a curated region-wide match.
  const nearby = principalCity(ctx)?.name;
  const candidate = namedSettlement(ctx, 'location') ?? nearby ?? namedSettlement(ctx);
  // A city in the map area no longer makes every persona in it urban. It used
  // to, because the curated list only named places that were essentially
  // metropolitan regions; the city data covers ordinary market towns too, and
  // most people near one lived outside it.
  if (candidate && register !== 'band' && ctx.localeType !== 'rural') register = 'district';

  const city = register === 'district' ? candidate : undefined;
  const place = dwelling(ctx, register, !!city, pick);

  if (city) {
    // Naming both the city and the region reads as a postal address; the city
    // is the more useful of the two.
    return `${place} in ${city}`;
  }

  // Rural, but with a city over the horizon. "A hamlet in the Central Plateau"
  // places nobody; "a hamlet outside Ankara" does, and it is the way people
  // actually say where they are from. Only `nearby` will do here — it is the
  // one that is certainly in this same map area, where the region-matched
  // NAMED_SETTLEMENTS entries can be several hundred miles off.
  if (nearby && register === 'village') {
    // The region still earns its place after a short dwelling phrase, and
    // turns into a postal address after a long one — or into "outside
    // Varanasi, in the Varanasi Basin" when the region is named for the city.
    const worthNaming = place.split(/\s+/).length <= 3
      && !regionLabel.toLowerCase().includes(nearby.toLowerCase());
    return worthNaming
      ? `${place} outside ${nearby}, ${regionPhrase(regionLabel)}`
      : `${place} outside ${nearby}`;
  }
  return `${place} ${regionPhrase(regionLabel)}`;
}

/**
 * "in Sulu Sea" and "in Ryukyu Islands" are both wrong, in different ways.
 *
 * Many map regions are named for water — the Sulu Sea, the Philippine Sea, the
 * Taiwan Strait — and nobody is born in a sea. Others are plural landforms that
 * need a definite article in English. The region label is written into the
 * birth sentence verbatim, so it is repaired here rather than in the map data,
 * which uses these names correctly for their own purposes.
 */
export function regionPhrase(regionLabel: string): string {
  const label = regionLabel.trim();
  if (!label) return 'in a small settlement';
  const lower = label.toLowerCase();

  // Open water. The persona lived on its edge, not in it.
  if (/\b(sea|ocean|strait|straits|channel|gulf|sound|bight|passage)\b/.test(lower)
    && !/\b(coast|shore|island|isles|basin|valley|delta)\b/.test(lower)) {
    return /^the\b/i.test(label) ? `on the shore of ${label}` : `on the shore of the ${label}`;
  }

  // Landforms, which take a definite article in English whether they are
  // plural ("the Ryukyu Islands") or singular ("the Great Basin", "the Nile
  // Valley"). A settlement name does not — "in Jamestown", not "in the
  // Jamestown" — which is why this matches the landform noun rather than
  // applying an article to everything.
  if (!/^the\b/i.test(label)
    && /\b(islands|isles|archipelago|highlands|lowlands|plains|hills|mountains|steppes|badlands|marshes|shoals|narrows|rockies|andes|alps|philippines|netherlands|basin|coast|plateau|valley|delta|steppe|desert|plain|peninsula|cordillera|massif|escarpment|savanna|tundra|taiga|rift|sahel|levant|caucasus|balkans|maghreb|outback|interior)\b/.test(lower)) {
    return `in the ${label}`;
  }

  return `in ${label}`;
}
