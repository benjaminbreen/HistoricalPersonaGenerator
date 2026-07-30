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

/**
 * Six bands of prevalence, named for what they mean rather than for what a
 * loot table would call them. `epic` and `legendary` said nothing about how
 * many people were mute or carried a crooked back, and the old bottom band ran
 * unbounded from one in three hundred to one in a million.
 */
export type AttributeRarity =
  | 'common'
  | 'uncommon'
  | 'seldom_seen'
  | 'rare'
  | 'very_rare'
  | 'exceedingly_rare';

/** What the card prints. Ids stay underscored so they survive serialisation. */
export const RARITY_LABELS: Record<AttributeRarity, string> = {
  common: 'common',
  uncommon: 'uncommon',
  seldom_seen: 'seldom seen',
  rare: 'rare',
  very_rare: 'very rare',
  exceedingly_rare: 'exceedingly rare',
};

/** Tiers the card leaves unlabelled: nothing is gained by saying "common". */
export const UNLABELLED_RARITIES: ReadonlySet<AttributeRarity> = new Set<AttributeRarity>(['common']);

const LEGACY_RARITIES: Record<string, AttributeRarity> = {
  // The old ladder's bands, mapped onto the ones covering the same prevalence.
  rare: 'seldom_seen',   // was 5-20 per thousand
  epic: 'rare',          // was 1.5-5
  legendary: 'very_rare', // was everything below 1.5, so this loses the tail
};

/**
 * Personas saved under the old ladder carry `epic` and `legendary` strings.
 * Read them through this rather than showing a tier that no longer exists.
 */
export function normalizeRarity(value: string | undefined | null): AttributeRarity | undefined {
  if (!value) return undefined;
  if (value in RARITY_LABELS) return value as AttributeRarity;
  return LEGACY_RARITIES[value];
}

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
  /**
   * Stamped at generation from the effective prevalence. Definitions do not
   * declare it: a hand-written tier and a computed one drift apart, and when
   * they did, a hundred of the two hundred definitions disagreed with their
   * own weights.
   */
  rarity?: AttributeRarity;
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
  seldom_seen: '#0EA5E9', // Cyan
  rare: '#3B82F6', // Blue
  very_rare: '#8B5CF6', // Purple
  exceedingly_rare: '#F59E0B', // Gold
};

/**
 * Derive the display rarity from an effective prevalence weight (per 1000).
 * This makes the badge colour mean something: a pox-scarred Londoner in 1700
 * reads as common, while the same scarring in 1400 does not appear at all.
 *
 * The bands, in people:
 *   common          more than 6 in 100
 *   uncommon        2 to 6 in 100
 *   seldom seen     1 in 200 to 1 in 50
 *   rare            1 in 700 to 1 in 200
 *   very rare       1 in 3,000 to 1 in 700
 *   exceedingly rare  fewer than 1 in 3,000
 */
export function deriveRarity(effectiveWeight: number): AttributeRarity {
  if (effectiveWeight >= 60) return 'common';
  if (effectiveWeight >= 20) return 'uncommon';
  if (effectiveWeight >= 5) return 'seldom_seen';
  if (effectiveWeight >= 1.5) return 'rare';
  if (effectiveWeight >= 0.3) return 'very_rare';
  return 'exceedingly_rare';
}

/**
 * @deprecated Rarity is now derived from prevalence. Retained so older saved
 * personas and any external callers keep type-checking.
 */
export const RARITY_WEIGHTS: Record<AttributeRarity, number> = {
  common: 400,
  uncommon: 250,
  seldom_seen: 100,
  rare: 30,
  very_rare: 10,
  exceedingly_rare: 3,
};
