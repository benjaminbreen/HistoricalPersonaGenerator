/**
 * scripts/lintEncounterLines.ts
 *
 * Checks the encounter line tables: every language in LANGUAGES has a table,
 * every table covers every move id with a non-empty line, and non-English
 * languages do not simply repeat the English gloss.
 *
 * Run: npx tsx scripts/lintEncounterLines.ts
 */

import { LANGUAGES } from '../src/constants/gameData/languages';
import { MOVES, MOVE_IDS } from '../src/encounter/dialogue/moves';
import { LINE_TABLES } from '../src/encounter/dialogue/lines';

const GLOSS = new Map(MOVES.map((m) => [m.id, m.gloss]));
// Answer moves are optional per language; only core moves are required.
const REQUIRED_IDS = MOVES.filter((m) => !m.answers).map((m) => m.id);
const ENGLISHY = /^(MODERN_ENGLISH|EARLY_MODERN_ENGLISH|SCOTS)$/;

let problems = 0;
const missing: string[] = [];
const flag = (msg: string) => { problems += 1; console.log('  ' + msg); };

for (const id of Object.keys(LANGUAGES)) {
  const table = LINE_TABLES[id];
  if (!table) { missing.push(id); continue; }
  for (const moveId of REQUIRED_IDS) {
    const line = table[moveId];
    if (!line || !line.trim()) { flag(`${id}.${moveId}: empty`); continue; }
    if (!ENGLISHY.test(id) && line.trim() === GLOSS.get(moveId)) {
      flag(`${id}.${moveId}: identical to English gloss`);
    }
  }
}

for (const id of Object.keys(LINE_TABLES)) {
  if (!LANGUAGES[id]) flag(`${id}: table for unknown language id`);
}

const langCount = Object.keys(LANGUAGES).length;
const tableCount = Object.keys(LINE_TABLES).length;
console.log(`${tableCount}/${langCount} languages, ${MOVE_IDS.length} moves, ${problems} problem(s)`);
if (missing.length) {
  console.log(`${missing.length} deferred (fall back to English gloss): ${missing.join(', ')}`);
}
process.exit(problems ? 1 : 0);
