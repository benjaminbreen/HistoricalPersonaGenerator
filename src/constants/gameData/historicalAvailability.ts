/**
 * Placeholder for historical availability - not needed for persona generator
 */

export function isItemAvailableInEra(itemId: string, era: string): boolean {
  // All items are available in all eras for persona generator
  return true;
}

export function isItemCulturallyAppropriate(
  itemId: string,
  culturalZone: string
): boolean {
  // All items are culturally appropriate for persona generator
  return true;
}

export function getEraAppropriateSubstitute(
  itemId: string,
  era: string
): string | null {
  // No substitutes needed
  return null;
}
