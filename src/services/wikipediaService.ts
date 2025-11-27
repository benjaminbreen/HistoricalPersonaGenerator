/**
 * Wikipedia API integration service
 * Handles fetching images and data from Wikipedia with intelligent caching
 */

import {
  WikipediaSummaryResponse,
  CachedWikipediaData,
  WikipediaLookupParams,
  WikipediaResolutionResult,
} from '../types/wikipedia';
import { getAllWikipediaMappings } from '../constants/gameData/wikipediaMapping';

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const CACHE_PREFIX = 'wiki_cache_';
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Fetch Wikipedia article summary from REST API
 */
async function fetchWikipediaSummary(articleTitle: string): Promise<WikipediaSummaryResponse | null> {
  try {
    const encodedTitle = encodeURIComponent(articleTitle.replace(/ /g, '_'));
    const url = `${WIKIPEDIA_API_BASE}${encodedTitle}`;

    const response = await fetch(url, {
      headers: {
        'Api-User-Agent': 'HistoricalPersonaGenerator/1.0',
      },
    });

    if (!response.ok) {
      console.warn(`Wikipedia API returned ${response.status} for article: ${articleTitle}`);
      return null;
    }

    const data: WikipediaSummaryResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Wikipedia summary:', error);
    return null;
  }
}

/**
 * Get cached Wikipedia data from localStorage
 */
function getCachedData(cacheKey: string): CachedWikipediaData | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + cacheKey);
    if (!cached) return null;

    const data: CachedWikipediaData = JSON.parse(cached);

    // Check if cache is expired
    const now = Date.now();
    if (now - data.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_PREFIX + cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading Wikipedia cache:', error);
    return null;
  }
}

/**
 * Save Wikipedia data to localStorage cache
 */
function setCachedData(cacheKey: string, data: CachedWikipediaData): void {
  try {
    localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving Wikipedia cache:', error);
  }
}

/**
 * Resolve which Wikipedia article to use for given parameters
 * Uses hierarchical fallback: exact match -> region match -> cultural zone -> era -> default
 */
export function resolveWikipediaArticle(params: WikipediaLookupParams): WikipediaResolutionResult | null {
  const { culturalZone, region, year } = params;
  const mappings = getAllWikipediaMappings();

  // Normalize inputs
  const normalizedZone = culturalZone.toUpperCase().replace(/ /g, '_');
  const century = Math.floor(year / 100) * 100;

  // Filter mappings by cultural zone
  const zoneMappings = mappings.filter(m => {
    const mappingZone = m.culturalZone.toUpperCase().replace(/ /g, '_');
    return mappingZone === normalizedZone;
  });

  // Helper to check if region matches (supports partial/contains matching)
  const regionMatches = (mappingRegion: string, inputRegion: string): boolean => {
    const mappingLower = mappingRegion.toLowerCase();
    const inputLower = inputRegion.toLowerCase();

    // Exact match
    if (mappingLower === inputLower) return true;

    // Input region contains mapping region (e.g., "Australia - West and Central" contains "Australia")
    if (inputLower.includes(mappingLower)) return true;

    // Mapping region contains input region
    if (mappingLower.includes(inputLower)) return true;

    // Special cases for Oceania sub-regions
    if (normalizedZone === 'OCEANIA') {
      // Australian regions should match "Australia"
      if (mappingLower === 'australia' && (
        inputLower.includes('australia') ||
        inputLower.includes('outback') ||
        inputLower.includes('aboriginal') ||
        inputLower.includes('tasmania') ||
        inputLower.includes('queensland') ||
        inputLower.includes('victoria') ||
        inputLower.includes('new south wales') ||
        inputLower.includes('western australia')
      )) return true;

      // New Zealand regions
      if (mappingLower === 'new zealand' && (
        inputLower.includes('new zealand') ||
        inputLower.includes('aotearoa') ||
        inputLower.includes('canterbury') ||
        inputLower.includes('otago') ||
        inputLower.includes('wellington') ||
        inputLower.includes('auckland')
      )) return true;

      // Melanesia regions
      if (mappingLower === 'melanesia' && (
        inputLower.includes('papua') ||
        inputLower.includes('new guinea') ||
        inputLower.includes('solomon') ||
        inputLower.includes('vanuatu') ||
        inputLower.includes('fiji') ||
        inputLower.includes('new caledonia')
      )) return true;

      // Polynesia regions (excluding NZ which is handled above)
      if (mappingLower === 'polynesia' && (
        inputLower.includes('samoa') ||
        inputLower.includes('tonga') ||
        inputLower.includes('tahiti') ||
        inputLower.includes('cook islands') ||
        inputLower.includes('easter island') ||
        inputLower.includes('marquesas')
      )) return true;

      // Hawaii special handling
      if (mappingLower === 'hawaii' && inputLower.includes('hawaii')) return true;

      // Micronesia regions
      if (mappingLower === 'micronesia' && (
        inputLower.includes('guam') ||
        inputLower.includes('palau') ||
        inputLower.includes('marshall') ||
        inputLower.includes('caroline') ||
        inputLower.includes('mariana') ||
        inputLower.includes('yap') ||
        inputLower.includes('pohnpei')
      )) return true;
    }

    return false;
  };

  // 1. Try exact match: zone + region + century range
  const exactMatches = zoneMappings.filter(m => {
    const matchesReg = regionMatches(m.region, region);
    const inCenturyRange = century >= m.centuryRange[0] && century <= m.centuryRange[1];
    return matchesReg && inCenturyRange;
  });

  if (exactMatches.length > 0) {
    // Sort by priority (higher first) and pick best
    const best = exactMatches.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
    return {
      article: best.article,
      matchType: 'exact',
      confidence: 1.0,
    };
  }

  // 2. Try region match (any time period)
  const regionOnlyMatches = zoneMappings.filter(m =>
    regionMatches(m.region, region)
  );

  if (regionOnlyMatches.length > 0) {
    // Find closest century match
    const sorted = regionOnlyMatches.sort((a, b) => {
      const distA = Math.min(
        Math.abs(century - a.centuryRange[0]),
        Math.abs(century - a.centuryRange[1])
      );
      const distB = Math.min(
        Math.abs(century - b.centuryRange[0]),
        Math.abs(century - b.centuryRange[1])
      );
      return distA - distB;
    });
    return {
      article: sorted[0].article,
      matchType: 'region',
      confidence: 0.7,
    };
  }

  // 3. Try cultural zone match (any region, closest time period)
  if (zoneMappings.length > 0) {
    const sorted = zoneMappings.sort((a, b) => {
      const distA = Math.min(
        Math.abs(century - a.centuryRange[0]),
        Math.abs(century - a.centuryRange[1])
      );
      const distB = Math.min(
        Math.abs(century - b.centuryRange[0]),
        Math.abs(century - b.centuryRange[1])
      );
      return distA - distB;
    });
    return {
      article: sorted[0].article,
      matchType: 'cultural_zone',
      confidence: 0.5,
    };
  }

  // 4. Era-based defaults as last resort
  const eraDefaults: Record<string, string> = {
    EUROPEAN: 'History_of_Europe',
    EAST_ASIAN: 'History_of_East_Asia',
    SOUTH_ASIAN: 'History_of_South_Asia',
    MENA: 'History_of_the_Middle_East',
    SUB_SAHARAN_AFRICAN: 'History_of_Africa',
    OCEANIA: 'History_of_Oceania',
    NORTH_AMERICAN_PRE_COLUMBIAN: 'Pre-Columbian_era',
    NORTH_AMERICAN_COLONIAL: 'Colonial_history_of_the_United_States',
    SOUTH_AMERICAN: 'History_of_South_America',
  };

  const defaultArticle = eraDefaults[normalizedZone];
  if (defaultArticle) {
    return {
      article: defaultArticle,
      matchType: 'default',
      confidence: 0.3,
    };
  }

  return null;
}

/**
 * Get Wikipedia image and data for given historical context
 * Main public API function with caching
 */
export async function getWikipediaImageForContext(
  params: WikipediaLookupParams
): Promise<CachedWikipediaData | null> {
  // Create cache key from parameters
  const cacheKey = `${params.culturalZone}_${params.region}_${params.year}`;

  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  // Resolve which article to use
  const resolution = resolveWikipediaArticle(params);
  if (!resolution) {
    console.warn('No Wikipedia article found for:', params);
    return null;
  }

  // Fetch from Wikipedia API
  const summary = await fetchWikipediaSummary(resolution.article);
  if (!summary) {
    // Try fallback if available
    const mappings = getAllWikipediaMappings();
    const mapping = mappings.find(m => m.article === resolution.article);
    if (mapping?.fallbackArticle) {
      const fallbackSummary = await fetchWikipediaSummary(mapping.fallbackArticle);
      if (fallbackSummary) {
        return processSummaryResponse(fallbackSummary, cacheKey);
      }
    }
    return null;
  }

  return processSummaryResponse(summary, cacheKey);
}

/**
 * Process Wikipedia summary response into cached data format
 */
function processSummaryResponse(
  summary: WikipediaSummaryResponse,
  cacheKey: string
): CachedWikipediaData | null {
  // Ensure we have an image
  if (!summary.thumbnail && !summary.originalimage) {
    console.warn('Wikipedia article has no image:', summary.title);
    return null;
  }

  const data: CachedWikipediaData = {
    imageUrl: summary.originalimage?.source || summary.thumbnail?.source || '',
    thumbnailUrl: summary.thumbnail?.source || summary.originalimage?.source || '',
    articleUrl: summary.content_urls.desktop.page,
    extract: summary.extract || '',
    title: summary.title,
    timestamp: Date.now(),
  };

  // Cache the result
  setCachedData(cacheKey, data);

  return data;
}

/**
 * Prefetch and cache Wikipedia data for a persona
 * Useful for preloading data before user needs it
 */
export async function prefetchWikipediaData(params: WikipediaLookupParams): Promise<void> {
  await getWikipediaImageForContext(params);
}

/**
 * Clear all Wikipedia caches (useful for development/debugging)
 */
export function clearWikipediaCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Wikipedia cache cleared');
  } catch (error) {
    console.error('Error clearing Wikipedia cache:', error);
  }
}
