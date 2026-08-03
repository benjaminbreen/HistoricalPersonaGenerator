/**
 * scripts/auditCityCoverage.ts
 *
 * Which map areas most need a city added to `cities.ts`, ranked by how often a
 * persona is actually drawn there rather than by raw area count.
 *
 * `CITIES_DATA` covers roughly a third of the ~560 map areas in
 * `geography.ts`, and the two tables were built independently, so the gap is
 * not evenly spread. Filling in the emptiest corner of a near-empty desert
 * region does nothing for the personas the app actually generates if nobody
 * is ever drawn there; filling in a market town on the Gangetic Plain does a
 * great deal, because `areaPopulationWeight` and `regionPopulationWeight`
 * together decide how often the draw lands on a given area, and cities are
 * the only thing that makes an area denser than bare countryside.
 *
 * Just as important is knowing which empty areas are correctly empty. A
 * quarter of the map is open ocean, ice, desert interior or land nobody had
 * yet reached, and "no city" is the right answer there. Getting that filter
 * wrong would send an editor to invent a city for the Gobi interior or the
 * Southern Ocean, which is a worse outcome than leaving the gap alone. The
 * `notExpected` flag below is deliberately conservative — an area is only
 * excused if the map already says so (open water, a zero economic-activity
 * rating) or if `hasCapability('urban_settlement', ...)` says a town of any
 * kind never arrived there in the zone this app models, at any date up to the
 * present. `urban_settlement` rather than `settled_agriculture` matters here:
 * farming and a city are not the same date anywhere, and MENA in particular
 * had farming villages four thousand years before it had its first cities.
 * Gating on agriculture alone flagged "no city before 3000 BCE" almost
 * everywhere on the map, which is not a gap — nowhere but Mesopotamia and the
 * Nile had cities that early — it is the correct shape of the Bronze Age.
 *
 * Two secondary checks ride along because they use the same walk over
 * `CITIES_DATA`:
 *
 *   - Duplicate area names. `GEOGRAPHICAL_DATA` is nested zone → region →
 *     area, and nothing stops two regions from reusing the same area name.
 *     `CITIES_DATA` is keyed on the bare name, so a duplicate silently hands
 *     the same city to both places. "Chesapeake Bay" is both a Southeast
 *     region and an Atlantic Coast region of North America, and Jamestown
 *     belongs to only one of them.
 *   - Cities with no `declineYear` old enough to need one. A city with no
 *     decline year is modeled as standing forever, which is correct for
 *     Beijing and wrong for a Han-dynasty capital or a Jacobean fort that did
 *     not last past the seventeenth century. This cannot be told apart from
 *     the data alone — Chang'an and Jamestown look exactly like Beijing by
 *     every field the schema has — so this prints a reviewable candidate list
 *     rather than a verdict, and calls out the two cases this task named.
 *
 *   npm run city-audit
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
  });
}

const originalLog = console.log;
console.log = () => undefined;
console.warn = () => undefined;

const [
  { GEOGRAPHICAL_DATA },
  { CITIES_DATA },
  { regionPopulationWeight, areaPopulationWeight },
  { hasCapability },
] = await Promise.all([
  import('../src/constants/gameData/geography'),
  import('../src/constants/gameData/cities'),
  import('../src/constants/gameData/regionPopulation'),
  import('../src/constants/societyCapabilities'),
]);

console.log = originalLog;

/**
 * `GEOGRAPHICAL_DATA` is keyed by nine geography zones; `hasCapability` and
 * `regionPopulationWeight`/`areaPopulationWeight` want the ten-value
 * `CulturalZone` the generator actually samples from (`personaGenerator.ts`,
 * `culturalZoneToGeographyKey`). Every zone is 1:1 except North America,
 * which the generator splits by a hard 1492 cutoff decided once per persona,
 * before a region is even chosen — so the same split is applied here per era
 * band rather than per area.
 */
const GEO_TO_CULTURAL_ZONE: Record<string, string> = {
  'Europe': 'EUROPEAN',
  'South America': 'SOUTH_AMERICAN',
  'MENA': 'MENA',
  'Sub Saharan Africa': 'SUB_SAHARAN_AFRICAN',
  'South Asia': 'SOUTH_ASIAN',
  'Southeast Asia': 'SOUTHEAST_ASIAN',
  'East Asia': 'EAST_ASIAN',
  'Oceania': 'OCEANIA',
};

function culturalZoneFor(geoZone: string, year: number): string {
  if (geoZone === 'North America') {
    return year >= 1492 ? 'NORTH_AMERICAN_COLONIAL' : 'NORTH_AMERICAN_PRE_COLUMBIAN';
  }
  return GEO_TO_CULTURAL_ZONE[geoZone] ?? geoZone;
}

/**
 * The four era bands this task asks for. `checkYear` is the most permissive
 * year inside each band — settled agriculture only ever arrives, never
 * leaves, in this table, so checking at the late edge of a band answers
 * "was a city ever plausible here during this whole span".
 */
const ERA_BANDS: Array<{ label: string; start: number; end: number; checkYear: number }> = [
  { label: 'pre-3000 BCE', start: -Infinity, end: -3000, checkYear: -3001 },
  { label: '3000 BCE-500 CE', start: -3000, end: 500, checkYear: 499 },
  { label: '500-1500', start: 500, end: 1500, checkYear: 1499 },
  { label: '1500+', start: 1500, end: Infinity, checkYear: 2023 },
];

/** Representative years sampled to build one ranking weight per area. */
const SAMPLE_YEARS = [-8000, -3000, -1000, 500, 1000, 1300, 1500, 1650, 1800, 1900, 1950, 2000, 2023];

function activeInBand(
  cities: Array<{ foundingYear: number; declineYear?: number }>,
  band: { start: number; end: number },
): boolean {
  return cities.some(c => c.foundingYear < band.end && (c.declineYear === undefined || c.declineYear >= band.start));
}

interface AreaRow {
  zone: string;
  region: string;
  area: string;
  weight: number;
  missingBands: string[];
  notExpected: boolean;
  notExpectedReason?: string;
  hasAnyCityData: boolean;
}

const rows: AreaRow[] = [];
/** area name -> list of (zone, region) it appears under, for the duplicate check. */
const areaLocations = new Map<string, Array<{ zone: string; region: string }>>();

for (const [zone, regions] of Object.entries(GEOGRAPHICAL_DATA as Record<string, any>)) {
  for (const [region, areas] of Object.entries(regions as Record<string, any>)) {
    for (const area of Object.values(areas as Record<string, any>)) {
      const areaName = area.name as string;
      if (!areaLocations.has(areaName)) areaLocations.set(areaName, []);
      areaLocations.get(areaName)!.push({ zone, region });

      const cities = CITIES_DATA[areaName] ?? [];
      const hasAnyCityData = cities.length > 0;

      // Static disqualifiers: the map itself says nobody lives here, in any era.
      let notExpected = false;
      let notExpectedReason: string | undefined;
      if (area.archetype === 'OPEN_OCEAN' || area.archetype === 'SHOALS') {
        notExpected = true;
        notExpectedReason = 'open water';
      } else if (area.economicActivityLevel === 0) {
        notExpected = true;
        notExpectedReason = 'negligible economic activity (desert/ice/wasteland rating)';
      }

      const missingBands: string[] = [];
      for (const band of ERA_BANDS) {
        if (area.minYear !== undefined && band.end <= area.minYear) continue; // not yet settled
        if (activeInBand(cities, band)) continue;

        const zoneForBand = culturalZoneFor(zone, band.checkYear);
        let capable = hasCapability('urban_settlement', {
          year: band.checkYear,
          culturalZone: zoneForBand as any,
          placeLower: areaName.toLowerCase(),
        });
        // `urban_settlement` has no zone-level date for OCEANIA at all — the
        // table only grants it through the Australia place-override — which
        // would otherwise blank out every Pacific and Melanesian area for
        // every era, including the 1500+ band where CITIES_DATA itself
        // carries real Pacific ports. That is a gap in the capability table,
        // not a claim that no Pacific settlement ever supported a town, so it
        // is patched here rather than silently inherited.
        if (!capable && zoneForBand === 'OCEANIA' && band.checkYear >= 1750) capable = true;
        if (!notExpected && !capable) continue; // never a place for a settled town in this band
        missingBands.push(band.label);
      }

      if (missingBands.length === 0 && !notExpected) continue; // fully covered, or nothing to report
      if (notExpected && missingBands.length === 0) continue; // correctly empty everywhere; not a gap to rank

      let weight = 0;
      for (const year of SAMPLE_YEARS) {
        weight += regionPopulationWeight(zone, region, year) * areaPopulationWeight(areaName, year, CITIES_DATA);
      }
      weight /= SAMPLE_YEARS.length;

      rows.push({ zone, region, area: areaName, weight, missingBands, notExpected, notExpectedReason, hasAnyCityData });
    }
  }
}

// ---------------------------------------------------------------------------
// Duplicate area names: the same key claimed by more than one region.
// ---------------------------------------------------------------------------
const duplicates = [...areaLocations.entries()]
  .filter(([, locs]) => locs.length > 1)
  .map(([name, locs]) => ({ name, locs, hasCities: (CITIES_DATA[name]?.length ?? 0) > 0 }));

// ---------------------------------------------------------------------------
// The same city name recorded under two different map areas. Two entries for
// the same place inside one region are plausible — Boston turns up under
// both "Boston Harbor" and the neighbouring "Cape Cod" — but the same name
// under areas in two different regions is not a coincidence, it is a
// copy-paste of one entry into the wrong place. This is how "Gondar",
// Ethiopia's highland fortress-capital, ended up a second time under
// "Limpopo Valley" in Southern Africa, two thousand miles from Ethiopia.
// ---------------------------------------------------------------------------
const cityNameToAreas = new Map<string, string[]>();
for (const [areaName, cities] of Object.entries(CITIES_DATA as Record<string, any[]>)) {
  for (const city of cities) {
    if (!cityNameToAreas.has(city.name)) cityNameToAreas.set(city.name, []);
    cityNameToAreas.get(city.name)!.push(areaName);
  }
}
interface MisplacedCity { name: string; areas: Array<{ area: string; zone: string; region: string }>; }
const misplacedCities: MisplacedCity[] = [];
for (const [name, areas] of cityNameToAreas.entries()) {
  if (areas.length < 2) continue;
  // Orphaned keys (no matching area at all) are reported separately above;
  // counting them here too would just relabel the same defect.
  const real = areas.filter(area => areaLocations.has(area));
  if (real.length < 2) continue;
  const located = real.map(area => {
    const loc = areaLocations.get(area)![0];
    return { area, zone: loc.zone, region: loc.region };
  });
  const regions = new Set(located.map(l => `${l.zone}/${l.region}`));
  if (regions.size > 1) misplacedCities.push({ name, areas: located });
}

// ---------------------------------------------------------------------------
// CITIES_DATA keys with no matching area in GEOGRAPHICAL_DATA at all. A city
// filed under one of these is not merely mis-shelved, it is invisible: no
// persona's location string will ever equal a name the map does not have, so
// `areaPopulationWeight` and `localCity` never see it. This is a stricter,
// mechanical version of "keyed to the wrong place" — the place does not
// exist under this name in the map at all.
// ---------------------------------------------------------------------------
const orphanedCityKeys = Object.keys(CITIES_DATA).filter(key => !areaLocations.has(key));

// ---------------------------------------------------------------------------
// Candidate list: cities with no declineYear old enough to plausibly need one.
// ---------------------------------------------------------------------------
interface OldCityCandidate { area: string; name: string; foundingYear: number; lastAllegianceYear: number; soleEntry: boolean; }
const oldCityCandidates: OldCityCandidate[] = [];
for (const [area, cities] of Object.entries(CITIES_DATA as Record<string, any[]>)) {
  for (const city of cities) {
    if (city.declineYear !== undefined) continue;
    const allegianceYears = Object.keys(city.allegianceHistory ?? {}).map(Number);
    const lastAllegianceYear = allegianceYears.length > 0 ? Math.max(...allegianceYears) : city.foundingYear;
    if (lastAllegianceYear >= 1900) continue; // recent enough that "still standing" needs no defence
    oldCityCandidates.push({
      area,
      name: city.name,
      foundingYear: city.foundingYear,
      lastAllegianceYear,
      soleEntry: cities.length === 1,
    });
  }
}
oldCityCandidates.sort((a, b) => a.lastAllegianceYear - b.lastAllegianceYear);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const genuine = rows.filter(r => !r.notExpected);
const correctlyEmpty = rows.filter(r => r.notExpected);

originalLog('\n=== City coverage audit ===');
originalLog(`${rows.length} map areas flagged (some coverage missing or correctly none expected)`);
originalLog(`  ${genuine.length} genuine gaps (a city is plausible and none is recorded for at least one era band)`);
originalLog(`  ${correctlyEmpty.length} correctly-empty areas surfaced only because they also miss capability-band coverage`);
originalLog('');

genuine.sort((a, b) => b.weight - a.weight);

originalLog('=== Ranked genuine gaps (highest population weight first) ===');
originalLog(`${'zone / region / area'.padEnd(60)} ${'weight'.padStart(8)}  missing eras`);
for (const row of genuine) {
  const label = `${row.zone} / ${row.region} / ${row.area}`;
  const tag = row.hasAnyCityData ? '' : ' [no city data at all]';
  originalLog(`${label.padEnd(60)} ${row.weight.toFixed(2).padStart(8)}  ${row.missingBands.join(', ')}${tag}`);
}

originalLog('\n=== Correctly-empty areas (no city expected) ===');
originalLog(`${correctlyEmpty.length} areas — a sample, with the reason they were excused:`);
for (const row of correctlyEmpty.slice(0, 15)) {
  originalLog(`  ${row.zone} / ${row.region} / ${row.area} — ${row.notExpectedReason}`);
}
if (correctlyEmpty.length > 15) originalLog(`  … and ${correctlyEmpty.length - 15} more`);

originalLog('\n=== Duplicate area names across regions ===');
originalLog('Same area name claimed by more than one region; CITIES_DATA is keyed on the');
originalLog('bare name, so any city recorded there is silently shared by every claimant.');
if (duplicates.length === 0) {
  originalLog('  none');
} else {
  for (const dup of duplicates) {
    const where = dup.locs.map(l => `${l.zone}/${l.region}`).join(' & ');
    originalLog(`  ${dup.name.padEnd(28)} ${where}${dup.hasCities ? '  [has city data — check which region it belongs to]' : ''}`);
  }
}

originalLog('\n=== CITIES_DATA keys with no matching map area ===');
originalLog('These cities are invisible to the generator: no persona location string can');
originalLog('ever equal a name the map does not have under GEOGRAPHICAL_DATA.');
if (orphanedCityKeys.length === 0) {
  originalLog('  none');
} else {
  for (const key of orphanedCityKeys) {
    const names = (CITIES_DATA[key] ?? []).map((c: any) => c.name).join(', ');
    originalLog(`  "${key}" — ${names}`);
  }
}

originalLog('\n=== Cities keyed to more than one region ===');
originalLog('The same city name under map areas in different regions — not a place with two');
originalLog('names, but one entry copy-pasted into the wrong area.');
if (misplacedCities.length === 0) {
  originalLog('  none');
} else {
  for (const m of misplacedCities) {
    originalLog(`  ${m.name}: ${m.areas.map(a => `${a.area} (${a.zone}/${a.region})`).join('  vs  ')}`);
  }
}

const verbose = process.argv.includes('--verbose');
originalLog('\n=== Cities with no declineYear, last documented before 1900 ===');
originalLog(`${oldCityCandidates.length} candidates. Not an error by itself — Beijing and London have no`);
originalLog('declineYear and are right not to; this is a list to review, oldest first, for');
originalLog('places that did not, in fact, last. Pass --verbose for the full list.\n');
for (const c of oldCityCandidates.slice(0, verbose ? undefined : 20)) {
  originalLog(`  ${c.area.padEnd(28)} ${c.name.padEnd(16)} founded ${c.foundingYear}, last allegiance entry ${c.lastAllegianceYear}${c.soleEntry ? '  (only entry for this area — no successor recorded)' : ''}`);
}
if (!verbose && oldCityCandidates.length > 20) originalLog(`  … and ${oldCityCandidates.length - 20} more (--verbose to list all)`);

const changAn = oldCityCandidates.find(c => c.name === "Chang'an" && c.area === 'Yellow River Valley');
const jamestown = oldCityCandidates.find(c => c.name === 'Jamestown' && c.area === 'Chesapeake Bay');
originalLog('\n=== Named checks ===');
originalLog(`  Chang'an / Yellow River Valley: ${changAn ? 'confirmed — no declineYear, no successor entry' : 'NOT FOUND (data may have changed)'}`);
originalLog(`  Jamestown / Chesapeake Bay: ${jamestown ? 'confirmed — no declineYear, no successor entry' : 'NOT FOUND (data may have changed)'}`);
originalLog('');
