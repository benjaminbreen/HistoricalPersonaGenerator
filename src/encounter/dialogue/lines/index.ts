/**
 * encounter/dialogue/lines/index.ts
 *
 * Every language's line table, merged. Batch files are generated per
 * language family; exemplar.ts is hand-written and doubles as the quality
 * bar for regeneration. Languages without a table yet fall back to the
 * English gloss in speak.ts; remaining batches are listed in
 * scripts/lintEncounterLines.ts output.
 */

import type { LineTable } from '../moves';
import { ANSWER_TABLES } from './answers';
import { TABLES as exemplar } from './exemplar';
import { TABLES as afroasiatic } from './afroasiatic';
import { TABLES as eastSouthAfrica } from './eastSouthAfrica';
import { TABLES as germanic1 } from './germanic1';
import { TABLES as germanic2 } from './germanic2';
import { TABLES as indic } from './indic';
import { TABLES as iranic } from './iranic';
import { TABLES as romance1 } from './romance1';
import { TABLES as romance2 } from './romance2';
import { TABLES as semitic2 } from './semitic2';
import { TABLES as slavic } from './slavic';

export const LINE_TABLES: Record<string, LineTable> = {
  ...exemplar,
  ...afroasiatic,
  ...eastSouthAfrica,
  ...germanic1,
  ...germanic2,
  ...indic,
  ...iranic,
  ...romance1,
  ...romance2,
  ...semitic2,
  ...slavic,
};

// Answer moves are hand-translated separately and overlaid per language, so
// answer coverage can grow without touching the generated batch files.
for (const [langId, answers] of Object.entries(ANSWER_TABLES)) {
  if (LINE_TABLES[langId]) {
    LINE_TABLES[langId] = { ...LINE_TABLES[langId], ...answers };
  }
}
