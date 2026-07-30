/**
 * constants/characterData/nameConventions.ts
 *
 * *How* a name is put together, as distinct from which names are in the pool.
 *
 * The generator used to build every name the same way — a given name followed by
 * something drawn from a surname list — which quietly asserts that hereditary
 * family names are the human default. They are not. They are recent and
 * unusual: England had no general system of inherited surnames before roughly
 * the twelfth century, Wales was still patronymic in the sixteenth, Sweden and
 * Norway into the nineteenth, and Iceland has never adopted them at all. Across
 * the Arabic-speaking world a person was placed by descent (*ibn*, *bint*) and
 * by parenthood (*Abu*, *Umm*) rather than by a family name until the twentieth
 * century. For most people in most of the past, a name was one name.
 *
 * So the convention is modelled separately and chosen by culture and period, and
 * "X of Y" — a specific medieval European and elite habit — takes its place as
 * one option among eight rather than as the shape of all human naming.
 *
 * The particles are given in the forms an English-language reader will
 * recognise. This is a gloss, not a transliteration exercise.
 */

import { EliteNameStyle, eliteNameStyleFor } from './eliteNaming';

export type NameConvention =
  /** A single given name and nothing else. The commonest case in human history. */
  | 'personal'
  /** Placed by descent: X son of Y, X ibn Y, Sigriðardóttir. */
  | 'patronymic'
  /** Placed by parenthood: Abu Yusuf, "mother of Kesia". */
  | 'teknonym'
  /** A descriptive byname earned rather than inherited: the Lame, the Red. */
  | 'epithet'
  /** A clan, lineage or moiety name. */
  | 'clan'
  /** Placed by origin: of Ecbatana, von Habsburg, da Vinci. */
  | 'toponymic'
  /** Placed by trade: Smith, Baker, Miller. */
  | 'occupational'
  /** A hereditary family name passed down intact. */
  | 'inherited';

export interface FormattedName {
  full: string;
  given: string;
  convention: NameConvention;
  /**
   * The name set this name actually came from. The family used to re-detect it
   * from the finished string, so a persona drawn from the Ashkenazi list came
   * out "Isaac Green", "Green" matched the English surnames first, and his
   * parents were generated as "Mark Green" and "Florence Turner".
   */
  nameKey?: string;
  /**
   * When a patronymic was used, the parent's given name it refers to — so the
   * family the app generates afterwards can be made to agree with it. A persona
   * called "Wulf son of Ket" whose father panel says "Hrothgar" is worse than
   * no patronymic at all.
   */
  patronymicFrom?: string;
  /**
   * When a hereditary or clan name was used, the name itself — so the father
   * and siblings can carry it too. An inherited surname that nobody else in the
   * family has is not an inherited surname.
   */
  familyName?: string;
}

type Weights = Partial<Record<NameConvention, number>>;

interface ConventionProfile {
  weights: Weights;
  /** How a patronymic is formed, if this culture forms one. */
  patronymic?: (parentGiven: string, gender: 'Male' | 'Female') => string;
  /** How a teknonym is formed. */
  teknonym?: (childGiven: string, gender: 'Male' | 'Female') => string;
}

// ---------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------

const PLAIN_PATRONYMIC = (parent: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'son' : 'daughter'} of ${parent}`;

const ARABIC_PATRONYMIC = (parent: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'ibn' : 'bint'} ${parent}`;

const HEBREW_PATRONYMIC = (parent: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'ben' : 'bat'} ${parent}`;

// The genitive -s is already there when the father's name ends in one, so
// Vigfus takes `son`, not `sson` — the naive concatenation produced the
// three-s "Vigfussson". Names ending in -r or -n behave the same way in the
// modern spelling this app uses (Ragnar → Ragnarsson keeps its own r).
const norsePatronymic = (daughterSuffix: string) =>
  (parent: string, gender: 'Male' | 'Female') => {
    const stem = /s$/i.test(parent) ? parent : `${parent}s`;
    return `${stem}${gender === 'Male' ? 'son' : daughterSuffix}`;
  };

/** Iceland, which still forms patronymics this way. */
const ICELANDIC_PATRONYMIC = norsePatronymic('dóttir');
/** Mainland Scandinavia, where the female form is -dotter and has no accent. */
const NORSE_PATRONYMIC = norsePatronymic('dotter');

const WELSH_PATRONYMIC = (parent: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'ap' : 'ferch'} ${parent}`;

const GAELIC_PATRONYMIC = (parent: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'mac' : 'nic'} ${parent}`;

const SLAVIC_PATRONYMIC = (parent: string, gender: 'Male' | 'Female') =>
  `${parent}${gender === 'Male' ? 'ovich' : 'ovna'}`;

/**
 * Malay and Indonesian bin/binti. Deliberately not `PLAIN_PATRONYMIC`, because
 * `settleDescriptiveForms` folds the plain form into an inherited surname once
 * civil registration arrives — right for a byname, wrong here. Bin and binti
 * are what is on the identity card in Malaysia and Brunei today.
 */
const MALAY_PATRONYMIC = (parent: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'bin' : 'binti'} ${parent}`;

const ARABIC_TEKNONYM = (child: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'Abu' : 'Umm'} ${child}`;

const PLAIN_TEKNONYM = (child: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'father' : 'mother'} of ${child}`;

/**
 * Descriptive bynames. Deliberately plain and physical — the kind of thing a
 * neighbour calls you, which is what a byname was before it was a surname.
 *
 * A byname is a claim about the person, so each one has to be earned: the
 * evidence-bearing epithets are drawn only from what the persona actually is.
 * Before this, the pool was decorative and a woman called "the One-Eyed" had
 * two good eyes. `earnedEpithets` maps a persona to the bynames their
 * neighbours could plausibly have given them.
 *
 * The second problem is range. A byname is the commonest way of telling two
 * people with the same given name apart, so a naming world needs as many of
 * them as it has reasons to distinguish anyone: bynames come from the body, the
 * temper, the trade, the birth order, where you came from, what happened to you
 * once, and what animal you were held to resemble. The pool used to hold
 * twenty-two, five of which needed no evidence and therefore carried almost all
 * the traffic — in a sample of two hundred Bronze Age Europeans, "the Dark",
 * "the Fair", "the Quiet", "the Elder" and "the Younger" accounted for
 * fifty-five of the seventy-seven bynames handed out. That reads as a village
 * of five nicknames rather than as the past.
 *
 * It was also one pool for all of humanity, in English glosses drawn from the
 * Norse and English saga registers. A Han farmer, a Wolof smith and an Andean
 * herder do not share a byname vocabulary, so the neutral pools below are keyed
 * by cultural zone. The evidence-bearing ones stay common across cultures —
 * a limp is a limp everywhere — but the plain descriptive stock differs.
 */

/** Bynames that report something about the body or the life, and must be earned. */
const EARNABLE_EPITHETS = [
  'the Tall', 'the Short', 'the Red', 'the Grey', 'the Swift', 'the Lame',
  'the One-Eyed', 'the Left-Handed', 'the Bold', 'the Patient', 'the Scarred',
  'the Silent', 'the Stout', 'the Lean', 'the Restless', 'the Watchful',
  'the Wanderer', 'the Bald', 'the Deaf', 'the Stammerer', 'the Squinting',
  'the Crooked', 'the Broad', 'the Freckled', 'the Toothless', 'the Marked',
  'the Sleepless', 'the Barren', 'the Twice-Widowed', 'the Returned',
  'the Captive', 'the Fatherless', 'the Fortunate', 'the Unlucky',
];

/** Attribute ids that entitle a persona to a given byname. */
const EPITHET_EVIDENCE: Record<string, string[]> = {
  'the Tall': ['towering'],
  'the Short': ['diminutive', 'bound_feet'],
  'the Lame': ['lame', 'clubfoot', 'bowed_legs', 'hunchback'],
  'the Crooked': ['hunchback', 'bowed_legs', 'scoliosis'],
  'the One-Eyed': ['blind', 'disfigured', 'trachoma', 'lightning_struck'],
  'the Squinting': ['nearsighted', 'trachoma', 'clouded_eyes', 'wall_eyed'],
  'the Deaf': ['deaf', 'hard_of_hearing'],
  'the Stammerer': ['stammer', 'stutter'],
  'the Scarred': ['scarred', 'burn_scarred', 'pox_scarred', 'disfigured', 'scarified'],
  'the Marked': ['birthmark', 'scarified', 'tattooed', 'branded'],
  'the Toothless': ['toothless', 'rotten_tooth', 'scurvy'],
  'the Bald': ['balding', 'alopecia', 'scald_head'],
  'the Freckled': ['freckled'],
  'the Red': ['red_haired'],
  'the Grey': ['prematurely_gray'],
  'the Left-Handed': ['left_handed'],
  'the Swift': ['athletic'],
  'the Broad': ['broad_shouldered', 'strong'],
  'the Bold': ['brave', 'reckless'],
  'the Patient': ['patient'],
  'the Silent': ['taciturn', 'mute'],
  'the Stout': ['corpulent', 'strong'],
  'the Lean': ['gaunt', 'frail'],
  'the Restless': ['wanderer', 'insomniac', 'reckless'],
  'the Sleepless': ['insomniac'],
  'the Watchful': ['keen_eyed', 'cautious'],
  'the Wanderer': ['wanderer', 'exile', 'foreigner'],
  'the Captive': ['enslaved', 'captive', 'prisoner', 'impressed', 'bonded_for_debt'],
  'the Returned': ['exile', 'pilgrim', 'veteran'],
  'the Fatherless': ['orphan', 'foundling'],
  'the Barren': ['barren'],
  'the Twice-Widowed': ['widowed'],
  'the Fortunate': ['lucky'],
  'the Unlucky': ['unlucky', 'cursed'],
};

/**
 * Bynames that need no evidence beyond ordinary variation: birth order, temper,
 * complexion, the direction you came from, the animal you are held to resemble.
 * These carry the bulk of the traffic, so the pools are deliberately long.
 */
const NEUTRAL_EPITHETS: Record<string, string[]> = {
  /** The Norse, Gaelic and English saga register these glosses came from. */
  EUROPEAN: [
    'the Elder', 'the Younger', 'the Dark', 'the Fair', 'the Quiet', 'the Black',
    'the White', 'the Ruddy', 'the Merry', 'the Sour', 'the Mild', 'the Stern',
    'the Proud', 'the Wise', 'the Simple', 'the Hasty', 'the Careful',
    'the Godly', 'the Wealthy', 'the Poor', 'the Younger Brother', 'the Widow',
    'the Newcomer', 'the Hillman', 'the Marshman', 'the Northerner',
    'the Southerner', 'the Islander', 'the Forester', 'the Fowler',
    'the Bee-Keeper', 'the Ale-Wife', 'the Early-Riser', 'the Long-Sleeper',
    'the Crow', 'the Hare', 'the Badger', 'the Wren', 'the Sparrow',
    'the Goat', 'the Ox', 'the Bear-Cub',
  ],
  /** Bynames in the Arabic register, which had the richest byname culture of all. */
  MENA: [
    'the Elder', 'the Younger', 'the Dark', 'the Fair', 'the Quiet',
    'the Generous', 'the Truthful', 'the Trusted', 'the Learned', 'the Pious',
    'the Patient One', 'the Sharp-Tongued', 'the Slow-Spoken', 'the Grave',
    'the Open-Handed', 'the Close-Fisted', 'the Early-Waking',
    'the Sweet-Voiced', 'the Desert-Born', 'the Town-Born', 'the Highlander',
    'the Coast-Dweller', 'the Well-Digger', 'the Guest-Feeder',
    'the Camel-Eyed', 'the Falcon', 'the Lion-Hearted', 'the Gazelle',
    'the Hawk', 'the Blue-Eyed', 'the Green-Grocer', 'the Silent at Council',
  ],
  SOUTH_ASIAN: [
    'the Elder', 'the Younger', 'the Dark', 'the Fair', 'the Quiet',
    'the Steady', 'the Golden', 'the Gentle', 'the Bright', 'the Devoted',
    'the River-Born', 'the Hill-Born', 'the Grove-Keeper', 'the Well-Spoken',
    'the Early-Married', 'the Late-Born', 'the Only Son', 'the Only Daughter',
    'the Elephant', 'the Peacock', 'the Heron', 'the Buffalo', 'the Cuckoo',
    'the Lotus-Eyed', 'the Long-Armed', 'the Soft-Footed', 'the Loud-Laughing',
  ],
  EAST_ASIAN: [
    'the Elder', 'the Younger', 'the Dark', 'the Fair', 'the Quiet',
    'the Upright', 'the Diligent', 'the Frugal', 'the Learned', 'the Filial',
    'the Third Son', 'the Fourth Son', 'the Second Daughter', 'the Late-Born',
    'the River-Side', 'the East Village', 'the West Village', 'the Upper Hamlet',
    'the Iron-Handed', 'the Crane', 'the Carp', 'the Ox', 'the Magpie',
    'the Bamboo', 'the Pine', 'the Sparrow-Voiced', 'the Slow-Walking',
  ],
  SUB_SAHARAN_AFRICAN: [
    'the Elder', 'the Younger', 'the Dark', 'the Fair', 'the Quiet',
    'the Firstborn', 'the Lastborn', 'the Twin', 'the Born-on-the-Road',
    'the Born-in-Rain', 'the Born-in-Famine', 'the Long-Awaited',
    'the Market-Woman', 'the Drummer', 'the Well-Named', 'the Laughing One',
    'the Slow to Anger', 'the One Who Returns', 'the Leopard', 'the Antelope',
    'the Guinea-Fowl', 'the Bull-Calf', 'the Hornbill', 'the Termite',
    'the Iron-Worker', 'the Palm-Climber', 'the Far-Traveller',
  ],
  OCEANIA: [
    'the Elder', 'the Younger', 'the Dark', 'the Fair', 'the Quiet',
    'the Firstborn', 'the Lastborn', 'the Seaward', 'the Landward',
    'the Windward', 'the Leeward', 'the Reef-Walker', 'the Deep-Diver',
    'the Canoe-Builder', 'the Net-Mender', 'the Star-Reader', 'the Far-Sailed',
    'the Shark', 'the Frigatebird', 'the Turtle', 'the Eel', 'the Coconut Crab',
    'the Loud-Singing', 'the Slow-Speaking', 'the Storm-Born',
  ],
  NORTH_AMERICAN_PRE_COLUMBIAN: [
    'the Elder', 'the Younger', 'the Quiet', 'the Firstborn', 'the Lastborn',
    'the Twin', 'the Left-Behind', 'the Slow-Speaking', 'the Loud-Laughing',
    'the Far-Walker', 'the Early-Riser', 'the Dream-Teller', 'the Good Host',
    'the Careful Hunter', 'the Basket-Maker', 'the Fire-Tender',
    'the North-Camp', 'the South-Camp', 'the River-Side', 'the Upland',
    'the Winter-Born', 'the Summer-Born', 'the One Who Came Back',
  ],
  SOUTH_AMERICAN: [
    'the Elder', 'the Younger', 'the Quiet', 'the Firstborn', 'the Lastborn',
    'the Highland-Born', 'the Valley-Born', 'the Coast-Born', 'the Forest-Born',
    'the Llama-Herder', 'the Weaver', 'the Salt-Carrier', 'the Cloud-Walker',
    'the Sure-Footed', 'the Long-Breathed', 'the Slow-Speaking',
    'the Condor', 'the Fox', 'the Hummingbird', 'the Toad', 'the Puma-Cub',
    'the Winter-Born', 'the Planting-Born',
  ],
};

/** Zones without their own list fall back to the European register. */
const DEFAULT_NEUTRAL = NEUTRAL_EPITHETS.EUROPEAN;

/**
 * Bynames drawn from Christian, Islamic or Buddhist devotional vocabulary make
 * no sense before those religions reach a place, and "the Godly" on a
 * Palaeolithic forager is the same category of error as a surname on one.
 */
const DEVOTIONAL = new Set(['the Godly', 'the Pious', 'the Devoted', 'the Filial']);

/** Bynames that name a role only one sex held. */
const MALE_ONLY = /Son|Brother|Bull-Calf|Ox\b/;
const FEMALE_ONLY = /Daughter|Widow|Wife|Woman|Market-Woman|Barren|Married/;

function neutralPool(
  culturalZone: string,
  year: number,
  birthSex?: 'Male' | 'Female',
): string[] {
  let pool = NEUTRAL_EPITHETS[culturalZone] ?? DEFAULT_NEUTRAL;
  if (birthSex === 'Male') pool = pool.filter(e => !FEMALE_ONLY.test(e));
  if (birthSex === 'Female') pool = pool.filter(e => !MALE_ONLY.test(e));
  if (year >= -3000) return pool;
  // Deep prehistory: no trades, no villages to be named for, no scripture.
  return pool.filter(epithet =>
    !DEVOTIONAL.has(epithet)
    && !/-Maker|-Keeper|-Worker|-Builder|-Mender|-Digger|-Grocer|-Carrier|-Climber|Merchant|Market|Wife|Village|Hamlet|Wealthy|Widow|Married/.test(epithet));
}

/**
 * Every byname the generator knows, for detecting one on the end of a name.
 *
 * Each must begin with "the ", because detection is a suffix match and a
 * one-word byname collides with ordinary names: a bare 'Badger' in the pool
 * turned the generated name "Two Badger" into "Two the Upland".
 */
const ALL_EPITHETS = Array.from(new Set([
  ...EARNABLE_EPITHETS,
  ...Object.values(NEUTRAL_EPITHETS).flat(),
]))
  .filter(epithet => epithet.startsWith('the '))
  // Longest first, so "the Younger Brother" is not mistaken for "the Younger".
  .sort((a, b) => b.length - a.length);

/**
 * The byname on the end of this name, if there is one.
 *
 * Exported so the audit harness stops matching a trailing "the <Word>" by
 * regex: that read "the Marsh" out of the generated name "Mussel of the Marsh"
 * and reported it as an unearned physical byname.
 */
export function trailingEpithet(name: string): string | undefined {
  return ALL_EPITHETS.find(epithet => name.endsWith(` ${epithet}`));
}

/** Whether a byname is a claim about the body or the life that must be earned. */
export function epithetRequiresEvidence(epithet: string): boolean {
  return EARNABLE_EPITHETS.includes(epithet);
}

export interface EpithetEvidence {
  attributeIds?: string[];
  age?: number;
  heightCm?: number;
  birthSex?: 'Male' | 'Female';
  hairColor?: string;
  /** Which byname register to fall back on. Defaults to the European one. */
  culturalZone?: string;
  year?: number;
}

/** Every byname this persona could actually have earned. */
export function earnedEpithets(evidence: EpithetEvidence): string[] {
  const ids = new Set(evidence.attributeIds ?? []);
  const earned = EARNABLE_EPITHETS.filter(epithet => {
    const required = EPITHET_EVIDENCE[epithet];
    return !!required && required.some(id => ids.has(id));
  });

  // Appearance evidence, for bynames the attribute pool does not cover.
  const [shortBelow, tallAbove] = evidence.birthSex === 'Female' ? [150, 176] : [160, 186];
  if (evidence.heightCm && evidence.heightCm > tallAbove) earned.push('the Tall');
  if (evidence.heightCm && evidence.heightCm < shortBelow) earned.push('the Short');
  if (evidence.age !== undefined && evidence.age >= 60) earned.push('the Grey');
  if (evidence.hairColor && /red|auburn|ginger/i.test(evidence.hairColor)) earned.push('the Red');

  return Array.from(new Set(earned));
}

/**
 * Replace a byname the persona has not earned. Called once the attributes and
 * appearance exist, which is after the name is first formed.
 *
 * The replacement is drawn from the neutral pool most of the time even when the
 * persona has earned something, because most bynames in most places were not
 * reports of an injury: keeping the earned one whenever it exists made every
 * scarred or limping persona in the sample carry it, which is its own
 * distortion.
 */
export function reconcileEpithet(
  name: string,
  evidence: EpithetEvidence,
  random: () => number = Math.random,
): string {
  const match = ALL_EPITHETS.find(epithet => name.endsWith(` ${epithet}`));
  if (!match) return name;

  const neutral = neutralPool(
    evidence.culturalZone ?? 'EUROPEAN', evidence.year ?? 0, evidence.birthSex);
  if (neutral.includes(match)) return name;

  const stem = name.slice(0, name.length - match.length - 1);
  const earned = earnedEpithets(evidence);
  if (earned.includes(match)) return name;
  if (earned.length > 0 && random() < 0.5) {
    return `${stem} ${earned[Math.floor(random() * earned.length)]}`;
  }
  return `${stem} ${neutral[Math.floor(random() * neutral.length)]}`;
}

// ---------------------------------------------------------------------------
// Who names how, and when
// ---------------------------------------------------------------------------

const has = (place: string, pattern: RegExp) => pattern.test(place);

/**
 * The mix of conventions plausible for a culture and period.
 *
 * Weighted rather than absolute, because naming was never uniform even within
 * one place: a twelfth-century English villager might be known by trade, by
 * father, or by nothing but a given name, and the same man by different ones in
 * different records.
 */
/**
 * "X son of Y" and "X child of Y" are how records *describe* a person before
 * civil registration — they are not names anyone was entered under afterwards.
 * Once a state is writing surnames into a register, that descriptive form is
 * gone, so its weight belongs with the inherited surname it turned into. Left
 * unguarded it produced "Rachel daughter of Edmund" in New Zealand in 2010.
 *
 * Traditions that genuinely kept a live patronymic past 1900 — Icelandic, and
 * the Arabic ibn/bint — use their own formatter and are untouched by this.
 */
const CIVIL_REGISTRATION = 1900;

function settleDescriptiveForms(profile: ConventionProfile, year: number): ConventionProfile {
  if (year < CIVIL_REGISTRATION) return profile;
  const descriptive = profile.patronymic === PLAIN_PATRONYMIC;
  const teknonymic = profile.teknonym === PLAIN_TEKNONYM;
  if (!descriptive && !teknonymic && !profile.weights.epithet) return profile;

  const weights = { ...profile.weights };
  let folded = 0;
  if (descriptive && weights.patronymic) { folded += weights.patronymic; delete weights.patronymic; }
  if (teknonymic && weights.teknonym) { folded += weights.teknonym; delete weights.teknonym; }
  // A byname is descriptive in exactly the same way, and was left behind when
  // the patronymic was folded: the zone defaults carry an epithet weight with
  // no date on it at all, so a fifth of personas in 1993 Xinjiang were called
  // "Alisher the Frugal" — a saga byname on a man with an identity card.
  if (weights.epithet) { folded += weights.epithet; delete weights.epithet; }
  if (folded === 0) return profile;
  weights.inherited = (weights.inherited ?? 0) + folded;
  return { ...profile, weights };
}

export function conventionProfileFor(
  culturalZone: string,
  region: string,
  year: number,
  nameKey?: string
): ConventionProfile {
  return settleDescriptiveForms(resolveConventionProfile(culturalZone, region, year, nameKey), year);
}

function resolveConventionProfile(
  culturalZone: string,
  region: string,
  year: number,
  nameKey?: string
): ConventionProfile {
  const place = (region || '').toLowerCase();

  // The naming tradition is a better signal than the map region: "Atlantic
  // Islands" covers Iceland, the Faroes, the Azores and the Canaries, which do
  // not name people the same way at all.
  if (nameKey === 'ICELANDIC') {
    // Iceland never adopted hereditary surnames and still has not.
    return { weights: { patronymic: 1 }, patronymic: ICELANDIC_PATRONYMIC };
  }
  if (nameKey === 'SCANDINAVIAN' && year < 1900) {
    return { weights: { patronymic: 0.78, epithet: 0.14, personal: 0.08 }, patronymic: NORSE_PATRONYMIC };
  }

  // Before settled agriculture, a name is a name. No inheritance, no estates to
  // be "of", no trades to be named for.
  if (year < -3000) {
    return { weights: { personal: 0.78, epithet: 0.22 } };
  }

  switch (culturalZone) {
    case 'EAST_ASIAN': {
      // Chinese hereditary surnames are genuinely ancient — attested in the
      // Shang and Zhou — and are the great exception to the rule that inherited
      // family names are recent.
      if (has(place, /china|yellow river|yangtze|shandong|hebei|beijing|loess|pearl river|fujian|sichuan|guangxi/) && year >= -1500) {
        return { weights: { inherited: 0.88, personal: 0.12 } };
      }
      if (has(place, /japan/) && year >= 600) {
        return { weights: { inherited: 0.7, personal: 0.2, occupational: 0.1 } };
      }
      if (has(place, /korea/) && year >= 900) {
        return { weights: { inherited: 0.85, personal: 0.15 } };
      }
      if (has(place, /mongol|steppe|altai|manchuria/)) {
        return { weights: { clan: 0.55, personal: 0.3, epithet: 0.15 } };
      }
      return { weights: { personal: 0.5, clan: 0.3, epithet: 0.2 } };
    }

    case 'EUROPEAN': {
      if (has(place, /iceland/) && year >= 874) {
        // Iceland never adopted hereditary surnames and still has not.
        return { weights: { patronymic: 1 }, patronymic: ICELANDIC_PATRONYMIC };
      }
      if (has(place, /italy|roman|latium|campania/) && year >= -500 && year < 500) {
        return { weights: { inherited: 0.8, personal: 0.2 } };
      }
      if (has(place, /wales|welsh|cambria/) && year < 1600) {
        return { weights: { patronymic: 0.75, personal: 0.15, epithet: 0.1 }, patronymic: WELSH_PATRONYMIC };
      }
      if (has(place, /scotland|highland|hebrides|ireland|irish/) && year < 1500) {
        return { weights: { patronymic: 0.6, clan: 0.2, personal: 0.1, epithet: 0.1 }, patronymic: GAELIC_PATRONYMIC };
      }
      if (has(place, /scandinav|norway|sweden|denmark|jutland|baltic/) && year < 1900) {
        return { weights: { patronymic: 0.72, epithet: 0.18, personal: 0.1 }, patronymic: NORSE_PATRONYMIC };
      }
      if (has(place, /russia|slav|ukrain|poland|novgorod|muscov/) && year >= 900) {
        return {
          weights: year >= 1600
            ? { inherited: 0.6, patronymic: 0.4 }
            : { patronymic: 0.7, personal: 0.2, epithet: 0.1 },
          patronymic: SLAVIC_PATRONYMIC,
        };
      }
      if (year < -800) return { weights: { personal: 0.6, epithet: 0.4 } };
      if (year < 500) {
        return { weights: { personal: 0.35, patronymic: 0.35, epithet: 0.3 }, patronymic: PLAIN_PATRONYMIC };
      }
      if (year < 1100) {
        // Pre-surname Europe: known by father, by trade, or by nothing more.
        return {
          weights: { patronymic: 0.38, epithet: 0.28, occupational: 0.16, personal: 0.18 },
          patronymic: PLAIN_PATRONYMIC,
        };
      }
      if (year < 1500) {
        // The transition. Bynames harden into heritable surnames unevenly, and
        // the toponymic form belongs mostly to those with land to be named for.
        return {
          weights: { inherited: 0.36, patronymic: 0.24, occupational: 0.2, toponymic: 0.12, epithet: 0.08 },
          patronymic: PLAIN_PATRONYMIC,
        };
      }
      return { weights: { inherited: 0.9, toponymic: 0.06, patronymic: 0.04 }, patronymic: PLAIN_PATRONYMIC };
    }

    case 'MENA': {
      if (has(place, /israel|judea|galilee|samaria/) && year >= -1000 && year < 700) {
        return { weights: { patronymic: 0.7, personal: 0.3 }, patronymic: HEBREW_PATRONYMIC };
      }
      if (year < -1000) return { weights: { personal: 0.6, epithet: 0.4 } };
      if (year < 600) {
        return { weights: { patronymic: 0.45, personal: 0.35, epithet: 0.2 }, patronymic: PLAIN_PATRONYMIC };
      }
      if (year < 1900) {
        // The Arabic name is built from descent and parenthood, with an
        // optional nisba of origin — not from a family name.
        return {
          weights: { patronymic: 0.44, teknonym: 0.24, toponymic: 0.2, personal: 0.12 },
          patronymic: ARABIC_PATRONYMIC,
          teknonym: ARABIC_TEKNONYM,
        };
      }
      return {
        weights: { inherited: 0.55, patronymic: 0.35, teknonym: 0.1 },
        patronymic: ARABIC_PATRONYMIC,
        teknonym: ARABIC_TEKNONYM,
      };
    }

    case 'SOUTH_ASIAN': {
      if (year < -1000) return { weights: { personal: 0.7, epithet: 0.3 } };
      if (year >= 1800) return { weights: { inherited: 0.7, personal: 0.15, patronymic: 0.15 }, patronymic: PLAIN_PATRONYMIC };
      // Southern India in particular placed people by father and village rather
      // than by a heritable family name well into the modern period.
      return {
        weights: { personal: 0.32, patronymic: 0.3, clan: 0.28, toponymic: 0.1 },
        patronymic: PLAIN_PATRONYMIC,
      };
    }

    /**
     * Southeast Asia had no case at all and fell to the `default` below, which
     * is one profile for all of history and hands out a single name half the
     * time. That is wrong in both directions at once: Vietnam has had Chinese-
     * style hereditary surnames for two thousand years, and Burma has never had
     * surnames at all and still does not.
     *
     * So this branches on the naming tradition rather than the year, the way
     * the East Asian case branches on place. The dates are the specific ones
     * that changed the practice: Siam's Surname Act of 1913, and the Clavería
     * decree of 1849 that assigned Spanish surnames across the Philippines from
     * a printed catalogue.
     */
    case 'SOUTHEAST_ASIAN': {
      if (nameKey === 'VIETNAMESE') {
        return { weights: { inherited: 0.92, personal: 0.08 } };
      }
      if (nameKey === 'BURMESE') {
        // No surnames, then or now. U, Daw and Maung are honorifics, not
        // family names, and a Burmese person's name does not descend.
        if (year >= 1900) return { weights: { personal: 0.86, teknonym: 0.14 }, teknonym: PLAIN_TEKNONYM };
        return { weights: { personal: 0.78, teknonym: 0.12, epithet: 0.1 }, teknonym: PLAIN_TEKNONYM };
      }
      if (nameKey === 'FILIPINO') {
        if (year >= 1849) return { weights: { inherited: 0.95, personal: 0.05 } };
        return { weights: { personal: 0.5, patronymic: 0.3, epithet: 0.2 }, patronymic: PLAIN_PATRONYMIC };
      }
      if (nameKey === 'THAI' || nameKey === 'LAO') {
        if (year >= 1913) return { weights: { inherited: 0.93, personal: 0.07 } };
        return { weights: { personal: 0.62, patronymic: 0.2, epithet: 0.18 }, patronymic: PLAIN_PATRONYMIC };
      }
      if (nameKey === 'KHMER') {
        // French registration fixed the father's given name as a family name;
        // before that a single name was ordinary.
        if (year >= 1900) return { weights: { inherited: 0.8, personal: 0.2 } };
        return { weights: { personal: 0.6, patronymic: 0.25, epithet: 0.15 }, patronymic: PLAIN_PATRONYMIC };
      }
      if (nameKey === 'MALAY' || nameKey === 'MALAY_ISLAMIC_HISTORICAL') {
        return { weights: { patronymic: 0.72, personal: 0.2, teknonym: 0.08 }, patronymic: MALAY_PATRONYMIC, teknonym: PLAIN_TEKNONYM };
      }
      if (nameKey === 'JAVANESE' || nameKey === 'INDONESIAN') {
        // Indonesia never imposed a surname system, and mononymy stayed
        // respectable at every level of society — Sukarno and Suharto both.
        if (year >= 1900) return { weights: { personal: 0.45, inherited: 0.35, patronymic: 0.2 }, patronymic: MALAY_PATRONYMIC };
        return { weights: { personal: 0.62, patronymic: 0.24, teknonym: 0.14 }, patronymic: MALAY_PATRONYMIC, teknonym: PLAIN_TEKNONYM };
      }
      // Everything else in the zone — Cham, the highland peoples, the Chinese
      // diaspora sets — under a state that registers births.
      if (year >= CIVIL_REGISTRATION) return { weights: { inherited: 0.7, personal: 0.3 } };
      if (year < -1000) return { weights: { personal: 0.72, epithet: 0.28 } };
      return { weights: { personal: 0.55, patronymic: 0.27, epithet: 0.18 }, patronymic: PLAIN_PATRONYMIC };
    }

    case 'SUB_SAHARAN_AFRICAN': {
      if (year >= 1900) return { weights: { inherited: 0.5, personal: 0.25, patronymic: 0.25 }, patronymic: PLAIN_PATRONYMIC };
      return {
        weights: { personal: 0.34, patronymic: 0.26, clan: 0.24, teknonym: 0.16 },
        patronymic: PLAIN_PATRONYMIC,
        teknonym: PLAIN_TEKNONYM,
      };
    }

    case 'OCEANIA': {
      // Mission registration and colonial administration brought hereditary
      // surnames to most of Polynesia through the nineteenth century, often by
      // fixing a father's given name as a family name. Before that a single
      // name was the norm and should stay so.
      // Once a state is registering births, almost everyone has a surname on
      // paper whatever they are called at home. A quarter of modern New
      // Zealanders going by a single name was well wide of the mark.
      if (year >= 1900) {
        return { weights: { inherited: 0.87, personal: 0.08, epithet: 0.05 } };
      }
      if (year >= 1850) {
        return {
          weights: { inherited: 0.55, personal: 0.25, patronymic: 0.12, epithet: 0.08 },
          patronymic: PLAIN_PATRONYMIC,
        };
      }
      if (year >= 1780) {
        return {
          weights: { personal: 0.45, inherited: 0.25, teknonym: 0.14, epithet: 0.1, clan: 0.06 },
          teknonym: PLAIN_TEKNONYM,
        };
      }
      return {
        weights: { personal: 0.58, teknonym: 0.18, epithet: 0.16, clan: 0.08 },
        teknonym: PLAIN_TEKNONYM,
      };
    }

    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      return { weights: { personal: 0.5, epithet: 0.3, clan: 0.2 } };

    case 'NORTH_AMERICAN_COLONIAL':
      // Once a state registers births almost everyone has a surname on paper,
      // whatever they are called at home — the same correction Oceania needed.
      // One in eight Californians going by a single name in 1925 was wrong.
      if (year >= CIVIL_REGISTRATION) return { weights: { inherited: 0.98, personal: 0.02 } };
      return { weights: { inherited: 0.88, personal: 0.12 } };

    case 'SOUTH_AMERICAN': {
      if (year >= 1550) return { weights: { inherited: 0.85, personal: 0.15 } };
      return { weights: { personal: 0.5, clan: 0.28, epithet: 0.22 } };
    }

    default:
      return { weights: { personal: 0.5, patronymic: 0.3, epithet: 0.2 }, patronymic: PLAIN_PATRONYMIC };
  }
}

/**
 * Multiply the named conventions' weights, leaving the rest alone.
 *
 * Multiplicative rather than additive so a culture that genuinely never formed
 * patronymics does not acquire one because its nobility is biased toward them: a
 * weight of zero stays zero however hard it is pushed.
 */
function applyBias(weights: Weights, bias: Partial<Record<string, number>>): Weights {
  const out: Weights = { ...weights };
  for (const [convention, factor] of Object.entries(bias)) {
    const key = convention as NameConvention;
    if (out[key] === undefined || factor === undefined) continue;
    out[key] = out[key]! * factor;
  }
  return out;
}

function pickConvention(weights: Weights, random: () => number): NameConvention {
  const entries = Object.entries(weights) as Array<[NameConvention, number]>;
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [convention, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return convention;
  }
  return entries[entries.length - 1]?.[0] ?? 'personal';
}

export interface FormatNameInput {
  given: string;
  gender: 'Male' | 'Female';
  culturalZone: string;
  region: string;
  year: number;
  /** The name set's own surname list, used for inherited, clan and toponymic. */
  surnames: string[];
  malePool: string[];
  femalePool: string[];
  occupation?: string;
  /** The naming tradition in use, which sometimes outranks the map region. */
  nameKey?: string;
  /**
   * The privileged order this person belongs to, as the `id` of an entry in
   * `eliteStrata.ts`. Undefined for the great majority.
   *
   * Standing rather than money, and standing rather than rarity: see the header
   * of `eliteNaming.ts`. Several of these orders were five to ten per cent of
   * their societies, so this is not a decoration for the rarest tail.
   */
  standingId?: string;
  random: () => number;
}

/** Build a full name in whatever way this culture and period actually built one. */
export function formatPersonalName(input: FormatNameInput): FormattedName {
  const { given, gender, culturalZone, region, year, surnames, malePool, femalePool, occupation, nameKey, standingId, random } = input;
  const base = conventionProfileFor(culturalZone, region, year, nameKey);
  const elite = eliteNameStyleFor(standingId);

  // The estate's own naming raises the odds of the forms it actually used before
  // a convention is drawn, rather than dressing up whatever came out. In several
  // of these societies a heritable surname was the estate's privilege and the
  // people around them had none, so biasing after the fact would leave most
  // nobles with nothing for a particle to attach to.
  const profile: ConventionProfile = elite?.conventionBias
    ? { ...base, weights: applyBias(base.weights, elite.conventionBias) }
    : base;

  const usableSurnames = (surnames || []).filter(s => s && s !== '(No Surname)');
  // One authored pool holds several kinds of name. Split it by shape so a clan
  // name is not "of Pasargadae" and a place of origin is not a lineage.
  const toponymicLike = usableSurnames.filter(s => /^(?:of|de|von|van|da|di|al-|el-)\b/i.test(s));
  const lineageLike = usableSurnames.filter(s => !/^(?:of|de|von|van|da|di)\b/i.test(s) || /clan/i.test(s));
  const pick = <T,>(list: T[]): T | undefined =>
    list.length > 0 ? list[Math.floor(random() * list.length)] : undefined;

  let convention = pickConvention(profile.weights, random);

  // A convention that needs material the name set does not carry falls back to
  // the bare given name rather than inventing something.
  const needsSurnamePool = convention === 'inherited' || convention === 'clan' || convention === 'toponymic';
  if (needsSurnamePool && usableSurnames.length === 0) convention = 'personal';
  if (convention === 'patronymic' && !profile.patronymic) convention = 'personal';
  if (convention === 'teknonym' && !profile.teknonym) convention = 'personal';

  // Built first, then decorated. The estate's markers are applied to a finished
  // name of the local kind rather than replacing it, because that is what they
  // are: a hidalgo's name is a Castilian name with additions, not a different
  // sort of name.
  const built: FormattedName = (() => {
  switch (convention) {
    case 'patronymic': {
      // The father's given name, drawn from the same pool so it belongs to the
      // same world. Returned so the family can be generated to match.
      const parent = pick(malePool) || given;
      return {
        full: `${given} ${profile.patronymic!(parent, gender)}`,
        given,
        convention,
        patronymicFrom: parent,
      };
    }
    case 'teknonym': {
      const child = pick(gender === 'Male' ? malePool : femalePool) || pick(malePool) || given;
      const formed = profile.teknonym!(child, gender);
      // The Arabic kunya precedes the name; the plain English gloss follows it.
      const leads = /^(Abu|Umm)\b/.test(formed);
      return { full: leads ? `${formed} (${given})` : `${given}, ${formed}`, given, convention };
    }
    case 'epithet': {
      // Mostly from the neutral register of this culture, because most bynames
      // were not reports of an injury. The quarter drawn from the evidence-
      // bearing pool is checked against the persona's actual body and history
      // by `reconcileEpithet` once those exist, and replaced if unwarranted.
      const neutral = neutralPool(culturalZone, year, gender);
      const pool = random() < 0.75 ? neutral : EARNABLE_EPITHETS;
      return { full: `${given} ${pick(pool) ?? pick(neutral)}`, given, convention };
    }
    case 'occupational':
      return {
        full: occupation ? `${given} the ${occupation}` : `${given} ${pick(usableSurnames) ?? ''}`.trim(),
        given,
        convention,
      };
    case 'clan':
    case 'inherited': {
      const preferred = convention === 'clan' && lineageLike.length > 0 ? lineageLike : usableSurnames;
      const familyName = pick(preferred);
      return { full: `${given} ${familyName}`.trim(), given, convention, familyName };
    }
    case 'toponymic':
      // A place of origin is not inherited the way a family name is; a son who
      // moves is "of" somewhere else.
      return {
        full: `${given} ${pick(toponymicLike.length > 0 ? toponymicLike : usableSurnames)}`.trim(),
        given,
        convention,
      };
    case 'personal':
    default:
      return { full: given, given, convention };
  }
  })();

  if (!elite) return built;
  return applyEliteStyle(built, elite, {
    given, gender, random,
    surnames: usableSurnames,
    seats: toponymicLike.length > 0 ? toponymicLike : usableSurnames,
    malePool, femalePool,
  });
}

// ---------------------------------------------------------------------------
// Elite markers
// ---------------------------------------------------------------------------

interface EliteContext {
  given: string;
  gender: 'Male' | 'Female';
  surnames: string[];
  seats: string[];
  malePool: string[];
  femalePool: string[];
  random: () => number;
}

/**
 * Lay an estate's markers over a finished name.
 *
 * Order matters and is not arbitrary. Working outward from the given name:
 * fused suffixes first (they change the word itself), then the second given
 * name, then whatever attaches to the surname, then the trailing lineage or
 * title, then the leading honorific, then the appended descent claim. Applying
 * the honorific before the surname work would produce "Don de Mendoza".
 *
 * Each device is capped independently, and then the whole is capped again: a name
 * that fired every device it was offered comes out as a parody of itself, and
 * three markers is about what a reader can take in at the length a card allows.
 */
function applyEliteStyle(
  built: FormattedName,
  style: EliteNameStyle,
  context: EliteContext
): FormattedName {
  const { given, gender, random } = context;
  const pick = <T,>(list: T[]): T | undefined =>
    list.length > 0 ? list[Math.floor(random() * list.length)] : undefined;
  const fires = (chance: number) => random() < chance;
  const gendered = (g: { male: string[]; female?: string[] }) =>
    gender === 'Female' ? (g.female && g.female.length ? g.female : []) : g.male;

  let full = built.full;
  let familyName = built.familyName;
  let applied = 0;
  /** Three markers is the cap. See above. */
  const room = () => applied < 3;
  const spend = () => { applied += 1; };

  // Where the name already ends in the father rather than in the bearer, nothing
  // may be hung off the end of it. "Karna son of Duryodhana Shastri" attaches the
  // lineage to Duryodhana, which is the opposite of the claim being made.
  const endsInAnother = built.convention === 'patronymic'
    || built.convention === 'teknonym'
    || built.convention === 'occupational';

  // --- fused to the given name ---------------------------------------------
  if (
    style.reverentialSuffix && room()
    && (!style.reverentialSuffix.only || style.reverentialSuffix.only === gender)
    && fires(style.reverentialSuffix.chance)
  ) {
    // Moteuczoma → Moteuczomatzin. Applied to the given name wherever it sits in
    // the finished string, so a name with a clan behind it keeps its order.
    const suffixed = `${given}${style.reverentialSuffix.suffix}`;
    full = full.replace(given, suffixed);
    spend();
  }

  // --- a second given name -------------------------------------------------
  if (style.middleGiven && room() && fires(style.middleGiven.chance)) {
    const pool = gender === 'Female' ? context.femalePool : context.malePool;
    const second = pick(pool.filter(n => n !== given));
    if (second) {
      const initialOnly = style.middleGiven.initialOnly !== undefined
        && random() < style.middleGiven.initialOnly;
      const middle = initialOnly ? `${second.charAt(0)}.` : second;
      // Inserted after the given name rather than appended, which is where a
      // baptismal second name and an American middle initial both sit.
      full = full.replace(given, `${given} ${middle}`);
      spend();
    }
  }

  // --- attached to the surname ---------------------------------------------
  // Both of these need a surname to work on. When the convention came out
  // `personal` there is nothing to elevate, and inventing one here would
  // contradict the convention that was just chosen.
  const hasSurname = built.convention === 'inherited'
    || built.convention === 'clan'
    || built.convention === 'toponymic'
    || built.convention === 'occupational';

  if (style.doubleSurname && hasSurname && room() && fires(style.doubleSurname.chance)) {
    const second = pick(context.seats.filter(s => !full.includes(s)));
    if (second) {
      const joiner = style.doubleSurname.connector;
      full = joiner === '-' ? `${full}-${second}` : `${full} ${joiner} ${second}`.replace(/\s+/g, ' ');
      spend();
    }
  }

  if (style.particle && hasSurname && room() && fires(style.particle.chance)) {
    const form = pick(style.particle.forms);
    // Only when the surname is not already carrying one. Several authored pools
    // include "de Vega" and "von Kleist" outright, and "de de Vega" is worse
    // than no particle at all.
    if (form && !/\b(?:of|de|de’|di|da|von|van|z|al-|el-)\s/i.test(full)) {
      const head = full.slice(0, full.lastIndexOf(' '));
      const tail = full.slice(full.lastIndexOf(' ') + 1);
      if (head && tail) {
        full = `${head} ${form} ${tail}`;
        spend();
      }
    }
  }

  // --- trailing lineage and title ------------------------------------------
  if (style.lineageSuffix && room() && !endsInAnother && fires(style.lineageSuffix.chance)) {
    const clan = pick(style.lineageSuffix.names);
    // Not if the name already carries one of this pool's own names. Several of
    // these lists overlap with the authored surname pools — the South Asian
    // surnames genuinely include Dwivedi and Bhatt — and appending a second gave
    // "Pandit Rajesh Dwivedi Iyer", a man with two lineages.
    const already = style.lineageSuffix.names.some(name => full.includes(name));
    if (clan && !already) {
      full = `${full} ${clan}`;
      familyName = familyName ?? clan;
      spend();
    }
  }

  if (style.postnominal && room()) {
    const words = gendered(style.postnominal);
    if (words.length && fires(style.postnominal.chance)) {
      const word = pick(words);
      if (word) {
        // A fused honorific like "-dono" or "-shi" joins the name; a free-standing
        // one like "Bey" or "Esq." follows it.
        full = word.startsWith('-') ? `${full}${word}` : `${full} ${word}`;
        spend();
      }
    }
  }

  if (style.generational && room() && fires(style.generational.chance)) {
    const suffix = pick(style.generational.forms);
    // Only meaningful on an inherited surname — a generational suffix says the
    // name repeated down a line, so there has to be a line.
    if (suffix && hasSurname) {
      full = `${full} ${suffix}`;
      spend();
    }
  }

  // --- leading lineage and honorific ---------------------------------------
  if (style.lineagePrefix && room() && fires(style.lineagePrefix.chance)) {
    const lineage = pick(style.lineagePrefix.names);
    if (lineage && !full.includes(lineage)) {
      full = style.lineagePrefix.connector
        ? `${full} ${style.lineagePrefix.connector} ${lineage}`
        : `${lineage} ${full}`;
      spend();
    }
  }

  if (style.honorific && room()) {
    const words = gendered(style.honorific);
    if (words.length && fires(style.honorific.chance)) {
      const word = pick(words);
      if (word) {
        full = `${word} ${full}`;
        spend();
      }
    }
  }

  // --- a second name, and a descent claim ----------------------------------
  // Both are appended clauses and both are last, because they are the parts a
  // reader can skip: the name is complete before either arrives.
  if (style.courtesyName && room() && fires(style.courtesyName.chance)) {
    const courtesy = pick(style.courtesyName.pool);
    if (courtesy) {
      full = `${full}, ${style.courtesyName.link} ${courtesy}`;
      spend();
    }
  }

  if (style.ancestorLine && room() && fires(style.ancestorLine.chance)) {
    const ancestor = pick(style.ancestorLine.pool);
    if (ancestor && !full.includes(ancestor)) {
      // An empty link means the element is a nisba and attaches directly:
      // "Muhammad ibn Ali al-Husayni", not "Muhammad ibn Ali of al-Husayni".
      full = style.ancestorLine.link
        ? `${full}, ${style.ancestorLine.link} ${ancestor}`
        : `${full} ${ancestor}`;
      spend();
    }
  }

  return { ...built, full: full.replace(/\s+/g, ' ').trim(), familyName };
}
