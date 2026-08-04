import type { HistoricalPersona } from '../services/personaGenerator';
import type { SamplingMode } from '../services/demographyService';
import type { HistoricalPersonaAnnotationRecord } from './personaAnnotation';
import type { PersonaOrientationRecord } from './personaOrientation';

export const SHARED_PERSONA_SCHEMA_VERSION = 1 as const;

export interface SharedPersonaSnapshot {
  schemaVersion: typeof SHARED_PERSONA_SCHEMA_VERSION;
  persona: HistoricalPersona;
  annotationRecord?: HistoricalPersonaAnnotationRecord;
  personaOrientationRecord?: PersonaOrientationRecord;
  personaSketch?: string;
  sourcePortraitUrl?: string;
  sourcePortraitAttribution?: string;
  sourceTarget?: 'named_subject' | 'ordinary_person_from_source_world';
  /**
   * Which renderer the sender was using. The classic SVG renderer has been
   * removed and there is only one engine now, so this is read from existing
   * share links and ignored rather than acted on. Kept optional so v1
   * snapshots still parse — bumping the schema version would invalidate every
   * link already in the wild for no gain.
   */
  portraitEngine?: 'classic' | 'lab';
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
