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
  /**
   * True when sharing the faith is not enough and the persona needs the role.
   *
   * Belonging to a religion whose scripture is in a language does not teach
   * anyone that language: a Catholic ploughman in 1300 Burgundy did not speak
   * Latin, and a Hindu weaver in 600 Magadha did not speak Sanskrit — he spoke
   * a Prakrit, which is exactly what Sanskrit drama has such characters speak
   * on stage while the brahmins and kings around them speak Sanskrit. Faith
   * alone was passing the check, so Classical Sanskrit came back as the mother
   * tongue of nearly two thirds of the Gangetic plain.
   *
   * Absent for Classical Arabic and Hebrew, which unlike these were somebody's
   * everyday speech in some place and period.
   */
  requiresRole?: boolean;
  /**
   * Where and when the language *was* somebody's ordinary speech, exempting it
   * from the check entirely.
   *
   * Every language of learning was a living vernacular somewhere first. Latin
   * is the language of the church in 1300 Burgundy and the language of the
   * street in 100 CE Rome, and a rule that cannot tell those apart made a Roman
   * baker in the reign of Trajan speak "an Indo-European language of the
   * region". Hebrew is the same story with the boundary at the exile.
   */
  vernacular?: { places?: RegExp; until?: number; from?: number };
}

const LITURGICAL: Record<string, RegisterRule> = {
  CLASSICAL_ARABIC: {
    religions: /islam|muslim|sunni|shia|shi'a|sufi|ibadi/i,
    roles: /imam|mullah|qadi|ulama|sufi|muezzin|scholar|jurist|scribe|caravan|long.distance|merchant|astronomer|physician/i,
  },
  LATIN: {
    religions: /catholic|christian|orthodox/i,
    roles: /priest|bishop|monk|friar|abbot|abbess|nun|cardinal|pope|deacon|clerk|scribe|notary|jurist|physician|professor|scholar|student/i,
    requiresRole: true,
    // Ordinary speech in Roman Italy and the western provinces until the
    // Romance vernaculars separate out of it.
    vernacular: { places: /rome|roman|italy|latium|campania|etruria|hispania|gaul|africa proconsularis|dacia|pannonia/i, until: 600 },
  },
  MEDIEVAL_LATIN: {
    religions: /catholic|christian/i,
    roles: /priest|bishop|monk|friar|abbot|abbess|nun|cardinal|deacon|clerk|scribe|notary|jurist|physician|professor|scholar|student/i,
    requiresRole: true,
  },
  CHURCH_SLAVONIC: {
    religions: /orthodox|christian/i,
    roles: /priest|monk|deacon|scribe|icon|scholar/i,
    requiresRole: true,
  },
  SANSKRIT: {
    religions: /hindu|brahman|jain|buddh|vedic/i,
    roles: /brahmin|priest|pandit|scholar|scribe|astronomer|physician|ayurvedic|guru|monk/i,
    requiresRole: true,
  },
  // The entry the table actually reaches for in the classical period, and the
  // one that was never listed here — so unlike SANSKRIT it faced no register
  // check whatsoever and could be assigned to anyone at all.
  CLASSICAL_SANSKRIT: {
    religions: /hindu|brahman|jain|buddh|vedic/i,
    roles: /brahmin|priest|pandit|scholar|scribe|astronomer|physician|ayurvedic|guru|monk|court|minister|poet|playwright/i,
    requiresRole: true,
  },
  VEDIC_SANSKRIT: {
    religions: /hindu|brahman|vedic/i,
    roles: /brahmin|priest|pandit|scholar|seer/i,
    requiresRole: true,
  },
  CLASSICAL_CHINESE: {
    religions: /confucian|buddh|daoist|taoist/i,
    roles: /mandarin|official|scholar|scribe|monk|magistrate|examiner|physician|astronomer|clerk|teacher/i,
    requiresRole: true,
    // Literary Chinese was formed on the speech of the Warring States and only
    // drifted away from it gradually; through the Han and the period of
    // division it is still close enough to what people said that treating it
    // as the ordinary language is fair. After that it is a learned register
    // and stays one for thirteen hundred years, which is why the vernaculars
    // below — Middle Chinese, Early Mandarin, Mandarin — carry the later eras.
    vernacular: { until: 600 },
  },
  GEEZ: {
    religions: /orthodox|christian|ethiopian/i,
    roles: /priest|monk|deacon|scribe|debtera|scholar/i,
    requiresRole: true,
  },
  ETHIOPIC_GEEZ: {
    religions: /orthodox|christian|ethiopian/i,
    roles: /priest|monk|deacon|scribe|debtera|scholar/i,
    requiresRole: true,
  },
  PALI: {
    religions: /buddh/i,
    roles: /monk|bhikkhu|abbot|novice|scholar|scribe/i,
    requiresRole: true,
  },
  // The table's ids are ANCIENT_HEBREW and MISHNAIC_HEBREW; a rule keyed on
  // plain HEBREW matched no entry at all, so neither was ever checked and a
  // Galilean carpenter in 30 CE could come back speaking Ancient Hebrew.
  ANCIENT_HEBREW: {
    religions: /jud|jewish|hebrew|israelite/i,
    roles: /rabbi|cantor|hazzan|maggid|scribe|sofer|scholar|priest|levite/i,
    requiresRole: true,
    vernacular: { places: /israel|judah|judea|canaan|samaria|jerusalem|levant/i, until: -200 },
  },
  MISHNAIC_HEBREW: {
    religions: /jud|jewish|hebrew|israelite/i,
    roles: /rabbi|cantor|hazzan|maggid|scribe|sofer|scholar|teacher/i,
    requiresRole: true,
  },
  HEBREW: {
    religions: /jud|jewish|hebrew|israelite/i,
    roles: /rabbi|cantor|hazzan|maggid|scribe|sofer|scholar/i,
    // A spoken language in Iron Age Israel and Judah, and a language of
    // scripture and study afterwards: by the first century the street in
    // Jerusalem spoke Aramaic, which is why a Judean labourer in 30 CE should
    // not come back as a Hebrew speaker.
    requiresRole: true,
    vernacular: { places: /israel|judah|judea|canaan|samaria|jerusalem|levant/i, until: -200 },
  },
  AVESTAN: {
    religions: /zoroastr|mazda/i,
    roles: /priest|magus|mobed|scholar/i,
    requiresRole: true,
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
  /** Needed to tell the language of the street from the language of the altar. */
  context?: { year?: number; region?: string; location?: string },
): boolean {
  const rule = LITURGICAL[languageId];
  if (!rule) return true;

  // Was it simply the local speech here and now? Then no schooling is required
  // and the persona's faith and trade are beside the point.
  if (rule.vernacular && context?.year !== undefined) {
    const { places, from, until } = rule.vernacular;
    const place = `${context.region ?? ''} ${context.location ?? ''}`;
    const inPlace = !places || places.test(place);
    const afterStart = from === undefined || context.year >= from;
    const beforeEnd = until === undefined || context.year <= until;
    if (inPlace && afterStart && beforeEnd) return true;
  }

  const hasRole = !!profession && !!rule.roles?.test(profession);
  if (hasRole) return true;
  // For a language nobody grew up speaking, the role is the whole test; the
  // shared faith only says which role could have taught it.
  if (rule.requiresRole) return false;
  return !!religion && rule.religions.test(religion);
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
  // Standard Swahili does reach the interior, but only once the caravan roads
  // and then the colonial administrations carried it there. Before that it is
  // a coastal language and the entry above governs.
  SWAHILI_MODERN: {
    places: /swahili|zanzibar|kilwa|mombasa|lamu|east africa|east african|rift|kenya|tanzania|tanganyika|uganda|congo|great lakes|victoria|serengeti|mara|kilimanjaro|nyanza/i,
    from: 1890,
  },

  // The African interior. Without these the new entries would repeat the
  // mistake the gate was written to stop: an entry that names one part of a
  // continent-sized zone being treated as valid across all of it.
  GIKUYU: { places: /kikuyu|gikuyu|mount kenya|central kenya|kenya|rift|highland|nyeri|murang/i, from: 1200 },
  LUO: { places: /luo|nyanza|kisumu|lake victoria|victoria|western kenya|kenya|rift|mara/i, from: 1500 },
  KALENJIN: { places: /kalenjin|rift|kenya|nandi|kericho|eldoret|western highland|mara/i, from: 1000 },
  MAASAI: { places: /maasai|masai|mara|serengeti|rift|kajiado|narok|ngorongoro|kenya|tanzania|tanganyika/i, from: 1500 },
  KURIA: { places: /kuria|mara|tarime|musoma|lake victoria|victoria|kenya|tanzania|tanganyika/i, from: 1400 },
  SUKUMA: { places: /sukuma|shinyanga|mwanza|lake victoria|victoria|tanzania|tanganyika/i, from: 1300 },
  LUGANDA: { places: /buganda|ganda|uganda|kampala|lake victoria|victoria|great lakes/i, from: 1300 },
  KINYARWANDA: { places: /rwanda|burundi|great lakes|kivu|rift|central africa/i, from: 1200 },
  KIKONGO: { places: /kongo|congo|angola|cabinda|matadi|lower congo|central africa/i, from: 1300 },
  LINGALA: { places: /congo|kinshasa|brazzaville|ubangi|lualaba|central africa/i, from: 1880 },
  TSHILUBA: { places: /kasai|luba|congo|katanga|central africa/i, from: 1400 },
  SHONA: { places: /shona|zimbabwe|mashonaland|zambezi|great zimbabwe|harare|salisbury|rhodesia/i, from: 1100 },
  SOTHO_TSWANA: { places: /sotho|tswana|lesotho|botswana|highveld|transvaal|orange free state|basuto|bechuana|kalahari|southern africa/i, from: 1400 },
  NDEBELE: { places: /ndebele|matabele|bulawayo|zimbabwe|rhodesia/i, from: 1830 },
  ZULU: { places: /zulu|natal|zululand|kwazulu|durban|drakensberg|southern africa|transvaal/i, from: 1500 },
  XHOSA: { places: /xhosa|eastern cape|transkei|ciskei|cape|southern africa/i, from: 1500 },
  AFRIKAANS: { places: /cape|transvaal|orange free state|highveld|south africa|southern africa|namibia|karoo|witwatersrand|pretoria|johannesburg/i, from: 1700 },
  MALAGASY: { places: /madagascar|malagasy|merina|betsileo|sakalava|antananarivo/i, from: 500 },
  NAMA: { places: /namib|kalahari|khoi|nama|orange river|cape/i },
  // Like SOMALI below, 'horn' matched the region label for the whole Horn,
  // so each language was offered everywhere in it.
  TIGRINYA: { places: /tigray|eritrea|axum|aksum|ethiop|abyssin|highland|gondar|asmara/i, from: 1000 },
  // 'horn' covered the Ethiopian highlands too, so Somali was competing with
  // Tigrinya and Amharic for personas in Gondar and Axum.
  SOMALI: { places: /somal|ogaden|djibouti|danakil|berbera|mogadishu|jubba|puntland|hargeisa/i, from: 900 },
  AMHARIC: { places: /ethiop|abyssin|amhara|shewa|gondar|horn/i, from: 1150 },
  ETHIOPIC_GEEZ: { places: /ethiop|abyssin|axum|aksum|tigray|eritrea|horn/i, from: -100, until: 1400 },
  GEEZ: { places: /ethiop|abyssin|axum|aksum|tigray|eritrea|horn/i, from: -100, until: 1400 },

  // MENA, where a handful of entries roam well outside where they were spoken.
  // Ancient South Arabian is Sabaean, Minaean and their neighbours in the Yemeni
  // highlands and the Hadhramaut; it was reaching central Arabia and taking
  // personas on the Najd plateau, where the language was Old Arabic.
  ANCIENT_SOUTH_ARABIAN: { places: /yemen|saba|sheba|himyar|hadhramaut|dhofar|qataban|marib|aden|south arabia/i },
  OLD_ARABIC: { places: /arabia|najd|hejaz|nabatea|petra|syria|levant|palmyra|jordan/i },
  // A language of coastal colonies and their hinterland, not of North Africa
  // at large: the Rif and the Atlas were Berber-speaking throughout.
  PHOENICIAN: { places: /phoenicia|tyre|sidon|byblos|levant|carthage|utica|gadir|cadiz|motya|lixus|panormus|sardinia|ibiza/i },

  // Classical Arabic outside its homeland. It travelled with Islam, and reached
  // the Sahel and the Swahili coast centuries after the conquest of Egypt — not
  // at all into the Guinea forest, where a student's persona was given it.
  CLASSICAL_ARABIC: {
    // 'horn' and 'somal' are gone: the Ethiopian highlands and the Somali
    // country were Muslim in large part and Arabic-speaking in no part, and
    // listing them here made Classical Arabic the answer for the Horn whenever
    // its own languages were missing or out of period.
    places: /arabia|hejaz|yemen|najd|iraq|syria|levant|egypt|nile|maghreb|ifriqiya|tunis|morocco|andalus|north africa|sahara|sahel|timbuktu|gao|kanem|bornu|swahili|zanzibar|kilwa|mombasa|lamu|east african coast|persia|anatolia|central asia|transoxiana|hindustan|deccan/i,
    from: 630,
  },

  // Europe. Mostly fine on the zone check, but a few regional languages were
  // being offered across whole countries: Occitan is the language of the south
  // of France and was turning up in Paris, and Basque covered all of Iberia.
  OCCITAN: { places: /occitan|languedoc|provence|gascony|toulouse|marseille|pyrenees|aquitaine|montpellier|bordeaux|southern france/i, from: 900 },
  BASQUE: { places: /basque|euskadi|bilbao|san sebastian|navarre|vitoria|pyrenees|biscay/i },
  SCOTS_GAELIC: { places: /highland|hebrides|argyll|scotland|scottish|isles|skye|inverness/i, from: 900 },
  ROMANSH: { places: /grisons|graubunden|engadine|switzerland|swiss|alps/i, from: 800 },
  SERBO_CROATIAN: { places: /balkan|serbia|croatia|bosnia|dalmatia|dinaric|montenegro|slavonia/i, from: 900 },
  BULGARIAN: { places: /bulgaria|thrac|macedon|vardar|balkan|rumelia/i, from: 900 },
  ALBANIAN: { places: /albania|epirus|kosovo|pindus|illyria|balkan/i, from: 1000 },
  VENETIAN: { places: /venice|venetian|veneto|adriatic|dalmatia|istria/i, from: 1200 },

  // South and East Asia, where the zone is likewise far too broad.
  TAMIL: { places: /tamil|chola|pandya|madurai|coromandel|deccan|sri lanka|ceylon|south india/i, from: -300 },
  BENGALI: { places: /bengal|bangla|gangetic delta|dhaka|calcutta|kolkata|assam/i, from: 1100 },
  PUNJABI: { places: /punjab|lahore|indus|five rivers|sikh/i, from: 1000 },
  MUGHAL_URDU: { places: /delhi|agra|lucknow|hindustan|deccan|hyderabad|punjab|gangetic/i, from: 1550 },
  MIDDLE_MONGOLIAN: { places: /mongol|steppe|orkhon|karakorum|gobi|altai|manchuria|dzungar/i, from: 1150, until: 1700 },
  MANCHU: { places: /manchuria|amur|jilin|liaoning|beijing|qing/i, from: 1600 },
  TIBETAN: { places: /tibet|lhasa|himalaya|kham|amdo|ladakh|bhutan/i, from: 600 },
  UYGHUR: { places: /tarim|turfan|kashgar|xinjiang|uygh|dzungar|central asia/i, from: 700 },
};

/**
 * Whether the gate has an opinion about where this language was spoken. A
 * language that passed an explicit rule has been positively placed, which is
 * better evidence than the loose `regions` string match, and callers use this
 * to decide whether that looser test is worth consulting at all.
 */
export function hasPlaceRule(languageId: string): boolean {
  return languageId in PLACE_RULES;
}

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
    && registerIsAvailable(languageId, input.religion, input.profession, input);
}
