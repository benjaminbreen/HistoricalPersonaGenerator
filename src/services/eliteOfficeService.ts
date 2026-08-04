/**
 * services/eliteOfficeService.ts
 *
 * Who held an office, and how many of them there were.
 *
 * The third of the three tables that decide a persona's standing before the
 * profession tables are consulted at all, and it runs last:
 *
 *   1. `populationStrataService` — was this person owned, indentured, tied?
 *   2. `eliteStrataService`      — was this person born into a privileged order?
 *   3. this                      — did this person hold an office?
 *
 * The ordering is the same argument each time. A person cannot be both owned
 * and a bishop, and of the two the unfree condition is the one the app must
 * never drop. An office is compatible with a privileged order — most office
 * holders came out of one — but the office is the more specific claim, so it
 * wins the profession slot when both fire.
 *
 * Frequency is not decided here. It is decided by `ELITE_TIERS` in
 * `eliteOffices.ts`, one number per rung, anchored on a count. This file only
 * rolls against those numbers and picks which office.
 */

import type { CulturalZone } from '../types/characterData';
import {
  ELITE_OFFICES,
  ELITE_TIERS,
  drawShare,
  tierDefinition,
  type EliteOffice,
  type EliteTier,
} from '../constants/gameData/eliteOffices';

export interface SampledOffice {
  office: EliteOffice;
  role: string;
  tier: EliteTier;
  /**
   * The real per-capita share of this rung, for the card. Not the rate it was
   * rolled at — see the `SPECTACLE` note in `eliteOffices.ts`.
   */
  trueShare: number;
}

const normalize = (value?: string): string => (value || '').toLowerCase();

/** Every office of a rung that could be held in this place and year. */
export function resolveOffices(
  tier: EliteTier,
  zone: CulturalZone,
  year: number,
  region?: string,
  location?: string,
  gender?: 'Male' | 'Female',
): EliteOffice[] {
  const place = `${normalize(location)} ${normalize(region)}`;
  return ELITE_OFFICES.filter(o =>
    o.tier === tier
    && o.zones.includes(zone)
    && year >= o.yearRange[0]
    && year <= o.yearRange[1]
    && (!o.places || o.places.test(place))
    && (!gender || !o.gender || o.gender === gender)
  );
}

/**
 * Whether this person held an office, and which.
 *
 * Rungs are tried rarest first, against a single roll, so that the shares stay
 * the shares: trying them in the other order would let the common rung consume
 * draws that belonged to the rare one. A rung whose catalogue is empty for this
 * zone and year yields nothing rather than falling through to a neighbour —
 * there were no bishops in Polynesia in 1200, and inventing one to hit a target
 * share would be exactly the kind of accuracy this table exists to avoid.
 */
export function sampleEliteOffice(
  zone: CulturalZone,
  year: number,
  region: string | undefined,
  location: string | undefined,
  gender: 'Male' | 'Female',
  random: () => number,
): SampledOffice | null {
  const rolled = random();
  const rungs = ELITE_TIERS
    .filter(t => t.source === 'office-roll')
    .sort((a, b) => drawShare(a) - drawShare(b));

  let threshold = 0;
  for (const rung of rungs) {
    threshold += drawShare(rung);
    if (rolled >= threshold) continue;

    const candidates = resolveOffices(rung.tier, zone, year, region, location, gender);
    if (candidates.length === 0) return null;
    const office = pick(candidates, random);
    return { office, role: office.role, tier: rung.tier, trueShare: rung.trueShare };
  }
  return null;
}

function pick(offices: EliteOffice[], random: () => number): EliteOffice {
  const total = offices.reduce((sum, o) => sum + o.weight, 0);
  let roll = random() * total;
  for (const office of offices) {
    roll -= office.weight;
    if (roll <= 0) return office;
  }
  return offices[offices.length - 1];
}

/** "roughly 1 in 75,000 lives" — the true share, phrased for the card. */
export function officeRarityPhrase(tier: EliteTier): string {
  const share = tierDefinition(tier).trueShare;
  const denominator = Math.round(1 / share);
  return `roughly 1 in ${denominator.toLocaleString('en-US')} human lives`;
}
