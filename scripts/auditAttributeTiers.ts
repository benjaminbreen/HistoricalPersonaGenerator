/**
 * scripts/auditAttributeTiers.ts - Measures how often each rarity band is drawn
 *
 * `ATTRIBUTE_TIER_SHARE` in personaRarityService is the share of personas
 * carrying at least one badge of a given tier or rarer, and it cannot be
 * derived in closed form: an attribute's chance of being drawn depends on the
 * age, sex, class, trade, place and year of the person drawing it. So it is
 * measured. Run this after moving any weights or thresholds and paste the
 * figures back into the table.
 *
 *   npm run tier-audit -- --count 3000
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

function readOption(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const count = Math.max(1, Number.parseInt(readOption('--count') || '3000', 10));
const originalLog = console.log;
console.log = () => undefined;
console.warn = () => undefined;
const [
  { generateHistoricalPersona },
  { RARITY_LABELS, normalizeRarity },
] = await Promise.all([
  import('../src/services/personaGenerator'),
  import('../src/types/attributeTypes'),
]);
type Tier = keyof typeof RARITY_LABELS;

const TIER_ORDER: Tier[] = [
  'common', 'uncommon', 'seldom_seen', 'rare', 'very_rare', 'exceedingly_rare',
];

const rarestCounts = new Map<Tier, number>();
const personaTiers = new Map<string, number>();
const attributeCounts = new Map<string, { tier: Tier; count: number }>();
let badgeTotal = 0;
let withAnyBadge = 0;

const nativeRandom = Math.random;
for (let index = 0; index < count; index += 1) {
  const seed = (1977 + index) >>> 0;
  Math.random = seededRandom(seed);
  let persona;
  try {
    persona = generateHistoricalPersona({ seed });
  } finally {
    Math.random = nativeRandom;
  }

  const personaTier = (persona.rarity as { tier?: string } | undefined)?.tier
    ?? (persona.character as { rarityTier?: string }).rarityTier
    ?? 'unknown';
  personaTiers.set(personaTier, (personaTiers.get(personaTier) || 0) + 1);

  const attributes = persona.character.attributes || [];
  if (attributes.length > 0) withAnyBadge += 1;
  badgeTotal += attributes.length;

  let rarest: Tier | null = null;
  for (const attribute of attributes) {
    const tier = normalizeRarity(attribute.rarity as string);
    if (!tier) continue;
    const key = attribute.name || attribute.id;
    const entry = attributeCounts.get(key) || { tier, count: 0 };
    entry.count += 1;
    // An attribute's tier moves with context; report the rarest it ever landed.
    if (TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(entry.tier)) entry.tier = tier;
    attributeCounts.set(key, entry);
    if (!rarest || TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(rarest)) rarest = tier;
  }
  if (rarest) rarestCounts.set(rarest, (rarestCounts.get(rarest) || 0) + 1);
}

console.log = originalLog;

console.log(`\nattribute tiers — ${count} personas, ${badgeTotal} badges, ${(withAnyBadge / count * 100).toFixed(1)}% carry at least one\n`);
console.log('  ATTRIBUTE_TIER_SHARE (share carrying this tier or rarer):');
let cumulative = 0;
for (const tier of [...TIER_ORDER].reverse()) {
  cumulative += rarestCounts.get(tier) || 0;
  const share = cumulative / count;
  console.log(`    ${tier}: ${share.toFixed(4)},`.padEnd(34)
    + `// rarest badge for ${rarestCounts.get(tier) || 0} personas`);
}

console.log('\n  persona rarity tiers (anything but ordinary shows the "1 in N" line and the blue star):');
[...personaTiers.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([tier, n]) => console.log(`    ${tier.padEnd(12)} ${(n / count * 100).toFixed(2)}%  (${n})`));

console.log('\n  never drawn:');
const drawn = new Set(attributeCounts.keys());
const { getAllAttributes } = await import('../src/constants/attributeDefinitions');
const missing = getAllAttributes().filter(a => !drawn.has(a.name));
console.log(missing.length === 0 ? '    (none)' : missing.map(a => `    ${a.name}`).join('\n'));

console.log('\n  rarest twenty drawn:');
[...attributeCounts.entries()]
  .sort((a, b) => TIER_ORDER.indexOf(b[1].tier) - TIER_ORDER.indexOf(a[1].tier) || a[1].count - b[1].count)
  .slice(0, 20)
  .forEach(([name, entry]) => console.log(`    ${name.padEnd(34)} ${RARITY_LABELS[entry.tier].padEnd(18)} ${entry.count}`));
