// Stub hook for portrait expressions

export type PortraitExpression =
  | 'neutral'
  | 'smile'
  | 'surprise'
  | 'concern'
  | 'tired'
  | 'annoyed'
  | 'scowl'
  | 'excited'
  | 'sad'
  | 'angry';

export function usePortraitExpression(character: any) {
  return {
    currentExpression: 'neutral' as PortraitExpression,
    blinkProgress: 0,
  };
}

// Map tile biome types to portrait expressions
export function mapTileToExpr(biome: string): PortraitExpression | null {
  const biomeExpressionMap: Record<string, PortraitExpression> = {
    'desert': 'tired',
    'tundra': 'concern',
    'swamp': 'annoyed',
    'mountain': 'surprise',
    'forest': 'neutral',
    'ocean': 'surprise',
    'jungle': 'concern',
    'arctic': 'concern',
    'volcanic': 'surprise',
  };

  return biomeExpressionMap[biome] || null;
}

// Map character status to expressions
export function mapStatusToExpr(status: {
  health?: number;
  maxHealth?: number;
  hunger?: number;
  thirst?: number;
  fatigue?: number;
}): PortraitExpression | null {
  const { health, maxHealth, hunger, thirst, fatigue } = status;

  // Health-based expressions
  if (health !== undefined && maxHealth !== undefined) {
    const healthPercent = health / maxHealth;
    if (healthPercent < 0.2) return 'concern';
    if (healthPercent < 0.4) return 'tired';
  }

  // Fatigue-based expressions
  if (fatigue !== undefined && fatigue > 80) {
    return 'tired';
  }

  // Hunger-based expressions
  if (hunger !== undefined && hunger > 80) {
    return 'annoyed';
  }

  // Thirst-based expressions
  if (thirst !== undefined && thirst > 80) {
    return 'annoyed';
  }

  return null;
}
