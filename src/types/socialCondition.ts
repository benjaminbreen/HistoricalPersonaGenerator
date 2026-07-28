/**
 * types/socialCondition.ts
 *
 * The two axes that `CulturalZone` cannot carry.
 *
 * These live in `types/` rather than beside the service that samples them
 * because `PlayerCharacter` has to name them, and having the character type
 * import from a service would close a cycle. See
 * `services/populationStrataService.ts` for what fills them in and why.
 */

import type { CulturalZone } from './characterData';

/**
 * Whether this person's labour is owed, sold, compelled or their own.
 *
 * Not a wealth tier and not a social class — the app has both already, and
 * conflating any of the three is what produced a generator in which slavery
 * was an occupation.
 */
export type LegalStatus =
  | 'free'
  | 'enslaved'
  | 'bonded'
  | 'serf'
  | 'conscript'
  | 'colonized_subject'
  | 'transported';

/**
 * Where the line came from, kept separate from where the person is.
 *
 * `generation` is the load-bearing field. A woman born in Senegambia and sold
 * at seventeen and her granddaughter born in the Carolina lowcountry share an
 * `originZone` and almost nothing else, and the naming, language and religion
 * layers each need to know which of the two they are looking at.
 */
export interface Ancestry {
  originZone: CulturalZone;
  /** Shown on the card: "West African", "Circassian", "Bhojpuri or Tamil". */
  originLabel: string;
  /**
   * A region name from `GEOGRAPHICAL_DATA`, so the language layer can attribute
   * a mother tongue to someone born before they got here. It has to be a real
   * key in that table — "Upper Guinea", not "West Africa" — because the
   * language mappings are keyed off the same names.
   *
   * Resolved at sampling time from the stratum's `originRegions`, so that a
   * trade drawing on three coasts produces three sets of answers. A single
   * region gave every first-generation African in Charleston the same mother
   * tongue, which is both monotonous and a claim about the Atlantic trade that
   * nobody would make out loud.
   */
  originRegion?: string;
  /** 0 = born elsewhere and brought here; 1, 2, 3… = generations born in place. */
  generation: number;
  /** Name sets while the family is still close to the origin. */
  originNameKeys?: string[];
  /** Name sets once it has been generations in the new place. */
  localNameKeys?: string[];
}
