/**
 * constants/characterData/nameSetEras.ts
 *
 * When each naming tradition can plausibly be used.
 *
 * `REGION_NAME_MAPPING` describes naming by region and period, but almost every
 * region's earliest entry is written `{ before: X, keys: [...] }` with no floor —
 * which means it matches *every year back to the beginning of time*. That was
 * harmless while the generator started at 4000 BCE. Once the era floor moved to
 * 40,000 BCE it produced an Achaemenid Persian prince, named for the son of
 * Cyrus the Great and surnamed for a city founded around 700 BCE, hunting in the
 * Tarim Basin in 22,094 BCE.
 *
 * Rather than hand-annotate a hundred-odd region rules and hope none is missed,
 * the gate is applied to the *name sets themselves*: a tradition may only be
 * used from the point it could plausibly exist. Anything that fails falls back
 * to the zone's prehistoric set, whose names are reconstructed forms carrying no
 * surname.
 *
 * The dates are approximate and conservative. They are about when a *naming
 * tradition* is attested, which is not the same as when the people existed —
 * "Potawatomi" is a historically attested ethnonym even though the community's
 * ancestors were there far earlier, and using it as a surname in 15,000 BCE
 * claims something no evidence supports.
 */

/** Traditions with an explicit floor. Everything else falls to the rules below. */
const NAME_SET_EARLIEST: Record<string, number> = {
  // Continuous occupation, and the one case where deep antiquity is defensible.
  ABORIGINAL_AUSTRALIAN: -45000,

  // Bronze and Iron Age.
  MESOPOTAMIAN_ANCIENT: -3200,
  ANCIENT_GREEK: -1400,
  ANCIENT_ROMAN: -800,
  CELTIC_ANCIENT: -800,
  PERSIAN_ANCIENT: -1500,
  SANSKRIT_CLASSICAL: -1500,
  HEBREW: -1200,
  SOGDIAN: -500,
  NUBIAN: -2000,
  BERBER_AMAZIGH: -2000,
  ARABIAN_HEJAZ: -800,
  KOREAN_ANCIENT: -300,
  DRAVIDIAN: -2000,
  EGYPTIAN_COPTIC: 100,

  // The Americas.
  MAYA: -500,
  ZAPOTEC: -500,
  MUISCA: 600,
  MISSISSIPPIAN: 800,
  MIXTEC: 900,
  ANDEAN_QUECHUA: 1000,
  TAINO: 800,
  CARIB: 800,
  AZTEC: 1200,
  INCA: 1200,
  INUIT: -2000,

  // Oceania. Settlement dates matter here: Remote Oceania was reached late.
  MELANESIAN: -3000,
  FIJIAN: -1000,
  SAMOAN: -800,
  TONGAN: -800,
  POLYNESIAN: -1000,
  TAHITIAN: 200,
  HAWAIIAN: 400,

  // Named North American nations. The ethnonyms are historically attested; the
  // broader language families below are given an earlier floor.
  ALGONQUIAN: -1000,
  IROQUOIAN: -500,
  PLAINS_NATIVE: -1000,
  PUEBLO: -500,
  SOUTHWEST_NATIVE: -1000,
  CALIFORNIA_NATIVE: -2000,
  GREAT_BASIN_NATIVE: -2000,
  PACIFIC_NORTHWEST: -2000,
  PACIFIC_NORTHWEST_COAST: -2000,
  NAVAJO: 1400,
  APACHE: 1400,
  COMANCHE: 1600,
  LAKOTA_SIOUX: 1500,
  CHEROKEE: 1000,
  CREEK_MUSKOGEE: 1000,
  SEMINOLE: 1700,
  BLACKFEET: 1500,
  IROQUOIS_HAUDENOSAUNEE: 1100,

  // Later traditions that should not drift early.
  SWAHILI_COASTAL: 800,
  SWAHILI_INTERIOR: 800,
  YORUBA_TRADITIONAL: 800,
  AKAN: 1000,
  HAUSA: 1000,
  AMHARIC: 300,
  ETHIOPIAN_HIGHLAND: -400,
  SOMALI: 700,
  MALAGASY_MERINA: 700,
  MALAGASY_BETSILEO: 700,
  MALAGASY_SAKALAVA: 700,
  ZULU: 1600,
  RWANDA_BURUNDI: 1400,
  WEST_AFRICAN_SAHEL: 300,
  TURKIC_STEPPE: 500,
  MONGOLIAN_TRADITIONAL: 1100,
  UYGHUR: 700,
  TIBETAN: 600,
  KHMER: 500,
  KHMER_ANGKOR: 800,
  THAI: 1200,
  THAI_AYUTTHAYA: 1350,
  BURMESE: 800,
  LAO: 1300,
  VIETNAMESE: -200,
  JAVANESE: 400,
  MALAY: 600,
  FILIPINO: 1565,
  INDONESIAN: 1945,
  JAPANESE: 300,
  CHINESE_MANDARIN: -1200,
  CHINESE_CANTONESE: -200,
  KOREAN: 900,
  MANCHU: 1600,
  TAMIL: -300,
  BENGALI_TRADITIONAL: 1100,
  PUNJABI: 1000,
  RAJPUT: 600,
  HINDI: 1200,
  ARMENIAN: -500,
  GEORGIAN: -300,
  PERSIAN_KHORASAN: 700,
  PERSIAN_FARSI: 900,
  ARABIC_TRADITIONAL: 500,
  ARABIC_LEVANT: 600,
  LEVANTINE: -1500,
  MAGHREBI: 700,
  MAMLUK_EGYPT: 1250,
  MOORISH_ANDALUS: 750,
  TURKISH: 1300,
  KAZAKH: 1450,
  KYRGYZ: 1450,
  UZBEK: 1450,
  TURKMEN: 1450,
  SCANDINAVIAN: 400,
  ICELANDIC: 874,
  WELSH: 400,
  SCOTTISH: 400,
  CELTIC_IRISH: 400,
  RUSSIAN: 900,
  JEWISH_ASHKENAZI: 900,
  AFRICAN_AMERICAN: 1619,
  PUERTO_RICAN: 1500,
  PORTUGUESE_BRAZIL: 1500,
  SPANISH_LATIN_AMERICAN: 1500,
  TEXAS_ANGLO: 1820,
  TEXAS_SPANISH_COLONIAL: 1690,
  NORTH_AMERICAN_COLONIAL: 1607,
};

/** Patterns applied when a set has no explicit entry. */
const PATTERN_RULES: Array<[RegExp, number]> = [
  [/^PREHISTORIC_/, Number.NEGATIVE_INFINITY],
  [/^ANCIENT_|_ANCIENT$/, -1500],
  [/^BYZANTINE/, 330],
  [/^FRANKISH|^SAXON_EARLY|^NORMAN|_ANGLO_SAXON$/, 400],
  [/_MEDIEVAL$/, 500],
  [/_MODERN$/, 1700],
];

/**
 * Anything unrecognised is barred before the Bronze Age. This is the safety net
 * that matters: no culture-specific naming tradition, whatever it is and whether
 * or not anyone remembered to date it, reaches into the Palaeolithic.
 */
const DEFAULT_EARLIEST = -3000;

export function nameSetEarliestYear(key: string): number {
  if (key in NAME_SET_EARLIEST) return NAME_SET_EARLIEST[key];
  for (const [pattern, year] of PATTERN_RULES) {
    if (pattern.test(key)) return year;
  }
  return DEFAULT_EARLIEST;
}

export function isNameSetPlausible(key: string, year: number): boolean {
  return year >= nameSetEarliestYear(key);
}

/** Keep only the traditions that could exist in this year. */
export function filterNameKeys(keys: string[], year: number): string[] {
  return keys.filter(key => isNameSetPlausible(key, year));
}

/**
 * The reconstructed-form fallback for a zone. These sets carry no surname,
 * which is itself correct: toponymic surnames ("of Ecbatana") are a specific
 * later convention and not something a forager would have carried.
 */
const PREHISTORIC_BY_ZONE: Record<string, string> = {
  EUROPEAN: 'PREHISTORIC_PROTO_INDO_EUROPEAN',
  EAST_ASIAN: 'PREHISTORIC_ASIAN',
  SOUTH_ASIAN: 'PREHISTORIC_SOUTH_ASIAN',
  MENA: 'PREHISTORIC_MENA',
  SUB_SAHARAN_AFRICAN: 'PREHISTORIC_AFRICAN',
  OCEANIA: 'PREHISTORIC_OCEANIC',
  NORTH_AMERICAN_PRE_COLUMBIAN: 'PREHISTORIC_AMERICAN',
  NORTH_AMERICAN_COLONIAL: 'PREHISTORIC_AMERICAN',
  SOUTH_AMERICAN: 'PREHISTORIC_AMERICAN',
};

export function prehistoricNameKeyFor(
  culturalZone: string,
  year = 0,
  region = ''
): string {
  // Oceania is the one zone where the deep-time fallback cannot be the zone's
  // own set. Remote Oceania was settled within the last three thousand years —
  // Aotearoa around 1280 CE — so a Polynesian tradition in 20,000 BCE claims a
  // people who were not there. Australia, continuously occupied for some
  // 65,000 years, is the only Oceanic naming tradition with deep-time standing.
  if (culturalZone === 'OCEANIA') {
    const australian = /australia|aboriginal|arnhem|kimberley|tasmania|outback|queensland|murray|cape york/i.test(region);
    if (australian || year < -1500) return 'ABORIGINAL_AUSTRALIAN';
  }
  // `EAST_ASIAN` reaches from the Fujian coast to the Altai. The farming basins
  // and the steppe belt did not share a naming world, and pooling them put a
  // Turkic sky-god's name on a South China farmer.
  if (culturalZone === 'EAST_ASIAN'
    && /steppe|mongol|altai|dzungar|siberia|manchuria|tian shan|tarim|kazakh|transoxiana|aral|kyzylkum|khorasan/i.test(region)) {
    return 'PREHISTORIC_INNER_ASIAN';
  }
  return PREHISTORIC_BY_ZONE[culturalZone] || 'PREHISTORIC_ASIAN';
}

/**
 * Resolve a chosen name set against the year, substituting the zone's
 * prehistoric set when the tradition could not yet exist.
 */
export function resolveNameKey(
  key: string | undefined,
  culturalZone: string,
  year: number,
  region = ''
): string {
  if (key && isNameSetPlausible(key, year)) return key;
  return prehistoricNameKeyFor(culturalZone, year, region);
}

// ---------------------------------------------------------------------------
// Lint
// ---------------------------------------------------------------------------

export interface NameRuleWarning {
  zone: string;
  region: string;
  rule: string;
  implausibleKeys: string[];
  /** The earliest year the rule can match. */
  from: number;
  /**
   * `unbounded` means the rule has no `after` floor and therefore reaches all
   * the way to the era floor — the class that produced an Achaemenid name in
   * the Palaeolithic. `overlap` is a bounded rule that merely starts somewhat
   * before its tradition is attested, which is usually a rounding difference
   * rather than a mistake.
   */
  kind: 'unbounded' | 'overlap';
}

/** Bounded rules within this many years of their tradition are not reported. */
const OVERLAP_TOLERANCE_YEARS = 250;

/**
 * Report region rules that can hand out a naming tradition before it existed.
 *
 * Run from the audit harness. `resolveNameKey` already prevents these from
 * reaching a persona, so this is a "your data says something it does not mean"
 * warning rather than a bug report — but an unbounded rule is a latent trap for
 * whoever edits the table next.
 */
export function auditNameRules(
  mapping: Record<string, Record<string, Array<{ before?: number; after?: number; keys: string[] }>>>,
  eraFloor: number
): NameRuleWarning[] {
  const warnings: NameRuleWarning[] = [];
  for (const [zone, regions] of Object.entries(mapping)) {
    for (const [region, rules] of Object.entries(regions)) {
      for (const rule of rules) {
        const unbounded = rule.after === undefined;
        const from = rule.after ?? eraFloor;
        const tolerance = unbounded ? 0 : OVERLAP_TOLERANCE_YEARS;
        const implausible = rule.keys.filter(
          key => nameSetEarliestYear(key) > from + tolerance
        );
        if (implausible.length === 0) continue;
        warnings.push({
          zone,
          region,
          rule: `${rule.after ?? '−∞'}..${rule.before ?? '+∞'}`,
          implausibleKeys: implausible,
          from,
          kind: unbounded ? 'unbounded' : 'overlap',
        });
      }
    }
  }
  return warnings;
}
