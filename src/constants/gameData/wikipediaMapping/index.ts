/**
 * Wikipedia article mapping aggregator
 * Combines all cultural zone mappings into a single exportable collection
 */

import { WikipediaImageMapping } from '../../../types/wikipedia';
import { SOUTH_AMERICA_MAPPINGS } from './southAmerica';
import { EUROPE_MAPPINGS } from './europe';
import { EAST_ASIA_MAPPINGS } from './eastAsia';
import { SOUTH_ASIA_MAPPINGS } from './southAsia';
import { MENA_MAPPINGS } from './mena';
import { SUB_SAHARAN_AFRICA_MAPPINGS } from './subSaharanAfrica';
import { NORTH_AMERICA_MAPPINGS } from './northAmerica';
import { OCEANIA_MAPPINGS } from './oceania';

/**
 * Get all Wikipedia article mappings across all cultural zones
 */
export function getAllWikipediaMappings(): WikipediaImageMapping[] {
  return [
    ...SOUTH_AMERICA_MAPPINGS,
    ...EUROPE_MAPPINGS,
    ...EAST_ASIA_MAPPINGS,
    ...SOUTH_ASIA_MAPPINGS,
    ...MENA_MAPPINGS,
    ...SUB_SAHARAN_AFRICA_MAPPINGS,
    ...NORTH_AMERICA_MAPPINGS,
    ...OCEANIA_MAPPINGS,
  ];
}

/**
 * Get mappings for a specific cultural zone
 */
export function getMappingsForCulturalZone(culturalZone: string): WikipediaImageMapping[] {
  const normalizedZone = culturalZone.toUpperCase().replace(/ /g, '_');
  return getAllWikipediaMappings().filter(mapping => {
    const mappingZone = mapping.culturalZone.toUpperCase().replace(/ /g, '_');
    return mappingZone === normalizedZone;
  });
}
