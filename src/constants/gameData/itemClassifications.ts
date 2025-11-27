/**
 * Placeholder for item classifications - not needed for persona generator
 */

// These match the functions from itemMetadata.ts but with different naming
export function getEquipmentSlot(itemId: string): string | null {
  return null;
}

export function getMaterialFromName(itemName: string): string {
  return 'cloth';
}

export function getCategoryFromName(itemName: string): string {
  return 'misc';
}

export function getEmojiFromName(itemName: string): string {
  return '📦';
}
