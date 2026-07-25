import type { CulturalZone, HistoricalEra } from './index';

export type LocaleType = 'rural' | 'town' | 'city' | 'mobile' | 'unknown';

export interface HistoricalContext {
  year: number;
  era: HistoricalEra;
  culturalZone: CulturalZone;
  region: string;
  location: string;
  regionId: string;
  localeId: string;
  localeType: LocaleType;
  institutions: string[];
  technologies: string[];
}
