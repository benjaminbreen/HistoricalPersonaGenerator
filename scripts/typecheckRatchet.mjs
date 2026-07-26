/**
 * scripts/typecheckRatchet.mjs
 *
 * `vite build` does not typecheck. That gap has already shipped real defects to
 * the screen — an out-of-scope variable in the portrait renderer, a missing
 * import for a colour helper, a function called before it was imported — all of
 * which built green and failed at runtime.
 *
 * `tsc --noEmit` reports ~400 errors, nearly all of them long-standing (a test
 * file with no test types, modules deleted years ago but still imported). So the
 * gate is not "zero errors", which would never be turned on, but "no NEW
 * errors": every current error is recorded in a baseline, and anything not in
 * it fails the run.
 *
 *   npm run typecheck:ratchet            # fail on new errors
 *   npm run typecheck:ratchet -- --update  # accept the current state as the baseline
 *
 * Fixing an old error is always safe — the ratchet only ever tightens.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const BASELINE = join(here, 'typecheck-baseline.json');
const UPDATE = process.argv.includes('--update');

function runTsc() {
  try {
    execFileSync('npx', ['tsc', '--noEmit'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return '';
  } catch (err) {
    // tsc exits non-zero when it finds errors; the report is on stdout.
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

/**
 * Key an error by file, code and message, deliberately dropping the line and
 * column. Otherwise inserting a blank line above an old error would read as a
 * new one and the baseline would need rewriting on every commit.
 */
function keyOf(line) {
  const match = /^(.+?)\((\d+),(\d+)\): (error TS\d+): (.*)$/.exec(line);
  if (!match) return null;
  const [, file, , , code, message] = match;
  return `${file}\t${code}\t${message}`;
}

const output = runTsc();
const counts = new Map();
for (const line of output.split('\n')) {
  const key = keyOf(line);
  if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);

if (UPDATE) {
  writeFileSync(BASELINE, `${JSON.stringify(Object.fromEntries([...counts].sort()), null, 1)}\n`);
  console.log(`baseline updated — ${total} known errors across ${new Set([...counts.keys()].map(k => k.split('\t')[0])).size} files`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('No baseline. Run: npm run typecheck:ratchet -- --update');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));
const baselineTotal = Object.values(baseline).reduce((a, b) => a + b, 0);

const introduced = [];
for (const [key, count] of counts) {
  const allowed = baseline[key] ?? 0;
  if (count > allowed) introduced.push({ key, extra: count - allowed });
}

const fixed = baselineTotal - (total - introduced.reduce((a, b) => a + b.extra, 0));

console.log(`\ntypecheck ratchet — ${total} errors, baseline ${baselineTotal}\n`);

if (introduced.length > 0) {
  console.log(`  FAIL  ${introduced.length} new type error${introduced.length === 1 ? '' : 's'}\n`);
  for (const { key, extra } of introduced) {
    const [file, code, message] = key.split('\t');
    console.log(`    ${file}`);
    console.log(`      ${code}: ${message}${extra > 1 ? ` (x${extra})` : ''}`);
  }
  console.log('\n  These would have built green. Fix them, or if intentional:');
  console.log('    npm run typecheck:ratchet -- --update\n');
  process.exit(1);
}

console.log(`  PASS  no new type errors${fixed > 0 ? ` (${fixed} fewer than baseline — run with --update to lock it in)` : ''}\n`);
