/**
 * utils/devLog.ts
 *
 * Generation is chatty — name resolution alone logs a dozen lines per persona,
 * and a page that makes several fills the console with `[NameGen]` traffic that
 * buries anything a user or a developer actually needs to see.
 *
 * The logs are worth keeping; they are how the naming and religion pipelines
 * were debugged. They just should not be on by default in a build. This routes
 * them through one switch: silent in production, and in development gated on a
 * `?debug` query parameter or `localStorage.debugGeneration = '1'`.
 */

const enabled = (() => {
  if (typeof window === 'undefined') return false;
  if (!import.meta.env?.DEV) return false;
  try {
    if (new URLSearchParams(window.location.search).has('debug')) return true;
    return window.localStorage?.getItem('debugGeneration') === '1';
  } catch {
    return false;
  }
})();

export function devLog(...args: unknown[]): void {
  if (enabled) console.log(...args);
}
