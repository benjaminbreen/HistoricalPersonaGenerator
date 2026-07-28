/**
 * services/languagePlausibilityService.ts
 *
 * Two checks the language table cannot make about itself.
 *
 * 1. *Register.* Some entries are not anybody's mother tongue. Classical
 *    Arabic, Latin, Sanskrit, Classical Chinese, Ge'ez and Church Slavonic are
 *    languages of scripture, law and learning, acquired through religious
 *    education by a small literate minority, and nobody grew up speaking them
 *    at home. The table lists them the same way it lists Hausa, so the resolver
 *    treated them as ordinary vernaculars and handed Classical Arabic to
 *    thirty-seven per cent of sub-Saharan personas in 709 CE — including a
 *    non-Muslim woman in the Ivory Coast forest, which is what a student
 *    reported. A language of this kind now requires a persona who plausibly
 *    had access to it: the right religion, or a scholarly, clerical, legal or
 *    long-distance trading role.
 *
 * 2. *Place, within a zone.* `culturalZones` is far too coarse for the two
 *    largest zones. SUB_SAHARAN_AFRICAN spans the Sahel, the Guinea forest,
 *    the Horn, the Congo basin, the Swahili coast and the Kalahari, and an
 *    entry that names any one of them is treated as valid across all of them:
 *    Hausa, a Chadic language of what is now northern Nigeria and Niger,
 *    covered a hundred per cent of eighth-century Ivory Coast. The rules below
 *    say where a language was actually spoken and from when, and are applied as
 *    a gate rather than a preference.
 *
 * Dates are conservative earliest-attestation or earliest-plausible-presence
 * estimates. Where a language spread by conversion or conquest, the date is
 * when it reached *that region*, not when it first existed.
 */

/** Languages acquired by education rather than at home. */
interface RegisterRule {
  /** Which religions gave access to it. */
  religions: RegExp;
  /** Roles that imply the necessary schooling, whatever the persona believes. */
  roles?: RegExp;
}

const LITURGICAL: Record<string, RegisterRule> = {
  CLASSICAL_ARABIC: {
    religions: /islam|muslim|sunni|shia|shi'a|sufi|ibadi/i,
    roles: /imam|mullah|qadi|ulama|sufi|muezzin|scholar|jurist|scribe|caravan|long.distance|merchant|astronomer|physician/i,
  },
  LATIN: {
    religions: /catholic|christian|orthodox/i,
    roles: /priest|bishop|monk|friar|abbot|abbess|nun|cardinal|pope|deacon|clerk|scribe|notary|jurist|physician|professor|scholar|student/i,
  },
  MEDIEVAL_LATIN: {
    religions: /catholic|christian/i,
    roles: /priest|bishop|monk|friar|abbot|abbess|nun|cardinal|deacon|clerk|scribe|notary|jurist|physician|professor|scholar|student/i,
  },
  CHURCH_SLAVONIC: {
    religions: /orthodox|christian/i,
    roles: /priest|monk|deacon|scribe|icon|scholar/i,
  },
  SANSKRIT: {
    religions: /hindu|brahman|jain|buddh|vedic/i,
    roles: /brahmin|priest|pandit|scholar|scribe|astronomer|physician|ayurvedic|guru|monk/i,
  },
  VEDIC_SANSKRIT: {
    religions: /hindu|brahman|vedic/i,
    roles: /brahmin|priest|pandit|scholar|seer/i,
  },
  CLASSICAL_CHINESE: {
    religions: /confucian|buddh|daoist|taoist/i,
    roles: /mandarin|official|scholar|scribe|monk|magistrate|examiner|physician|astronomer|clerk|teacher/i,
  },
  GEEZ: {
    religions: /orthodox|christian|ethiopian/i,
    roles: /priest|monk|deacon|scribe|debtera|scholar/i,
  },
  ETHIOPIC_GEEZ: {
    religions: /orthodox|christian|ethiopian/i,
    roles: /priest|monk|deacon|scribe|debtera|scholar/i,
  },
  PALI: {
    religions: /buddh/i,
    roles: /monk|bhikkhu|abbot|novice|scholar|scribe/i,
  },
  HEBREW: {
    religions: /jud|jewish|hebrew|israelite/i,
    roles: /rabbi|cantor|hazzan|maggid|scribe|sofer|scholar/i,
  },
  AVESTAN: {
    religions: /zoroastr|mazda/i,
    roles: /priest|magus|mobed|scholar/i,
  },
};

/**
 * Is this a language someone could only have got at school or in a seminary,
 * and did this persona go? Returns true when the language is an ordinary
 * vernacular, so the common case is unaffected.
 */
export function registerIsAvailable(
  languageId: string,
  religion?: string,
  profession?: string,
): boolean {
  const rule = LITURGICAL[languageId];
  if (!rule) return true;
  if (religion && rule.religions.test(religion)) return true;
  if (profession && rule.roles?.test(profession)) return true;
  return false;
}

/** Whether a language id names a language of learning rather than of the home. */
export function isLiturgicalRegister(languageId: string): boolean {
  return languageId in LITURGICAL;
}

// ---------------------------------------------------------------------------
// Place and period, within a cultural zone
// ---------------------------------------------------------------------------

interface PlaceRule {
  /** Where it was spoken. A persona outside this is not a speaker. */
  places: RegExp;
  /** When it reached that region. */
  from?: number;
  /** When it stopped being spoken there. */
  until?: number;
}

/**
 * Only languages the zone check gets badly wrong are listed. Anything absent is
 * left to the table's own `regions` field and the existing affinity preference.
 */
const PLACE_RULES: Record<string, PlaceRule> = {
  // Sub-Saharan Africa. The zone is a continent.
  HAUSA: { places: /hausa|kano|katsina|zaria|sokoto|northern nigeria|niger\b|sahel|savanna|chad|bornu|kanem/i, from: 1000 },
  SONINKE: { places: /ghana empire|wagadu|sahel|senegal|mali|mauritania|western sudan/i, from: 300 },
  SONGHAI: { places: /songhai|gao|timbuktu|niger bend|sahel|western sudan/i, from: 700 },
  MANDINKA: { places: /mali|manden|gambia|senegal|casamance|guinea|western sudan|sahel/i, from: 1200 },
  BAMBARA: { places: /mali|segou|bamako|niger bend|western sudan/i, from: 1600 },
  FULA: { places: /fouta|futa|sahel|senegal|guinea|mali|niger|nigeria|cameroon|adamawa|savanna/i, from: 900 },
  FULFULDE: { places: /fouta|futa|sahel|senegal|guinea|mali|niger|nigeria|cameroon|adamawa|savanna/i, from: 900 },
  AKAN: { places: /akan|asante|ashanti|gold coast|ghana|volta|forest/i, from: 1000 },
  TWI: { places: /akan|asante|ashanti|gold coast|ghana|volta|forest/i, from: 1000 },
  YORUBA: { places: /yoruba|oyo|ife|lagos|benin|niger delta|lower guinea|west african forest|dahomey/i, from: 800 },
  IGBO: { places: /igbo|niger delta|biafra|eastern nigeria|lower guinea|west african forest/i, from: 800 },
  SWAHILI_CLASSICAL: { places: /swahili|zanzibar|kilwa|mombasa|lamu|east african coast|comoro|pemba|indian ocean/i, from: 800 },
  MALAGASY: { places: /madagascar|malagasy|merina|betsileo|sakalava|antananarivo/i, from: 500 },
  NAMA: { places: /namib|kalahari|khoi|nama|orange river|cape|southern africa/i },
  AMHARIC: { places: /ethiop|abyssin|amhara|shewa|gondar|horn/i, from: 1200 },
  ETHIOPIC_GEEZ: { places: /ethiop|abyssin|axum|aksum|tigray|eritrea|horn/i, from: -100, until: 1400 },
  GEEZ: { places: /ethiop|abyssin|axum|aksum|tigray|eritrea|horn/i, from: -100, until: 1400 },

  // Classical Arabic outside its homeland. It travelled with Islam, and reached
  // the Sahel and the Swahili coast centuries after the conquest of Egypt — not
  // at all into the Guinea forest, where a student's persona was given it.
  CLASSICAL_ARABIC: {
    places: /arabia|hejaz|yemen|najd|iraq|syria|levant|egypt|nile|maghreb|ifriqiya|tunis|morocco|andalus|north africa|sahara|sahel|timbuktu|gao|kanem|bornu|swahili|zanzibar|kilwa|mombasa|lamu|east african coast|horn|somal|persia|anatolia|central asia|transoxiana|hindustan|deccan/i,
    from: 630,
  },

  // South and East Asia, where the zone is likewise far too broad.
  TAMIL: { places: /tamil|chola|pandya|madurai|coromandel|deccan|sri lanka|ceylon|south india/i, from: -300 },
  BENGALI: { places: /bengal|bangla|gangetic delta|dhaka|calcutta|kolkata|assam/i, from: 1100 },
  PUNJABI: { places: /punjab|lahore|indus|five rivers|sikh/i, from: 1000 },
  MUGHAL_URDU: { places: /delhi|agra|lucknow|hindustan|deccan|hyderabad|punjab|gangetic/i, from: 1550 },
  MIDDLE_MONGOLIAN: { places: /mongol|steppe|orkhon|karakorum|gobi|altai|manchuria|dzungar/i, from: 1150, until: 1450 },
  MANCHU: { places: /manchuria|amur|jilin|liaoning|beijing|qing/i, from: 1600 },
  TIBETAN: { places: /tibet|lhasa|himalaya|kham|amdo|ladakh|bhutan/i, from: 600 },
  UYGHUR: { places: /tarim|turfan|kashgar|xinjiang|uygh|dzungar|central asia/i, from: 700 },
};

/**
 * Does this language belong in this place and year? True when no rule names it,
 * so the table's own data still governs everything not listed above.
 */
export function placeIsPlausible(
  languageId: string,
  year: number,
  region?: string,
  location?: string,
): boolean {
  const rule = PLACE_RULES[languageId];
  if (!rule) return true;
  if (rule.from !== undefined && year < rule.from) return false;
  if (rule.until !== undefined && year > rule.until) return false;
  const place = `${region ?? ''} ${location ?? ''}`;
  if (!place.trim()) return true;
  return rule.places.test(place);
}

/** Both checks together, which is how the resolver uses them. */
export function languageIsPlausible(
  languageId: string,
  input: { year: number; region?: string; location?: string; religion?: string; profession?: string },
): boolean {
  return placeIsPlausible(languageId, input.year, input.region, input.location)
    && registerIsAvailable(languageId, input.religion, input.profession);
}
