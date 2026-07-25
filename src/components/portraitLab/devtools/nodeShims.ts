/**
 * portraitLab/devtools/nodeShims.ts
 *
 * Just enough browser for the app's persona generator to run under Node.
 *
 * It reaches for localStorage (and, in places, window) while generating, which
 * is entirely reasonable in the app and merely inconvenient here. Imported for
 * its side effects, before anything that might touch these — module imports are
 * evaluated in order, so this file has to come first.
 */

interface MemoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
}

function makeStorage(): MemoryStorage {
  const store = new Map<string, string>();
  return {
    getItem: key => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: key => { store.delete(key); },
    clear: () => store.clear(),
    key: index => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}

const globalAny = globalThis as any;

if (typeof globalAny.localStorage === 'undefined') globalAny.localStorage = makeStorage();
if (typeof globalAny.sessionStorage === 'undefined') globalAny.sessionStorage = makeStorage();

if (typeof globalAny.window === 'undefined') {
  globalAny.window = {
    localStorage: globalAny.localStorage,
    sessionStorage: globalAny.sessionStorage,
    location: { href: 'http://localhost/', search: '', hash: '', hostname: 'localhost' },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    navigator: { userAgent: 'node' },
  };
}

if (typeof globalAny.document === 'undefined') {
  globalAny.document = {
    createElement: () => ({ style: {}, getContext: () => null, setAttribute: () => {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: { appendChild: () => {} },
  };
}

export {};
