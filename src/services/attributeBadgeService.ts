/**
 * services/attributeBadgeService.ts - Generates and manages character attribute badges
 *
 * Selection is weighted sampling without replacement over the whole pool. The
 * previous implementation rolled a rarity tier and then picked uniformly inside
 * it, which meant an attribute's real frequency was tierWeight / tierSize: with
 * only six members in the "rare" tier, being blind was about as likely as any
 * given "common" trait. Prevalence now lives on the attribute itself.
 */

import {
  AttributeBadge,
  AttributeContext,
  AttributeRarity,
  deriveRarity,
} from '../types/attributeTypes';
import { PlayerCharacter } from '../types';
import { NpcEntity } from '../types/npcTypes';
import { CulturalZone, WealthLevel } from '../types/characterData';
import {
  UNIVERSAL_ATTRIBUTES,
  CULTURAL_ATTRIBUTES,
  getAllAttributes,
  findAttributeById,
  passesHardGates,
  getApplicableAttributes,
} from '../constants/attributeDefinitions';

export interface AttributeGenerationOptions {
  maxBadges?: number;
  /** From HistoricalContext; drives the urban/rural weighting. */
  localeType?: 'rural' | 'town' | 'city' | 'mobile' | 'unknown';
  region?: string;
  random?: () => number;
}

interface WeightedCandidate {
  attr: AttributeBadge;
  weight: number;
}

const DEFAULT_BASE_WEIGHT = 10;

export class AttributeBadgeService {
  /**
   * Generate attributes for a character, weighted by how common each one
   * actually was for someone of this age, sex, class, trade, place and year.
   */
  static generateAttributes(
    character: PlayerCharacter | NpcEntity,
    year: number,
    geography: string,
    optionsOrMax: AttributeGenerationOptions | number = {}
  ): AttributeBadge[] {
    const options: AttributeGenerationOptions =
      typeof optionsOrMax === 'number' ? { maxBadges: optionsOrMax } : optionsOrMax;
    const random = options.random ?? Math.random;
    const maxBadges = options.maxBadges ?? 3;

    const ctx = this.buildContext(character, year, geography, options);
    const candidates = this.scorePool(character, ctx);
    if (candidates.length === 0) return [];

    const numBadges = this.rollBadgeCount(maxBadges, random);
    if (numBadges === 0) return [];

    const selected: AttributeBadge[] = [];
    const usedIds = new Set<string>();
    const usedGroups = new Set<string>();
    // Every id excluded by something already chosen, plus the reverse direction.
    const forbidden = new Set<string>();

    let pool = candidates.slice();

    while (selected.length < numBadges && pool.length > 0) {
      const picked = this.weightedPick(pool, random);
      if (!picked) break;

      pool = pool.filter(c => c.attr.id !== picked.attr.id);

      if (forbidden.has(picked.attr.id)) continue;
      if (picked.attr.exclusiveGroup && usedGroups.has(picked.attr.exclusiveGroup)) continue;
      if (picked.attr.requires && !picked.attr.requires.every(id => usedIds.has(id))) continue;

      selected.push({
        ...picked.attr,
        rarity: deriveRarity(picked.weight),
        // Functions do not survive serialisation and have no business in
        // saved persona data.
        condition: undefined,
        weight: undefined,
      });
      usedIds.add(picked.attr.id);
      if (picked.attr.exclusiveGroup) usedGroups.add(picked.attr.exclusiveGroup);

      picked.attr.excludes?.forEach(id => forbidden.add(id));
      // Exclusion is symmetric even when only one side declares it.
      pool.forEach(c => {
        if (c.attr.excludes?.includes(picked.attr.id)) forbidden.add(c.attr.id);
      });
    }

    return selected;
  }

  /**
   * Assemble everything the weight functions are allowed to know.
   */
  private static buildContext(
    character: PlayerCharacter | NpcEntity,
    year: number,
    geography: string,
    options: AttributeGenerationOptions
  ): AttributeContext {
    const char = character as any;
    const birthSex: 'Male' | 'Female' | 'Other' =
      char.birthSex === 'Male' || char.birthSex === 'Female'
        ? char.birthSex
        : char.gender === 'Male' || char.gender === 'Female'
          ? char.gender
          : 'Other';

    const region = options.region ?? char.region;
    const profession = char.profession ?? char.occupation ?? '';
    const placeLower = `${geography ?? ''} ${region ?? ''} ${char.birthplace ?? ''}`.toLowerCase();

    const locale = options.localeType;
    const urban = locale === 'city' || locale === 'town'
      ? true
      : locale === 'rural'
        ? false
        : /\b(city|town|borough|ward|quarter)\b/.test(placeLower);

    return {
      year,
      age: typeof char.age === 'number' ? char.age : 30,
      sex: birthSex,
      culturalZone: char.culturalZone as CulturalZone | undefined,
      location: geography,
      region,
      wealth: char.wealthLevel as WealthLevel | undefined,
      socialClass: char.socialClass ?? char.class,
      profession,
      professionLower: String(profession).toLowerCase(),
      placeLower,
      urban,
    };
  }

  /**
   * Apply hard gates, legacy conditions and context weighting, and drop
   * anything that comes out at zero.
   */
  private static scorePool(
    character: PlayerCharacter | NpcEntity,
    ctx: AttributeContext
  ): WeightedCandidate[] {
    const scored: WeightedCandidate[] = [];

    for (const attr of getAllAttributes()) {
      if (!passesHardGates(attr, ctx)) continue;

      if (attr.condition) {
        try {
          if (!attr.condition(character)) continue;
        } catch {
          continue;
        }
      }

      let weight = attr.baseWeight ?? DEFAULT_BASE_WEIGHT;
      if (attr.weight) {
        try {
          weight *= attr.weight(ctx, character);
        } catch {
          continue;
        }
      }

      if (!Number.isFinite(weight) || weight <= 0) continue;
      scored.push({ attr, weight });
    }

    return scored;
  }

  /**
   * How many badges this persona gets. Weighted toward one or two, as before.
   */
  private static rollBadgeCount(max: number, random: () => number): number {
    if (max <= 0) return 0;
    const roll = random();
    if (roll < 0.12) return 0;
    if (roll < 0.45) return Math.min(1, max);
    if (roll < 0.78) return Math.min(2, max);
    return Math.min(3, max);
  }

  private static weightedPick(
    pool: WeightedCandidate[],
    random: () => number
  ): WeightedCandidate | null {
    const total = pool.reduce((sum, c) => sum + c.weight, 0);
    if (total <= 0) return null;

    let roll = random() * total;
    for (const candidate of pool) {
      roll -= candidate.weight;
      if (roll <= 0) return candidate;
    }
    return pool[pool.length - 1];
  }

  /**
   * The prevalence-derived rarity for an attribute in a given context. Useful
   * for tooling and audits; generation stamps this onto each badge already.
   */
  static rarityInContext(
    attributeId: string,
    character: PlayerCharacter | NpcEntity,
    year: number,
    geography: string,
    options: AttributeGenerationOptions = {}
  ): AttributeRarity | null {
    const ctx = this.buildContext(character, year, geography, options);
    const match = this.scorePool(character, ctx).find(c => c.attr.id === attributeId);
    return match ? deriveRarity(match.weight) : null;
  }

  /**
   * Get specific attribute by ID
   */
  static getAttributeById(id: string): AttributeBadge | undefined {
    return findAttributeById(id);
  }

  /**
   * Apply attribute effects to character
   */
  static applyAttributeEffects(
    character: PlayerCharacter | NpcEntity,
    attributes: AttributeBadge[]
  ): void {
    for (const attr of attributes) {
      if (!attr.effect) continue;

      // Parse effect strings and apply
      if (attr.effect.includes('+')) {
        const match = attr.effect.match(/\+(\d+) to (\w+)/);
        if (match) {
          const [, value, stat] = match;
          if (stat === 'combat' && 'combat' in character) {
            (character as any).combatBonus = ((character as any).combatBonus || 0) + parseInt(value);
          }
        }
      }
    }
  }

  /**
   * Check if character could have a specific attribute in this context.
   */
  static shouldHaveAttribute(
    character: PlayerCharacter | NpcEntity,
    attributeId: string,
    year: number,
    geography: string,
    options: AttributeGenerationOptions = {}
  ): boolean {
    const ctx = this.buildContext(character, year, geography, options);
    return this.scorePool(character, ctx).some(c => c.attr.id === attributeId);
  }
}

// Re-exported so existing importers of these names keep working.
export { UNIVERSAL_ATTRIBUTES, CULTURAL_ATTRIBUTES, getApplicableAttributes };
