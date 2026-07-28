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
import type { HistoricalContext } from '../types/historicalContext';
import type { Season } from './climateService';
import {
  hasCapability,
  settlementRegister,
  type CapabilityContext,
  type SettlementRegister,
} from '../constants/societyCapabilities';
import {
  classBandFor,
  eligibleClauses,
  renderClause,
  selectText,
  type Clause,
  type ClassBand,
  type ClauseContext,
} from './narrativeClauseService';

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
  /**
   * Foundational attribute ids. Some of them — bondage in particular — change
   * which band a life belongs to more decisively than wealth or status labels
   * do, so the band cannot be derived from `socialClass` alone.
   */
  attributeIds?: string[];
}

/** Seeded chooser supplied by the caller so prose stays stable per persona. */
export type Pick = <T>(values: T[]) => T;

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const capabilityContext = (ctx: BiographyContext): CapabilityContext => ({
  year: ctx.year,
  culturalZone: ctx.historical?.culturalZone,
  placeLower: `${ctx.location ?? ''} ${ctx.region ?? ''}`.toLowerCase(),
});

/** Where this life sits in the order of its own society. */
export function bandFor(ctx: BiographyContext): ClassBand {
  return classBandFor({
    socialClass: ctx.socialClass,
    wealthLevel: ctx.wealthLevel,
    attributeIds: ctx.attributeIds,
  });
}

/** The context every gated clause bank is filtered against. */
export function clauseContextFor(ctx: BiographyContext): ClauseContext {
  const capabilities = capabilityContext(ctx);
  return {
    year: ctx.year,
    zone: ctx.historical?.culturalZone,
    register: registerFor(ctx),
    locale: ctx.historical?.localeType ?? 'unknown',
    band: bandFor(ctx),
    institutions: ctx.historical?.institutions ?? [],
    technologies: ctx.historical?.technologies ?? [],
    hasCapability: capability => hasCapability(capability, capabilities),
  };
}

/** Placeholders that clause text may name besides the pronouns. */
const clauseExtras = (ctx: BiographyContext): Record<string, string | undefined> => ({
  location: ctx.location,
  language: ctx.language,
  religion: ctx.religion,
  name: ctx.name,
});

const fromBank = (bank: Clause[], ctx: BiographyContext, pick: Pick): string =>
  selectText(bank, clauseContextFor(ctx), pick, ctx.pronouns, clauseExtras(ctx));

/**
 * Choose one fragment from a gated bank, for callers outside this module that
 * hold their own banks — the personality traits, which are selected by
 * temperament thresholds rather than by anything historical, but whose wording
 * still ought to depend on when and where the person lived.
 */
export function selectDetail(bank: Clause[], ctx: BiographyContext, pick: Pick): string {
  return fromBank(bank, ctx, pick);
}

/**
 * "The district" is wrong for a band that moves with the season and wrong
 * again for a hamlet of forty people. Prose picks its nouns from this.
 */
const SETTLED_TRADES = /farm|field hand|miller|plough|plow|harvest|vintner|planter|shopkeep|clerk|scribe|weaver|potter|smith|mason|carpenter|baker|innkeep|merchant/i;

export function registerFor(ctx: BiographyContext): SettlementRegister {
  let base = settlementRegister(capabilityContext(ctx), (ctx.profession || '').toLowerCase());
  // A persona who works fields or keeps a shop does not live in a band,
  // whatever the zone-level table says; describing them as both is worse than
  // describing them as settled.
  if (base === 'band' && SETTLED_TRADES.test(ctx.profession || '')) base = 'village';

  // `settlementRegister` answers "does this society have cities", which is not
  // the same question as "does this person live in one". Without the locale
  // refinement — the same one `birthplaceService` already applies — a persona
  // born in a hamlet was told, one sentence later, about the street they grew
  // up on.
  const locale = ctx.historical?.localeType;
  if ((locale === 'city' || locale === 'town') && base !== 'band') return 'district';
  if (locale === 'rural' && base === 'district') return 'village';
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
  // Modern variants come first so they win the match. Without them a 2028
  // "small business owner" fell through to the pre-modern merchant family and
  // was described as keeping a stall and judging strangers quickly.
  {
    match: /shopkeep|business owner|proprietor|retailer|franchise/,
    minYear: 1950,
    clauses: [
      'a lease, a margin, and accounts that have to satisfy someone in an office',
      'long hours in a small business that is one bad quarter from closing',
      'stock, staff, and the paperwork that comes with both',
      'a trade that competes with firms large enough not to notice it',
    ],
  },
  {
    match: /field hand|farm worker|farm labor|agricultural worker|picker/,
    minYear: 1950,
    clauses: [
      'seasonal work on land owned by a company rather than a family',
      'a crop planted, sprayed and lifted to a schedule decided somewhere else',
      'piece rates, a contractor, and a season that ends without notice',
    ],
  },
  {
    match: /nurse|orderly|care worker|carer|paramedic|health worker/,
    minYear: 1900,
    clauses: [
      'twelve-hour shifts, and a professional calm that has to be put on at the door',
      'other people at the worst hours of their lives, handled competently and then handed over',
      'a rota, a uniform, and more responsibility than the pay reflects',
    ],
  },
  {
    match: /cashier|checkout|shop assistant|sales assistant|retail/,
    minYear: 1950,
    clauses: [
      'a till, a queue, and eight hours of being pleasant to strangers',
      'shifts posted a week ahead and changed with less notice than that',
      'standing in one place while the same few hundred transactions repeat',
    ],
  },
  {
    match: /programmer|developer|software|analyst|designer|consultant|marketing/,
    minYear: 1980,
    clauses: [
      'work that leaves no physical trace and is described to relatives with difficulty',
      'a screen, a calendar full of meetings, and deadlines set by people ${subject} ${verb:have} never met',
      'a salary, a laptop, and no clear line between the working day and the rest of it',
    ],
  },
  {
    match: /driver|courier|delivery|taxi|rideshare|logistics/,
    minYear: 1970,
    clauses: [
      'a route, a schedule, and a device that knows where ${subject} ${verb:be} at all times',
      'paid by the drop, so the day is a long argument with traffic',
      'hours on the road alone, and a depot that is only ever seen at either end of them',
    ],
  },
  {
    match: /mill hand|mill worker|factory|textile worker|jute|operative|spinning shed|plant worker/,
    minYear: 1950,
    clauses: [
      'a line that sets the pace, a quota that rises, and a plant that could close',
      'shift work, ear protection, and a job that has survived three rounds of talk about automating it',
      'the same motion for eight hours, and a body that keeps the count even when the mind stops',
    ],
  },
  {
    match: /mill hand|mill worker|factory|textile worker|jute|operative|spinning shed/,
    minYear: 1760,
    maxYear: 1949,
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
    match: /salaryman|office worker|office manager|white collar|executive|manager/,
    minYear: 1920,
    clauses: [
      'a desk, a hierarchy, and a career measured in the distance between them',
      'work that produces no object, and is judged by people who produce none either',
      'the same building, the same hours and the same colleagues for a very long time',
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
 * What to say when no trade family matches, which is common: the profession
 * tables are far wider than the texture list and always will be.
 *
 * These used to be two plain records keyed on register and locale, with no date
 * on any of them, so a liberation theologian in 2003 was told his work moved
 * when the camp moved.
 */
const GENERIC_TRADE_CLAUSES: Clause[] = [
  { text: 'work shared out among the band as the season and the country allow', register: ['band'] },
  { text: 'whatever the camp needs doing, done by whoever is nearest and able', register: ['band'] },
  { text: 'skills everyone in the band holds to some degree, and a few hold better', register: ['band'] },

  { text: 'the ordinary work of the settlement, done alongside everyone else in it', register: ['village'] },
  { text: 'a task the household has always done, and expects to go on doing', register: ['village'] },

  { text: 'a day\'s work sold in a city where there is always someone willing to do it cheaper', register: ['district'], locale: ['city'], maxYear: 1930 },
  { text: 'labor taken where it is offered, in a place with more people than employment', register: ['district'], locale: ['city'], maxYear: 1930 },
  { text: 'steady enough work in a place small enough that everyone knows what it pays', register: ['district'], locale: ['town'], maxYear: 1930 },
  { text: 'a trade practiced among neighbors who have known the family for generations', register: ['district'], locale: ['town'], maxYear: 1930 },
  { text: 'work that follows the season rather than the clock', locale: ['rural'], maxYear: 1930 },
  { text: 'the ordinary labor of the district, done alongside everyone else who lives in it', register: ['district'], locale: ['rural'], maxYear: 1930 },
  { text: 'work that moves when the camp moves', locale: ['mobile'], maxYear: 1900 },
  { text: 'a living made on the road, between one halt and the next', locale: ['mobile'], maxYear: 1900 },

  // --- After the wage
  { text: 'fixed hours, a fixed rate, and a job title that appears on a form somewhere', minYear: 1900 },
  { text: 'work that is the same on Tuesday as it was on Monday, and paid at the end of the month', minYear: 1900 },
  { text: 'a contract, a job description, and very little relation between the two', minYear: 1950 },
  { text: 'a post in a city where the rent assumes two wages and the work provides one', locale: ['city'], minYear: 1950 },
  { text: 'employment that has to be travelled to, which is most of what distinguishes it from ${possessive} grandparents\' work', minYear: 1950 },
  { text: 'a living made in an economy that no longer has much use for the district it is made in', locale: ['rural'], minYear: 1960 },

  // --- Last resort
  { text: 'the ordinary work of the place, done in the ordinary way' },
];

/**
 * A sentence describing what the persona's trade actually consists of.
 */
export function describeProfessionWork(ctx: BiographyContext, pick: Pick): string {
  const professionText = (ctx.profession || '').toLowerCase();

  const texture = TRADE_TEXTURES.find(t =>
    t.match.test(professionText)
    && (t.minYear === undefined || ctx.year >= t.minYear)
    && (t.maxYear === undefined || ctx.year <= t.maxYear)
  );

  const register = registerFor(ctx);
  const eligibleGeneric = eligibleClauses(GENERIC_TRADE_CLAUSES, clauseContextFor(ctx));
  const fallback = eligibleGeneric.length > 0
    ? eligibleGeneric.map(clause => clause.text)
    : ['the ordinary work of the place, done in the ordinary way'];

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

  const clause = renderClause(pick(available), ctx.pronouns, clauseExtras(ctx));

  // Every opener must govern a bare noun phrase, since that is the shape all
  // the clauses take.
  const openers = ['The work means ', 'That means ', 'It comes down to ', 'The trade is '];
  return `${pick(openers)}${clause}.`;
}

/**
 * How the persona holds their trade, as a short plain sentence.
 *
 * `describeProfessionWork` has exactly one register: a frame governing a
 * compressed noun phrase — "That means fourteen hours inside the noise of the
 * machines". It is a good register and it was the only one, so every biography
 * in every era described work in the same aphoristic voice at the same length.
 *
 * These are deliberately short, plain and often flat. Their job is to break the
 * rhythm rather than to add information.
 */
const TRADE_ATTITUDES: Clause[] = [
  // --- Flat
  { text: 'It is a job.', minYear: 1900 },
  { text: 'It is work, and it pays.' },
  { text: 'It is what there is.' },
  { text: 'The work is the work.' },

  // --- Content
  { text: '${subjectCap} ${verb:be} good at it, and ${verb:know} it.' },
  { text: '${subjectCap} ${verb:find} the work soothing, which not everyone does.' },
  { text: 'It suits ${object}.' },
  { text: '${subjectCap} ${verb:take} more pride in it than the pay would justify.' },
  { text: '${subjectCap} ${verb:like} it more than ${subject} ${verb:admit}.' },

  // --- Not content
  { text: '${subjectCap} ${verb:do} not enjoy it very much.' },
  { text: '${subjectCap} would not choose it again.' },
  { text: 'It is not what ${subject} intended.' },
  { text: '${subjectCap} ${verb:be} tired of it in a way that has stopped being interesting.' },

  // --- Never a choice
  { text: '${subjectCap} ${verb:have} never had much say in the matter.' },
  { text: 'It was decided for ${object}, more or less, before ${subject} could object.' },
  { text: 'There was never a version of ${possessive} life in which ${subject} did something else.' },
  { text: 'Whether ${subject} ${verb:like} it has never been a question anyone thought to ask.', band: ['bonded'] },

  // --- Long habit
  { text: 'It is the only work ${subject} ${verb:have} ever done.' },
  { text: '${subjectCap} ${verb:have} been at it long enough to stop noticing it.' },
  { text: 'It is better than the alternative, which ${subject} ${verb:have} also done.' },

  // --- After the wage
  { text: '${subjectCap} ${verb:describe} it to strangers as fine.', minYear: 1950 },
  { text: 'It is not a career, it is a job, and ${subject} ${verb:be} clear about the difference.', minYear: 1950 },
  { text: '${subjectCap} ${verb:intend} to do something else, and ${verb:have} intended it for some years.', minYear: 1920 },
  { text: 'The pay is the point, and ${subject} ${verb:have} stopped pretending otherwise.', minYear: 1950 },

  // --- Station
  { text: 'It is less an occupation than a position, and ${subject} ${verb:hold} it because of who ${possessive} father was.', band: ['elite'] },
  { text: 'It keeps the household fed, most years.', band: ['poor', 'working'] },
];

export function describeTradeAttitude(ctx: BiographyContext, pick: Pick): string {
  return fromBank(TRADE_ATTITUDES, ctx, pick);
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
  name?: string,
): string => {
  if (!profession) return '';
  const ref = name ? `${pronouns.possessive} mother ${name}` : `${pronouns.possessive} mother`;
  const key = profession.trim().toLowerCase();
  const activity = (!settled && FORAGING_ACTIVITIES[key]) || MATERNAL_ACTIVITIES[key];
  if (activity) return `${ref} ${activity}`;
  return `${ref} worked as ${withIndefiniteArticle(lowerProfession(profession))}`;
};

export function describeParentalLivelihood(
  father: { name?: string; profession?: string } | undefined,
  mother: { name?: string; profession?: string } | undefined,
  ctx: BiographyContext,
  pick: Pick,
  /**
   * Name the parents here rather than in a closing sentence. Every biography
   * used to end with "His parents are X and Y", which measured as 2.6% of all
   * sentences generated — a louder template signal than any single phrasing.
   */
  nameParents = false,
): string {
  const { pronouns } = ctx;
  const fatherTrade = father?.profession ? lowerProfession(father.profession) : '';
  const fatherPhrase = fatherTrade ? withIndefiniteArticle(fatherTrade) : '';
  const settled = hasCapability('settled_agriculture', capabilityContext(ctx));
  const motherPhrase = maternalClause(
    mother?.profession,
    pronouns,
    settled,
    nameParents ? mother?.name : undefined,
  );
  const sameTrade = fatherTrade && fatherTrade === lowerProfession(ctx.profession);
  const fatherRef = nameParents && father?.name
    ? `${pronouns.possessive} father ${father.name}`
    : `${pronouns.possessive} father`;
  const FatherRef = capitalize(fatherRef);

  const band = bandFor(ctx);
  const modern = ctx.year >= 1900;

  if (fatherPhrase && motherPhrase) {
    return pick([
      `${FatherRef} was ${fatherPhrase} and ${motherPhrase}; the household lived on both.`,
      `${FatherRef} was ${fatherPhrase}, while ${motherPhrase}.`,
      `${FatherRef} was ${fatherPhrase}; ${motherPhrase}, which was the less visible half of it.`,
      `The household had two livelihoods in it: ${fatherRef} was ${fatherPhrase}, and ${motherPhrase}.`,
      ...(modern
        ? [`${FatherRef} was ${fatherPhrase} and ${motherPhrase}, and between them they kept the family just above where it had started.`]
        : []),
      ...(band === 'poor' || band === 'bonded'
        ? [`${FatherRef} was ${fatherPhrase} and ${motherPhrase}, and neither was enough on its own.`]
        : []),
    ]);
  }
  if (fatherPhrase) {
    if (sameTrade) {
      return pick([
        `${FatherRef} was ${fatherPhrase} before ${pronouns.object}, and the trade came down as trades do.`,
        `The work came down from ${fatherRef}, who was ${fatherPhrase} in the same district.`,
        ...(modern
          ? [`${FatherRef} did the same work, which was either an inheritance or a failure to escape, depending on who is asked.`]
          : []),
      ]);
    }
    return pick([
      `${FatherRef} was ${fatherPhrase}, and the household lived by it.`,
      `The family kept itself on what ${fatherRef} earned as ${fatherPhrase}.`,
      ...(band === 'elite'
        ? [`The family's standing rested on ${fatherRef}'s position as ${fatherPhrase}.`]
        : []),
      ...(band === 'bonded'
        ? [`${FatherRef} was ${fatherPhrase}, and what he produced was not, in the end, his to dispose of.`]
        : []),
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

/**
 * One sentence locating the persona in the material and institutional world of
 * their year, place and station.
 *
 * The zone filtering that used to live in a `zoneAllows` switch here is now
 * expressed as clause conditions, so there is one gating mechanism rather than
 * two. Where the old switch said "industrial institutions reached different
 * zones at very different dates", that is now two clauses with different
 * `zones`/`minYear` pairs.
 *
 * Note the `maxYear` on the novelty clauses. Without one, a persona in 2027 was
 * being told that the trains had made the district less separate than it had
 * ever been.
 */
const WORLD_CLAUSES: Clause[] = [
  // --- Societies without a settled district
  { text: 'The band moves when the ground gives out, and everything it owns moves with it.', register: ['band'] },
  { text: 'What the band knows about this country is held by the oldest of them and passed on by telling.', register: ['band'] },
  { text: 'There are perhaps thirty people in the world ${subject} ${verb:see} in an ordinary year.', register: ['band'] },
  { text: 'Everything the band owns, it can carry.', register: ['band'] },

  { text: 'The settlement is small enough that every household knows what every other one owes.', register: ['village'] },
  { text: 'What happens here is settled among the households themselves, there being no one else to settle it.', register: ['village'], maxYear: 1800 },
  { text: 'The nearest authority worth the name is a day\'s walk off, and is not often troubled.', register: ['village'], maxYear: 1850 },
  { text: '${location} has a school, a clinic and a road out, and none of the three existed when ${possessive} grandparents were young.', register: ['village'], minYear: 1930 },
  { text: 'Half the young people have left ${location} for the cities, and what they send back is a good part of what keeps it standing.', register: ['village'], minYear: 1950 },

  // --- Institutions of the settled, urban world
  { text: 'In ${location}, the guild sets what may be charged and who may charge it.', institution: 'craft_guild', register: ['district'], locale: ['city', 'town'], zones: ['EUROPEAN', 'MENA', 'EAST_ASIAN', 'SOUTH_ASIAN'] },
  { text: 'In ${location}, no one works a trade without the guild\'s leave.', institution: 'craft_guild', register: ['district'], locale: ['city', 'town'], zones: ['EUROPEAN', 'MENA', 'EAST_ASIAN', 'SOUTH_ASIAN'] },
  { text: 'There are scholars in ${location} who argue about matters no one else has heard of.', institution: 'university', register: ['district'], locale: ['city', 'town'], zones: ['EUROPEAN', 'MENA', 'SOUTH_ASIAN', 'EAST_ASIAN'] },
  { text: 'The university stands over ${location}, a world entirely closed to most of those who live beneath it.', institution: 'university', register: ['district'], locale: ['city', 'town'], zones: ['EUROPEAN', 'MENA', 'SOUTH_ASIAN', 'EAST_ASIAN'] },

  { text: 'The new manufactories have begun to take in the people the land no longer needs.', institution: 'factory', register: ['district'], locale: ['city', 'town'], zones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'], maxYear: 1900 },
  { text: 'The mills draw in labor from thirty miles around.', institution: 'factory', register: ['district'], locale: ['city', 'town'], minYear: 1900, maxYear: 1970 },
  { text: 'There are now offices in ${location} that keep a record of every birth, death and holding.', institution: 'modern_bureaucracy', register: ['district'], locale: ['city', 'town'], zones: ['EUROPEAN', 'NORTH_AMERICAN_COLONIAL'], maxYear: 1900 },
  { text: 'The state has begun to write everyone down.', institution: 'modern_bureaucracy', register: ['district'], locale: ['city', 'town'], minYear: 1900, maxYear: 1960 },
  { text: 'The railway has put places a week away within a day.', institution: 'railway_station', register: ['district'], locale: ['city', 'town'], maxYear: 1900 },
  { text: 'The trains have made the district less separate than it has ever been.', institution: 'railway_station', register: ['district'], locale: ['city', 'town'], maxYear: 1930 },
  { text: 'The line through ${location} carries freight now and passengers rarely, and half the station is shut.', institution: 'railway_station', register: ['district'], minYear: 1970 },
  { text: 'The parties hold meetings that fill the hall and empty the tavern.', institution: 'mass_political_party', register: ['district'], locale: ['city', 'town'], maxYear: 1960 },
  { text: 'Politics has become something ordinary people are expected to have a position on.', institution: 'mass_political_party', register: ['district'], locale: ['city', 'town'], minYear: 1900 },
  { text: 'Printed sheets circulate in ${location} now, and there is an argument in every one of them.', technology: 'printing_press', register: ['district'], zones: ['EUROPEAN'], maxYear: 1750 },

  // --- Religion, which does not stop in 1900 but changes what it is
  { text: 'In ${location}, the calendar is set by the festivals.', institution: 'organized_religion', register: ['village', 'district'], maxYear: 1900 },
  { text: 'In ${location}, the observances mark out the year for everyone, devout or not.', institution: 'organized_religion', register: ['village', 'district'], maxYear: 1900 },
  { text: 'The observances still mark the year in ${location}, though fewer people keep them than say they do.', institution: 'organized_religion', register: ['village', 'district'], minYear: 1950 },

  // --- The twentieth-century state and its furniture
  { text: 'Nearly everyone in ${location} under fifty can read, which was not true of the generation before them.', institution: 'compulsory_school', minYear: 1920 },
  { text: 'The state knows ${possessive} name, ${possessive} age and where ${subject} ${verb:sleep}, and expects to be told when any of it changes.', institution: 'identity_papers' },
  { text: 'There is a clinic in ${location}, and the children who would once have died of a fever mostly do not.', institution: 'public_clinic', minYear: 1930 },
  { text: 'Old age has become the state\'s business as much as the family\'s, which is a change nobody quite decided on.', institution: 'welfare_state', minYear: 1960 },
  { text: 'There is a pension at the end of it, in principle, and a running argument about whether it will still be there.', institution: 'welfare_state', zones: ['EUROPEAN'], minYear: 1970 },
  { text: 'What people in ${location} argue about is largely what they have all watched.', institution: 'mass_media', minYear: 1955 },
  { text: 'What ${location} eats now arrives on a lorry rather than out of the ground around it.', institution: 'chain_retail' },
  { text: 'Everyone in ${location} is reachable at any hour, which is far newer than it feels.', institution: 'mobile_network', minYear: 2005 },

  // --- Technologies as they are actually noticed
  { text: 'News that used to arrive with a traveler now arrives before them.', technology: 'telegraph', maxYear: 1920 },
  { text: 'The road through ${location} carries more in a day than the old one carried in a season.', technology: 'motor_transport', minYear: 1930, maxYear: 1990 },
  { text: 'Illnesses that killed ${possessive} grandparents are a course of tablets now, which is the great unremarked fact of ${possessive} lifetime.', technology: 'antibiotics', minYear: 1960 },
  { text: 'The evening in ${location} belongs to the television, and the street empties for it.', technology: 'television', minYear: 1960, maxYear: 2005 },
  { text: 'People from ${location} work in countries ${possessive} grandparents could not have named, and send the money home.', technology: 'jet_travel', minYear: 1975 },
  { text: 'Most of ${possessive} dealings with work, the state and distant relatives now happen on a screen.', technology: 'internet', minYear: 2000 },
  { text: 'There is a phone in every pocket in ${location}, and the day\'s news, wages and arguments all arrive through it.', technology: 'smartphone', minYear: 2012 },

  // --- What the world looks like from a particular station in it
  { text: 'What happens in ${location} is decided by perhaps a dozen households, and ${possessive} own is one of them.', band: ['elite'], register: ['village', 'district'], maxYear: 1900 },
  { text: 'The days ${subject} ${verb:owe} are counted by someone else, and the count is not open to dispute.', band: ['bonded'] },
  { text: 'A bad season here is not an inconvenience but the difference between the household holding together and not.', band: ['poor'], maxYear: 1900 },
  { text: 'Rent takes the largest part of what comes in, and the rest is arithmetic done weekly.', band: ['poor'], locale: ['city', 'town'], minYear: 1850 },
  { text: 'The household is solvent, and very nearly the whole of its anxiety is about staying so.', band: ['middling'], minYear: 1900 },

  // --- Language. Filtered out below when the persona has no named language.
  { text: '${possessiveCap} world ${be} conducted wholly in ${language}.', register: ['band', 'village'], maxYear: 1850 },
  { text: '${possessiveCap} world ${be} conducted in ${language}, and in whatever else the market requires.', register: ['district'], maxYear: 1900 },
  { text: 'The household speaks ${language}; the school, the office and the form are conducted in something else.', minYear: 1880 },
  { text: '${subjectCap} ${verb:speak} ${language} at home and whatever the workplace requires outside it.', minYear: 1950 },
];

export function describeWorldTexture(ctx: BiographyContext, pick: Pick): string {
  // A clause naming the language cannot be used by a persona who has none.
  const bank = ctx.language
    ? WORLD_CLAUSES
    : WORLD_CLAUSES.filter(clause => !clause.text.includes('${language}'));

  const text = fromBank(bank, ctx, pick);
  if (text) return text;

  // The season is true of everyone in the district rather than of this person,
  // so it is the last resort rather than a competitor to the sharper clauses.
  if (ctx.season && SEASON_CLAUSES[ctx.season]) {
    return `${capitalize(pick(SEASON_CLAUSES[ctx.season]))}.`;
  }
  return '';
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

/**
 * "A respectable family" and "a prosperous household" are the vocabulary of a
 * society that ranks households by standing. After the wage and the census the
 * ranking is by income, and the words for it are different ones.
 */
const MODERN_WEALTH_WORDS: Record<string, string> = {
  poor: 'struggling',
  modest: 'ordinary',
  comfortable: 'comfortable',
  wealthy: 'well-off',
  noble: 'affluent',
};

/** Bondage is not a degree of wealth, and reads wrong when described as one. */
const BONDED_WEALTH_WORD = 'bound';

export function wealthAdjective(wealthLevel: string | undefined, ctx: BiographyContext): string {
  if (bandFor(ctx) === 'bonded') return BONDED_WEALTH_WORD;
  const table = ctx.year >= 1900 ? MODERN_WEALTH_WORDS : WEALTH_WORDS[registerFor(ctx)];
  return (wealthLevel && table[wealthLevel]) || table.modest;
}

/**
 * Childhood used to be seven sentences for the whole of human history, chosen
 * on settlement register alone. A childhood is one of the places where era and
 * station are most legible — whether there was a school, whether there was a
 * choice, who else had a claim on the child — so this bank is gated on both.
 */
const CHILDHOOD_CLAUSES: Clause[] = [
  // --- Before farming
  { text: 'Childhood was spent moving with the band, learning the country by walking over it.', register: ['band'] },
  { text: 'The children of the camp were watched by whoever was nearest, and learned by doing what the adults did.', register: ['band'] },
  { text: 'What ${possessive} generation was taught, it was taught by copying and by being corrected.', register: ['band'] },
  { text: 'The plants worth taking, the sign of each animal and the way to water were known to ${object} before ${subject} could carry anything.', register: ['band'] },
  { text: 'There was no day on which ${subject} started working; there was only being small enough to be carried, and then not being.', register: ['band'] },

  // --- Settled, small
  { text: 'The settlement was small enough that every adult in it had some claim on ${possessive} behavior.', register: ['village'] },
  { text: 'Every field, byre and boundary stone within an hour of the house was known to ${object} by the age of ten.', register: ['village'], needs: ['settled_agriculture'] },
  { text: 'The year ${subject} turned seven ${subject} was given animals to mind, and has not been without a task since.', register: ['village'] },

  // --- Settled, urban, before the school
  { text: 'The street ${subject} grew up on knew ${possessive} family, its trade and its debts.', register: ['district'], maxYear: 1900 },
  { text: '${possessiveCap} early years were spent among more people than most of ${possessive} ancestors met in a lifetime.', register: ['district'], maxYear: 1900 },
  { text: 'The quarter kept its own feast days, its own quarrels and its own way of settling both.', register: ['district'], maxYear: 1900 },

  // --- Station, before the modern state
  { text: 'A childhood of tutors, observances and the constant company of servants left ${object} with few memories of being alone.', band: ['elite'], register: ['district'], maxYear: 1900 },
  { text: '${possessiveCap} upbringing was arranged rather than lived: what ${subject} would become was settled well before ${subject} could argue about it.', band: ['elite'], register: ['village', 'district'], maxYear: 1900 },
  { text: 'The household kept a servant and worried about keeping her, which is its own particular kind of childhood.', band: ['middling'], register: ['district'], maxYear: 1950 },
  { text: 'Hunger was not constant but it was familiar, and ${subject} learned early which neighbors could be asked.', band: ['poor'] },
  { text: 'What ${subject} ${verb:remember} of being small is mostly being cold, and being sent on errands.', band: ['poor'], register: ['village', 'district'], maxYear: 1950 },
  { text: 'From about the age of eight ${subject} was another pair of hands, and the household reckoned accordingly.', band: ['poor', 'working'], register: ['village', 'district'], maxYear: 1930 },
  { text: 'The work ${possessive} family owed was owed before ${subject} was born, and ${subject} was counted into it as soon as ${subject} could lift.', band: ['bonded'] },
  { text: 'Childhood ended at whatever age the estate decided it had, which was not an age anyone in the household chose.', band: ['bonded'] },

  // --- The school arrives
  { text: 'School took the mornings whatever the household thought of it, and that was the great difference from ${possessive} parents\' childhood.', institution: 'compulsory_school' },
  { text: 'Childhood acquired a fixed shape: a school year, a summer, and a certificate at the end of it.', institution: 'compulsory_school', minYear: 1900 },
  { text: 'The classroom taught a national language that was not quite the one spoken at home.', institution: 'compulsory_school', minYear: 1900 },
  { text: 'School came second to whatever the household needed that week, and ${subject} left it earlier than the law intended.', institution: 'compulsory_school', band: ['poor', 'bonded'] },
  { text: '${subjectCap} ${verb:be} the first in the family to stay at school past the age ${possessive} parents left it.', institution: 'compulsory_school', band: ['working'], minYear: 1930 },

  // --- The twentieth century in the house
  { text: 'The wireless was on in the evenings, and it was the first thing to bring the outside world into the house without a person carrying it.', technology: 'broadcast_radio', maxYear: 1970 },
  { text: 'There was a television by the time ${subject} was ten, and the family arranged its evenings around it.', technology: 'television', minYear: 1955 },
  { text: 'It was a childhood of a wage arriving weekly, which was more security than ${possessive} grandparents ever had.', band: ['working'], minYear: 1945 },
  { text: 'Childhood was supervised, documented and organized around examinations.', band: ['middling', 'elite'], minYear: 1980 },
  { text: 'By the time ${subject} was grown, most of what ${subject} knew about the wider world had arrived through a screen.', technology: 'internet' },
  { text: 'Childhood ran on a school timetable and a screen, and there is very little of it that was not photographed.', technology: 'smartphone' },
  { text: 'The household had electric light, running water and a doctor within reach — three things ${possessive} great-grandparents would have counted as wealth.', technology: 'electric_light', minYear: 1950 },
];

/**
 * One sentence of childhood texture for the origins paragraph, which otherwise
 * ran three sentences against the present paragraph's eight.
 */
export function describeChildhood(ctx: BiographyContext, pick: Pick): string {
  return fromBank(CHILDHOOD_CLAUSES, ctx, pick);
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
