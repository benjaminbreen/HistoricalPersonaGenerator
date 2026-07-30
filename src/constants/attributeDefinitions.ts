/**
 * constants/attributeDefinitions.ts - All character attribute definitions
 *
 * Attributes are sampled by prevalence rather than by rarity tier. `baseWeight`
 * is roughly "people per thousand who have this", and `weight()` modulates that
 * by era, region, class, occupation, age and sex. A multiplier of 0 removes the
 * attribute from the pool entirely, which is how era- and culture-gating works.
 *
 * No definition here declares a rarity. The tier printed on the card is derived
 * from the effective weight at selection time, so an attribute is only ever as
 * rare as it actually was for that person, in that place, in that year.
 *
 * The numbers are deliberate estimates, not decoration. Where a real historical
 * rate is known (smallpox scarring in an eighteenth-century city, lactase
 * non-persistence by region, twin births), the weight reflects it. Where it is
 * not, the aim is plausible relative ordering: a persona should be far more
 * likely to have a rotten tooth than to be blind.
 */

import { AttributeBadge, AttributeContext } from '../types/attributeTypes';
import { CulturalZone } from '../types/characterData';
import { hasCapability, SocietyCapability } from './societyCapabilities';

// Extended AttributeBadge with foundational flag
interface EnhancedAttributeBadge extends AttributeBadge {
  foundational?: boolean; // Should be mentioned in biography
}

type Ctx = AttributeContext;

// ---------------------------------------------------------------------------
// Weighting helpers
// ---------------------------------------------------------------------------

const OLD_WORLD: CulturalZone[] = [
  'EUROPEAN', 'EAST_ASIAN', 'MENA', 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN',
];

const inZone = (ctx: Ctx, ...zones: CulturalZone[]): boolean =>
  !!ctx.culturalZone && zones.includes(ctx.culturalZone);

/**
 * How likely a persona is to be reckoned in the four humours.
 *
 * Greek humoral theory belongs to the Mediterranean and, through Galen and Ibn
 * Sina, to the Islamic world. It reached South Asia as Unani medicine with the
 * Delhi Sultanate, so a Tamil farmer in 500 BCE was not "burdened with black
 * bile, as the physicians say" — that phrasing needs physicians who held the
 * doctrine. Ayurveda's tridosha is a different scheme and is not this.
 */
const humoralWeight = (ctx: Ctx): number => {
  if (inZone(ctx, 'EUROPEAN', 'MENA')) return ramp(ctx.year, -400, -200, 1750, 1870);
  if (inZone(ctx, 'SOUTH_ASIAN')) return ramp(ctx.year, 1200, 1350, 1750, 1870);
  return 0;
};

/** Substring match against location + region + birthplace, all lowercased. */
/**
 * Perihelion years of Halley's comet, which is the one celestial event that
 * recurs inside human memory and was recorded by every society that kept
 * records at all. Used so that "born under the comet" is a fact about a birth
 * year rather than a sprinkle of flavour.
 */
const HALLEY_RETURNS = [
  -615, -540, -466, -391, -315, -239, -163, -86, -11,
  66, 141, 218, 295, 374, 451, 530, 607, 684, 760, 837, 912, 989,
  1066, 1145, 1222, 1301, 1378, 1456, 1531, 1607, 1682, 1758, 1835, 1910, 1986,
];

const place = (ctx: Ctx, ...needles: string[]): boolean =>
  needles.some(n => ctx.placeLower.includes(n));

/** Substring match against the profession. */
const job = (ctx: Ctx, ...needles: string[]): boolean =>
  needles.some(n => ctx.professionLower.includes(n));

const rich = (ctx: Ctx): boolean =>
  ctx.wealth === 'wealthy' || ctx.wealth === 'noble' ||
  /noble|upper/i.test(ctx.socialClass ?? '');

const poor = (ctx: Ctx): boolean =>
  ctx.wealth === 'poor' ||
  /peasant|working/i.test(ctx.socialClass ?? '');

/**
 * A trapezoidal era window: 0 outside [start, end], climbing to 1 across
 * [start, full], flat across [full, fade], falling away across [fade, end].
 * Used for anything that diffused into a society and then receded.
 */
function ramp(year: number, start: number, full: number, fade: number, end: number): number {
  if (year <= start || year >= end) return 0;
  if (year < full) return (year - start) / (full - start);
  if (year <= fade) return 1;
  return (end - year) / (end - fade);
}

/** Multiplier that grows with age past a threshold, capped. */
const withAge = (ctx: Ctx, from: number, perDecade: number, cap: number): number =>
  Math.min(cap, 1 + Math.max(0, (ctx.age - from) / 10) * perDecade);

const urbanBoost = (ctx: Ctx, factor: number): number => (ctx.urban ? factor : 1);

/** Could this society do this, here, now? See constants/societyCapabilities.ts. */
const can = (capability: SocietyCapability, ctx: Ctx): boolean =>
  hasCapability(capability, {
    year: ctx.year,
    culturalZone: ctx.culturalZone,
    placeLower: ctx.placeLower,
  });

// Regions where dietary iodine was scarce and endemic goiter was a commonplace.
const IODINE_POOR = [
  'alp', 'savoy', 'styria', 'tyrol', 'switz', 'swiss', 'pyren', 'auvergne',
  'andes', 'peru', 'bolivia', 'himalaya', 'tibet', 'nepal', 'bhutan', 'kashmir',
  'carpath', 'appalach', 'derbyshire', 'ohio', 'michigan', 'minnesota',
  'wisconsin', 'great lakes', 'yunnan', 'sichuan', 'gansu',
];

// Marshy, riverine and tropical country where malaria was endemic.
const MALARIAL = [
  'fen', 'marsh', 'swamp', 'delta', 'campagna', 'rome', 'ravenna', 'maremma',
  'pontine', 'essex', 'kent', 'lincoln', 'venice', 'bengal', 'ganges',
  'mississippi', 'louisiana', 'carolina', 'gambia', 'guinea', 'congo', 'niger',
  'amazon', 'sundarban', 'batavia', 'jakarta', 'lagos', 'sierra leone', 'malacca',
];

// Great ports and entrepôts, where languages and strangers accumulated.
const PORTS = [
  'venice', 'genoa', 'lisbon', 'seville', 'cadiz', 'amsterdam', 'antwerp',
  'london', 'bristol', 'liverpool', 'hamburg', 'marseille', 'naples', 'smyrna',
  'izmir', 'alexandria', 'istanbul', 'constantinople', 'goa', 'malacca',
  'canton', 'guangzhou', 'nagasaki', 'batavia', 'macao', 'macau', 'aden',
  'zanzibar', 'new york', 'boston', 'charleston', 'havana', 'salvador',
];

// ---------------------------------------------------------------------------
// Universal attributes - available in principle to any persona, though most
// still shift substantially with context.
// ---------------------------------------------------------------------------

export const UNIVERSAL_ATTRIBUTES: EnhancedAttributeBadge[] = [
  // =========================================================================
  // SIGHT
  // =========================================================================
  {
    id: 'blind',
    name: 'Blind',
    icon: 'FaEyeSlash',
    category: 'physical',
    // Modern blindness figures are the wrong anchor. Before cataract surgery
    // and against endemic trachoma and smallpox, five to fifteen people per
    // thousand were blind across most of the world, and far more than that
    // among the old.
    baseWeight: 3,
    weight: (ctx) => withAge(ctx, 45, 0.9, 5)
      * (inZone(ctx, 'MENA', 'SOUTH_ASIAN') && ctx.year < 1950 ? 2.2 : 1)
      * (ctx.year < 1900 ? 1.6 : 1),
    exclusiveGroup: 'sight',
    excludes: ['keen_eyed', 'nearsighted', 'color_blind', 'night_blind', 'calligrapher', 'water_diviner'],
    description: 'Cannot see; navigates the world through touch, sound, and memory',
    phrase: 'completely blind',
    foundational: true,
    dialogueHint: 'Uses touch and hearing to navigate',
  },
  {
    id: 'nearsighted',
    name: 'Nearsighted',
    icon: 'FaGlasses',
    category: 'physical',
    baseWeight: 35,
    weight: (ctx) => (job(ctx, 'scholar', 'scribe', 'clerk', 'monk', 'notary', 'printer') ? 2 : 1),
    exclusiveGroup: 'sight',
    description: 'Poor distance vision; squints to see things far away',
    phrase: 'nearsighted',
    dialogueHint: 'Squints at distant objects',
  },
  {
    id: 'keen_eyed',
    name: 'Keen-Eyed',
    icon: 'IoEye',
    category: 'mental',
    baseWeight: 25,
    weight: (ctx, char) => ((char as any).stats?.perception >= 8 ? 2.5 : 0.7)
      * (job(ctx, 'hunt', 'archer', 'scout', 'sailor', 'watch') ? 2 : 1),
    exclusiveGroup: 'sight',
    description: 'Notices details others miss; exceptional observational skills',
    phrase: 'keen-eyed',
    dialogueHint: 'Notices small details',
  },
  {
    id: 'color_blind',
    name: 'Color-Blind',
    icon: 'IoEyeOff',
    category: 'physical',
    baseWeight: 45,
    // Around one man in twelve, one woman in two hundred.
    weight: (ctx) => (ctx.sex === 'Male' ? 1 : 0.06),
    exclusiveGroup: 'sight',
    description: 'Cannot tell certain colors apart; reds and greens run together',
    phrase: 'unable to tell red from green',
    dialogueHint: 'Confuses colors others find obvious',
  },
  {
    id: 'night_blind',
    name: 'Night-Blind',
    icon: 'IoMoonSharp',
    category: 'condition',
    baseWeight: 12,
    // Vitamin A deficiency: a hungry-season affliction of the rural poor.
    weight: (ctx) => (ctx.year < 1920 ? 1 : 0.1) * (poor(ctx) ? 2.5 : 0.6)
      * (ctx.urban ? 0.7 : 1.3),
    exclusiveGroup: 'sight',
    description: 'Goes helpless at dusk; can see nothing at all by candlelight',
    phrase: 'helpless in the dark',
    dialogueHint: 'Avoids travelling after sunset',
  },
  {
    id: 'clouded_eyes',
    name: 'Clouded Eyes',
    icon: 'IoEye',
    category: 'condition',
    // The commonest cause of blindness in old age anywhere, and the one the
    // period could do something about: a couching needle displaced the lens
    // and traded a white blur for a dim, unfocused light. Sunlit latitudes had
    // more of it, and had it earlier.
    baseWeight: 6,
    minAge: 45,
    weight: (ctx) => withAge(ctx, 50, 1.2, 9)
      * (inZone(ctx, 'MENA', 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN') ? 1.5 : 1)
      * (ctx.year < 1900 ? 1 : 0.35),
    exclusiveGroup: 'sight',
    excludes: ['keen_eyed', 'calligrapher', 'water_diviner'],
    description: 'A white film thickening across the eye; shapes remain, faces do not',
    phrase: 'going blind behind a white film',
    foundational: true,
    dialogueHint: 'Leans close and asks who is speaking',
  },
  {
    id: 'wall_eyed',
    name: 'Wall-Eyed',
    icon: 'IoEyeOff',
    category: 'physical',
    // Two or three people in a hundred, and among the most reliably recorded
    // facts about a face: a squint is what a description mentions first.
    baseWeight: 25,
    excludes: ['blind', 'beautiful', 'clouded_eyes'],
    description: 'One eye turns outward; strangers are never sure which eye to meet',
    phrase: 'wall-eyed, one eye turning outward',
    dialogueHint: 'Is used to people looking past them',
  },

  // =========================================================================
  // HEARING
  // =========================================================================
  {
    id: 'deaf',
    name: 'Deaf',
    icon: 'FaDeaf',
    category: 'physical',
    baseWeight: 2.5,
    weight: (ctx) => (ctx.year < 1900 ? 1.5 : 1),
    exclusiveGroup: 'hearing',
    excludes: ['singer', 'musician', 'polyglot'],
    description: 'Cannot hear; communicates through gestures and reading lips when possible',
    phrase: 'deaf',
    foundational: true,
    dialogueHint: 'Communicates through gestures',
  },
  {
    id: 'hard_of_hearing',
    name: 'Hard of Hearing',
    icon: 'IoEar',
    category: 'condition',
    baseWeight: 20,
    // Occupational deafness was the standing hazard of the forge and the mill.
    weight: (ctx) => withAge(ctx, 45, 1.1, 6)
      * (job(ctx, 'smith', 'miller', 'gunner', 'artiller', 'boiler', 'foundry', 'weaver') ? 4 : 1),
    exclusiveGroup: 'hearing',
    description: 'Must be spoken to loudly; leans in and turns one ear forward',
    phrase: 'hard of hearing',
    dialogueHint: 'Asks people to repeat themselves',
  },
  {
    id: 'ringing_ears',
    name: 'Ringing Ears',
    icon: 'IoWarning',
    category: 'condition',
    baseWeight: 12,
    weight: (ctx) => (job(ctx, 'smith', 'gunner', 'artiller', 'miller', 'soldier', 'mine') ? 5 : 1)
      * withAge(ctx, 40, 0.5, 3),
    exclusiveGroup: 'hearing',
    description: 'A high ringing that never stops; worst in the silence of night',
    phrase: 'plagued by a ringing in the ears',
    dialogueHint: 'Mentions a sound no one else hears',
  },

  // =========================================================================
  // SPEECH
  // =========================================================================
  {
    id: 'mute',
    name: 'Mute',
    icon: 'GiMute',
    category: 'physical',
    // Congenital mutism was genuinely rare. The old pool made it ~2% of all
    // personas; this puts it near its real incidence.
    baseWeight: 0.6,
    exclusiveGroup: 'speech',
    excludes: ['singer', 'storyteller', 'polyglot', 'garrulous', 'gossip'],
    description: 'Cannot speak; expresses themselves through gestures and written word',
    phrase: 'unable to speak',
    foundational: true,
    dialogueHint: 'Cannot speak, uses gestures',
  },
  {
    id: 'stammer',
    name: 'Stammer',
    icon: 'GiTalk',
    category: 'physical',
    baseWeight: 30,
    weight: (ctx) => (ctx.sex === 'Male' ? 1.4 : 0.7),
    exclusiveGroup: 'speech',
    excludes: ['garrulous', 'storyteller'],
    description: 'Speech catches and repeats, worst when hurried or watched',
    phrase: 'burdened with a stammer',
    dialogueHint: 'Halts and repeats on hard consonants',
  },
  {
    id: 'hoarse_voiced',
    name: 'Hoarse-Voiced',
    icon: 'GiTalk',
    category: 'physical',
    baseWeight: 14,
    weight: (ctx) => (job(ctx, 'crier', 'hawker', 'preacher', 'sergeant', 'auction') ? 4 : 1),
    exclusiveGroup: 'speech',
    excludes: ['singer'],
    description: 'A voice worn to gravel; carries far but never softens',
    phrase: 'hoarse-voiced',
    dialogueHint: 'Speaks in a rasp',
  },

  // =========================================================================
  // MOBILITY AND LIMBS
  // =========================================================================
  {
    id: 'lame',
    name: 'Lame',
    icon: 'GiWalkingBoot',
    category: 'physical',
    baseWeight: 18,
    weight: (ctx) => withAge(ctx, 35, 0.4, 3)
      * (ctx.year < 1900 ? 1.4 : 1)
      * (job(ctx, 'soldier', 'sailor', 'mine', 'quarry', 'mason') ? 1.8 : 1),
    exclusiveGroup: 'mobility',
    excludes: ['athletic', 'rides_well'],
    description: 'Walks with a pronounced limp from an old injury or congenital condition',
    phrase: 'walking with a limp',
    foundational: true,
    dialogueHint: 'Walks with difficulty',
  },
  {
    id: 'clubfoot',
    name: 'Clubfoot',
    icon: 'GiWalkingBoot',
    category: 'physical',
    baseWeight: 2,
    exclusiveGroup: 'mobility',
    excludes: ['athletic'],
    description: 'Born with a twisted foot; has never known any other gait',
    phrase: 'born with a twisted foot',
    foundational: true,
    dialogueHint: 'Has limped since birth',
  },
  {
    id: 'bowed_legs',
    name: 'Bowed Legs',
    icon: 'GiBrokenBone',
    category: 'condition',
    baseWeight: 4,
    // Rickets: the signature deformity of the sunless industrial slum.
    weight: (ctx) => ramp(ctx.year, 1750, 1820, 1900, 1950)
      * (ctx.urban ? 12 : 2) * (poor(ctx) ? 2.5 : 0.4),
    exclusiveGroup: 'mobility',
    description: 'Legs bowed by the rickets of a sunless childhood',
    phrase: 'bow-legged from a childhood of rickets',
    dialogueHint: 'Speaks of a hungry childhood',
  },
  {
    id: 'one_armed',
    name: 'One-Armed',
    icon: 'GiHandBandage',
    category: 'physical',
    baseWeight: 1.6,
    weight: (ctx) => (job(ctx, 'soldier', 'sailor', 'gunner') ? 6 : 1)
      * (job(ctx, 'mill', 'factory', 'mine', 'saw') && ctx.year > 1780 ? 4 : 1),
    excludes: ['athletic', 'skilled_hands', 'ambidextrous'],
    description: 'Lost an arm to injury or disease; has adapted to life with one hand',
    phrase: 'one-armed',
    foundational: true,
    dialogueHint: 'Missing an arm',
  },
  {
    id: 'hunchback',
    name: 'Crooked Back',
    icon: 'GiBrokenBone',
    category: 'physical',
    // Spinal tuberculosis, rickets and fractures that healed as they liked
    // between them made a visibly crooked spine an ordinary sight, not a
    // singular one. Rickets in particular was a disease of sunless courts and
    // early factory towns.
    baseWeight: 7,
    weight: (ctx) => (ctx.year < 1900 ? 1.5 : 1)
      * (poor(ctx) ? 1.6 : 0.8)
      * (ctx.urban && ctx.year > 1600 ? 1.5 : 1),
    excludes: ['athletic', 'towering'],
    description: 'A spine curved since childhood; carries one shoulder far above the other',
    phrase: 'crooked of back',
    foundational: true,
    dialogueHint: 'Stands twisted to one side',
  },
  {
    id: 'left_handed',
    name: 'Left-Handed',
    icon: 'IoHandLeft',
    category: 'physical',
    baseWeight: 100,
    // Roughly a tenth of people, but suppressed wherever schooling or scribal
    // training could force the change, so fewer are openly left-handed.
    weight: (ctx) => (ctx.year > 1500 && ctx.urban ? 0.45 : 0.85),
    exclusiveGroup: 'handedness',
    description: 'Favors the left hand, in defiance of teachers who tried to correct it',
    phrase: 'left-handed',
    dialogueHint: 'Reaches with the wrong hand and thinks nothing of it',
  },
  {
    id: 'ambidextrous',
    name: 'Ambidextrous',
    icon: 'IoHandLeft',
    category: 'skill',
    baseWeight: 10,
    exclusiveGroup: 'handedness',
    description: 'Works equally well with either hand',
    phrase: 'equally handy with either hand',
    dialogueHint: 'Switches hands without noticing',
  },

  // =========================================================================
  // STATURE AND BUILD
  // =========================================================================
  {
    id: 'towering',
    name: 'Towering',
    icon: 'IoStar',
    category: 'physical',
    baseWeight: 22,
    weight: (ctx) => (rich(ctx) ? 1.6 : poor(ctx) ? 0.6 : 1),
    exclusiveGroup: 'stature',
    description: 'Exceptionally tall; stands head and shoulders above most people',
    phrase: 'unusually tall',
    dialogueHint: 'Towers over others',
  },
  {
    id: 'diminutive',
    name: 'Diminutive',
    icon: 'GiSnail',
    category: 'physical',
    baseWeight: 30,
    weight: (ctx) => (poor(ctx) ? 1.8 : 0.8),
    exclusiveGroup: 'stature',
    description: 'Unusually short in stature; often underestimated',
    phrase: 'remarkably small',
    dialogueHint: 'Surprisingly small',
  },
  {
    id: 'little_stature',
    name: 'Of Little Stature',
    icon: 'GiSnail',
    category: 'physical',
    // Achondroplasia, about one birth in twenty-five thousand, and distinct
    // from simply being short: a different frame, and in much of the world a
    // named place in a household or a court that a short person did not get.
    baseWeight: 0.04,
    weight: (ctx) => (rich(ctx) || job(ctx, 'court', 'jester', 'fool', 'entertain') ? 4 : 1),
    exclusiveGroup: 'stature',
    excludes: ['athletic', 'towering', 'strong'],
    description: 'Short-limbed since birth; the world is built a size too large',
    phrase: 'short-limbed since birth',
    foundational: true,
    dialogueHint: 'Has spent a life being looked down at',
  },
  {
    id: 'giant_boned',
    name: 'Giant-Boned',
    icon: 'GiGiant',
    category: 'condition',
    // Pituitary gigantism, rarer than one birth in ten thousand, and never
    // only a matter of height: the jaw, hands and feet keep growing, the
    // headaches come, and the life is short.
    baseWeight: 0.06,
    minAge: 18,
    exclusiveGroup: 'stature',
    excludes: ['diminutive', 'little_stature', 'beautiful'],
    description: 'Grown past all proportion; hands, jaw and brow still thickening, and the head aches',
    phrase: 'grown past all ordinary proportion',
    foundational: true,
    dialogueHint: 'Stoops through doorways and is stared at everywhere',
  },
  {
    id: 'corpulent',
    name: 'Corpulent',
    icon: 'GiWeight',
    category: 'physical',
    baseWeight: 12,
    // Before industrial food surpluses, bulk was a badge of the well-fed.
    weight: (ctx) => (rich(ctx) ? 5 : poor(ctx) ? 0.1 : 1)
      * (ctx.year > 1900 ? 3 : 1) * withAge(ctx, 30, 0.3, 2.5),
    exclusiveGroup: 'build',
    excludes: ['gaunt', 'athletic'],
    description: 'Heavy of body in an age when only the well-fed grew so',
    phrase: 'heavy of body',
    dialogueHint: 'Moves slowly and breathes hard',
  },
  {
    id: 'gaunt',
    name: 'Gaunt',
    icon: 'FaFeather',
    category: 'physical',
    baseWeight: 35,
    weight: (ctx) => (poor(ctx) ? 2.2 : rich(ctx) ? 0.3 : 1) * (ctx.year < 1900 ? 1.4 : 1),
    exclusiveGroup: 'build',
    description: 'Thin to the bone; every hard year shows in the face',
    phrase: 'gaunt',
    dialogueHint: 'Hollow-cheeked and spare',
  },
  {
    id: 'strong',
    name: 'Strong',
    icon: 'FaDumbbell',
    category: 'physical',
    baseWeight: 45,
    weight: (ctx, char) => ((char as any).stats?.strength >= 8 ? 3 : 0.5)
      * (job(ctx, 'smith', 'farm', 'labor', 'porter', 'mason', 'wood', 'quarry', 'dock') ? 2 : 1),
    excludes: ['frail', 'gaunt'],
    description: 'Possesses exceptional physical strength; muscles hardened by labor',
    phrase: 'exceptionally strong',
    dialogueHint: 'Mentions physical prowess',
  },
  {
    id: 'frail',
    name: 'Frail',
    icon: 'FaFeather',
    category: 'physical',
    baseWeight: 30,
    weight: (ctx, char) => ((char as any).health < 40 ? 3 : 0.6) * withAge(ctx, 55, 0.6, 3),
    excludes: ['strong', 'athletic'],
    description: 'Weak constitution and delicate health; tires easily',
    phrase: 'physically frail',
    dialogueHint: 'Shows signs of weakness',
  },
  {
    id: 'athletic',
    name: 'Athletic',
    icon: 'FaRunning',
    category: 'physical',
    baseWeight: 25,
    weight: (ctx, char) => ((char as any).stats?.dexterity >= 8 ? 2.5 : 0.6)
      * (ctx.age < 40 ? 1.5 : 0.4),
    description: 'Natural grace and agility; moves with practiced ease',
    phrase: 'naturally athletic',
    dialogueHint: 'Moves with grace and confidence',
  },

  // =========================================================================
  // MARKS ON THE BODY
  // =========================================================================
  {
    id: 'pox_scarred',
    name: 'Pox-Scarred',
    icon: 'GiSpotedFlower',
    category: 'condition',
    baseWeight: 110,
    // The commonest mark on an early modern face. Endemic smallpox scarred a
    // large share of surviving adults; vaccination pushed it back after 1800.
    weight: (ctx) => {
      if (ctx.age < 6) return 0;
      const western = inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL');
      const arrival = inZone(ctx, 'NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN', 'OCEANIA')
        ? ramp(ctx.year, 1518, 1560, 1880, 1960)
        : ramp(ctx.year, -400, 600, western ? 1800 : 1900, western ? 1900 : 1980);
      return arrival * urbanBoost(ctx, 1.6);
    },
    excludes: ['beautiful'],
    description: 'Face deeply pitted by the smallpox they were fortunate to survive',
    phrase: 'pitted with the scars of smallpox',
    foundational: true,
    dialogueHint: 'Speaks of surviving the pox',
  },
  {
    id: 'scarred',
    name: 'Battle-Scarred',
    icon: 'GiSwordWound',
    category: 'physical',
    baseWeight: 14,
    weight: (ctx) => (job(ctx, 'soldier', 'guard', 'merc', 'sailor', 'knight') ? 6 : 1)
      * (ctx.sex === 'Male' ? 1.8 : 0.25),
    description: 'Bears prominent scars from past violence; marks of survival',
    phrase: 'covered in scars',
    dialogueHint: 'Bears visible marks of violence',
  },
  {
    id: 'burn_scarred',
    name: 'Burn-Scarred',
    icon: 'IoFlame',
    category: 'physical',
    baseWeight: 12,
    // Open hearths and forges made burns the ordinary domestic injury.
    weight: (ctx) => (job(ctx, 'smith', 'cook', 'baker', 'founder', 'glass', 'potter') ? 4 : 1)
      * (ctx.sex === 'Female' ? 1.6 : 1) * (ctx.year < 1900 ? 1.5 : 1),
    description: 'Old burns tighten one hand and forearm; a hearth or a forge did it',
    phrase: 'marked by old burns',
    dialogueHint: 'Favors an old burn',
  },
  {
    id: 'disfigured',
    name: 'Disfigured',
    icon: 'IoWarning',
    category: 'physical',
    baseWeight: 6,
    excludes: ['beautiful'],
    description: 'Facial scarring or deformity that makes others uncomfortable',
    phrase: 'visibly disfigured',
    foundational: true,
    dialogueHint: 'Face bears marks of trauma',
  },
  {
    id: 'beautiful',
    name: 'Beautiful',
    icon: 'IoHeart',
    category: 'physical',
    baseWeight: 22,
    weight: (ctx, char) => ((char as any).stats?.charisma >= 8 ? 2.5 : 0.6)
      * (ctx.age < 45 ? 1.4 : 0.4),
    description: 'Striking physical beauty that draws attention and admiration',
    phrase: 'strikingly attractive',
    dialogueHint: 'Draws admiring glances',
  },
  {
    id: 'toothless',
    name: 'Toothless',
    icon: 'GiTooth',
    category: 'condition',
    baseWeight: 20,
    // The age ramp did the work of a gate but not its job: it multiplies from
    // 35 and never reaches zero, so a nineteen-year-old could draw it.
    minAge: 30,
    weight: (ctx) => (ctx.year < 1900 ? 1 : 0.3) * withAge(ctx, 35, 1.4, 8)
      * (rich(ctx) && ctx.year > 1600 ? 1.5 : 1), // sugar reached the rich first
    excludes: ['beautiful'],
    description: 'Has lost most teeth; eats what can be softened',
    phrase: 'nearly toothless',
    dialogueHint: 'Speaks around missing teeth',
  },
  {
    id: 'rotten_tooth',
    name: 'Aching Tooth',
    icon: 'GiTooth',
    category: 'condition',
    baseWeight: 55,
    weight: (ctx) => (ctx.year < 1900 ? 1 : 0.25)
      * (ctx.year > 1650 && (rich(ctx) || ctx.urban) ? 1.6 : 1),
    excludes: ['toothless'],
    description: 'A tooth gone bad that throbs for weeks and can only be pulled',
    phrase: 'tormented by an aching tooth',
    dialogueHint: 'Winces and touches the jaw',
  },
  {
    id: 'red_haired',
    name: 'Red-Haired',
    icon: 'IoFlame',
    category: 'physical',
    baseWeight: 8,
    // Concentrated in the Atlantic fringe, and read as an omen almost everywhere.
    weight: (ctx) => {
      if (!inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL')) return 0.02;
      if (place(ctx, 'ireland', 'scot', 'wales', 'welsh', 'cornwall')) return 12;
      return place(ctx, 'norway', 'sweden', 'denmark', 'iceland', 'finland') ? 5 : 1;
    },
    description: 'Red hair, taken by neighbors as a sign of a difficult temper',
    phrase: 'red-haired',
    dialogueHint: 'Has heard every superstition about the color',
  },
  {
    id: 'prematurely_gray',
    name: 'Prematurely Gray',
    icon: 'GiHourglass',
    category: 'physical',
    baseWeight: 20,
    minAge: 22,
    maxAge: 50,
    description: 'Went white early; strangers guess at twenty years too many',
    phrase: 'gray far before your years',
    dialogueHint: 'Is often taken for older',
  },
  {
    id: 'heterochromia',
    name: 'Two-Colored Eyes',
    icon: 'IoEye',
    category: 'physical',
    baseWeight: 0.7,
    description: 'Eyes of two different colors; strangers stare and then look away',
    phrase: 'possessed of two differently colored eyes',
    dialogueHint: 'Notices people staring at their eyes',
  },
  {
    id: 'birthmark_omen',
    name: 'Marked at Birth',
    icon: 'GiSpotedFlower',
    category: 'spiritual',
    baseWeight: 9,
    description: 'A vivid birthmark that midwives and neighbors read as a sign',
    phrase: 'born with a birthmark others read as a sign',
    dialogueHint: 'Others read meaning into their birthmark',
  },
  {
    id: 'six_fingered',
    name: 'Six-Fingered',
    icon: 'IoHandLeft',
    category: 'physical',
    baseWeight: 0.8,
    description: 'An extra finger on one hand; hidden in company, useful at work',
    phrase: 'born with an extra finger',
    foundational: true,
    dialogueHint: 'Keeps one hand out of sight',
  },
  {
    id: 'cleft_lip',
    name: 'Hare Lip',
    icon: 'IoWarning',
    category: 'physical',
    baseWeight: 1.4,
    excludes: ['beautiful'],
    description: 'A cleft lip that neighbors blamed on some fright suffered by their mother',
    phrase: 'born with a cleft lip',
    foundational: true,
    dialogueHint: 'Speaks with a nasal turn',
  },
  {
    id: 'vitiligo',
    name: 'Piebald Skin',
    icon: 'GiSpotedFlower',
    category: 'physical',
    baseWeight: 6,
    description: 'Pale patches spreading across the skin, taken by many for a judgment',
    phrase: 'marked by spreading pale patches of skin',
    foundational: true,
    dialogueHint: 'Covers the marked skin in company',
  },
  {
    id: 'albino',
    name: 'Albino',
    icon: 'IoSparkles',
    category: 'physical',
    baseWeight: 0.3,
    // Notably higher in parts of West and Southern Africa and among the Kuna,
    // where albinism also carried strong and specific meanings.
    weight: (ctx) => (inZone(ctx, 'SUB_SAHARAN_AFRICAN') ? 12
      : place(ctx, 'panama', 'kuna', 'darien') ? 20 : 1),
    excludes: ['keen_eyed'],
    description: 'Born without color in skin or hair; the sun is an enemy and so are some neighbors',
    phrase: 'born wholly without color',
    foundational: true,
    dialogueHint: 'Shields their eyes from the sun',
  },

  // =========================================================================
  // ILLNESS AND CHRONIC CONDITION
  // =========================================================================
  {
    id: 'consumptive',
    name: 'Consumptive',
    icon: 'GiLungs',
    category: 'condition',
    baseWeight: 22,
    // Tuberculosis: the great urban killer, worst in the crowded industrial city.
    weight: (ctx) => ramp(ctx.year, -1000, 1, 1900, 1975)
      * urbanBoost(ctx, 2.5) * (poor(ctx) ? 1.6 : 0.7)
      * (ctx.year > 1750 && ctx.year < 1920 ? 2 : 1),
    excludes: ['athletic', 'strong'],
    description: 'A wasting cough with blood in it; everyone knows what it means',
    phrase: 'wasting with a consumptive cough',
    foundational: true,
    dialogueHint: 'Coughs into a cloth and hides it',
  },
  {
    id: 'malarial',
    name: 'Ague-Ridden',
    icon: 'IoThermometer',
    category: 'condition',
    baseWeight: 10,
    // Recurrent malaria: the defining affliction of marsh and river country.
    weight: (ctx) => {
      // The mosquito does not climb: highland country was famously free of it.
      if (place(ctx, 'andes', 'altiplano', 'cusco', 'cuzco', 'potosi', 'quito', 'la paz',
        'highland', 'tibet', 'himalaya', 'nepal', 'alp', 'sierra')) return 0.05;
      return (ctx.year > 1955 ? 0.05 : 1)
        * (place(ctx, ...MALARIAL) ? 18
          : inZone(ctx, 'SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN', 'SOUTH_AMERICAN') ? 8 : 1);
    },
    description: 'The ague returns every season: shaking, fever, then a week of weakness',
    phrase: 'shaken by a recurring ague',
    dialogueHint: 'Counts the days until the fever returns',
  },
  {
    id: 'goiter',
    name: 'Goitrous',
    icon: 'GiMountainRoad',
    category: 'condition',
    baseWeight: 2,
    // Endemic goiter tracked dietary iodine, which tracked geology.
    weight: (ctx) => (ctx.year > 1930 ? 0.05 : 1)
      * (place(ctx, ...IODINE_POOR) ? 45 : 1)
      * (ctx.sex === 'Female' ? 2.5 : 1),
    description: 'A swelling at the throat, common enough in these valleys to pass unremarked',
    phrase: 'marked by a swelling at the throat',
    dialogueHint: 'Wears the collar high',
  },
  {
    id: 'worm_ridden',
    name: 'Worm-Ridden',
    icon: 'GiSnail',
    category: 'condition',
    baseWeight: 50,
    weight: (ctx) => (ctx.year > 1930 ? 0.15 : 1)
      * (ctx.urban ? 0.9 : 1.3)
      * (inZone(ctx, 'SUB_SAHARAN_AFRICAN', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'OCEANIA') ? 1.8 : 1),
    description: 'Carries the worms nearly everyone carries, and knows the remedies for them',
    phrase: 'troubled by worms',
    dialogueHint: 'Complains of a gnawing belly',
  },
  {
    id: 'gouty',
    name: 'Gouty',
    icon: 'GiWineGlass',
    category: 'condition',
    baseWeight: 3,
    minAge: 35,
    weight: (ctx) => (rich(ctx) ? 18 : poor(ctx) ? 0.1 : 1) * (ctx.sex === 'Male' ? 3 : 0.4),
    description: 'A rich man\'s affliction: the great toe swollen past bearing after every feast',
    phrase: 'crippled by the gout',
    dialogueHint: 'Blames last night\'s wine',
  },
  {
    id: 'the_stone',
    name: 'Troubled by the Stone',
    icon: 'IoWarning',
    category: 'condition',
    baseWeight: 5,
    minAge: 25,
    weight: (ctx) => (ctx.year > 1900 ? 0.15 : 1) * (ctx.sex === 'Male' ? 3 : 0.5),
    description: 'A bladder stone; has heard what the cutting for it costs and refuses',
    phrase: 'tormented by the stone',
    dialogueHint: 'Speaks with dread of surgeons',
  },
  {
    id: 'trachoma',
    name: 'Sore-Eyed',
    icon: 'IoEyeOff',
    category: 'condition',
    baseWeight: 3,
    weight: (ctx) => (ctx.year > 1960 ? 0.05 : 1)
      * (inZone(ctx, 'MENA', 'SOUTH_ASIAN') ? 22 : place(ctx, 'egypt', 'nile', 'sudan', 'punjab') ? 25 : 1),
    exclusiveGroup: 'sight',
    description: 'Eyelids scarred and inturned by the sore eye that runs through every household here',
    phrase: 'half-blinded by the sore eye',
    dialogueHint: 'Blinks constantly against the light',
  },
  {
    id: 'yaws',
    name: 'Yaws-Scarred',
    icon: 'GiSpotedFlower',
    category: 'condition',
    baseWeight: 1,
    weight: (ctx) => (ctx.year > 1960 ? 0.02 : 1)
      * (inZone(ctx, 'SUB_SAHARAN_AFRICAN', 'OCEANIA', 'SOUTH_AMERICAN') ? 28 : 0.2),
    description: 'Old yaws lesions healed to pale scars across the shins and face',
    phrase: 'scarred by the yaws',
    dialogueHint: 'Bears pale healed sores',
  },
  {
    id: 'scrofulous',
    name: 'King\'s Evil',
    icon: 'GiPrayer',
    category: 'condition',
    baseWeight: 6,
    weight: (ctx) => ramp(ctx.year, 900, 1100, 1750, 1850)
      * (inZone(ctx, 'EUROPEAN') ? 1.5 : 0.3),
    description: 'Swellings at the neck that only a king\'s touch is said to cure',
    phrase: 'afflicted with the king\'s evil',
    dialogueHint: 'Speaks of travelling to be touched for it',
  },
  {
    id: 'syphilitic',
    name: 'Pox-Ridden',
    icon: 'GiVirus',
    category: 'condition',
    baseWeight: 8,
    weight: (ctx) => ramp(ctx.year, 1494, 1520, 1940, 1970)
      * urbanBoost(ctx, 3)
      * (job(ctx, 'soldier', 'sailor', 'actor', 'courtesan') ? 4 : 1),
    excludes: ['devout'],
    description: 'The French disease, taken years ago and treated with mercury ever since',
    phrase: 'ruined by the great pox',
    dialogueHint: 'Alludes to a shameful long illness',
  },
  {
    id: 'chronic_cough',
    name: 'Bronchitic',
    icon: 'GiLungs',
    category: 'condition',
    baseWeight: 25,
    // Coal smoke and open fires; worse in every city that burned sea-coal.
    weight: (ctx) => urbanBoost(ctx, ctx.year > 1750 ? 3 : 1.6)
      * withAge(ctx, 40, 0.5, 3),
    description: 'A winter cough that never entirely leaves; blames the smoke and is right',
    phrase: 'never free of a winter cough',
    dialogueHint: 'Interrupts themselves to cough',
  },
  {
    id: 'rheumatic',
    name: 'Rheumatic',
    icon: 'IoSnow',
    category: 'condition',
    baseWeight: 30,
    minAge: 35,
    weight: (ctx) => withAge(ctx, 40, 0.8, 4)
      * (job(ctx, 'farm', 'labor', 'fish', 'wash', 'mine', 'sailor') ? 1.8 : 1),
    description: 'Joints that read the weather and ache before every change in it',
    phrase: 'stiff with rheumatism',
    dialogueHint: 'Predicts rain by their joints',
  },
  {
    id: 'ruptured',
    name: 'Ruptured',
    icon: 'GiHandBandage',
    category: 'condition',
    // Truss societies existed to hand these out by the thousand. Among men who
    // lifted for a living, past forty, something like one in twenty carried a
    // rupture and knew exactly which movement would let it down.
    baseWeight: 20,
    minAge: 25,
    weight: (ctx) => (ctx.sex === 'Male' ? 1 : 0.25)
      * withAge(ctx, 35, 0.5, 3)
      * (job(ctx, 'labor', 'porter', 'mine', 'dock', 'smith', 'farm', 'carrier', 'mason') ? 2.2 : 1),
    description: 'A rupture in the belly wall, held in by a truss and a careful way of lifting',
    phrase: 'ruptured, and careful how they lift',
    dialogueHint: 'Refuses the heavy end of anything',
  },
  {
    id: 'leg_ulcer',
    name: 'Ulcerated Leg',
    icon: 'GiScarWound',
    category: 'condition',
    // The standing trades' disease. Once open it stayed open for years, was
    // dressed with whatever was to hand, and could be smelled across a room.
    baseWeight: 8,
    minAge: 35,
    weight: (ctx) => withAge(ctx, 45, 0.7, 4)
      * (ctx.sex === 'Female' ? 1.4 : 1) // childbearing, and standing to work
      * (job(ctx, 'cook', 'wash', 'weav', 'smith', 'baker', 'servant', 'sailor', 'soldier') ? 1.8 : 1)
      * (poor(ctx) ? 1.5 : 0.7),
    description: 'An open sore on the shin that has not closed in years and is dressed each morning',
    phrase: 'troubled by a sore on the leg that will not close',
    dialogueHint: 'Shifts weight off one leg without noticing',
  },
  {
    id: 'scald_head',
    name: 'Scald-Head Scars',
    icon: 'GiSpotedFlower',
    category: 'condition',
    // Ringworm of the scalp, caught in childhood off a shared cap or comb and
    // treated by pitch plaster or by pulling the hair out at the root. What
    // remained was bald patches for life and a strong memory of the cure.
    baseWeight: 12,
    weight: (ctx) => (ctx.year < 1920 ? 1 : 0.2)
      * (poor(ctx) ? 2 : 0.5)
      * (ctx.urban ? 1.4 : 1),
    excludes: ['beautiful'],
    description: 'Bald patches across the scalp from a childhood ringworm and its brutal cure',
    phrase: 'scarred at the scalp from a childhood scald-head',
    dialogueHint: 'Keeps their head covered indoors and out',
  },
  {
    id: 'barren',
    name: 'Barren',
    icon: 'GiFamilyTree',
    category: 'circumstance',
    // Roughly one married woman in ten bore no living child, and in almost
    // every society the fault was assigned to her. This is a social fact as
    // much as a medical one, which is why it sits in circumstance.
    baseWeight: 55,
    sex: 'Female',
    minAge: 28,
    excludes: ['buried_children', 'midwife_skill'],
    description: 'Has borne no living child, and has heard what the neighbors make of it',
    phrase: 'childless, and blamed for it',
    foundational: true,
    dialogueHint: 'Turns the talk away from other people\'s children',
  },
  {
    id: 'bearded_woman',
    name: 'Bearded',
    icon: 'GiFragile',
    category: 'physical',
    // Marked hirsutism, and one of the few conditions with a documented
    // career attached to it: fairs and courts paid for the sight, and some
    // women took the money rather than the shaving.
    baseWeight: 0.6,
    sex: 'Female',
    minAge: 20,
    excludes: ['beautiful'],
    description: 'A woman with a full beard; some pay to look, and she has considered charging them',
    phrase: 'a woman grown a full beard',
    foundational: true,
    dialogueHint: 'Meets staring with a flat, practiced look',
  },
  {
    id: 'falling_sickness',
    name: 'Falling Sickness',
    icon: 'FaBolt',
    category: 'condition',
    baseWeight: 5,
    description: 'Seized by fits without warning; opinion is divided on whether it is holy or foul',
    phrase: 'subject to the falling sickness',
    foundational: true,
    dialogueHint: 'Speaks carefully about their fits',
  },
  {
    id: 'palsied',
    name: 'Palsied',
    icon: 'GiHourglass',
    category: 'condition',
    baseWeight: 3,
    minAge: 45,
    weight: (ctx) => withAge(ctx, 50, 1.2, 6),
    excludes: ['skilled_hands', 'calligrapher'],
    description: 'A trembling in the hands that has slowly cost them fine work',
    phrase: 'troubled by a trembling in the hands',
    dialogueHint: 'Steadies one hand with the other',
  },
  {
    id: 'soldiers_heart',
    name: 'Soldier\'s Heart',
    icon: 'GiBattleGear',
    category: 'condition',
    baseWeight: 2,
    // What a later century would name differently: the startle, the sleepless
    // nights and the racing heart of someone who has been in a war.
    // War reached women as siege, sack and camp rather than as service, so
    // the sex difference is real but nothing like the one for enlistment.
    weight: (ctx) => (job(ctx, 'soldier', 'sailor', 'merc', 'gunner') ? 30 : 1)
      * (ctx.sex === 'Male' ? 1 : 0.3),
    description: 'Starts at every sudden noise; the heart races for no cause they will name',
    phrase: 'given to starting at every sudden noise',
    foundational: true,
    dialogueHint: 'Flinches at loud sounds',
  },
  {
    id: 'cannot_digest_milk',
    name: 'Milk Sickens Them',
    icon: 'GiMilkCarton',
    category: 'condition',
    baseWeight: 60,
    // Lactase persistence is genuinely geographic. Northern Europe and the
    // pastoral Sahel drink milk into adulthood; most of the world does not.
    weight: (ctx) => {
      if (inZone(ctx, 'EUROPEAN')) {
        return place(ctx, 'ireland', 'scot', 'england', 'denmark', 'sweden', 'norway', 'netherland', 'german') ? 0.08 : 0.35;
      }
      if (inZone(ctx, 'EAST_ASIAN', 'NORTH_AMERICAN_PRE_COLUMBIAN')) return 1.6;
      if (inZone(ctx, 'SOUTH_AMERICAN', 'OCEANIA')) return 1.4;
      if (inZone(ctx, 'SOUTH_ASIAN')) return 0.7;
      if (inZone(ctx, 'MENA', 'SUB_SAHARAN_AFRICAN')) return 0.5;
      return 1;
    },
    description: 'Fresh milk turns their stomach, though soured or curdled sits well enough',
    phrase: 'unable to stomach fresh milk',
    dialogueHint: 'Refuses milk but takes it soured',
  },

  // =========================================================================
  // OCCUPATIONAL DAMAGE
  // Weighted almost entirely by trade: rare in the population, near-certain
  // among the people who did the work.
  // =========================================================================
  {
    id: 'black_lung',
    name: 'Black Lung',
    icon: 'GiMineWagon',
    category: 'condition',
    baseWeight: 1,
    minAge: 25,
    weight: (ctx) => (job(ctx, 'mine', 'collier', 'coal', 'quarry') ? 70 : 0.05)
      * ramp(ctx.year, 1600, 1750, 2000, 2000),
    description: 'Lungs blackened by pit dust; every breath is shallower than the last',
    phrase: 'black in the lungs from the pit',
    dialogueHint: 'Breathes shallowly and stops to rest',
  },
  {
    id: 'mercury_tremor',
    name: 'Quicksilver Shakes',
    icon: 'GiChemicalDrop',
    category: 'condition',
    baseWeight: 0.5,
    // Hatters, gilders, mirror-makers and amalgam miners all breathed mercury.
    weight: (ctx) => (job(ctx, 'hatter', 'hat', 'gild', 'mirror', 'assay', 'alchem', 'mine') ? 110 : 0.05)
      * ramp(ctx.year, 1500, 1600, 1900, 1950),
    excludes: ['skilled_hands', 'calligrapher'],
    description: 'Hands shake and temper snaps; the fumes of the trade have gotten into them',
    phrase: 'shaking from the fumes of your trade',
    foundational: true,
    dialogueHint: 'Trembles and loses the thread mid-sentence',
  },
  {
    id: 'lead_palsy',
    name: 'Lead Palsy',
    icon: 'GiChemicalDrop',
    category: 'condition',
    baseWeight: 0.6,
    weight: (ctx) => (job(ctx, 'paint', 'print', 'plumb', 'potter', 'glaz', 'type') ? 80 : 0.05)
      * ramp(ctx.year, 1400, 1600, 1900, 1960),
    description: 'Wrists gone weak and a blue line at the gums; the trade\'s slow poison',
    phrase: 'weakened by the lead of your trade',
    dialogueHint: 'Cannot hold the wrist straight',
  },
  {
    id: 'weavers_stoop',
    name: 'Weaver\'s Stoop',
    icon: 'GiSewingString',
    category: 'condition',
    baseWeight: 0.8,
    minAge: 25,
    weight: (ctx) => (job(ctx, 'weav', 'tailor', 'cobbler', 'shoe', 'embroider') ? 90 : 0.05),
    description: 'Shoulders rounded and eyes ruined by thirty years bent to the loom',
    phrase: 'bent from a lifetime at the loom',
    dialogueHint: 'Cannot straighten fully',
  },
  {
    id: 'millers_cough',
    name: 'Miller\'s Cough',
    icon: 'GiWheat',
    category: 'condition',
    baseWeight: 0.5,
    weight: (ctx) => (job(ctx, 'mill', 'baker', 'thresh', 'grain') ? 100 : 0.05),
    description: 'Flour dust in the lungs; coughs white and jokes about it',
    phrase: 'coughing flour from a life in the mill',
    dialogueHint: 'Coughs dryly and often',
  },
  {
    id: 'scriveners_cramp',
    name: 'Scrivener\'s Cramp',
    icon: 'GiQuillInk',
    category: 'condition',
    baseWeight: 0.4,
    weight: (ctx) => (job(ctx, 'scribe', 'clerk', 'notary', 'copy', 'secretar', 'account') ? 100 : 0.05),
    description: 'The writing hand seizes after an hour; a career measured in cramps',
    phrase: 'cramped in the writing hand',
    dialogueHint: 'Shakes out the writing hand',
  },
  {
    id: 'tanners_hands',
    name: 'Tanner\'s Hands',
    icon: 'GiChemicalDrop',
    category: 'condition',
    baseWeight: 0.4,
    weight: (ctx) => (job(ctx, 'tann', 'dye', 'fuller', 'currier', 'butcher') ? 100 : 0.05),
    description: 'Hands stained and cracked past washing, and a smell that follows them indoors',
    phrase: 'stained to the wrist by your trade',
    dialogueHint: 'Keeps their hands turned away',
  },

  // =========================================================================
  // MIND
  // =========================================================================
  //
  // Stat gates below are on the 1-10 scale the generator actually rolls (see
  // STAT_MIN/STAT_MAX in personaRarityService). They were originally written
  // against a 1-20 scale, which broke every one of them in the same two ways:
  // `intelligence > 15` can never be true, so Brilliant Mind never got its
  // bonus, and `intelligence < 9` is true of about seven people in eight, so
  // Slow-Witted was effectively unconditional. The visible result was a persona
  // in the top twelve per cent for intelligence wearing a Slow-Witted badge.
  // 8 is roughly the top eighth; 3 is roughly the bottom eighth.
  {
    id: 'genius',
    name: 'Brilliant Mind',
    icon: 'FaBrain',
    category: 'mental',
    baseWeight: 2,
    weight: (_ctx, char) => ((char as any).stats?.intelligence >= 8 ? 4 : 0.4),
    excludes: ['slow_witted'],
    description: 'Exceptional intellect; grasps complex ideas with ease',
    phrase: 'brilliant',
    dialogueHint: 'Speaks with remarkable insight',
  },
  {
    id: 'slow_witted',
    name: 'Slow-Witted',
    icon: 'FaFeather',
    category: 'mental',
    baseWeight: 25,
    weight: (_ctx, char) => ((char as any).stats?.intelligence <= 3 ? 3 : 0.5),
    description: 'Takes time to understand new concepts; prefers simple explanations',
    phrase: 'slow-witted',
    dialogueHint: 'Struggles with complex ideas',
  },
  {
    id: 'educated',
    name: 'Educated',
    icon: 'FaBookOpen',
    category: 'mental',
    baseWeight: 25,
    // Literacy was scarce, unevenly distributed, and rose late. Once schooling
    // became universal it stopped distinguishing anyone, so the weight collapses.
    weight: (ctx) => {
      // A society with no script cannot produce a reader, however well born.
      if (!can('writing', ctx)) return 0;
      let w = 1;
      if (ctx.year > 1600) w *= 2;
      if (ctx.year > 1850) w *= 2;
      if (ctx.year > 1920) w *= 0.05;
      if (rich(ctx)) w *= 6; else if (poor(ctx)) w *= 0.2;
      if (job(ctx, 'scribe', 'clerk', 'priest', 'monk', 'scholar', 'notary', 'physician', 'lawyer', 'teacher')) w *= 6;
      if (ctx.sex === 'Female' && ctx.year < 1800) w *= 0.35;
      return w * urbanBoost(ctx, 1.4);
    },
    exclusiveGroup: 'literacy',
    description: 'Learned in letters and scholarship; can read and write fluently',
    phrase: 'educated',
    foundational: true,
    dialogueHint: 'Quotes texts and authorities',
  },
  {
    id: 'learned_by_ear',
    name: 'Learned by Ear',
    icon: 'GiTiedScroll',
    category: 'mental',
    baseWeight: 30,
    // Unlettered but far from ignorant: whole texts held in memory, as most
    // people held knowledge before cheap print — and the only way knowledge is
    // held at all where there is no script.
    weight: (ctx) => (can('writing', ctx) ? (ctx.year < 1800 ? 1.5 : 0.4) : 3),
    exclusiveGroup: 'literacy',
    description: 'Cannot read a word, yet carries whole psalms, laws and genealogies in memory',
    phrase: 'unlettered but deep in memorized learning',
    dialogueHint: 'Recites from memory rather than reading',
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    icon: 'FaScroll',
    category: 'mental',
    baseWeight: 8,
    weight: (ctx) => (place(ctx, ...PORTS) ? 5 : 1)
      * (job(ctx, 'merchant', 'trader', 'interpret', 'diplomat', 'sailor') ? 4 : 1),
    description: 'Speaks multiple languages fluently; picks up new tongues easily',
    phrase: 'fluent in many languages',
    dialogueHint: 'Switches between languages easily',
  },
  {
    id: 'second_script',
    name: 'Reads a Second Script',
    icon: 'GiScrollQuill',
    category: 'skill',
    baseWeight: 5,
    weight: (ctx) => (can('writing', ctx) ? (job(ctx, 'merchant', 'scribe', 'scholar', 'priest', 'clerk') ? 8 : 1) : 0),
    description: 'Reads a second alphabet learned for trade, scripture or exile',
    phrase: 'able to read a second script',
    dialogueHint: 'Writes in an unfamiliar hand',
  },
  {
    id: 'sharp_memory',
    name: 'Prodigious Memory',
    icon: 'GiBrain',
    category: 'mental',
    baseWeight: 14,
    exclusiveGroup: 'memory',
    description: 'Remembers names, faces, and events with exceptional clarity',
    phrase: 'gifted with a prodigious memory',
    dialogueHint: 'Recalls minute details from years past',
  },
  {
    id: 'forgetful',
    name: 'Forgetful',
    icon: 'FaFeather',
    category: 'mental',
    baseWeight: 28,
    weight: (ctx) => withAge(ctx, 55, 0.8, 4),
    exclusiveGroup: 'memory',
    description: 'Often misplaces things and forgets recent conversations',
    phrase: 'terribly forgetful',
    dialogueHint: 'Often repeats questions',
  },
  {
    id: 'counts_everything',
    name: 'Counts Everything',
    icon: 'GiAbacus',
    category: 'mental',
    baseWeight: 5,
    description: 'Counts steps, tiles, and sheaves without deciding to; the numbers simply arrive',
    phrase: 'unable to stop counting things',
    dialogueHint: 'Mentions exact numbers no one asked for',
  },
  {
    id: 'single_subject',
    name: 'One Subject Only',
    icon: 'GiSpellBook',
    category: 'mental',
    baseWeight: 5,
    description: 'Knows one narrow subject exhaustively and returns every conversation to it',
    phrase: 'consumed by one narrow subject',
    dialogueHint: 'Steers all talk back to their subject',
  },
  {
    id: 'crowd_averse',
    name: 'Cannot Abide Crowds',
    icon: 'IoPeople',
    category: 'mental',
    baseWeight: 8,
    excludes: ['charming', 'garrulous'],
    description: 'Markets and festivals are unbearable; leaves without explaining why',
    phrase: 'unable to abide crowds',
    dialogueHint: 'Edges toward the door in company',
  },
  {
    id: 'numerate',
    name: 'Quick Reckoner',
    icon: 'GiAbacus',
    category: 'skill',
    baseWeight: 12,
    weight: (ctx) => (job(ctx, 'merchant', 'account', 'steward', 'bank', 'clerk', 'survey') ? 7 : 1),
    description: 'Casts accounts in their head faster than most can with counters',
    phrase: 'quick with figures',
    dialogueHint: 'Does sums aloud without effort',
  },
  {
    id: 'dreamer',
    name: 'Daydreamer',
    icon: 'IoSparkles',
    category: 'mental',
    baseWeight: 25,
    description: 'Drifts off mid-task into elaborate imaginings',
    phrase: 'prone to daydreaming',
    dialogueHint: 'Loses the thread of conversation',
  },
  {
    id: 'curious',
    name: 'Insatiably Curious',
    icon: 'IoTelescope',
    category: 'mental',
    baseWeight: 28,
    description: 'Asks questions well past the point of politeness',
    phrase: 'insatiably curious',
    dialogueHint: 'Interrogates strangers about their work',
  },

  // =========================================================================
  // SLEEP AND DREAMING
  // =========================================================================
  {
    id: 'insomniac',
    name: 'Insomniac',
    icon: 'GiCandleFlame',
    category: 'habit',
    baseWeight: 38,
    weight: (ctx) => withAge(ctx, 45, 0.4, 2.5),
    exclusiveGroup: 'sleep',
    description: 'Lies awake most of the night and works the next day regardless',
    phrase: 'an insomniac',
    dialogueHint: 'Speaks of the long hours before dawn',
  },
  {
    id: 'wakeful_hour',
    name: 'Keeps the Watch',
    icon: 'GiCandleFlame',
    category: 'habit',
    baseWeight: 40,
    // Segmented sleep was ordinary before cheap lighting: people woke between
    // a first and second sleep and used the hour deliberately.
    weight: (ctx) => ramp(ctx.year, -2000, 1, 1750, 1880),
    exclusiveGroup: 'sleep',
    description: 'Wakes between first and second sleep and keeps that dark hour for prayer or thought',
    phrase: 'wakeful in the hour between first and second sleep',
    dialogueHint: 'Speaks of the quiet hour after midnight',
  },
  {
    id: 'early_riser',
    name: 'Early Riser',
    icon: 'GiSunrise',
    category: 'habit',
    baseWeight: 40,
    exclusiveGroup: 'sleep',
    description: 'Awake and working before anyone else stirs',
    phrase: 'up before anyone else',
    dialogueHint: 'Mentions how early they rose',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    icon: 'GiOwl',
    category: 'habit',
    baseWeight: 25,
    exclusiveGroup: 'sleep',
    description: 'Comes alive after dark and resents every early summons',
    phrase: 'most alive after dark',
    dialogueHint: 'Is visibly wretched in the morning',
  },
  {
    id: 'heavy_sleeper',
    name: 'Heavy Sleeper',
    icon: 'GiBed',
    category: 'habit',
    baseWeight: 25,
    exclusiveGroup: 'sleep',
    description: 'Sleeps through storms, alarms and household emergencies alike',
    phrase: 'a famously heavy sleeper',
    dialogueHint: 'Slept through something they should not have',
  },
  {
    id: 'sleepwalker',
    name: 'Sleepwalker',
    icon: 'GiNightSleep',
    category: 'habit',
    baseWeight: 8,
    exclusiveGroup: 'sleep',
    description: 'Walks and even works in their sleep, and remembers none of it',
    phrase: 'a sleepwalker',
    foundational: true,
    dialogueHint: 'Has been found somewhere strange at dawn',
  },
  {
    id: 'lucid_dreamer',
    name: 'Lucid Dreamer',
    icon: 'GiThirdEye',
    category: 'habit',
    baseWeight: 15,
    excludes: ['nightmare_ridden'],
    description: 'Knows they are dreaming while it happens and steers the dream at will',
    phrase: 'able to steer your own dreams',
    dialogueHint: 'Describes dreams in unusual detail',
  },
  {
    id: 'nightmare_ridden',
    name: 'Nightmare-Ridden',
    icon: 'GiNightSleep',
    category: 'habit',
    baseWeight: 18,
    excludes: ['lucid_dreamer'],
    description: 'The same dream returns most nights, and they dread the hour of it',
    phrase: 'hounded by the same nightmare',
    dialogueHint: 'Is reluctant to go to bed',
  },
  {
    id: 'snorer',
    name: 'Snorer',
    icon: 'GiBed',
    category: 'habit',
    baseWeight: 30,
    weight: (ctx) => withAge(ctx, 35, 0.4, 2.5),
    description: 'Snores so loudly that shared beds become a household negotiation',
    phrase: 'a prodigious snorer',
    dialogueHint: 'Has been complained about by everyone they sleep near',
  },

  // =========================================================================
  // APPETITE AND INTOXICANTS
  // =========================================================================
  {
    id: 'glutton',
    name: 'Great Appetite',
    icon: 'GiCookingPot',
    category: 'habit',
    baseWeight: 15,
    weight: (ctx) => (rich(ctx) ? 3 : poor(ctx) ? 0.4 : 1),
    exclusiveGroup: 'appetite',
    description: 'Eats prodigiously and talks about the next meal during this one',
    phrase: 'possessed of an enormous appetite',
    dialogueHint: 'Steers conversation to food',
  },
  {
    id: 'ascetic',
    name: 'Abstemious',
    icon: 'GiPrayer',
    category: 'habit',
    baseWeight: 12,
    exclusiveGroup: 'appetite',
    description: 'Eats little and plainly by deliberate choice, and is faintly proud of it',
    phrase: 'disdainful of worldly pleasures',
    dialogueHint: 'Refuses the richer dishes',
  },
  {
    id: 'heavy_drinker',
    name: 'Heavy Drinker',
    icon: 'GiDrinking',
    category: 'habit',
    baseWeight: 40,
    weight: (ctx) => (job(ctx, 'sailor', 'soldier', 'brewer', 'innkeep', 'carter') ? 3 : 1)
      * (ctx.sex === 'Male' ? 1.6 : 0.5),
    exclusiveGroup: 'intoxicant',
    description: 'Drinks past what the company thinks reasonable, and always has',
    phrase: 'dependent on drink',
    foundational: true,
    dialogueHint: 'Turns every meeting toward a drink',
  },
  {
    id: 'teetotal',
    name: 'Takes No Drink',
    icon: 'IoWater',
    category: 'habit',
    baseWeight: 15,
    weight: (ctx) => (inZone(ctx, 'MENA') ? 12 : 1)
      * (inZone(ctx, 'SOUTH_ASIAN') ? 4 : 1)
      * (ctx.year > 1830 && inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL') ? 3 : 1),
    exclusiveGroup: 'intoxicant',
    description: 'Touches no wine or spirits, from faith, oath, or a bad memory',
    phrase: 'one who takes no drink at all',
    dialogueHint: 'Declines every cup offered',
  },
  {
    id: 'tobacco',
    name: 'Devoted to Tobacco',
    icon: 'GiSmokingPipe',
    category: 'habit',
    baseWeight: 60,
    // Tobacco left the Americas after 1492 and had reached nearly everywhere
    // within a century and a half.
    weight: (ctx) => inZone(ctx, 'NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN')
      ? 1
      : ramp(ctx.year, 1520, 1650, 2000, 2000),
    exclusiveGroup: 'intoxicant',
    description: 'Pipe never far from hand; measures the day in bowls of it',
    phrase: 'never without a pipe',
    dialogueHint: 'Pauses to fill a pipe',
  },
  {
    id: 'snuff_taker',
    name: 'Snuff-Taker',
    icon: 'GiSmokingPipe',
    category: 'habit',
    baseWeight: 25,
    weight: (ctx) => ramp(ctx.year, 1640, 1700, 1820, 1900)
      * (rich(ctx) ? 3 : 0.6)
      * (inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL') ? 1 : 0.3),
    exclusiveGroup: 'intoxicant',
    description: 'Takes snuff constantly, with an elaborate box and a practiced flourish',
    phrase: 'devoted to your snuff-box',
    dialogueHint: 'Offers the snuff-box as a greeting',
  },
  {
    id: 'opium_eater',
    name: 'Opium-Eater',
    icon: 'GiChemicalDrop',
    category: 'habit',
    baseWeight: 3,
    weight: (ctx) => {
      if (inZone(ctx, 'EAST_ASIAN')) return ramp(ctx.year, 1750, 1820, 1900, 1950) * 15;
      if (inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL')) return ramp(ctx.year, 1660, 1800, 1900, 1930) * 8;
      if (inZone(ctx, 'MENA', 'SOUTH_ASIAN')) return ramp(ctx.year, 1400, 1550, 1900, 1960) * 6;
      return 0.2;
    },
    exclusiveGroup: 'intoxicant',
    description: 'Began it for pain and continued for its own sake',
    phrase: 'in the grip of opium',
    foundational: true,
    dialogueHint: 'Grows vague and then unnervingly lucid',
  },

  // =========================================================================
  // TEMPERAMENT
  // =========================================================================
  {
    id: 'charming',
    name: 'Charming',
    icon: 'IoHeart',
    category: 'social',
    baseWeight: 25,
    weight: (_ctx, char) => ((char as any).stats?.charisma >= 8 ? 2.5 : 0.6),
    exclusiveGroup: 'sociability',
    description: 'Natural charisma and grace in social situations',
    phrase: 'naturally charming',
    dialogueHint: 'Speaks with natural charm',
  },
  {
    id: 'shy',
    name: 'Shy',
    icon: 'FaFeather',
    category: 'social',
    baseWeight: 30,
    weight: (_ctx, char) => ((char as any).stats?.charisma <= 3 ? 2.5 : 0.7),
    exclusiveGroup: 'sociability',
    description: 'Uncomfortable in crowds; prefers solitude or small gatherings',
    phrase: 'painfully shy',
    dialogueHint: 'Avoids eye contact',
  },
  {
    id: 'garrulous',
    name: 'Garrulous',
    icon: 'GiTalk',
    category: 'social',
    baseWeight: 30,
    exclusiveGroup: 'sociability',
    description: 'Talks without pause and rarely notices the listener escaping',
    phrase: 'endlessly talkative',
    dialogueHint: 'Answers every question at length',
  },
  {
    id: 'taciturn',
    name: 'Taciturn',
    icon: 'GiMute',
    category: 'social',
    baseWeight: 30,
    exclusiveGroup: 'sociability',
    description: 'Speaks only when there is something worth saying, which is seldom',
    phrase: 'a person of very few words',
    dialogueHint: 'Answers in as few words as possible',
  },
  {
    id: 'loner',
    name: 'Solitary',
    icon: 'GiFootprint',
    category: 'social',
    baseWeight: 20,
    exclusiveGroup: 'sociability',
    description: 'Prefers their own company and arranges life to get it',
    phrase: 'one who prefers solitude',
    dialogueHint: 'Declines invitations',
  },
  {
    id: 'honest',
    name: 'Honest',
    icon: 'FaHeart',
    category: 'social',
    baseWeight: 30,
    excludes: ['cunning'],
    description: 'Values truth above all; incapable of telling convincing lies',
    phrase: 'compulsively honest',
    dialogueHint: 'Cannot tell lies',
  },
  {
    id: 'cunning',
    name: 'Cunning',
    icon: 'GiSpiderWeb',
    category: 'social',
    baseWeight: 22,
    excludes: ['honest'],
    description: 'Quick-witted and skilled at deception when necessary',
    phrase: 'quick-witted and devious',
    dialogueHint: 'Stories often contradict',
  },
  {
    id: 'generous',
    name: 'Generous',
    icon: 'FaHeart',
    category: 'social',
    baseWeight: 22,
    excludes: ['greedy'],
    description: 'Gives freely to those in need, even at personal cost',
    phrase: 'exceptionally generous',
    dialogueHint: 'Offers to share resources',
  },
  {
    id: 'greedy',
    name: 'Miserly',
    icon: 'GiMoneyStack',
    category: 'social',
    baseWeight: 25,
    excludes: ['generous'],
    description: 'Hoards wealth and possessions; reluctant to part with anything',
    phrase: 'consumed by greed',
    dialogueHint: 'Always asks about payment',
  },
  {
    id: 'brave',
    name: 'Brave',
    icon: 'GiShield',
    category: 'social',
    baseWeight: 22,
    // The old condition tested char.stats.courage, which does not exist on
    // CharacterStats, so this attribute could never be selected.
    weight: (ctx, char) => ((char as any).personality?.neuroticism < 40 ? 2 : 0.7)
      * (job(ctx, 'soldier', 'sailor', 'guard', 'fire') ? 2 : 1),
    excludes: ['coward'],
    description: 'Faces danger without flinching; courage in the face of fear',
    phrase: 'fearless',
    dialogueHint: 'Shows no fear',
  },
  {
    id: 'coward',
    name: 'Cowardly',
    icon: 'IoWarning',
    category: 'social',
    baseWeight: 22,
    weight: (_ctx, char) => ((char as any).personality?.neuroticism > 60 ? 2.5 : 0.7),
    excludes: ['brave'],
    description: 'Quick to flee from danger; values survival over honor',
    phrase: 'cowardly',
    foundational: true,
    dialogueHint: 'Shows signs of fear',
  },
  {
    id: 'hot_tempered',
    name: 'Hot-Tempered',
    icon: 'IoFlame',
    category: 'social',
    baseWeight: 28,
    exclusiveGroup: 'temper',
    description: 'Quick to anger; struggles to control violent impulses',
    phrase: 'hot-tempered',
    dialogueHint: 'Easily provoked to rage',
  },
  {
    id: 'patient',
    name: 'Patient',
    icon: 'GiHourglass',
    category: 'social',
    baseWeight: 25,
    exclusiveGroup: 'temper',
    description: 'Calm and measured; rarely shows frustration or anger',
    phrase: 'endlessly patient',
    dialogueHint: 'Remains calm in tense situations',
  },
  {
    id: 'quarrelsome',
    name: 'Quarrelsome',
    icon: 'GiCrossedSwords',
    category: 'social',
    baseWeight: 25,
    exclusiveGroup: 'temper',
    description: 'Litigious and easily offended; has feuds running with half the street',
    phrase: 'forever quarrelling with the neighbors',
    dialogueHint: 'Recounts an ongoing dispute',
  },
  {
    id: 'proud',
    name: 'Proud',
    icon: 'GiCrown',
    category: 'social',
    baseWeight: 28,
    weight: (ctx) => (rich(ctx) ? 2 : 1),
    excludes: ['humble'],
    description: 'Strong sense of personal honor; easily offended by slights',
    phrase: 'fiercely proud',
    dialogueHint: 'Takes offense at perceived insults',
  },
  {
    id: 'humble',
    name: 'Humble',
    icon: 'FaPray',
    category: 'social',
    baseWeight: 22,
    excludes: ['proud'],
    description: 'Modest and unassuming; deflects praise and recognition',
    phrase: 'modest to a fault',
    dialogueHint: 'Downplays their accomplishments',
  },
  {
    id: 'melancholic',
    name: 'Melancholic',
    icon: 'IoWarning',
    category: 'social',
    baseWeight: 25,
    // Before the humors faded, this reads as a humoral diagnosis instead.
    weight: (ctx) => (ctx.year < 1800 && inZone(ctx, ...OLD_WORLD) ? 0.25 : 1),
    excludes: ['cheerful', 'humor_melancholic'],
    description: 'Prone to sadness and dark moods; sees the tragic in life',
    phrase: 'chronically sad',
    dialogueHint: 'Speaks of sorrow and loss',
  },
  {
    id: 'cheerful',
    name: 'Cheerful',
    icon: 'IoHeart',
    category: 'social',
    baseWeight: 25,
    excludes: ['melancholic'],
    description: 'Optimistic and good-natured; finds joy in simple pleasures',
    phrase: 'irrepressibly cheerful',
    dialogueHint: 'Laughs easily and often',
  },
  {
    id: 'stubborn',
    name: 'Stubborn',
    icon: 'GiAnvil',
    category: 'social',
    baseWeight: 30,
    description: 'Will not be moved once decided, however good the argument',
    phrase: 'incredibly stubborn',
    dialogueHint: 'Refuses to concede a point',
  },
  {
    id: 'reckless',
    name: 'Reckless',
    icon: 'IoRocket',
    category: 'social',
    baseWeight: 22,
    weight: (ctx) => (ctx.age < 30 ? 2 : 0.5),
    excludes: ['cautious'],
    description: 'Acts first and reckons the cost afterward',
    phrase: 'dangerously reckless',
    dialogueHint: 'Proposes the risky option',
  },
  {
    id: 'cautious',
    name: 'Cautious',
    icon: 'GiShield',
    category: 'social',
    baseWeight: 25,
    weight: (ctx) => (ctx.age > 45 ? 1.8 : 0.8),
    excludes: ['reckless'],
    description: 'Weighs every risk twice and takes the safer road',
    phrase: 'extremely cautious',
    dialogueHint: 'Raises objections before agreeing',
  },
  {
    id: 'gossip',
    name: 'Gossip',
    icon: 'GiTalk',
    category: 'social',
    baseWeight: 28,
    description: 'Knows everyone\'s business and trades it as currency',
    phrase: 'a relentless gossip',
    dialogueHint: 'Offers news about other people unprompted',
  },
  {
    id: 'peacemaker',
    name: 'Peacemaker',
    icon: 'GiPeaceDove',
    category: 'social',
    baseWeight: 18,
    weight: (ctx) => withAge(ctx, 40, 0.3, 2),
    description: 'The one the street sends for when a quarrel needs settling',
    phrase: 'called upon to settle other people\'s quarrels',
    dialogueHint: 'Tries to reconcile disputes',
  },
  {
    id: 'loyal',
    name: 'Steadfast',
    icon: 'GiShield',
    category: 'social',
    baseWeight: 22,
    description: 'Keeps faith with kin and patron past the point of self-interest',
    phrase: 'unshakeably loyal',
    dialogueHint: 'Defends their people reflexively',
  },
  {
    id: 'animal_lover',
    name: 'Good with Animals',
    icon: 'IoPaw',
    category: 'skill',
    baseWeight: 20,
    weight: (ctx) => (job(ctx, 'shepherd', 'herd', 'farm', 'ostler', 'groom', 'drover') ? 4 : 1),
    description: 'Beasts settle for them when they will settle for no one else',
    phrase: 'uncommonly good with animals',
    dialogueHint: 'Talks to animals as if to people',
  },

  // =========================================================================
  // FORTUNE AND FAITH
  // =========================================================================
  {
    id: 'devout',
    name: 'Devout',
    icon: 'FaPray',
    category: 'spiritual',
    baseWeight: 55,
    weight: (ctx) => (ctx.year > 1900 ? 0.6 : 1) * withAge(ctx, 45, 0.3, 2),
    exclusiveGroup: 'faith',
    description: 'Deep and unwavering religious faith; lives by sacred teachings',
    phrase: 'devoutly religious',
    foundational: true,
    dialogueHint: 'References divine will',
  },
  {
    id: 'lax_in_faith',
    name: 'Lax in Faith',
    icon: 'GiCandleFlame',
    category: 'spiritual',
    baseWeight: 35,
    exclusiveGroup: 'faith',
    description: 'Observes the great feasts and ignores everything in between',
    phrase: 'indifferent to religion',
    dialogueHint: 'Is vague about doctrine',
  },
  {
    id: 'skeptic',
    name: 'Skeptical',
    icon: 'FaBrain',
    category: 'spiritual',
    baseWeight: 6,
    // Open unbelief was dangerous before it was merely unfashionable.
    weight: (ctx) => ramp(ctx.year, 1600, 1750, 2000, 2000) * 4 + 0.2,
    exclusiveGroup: 'faith',
    description: 'Questions religious dogma and superstition; prefers rational explanations',
    phrase: 'doubtful of all religions',
    dialogueHint: 'Questions beliefs',
  },
  {
    id: 'blessed',
    name: 'Blessed',
    icon: 'FaCross',
    category: 'spiritual',
    baseWeight: 4,
    exclusiveGroup: 'fortune',
    description: 'Believed to be touched by divine favor; radiates an unusual serenity',
    phrase: 'blessed by fortune',
    dialogueHint: 'Radiates serenity',
  },
  {
    id: 'cursed',
    name: 'Cursed',
    icon: 'IoSkull',
    category: 'spiritual',
    baseWeight: 5,
    exclusiveGroup: 'fortune',
    description: 'Believed to be under a supernatural curse; plagued by misfortune',
    phrase: 'believed to be cursed',
    foundational: true,
    dialogueHint: 'Speaks of their curse',
  },
  {
    id: 'visionary',
    name: 'Visionary',
    icon: 'GiThirdEye',
    category: 'spiritual',
    baseWeight: 5,
    description: 'Experiences vivid dreams and visions; some believe them prophetic',
    phrase: 'gifted with prophetic dreams',
    foundational: true,
    dialogueHint: 'Speaks of visions and dreams',
  },
  {
    id: 'evil_eye_feared',
    name: 'Feared for the Eye',
    icon: 'GiEyeOfHorus',
    category: 'spiritual',
    baseWeight: 4,
    weight: (ctx) => (inZone(ctx, 'MENA', 'SOUTH_ASIAN') ? 8
      : place(ctx, 'italy', 'sicil', 'naples', 'greece', 'spain', 'turk') ? 8 : 0.6),
    description: 'Neighbors suspect their glance sours milk and sickens children, and act accordingly',
    phrase: 'suspected of the evil eye',
    foundational: true,
    dialogueHint: 'Notices people making signs against them',
  },
  {
    id: 'ancestor_dreams',
    name: 'Visited by the Dead',
    icon: 'GiSpellBook',
    category: 'spiritual',
    baseWeight: 5,
    weight: (ctx) => (inZone(ctx, 'SUB_SAHARAN_AFRICAN', 'OCEANIA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'EAST_ASIAN') ? 6 : 1),
    description: 'The dead of their line come in dreams with instructions, and are obeyed',
    phrase: 'visited in dreams by your ancestors',
    dialogueHint: 'Consults the dead before deciding',
  },
  {
    id: 'under_vow',
    name: 'Under a Vow',
    icon: 'GiPrayer',
    category: 'spiritual',
    baseWeight: 10,
    weight: (ctx) => (ctx.year > 1900 ? 0.3 : 1),
    description: 'Bound by a vow made in a bad hour, and keeping it whatever it costs',
    phrase: 'bound by a vow you will not break',
    foundational: true,
    dialogueHint: 'Refuses things without explaining why',
  },

  // =========================================================================
  // BIRTH AND FAMILY
  // =========================================================================
  {
    id: 'eldest',
    name: 'Eldest Child',
    icon: 'GiCrown',
    category: 'circumstance',
    baseWeight: 90,
    exclusiveGroup: 'birth_order',
    description: 'First-born of their family; bore early responsibilities',
    phrase: 'the eldest child',
    dialogueHint: 'Speaks of duties to younger siblings',
  },
  {
    id: 'youngest',
    name: 'Youngest Child',
    icon: 'IoHeart',
    category: 'circumstance',
    baseWeight: 90,
    exclusiveGroup: 'birth_order',
    description: 'Last-born of their family; often indulged or overlooked',
    phrase: 'the youngest child',
    dialogueHint: 'Mentions older siblings',
  },
  {
    id: 'middle_child',
    name: 'Middle Child',
    icon: 'GiFamilyTree',
    category: 'circumstance',
    baseWeight: 70,
    exclusiveGroup: 'birth_order',
    description: 'Neither heir nor baby; learned early to go unnoticed',
    phrase: 'a middle child, neither heir nor baby',
    dialogueHint: 'Feels overlooked between siblings',
  },
  {
    id: 'only_survivor',
    name: 'Only One to Live',
    icon: 'GiBabyFace',
    category: 'circumstance',
    baseWeight: 35,
    // With a third to half of children dead before five, being the sole
    // survivor of a large sibling set was an ordinary fate.
    weight: (ctx) => (ctx.year < 1900 ? 1.4 : 0.3),
    exclusiveGroup: 'birth_order',
    description: 'Of all the children their mother bore, the only one who lived to grow',
    phrase: 'the only one of your siblings to survive childhood',
    foundational: true,
    dialogueHint: 'Names the siblings who died',
  },
  {
    id: 'only_child',
    name: 'Only Child',
    icon: 'GiBabyFace',
    category: 'circumstance',
    baseWeight: 20,
    weight: (ctx) => (ctx.year > 1900 ? 3 : 1),
    exclusiveGroup: 'birth_order',
    description: 'Grew up without brothers or sisters, which the neighbors thought strange',
    phrase: 'an only child',
    dialogueHint: 'Has no siblings to speak of',
  },
  {
    id: 'twin',
    name: 'Twin',
    icon: 'IoPeople',
    category: 'circumstance',
    // Roughly 12 twin births per thousand; markedly higher in West Africa.
    baseWeight: 12,
    weight: (ctx) => (inZone(ctx, 'SUB_SAHARAN_AFRICAN') ? 1.8 : 1),
    description: 'Has a twin sibling who shares their features and often their fate',
    phrase: 'a twin',
    foundational: true,
    dialogueHint: 'Mentions their twin',
  },
  {
    id: 'orphan',
    name: 'Orphan',
    icon: 'IoWarning',
    category: 'circumstance',
    baseWeight: 45,
    weight: (ctx) => (ctx.year < 1900 ? 1.5 : 0.4) * (ctx.age > 25 ? 1.3 : 1),
    description: 'Lost both parents young; raised by extended family or community',
    phrase: 'an orphan',
    foundational: true,
    dialogueHint: 'Never knew their parents',
  },
  {
    id: 'bastard_born',
    name: 'Base-Born',
    icon: 'GiCrossMark',
    category: 'circumstance',
    baseWeight: 28,
    weight: (ctx) => urbanBoost(ctx, 2) * (ctx.year > 1950 ? 0.5 : 1),
    description: 'Born outside marriage, and reminded of it at every turn',
    phrase: 'born out of wedlock',
    foundational: true,
    dialogueHint: 'Is evasive about their father',
  },
  {
    id: 'foundling',
    name: 'Foundling',
    icon: 'GiBabyFace',
    category: 'circumstance',
    baseWeight: 7,
    weight: (ctx) => urbanBoost(ctx, 4) * (ctx.year > 1950 ? 0.3 : 1),
    excludes: ['eldest', 'youngest', 'middle_child', 'only_child', 'only_survivor'],
    description: 'Left at a church door or hospital gate; the name they carry was given, not inherited',
    phrase: 'a foundling, named by strangers',
    foundational: true,
    dialogueHint: 'Does not know their own parentage',
  },
  {
    id: 'raised_by_kin',
    name: 'Raised by Kin',
    icon: 'GiFamilyTree',
    category: 'circumstance',
    baseWeight: 30,
    weight: (ctx) => (ctx.year < 1900 ? 1.4 : 0.7),
    excludes: ['orphan'],
    description: 'Handed to an aunt or grandmother young, for reasons never fully explained',
    phrase: 'raised by relatives rather than your parents',
    dialogueHint: 'Speaks of the aunt who raised them',
  },
  {
    id: 'buried_children',
    name: 'Has Buried Children',
    icon: 'GiDeathSkull',
    category: 'circumstance',
    baseWeight: 55,
    minAge: 26,
    weight: (ctx) => (ctx.year < 1900 ? 1.5 : 0.25)
      * (ctx.sex === 'Female' ? 1.4 : 1) * withAge(ctx, 30, 0.4, 3),
    description: 'Has buried at least one child, as most parents of this age and place have',
    phrase: 'a parent who has buried children',
    foundational: true,
    dialogueHint: 'Names a child who died',
  },
  {
    id: 'widowed_young',
    name: 'Widowed Young',
    icon: 'GiRing',
    category: 'circumstance',
    baseWeight: 28,
    minAge: 22,
    weight: (ctx) => (ctx.year < 1900 ? 1.4 : 0.6) * (ctx.sex === 'Female' ? 1.5 : 1),
    description: 'Lost a spouse early and has been managing alone since',
    phrase: 'widowed while still young',
    foundational: true,
    dialogueHint: 'Refers to a late spouse',
  },
  {
    id: 'second_son',
    name: 'Second Son',
    icon: 'GiCrown',
    category: 'circumstance',
    baseWeight: 25,
    sex: 'Male',
    // Being passed over for the land presupposes land that is held and passed
    // down; foraging societies have no such thing to be passed over for.
    weight: (ctx) => (can('heritable_land', ctx) ? 1 : 0)
      * (rich(ctx) ? 3 : 0.5)
      * (inZone(ctx, 'EUROPEAN', 'EAST_ASIAN') ? 1.5 : 1),
    exclusiveGroup: 'birth_order',
    description: 'Born too late to inherit; the land went to a brother and the church or army beckoned',
    phrase: 'a second son with no inheritance',
    foundational: true,
    dialogueHint: 'Speaks bitterly of an elder brother',
  },

  // =========================================================================
  // RUPTURE AND STATUS
  // =========================================================================
  {
    id: 'exile',
    name: 'Exile',
    icon: 'IoCompass',
    category: 'circumstance',
    baseWeight: 10,
    exclusiveGroup: 'rootedness',
    description: 'Driven from their homeland by conflict, crime, or persecution',
    phrase: 'an exile',
    foundational: true,
    dialogueHint: 'Speaks wistfully of distant lands',
  },
  {
    id: 'never_left',
    name: 'Never Left the Parish',
    icon: 'GiTrail',
    category: 'circumstance',
    baseWeight: 90,
    // Before cheap transport, most people died within a day's walk of birth.
    weight: (ctx) => ramp(ctx.year, -3000, 1, 1800, 1950) * (ctx.urban ? 0.6 : 1.4),
    exclusiveGroup: 'rootedness',
    excludes: ['wanderer', 'exile', 'polyglot'],
    description: 'Has never in their life been further than a day\'s walk from where they were born',
    phrase: 'someone who has never left the district of your birth',
    dialogueHint: 'Has no idea what lies beyond the next valley',
  },
  {
    id: 'wanderer',
    name: 'Wanderer',
    icon: 'IoCompass',
    category: 'circumstance',
    baseWeight: 22,
    exclusiveGroup: 'rootedness',
    description: 'Has traveled far from birthplace; never settles in one place long',
    phrase: 'a wanderer',
    dialogueHint: 'Speaks of distant places',
  },
  {
    id: 'foreigner',
    name: 'A Stranger Here',
    icon: 'IoAirplane',
    category: 'circumstance',
    baseWeight: 18,
    weight: (ctx) => (place(ctx, ...PORTS) ? 2.5 : 1) * urbanBoost(ctx, 1.6),
    exclusiveGroup: 'rootedness',
    description: 'Came from elsewhere and is still marked by it in speech and manner',
    phrase: 'a foreigner here',
    foundational: true,
    dialogueHint: 'Speaks with a foreign accent',
  },
  {
    id: 'veteran',
    name: 'War Veteran',
    icon: 'GiCrossedSwords',
    category: 'circumstance',
    baseWeight: 8,
    minAge: 20,
    // Armies were male almost everywhere, and 0.3 for a woman was far too
    // generous — it put a wet nurse of eighteen in the ranks. The exceptions
    // are real and specific rather than general: the Dahomean ahosi, the
    // steppe and Scythian burials with weapons, and any woman whose trade is
    // arms, who is a soldier by the same test as a man.
    weight: (ctx) => {
      const soldier = job(ctx, 'soldier', 'merc', 'guard', 'sailor', 'warrior', 'cavalry');
      const womenBoreArms = place(ctx, 'dahomey', 'abomey', 'scythia', 'sarmat', 'steppe', 'mongol');
      const bySex = ctx.sex === 'Male' ? 4
        : soldier || womenBoreArms ? 2
          : 0.03;
      // Veterans accumulate: a man of sixty has had four decades of wars to be
      // caught by, and a man of twenty has had one.
      return bySex * (soldier ? 8 : 1) * withAge(ctx, 25, 0.25, 2.5);
    },
    description: 'Fought in past wars or conflicts; carries the memories of battle',
    phrase: 'a veteran of war',
    foundational: true,
    dialogueHint: 'Speaks of past battles',
  },
  {
    id: 'survivor',
    name: 'Survivor',
    icon: 'GiShield',
    category: 'circumstance',
    baseWeight: 18,
    // The old condition required a stat named `endurance`, which does not
    // exist, so this attribute was unreachable.
    weight: (_ctx, char) => ((char as any).health < 50 ? 2 : 1),
    description: 'Endured famine, plague, or war that killed many others',
    phrase: 'a hardened survivor',
    dialogueHint: 'Has seen hard times',
  },
  {
    id: 'plague_survivor',
    name: 'Plague Survivor',
    icon: 'GiVirus',
    category: 'circumstance',
    baseWeight: 3,
    weight: (ctx) => (inZone(ctx, ...OLD_WORLD) && ctx.year > 1340 && ctx.year < 1730 ? 20
      : ctx.year > 1855 && ctx.year < 1960 && inZone(ctx, 'SOUTH_ASIAN', 'EAST_ASIAN') ? 12 : 0.4),
    description: 'Took the plague and lived, which almost no one does, and is regarded strangely for it',
    phrase: 'one of the few who took the plague and lived',
    foundational: true,
    dialogueHint: 'Bears the scars where the buboes were cut',
  },
  {
    id: 'famine_survivor',
    name: 'Famine Survivor',
    icon: 'GiWheat',
    category: 'circumstance',
    baseWeight: 12,
    weight: (ctx) => {
      if (place(ctx, 'ireland') && ctx.year > 1845 && ctx.year < 1900) return 20;
      if (place(ctx, 'bengal', 'india') && ctx.year > 1769) return 6;
      if (inZone(ctx, 'EAST_ASIAN') && ctx.year > 1870 && ctx.year < 1965) return 5;
      return ctx.year < 1900 ? 1.5 : 0.5;
    },
    description: 'Lived through a hunger that emptied the district, and has never eaten carelessly since',
    phrase: 'a survivor of famine',
    foundational: true,
    dialogueHint: 'Cannot bear to see food wasted',
  },
  {
    id: 'shipwrecked',
    name: 'Shipwrecked',
    icon: 'GiShipWheel',
    category: 'circumstance',
    baseWeight: 1,
    weight: (ctx) => (job(ctx, 'sailor', 'fish', 'merchant', 'boat') ? 30 : 1)
      * (place(ctx, ...PORTS) ? 3 : 1),
    description: 'Survived a wreck that took the rest of the ship\'s company',
    phrase: 'a survivor of shipwreck',
    foundational: true,
    dialogueHint: 'Will not speak of the wreck directly',
  },
  {
    id: 'former_slave',
    name: 'Formerly Enslaved',
    icon: 'GiHandcuffs',
    category: 'circumstance',
    baseWeight: 2,
    weight: (ctx) => {
      // Manumission and self-purchase were routine in the Roman and Islamic
      // worlds; the Atlantic system produced a large freed population too.
      if (inZone(ctx, 'MENA') && ctx.year < 1900) return 18;
      if (inZone(ctx, 'EUROPEAN') && ctx.year < 500) return 20;
      if (inZone(ctx, 'SUB_SAHARAN_AFRICAN') && ctx.year > 1450 && ctx.year < 1920) return 14;
      if (inZone(ctx, 'NORTH_AMERICAN_COLONIAL', 'SOUTH_AMERICAN') && ctx.year > 1520 && ctx.year < 1900) return 16;
      if (ctx.year < 1400) return 4;
      return 0.15;
    },
    description: 'Once enslaved but gained freedom; bears the scars of bondage',
    phrase: 'formerly enslaved',
    foundational: true,
    dialogueHint: 'Speaks of their time in bondage',
  },
  {
    id: 'indentured',
    name: 'Served an Indenture',
    icon: 'GiPadlock',
    category: 'circumstance',
    baseWeight: 4,
    weight: (ctx) => (inZone(ctx, 'NORTH_AMERICAN_COLONIAL') && ctx.year > 1607 && ctx.year < 1800 ? 20
      : ctx.year > 1830 && ctx.year < 1920 && inZone(ctx, 'SOUTH_ASIAN', 'EAST_ASIAN') ? 10 : 0.5),
    description: 'Crossed an ocean against a term of years, and has only lately worked it off',
    phrase: 'one who crossed the sea under indenture',
    foundational: true,
    dialogueHint: 'Counts the years of their term',
  },
  {
    id: 'impressed',
    name: 'Taken by the Press',
    icon: 'GiShipWheel',
    category: 'circumstance',
    // The press gang was a legal instrument, not a story: in wartime it took
    // men out of taverns and off merchant decks in every English port, and
    // took some of them for years.
    baseWeight: 6,
    sex: 'Male',
    minAge: 18,
    yearRange: [1650, 1815],
    weight: (ctx) => {
      if (!inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL')) return 0;
      // Inland was not out of reach — the gangs worked the river towns and the
      // roads to them — but it was very much safer.
      if (!place(ctx, ...PORTS, 'coast', 'harbor', 'harbour', 'wapping', 'deptford', 'portsmouth', 'plymouth')) return 0.4;
      return job(ctx, 'sailor', 'fish', 'water', 'dock', 'ship') ? 6 : 1.5;
    },
    description: 'Was taken off the street by a press gang and served a war they never volunteered for',
    phrase: 'taken by the press gang and made to serve',
    foundational: true,
    dialogueHint: 'Watches the door in a strange tavern',
  },
  {
    id: 'excommunicate',
    name: 'Under the Ban',
    icon: 'GiCrossMark',
    category: 'spiritual',
    // Excommunication, herem, or the equivalent: not damnation so much as
    // social death. Nobody may eat with them, trade with them, or bury them.
    baseWeight: 2,
    minAge: 20,
    weight: (ctx) => (inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL', 'SOUTH_AMERICAN')
      && ctx.year > 400 && ctx.year < 1850 ? 1 : 0.15),
    excludes: ['devout', 'tonsured', 'pilgrim'],
    description: 'Cut off from the congregation; neighbors who fear the penalty will not eat with them',
    phrase: 'cut off from the congregation',
    foundational: true,
    dialogueHint: 'Expects to be refused before they ask',
  },
  {
    id: 'bonded_for_debt',
    name: 'Bonded for Debt',
    icon: 'GiHandcuffs',
    category: 'circumstance',
    // The commonest unfreedom in most of the world, and the least remarked on:
    // a debt that outlives the year it was borrowed in and takes the labour of
    // whoever is at hand until it is called settled.
    baseWeight: 12,
    minAge: 16,
    weight: (ctx) => (poor(ctx) ? 2 : 0.15)
      * (ctx.year < 1900 ? 1 : 0.4)
      * (ctx.urban ? 0.8 : 1.3),
    excludes: ['generous'],
    description: 'Works against a debt that has not shrunk in years, on terms set by the lender',
    phrase: 'working against a debt that never shrinks',
    dialogueHint: 'Reckons every sum against what is owed',
  },
  {
    id: 'serf_born',
    name: 'Born to the Land',
    icon: 'GiWheat',
    category: 'circumstance',
    baseWeight: 20,
    weight: (ctx) => {
      if (!can('heritable_land', ctx)) return 0;
      if (!inZone(ctx, 'EUROPEAN')) return 0.1;
      if (place(ctx, 'russia', 'poland', 'hungar', 'prussia', 'bohemia', 'ukrain')) {
        return ctx.year > 1500 && ctx.year < 1865 ? 8 : 2;
      }
      return ramp(ctx.year, 800, 1000, 1400, 1700) * 4;
    },
    description: 'Born bound to an estate, owing labor days they still count in their head',
    phrase: 'born bound to the land',
    foundational: true,
    dialogueHint: 'Reckons time in labor days owed',
  },
  {
    id: 'runaway_apprentice',
    name: 'Runaway Apprentice',
    icon: 'GiHammerNails',
    category: 'circumstance',
    baseWeight: 5,
    minAge: 15,
    // Girls were bound apprentice too — to mantua-makers, milliners and silk
    // throwsters — but formal indenture was overwhelmingly a boy's contract.
    weight: (ctx) => ramp(ctx.year, 1200, 1400, 1850, 1920) * urbanBoost(ctx, 2.5)
      * (ctx.sex === 'Male' ? 1 : 0.2),
    description: 'Broke an indenture to a master and has been looking over one shoulder since',
    phrase: 'a runaway from your apprenticeship',
    foundational: true,
    dialogueHint: 'Is vague about where they trained',
  },
  {
    id: 'branded',
    name: 'Branded',
    icon: 'GiPrisoner',
    category: 'circumstance',
    baseWeight: 1.5,
    weight: (ctx) => ramp(ctx.year, -500, 1, 1780, 1880) * 2,
    description: 'Bears a letter burned into the hand or cheek by a court, and cannot outrun it',
    phrase: 'branded by a court',
    foundational: true,
    dialogueHint: 'Keeps the marked hand covered',
  },
  {
    id: 'convert',
    name: 'A Convert',
    icon: 'FaCross',
    category: 'spiritual',
    baseWeight: 12,
    description: 'Changed faith in adulthood, and is fully trusted by neither side',
    phrase: 'a convert, trusted by neither side',
    foundational: true,
    dialogueHint: 'Is careful about which prayers they know',
  },
  {
    id: 'pilgrim',
    name: 'Has Made the Pilgrimage',
    icon: 'GiFootprint',
    category: 'spiritual',
    baseWeight: 10,
    minAge: 20,
    weight: (ctx) => (inZone(ctx, 'MENA') ? 5 : 1)
      * (inZone(ctx, 'SOUTH_ASIAN') ? 4 : 1)
      * (inZone(ctx, 'EUROPEAN') && ctx.year > 900 && ctx.year < 1600 ? 3 : 1)
      * (rich(ctx) ? 2 : 0.7),
    description: 'Completed the great pilgrimage of their faith and is addressed differently for it',
    phrase: 'one who has completed the great pilgrimage',
    foundational: true,
    dialogueHint: 'Is addressed by a pilgrim\'s title',
  },

  // =========================================================================
  // SKILL
  // =========================================================================
  {
    id: 'skilled_hands',
    name: 'Skilled Hands',
    icon: 'IoHammer',
    category: 'skill',
    baseWeight: 25,
    weight: (ctx) => (job(ctx, 'carpenter', 'smith', 'joiner', 'mason', 'jewel', 'watch', 'cooper', 'weav') ? 4 : 1),
    description: 'Exceptional manual dexterity; crafts with precision and care',
    phrase: 'skilled with your hands',
    dialogueHint: 'Works with their hands',
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    icon: 'FaScroll',
    category: 'skill',
    baseWeight: 25,
    weight: (ctx) => (ctx.year < 1850 ? 1.5 : 1),
    description: 'Gifted at weaving tales and keeping oral traditions alive',
    phrase: 'a storyteller',
    dialogueHint: 'Tells engaging stories',
  },
  {
    id: 'healer',
    name: 'Healer',
    icon: 'IoMedkit',
    category: 'skill',
    baseWeight: 18,
    weight: (ctx) => (job(ctx, 'physician', 'apothec', 'barber', 'midwife', 'herb', 'surgeon') ? 8 : 1),
    description: 'Knowledge of herbs, remedies, and treatment of injuries',
    phrase: 'a skilled healer',
    dialogueHint: 'Knows healing arts',
  },
  {
    id: 'herbalist',
    name: 'Knows the Herbs',
    icon: 'GiHerbsBundle',
    category: 'skill',
    baseWeight: 20,
    weight: (ctx) => (ctx.sex === 'Female' ? 1.6 : 1) * (ctx.urban ? 0.6 : 1.4),
    description: 'Knows which plants of this district heal, which purge, and which kill',
    phrase: 'versed in the local herbs',
    dialogueHint: 'Names plants and their uses',
  },
  {
    id: 'midwife_skill',
    name: 'Has Caught Babies',
    icon: 'GiBabyFace',
    category: 'skill',
    baseWeight: 14,
    sex: 'Female',
    minAge: 25,
    description: 'Has attended enough births that the street sends for her before the doctor',
    phrase: 'one the neighbors send for at a birth',
    dialogueHint: 'Speaks with authority about childbirth',
  },
  {
    id: 'singer',
    name: 'Singer',
    icon: 'IoMusicalNotes',
    category: 'skill',
    baseWeight: 28,
    description: 'Possesses a beautiful voice; often called upon to sing',
    phrase: 'blessed with a fine singing voice',
    dialogueHint: 'Has a melodious voice',
  },
  {
    id: 'musician',
    name: 'Musician',
    icon: 'GiMusicalNotes',
    category: 'skill',
    baseWeight: 20,
    description: 'Plays an instrument well enough to be asked for at weddings and wakes',
    phrase: 'a musician',
    dialogueHint: 'Mentions where they are playing next',
  },
  {
    id: 'navigator',
    name: 'Navigator',
    icon: 'IoCompass',
    category: 'skill',
    baseWeight: 12,
    weight: (ctx) => (job(ctx, 'sailor', 'pilot', 'fish', 'caravan', 'guide') ? 8 : 1)
      * (inZone(ctx, 'OCEANIA') ? 4 : 1)
      // Deep-water and caravan navigation were closed to women nearly everywhere.
      * (ctx.sex === 'Male' ? 1 : 0.15),
    description: 'Reads stars and landmarks; rarely loses their way',
    phrase: 'able to find your way by the stars',
    dialogueHint: 'Never gets lost',
  },
  {
    id: 'weather_sense',
    name: 'Weather Sense',
    icon: 'IoUmbrella',
    category: 'skill',
    baseWeight: 22,
    weight: (ctx) => (job(ctx, 'sailor', 'farm', 'fish', 'shepherd', 'drover') ? 3.5 : 1),
    description: 'Reads the coming weather from sky, wind and the behavior of animals',
    phrase: 'able to read the coming weather',
    dialogueHint: 'Predicts the weather unprompted',
  },
  {
    id: 'can_swim',
    name: 'Can Swim',
    icon: 'IoWater',
    category: 'skill',
    baseWeight: 25,
    // A genuine minority skill in much of premodern Europe, and near-universal
    // across Oceania and the great river cultures.
    weight: (ctx) => (inZone(ctx, 'OCEANIA') ? 12
      : inZone(ctx, 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN') ? 3
      : ctx.year > 1900 ? 4 : 1)
      * (place(ctx, 'coast', 'island', 'river', 'nile', 'ganges', 'niger') ? 2 : 1),
    description: 'Swims confidently, which most of their neighbors cannot do at all',
    phrase: 'able to swim, unlike most around you',
    dialogueHint: 'Is unbothered by deep water',
  },
  {
    id: 'rides_well',
    name: 'Fine Horseman',
    icon: 'GiHorseHead',
    category: 'skill',
    baseWeight: 20,
    weight: (ctx) => (rich(ctx) ? 5 : poor(ctx) ? 0.25 : 1)
      // On the steppe women rode as a matter of course; in settled societies
      // riding well was a man's accomplishment and an expensive one.
      * (place(ctx, 'steppe', 'mongol', 'kazakh', 'arabia', 'hungar', 'pampas', 'plains') ? 8
        : ctx.sex === 'Male' ? 1 : 0.3)
      * (job(ctx, 'cavalry', 'courier', 'drover', 'herd', 'post') ? 4 : 1),
    description: 'Rides as though born to it, in a world where most people walk',
    phrase: 'a fine horseman',
    dialogueHint: 'Judges people by their horses',
  },
  {
    id: 'hunter',
    name: 'Hunter',
    icon: 'GiBowArrow',
    category: 'skill',
    baseWeight: 18,
    // Hunting large game was men's work in the great majority of societies
    // documented, with the Agta and a handful of others as the exceptions that
    // are cited precisely because they are exceptions.
    // The zone, wealth and countryside terms compounded to roughly twelve times
    // base weight and there was no year term at all, which is how a 22-year-old
    // in the Rwanda–Burundi highlands in 2007 — the most densely farmed land in
    // Africa, and long since emptied of game — came back an experienced hunter.
    // Hunting survives after 1900 as a livelihood in forest and frontier
    // country and as recreation for the rich; as an ordinary skill of ordinary
    // people it does not.
    weight: (ctx) => (inZone(ctx, 'NORTH_AMERICAN_PRE_COLUMBIAN', 'SUB_SAHARAN_AFRICAN', 'OCEANIA') ? 4 : 1)
      * (ctx.urban ? 0.3 : 1.5) * (rich(ctx) ? 2 : 1)
      * (ctx.sex === 'Male' ? 1 : 0.2)
      * (ctx.year < 1900 ? 1
        : /forest|rainforest|amazon|congo|taiga|siberia|arctic|subarctic|tundra|outback|desert|savanna|highlands of new guinea|papua|borneo|kalahari|okavango/.test(ctx.placeLower) ? 0.6
        : 0.12),
    description: 'Reads tracks and takes game where others would go home empty',
    phrase: 'an experienced hunter',
    dialogueHint: 'Talks about tracking and game',
  },
  {
    id: 'bee_keeper',
    name: 'Keeps Bees',
    icon: 'GiBeehive',
    category: 'skill',
    baseWeight: 8,
    weight: (ctx) => (ctx.urban ? 0.4 : 1.6),
    description: 'Keeps hives and is unbothered by stings; talks to the bees at every death in the house',
    phrase: 'a keeper of bees',
    dialogueHint: 'Speaks about their hives',
  },
  {
    id: 'water_diviner',
    name: 'Water-Diviner',
    icon: 'GiWaterDrop',
    category: 'skill',
    baseWeight: 5,
    weight: (ctx) => (ctx.urban ? 0.4 : 1.8),
    description: 'Is sent for when a well must be sited, and has been right often enough to keep the trade',
    phrase: 'one who is sent for to find water',
    dialogueHint: 'Speaks of the twitch of the rod',
  },
  {
    id: 'knows_the_roads',
    name: 'Knows the Roads',
    icon: 'GiTrail',
    category: 'skill',
    baseWeight: 15,
    weight: (ctx) => (job(ctx, 'carter', 'pedlar', 'peddler', 'drover', 'courier', 'merchant', 'guide') ? 6 : 1),
    description: 'Carries the roads, fords and safe inns of a whole region in their head',
    phrase: 'one who carries the roads of the region in your head',
    dialogueHint: 'Gives precise directions to distant places',
  },
  {
    id: 'fine_cook',
    name: 'Fine Cook',
    icon: 'GiCookingPot',
    category: 'skill',
    baseWeight: 20,
    weight: (ctx) => (job(ctx, 'cook', 'inn', 'tavern', 'baker') ? 6 : 1),
    description: 'Can make a feast out of very little, and is asked to at every gathering',
    phrase: 'a fine cook',
    dialogueHint: 'Discusses ingredients with precision',
  },

  // =========================================================================
  // THE GREAT RARITIES
  // =========================================================================
  //
  // Conditions rare enough that a person carrying one was remarked on, and in
  // several cases remarked on in ways the period had a specific word for. Two
  // rules held throughout:
  //
  // The prevalence sets the tier, not the drama. Synaesthesia is startling and
  // affects perhaps four people in a hundred, so it reads as merely seldom
  // seen; congenital analgesia is barely describable and affects fewer than one
  // in a million, so it is the rarest thing in the file. Getting this
  // backwards would make the
  // rarity badge lie, and the badge is the one number on the card that is doing
  // arithmetic rather than description.
  //
  // Where a condition clusters somewhere real, it clusters here too — the same
  // principle already applied to albinism among the Kuna. Achromatopsia is one
  // in thirty thousand almost everywhere and roughly one in twelve on Pingelap,
  // and absolute pitch is many times commoner among speakers of tone languages.
  // Those are not decorations; they are the whole reason a place-aware
  // generator is worth having.

  {
    id: 'born_with_caul',
    name: 'Born with a Caul',
    icon: 'GiBabyFace',
    category: 'spiritual',
    baseWeight: 1.0,
    // Under one birth in a thousand, and almost every European tradition read
    // it as proof against drowning. Midwives dried the membrane and sold it;
    // sailors paid well. Commoner as a *known* fact where that market existed.
    weight: (ctx) => (ctx.year < 1900 ? (place(ctx, 'coast', 'port', 'harbor', 'harbour', 'sea', 'island') ? 2.5 : 1) : 0.3),
    description: 'Born with the birth-caul over the face, which midwives dried and kept as proof against drowning',
    phrase: 'born with the caul still over their face',
    foundational: true,
    dialogueHint: 'Mentions the caul when the talk turns to water',
  },
  {
    id: 'witch_teat',
    name: 'Supernumerary Nipple',
    icon: 'IoWarning',
    category: 'physical',
    baseWeight: 7,
    // Common enough to be unremarkable in most of history and lethal in one
    // particular window: searchers stripped and examined the accused for
    // exactly this, and finding it was held to be evidence.
    weight: (ctx) => ((ctx.year > 1480 && ctx.year < 1740
      && inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL')) ? 1.6 : 1),
    description: 'A small extra nipple below the breast — unremarkable in most centuries, and evidence in a few',
    phrase: 'marked with a small extra nipple',
    foundational: true,
    dialogueHint: 'Is careful who sees them undressed',
  },
  {
    id: 'never_took_pox',
    name: 'Never Took the Pox',
    icon: 'GiVirus',
    category: 'condition',
    baseWeight: 5,
    excludes: ['pox_scarred'],
    minAge: 25,
    // Only remarkable while smallpox is universal: nursing the sick through
    // repeated visitations and never taking it made a person quietly valuable,
    // and they were often the one sent in.
    weight: (ctx) => ((ctx.year > 900 && ctx.year < 1900) ? 1 : 0.15),
    description: 'Nursed the sick through visitation after visitation and never once took the smallpox',
    phrase: 'never once touched by the smallpox',
    dialogueHint: 'Is the one sent into infected houses',
  },
  {
    id: 'born_under_comet',
    name: 'Born Under the Comet',
    icon: 'IoStar',
    category: 'spiritual',
    baseWeight: 40,
    // Dated against the real returns of Halley's comet rather than sprinkled at
    // random, so this is either true of a persona's birth year or it is not.
    // Every society that kept records noticed these and most of them wrote down
    // what they thought it meant.
    weight: (ctx) => {
      const birth = ctx.year - ctx.age;
      return HALLEY_RETURNS.some(r => Math.abs(birth - r) <= 1) ? 1 : 0;
    },
    description: 'Born in the year the hairy star hung over the district, and never allowed to forget it',
    phrase: 'born in the year the comet came',
    foundational: true,
    dialogueHint: 'Was told from childhood what their birth year portended',
  },
  {
    id: 'tetrachromat',
    name: 'Sees Colors Others Cannot',
    icon: 'IoEye',
    category: 'physical',
    baseWeight: 1.2,
    excludes: ['blind', 'color_blind'],
    // Carried on the X chromosome, so functionally never in men. Only legible
    // as a trait in work where colour is judged for a living — a dyer who can
    // see a difference the master swears is not there.
    weight: (ctx) => (ctx.sex !== 'Female' ? 0
      : job(ctx, 'dyer', 'weaver', 'painter', 'silk', 'illuminator', 'embroider') ? 4 : 1),
    description: 'Distinguishes shades in cloth and dye that other people insist are the same color',
    phrase: 'able to see colors other people swear are identical',
    dialogueHint: 'Argues about shades nobody else can see',
  },
  {
    id: 'no_pain',
    name: 'Feels No Pain',
    icon: 'GiHandBandage',
    category: 'condition',
    baseWeight: 0.15,
    // The rarest entry in the file, and it should be: fewer than one in a
    // million. Historically it shortens a life rather than protecting one —
    // untreated injuries, joints destroyed young, burns not noticed.
    description: 'Has never felt pain; the injuries are found later, by looking',
    phrase: 'unable to feel pain at all',
    foundational: true,
    dialogueHint: 'Checks their own body for damage by eye',
  },
  {
    id: 'lightning_struck',
    name: 'Struck by Lightning and Lived',
    icon: 'FaBolt',
    category: 'circumstance',
    // Around one person in ten thousand over a lifetime, most of whom lived,
    // and every one of whom was written about. The mark it leaves is a
    // branching scar and, often, an ear that never came back.
    baseWeight: 0.1,
    minAge: 12,
    weight: (ctx) => (job(ctx, 'shepherd', 'farm', 'field', 'herd', 'sailor', 'mason', 'roof', 'bell')
      ? 4 : ctx.urban ? 0.6 : 1.5),
    description: 'Was struck by lightning and got up again; the scar branches like a fern and the ear on that side is gone',
    phrase: 'struck by lightning once, and standing',
    foundational: true,
    dialogueHint: 'Is asked to tell the story at every gathering',
  },
  {
    id: 'absolute_pitch',
    name: 'Perfect Pitch',
    icon: 'IoMusicalNotes',
    category: 'skill',
    baseWeight: 1.4,
    excludes: ['deaf'],
    // Roughly one in ten thousand where speech is not tonal, and many times
    // that where it is — the association with tone languages and with training
    // begun very young is one of the better-attested findings about it.
    weight: (ctx) => {
      const tonal = inZone(ctx, 'EAST_ASIAN', 'SOUTHEAST_ASIAN') ? 8 : 1;
      return tonal * (job(ctx, 'musician', 'singer', 'bell', 'cantor', 'piper', 'chorister') ? 5 : 1);
    },
    description: 'Names any note struck, with nothing to compare it against',
    phrase: 'able to name any note struck cold',
    dialogueHint: 'Names the pitch of ordinary sounds',
  },
  {
    id: 'synaesthete',
    name: 'Tastes Sound, Sees Number',
    icon: 'GiThirdEye',
    category: 'mental',
    baseWeight: 12,
    // Around four in a hundred, so not legendary however strange it sounds.
    // Before there was a word for it, the usual explanations available were
    // visionary or diabolical, which is why the spiritual attributes lean this
    // way in some periods and not others.
    description: 'Sounds arrive with colors attached, and the days of the week have places in the air',
    phrase: 'hearing colors in sounds and seeing the days of the week arranged in the air',
    dialogueHint: 'Describes sounds by their color without noticing',
  },
  {
    id: 'never_forgets_a_day',
    name: 'Forgets Nothing',
    icon: 'GiBrain',
    category: 'mental',
    baseWeight: 0.5,
    excludes: ['forgetful', 'slow_witted'],
    minAge: 16,
    description: 'Can give the weather, the meal and the talk of any day put to them',
    phrase: 'able to recount any day of their life on request',
    dialogueHint: 'Recalls exact dates nobody else remembers',
  },
  {
    id: 'mirrored_within',
    name: 'Mirrored Within',
    icon: 'GiLungs',
    category: 'condition',
    baseWeight: 0.6,
    // One in ten thousand, and — the detail that makes it worth having — almost
    // nobody in history knew it about themselves. It is discovered by a
    // surgeon, a battlefield wound or an autopsy, so it mostly matters at the
    // end of a life rather than during it.
    description: 'Heart on the right, and the rest of the organs likewise reversed; almost certainly nobody knows',
    phrase: 'built with the heart on the wrong side, undiscovered',
    foundational: true,
    dialogueHint: 'Has been told by one confused physician that their heart is on the wrong side',
  },
  {
    id: 'achromatopsia',
    name: 'Sees No Color At All',
    icon: 'IoGlasses',
    category: 'physical',
    baseWeight: 0.5,
    excludes: ['keen_eyed', 'tetrachromat'],
    // One in thirty thousand almost everywhere, and about one in twelve on
    // Pingelap after the typhoon of 1775 cut the island down to a handful of
    // survivors. The same founder-effect logic the albinism entry already uses.
    weight: (ctx) => (place(ctx, 'pingelap', 'pohnpei', 'ponape') ? 400
      : inZone(ctx, 'OCEANIA') && place(ctx, 'micronesi', 'caroline') ? 25 : 1),
    description: 'Sees the world only in light and shade, and cannot bear the noon sun',
    phrase: 'seeing the world wholly without color',
    foundational: true,
    dialogueHint: 'Works at dawn and dusk and shelters at midday',
  },
  {
    id: 'face_blind',
    name: 'Cannot Hold a Face',
    icon: 'FaEyeSlash',
    category: 'mental',
    baseWeight: 8,
    excludes: ['keen_eyed'],
    description: 'Knows people by voice, gait and dress, because the face never stays',
    phrase: 'unable to hold a face in mind from one meeting to the next',
    dialogueHint: 'Greets people by their clothes and their walk',
  },
  {
    id: 'no_minds_eye',
    name: 'No Picture in the Mind',
    icon: 'FaBrain',
    category: 'mental',
    baseWeight: 10,
    excludes: ['dreamer', 'visionary'],
    description: 'Cannot call up an image behind the eyes, and assumed until lately that nobody could',
    phrase: 'unable to picture anything behind the eyes',
    dialogueHint: 'Is baffled by instructions to imagine something',
  },
  {
    id: 'mother_tongue_alone',
    name: 'Last Speaker Here',
    icon: 'GiTalk',
    category: 'cultural',
    baseWeight: 6,
    excludes: ['polyglot'],
    // Overwhelmingly the condition of somebody carried here rather than born
    // here, so the ancestry axis drives it — but not exclusively, because
    // captives, stranded sailors and married-in strangers existed everywhere.
    weight: (_ctx, char) => ((char as { ancestry?: { generation: number } }).ancestry?.generation === 0 ? 25 : 1),
    description: 'Speaks a language that nobody within a hundred miles can answer in',
    phrase: 'the only speaker of their language for a hundred miles',
    dialogueHint: 'Falls silent in their own language when tired',
  },
];

// ---------------------------------------------------------------------------
// Cultural attributes - legible only inside particular traditions and periods.
// These are gated hard: outside their window and zone their weight is zero.
// ---------------------------------------------------------------------------

export const CULTURAL_ATTRIBUTES: EnhancedAttributeBadge[] = [
  // --- Humoral self-understanding: how a European, Islamicate or South Asian
  // person explained their own temperament before the humors gave way.
  {
    id: 'humor_sanguine',
    name: 'Sanguine Humor',
    icon: 'GiHeartPlus',
    category: 'cultural',
    baseWeight: 45,
    weight: humoralWeight,
    exclusiveGroup: 'humor',
    description: 'Reckoned sanguine by complexion: hot, moist, hopeful, and quick to love',
    phrase: 'of a sanguine complexion',
    dialogueHint: 'Explains their moods by their humors',
  },
  {
    id: 'humor_choleric',
    name: 'Choleric Humor',
    icon: 'IoFlame',
    category: 'cultural',
    baseWeight: 40,
    weight: humoralWeight,
    exclusiveGroup: 'humor',
    description: 'Reckoned choleric: hot, dry, and governed by an excess of yellow bile',
    phrase: 'of a choleric humor',
    dialogueHint: 'Blames their bile for their temper',
  },
  {
    id: 'humor_phlegmatic',
    name: 'Phlegmatic Humor',
    icon: 'IoSnow',
    category: 'cultural',
    baseWeight: 40,
    weight: humoralWeight,
    exclusiveGroup: 'humor',
    description: 'Reckoned phlegmatic: cold, moist, slow to anger and slower to act',
    phrase: 'of a phlegmatic humor',
    dialogueHint: 'Is unhurried about everything',
  },
  {
    id: 'humor_melancholic',
    name: 'Melancholic Humor',
    icon: 'GiSandsOfTime',
    category: 'cultural',
    baseWeight: 40,
    weight: humoralWeight,
    exclusiveGroup: 'humor',
    excludes: ['melancholic', 'cheerful'],
    description: 'Reckoned melancholic: cold, dry, and burdened with black bile — studious and sad',
    phrase: 'burdened with black bile, as the physicians say',
    foundational: true,
    dialogueHint: 'Attributes their sadness to black bile',
  },

  // --- Practices that mark the body within a specific tradition.
  {
    id: 'bound_feet',
    name: 'Bound Feet',
    icon: 'GiBallerinaShoes',
    category: 'cultural',
    baseWeight: 200,
    sex: 'Female',
    weight: (ctx) => {
      if (!inZone(ctx, 'EAST_ASIAN')) return 0;
      if (place(ctx, 'japan', 'korea', 'mongol', 'manchu')) return 0;
      // Near-universal among Han gentry, far less so among laboring women.
      return ramp(ctx.year, 1050, 1300, 1900, 1949) * (rich(ctx) ? 1.6 : poor(ctx) ? 0.4 : 1);
    },
    exclusiveGroup: 'mobility',
    excludes: ['athletic', 'wanderer', 'rides_well'],
    description: 'Feet bound in childhood; walks the short swaying steps that were the point of it',
    phrase: 'one whose feet were bound in childhood',
    foundational: true,
    dialogueHint: 'Walks slowly and sits whenever possible',
  },
  {
    id: 'queue_worn',
    name: 'Wears the Queue',
    icon: 'GiSewingString',
    category: 'cultural',
    baseWeight: 200,
    sex: 'Male',
    weight: (ctx) => (inZone(ctx, 'EAST_ASIAN') && place(ctx, 'china', 'qing', 'peking', 'beijing', 'canton', 'guangzhou', 'nanjing', 'shanghai')
      ? ramp(ctx.year, 1644, 1650, 1900, 1912) : 0),
    description: 'Forehead shaved and hair in the queue, as the dynasty requires on pain of death',
    phrase: 'wearing the queue as the dynasty commands',
    dialogueHint: 'Is conscious of what the queue signifies',
  },
  {
    id: 'kin_tattoos',
    name: 'Kin Tattoos',
    icon: 'GiSpiralShell',
    category: 'cultural',
    baseWeight: 180,
    weight: (ctx) => (inZone(ctx, 'OCEANIA') ? 1
      : inZone(ctx, 'NORTH_AMERICAN_PRE_COLUMBIAN', 'SOUTH_AMERICAN') ? 0.5
      : place(ctx, 'ainu', 'hokkaido', 'thrac', 'pict', 'scyth') ? 0.6 : 0),
    description: 'Tattooed with the marks of lineage and rank, read fluently by anyone from home',
    phrase: 'tattooed with the marks of your lineage',
    foundational: true,
    dialogueHint: 'Explains what each mark records',
  },
  {
    id: 'scarified',
    name: 'Scarified',
    icon: 'GiScarWound',
    category: 'cultural',
    baseWeight: 160,
    weight: (ctx) => (inZone(ctx, 'SUB_SAHARAN_AFRICAN') ? 1 : 0),
    description: 'Cheeks marked in the pattern of their people, cut at the age of initiation',
    phrase: 'marked with the scars of your people',
    foundational: true,
    dialogueHint: 'Can name their people from their marks',
  },
  {
    id: 'caste_marked',
    name: 'Marked by Caste',
    icon: 'GiThreeLeaves',
    category: 'cultural',
    baseWeight: 120,
    weight: (ctx) => (inZone(ctx, 'SOUTH_ASIAN') ? 1 : 0),
    description: 'Every stranger reads their caste before their name, and orders the encounter by it',
    phrase: 'read by strangers first of all by your caste',
    foundational: true,
    dialogueHint: 'Is careful about whom they eat with',
  },
  {
    id: 'tonsured',
    name: 'Tonsured',
    icon: 'FaCross',
    category: 'cultural',
    baseWeight: 60,
    sex: 'Male',
    weight: (ctx) => (job(ctx, 'monk', 'priest', 'clerk', 'friar', 'abbot', 'canon')
      && inZone(ctx, 'EUROPEAN') && ctx.year > 500 && ctx.year < 1970 ? 1 : 0),
    description: 'Crown shaved in the clerical tonsure; the mark cannot be set aside casually',
    phrase: 'tonsured in the clerical manner',
    dialogueHint: 'Is bound by clerical discipline',
  },
  {
    id: 'hafiz',
    name: 'Keeper of the Text',
    icon: 'GiOpenBook',
    category: 'cultural',
    baseWeight: 12,
    weight: (ctx) => (inZone(ctx, 'MENA') ? 1
      : inZone(ctx, 'SOUTH_ASIAN', 'SUB_SAHARAN_AFRICAN') ? 0.5 : 0)
      // Women memorized and taught the text, but the public title went to men.
      * (ctx.sex === 'Male' ? 1 : 0.3),
    exclusiveGroup: 'memory',
    description: 'Holds the whole of the scripture in memory, and is addressed with the title it earns',
    phrase: 'one who holds the whole scripture in memory',
    foundational: true,
    dialogueHint: 'Quotes scripture from memory at length',
  },
  {
    id: 'guild_sworn',
    name: 'Guild-Sworn',
    icon: 'GiHammerNails',
    category: 'cultural',
    baseWeight: 70,
    minAge: 18,
    weight: (ctx) => (can('guilds', ctx) && inZone(ctx, 'EUROPEAN') && ctx.urban
      && job(ctx, 'smith', 'baker', 'weav', 'carpenter', 'mason', 'tailor', 'cooper', 'butcher', 'gold', 'shoe')
      // Widows kept their husbands' mastership in several crafts, and silk and
      // brewing had women's guilds outright, but the sworn master was a man.
      ? ramp(ctx.year, 1100, 1250, 1750, 1850) * (ctx.sex === 'Male' ? 1 : 0.15) : 0),
    description: 'Sworn to a craft guild, with all the protection and all the restriction that carries',
    phrase: 'sworn to your craft guild',
    dialogueHint: 'Invokes guild rules and privileges',
  },
  {
    id: 'dhimmi',
    name: 'Under the Covenant',
    icon: 'GiTiedScroll',
    category: 'cultural',
    baseWeight: 60,
    weight: (ctx) => (inZone(ctx, 'MENA') ? ramp(ctx.year, 640, 700, 1850, 1930) * 0.25 : 0),
    description: 'A protected non-Muslim subject: pays the tax, keeps the faith, accepts the limits',
    phrase: 'a protected subject of another faith, paying the tax it requires',
    foundational: true,
    dialogueHint: 'Is precise about what their status permits',
  },
  {
    id: 'crypto_believer',
    name: 'Secret Believer',
    icon: 'GiPadlock',
    category: 'cultural',
    baseWeight: 2,
    weight: (ctx) => {
      if (place(ctx, 'spain', 'portugal', 'iberia', 'castile', 'aragon', 'lisbon', 'seville', 'toledo')
        && ctx.year > 1391 && ctx.year < 1834) return 25;
      if (place(ctx, 'japan', 'nagasaki', 'kyushu') && ctx.year > 1614 && ctx.year < 1873) return 25;
      return 0.3;
    },
    excludes: ['devout'],
    description: 'Keeps the outward forms of one faith and the private practice of another',
    phrase: 'a secret keeper of a forbidden faith',
    foundational: true,
    dialogueHint: 'Deflects all questions about belief',
  },
  {
    id: 'outcaste',
    name: 'Outcaste',
    icon: 'GiCrossMark',
    category: 'cultural',
    baseWeight: 55,
    weight: (ctx) => (inZone(ctx, 'SOUTH_ASIAN') ? 1
      : place(ctx, 'japan', 'edo', 'kyoto') && ctx.year > 1600 && ctx.year < 1871 ? 0.5 : 0),
    excludes: ['caste_marked'],
    description: 'Born to work others will not touch, and kept at the distance that implies',
    phrase: 'born outside the ordering of castes',
    foundational: true,
    dialogueHint: 'Keeps to the edge of every gathering',
  },
  {
    id: 'betel_chewer',
    name: 'Betel Chewer',
    icon: 'GiCurledLeaf',
    category: 'cultural',
    baseWeight: 180,
    weight: (ctx) => (inZone(ctx, 'SOUTH_ASIAN') ? 1
      : inZone(ctx, 'OCEANIA') ? 0.7
      : place(ctx, 'burma', 'siam', 'malay', 'java', 'sumatra', 'philipp', 'vietnam', 'taiwan') ? 0.9 : 0),
    exclusiveGroup: 'intoxicant',
    description: 'Chews betel constantly; teeth stained red-black and a quid always in the cheek',
    phrase: 'never without a quid of betel',
    dialogueHint: 'Pauses to spit red',
  },
  {
    id: 'khat_chewer',
    name: 'Khat Chewer',
    icon: 'GiCurledLeaf',
    category: 'cultural',
    baseWeight: 150,
    weight: (ctx) => (place(ctx, 'yemen', 'aden', 'ethiop', 'abyssin', 'somal', 'harar', 'djibouti')
      ? ramp(ctx.year, 1300, 1450, 2000, 2000) : 0),
    exclusiveGroup: 'intoxicant',
    description: 'Spends the long afternoon at khat with neighbors, as the day is properly ordered here',
    phrase: 'a keeper of the afternoon khat',
    dialogueHint: 'Structures the day around the chew',
  },
  {
    id: 'coca_chewer',
    name: 'Coca Chewer',
    icon: 'GiThreeLeaves',
    category: 'cultural',
    baseWeight: 160,
    weight: (ctx) => (place(ctx, 'andes', 'peru', 'bolivia', 'cusco', 'cuzco', 'potosi', 'quito', 'inca')
      || (inZone(ctx, 'SOUTH_AMERICAN') && place(ctx, 'highland', 'sierra')) ? 1 : 0),
    exclusiveGroup: 'intoxicant',
    description: 'Chews coca against hunger, cold and altitude, and offers leaves before any journey',
    phrase: 'a chewer of coca against the cold and the height',
    dialogueHint: 'Offers coca leaves as a courtesy',
  },
  {
    id: 'kava_drinker',
    name: 'Kava Drinker',
    icon: 'GiCookingPot',
    category: 'cultural',
    baseWeight: 140,
    weight: (ctx) => (inZone(ctx, 'OCEANIA') ? 1 : 0),
    exclusiveGroup: 'intoxicant',
    description: 'Sits at the kava bowl where matters of consequence are properly settled',
    phrase: 'a regular at the kava bowl',
    dialogueHint: 'Refers decisions to the kava circle',
  },
  {
    id: 'sworn_brother',
    name: 'Sworn Brother',
    icon: 'GiRelationshipBounds',
    category: 'cultural',
    baseWeight: 35,
    minAge: 16,
    weight: (ctx) => (inZone(ctx, 'EAST_ASIAN') ? 1
      : place(ctx, 'balkan', 'serbia', 'montenegro', 'albania', 'greece') ? 0.8
      : inZone(ctx, 'SUB_SAHARAN_AFRICAN') ? 0.4 : 0.1)
      // Sworn sisterhoods are attested, notably the Guangdong silk workers, but
      // the oath-bond was mostly between men.
      * (ctx.sex === 'Male' ? 1 : 0.35),
    description: 'Bound by a sworn brotherhood that outranks most claims of blood',
    phrase: 'bound to a sworn brother',
    foundational: true,
    dialogueHint: 'Invokes an oath-brother\'s claim on them',
  },
  {
    id: 'godparent_web',
    name: 'Godparent Many Times Over',
    icon: 'GiFamilyTree',
    category: 'cultural',
    baseWeight: 45,
    minAge: 25,
    weight: (ctx) => ((inZone(ctx, 'EUROPEAN', 'NORTH_AMERICAN_COLONIAL', 'SOUTH_AMERICAN')
      && ctx.year > 700 && ctx.year < 1950) ? 1 : 0),
    description: 'Godparent to a dozen children of the parish, with the obligations that entangles them in',
    phrase: 'godparent to half the parish',
    dialogueHint: 'Counts obligations to godchildren',
  },
];

// ---------------------------------------------------------------------------
// Applicability
// ---------------------------------------------------------------------------

const ALL_ATTRIBUTES: EnhancedAttributeBadge[] = [
  ...UNIVERSAL_ATTRIBUTES,
  ...CULTURAL_ATTRIBUTES,
];

/** Every defined attribute, universal and cultural. */
export function getAllAttributes(): EnhancedAttributeBadge[] {
  return ALL_ATTRIBUTES;
}

/** Lookup by id, across both pools. */
export function findAttributeById(id: string): EnhancedAttributeBadge | undefined {
  return ALL_ATTRIBUTES.find(attr => attr.id === id);
}

/**
 * Hard gates only. Weighting happens in the badge service, which needs the
 * numbers rather than a yes/no.
 */
export function passesHardGates(
  attr: EnhancedAttributeBadge,
  ctx: AttributeContext
): boolean {
  if (attr.minAge !== undefined && ctx.age < attr.minAge) return false;
  if (attr.maxAge !== undefined && ctx.age > attr.maxAge) return false;
  if (attr.sex && ctx.sex !== attr.sex) return false;
  if (attr.yearRange && (ctx.year < attr.yearRange[0] || ctx.year > attr.yearRange[1])) return false;
  if (attr.requiredZones && (!ctx.culturalZone || !attr.requiredZones.includes(ctx.culturalZone))) return false;
  if (attr.forbiddenZones && ctx.culturalZone && attr.forbiddenZones.includes(ctx.culturalZone)) return false;
  if (attr.requiredGeography && attr.requiredGeography.length > 0) {
    const hit = attr.requiredGeography.some(g => ctx.placeLower.includes(g.toLowerCase()));
    if (!hit) return false;
  }
  if (attr.requiredClass && attr.requiredClass.length > 0) {
    const cls = `${ctx.socialClass ?? ''} ${ctx.wealth ?? ''}`.toLowerCase();
    if (!attr.requiredClass.some(c => cls.includes(c.toLowerCase()))) return false;
  }
  return true;
}

/**
 * Legacy helper, retained for external callers. Returns everything that clears
 * the hard gates and any `condition`, without weighting.
 */
export function getApplicableAttributes(
  character: any,
  year: number,
  geography: string
): EnhancedAttributeBadge[] {
  const ctx: AttributeContext = {
    year,
    age: character?.age ?? 30,
    sex: character?.birthSex ?? (character?.gender === 'Female' ? 'Female' : character?.gender === 'Male' ? 'Male' : 'Other'),
    culturalZone: character?.culturalZone,
    location: geography,
    professionLower: String(character?.profession ?? '').toLowerCase(),
    placeLower: `${geography ?? ''} ${character?.region ?? ''} ${character?.birthplace ?? ''}`.toLowerCase(),
    urban: false,
  };

  return ALL_ATTRIBUTES.filter(attr => {
    if (!passesHardGates(attr, ctx)) return false;
    if (attr.condition) {
      try {
        return attr.condition(character);
      } catch {
        return false;
      }
    }
    return true;
  });
}
