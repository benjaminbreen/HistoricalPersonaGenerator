/**
 * encounter/engine/rapport.ts
 *
 * Would these two get along? Every contribution is a named, human-readable
 * factor — the breakdown is shown to the player, because *why* a ninth-century
 * drover and a Baghdad calligrapher struggle to connect is the history lesson.
 */

import { HistoricalPersona } from '../../services/personaGenerator';
import { CulturalZone } from '../../types/characterData';
import { BattleStats, WEALTH_RANK } from './stats';

export interface RapportFactor {
  id: string;
  label: string;
  value: number;
  detail: string;
}

export interface RapportReport {
  rapport: number;
  tension: number;
  curiosity: number;
  factors: RapportFactor[];
  tensionFactors: RapportFactor[];
}

/** Zones whose peoples plausibly met through trade in most eras. */
const TRADE_LINKS: Array<[CulturalZone, CulturalZone]> = [
  ['EUROPEAN', 'MENA'],
  ['MENA', 'SOUTH_ASIAN'],
  ['MENA', 'SUB_SAHARAN_AFRICAN'],
  ['SOUTH_ASIAN', 'SOUTHEAST_ASIAN'],
  ['SOUTHEAST_ASIAN', 'EAST_ASIAN'],
  ['EAST_ASIAN', 'SOUTH_ASIAN'],
  ['SOUTHEAST_ASIAN', 'OCEANIA'],
  ['NORTH_AMERICAN_COLONIAL', 'EUROPEAN'],
  ['NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL'],
  ['SOUTH_AMERICAN', 'NORTH_AMERICAN_PRE_COLUMBIAN'],
];

function tradeLinked(a: CulturalZone, b: CulturalZone): boolean {
  return TRADE_LINKS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

const FAITH_FAMILIES: Array<[RegExp, string]> = [
  [/christ|catholic|orthodox|protestant|coptic|lutheran|calvin|anglican|puritan/i, 'Christian'],
  [/islam|muslim|sunni|shia|shi'a|sufi/i, 'Islamic'],
  [/juda|jewish|hebrew/i, 'Jewish'],
  [/buddh/i, 'Buddhist'],
  [/hindu|vedic|shaiv|vaishnav/i, 'Hindu'],
  [/confucian|daoi|taoi|chinese folk/i, 'Chinese traditional'],
  [/shinto/i, 'Shinto'],
  [/zoroast/i, 'Zoroastrian'],
  [/sikh/i, 'Sikh'],
  [/animis|traditional|folk|totem|shaman|ancestor|spirit|pagan|polythe|indigenous/i, 'traditional'],
];

function faithFamily(religion: string | undefined): string | null {
  if (!religion) return null;
  for (const [pattern, family] of FAITH_FAMILIES) {
    if (pattern.test(religion)) return family;
  }
  return null;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pct = (v: number | undefined) => clamp(v ?? 50, 0, 100);

export function computeRapport(
  a: HistoricalPersona,
  b: HistoricalPersona,
  battleA: BattleStats,
  battleB: BattleStats
): RapportReport {
  const ca = a.character;
  const cb = b.character;
  const factors: RapportFactor[] = [];
  const tensionFactors: RapportFactor[] = [];

  const yearGap = Math.abs(a.year - b.year);
  const centuries = Math.round(yearGap / 100);
  factors.push(
    yearGap <= 40
      ? { id: 'era', label: 'Same times', value: 6, detail: 'They live in the same world of events.' }
      : yearGap <= 150
        ? { id: 'era', label: 'A lifetime apart', value: 2, detail: `${yearGap} years between them — grandparents' stories.` }
        : yearGap <= 600
          ? { id: 'era', label: 'Centuries apart', value: -4, detail: `${centuries} centuries of change divide their assumptions.` }
          : { id: 'era', label: 'Worlds apart in time', value: -9, detail: `${centuries} centuries apart — each finds the other's world unimaginable.` }
  );

  const zoneA = ca.culturalZone as CulturalZone;
  const zoneB = cb.culturalZone as CulturalZone;
  factors.push(
    zoneA === zoneB
      ? { id: 'world', label: 'Shared world', value: 8, detail: 'The same broad civilization: familiar foods, manners, markets.' }
      : tradeLinked(zoneA, zoneB)
        ? { id: 'world', label: 'Linked by trade', value: 4, detail: 'Their homelands traded goods and stories for generations.' }
        : { id: 'world', label: 'Strangers’ worlds', value: -4, detail: 'Nothing in either upbringing prepared them for the other.' }
  );

  const famA = faithFamily(ca.religion);
  const famB = faithFamily(cb.religion);
  const sameFaith = ca.religion && cb.religion &&
    ca.religion.trim().toLowerCase() === cb.religion.trim().toLowerCase();
  if (sameFaith) {
    factors.push({ id: 'faith', label: 'Same faith', value: 8, detail: `Both hold to ${ca.religion}.` });
  } else if (famA && famB && famA === famB) {
    factors.push({ id: 'faith', label: 'Kindred faiths', value: 4, detail: `Both ${famA} traditions — familiar rites, disputed details.` });
  } else if (famA && famB) {
    factors.push({ id: 'faith', label: 'Different faiths', value: -3, detail: `${ca.religion} meets ${cb.religion}.` });
    tensionFactors.push({ id: 'faith-t', label: 'Foreign rites', value: 4, detail: 'Each finds the other’s observances strange.' });
  }

  const rankGap = Math.abs(WEALTH_RANK[ca.wealthLevel] - WEALTH_RANK[cb.wealthLevel]);
  factors.push(
    rankGap === 0
      ? { id: 'station', label: 'Equals in station', value: 5, detail: 'Neither bows first.' }
      : rankGap <= 1
        ? { id: 'station', label: 'Near in station', value: 2, detail: 'Close enough in rank to speak plainly.' }
        : rankGap <= 2
          ? { id: 'station', label: 'A gulf of rank', value: -2, detail: 'One of them owns more than the other will ever touch.' }
          : { id: 'station', label: 'Utterly unequal', value: -6, detail: 'The gap in wealth shapes every word between them.' }
  );

  const agree = (pct(ca.personality?.agreeableness) + pct(cb.personality?.agreeableness)) / 2;
  const temperament = Math.round(((agree - 50) / 50) * 8);
  if (temperament !== 0) {
    factors.push({
      id: 'temper', label: temperament > 0 ? 'Warm temperaments' : 'Prickly temperaments',
      value: temperament,
      detail: temperament > 0 ? 'Both inclined to think well of strangers.' : 'Neither suffers fools, or much of anyone.',
    });
  }

  const extraA = pct(ca.personality?.extraversion);
  const extraB = pct(cb.personality?.extraversion);
  if (extraA > 62 && extraB > 62) {
    factors.push({ id: 'talkers', label: 'Both talkers', value: 3, detail: 'Silence does not last long here.' });
  } else if (extraA < 38 && extraB < 38) {
    factors.push({ id: 'quiet', label: 'Comfortable silence', value: 2, detail: 'Two quiet people, both relieved.' });
  }

  if (ca.profession && cb.profession &&
      ca.profession.trim().toLowerCase() === cb.profession.trim().toLowerCase()) {
    factors.push({ id: 'trade', label: 'The same trade', value: 7, detail: `Two ${ca.profession.toLowerCase()}s always find something to compare.` });
  }

  const ageGap = Math.abs(ca.age - cb.age);
  if (ageGap <= 8) {
    factors.push({ id: 'age', label: 'Age-mates', value: 3, detail: 'The same stage of life, the same worries.' });
  }

  const rapport = clamp(50 + factors.reduce((sum, f) => sum + f.value, 0), 5, 95);

  const mightGap = Math.abs(battleA.attack - battleB.attack);
  if (mightGap >= 14) {
    tensionFactors.push({ id: 'might', label: 'Unequal strength', value: 10, detail: 'One of them could not stop the other.' });
  }
  const rich = (p: HistoricalPersona) => WEALTH_RANK[p.character.wealthLevel] >= 3;
  const desperate = (p: HistoricalPersona) => p.character.wealthLevel === 'poor';
  if ((desperate(a) && rich(b)) || (desperate(b) && rich(a))) {
    tensionFactors.push({ id: 'purse', label: 'A full purse in view', value: 10, detail: 'Hunger has noticed wealth.' });
  }
  const nerves = (pct(ca.personality?.neuroticism) + pct(cb.personality?.neuroticism)) / 2;
  if (nerves > 60) {
    tensionFactors.push({ id: 'nerves', label: 'Jumpy company', value: 8, detail: 'Neither is calm by nature.' });
  }
  const martial = /soldier|warrior|guard|mercenar|raider|knight|samurai|archer|hunt/i;
  if (martial.test(ca.profession || '') || martial.test(cb.profession || '')) {
    tensionFactors.push({ id: 'arms', label: 'A fighter present', value: 6, detail: 'At least one of them has drawn blood for a living.' });
  }
  if (ca.legalStatus || cb.legalStatus) {
    tensionFactors.push({ id: 'bondage', label: 'Unfree status', value: 5, detail: 'One of them answers to an owner or a bond, and it colors everything.' });
  }

  const tension = clamp(
    18 + tensionFactors.reduce((sum, f) => sum + f.value, 0) - Math.round((rapport - 50) / 3),
    0, 90
  );

  const open = (pct(ca.personality?.openness) + pct(cb.personality?.openness)) / 2;
  const curiosity = clamp(
    Math.round(open * 0.7) + (yearGap > 600 ? 15 : 0) + (zoneA !== zoneB ? 8 : 0),
    5, 95
  );

  return { rapport, tension, curiosity, factors, tensionFactors };
}
