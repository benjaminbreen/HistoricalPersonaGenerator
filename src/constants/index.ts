/**
 * Main constants export file for Historical Persona Generator
 */

// Re-export character data
export * from './characterData/index';
export { CHARACTER_NAMES, getEraSpecificFallback } from './characterData/names';
export type { FallbackConfig } from './characterData/names';
export { PROFESSIONS, getProfessionEmoji } from './characterData/professions';
export { RELIGION_DATA } from './characterData/religions';
export { PERSONAL_BELIEFS, IDEOLOGIES } from './gameData/beliefs';

// Re-export core constants
export * from './core';

// Placeholder exports for game data (not used in persona generator)
export const ITEM_DEFINITIONS: any[] = [];
export const ANIMAL_DATA: any[] = [];

/**
 * `STARTING_PACKAGES` used to be re-declared here as `{}`, which silently
 * overrode the real 500-profession table re-exported from `characterData/index`
 * above — a local export always wins over `export *`. Every persona therefore
 * assembled an empty package and the equipment panel showed only clothing.
 *
 * The table is now live. What it hands out is narrowed in `assembleStartingPackage`:
 * apparel slots stay with the clothing system, which is the culture- and
 * climate-aware one, and everything else is gated on the year.
 */
