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
  | 'european_contact'; // sustained contact with European material culture

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
    EAST_ASIAN: 1543,
    SUB_SAHARAN_AFRICAN: 1880,   // coasts far earlier; see place overrides
    SOUTH_AMERICAN: 1532,        // Andes and Atlantic coast; interiors later
    NORTH_AMERICAN_PRE_COLUMBIAN: 1600,
    NORTH_AMERICAN_COLONIAL: 1600,
    OCEANIA: 1790,
  },
  urban_settlement: {
    MENA: -3500,
    SOUTH_ASIAN: -2600,
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
    capabilities: { settled_agriculture: NEVER, heritable_land: NEVER, urban_settlement: NEVER },
  },
  {
    // Interior Australia: foraging economies into the modern period.
    match: /\b(australia|arnhem|outback|aboriginal|tasmania)\b/,
    capabilities: { settled_agriculture: 1800, heritable_land: 1800, urban_settlement: 1800 },
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

/** Whether this society could do this, here, now. */
export function hasCapability(capability: SocietyCapability, ctx: CapabilityContext): boolean {
  return ctx.year >= capabilityAvailableFrom(capability, ctx);
}

/**
 * How a persona's own community should be described. Prose that says "the
 * district" and "the calendar of the parish" is wrong for a band that moves
 * with the season.
 */
export type SettlementRegister = 'band' | 'village' | 'district';

export function settlementRegister(ctx: CapabilityContext): SettlementRegister {
  if (!hasCapability('settled_agriculture', ctx)) return 'band';
  if (!hasCapability('urban_settlement', ctx)) return 'village';
  return 'district';
}
