/**
 * services/narrativeBiographyService.ts
 *
 * Builds the two-paragraph third-person biography shown on the persona card.
 * Extracted from PersonaGeneratorSimple so it can be exercised and audited
 * outside React.
 *
 * Paragraph one is origins: birth, household, the belief world they were
 * raised in, the circumstances that predate them, and one event from youth.
 * Paragraph two is the present: trade and what it involves, body and
 * condition, adult events, the surrounding world, outlook and temperament.
 */

import type { HistoricalPersona } from './personaGenerator';
import type { CulturalZone } from '../types';
import { EventImportance } from '../constants/characterData/lifeHistoryService';
import { IDEOLOGIES, PERSONAL_BELIEFS } from '../constants';
import { getAreaClimate, hemisphereFor, seasonFor } from './climateService';
import { historicalPlaceLabel } from '../constants/gameData/placeLabels';
import { describeBirthplace } from './birthplaceService';
import { getPolityAt, isPluralPolity, rulerTitleFor, withPolityArticle } from './polityService';
import { disruptionClause } from './disruptionResolution';
import { standingRole } from '../constants/characterData/professions';
import {
  conjugate,
  describeIdeology,
  describeLifeEvent,
  describeParents,
  lifeEventClause,
  describePhysicalAppearance,
  getNarrativePronouns,
  isPluralDiseaseName,
  lowerProfession,
  withIndefiniteArticle,
} from './narrativeTextService';
import {
  spouseWorkPhrase,
  describeChildhood,
  describeFoundationalAttribute,
  describeParentalLivelihood,
  describeProfessionWork,
  describeTradeAttitude,
  describeUnnamedBelief,
  describeWorldTexture,
  selectDetail,
  wealthAdjective,
  type BiographyContext,
} from './biographyDetailService';
import type { Clause } from './narrativeClauseService';
import { traitSeals } from '../utils/traitSeals';

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const fnv1a = (text: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/**
 * murmur3's finalizer. Full avalanche, which is the property the old draw
 * lacked: adjacent inputs have to produce unrelated outputs, or two choices
 * made one after another are not independent.
 */
const mix32 = (value: number): number => {
  let hash = value >>> 0;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return hash >>> 0;
};

const SMALL_NUMBERS = [
  'no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
];

/**
 * How far apart two adult events may be and still be told as one stretch of a
 * life. Measured against the generator's own output, the gap between
 * consecutive adult events is 3 years at the median and 12 at the 90th
 * percentile, so a bound of eight left most pairs unchainable.
 */
const CHAIN_MAX_GAP = 15;

/**
 * The interval between two events, for joining them into one sentence. Written
 * out rather than numeric: "At age 31, her father died, and 5 years later she
 * married" puts two figures in one sentence and reads like a ledger.
 */
const yearsLater = (gap: number): string => {
  if (gap === 1) return 'the year after';
  if (gap === 2) return 'two years on';
  return `${SMALL_NUMBERS[gap] ?? gap} years later`;
};

/**
 * How long a regime has held a place, as someone living under it would put it.
 *
 * A date is precise and says nothing: "and has since 1046 BCE" asks the reader
 * to do the subtraction that is the whole point of the sentence. A span is
 * what a subject actually knows — that it has been there longer than anyone
 * can remember, or that it arrived within living memory.
 */
const reignSpan = (years: number): string => {
  if (years < 20) return `${SMALL_NUMBERS[years] ?? years} years`;
  if (years < 45) return `${years} years`;
  if (years < 80) return 'a lifetime';
  if (years < 130) return 'the better part of a century';
  if (years < 175) return 'a century and more';
  const centuries = Math.round(years / 100);
  if (centuries >= 10) return 'longer than the records run';
  const word = SMALL_NUMBERS[centuries] ?? String(centuries);
  return years % 100 >= 50 && years % 100 < 90
    ? `something over ${word} centuries`
    : `${word} centuries and more`;
};

/** Stream names are fixed strings, so their salts are worth caching. */
const STREAM_SALTS = new Map<string, number>();
const streamSalt = (stream: string): number => {
  const cached = STREAM_SALTS.get(stream);
  if (cached !== undefined) return cached;
  const salt = mix32(fnv1a(stream));
  STREAM_SALTS.set(stream, salt);
  return salt;
};

/**
 * What an event left behind.
 *
 * Events were emitted as a list of dated facts — measured, 2.4 per biography,
 * and only 8.9% of biographies contained a causal or temporal connective of
 * any kind. A life told that way is a chronology, not a life: the persona
 * object already knows why this household is poor and why this person is in
 * this town, and the prose never drew the line. One adult event per biography
 * now carries a tail that ties it to something the rest of the text says.
 *
 * These are whole sentences rather than appended clauses, so that no event
 * phrasing can produce a run-on when one is attached.
 */
const CONSEQUENCE_AFTER_LOSS: Clause[] = [
  { text: 'The household never made that ground back.' },
  { text: 'What it cost was still being paid off years afterward.' },
  { text: '${subjectCap} ${verb:have} been the one the others come to since.' },
  { text: 'The holding has been worked by fewer hands than it needs ever since.', register: ['band', 'village', 'district'], band: ['poor', 'working', 'bonded'] },
  { text: 'The work of two was done by one from then on.', register: ['band', 'village', 'district'], band: ['poor', 'working', 'bonded'] },
  { text: 'There was no question of schooling after that.', minYear: 1850, band: ['poor', 'working'] },
  { text: 'Whatever had been put by went on it.', minYear: 1850, band: ['poor', 'working'] },
  { text: 'It settled where ${subject} would live, and ${subject} ${verb:have} not moved since.' },
  { text: 'The debt from it outlived the person who incurred it.', minYear: 1500 },
  { text: 'Work ${subject} would not have taken before, ${subject} ${verb:take} now.' },
  { text: 'The house was quieter afterward and has stayed that way.' },
  { text: 'It is the reason ${subject} ${verb:keep} something set by, however little.' },
];

const CONSEQUENCE_AFTER_GAIN: Clause[] = [
  { text: 'It is the reason the household eats as well as it does.' },
  { text: 'Nothing since has been as good, and ${subject} ${verb:know} it.' },
  { text: 'It bought a standing in ${location} that ${subject} ${verb:have} been careful with.' },
  { text: 'The neighbors have not entirely forgiven the luck of it.', register: ['band', 'village'] },
  { text: 'It is still brought up, and not always kindly.', register: ['band', 'village'] },
  { text: 'What came of it paid for the roof and not much else.', band: ['poor', 'working', 'bonded'] },
  { text: 'It bought a year of not being afraid, which was worth more than the sum.', band: ['poor', 'working', 'bonded'] },
  { text: 'It is the one thing ${subject} would put on a record of ${possessive} life.', minYear: 1700 },
  { text: 'It is the piece of luck ${subject} ${verb:measure} the rest against.' },
  { text: 'The household has lived off the margin of it ever since.' },
];

const CONSEQUENCE_AFTER_TURN: Clause[] = [
  { text: 'Everything after it has been arranged around that fact.' },
  { text: 'It is where ${subject} ${verb:date} the life ${subject} ${verb:have} now.' },
  { text: 'The household has organised itself around it since.' },
  { text: 'It is the story ${subject} ${verb:tell} when someone asks how ${subject} came to be here.' },
  { text: 'Nothing has looked quite the same to ${object} since.' },
  { text: 'It is the year ${subject} ${verb:count} from, when ${subject} ${verb:count} at all.' },
  { text: 'What ${subject} had expected of ${possessive} life was settled differently after that.' },
  // `selectClause` prefers the most specific clause that fits, so a lone gated
  // entry in a small bank is not a rare variant — it becomes the only thing
  // every persona it fits can say. One register-gated clause here measured at
  // 158 of 1200 biographies. Every tier needs alternatives.
  { text: 'The neighbors still date things by it.', register: ['band', 'village', 'district'] },
  { text: 'It is known about, in the way everything here is known about.', register: ['band', 'village', 'district'] },
  { text: 'It closed off the trade ${subject} had been raised to expect.', band: ['poor', 'working', 'bonded'] },
  { text: 'There was no margin to absorb it, and none has appeared since.', band: ['poor', 'working', 'bonded'] },
  { text: 'It decided what ${subject} could and could not ask for afterward.', band: ['poor', 'working', 'bonded'] },
  { text: 'It is on the record somewhere, which is more than most of ${possessive} life is.', minYear: 1800 },
  { text: 'The paperwork from it took longer than the thing itself.', minYear: 1800 },
];

/**
 * What the neighbours made of it.
 *
 * "The settlement adjusted its opinion of him accordingly" is a sentence that
 * reports a reaction without saying what the reaction was. These say what it
 * was, and which one is drawn depends on whether the event was good or bad for
 * the persona and on whether the persona is someone their neighbours are
 * inclined to be generous to. All of them are gated to places small enough to
 * have a collective opinion in the first place.
 */
const REACTION_GOOD_WELCOMED: Clause[] = [
  { text: 'The neighbors were pleased for ${object}, and said so.', register: ['band', 'village', 'district'] },
  { text: 'It was thought no more than ${subject} was owed.', register: ['band', 'village', 'district'] },
  { text: 'The settlement took some credit for it, having watched ${object} grow up.', register: ['village', 'district'] },
  { text: 'The band counted it as everyone\'s good fortune, which is how such things are counted here.', register: ['band'] },
];

const REACTION_GOOD_RESENTED: Clause[] = [
  { text: 'The neighbors were civil about it and no more than that.', register: ['band', 'village', 'district'] },
  { text: 'It was noticed, and not warmly.', register: ['band', 'village', 'district'] },
  { text: 'Some in ${location} took it as ${possessive} due and some took it badly.', register: ['village', 'district'] },
  { text: 'There was talk about how it had been come by.', register: ['band', 'village', 'district'] },
];

const REACTION_BAD_SUPPORTED: Clause[] = [
  { text: 'The neighbors carried what they could of it for ${object}.', register: ['band', 'village', 'district'] },
  { text: 'Food came to the door for a while without anyone being asked.', register: ['village', 'district'] },
  { text: 'The band closed around ${object} the way it does.', register: ['band'] },
  { text: 'People were kind, in the practical way that costs them something.', register: ['band', 'village', 'district'] },
];

const REACTION_BAD_IGNORED: Clause[] = [
  { text: 'Nobody came, and ${subject} ${verb:have} not forgotten which doors stayed shut.', register: ['band', 'village', 'district'] },
  { text: 'The settlement let ${object} get on with it.', register: ['band', 'village', 'district'] },
  { text: 'Sympathy was offered where it could be heard and withheld where it could not.', register: ['village', 'district'] },
  { text: 'It was held to be ${possessive} own affair, and ${subject} ${verb:have} not argued.', register: ['band', 'village', 'district'] },
];

/**
 * The persona's own household.
 *
 * The generator has always built this in full — a spouse with a name, an age
 * and a trade, and children walked year by year through a mortality model that
 * decides which of them are buried — and the biography never mentioned any of
 * it. Measured across 1200 biographies, the persona's own marriage appeared in
 * none of them, while a sibling's appeared in 73%. A life with a husband of
 * twenty years and four children, two of them dead, that reports only that a
 * sister married well is not a life anyone would recognise as theirs.
 */
const HOUSEHOLD_MARRIAGE: Clause[] = [
  { text: '${subjectCap} ${verb:have} been married to ${spouse} these ${years} years.' },
  { text: '${possessiveCap} ${partner} ${spouse} keeps the household with ${object}, and has since ${subject} ${was} young.' },
  { text: '${subjectCap} married ${spouse} ${years} years ago, and they have held together since.' },
  { text: '${possessiveCap} ${partner} is ${spouse}; the match was made when ${subject} ${was} of an age for it.', maxYear: 1900 },
  { text: '${subjectCap} and ${spouse} have been married ${years} years, which in ${location} is long enough to stop being remarked on.' },
];

/**
 * The marriage clause has already given the name and the relation, so this one
 * gives neither twice: "His wife is Betresh the Slow-Spoken; the match was made
 * when he was of an age for it. His wife Betresh the Slow-Spoken works as a
 * foraging."
 */
const HOUSEHOLD_MARRIAGE_TRADE: Clause[] = [
  { text: '${possessiveCap} ${partner} ${trade}.' },
  { text: '${spouse} ${trade}.' },
  { text: 'What ${spouse} brings in is the other half of what the household lives on.' },
  { text: 'The household runs on two trades, ${possessive} own and ${spouse}\'s.' },
];

const HOUSEHOLD_CHILDREN: Clause[] = [
  { text: 'There are ${children} children in the house.' },
  { text: '${subjectCap} ${verb:have} ${children} children living.' },
  { text: 'The house holds ${children} children, the eldest ${eldest}.' },
  { text: '${children} children have come of it, and the eldest is ${eldest}.' },
];

/** `${eldest}` here is a whole age phrase, so that an only child of one is "a
 *  year old" rather than "1 years old". */
const HOUSEHOLD_ONE_CHILD: Clause[] = [
  { text: 'There is one child, ${eldest}.' },
  { text: '${subjectCap} ${verb:have} one child living, ${eldest}.' },
  { text: 'One child has come of it, ${eldest}.' },
];

// `${born}` and `${lost}` carry their own noun ("five children", "one child"),
// because these are often the first sentence in the biography to mention
// children at all and "they buried two of them" then has nothing to refer to.
const HOUSEHOLD_LOSS: Clause[] = [
  { text: 'Of the ${born} born to them, ${children} are living.' },
  { text: '${born} were born and ${children} are living, which is the ordinary arithmetic here.', maxYear: 1900 },
  { text: 'They buried ${lost}, which was not thought extraordinary.', maxYear: 1900 },
  { text: 'They lost ${lost}, and it is not spoken of.' },
];

/**
 * Where none survived. "They buried three of them" needs a count of the living
 * to have been given first, and when there are none there is nothing to give.
 */
const HOUSEHOLD_LOSS_ALL: Clause[] = [
  { text: '${born} were born to them and none lived.' },
  { text: 'They buried all ${born}, and there were no more after that.' },
  { text: 'Of the ${born} born to them, none is living.' },
];

/** The same, for the households where exactly one child survived. */
const HOUSEHOLD_LOSS_ONE_LEFT: Clause[] = [
  { text: 'Of the ${born} born to them, one is living.' },
  { text: '${born} were born and one is living, which is the ordinary arithmetic here.', maxYear: 1900 },
  { text: 'They buried ${lost} and kept one, which was not thought extraordinary.', maxYear: 1900 },
  { text: 'One child is living, and they lost ${lost}.' },
];

const HOUSEHOLD_CHILDLESS: Clause[] = [
  { text: 'There are no children, which is a thing the neighbors have opinions about.', maxYear: 1950, register: ['band', 'village', 'district'] },
  { text: 'No children have come, and the household has arranged itself around that.' },
  { text: 'They have no children.' },
];

const HOUSEHOLD_UNMARRIED: Clause[] = [
  { text: '${subjectCap} ${verb:have} never married.' },
  { text: 'No marriage was ever made for ${object}, and none is expected now.', maxYear: 1900 },
  { text: '${subjectCap} ${verb:live} unmarried, which in a settlement this size is its own kind of position.', register: ['band', 'village'] },
  { text: '${subjectCap} ${verb:have} not married, and ${verb:have} stopped being asked about it.', minYear: 1900 },
];

/**
 * Injuries happen somewhere. Naming the part turns "Torn muscle has made
 * ordinary labor uncertain" into a sentence about a person.
 */
const INJURY_SITES: Record<string, string[]> = {
  'torn muscle': ['shoulder', 'back', 'thigh', 'calf', 'forearm'],
  'sprained ankle': ['ankle'],
  'broken bone': ['forearm', 'collarbone', 'ribs', 'shin'],
  'fracture': ['forearm', 'collarbone', 'ribs', 'shin'],
  'dislocated joint': ['shoulder', 'elbow', 'knee', 'hip'],
  'deep cut': ['hand', 'forearm', 'thigh', 'scalp'],
  'laceration': ['hand', 'forearm', 'thigh', 'scalp'],
  'burn': ['hand', 'forearm', 'shoulder'],
  'scraped knee': ['knee'],
  'bruised ribs': ['ribs'],
  'infected wound': ['hand', 'foot', 'forearm', 'shin'],
  'crushed finger': ['hand'],
  'strained back': ['back'],
  'pulled muscle': ['shoulder', 'back', 'thigh', 'calf'],
};

/**
 * Temperament, in the vocabulary of the persona's own world.
 *
 * These are noun phrases: each one has to sit after "Those who know him speak
 * of …", so none of them may carry a capital or terminal punctuation. Each bank
 * keeps one unconditioned clause so that no combination of era, place and
 * station can leave a temperament with nothing to say.
 */
const TRAIT_OPEN_OUTGOING: Clause[] = [
  { text: 'an adventurous spirit who seeks out new experiences and companions' },
  { text: 'a restlessness that has taken ${object} further from home than most of ${possessive} neighbors have gone', maxYear: 1850 },
  { text: 'an appetite for company and for whatever is new, which the settlement finds by turns useful and tiring', register: ['band', 'village'] },
  { text: 'a sociability that fills the evenings and empties the wage packet', minYear: 1880, band: ['working', 'poor'] },
  { text: 'an ease with strangers that has been worth more to ${object} than any qualification', minYear: 1950 },
];

const TRAIT_OPEN_METHODICAL: Clause[] = [
  { text: 'a curious mind tempered by methodical discipline' },
  { text: 'a habit of taking a thing apart to see how it is made, and putting it back properly' },
  { text: 'a methodical curiosity that would have been called scholarship in someone better born', band: ['poor', 'working', 'bonded'], maxYear: 1900 },
  { text: 'a precision about detail that colleagues rely on and do not thank ${object} for', minYear: 1900 },
];

const TRAIT_OPEN: Clause[] = [
  { text: 'a thoughtful soul drawn to novel ideas and perspectives' },
  { text: 'a turn of mind that keeps returning to questions the neighbors consider settled' },
  { text: 'an interest in what lies beyond the district, which is not universally admired here', register: ['band', 'village'] },
  { text: 'opinions gathered from further afield than anyone else in the household has been', minYear: 1920 },
];

const TRAIT_SETTLED: Clause[] = [
  { text: 'a steadfast character who finds strength in tradition and routine' },
  { text: 'a preference for the way a thing has always been done, held firmly and without apology' },
  { text: 'a conviction that the old arrangements worked, and that whatever replaced them did not', minYear: 1900 },
];

const TRAIT_PRACTICAL: Clause[] = [
  { text: 'a practical nature that values the proven over the experimental' },
  { text: 'a suspicion of anything that has not already been shown to work' },
  { text: 'a preference for what can be seen, weighed and mended', register: ['band', 'village'] },
];

const TRAIT_WARM: Clause[] = [
  { text: 'a warm and generous presence that draws people near' },
  { text: 'an openhandedness the household can less afford than ${subject} ${verb:admit}' },
  { text: 'a name known at every door in ${location}, generally for the right reasons', register: ['village', 'district'] },
];

const TRAIT_GENTLE: Clause[] = [
  { text: 'a gentle disposition that seeks harmony above conflict' },
  { text: 'a reluctance to give offense that is sometimes mistaken for having no opinion' },
  { text: 'a steadiness in other people\'s quarrels that gets ${object} sent for when there is one' },
];

const TRAIT_COMMITTED: Clause[] = [
  { text: 'a compassionate heart that drives commitment to justice' },
  { text: 'a tenderness toward the badly used that has hardened into something like a politics', minYear: 1750 },
  { text: 'an anger on other people\'s behalf that ${subject} ${verb:have} never learned to keep quiet' },
];

const TRAIT_BLUNT: Clause[] = [
  { text: 'a bold, uncompromising manner that some find refreshing and others find abrasive' },
  { text: 'a bluntness ${subject} ${verb:call} honesty and others call something else' },
  { text: 'a way of saying the thing everyone present had agreed not to say' },
];

const TRAIT_INDEPENDENT: Clause[] = [
  { text: 'an independent streak that prizes personal freedom above social convention' },
  { text: 'a habit of doing as ${subject} ${verb:please}, which costs ${object} more than ${subject} ${verb:reckon}' },
  { text: 'a refusal to be placed, which in a settlement this size is a considerable undertaking', register: ['band', 'village'] },
];

const TRAIT_SCRUPULOUS: Clause[] = [
  { text: 'a scrupulousness about obligations that neighbors rely on more than they acknowledge' },
  { text: 'an exactness about what is owed and to whom, running in both directions' },
  { text: 'a record-keeping habit that has settled more than one dispute in ${possessive} favor', needs: ['writing'] },
];

const TRAIT_WARY: Clause[] = [
  { text: 'a wariness that reads trouble into quiet weeks' },
  { text: 'a habit of expecting the worst, which has occasionally been vindicated' },
  { text: 'a watchfulness that ${possessive} childhood taught ${object} and nothing since has undone' },
];

/**
 * Extraversion on its own.
 *
 * The ladder above reaches extraversion only in combination — high openness or
 * high agreeableness had to come with it before sociability was mentioned at
 * all — so a persona whose one notable quality was that they did or did not
 * seek company got a biography that never said so.
 */
const TRAIT_GREGARIOUS: Clause[] = [
  { text: 'an appetite for company that outlasts everyone else\'s' },
  { text: 'a habit of being wherever people have gathered, whether or not ${subject} ${verb:be} wanted there' },
  { text: 'a talent for knowing everyone, which in a place this size is less an achievement than a temperament', register: ['band', 'village'] },
  { text: 'a sociability that has made ${object} known to more people than ${subject} could name', register: ['district'] },
];

const TRAIT_SOLITARY: Clause[] = [
  { text: 'a preference for ${possessive} own company over anyone else\'s' },
  { text: 'a reserve that neighbors have long since stopped taking personally' },
  { text: 'a quietness in company that is read as pride by those who do not know ${object} and as shyness by those who do' },
  { text: 'a way of leaving a gathering without anyone noticing ${subject} had gone' },
];

/**
 * The one thing that is genuinely off the end of the scale.
 *
 * The card stamps a wax seal for a score at 10 or 1, or a personality trait in
 * the outer one per cent — "solitary, bottom 0.1% for extraversion" — and the
 * prose said nothing about it. A reader looking at a seal and then at a
 * biography that describes an ordinary temperament concludes, correctly, that
 * the two were generated by different machines.
 *
 * `traitSeals` decides what qualifies, so the sentence and the seal cannot
 * disagree about who is remarkable. These are keyed by its ids.
 *
 * Each is a lowercase clause with its own subject, so that a frame can put it
 * after a colon or at the head of a sentence. None of them names the score.
 */
const REMARKABLE: Record<string, Clause[]> = {
  'stat:strength:top': [
    { text: '${subject} ${verb:be} the one sent for whenever something has to be lifted' },
    { text: 'there is nothing in ${location} ${subject} cannot shift, and ${possessive} back has not yet complained of it' },
  ],
  'stat:strength:bottom': [
    { text: '${subject} ${verb:have} been given the lighter end of every load since childhood' },
    { text: '${possessive} strength has never been equal to the work, and the household has arranged itself around that' },
  ],
  'stat:dexterity:top': [
    { text: '${possessive} hands are quicker and surer than anyone can account for' },
    { text: '${subject} ${verb:do} with ${possessive} hands what most people manage only with tools' },
  ],
  'stat:dexterity:bottom': [
    { text: '${subject} ${verb:break} rather more than ${subject} ${verb:mend}' },
    { text: '${possessive} hands have never once done what ${subject} ${verb:ask} of them' },
  ],
  'stat:stamina:top': [
    { text: '${subject} can work from first light to last without appearing to tire' },
    { text: '${subject} ${verb:outlast} everyone ${subject} ${verb:work} beside, and always ${verb:have}' },
  ],
  'stat:stamina:bottom': [
    { text: '${subject} ${verb:be} winded by work others do without noticing they are doing it' },
    { text: 'half a day\'s labor costs ${object} what a whole one costs anybody else' },
  ],
  'stat:constitution:top': [
    { text: '${subject} ${verb:have} never in ${possessive} life been seriously ill' },
    { text: 'the fevers that go through the household every year leave ${object} alone' },
  ],
  'stat:constitution:bottom': [
    { text: '${subject} ${verb:be} ill rather more often than ${subject} ${verb:be} well' },
    { text: 'whatever sickness passes through finds ${object} first and keeps ${object} longest' },
  ],
  'stat:intelligence:top': [
    { text: '${subject} ${verb:understand} things quickly that other people never quite do' },
    { text: '${possessive} mind works faster than ${possessive} station has any use for' },
  ],
  'stat:intelligence:bottom': [
    { text: 'things have to be explained to ${object} more than once, and usually more than twice' },
    { text: '${subject} ${verb:have} never followed an argument of any length, and ${verb:know} it' },
  ],
  'stat:wisdom:top': [
    { text: 'people bring ${object} their difficulties, and have done since ${subject} ${was} young' },
    { text: '${subject} ${verb:see} the end of a course of action while everyone else is still admiring the start of it' },
  ],
  'stat:wisdom:bottom': [
    { text: '${subject} ${verb:act} first and ${verb:consider} afterward, reliably and without improvement' },
    { text: '${possessive} own judgment has cost ${object} more than any misfortune has' },
  ],
  'stat:perception:top': [
    { text: '${subject} ${verb:notice} what everyone else in the room has missed' },
    { text: 'very little happens in ${possessive} sight that ${subject} ${verb:fail} to mark' },
  ],
  'stat:perception:bottom': [
    { text: '${subject} ${verb:miss} what is directly in front of ${object}' },
    { text: 'things happen at ${possessive} elbow that ${subject} ${verb:learn} of afterward, from somebody else' },
  ],
  'stat:craftiness:top': [
    { text: '${subject} ${verb:be} two moves ahead of whoever ${subject} ${verb:be} dealing with' },
    { text: 'there is no arrangement ${subject} cannot find the profitable side of' },
  ],
  'stat:craftiness:bottom': [
    { text: '${subject} ${verb:say} exactly what ${subject} ${verb:mean}, which has cost ${object} repeatedly' },
    { text: '${subject} ${verb:have} no guile at all, and ${verb:be} cheated about as often as that suggests' },
  ],
  'stat:charisma:top': [
    { text: 'a room turns toward ${object} without anyone deciding to' },
    { text: 'strangers take to ${object} within a few minutes, for reasons none of them could afterward name' },
  ],
  'stat:charisma:bottom': [
    { text: '${subject} ${verb:be} hard going in company, and ${verb:know} it' },
    { text: 'conversation with ${object} does not flow, and never has' },
  ],
  'stat:persuasion:top': [
    { text: '${subject} can talk most people around to most things' },
    { text: 'few arguments with ${object} end anywhere but where ${subject} intended them to' },
  ],
  'stat:persuasion:bottom': [
    { text: '${subject} ${verb:have} never once talked anybody into anything' },
    { text: '${subject} ${verb:state} ${possessive} case badly, even when it is the better one' },
  ],
  'stat:luck:top': [
    { text: 'things fall out in ${possessive} favor with a regularity ${possessive} neighbors have stopped finding funny' },
    { text: '${subject} ${verb:have} walked out of more than one disaster that took everyone else in it' },
  ],
  'stat:luck:bottom': [
    { text: 'what can go against ${object} generally does' },
    { text: '${subject} ${verb:have} been in the wrong place often enough that the household has grown superstitious about it' },
  ],
  'trait:openness:top': [
    { text: '${possessive} mind is reliably somewhere other than where ${subject} ${verb:be}' },
    { text: 'no notion reaches ${location} without ${object} wanting the whole of it' },
  ],
  'trait:openness:bottom': [
    { text: '${subject} ${verb:want} nothing that has not been done the same way before' },
    { text: '${subject} ${verb:have} no interest whatever in anything new, and no apology for it' },
  ],
  'trait:conscientiousness:top': [
    { text: 'nothing ${subject} ${verb:be} answerable for has ever been left half done' },
    { text: '${possessive} exactness about small obligations is a byword, and not always an affectionate one' },
  ],
  'trait:conscientiousness:bottom': [
    { text: '${subject} ${verb:leave} things where they fall, and always ${verb:have}' },
    { text: 'what ${subject} ${verb:undertake} gets finished late, badly, or by somebody else' },
  ],
  'trait:extraversion:top': [
    { text: '${subject} ${verb:be} never quiet and never willingly alone' },
    { text: 'there is no gathering in ${location} ${subject} ${verb:have} not talked ${possessive} way into' },
  ],
  'trait:extraversion:bottom': [
    { text: '${subject} ${verb:keep} entirely to ${possessive} own company' },
    { text: 'whole days pass in which ${subject} ${verb:speak} to nobody, and they are ${possessive} preferred days' },
  ],
  'trait:agreeableness:top': [
    { text: '${subject} ${verb:have} never been known to refuse anyone anything' },
    { text: 'there is no one ${subject} ${verb:have} not gone out of ${possessive} way for, including several who did not deserve it' },
  ],
  'trait:agreeableness:bottom': [
    { text: '${subject} ${verb:be} at odds with very nearly everyone, and ${verb:prefer} it so' },
    { text: 'quarrels find ${object}, and ${subject} ${verb:do} nothing to send them away' },
  ],
  'trait:neuroticism:top': [
    { text: '${subject} ${verb:be} afraid of a great many things that have not happened and mostly will not' },
    { text: '${possessive} nerves are the household\'s weather, and everyone in it has learned to read them' },
  ],
  'trait:neuroticism:bottom': [
    { text: 'nothing whatever unsettles ${object}' },
    { text: '${subject} ${verb:have} met every calamity of ${possessive} life with the same flat calm' },
  ],
};

/**
 * Frames for the clause above. `${traitCap}` takes it at the head of a sentence
 * or after a colon; `${trait}` takes it mid-sentence. Neither placeholder is
 * one `renderClause` knows, so the clause is spliced in after both halves have
 * been rendered.
 */
const REMARKABLE_FRAMES: Clause[] = [
  { text: 'In one respect ${subject} ${verb:be} well outside the common run: ${trait}.' },
  { text: '${traitCap}. It is the first thing anybody says about ${object}.' },
  { text: '${traitCap}, to a degree that is remarked on well beyond the household.' },
  { text: '${traitCap}. People notice.' },
  { text: 'Whatever else may be said of ${object}, ${trait}.' },
  { text: 'Everyone who knows ${object} remarks on the same thing: ${trait}.' },
  { text: 'In one thing ${subject} ${verb:be} unlike anyone else here: ${trait}.' },
  { text: '${traitCap}. That much is agreed on.' },
  { text: 'Neighbors who agree on nothing else agree that ${trait}.', register: ['village', 'district'] },
  { text: 'There is no one else in the band of whom it could be said that ${trait}.', register: ['band'] },
];

/** Display name for the persona's place in their own period. */
const placeName = (persona: HistoricalPersona): string =>
  historicalPlaceLabel(persona.location, persona.year).label || persona.location;

const formatYear = (year: number): string =>
  year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;

export function generateNarrativeBiography(persona: HistoricalPersona): string {
  const character = persona.character;
  const events = persona.enhancedLifeEvents || [];
  const pronoun = character.gender === 'Male' ? 'he' : character.gender === 'Female' ? 'she' : 'they';
  const pronounObj = character.gender === 'Male' ? 'him' : character.gender === 'Female' ? 'her' : 'them';
  const pronounPoss = character.gender === 'Male' ? 'his' : character.gender === 'Female' ? 'her' : 'their';
  const pronounPossCap = character.gender === 'Male' ? 'His' : character.gender === 'Female' ? 'Her' : 'Their';
  const pronounVerb = character.gender === 'Non-binary' ? 'have' : 'has';
  const pronounBe = character.gender === 'Non-binary' ? 'are' : 'is';
  const biographySeed = [
    character.name,
    persona.year,
    persona.location,
    persona.region,
    character.profession,
    character.age,
    character.portraitSeed,
  ].join('|');
  const biographyBase = fnv1a(biographySeed);

  /**
   * Named draw sequences.
   *
   * Every choice used to come from one counter, and the counter fed a start
   * value into a fresh FNV-1a pass over the seed string. Both of FNV's steps —
   * XOR with a byte, multiply by an odd constant — preserve bit 0, so the low
   * bit of each result tracked the low bit of the start value exactly, and
   * consecutive draws always came out with opposite parity. `Math.abs` and
   * `% n` for even `n` preserve parity as well, so half the joint space of any
   * two adjacent draws was unreachable: measured over 40k trials, adjacent
   * draws mod 6 filled 18 of 36 cells. `originPlan` and `presentPlan` are
   * adjacent draws of length 6, which meant exactly half the paragraph
   * arrangements this file defines could never be produced.
   *
   * The seed is now hashed once and mixed with a per-stream salt and step
   * through a finalizer that avalanches. Naming the streams is the second half
   * of the fix: two sites drawing from different names cannot disturb one
   * another, so adding or removing a beat no longer reshuffles every choice
   * downstream of it.
   */
  const streamSteps = new Map<string, number>();
  const draw = (stream: string, length: number): number => {
    const step = streamSteps.get(stream) ?? 0;
    streamSteps.set(stream, step + 1);
    const mixed = mix32(biographyBase ^ streamSalt(stream) ^ Math.imul(step + 1, 0x9e3779b9));
    return mixed % Math.max(1, length);
  };

  /**
   * The shared stream, for the clause banks reached through `pickBiography`.
   * Structural decisions take a name of their own instead.
   */
  const seededIndex = (length: number): number => draw('shared', length);
  const pickBiography = <T,>(values: T[]): T => values[seededIndex(values.length)];
  const pickFrom = <T,>(stream: string, values: T[]): T => values[draw(stream, values.length)];

  // Get proper wealth description
  // Opening - birth and background
  const birthYear = persona.year - character.age;

  // Styled character name for visual emphasis
  const styledName = `<span class="character-name">${character.name}</span>`;

  const narrativePronouns = getNarrativePronouns(character.gender);
  const subjectCap = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);

  // Shared context for the detail service. Everything here is already
  // computed elsewhere in the app and was previously unused by the prose.
  const bioContext: BiographyContext = {
    name: character.name,
    age: character.age,
    year: persona.year,
    location: placeName(persona),
    region: persona.region,
    profession: character.profession || 'laborer',
    socialClass: character.socialClass,
    wealthLevel: character.wealthLevel,
    religion: character.religion,
    language: persona.languageData?.name,
    season: (() => {
      try {
        // persona.culturalZone is a display label ("SOUTH ASIAN"); the climate
        // and hemisphere tables are keyed by the enum, so passing the label
        // silently returned undefined for every persona and flattened the
        // southern hemisphere and the tropics into a northern four-season year.
        const zone = persona.historicalContext?.culturalZone ?? persona.character.culturalZone;
        const climate = getAreaClimate(zone, persona.region, persona.location);
        return seasonFor(persona.month, hemisphereFor(zone, persona.region), climate);
      } catch {
        return undefined;
      }
    })(),
    historical: persona.historicalContext,
    pronouns: narrativePronouns,
    // Bondage places a life more decisively than any wealth label does, and it
    // is recorded as an attribute rather than as a social class.
    attributeIds: (character.attributes ?? []).map((attr: any) => attr?.id).filter(Boolean),
  };

  // "A respectable family" presupposes a society with respectability in it.
  const wealthDesc = wealthAdjective(
    typeof character.wealthLevel === 'string' ? character.wealthLevel : undefined,
    bioContext,
  );
  // The band-register vocabulary introduced vowel-initial adjectives
  // ("ordinary"), which the hardcoded "a" could not handle.
  const aWealthHousehold = withIndefiniteArticle(`${wealthDesc} household`);
  const aWealthFamily = withIndefiniteArticle(`${wealthDesc} family`);

  // Sentences are collected under named beats rather than pushed into a fixed
  // pair of arrays. A seeded plan then decides the order and which optional
  // beats survive.
  //
  // The fixed order was the loudest template signal in the output: measured
  // across six eras, every biography ran the same twelve beats in the same
  // sequence, so varying the wording of any one of them changed very little.
  const beats = new Map<string, string[]>();
  const addBeat = (id: string, text: string | string[]): void => {
    const lines = (Array.isArray(text) ? text : [text]).map(t => t.trim()).filter(Boolean);
    if (lines.length === 0) return;
    beats.set(id, [...(beats.get(id) ?? []), ...lines]);
  };
  /**
   * A roll in 0–99, for deciding whether an optional beat is kept. Each caller
   * names its own stream so that one beat's presence never moves another's.
   */
  const chance = (stream: string, percent: number): boolean => draw(stream, 100) < percent;

  // Vary opening phrases
  // "Born in Moscow Basin" names a map region rather than a place anyone lived
  // in. This composes the kind of dwelling from register, wealth and era, and
  // names the city where there was one.
  const birthplace = describeBirthplace(
    {
      year: birthYear,
      culturalZone: persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
      region: persona.region,
      location: persona.location,
      wealthLevel: typeof character.wealthLevel === 'string' ? character.wealthLevel : undefined,
      localeType: persona.historicalContext?.localeType,
    },
    placeName(persona),
    pickBiography,
  );

  const openingTemplates = [
    `Born in ${formatYear(birthYear)} in ${birthplace}, ${styledName} `,
    `It was in ${birthplace}, in the year ${formatYear(birthYear)}, that ${styledName} came into the world, and ${pronounPoss} `,
    `In ${formatYear(birthYear)}, ${styledName} began life in ${birthplace}. ${pronounPossCap} `,
    `The year ${formatYear(birthYear)} saw the birth of ${styledName} in ${birthplace}. ${pronounPossCap} `,
    `${styledName} first drew breath in ${formatYear(birthYear)}, in ${birthplace}, where ${pronoun} `,
    `In ${formatYear(birthYear)}, ${styledName} entered the world in ${birthplace}. ${pronounPossCap} `
  ];

  const selectedOpening = draw('opening', openingTemplates.length);

  // Family context
  const siblings = character.family?.filter(f =>
    f.relation === 'sibling' || f.relation === 'brother' || f.relation === 'sister'
  ) || [];
  const parents = character.family?.filter(f =>
    f.relation === 'father' || f.relation === 'mother'
  ) || [];

  let beliefPredicate = '';

  /**
   * The household clause, in the two forms the leads need. Noun-led follows a
   * possessive ("…and her | upbringing was as one of seven children"); verb-led
   * follows a subject ("Jumoke Olowu | grew up as one of seven children").
   */
  const householdPhrase = (nounLed: boolean): string => {
    // Several belief clauses open on "grew up", and so does the verb-led
    // household phrase: "Jiang grew up as one of six children in a humble
    // household, where she grew up among the observances the district has
    // always kept". When they would collide, the household clause takes the
    // other verb.
    const grewUpTaken = /^grew up\b/i.test(beliefPredicate);
    if (siblings.length > 0) {
      return nounLed
        ? `upbringing was as one of ${siblings.length + 1} children in ${aWealthHousehold}`
        : grewUpTaken
          ? `was one of ${siblings.length + 1} children in ${aWealthHousehold}`
          : `grew up as one of ${siblings.length + 1} children in ${aWealthHousehold}`;
    }
    if (parents.length > 0) {
      return nounLed
        ? `parents raised ${pronounObj} in ${aWealthFamily}`
        : `was raised by ${pronounPoss} parents in ${aWealthFamily}`;
    }
    return nounLed
      ? `upbringing was in ${aWealthHousehold}`
      : `came of age in ${aWealthHousehold}`;
  };

  // These openings end with a possessive pronoun ("his/her/their"), so they need noun-led phrasing.
  const needsPossessiveForm = [1, 2, 3, 5].includes(selectedOpening);

  // Religion and cultural context with varied religiosity
  const hasNamedReligion = character.religion
    && character.religion !== 'Local Beliefs'
    && character.religion !== 'Agnostic';

  if (hasNamedReligion) {
    // Use character's religiosity score if available, otherwise random
    const religiosity = character.socialContext?.religiosity ?? (draw('religiosity', 100) / 100);

    let religionPhrase = '';
    if (religiosity > 0.8) {
      // Very religious upbringing
      const veryReligiousTemplates = [
        `was deeply immersed in the traditions of ${character.religion}`,
        `was brought up in deep devotion to ${character.religion}`,
        `grew up surrounded by the fervent practice of ${character.religion}`,
        `was immersed in the teachings of ${character.religion} from an early age`
      ];
      religionPhrase = pickBiography(veryReligiousTemplates);
    } else if (religiosity > 0.5) {
      // Moderately religious
      const moderateTemplates = [
        `was steeped in the practices of ${character.religion}`,
        `grew up observing the practices of ${character.religion}`,
        `took ${pronounPoss} bearings from the ${character.religion} tradition`,
        `learned the customs of ${character.religion} from ${pronounPoss} family`
      ];
      religionPhrase = pickBiography(moderateTemplates);
    } else if (religiosity > 0.25) {
      // Nominally religious
      const nominalTemplates = [
        `was exposed to the practices of ${character.religion}`,
        `had a modest upbringing in ${character.religion}`,
        `grew up with some knowledge of ${character.religion}`,
        `was familiar with ${character.religion}, though not particularly devout`
      ];
      religionPhrase = pickBiography(nominalTemplates);
    } else {
      // Barely religious/cultural only
      const culturalTemplates = [
        `was nominally of the ${character.religion} faith, though it played little role in ${pronounPoss} upbringing`,
        `came from ${withIndefiniteArticle(`${character.religion} household`)}, though ${pronoun} practiced little`,
        `was counted among the ${character.religion} households without being much observed`,
        `knew of ${character.religion} mainly as a cultural background, not a daily practice`
      ];
      religionPhrase = pickBiography(culturalTemplates);
    }

    beliefPredicate = religionPhrase;
  } else {
    // "Local Beliefs" used to skip this clause entirely, which silenced every
    // prehistoric persona at the exact point the biography establishes them.
    beliefPredicate = describeUnnamedBelief(bioContext, pickBiography);
  }

  /**
   * Opening template 4 already ends on "where <pronoun>", so attaching the
   * belief clause with a second "where" produced "…where she grew up as one of
   * five children in a poor household, where she learned the proper conduct
   * toward the dead". After a lead that has spent its "where", it becomes a
   * plain conjunction.
   */
  const beliefClause = (leadSpentItsWhere: boolean): string => beliefPredicate
    ? `${leadSpentItsWhere ? ', and' : ', where'} ${pronoun} ${beliefPredicate}`
    : '';
  const openingSpendsWhere = selectedOpening === 4;

  /**
   * What the biography leads on.
   *
   * Every biography used to open on birth, date and place — measured, 100% of
   * them — because the opener was the only sentence that carried the name and
   * the plans were required to place it first. Two of the three leads below
   * carry the name instead, which frees birth to be an ordinary sentence
   * somewhere in the origins paragraph.
   */
  const originLead = pickFrom('origin-lead', ['birth', 'birth', 'birth', 'birth', 'household', 'household', 'household', 'place', 'place', 'place'] as const);

  /**
   * A life told from the present backwards. Roughly a fifth of them, because
   * the shape is striking and wears out if it is the usual one.
   */
  const presentFirst = chance('paragraph-order', 20);

  if (presentFirst) {
    // The present paragraph has already introduced the persona by name, so the
    // origins paragraph takes the pronoun. Repeating the full name two
    // paragraphs running reads as two biographies stapled together.
    addBeat('lead', pickFrom('origin-lead-pronoun', [
      `${subjectCap} ${conjugate('was', narrativePronouns)} born in ${formatYear(birthYear)}, in ${birthplace}, and ${pronounPoss} ${householdPhrase(true)}${beliefClause(false)}.`,
      `Born in ${formatYear(birthYear)} in ${birthplace}, ${pronoun} ${householdPhrase(false)}${beliefClause(false)}.`,
      `${pronounPossCap} birth fell in ${formatYear(birthYear)}, in ${birthplace}, and ${pronounPoss} ${householdPhrase(true)}${beliefClause(false)}.`,
    ]));
  } else if (originLead === 'birth') {
    addBeat('lead', `${openingTemplates[selectedOpening]}${householdPhrase(needsPossessiveForm)}${beliefClause(openingSpendsWhere)}.`);
  } else {
    if (originLead === 'household') {
      addBeat('lead', `${styledName} ${householdPhrase(false)}${beliefClause(false)}.`);
    } else {
      // Leading on where rather than when. The place is the one fact about an
      // ordinary life that its neighbours would have given first.
      addBeat('lead', `In ${placeName(persona)}, ${styledName} ${householdPhrase(false)}${beliefClause(false)}.`);
    }
    // Birth demoted to a plain sentence the plans can put anywhere.
    addBeat('birth', pickFrom('birth-line', [
      `${subjectCap} ${conjugate('was', narrativePronouns)} born in ${formatYear(birthYear)}, in ${birthplace}.`,
      `${pronounPossCap} birth fell in ${formatYear(birthYear)}, in ${birthplace}.`,
      `The household ${pronoun} ${conjugate('was', narrativePronouns)} born into, in ${formatYear(birthYear)}, was ${birthplace}.`,
    ]));
  }

  // Foundational attributes, split between the two paragraphs by whether they
  // describe where the persona came from or what they are now.
  const foundationalAttributes = character.attributes?.filter((attr: any) => attr.foundational === true) || [];

  for (const attr of foundationalAttributes) {
    const rendered = describeFoundationalAttribute(attr.id, bioContext);
    if (!rendered) continue;
    addBeat(rendered.slot === 'origin' ? 'origin-attr' : 'present-attr', rendered.text);
  }

  // Life events: previously only the single most important one was used, out
  // of as many as ten the life-history service generates.
  const datedEvents = events
    .filter(e => e.kind !== 'birth')
    .map(e => ({ event: e, ageAtEvent: character.age - (persona.year - e.year) }))
    .filter(({ ageAtEvent }) => ageAtEvent >= 0 && ageAtEvent <= character.age);

  const importanceOrder: Record<string, number> = {
    [EventImportance.TRAGEDY]: 0,
    [EventImportance.MILESTONE]: 1,
    [EventImportance.OPPORTUNITY]: 2,
    [EventImportance.INJURY]: 3,
    [EventImportance.RELATIONSHIP]: 4,
    [EventImportance.MUNDANE]: 5
  };
  const byImportance = (
    a: { event: { importance: EventImportance } },
    b: { event: { importance: EventImportance } }
  ) => importanceOrder[a.event.importance] - importanceOrder[b.event.importance];

  // Apprenticeship events are near-universal and phrased almost identically,
  // so they are the last resort for the childhood slot rather than the first.
  const youthEvents = datedEvents
    .filter(e => e.ageAtEvent <= 17)
    .sort((a, b) => {
      const aRoutine = a.event.kind === 'apprenticeship' ? 1 : 0;
      const bRoutine = b.event.kind === 'apprenticeship' ? 1 : 0;
      return aRoutine - bRoutine || byImportance(a, b);
    });
  const adultEvents = datedEvents.filter(e => e.ageAtEvent > 17).sort(byImportance);

  const chosenYouth = youthEvents.slice(0, 1);
  /**
   * How much of a life there is to report.
   *
   * Biography length used to be near-constant: measured, a persona under 25
   * averaged 192 words and one over 55 averaged 210, and the 10th and 90th
   * percentiles of the whole corpus sat at 169 and 238. Every life came out the
   * same size regardless of how much had happened in it, which is the one thing
   * a reader comparing two cards notices immediately.
   *
   * A short life gets a short biography. The optional beats below take their
   * odds from this too, so the effect compounds rather than being one extra
   * sentence.
   */
  const fullness = character.age < 25 ? 'brief'
    : character.age < 45 ? 'ordinary'
      : 'long';
  // Fall back to an extra adult event when there was no childhood event to tell.
  const adultQuota = (fullness === 'brief' ? 1 : fullness === 'ordinary' ? 2 : 3)
    + (chosenYouth.length > 0 ? 0 : 1);
  // Two events of the same kind in one paragraph read as a template repeating.
  const usedKinds = new Set(chosenYouth.map(e => e.event.kind));
  const chosenAdult: typeof adultEvents = [];
  for (const candidate of adultEvents) {
    if (chosenAdult.length >= adultQuota) break;
    if (usedKinds.has(candidate.event.kind)) continue;
    usedKinds.add(candidate.event.kind);
    chosenAdult.push(candidate);
  }
  // Told in the order they happened, not in order of importance.
  chosenAdult.sort((a, b) => a.ageAtEvent - b.ageAtEvent);

  const father = character.family?.find(m => m.relation === 'father');
  const mother = character.family?.find(m => m.relation === 'mother');

  // Naming the parents where their trades are described lets the biography end
  // on something other than "His parents are X and Y", which every one of them
  // used to do.
  const canFoldParentNames = Boolean(
    father?.name && mother?.name && father?.profession && mother?.profession
  );
  const foldParentNames = canFoldParentNames && chance('fold-parents', 45);

  const livelihood = describeParentalLivelihood(
    father, mother, bioContext, pickBiography, foldParentNames,
  );
  addBeat('livelihood', livelihood);

  // The optional beats are what make one life's biography a different length
  // from another's, rather than every life getting the same twelve sentences.
  if (chance('childhood', fullness === 'brief' ? 70 : 88)) addBeat('childhood', describeChildhood(bioContext, pickBiography));

  if (chance('appearance', fullness === 'brief' ? 50 : 70)) {
    addBeat('appearance', describePhysicalAppearance(
      character.appearance,
      narrativePronouns,
      character.birthSex ?? (character.gender === 'Female' ? 'Female' : character.gender === 'Male' ? 'Male' : undefined),
      pickBiography,
    ));
  }

  for (const { event, ageAtEvent } of chosenYouth) {
    addBeat('youth-event', describeLifeEvent(event, ageAtEvent, narrativePronouns));
  }

  // ---- The present ----

  const professionName = lowerProfession(character.profession);
  const professionArticle = withIndefiniteArticle(professionName).split(' ')[0];

  // A standing is not a trade, and the openers below all assume a trade. See
  // STANDING_ROLES: without this, a patronage politician "makes his living as a
  // big man" and a prince "works as a maharaja".
  const roleStanding = standingRole(character.profession);

  // When the present paragraph runs first, the profession sentence is the one
  // that has to carry the name. A name is grammatically singular even for a
  // persona referred to as "they", so verbs are conjugated against a singular
  // subject while the possessives stay as they were.
  const subjectPronouns = presentFirst
    ? { ...narrativePronouns, subject: 'he' as const }
    : narrativePronouns;
  const leadSubject = presentFirst ? styledName : pronoun;
  const leadSubjectCap = presentFirst ? styledName : subjectCap;
  const leadBe = presentFirst ? 'is' : narrativePronouns.be;

  const professionOpeners = roleStanding
    ? [
      `Now ${character.age}, ${leadSubject} ${roleStanding.livelihood}`,
      `${leadSubjectCap} ${roleStanding.livelihood}`,
    ]
    : [
      `Now ${character.age}, ${leadSubject} ${conjugate('make', subjectPronouns)} ${pronounPoss} living as ${professionArticle} ${professionName}`,
      `At ${character.age}, ${leadSubject} ${conjugate('work', subjectPronouns)} as ${professionArticle} ${professionName}`,
      `${leadSubjectCap} ${conjugate('earn', subjectPronouns)} ${pronounPoss} bread as ${professionArticle} ${professionName}, and ${conjugate('have', subjectPronouns)} done for years`,
      // A trade is a thing followed where trades exist. "She follows the
      // cleaner's trade" is a sentence about 1750 wearing 2015's job title.
      persona.year >= 1900
        ? `${leadSubjectCap} ${leadBe} ${professionArticle} ${professionName}, and ${conjugate('have', subjectPronouns)} been for a while now`
        : `${leadSubjectCap} ${conjugate('follow', subjectPronouns)} the ${professionName}'s trade`
    ];
  let professionSentence = pickFrom('profession-opener', professionOpeners);

  // Work context for the trades where the stats say something specific. Scores
  // run 1–10, so the gate is 8: these three read `> 14` and none of them had
  // ever once fired. The persuasion clause asks about persuasion, which is now
  // a stat that means something rather than an unread roll.
  if (character.stats) {
    if (character.stats.strength >= 8 && /smith|forge|mason|labor/.test(professionName)) {
      professionSentence += `, ${pronounPoss} arms hardened to it`;
    } else if (character.stats.intelligence >= 8 && /scholar|scribe|clerk|teacher|physician/.test(professionName)) {
      professionSentence += `, and ${conjugate('have', narrativePronouns)} a reputation for a careful mind`;
    } else if (character.stats.persuasion >= 8 && /merchant|trader|seller|innkeep/.test(professionName)) {
      professionSentence += `, a gift for persuasion serving ${pronounObj} well in the market`;
    }
  }
  // How the trade is told. The texture sentence is one register — a frame over
  // a compressed noun phrase — and using it every time made every biography
  // describe work in the same voice at the same length. The attitude sentence
  // is short and plain, and exists to break that rhythm.
  const trade = describeProfessionWork(bioContext, pickBiography);
  const attitude = describeTradeAttitude(bioContext, pickBiography);
  const fold = (text: string): string => {
    const stripped = text.replace(/^(?:The work means|That means|It comes down to|The trade is|The job is|In practice,|Day to day,|Mostly it is|It amounts to|The whole of it is|What that gets (?:him|her|them) is)\s+/, '');
    return `${professionSentence} — ${stripped.charAt(0).toLowerCase()}${stripped.slice(1)}`;
  };

  // `trade` is empty when there is nothing specific to say about the work, in
  // which case the shapes that fold or append it collapse to the bare opener.
  // Saying nothing beats the generality it replaced.
  // The trade texture is a frame over a compressed noun phrase, and it used to
  // follow the profession sentence in seven biographies out of ten. At that
  // rate it stops being a detail and becomes the form: every persona's work
  // described in the same voice at the same length. Half of them now say what
  // the trade is and stop.
  const professionShape = draw('profession-shape', 10);
  // Cases 7-9 all render `trade`, so an empty one must never map into them:
  // `fold('')` leaves the profession sentence trailing an em-dash.
  switch (trade ? professionShape : (professionShape < 7 ? 0 : 5)) {
    case 0: case 1: case 2: case 3: case 4:
      addBeat('profession', `${professionSentence}.`);
      break;
    case 5: case 6:
      addBeat('profession', [`${professionSentence}.`, attitude]);
      break;
    case 7:
      addBeat('profession', fold(trade));
      break;
    case 8:
      addBeat('profession', `${professionSentence}.`);
      addBeat('trade', trade);
      break;
    default:
      addBeat('profession', [fold(trade), attitude]);
  }

  // ---- Adult events, told as a sequence rather than a list ----------------
  //
  // Two events close enough together to have been the same stretch of a life
  // are joined into one sentence, and one event in the run is followed by what
  // it left behind. Both are what turns "At age 31, a parent died. At age 37, a
  // brother's marriage brought new trade connections." into something with a
  // shape.
  {
    const clauses = chosenAdult.map(({ event, ageAtEvent }) => ({
      text: lifeEventClause(event, narrativePronouns),
      age: ageAtEvent,
      importance: event.importance,
    })).filter(entry => entry.text);

    const sentences: string[] = [];
    // Which sentence of the run gets a consequence, decided up front so that a
    // chained pair does not also draw one and end up over-explained.
    const tailAt = clauses.length > 0 ? draw('consequence-slot', clauses.length) : -1;
    const wantsTail = chance('consequence', 55);

    let index = 0;
    while (index < clauses.length) {
      const current = clauses[index];
      const next = clauses[index + 1];
      const gap = next ? next.age - current.age : Infinity;
      // Same-year events read as one moment and would need a different
      // connective; beyond CHAIN_MAX_GAP is not a sequence anyone would narrate
      // as one.
      const chains = Boolean(next) && gap >= 1 && gap <= CHAIN_MAX_GAP && chance('event-chain', 65);

      if (chains && next) {
        sentences.push(pickFrom('chain-shape', [
          `At age ${current.age}, ${current.text}. ${capitalize(yearsLater(gap))}, ${next.text}.`,
          `At age ${current.age}, ${current.text}, and ${yearsLater(gap)} ${next.text}.`,
          `At age ${current.age}, ${current.text} — ${next.text} ${yearsLater(gap)}.`,
        ]));
        index += 2;
      } else {
        sentences.push(`At age ${current.age}, ${current.text}.`);
        index += 1;
      }

      if (wantsTail && tailAt >= index - (chains ? 2 : 1) && tailAt < index) {
        const last = clauses[Math.min(tailAt, clauses.length - 1)];
        const bad = last.importance === EventImportance.TRAGEDY
          || last.importance === EventImportance.INJURY;
        const good = last.importance === EventImportance.OPPORTUNITY;
        const consequence = bad ? CONSEQUENCE_AFTER_LOSS
          : good ? CONSEQUENCE_AFTER_GAIN
            : CONSEQUENCE_AFTER_TURN;

        // Whether the neighbours are inclined to be generous. Agreeableness is
        // the trait the rest of the biography already reads as "how this person
        // is with other people", so the reaction follows it.
        const wellRegarded = (character.personality?.agreeableness ?? 0.5) >= 0.45;
        const reaction = bad
          ? (wellRegarded ? REACTION_BAD_SUPPORTED : REACTION_BAD_IGNORED)
          : good
            ? (wellRegarded ? REACTION_GOOD_WELCOMED : REACTION_GOOD_RESENTED)
            : undefined;

        // Reactions are register-gated, so `selectDetail` returns nothing where
        // there is no community close enough to have a view. Fall back to the
        // consequence rather than dropping the slot.
        const tail = (reaction && chance('reaction', 40)
          ? selectDetail(reaction, bioContext, pickBiography)
          : '') || selectDetail(consequence, bioContext, pickBiography);
        if (tail) sentences.push(tail);
      }
    }

    addBeat('adult-events', sentences);
  }

  // Health status
  // A mild scraped knee does not belong in a biography, and certainly not
  // phrased as having made ordinary labor uncertain.
  const activeDisease = character.diseaseHealth?.currentDiseases?.find(d =>
    d.disease?.severity === 'severe'
    || d.disease?.severity === 'critical'
    || (typeof d.severity === 'number' && d.severity > 0.45)
  );
  if (activeDisease) {
    const diseaseName = activeDisease.disease.name.toLowerCase();
    const grave = activeDisease.disease.severity === 'critical';
    // Disease names are sometimes plural ("intestinal worms"), so the verb has
    // to agree with the name rather than with the persona.
    const hasVerb = isPluralDiseaseName(diseaseName) ? 'have' : 'has';
    // An injury is a thing that happened to a part of a body, not a condition
    // with a proper name: "a torn muscle in his shoulder", not "Torn muscle".
    const injury = INJURY_SITES[diseaseName];
    // Some injury names already carry their own site — "sprained ankle",
    // "scraped knee", "bruised ribs" — and naming it again produces "a sprained
    // ankle in his ankle". Only add the site when the name does not have one.
    const site = injury
      ? pickBiography(injury.filter(part => !diseaseName.toLowerCase().includes(part)))
      : undefined;
    const subject = site
      ? `${withIndefiniteArticle(diseaseName)} in ${pronounPoss} ${site}`
      : injury
        ? withIndefiniteArticle(diseaseName)
        : capitalize(diseaseName);
    addBeat('health', grave
      ? `${capitalize(subject)} ${hasVerb} ${pronounObj} now, and the household is preparing for what that usually means.`
      : `${capitalize(subject)} ${hasVerb} made ordinary labor uncertain, but ${pronoun} ${conjugate('continue', narrativePronouns)} as circumstances allow.`);
  }

  // ---- The persona's own household ----------------------------------------
  {
    const spouse = character.family?.find((m: any) => m.relation === 'spouse');
    const offspring = (character.family ?? []).filter((m: any) => m.relation === 'son' || m.relation === 'daughter');
    const living = offspring.filter((m: any) => !m.isDeceased);
    const lost = offspring.length - living.length;
    const eldest = living.reduce(
      (oldest: number, child: any) => Math.max(oldest, child.age ?? 0), 0);
    const spelled = (count: number): string => SMALL_NUMBERS[count] ?? String(count);
    // A clause may open on an expanded placeholder ("${born} were born and
    // ${children} are living"), and placeholder expansion does not capitalise.
    const household = (bank: Clause[], extras: Record<string, string | undefined>): string => {
      const text = selectDetail(bank, bioContext, pickBiography, extras);
      return text ? capitalize(text) : '';
    };

    // "No marriage was ever made for her" cannot follow "she lost a child before
    // it could walk". The event bank can hand out a marriage or a child without
    // the family record carrying a spouse, and the two then contradict.
    const impliesAPartner = offspring.length > 0 || chosenAdult.some(({ event }) =>
      /\b(child|children|son|daughter|wife|husband|spouse|married|marriage|wedding|widow)\b/i.test(event.text ?? ''));

    const lines: string[] = [];
    if (spouse) {
      const marriedYears = typeof spouse.marriedSince === 'number'
        ? Math.max(1, persona.year - spouse.marriedSince)
        : undefined;
      const partnerNoun = character.gender === 'Male' ? 'wife'
        : character.gender === 'Female' ? 'husband'
          : 'spouse';
      // The duration-bearing clauses are unusable without a marriage year, and
      // records written before the field existed do not carry one.
      const marriageBank = marriedYears === undefined
        ? HOUSEHOLD_MARRIAGE.filter(clause => !clause.text.includes('${years}'))
        : HOUSEHOLD_MARRIAGE;
      lines.push(household(marriageBank, {
        spouse: spouse.name,
        partner: partnerNoun,
        years: marriedYears === undefined ? undefined : spelled(marriedYears),
      }));

      const spouseWork = spouseWorkPhrase(spouse.profession);
      if (spouseWork && chance('spouse-trade', 40)) {
        lines.push(household(HOUSEHOLD_MARRIAGE_TRADE, {
          spouse: spouse.name,
          partner: partnerNoun,
          trade: spouseWork,
        }));
      }

      if (living.length === 0 && lost === 0) {
        if (chance('childless', 70)) lines.push(household(HOUSEHOLD_CHILDLESS, {}));
      } else if (lost > 0 && chance('child-loss', 75)) {
        const lossBank = living.length === 0 ? HOUSEHOLD_LOSS_ALL
          : living.length === 1 ? HOUSEHOLD_LOSS_ONE_LEFT
            : HOUSEHOLD_LOSS;
        const countOf = (n: number): string => n === 1 ? 'one child' : `${spelled(n)} children`;
        lines.push(household(lossBank, {
          children: spelled(living.length),
          born: countOf(offspring.length),
          lost: countOf(lost),
        }));
      } else if (living.length === 1) {
        lines.push(household(HOUSEHOLD_ONE_CHILD, {
          eldest: eldest <= 1 ? 'a year old' : `${eldest} years old`,
        }));
      } else if (living.length > 1) {
        lines.push(household(HOUSEHOLD_CHILDREN, {
          children: spelled(living.length),
          eldest: String(eldest),
        }));
      }
    } else if (character.age >= 22 && !impliesAPartner && chance('unmarried', 60)) {
      lines.push(household(HOUSEHOLD_UNMARRIED, {}));
    }

    addBeat('household', lines.filter(Boolean));
  }

  if (chance('world', fullness === 'brief' ? 55 : 85)) addBeat('world', describeWorldTexture(bioContext, pickBiography));

  // Who the persona answers to, where there is anyone. Most of the table's
  // states are not a going concern in a subject's daily life, so this is one
  // short sentence and it is skipped a fifth of the time.
  //
  // Which sentence is chosen by how long the regime has held the place rather
  // than at random. That is the difference between a detail and filler: a state
  // four hundred years old and one eleven years old are different things to
  // live under, and the shapes stay distinct under `auditNarrative`'s
  // skeletonizer, which erases the proper nouns before it counts.
  const standing = getPolityAt({
    year: persona.year,
    region: persona.region,
    location: persona.location,
    culturalZone: persona.culturalZone as CulturalZone,
  });
  if (standing && chance('polity', fullness === 'brief' ? 60 : 85)) {
    const held = persona.year - standing.since;
    const title = rulerTitleFor(standing.name);
    const state = withPolityArticle(standing.name);

    // "The Swahili city-states has held this country" — several entries in the
    // table are a set of powers rather than one, and they need the plural verb.
    const plural = isPluralPolity(standing.name);

    const span = reignSpan(held);
    const hasVerb = plural ? 'have' : 'has';

    addBeat('polity', title && chance('polity-title', 55)
      ? `${capitalize(pronoun)} ${pronounBe} a subject of ${title}.`
      : held <= 25
        ? pickFrom('polity-new', [
          `${capitalize(state)} ${plural ? 'are' : 'is'} new here, ${held} years in and not yet settled into the habits of rule.`,
          `${capitalize(state)} ${hasVerb} held this country only ${span}, and it shows.`,
          `Authority here passed to ${state} within ${pronounPoss} own memory.`,
        ])
        : held >= 150
          ? pickFrom('polity-old', [
            `${capitalize(state)} ${hasVerb} held this country since ${formatYear(standing.since)}, beyond anyone's memory.`,
            `${capitalize(state)} ${hasVerb} held this country ${span}, which is to say always.`,
            `Authority here runs up to ${state}, and ${hasVerb} for ${span}.`,
            `No one alive remembers this country under anyone but ${state}.`,
          ])
          : pickFrom('polity-mid', [
            `Authority here runs up to ${state}, and ${hasVerb} for ${span}.`,
            `${capitalize(state)} ${hasVerb} held this country ${span}.`,
            `Authority here runs up to ${state}, and has since ${formatYear(standing.since)}.`,
          ]));
  }

  // What was happening here that the steady-state tables know nothing about.
  //
  // This sits next to `polity` on purpose: both answer "what kind of year is
  // this to be alive in", and both are dated from a table rather than drawn
  // from a pool, so neither can drift across eras the way the template banks
  // do. The clause is rolled against the episode's severity inside
  // `disruptionClause`, so a low-severity window mentions itself rarely and a
  // catastrophic one almost always — which is the honest distribution.
  const catastrophe = disruptionClause(
    persona.historicalContext?.culturalZone ?? persona.character.culturalZone,
    persona.year,
    persona.region,
    persona.location,
    () => draw('disruption', 1000) / 1000,
  );
  if (catastrophe) addBeat('disruption', catastrophe);

  // The standing condition the work is done under, where there is one.
  //
  // Unrolled, unlike the disruption clause: an episode may or may not have
  // reached a given life, but a legal condition reached all of it, every day,
  // and a biography that mentions the cooperage without mentioning who owns
  // the cooper is not describing the same life.
  if (persona.socialCondition) addBeat('condition', persona.socialCondition.clause);

  // Helper function to get belief description
  const getBeliefDescription = (beliefs: any[]): { nounPhrase: boolean; text: string } | null => {
    if (!beliefs || beliefs.length === 0) return null;

    // Sort by conviction to get the strongest belief
    const sortedBeliefs = [...beliefs].sort((a, b) => b.conviction - a.conviction);
    const primaryBelief = sortedBeliefs[0];

    if (!primaryBelief || !primaryBelief.beliefId) return null;

    // Look up the belief text from PERSONAL_BELIEFS constant
    const beliefData = PERSONAL_BELIEFS.find((b: any) => b.id === primaryBelief.beliefId);

    if (!beliefData?.text) return null;

    // "Believes in X" heads a noun phrase and "Believes that X" heads a
    // clause, and the two cannot share a frame: stripping both prefixes and
    // dropping the remainder into "the conviction that …" produced "Her
    // worldview is shaped by the conviction that only what can be observed and
    // tested through experience", which has no verb in it.
    const source = beliefData.text.replace(/^[Dd]eeply /, '');
    const nounPhrase = /^[Bb]elieves in /.test(source);
    const body = source
      .replace(/^[Bb]elieves that /i, '')
      .replace(/^[Bb]elieves in /i, '')
      .replace(/^[Bb]elieves /i, '');
    return { nounPhrase, text: body.charAt(0).toLowerCase() + body.slice(1) };
  };

  // Social standing and beliefs - more sophisticated integration
  const belief = getBeliefDescription(character.beliefs);

  const professionText = professionName;
  const canCarryAbstractIdeology = /merchant|banker|lawyer|clerk|scribe|scholar|teacher|operator|official|administrator|printer|journalist|student|activist|politician|priest|monk|imam|rabbi|minister|reformer|writer|artist|entrepreneur|shopkeeper|trader/.test(professionText);
  const ideologyLooksModern = /CAPITALIST|SOCIALIST|LIBERAL|NATIONALIST/i.test(character.ideology || '');

  if (character.ideology && character.ideology !== 'Pragmatism' && (!ideologyLooksModern || canCarryAbstractIdeology)) {
    const ideology = IDEOLOGIES.find((i: any) => i.id === character.ideology);
    addBeat('outlook', describeIdeology(ideology, narrativePronouns, pickBiography));
  } else if (belief) {
    // If no ideology but has beliefs, mention them
    addBeat('outlook', belief.nounPhrase
      ? `${pronounPossCap} worldview ${pronounBe} shaped by a settled belief in ${belief.text}.`
      : `${pronounPossCap} worldview ${pronounBe} shaped by the conviction that ${belief.text}.`);
  }

  // The outlier, if there is one. `traitSeals` decides what qualifies, so the
  // sentence below and the wax seal on the portrait cannot disagree about who
  // is remarkable. It is computed here rather than where it is used because the
  // temperament ladder has to know which trait it must not speak for.
  //
  // The declared stat and personality interfaces have no index signature, which
  // is all `SealInput` wants of them.
  const seal = traitSeals({
    stats: character.stats as unknown as Record<string, number>,
    personality: character.personality as unknown as Record<string, number>,
  })[0];
  const sealedTrait = seal?.id.startsWith('trait:') ? seal.id.slice('trait:'.length) : null;

  // Personality - sophisticated and varied
  const personality = character.personality;
  if (personality) {
    const traits: string[] = [];

    // Check for ideologies that conflict with certain personality traits
    const isRevolutionary = character.ideology &&
      (character.ideology.toLowerCase().includes('revolutionary') ||
       character.ideology.toLowerCase().includes('radical') ||
       character.ideology.toLowerCase().includes('anarchist'));

    // The temperament thresholds are unchanged; what each one can say is not.
    // A single fixed string per threshold put "a practical nature that values
    // the proven over the experimental" into every era at the same rate.
    const trait = (bank: Parameters<typeof selectDetail>[0]): void => {
      const text = selectDetail(bank, bioContext, pickBiography);
      if (text) traits.push(text);
    };

    // A sealed trait already has a sentence of its own further down, and the
    // two banks describe the same thing in the same paragraph: "a preference
    // for his own company" and "he keeps entirely to his own company".
    if (sealedTrait === 'openness') {
      // Nothing: the remarkable sentence speaks for it.
    } else if (personality.openness > 0.7 && personality.extraversion > 0.6) {
      trait(TRAIT_OPEN_OUTGOING);
    } else if (personality.openness > 0.7 && personality.conscientiousness > 0.6) {
      trait(TRAIT_OPEN_METHODICAL);
    } else if (personality.openness > 0.7) {
      trait(TRAIT_OPEN);
    } else if (personality.openness < 0.3 && personality.conscientiousness > 0.7 && !isRevolutionary) {
      // Skip "tradition and routine" if revolutionary
      trait(TRAIT_SETTLED);
    } else if (personality.openness < 0.3) {
      trait(TRAIT_PRACTICAL);
    }

    if (sealedTrait === 'agreeableness') {
      // Nothing, as above.
    } else if (personality.agreeableness > 0.7 && personality.extraversion > 0.6 && !isRevolutionary) {
      // Skip "warm and generous" if revolutionary (conflicts with radical change)
      trait(TRAIT_WARM);
    } else if (personality.agreeableness > 0.7 && !isRevolutionary) {
      // Skip "gentle disposition seeks harmony" if revolutionary (direct contradiction)
      trait(TRAIT_GENTLE);
    } else if (personality.agreeableness > 0.7 && isRevolutionary) {
      // Alternative trait for high agreeableness revolutionaries
      trait(TRAIT_COMMITTED);
    } else if (personality.agreeableness < 0.3 && personality.neuroticism < 0.4) {
      trait(TRAIT_BLUNT);
    } else if (personality.agreeableness < 0.3) {
      trait(TRAIT_INDEPENDENT);
    }

    if (sealedTrait === 'conscientiousness' || sealedTrait === 'neuroticism') {
      // Nothing, as above.
    } else if (personality.conscientiousness > 0.75) {
      trait(TRAIT_SCRUPULOUS);
    } else if (personality.neuroticism > 0.7) {
      trait(TRAIT_WARY);
    }

    // Extraversion is otherwise only reachable in combination with openness or
    // agreeableness, so a marked temperament went unmentioned whenever the
    // other two were middling. Skipped when a combination above has already
    // spoken for it, which would say the same thing twice in one sentence.
    const extraversionSpoken = sealedTrait === 'extraversion'
      || (personality.extraversion > 0.6
        && (personality.openness > 0.7 || personality.agreeableness > 0.7));
    if (!extraversionSpoken) {
      if (personality.extraversion > 0.72) {
        trait(TRAIT_GREGARIOUS);
      } else if (personality.extraversion < 0.28) {
        trait(TRAIT_SOLITARY);
      }
    }

    if (traits.length > 0) {
      const personalityIntros = [
        `Those who know ${pronounObj} speak of ${traits[0]}`,
        `Acquaintances describe ${pronounObj} as possessing ${traits[0]}`,
        `${pronounPossCap} reputation rests on ${traits[0]}`,
        `${subjectCap} ${pronounBe} known for ${traits[0]}`
      ];

      // Every trait that qualified used to be listed, so most personas ended on
      // a three-clause sentence of the same shape. One trait is often the more
      // characterful choice.
      const traitCount = Math.min(traits.length, pickFrom('trait-count', [1, 1, 2, 2, 3]));
      let personalitySentence = pickFrom('personality-intro', personalityIntros);
      if (traitCount > 1) personalitySentence += `, as well as ${traits[1]}`;
      if (traitCount > 2) personalitySentence += `, and ${traits[2]}`;
      addBeat('personality', `${personalitySentence}.`);
    }
  }

  // The outlier itself. Unconditional: the whole point of a seal is that the
  // life it belongs to is not the ordinary case, and a reader who sees "bottom
  // 0.1% for extraversion" beside a biography describing an unremarkable
  // temperament concludes, correctly, that the two came out of different
  // machines. Only the rarest of the two seals a persona can carry gets a
  // sentence — prose that enumerates them is a character sheet again.
  const remarkableBank = seal ? REMARKABLE[`${seal.id}:${seal.direction}`] : undefined;
  if (remarkableBank?.length) {
    const pickFrame = <T,>(values: T[]): T => values[draw('remarkable-frame', values.length)];
    const clause = selectDetail(remarkableBank, bioContext, pickBiography);
    const frame = selectDetail(REMARKABLE_FRAMES, bioContext, pickFrame);
    if (clause && frame) {
      addBeat('remarkable', frame
        .replace('${traitCap}', capitalize(clause))
        .replace('${trait}', clause));
    }
  }

  // The closing roll-call of parents is dropped whenever the names have already
  // been folded into the livelihood sentence, and often when they have not.
  if (!foldParentNames && character.family && character.family.length > 0 && chance('parents-rollcall', fullness === 'long' ? 45 : 60)) {
    addBeat('parents', describeParents(father?.name, mother?.name, narrativePronouns, true));
  }

  // ---- Arrangement -------------------------------------------------------

  /**
   * Orderings of the origins beats. `lead` is anchored first because it is the
   * sentence that carries the name. `birth` is only populated when the lead is
   * something other than birth, and then it is an ordinary beat that can fall
   * anywhere in the paragraph.
   */
  const ORIGIN_PLANS: string[][] = [
    ['lead', 'birth', 'livelihood', 'childhood', 'appearance', 'origin-attr', 'youth-event'],
    ['lead', 'childhood', 'birth', 'livelihood', 'origin-attr', 'youth-event', 'appearance'],
    ['lead', 'origin-attr', 'livelihood', 'birth', 'childhood', 'youth-event', 'appearance'],
    ['lead', 'livelihood', 'youth-event', 'childhood', 'birth', 'origin-attr', 'appearance'],
    ['lead', 'appearance', 'livelihood', 'childhood', 'origin-attr', 'youth-event', 'birth'],
    ['lead', 'childhood', 'origin-attr', 'birth', 'appearance', 'livelihood', 'youth-event'],
  ];

  /**
   * Orderings of the present beats. `trade` must immediately follow
   * `profession` in all of them: the texture sentence is a continuation of the
   * profession sentence, and separating them produced "At 49, she works as a
   * farm worker. At age 31, her mother died… The trade is piece rates, a
   * contractor, and a season that ends without notice."
   *
   * The first six end on temperament and outlook. The last four do not, and
   * exist because 91.7% of biographies were closing on the same two beats —
   * which made a temperament read as an appended trait list rather than as
   * something the preceding life had demonstrated.
   */
  const PRESENT_PLANS: string[][] = [
    ['profession', 'trade', 'condition', 'household', 'present-attr', 'adult-events', 'health', 'world', 'polity', 'disruption', 'outlook', 'personality', 'remarkable', 'parents'],
    ['profession', 'trade', 'condition', 'world', 'disruption', 'polity', 'adult-events', 'household', 'present-attr', 'health', 'personality', 'remarkable', 'outlook', 'parents'],
    ['adult-events', 'profession', 'trade', 'condition', 'household', 'present-attr', 'polity', 'disruption', 'health', 'world', 'remarkable', 'personality', 'outlook', 'parents'],
    ['disruption', 'polity', 'world', 'profession', 'trade', 'condition', 'household', 'adult-events', 'present-attr', 'health', 'outlook', 'personality', 'remarkable', 'parents'],
    ['profession', 'trade', 'condition', 'health', 'household', 'disruption', 'present-attr', 'adult-events', 'world', 'polity', 'remarkable', 'outlook', 'personality', 'parents'],
    ['present-attr', 'profession', 'trade', 'condition', 'household', 'polity', 'disruption', 'adult-events', 'world', 'health', 'personality', 'outlook', 'remarkable', 'parents'],
    // Closing on the life rather than on the person.
    ['profession', 'trade', 'condition', 'personality', 'remarkable', 'outlook', 'present-attr', 'polity', 'disruption', 'world', 'health', 'adult-events', 'household', 'parents'],
    ['profession', 'trade', 'outlook', 'condition', 'parents', 'personality', 'remarkable', 'present-attr', 'adult-events', 'health', 'household', 'disruption', 'polity', 'world'],
    ['adult-events', 'personality', 'remarkable', 'profession', 'trade', 'condition', 'outlook', 'parents', 'household', 'present-attr', 'world', 'polity', 'health', 'disruption'],
    ['profession', 'trade', 'personality', 'remarkable', 'present-attr', 'condition', 'household', 'parents', 'outlook', 'world', 'disruption', 'health', 'polity', 'adult-events'],
  ];

  /**
   * Beats that describe the person rather than the life, for the last break.
   *
   * `remarkable` follows or precedes `personality` in every plan, so admitting
   * it here never moves where the third paragraph begins.
   */
  const CLOSING_BEATS = new Set(['outlook', 'personality', 'remarkable', 'parents']);

  const render = (plan: string[]): string[] => plan.flatMap(id => beats.get(id) ?? []);

  const originPlan = pickFrom('origin-plan', ORIGIN_PLANS);
  // When the present runs first, the profession sentence is the one carrying
  // the name, so it has to be the sentence the biography opens on. A plan that
  // leads on an event gave "At age 32, her father died from pneumonia" as a
  // first line, with no indication yet of whose father.
  const presentPlan = pickFrom(
    'present-plan',
    presentFirst ? PRESENT_PLANS.filter(plan => plan[0] === 'profession') : PRESENT_PLANS,
  );

  // A long life with a lot to report earns a third paragraph; a short one does
  // not. Previously every biography was two paragraphs regardless.
  //
  // The break falls at the first person-describing beat, but only when that
  // beat is late enough for the first half to be a paragraph. The plans that
  // close on the life put `personality` a third of the way in, and splitting
  // there left a two-sentence opener followed by everything else.
  const presentLength = render(presentPlan).length;
  const firstClosing = presentPlan.findIndex(id => CLOSING_BEATS.has(id));
  const closingIndex = firstClosing >= Math.ceil(presentPlan.length * 0.55) ? firstClosing : -1;
  const splitPresent = presentLength >= 8
    && fullness === 'long'
    && closingIndex > 0
    && !presentFirst
    && chance('split-present', 45);

  const paragraphSentences = splitPresent
    ? [
      render(originPlan),
      render(presentPlan.slice(0, closingIndex)),
      render(presentPlan.slice(closingIndex)),
    ]
    : presentFirst
      ? [render(presentPlan), render(originPlan)]
      : [render(originPlan), render(presentPlan)];

  const cleanParagraph = (sentences: string[]): string => sentences
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return paragraphSentences.map(cleanParagraph).filter(Boolean).join('\n\n');
}
