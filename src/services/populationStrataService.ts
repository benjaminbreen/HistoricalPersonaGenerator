/**
 * services/populationStrataService.ts
 *
 * Standing conditions of life that the zone tables cannot express.
 *
 * `disruptionResolution` handles episodes — the war, the famine, the year the
 * armies came. This handles the other half of what was missing, which is not
 * episodic at all: the populations who were held in a legal condition, or who
 * were somewhere their ancestors had not been, for centuries at a stretch.
 *
 * The generator could not produce these people, and the reason was structural
 * rather than a gap in a list. `CulturalZone` conflates **where you are** with
 * **what culture you are from**. For most of the human past those are the same
 * answer and the conflation costs nothing. For exactly the populations that
 * were missing — Africans in the Americas, Indians in Fiji and Natal, Chinese
 * in Peru and Java, convicts in New South Wales, deported Circassians — they
 * are different answers, and collapsing them means the person cannot be named,
 * clothed, spoken for or drawn. Slavery existed in the app as two profession
 * strings inside one sub-table; a persona who drew one still came out with an
 * English colonial name and an English colonial wardrobe.
 *
 * So this module adds two axes and keeps them apart:
 *
 * - **`legalStatus`** — whether this person's labour is owed, sold, compelled
 *   or their own. It is not a wealth tier and it is not a social class, and
 *   the app already had places for both of those.
 * - **`ancestry`** — where the line came from, with a generation depth. Depth
 *   is what makes the difference between a woman born in Senegambia and sold
 *   at seventeen and her granddaughter born in the Carolina lowcountry, who
 *   are not the same person and should not be named alike.
 *
 * Profession is drawn from the stratum's own list rather than the zone table,
 * because the zone table for 1750 South Carolina offers merchants and
 * shipwrights. But the list is a list of **trades** — cooper, midwife,
 * boatman, sawyer — and never the status itself. A person is not an
 * occupation called "Enslaved Person"; they are a cooper who is owned. That
 * distinction is the whole reason the two axes are separate, and it produces
 * both the more accurate persona and the more human one.
 */

import type { CulturalZone } from '../types/characterData';
import type { WealthLevel } from '../types';
import type { Ancestry, LegalStatus } from '../types/socialCondition';
import { POPULATION_STRATA } from '../constants/gameData/populationStrata';

export type { Ancestry, LegalStatus };

export interface StratumRole {
  role: string;
  weight: number;
  gender?: 'Male' | 'Female';
}

export interface PopulationStratum {
  id: string;
  /** Human-readable, for audits. */
  label: string;
  zones: CulturalZone[];
  yearRange: [number, number];
  /** Matched against "<location> <region>", lowercased. */
  places?: RegExp;
  /**
   * Share of the local population living in this condition, 0–1.
   *
   * These are the numbers most worth arguing with, and they vary enormously
   * over short distances — the Carolina lowcountry and Massachusetts in the
   * same decade differ by a factor of fifteen — which is why the table splits
   * by place rather than carrying one figure per empire.
   */
  share: number;
  legalStatus: LegalStatus;
  /** What the card shows. The society's own word where it had one. */
  statusLabel: string;
  ancestry?: Omit<Ancestry, 'generation' | 'originRegion'> & {
    /** Regions the trade actually drew on, one picked per persona. */
    originRegions?: string[];
  };
  /** Probability of having been born outside this place rather than in it. */
  firstGenerationRate?: number;
  /** Trades, never statuses. See the module comment. */
  roles: StratumRole[];
  /** One sentence for the biography, third person, present tense. */
  clause: string;
  /** Overrides the sampled wealth tier where the condition settles it. */
  wealthLevel?: WealthLevel;
}

export interface SampledStratum {
  stratum: PopulationStratum;
  role: string;
  ancestry?: Ancestry;
}

const normalize = (value?: string): string => (value || '').toLowerCase();

/** Every standing condition present in this place and year. */
export function resolveStrata(
  zone: CulturalZone,
  year: number,
  region?: string,
  location?: string,
): PopulationStratum[] {
  const place = `${normalize(location)} ${normalize(region)}`;
  return POPULATION_STRATA.filter(s =>
    s.zones.includes(zone)
    && year >= s.yearRange[0]
    && year <= s.yearRange[1]
    && (!s.places || s.places.test(place))
  );
}

/**
 * Which condition, if any, this particular person was born into.
 *
 * Shares are treated as slices of one population and normalised if they
 * overrun it, so overlapping entries — a place with both chattel slavery and
 * indentured servitude — divide the population rather than each claiming their
 * full share of it. Whatever is left over is free, which is the common case
 * nearly everywhere and should stay the common case here.
 */
export function sampleStratum(
  zone: CulturalZone,
  year: number,
  region: string | undefined,
  location: string | undefined,
  gender: 'Male' | 'Female',
  random: () => number,
): SampledStratum | null {
  const candidates = resolveStrata(zone, year, region, location);
  if (candidates.length === 0) return null;

  const total = candidates.reduce((sum, s) => sum + s.share, 0);
  // Never let the table claim the whole population: even where bondage was the
  // majority condition there were free people, and a stratum list that sums
  // past 1 would erase them.
  const scale = total > 0.95 ? 0.95 / total : 1;

  let roll = random();
  for (const stratum of candidates) {
    const share = stratum.share * scale;
    if (roll < share) return draw(stratum, gender, random);
    roll -= share;
  }
  return null;
}

function draw(
  stratum: PopulationStratum,
  gender: 'Male' | 'Female',
  random: () => number,
): SampledStratum {
  const open = stratum.roles.filter(r => !r.gender || r.gender === gender);
  const pool = open.length > 0 ? open : stratum.roles;
  const total = pool.reduce((sum, r) => sum + r.weight, 0);

  let roll = random() * total;
  let role = pool[pool.length - 1].role;
  for (const candidate of pool) {
    roll -= candidate.weight;
    if (roll <= 0) { role = candidate.role; break; }
  }

  let ancestry: Ancestry | undefined;
  if (stratum.ancestry) {
    const firstGen = random() < (stratum.firstGenerationRate ?? 0.3);
    const regions = stratum.ancestry.originRegions ?? [];
    const { originRegions: _regions, ...rest } = stratum.ancestry;
    ancestry = {
      ...rest,
      originRegion: regions.length > 0
        ? regions[Math.floor(random() * regions.length)]
        : undefined,
      // Beyond the third generation the distinction stops doing any work: the
      // naming, the language and the religion have all converged by then, and
      // a larger number would only be a number.
      generation: firstGen ? 0 : 1 + Math.floor(random() * 3),
    };
  }

  return { stratum, role, ancestry };
}

/**
 * The name sets this ancestry should draw from.
 *
 * The first generation is named where it came from. The generations after it
 * are named where they are, which is not assimilation so much as arithmetic —
 * the people doing the naming were born here. The middle case is the
 * interesting one and it is left to the caller's roll: a second-generation
 * name can come from either bank, which is what the parish registers actually
 * look like.
 */
export function ancestryNameKeys(ancestry: Ancestry, random: () => number): string[] {
  const origin = ancestry.originNameKeys ?? [];
  const local = ancestry.localNameKeys ?? [];
  if (ancestry.generation === 0) return origin.length > 0 ? origin : local;
  if (ancestry.generation >= 3) return local.length > 0 ? local : origin;
  // First and second generation born in place: mostly local, with the older
  // naming surviving in a real minority of households.
  if (random() < 0.3 && origin.length > 0) return origin;
  return local.length > 0 ? local : origin;
}

/** Whether this condition is one the persona did not choose and cannot leave. */
export function isUnfree(status: LegalStatus): boolean {
  return status !== 'free';
}
