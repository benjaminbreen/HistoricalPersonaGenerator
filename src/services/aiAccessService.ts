export interface AiAccessStatus {
  freeBiographyRunsUsed: number;
  freeBiographyRunsRemaining: number;
  freeSchemaRunsUsed: number;
  freeSchemaRunsRemaining: number;
  supporterActive: boolean;
  supporterCredits: number;
  supporterExpiresAt: string | null;
  testerAccess?: boolean;
  canUseBiography: boolean;
  canUseSchema: boolean;
  biographyCreditCost: number;
  schemaCreditCost: number;
  supporterCreditGrant: number;
  supporterAccessDays: number;
  donateUrl: string;
}

/**
 * A URL fragment is never sent in an HTTP request or Referer header. Exchange
 * it once for a signed HttpOnly cookie, then remove it before the user can copy
 * or bookmark the secret-bearing URL.
 */
export async function enableTesterAccessFromUrl(): Promise<AiAccessStatus | null> {
  if (typeof window === 'undefined' || !window.location.hash.startsWith('#')) return null;
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const token = hash.get('tester');
  if (!token) return null;
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
  const response = await fetch('/api/tester-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ token }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || `Tester access route returned ${response.status}.`);
  return data as AiAccessStatus;
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
