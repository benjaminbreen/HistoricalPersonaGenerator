/**
 * constants/societyCapabilities.ts
 *
 * What a society could actually do, at a given place and year.
 *
 * Several generators were independently assuming a settled, literate, metal-
 * working, land-inheriting world: a Tehuelche herder in 1660 Patagonia was
 * described as reading and writing with facility, a hide worker in 19411 BCE
 * carried a "second son with no inheritance" badge, and a Rapa Nui household
 * in 1109 was headed by a blacksmith. Rather than patch each generator, they
 * now consult one table.
 *
 * Dates are earliest-plausible for an ordinary person of that zone, not for the
 * first archaeological instance. Where a zone is genuinely heterogeneous
 * (Mesoamerica inside "North American Pre-Columbian", the Ethiopian highlands
 * inside Sub-Saharan Africa), place overrides carry the exception.
 */

import type { CulturalZone } from '../types/characterData';

export type SocietyCapability =
  | 'writing'            // a script in use, such that literacy is conceivable
  | 'metallurgy'         // smelting and smithing metal
  | 'settled_agriculture'
  | 'heritable_land'     // land held and passed down, so inheritance can matter
  | 'draft_animals'      // animals yoked to plough or cart
  | 'guilds'             // formal craft corporations
  | 'coinage'
  | 'urban_settlement'
  | 'european_contact' // sustained contact with European material culture
  /**
   * Impersonal exchange at a price: marketplaces, traded staples, a going
   * concern that can be sold or handed on. Deliberately not the same as
   * `coinage` — Mesoamerica had dense market systems and no coin, and the Inca
   * state had cities, roads and metallurgy but redistributed rather than sold.
   * This is the gate for anything phrased as business, profit or investment.
   */
  | 'market_exchange'
  /**
   * Working for a wage as an ordinary way to live, rather than owing labor,
   * working one's own land, or being fed by kin. The gate for the modern
   * grammar of employment: a job, a wage packet, retirement.
   */
  | 'wage_labor'
  /**
   * Personal military service owed to a lord, entered as a youth in his
   * household and trained there: the squire, the retainer, the household
   * warrior. It ends, and this is the first capability here that does.
   */
  | 'retained_military_service'
  /**
   * A trade entered by binding oneself to a master for a term of years, under
   * a craft corporation that controls entry to it. Ends where the guilds are
   * abolished and the factory and the technical school replace them.
   */
  | 'guild_apprenticeship';

export interface CapabilityContext {
  year: number;
  culturalZone?: CulturalZone;
  /** Lowercased place string; used only for the documented exceptions. */
  placeLower?: string;
}

/** Never available in this zone. */
const NEVER = Number.POSITIVE_INFINITY;

/**
 * Earliest year each capability is plausible for an ordinary person, by zone.
 * A zone missing a capability entirely uses NEVER.
 */
const EARLIEST: Record<SocietyCapability, Partial<Record<CulturalZone, number>>> = {
  writing: {
    MENA: -3200,
    EAST_ASIAN: -1200,
    SOUTH_ASIAN: -300,        // Brahmi; the Indus script did not carry forward
    SOUTHEAST_ASIAN: 400,      // Pallava-derived scripts, with the Indic religions
    EUROPEAN: -700,           // Greek and Etruscan, then outward
    SUB_SAHARAN_AFRICAN: 1000, // Arabic script with Islam; see place overrides
    SOUTH_AMERICAN: 1532,      // khipu recorded, but it is not letters
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER, // except Mesoamerica, below
    NORTH_AMERICAN_COLONIAL: 1600,
    OCEANIA: 1800,             // missionary literacy
  },
  metallurgy: {
    MENA: -3300,
    SOUTH_ASIAN: -2800,
    SOUTHEAST_ASIAN: -2000,    // Dong Son bronze; iron follows within a millennium
    EUROPEAN: -2500,
    EAST_ASIAN: -2000,
    SUB_SAHARAN_AFRICAN: -900,
    SOUTH_AMERICAN: -1500,     // Andean gold, silver, copper and bronze
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER, // cold-worked copper is not smithing
    NORTH_AMERICAN_COLONIAL: 1600,
    OCEANIA: 1800,
  },
  settled_agriculture: {
    MENA: -9000,
    SOUTH_ASIAN: -7000,
    SOUTHEAST_ASIAN: -4000,    // Rice on the mainland; the islands within two millennia
    EAST_ASIAN: -7000,
    EUROPEAN: -6000,
    SOUTH_AMERICAN: -3500,
    SUB_SAHARAN_AFRICAN: -3000,
    NORTH_AMERICAN_PRE_COLUMBIAN: -2000,
    OCEANIA: -1500,
    NORTH_AMERICAN_COLONIAL: 1600,
  },
  heritable_land: {
    // Inheritance of land as a social fact lags farming itself.
    MENA: -6000,
    SOUTH_ASIAN: -4500,
    SOUTHEAST_ASIAN: -1000,
    EAST_ASIAN: -4500,
    EUROPEAN: -3500,
    SOUTH_AMERICAN: -1500,
    SUB_SAHARAN_AFRICAN: -1000,
    NORTH_AMERICAN_PRE_COLUMBIAN: -500,
    OCEANIA: -500,
    NORTH_AMERICAN_COLONIAL: 1600,
  },
  draft_animals: {
    MENA: -4000,
    SOUTH_ASIAN: -3500,
    SOUTHEAST_ASIAN: -2000,    // Water buffalo, and elephants on the mainland
    EUROPEAN: -3500,
    EAST_ASIAN: -3000,
    SUB_SAHARAN_AFRICAN: -1000,
    // The Americas and Oceania had no plough animal before contact; the llama
    // carries but does not draw.
    SOUTH_AMERICAN: 1540,
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER,
    NORTH_AMERICAN_COLONIAL: 1600,
    OCEANIA: 1800,
  },
  guilds: {
    EUROPEAN: 1100,
    MENA: 900,
    EAST_ASIAN: 900,
    SOUTH_ASIAN: 500,
    SOUTHEAST_ASIAN: 900,      // Craft and trade corporations in the port polities
    SUB_SAHARAN_AFRICAN: NEVER,
    SOUTH_AMERICAN: NEVER,
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER,
    NORTH_AMERICAN_COLONIAL: 1650,
    OCEANIA: NEVER,
  },
  coinage: {
    MENA: -600,
    EUROPEAN: -600,
    SOUTH_ASIAN: -600,
    SOUTHEAST_ASIAN: 700,      // Srivijayan and Javanese coinage; Chinese cash circulates earlier
    EAST_ASIAN: -500,
    SUB_SAHARAN_AFRICAN: 800,
    NORTH_AMERICAN_COLONIAL: 1600,
    SOUTH_AMERICAN: 1540,
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER,
    OCEANIA: 1800,
  },
  /**
   * When European goods, cloth and metalwork became an ordinary sight. The
   * clothing tables are keyed by cultural zone alone, so "South American,
   * early modern" returns a Spanish colonial wardrobe — correct for Lima in
   * 1660 and wrong for a Tehuelche band in the same year.
   */
  european_contact: {
    EUROPEAN: -10000,
    MENA: -10000,
    SOUTH_ASIAN: 1498,
    SOUTHEAST_ASIAN: 1511,     // Malacca falls to the Portuguese
    EAST_ASIAN: 1543,
    SUB_SAHARAN_AFRICAN: 1880,   // coasts far earlier; see place overrides
    SOUTH_AMERICAN: 1532,        // Andes and Atlantic coast; interiors later
    NORTH_AMERICAN_PRE_COLUMBIAN: 1600,
    NORTH_AMERICAN_COLONIAL: 1600,
    OCEANIA: 1790,
  },
  /**
   * Dates are for markets an ordinary person would use, not for the earliest
   * long-distance prestige exchange, which is far older everywhere and is not
   * the same institution.
   */
  market_exchange: {
    MENA: -3000,
    SOUTH_ASIAN: -2500,
    EAST_ASIAN: -1500,
    EUROPEAN: -1000,
    SOUTHEAST_ASIAN: -200,
    SUB_SAHARAN_AFRICAN: -200,
    // The Andean state ran on tribute, labor levies and redistribution; the
    // marketplace arrives with the Spanish. Mesoamerica is the exception and
    // carries it in the place overrides.
    SOUTH_AMERICAN: 1532,
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER,
    NORTH_AMERICAN_COLONIAL: 1600,
    OCEANIA: 1800,
  },
  wage_labor: {
    MENA: -2000,
    EUROPEAN: -500,
    EAST_ASIAN: -500,
    SOUTH_ASIAN: -300,
    SOUTHEAST_ASIAN: 800,
    SUB_SAHARAN_AFRICAN: 1000,
    SOUTH_AMERICAN: 1540,
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER,
    NORTH_AMERICAN_COLONIAL: 1620,
    OCEANIA: 1800,
  },
  retained_military_service: {
    MENA: -2500,
    EUROPEAN: -700,
    EAST_ASIAN: -1200,
    SOUTH_ASIAN: -600,
    SOUTHEAST_ASIAN: 400,
    SUB_SAHARAN_AFRICAN: 800,
    SOUTH_AMERICAN: 1200,      // Inca and their predecessors; not a general fact of the zone
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER,
    NORTH_AMERICAN_COLONIAL: NEVER,
    OCEANIA: 1300,             // Chiefly warrior retinues in Polynesia
  },
  guild_apprenticeship: {
    MENA: -1800,
    EUROPEAN: -200,
    EAST_ASIAN: -600,
    SOUTH_ASIAN: -500,
    SOUTHEAST_ASIAN: 900,
    SUB_SAHARAN_AFRICAN: 1000,
    SOUTH_AMERICAN: 1540,
    NORTH_AMERICAN_PRE_COLUMBIAN: NEVER,
    NORTH_AMERICAN_COLONIAL: 1650,
    OCEANIA: NEVER,
  },
  urban_settlement: {
    MENA: -3500,
    SOUTH_ASIAN: -2600,
    SOUTHEAST_ASIAN: -500,     // Moated settlements, then the Angkorian and Javanese capitals
    EAST_ASIAN: -2000,
    EUROPEAN: -1600,
    SOUTH_AMERICAN: -1500,
    SUB_SAHARAN_AFRICAN: -300,
    NORTH_AMERICAN_PRE_COLUMBIAN: -500,
    NORTH_AMERICAN_COLONIAL: 1620,
    OCEANIA: NEVER,
  },
};

/**
 * Documented exceptions where a zone is too coarse. Each entry overrides the
 * zone default when the place string matches.
 */
interface PlaceOverride {
  match: RegExp;
  /** Restrict the override to these zones. "Arctic" means very different
   *  things in the Ural and Arctic Europe region and in Inuit North America. */
  zones?: CulturalZone[];
  capabilities: Partial<Record<SocietyCapability, number>>;
}

const PLACE_OVERRIDES: PlaceOverride[] = [
  {
    // Mesoamerica sits inside the North American zone and is nothing like the
    // rest of it: full writing, cities, and metalworking late.
    match: /\b(mexico|maya|yucatan|oaxaca|guatemala|tenochtitlan|teotihuacan|aztec|olmec|zapotec|mixtec|chiapas|honduras|belize|central highlands)\b/,
    capabilities: {
      writing: -300,
      urban_settlement: -1200,
      metallurgy: 800,
      settled_agriculture: -4000,
      heritable_land: -1200,
      // Dense, regulated marketplaces and a professional merchant class, with
      // cacao and cloth as money and no coin anywhere.
      market_exchange: -500,
    },
  },
  {
    // Christian Nubia and the Ethiopian highlands were literate long before the
    // Sahel took up Arabic script.
    match: /\b(ethiop|abyssin|aksum|axum|nubia|meroe|kush|tigray|amhara|gondar)\b/,
    capabilities: { writing: -300, coinage: 100, urban_settlement: -700 },
  },
  {
    // Sahelian towns on the trans-Saharan trade routes.
    match: /\b(timbuktu|gao|jenne|djenne|kano|katsina|sokoto|mali|songhai|bornu|hausa)\b/,
    capabilities: { writing: 1100, coinage: 900, urban_settlement: 700 },
  },
  {
    // The Andean state: cities and metalwork, but no writing before contact.
    match: /\b(cusco|cuzco|inca|tiwanaku|tiahuanaco|chimu|moche|nazca|potosi|titicaca|quito)\b/,
    capabilities: { urban_settlement: -1500, metallurgy: -1500 },
  },
  {
    // Foraging and pastoral country at the far south: no farming, no metal.
    // European settlement did not reach the interior until the Conquest of the
    // Desert and the Patagonian sheep frontier late in the nineteenth century.
    match: /\b(patagonia|tierra del fuego|southern ice fields|pampas|magellan|fuegian)\b/,
    capabilities: {
      settled_agriculture: 1880,
      heritable_land: 1880,
      metallurgy: 1600,
      urban_settlement: 1850,
      writing: 1850,
      european_contact: 1860,
      market_exchange: 1880,
      wage_labor: 1880,
    },
  },
  {
    // West and Central African coasts traded with Europeans from the 1480s,
    // three to four centuries before the interior did.
    match: /\b(gold coast|slave coast|guinea|benin|kongo|angola|luanda|elmina|calabar|niger delta|senegal|gambia|sierra leone|cape|natal)\b/,
    capabilities: { european_contact: 1480 },
  },
  {
    // Amazon and Gran Chaco interiors.
    match: /\b(amazon|xingu|orinoco|gran chaco|mato grosso|rio negro|ucayali)\b/,
    capabilities: { european_contact: 1900 },
  },
  {
    // Interior North America: the plains and the far north long after the coast.
    match: /\b(great plains|northern rockies|great basin|plateau|dakota|comanche|blackfoot)\b/,
    capabilities: { european_contact: 1780 },
  },
  {
    match: /\b(arctic|subarctic|inuit|thule|aleut|yupik)\b/,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    capabilities: { european_contact: 1850 },
  },
  {
    // The New Guinea highlands were not entered by outsiders until the 1930s.
    match: /\b(new guinea|papua|highlands of new guinea|sepik|kokoda)\b/,
    capabilities: { european_contact: 1930 },
  },
  {
    match: /\b(australia|arnhem|outback|aboriginal|tasmania)\b/,
    capabilities: { european_contact: 1788 },
  },
  {
    // Arctic and subarctic North America. Zone-scoped: "Ural and Arctic Europe"
    // matches the same words and is a settled, literate, metalworking region.
    match: /\b(arctic|subarctic|inuit|thule|greenland|aleut|yupik)\b/,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    capabilities: {
      settled_agriculture: NEVER, heritable_land: NEVER, urban_settlement: NEVER,
      market_exchange: 1850, wage_labor: 1900,
    },
  },
  {
    // Interior Australia: foraging economies into the modern period.
    match: /\b(australia|arnhem|outback|aboriginal|tasmania)\b/,
    capabilities: { settled_agriculture: 1800, heritable_land: 1800, urban_settlement: 1800 },
  },
  {
    // Western North America outside the farming Southwest. The zone-level date
    // of 2000 BCE is the Southwest's, where maize arrives early; applying it to
    // the whole zone made a Farmer with crop rotation in the Glacier Foothills
    // in 285 CE. The Plateau, the Great Basin and the Northern Rockies had no
    // agriculture before settlers brought it — these were root, seed, salmon
    // and game economies.
    // "Plateau" here is the Columbia Plateau culture area, not the Colorado
    // Plateau, which is Puebloan farming country and matched by the Southwest
    // rule above. Naming it bare took maize away from the Ancestral Puebloans.
    match: /\b(great basin|northern rockies|columbia plateau|snake river|yellowstone|nevada|utah|glacier|absaroka|salmon river|bitterroot|cascade)\b/,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    capabilities: {
      settled_agriculture: 1860, heritable_land: 1860, urban_settlement: 1860,
      market_exchange: 1860, wage_labor: 1860,
    },
  },
  {
    // The Northwest Coast: dense, sedentary, ranked societies with plank houses
    // and stored surplus — and no agriculture. Salmon, not seed corn.
    match: /\b(pacific coast|northwest|puget|salish|fraser|haida|olympic|vancouver|cascad)\b/,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    // Ranked, sedentary and wealthy, with an elaborate exchange of prestige
    // goods that is emphatically not a market: the potlatch gives away.
    capabilities: { settled_agriculture: 1850, heritable_land: 1850, market_exchange: 1850 },
  },
  {
    // California: acorn economies, likewise sedentary and likewise not farming.
    match: /\b(california|central valley|sierra nevada|mojave)\b/,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    capabilities: { settled_agriculture: 1769, heritable_land: 1769 },
  },
  {
    // The Plains. Riverine horticulture on the Missouri from about 900 CE — the
    // Mandan and Hidatsa villages — but the open grassland was bison country.
    match: /\b(great plains|plains|prairie|dakota|nebraska|llano|comanche|blackfoot)\b/,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
    capabilities: { settled_agriculture: 900 },
  },
  {
    // Eastern North America. Local seed crops from about 1800 BCE, but maize
    // agriculture — the thing the word "farmer" implies here — only from
    // roughly 900 CE.
    match: /\b(woodland|northeast|great lakes|mississippi|ohio|atlantic coast|new england|chesapeake|southeast|appalach)\b/,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
    capabilities: { settled_agriculture: 900 },
  },
];

/**
 * The earliest year a capability is plausible in this context, or Infinity.
 */
export function capabilityAvailableFrom(
  capability: SocietyCapability,
  ctx: CapabilityContext
): number {
  const place = ctx.placeLower ?? '';
  for (const override of PLACE_OVERRIDES) {
    if (override.zones && (!ctx.culturalZone || !override.zones.includes(ctx.culturalZone))) continue;
    if (override.match.test(place)) {
      const value = override.capabilities[capability];
      if (value !== undefined) return value;
    }
  }
  if (!ctx.culturalZone) return NEVER;
  return EARLIEST[capability][ctx.culturalZone] ?? NEVER;
}

/**
 * The last year a capability is plausible in this context, or Infinity.
 *
 * The table was one-sided until now: it could say a thing did not exist yet and
 * not that it had stopped existing. Everything the earliest column admits, it
 * admitted forever — which is why a security guard in 1993 Xinjiang was sent to
 * serve as a squire under a veteran knight, and why the clause banks had each
 * grown their own hand-written `birthYear >= 1850` test to paper over it, one
 * bank at a time, as each wrong biography was noticed.
 *
 * Most capabilities genuinely have no end: writing, metallurgy and markets did
 * not go away. Only the institutions that did are listed.
 */
const LATEST: Partial<Record<SocietyCapability, Partial<Record<CulturalZone, number>>>> = {
  retained_military_service: {
    // Standing state armies and then conscription replace the lord's household.
    EUROPEAN: 1650,
    MENA: 1850,
    EAST_ASIAN: 1870,          // Meiji abolition of the samurai; the Qing new armies
    SOUTH_ASIAN: 1860,
    SOUTHEAST_ASIAN: 1900,
    SUB_SAHARAN_AFRICAN: 1900,
    SOUTH_AMERICAN: 1540,
    OCEANIA: 1870,
  },
  guild_apprenticeship: {
    // Guilds are abolished or wither across the nineteenth century, and the
    // factory, the trade union and the technical school take over entry to a
    // trade. An indenture "bound for seven years" after this is a costume.
    EUROPEAN: 1880,
    MENA: 1900,
    EAST_ASIAN: 1900,
    SOUTH_ASIAN: 1900,
    SOUTHEAST_ASIAN: 1930,
    SUB_SAHARAN_AFRICAN: 1950,
    SOUTH_AMERICAN: 1900,
    NORTH_AMERICAN_COLONIAL: 1880,
  },
};

export function capabilityAvailableUntil(
  capability: SocietyCapability,
  ctx: CapabilityContext
): number {
  if (!ctx.culturalZone) return NEVER;
  return LATEST[capability]?.[ctx.culturalZone] ?? NEVER;
}

/** Whether this society could do this, here, now. */
export function hasCapability(capability: SocietyCapability, ctx: CapabilityContext): boolean {
  return ctx.year >= capabilityAvailableFrom(capability, ctx)
    && ctx.year <= capabilityAvailableUntil(capability, ctx);
}

/**
 * How a life is provisioned. This is the axis the generators were missing.
 *
 * Several of them were reaching for `era` or for a bare year — the life-event
 * pools switched on `birthYear < -8000` — as a proxy for "does this person live
 * in a world with markets and inheritance in it". That proxy is wrong for a
 * large share of the human past this app covers: Plains bison hunters in 157
 * BCE, Aboriginal Australians in 1700, Arctic and Amazonian and Kalahari
 * peoples at any date at all. None of them are prehistoric and none of them
 * have a family business.
 *
 * Resolved from place and year, and from the trade where the trade settles it.
 */
export type SubsistenceMode =
  | 'foraging'
  | 'pastoral'
  | 'horticultural'
  | 'agrarian'
  | 'commercial'
  | 'industrial';

/** Trades that mean the persona lives off herds rather than off fields. */
const HERDING_TRADE = /herder|shepherd|cowherd|goatherd|swineherd|pastoralist|drover|stockman|reindeer/i;

export function subsistenceMode(
  ctx: CapabilityContext,
  professionLower?: string,
): SubsistenceMode {
  const has = (capability: SocietyCapability) => hasCapability(capability, ctx);

  if (!has('settled_agriculture')) {
    return professionLower && HERDING_TRADE.test(professionLower) ? 'pastoral' : 'foraging';
  }
  // Industrialisation lags the capability dates in exactly the zones where the
  // wage arrives late, which is the behaviour wanted; the bare year alone would
  // industrialise everyone at once.
  if (ctx.year >= 1850 && has('wage_labor') && has('urban_settlement')) return 'industrial';
  if (has('market_exchange') && has('coinage') && has('urban_settlement')) return 'commercial';
  if (has('heritable_land')) return 'agrarian';
  return 'horticultural';
}

/**
 * How a persona's own community should be described. Prose that says "the
 * district" and "the calendar of the parish" is wrong for a band that moves
 * with the season.
 *
 * Derived from subsistence rather than from `settled_agriculture` directly.
 * The zone-level date is the earliest anywhere in the zone — 2000 BCE for North
 * America, which is the maize Southwest's — so asking it about the open Plains
 * returned "village" for people who did not live in one, and that one word was
 * upstream of "feeding village through winter" and of the whole settled-world
 * clause pool opening up.
 */
export type SettlementRegister = 'band' | 'village' | 'district';

export function settlementRegister(
  ctx: CapabilityContext,
  professionLower?: string,
): SettlementRegister {
  switch (subsistenceMode(ctx, professionLower)) {
    case 'foraging':
    case 'pastoral':
      return 'band';
    case 'commercial':
    case 'industrial':
      return 'district';
    default:
      return 'village';
  }
}
