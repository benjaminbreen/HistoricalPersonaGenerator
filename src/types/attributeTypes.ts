/**
 * types/attributeTypes.ts - Character attribute badge system
 *
 * Attributes are sampled by *prevalence*, not by rarity tier. Each definition
 * carries a `baseWeight` expressed as "roughly how many people per thousand
 * have this", optionally modulated by a `weight()` function of the historical
 * context (year, region, class, occupation, age, sex). Rarity is derived from
 * the effective weight at selection time and is purely a display concern.
 */

import { PlayerCharacter } from './playerCharacter';
import { NpcEntity } from './npcTypes';
import { CulturalZone, WealthLevel } from './characterData';

export type AttributeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type AttributeCategory =
  | 'physical'    // durable bodily facts (stature, strength, sensory loss)
  | 'condition'   // illness, chronic ailment, occupational damage
  | 'mental'      // cognition, memory, attention
  | 'social'      // temperament and bearing toward others
  | 'spiritual'   // faith, omen, the numinous
  | 'skill'       // learned competence
  | 'habit'       // sleep, appetite, intoxicants, daily rhythm
  | 'circumstance'// birth, status, rupture, legal condition
  | 'cultural'    // practices legible only within one tradition
  | 'era';        // legacy bucket, retained for older data

/**
 * At most one attribute per exclusive group may be selected. This is what
 * keeps a persona from being simultaneously the eldest and youngest child,
 * or blind and keen-eyed.
 */
export type ExclusiveGroup =
  | 'sight'
  | 'hearing'
  | 'speech'
  | 'mobility'
  | 'stature'
  | 'build'
  | 'birth_order'
  | 'humor'
  | 'temper'
  | 'sleep'
  | 'sociability'
  | 'faith'
  | 'literacy'
  | 'appetite'
  | 'intoxicant'
  | 'memory'
  | 'fortune'
  | 'rootedness'
  | 'handedness';

/**
 * Everything a weight function is allowed to know. Assembled once per
 * generation from the character and the generation context.
 */
export interface AttributeContext {
  year: number;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  culturalZone?: CulturalZone;
  /** Specific place name, e.g. "London". Free text. */
  location?: string;
  /** Broader region, e.g. "British Isles". Free text. */
  region?: string;
  wealth?: WealthLevel;
  socialClass?: string;
  profession?: string;
  /** Lowercased profession, precomputed for cheap substring matching. */
  professionLower: string;
  /** Lowercased `${location} ${region} ${birthplace}`, for place matching. */
  placeLower: string;
  urban: boolean;
}

/**
 * Returns a multiplier applied to `baseWeight`. 1 means "the base rate holds
 * here". 0 means "this could not occur in this context" and hard-excludes the
 * attribute. Values above 1 are how era- and place-specific realities get
 * expressed (pox scarring in a 1700 city, goiter in an Alpine valley).
 */
export type AttributeWeightFn = (
  ctx: AttributeContext,
  character: PlayerCharacter | NpcEntity
) => number;

export interface AttributeBadge {
  id: string;
  name: string;
  icon: string; // Icon name as string, resolved to a component in the UI
  rarity: AttributeRarity;
  description: string;
  category: AttributeCategory;

  /**
   * Prevalence per thousand people, before context. Defaults to 10 (1%).
   * Think in real population terms: 300 = "most adults here", 1 = "one in a
   * thousand".
   */
  baseWeight?: number;
  /** Context multiplier. Return 0 to exclude entirely. */
  weight?: AttributeWeightFn;

  /** Short second-person phrase for backstory prose, e.g. "unable to speak". */
  phrase?: string;
  /** Should this be worked into the generated biography? */
  foundational?: boolean;

  // Optional fields
  condition?: (character: PlayerCharacter | NpcEntity) => boolean;
  effect?: string; // Game effect description
  dialogueHint?: string; // How it affects NPC dialogue

  // Hard gates - checked before weighting
  minAge?: number;
  maxAge?: number;
  /** Birth sex restriction, for attributes that are genuinely sex-linked. */
  sex?: 'Male' | 'Female';
  requiredZones?: CulturalZone[];
  forbiddenZones?: CulturalZone[];
  requiredClass?: string[]; // matched case-insensitively against socialClass/wealth
  yearRange?: [number, number];

  // Legacy culture/era restrictions, still honoured
  requiredEra?: string[];
  requiredCulture?: string[];
  requiredGeography?: string[];

  // Exclusivity
  exclusiveGroup?: ExclusiveGroup;
  excludes?: string[]; // Cannot co-occur with these attribute ids
  requires?: string[]; // Must co-occur with these attribute ids
}

export interface CharacterAttributes {
  badges: AttributeBadge[];
  maxBadges: number; // Usually 0-3
}

// Rarity colors
export const RARITY_COLORS: Record<AttributeRarity, string> = {
  common: '#6B7280', // Gray
  uncommon: '#10B981', // Green
  rare: '#3B82F6', // Blue
  epic: '#8B5CF6', // Purple
  legendary: '#F59E0B', // Gold
};

/**
 * Derive the display rarity from an effective prevalence weight (per 1000).
 * This makes the badge colour mean something: a pox-scarred Londoner in 1700
 * reads as common, while the same scarring in 1400 does not appear at all.
 */
export function deriveRarity(effectiveWeight: number): AttributeRarity {
  if (effectiveWeight >= 60) return 'common';
  if (effectiveWeight >= 20) return 'uncommon';
  if (effectiveWeight >= 5) return 'rare';
  if (effectiveWeight >= 1.5) return 'epic';
  return 'legendary';
}

/**
 * @deprecated Rarity is now derived from prevalence. Retained so older saved
 * personas and any external callers keep type-checking.
 */
export const RARITY_WEIGHTS: Record<AttributeRarity, number> = {
  common: 400,
  uncommon: 250,
  rare: 100,
  epic: 30,
  legendary: 10,
};
