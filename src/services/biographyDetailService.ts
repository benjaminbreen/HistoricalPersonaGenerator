/**
 * services/biographyDetailService.ts
 *
 * Supplies the concrete, era- and place-specific detail that the narrative
 * biography was missing: what a trade actually involved, what a foundational
 * attribute meant for a life, and what the surrounding world looked like at a
 * given year and locale.
 *
 * Everything here is pure and deterministic given a seeded picker, so the same
 * persona always produces the same prose.
 */

import type { NarrativePronouns } from './narrativeTextService';
import { conjugate, lowerProfession, withIndefiniteArticle } from './narrativeTextService';
import type { HistoricalContext, LocaleType } from '../types/historicalContext';
import type { Season } from './climateService';
import {
  hasCapability,
  settlementRegister,
  type CapabilityContext,
  type SettlementRegister,
} from '../constants/societyCapabilities';

export interface BiographyContext {
  name: string;
  age: number;
  year: number;
  location: string;
  region: string;
  profession: string;
  socialClass?: string;
  wealthLevel?: string;
  religion?: string;
  language?: string;
  season?: Season;
  historical?: HistoricalContext;
  pronouns: NarrativePronouns;
}

/** Seeded chooser supplied by the caller so prose stays stable per persona. */
export type Pick = <T>(values: T[]) => T;

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const capabilityContext = (ctx: BiographyContext): CapabilityContext => ({
  year: ctx.year,
  culturalZone: ctx.historical?.culturalZone,
  placeLower: `${ctx.location ?? ''} ${ctx.region ?? ''}`.toLowerCase(),
});

/**
 * "The district" is wrong for a band that moves with the season and wrong
 * again for a hamlet of forty people. Prose picks its nouns from this.
 */
const SETTLED_TRADES = /farm|field hand|miller|plough|plow|harvest|vintner|planter|shopkeep|clerk|scribe|weaver|potter|smith|mason|carpenter|baker|innkeep|merchant/i;

export function registerFor(ctx: BiographyContext): SettlementRegister {
  const base = settlementRegister(capabilityContext(ctx));
  // A persona who works fields or keeps a shop does not live in a band,
  // whatever the zone-level table says; describing them as both is worse than
  // describing them as settled.
  if (base === 'band' && SETTLED_TRADES.test(ctx.profession || '')) return 'village';
  return base;
}

/** The word for the persona's own community, in their own kind of society. */
const COMMUNITY_NOUN: Record<SettlementRegister, string> = {
  band: 'band',
  village: 'village',
  district: 'district',
};

// ---------------------------------------------------------------------------
// What the trade actually involves
// ---------------------------------------------------------------------------

interface TradeTexture {
  match: RegExp;
  minYear?: number;
  maxYear?: number;
  clauses: string[];
}

/**
 * Ordered most specific first; the first match wins. Clauses are written as
 * sentence bodies that follow "The work means…" or stand alone after a comma,
 * so they must not begin with a capital or end with punctuation.
 */
const TRADE_TEXTURES: TradeTexture[] = [
  {
    match: /mill hand|mill worker|factory|textile worker|jute|operative|spinning shed/,
    minYear: 1760,
    clauses: [
      'fourteen hours inside the noise of the machines, and a fine deducted for every minute late at the gate',
      'tending frames that never stop, in air thick enough with lint to taste',
      'shifts measured by the hooter rather than the sun, which is the great novelty of the age',
    ],
  },
  {
    match: /field hand|farm|agricultur|peasant|cultivat|plough|plow|reaper|harvest/,
    clauses: [
      'other people\'s fields worked from first light, and payment taken in grain when the harvest comes in',
      'the year divided into sowing, weeding and reaping, with hunger in the gap between them',
      'labor let out by the season, and a winter spent making the summer\'s wages last',
    ],
  },
  {
    match: /shepherd|herd|drover|pastoral|cowherd|goatherd/,
    clauses: [
      'months alone with the flock on the high ground, coming down only when the weather turns',
      'the beasts counted twice a day and lambing watched through the night',
      'a life pitched between the winter fold and the summer pasture',
    ],
  },
  {
    match: /weav|spinner|cloth|silk|loom|textile/,
    clauses: [
      'the loom set up where the light is best, and a bolt finished only when the thread holds',
      'thread counted, warped and worked until the pattern is right, then carried to whoever will buy',
      'a stool, a loom and the ache that comes of thirty years at both',
    ],
  },
  {
    match: /smith|forge|founder|farrier|metal|iron/,
    clauses: [
      'fire kept in all day, and the ring of the hammer heard three streets off',
      'nails, hinges, blades and the endless mending of other people\'s tools',
      'a forge that must be fed before anything else in the household is',
    ],
  },
  {
    match: /potter|ceram|tile|brick/,
    clauses: [
      'clay dug, wedged, thrown and then trusted to a kiln that ruins one firing in five',
      'the wheel turned from dawn, and the whole week\'s work staked on a single burning',
    ],
  },
  {
    match: /fisher|fishing|angler/,
    clauses: [
      'the boat out before light and the catch sold before it turns',
      'nets mended on the beach between tides, and weather read more carefully than any book',
      'a living taken from water that takes men back',
    ],
  },
  {
    match: /sailor|mariner|seaman|boatman|shipwright|dock|steved/,
    clauses: [
      'voyages measured in months, and shore leave measured in days',
      'work aloft and below in all weathers, under a discipline nobody ashore would tolerate',
      'a wage that arrives all at once and is gone nearly as fast',
    ],
  },
  {
    match: /merchant|trader|shopkeep|pedlar|peddler|hawker|salesman|vendor|seller|business owner/,
    clauses: [
      'stock bought on credit and sold at whatever the market will bear',
      'accounts kept in the head as much as on paper, and a memory for who has not yet paid',
      'a stall or a room of goods, and a day spent judging strangers quickly',
    ],
  },
  {
    match: /scribe|clerk|notary|copyist|secretar|account|record/,
    clauses: [
      'other people\'s words set down in a fair hand, and paid for by the sheet',
      'contracts, petitions and wills written for those who cannot write them',
      'ink, cramped fingers and the quiet authority of being the one who holds the pen',
    ],
  },
  {
    match: /priest|monk|nun|cleric|imam|rabbi|abbot|friar|minister|preacher|shaman|oracle|temple|brahmin/,
    clauses: [
      'the offices kept at their hours whether anyone attends or not',
      'birth, marriage and death attended for the whole district, and rarely at a convenient hour',
      'the care of a congregation that expects counsel, judgment and silence in equal measure',
    ],
  },
  {
    match: /soldier|guard|warrior|merc|cavalry|archer|gunner|watchman|police|constable/,
    clauses: [
      'long stretches of waiting broken by a few hours nobody afterward wants to describe',
      'kit maintained, watches stood, and pay that arrives late when it arrives',
      'obedience to men whose judgment is not always worth the obeying',
    ],
  },
  {
    match: /physician|surgeon|apothec|healer|doctor|barber|ayurved/,
    clauses: [
      'called out at every hour to cases that are usually past helping',
      'remedies compounded from what the season provides, and a reputation staked on each one',
      'the sick attended for whatever their families can pay',
    ],
  },
  {
    match: /midwife|wet nurse/,
    clauses: [
      'sent for at any hour, and blamed or blessed according to how the night ends',
      'attendance at births the physicians will not trouble themselves with',
    ],
  },
  {
    match: /baker|cook|confection|chai|waiter|bartend|innkeep|tavern/,
    clauses: [
      'up hours before the customers, and finished long after they have gone',
      'a trade of small margins, early mornings and constant heat',
    ],
  },
  {
    match: /miller|thresh|grain/,
    clauses: [
      'the whole district\'s grain passing through one pair of stones, and everyone convinced of being short-measured',
      'dust in the lungs and a standing suspicion of theft that comes with the trade',
    ],
  },
  {
    match: /carpenter|joiner|cooper|wright|builder|mason|stonecut|construction/,
    clauses: [
      'timber and stone worked to measurements that must be right the first time',
      'work that moves from site to site, and tools carried on the back between them',
    ],
  },
  {
    match: /tann|dyer|fuller|currier|butcher|slaughter/,
    clauses: [
      'a trade the town keeps downwind, and a smell no washing removes',
      'work at the edge of the settlement, tolerated because it is necessary',
    ],
  },
  {
    match: /mine|collier|quarry|digger/,
    clauses: [
      'hours underground in air that has to be brought down after you',
      'a wage above the surface rate, paid for in lungs',
    ],
  },
  {
    match: /servant|maid|dhobi|washer|laundr|porter|carter|janitor|sweep/,
    clauses: [
      'the household\'s work done before the household is awake to see it',
      'employment that depends entirely on the temper of the person paying for it',
    ],
  },
  {
    match: /hunt|trapper|forager|gather/,
    clauses: [
      'the country read for tracks and sign, and days that come back empty as often as not',
      'game taken according to the season, and shared out by rules older than anyone living',
    ],
  },
  {
    match: /teacher|tutor|scholar|professor|librarian|student/,
    clauses: [
      'the same lessons carried to pupils who mostly do not want them',
      'texts learned closely enough to teach, which is closer than most people ever read anything',
    ],
  },
  {
    match: /musician|artist|poet|dancer|actor|player|entertain/,
    clauses: [
      'engagements at weddings and funerals, and long stretches with neither',
      'a skill everyone praises and few will pay properly for',
    ],
  },
  {
    match: /water carrier|well keeper|water bearer|bhisti/,
    clauses: [
      'the same walk to the well and back, a dozen times a day, with the weight of it on the shoulders',
      'every household on the street supplied by hand, and paid by the load',
    ],
  },
  {
    match: /coffee|tea pick|tea plant|rubber|sugar|cacao|indigo|plantation|vintner|vineyard|tobacco plant/,
    clauses: [
      'a crop that belongs to someone else, worked in rows under an overseer\'s eye',
      'picking measured by weight at the end of the day, and the weight always argued over',
      'a single crop that decides whether the year is good, and no say in the price of it',
    ],
  },
  {
    match: /child watcher|caretaker|nursemaid|nanny|attendant|companion/,
    clauses: [
      'other people\'s children minded from dawn until their parents come back for them',
      'the constant low-grade responsibility of keeping someone else alive and out of trouble',
    ],
  },
  {
    match: /bamboo|basket|thatch|rope|mat maker|paper|charcoal|inkstick|lacquer/,
    clauses: [
      'raw material gathered, split, soaked and worked into something that will sell',
      'a craft learned by watching, and priced by how many can be turned out in a day',
    ],
  },
  {
    match: /canal|coach driver|carter|drayman|ferry|porter|haul|teamster|caravan/,
    clauses: [
      'goods moved from where they are to where they are wanted, and blamed for whatever arrives broken',
      'long days on the road or the towpath, and nights wherever the load stops',
    ],
  },
  {
    match: /assembly line|automobile worker|machinist|foreman|plant worker/,
    minYear: 1890,
    clauses: [
      'the same motion repeated at the pace the line sets, which is not a pace anyone chose',
      'a job that pays better than the land did and asks not to be thought about',
    ],
  },
  {
    match: /radio|television|broadcast|presenter|journalist|reporter|announcer/,
    minYear: 1900,
    clauses: [
      'words prepared for an audience that cannot be seen and never quite answers back',
      'a schedule that does not slip, whatever else is happening in the world',
    ],
  },
  {
    match: /office manager|administrator|official|bureaucrat|magistrate|judge|viceroy|governor|steward|landowner|lady|lord/,
    clauses: [
      'other people\'s affairs decided at a desk, and the consequences arriving somewhere out of sight',
      'authority that rests on paper and custom rather than on anything done by hand',
    ],
  },
  {
    match: /alchem|apothecar|herbal|druggist|chemist/,
    clauses: [
      'preparations compounded to recipes that are half secret and half guesswork',
      'a shelf of jars, a set of scales, and customers who want a cure more than an explanation',
    ],
  },
  {
    match: /laborer|labourer|day labor|odd job|unskilled|general worker/,
    clauses: [
      'whatever work is going that morning, taken at whatever it pays',
      'no trade to fall back on, so the day begins by finding out whether there is a day\'s work in it',
    ],
  },
  {
    match: /driver|taxi|truck|postal|mechanic|engineer|welder|operator|nurse|cashier|warehouse|security/,
    minYear: 1850,
    clauses: [
      'regular hours, a wage packet, and a supervisor who signs for it',
      'work that would have been unimaginable to a grandparent, and is unremarkable now',
      'a shift, a route, and a form to sign at the end of both',
      'a job that pays on a fixed day of the month, which is itself a recent invention',
      'skills learned in a fortnight and used for thirty years',
      'a trade with a union, a rate for the hour, and an argument about both',
    ],
  },
];

/**
 * Fallbacks for societies with no settled district to belong to. The previous
 * generic clauses ("the ordinary labor of the district") were being handed to
 * Paleolithic hide workers and Patagonian herders.
 */
const REGISTER_TEXTURES: Record<SettlementRegister, string[]> = {
  band: [
    'work shared out among the band as the season and the country allow',
    'whatever the camp needs doing, done by whoever is nearest and able',
    'skills everyone in the band holds to some degree, and a few hold better',
  ],
  village: [
    'the ordinary work of the settlement, done alongside everyone else in it',
    'a task the household has always done, and expects to go on doing',
  ],
  district: [],
};

const GENERIC_TEXTURES: Record<LocaleType, string[]> = {
  city: [
    'a day\'s work sold in a city where there is always someone willing to do it cheaper',
    'labor taken where it is offered, in a place with more people than employment',
  ],
  town: [
    'steady enough work in a place small enough that everyone knows what it pays',
    'a trade practiced among neighbors who have known the family for generations',
  ],
  rural: [
    'work that follows the season rather than the clock',
    'the ordinary labor of the district, done alongside everyone else who lives in it',
  ],
  mobile: [
    'work that moves when the camp moves',
    'a living made on the road, between one halt and the next',
  ],
  unknown: [
    'the ordinary work of the place, done in the ordinary way',
  ],
};

/**
 * A sentence describing what the persona's trade actually consists of.
 */
export function describeProfessionWork(ctx: BiographyContext, pick: Pick): string {
  const professionText = (ctx.profession || '').toLowerCase();
  const locale = ctx.historical?.localeType ?? 'unknown';

  const texture = TRADE_TEXTURES.find(t =>
    t.match.test(professionText)
    && (t.minYear === undefined || ctx.year >= t.minYear)
    && (t.maxYear === undefined || ctx.year <= t.maxYear)
  );

  const register = registerFor(ctx);
  const fallback = register === 'district'
    ? (GENERIC_TEXTURES[locale] ?? GENERIC_TEXTURES.unknown)
    : REGISTER_TEXTURES[register];

  // Wages, prices and customers presuppose a market. Outside a settled district
  // prefer the clauses in a trade family that do not assume one.
  const COMMERCIAL = /\bsold\b|\bsell\b|\bwages\b|\bpaid\b|\bprice\b|\bmarket\b|customers|credit|deducted|\bbuy\b|\bwage\b/i;
  const available = texture
    ? (register === 'district'
      ? texture.clauses
      : (texture.clauses.filter(c => !COMMERCIAL.test(c)).length > 0
        ? texture.clauses.filter(c => !COMMERCIAL.test(c))
        : fallback))
    : fallback;

  const clause = pick(available);

  // Every opener must govern a bare noun phrase, since that is the shape all
  // the clauses take.
  const openers = ['The work means ', 'That means ', 'It comes down to ', 'The trade is '];
  return `${pick(openers)}${clause}.`;
}

// ---------------------------------------------------------------------------
// The household they came out of
// ---------------------------------------------------------------------------

/**
 * A sentence about what the parents did for a living. The family data already
 * carries parental professions and the biography never mentioned them, which
 * left paragraph one much thinner than paragraph two.
 */
/**
 * Pre-modern mothers are assigned activity labels rather than agent nouns
 * ("Household Management", "Farming (Household)", "Foraging"), which cannot be
 * dropped into "a ___" without producing "her mother a foraging". Map them to
 * verb phrases instead.
 */
const MATERNAL_ACTIVITIES: Record<string, string> = {
  'child-rearing': 'raised the children',
  'textile work': 'spun and sewed for the household',
  'food preparation': 'fed the household',
  'household management': 'ran the household',
  'foraging': 'foraged for the household',
  'farming (household)': 'worked the family plot',
  'weaving': 'wove',
  'brewing': 'brewed',
  'dairy work': 'kept the dairy',
  'market selling': 'sold at market',
  'homemaker': 'kept the house',
};

/** Substitutes for activities that presuppose farming or herding. */
const FORAGING_ACTIVITIES: Record<string, string> = {
  'farming (household)': 'gathered and prepared what the country gave',
  'dairy work': 'prepared and stored what the hunt brought in',
  'brewing': 'prepared and stored what the hunt brought in',
  'market selling': 'traded with the neighboring bands',
};

const maternalClause = (
  profession: string | undefined,
  pronouns: NarrativePronouns,
  settled: boolean,
): string => {
  if (!profession) return '';
  const key = profession.trim().toLowerCase();
  const activity = (!settled && FORAGING_ACTIVITIES[key]) || MATERNAL_ACTIVITIES[key];
  if (activity) return `${pronouns.possessive} mother ${activity}`;
  return `${pronouns.possessive} mother worked as ${withIndefiniteArticle(lowerProfession(profession))}`;
};

export function describeParentalLivelihood(
  father: { name?: string; profession?: string } | undefined,
  mother: { name?: string; profession?: string } | undefined,
  ctx: BiographyContext,
  pick: Pick
): string {
  const { pronouns } = ctx;
  const fatherTrade = father?.profession ? lowerProfession(father.profession) : '';
  const fatherPhrase = fatherTrade ? withIndefiniteArticle(fatherTrade) : '';
  const settled = hasCapability('settled_agriculture', capabilityContext(ctx));
  const motherPhrase = maternalClause(mother?.profession, pronouns, settled);
  const sameTrade = fatherTrade && fatherTrade === lowerProfession(ctx.profession);

  if (fatherPhrase && motherPhrase) {
    return pick([
      `${pronouns.possessiveCap} father was ${fatherPhrase} and ${motherPhrase}; the household lived on both.`,
      `${pronouns.possessiveCap} father was ${fatherPhrase}, while ${motherPhrase}.`,
    ]);
  }
  if (fatherPhrase) {
    return sameTrade
      ? pick([
        `${pronouns.possessiveCap} father was ${fatherPhrase} before ${pronouns.object}, and the trade came down as trades do.`,
        `The work came down from ${pronouns.possessive} father, who was ${fatherPhrase} in the same district.`,
      ])
      : pick([
        `${pronouns.possessiveCap} father was ${fatherPhrase}, and the household lived by it.`,
        `The family kept itself on what ${pronouns.possessive} father earned as ${fatherPhrase}.`,
      ]);
  }
  if (motherPhrase) {
    return `${capitalize(motherPhrase)}, which is what the household mostly ran on.`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// The world around the trade
// ---------------------------------------------------------------------------

const SEASON_CLAUSES: Record<Season, string[]> = {
  winter: ['the year is at its shortest and the stores are being counted', 'it is the dead of the year, when little can be done outdoors'],
  spring: ['the year is opening and there is more work than hands', 'the ground has softened and everything must be done at once'],
  summer: ['work starts before dawn and stops in the worst of the afternoon', 'it is the full of the year, the busiest weeks of it'],
  autumn: ['the harvest is in or nearly so, and accounts are being settled', 'the year is closing and what has been gathered must be made to last'],
  wet: ['the rains have come and the roads have gone', 'the wet season has closed the ways out of the district'],
  dry: ['the dry season has hardened the ground and opened the roads', 'the water is low and every household is reckoning how far it will go'],
};

const INSTITUTION_CLAUSES: Record<string, string[]> = {
  craft_guild: [
    'the guild sets what may be charged and who may charge it',
    'no one works a trade without the guild\'s leave',
  ],
  university: [
    'there are scholars in the town who argue about matters no one else has heard of',
    'the university stands over the place, a world entirely closed to most of those who live beneath it',
  ],
  factory: [
    'the new manufactories have begun to take in the people the land no longer needs',
    'the mills draw in labor from thirty miles around',
  ],
  modern_bureaucracy: [
    'there are now offices that keep a record of every birth, death and holding',
    'the state has begun to write everyone down',
  ],
  railway_station: [
    'the railway has put places a week away within a day',
    'the trains have made the district less separate than it has ever been',
  ],
  mass_political_party: [
    'the parties hold meetings that fill the hall and empty the tavern',
    'politics has become something ordinary people are expected to have a position on',
  ],
  organized_religion: [
    'the calendar of the district is set by its festivals',
    'the observances mark out the year for everyone, devout or not',
  ],
};

/**
 * One sentence locating the persona in the material and institutional world of
 * their year and locale. Draws on data the generator already computes and
 * previously never used: institutions, technologies, season, language.
 */
const REGISTER_WORLD_CLAUSES: Record<SettlementRegister, string[]> = {
  band: [
    'The band moves when the ground gives out, and everything it owns moves with it.',
    'What the band knows about this country is held by the oldest of them and passed on by telling.',
    'There are perhaps thirty people in the world ${subject} sees in an ordinary year.',
  ],
  village: [
    'The settlement is small enough that every household knows what every other one owes.',
    'What happens here is settled among the households themselves, there being no one else to settle it.',
  ],
  district: [],
};

export function describeWorldTexture(ctx: BiographyContext, pick: Pick): string {
  const options: string[] = [];
  const { pronouns } = ctx;
  const register = registerFor(ctx);

  if (register !== 'district') {
    // Guilds, universities and parish calendars have nothing to describe here.
    options.push(
      pick(REGISTER_WORLD_CLAUSES[register])
        .replace(/\$\{subject\}/g, pronouns.subject)
        .replace(/\bsees\b/g, pronouns.subject === 'they' ? 'see' : 'sees')
    );
    if (ctx.language) {
      options.push(`${pronouns.possessiveCap} world ${pronouns.be} conducted wholly in ${ctx.language}.`);
    }
    return pick(options);
  }

  const institutions = ctx.historical?.institutions ?? [];
  const zone = ctx.historical?.culturalZone;
  // `institutionsForYear` is date-gated but not place-gated, so it will hand
  // back a craft guild for ninth-century Cusco. Filter to the zones where each
  // institution actually existed before putting one into prose.
  const locale = ctx.historical?.localeType;
  const zoneAllows = (institution: string): boolean => {
    // These are all town-and-city institutions. `inferLocaleType` returns
    // 'unknown' for a lot of real places, and `institutionsForYear` treats
    // anything not explicitly rural as urban, which put craft guilds in
    // mountain districts.
    const urbanOnly = ['craft_guild', 'university', 'factory', 'railway_station', 'modern_bureaucracy', 'mass_political_party'];
    if (urbanOnly.includes(institution) && locale !== 'city' && locale !== 'town') return false;
    if (!zone) return institution === 'organized_religion';
    switch (institution) {
      case 'craft_guild':
        return ['EUROPEAN', 'MENA', 'EAST_ASIAN', 'SOUTH_ASIAN'].includes(zone);
      case 'university':
        return ['EUROPEAN', 'MENA', 'SOUTH_ASIAN', 'EAST_ASIAN'].includes(zone);
      case 'factory':
      case 'railway_station':
      case 'modern_bureaucracy':
      case 'mass_political_party':
        // Industrial institutions reached different zones at very different
        // dates; the year gate alone is too generous outside the North Atlantic.
        return ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'].includes(zone) || ctx.year >= 1900;
      default:
        return true;
    }
  };

  // Prefer the most historically distinctive institution present.
  const priority = ['railway_station', 'factory', 'mass_political_party', 'modern_bureaucracy', 'craft_guild', 'university', 'organized_religion'];
  const institution = priority.find(id => institutions.includes(id) && zoneAllows(id));
  if (institution && INSTITUTION_CLAUSES[institution]) {
    options.push(`In ${ctx.location}, ${pick(INSTITUTION_CLAUSES[institution])}.`);
  }

  if (ctx.language) {
    options.push(
      `${pronouns.possessiveCap} world ${pronouns.be} conducted in ${ctx.language}, and in whatever else the market requires.`
    );
  }

  // The season is true of everyone in the district rather than of this person,
  // so it is the last resort rather than a competitor to the sharper clauses.
  if (options.length === 0 && ctx.season && SEASON_CLAUSES[ctx.season]) {
    options.push(`${capitalize(pick(SEASON_CLAUSES[ctx.season]))}.`);
  }

  if (options.length === 0) return '';
  return pick(options);
}

// ---------------------------------------------------------------------------
// Household register
// ---------------------------------------------------------------------------

/**
 * "A respectable family" and "a prosperous household" presuppose a stratified,
 * property-holding society. Bands and hamlets need their own vocabulary.
 */
const WEALTH_WORDS: Record<SettlementRegister, Record<string, string>> = {
  band: {
    poor: 'hard-pressed',
    modest: 'ordinary',
    comfortable: 'well-provided',
    wealthy: 'well-provided',
    noble: 'well-regarded',
  },
  village: {
    poor: 'poor',
    modest: 'humble',
    comfortable: 'comfortable',
    wealthy: 'prosperous',
    noble: 'leading',
  },
  district: {
    poor: 'poor',
    modest: 'humble',
    comfortable: 'respectable',
    wealthy: 'prosperous',
    noble: 'noble',
  },
};

export function wealthAdjective(wealthLevel: string | undefined, ctx: BiographyContext): string {
  const table = WEALTH_WORDS[registerFor(ctx)];
  return (wealthLevel && table[wealthLevel]) || table.modest;
}

const CHILDHOOD_TEXTURES: Record<SettlementRegister, string[]> = {
  band: [
    'Childhood was spent moving with the band, learning the country by walking over it.',
    'The children of the camp were watched by whoever was nearest, and learned by doing what the adults did.',
    'What ${possessive} generation was taught, it was taught by copying and by being corrected.',
  ],
  village: [
    'The settlement was small enough that every adult in it had some claim on ${possessive} behavior.',
    'Childhood meant work from the moment ${subject} could be useful, which was early.',
  ],
  district: [
    'Childhood meant work from the moment ${subject} could be useful, which was early.',
    'The street ${subject} grew up on knew ${possessive} family, its trade and its debts.',
    '${possessiveCap} early years were spent among more people than most of ${possessive} ancestors met in a lifetime.',
  ],
};

/**
 * One sentence of childhood texture for the origins paragraph, which otherwise
 * ran three sentences against the present paragraph's eight.
 */
export function describeChildhood(ctx: BiographyContext, pick: Pick): string {
  const { pronouns } = ctx;
  return pick(CHILDHOOD_TEXTURES[registerFor(ctx)])
    .replace(/\$\{possessiveCap\}/g, pronouns.possessiveCap)
    .replace(/\$\{possessive\}/g, pronouns.possessive)
    .replace(/\$\{subject\}/g, pronouns.subject);
}

// ---------------------------------------------------------------------------
// Foundational attributes as biography
// ---------------------------------------------------------------------------

export type BiographySlot = 'origin' | 'present';

interface AttributeNarrative {
  slot: BiographySlot;
  render: (ctx: BiographyContext) => string;
}

const p = (ctx: BiographyContext) => ctx.pronouns;

/**
 * Prose for every attribute flagged `foundational`. The old map covered 17 ids
 * out of what is now 58, so most life-defining badges produced no biography at
 * all — an Outcaste persona said nothing about it.
 */
const ATTRIBUTE_NARRATIVES: Record<string, AttributeNarrative> = {
  // --- Body and sense
  blind: { slot: 'present', render: c => `${p(c).possessiveCap} world ${p(c).be} one of touch, sound and memory; ${p(c).subject} ${conjugate('have', p(c))} been blind since ${c.age > 10 ? 'childhood' : 'birth'}.` },
  deaf: { slot: 'present', render: c => `${c.name} ${conjugate('hear', p(c))} nothing, and ${conjugate('read', p(c))} the world instead through gesture, face and the shake of a floor.` },
  mute: { slot: 'present', render: c => `Unable to speak, ${p(c).subject} ${conjugate('make', p(c))} ${p(c).possessive} meaning by hand and expression, and ${p(c).be} understood by those who trouble to look.` },
  lame: { slot: 'present', render: c => `${p(c).possessiveCap} gait ${p(c).be} marked by a pronounced limp, the legacy of an injury taken in ${c.age > 20 ? 'youth' : 'childhood'}.` },
  clubfoot: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${p(c).subject === 'they' ? 'were' : 'was'} born with a twisted foot and ${conjugate('have', p(c))} never known any other way of walking.` },
  one_armed: { slot: 'present', render: c => `An arm was lost years ago to ${c.age > 25 ? 'injury' : 'illness'}, and ${p(c).subject} ${conjugate('have', p(c))} rebuilt every habit of work around its absence.` },
  hunchback: { slot: 'origin', render: c => `${p(c).possessiveCap} spine curved in childhood and never straightened, so that one shoulder rides far above the other.` },
  pox_scarred: { slot: 'present', render: c => `${p(c).possessiveCap} face ${p(c).be} deeply pitted by the smallpox — the mark of having survived what carried off so many others.` },
  disfigured: { slot: 'present', render: c => `${p(c).possessiveCap} face bears the marks of ${c.age > 15 ? 'an accident' : 'a childhood illness'}, scars that draw stares but do not define ${p(c).object}.` },
  six_fingered: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${conjugate('have', p(c))} an extra finger on one hand, kept out of sight in company and put to use at work.` },
  cleft_lip: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was born with a cleft lip, which the neighbors attribute to some fright ${p(c).possessive} mother suffered while carrying ${p(c).object}.` },
  vitiligo: { slot: 'present', render: c => `Pale patches have been spreading across ${p(c).possessive} skin for years, and there are those in ${c.location} who read a judgment in them.` },
  albino: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was born wholly without color, which makes the sun an enemy and some of ${p(c).possessive} neighbors another.` },
  bound_feet: { slot: 'origin', render: c => `${p(c).possessiveCap} feet were bound in childhood, and ${p(c).subject} ${conjugate('walk', p(c))} the short swaying steps that were the whole purpose of it.` },

  // --- Illness
  consumptive: { slot: 'present', render: c => `A consumptive cough has settled in and everyone who hears it knows what it means, ${p(c).subject} included.` },
  falling_sickness: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${p(c).be} subject to fits that arrive without warning, and opinion in ${c.location} is divided on whether the cause is holy or foul.` },
  soldiers_heart: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${conjugate('start', p(c))} at every sudden noise, and the heart races for reasons ${p(c).subject} will not name.` },
  mercury_tremor: { slot: 'present', render: c => `The fumes of the trade have gotten into ${p(c).object}: the hands shake now, and the temper goes without warning.` },

  // --- Mind and habit
  educated: { slot: 'origin', render: c => `Unusually for someone of ${p(c).possessive} station, ${p(c).subject} ${conjugate('have', p(c))} been taught letters, and ${conjugate('read', p(c))} and ${conjugate('write', p(c))} with facility.` },
  humor_melancholic: { slot: 'present', render: c => `The physicians would call ${p(c).object} melancholic, burdened with an excess of black bile, and ${p(c).subject} ${conjugate('understand', p(c))} ${p(c).possessive} own moods in exactly those terms.` },
  sleepwalker: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${conjugate('walk', p(c))} in ${p(c).possessive} sleep and ${conjugate('remember', p(c))} none of it, having twice been found somewhere ${p(c).subject} could not explain.` },
  heavy_drinker: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${conjugate('drink', p(c))} past what the company thinks reasonable, and always ${conjugate('have', p(c))}.` },
  opium_eater: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} began taking opium for pain and ${conjugate('continue', p(c))} for its own sake.` },
  coward: { slot: 'present', render: c => `${p(c).possessiveCap} courage has failed ${p(c).object} in the moments that counted, a fact ${p(c).subject} ${p(c).be} not proud of.` },

  // --- Faith and fortune
  devout: { slot: 'origin', render: c => `${p(c).possessiveCap} faith ${p(c).be} the bedrock of ${p(c).possessive} existence, ordering the day and the year alike.` },
  cursed: { slot: 'present', render: c => `Misfortune has followed ${p(c).object} closely enough that some in ${c.location} say ${p(c).subject} ${p(c).be} cursed, and enough people believe it to matter.` },
  visionary: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${conjugate('dream', p(c))} vividly and ${conjugate('speak', p(c))} of what ${p(c).subject} ${conjugate('see', p(c))}; there are those who take it for prophecy.` },
  evil_eye_feared: { slot: 'present', render: c => `Neighbors make signs when ${p(c).subject} ${conjugate('pass', p(c))}, suspecting ${p(c).possessive} glance of souring milk and sickening children.` },
  under_vow: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${p(c).be} bound by a vow made in a bad hour, and ${conjugate('keep', p(c))} it whatever it costs.` },
  convert: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} came to ${c.religion || 'this faith'} in adulthood, and ${p(c).be} fully trusted by neither the faith ${p(c).subject} left nor the one ${p(c).subject} entered.` },
  pilgrim: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${conjugate('have', p(c))} completed the great pilgrimage of ${p(c).possessive} faith, and ${p(c).be} addressed differently for it ever since.` },
  crypto_believer: { slot: 'origin', render: c => `The household keeps the outward forms demanded of it in ${c.location} and the private practice of another faith entirely, which is a thing that cannot be spoken of.` },
  hafiz: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${conjugate('hold', p(c))} the whole of the scripture in memory, and ${p(c).be} addressed by the title that earns.` },

  // --- Birth and family
  only_survivor: { slot: 'origin', render: c => `Of all the children ${p(c).possessive} mother bore, ${p(c).subject} ${p(c).be} the only one who lived to grow, and the others are still named in the house.` },
  twin: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} came into the world with a twin, and their lives have stayed knotted together since.` },
  orphan: { slot: 'origin', render: c => `Both parents were lost in ${c.age > 15 ? 'youth' : 'childhood'}, and ${p(c).subject} learned self-reliance a good deal earlier than most.` },
  bastard_born: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was born outside marriage, and ${p(c).possessive} parentage has been a shadow at every door since.` },
  foundling: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was left at a gate as an infant; the name ${p(c).subject} ${conjugate('carry', p(c))} was given by strangers rather than inherited.` },
  buried_children: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${conjugate('have', p(c))} buried children, as most parents of ${p(c).possessive} years in ${c.location} have.` },
  widowed_young: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was widowed young and has managed the household alone since.` },
  second_son: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was born too late to inherit; the land went to an elder brother, and ${p(c).subject} was left to find another road.` },

  // --- Status and rupture
  exile: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was driven out of ${p(c).possessive} homeland and has lived in ${c.location} as an exile since.` },
  foreigner: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} came to ${c.location} from elsewhere, and speech and manner still mark ${p(c).object} out as having done so.` },
  veteran: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} has been to war, and both body and memory still carry it.` },
  plague_survivor: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} took the plague and lived, which almost nobody does, and is regarded strangely for it.` },
  famine_survivor: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} lived through a hunger that emptied the district, and has never since been able to watch food wasted.` },
  shipwrecked: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} survived a wreck that took the rest of the ship's company, and will not be drawn on the subject.` },
  former_slave: { slot: 'origin', render: c => `${p(c).possessiveCap} freedom was hard-won: years were spent in bondage before it was bought, granted or taken.` },
  indentured: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} crossed an ocean against a term of years and has only lately finished working it off.` },
  serf_born: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was born bound to an estate, and still reckons time partly in labor days owed.` },
  runaway_apprentice: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} broke an indenture to a master and has been vague about where ${p(c).subject} trained ever since.` },
  branded: { slot: 'present', render: c => `A court burned its letter into ${p(c).possessive} hand, and no amount of distance from ${c.location} has outrun it.` },
  outcaste: { slot: 'origin', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} was born to work that others will not touch, and is kept at the distance that implies — a fact that orders every encounter before a word is spoken.` },
  caste_marked: { slot: 'origin', render: c => `Strangers in ${c.location} read ${p(c).possessive} caste before ${p(c).possessive} name, and arrange the meeting accordingly.` },
  dhimmi: { slot: 'origin', render: c => `The household holds to a faith other than the ruling one, pays the tax that permits it, and is precise about what that status allows.` },
  sworn_brother: { slot: 'present', render: c => `${p(c).subject.charAt(0).toUpperCase() + p(c).subject.slice(1)} ${p(c).be} bound to a sworn brother by an oath that outranks most claims of blood.` },
  kin_tattoos: { slot: 'origin', render: c => `${p(c).possessiveCap} skin carries the marks of ${p(c).possessive} lineage and standing, which anyone from home can read at a glance.` },
  scarified: { slot: 'origin', render: c => `${p(c).possessiveCap} cheeks were cut at initiation in the pattern of ${p(c).possessive} people, and name them to any stranger who knows how to look.` },
};

/**
 * Prose for one foundational attribute, or an empty string if none is defined.
 */
export function describeFoundationalAttribute(
  attributeId: string,
  ctx: BiographyContext
): { slot: BiographySlot; text: string } | null {
  const entry = ATTRIBUTE_NARRATIVES[attributeId];
  if (!entry) return null;
  return { slot: entry.slot, text: entry.render(ctx) };
}

/** Ids that have biography prose, for tests and audits. */
export function narratedAttributeIds(): string[] {
  return Object.keys(ATTRIBUTE_NARRATIVES);
}

// ---------------------------------------------------------------------------
// Belief worlds without a named religion
// ---------------------------------------------------------------------------

const LOCAL_BELIEF_CLAUSES: string[] = [
  'grew up among the observances the district has always kept, which have no name because they have never needed one',
  'was raised to the spirits of the place — the river, the grove, the dead of the household — and to the offerings each is owed',
  'learned the proper conduct toward the dead and the land before learning any trade',
  'came up in a household that marked the turning of the year with the rites everyone here keeps',
];

/**
 * The religion clause used to be skipped entirely when the religion was
 * "Local Beliefs" or absent, which silenced every prehistoric persona at
 * exactly the point the biography was establishing who raised them.
 */
export function describeUnnamedBelief(ctx: BiographyContext, pick: Pick): string {
  return pick(LOCAL_BELIEF_CLAUSES);
}
