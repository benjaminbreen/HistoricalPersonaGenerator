/**
 * Placeholder for headgear generation service - not needed for persona generator
 */

export function generateContextualHeadgear(
  character: any,
  context: any
): any {
  return null;
}

export function generateContextualStartingPackage(
  character: any,
  profession: string
): any {
  return {
    equipment: {},
    inventory: [],
    companions: []
  };
}
