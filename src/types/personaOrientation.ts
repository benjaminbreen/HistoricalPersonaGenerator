import type { HistoricalPersonaAnnotationRecord, IngestedPersonaSource } from './personaAnnotation';

export type PersonaSupportLevel = 'explicit' | 'inferred' | 'synthetic' | 'uncertain';
export type PersonaConfidence = 'high' | 'medium' | 'low' | 'speculative';

export interface PersonaOrientationCore {
  name_and_address: {
    full_name: string;
    form_of_address?: string;
  };
  age_and_life_stage: {
    age: number;
    life_stage: string;
  };
  gender_role: string;
  community_identity?: string;
  social_status: string;
  legal_condition: string;
  household_and_relations?: string[];
  year: number;
  place_context: {
    locality: string;
    region: string;
    polity?: string;
    locale_type: string;
  };
  current_pressures?: string[];
  language_and_literacy: {
    languages: string[];
    literacy: string;
  };
  occupation: string;
  labor_relation?: string;
  skills_and_tools?: string[];
  daily_routine: string[];
  economic_position?: string;
  dwelling?: string;
  food?: string[];
  clothing_and_possessions?: string[];
  health_and_body?: string[];
  religion_and_ritual?: string;
  horizons: {
    knowledge: string;
    mobility: string;
  };
  moral_assumptions?: string[];
  self_conception?: string;
  loyalties_and_obligations?: string[];
  concerns_and_desires?: {
    concerns: string[];
    desires: string[];
  };
  social_manner?: {
    authorities: string;
    peers: string;
    strangers: string;
    under_stress: string;
  };
  voice: {
    register: string;
    cadence: string;
    characteristic_vocabulary?: string[];
    avoid?: string[];
    sample?: string;
  };
  conversation_frame?: {
    situation: string;
    interlocutor_relation: string;
  };
  anachronism_guards: string[];
}

export interface PersonaOrientationProvenance {
  field_path: string;
  support: PersonaSupportLevel;
  confidence: PersonaConfidence;
  source_id?: string;
  snippet?: string;
  note?: string;
}

export interface PersonaOrientationRecord {
  schema_version: '2.0.0';
  persona_id: string;
  persona: PersonaOrientationCore;
  sources: Array<{
    source_id: string;
    source_basis: HistoricalPersonaAnnotationRecord['source']['source_basis'];
    title: string;
    citation_label: string;
    url?: string;
    extraction_method?: IngestedPersonaSource['extractionMethod'];
  }>;
  provenance: PersonaOrientationProvenance[];
}

export interface PersonaOrientationModelOutput {
  persona: PersonaOrientationCore;
  provenance?: PersonaOrientationProvenance[];
  day_in_life?: string;
}

export interface LlmTransparencyRecord {
  version: 1;
  request: {
    provider: string;
    variant: string;
    model: string;
    action: string;
    prompt_version: string;
    output_format: string;
    settings: Record<string, unknown>;
    application_options?: {
      target: string;
      preferred_moment?: string;
    };
    source_subject?: unknown;
    prompt: string;
    schema: unknown;
  };
  response: {
    raw_output: string;
    usage: Record<string, unknown>;
  };
  normalized_output?: unknown;
  normalization_notes?: string[];
}

export interface GeneratedPersonaOrientation {
  orientationRecord: PersonaOrientationRecord;
  annotationRecord: HistoricalPersonaAnnotationRecord;
  sketch?: string;
  transparency?: LlmTransparencyRecord;
}
