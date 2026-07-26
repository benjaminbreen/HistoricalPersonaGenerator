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

const ARABIC_TEKNONYM = (child: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'Abu' : 'Umm'} ${child}`;

const PLAIN_TEKNONYM = (child: string, gender: 'Male' | 'Female') =>
  `${gender === 'Male' ? 'father' : 'mother'} of ${child}`;

/**
 * Descriptive bynames. Deliberately plain and physical — the kind of thing a
 * neighbour calls you, which is what a byname was before it was a surname.
 *
 * A byname is a claim about the person, so each one has to be earned: the
 * epithet is drawn only from what the persona actually is. Before this, the
 * pool was decorative and a woman called "the One-Eyed" had two good eyes.
 * `earnedEpithets` maps a persona to the bynames their neighbours could
 * plausibly have given them.
 */
const EPITHETS = [
  'the Tall', 'the Short', 'the Elder', 'the Younger', 'the Red', 'the Dark',
  'the Fair', 'the Grey', 'the Swift', 'the Quiet', 'the Lame', 'the One-Eyed',
  'the Left-Handed', 'the Bold', 'the Patient', 'the Scarred', 'the Silent',
  'the Stout', 'the Lean', 'the Restless', 'the Watchful', 'the Wanderer',
];

/** Bynames that require no evidence beyond ordinary variation. */
const UNEARNED_EPITHETS = ['the Elder', 'the Younger', 'the Dark', 'the Fair', 'the Quiet'];

/** Attribute ids that entitle a persona to a given byname. */
const EPITHET_EVIDENCE: Record<string, string[]> = {
  'the Tall': ['towering'],
  'the Short': ['diminutive', 'bound_feet'],
  'the Lame': ['lame', 'clubfoot', 'bowed_legs', 'hunchback'],
  'the One-Eyed': ['blind', 'disfigured', 'trachoma'],
  'the Scarred': ['scarred', 'burn_scarred', 'pox_scarred', 'disfigured', 'scarified'],
  'the Red': ['red_haired'],
  'the Grey': ['prematurely_gray'],
  'the Left-Handed': ['left_handed'],
  'the Swift': ['athletic'],
  'the Bold': ['brave', 'reckless'],
  'the Patient': ['patient'],
  'the Silent': ['taciturn', 'mute'],
  'the Stout': ['corpulent', 'strong'],
  'the Lean': ['gaunt', 'frail'],
  'the Restless': ['wanderer', 'insomniac', 'reckless'],
  'the Watchful': ['keen_eyed', 'cautious'],
  'the Wanderer': ['wanderer', 'exile', 'foreigner'],
};

export interface EpithetEvidence {
  attributeIds?: string[];
  age?: number;
  heightCm?: number;
  birthSex?: 'Male' | 'Female';
  hairColor?: string;
}

/** Every byname this persona could actually have earned. */
export function earnedEpithets(evidence: EpithetEvidence): string[] {
  const ids = new Set(evidence.attributeIds ?? []);
  const earned = EPITHETS.filter(epithet => {
    if (UNEARNED_EPITHETS.includes(epithet)) return false;
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
 */
export function reconcileEpithet(
  name: string,
  evidence: EpithetEvidence,
  random: () => number = Math.random,
): string {
  const match = EPITHETS.find(epithet => name.endsWith(` ${epithet}`));
  if (!match) return name;
  if (UNEARNED_EPITHETS.includes(match)) return name;

  const stem = name.slice(0, name.length - match.length - 1);
  const earned = earnedEpithets(evidence);
  if (earned.includes(match)) return name;
  if (earned.length > 0) return `${stem} ${earned[Math.floor(random() * earned.length)]}`;
  return `${stem} ${UNEARNED_EPITHETS[Math.floor(random() * UNEARNED_EPITHETS.length)]}`;
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
  if (!descriptive && !teknonymic) return profile;

  const weights = { ...profile.weights };
  let folded = 0;
  if (descriptive && weights.patronymic) { folded += weights.patronymic; delete weights.patronymic; }
  if (teknonymic && weights.teknonym) { folded += weights.teknonym; delete weights.teknonym; }
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
      return { weights: { inherited: 0.88, personal: 0.12 } };

    case 'SOUTH_AMERICAN': {
      if (year >= 1550) return { weights: { inherited: 0.85, personal: 0.15 } };
      return { weights: { personal: 0.5, clan: 0.28, epithet: 0.22 } };
    }

    default:
      return { weights: { personal: 0.5, patronymic: 0.3, epithet: 0.2 }, patronymic: PLAIN_PATRONYMIC };
  }
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
  random: () => number;
}

/** Build a full name in whatever way this culture and period actually built one. */
export function formatPersonalName(input: FormatNameInput): FormattedName {
  const { given, gender, culturalZone, region, year, surnames, malePool, femalePool, occupation, nameKey, random } = input;
  const profile = conventionProfileFor(culturalZone, region, year, nameKey);

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
    case 'epithet':
      return { full: `${given} ${pick(EPITHETS)}`, given, convention };
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
}
