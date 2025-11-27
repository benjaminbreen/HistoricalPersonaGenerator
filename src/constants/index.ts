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
export const STARTING_PACKAGES: any = {};
