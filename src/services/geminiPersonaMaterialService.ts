import { HistoricalPersonaAnnotationRecord, IngestedPersonaSource } from '../types/personaAnnotation';
import {
  assertPersonaAnnotationRecord,
  normalizePersonaAnnotationRecord,
  validatePersonaAnnotationRecord,
} from './personaMaterialValidationService';

export type PersonaGenerationTarget = 'named_subject' | 'ordinary_person_from_source_world';

export interface GeminiPersonaMaterialOptions {
  target: PersonaGenerationTarget;
  preferredMoment?: string;
}

export { normalizePersonaAnnotationRecord, validatePersonaAnnotationRecord };

const postGeminiRoute = async <T,>(body: unknown): Promise<T> => {
  const response = await fetch('/api/gemini-persona', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || `Gemini API route returned ${response.status}.`);
  }

  return response.json();
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
