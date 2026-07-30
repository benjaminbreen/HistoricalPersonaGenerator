/**
 * services/cultureResolution.ts
 *
 * Which culture is this persona actually from?
 *
 * The app's nine cultural zones are continents. `EAST_ASIAN` spans China,
 * Japan, Korea, Taiwan and Vietnam; `OCEANIA` spans Aboriginal Australia and
 * Polynesia. Content keyed to a zone is therefore keyed to a region that has
 * no shared material culture, and the results are exactly what you would
 * expect: a Formosan Austronesian rice farmer in the mountains of Taiwan in
 * 1306 was issued a Japanese sedge hat and given a sister who married into a
 * samurai clan. Both are period-correct and zone-correct. Both are absurd.
 *
 * The fix is not a bigger denylist. It is to resolve place and period into a
 * *culture* once — the same way `languageAttributionService` already resolves
 * them into a language, and using the same window mechanism — and then let
 * every content selector filter against that one answer.
 *
 * The filter is deliberately asymmetric. A window declares only the terms that
 * are *exclusive* to it within its zone, and a candidate is rejected only when
 * it carries a sibling culture's exclusive marker. Anything unmarked is shared
 * material culture and passes. That makes an incomplete marker list produce
 * missed rejections rather than false ones, which is the safe direction to be
 * wrong in.
 */

import type { CulturalZone } from '../types/characterData';

export interface CultureWindow {
  id: string;
  /** Human-readable, for debugging and audit output. */
  label: string;
  zones: CulturalZone[];
  yearRange: [number, number];
  /** Matched against "<location> <region>", lowercased. */
  places?: RegExp;
  /**
   * Terms belonging to this culture and to no sibling in the same zone.
   * Used only to *reject* other cultures' content — never to select.
   */
  markers?: RegExp;
}

/**
 * Order matters: the first match wins, so the more specific place goes first.
 *
 * This is load-bearing for composite region labels. The app files Taiwan under
 * a region literally named "Taiwan and Ryukyu", so a Japonic window testing
 * /ryukyu/ would capture every Taiwanese highlander if it came first.
 */
export const CULTURE_WINDOWS: CultureWindow[] = [
  // --- East Asia -----------------------------------------------------------
  {
    id: 'culture-taiwan-indigenous',
    label: 'Formosan Austronesian',
    zones: ['EAST_ASIAN' as CulturalZone],
    // Han settlement only becomes demographically dominant in the seventeenth
    // century; before that the island is Austronesian throughout.
    yearRange: [-10000, 1650],
    places: /\b(taiwan|formosa|central mountains|penghu)\b/,
    markers: /\b(atayal|paiwan|bunun|amis|tsou|rukai|puyuma|saisiyat|formosan)\b/i,
  },
  {
    id: 'culture-taiwan-han',
    label: 'Han Taiwanese',
    zones: ['EAST_ASIAN' as CulturalZone],
    yearRange: [1650, 2100],
    // Taiwan needs unbroken coverage, not just a window for its indigenous
    // period. The region label is "Taiwan and Ryukyu", so any gap here drops
    // straight through to the Japonic window on the /ryukyu/ half of the name.
    places: /\b(taiwan|formosa|central mountains|penghu)\b/,
    markers: /\b(hoklo|hakka tulou)\b/i,
  },
  {
    id: 'culture-japan',
    label: 'Japanese',
    zones: ['EAST_ASIAN' as CulturalZone],
    yearRange: [-1000, 2100],
    places: /\b(japan|honshu|kyushu|hokkaido|shikoku|kanto|kansai|yamato|edo|kyoto|osaka|ryukyu|okinawa)\b/,
    markers: /\b(samurai|sugegasa|zukin|kimono|kosode|hakama|geta|tabi|haori|yukata|shogun|daimyo|ronin|katana|wakizashi|kabuto|eboshi|shinto|torii|tatami|jinbaori|montsuki|hanten|happi|waraji|kanzashi|sake brewer)\b/i,
  },
  {
    id: 'culture-korea',
    label: 'Korean',
    zones: ['EAST_ASIAN' as CulturalZone],
    yearRange: [-1000, 2100],
    places: /\b(korea|silla|baekje|goguryeo|joseon|jeolla|gyeongju|pyongyang|seoul)\b/,
    markers: /\b(hanbok|jeogori|durumagi|yangban|magoja|gat hat)\b/i,
  },
  {
    id: 'culture-vietnam',
    label: 'Vietnamese',
    zones: ['EAST_ASIAN' as CulturalZone],
    yearRange: [-500, 2100],
    places: /\b(vietnam|annam|tonkin|hanoi|saigon|mekong|red river|indochina|champa)\b/,
    markers: /\b(ao dai|non la|khan dong)\b/i,
  },
  {
    id: 'culture-china',
    label: 'Chinese',
    zones: ['EAST_ASIAN' as CulturalZone],
    yearRange: [-10000, 2100],
    places: /\b(china|zhongyuan|jiangnan|sichuan|yellow river|yangtze|canton|guangdong|beijing|nanjing|hangzhou|north china|south china|manchuria)\b/,
    markers: /\b(literati|qipao|cheongsam|changshan|hanfu|magua|ruqun|jiaoling|futou|shenyi|tangzhuang|imperial exam|mandarin square)\b/i,
  },

  // `geography.ts` folds Central Asia and Siberia into the East Asia
  // macro-zone, so without these windows a persona from Samarkand or the Ob
  // resolved to no culture at all — and `resolveCulture` returning null means
  // "no constraint", so every Chinese, Japanese and Korean marker passed
  // straight through to them.
  //
  // The marker lists here are deliberately thin. Most Central Asian material
  // culture is shared with Mongolia, Persia or the steppe generally — a yurt
  // is not exclusive to anyone — and a marker that is not genuinely exclusive
  // within the zone produces false rejections for its neighbours. Only terms
  // with nowhere else to go in EAST_ASIAN are listed.
  {
    id: 'culture-central-asia',
    label: 'Central Asian oasis and steppe',
    zones: ['EAST_ASIAN' as CulturalZone],
    yearRange: [-10000, 2100],
    places: /\b(samarkand|ferghana|kyzylkum|balkh|bactria|transoxiana|sogdia|khorasan|pamir|hindu kush|oases|oxus|amu darya|syr darya|merv|khwarezm|kazakh|aral|tian shan|dzungar)\b/,
    markers: /\b(chapan|doppa|tubeteika|karakul|sogdian|bactrian|khwarezmian|caravanserai)\b/i,
  },
  {
    id: 'culture-siberia',
    label: 'Siberian',
    zones: ['EAST_ASIAN' as CulturalZone],
    yearRange: [-10000, 2100],
    places: /\b(siberia|yenisei|irtysh|baikal|tunguska|kamchatka|sakhalin|altai|taiga|lena|okhotsk)\b/,
    markers: /\b(reindeer herder|chum tent|yaranga|malitsa|nivkh|yakut|evenk)\b/i,
  },

  // --- Oceania -------------------------------------------------------------
  {
    id: 'culture-aboriginal-australia',
    label: 'Aboriginal Australian',
    zones: ['OCEANIA' as CulturalZone],
    yearRange: [-10000, 2100],
    places: /\b(australia|arnhem|kimberley|outback|nullarbor|tasmania|murray|carpentaria|uluru)\b/,
    markers: /\b(boomerang|woomera|didgeridoo|corroboree|coolamon|churinga)\b/i,
  },
  {
    id: 'culture-polynesia',
    label: 'Polynesian',
    zones: ['OCEANIA' as CulturalZone],
    yearRange: [-1000, 2100],
    places: /\b(hawai|tahiti|marquesas|tuamotu|cook island|aotearoa|new zealand|society island|rapa nui|easter island|tonga|samoa|futuna|niue|tokelau|tuvalu)\b/,
    markers: /\b(tapa cloth|kava|tiki|marae|lavalava|ahu|maro|korowai|taonga)\b/i,
  },
  {
    id: 'culture-melanesia',
    label: 'Melanesian',
    zones: ['OCEANIA' as CulturalZone],
    yearRange: [-10000, 2100],
    places: /\b(new guinea|papua|sepik|bismarck|solomon|vanuatu|new caledonia|torres)\b/,
    markers: /\b(bilum|kundu|malagan|asmat)\b/i,
  },

  // --- Pre-Columbian North America ----------------------------------------
  {
    id: 'culture-arctic',
    label: 'Arctic',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone, 'NORTH_AMERICAN_COLONIAL' as CulturalZone],
    yearRange: [-3000, 2100],
    places: /\b(arctic|subarctic|inuit|thule|greenland|aleut|yupik|alaska|baffin|labrador)\b/,
    markers: /\b(parka|kayak|umiak|igloo|mukluk|amauti|ulu)\b/i,
  },
  {
    id: 'culture-mesoamerica',
    label: 'Mesoamerican',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    yearRange: [-10000, 1600],
    places: /\b(mexico|maya|yucatan|oaxaca|guatemala|chiapas|belize|honduras|tenochtitlan|teotihuacan)\b/,
    markers: /\b(huipil|maxtlatl|tilma|quetzal|macuahuitl|chinampa|codex)\b/i,
  },
  {
    id: 'culture-plains',
    label: 'Plains',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    yearRange: [-3000, 2100],
    places: /\b(great plains|plains|dakota|lakota|prairie|missouri|platte)\b/,
    markers: /\b(tipi|teepee|travois|war bonnet|warbonnet|parfleche)\b/i,
  },
  {
    id: 'culture-southwest',
    label: 'Southwest',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN' as CulturalZone],
    yearRange: [-2000, 2100],
    places: /\b(southwest|puebloan|sonora|arizona|new mexico|colorado plateau|rio grande)\b/,
    markers: /\b(kiva|kachina|katsina|manta dress)\b/i,
  },

  // --- Middle East and North Africa ---------------------------------------
  // Kept deliberately sparse. Shared Islamic material culture runs right across
  // this zone, so very little is genuinely exclusive to one part of it, and a
  // marker that is merely *typical* would reject correct content.
  {
    id: 'culture-anatolia',
    label: 'Anatolian / Turkic',
    zones: ['MENA' as CulturalZone],
    yearRange: [1071, 2100],
    places: /\b(anatolia|cappadocia|cappadocian|asia minor|turkey|bosporus|konya|bursa)\b/,
    markers: /\b(salvar|salwar kameez|fez|kavuk|yelek|cepken)\b/i,
  },
  {
    id: 'culture-persia',
    label: 'Persian',
    zones: ['MENA' as CulturalZone],
    yearRange: [-1000, 2100],
    places: /\b(persia|iran|isfahan|shiraz|khorasan|zagros|elam|parthia|media)\b/,
    markers: /\b(qaba|kolah|nowruz|zoroastrian|shahnameh)\b/i,
  },
  {
    id: 'culture-egypt',
    label: 'Egyptian',
    zones: ['MENA' as CulturalZone],
    yearRange: [-10000, 2100],
    places: /\b(egypt|nile|thebes|memphis|fayum|alexandria|aswan|nubia)\b/,
    markers: /\b(shendyt|kalasiris|nemes|galabeya)\b/i,
  },

  // --- Sub-Saharan Africa --------------------------------------------------
  // The zone had no windows at all, which meant `resolveCulture` returned null
  // for the whole continent and every marker in the zone's tables passed for
  // everyone in it. That is how a wealthy man in the Rwanda–Burundi highlands
  // came to be wearing senator wear, which is Nigerian formal dress, over a
  // Yoruba-adjacent wardrobe assembled two thousand miles from him.
  //
  // As with MENA, the marker lists are deliberately thin: cloth, beadwork and
  // wrapped garments are shared across the whole continent, and a marker that
  // is merely typical of one region would wrongly reject it for its neighbours.
  // Only terms with a single home are listed — kanzu is absent on purpose,
  // because the coast gave it to Buganda and both wear it.
  {
    id: 'culture-swahili-coast',
    label: 'Swahili coast',
    zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    yearRange: [800, 2100],
    places: /\b(swahili|zanzibar|kilwa|mombasa|malindi|lamu|pemba|comoro|sofala|mogadishu|kenyan coast|tanzanian coast)\b/,
    markers: /\b(kanga|kikoi|kofia|buibui)\b/i,
  },
  {
    id: 'culture-horn',
    label: 'Ethiopian and Horn',
    zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    yearRange: [-1000, 2100],
    places: /\b(ethiopia|abyssinia|amhara|tigray|shewa|gondar|lalibela|axum|aksum|eritrea|somali|ogaden|harar|oromo|afar|danakil|blue nile)\b/,
    markers: /\b(shamma|habesha kemis|netela|gabi|macawis)\b/i,
  },
  {
    id: 'culture-west-africa',
    label: 'West African',
    zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    yearRange: [-1000, 2100],
    places: /\b(nigeria|yoruba|igbo|ibo|benin|dahomey|oyo|ogun|jos|niger delta|ghana|ashanti|asante|akan|volta|senegal|senegambia|gambia|mali|jenne|timbuktu|guinea|sierra leone|liberia|mende|ivory coast|togo|hausa|kano|sokoto|bornu|cameroon|sahel)\b/,
    markers: /\b(senator wear|agbada|babban riga|dashiki|kente|gele|aso oke|adire|fila|buba|iro|boubou|kaba|dansiki)\b/i,
  },
  {
    id: 'culture-great-lakes',
    label: 'Great Lakes and Congo basin',
    zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    yearRange: [-1000, 2100],
    places: /\b(rwanda|burundi|buganda|uganda|bunyoro|ankole|kivu|congo|kongo|luba|lunda|kuba|tanganyika|nyanza|victoria|virunga|great lakes)\b/,
    markers: /\b(mushanana|imigongo|bark ?cloth|raffia pile|kuba cloth)\b/i,
  },
  {
    id: 'culture-southern-africa',
    label: 'Southern African',
    zones: ['SUB_SAHARAN_AFRICAN' as CulturalZone],
    yearRange: [-1000, 2100],
    places: /\b(zulu|xhosa|sotho|tswana|swazi|ndebele|natal|transvaal|drakensberg|highveld|cape|karoo|orange river|limpopo|zambezi|zimbabwe|kalahari|namib|okavango|herero|himba|kaokoveld|damaraland)\b/,
    markers: /\b(isicholo|umqhele|shweshwe|kaross|karross|otjize|herero dress|basotho blanket)\b/i,
  },
];

const normalize = (value: string | undefined): string =>
  (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * The culture this persona belongs to, or null when the zone has no meaningful
 * internal division declared, or the place is not one we can place.
 *
 * Returning null is a normal outcome and means "no constraint" — callers must
 * treat it as permissive, never as a rejection.
 */
export function resolveCulture(
  zone: CulturalZone,
  year: number,
  region?: string,
  location?: string,
): CultureWindow | null {
  const place = `${normalize(location)} ${normalize(region)}`;
  if (!place.trim()) return null;
  return CULTURE_WINDOWS.find(w =>
    w.zones.includes(zone)
    && year >= w.yearRange[0]
    && year <= w.yearRange[1]
    && w.places
    && w.places.test(place)
  ) ?? null;
}

/**
 * Does this piece of content belong to this culture?
 *
 * Only a sibling's exclusive marker rejects. Unmarked content — a hemp robe,
 * straw sandals, a merchant guild — is shared and always passes.
 */
export function belongsToCulture(text: string, culture: CultureWindow | null): boolean {
  if (!culture || !text) return true;
  for (const sibling of CULTURE_WINDOWS) {
    if (sibling.id === culture.id) continue;
    // Only siblings *within the same zone* compete. A Japanese marker says
    // nothing about whether a European item is misplaced.
    if (!sibling.zones.some(z => culture.zones.includes(z))) continue;
    if (sibling.markers && sibling.markers.test(text)) return false;
  }
  return true;
}

/**
 * Filter a candidate list to what belongs here.
 *
 * By default an empty result falls back to the original list, on the principle
 * that a half-right answer beats no answer. That is the wrong trade when the
 * *whole* list belongs to one sibling culture — the medieval `EAST_ASIAN` poor
 * headgear table offers a sugegasa and a zukin and nothing else, so falling
 * back hands a Formosan highlander the same Japanese hat the filter just
 * rejected. Callers that have a culture-neutral default of their own should
 * pass `allowEmpty` and supply it.
 */
export function filterByCulture<T>(
  items: readonly T[],
  describe: (item: T) => string,
  culture: CultureWindow | null,
  options: { allowEmpty?: boolean } = {},
): T[] {
  if (!culture || items.length === 0) return [...items];
  const kept = items.filter(item => belongsToCulture(describe(item), culture));
  if (kept.length > 0) return kept;
  return options.allowEmpty ? [] : [...items];
}
