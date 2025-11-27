/**
 * utils/mapUtils.ts - Utility functions for map operations
 */
import { CulturalZone } from '../constants/index';

const LARGE_PRIME_1 = 73856093;
const LARGE_PRIME_2 = 19349663;
const LARGE_PRIME_3 = 83492791;

/**
 * Derives a deterministic seed for a map cell based on an initial game seed and world coordinates.
 * This ensures that navigating to the same world cell always results in the same map being generated.
 * @param initialGameSeed The seed of the very first map generated in the game session.
 * @param worldX The x-coordinate of the map cell in the world grid.
 * @param worldY The y-coordinate of the map cell in the world grid.
 * @returns A deterministic number seed for the specified map cell.
 */
export function deriveMapSeed(initialGameSeed: number, worldX: number, worldY: number): number {
  let hash = initialGameSeed;
  hash = (hash * LARGE_PRIME_1) ^ (worldX * LARGE_PRIME_2);
  hash = (hash * LARGE_PRIME_2) ^ (worldY * LARGE_PRIME_3);
  hash = hash & 0x7FFFFFFF; // Ensure positive integer, good for seeds
  return hash;
}

/**
 * Converts a string location from the UI into a strongly-typed CulturalZone enum, now aware of the year.
 * @param location The location string (e.g., "East Asia", "Europe").
 * @param year The current year of the simulation.
 * @returns The corresponding CulturalZone enum value.
 */
export function mapLocationToCulture(location: string, year: number): CulturalZone {
    const lowerLocation = location.toLowerCase().replace(/[_-]/g, ' ');
    
    // Handle both "North America" and "North_America" formats, plus specific regions/sub-locations
    if (lowerLocation.includes('north america') || lowerLocation === 'north america' ||
        lowerLocation.includes('pacific northwest') || lowerLocation.includes('puget sound') ||
        lowerLocation.includes('columbia river') || lowerLocation.includes('willamette') ||
        lowerLocation.includes('california') || lowerLocation.includes('sierra nevada') ||
        lowerLocation.includes('great basin') || lowerLocation.includes('great plains') ||
        lowerLocation.includes('mississippi') || lowerLocation.includes('ohio valley') ||
        lowerLocation.includes('appalachia') || lowerLocation.includes('hudson valley') ||
        lowerLocation.includes('champlain') || lowerLocation.includes('adirondack') ||
        lowerLocation.includes('chesapeake') || lowerLocation.includes('florida') ||
        lowerLocation.includes('pine barrens') || lowerLocation.includes('delaware') ||
        lowerLocation.includes('cape cod') || lowerLocation.includes('long island') ||
        lowerLocation.includes('potomac') || lowerLocation.includes('virginia') ||
        lowerLocation.includes('carolina') || lowerLocation.includes('georgia') ||
        lowerLocation.includes('rockies') || lowerLocation.includes('colorado') ||
        lowerLocation.includes('arizona') || lowerLocation.includes('new mexico') ||
        lowerLocation.includes('texas') || lowerLocation.includes('kansas') ||
        lowerLocation.includes('dakota') || lowerLocation.includes('montana') ||
        lowerLocation.includes('alaska') || lowerLocation.includes('yukon') ||
        lowerLocation.includes('canada') || lowerLocation.includes('ontario') ||
        lowerLocation.includes('quebec') || lowerLocation.includes('hudson bay')) {
        if (year > 1600) return 'NORTH_AMERICAN_COLONIAL';
        return 'NORTH_AMERICAN_PRE_COLUMBIAN';
    }
    
    // Check for South America (including Mesoamerica as part of cultural zone)
    if (lowerLocation.includes('south america') || lowerLocation === 'south america' || 
        lowerLocation.includes('mesoamerica') || lowerLocation.includes('mexico') || 
        lowerLocation.includes('central america')) {
        return 'SOUTH_AMERICAN';
    }
    
    if (lowerLocation.includes('europe')) return 'EUROPEAN';

    // MENA - Check for specific regions and sub-locations
    if (lowerLocation.includes('mena') || lowerLocation.includes('middle east') ||
        lowerLocation.includes('anatolia') || lowerLocation.includes('levant') ||
        lowerLocation.includes('mesopotamia') || lowerLocation.includes('arabia') || lowerLocation.includes('arabian') ||
        lowerLocation.includes('persia') || lowerLocation.includes('persian') ||
        lowerLocation.includes('egypt') || lowerLocation.includes('nile') ||
        lowerLocation.includes('maghreb') || lowerLocation.includes('nubian') ||
        lowerLocation.includes('caucasus') || lowerLocation.includes('cappadocia') ||
        lowerLocation.includes('hejaz') || lowerLocation.includes('baghdad') ||
        lowerLocation.includes('damascus') || lowerLocation.includes('jerusalem') ||
        lowerLocation.includes('tehran') || lowerLocation.includes('isfahan')) return 'MENA';

    if (lowerLocation.includes('sub saharan africa') || lowerLocation.includes('africa')) return 'SUB_SAHARAN_AFRICAN';
    if (lowerLocation.includes('south asia')) return 'SOUTH_ASIAN';
    if (lowerLocation.includes('east asia')) return 'EAST_ASIAN';
    if (lowerLocation.includes('oceania') || lowerLocation.includes('australia') ||
        lowerLocation.includes('new zealand') || lowerLocation.includes('pacific')) return 'OCEANIA';

    // Default fallback
    return 'EUROPEAN';
}