/**
 * services/demographyService.ts
 *
 * Every assumption the generator makes about *who* a persona is likely to be:
 * their sex, their age, how wealthy they were, and when and where they lived.
 *
 * These decisions used to be scattered through `personaGenerator` as uniform
 * picks — `randomElement` over a list of eras, `randomInt(18, 70)` for age — and
 * the effect was a population that does not resemble any human population that
 * has ever existed. Gathering them here means the claims in `docs/DEMOGRAPHY.md`
 * point at one file, and changing an assumption is a change in one place.
 *
 * Two rules for this file:
 *
 *   1. Where a distribution is modelled on real demography, say what it is
 *      modelled on and roughly what it targets.
 *   2. Where a distribution is deliberately *flattened* so the app stays
 *      explorable — which is a legitimate choice for a teaching tool — say so
 *      explicitly rather than letting it pass as a measurement.
 *
 * See docs/DEMOGRAPHY.md for the derivations and sources.
 */

import { CulturalZone, Gender, WealthLevel } from '../types/characterData';
import { HistoricalEra } from '../types/enums';

export type Random = () => number;
export type BirthSex = 'Male' | 'Female';

/**
 * Explore mode is deliberately unrepresentative so that the whole world is
 * reachable in a reasonable number of spins. True-frequency mode samples eras
 * and regions in proportion to how many people actually lived in them.
 *
 * Neither is "the right one" — but the flattening must never be silent, which is
 * why `describeOdds` exists.
 */
export type SamplingMode = 'explore' | 'true-frequency';

export const DEFAULT_SAMPLING_MODE: SamplingMode = 'explore';

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function weightedPick<T>(entries: Array<[T, number]>, random: Random): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

// ---------------------------------------------------------------------------
// World population, and when human lives actually happened
// ---------------------------------------------------------------------------

/**
 * World population and crude birth rate at benchmark dates, from the
 * Population Reference Bureau's "How Many People Have Ever Lived on Earth?"
 * (Haub 1995, updated with Kaneda 2022) — the same table that yields their
 * ~117 billion total.
 *
 * Population is interpolated exponentially between benchmarks, which is what
 * PRB's own birth totals imply: integrating population × birth rate across each
 * segment reproduces their published figures.
 */
const POPULATION_BENCHMARKS: Array<{ year: number; population: number; birthRate: number }> = [
  { year: -190000, population: 2, birthRate: 80 },
  { year: -50000, population: 2_000_000, birthRate: 80 },
  { year: -8000, population: 5_000_000, birthRate: 80 },
  { year: 1, population: 300_000_000, birthRate: 60 },
  { year: 1200, population: 450_000_000, birthRate: 60 },
  { year: 1650, population: 500_000_000, birthRate: 50 },
  { year: 1750, population: 795_000_000, birthRate: 40 },
  { year: 1850, population: 1_265_000_000, birthRate: 40 },
  { year: 1900, population: 1_656_000_000, birthRate: 38 },
  { year: 1950, population: 2_499_000_000, birthRate: 31 },
  { year: 2000, population: 6_149_000_000, birthRate: 22 },
];

function benchmarkIndex(year: number): number {
  let i = 0;
  while (i < POPULATION_BENCHMARKS.length - 2 && POPULATION_BENCHMARKS[i + 1].year < year) i += 1;
  return i;
}

export function worldPopulationAt(year: number): number {
  const first = POPULATION_BENCHMARKS[0];
  const last = POPULATION_BENCHMARKS[POPULATION_BENCHMARKS.length - 1];
  if (year <= first.year) return first.population;
  if (year >= last.year) return last.population;
  const i = benchmarkIndex(year);
  const a = POPULATION_BENCHMARKS[i];
  const b = POPULATION_BENCHMARKS[i + 1];
  const t = (year - a.year) / (b.year - a.year);
  return a.population * Math.pow(b.population / a.population, t);
}

function birthRateAt(year: number): number {
  const i = benchmarkIndex(year);
  const a = POPULATION_BENCHMARKS[i];
  const b = POPULATION_BENCHMARKS[i + 1];
  const t = clamp01((year - a.year) / (b.year - a.year));
  return a.birthRate + (b.birthRate - a.birthRate) * t;
}

/** Births per year — how many human lives began in that year. */
function birthsAt(year: number): number {
  return worldPopulationAt(year) * (birthRateAt(year) / 1000);
}

// ---------------------------------------------------------------------------
// Eras
// ---------------------------------------------------------------------------

/**
 * The year each era spans.
 *
 * `PREHISTORY` used to run from 4000 to 3000 BCE — a single Chalcolithic
 * millennium labelled as though it covered everything before writing. That put
 * roughly 12% of all humans ever born, and something over ninety percent of the
 * time our species has existed, entirely out of reach.
 *
 * The floor of 40,000 BCE is a content decision rather than a demographic one:
 * it reaches back through the Upper Palaeolithic, which is as far as this app's
 * material can say anything meaningful, while PRB's table itself runs to
 * 190,000 BCE.
 */
export const ERA_BOUNDS: Record<HistoricalEra, { min: number; max: number }> = {
  [HistoricalEra.PREHISTORY]: { min: -40000, max: -3000 },
  [HistoricalEra.ANTIQUITY]: { min: -3000, max: 500 },
  [HistoricalEra.MEDIEVAL]: { min: 500, max: 1450 },
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: { min: 1450, max: 1750 },
  [HistoricalEra.INDUSTRIAL_ERA]: { min: 1750, max: 1900 },
  [HistoricalEra.MODERN_ERA]: { min: 1900, max: 2000 },
  [HistoricalEra.FUTURE_ERA]: { min: 2000, max: 2100 },
};

const SELECTABLE_ERAS: HistoricalEra[] = [
  HistoricalEra.PREHISTORY,
  HistoricalEra.ANTIQUITY,
  HistoricalEra.MEDIEVAL,
  HistoricalEra.RENAISSANCE_EARLY_MODERN,
  HistoricalEra.INDUSTRIAL_ERA,
  HistoricalEra.MODERN_ERA,
];

/** Total births within a year range, by numeric integration. */
function birthsBetween(from: number, to: number): number {
  const steps = 240;
  const width = (to - from) / steps;
  let total = 0;
  for (let i = 0; i < steps; i += 1) {
    const a = from + i * width;
    const b = a + width;
    total += ((birthsAt(a) + birthsAt(b)) / 2) * width;
  }
  return total;
}

/**
 * How the flattening works.
 *
 * True-frequency mode weights an era by the number of human lives that began in
 * it. Explore mode raises those weights to a fractional power, which keeps the
 * ordering — antiquity still comes up more than the industrial era — while
 * pulling the extremes in far enough that the whole span stays reachable in a
 * sitting. A pure uniform pick would be a different lie; this one at least
 * preserves the shape.
 */
const EXPLORE_FLATTENING = 0.28;

function flatten(weight: number, mode: SamplingMode): number {
  return mode === 'true-frequency' ? weight : Math.pow(weight, EXPLORE_FLATTENING);
}

export function eraWeights(mode: SamplingMode): Array<[HistoricalEra, number]> {
  return SELECTABLE_ERAS.map(era => {
    const { min, max } = ERA_BOUNDS[era];
    return [era, flatten(birthsBetween(min, max), mode)] as [HistoricalEra, number];
  });
}

export function sampleEra(mode: SamplingMode, random: Random): HistoricalEra {
  return weightedPick(eraWeights(mode), random);
}

/**
 * Draw a year inside an era, weighted by how many people were being born then.
 *
 * This matters most for prehistory, where a uniform draw over 37,000 years
 * would put almost every persona in a period when there were a few hundred
 * thousand people alive on Earth and about which this app can say very little.
 */
export function sampleYearInEra(era: HistoricalEra, mode: SamplingMode, random: Random): number {
  const { min, max } = ERA_BOUNDS[era] || ERA_BOUNDS[HistoricalEra.MEDIEVAL];
  const buckets = 96;
  const width = (max - min) / buckets;
  const weights: Array<[number, number]> = [];
  for (let i = 0; i < buckets; i += 1) {
    const start = min + i * width;
    weights.push([start, flatten(birthsBetween(start, start + width), mode)]);
  }
  const bucketStart = weightedPick(weights, random);
  return Math.round(bucketStart + random() * width);
}

// ---------------------------------------------------------------------------
// Sex
// ---------------------------------------------------------------------------

/**
 * Near parity. Slightly more boys are born than girls (~105:100), and men die
 * younger, so across the adult population the two effects roughly cancel.
 *
 * The previous implementation picked uniformly from
 * `['Male', 'Female', 'Non-binary']` and then collapsed non-binary to Female
 * downstream, producing a 2:1 female population *and* erasing the category it
 * was trying to represent.
 */
export function sampleBirthSex(random: Random): BirthSex {
  return random() < 0.5 ? 'Male' : 'Female';
}

// ---------------------------------------------------------------------------
// Third-gender and gender-crossing social roles
// ---------------------------------------------------------------------------

export interface GenderRole {
  /** Local term, where one is well attested for the time and place. */
  term?: string;
  /** Neutral description, used when no specific term should be claimed. */
  description: string;
  /** The birth sex the role is generally taken up from. */
  birthSex: BirthSex;
}

interface GenderRoleDefinition extends GenderRole {
  zones: CulturalZone[];
  /** Narrows a zone-wide entry to the regions where the role is attested. */
  region?: RegExp;
  minYear?: number;
  maxYear?: number;
}

/**
 * Recognised third-gender and gender-crossing social roles.
 *
 * Modelled as *social roles held by people of a given birth sex*, which is
 * broadly how they worked, rather than as a third biological category. Two
 * constraints are deliberate:
 *
 *   - No projecting modern labels backwards. "Two-spirit" is a pan-Indigenous
 *     umbrella term coined in 1990 and is not a name any pre-contact person
 *     would have used; where a specific attested local term exists it is used,
 *     and otherwise the role is described neutrally.
 *   - Marriage and lineage institutions that are sometimes grouped with these —
 *     "female husband" arrangements among the Igbo and Nandi, for instance —
 *     are left out, because conflating a property and descent institution with
 *     a gender role misrepresents both.
 */
const GENDER_ROLES: GenderRoleDefinition[] = [
  {
    term: 'hijra',
    description: 'holds a recognised third-gender role',
    birthSex: 'Male',
    zones: ['SOUTH_ASIAN'],
    minYear: 1500,
  },
  {
    description: 'holds a third-gender role recognised in local tradition',
    birthSex: 'Male',
    zones: ['SOUTH_ASIAN'],
    maxYear: 1500,
  },
  {
    term: 'fa’afafine',
    description: 'raised and living in a recognised third-gender role',
    birthSex: 'Male',
    zones: ['OCEANIA'],
    region: /samoa|polynesia|tonga/i,
  },
  {
    term: 'māhū',
    description: 'holds a recognised intermediate gender role',
    birthSex: 'Male',
    zones: ['OCEANIA'],
    region: /hawai|tahiti|society islands|marquesas/i,
  },
  {
    term: 'khanith',
    description: 'holds a recognised third-gender role',
    birthSex: 'Male',
    zones: ['MENA'],
    region: /oman|arabia|gulf|hadhramaut/i,
    minYear: 1600,
  },
  {
    term: 'mukhannath',
    description: 'holds a recognised third-gender role',
    birthSex: 'Male',
    zones: ['MENA'],
    region: /arabia|hejaz|medina|mecca|levant/i,
    minYear: 600,
    maxYear: 1100,
  },
  {
    term: 'bissu',
    description: 'serves in a ritual role outside the usual gender categories',
    birthSex: 'Male',
    zones: ['EAST_ASIAN', 'SOUTH_ASIAN'],
    region: /sulawesi|celebes|makassar|bugis/i,
  },
  {
    term: 'burrnesha',
    description: 'took a vow and lives in a man’s social role',
    birthSex: 'Female',
    zones: ['EUROPEAN'],
    region: /albania|balkan|montenegro|kosovo|epirus/i,
    minYear: 1400,
  },
  {
    // Named roles existed in many Indigenous North American nations — Lakota
    // winkte, Zuni lhamana, Diné nádleehí among them — but the app's regions
    // are too coarse to attach a specific nation's term honestly.
    description: 'holds a gender role recognised as distinct within their nation',
    birthSex: 'Male',
    zones: ['NORTH_AMERICAN_PRE_COLUMBIAN'],
  },
  {
    term: 'shoga',
    description: 'holds a recognised third-gender role',
    birthSex: 'Male',
    zones: ['SUB_SAHARAN_AFRICAN'],
    region: /swahili|zanzibar|mombasa|lamu|east africa/i,
    minYear: 1000,
  },
];

/**
 * How often a persona in a society with an attested role holds it.
 *
 * There is no reliable population-level frequency for any of these roles
 * anywhere, so this is a placeholder that means "rare but present" rather than
 * a measurement. It is a single named constant precisely so that it is easy to
 * find, argue with, and change.
 */
export const THIRD_GENDER_RATE = 0.015;

export function sampleGenderRole(
  birthSex: BirthSex,
  culturalZone: CulturalZone,
  region: string,
  year: number,
  random: Random
): GenderRole | null {
  const candidates = GENDER_ROLES.filter(role =>
    role.birthSex === birthSex &&
    role.zones.includes(culturalZone) &&
    (!role.region || role.region.test(region)) &&
    (role.minYear === undefined || year >= role.minYear) &&
    (role.maxYear === undefined || year < role.maxYear)
  );
  if (candidates.length === 0) return null;
  if (random() >= THIRD_GENDER_RATE) return null;

  const chosen = candidates[Math.floor(random() * candidates.length)];
  return { term: chosen.term, description: chosen.description, birthSex: chosen.birthSex };
}

/** What the persona is presented as. Third-gender roles display as non-binary. */
export function socialGender(birthSex: BirthSex, role: GenderRole | null): Gender {
  return role ? 'Non-binary' : birthSex;
}

// ---------------------------------------------------------------------------
// Age
// ---------------------------------------------------------------------------

const AGE_KNOTS = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95];

/**
 * Survivorship for a pre-modern mortality regime — life expectancy at birth of
 * roughly 30, with about a quarter of infants dying before their first birthday
 * and another quarter before adulthood.
 *
 * Note what this curve does *not* say: it does not say people dropped dead at
 * 30. Conditional on reaching 18, living into your fifties or sixties was
 * ordinary, which is why the surviving fraction falls so gently across the
 * middle of the table. A generator that produced only young adults would be
 * less accurate than one that produces a spread.
 *
 * Shaped after Coale-Demeny West at the low-expectancy end; the resulting adult
 * distribution puts ~28% of adults at 50+ and ~8% at 65+, which matches
 * Wrigley & Schofield's reconstruction of early modern England.
 */
const SURVIVORSHIP_PREMODERN = [
  1.0, 0.750, 0.645, 0.615, 0.590, 0.560, 0.530, 0.500, 0.468, 0.434, 0.396,
  0.352, 0.303, 0.248, 0.188, 0.128, 0.075, 0.035, 0.012, 0.003, 0,
];

/** A late-twentieth-century regime, life expectancy at birth around 70. */
const SURVIVORSHIP_MODERN = [
  1.0, 0.970, 0.965, 0.962, 0.958, 0.952, 0.944, 0.935, 0.924, 0.909, 0.888,
  0.858, 0.816, 0.758, 0.676, 0.566, 0.424, 0.262, 0.112, 0.028, 0,
];

/** 0 for pre-industrial mortality, 1 for late modern. */
function modernity(year: number): number {
  return clamp01((year - 1780) / 200);
}

function survivorshipAt(age: number, year: number): number {
  const t = modernity(year);
  let i = 0;
  while (i < AGE_KNOTS.length - 2 && AGE_KNOTS[i + 1] < age) i += 1;
  const span = AGE_KNOTS[i + 1] - AGE_KNOTS[i];
  const u = span === 0 ? 0 : (age - AGE_KNOTS[i]) / span;
  const lerp = (table: number[]) => table[i] + (table[i + 1] - table[i]) * u;
  return lerp(SURVIVORSHIP_PREMODERN) * (1 - t) + lerp(SURVIVORSHIP_MODERN) * t;
}

export const MIN_ADULT_AGE = 18;
const MAX_AGE = 94;

/**
 * Draw an adult age.
 *
 * In a population that is roughly stationary, the number of people alive at a
 * given age is proportional to the fraction still surviving at that age — so
 * sampling proportional to the survivorship curve gives the real age structure
 * of the living, conditioned here on being an adult.
 *
 * The distribution this replaces was `randomInt(18, 70)`: uniform, meaning as
 * many 68-year-olds as 22-year-olds, and nobody older than 70 ever.
 */
export function sampleAdultAge(
  year: number,
  random: Random,
  minAge = MIN_ADULT_AGE,
  maxAge = MAX_AGE
): number {
  const low = Math.max(0, Math.min(minAge, maxAge));
  const high = Math.max(low, maxAge);
  const weights: Array<[number, number]> = [];
  for (let age = low; age <= high; age += 1) {
    weights.push([age, Math.max(0, survivorshipAt(age, year))]);
  }
  return weightedPick(weights, random);
}

// ---------------------------------------------------------------------------
// Wealth
// ---------------------------------------------------------------------------

/**
 * Wealth in an agrarian society is not a bell curve. Something like three
 * quarters to five sixths of people lived at or near subsistence, a modest
 * middling layer of craftsmen, smallholders and small traders sat above them,
 * and the genuinely comfortable were a few percent. Nobility was a fraction of
 * one percent almost everywhere.
 *
 * The previous distribution put 42% at "comfortable or better" and 2.6% at
 * noble, which is roughly the class structure of a prosperous modern suburb.
 */
const WEALTH_BY_ERA: Partial<Record<HistoricalEra, Array<[WealthLevel, number]>>> = {
  [HistoricalEra.PREHISTORY]: [
    // Foraging and early horticultural societies were materially poor but not
    // steeply stratified — there is little to accumulate and less to inherit.
    ['poor', 0.42], ['modest', 0.48], ['comfortable', 0.09], ['wealthy', 0.01], ['noble', 0.0],
  ],
  [HistoricalEra.ANTIQUITY]: [
    ['poor', 0.55], ['modest', 0.31], ['comfortable', 0.10], ['wealthy', 0.035], ['noble', 0.005],
  ],
  [HistoricalEra.MEDIEVAL]: [
    ['poor', 0.55], ['modest', 0.31], ['comfortable', 0.10], ['wealthy', 0.035], ['noble', 0.005],
  ],
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
    ['poor', 0.52], ['modest', 0.32], ['comfortable', 0.11], ['wealthy', 0.045], ['noble', 0.005],
  ],
  [HistoricalEra.INDUSTRIAL_ERA]: [
    ['poor', 0.45], ['modest', 0.34], ['comfortable', 0.15], ['wealthy', 0.055], ['noble', 0.005],
  ],
  [HistoricalEra.MODERN_ERA]: [
    ['poor', 0.28], ['modest', 0.36], ['comfortable', 0.28], ['wealthy', 0.075], ['noble', 0.005],
  ],
  [HistoricalEra.FUTURE_ERA]: [
    ['poor', 0.22], ['modest', 0.36], ['comfortable', 0.33], ['wealthy', 0.085], ['noble', 0.005],
  ],
};

export function sampleWealthLevel(era: HistoricalEra, random: Random): WealthLevel {
  const table = WEALTH_BY_ERA[era] || WEALTH_BY_ERA[HistoricalEra.MEDIEVAL]!;
  return weightedPick(table, random);
}

// ---------------------------------------------------------------------------
// Material culture
// ---------------------------------------------------------------------------

/**
 * Roughly when each clothing material becomes possible.
 *
 * Opening the generator up to deep prehistory immediately exposed the clothing
 * tables to years they were never written for — the first pass produced a linen
 * dress in 28,000 BCE and a hemp robe in 39,000 BCE. Woven cloth of any kind is
 * a Neolithic technology; before it, clothing is hide, fur, bark and plant
 * fibre, which is exactly what the archaeology shows.
 *
 * Dates are conservative earliest-evidence estimates and are approximate.
 */
const MATERIAL_EARLIEST: Array<[RegExp, number]> = [
  // Woven plant fibre. Earliest linen textiles are Neolithic Anatolia/Levant.
  [/linen|flax/i, -7000],
  [/hemp/i, -5000],
  [/cotton|calico|muslin|chintz/i, -5000],
  // Wool cloth needs sheep bred for a fleece, which is later than domestication.
  [/wool|felt|broadcloth|worsted|serge|tweed/i, -4000],
  [/silk|satin|brocade|damask/i, -3000],
  // Named woven garments and generic cloth imply the loom even when no
  // material is given.
  [/sari|saree|toga|chiton|himation|robe|gown|tunic and mantle/i, -6000],
  [/\bwoven\b|\bweave\b|\bcloth\b|\btextile\b|\bknit\b/i, -6000],
  // Metals, for fittings and ornament.
  [/copper/i, -5000],
  [/bronze/i, -3300],
  [/iron|steel/i, -1200],
  [/glass/i, -1500],
  // Everything else — hide, leather, fur, sinew, bark, grass, bone, shell,
  // feather, plant fibre — is available for the whole span.
];

/**
 * Materials available for the whole span, checked first so that genuinely
 * ancient technologies are never caught by a broader gate — barkcloth is beaten
 * rather than woven and is far older than the loom, so "bark cloth" must not be
 * filtered by the rule that removes woven cloth.
 */
const ALWAYS_AVAILABLE =
  /\b(?:bark ?cloth|tapa|hide|skin|pelt|fur|leather|rawhide|sinew|gut|bone|antler|shell|tooth|claw|feather|grass|reed|rush|straw|plant fibre|plant fiber|fibre|fiber|bast|raffia)\b/i;

export function isMaterialAvailable(description: string, year: number): boolean {
  if (ALWAYS_AVAILABLE.test(description)) return true;
  for (const [pattern, earliest] of MATERIAL_EARLIEST) {
    if (pattern.test(description) && year < earliest) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Where people were
// ---------------------------------------------------------------------------

/**
 * Share of world population by region at benchmark dates (*estimate*).
 *
 * Triangulated from McEvedy & Jones and the standard regional series. Treat
 * these as ±30% and as ordering rather than precision — world population at
 * 1 CE alone is variously put at 170M, 226M and 300M by different authorities.
 *
 * The number that surprises people is Oceania. Even generously — Aboriginal
 * Australia up to a million before 1788, Hawai'i perhaps 800,000, plus New
 * Guinea — the whole region is single-digit millions against a world of half a
 * billion. Roughly one human life in two hundred. Sampling cultural zones
 * uniformly, as this app did, over-represented it by a factor of about twenty.
 */
const ZONE_SHARES: Array<{ year: number; shares: Partial<Record<CulturalZone, number>> }> = [
  {
    year: -3000,
    shares: {
      MENA: 0.25, SOUTH_ASIAN: 0.20, EAST_ASIAN: 0.20, EUROPEAN: 0.10,
      SUB_SAHARAN_AFRICAN: 0.15, SOUTH_AMERICAN: 0.05,
      NORTH_AMERICAN_PRE_COLUMBIAN: 0.04, OCEANIA: 0.01,
    },
  },
  {
    year: 1,
    shares: {
      EAST_ASIAN: 0.22, SOUTH_ASIAN: 0.22, EUROPEAN: 0.15, MENA: 0.13,
      SUB_SAHARAN_AFRICAN: 0.10, SOUTH_AMERICAN: 0.04,
      NORTH_AMERICAN_PRE_COLUMBIAN: 0.02, OCEANIA: 0.004,
    },
  },
  {
    year: 1000,
    shares: {
      EAST_ASIAN: 0.27, SOUTH_ASIAN: 0.28, EUROPEAN: 0.19, MENA: 0.10,
      SUB_SAHARAN_AFRICAN: 0.10, SOUTH_AMERICAN: 0.03,
      NORTH_AMERICAN_PRE_COLUMBIAN: 0.02, OCEANIA: 0.003,
    },
  },
  {
    year: 1500,
    shares: {
      EAST_ASIAN: 0.27, SOUTH_ASIAN: 0.24, EUROPEAN: 0.18, MENA: 0.06,
      SUB_SAHARAN_AFRICAN: 0.11, SOUTH_AMERICAN: 0.07,
      NORTH_AMERICAN_PRE_COLUMBIAN: 0.04, OCEANIA: 0.004,
    },
  },
  {
    year: 1800,
    shares: {
      EAST_ASIAN: 0.37, SOUTH_ASIAN: 0.20, EUROPEAN: 0.20, MENA: 0.03,
      SUB_SAHARAN_AFRICAN: 0.08, SOUTH_AMERICAN: 0.02,
      NORTH_AMERICAN_COLONIAL: 0.01, OCEANIA: 0.002,
    },
  },
  {
    year: 1900,
    shares: {
      EAST_ASIAN: 0.30, SOUTH_ASIAN: 0.20, EUROPEAN: 0.25, MENA: 0.03,
      SUB_SAHARAN_AFRICAN: 0.07, SOUTH_AMERICAN: 0.04,
      NORTH_AMERICAN_COLONIAL: 0.05, OCEANIA: 0.004,
    },
  },
  {
    year: 2000,
    shares: {
      EAST_ASIAN: 0.25, SOUTH_ASIAN: 0.22, EUROPEAN: 0.12, MENA: 0.06,
      SUB_SAHARAN_AFRICAN: 0.11, SOUTH_AMERICAN: 0.09,
      NORTH_AMERICAN_COLONIAL: 0.05, OCEANIA: 0.005,
    },
  },
];

function zoneShareAt(zone: CulturalZone, year: number): number {
  const first = ZONE_SHARES[0];
  const last = ZONE_SHARES[ZONE_SHARES.length - 1];
  if (year <= first.year) return first.shares[zone] ?? 0;
  if (year >= last.year) return last.shares[zone] ?? 0;
  let i = 0;
  while (i < ZONE_SHARES.length - 2 && ZONE_SHARES[i + 1].year < year) i += 1;
  const a = ZONE_SHARES[i];
  const b = ZONE_SHARES[i + 1];
  const t = (year - a.year) / (b.year - a.year);
  const av = a.shares[zone] ?? 0;
  const bv = b.shares[zone] ?? 0;
  return av + (bv - av) * t;
}

export function zoneWeights(
  year: number,
  mode: SamplingMode,
  allowed: CulturalZone[]
): Array<[CulturalZone, number]> {
  return allowed.map(zone => {
    // A small floor keeps a zone that the share table has no entry for from
    // becoming unreachable rather than merely rare.
    const share = Math.max(zoneShareAt(zone, year), 0.002);
    return [zone, flatten(share, mode)] as [CulturalZone, number];
  });
}

export function sampleCulturalZone(
  year: number,
  mode: SamplingMode,
  allowed: CulturalZone[],
  random: Random
): CulturalZone {
  return weightedPick(zoneWeights(year, mode, allowed), random);
}

// ---------------------------------------------------------------------------
// Telling the truth about the odds
// ---------------------------------------------------------------------------

export interface DrawOdds {
  /** Probability that a random human life fell in this era and region. */
  probability: number;
  /** "about 1 in 250 human lives" */
  phrase: string;
  eraShare: number;
  zoneShare: number;
}

/**
 * What the drawn combination was actually worth, as a share of all human lives.
 *
 * This exists because the flattening must never be silent. Explore mode is a
 * deliberate distortion, and the gap between what feels representative and what
 * was representative is the most teachable thing this app has — stating it turns
 * a hidden inaccuracy into the point.
 */
export function describeOdds(era: HistoricalEra, zone: CulturalZone, year: number): DrawOdds {
  const totalBirths = SELECTABLE_ERAS.reduce(
    (sum, e) => sum + birthsBetween(ERA_BOUNDS[e].min, ERA_BOUNDS[e].max),
    0
  );
  const { min, max } = ERA_BOUNDS[era] || ERA_BOUNDS[HistoricalEra.MEDIEVAL];
  const eraShare = birthsBetween(min, max) / totalBirths;
  const zoneShare = Math.max(zoneShareAt(zone, year), 0.0005);
  const probability = eraShare * zoneShare;

  const oneIn = probability > 0 ? Math.round(1 / probability) : Infinity;
  const round = (n: number) => {
    if (n < 20) return n;
    if (n < 200) return Math.round(n / 5) * 5;
    if (n < 2000) return Math.round(n / 50) * 50;
    return Math.round(n / 500) * 500;
  };

  return {
    probability,
    eraShare,
    zoneShare,
    phrase: Number.isFinite(oneIn)
      ? `1 in ${round(oneIn).toLocaleString()} human lives`
      : 'a vanishingly small share of human lives',
  };
}
