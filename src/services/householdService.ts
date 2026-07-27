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

  if (motherAgeNow <= motherAgeAtMarriage) return [];
  if (rng() < PRIMARY_INFERTILITY) return [];

  const target = completedFertility(currentYear, ctx.culturalZone, ctx.wealth);
  // Spacing is what actually limits family size in a natural-fertility regime:
  // roughly two and a half years, lengthened by breastfeeding, shortened when
  // an infant dies. Dividing the fertile span by the interval, then scaling to
  // the target, keeps both the count and the spacing plausible.
  const fertileSpan = Math.max(0, MENOPAUSE_AGE - motherAgeAtMarriage);
  const interval = fertileSpan > 0 ? Math.max(1.6, fertileSpan / Math.max(1, target)) : 3;

  const births: BirthRecord[] = [];
  // First birth follows marriage by a year or two, not immediately.
  let motherAge = motherAgeAtMarriage + 1 + rng() * 1.5;

  while (motherAge <= Math.min(motherAgeNow, MENOPAUSE_AGE)) {
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

/** Children still living, which is what "how many children do you have" means. */
export function livingChildren(births: BirthRecord[]): BirthRecord[] {
  return births.filter(birth => !birth.isDeceased);
}
