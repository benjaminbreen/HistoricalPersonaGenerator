/**
 * scripts/auditProfessionReach.ts
 *
 * Which entries in the profession tables can never be drawn.
 *
 * `professions.ts` is 6,500 lines of carefully researched work, and the most
 * expensive defect this app has had was not a wrong entry in it but an
 * unreachable one. Three were found in a single afternoon: eleven zone elite
 * classes that no allow-group named, so every samurai, brahmin and
 * scholar-official in the file was dead data; a rarity weight that could not
 * express a per-capita rate; and a status sampler whose result was discarded.
 * Each was well written and reached by nothing.
 *
 * The `attribute-pool` check in `auditNarrative` already asks this question of
 * the attribute tables ("220/220 reachable"). This asks it of the professions.
 *
 *   npm run reach-audit                # summary
 *   npm run reach-audit -- --list      # every unreachable role
 *   npm run reach-audit -- --strict    # exit non-zero if anything is unreachable
 *
 * It is a *structural* check: it asks whether the gates that do not depend on a
 * particular persona can all be passed at once. A role it calls reachable may
 * still be vanishingly rare; a role it calls unreachable cannot be produced at
 * all.
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
  { PROFESSIONS },
  { ALLOWED_CLASS_GROUPS, isProfessionValidForRegion, isSocialClassValidForRegion },
  { getProfessionSelectionWeight, isProfessionHistoricallyAvailable },
  { genderAccessWeight },
  { ERA_BOUNDS },
  { GEOGRAPHICAL_DATA },
  { createHistoricalContext },
] = await Promise.all([
  import('../src/constants/characterData/professions'),
  import('../src/generation/common/npcUtils'),
  import('../src/services/professionAvailabilityService'),
  import('../src/services/genderedLaborService'),
  import('../src/services/demographyService'),
  import('../src/constants/gameData/geography'),
  import('../src/services/historicalContextService'),
]);

console.log = originalLog;

const LIST = process.argv.includes('--list');
const STRICT = process.argv.includes('--strict');

type Reason =
  | 'class-not-in-any-group'
  | 'zero-selection-weight'
  | 'decade-range-outside-era'
  | 'no-valid-region'
  | 'no-gender-can-hold'
  | 'not-historically-available';

interface Finding {
  zone: string;
  era: string;
  socialClass: string;
  role: string;
  reason: Reason;
}

/** Every class name any status group can reach. */
const REACHABLE_CLASSES = new Set(
  Object.values(ALLOWED_CLASS_GROUPS).flat().map(name => name.toUpperCase()),
);

/** The regions the generator can actually place a persona in, by zone. */
const ZONE_KEYS: Record<string, string> = {
  EUROPEAN: 'Europe',
  EAST_ASIAN: 'East Asia',
  SOUTH_ASIAN: 'South Asia',
  SOUTHEAST_ASIAN: 'Southeast Asia',
  MENA: 'MENA',
  SUB_SAHARAN_AFRICAN: 'Sub Saharan Africa',
  OCEANIA: 'Oceania',
  NORTH_AMERICAN_PRE_COLUMBIAN: 'North America',
  NORTH_AMERICAN_COLONIAL: 'North America',
  SOUTH_AMERICAN: 'South America',
};

const regionsFor = (zone: string): string[] => {
  const data = (GEOGRAPHICAL_DATA as any)[ZONE_KEYS[zone]];
  return data ? Object.keys(data) : [];
};

const findings: Finding[] = [];
let total = 0;

for (const [zone, eras] of Object.entries(PROFESSIONS as any)) {
  const regions = regionsFor(zone);
  for (const [era, classes] of Object.entries(eras as any)) {
    const bounds = (ERA_BOUNDS as any)[era];
    if (!bounds) continue;
    // Years spread across the era. Generation draws any year in the era, so a
    // sparse sample reports false unreachability: three points missed the
    // decade a Trench Soldier or a Red Guard occupies and called forty-five
    // correctly dated roles dead.
    const span = bounds.max - bounds.min;
    const years = Array.from({ length: 13 }, (_, i) => Math.round(bounds.min + (span * i) / 12));

    for (const [socialClass, roles] of Object.entries(classes as any)) {
      const classReachable = REACHABLE_CLASSES.has(socialClass.toUpperCase());
      const classRegions = regions.filter(region =>
        isSocialClassValidForRegion(socialClass, region, zone as any));

      for (const [role, def] of Object.entries(roles as any)) {
        total += 1;
        const roleDef = def as any;

        if (!classReachable) {
          findings.push({ zone, era, socialClass, role, reason: 'class-not-in-any-group' });
          continue;
        }
        if (classRegions.length === 0) {
          findings.push({ zone, era, socialClass, role, reason: 'no-valid-region' });
          continue;
        }
        const openRegions = classRegions.filter(region =>
          isProfessionValidForRegion(role, region, zone as any));
        if (openRegions.length === 0) {
          findings.push({ zone, era, socialClass, role, reason: 'no-valid-region' });
          continue;
        }

        // Interval overlap, not sampled points: a role is reachable if its
        // decade range meets the era's span anywhere at all.
        const decade = roleDef.decadeRange as [number, number] | undefined;
        if (decade && (decade[1] < bounds.min || decade[0] > bounds.max)) {
          findings.push({ zone, era, socialClass, role, reason: 'decade-range-outside-era' });
          continue;
        }
        const eraYears = decade
          ? [...years.filter(y => y >= decade[0] && y <= decade[1]),
            Math.max(bounds.min, decade[0]), Math.min(bounds.max, decade[1])]
          : years;

        // Every region the class is open in, not just the first.
        //
        // The capability model answers by *place* — Mesoamerican metallurgy from
        // 800 CE, Andean from 1500 BCE, agriculture never on the Baffin coast —
        // so testing one region of a zone asks the question of the wrong
        // country. Checking the first North American region alone reported the
        // whole Mesoamerican farming block as unreachable.
        const region = openRegions[0];
        const contexts = eraYears.flatMap(year => openRegions.map(place => {
          try {
            return createHistoricalContext({
              year, era: era as any, culturalZone: zone as any, region: place, location: place,
            });
          } catch {
            return undefined;
          }
        }));

        // Both kinds of place. `isProfessionHistoricallyAvailable` refuses a
        // gas station attendant in the countryside and a shepherd in a city,
        // and a persona can be born in either — testing only the region name,
        // which resolves rural, called every urban trade in the file dead.
        const placed = contexts.flatMap(ctx =>
          (ctx ? [ctx, { ...ctx, localeType: 'city' as const }] : []));

        if (!placed.some(ctx => isProfessionHistoricallyAvailable(role, ctx))) {
          findings.push({ zone, era, socialClass, role, reason: 'not-historically-available' });
          continue;
        }
        if (!placed.some(ctx => getProfessionSelectionWeight(role, ctx as any) > 0)) {
          findings.push({ zone, era, socialClass, role, reason: 'zero-selection-weight' });
          continue;
        }

        const canHold = eraYears.some(year =>
          (['Male', 'Female'] as const).some(sex =>
            genderAccessWeight(role, sex, year, { declaredBias: roleDef.genderBias, region }) > 0));
        if (!canHold) {
          findings.push({ zone, era, socialClass, role, reason: 'no-gender-can-hold' });
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const REASON_NOTE: Record<Reason, string> = {
  'class-not-in-any-group': 'the table class is named by no entry in ALLOWED_CLASS_GROUPS',
  'zero-selection-weight': 'held at weight 0 (an office the elite roll owns, or a straggler title)',
  'decade-range-outside-era': 'decadeRange does not overlap the era it is filed under',
  'no-valid-region': 'excluded from every region of its own zone',
  'no-gender-can-hold': 'no sex clears genderAccessWeight in any year of the era',
  'not-historically-available': 'isProfessionHistoricallyAvailable rejects it throughout the era',
};

const byReason = new Map<Reason, Finding[]>();
for (const f of findings) {
  byReason.set(f.reason, [...(byReason.get(f.reason) ?? []), f]);
}

const share = (n: number) => `${((n / total) * 100).toFixed(1)}%`;

console.log(`\nprofession reachability — ${total} table entries\n`);
console.log(`  ${total - findings.length} reachable, ${findings.length} unreachable (${share(findings.length)})\n`);

for (const [reason, group] of [...byReason].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${String(group.length).padStart(4)}  ${reason}`);
  console.log(`        ${REASON_NOTE[reason]}`);

  // The clusters, which is where the work is: one class in one zone/era is one
  // decision, not thirty separate ones.
  const clusters = new Map<string, string[]>();
  for (const f of group) {
    const key = `${f.zone} / ${f.era} / ${f.socialClass}`;
    clusters.set(key, [...(clusters.get(key) ?? []), f.role]);
  }
  const ranked = [...clusters].sort((a, b) => b[1].length - a[1].length);
  for (const [key, roles] of ranked.slice(0, LIST ? ranked.length : 6)) {
    const shown = LIST ? roles.join(', ') : roles.slice(0, 5).join(', ') + (roles.length > 5 ? ', …' : '');
    console.log(`          ${String(roles.length).padStart(3)}  ${key}`);
    console.log(`               ${shown}`);
  }
  if (!LIST && ranked.length > 6) console.log(`          … and ${ranked.length - 6} more groups`);
  console.log('');
}

/**
 * What always fails the run.
 *
 * `zero-selection-weight` is intentional — those are the office titles the
 * elite roll owns — and a handful of `not-historically-available` entries are
 * correct refusals about places that never had the trade. The three below are
 * never intentional: a class no status can name, a role excluded from every
 * region of its own zone, and a role no sex may hold are all defects.
 */
const NEVER_INTENTIONAL: Reason[] = ['class-not-in-any-group', 'no-valid-region', 'no-gender-can-hold'];
const defects = findings.filter(f => NEVER_INTENTIONAL.includes(f.reason));

if (defects.length > 0) {
  console.log(`  FAIL  ${defects.length} entries unreachable for reasons that are never intentional\n`);
  process.exit(1);
}
if (STRICT && findings.length > 0) process.exit(1);
console.log(`  PASS  no class is unreachable from every station\n`);
