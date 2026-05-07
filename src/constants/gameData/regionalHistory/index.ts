/**
 * constants/gameData/regionalHistory/index.ts
 * Aggregates all regional history data
 */

import { RegionalHistoryData } from '../../../types/regionalHistory';
import { EUROPE_REGIONAL_HISTORY } from './europe';
import { MENA_REGIONAL_HISTORY } from './mena';
import { EAST_ASIA_REGIONAL_HISTORY } from './eastAsia';
import { SOUTH_ASIA_REGIONAL_HISTORY } from './southAsia';
import { SUB_SAHARAN_AFRICA_REGIONAL_HISTORY } from './subSaharanAfrica';
import { NORTH_AMERICA_REGIONAL_HISTORY } from './northAmerica';
import { SOUTH_AMERICA_REGIONAL_HISTORY } from './southAmerica';
import { OCEANIA_REGIONAL_HISTORY } from './oceania';

export const REGIONAL_HISTORY: Partial<RegionalHistoryData> = {
  EUROPEAN: EUROPE_REGIONAL_HISTORY,
  MENA: MENA_REGIONAL_HISTORY,
  EAST_ASIAN: EAST_ASIA_REGIONAL_HISTORY,
  SOUTH_ASIAN: SOUTH_ASIA_REGIONAL_HISTORY,
  SUB_SAHARAN_AFRICAN: SUB_SAHARAN_AFRICA_REGIONAL_HISTORY,
  NORTH_AMERICAN_PRE_COLUMBIAN: NORTH_AMERICA_REGIONAL_HISTORY,
  NORTH_AMERICAN_COLONIAL: NORTH_AMERICA_REGIONAL_HISTORY, // Same data for both North American zones
  SOUTH_AMERICAN: SOUTH_AMERICA_REGIONAL_HISTORY,
  OCEANIA: OCEANIA_REGIONAL_HISTORY,
};

/**
 * Get historical description for a specific region, cultural zone, and year
 */
export function getRegionalHistory(
  culturalZone: string,
  region: string,
  year: number
): string | null {
  const zoneKey = culturalZone.toUpperCase().replace(/ /g, '_');
  const zoneData = REGIONAL_HISTORY[zoneKey as keyof typeof REGIONAL_HISTORY];

  if (!zoneData) return null;

  const regionAliases: Record<string, string> = {
    'New England': 'Northeastern Seaboard',
    'Hartford, Connecticut': 'Northeastern Seaboard',
    'Connecticut': 'Northeastern Seaboard',
    'Massachusetts': 'Northeastern Seaboard',
    'Cambridge, Massachusetts': 'Northeastern Seaboard',
  };
  const resolvedRegion = zoneData[region] ? region : (regionAliases[region] || region);
  const regionData = zoneData[resolvedRegion];
  if (!regionData) return null;

  const exactYearKey = year.toString();
  if (regionData[exactYearKey]) {
    return regionData[exactYearKey];
  }

  const centuryKey = (Math.floor(year / 100) * 100).toString();
  if (regionData[centuryKey]) {
    return regionData[centuryKey];
  }

  // If no exact match, find the closest earlier dated entry.
  const availableYears = Object.keys(regionData)
    .map(k => parseInt(k))
    .sort((a, b) => a - b);

  let closestYear: number | null = null;

  for (const availableYear of availableYears) {
    if (availableYear <= year) {
      closestYear = availableYear;
    } else {
      break;
    }
  }

  if (closestYear !== null) {
    return regionData[closestYear.toString()];
  }

  return null;
}
