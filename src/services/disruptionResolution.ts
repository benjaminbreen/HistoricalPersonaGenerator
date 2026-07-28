/**
 * services/disruptionResolution.ts
 *
 * What was happening here, and did it reach this person?
 *
 * The generator models a steady state. Every table it draws from — professions,
 * social status, clothing, life events — describes an ordinary year in an
 * ordinary place, and the result is that the twentieth century produced a
 * seventy-two-year-old office manager on the Mongolian steppe in 1944, working
 * a desk through the purges, the closure of the monasteries and the war. The
 * regional history files knew perfectly well what was happening in Mongolia in
 * 1944. Nothing consulted them.
 *
 * This module is the missing consultation. It resolves a place and a year into
 * the episodes of war, famine, epidemic, occupation or state violence that were
 * running there, and hands the rest of the pipeline three things: a multiplier
 * on profession weights, a set of dated events that can land on a life, and a
 * clause for the biography.
 *
 * Two design commitments, both load-bearing:
 *
 * 1. **Reweight, never replace.** A window carries a `severity` — the share of
 *    lives it materially shaped — and everything scales by it. A war zone is
 *    not a place where every single person is a soldier or a refugee; clerks
 *    kept clerking through the Blitz. Severity keeps the honest tail instead of
 *    flattening a whole population into its catastrophe.
 *
 * 2. **Windows stack.** 1943 Bengal is a famine *and* a world war *and* a
 *    colonial extraction regime, and a person can be caught by all three. The
 *    resolver returns every match rather than the first, and the multipliers
 *    compose — with a floor and ceiling so that three overlapping windows
 *    cannot drive a weight to zero or to the moon.
 *
 * The severity numbers are judgements, not measurements. They are meant to be
 * argued with, and `scripts/auditDisruption.ts` exists so that arguing with
 * them shows up as a number rather than a vibe.
 */

import type { CulturalZone } from '../types/characterData';
import type { HistoricalContext } from '../types/historicalContext';
import { DISRUPTION_WINDOWS } from '../constants/gameData/disruptionWindows';

export type DisruptionKind =
  | 'war'
  | 'invasion'
  | 'civil_war'
  | 'revolution'
  | 'famine'
  | 'epidemic'
  | 'genocide'
  | 'state_violence'
  | 'forced_settlement'
  | 'displacement'
  | 'occupation'
  | 'slave_raiding'
  | 'collapse';

/**
 * A thing that happened to people who were alive, present and old enough.
 *
 * `importance` and `kind` are plain strings rather than the enums in
 * `lifeHistoryService`, which imports *from* services and would make this a
 * cycle. The consumer maps them.
 */
export interface DisruptionEvent {
  /** Maps onto `EventKind` in lifeHistoryService. */
  kind: string;
  /** Maps onto `EventImportance`. */
  importance: 'tragedy' | 'injury' | 'milestone' | 'opportunity' | 'mundane';
  /** The span the event can land in. Narrow it to the actual dates. */
  years: [number, number];
  /** Third person, past tense, no leading subject — the caller supplies one. */
  text: string;
  /** A short headline for the life-events panel. */
  title: string;
  /** Only reaches people at least this old when it happened. */
  minAge?: number;
  /** Probability before severity scaling. Defaults to 1. */
  chance?: number;
}

export interface DisruptionWindow {
  id: string;
  /** Human-readable, for audits and for the biography. */
  label: string;
  zones: CulturalZone[];
  yearRange: [number, number];
  /** Matched against "<location> <region>", lowercased. Omit for zone-wide. */
  places?: RegExp;
  kinds: DisruptionKind[];
  /**
   * The share of lives here and now that this episode materially shaped, 0–1.
   *
   * Read it as "how often should this show up at all", not "how bad was it".
   * The Thirty Years' War in Brandenburg is 0.85 because almost nobody there
   * got through it untouched; the Crimean War is 0.15 because for most people
   * in the Russian Empire it was news rather than experience.
   */
  severity: number;
  /** Work the episode creates, forces people into, or leaves as the only option. */
  boost?: RegExp;
  /** Settled careers the episode interrupts, closes or makes absurd. */
  damp?: RegExp;
  /**
   * Work the episode creates that the profession table does not contain.
   *
   * `boost` can only make an existing option likelier, and for the twentieth
   * century that is not enough: the modern `EAST_ASIAN` table is a list of
   * office and factory jobs with no pastoral work anywhere in it, so no amount
   * of boosting herders produced one on the 1944 Mongolian steppe — there were
   * none to boost. These are injected directly, with probability `severity`,
   * and they are trades rather than conditions, on the same principle as the
   * population strata.
   */
  roles?: Array<{ role: string; weight: number; gender?: 'Male' | 'Female' }>;
  events?: DisruptionEvent[];
  /** Ways of dying this episode makes ordinary, added to the era's own list. */
  deathCauses?: string[];
  /**
   * One sentence for the biography, third person, present tense, naming the
   * episode as a condition of life rather than as a headline.
   */
  clause?: string;
}

const normalize = (value?: string): string => (value || '').toLowerCase();

/**
 * Every episode running in this place and year.
 *
 * Order is table order, which is roughly chronological within a zone. Callers
 * that want a single representative episode should take the highest severity,
 * not the first — see `dominantDisruption`.
 */
export function resolveDisruptions(
  zone: CulturalZone,
  year: number,
  region?: string,
  location?: string,
): DisruptionWindow[] {
  const place = `${normalize(location)} ${normalize(region)}`;
  return DISRUPTION_WINDOWS.filter(w =>
    w.zones.includes(zone)
    && year >= w.yearRange[0]
    && year <= w.yearRange[1]
    && (!w.places || w.places.test(place))
  );
}

/** As `resolveDisruptions`, but from an already-built context. */
export function disruptionsFor(context?: HistoricalContext): DisruptionWindow[] {
  if (!context) return [];
  return resolveDisruptions(
    context.culturalZone,
    context.year,
    context.region,
    context.location,
  );
}

/** The episode that most shaped life here, if any. */
export function dominantDisruption(windows: DisruptionWindow[]): DisruptionWindow | null {
  if (windows.length === 0) return null;
  return windows.reduce((worst, w) => (w.severity > worst.severity ? w : worst));
}

/**
 * How much likelier — or less likely — this work is because of what is happening.
 *
 * Bounded on both sides. Three overlapping windows all damping the same trade
 * should make it rare, not impossible: a Bengali schoolteacher in 1943 is an
 * unlikely draw and a real person, and a multiplicative chain with no floor
 * would have deleted him.
 */
export function disruptionProfessionMultiplier(
  profession: string,
  context?: HistoricalContext,
): number {
  const windows = disruptionsFor(context);
  if (windows.length === 0) return 1;

  let multiplier = 1;
  for (const window of windows) {
    if (window.boost?.test(profession)) {
      multiplier *= 1 + 2.5 * window.severity;
    }
    if (window.damp?.test(profession)) {
      multiplier *= 1 - 0.7 * window.severity;
    }
  }
  return Math.max(0.08, Math.min(12, multiplier));
}

/**
 * The trade this episode put someone into, where it displaced the ordinary
 * labour market entirely.
 *
 * Rolled against severity per window, taking the first that lands, so a
 * moderate episode leaves most people in whatever the profession table would
 * have given them and a catastrophic one does not. Returns null when the
 * episode has nothing to add or the roll goes the other way, and null means
 * "use the ordinary draw".
 */
export function disruptionRole(
  zone: CulturalZone,
  year: number,
  region: string | undefined,
  location: string | undefined,
  gender: 'Male' | 'Female',
  random: () => number,
): string | null {
  // Worst first: where two episodes overlap, the one that shaped more lives
  // decides what this one does. In 1944 Mongolia both the collectivisation and
  // the war with Japan are running, and it is the collectivisation that put
  // this person on a collective.
  const active = resolveDisruptions(zone, year, region, location)
    .slice()
    .sort((a, b) => b.severity - a.severity);

  for (const window of active) {
    if (!window.roles || window.roles.length === 0) continue;
    if (random() > window.severity) continue;

    const open = window.roles.filter(r => !r.gender || r.gender === gender);
    const pool = open.length > 0 ? open : window.roles;
    const total = pool.reduce((sum, r) => sum + r.weight, 0);
    let roll = random() * total;
    for (const candidate of pool) {
      roll -= candidate.weight;
      if (roll <= 0) return candidate.role;
    }
    return pool[pool.length - 1].role;
  }
  return null;
}

/**
 * Ways of dying that this place and year made ordinary.
 *
 * Returned as a flat list for the caller to append to its era table. The
 * caller decides how heavily to weight them; see `lifeHistoryService`.
 */
export function disruptionDeathCauses(
  zone: CulturalZone,
  year: number,
  region?: string,
  location?: string,
): string[] {
  return resolveDisruptions(zone, year, region, location)
    .flatMap(w => w.deathCauses ?? []);
}

/**
 * The events from these episodes that actually reached one particular life.
 *
 * A window's events are candidates, not certainties. Each is gated on the
 * persona having been alive and old enough when it happened, then on a roll
 * against `severity * chance` — so the same window produces a different life
 * for two people who lived through it, which is the point.
 */
export function disruptionLifeEvents(
  options: {
    zone: CulturalZone;
    birthYear: number;
    currentYear: number;
    region?: string;
    location?: string;
    random: () => number;
  },
): Array<DisruptionEvent & { year: number; windowLabel: string; windowId: string }> {
  const { zone, birthYear, currentYear, region, location, random } = options;
  const windows = resolveDisruptions(zone, currentYear, region, location);
  const landed: Array<DisruptionEvent & { year: number; windowLabel: string; windowId: string }> = [];

  for (const window of windows) {
    for (const event of window.events ?? []) {
      const [from, to] = event.years;
      // The span has to overlap the life. An event that finished before the
      // persona was born, or that has not happened yet in the year we are
      // observing them, is not part of their biography.
      const earliest = Math.max(from, birthYear);
      const latest = Math.min(to, currentYear);
      if (earliest > latest) continue;

      const year = earliest + Math.floor(random() * (latest - earliest + 1));
      const ageAtEvent = year - birthYear;
      if (ageAtEvent < (event.minAge ?? 0)) continue;

      if (random() > window.severity * (event.chance ?? 1)) continue;
      landed.push({ ...event, year, windowLabel: window.label, windowId: window.id });
    }
  }

  return landed.sort((a, b) => a.year - b.year);
}

/**
 * The sentence the biography can use, if the episode reached this person.
 *
 * Rolled rather than always returned: in a window at severity 0.4, three in
 * five biographies should not mention it at all, because three in five lives
 * did not visibly turn on it.
 */
export function disruptionClause(
  zone: CulturalZone,
  year: number,
  region: string | undefined,
  location: string | undefined,
  random: () => number,
): string | null {
  const windows = resolveDisruptions(zone, year, region, location).filter(w => w.clause);
  if (windows.length === 0) return null;

  // Weighted by severity rather than taking the worst outright.
  //
  // Taking the maximum silenced every window that ever overlapped a larger
  // one: the Mount Lebanon famine never spoke because the Great War covers the
  // same years and zone at a higher severity, and the Beaver Wars never spoke
  // because the virgin-soil epidemics outrank them for eighty years. Both are
  // real answers to "what is happening here", and a place can be inside more
  // than one catastrophe at once — that is usually the point.
  const total = windows.reduce((sum, w) => sum + w.severity, 0);
  let roll = random() * total;
  let chosen = windows[windows.length - 1];
  for (const window of windows) {
    roll -= window.severity;
    if (roll <= 0) { chosen = window; break; }
  }

  if (random() > chosen.severity) return null;
  return chosen.clause ?? null;
}
