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

  const regionData = zoneData[region];
  if (!regionData) return null;

  // Convert year to century key
  // For negative years, round toward more negative (e.g., -1234 -> -1300)
  // For positive years, round down to century (e.g., 1234 -> 1200)
  let centuryKey: string;
  if (year < 0) {
    const century = Math.floor(year / 100) * 100;
    centuryKey = century.toString();
  } else {
    const century = Math.floor(year / 100) * 100;
    centuryKey = century.toString();
  }

  // Try exact match first
  if (regionData[centuryKey]) {
    return regionData[centuryKey];
  }

  // If no exact match, find the closest earlier century
  const availableCenturies = Object.keys(regionData)
    .map(k => parseInt(k))
    .sort((a, b) => a - b);

  const targetCentury = parseInt(centuryKey);
  let closestCentury: number | null = null;

  for (const century of availableCenturies) {
    if (century <= targetCentury) {
      closestCentury = century;
    } else {
      break;
    }
  }

  if (closestCentury !== null) {
    return regionData[closestCentury.toString()];
  }

  return null;
}
