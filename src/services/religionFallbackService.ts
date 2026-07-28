import type { CulturalZone } from '../types';
import type { ReligionDistributionEntry } from '../constants/characterData/religions';

const entry = (religion: string, weight: number): ReligionDistributionEntry => ({ religion, weight });

const RELIGION_EMERGENCE_RULES: Array<{ pattern: RegExp; startYear: number }> = [
  { pattern: /\b(?:islam|muslim|sunni|shia|sufi)\b/i, startYear: 610 },
  { pattern: /\b(?:protestant|lutheran|calvinist|anglican|puritan|quaker)\b/i, startYear: 1517 },
  { pattern: /\bsikh/i, startYear: 1499 },
  { pattern: /\bmormon|latter-day/i, startYear: 1830 },
  { pattern: /\bbah[aá]['’]?i/i, startYear: 1844 },
  { pattern: /\bpentecostal/i, startYear: 1901 },
  { pattern: /\bmethodist/i, startYear: 1738 },
  { pattern: /\bdruze/i, startYear: 1017 },
  { pattern: /\bcathar/i, startYear: 1100 },
  { pattern: /\bbuddh/i, startYear: -500 },
  { pattern: /\bjain/i, startYear: -600 },
  { pattern: /\bconfucian/i, startYear: -500 },
  { pattern: /\btao|dao/i, startYear: -400 },
  { pattern: /\bhindu/i, startYear: -1500 },
  { pattern: /\bzoroastr/i, startYear: -1000 },
  { pattern: /\bjudai/i, startYear: -1000 },
  { pattern: /\bgreek polytheism\b/i, startYear: -800 },
  { pattern: /\broman polytheism\b/i, startYear: -750 },
  { pattern: /\bchristian/i, startYear: 30 },
  { pattern: /\b(?:catholic|orthodox|coptic|byzantine)\b/i, startYear: 30 },
];

export function isReligionHistoricallyAvailable(religion: string, year: number): boolean {
  return RELIGION_EMERGENCE_RULES
    .filter(rule => rule.pattern.test(religion))
    .every(rule => year >= rule.startYear);
}

export function getZoneReligionFallback(
  culturalZone: CulturalZone,
  year: number,
  place = '',
): ReligionDistributionEntry[] {
  switch (culturalZone) {
    case 'EUROPEAN':
      if (year < -800) return [entry('Local Beliefs', 80), entry('Ancestor Worship', 20)];
      // Iron Age Europe was Celtic, Germanic and Italic polytheism, all of which
      // this app files under Local Beliefs. Rome had not expanded and Jewish
      // communities in the western provinces are a later Roman phenomenon; the
      // single -800..300 bucket was putting both into eighth-century BCE Gaul.
      if (year < -100) return [entry('Local Beliefs', 84), entry('Ancestor Worship', 16)];
      if (year < 300) return [entry('Local Beliefs', 58), entry('Roman Polytheism', 32), entry('Judaism', 6), entry('Early Christianity', 4)];
      if (year < 800) return [entry('Local Beliefs', 50), entry('Early Christianity', 35), entry('Judaism', 10), entry('Roman Catholicism', 5)];
      if (year < 1450) return [entry('Roman Catholicism', 55), entry('Eastern Orthodoxy', 20), entry('Local Beliefs', 15), entry('Judaism', 10)];
      if (year < 1750) return [entry('Roman Catholicism', 45), entry('Protestantism', 30), entry('Eastern Orthodoxy', 15), entry('Judaism', 10)];
      return [entry('Roman Catholicism', 35), entry('Protestantism', 30), entry('Eastern Orthodoxy', 15), entry('Judaism', 10), entry('Atheism', 10)];
    case 'MENA':
      if (year < -1000) return [entry('Local Beliefs', 80), entry('Ancestor Worship', 20)];
      if (year < 610 && /\b(?:arabia|arabian|najd|hejaz|dhofar|yemen)\b/i.test(place)) {
        return [entry('Arabian Polytheism', 70), entry('Judaism', 15), entry('Christianity', 10), entry('Zoroastrianism', 5)];
      }
      if (year < 610 && /\b(?:persia|persian|iran|zagros|alborz)\b/i.test(place)) {
        return [entry('Zoroastrianism', 75), entry('Christianity', 10), entry('Judaism', 5), entry('Local Beliefs', 10)];
      }
      if (year < 610 && /\b(?:mesopotamia|babylon|tigris|euphrates)\b/i.test(place)) {
        return [entry('Eastern Christianity', 40), entry('Zoroastrianism', 30), entry('Judaism', 15), entry('Local Beliefs', 15)];
      }
      if (year < 610 && /\b(?:egypt|nile|thebes|nubia)\b/i.test(place)) {
        return [entry('Coptic Christianity', 55), entry('Egyptian Polytheism', 20), entry('Judaism', 10), entry('Local Beliefs', 15)];
      }
      if (year < 610 && /\b(?:levant|jerusalem|syria|palestine|lebanon)\b/i.test(place)) {
        return [entry('Eastern Christianity', 50), entry('Judaism', 25), entry('Local Beliefs', 15), entry('Zoroastrianism', 10)];
      }
      if (year < 610 && /\b(?:anatolia|cappadocia|tarsus)\b/i.test(place)) {
        return [entry('Byzantine Christianity', 65), entry('Local Anatolian Cults', 15), entry('Zoroastrianism', 10), entry('Judaism', 10)];
      }
      if (year < 300) return [entry('Local Beliefs', 45), entry('Zoroastrianism', 25), entry('Judaism', 15), entry('Christianity', 15)];
      if (year < 610) return [entry('Christianity', 40), entry('Zoroastrianism', 30), entry('Local Beliefs', 20), entry('Judaism', 10)];
      return [entry('Sunni Islam', 60), entry('Shia Islam', 15), entry('Christianity', 15), entry('Judaism', 5), entry('Local Beliefs', 5)];
    case 'EAST_ASIAN':
      if (year < -500) return [entry('Local Beliefs', 70), entry('Ancestor Worship', 30)];
      if (year < 0) return [entry('Local Beliefs', 45), entry('Ancestor Worship', 30), entry('Confucianism', 15), entry('Taoism', 10)];
      return [entry('Buddhism', 35), entry('Local Beliefs', 25), entry('Ancestor Worship', 20), entry('Confucianism', 10), entry('Taoism', 10)];
    case 'SOUTH_ASIAN':
      if (year < -1500) return [entry('Local Beliefs', 75), entry('Ancestor Worship', 25)];
      if (year < -500) return [entry('Vedic Religion', 60), entry('Local Beliefs', 25), entry('Ancestor Worship', 15)];
      if (year < 700) return [entry('Hinduism', 55), entry('Buddhism', 25), entry('Jainism', 10), entry('Local Beliefs', 10)];
      return [entry('Hinduism', 55), entry('Sunni Islam', 18), entry('Buddhism', 12), entry('Jainism', 8), entry('Local Beliefs', 7)];
    case 'SOUTHEAST_ASIAN': {
      // Three religious histories, not one. The mainland takes Hindu-Buddhist
      // court religion from about the second century and turns decisively
      // Theravada from the eleventh; the islands take the same Indic religions,
      // then Islam along the trade routes from the thirteenth century; and the
      // Philippines north of Mindanao is Catholic from the Spanish conquest,
      // while the Sulu sultanate stays Muslim. Under the old South Asian
      // fallback all of it came out Hindu.
      const mainland = /\b(?:indochina|mainland southeast|mekong|annam|tonkin|siam|thai|burma|irrawaddy|salween|khmer|angkor|champa|laos|malay peninsula|kra)\b/i.test(place);
      const philippines = /\b(?:philippin|luzon|visayan|mindanao|palawan|sulu)\b/i.test(place);
      const muslimSouth = /\b(?:sulu|mindanao|palawan)\b/i.test(place);

      if (year < 100) return [entry('Local Beliefs', 70), entry('Ancestor Worship', 30)];

      if (mainland) {
        if (year < 1100) return [entry('Hinduism', 35), entry('Buddhism', 30), entry('Local Beliefs', 25), entry('Ancestor Worship', 10)];
        return [entry('Buddhism', 70), entry('Local Beliefs', 15), entry('Ancestor Worship', 10), entry('Hinduism', 5)];
      }

      if (philippines) {
        if (year < 1400) return [entry('Local Beliefs', 75), entry('Ancestor Worship', 25)];
        if (year < 1565) return [entry('Local Beliefs', 55), entry('Sunni Islam', 30), entry('Ancestor Worship', 15)];
        if (muslimSouth) return [entry('Sunni Islam', 70), entry('Local Beliefs', 20), entry('Christianity', 10)];
        return [entry('Roman Catholicism', 75), entry('Local Beliefs', 15), entry('Ancestor Worship', 10)];
      }

      // The rest of the islands: Java, Sumatra, Borneo, Sulawesi, the Moluccas.
      if (year < 1300) return [entry('Local Beliefs', 45), entry('Hinduism', 25), entry('Buddhism', 20), entry('Ancestor Worship', 10)];
      if (year < 1600) return [entry('Sunni Islam', 45), entry('Local Beliefs', 25), entry('Hinduism', 20), entry('Buddhism', 10)];
      return [entry('Sunni Islam', 70), entry('Local Beliefs', 15), entry('Hinduism', 10), entry('Christianity', 5)];
    }
    case 'SUB_SAHARAN_AFRICAN':
      if (year < 700) return [entry('Local Beliefs', 85), entry('Ancestor Worship', 15)];
      if (year < 1500) return [entry('Local Beliefs', 70), entry('Ancestor Worship', 15), entry('Sunni Islam', 15)];
      return [entry('Local Beliefs', 45), entry('Christianity', 25), entry('Sunni Islam', 20), entry('Ancestor Worship', 10)];
    case 'OCEANIA':
      if (year < 1750) return [entry('Local Beliefs', 80), entry('Ancestor Worship', 20)];
      return [entry('Local Beliefs', 45), entry('Christianity', 45), entry('Ancestor Worship', 10)];
    case 'NORTH_AMERICAN_PRE_COLUMBIAN':
      return [entry('Local Beliefs', 80), entry('Ancestor Worship', 20)];
    case 'NORTH_AMERICAN_COLONIAL':
      if (year < 1600) return [entry('Local Beliefs', 85), entry('Ancestor Worship', 15)];
      return [entry('Protestantism', 45), entry('Roman Catholicism', 30), entry('Local Beliefs', 20), entry('Judaism', 5)];
    case 'SOUTH_AMERICAN':
      if (year < 1500) return [entry('Local Beliefs', 75), entry('Ancestor Worship', 25)];
      return [entry('Roman Catholicism', 60), entry('Local Beliefs', 25), entry('Ancestor Worship', 10), entry('Protestantism', 5)];
    default:
      return [entry('Local Beliefs', 100)];
  }
}
