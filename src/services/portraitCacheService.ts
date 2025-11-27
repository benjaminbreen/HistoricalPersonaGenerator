// Stub service for portrait caching (not needed in standalone app)

// Simple in-memory cache for standalone app
const cache: Map<string, string> = new Map();

export const portraitCache = {
  get: (id: string): string | null => {
    return cache.get(id) || null;
  },
  set: (id: string, imageData: string): void => {
    cache.set(id, imageData);
  },
  has: (id: string): boolean => {
    return cache.has(id);
  },
  clear: (): void => {
    cache.clear();
  },
};

export function getCachedPortrait(id: string) {
  return portraitCache.get(id);
}

export function cachePortrait(id: string, imageData: string) {
  portraitCache.set(id, imageData);
}
