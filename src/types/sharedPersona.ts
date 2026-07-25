import type { HistoricalPersona } from '../services/personaGenerator';
import type { SamplingMode } from '../services/demographyService';
import type { HistoricalPersonaAnnotationRecord } from './personaAnnotation';
import type { PortraitEngine } from '../components/portraitLab/usePortraitEngine';

export const SHARED_PERSONA_SCHEMA_VERSION = 1 as const;

export interface SharedPersonaSnapshot {
  schemaVersion: typeof SHARED_PERSONA_SCHEMA_VERSION;
  persona: HistoricalPersona;
  annotationRecord?: HistoricalPersonaAnnotationRecord;
  personaSketch?: string;
  sourcePortraitUrl?: string;
  sourcePortraitAttribution?: string;
  sourceTarget?: 'named_subject' | 'ordinary_person_from_source_world';
  portraitEngine: PortraitEngine;
  samplingMode?: SamplingMode;
  generatorVersion?: string;
  originalSeed?: number;
}

export interface StoredSharedPersona {
  id: string;
  createdAt: string;
  checksum: string;
  snapshot: SharedPersonaSnapshot;
}
