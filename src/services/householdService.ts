/**
 * services/householdService.ts
 *
 * The children a persona has, and which of them are still alive.
 *
 * What was here before drew a single number — `Math.floor(random() * 4)` in the
 * modern era, `random() * 9` before it — and then gave each child a random age.
 * Three things followed from that. Fertility was keyed on era buckets, so 1903
 * in the Horn of Africa was treated like 1995 in Stockholm and came out at 1.07
 * children per adult. Nothing produced a plausible spacing between births, so
 * siblings arrived in the same year by accident. And no child ever died: 1,606
 * generated children, none deceased, in a corpus that is mostly pre-modern.
 *
 * That last one matters most. In a pre-transition regime roughly a quarter of
 * children died before their first birthday and another quarter before
 * adulthood. A family of six living children is not what six births looked
 * like. Leaving it out is not a neutral simplification — it quietly imposes
 * modern childhood on every persona the app has ever produced.
 *
 * So this walks the births rather than drawing a count: a first birth after
 * marriage, then intervals until the fertile span closes, each child then
 * tested against the survivorship curve in demographyService for its own birth
 * year. Twenty births spread over twenty years is what the register looks like;
 * the household is what survived it.
 */

import type { CulturalZone } from '../types/characterData';
import { survivorshipAt } from './demographyService';

export interface BirthRecord {
  sex: 'male' | 'female';
  birthYear: number;
  /** Age now if living; age at death if not. */
  age: number;
  isDeceased: boolean;
  deathYear?: number;
}

export interface HouseholdContext {
  /** The persona. */
  age: number;
  sex: 'male' | 'female';
  currentYear: number;
  /** Age at which this persona married, from the caller's own draw. */
  marriageAge: number;
  /** The spouse's age, which governs the fertile span when the persona is male. */
  spouseAge?: number;
  culturalZone?: CulturalZone;
  wealth?: string;
}

/**
 * When sustained fertility decline began in each zone. Europe and the
 * neo-Europes go first — France from the late eighteenth century, most of the
 * rest from the 1880s — and much of the world only after 1960. Using a single
 * global date is what produced small families in colonial-era Africa.
 */
const TRANSITION_START: Partial<Record<CulturalZone, number>> = {
  EUROPEAN: 1870,
  NORTH_AMERICAN_COLONIAL: 1880,
  EAST_ASIAN: 1950,
  SOUTH_ASIAN: 1965,
  MENA: 1970,
  SOUTH_AMERICAN: 1960,
  SUB_SAHARAN_AFRICAN: 1985,
  OCEANIA: 1950,
  NORTH_AMERICAN_PRE_COLUMBIAN: 1950,
};

const TRANSITION_YEARS = 90;

/** Total births a couple completes, before mortality takes any of them. */
const PRE_TRANSITION_TARGET = 6.4;
const POST_TRANSITION_TARGET = 2.1;

/** Couples who never conceive. Roughly stable across populations. */
const PRIMARY_INFERTILITY = 0.12;

const MENOPAUSE_AGE = 45;
const YOUNGEST_MOTHER = 15;

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** 0 before the decline begins in this zone, 1 once it has run its course. */
function transitionProgress(year: number, zone: CulturalZone | undefined): number {
  const start = (zone && TRANSITION_START[zone]) ?? 1900;
  return clamp01((year - start) / TRANSITION_YEARS);
}

/**
 * Births a couple would complete if the woman survived her whole fertile span.
 * Wealth moves this a little, and in opposite directions either side of the
 * transition: before it, the well-fed bore more; after it, the prosperous were
 * the first to stop.
 */
function completedFertility(year: number, zone: CulturalZone | undefined, wealth: string | undefined): number {
  const t = transitionProgress(year, zone);
  const base = PRE_TRANSITION_TARGET * (1 - t) + POST_TRANSITION_TARGET * t;
  const comfortable = wealth === 'wealthy' || wealth === 'comfortable';
  const poor = wealth === 'poor' || wealth === 'destitute';
  if (comfortable) return base * (1 - t) * 1.08 + base * t * 0.82;
  if (poor) return base * (1 - t) * 0.92 + base * t * 1.1;
  return base;
}

/**
 * Whether a child born in `birthYear` is still alive at `age`, and if not, how
 * old they were. The curve is the app's own survivorship table, so a child born
 * in 1200 faces the quarter-in-the-first-year risk and one born in 1975 does
 * not.
 */
function resolveSurvival(birthYear: number, ageNow: number, rng: () => number): { isDeceased: boolean; ageAtDeath?: number } {
  const surviving = survivorshipAt(ageNow, birthYear);
  if (rng() < surviving) return { isDeceased: false };

  // Dead before now. Find when, by inverting the curve over [0, ageNow]: draw a
  // survivorship level between l(ageNow) and 1 and walk out to where it falls.
  const target = surviving + rng() * (1 - surviving);
  let ageAtDeath = 0;
  for (let candidate = 0; candidate <= ageNow; candidate += 1) {
    if (survivorshipAt(candidate, birthYear) <= target) { ageAtDeath = candidate; break; }
    ageAtDeath = candidate;
  }
  return { isDeceased: true, ageAtDeath };
}

/**
 * One woman's completed births, oldest first, each tested for survival to the
 * present. This is the whole model; both the persona's children and the
 * persona's own sibship are cases of it.
 */
function walkBirths(
  input: {
    motherAgeNow: number;
    motherAgeAtMarriage: number;
    currentYear: number;
    culturalZone?: CulturalZone;
    wealth?: string;
    /** Age at which childbearing stopped, if before menopause. */
    spanEndsAt?: number;
  },
  rng: () => number,
): BirthRecord[] {
  const { motherAgeNow, motherAgeAtMarriage, currentYear } = input;
  if (motherAgeNow <= motherAgeAtMarriage) return [];
  const spanEnd = Math.min(MENOPAUSE_AGE, input.spanEndsAt ?? MENOPAUSE_AGE);

  // Fertility belongs to the years this woman was actually bearing, not to the
  // year the persona happens to be observed in. For a sibship that is a full
  // generation earlier, and getting it wrong hands a 1990s family size to the
  // mother of a persona who is seventy in 1995.
  const bearingMidpoint = currentYear - motherAgeNow
    + (motherAgeAtMarriage + Math.min(motherAgeNow, spanEnd)) / 2;
  const target = completedFertility(bearingMidpoint, input.culturalZone, input.wealth);
  // Spacing is what actually limits family size in a natural-fertility regime:
  // roughly two and a half years, lengthened by breastfeeding, shortened when
  // an infant dies. Dividing the fertile span by the interval, then scaling to
  // the target, keeps both the count and the spacing plausible.
  const fertileSpan = Math.max(0, MENOPAUSE_AGE - motherAgeAtMarriage);
  const interval = fertileSpan > 0 ? Math.max(1.6, fertileSpan / Math.max(1, target)) : 3;

  const births: BirthRecord[] = [];
  // First birth follows marriage by a year or two, not immediately.
  let motherAge = motherAgeAtMarriage + 1 + rng() * 1.5;

  while (motherAge <= Math.min(motherAgeNow, spanEnd)) {
    const childAge = Math.round(motherAgeNow - motherAge);
    const birthYear = currentYear - childAge;
    const survival = resolveSurvival(birthYear, childAge, rng);
    births.push({
      sex: rng() < 0.512 ? 'male' : 'female', // The observed sex ratio at birth.
      birthYear,
      age: survival.isDeceased ? (survival.ageAtDeath ?? 0) : childAge,
      isDeceased: survival.isDeceased,
      ...(survival.isDeceased ? { deathYear: birthYear + (survival.ageAtDeath ?? 0) } : {}),
    });
    // A death in infancy ends breastfeeding and shortens the next interval.
    const shortened = survival.isDeceased && (survival.ageAtDeath ?? 0) < 2;
    motherAge += (shortened ? interval * 0.6 : interval) * (0.8 + rng() * 0.45);
  }

  return births.sort((a, b) => a.birthYear - b.birthYear);
}

/**
 * The births of one couple, oldest first. Returns living and dead children
 * alike; the caller decides how to present them.
 */
export function generateChildren(ctx: HouseholdContext, rng: () => number): BirthRecord[] {
  const { age, currentYear, marriageAge } = ctx;
  if (age <= marriageAge) return [];

  // The fertile span belongs to the mother, whoever the persona is.
  const motherAgeNow = ctx.sex === 'female' ? age : (ctx.spouseAge ?? age);
  const motherAgeAtMarriage = ctx.sex === 'female'
    ? marriageAge
    : Math.max(YOUNGEST_MOTHER, marriageAge - (age - (ctx.spouseAge ?? age)));

  if (rng() < PRIMARY_INFERTILITY) return [];

  return walkBirths({
    motherAgeNow,
    motherAgeAtMarriage,
    currentYear,
    culturalZone: ctx.culturalZone,
    wealth: ctx.wealth,
  }, rng);
}

export interface SibshipContext {
  /** The persona's age now. */
  age: number;
  currentYear: number;
  /** Years between the persona and their parents. */
  parentAgeGap: number;
  culturalZone?: CulturalZone;
  wealth?: string;
}

/**
 * The persona's own siblings: their mother's other births.
 *
 * This is the same walk as `generateChildren`, one generation back, and it
 * replaces a separate and much cruder path — a uniform count from an era
 * bucket, a uniform ±10-year age gap, no spacing, no bound on the mother's age
 * at birth, and no mortality. That path also compared each sibling's age *now*
 * against the parent-to-child age *gap*, so every persona over about forty had
 * their entire sibship silently discarded: measured at 82% of pre-1800 personas
 * with no sibling at all, and 100% of those aged 40 and over.
 *
 * Primary infertility is deliberately not applied here. Whatever the base rate,
 * these particular parents demonstrably conceived at least once.
 */
export function generateSiblings(ctx: SibshipContext, rng: () => number): BirthRecord[] {
  // The mother's age when she bore the persona, and therefore now.
  const motherAgeAtPersonaBirth = Math.min(MENOPAUSE_AGE, Math.max(YOUNGEST_MOTHER, ctx.parentAgeGap));
  const motherAgeNow = ctx.age + motherAgeAtPersonaBirth;
  // She cannot have married after she bore the persona.
  const motherAgeAtMarriage = Math.min(
    Math.max(YOUNGEST_MOTHER, motherAgeAtPersonaBirth - 1),
    YOUNGEST_MOTHER + Math.floor(rng() * 11),
  );

  // Childbearing does not reliably run to menopause. Widowhood, maternal death
  // and secondary sterility all end it early, and without modelling that every
  // mother bore her full complement and no persona was ever an only child.
  // Whatever the draw, the span has to reach the persona's own birth.
  const endsEarly = rng() < 0.38;
  const spanEndsAt = endsEarly
    ? motherAgeAtPersonaBirth + rng() * (MENOPAUSE_AGE - motherAgeAtPersonaBirth)
    : MENOPAUSE_AGE;

  const births = walkBirths({
    motherAgeNow,
    motherAgeAtMarriage,
    currentYear: ctx.currentYear,
    culturalZone: ctx.culturalZone,
    wealth: ctx.wealth,
    spanEndsAt,
  }, rng);
  if (births.length === 0) return [];

  // One of these births is the persona. Remove whichever falls closest to their
  // own birth year, so the sibship is what remains rather than what was added.
  const personaBirthYear = ctx.currentYear - ctx.age;
  let selfIndex = 0;
  let closest = Number.POSITIVE_INFINITY;
  births.forEach((birth, index) => {
    const distance = Math.abs(birth.birthYear - personaBirthYear);
    if (distance < closest) { closest = distance; selfIndex = index; }
  });

  return births.filter((_, index) => index !== selfIndex);
}

/** Children still living, which is what "how many children do you have" means. */
export function livingChildren(births: BirthRecord[]): BirthRecord[] {
  return births.filter(birth => !birth.isDeceased);
}
