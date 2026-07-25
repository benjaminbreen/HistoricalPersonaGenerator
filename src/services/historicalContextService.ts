import type { CulturalZone, HistoricalEra } from '../types';
import type { HistoricalContext, LocaleType } from '../types/historicalContext';

const stableId = (value: string): string => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '') || 'unknown';

function inferLocaleType(region: string, location: string): LocaleType {
  const place = `${region} ${location}`;
  if (/\b(?:london|paris|rome|vienna|constantinople|istanbul|venice|prague|berlin|madrid|lisbon|amsterdam|cairo|alexandria|baghdad|damascus|jerusalem|mecca|medina|isfahan|tehran|beijing|nanjing|hangzhou|kyoto|edo|tokyo|seoul|delhi|agra|lahore|dhaka|timbuktu|kilwa|cuzco|lima|potosi|boston|philadelphia|montreal)\b/i.test(place)) return 'city';
  if (/\b(?:city|capital|metropolis|urban|port|harbor|harbour)\b/i.test(place)) return 'city';
  if (/\b(?:town|borough|market|settlement)\b/i.test(place)) return 'town';
  if (/\b(?:steppe|nomad|pastoral|caravan|migratory)\b/i.test(place)) return 'mobile';
  if (/\b(?:valley|plain|plateau|highland|lowland|forest|coast|basin|river|mountain|desert|island|rural|village)\b/i.test(place)) return 'rural';
  return 'unknown';
}

function technologiesForYear(year: number): string[] {
  const technologies: string[] = [];
  if (year >= 1450) technologies.push('printing_press');
  if (year >= 1760) technologies.push('mechanized_production');
  if (year >= 1830) technologies.push('railway');
  if (year >= 1840) technologies.push('telegraph');
  if (year >= 1878) technologies.push('telephone');
  if (year >= 1885) technologies.push('automobile');
  if (year >= 1900) technologies.push('motor_transport');
  if (year >= 1920) technologies.push('broadcast_radio');
  if (year >= 1930) technologies.push('television');
  if (year >= 1940) technologies.push('electronic_computing');
  return technologies;
}

function institutionsForYear(year: number, localeType: LocaleType): string[] {
  const institutions: string[] = [];
  if (year >= -3000) institutions.push('organized_religion');
  if (year >= 900 && year <= 1850 && localeType !== 'rural') institutions.push('craft_guild');
  if (year >= 1080 && localeType !== 'rural') institutions.push('university');
  if (year >= 1760 && localeType !== 'rural') institutions.push('factory');
  if (year >= 1800 && localeType !== 'rural') institutions.push('modern_bureaucracy');
  if (year >= 1830 && localeType !== 'rural') institutions.push('railway_station');
  if (year >= 1900 && localeType !== 'rural') institutions.push('mass_political_party');
  return institutions;
}

export function createHistoricalContext(input: {
  year: number;
  era: HistoricalEra;
  culturalZone: CulturalZone;
  region: string;
  location: string;
}): HistoricalContext {
  const localeType = inferLocaleType(input.region, input.location);
  return {
    ...input,
    regionId: stableId(input.region),
    localeId: stableId(input.location),
    localeType,
    technologies: technologiesForYear(input.year),
    institutions: institutionsForYear(input.year, localeType),
  };
}
