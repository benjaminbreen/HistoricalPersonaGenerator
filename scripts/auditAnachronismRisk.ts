/**
 * scripts/auditAnachronismRisk.ts
 *
 * A structural audit for one recurring defect, so the next instance surfaces
 * here instead of on a persona card.
 *
 * The defect: a lookup table is keyed by a coarse bucket — an era spanning
 * centuries, or a band with no upper bound — and every entry inside it is
 * treated as equally true across the whole span. The value that is right at one
 * end of the bucket is then served across all of it. Found so far:
 *
 *   · `samurai clan` offered to a Formosan Austronesian, because the social
 *     group list was gated by era but not by place.
 *   · `Afroasiatic language of the region` for a 1952 Anatolian, because the
 *     MENA deep-time table had no window after 1200 BCE.
 *   · `killed in World War I` for a death in 1897, because the causes-of-death
 *     table had no year bounds at all.
 *   · Islam at 5% in 1920 Stockholm, because the Scandinavian religion bands
 *     stopped in 1800 and handed the rest to a present-day snapshot.
 *   · A Viking-age patronymic in 1856 Stockholm, because the last name band for
 *     Scandinavia is `{ after: 1100 }` with no ceiling.
 *
 * Three checks, all read-only over the source text. Source scanning rather than
 * imports on purpose: most of these tables are module-local consts that are
 * never exported, and an audit that can only see the exported surface would
 * miss most of the data it needs to look at.
 *
 * Everything reported is a *risk*, not a proven fault — a warning to be looked
 * at, in the same spirit as the portrait audit's unrecognised-garment report.
 *
 * Run with:  npm run anachronism-audit
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// The bundle runs out of node_modules/.cache, so `import.meta.url` points at
// the wrong tree. npm scripts always run from the project root.
const ROOT = process.cwd();

/** Matches the app's own `ERA_BOUNDS` in services/demographyService.ts. */
const ERA_BOUNDS: Record<string, [number, number]> = {
  PREHISTORY: [-10000, -3000],
  ANTIQUITY: [-3000, 500],
  MEDIEVAL: [500, 1450],
  RENAISSANCE_EARLY_MODERN: [1450, 1750],
  INDUSTRIAL_ERA: [1750, 1900],
  MODERN_ERA: [1900, 2000],
  FUTURE_ERA: [2000, 2100],
};

/**
 * Things that name a specific moment. Each is the span in which the phrase can
 * be literally true of a person.
 *
 * Deliberately conservative — a term earns a place here only when its date is
 * not seriously disputed, because a false positive costs someone a real look.
 */
const DATED_TERMS: Array<[RegExp, [number, number], string]> = [
  // Conflicts
  [/\bworld war i\b|world war one/i, [1914, 1918], 'First World War'],
  [/\bworld war ii\b|world war two/i, [1939, 1945], 'Second World War'],
  [/\bcivil war\b/i, [1861, 1865], 'American Civil War (if meant generically, bound it)'],
  [/\bcrusad/i, [1095, 1291], 'the Crusades'],
  [/\bpartition\b/i, [1947, 1948], 'Partition of India'],
  [/\bconquistador/i, [1492, 1600], 'the conquest period'],
  [/\bblackbirder/i, [1860, 1910], 'Pacific labour trade'],
  [/\bviking\b/i, [793, 1100], 'the Viking age'],
  [/\bmongol\b/i, [1206, 1400], 'the Mongol conquests'],
  [/\bsamurai\b/i, [1100, 1876], 'the samurai class'],
  [/\bluddite\b/i, [1811, 1817], 'the Luddite risings'],
  [/\bchartist\b/i, [1838, 1857], 'Chartism'],

  // Epidemics
  [/spanish flu/i, [1918, 1920], 'the 1918 influenza pandemic'],
  [/black death/i, [1347, 1353], 'the Black Death'],

  // Technology and institutions
  [/\bautomobile\b|\bmotor ?car\b/i, [1900, 2100], 'motor vehicles'],
  [/\brailway\b|\brailroad\b/i, [1830, 2100], 'railways'],
  [/\btelegraph\b/i, [1840, 2100], 'the telegraph'],
  [/\btelephone\b/i, [1878, 2100], 'the telephone'],
  [/\bfactory\b/i, [1770, 2100], 'the factory system'],
  [/\bpolio\b/i, [1900, 2100], 'polio as a named diagnosis'],
  [/\bcalligraphy\b|court scribe/i, [-1000, 1900], 'scribal training'],
  [/\bguild\b/i, [1000, 1850], 'the guild system'],
  [/\bpolitical party\b/i, [1790, 2100], 'mass political parties'],
];

interface Finding {
  file: string;
  line: number;
  detail: string;
}

const datedTermFindings: Finding[] = [];
const unboundedBandFindings: Finding[] = [];
const coverageGapFindings: Finding[] = [];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(name) && !/\.bak/.test(name)) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Check 1 — a datable phrase inside an era bucket wider than the phrase
// ---------------------------------------------------------------------------

/**
 * Bounds already declared in the file, so a phrase that something *does* filter
 * at selection time is not reported as a risk. Recognises the two shapes this
 * codebase uses: `[/pattern/i, [min, max]]` (DATED_CAUSE_BOUNDS) and
 * `'literal name': [min, max]` (ERA_BOUND_GROUPS).
 *
 * Without this the audit keeps reporting defects after they have been fixed,
 * which is the fastest way to get an audit ignored.
 */
function declaredBounds(source: string): Array<(phrase: string) => boolean> {
  const guards: Array<(phrase: string) => boolean> = [];

  for (const m of source.matchAll(/\[\s*\/(.+?)\/([gimsuy]*)\s*,\s*\[\s*-?\d+\s*,\s*-?\d+\s*\]/g)) {
    try {
      const re = new RegExp(m[1], m[2].replace(/g/g, ''));
      guards.push(phrase => re.test(phrase));
    } catch {
      // An unparseable pattern is not worth failing the audit over.
    }
  }
  for (const m of source.matchAll(/'([^']{3,60})':\s*\[\s*-?\d+\s*,\s*-?\d+\s*\]/g)) {
    const literal = m[1].toLowerCase();
    guards.push(phrase => phrase.toLowerCase().includes(literal));
  }
  return guards;
}

/**
 * Walks each file tracking the most recent `[HistoricalEra.X]` key seen, and
 * tests every quoted string under it. Crude, but era-keyed tables in this
 * codebase are consistently written as one era per line with its entries
 * following, and a parser would not survive the first hand-formatted table.
 */
function checkDatedTermsInEraBuckets(
  file: string,
  lines: string[],
  guards: Array<(phrase: string) => boolean>,
): void {
  let currentEra: string | null = null;
  let eraLine = 0;

  lines.forEach((text, index) => {
    const eraKey = text.match(/HistoricalEra\.([A-Z_]+)/);
    if (eraKey && ERA_BOUNDS[eraKey[1]]) {
      currentEra = eraKey[1];
      eraLine = index + 1;
    }
    if (!currentEra) return;
    // A new top-level const ends the influence of the last era key.
    if (/^(export )?const \w+/.test(text)) { currentEra = null; return; }

    const [eraMin, eraMax] = ERA_BOUNDS[currentEra];
    for (const quoted of text.matchAll(/'([^']{4,60})'|"([^"]{4,60})"/g)) {
      const phrase = quoted[1] ?? quoted[2];
      if (guards.some(guard => guard(phrase))) continue;
      for (const [pattern, [termMin, termMax], label] of DATED_TERMS) {
        if (!pattern.test(phrase)) continue;
        // Only a complaint if the bucket reaches outside the term's own life.
        if (termMin <= eraMin && termMax >= eraMax) continue;
        datedTermFindings.push({
          file,
          line: index + 1,
          detail: `"${phrase}" names ${label} (${termMin}..${termMax}) `
            + `but sits in ${currentEra} (${eraMin}..${eraMax}, key at line ${eraLine})`,
        });
        break;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Check 2 — a band with a floor and no ceiling
// ---------------------------------------------------------------------------

const OPEN_ENDED_LIMIT = 300;

function checkUnboundedBands(file: string, lines: string[]): void {
  lines.forEach((text, index) => {
    const after = text.match(/\{\s*after:\s*(-?\d+)\s*,/);
    if (after && !/before:/.test(text)) {
      const from = Number(after[1]);
      const span = 2100 - from;
      if (span > OPEN_ENDED_LIMIT) {
        unboundedBandFindings.push({
          file,
          line: index + 1,
          detail: `band opens at ${from} with no upper bound — covers ${span} years to the era ceiling`,
        });
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Check 3 — year-band sequences that stop early
// ---------------------------------------------------------------------------

const COVERAGE_GAP_LIMIT = 150;

function checkBandCoverage(file: string, lines: string[]): void {
  // Track the highest endYear inside each named band array, and report when the
  // array closes far short of the present.
  let label: string | null = null;
  let labelLine = 0;
  let highest = -Infinity;
  let depth = 0;

  lines.forEach((text, index) => {
    const opener = text.match(/^\s*['"]?([A-Za-z][A-Za-z ]+)['"]?:\s*\[\s*$/);
    if (opener && depth === 0) {
      label = opener[1];
      labelLine = index + 1;
      highest = -Infinity;
      depth = 1;
      return;
    }
    if (!label) return;

    const end = text.match(/endYear:\s*(-?\d+)/);
    if (end) highest = Math.max(highest, Number(end[1]));

    if (/^\s*\],?\s*$/.test(text) && depth === 1) {
      if (Number.isFinite(highest) && highest < 2100 - COVERAGE_GAP_LIMIT) {
        coverageGapFindings.push({
          file,
          line: labelLine,
          detail: `"${label}" bands stop at ${highest}; the ${2100 - highest} years after that `
            + `fall through to whatever coarse bucket covers them`,
        });
      }
      label = null;
      depth = 0;
    }
  });
}

// ---------------------------------------------------------------------------

const files = walk(join(ROOT, 'src'));
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (!/HistoricalEra\.|after:\s*-?\d|endYear:/.test(source)) continue;
  const lines = source.split('\n');
  const shortName = relative(ROOT, file);
  checkDatedTermsInEraBuckets(shortName, lines, declaredBounds(source));
  checkUnboundedBands(shortName, lines);
  checkBandCoverage(shortName, lines);
}

const section = (title: string, findings: Finding[], note: string): string => {
  const head = `\n── ${title} ${'─'.repeat(Math.max(0, 58 - title.length))}\n`;
  if (findings.length === 0) return `${head}  (none)\n`;
  const body = findings
    .slice(0, 40)
    .map(f => `  ${f.file}:${f.line}\n      ${f.detail}`)
    .join('\n');
  const more = findings.length > 40 ? `\n  … and ${findings.length - 40} more` : '';
  return `${head}  ${note}\n\n${body}${more}\n`;
};

const report = [
  'Anachronism-risk audit — coarse buckets serving values that are only true',
  'at one end of their own span. Everything here is a risk to look at, not a',
  'proven fault.',
  section(
    'Datable phrases inside wider era buckets',
    datedTermFindings,
    'Each of these can be selected for a year in which it was not yet (or no longer) true.'
  ),
  section(
    'Bands with a floor and no ceiling',
    unboundedBandFindings,
    'A rule that opens in year N and never closes claims every year after it.'
  ),
  section(
    'Year-band sequences that stop short of the present',
    coverageGapFindings,
    'Years past the last band fall through to a coarser table, which is usually a modern snapshot.'
  ),
  '',
  `totals: ${datedTermFindings.length} dated-phrase, `
  + `${unboundedBandFindings.length} unbounded-band, `
  + `${coverageGapFindings.length} coverage-gap`,
].join('\n');

console.log(report);
