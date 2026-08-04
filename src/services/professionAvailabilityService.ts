import type { HistoricalContext } from '../types/historicalContext';
import type { CulturalZone } from '../types/characterData';
import { hasCapability } from '../constants/societyCapabilities';
import { disruptionProfessionMultiplier } from './disruptionResolution';
import { allEliteOfficeRoles } from '../constants/gameData/eliteOffices';

/** Titles owned by the office roll rather than by the profession tables. */
const ELITE_OFFICE_ROLES = new Set(allEliteOfficeRoles().map(role => role.toLowerCase()));
const isEliteOfficeRole = (profession: string): boolean =>
  ELITE_OFFICE_ROLES.has(profession.trim().toLowerCase());

/**
 * The same titles where the tables spell them differently — "Spanish Viceroy",
 * "Priest-King", "Coya", "Queen Mother" — plus the handful the catalogue does
 * not carry at all. Held to zero for the same reason: an office is drawn at a
 * per-capita rate by `eliteOfficeService` or it is not drawn.
 *
 * Zeroing a whole class is safe now. `determineSocialRole` rescans the entire
 * table when the requested class comes back empty, so a noble roll in a block
 * that is nothing but regal titles gets an ordinary trade of that society
 * rather than the generic field hand it used to get.
 */
const SINGULAR_OFFICE =
  /\b(?:maharaja|nawab|emperor|empress|king|queen|coya|duke|duchess|prince|princess|oil baron|bank president|viceroy|encomendero|governor.general|colonial governor|sultan|caliph|shah|tsar|czar|pharaoh|doge|khan|pope|patriarch|grand vizier|shogun|caudillo|paramount chief|war chief|priest.?king|chaebol chairman|tech ceo)\b/i;

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
  {
    // Hive beekeeping needs Apis mellifera, which reached the Americas in 1622
    // and Australia in 1822. Mesoamerica is the exception and is not matched
    // here: stingless Melipona bees were kept in Yucatán for centuries before
    // contact, which is a different animal and a genuinely local practice.
    pattern: /\b(?:beekeeper|apiarist|bee keeper)\b/i,
    excludePlaces: /\b(?:arctic|subarctic|baffin|greenland|inuit|aleut|great basin|northern rockies|columbia plateau|pacific coast|northwest|puget|salish|california|great plains|prairie|woodland|great lakes|mississippi|northeast|southeast|chesapeake|new england|amazon|orinoco|guiana|chaco|patagonia|andes|southwest|puebloan|colorado plateau|rio grande)\b/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN'],
    excludedUntil: 1622,
  },
  {
    pattern: /\b(?:beekeeper|apiarist|bee keeper)\b/i,
    excludePlaces: /\b(?:australia|arnhem|outback|kimberley|tasmania|queensland|murray|carpentaria|aboriginal|polynesi|melanesi|micronesi|hawai|new zealand|aotearoa)\b/i,
    zones: ['OCEANIA'],
    excludedUntil: 1822,
  },
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
    //
    // Scoped to the Americas, and it was not. A fence built around Mesoamerica
    // deleted the West African cocoa farmer — Ghana and Côte d'Ivoire grow most
    // of the world's crop — and the Chinese jade carver, jade being the
    // archetypal craft of the zone this rule was silently governing.
    pattern: /\b(?:chinampero|chinampa|cacao|cocoa|tribute collector|pochteca|calpixqui|nahual|curandero|codex painter|obsidian knapper|featherworker|jade carver|ball court player|ticitl|herbatero|sobador)\b/i,
    places: /\b(?:mexico|maya|yucatan|oaxaca|guatemala|chiapas|belize|honduras|central highlands|mesoameric|tenochtitlan|teotihuacan|veracruz|isthmus|central america|caribbean|antill)\b/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
  },
  {
    // Rice is a wet crop, and the profession tables offer it zone-wide across
    // an EAST_ASIAN zone that includes the Taklamakan. Oasis agriculture in the
    // Tarim is wheat, cotton, melons and fruit; a rice farmer there was two
    // in every ten personas. The exclusion is by aridity, not by country.
    pattern: /\brice (?:farmer|grower|planter|cultivator)\b/i,
    excludePlaces: /\b(?:tarim|taklamakan|xinjiang|kashgar|turfan|hotan|dzungar|gobi|ordos|steppe|altai|tian shan|mongolia|tibet|himalaya|kham|amdo|hokkaido|sakhalin|manchurian steppe)\b/i,
  },
  {
    // A word for a specific postwar Japanese institution, offered to the whole
    // zone. It is also not a job a woman held, and the batch produced female
    // ones; the gender bias on the entry does not survive the pool draw.
    pattern: /\bsalaryman\b/i,
    places: /\b(?:japan|tokyo|osaka|kyoto|nagoya|fukuoka|hokkaido|kanto|kansai|honshu|kyushu|okinawa)\b/i,
  },
  // North American culture areas. Now that the `Woodlands` and `Plains` blocks
  // are reachable at all, they need pinning to the ground they describe, or the
  // Baffin coast fills up with buffalo hunters and wampum makers.
  {
    // North American only: "buffalo" in monsoon Asia is the water buffalo, a
    // plough animal on every wet-rice farm from the Punjab to Luzon, and this
    // rule was quietly deleting the Southeast Asian buffalo herder.
    pattern: /\b(?:buffalo|bison|pemmican|tipi|travois|horse trainer)\b/i,
    places: /\b(?:great plains|plains|prairie|dakota|nebraska|llano|missouri|platte|comanche|blackfoot|great basin|rockies|texas)\b/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
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
    // Arctic and subarctic work — in the Arctic. Pacific whaling was a real
    // Oceanian occupation from the 1790s, worked out of island ports by island
    // crews, and this rule was refusing it.
    pattern: /\b(?:umiak|kayak|harpoon|sealer|whaler|dog ?sled|igloo|caribou)\b/i,
    places: /\b(?:arctic|subarctic|baffin|greenland|labrador|alaska|yukon|inuit|thule|aleut|yupik|bering|hudson bay|tundra)\b/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
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
    // Written for the Northwest Coast, where the place names carry the water in
    // them. Southeast Asian regions are named for their uplands and their
    // rivers' valleys, so an archipelago of shellfish gatherers failed a test
    // that was only ever asking "is this the seaside".
    pattern: /\b(?:shellfish gatherer|fish weir builder)\b/i,
    places: /\b(?:coast|sound|bay|harbor|harbour|estuary|delta|island|shore|sea|puget|salish|fraser|chesapeake|atlantic|pacific|arctic|baffin|labrador|gulf|lagoon|strait|inlet|fjord|river)\b/i,
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
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

/**
 * Professions tied to one place inside their cultural zone.
 *
 * The profession tables are keyed by zone, era and class, and a zone is a
 * continent. Several entries carry a `keywords` string naming the place they
 * belong to — 'Tango Musician' says "music argentina buenos aires" — but
 * nothing reads `keywords`: grep the tree and it has no consumers at all. It is
 * documentation that looks like a constraint. So a tango musician was reachable
 * anywhere in South America, and one turned up in Maracaibo, about four
 * thousand kilometres from the Río de la Plata.
 *
 * Each entry pairs a profession pattern with the places it is plausible in,
 * matched against location and region. Only genuinely place-bound work belongs
 * here: a baker or a clerk existed everywhere and must not be listed.
 */
const PLACE_BOUND_PROFESSIONS: Array<{
  profession: RegExp;
  places: RegExp;
  /**
   * Which zones the fence applies in. Omitted means everywhere, which is
   * almost never what one of these rules means.
   *
   * Every rule here was written from inside one zone and then applied to all
   * ten, so a fence built to keep the rubber boom in the Amazon deleted the
   * rubber tapper from Malaya — where the largest rubber workforce that ever
   * existed actually worked. `reach-audit` names each one it kills.
   */
  zones?: CulturalZone[];
}> = [
  // Tango is a Río de la Plata form — Buenos Aires and Montevideo.
  {
    profession: /\btango\b/i, zones: ['SOUTH_AMERICAN'],
    places: /pampas|plata|paran|buenos aires|montevideo|uruguay|santa fe|c[oó]rdoba/i,
  },
  // Andean highland pastoralism. Llamas and alpacas are not lowland animals.
  {
    profession: /\b(?:llama|alpaca)\b/i, zones: ['SOUTH_AMERICAN'],
    places: /andes|altiplano|titicaca|yungas|cusco|quito|puna|highland/i,
  },
  // The South American rubber boom was an Amazon and Acre phenomenon.
  {
    profession: /\brubber tapper\b/i, zones: ['SOUTH_AMERICAN'],
    places: /amazon|acre|manaus|negro|tapaj|xingu|varzea|purus|madeira/i,
  },
  // And the far larger plantation belt, which is where rubber went after 1876:
  // Malaya, Sumatra, Java, Indochina, and the Congo concessions.
  {
    profession: /\brubber tapper\b/i, zones: ['SOUTHEAST_ASIAN'],
    places: /malay|sumatra|java|borneo|sarawak|johor|selangor|perak|indochina|mekong|cochin|annam|siam|thai|peninsula|archipelago|island|highland|lowland|delta|valley|coast|basin/i,
  },
  {
    profession: /\brubber tapper\b/i, zones: ['SUB_SAHARAN_AFRICAN'],
    places: /congo|kasai|ubangi|equator|gabon|cameroon|liberia|guinea|forest|basin|coast|river/i,
  },
  // Gaucho work belongs to the grass, not the rainforest.
  {
    profession: /\bgaucho\b/i, zones: ['SOUTH_AMERICAN'],
    places: /pampas|plata|chaco|llanos|patagonia|banda oriental|uruguay/i,
  },
  // The vaquero is Mexican and then Californian and Texan — the word, the
  // saddle and the work all travelled north, and fencing him to the pampas put
  // him nowhere at all.
  {
    profession: /\bvaquero\b/i, zones: ['NORTH_AMERICAN_COLONIAL', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
    places: /mexico|sonora|california|texas|rio grande|new mexico|arizona|central valley|sierra|plain|prairie|llano|basin|coast|valley|highland/i,
  },
  {
    profession: /\bvaquero\b/i, zones: ['SOUTH_AMERICAN'],
    places: /pampas|plata|chaco|llanos|patagonia|banda oriental|uruguay/i,
  },
];

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

  // "Fire-stick farming" is the term for burning country to manage it, and the
  // whole point of the phrase is that it is what foragers did instead of
  // sowing. Matching it on the word "farmer" and then demanding settled
  // agriculture made it unreachable in the one place it names.
  const FORAGER_LANDCARE = /\bfire ?stick farmer\b/i;

  if (NEEDS_AGRICULTURE.test(profession) && !FORAGER_LANDCARE.test(profession) && !farms) return false;

  // Work that belongs to a particular corner of its zone. `farmingPlace` is
  // already the location and region lowercased, which is exactly what these
  // need.
  for (const { profession: pattern, places, zones } of PLACE_BOUND_PROFESSIONS) {
    if (zones && !zones.includes(context.culturalZone as CulturalZone)) continue;
    if (pattern.test(profession) && !places.test(farmingPlace)) return false;
  }

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
  /\b(?:farmer|farmhand|farm worker|farm hand|farm labourer|farm laborer|field hand|field labourer|field laborer|agricultur\w*|peasant|cultivator|planter|harvester|ploughman|plowman|orchardist|vintner|vine dresser|gardener|herder|shepherd|cowherd|goatherd|swineherd|pastoralist|drover|reindeer\w*|yak\w*|cattle\w*|fisher\w*|whaler|sealer|forager|gatherer|hunter|trapper|fowler|beekeeper|rice farmer|cash crop farmer|thresher|reaper|crofter|cottager|sharecropper|tenant farmer|tenant cultivator|dairymaid|milkmaid|dairy farmer|ranch hand|stockman|homesteader|market gardener|fellah|mitayo|grower|picker|cane cutter|tapper|root digger|shellfish gatherer)\b/i;

/**
 * Work that is not food production but is done by as many people.
 *
 * Kept beside `FOOD_PRODUCING` because the two used to be one hand-written list
 * per call site, and the lists drifted: `cultivator` was in this file's
 * subsistence pattern but in neither of the two weighting patterns below, while
 * `herder` was in all three. That is a nine-fold advantage to herding over
 * cultivation, and it is why the Gangetic plain — some of the most intensively
 * farmed land on earth — came back one persona in four a herder.
 */
const COMMON_LABOUR =
  /\b(?:laborer|labourer|servant|maid|worker|weaver|spinner|carrier|porter|caretaker|mother|child watcher|child minder|washerwoman|laundress|water carrier|wood gatherer)\b/i;

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
 * The figure is a whole society's, which is not the figure for any particular
 * place in it. Applied flat it made the city of Rome 19% hunters and 8%
 * fishers, and 1850 London a fifth crofters, threshers and market gardeners:
 * the countryside's share imposed on the one kind of place that did not have
 * it. A pre-industrial city ran on trades, service and carrying, with a thin
 * fringe of gardeners and drovers at the walls — call it a tenth. A market
 * town sits between the two, and the countryside carries what the cities do
 * not.
 *
 * See docs/DEMOGRAPHY.md §5.
 */
function subsistenceShare(year: number, locale: HistoricalContext['localeType']): number {
  const nationwide =
    year < 1500 ? 0.88
    : year < 1750 ? 0.82
    : year < 1850 ? 0.68
    : year < 1900 ? 0.55
    : year < 1950 ? 0.45
    : 0.28;

  if (locale === 'city') return Math.min(nationwide, 0.10);
  if (locale === 'town') return nationwide * 0.55;
  // Herders and hunters are food producers, and mobile societies are made of
  // them almost entirely.
  if (locale === 'mobile') return Math.min(0.95, nationwide * 1.1);
  if (locale === 'rural') return Math.min(0.95, nationwide * 1.1);
  return nationwide;
}

/**
 * The multiplier that pulls food-producing work to its historical share.
 * Derived from the target odds rather than hand-tuned, so adjusting
 * `subsistenceShare` is enough to move the distribution.
 *
 * Free to fall below 1: in a city the share is a tenth, and the correction
 * there has to push down rather than up.
 */
function subsistenceBoost(year: number, locale: HistoricalContext['localeType']): number {
  const share = subsistenceShare(year, locale);
  // Odds of food-producing work relative to everything else, against the
  // roughly one-in-three the unweighted profession tables produce on their own.
  const targetOdds = share / (1 - share);
  const baselineOdds = 0.33 / 0.67;
  return targetOdds / baselineOdds;
}

/**
 * Salaried work that presupposes an office, a payroll and a qualification.
 *
 * Kept separate from the "offices only one person held" list above: there was
 * exactly one viceroy, but there were plenty of accountants — just far fewer,
 * far later and far more urban than the modern-era profession tables imply.
 */
const PROFESSIONAL_CLERICAL = /\b(?:accountant|book-?keeper|clerk|cashier|secretary|typist|stenographer|receptionist|office|manager|executive|administrator|civil servant|bureaucrat|banker|broker|insurance|real estate|realtor|estate agent|salesman|sales representative|advertis|journalist|editor|architect|engineer|surveyor|lawyer|solicitor|barrister|attorney|judge|magistrate|notary|professor|lecturer|teacher|schoolteacher|librarian|physician|surgeon|doctor|dentist|pharmacist|optician|veterinar|chemist|scientist|statistician|postal|telegraph operator|telephone operator|photographer|designer|consultant)\b/i;

/**
 * The share of the workforce in professional, clerical and managerial work.
 *
 * The mirror of `subsistenceShare`, and needed for the same reason. The
 * modern-era profession tables are lists of salaried occupations offered
 * zone-wide with only a decade filter, so the Sonoran Desert in 1909 was
 * returning accountants, real estate agents, salesmen and postal workers at
 * something near half of all draws. The United States census of 1910 puts
 * professional service at about 4 per cent of gainful workers and clerical at
 * about 5, against 31 per cent in agriculture — and those are national figures
 * carried overwhelmingly by the cities.
 *
 * Before the nineteenth century the category barely exists: a scribe, a
 * notary, a handful of physicians and the clergy, in a world where almost
 * everyone works the land or a trade.
 */
function professionalShare(year: number): number {
  if (year < 1500) return 0.005;
  if (year < 1800) return 0.015;
  if (year < 1900) return 0.05;
  if (year < 1950) return 0.12;
  if (year < 1980) return 0.22;
  return 0.35;
}

/**
 * How much to damp salaried work so its share matches the record.
 *
 * Expressed the same way as `subsistenceBoost` — as an odds ratio against the
 * roughly one-in-three the unweighted tables produce unaided — and applied
 * multiplicatively, so it composes with the locale adjustment below rather
 * than overriding it.
 */
function professionalDamping(year: number, locale: HistoricalContext['localeType']): number {
  const share = professionalShare(year);
  const targetOdds = share / (1 - share);
  const baselineOdds = 0.33 / 0.67;
  let damping = Math.min(1, targetOdds / baselineOdds);

  // These are city occupations before they are anything else. A county seat
  // had a lawyer and a doctor; a farming district in the same year had
  // neither, and the app draws far more rural personas than urban ones.
  if (locale === 'rural') damping *= 0.35;
  else if (locale === 'city') damping *= 2.2;

  return Math.min(1.5, damping);
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

/**
 * How much of the draw is spent on the distinctive work of a place.
 *
 * Every society had a long tail of occupations that were real, specific and
 * uncommon: the goose tender, the ratcatcher, the priestess of Juno, the man
 * who dressed corpses. Weighted individually against a ploughman they are
 * invisible — that is arithmetic, not authoring, and no length of role list
 * fixes it. So the tail is given a fixed share of the draw instead, divided
 * among however many of its members this place and year can support. Twenty
 * texture roles and two hundred produce the same peasant share; the second
 * just repeats itself far less.
 *
 * Cities get the larger budget because that is what a city *is*: the density
 * that lets someone live by one narrow trade.
 */
export function textureBudget(context?: HistoricalContext): number {
  switch (effectiveLocale(context)) {
    case 'city': return 0.30;
    case 'town': return 0.20;
    case 'mobile': return 0.10;
    default: return 0.12;
  }
}

export function getProfessionSelectionWeight(
  profession: string,
  context?: HistoricalContext,
): number {
  let weight = 1;

  // Offices are no longer drawn here at all.
  //
  // Frequency by relative weight cannot express "one in seventy-five thousand":
  // the figure depends on what else happens to be in the pool, which varies by
  // zone, era and locale, so the old 0.02 meant something different in every
  // draw and nothing in particular in any of them. The four rungs now have
  // per-capita target shares of their own and are rolled up front by
  // `eliteOfficeService`, before the tables are consulted — see
  // `eliteOffices.ts`. Zeroing them here is what stops the same titles being
  // produced a second time, at an uncontrolled rate, out of the tail of a
  // profession table.
  if (isEliteOfficeRole(profession) || SINGULAR_OFFICE.test(profession)) {
    weight = 0;
  } else if (/\b(?:robber baron|tycoon|magnate|mogul|film star|movie star|hollywood star|television presenter|news anchor|rock star|pop star|recording artist|professional athlete|olympian|prizefighter|astronaut|test pilot|explorer|spy|secret agent|cartel|mob boss|crime boss|bootlegger)\b/i.test(profession)) {
    // The conspicuous occupations — the ones a period is remembered by, and
    // which a table of "what is interesting about this time and place" fills up
    // with. There were perhaps a few dozen robber barons; the generator was
    // returning them as six per cent of North America in 1900, which made them
    // commoner than sharecroppers. Rarity here is the whole point of the role:
    // it should be a thrilling draw, not the expected one.
    weight = 0.015;
  } else if (/\b(?:industrialist|factory owner|railway investor|ceo)\b/i.test(profession)) {
    weight = 0.2;
  } else if (/\b(?:jazz musician|musician|composer|actor|actress|novelist|poet|playwright|painter|sculptor|philosopher|inventor|aviator|fashion designer|celebrity chef|architect of note|impresario|circus)\b/i.test(profession)) {
    // Practised by many, made a living at by few. A parish had one fiddler and
    // a great many people who farmed and also played.
    weight = 0.07;
  } else if (/\b(?:beekeeper|salt worker|lime burner|charcoal burner|thatcher|net maker|cordage maker|rope maker|firekeeper|root digger|shellfish gatherer|fowler|trapper|oil presser|sexton|night soil collector|chimney sweep|errand boy|match worker|peat cutter|glazier|soap boiler|candle maker|wool comber|ostler|flintknapper)\b/i.test(profession)) {
    // Real trades that employed very few people. A village had fifty households
    // working the land and one man who kept bees, and the draw has no way to
    // know that from the table alone — worse, these roles tend to carry light
    // stat requirements, which the fit score rewards, so they were beating the
    // occupations that actually fed the place. Beekeeper was eleven per cent of
    // the Palaeolithic Plains.
    weight = 0.15;
  } else if (/\b(?:fenian|chartist|luddite|anarchist|revolutionary|resurrectionist|beggar|cutpurse|footpad|peaky blinder|gang member|executioner|witch|alchemist|plague doctor)\b/i.test(profession)) {
    weight = 0.04;
  } else if (FOOD_PRODUCING.test(profession) || COMMON_LABOUR.test(profession)) {
    // Hunting, foraging and trapping belong in the same bracket as fishing and
    // farming — they are how the household eats. Leaving them out of it left
    // "Fisher" three times likelier than "Hunter" in every foraging economy in
    // the app, so seventy per cent of the Palaeolithic Great Basin fished.
    weight = 3;
  } else if (/\b(?:merchant|artisan|baker|carpenter|smith|potter|teacher|clerk|shopkeeper|innkeeper)\b/i.test(profession)) {
    weight = 1.5;
  }

  const locale = effectiveLocale(context);

  // The historical share of food-producing work in this kind of place. The
  // locale is inside the share now rather than applied as a second multiplier
  // on top of it: the two compounded to a 134-to-1 advantage over every other
  // occupation in the rural pre-industrial draw, which is most of the app.
  if (context && FOOD_PRODUCING.test(profession)) {
    weight *= subsistenceBoost(context.year, locale);
  }

  // Locale changes likelihood rather than acting as a universal prohibition.
  // A rural person can become a judge or engineer, for example, but the local
  // livelihood distribution should still be dominated by agriculture, craft,
  // transport, and household labor.
  if (locale === 'rural') {
    if (/\b(?:weaver|potter|smith|carpenter|artisan|washer|dhobi|carrier|porter|thatcher|miller|blacksmith)\b/i.test(profession)) {
      weight *= 3;
    } else if (/\b(?:airline pilot|civil engineer|judge|surgeon|librarian|journalist|secretary|accountant|politician|professor|bank president)\b/i.test(profession)) {
      weight *= 0.2;
    }
  } else if (locale === 'city') {
    if (/\b(?:factory|dock|porter|servant|clerk|shop|street|construction|railway|telegraph|teacher)\b/i.test(profession)) {
      weight *= 1.4;
    }
  }

  // Fishing feeds a coast, not a country. It sits in the same food-producing
  // bracket as farming, which on an inland region made one medieval European in
  // five a fisherman. Damped by default and restored where there is water to
  // fish — the region and locale names are the only signal available here, and
  // they carry it well enough.
  if (context && /\b(?:fisher\w*|whaler|sealer|pearl diver)\b/i.test(profession)) {
    const wet = /\b(?:coast|bay|sea|ocean|island|isle|gulf|delta|estuary|harbou?r|port|lake|river|shore|fjord|sound|strait|marsh|swamp|lagoon|atoll|archipelago|maritime|nile|ganges|yangtze|mekong|danube|rhine|volga|amazon)\b/i
      .test(`${context.region} ${context.location}`);
    weight *= wet ? 0.9 : 0.25;
  }

  // Cash and luxury crops are grown by a specialised minority even where they
  // dominate the export figures. Cacao was sixteen per cent of Mesoamerica.
  if (/\b(?:cacao|cocoa|coca|indigo|silk farmer|sericultur\w*|tea grower|saffron|spice|pepper|vanilla|opium|tobacco grower)\b/i.test(profession)) {
    weight *= 0.25;
  }

  // Salaried work is a small and late share of any workforce, and the modern
  // tables are made almost entirely of it. Applied after the locale block so
  // the two compose.
  if (context && PROFESSIONAL_CLERICAL.test(profession)) {
    weight *= professionalDamping(context.year, locale);
  }

  // What was actually happening here. Everything above this line describes an
  // ordinary year; this is the correction for the years that were not ordinary.
  // It is applied last and bounded on both sides, so a war zone shifts the
  // distribution rather than replacing it — see `disruptionResolution`.
  weight *= disruptionProfessionMultiplier(profession, context);

  return weight;
}
