/**
 * services/eliteStrataService.ts
 *
 * Who stood above the tax line, and how many of them there were.
 *
 * The mirror of `populationStrataService`, and written the same way on purpose:
 * a share of a local population, resolved by zone, year and place, drawn once
 * per persona. See `eliteStrata.ts` for why a flat 0.5% noble everywhere was
 * the wrong answer by an order of magnitude in both directions.
 *
 * Ordering matters where the two tables meet. Bondage is sampled first and this
 * runs only if that came back empty, because a person cannot be both owned and
 * of the ruling lineage, and of the two the unfree condition is the one the app
 * must not lose.
 */

import type { CulturalZone } from '../types/characterData';
import type { WealthLevel } from '../types';
import { ELITE_STRATA, type EliteStratum } from '../constants/gameData/eliteStrata';

export type { EliteStratum };

export interface SampledElite {
  stratum: EliteStratum;
  role: string;
  /** Drawn from the estate's own wealth distribution, which is often poor. */
  wealthLevel: WealthLevel;
}

const normalize = (value?: string): string => (value || '').toLowerCase();

/** Every privileged order present in this place and year. */
export function resolveElites(
  zone: CulturalZone,
  year: number,
  region?: string,
  location?: string,
): EliteStratum[] {
  const place = `${normalize(location)} ${normalize(region)}`;
  return ELITE_STRATA.filter(s =>
    s.zones.includes(zone)
    && year >= s.yearRange[0]
    && year <= s.yearRange[1]
    && (!s.places || s.places.test(place))
  );
}

/**
 * Which order, if any, this person was born into.
 *
 * Shares are slices of one population, as in the unfree table. They are capped
 * well below the whole: even in Vizcaya, where the fuero made every native an
 * hidalgo, the generator must keep producing the people who were not — the
 * incomers, the servants, the ones whose claim was never registered.
 */
export function sampleElite(
  zone: CulturalZone,
  year: number,
  region: string | undefined,
  location: string | undefined,
  gender: 'Male' | 'Female',
  random: () => number,
): SampledElite | null {
  const candidates = resolveElites(zone, year, region, location);
  if (candidates.length === 0) return null;

  const total = candidates.reduce((sum, s) => sum + s.share, 0);
  const scale = total > 0.7 ? 0.7 / total : 1;

  let roll = random();
  for (const stratum of candidates) {
    const share = stratum.share * scale;
    if (roll < share) return draw(stratum, gender, random);
    roll -= share;
  }
  return null;
}

function draw(
  stratum: EliteStratum,
  gender: 'Male' | 'Female',
  random: () => number,
): SampledElite {
  const open = stratum.roles.filter(r => !r.gender || r.gender === gender);
  const pool = open.length > 0 ? open : stratum.roles;
  const totalWeight = pool.reduce((sum, r) => sum + r.weight, 0);

  let roll = random() * totalWeight;
  let role = pool[pool.length - 1].role;
  for (const candidate of pool) {
    roll -= candidate.weight;
    if (roll <= 0) { role = candidate.role; break; }
  }

  // Privilege and money are separate axes; this is the line that keeps them so.
  const wealthTotal = stratum.wealth.reduce((sum, [, w]) => sum + w, 0);
  let wealthRoll = random() * wealthTotal;
  let wealthLevel: WealthLevel = stratum.wealth[stratum.wealth.length - 1][0];
  for (const [level, weight] of stratum.wealth) {
    wealthRoll -= weight;
    if (wealthRoll <= 0) { wealthLevel = level; break; }
  }

  return { stratum, role, wealthLevel };
}

/** For audits: the whole table, so coverage can be checked against the zones. */
export function allEliteStrata(): EliteStratum[] {
  return ELITE_STRATA;
}
