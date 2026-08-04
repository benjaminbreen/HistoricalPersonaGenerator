import { HistoricalPersonaAnnotationRecord, IngestedPersonaSource } from '../types/personaAnnotation';
import {
  assertPersonaAnnotationRecord,
  normalizePersonaAnnotationRecord,
  validatePersonaAnnotationRecord,
} from './personaMaterialValidationService';
import { announceAiAccessRequired, type AiAccessStatus } from './aiAccessService';

export type PersonaGenerationTarget = 'named_subject' | 'ordinary_person_from_source_world';

/**
 * Which model the route should use.
 *
 * A name, never a model id. The server holds the mapping, so the worst a
 * tampered request can do is name one of these two — a raw id here would let
 * anyone bill the project for a frontier model from the devtools console.
 */
export type ModelVariant = 'luna' | 'nano';

export const DEFAULT_MODEL_VARIANT: ModelVariant = 'luna';

const MODEL_VARIANT_KEY = 'hpg:model-variant';

export const MODEL_VARIANT_LABELS: Record<ModelVariant, string> = {
  luna: 'Luna',
  nano: 'Nano',
};

/** Survives a reload, so a comparison run is not reset by refreshing. */
export function readModelVariant(): ModelVariant {
  try {
    const stored = window.localStorage.getItem(MODEL_VARIANT_KEY);
    if (stored === 'luna' || stored === 'nano') return stored;
  } catch {
    // Private browsing, or storage disabled. The default is a fine answer.
  }
  return DEFAULT_MODEL_VARIANT;
}

export function writeModelVariant(variant: ModelVariant): void {
  try {
    window.localStorage.setItem(MODEL_VARIANT_KEY, variant);
  } catch {
    // Nothing to do — the choice just will not survive the next reload.
  }
}

/** What one call actually cost, as reported by the provider. */
export interface ModelUsage {
  input: number | null;
  output: number | null;
  reasoning: number | null;
  variant: string;
  model: string;
  action: string;
  ms: number;
  truncated: boolean;
}

let lastUsage: ModelUsage | null = null;

/** The most recent call's token counts, for the model toggle to display. */
export function readLastModelUsage(): ModelUsage | null {
  return lastUsage;
}

export interface GeminiPersonaMaterialOptions {
  target: PersonaGenerationTarget;
  preferredMoment?: string;
}

export { normalizePersonaAnnotationRecord, validatePersonaAnnotationRecord };

const postGeminiRoute = async <T,>(body: Record<string, unknown>): Promise<T> => {
  const response = await fetch('/api/gemini-persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, model: readModelVariant() }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 402 && data?.code === 'AI_SUPPORT_REQUIRED') {
      announceAiAccessRequired((data?.access || null) as AiAccessStatus | null);
    }
    throw new Error(data?.error || `Gemini API route returned ${response.status}.`);
  }

  const data = await response.json();
  if (data?.usage) lastUsage = data.usage as ModelUsage;
  return data as T;
};

export async function generatePersonaAnnotationWithGemini(
  source: IngestedPersonaSource,
  options: GeminiPersonaMaterialOptions
): Promise<HistoricalPersonaAnnotationRecord> {
  const data = await postGeminiRoute<{ record: unknown }>({ action: 'generate_annotation', source, options });
  return assertPersonaAnnotationRecord(data.record);
}

export async function generatePersonaSketchWithGemini(record: HistoricalPersonaAnnotationRecord): Promise<string> {
  const data = await postGeminiRoute<{ sketch: string }>({ action: 'generate_sketch', record });
  return data.sketch.trim();
}
