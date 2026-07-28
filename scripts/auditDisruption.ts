/**
 * scripts/auditDisruption.ts
 *
 * Does the catastrophe layer actually reach anybody?
 *
 * The failure mode this exists to catch is silence. A window can match no
 * place because its regex disagrees with the region names in
 * `GEOGRAPHICAL_DATA`; a `boost` can name trades that appear nowhere in the
 * profession table; a `share` can be set so low that the stratum is
 * unreachable. Every one of those leaves the generator producing exactly what
 * it produced before, and none of them is visible from reading the table — the
 * data looks authored either way.
 *
 * So this measures three things and prints them per entry:
 *
 *   reach     — of personas drawn inside a window, what share show any trace
 *               of it (a disrupted trade, a dated event, or the clause)
 *   dead      — entries that matched nobody at all, which is almost always a
 *               place regex that does not agree with the geography table
 *   strata    — the legal-condition composition of the sampled population,
 *               against the shares the table claims
 *
 *   npm run disruption-audit
 *   npm run disruption-audit -- --fast
 *
 * Exits non-zero when an entry is unreachable or reach collapses, so it can
 * gate a commit the way the other audits do.
 */

if (!('localStorage' in globalThis)) {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, String(value)),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
    configurable: true,
  });
}

const originalLog = console.log;
const originalWarn = console.warn;
console.log = () => undefined;
console.warn = () => undefined;

const [
  { generateHistoricalPersona },
  { generateNarrativeBiography },
  { resolveDisruptions },
  { DISRUPTION_WINDOWS },
  { resolveStrata },
  { POPULATION_STRATA },
] = await Promise.all([
  import('../src/services/personaGenerator'),
  import('../src/services/narrativeBiographyService'),
  import('../src/services/disruptionResolution'),
  import('../src/constants/gameData/disruptionWindows'),
  import('../src/services/populationStrataService'),
  import('../src/constants/gameData/populationStrata'),
]);

console.log = originalLog;
console.warn = originalWarn;

const FAST = process.argv.includes('--fast');

const quiet = <T,>(fn: () => T): T => {
  const log = console.log, warn = console.warn;
  console.log = () => undefined; console.warn = () => undefined;
  try { return fn(); } finally { console.log = log; console.warn = warn; }
};

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------
//
// Sampled *at* each window rather than over the world, because a world-wide
// draw would put a handful of personas inside any given window and measure
// nothing. Each entry gets its own cohort, drawn at a year inside its range and
// a place its regex is meant to match — which is exactly the pairing the audit
// is checking, so a window whose regex disagrees with the geography table
// simply reports zero.

const PER_WINDOW = FAST ? 30 : 120;

/**
 * Places to try for a window, derived from its own regex.
 *
 * The alternation inside a `places` pattern is written against the region and
 * location names in `GEOGRAPHICAL_DATA`, so its own branches are the best
 * available guess at somewhere it should match. Windows without a `places`
 * pattern are zone-wide and take whatever the zone's ordinary draw returns.
 */
function probePlaces(pattern: RegExp | undefined): string[] {
  if (!pattern) return [];
  const branches = /\(([^)]*)\)/.exec(pattern.source)?.[1] ?? '';
  return branches
    .replace(/\?:/g, '')
    .split('|')
    .map(b => b.replace(/\\b|\\s|[\\^$*+?[\]{}]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(b => b.length > 3);
}

interface Row {
  id: string;
  label: string;
  cohort: number;
  touched: number;
  severity: number;
}

const windowRows: Row[] = [];
const deadWindows: string[] = [];

for (const window of DISRUPTION_WINDOWS) {
  const [from, to] = window.yearRange;
  const places = probePlaces(window.places);
  let cohort = 0;
  let touched = 0;

  for (let i = 0; i < PER_WINDOW; i++) {
    const year = Math.round(from + ((to - from) * i) / Math.max(1, PER_WINDOW - 1));
    const place = places.length > 0 ? places[i % places.length] : undefined;
    const persona = quiet(() => generateHistoricalPersona({
      year,
      culturalZone: window.zones[0],
      ...(place ? { location: place, region: place } : {}),
      seed: 90000 + i,
    }));

    // Did the window actually resolve for the place the generator settled on?
    // It may not have: a zone-wide draw lands wherever it lands.
    const active = resolveDisruptions(
      persona.historicalContext.culturalZone,
      persona.year,
      persona.region,
      persona.location,
    ).some(w => w.id === window.id);
    if (!active) continue;
    cohort += 1;

    const trade = persona.character.profession ?? '';
    const bio = quiet(() => generateNarrativeBiography(persona));
    const events = persona.enhancedLifeEvents ?? [];

    const showsTrade = Boolean(window.boost?.test(trade))
      || Boolean(window.roles?.some(r => r.role === trade));
    const showsEvent = events.some(e => e.culturalContext === window.label);
    const showsClause = Boolean(window.clause && bio.includes(window.clause));

    if (showsTrade || showsEvent || showsClause) touched += 1;
  }

  if (cohort === 0) deadWindows.push(`${window.id} — matched no persona in ${PER_WINDOW} draws`);
  else windowRows.push({ id: window.id, label: window.label, cohort, touched, severity: window.severity });
}

// ---------------------------------------------------------------------------
// Strata
// ---------------------------------------------------------------------------

interface StratumRow {
  id: string;
  claimed: number;
  observed: number;
  cohort: number;
}

const stratumRows: StratumRow[] = [];
const deadStrata: string[] = [];

for (const stratum of POPULATION_STRATA) {
  const [from, to] = stratum.yearRange;
  const places = probePlaces(stratum.places);
  let cohort = 0;
  let hits = 0;

  for (let i = 0; i < PER_WINDOW; i++) {
    const year = Math.round(from + ((to - from) * i) / Math.max(1, PER_WINDOW - 1));
    const place = places.length > 0 ? places[i % places.length] : undefined;
    const persona = quiet(() => generateHistoricalPersona({
      year,
      culturalZone: stratum.zones[0],
      ...(place ? { location: place, region: place } : {}),
      seed: 70000 + i,
    }));

    const reachable = resolveStrata(
      persona.historicalContext.culturalZone,
      persona.year,
      persona.region,
      persona.location,
    ).some(s => s.id === stratum.id);
    if (!reachable) continue;
    cohort += 1;
    if (persona.socialCondition?.stratumId === stratum.id) hits += 1;
  }

  if (cohort === 0) deadStrata.push(`${stratum.id} — matched no persona in ${PER_WINDOW} draws`);
  else stratumRows.push({ id: stratum.id, claimed: stratum.share, observed: hits / cohort, cohort });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log(`\ndisruption audit${FAST ? ' (fast)' : ''} — ${DISRUPTION_WINDOWS.length} windows, ${POPULATION_STRATA.length} strata\n`);

// The bar is proportional to severity, not a flat percentage.
//
// A flat 20% floor punished the entries that are deliberately rare: the
// Crimean War sits at severity 0.15 because for most people in the Russian
// Empire it was news rather than experience, and a 3% reach is the correct
// output for that, not a bug. What is always a bug is an entry that reaches
// far fewer people than its own severity claims it should — that means a
// pattern that matches nothing, and the entry is decorative.
const floorFor = (severity: number): number => 0.25 * severity;
const short = (r: Row): boolean => r.touched / r.cohort < floorFor(r.severity);

const quiet_windows = windowRows.filter(short);
windowRows.sort((a, b) =>
  (a.touched / a.cohort) / a.severity - (b.touched / b.cohort) / b.severity);

console.log('  window reach — share of personas inside the window that show it\n');
for (const row of windowRows.slice(0, FAST ? 12 : windowRows.length)) {
  const reach = row.touched / row.cohort;
  const flag = short(row) ? 'LOW ' : '    ';
  console.log(`  ${flag}${(reach * 100).toFixed(0).padStart(3)}%  of a claimed ${(row.severity * 100).toFixed(0).padStart(3)}%  ${row.id.padEnd(34)} n=${row.cohort}`);
}

console.log('\n  strata — observed share against the share the table claims\n');
console.log('  (observed is averaged over every place the entry\'s regex names, so where two');
console.log('   entries overlap a place it will read below the headline share by design)\n');
for (const row of stratumRows.sort((a, b) => Math.abs(b.observed - b.claimed) - Math.abs(a.observed - a.claimed))) {
  const drift = Math.abs(row.observed - row.claimed);
  const flag = drift > 0.2 ? 'DRIFT' : '     ';
  console.log(`  ${flag} claimed ${(row.claimed * 100).toFixed(0).padStart(3)}%  observed ${(row.observed * 100).toFixed(0).padStart(3)}%  ${row.id.padEnd(32)} n=${row.cohort}`);
}

const problems: string[] = [];
if (deadWindows.length > 0) {
  console.log('\n  unreachable windows:');
  deadWindows.forEach(d => console.log(`    - ${d}`));
  problems.push(`${deadWindows.length} unreachable windows`);
}
if (deadStrata.length > 0) {
  console.log('\n  unreachable strata:');
  deadStrata.forEach(d => console.log(`    - ${d}`));
  problems.push(`${deadStrata.length} unreachable strata`);
}
if (quiet_windows.length > 0) {
  problems.push(`${quiet_windows.length} windows reaching under a quarter of their claimed severity`);
}

console.log('');
if (problems.length > 0) {
  console.log(`  FAIL  ${problems.join('; ')}\n`);
  process.exit(1);
}
console.log('  PASS  every window and stratum reaches the people inside it\n');
