/**
 * Wikipedia API integration types
 */

import { CulturalZone } from './index';

/**
 * Mapping configuration for Wikipedia articles by cultural zone, region, and time period
 */
export interface WikipediaImageMapping {
  culturalZone: CulturalZone;
  region: string;
  centuryRange: [number, number]; // [start century, end century] e.g., [1400, 1500]
  article: string; // Wikipedia article title
  fallbackArticle?: string; // Optional fallback if primary article fails
  priority?: number; // Higher priority mappings are preferred (default: 0)
}

/**
 * Response from Wikipedia REST API summary endpoint
 */
export interface WikipediaSummaryResponse {
  type: string;
  title: string;
  displaytitle: string;
  namespace: { id: number; text: string };
  wikibase_item: string;
  titles: {
    canonical: string;
    normalized: string;
    display: string;
  };
  pageid: number;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  lang: string;
  dir: string;
  revision: string;
  tid: string;
  timestamp: string;
  description?: string;
  description_source?: string;
  content_urls: {
    desktop: {
      page: string;
      revisions: string;
      edit: string;
      talk: string;
    };
    mobile: {
      page: string;
      revisions: string;
      edit: string;
      talk: string;
    };
  };
  extract: string;
  extract_html: string;
}

/**
 * Cached Wikipedia data stored in localStorage
 */
export interface CachedWikipediaData {
  imageUrl: string; // Original high-res image URL
  thumbnailUrl: string; // Thumbnail URL
  articleUrl: string; // Link to full Wikipedia article
  extract: string; // Short text extract
  title: string; // Article title
  timestamp: number; // When cached (for expiry)
}

/**
 * Parameters for Wikipedia article lookup
 */
export interface WikipediaLookupParams {
  culturalZone: string;
  region: string;
  year: number;
}

/**
 * Result of Wikipedia article resolution
 */
export interface WikipediaResolutionResult {
  article: string;
  matchType: 'exact' | 'region' | 'cultural_zone' | 'era' | 'default';
  confidence: number; // 0-1
}
