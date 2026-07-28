/**
 * constants/gameData/crops.ts
 *
 * What a farmer here actually grew.
 *
 * The starting packages name crops as fixed item ids, and the 'Farmer' package
 * names barley and wheat. Those are Old World grasses domesticated in the
 * Fertile Crescent, so the package handed barley, wheat, a threshing flail and
 * a cow to a forager in the Glacier Foothills in 285 CE, to a Bronze Age farmer
 * on the Sulu Sea, and to a Tupi-speaking farmer outside São Paulo in 1681. Not
 * one of those people could have had any of it: wheat, barley and cattle did
 * not reach the Americas until after 1492, and the Philippines grew rice, taro
 * and millet.
 *
 * This is the crop equivalent of the Old World animal guard that already sits
 * in `inventoryUtils`. A crop is checked against where and when it could be
 * grown, and an impossible one is replaced by a staple of the actual place.
 *
 * Dates are conservative. Where a crop spread by trade or conquest, the date is
 * when it reached *that region* in quantity, not when it was first domesticated
 * — maize is a Mesoamerican plant from about 7000 BCE but is not a staple in the
 * eastern woodlands until around 900 CE, and putting it in a Hopewell field is
 * as wrong as putting wheat there.
 */

/** Where a crop could be grown, and from when. */
interface CropOrigin {
  /** Places it belongs. Everywhere else needs `spreadTo` to allow it. */
  home: RegExp;
  /** Places it later reached, with the year it arrived in quantity. */
  spreadTo?: Array<{ places: RegExp; from: number }>;
  /** Earliest cultivation anywhere. */
  from: number;
}

/** The whole eastern hemisphere, for judging what could cross to the Americas. */
const OLD_WORLD = /europe|mediterran|balkan|iberia|britain|british|scandinav|baltic|russia|slav|steppe|anatolia|levant|mesopotam|arabia|persia|iran|egypt|nile|maghreb|africa|sahel|sudan|ethiop|horn|congo|guinea|niger|zambe|kalahari|india|indus|ganges|deccan|tamil|bengal|punjab|china|yellow river|yangtze|manchuria|korea|japan|mongol|tibet|altai|siberia|asia|indochina|siam|thai|burma|malay|java|sumatra|borneo|philippin|sulu|luzon|visayas|celebes|moluc/i;

/**
 * Where the Fertile Crescent cereals actually grow. Not the same as the Old
 * World: wheat and barley are temperate dryland grasses and were never staples
 * of the equatorial forest, island Southeast Asia or the Pacific. Using
 * `OLD_WORLD` for their home made wheat plausible on the Sulu Sea.
 */
const WHEAT_BELT = /europe|mediterran|balkan|iberia|britain|british|scandinav|baltic|russia|slav|ukrain|steppe|caucasus|anatolia|levant|mesopotam|arabia|persia|iran|khorasan|transoxiana|egypt|nile|maghreb|ifriqiya|ethiop|abyssin|indus|punjab|rajasthan|gujarat|thar|gangetic|north china|yellow river|hebei|shandong|loess|manchuria|tibet|himalaya|tarim|dzungar/i;

const AMERICAS = /america|mexico|maya|yucatan|oaxaca|guatemala|andes|peru|bolivia|cusco|altiplano|amazon|orinoco|patagonia|chaco|pampas|brazil|caribbean|antill|plains|woodland|mississippi|great basin|rockies|california|southwest|puebloan|arctic|subarctic|atlantic coast|northeast|southeast|pacific coast|northwest|chesapeake|new england/i;

const OCEANIA = /polynesi|melanesi|micronesi|hawai|tahiti|samoa|tonga|fiji|aotearoa|new zealand|australia|arnhem|papua|new guinea|solomon|vanuatu|marquesas|rapa nui|easter island/i;

/**
 * Only crops the packages actually name, plus the staples needed to replace
 * them. This is not a catalogue of world agriculture.
 */
const CROP_ORIGINS: Record<string, CropOrigin> = {
  // --- Old World cereals -------------------------------------------------
  WHEAT: { home: WHEAT_BELT, from: -9000, spreadTo: [{ places: AMERICAS, from: 1520 }, { places: OCEANIA, from: 1790 }] },
  WHEAT_SEEDS: { home: WHEAT_BELT, from: -9000, spreadTo: [{ places: AMERICAS, from: 1520 }, { places: OCEANIA, from: 1790 }] },
  BARLEY: { home: WHEAT_BELT, from: -9000, spreadTo: [{ places: AMERICAS, from: 1520 }, { places: OCEANIA, from: 1790 }] },
  RYE_FLOUR: { home: /europe|russia|slav|baltic|scandinav|anatolia/i, from: -1000, spreadTo: [{ places: AMERICAS, from: 1600 }] },
  MILLET: { home: /china|yellow river|korea|manchuria|india|deccan|sahel|sudan|africa|niger|ethiop|steppe|mongol/i, from: -6000 },
  RICE: {
    home: /china|yangtze|south china|india|ganges|bengal|deccan|tamil|indochina|siam|thai|burma|vietnam|malay|java|sumatra|borneo|philippin|sulu|luzon|visayas|celebes|japan|korea|moluc/i,
    from: -6000,
    spreadTo: [
      { places: /levant|mesopotam|persia|iran|egypt|nile|mediterran|iberia|italy/i, from: -300 },
      { places: /guinea|senegal|gambia|sierra leone|niger|west africa/i, from: -1500 },
      { places: /carolina|low ?country|louisiana|brazil|caribbean|antill/i, from: 1690 },
    ],
  },
  SOYBEANS: { home: /china|manchuria|korea|japan|yellow river|yangtze/i, from: -1100 },

  // --- The Americas ------------------------------------------------------
  MAIZE: {
    home: /mexico|maya|yucatan|oaxaca|guatemala|central highlands|mesoameric/i,
    from: -7000,
    spreadTo: [
      { places: /southwest|puebloan|sonora|arizona|new mexico|colorado plateau|rio grande/i, from: -2100 },
      { places: /andes|peru|bolivia|amazon|orinoco|brazil|caribbean|antill|chaco/i, from: -3000 },
      { places: /woodland|mississippi|northeast|southeast|great lakes|ohio|atlantic coast|new england|chesapeake|plains/i, from: 900 },
      { places: OLD_WORLD, from: 1550 },
    ],
  },
  CORN: {
    home: /mexico|maya|yucatan|oaxaca|guatemala|central highlands|mesoameric/i,
    from: -7000,
    spreadTo: [
      { places: /southwest|puebloan|sonora|arizona|new mexico|colorado plateau|rio grande/i, from: -2100 },
      { places: /andes|peru|bolivia|amazon|orinoco|brazil|caribbean|antill|chaco/i, from: -3000 },
      { places: /woodland|mississippi|northeast|southeast|great lakes|ohio|atlantic coast|new england|chesapeake|plains/i, from: 900 },
      { places: OLD_WORLD, from: 1550 },
    ],
  },
  BEANS: { home: AMERICAS, from: -5000, spreadTo: [{ places: OLD_WORLD, from: 1550 }] },
  SQUASH: { home: AMERICAS, from: -8000, spreadTo: [{ places: OLD_WORLD, from: 1550 }] },
  POTATO: { home: /andes|peru|bolivia|altiplano|titicaca|cusco|chile/i, from: -6000, spreadTo: [{ places: OLD_WORLD, from: 1570 }] },
  QUINOA: { home: /andes|peru|bolivia|altiplano|titicaca|cusco/i, from: -3000 },
  CASSAVA: { home: /amazon|orinoco|brazil|guiana|caribbean|antill|chaco|llanos/i, from: -6000, spreadTo: [{ places: /africa|congo|guinea|niger|angola|kongo/i, from: 1600 }] },
  SWEET_POTATO: {
    home: /andes|peru|amazon|caribbean|antill|central america/i,
    from: -6000,
    // The sweet potato reached Polynesia long before Europeans did; how is
    // still argued, that it did is not.
    spreadTo: [{ places: OCEANIA, from: 1000 }, { places: /china|japan|philippin|malay|java/i, from: 1590 }],
  },
  WILD_RICE: { home: /great lakes|woodland|minnesota|wisconsin|northeast|mississippi/i, from: -2000 },
  ACORNS: { home: /california|great basin|sierra nevada|central valley|pacific coast|mediterran|iberia/i, from: -8000 },

  // --- Africa ------------------------------------------------------------
  SORGHUM: { home: /sahel|sudan|africa|niger|chad|ethiop|nile|savanna|congo|zambe/i, from: -4000, spreadTo: [{ places: /india|deccan|arabia/i, from: -1500 }] },
  TEFF: { home: /ethiop|abyssin|tigray|amhara|horn/i, from: -3000 },
  YAM: { home: /guinea|niger|west africa|nigeria|ghana|ivory coast|congo|forest|indochina|malay|philippin|papua|new guinea|melanesi|polynesi/i, from: -3000 },

  // --- Island Southeast Asia and the Pacific -----------------------------
  TARO: { home: /papua|new guinea|melanesi|polynesi|micronesi|hawai|malay|java|sumatra|borneo|philippin|sulu|luzon|visayas|celebes|moluc|indochina|japan|india/i, from: -6000 },
  SAGO: { home: /papua|new guinea|moluc|sulawesi|celebes|borneo|sumatra|malay|philippin|sulu|melanesi/i, from: -4000 },
  BANANA: { home: /papua|new guinea|malay|java|sumatra|borneo|philippin|indochina|india|melanesi|polynesi/i, from: -5000, spreadTo: [{ places: /africa|congo|guinea|zambe|swahili|madagascar/i, from: -400 }] },
  BREADFRUIT: { home: /polynesi|melanesi|micronesi|hawai|tahiti|samoa|tonga|fiji|marquesas|new guinea/i, from: -1500 },
};

export interface CropContext {
  region?: string;
  location?: string;
  year: number;
}

const placeOf = (ctx: CropContext): string => `${ctx.location ?? ''} ${ctx.region ?? ''}`;

/** Could this crop be grown here, now? Unknown ids are left alone. */
export function isCropPlausible(cropId: string, ctx: CropContext): boolean {
  const origin = CROP_ORIGINS[cropId];
  if (!origin) return true;
  const place = placeOf(ctx);
  if (!place.trim()) return true;
  if (origin.home.test(place)) return ctx.year >= origin.from;
  for (const spread of origin.spreadTo ?? []) {
    if (spread.places.test(place)) return ctx.year >= spread.from;
  }
  return false;
}

/**
 * What people here grew, best first. Used to replace an impossible crop and to
 * fill a farmer's stores.
 */
const STAPLES: Array<{ places: RegExp; crops: string[] }> = [
  // The Americas, before and after contact alike — the Columbian crops did not
  // stop being grown when wheat arrived.
  { places: /mexico|maya|yucatan|oaxaca|guatemala|central highlands|mesoameric|belize|honduras/i, crops: ['MAIZE', 'BEANS', 'SQUASH'] },
  { places: /andes|peru|bolivia|altiplano|titicaca|cusco|cuzco|quito|ecuador|potosi/i, crops: ['POTATO', 'QUINOA', 'MAIZE'] },
  { places: /amazon|orinoco|xingu|rio negro|ucayali|guiana|mato grosso|llanos|rainforest/i, crops: ['CASSAVA', 'SWEET_POTATO', 'MAIZE'] },
  { places: /brazil|são paulo|sao paulo|bahia|pernambuco|recôncavo|reconcavo|espírito santo|rio de janeiro/i, crops: ['CASSAVA', 'MAIZE', 'BEANS'] },
  { places: /southwest|puebloan|sonora|arizona|new mexico|colorado plateau|rio grande/i, crops: ['MAIZE', 'BEANS', 'SQUASH'] },
  { places: /woodland|mississippi|northeast|southeast|great lakes|ohio|atlantic coast|new england|chesapeake|appalach|florida|carolina/i, crops: ['MAIZE', 'BEANS', 'SQUASH'] },
  { places: /california|central valley|sierra nevada|great basin|nevada|utah|mojave/i, crops: ['ACORNS'] },
  { places: /caribbean|antill|taino|hispaniola|cuba|jamaica/i, crops: ['CASSAVA', 'MAIZE', 'SWEET_POTATO'] },
  { places: /chaco|pampas|plata|paraná|parana|uruguay/i, crops: ['MAIZE', 'SQUASH'] },

  // Island Southeast Asia and the Pacific.
  { places: /philippin|sulu|luzon|visayas|mindanao|celebes|sulawesi|moluc|borneo|java|sumatra|malay|maritime southeast/i, crops: ['RICE', 'TARO', 'YAM'] },
  { places: /papua|new guinea|sepik|melanesi|solomon|vanuatu|bismarck/i, crops: ['TARO', 'YAM', 'BANANA'] },
  { places: /polynesi|micronesi|hawai|tahiti|samoa|tonga|fiji|marquesas|aotearoa|new zealand|rapa nui|easter island|cook island/i, crops: ['TARO', 'BREADFRUIT', 'SWEET_POTATO'] },

  // Asia.
  { places: /indochina|siam|thai|burma|vietnam|annam|mekong|khmer|angkor|laos|mainland southeast/i, crops: ['RICE', 'TARO'] },
  { places: /south china|yangtze|pearl river|fujian|guangdong|guangxi|sichuan|japan|korea|taiwan|ryukyu/i, crops: ['RICE', 'SOYBEANS'] },
  { places: /north china|yellow river|hebei|shandong|loess|beijing|manchuria/i, crops: ['MILLET', 'SOYBEANS', 'WHEAT'] },
  { places: /mongol|steppe|altai|dzungar|tarim|gobi|siberia/i, crops: ['MILLET', 'BARLEY'] },
  { places: /tibet|himalaya|lhasa|kham|amdo/i, crops: ['BARLEY'] },
  { places: /bengal|ganges|tamil|deccan|kerala|malabar|coromandel|sri lanka|ceylon/i, crops: ['RICE', 'MILLET'] },
  { places: /indus|punjab|thar|sindh|rajasthan|gujarat|central india|narmada/i, crops: ['WHEAT', 'MILLET', 'BARLEY'] },

  // Africa.
  { places: /ethiop|abyssin|tigray|amhara|gondar|horn/i, crops: ['TEFF', 'SORGHUM', 'BARLEY'] },
  { places: /guinea|niger delta|nigeria|ghana|ivory coast|benin|dahomey|yoruba|igbo|akan|west african forest|lower guinea|congo|kongo|gabon|cameroon/i, crops: ['YAM', 'SORGHUM', 'BANANA'] },
  { places: /sahel|western sudan|niger bend|timbuktu|gao|mali|songhai|hausa|kanem|bornu|chad|senegal|gambia/i, crops: ['SORGHUM', 'MILLET'] },
  { places: /swahili|zanzibar|kilwa|mombasa|east african|great lakes of africa|kenya|tanzania|uganda/i, crops: ['SORGHUM', 'BANANA', 'MILLET'] },
  { places: /zambe|zimbabwe|kalahari|southern africa|natal|cape|limpopo/i, crops: ['SORGHUM', 'MILLET'] },
  { places: /madagascar|malagasy|merina/i, crops: ['RICE', 'TARO'] },
  { places: /nile|egypt|thebes|fayum|delta|nubia|sudan/i, crops: ['WHEAT', 'BARLEY'] },

  // The Old World grain belt, which is where the package's defaults were right.
  { places: /europe|mediterran|balkan|iberia|britain|british|scandinav|baltic|russia|slav|anatolia|levant|mesopotam|arabia|persia|iran|maghreb|caucasus/i, crops: ['WHEAT', 'BARLEY'] },
];

/** The staples of this place, best first. Falls back to wheat and barley. */
export function stapleCropsFor(ctx: CropContext): string[] {
  const place = placeOf(ctx);
  for (const entry of STAPLES) {
    if (entry.places.test(place)) {
      const usable = entry.crops.filter(crop => isCropPlausible(crop, ctx));
      if (usable.length > 0) return usable;
    }
  }
  return ['WHEAT', 'BARLEY'].filter(crop => isCropPlausible(crop, ctx));
}

/**
 * Rewrite the crops in a starting package to the staples of the actual place.
 *
 * Replacing only the *impossible* ones is not enough. Wheat was grown in
 * colonial Brazil and in Han China, so an impossibility test leaves a
 * Tupi-speaking peasant outside São Paulo storing wheat and barley and a
 * Shang-dynasty farmer doing the same, when the first grew cassava and maize
 * and the second grew millet. What a package means by 'BARLEY' is "the grain
 * this person lives on", so it is resolved to that grain rather than checked.
 *
 * A crop already in the local staple list is kept as listed. Anything that is
 * not a crop passes through untouched.
 */
export function localiseCrops(itemIds: string[], ctx: CropContext): string[] {
  const staples = stapleCropsFor(ctx);
  // Nowhere to put them: a place with no staple is a place with no farming, so
  // the crops are dropped rather than swapped for something arbitrary.
  if (staples.length === 0) return itemIds.filter(id => !(id in CROP_ORIGINS));

  const used = new Set<string>();
  let next = 0;
  const nextStaple = (): string => {
    for (let i = 0; i < staples.length; i += 1) {
      const candidate = staples[(next + i) % staples.length];
      if (!used.has(candidate)) { next = (next + i + 1) % staples.length; used.add(candidate); return candidate; }
    }
    return staples[next % staples.length];
  };

  return itemIds.map(id => {
    if (!(id in CROP_ORIGINS)) return id;
    if (staples.includes(id) && !used.has(id)) { used.add(id); return id; }
    return nextStaple();
  });
}

/**
 * Threshing gear belongs with a dry cereal you beat the grain out of. A taro
 * or cassava grower has no use for a flail, and neither does a rice farmer,
 * who threshes by treading or against a board.
 */
const FLAIL_CROPS = new Set(['WHEAT', 'BARLEY', 'RYE_FLOUR', 'MILLET', 'SORGHUM', 'TEFF']);

export function flailIsUseful(crops: string[]): boolean {
  return crops.some(crop => FLAIL_CROPS.has(crop));
}
