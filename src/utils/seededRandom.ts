/**
 * utils/seededRandom.ts
 *
 * One persona, one seed, one persona every time.
 *
 * Persona generation reached for `Math.random()` in about a hundred places
 * across nine modules, so the same seed produced a different person on every
 * run: different life events, different in-laws, different clothes. That has
 * three costs. A shared persona link cannot show the reader what the sender
 * saw. A regression test cannot exist. And a defect cannot be replayed — the
 * portrait audit threw a crash during this work that never reproduced, and
 * there was no way to go back and look at it.
 *
 * The obvious fix is to thread a seed parameter through every one of those
 * call sites. That is a very large diff through code with no test coverage,
 * which is a poor trade when the goal is *reducing* risk.
 *
 * So instead the seed is ambient and scoped. `withSeed` installs a generator
 * for the duration of one call and restores whatever was there before, and
 * `random()` uses it. Call sites change by one word. Generation is synchronous
 * and single-threaded, so there is no interleaving to worry about — but note
 * that an `await` inside a `withSeed` body would let unrelated code draw from
 * this persona's stream, so keep the scope synchronous.
 *
 * Outside any scope `random()` falls through to `Math.random()`, so anything
 * that is not persona generation behaves exactly as it did.
 */

export type RandomSource = () => number;

/** mulberry32 — small, fast, and good enough for content selection. */
export function makeSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

let ambient: RandomSource | null = null;

/**
 * Run `fn` with a deterministic random source derived from `seed`.
 *
 * Nests safely: an inner scope restores the outer one on the way out, so a
 * generator that seeds a sub-generator does not disturb its caller's stream.
 */
export function withSeed<T>(seed: number, fn: () => T): T {
  const previous = ambient;
  ambient = makeSeededRandom(seed);
  try {
    return fn();
  } finally {
    ambient = previous;
  }
}

/** True while a seeded scope is active. For diagnostics and tests. */
export function isSeeded(): boolean {
  return ambient !== null;
}

/**
 * The ambient seeded source, or `Math.random` outside a scope.
 *
 * Drop-in for `Math.random()` — same contract, same range.
 */
export function random(): number {
  return ambient ? ambient() : Math.random();
}
