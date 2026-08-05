import { HistoricalPersonaAnnotationRecord, IngestedPersonaSource } from '../types/personaAnnotation';
import type {
  GeneratedPersonaOrientation,
  LlmTransparencyRecord,
  PersonaOrientationModelOutput,
  PersonaOrientationRecord,
} from '../types/personaOrientation';
import {
  normalizePersonaAnnotationRecord,
  validatePersonaAnnotationRecord,
} from './personaMaterialValidationService';
import {
  createPersonaOrientationRecord,
  personaOrientationToAnnotationRecord,
} from './personaOrientationService';
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
let lastTransparency: LlmTransparencyRecord | null = null;

/** The most recent call's token counts, for the model toggle to display. */
export function readLastModelUsage(): ModelUsage | null {
  return lastUsage;
}

export function readLastLlmTransparency(): LlmTransparencyRecord | null {
  return lastTransparency;
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
      announceAiAccessRequired(
        (data?.access || null) as AiAccessStatus | null,
        body.action === 'generate_annotation' ? 'schema' : 'biography'
      );
    }
    throw new Error(data?.error || `AI persona route returned ${response.status}.`);
  }

  const data = await response.json();
  if (data?.usage) lastUsage = data.usage as ModelUsage;
  if (data?.transparency) lastTransparency = data.transparency as LlmTransparencyRecord;
  return data as T;
};

const ARRAY_LIMITS: Record<string, number> = {
  household_and_relations: 6,
  current_pressures: 6,
  skills_and_tools: 6,
  daily_routine: 6,
  food: 6,
  clothing_and_possessions: 6,
  health_and_body: 6,
  moral_assumptions: 6,
  loyalties_and_obligations: 6,
  anachronism_guards: 8,
};

const finalizeTransparency = (
  transparency: LlmTransparencyRecord | undefined,
  output: PersonaOrientationModelOutput,
  normalized: PersonaOrientationRecord,
  source: IngestedPersonaSource,
  options: GeminiPersonaMaterialOptions,
): LlmTransparencyRecord | undefined => {
  if (!transparency) return undefined;
  const lockNamedSubject = options.target === 'named_subject';
  const rawPersona = (output?.persona || {}) as unknown as Record<string, unknown>;
  const notes: string[] = [];
  for (const [field, limit] of Object.entries(ARRAY_LIMITS)) {
    const value = rawPersona[field];
    if (value !== undefined && !Array.isArray(value)) {
      notes.push(`Converted persona.${field} from ${typeof value} to an array.`);
    } else if (Array.isArray(value) && value.length > limit) {
      notes.push(`Capped persona.${field} at the schema maximum of ${limit} items.`);
    }
  }
  const topLevelOutput = output as unknown as Record<string, unknown>;
  for (const field of ['conversation_frame', 'anachronism_guards']) {
    if (rawPersona[field] === undefined && topLevelOutput[field] !== undefined) {
      notes.push(`Moved ${field} into persona.${field}.`);
    }
  }
  if (rawPersona.anachronism_guards === undefined && topLevelOutput.anachronism_guards === undefined) {
    notes.push('Added two conservative anachronism guards required by the persona contract.');
  }
  if (lockNamedSubject && source.subject?.name && rawPersona.name_and_address) {
    const rawName = (rawPersona.name_and_address as Record<string, unknown>).full_name;
    if (rawName !== source.subject.name) notes.push(`Locked the persona name to the source subject: ${source.subject.name}.`);
  }
  if (lockNamedSubject && source.subject?.genderRole && rawPersona.gender_role !== source.subject.genderRole) {
    notes.push(`Locked gender role to the source metadata: ${source.subject.genderRole}.`);
  }
  if (lockNamedSubject && source.subject?.birthYear !== undefined && rawPersona.year !== normalized.persona.year) {
    notes.push(`Adjusted the chosen moment to ${normalized.persona.year}, within the source subject's lifetime.`);
  }
  const completed: LlmTransparencyRecord = {
    ...transparency,
    request: {
      ...transparency.request,
      application_options: {
        target: options.target,
        preferred_moment: options.preferredMoment,
      },
      source_subject: source.subject || null,
    },
    normalized_output: normalized,
    normalization_notes: notes.length > 0 ? notes : ['No app-side structural repairs or source locks changed the model output.'],
  };
  lastTransparency = completed;
  return completed;
};

export async function generatePersonaAnnotationWithGemini(
  source: IngestedPersonaSource,
  options: GeminiPersonaMaterialOptions
): Promise<GeneratedPersonaOrientation> {
  const data = await postGeminiRoute<{ record: unknown; transparency?: LlmTransparencyRecord }>({ action: 'generate_annotation', source, options });
  const output = data.record as PersonaOrientationModelOutput;
  const orientationRecord = createPersonaOrientationRecord(
    output,
    source,
    options.target === 'named_subject'
  );
  return {
    orientationRecord,
    annotationRecord: personaOrientationToAnnotationRecord(orientationRecord, source),
    transparency: finalizeTransparency(data.transparency, output, orientationRecord, source, options),
  };
}

/**
 * Default source experience: one biography-priced call supplies the visible
 * facts and the prose. The compact record stays internal until the reader
 * explicitly asks to build a Talkie record.
 */
export async function generateSourcePersonaWithGemini(
  source: IngestedPersonaSource,
  options: GeminiPersonaMaterialOptions
): Promise<GeneratedPersonaOrientation> {
  const data = await postGeminiRoute<{ record: unknown; sketch?: string; transparency?: LlmTransparencyRecord }>({
    action: 'generate_source_persona',
    source,
    options,
  });
  const output = data.record as PersonaOrientationModelOutput;
  const orientationRecord = createPersonaOrientationRecord(output, source, options.target === 'named_subject');
  return {
    orientationRecord,
    annotationRecord: personaOrientationToAnnotationRecord(orientationRecord, source),
    sketch: (data.sketch || output.day_in_life || (output.persona as unknown as { day_in_life?: string }).day_in_life || '').trim(),
    transparency: finalizeTransparency(data.transparency, output, orientationRecord, source, options),
  };
}

export async function generatePersonaSketchWithGemini(record: HistoricalPersonaAnnotationRecord): Promise<string> {
  const data = await postGeminiRoute<{ sketch: string; transparency?: LlmTransparencyRecord }>({ action: 'generate_sketch', record });
  return data.sketch.trim();
}
