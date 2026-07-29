/**
 * services/personaRarityService.ts
 *
 * How unusual is this person?
 *
 * The app already answers a question of exactly this shape — the header says
 * "roughly 1 in 55 human lives were lived in prehistory in South Asia" — and
 * that phrasing is the one to keep. A rarity that reads as loot ("EPIC!") makes
 * a claim about a game; a rarity that reads as odds makes a claim about a
 * population, which is what every other number on the card is doing.
 *
 * Two independent things feed it, and only two:
 *
 * **The ability scores.** These are eleven draws from a known distribution, so
 * the tail probability is exact arithmetic rather than a guess — see
 * `STAT_PMF`. Note that this is only worth computing at all since the scores
 * gained a tail; under the old uniform-over-{2..7} roll every persona in the
 * app had the same profile to three significant figures.
 *
 * **The attribute badges.** These already carry a prevalence-derived rarity
 * tier, so the work here is only to convert "carries a legendary attribute"
 * into "how many people would you meet before finding one".
 *
 * Social station is deliberately *not* in the number. An hidalgo is not an
 * improbable person, he is a person from a society where one man in ten was an
 * hidalgo, and folding that into the same figure would say something false. It
 * gets its own badge, from `eliteStrataService`.
 */

import type { AttributeRarity } from '../types/attributeTypes';

export type PersonaRarityTier = 'ordinary' | 'notable' | 'rare' | 'legendary';

export interface PersonaRarity {
  tier: PersonaRarityTier;
  /** Probability a randomly generated persona is at least this unusual. */
  probability: number;
  /** Rounded "1 in N", the figure the badge shows. */
  oneIn: number;
  /** "1 in 1,200 people" — same voice as the era/zone odds in the header. */
  phrase: string;
  /** Why this persona is unusual, most significant first. Empty when ordinary. */
  reasons: string[];
}

// ---------------------------------------------------------------------------
// The ability scores
// ---------------------------------------------------------------------------

/**
 * The exact distribution of one score, derived rather than measured.
 *
 * `generateStat` averages three uniform draws and maps the result onto 1–10, so
 * the score is a rescaled Irwin–Hall variate of order 3 and its mass function
 * is closed-form. Deriving it here rather than pasting a measured table means
 * the two cannot drift apart silently — if the generator's shape changes, this
 * changes with it, and the odds on the card stay true.
 */
const STAT_MIN = 1;
const STAT_MAX = 10;

/** CDF of the sum of three uniform(0,1) draws. */
function irwinHall3(x: number): number {
  if (x <= 0) return 0;
  if (x >= 3) return 1;
  let sum = 0;
  const binom = [1, 3, 3, 1];
  for (let j = 0; j <= Math.floor(x); j += 1) {
    sum += (j % 2 === 0 ? 1 : -1) * binom[j] * Math.pow(x - j, 3);
  }
  return sum / 6;
}

const STAT_PMF: number[] = (() => {
  const pmf: number[] = new Array(STAT_MAX + 1).fill(0);
  // Score k covers the band of the underlying sum that rounds to k.
  for (let k = STAT_MIN; k <= STAT_MAX; k += 1) {
    pmf[k] = irwinHall3(0.3 * k) - irwinHall3(0.3 * (k - 1));
  }
  return pmf;
})();

/**
 * How far one score sits outside the ordinary run of people.
 *
 * Zero for anything from 4 to 7, which is where three people in four are, and
 * rising by one for each step beyond that in either direction. Weakness counts
 * the same as strength: a man with the constitution of a sparrow is exactly as
 * unusual as one who can lift a cart, and the app's whole business is that both
 * of them existed.
 */
function excess(value: number): number {
  return Math.max(0, value - 7) + Math.max(0, 4 - value);
}

/** The eleven scores that describe a person, in the order the card shows them. */
const CORE_STATS = [
  'strength', 'dexterity', 'stamina', 'constitution', 'intelligence',
  'wisdom', 'charisma', 'perception', 'craftiness', 'persuasion', 'luck',
] as const;

const STAT_LABELS: Record<string, string> = {
  strength: 'Strength', dexterity: 'Dexterity', stamina: 'Stamina',
  constitution: 'Constitution', intelligence: 'Intelligence', wisdom: 'Wisdom',
  charisma: 'Charisma', perception: 'Perception', craftiness: 'Craftiness',
  persuasion: 'Persuasion', luck: 'Luck',
};

/**
 * P(total excess ≥ score) across eleven independent draws, by exact convolution.
 *
 * Small enough to compute at module load and exact enough that the badge can be
 * defended: the number really is the share of the population that is at least
 * this far from the middle.
 */
const EXCESS_TAIL: number[] = (() => {
  const perStat: number[] = [];
  for (let value = STAT_MIN; value <= STAT_MAX; value += 1) {
    const e = excess(value);
    perStat[e] = (perStat[e] || 0) + STAT_PMF[value];
  }
  let distribution = [1];
  for (let i = 0; i < CORE_STATS.length; i += 1) {
    const next: number[] = new Array(distribution.length + perStat.length).fill(0);
    for (let a = 0; a < distribution.length; a += 1) {
      if (!distribution[a]) continue;
      for (let b = 0; b < perStat.length; b += 1) {
        if (!perStat[b]) continue;
        next[a + b] += distribution[a] * perStat[b];
      }
    }
    distribution = next;
  }
  const tail: number[] = new Array(distribution.length).fill(0);
  let running = 0;
  for (let s = distribution.length - 1; s >= 0; s -= 1) {
    running += distribution[s];
    tail[s] = Math.min(1, running);
  }
  return tail;
})();

// ---------------------------------------------------------------------------
// The attribute badges
// ---------------------------------------------------------------------------

/**
 * The share of personas carrying at least one attribute of each tier or rarer.
 *
 * Measured, not derived, because an attribute's chance of being drawn depends
 * on the age, sex, class, trade, place and year of the person drawing it, and
 * no closed form survives that. Figures are from a 3,000-persona sample at the
 * default sampling mode; regenerate them the same way if the attribute tables
 * move substantially.
 */
const ATTRIBUTE_TIER_SHARE: Record<AttributeRarity, number> = {
  common: 0.883,
  uncommon: 0.698,
  rare: 0.222,
  epic: 0.024,
  legendary: 0.005,
};

const TIER_ORDER: AttributeRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// ---------------------------------------------------------------------------
// The figure on the card
// ---------------------------------------------------------------------------

/** Round the way the header's odds round: precise while small, coarse when large. */
function roundOdds(n: number): number {
  if (n < 20) return Math.round(n);
  if (n < 200) return Math.round(n / 5) * 5;
  if (n < 2000) return Math.round(n / 50) * 50;
  if (n < 20000) return Math.round(n / 500) * 500;
  return Math.round(n / 5000) * 5000;
}

interface RarityInput {
  stats?: Record<string, number> | null;
  attributes?: Array<{ name?: string; rarity?: AttributeRarity }> | null;
}

export function describePersonaRarity(character: RarityInput): PersonaRarity {
  const stats = character.stats || {};

  let score = 0;
  const standouts: Array<{ label: string; value: number; weight: number }> = [];
  for (const key of CORE_STATS) {
    const value = stats[key];
    if (typeof value !== 'number') continue;
    const e = excess(value);
    score += e;
    if (e > 0) standouts.push({ label: STAT_LABELS[key] || key, value, weight: e });
  }
  const statProbability = EXCESS_TAIL[Math.min(score, EXCESS_TAIL.length - 1)] ?? 1;

  // The rarest badge carried is the attribute signal. Multiplying every badge's
  // prevalence together would count a person twice for being merely uncommon in
  // two ways, which is how a rarity number stops meaning anything.
  const attributes = character.attributes || [];
  let rarest: AttributeRarity | null = null;
  let rarestName = '';
  for (const attribute of attributes) {
    const tier = attribute?.rarity;
    if (!tier || !TIER_ORDER.includes(tier)) continue;
    if (!rarest || TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(rarest)) {
      rarest = tier;
      rarestName = attribute.name || '';
    }
  }
  // Only genuinely uncommon badges move the number. Two people in three carry
  // something "uncommon", and a figure that treats that as remarkable is just
  // an inflated figure.
  const attributeProbability =
    rarest && TIER_ORDER.indexOf(rarest) >= TIER_ORDER.indexOf('rare')
      ? ATTRIBUTE_TIER_SHARE[rarest]
      : 1;

  const probability = Math.max(1e-9, statProbability * attributeProbability);
  const oneIn = roundOdds(1 / probability);

  const tier: PersonaRarityTier =
    probability <= 0.001 ? 'legendary'
      : probability <= 0.01 ? 'rare'
        : probability <= 0.05 ? 'notable'
          : 'ordinary';

  const reasons: string[] = [];
  if (tier !== 'ordinary') {
    standouts
      .sort((a, b) => b.weight - a.weight || b.value - a.value)
      .slice(0, 3)
      .forEach(s => reasons.push(
        // Say which direction. "Constitution 1" and "Constitution 10" are both
        // remarkable and they are not the same life.
        s.value >= 8
          ? `${s.label} ${s.value} — in the top ${formatShare(topShare(s.value))} of people`
          : `${s.label} ${s.value} — in the bottom ${formatShare(bottomShare(s.value))} of people`
      ));
    if (rarest && TIER_ORDER.indexOf(rarest) >= TIER_ORDER.indexOf('rare')) {
      reasons.push(
        `${rarestName || 'An attribute'} — carried by 1 in ${roundOdds(1 / ATTRIBUTE_TIER_SHARE[rarest]).toLocaleString()}`
      );
    }
  }

  return {
    tier,
    probability,
    oneIn,
    phrase: `1 in ${oneIn.toLocaleString()} people`,
    reasons,
  };
}

function topShare(value: number): number {
  let p = 0;
  for (let v = value; v <= STAT_MAX; v += 1) p += STAT_PMF[v];
  return p;
}

function bottomShare(value: number): number {
  let p = 0;
  for (let v = STAT_MIN; v <= value; v += 1) p += STAT_PMF[v];
  return p;
}

function formatShare(p: number): string {
  if (p <= 0) return '0%';
  if (p < 0.01) return `1 in ${roundOdds(1 / p).toLocaleString()}`;
  return `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`;
}

/** For audits: the exact stat model this service assumes, so it can be checked. */
export const __statModel = { STAT_PMF, EXCESS_TAIL };
