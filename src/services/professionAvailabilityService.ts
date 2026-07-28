import type { HistoricalContext } from '../types/historicalContext';
import type { CulturalZone } from '../types/characterData';
import { hasCapability } from '../constants/societyCapabilities';

interface ProfessionAvailabilityRule {
  pattern: RegExp;
  startYear?: number;
  endYear?: number;
  requiredTechnology?: string;
  requiredInstitution?: string;
  /** Only where the place matches. A trade tied to a crop or an animal. */
  places?: RegExp;
  /** Absent where the place matches, until `excludedUntil` if given. */
  excludePlaces?: RegExp;
  /** The year the trade reaches the excluded places. Omit for never. */
  excludedUntil?: number;
  /** Restrict the rule to these zones. */
  zones?: string[];
}

const PROFESSION_AVAILABILITY_RULES: ProfessionAvailabilityRule[] = [
  // Deep prehistory. Most of the profession tables assume settled agriculture
  // and craft specialisation, neither of which existed for the overwhelming
  // majority of the human past — the first pass at reaching back before the
  // Neolithic produced weavers in 28,000 BCE and rice farmers in the
  // Palaeolithic. Dates are conservative earliest-evidence estimates.
  { pattern: /\b(?:farmer|farmhand|farm worker|field hand|agricultur\w*|peasant|cultivator|planter|harvester|ploughman|plowman|orchardist|gardener)\b/i, startYear: -10000 },
  { pattern: /\b(?:herder|shepherd|cowherd|goatherd|swineherd|pastoralist|drover|dairy\w*)\b/i, startYear: -9000 },
  { pattern: /\b(?:weaver|spinner|dyer|tailor|seamstress|clothier|fuller)\b/i, startYear: -6000 },
  { pattern: /\b(?:potter|kiln\w*)\b/i, startYear: -16000 },
  { pattern: /\b(?:smith|blacksmith|metalworker|founder|jeweler|jeweller|goldsmith|silversmith)\b/i, startYear: -4500 },
  { pattern: /\b(?:scribe|clerk|accountant|archivist|librarian)\b/i, startYear: -3300 },
  { pattern: /\b(?:baker|miller|brewer|maltster)\b/i, startYear: -8000 },
  { pattern: /\b(?:merchant|trader|shopkeeper|innkeeper|moneylender|banker)\b/i, startYear: -6000 },
  { pattern: /\b(?:sailor|shipwright|ferryman|navigator)\b/i, startYear: -6000 },
  { pattern: /\b(?:mason|carpenter|builder|architect|bricklayer)\b/i, startYear: -9000 },
  { pattern: /\b(?:soldier|guard|mercenary|officer|knight)\b/i, startYear: -5000 },
  { pattern: /\b(?:servant|maid|butler|steward|houseboy)\b/i, startYear: -8000 },

  // Trades tied to a plant or an animal that has to be there.
  //
  // Removing farming from the forager regions exposed what was underneath it:
  // a persona in the Glacier Foothills in 285 CE came back as a Chinampero, a
  // Cacao Grower and a Tribute Collector — Aztec occupations, in Montana,
  // twelve hundred years early — and the commonest jobs on the Baffin coast
  // were Shepherd and Herder in a hemisphere with no herd animals to speak of.
  {
    // Herding livestock needs livestock. The Americas had domestic camelids in
    // the Andes and nothing else; cattle, sheep, goats and pigs arrived with
    // the Spanish. Hunting, fishing and foraging are untouched by this.
    pattern: /\b(?:shepherd|goatherd|cowherd|swineherd|drover|dairy\w*|stockman|cattle\w*)\b/i,
    excludePlaces: /\b(?:arctic|subarctic|baffin|greenland|inuit|thule|aleut|great basin|northern rockies|columbia plateau|pacific coast|northwest|puget|salish|california|central valley|great plains|prairie|woodland|great lakes|mississippi|northeast|southeast|chesapeake|new england|amazon|orinoco|guiana|chaco|patagonia|tierra del fuego|southwest|puebloan|colorado plateau|rio grande|sonora|arizona|new mexico|mexico|maya|yucatan|oaxaca)\b/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'],
    excludedUntil: 1600,
  },
  {
    // A generic "herder" is fine in the Andes, where llamas and alpacas were
    // herded from the fourth millennium BCE.
    pattern: /\bherder\b/i,
    excludePlaces: /\b(?:arctic|subarctic|baffin|greenland|great basin|northern rockies|columbia plateau|pacific coast|northwest|puget|california|central valley|woodland|great lakes|mississippi|northeast|chesapeake|new england|amazon|orinoco|guiana)\b/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'],
    excludedUntil: 1600,
  },
  {
    // Australia had no domestic animal but the dingo, and no herding of any
    // kind before the First Fleet. A shepherd in Arnhem Land in 1200 was as
    // wrong as the Baffin Island one.
    pattern: /\b(?:shepherd|goatherd|cowherd|swineherd|drover|dairy\w*|stockman|cattle\w*|herder|jackaroo|jillaroo|station\b)\b/i,
    excludePlaces: /\b(?:australia|arnhem|outback|kimberley|tasmania|nullarbor|queensland|murray|carpentaria|aboriginal|desert)\b/i,
    zones: ['OCEANIA'],
    excludedUntil: 1788,
  },
  {
    // The Pacific islands had pigs, dogs and chickens carried in the canoes —
    // and no grazing stock at all, so there was nothing to shepherd or drove.
    // Pig keeping is a real Melanesian and Polynesian occupation and is not
    // matched here.
    pattern: /\b(?:shepherd|goatherd|cowherd|drover|dairy\w*|stockman|cattle\w*|herder)\b/i,
    excludePlaces: /\b(?:polynesi|melanesi|micronesi|hawai|tahiti|samoa|tonga|fiji|aotearoa|new zealand|rapa nui|easter island|marquesas|vanuatu|solomon|papua|new guinea|island|atoll|lagoon)\b/i,
    zones: ['OCEANIA'],
    excludedUntil: 1800,
  },
  {
    // Mesoamerican institutions and crops. Chinampas are the raised fields of
    // the Valley of Mexico; cacao is a lowland tropical tree.
    pattern: /\b(?:chinampero|chinampa|cacao|cocoa|tribute collector|pochteca|calpixqui|nahual|curandero|codex painter|obsidian knapper|featherworker|jade carver|ball court player|ticitl|herbatero|sobador)\b/i,
    places: /\b(?:mexico|maya|yucatan|oaxaca|guatemala|chiapas|belize|honduras|central highlands|mesoameric|tenochtitlan|teotihuacan|veracruz|isthmus|central america|caribbean|antill)\b/i,
  },
  // North American culture areas. Now that the `Woodlands` and `Plains` blocks
  // are reachable at all, they need pinning to the ground they describe, or the
  // Baffin coast fills up with buffalo hunters and wampum makers.
  {
    pattern: /\b(?:buffalo|bison|pemmican|tipi|travois|horse trainer)\b/i,
    places: /\b(?:great plains|plains|prairie|dakota|nebraska|llano|missouri|platte|comanche|blackfoot|great basin|rockies|texas)\b/i,
  },
  {
    // Wampum is Atlantic quahog and whelk shell; maple sugar needs sugar maples;
    // birchbark canoes need paper birch. All three are eastern woodland.
    pattern: /\b(?:wampum|maple (?:sugar|syrup)|birchbark|birch bark|longhouse|clan mother)\b/i,
    places: /\b(?:woodland|northeast|great lakes|mississippi|ohio|atlantic coast|new england|chesapeake|southeast|appalach|hudson|st lawrence|saint lawrence|iroquo|algonqu|canada|ontario|quebec)\b/i,
  },
  {
    // Turquoise is a Southwestern stone.
    pattern: /\bturquoise\b/i,
    places: /\b(?:southwest|puebloan|colorado plateau|rio grande|sonora|arizona|new mexico|mexico|cerrillos|chaco canyon)\b/i,
  },
  {
    // Arctic and subarctic work.
    pattern: /\b(?:umiak|kayak|harpoon|sealer|whaler|dog ?sled|igloo|caribou)\b/i,
    places: /\b(?:arctic|subarctic|baffin|greenland|labrador|alaska|yukon|inuit|thule|aleut|yupik|bering|hudson bay|tundra)\b/i,
  },
  {
    // Acorn meal is the Californian and Great Basin staple; shellfish middens
    // and tidal weirs belong on a coast.
    pattern: /\bacorn\w*\b/i,
    places: /\b(?:california|central valley|sierra nevada|great basin|nevada|utah|mojave|pacific coast|oregon|mediterran|iberia)\b/i,
  },
  {
    // Fishing needs water. The dry interior plateaus and deserts had some, but
    // not enough to make fisher the commonest occupation, which it became once
    // farming was removed from the regions that never had it.
    pattern: /\b(?:fisher|fisherman|salmon fisher|whaler|sealer)\b/i,
    excludePlaces: /\b(?:colorado plateau|mojave|sonora|llano|high desert|painted desert|canyonlands|absaroka|yellowstone basin|gobi|taklamakan|rub al khali|empty quarter|kalahari|namib|atacama)\b/i,
  },
  {
    pattern: /\b(?:shellfish gatherer|fish weir builder)\b/i,
    places: /\b(?:coast|sound|bay|harbor|harbour|estuary|delta|island|shore|sea|puget|salish|fraser|chesapeake|atlantic|pacific|arctic|baffin|labrador|gulf|lagoon|strait|inlet|fjord|river)\b/i,
  },
  {
    // Andean institutions.
    pattern: /\b(?:quipu|khipu|chasqui|mit'?a|ayllu|coca (?:grower|picker)|llama\w*|alpaca\w*|vicu[ñn]a\w*)\b/i,
    places: /\b(?:andes|peru|bolivia|cusco|cuzco|altiplano|titicaca|quito|ecuador|potosi|atacama|sierra|highland|chile)\b/i,
  },

  { pattern: /\bfactory worker\b/i, startYear: 1760, requiredTechnology: 'mechanized_production' },
  { pattern: /\bindustrialist\b/i, startYear: 1760, requiredTechnology: 'mechanized_production' },
  { pattern: /\brail(?:road|way)|station master\b/i, startYear: 1830, requiredTechnology: 'railway' },
  { pattern: /\btelegraph/i, startYear: 1840, requiredTechnology: 'telegraph' },
  { pattern: /\btelephone operator\b/i, startYear: 1878, requiredTechnology: 'telephone' },
  { pattern: /\bautomobile|auto mechanic\b/i, startYear: 1885, requiredTechnology: 'automobile' },
  { pattern: /\btruck driver\b/i, startYear: 1900, requiredTechnology: 'motor_transport' },
  { pattern: /\bgas station attendant\b/i, startYear: 1905, requiredTechnology: 'motor_transport' },
  { pattern: /\bradio (?:operator|announcer|engineer)\b/i, startYear: 1920, requiredTechnology: 'broadcast_radio' },
  { pattern: /\btelevision\b/i, startYear: 1930, requiredTechnology: 'television' },
  { pattern: /\bcomputer|software|programmer\b/i, startYear: 1940, requiredTechnology: 'electronic_computing' },
  { pattern: /\bparty secretary\b/i, startYear: 1900 },
  { pattern: /\boffice manager\b/i, startYear: 1850 },
  { pattern: /\buniversity professor\b/i, startYear: 1080 },
  { pattern: /\bluddite\b/i, startYear: 1811, endYear: 1817 },
  { pattern: /\bchartist\b/i, startYear: 1838, endYear: 1857 },
  { pattern: /\bresurrectionist\b/i, startYear: 1790, endYear: 1832 },
  { pattern: /\bfenian\b/i, startYear: 1858, endYear: 1924 },

  // The late twentieth century and after.
  //
  // The modern profession tables were written as one "1900-2019" block and only
  // some entries carry a `decadeRange`, so everything without one was available
  // from 1900. That is how a student generating 1920s California met a content
  // creator. Occupations that depend on a technology, an industry or a legal
  // regime that did not exist yet are dated here instead, which covers every
  // cultural zone at once rather than one table entry at a time.
  { pattern: /\b(?:content creator|influencer|streamer|youtuber|podcaster|social media \w+)\b/i, startYear: 2005 },
  { pattern: /\b(?:web|app|software) (?:developer|designer|engineer)\b/i, startYear: 1995 },
  { pattern: /\bsoftware (?:developer|engineer)\b/i, startYear: 1975 },
  { pattern: /\b(?:cybercriminal|hacker|phisher)\b/i, startYear: 1985 },
  { pattern: /\b(?:crypto|cryptocurrency|bitcoin|nft)\b/i, startYear: 2009 },
  { pattern: /\btech (?:ceo|entrepreneur|founder)\b/i, startYear: 1975 },
  { pattern: /\b(?:call center|customer service rep)\b/i, startYear: 1970 },
  { pattern: /\bbarista\b/i, startYear: 1985 },
  { pattern: /\bfast food worker\b/i, startYear: 1950 },
  { pattern: /\b(?:uber|rideshare) driver\b/i, startYear: 2010 },
  { pattern: /\bdelivery driver\b/i, startYear: 1930 },
  { pattern: /\bpersonal trainer\b/i, startYear: 1970 },
  { pattern: /\b(?:physical therapist|dental hygienist)\b/i, startYear: 1920 },
  { pattern: /\bmarketing manager\b/i, startYear: 1950 },
  { pattern: /\bclimate activist\b/i, startYear: 1990 },
  { pattern: /\bfentanyl dealer\b/i, startYear: 1995 },
  { pattern: /\bhuman trafficker\b/i, startYear: 1900 },
  { pattern: /\bsurf instructor\b/i, startYear: 1960 },
  { pattern: /\belectronics factory worker\b/i, startYear: 1960 },
  { pattern: /\binvestment banker\b/i, startYear: 1930 },
  { pattern: /\breal estate agent\b/i, startYear: 1900 },
  { pattern: /\bfilm director\b/i, startYear: 1910 },
  { pattern: /\bhollywood producer\b/i, startYear: 1915 },
  { pattern: /\bbollywood producer\b/i, startYear: 1935 },
  { pattern: /\bjazz musician\b/i, startYear: 1917 },
  { pattern: /\bcivil rights organizer\b/i, startYear: 1940 },
  { pattern: /\b(?:oil field worker|oil minister)\b/i, startYear: 1900 },
  { pattern: /\buranium miner\b/i, startYear: 1942 },
  { pattern: /\bsalaryman|office lady\b/i, startYear: 1950 },
  { pattern: /\bchaebol chairman\b/i, startYear: 1960 },
  { pattern: /\bcasino owner\b/i, startYear: 1930 },
  { pattern: /\bfirefighter\b/i, startYear: 1850 },

  // Colonial institutions in the Americas, which have dates.
  { pattern: /\bencomendero\b/i, startYear: 1503, endYear: 1720 },
  { pattern: /\b(?:conquistador)\b/i, startYear: 1492, endYear: 1600 },
  { pattern: /\b(?:spanish viceroy|viceroy)\b/i, startYear: 1535 },
  { pattern: /\b(?:hacienda owner|hacendado)\b/i, startYear: 1550 },
  { pattern: /\b(?:mission|missionary|mission school teacher)\b/i, startYear: 1520 },
  { pattern: /\b(?:sharecropper)\b/i, startYear: 1865 },
  { pattern: /\bcolonial administrator\b/i, startYear: 1500 },
  { pattern: /\bbureau of indian affairs agent\b/i, startYear: 1824 },
  { pattern: /\breservation rancher\b/i, startYear: 1870 },

  // Bounded events. These read as professions in the tables but are moments.
  { pattern: /\bprohibition gangster\b/i, startYear: 1920, endYear: 1933 },
  { pattern: /\bair raid warden\b/i, startYear: 1938, endYear: 1946 },
  { pattern: /\b(?:trench soldier|munitions worker)\b/i, startYear: 1914, endYear: 1945 },
  { pattern: /\bbletchley codebreaker\b/i, startYear: 1939, endYear: 1946 },
  { pattern: /\b(?:kamikaze pilot|navajo code talker|comfort woman|imperial japanese soldier)\b/i, startYear: 1937, endYear: 1945 },
  { pattern: /\bred guard\b/i, startYear: 1966, endYear: 1976 },
  { pattern: /\btiananmen protester\b/i, startYear: 1989, endYear: 1990 },
  { pattern: /\bmau mau fighter\b/i, startYear: 1952, endYear: 1960 },
  { pattern: /\bsandinista\b/i, startYear: 1961, endYear: 1990 },
  { pattern: /\bzapatista\b/i, startYear: 1994 },
  { pattern: /\bfarc guerrilla\b/i, startYear: 1964, endYear: 2017 },
  { pattern: /\btamil tiger\b/i, startYear: 1976, endYear: 2009 },
  { pattern: /\biranian revolutionary\b/i, startYear: 1977, endYear: 1981 },
  { pattern: /\bplo fighter\b/i, startYear: 1964 },
  { pattern: /\bira member\b/i, startYear: 1919 },
  { pattern: /\bred brigade\b/i, startYear: 1970, endYear: 1988 },
  { pattern: /\bblack panther\b/i, startYear: 1966, endYear: 1982 },
  { pattern: /\baim activist\b/i, startYear: 1968 },
  { pattern: /\banc activist\b/i, startYear: 1912 },
  { pattern: /\bstanding rock protector\b/i, startYear: 2016 },
  { pattern: /\bnaxalite\b/i, startYear: 1967 },
  { pattern: /\byoung turk\b/i, startYear: 1889, endYear: 1922 },
  { pattern: /\bpla soldier\b/i, startYear: 1927 },
  { pattern: /\bweatherman\b/i, startYear: 1969, endYear: 1977 },
  { pattern: /\bmoonshiner\b/i, startYear: 1790 },
  { pattern: /\bpullman porter\b/i, startYear: 1867, endYear: 1969 },
  { pattern: /\bblood diamond smuggler\b/i, startYear: 1990 },
  { pattern: /\bbarefoot doctor\b/i, startYear: 1965, endYear: 1985 },
  { pattern: /\bcommune worker\b/i, startYear: 1958, endYear: 1983 },
];

/**
 * Work that only exists where crops are sown and reaped. Herding, fishing,
 * foraging and hunting are deliberately not here: those are how most of the
 * places below actually fed themselves, and they must stay available.
 */
const NEEDS_AGRICULTURE =
  /\b(?:farmer|farmhand|farm worker|field hand|agricultural\w*|peasant|cultivator|planter|harvester|ploughman|plowman|sharecropper|orchardist|vintner|rice farmer|cotton farmer|cash crop farmer|granary keeper|miller|thresher)\b/i;

/**
 * Foraging as the household's living. Hunting, fishing and trapping are
 * deliberately absent: those persisted alongside farming everywhere.
 */
const FORAGING_LIVELIHOOD = /\b(?:forager|seed gatherer|acorn processor|root digger|wild plant gatherer)\b/i;

export function isProfessionHistoricallyAvailable(
  profession: string,
  context: HistoricalContext,
): boolean {
  // A farmer needs somewhere that farms. The capability model already knows
  // where and when that was true and `birthplaceService` already asks it; this
  // was the one caller that did not, which is why a persona in the Glacier
  // Foothills in 285 CE was a Farmer learning crop rotation from his elders in
  // a region that had no agriculture until settlers brought it.
  const farmingPlace = `${context.location ?? ''} ${context.region ?? ''}`.toLowerCase();
  const farms = hasCapability('settled_agriculture', {
    year: context.year,
    culturalZone: context.culturalZone as CulturalZone,
    placeLower: farmingPlace,
  });

  if (NEEDS_AGRICULTURE.test(profession) && !farms) return false;

  // And the reverse. Foraging for a living is a livelihood where there is no
  // farming and a supplement where there is: people in farming societies still
  // hunted and fished, but nobody's occupation was "gatherer" on the Colorado
  // Plateau, where the Ancestral Puebloans grew maize. Without this the general
  // subsistence pool swamped the Southwestern farming block.
  if (FORAGING_LIVELIHOOD.test(profession) && farms) return false;

  if (
    context.localeType === 'city' &&
    /\b(?:farmer|farmhand|shepherd|herder|cowherd|goatherd|field hand|agricultural laborer|nomad)\b/i.test(profession)
  ) {
    return false;
  }
  if (
    context.localeType === 'rural' &&
    /\b(?:telephone operator|telegraph operator|office manager|gas station attendant|factory worker|assembly line|railway|railroad|university professor|bank president|radio broadcaster)\b/i.test(profession)
  ) {
    return false;
  }
  const place = `${context.location ?? ''} ${context.region ?? ''}`;
  return PROFESSION_AVAILABILITY_RULES
    .filter(rule => rule.pattern.test(profession))
    .filter(rule => !rule.zones || rule.zones.includes(context.culturalZone as string))
    .every(rule => {
      // A place rule that excludes this place bars the trade outright; one that
      // names other places only bars it until the date, if there is one.
      // An exclusion is scoped to its own places and its own date, so a rule
      // that removes shepherds from the Baffin coast does not also remove
      // llama herders from the Andes.
      if (rule.excludePlaces?.test(place)) {
        return rule.excludedUntil !== undefined && context.year >= rule.excludedUntil;
      }
      if (rule.places && !rule.places.test(place)) return false;
      if (rule.startYear !== undefined && context.year < rule.startYear) return false;
      if (rule.endYear !== undefined && context.year > rule.endYear) return false;
      if (rule.requiredTechnology && !context.technologies.includes(rule.requiredTechnology)) return false;
      if (rule.requiredInstitution && !context.institutions.includes(rule.requiredInstitution)) return false;
      return true;
    });
}

/** Work that directly produces food: farming, herding, fishing, foraging. */
const FOOD_PRODUCING =
  /\b(?:farmer|farmhand|farm worker|field hand|agricultur\w*|peasant|cultivator|planter|harvester|ploughman|plowman|orchardist|vintner|gardener|herder|shepherd|cowherd|goatherd|swineherd|pastoralist|drover|reindeer\w*|yak\w*|cattle\w*|fisher\w*|whaler|sealer|forager|gatherer|hunter|trapper|beekeeper|rice farmer|cash crop farmer)\b/i;

/**
 * How much of the workforce produced food, by year.
 *
 * Until the industrial transition the overwhelming majority of every society
 * farmed, herded, fished or foraged — roughly 85-90% before 1500, still around
 * 80% in 1750, and falling steeply after that. Getting this wrong is the single
 * most distorting thing a historical generator can do: at the previous ~30% the
 * past reads as a market town full of artisans and merchants rather than as the
 * countryside almost everyone actually lived in.
 *
 * See docs/DEMOGRAPHY.md §5.
 */
function subsistenceShare(year: number): number {
  if (year < 1500) return 0.88;
  if (year < 1750) return 0.82;
  if (year < 1850) return 0.68;
  if (year < 1900) return 0.55;
  if (year < 1950) return 0.45;
  return 0.28;
}

/**
 * The multiplier needed to pull food-producing work up to its historical share.
 * Derived from the target odds rather than hand-tuned, so adjusting
 * `subsistenceShare` is enough to move the distribution.
 */
function subsistenceBoost(year: number): number {
  const share = subsistenceShare(year);
  // Odds of food-producing work relative to everything else, against the
  // roughly one-in-three the unweighted profession tables produce on their own.
  const targetOdds = share / (1 - share);
  const baselineOdds = 0.33 / 0.67;
  return Math.max(1, targetOdds / baselineOdds);
}

/**
 * Before industrialisation the overwhelming majority of people lived rurally,
 * so an unclassified locale in a pre-industrial year should be treated as
 * countryside rather than as "no information". Half of all generated personas
 * were landing on `unknown` and therefore receiving no locale weighting at all.
 */
function effectiveLocale(context?: HistoricalContext): HistoricalContext['localeType'] {
  if (!context) return 'unknown';
  if (context.localeType !== 'unknown') return context.localeType;
  return context.year < 1800 ? 'rural' : 'unknown';
}

export function getProfessionSelectionWeight(
  profession: string,
  context?: HistoricalContext,
): number {
  let weight = 1;

  // Offices only one person held at a time. The pattern used to name a dozen
  // royal titles and stop, so "Spanish Viceroy" — of which colonial Peru had
  // one — carried the same weight as "Shepherd", of which it had tens of
  // thousands, and a golden-baseline shepherd was promoted to viceroy.
  if (/\b(?:maharaja|nawab|emperor|empress|king|queen|duke|duchess|prince|princess|oil baron|bank president|viceroy|governor.general|sultan|caliph|shah|tsar|czar|pharaoh|doge|khan|pope|patriarch|grand vizier|shogun|caudillo|paramount chief|chaebol chairman|tech ceo)\b/i.test(profession)) {
    weight = 0.02;
  } else if (/\b(?:industrialist|factory owner|railway investor|ceo)\b/i.test(profession)) {
    weight = 0.2;
  } else if (/\b(?:fenian|chartist|luddite|anarchist|revolutionary|resurrectionist|beggar|cutpurse|footpad|peaky blinder|gang member|executioner)\b/i.test(profession)) {
    weight = 0.04;
  } else if (/\b(?:farmer|farm worker|laborer|servant|worker|weaver|fisher|herder|carrier|porter|caretaker|mother|child watcher|hunter|forager|gatherer|trapper|fowler)\b/i.test(profession)) {
    // Hunting, foraging and trapping belong in the same bracket as fishing and
    // farming — they are how the household eats. Leaving them out of it left
    // "Fisher" three times likelier than "Hunter" in every foraging economy in
    // the app, so seventy per cent of the Palaeolithic Great Basin fished.
    weight = 3;
  } else if (/\b(?:merchant|artisan|baker|carpenter|smith|potter|teacher|clerk|shopkeeper|innkeeper)\b/i.test(profession)) {
    weight = 1.5;
  }

  // The historical share of food-producing work, applied before the locale
  // adjustment so that a rural pre-industrial persona is overwhelmingly likely
  // to be working the land — which is what the sources describe.
  if (context && FOOD_PRODUCING.test(profession)) {
    weight *= subsistenceBoost(context.year);
  }

  const locale = effectiveLocale(context);

  // Locale changes likelihood rather than acting as a universal prohibition.
  // A rural person can become a judge or engineer, for example, but the local
  // livelihood distribution should still be dominated by agriculture, craft,
  // transport, and household labor.
  if (locale === 'rural') {
    if (/\b(?:farm|farmer|farmhand|field hand|agricultural|herder|shepherd|cowherd|goatherd|fisher|weaver|potter|smith|carpenter|artisan|washer|dhobi|carrier|porter)\b/i.test(profession)) {
      weight *= 3;
    } else if (/\b(?:airline pilot|civil engineer|judge|surgeon|librarian|journalist|secretary|accountant|politician|professor|bank president)\b/i.test(profession)) {
      weight *= 0.2;
    }
  } else if (locale === 'city') {
    if (/\b(?:factory|dock|porter|servant|clerk|shop|street|construction|railway|telegraph|teacher)\b/i.test(profession)) {
      weight *= 1.4;
    }
  }

  return weight;
}
