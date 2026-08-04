export interface AiAccessStatus {
  freeBiographyRunsUsed: number;
  freeBiographyRunsRemaining: number;
  freeSchemaRunsUsed: number;
  freeSchemaRunsRemaining: number;
  supporterActive: boolean;
  supporterCredits: number;
  supporterExpiresAt: string | null;
  canUseBiography: boolean;
  canUseSchema: boolean;
  biographyCreditCost: number;
  schemaCreditCost: number;
  supporterCreditGrant: number;
  supporterAccessDays: number;
  donateUrl: string;
}

export const AI_ACCESS_REQUIRED_EVENT = 'historical-persona:ai-access-required';
export type AiAccessAction = 'biography' | 'schema';

export interface AiAccessRequiredDetail {
  access: AiAccessStatus | null;
  action: AiAccessAction;
}

export async function getAiAccessStatus(): Promise<AiAccessStatus> {
  const response = await fetch('/api/ai-access', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `AI access route returned ${response.status}.`);
  }
  return data as AiAccessStatus;
}

export function announceAiAccessRequired(
  access: AiAccessStatus | null,
  action: AiAccessAction
): void {
  window.dispatchEvent(new CustomEvent(AI_ACCESS_REQUIRED_EVENT, {
    detail: { access, action } satisfies AiAccessRequiredDetail,
  }));
}
