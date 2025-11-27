// Stub service for quest functionality (not used in standalone persona generator)

export interface Quest {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  objectives: string[];
}

// Empty stub - quests not used in persona generator
export function getActiveQuests(): Quest[] {
  return [];
}

export function getQuestById(id: string): Quest | null {
  return null;
}

export function updateQuestProgress(questId: string, progress: any): void {
  // No-op in standalone version
}

export function checkQuestCompletion(questId: string): boolean {
  return false;
}
