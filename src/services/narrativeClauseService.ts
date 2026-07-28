/**
 * services/narrativeClauseService.ts
 *
 * One gating mechanism for every bank of prose fragments in the biography.
 *
 * Before this existed only `TRADE_TEXTURES` was date-gated. Everything else —
 * childhood, the surrounding world, the word for a household's standing — was
 * keyed off `SettlementRegister`, which has three values and was being asked to
 * stand in for era, class, place and zone all at once. The result measured as
 * 28% of all generated sentences appearing in five or six of the six eras: a
 * Roman potter in York, a Samarkand vendor in 1660 and a Kolkata janitor in
 * 1996 all resolved to `district` and drew from the same three sentences.
 *
 * A clause here carries its own conditions, and `selectClause` prefers the most
 * specific clause that fits. Generic text survives only as the fallback for a
 * combination nobody has written for yet.
 */

import type { CulturalZone } from '../types';
import type { LocaleType } from '../types/historicalContext';
import type { NarrativePronouns } from './narrativeTextService';
import { conjugate } from './narrativeTextService';
import type { SettlementRegister, SocietyCapability } from '../constants/societyCapabilities';

/**
 * Where a life sits in the order of its own society.
 *
 * Deliberately not the same axis as `wealthLevel`, which is about how much a
 * household has, or `socialClass`, which is a period label. This is about what
 * a life is structurally like: whether labor is owed, sold, directed, or
 * bought. A poor noble and a prosperous peasant are the cases that make the
 * distinction worth keeping.
 */
export type ClassBand = 'bonded' | 'poor' | 'working' | 'middling' | 'elite';

export const CLASS_BANDS: ClassBand[] = ['bonded', 'poor', 'working', 'middling', 'elite'];

/** Attributes that describe labor owed rather than sold. */
const BONDED_ATTRIBUTES = new Set(['serf_born', 'indentured', 'enslaved', 'bondservant']);

/**
 * Derive the band from what the generator already assigns. `socialClass`
 * carries period labels ("Peasant" before 1900, "Working Class" after), so both
 * vocabularies are matched here rather than in every caller.
 */
export function classBandFor(input: {
  socialClass?: string;
  wealthLevel?: string;
  attributeIds?: string[];
}): ClassBand {
  if (input.attributeIds?.some(id => BONDED_ATTRIBUTES.has(id))) return 'bonded';

  const status = (input.socialClass || '').trim().toLowerCase();
  const wealth = (input.wealthLevel || 'modest').trim().toLowerCase();
  const wealthy = wealth === 'wealthy' || wealth === 'noble';
  const comfortable = wealthy || wealth === 'comfortable';

  if (status === 'noble' || status === 'upper class') return 'elite';
  // A merchant commands other people's labor but is not born to rule; only the
  // ones who have converted trade into standing read as elite.
  if (status === 'merchant') return wealth === 'noble' ? 'elite' : 'middling';
  if (status === 'middle class') return wealthy ? 'elite' : 'middling';
  if (status === 'commoner') return comfortable ? 'middling' : 'working';
  if (status === 'peasant' || status === 'working class') {
    return wealth === 'poor' ? 'poor' : 'working';
  }

  // No usable status label: fall back to wealth alone.
  if (wealth === 'poor') return 'poor';
  if (wealth === 'modest') return 'working';
  if (wealth === 'comfortable') return 'middling';
  return 'elite';
}

// ---------------------------------------------------------------------------
// Clauses and their conditions
// ---------------------------------------------------------------------------

export interface Clause {
  /** Sentence or sentence body. May contain `${subject}`-style placeholders. */
  text: string;
  minYear?: number;
  maxYear?: number;
  zones?: CulturalZone[];
  notZones?: CulturalZone[];
  register?: SettlementRegister[];
  locale?: LocaleType[];
  band?: ClassBand[];
  /** The society must have this capability for the clause to make sense. */
  needs?: SocietyCapability[];
  /** The society must lack it — for clauses about the absence of a thing. */
  lacks?: SocietyCapability[];
  /** The place must have this institution present. */
  institution?: string;
  /** The period must have this technology in use. */
  technology?: string;
}

export interface ClauseContext {
  year: number;
  zone?: CulturalZone;
  register: SettlementRegister;
  locale: LocaleType;
  band: ClassBand;
  institutions: string[];
  technologies: string[];
  hasCapability: (capability: SocietyCapability) => boolean;
}

/** Seeded chooser supplied by the caller so prose stays stable per persona. */
export type Pick = <T>(values: T[]) => T;

const matchesList = <T,>(allowed: T[] | undefined, value: T | undefined): boolean =>
  !allowed || (value !== undefined && allowed.includes(value));

export function clauseFits(clause: Clause, ctx: ClauseContext): boolean {
  if (clause.minYear !== undefined && ctx.year < clause.minYear) return false;
  if (clause.maxYear !== undefined && ctx.year > clause.maxYear) return false;
  // A clause listing zones is asserting something about those zones. Without a
  // zone in context we cannot honor that, so the clause is not eligible.
  if (clause.zones && !(ctx.zone && clause.zones.includes(ctx.zone))) return false;
  if (clause.notZones && ctx.zone && clause.notZones.includes(ctx.zone)) return false;
  if (!matchesList(clause.register, ctx.register)) return false;
  if (!matchesList(clause.locale, ctx.locale)) return false;
  if (!matchesList(clause.band, ctx.band)) return false;
  if (clause.needs && !clause.needs.every(c => ctx.hasCapability(c))) return false;
  if (clause.lacks && clause.lacks.some(c => ctx.hasCapability(c))) return false;
  if (clause.institution && !ctx.institutions.includes(clause.institution)) return false;
  if (clause.technology && !ctx.technologies.includes(clause.technology)) return false;
  return true;
}

const CONSTRAINT_KEYS: Array<keyof Clause> = [
  'minYear', 'maxYear', 'zones', 'notZones', 'register',
  'locale', 'band', 'needs', 'lacks', 'institution', 'technology',
];

/** How many conditions a clause states. Used to prefer the specific one. */
export function specificity(clause: Clause): number {
  return CONSTRAINT_KEYS.reduce((n, key) => (clause[key] === undefined ? n : n + 1), 0);
}

/**
 * Every clause in the bank that fits, most specific first.
 */
export function eligibleClauses(bank: Clause[], ctx: ClauseContext): Clause[] {
  return bank.filter(clause => clauseFits(clause, ctx));
}

/**
 * Choose one clause, preferring those that say something about this particular
 * year, zone, place or station.
 *
 * The rule is deliberately not "always take the most specific": that would give
 * every persona in a bucket the same sentence. A conditioned clause wins only
 * when there are at least two of them to choose between; otherwise the generic
 * pool is mixed back in so there is still something to vary.
 */
export function selectClause(
  bank: Clause[],
  ctx: ClauseContext,
  pick: Pick,
): Clause | undefined {
  const eligible = eligibleClauses(bank, ctx);
  if (eligible.length === 0) return undefined;

  const conditioned = eligible.filter(c => specificity(c) > 0);
  const generic = eligible.filter(c => specificity(c) === 0);
  const pool = conditioned.length >= 2
    ? conditioned
    : conditioned.length === 1
      ? [...conditioned, ...generic]
      : generic;

  return pick(pool.length > 0 ? pool : eligible);
}

/**
 * Choose one clause and render its placeholders, or return '' if the bank has
 * nothing for this context.
 */
export function selectText(
  bank: Clause[],
  ctx: ClauseContext,
  pick: Pick,
  pronouns: NarrativePronouns,
  extras?: Record<string, string | undefined>,
): string {
  const clause = selectClause(bank, ctx, pick);
  return clause ? renderClause(clause.text, pronouns, extras) : '';
}

// ---------------------------------------------------------------------------
// Placeholder expansion
// ---------------------------------------------------------------------------

const upperFirst = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Expand the pronoun placeholders clause text is written with.
 *
 * `${verb:see}` conjugates for the narrative subject, which the old clause
 * banks did with a hand-written `.replace(/\bsees\b/g, …)` per clause — a fix
 * that had to be repeated, and was not, at every clause that acquired a verb.
 */
export function renderClause(
  text: string,
  pronouns: NarrativePronouns,
  extras?: Record<string, string | undefined>,
): string {
  return text
    .replace(/\$\{verb:([a-z]+)\}/gi, (_, verb: string) => conjugate(verb, pronouns))
    .replace(/\$\{Verb:([a-z]+)\}/gi, (_, verb: string) => upperFirst(conjugate(verb, pronouns)))
    .replace(/\$\{(location|language|religion|name)\}/g, (whole, key: string) => extras?.[key] ?? whole)
    .replace(/\$\{subjectCap\}/g, upperFirst(pronouns.subject))
    .replace(/\$\{subject\}/g, pronouns.subject)
    .replace(/\$\{objectCap\}/g, upperFirst(pronouns.object))
    .replace(/\$\{object\}/g, pronouns.object)
    .replace(/\$\{possessiveCap\}/g, pronouns.possessiveCap)
    .replace(/\$\{possessive\}/g, pronouns.possessive)
    .replace(/\$\{be\}/g, pronouns.be)
    .replace(/\$\{was\}/g, pronouns.subject === 'they' ? 'were' : 'was');
}

/** Ids referenced by clause banks, for audits that check nothing is orphaned. */
export function clauseConstraintKeys(): Array<keyof Clause> {
  return [...CONSTRAINT_KEYS];
}
