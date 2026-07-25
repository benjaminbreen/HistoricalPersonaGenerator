import type { HistoricalContext } from '../types/historicalContext';

interface ProfessionAvailabilityRule {
  pattern: RegExp;
  startYear?: number;
  endYear?: number;
  requiredTechnology?: string;
  requiredInstitution?: string;
}

const PROFESSION_AVAILABILITY_RULES: ProfessionAvailabilityRule[] = [
  // Deep prehistory. Most of the profession tables assume settled agriculture
  // and craft specialisation, neither of which existed for the overwhelming
  // majority of the human past — the first pass at reaching back before the
  // Neolithic produced weavers in 28,000 BCE and rice farmers in the
  // Palaeolithic. Dates are conservative earliest-evidence estimates.
  { pattern: /\b(?:farmer|farmhand|farm worker|field hand|agricultur\w*|peasant|cultivator|planter|harvester|ploughman|plowman|orchardist|gardener)\b/i, startYear: -10000 },
  { pattern: /\b(?:herder|shepherd|cowherd|goatherd|swineherd|pastoralist|drover|dairy\w*)\b/i, startYear: -9000 },
  { pattern: /\b(?:weaver|spinner|dyer|tailor|seamstress|clothier|fuller)\b/i, startYear: -6000 },
  { pattern: /\b(?:potter|kiln\w*)\b/i, startYear: -16000 },
  { pattern: /\b(?:smith|blacksmith|metalworker|founder|jeweler|jeweller|goldsmith|silversmith)\b/i, startYear: -4500 },
  { pattern: /\b(?:scribe|clerk|accountant|archivist|librarian)\b/i, startYear: -3300 },
  { pattern: /\b(?:baker|miller|brewer|maltster)\b/i, startYear: -8000 },
  { pattern: /\b(?:merchant|trader|shopkeeper|innkeeper|moneylender|banker)\b/i, startYear: -6000 },
  { pattern: /\b(?:sailor|shipwright|ferryman|navigator)\b/i, startYear: -6000 },
  { pattern: /\b(?:mason|carpenter|builder|architect|bricklayer)\b/i, startYear: -9000 },
  { pattern: /\b(?:soldier|guard|mercenary|officer|knight)\b/i, startYear: -5000 },
  { pattern: /\b(?:servant|maid|butler|steward|houseboy)\b/i, startYear: -8000 },

  { pattern: /\bfactory worker\b/i, startYear: 1760, requiredTechnology: 'mechanized_production' },
  { pattern: /\bindustrialist\b/i, startYear: 1760, requiredTechnology: 'mechanized_production' },
  { pattern: /\brail(?:road|way)|station master\b/i, startYear: 1830, requiredTechnology: 'railway' },
  { pattern: /\btelegraph/i, startYear: 1840, requiredTechnology: 'telegraph' },
  { pattern: /\btelephone operator\b/i, startYear: 1878, requiredTechnology: 'telephone' },
  { pattern: /\bautomobile|auto mechanic\b/i, startYear: 1885, requiredTechnology: 'automobile' },
  { pattern: /\btruck driver\b/i, startYear: 1900, requiredTechnology: 'motor_transport' },
  { pattern: /\bgas station attendant\b/i, startYear: 1905, requiredTechnology: 'motor_transport' },
  { pattern: /\bradio (?:operator|announcer|engineer)\b/i, startYear: 1920, requiredTechnology: 'broadcast_radio' },
  { pattern: /\btelevision\b/i, startYear: 1930, requiredTechnology: 'television' },
  { pattern: /\bcomputer|software|programmer\b/i, startYear: 1940, requiredTechnology: 'electronic_computing' },
  { pattern: /\bparty secretary\b/i, startYear: 1900 },
  { pattern: /\boffice manager\b/i, startYear: 1850 },
  { pattern: /\buniversity professor\b/i, startYear: 1080 },
  { pattern: /\bluddite\b/i, startYear: 1811, endYear: 1817 },
  { pattern: /\bchartist\b/i, startYear: 1838, endYear: 1857 },
  { pattern: /\bresurrectionist\b/i, startYear: 1790, endYear: 1832 },
  { pattern: /\bfenian\b/i, startYear: 1858, endYear: 1924 },
];

export function isProfessionHistoricallyAvailable(
  profession: string,
  context: HistoricalContext,
): boolean {
  if (
    context.localeType === 'city' &&
    /\b(?:farmer|farmhand|shepherd|herder|cowherd|goatherd|field hand|agricultural laborer|nomad)\b/i.test(profession)
  ) {
    return false;
  }
  if (
    context.localeType === 'rural' &&
    /\b(?:telephone operator|telegraph operator|office manager|gas station attendant|factory worker|assembly line|railway|railroad|university professor|bank president|radio broadcaster)\b/i.test(profession)
  ) {
    return false;
  }
  return PROFESSION_AVAILABILITY_RULES
    .filter(rule => rule.pattern.test(profession))
    .every(rule => {
      if (rule.startYear !== undefined && context.year < rule.startYear) return false;
      if (rule.endYear !== undefined && context.year > rule.endYear) return false;
      if (rule.requiredTechnology && !context.technologies.includes(rule.requiredTechnology)) return false;
      if (rule.requiredInstitution && !context.institutions.includes(rule.requiredInstitution)) return false;
      return true;
    });
}

/** Work that directly produces food: farming, herding, fishing, foraging. */
const FOOD_PRODUCING =
  /\b(?:farmer|farmhand|farm worker|field hand|agricultur\w*|peasant|cultivator|planter|harvester|ploughman|plowman|orchardist|vintner|gardener|herder|shepherd|cowherd|goatherd|swineherd|pastoralist|drover|reindeer\w*|yak\w*|cattle\w*|fisher\w*|whaler|sealer|forager|gatherer|hunter|trapper|beekeeper|rice farmer|cash crop farmer)\b/i;

/**
 * How much of the workforce produced food, by year.
 *
 * Until the industrial transition the overwhelming majority of every society
 * farmed, herded, fished or foraged — roughly 85-90% before 1500, still around
 * 80% in 1750, and falling steeply after that. Getting this wrong is the single
 * most distorting thing a historical generator can do: at the previous ~30% the
 * past reads as a market town full of artisans and merchants rather than as the
 * countryside almost everyone actually lived in.
 *
 * See docs/DEMOGRAPHY.md §5.
 */
function subsistenceShare(year: number): number {
  if (year < 1500) return 0.88;
  if (year < 1750) return 0.82;
  if (year < 1850) return 0.68;
  if (year < 1900) return 0.55;
  if (year < 1950) return 0.45;
  return 0.28;
}

/**
 * The multiplier needed to pull food-producing work up to its historical share.
 * Derived from the target odds rather than hand-tuned, so adjusting
 * `subsistenceShare` is enough to move the distribution.
 */
function subsistenceBoost(year: number): number {
  const share = subsistenceShare(year);
  // Odds of food-producing work relative to everything else, against the
  // roughly one-in-three the unweighted profession tables produce on their own.
  const targetOdds = share / (1 - share);
  const baselineOdds = 0.33 / 0.67;
  return Math.max(1, targetOdds / baselineOdds);
}

/**
 * Before industrialisation the overwhelming majority of people lived rurally,
 * so an unclassified locale in a pre-industrial year should be treated as
 * countryside rather than as "no information". Half of all generated personas
 * were landing on `unknown` and therefore receiving no locale weighting at all.
 */
function effectiveLocale(context?: HistoricalContext): HistoricalContext['localeType'] {
  if (!context) return 'unknown';
  if (context.localeType !== 'unknown') return context.localeType;
  return context.year < 1800 ? 'rural' : 'unknown';
}

export function getProfessionSelectionWeight(
  profession: string,
  context?: HistoricalContext,
): number {
  let weight = 1;

  if (/\b(?:maharaja|nawab|emperor|empress|king|queen|duke|duchess|prince|princess|oil baron|bank president)\b/i.test(profession)) {
    weight = 0.02;
  } else if (/\b(?:industrialist|factory owner|railway investor|ceo)\b/i.test(profession)) {
    weight = 0.2;
  } else if (/\b(?:fenian|chartist|luddite|anarchist|revolutionary|resurrectionist|beggar|cutpurse|footpad|peaky blinder|gang member|executioner)\b/i.test(profession)) {
    weight = 0.04;
  } else if (/\b(?:farmer|farm worker|laborer|servant|worker|weaver|fisher|herder|carrier|porter|caretaker|mother|child watcher)\b/i.test(profession)) {
    weight = 3;
  } else if (/\b(?:merchant|artisan|baker|carpenter|smith|potter|teacher|clerk|shopkeeper|innkeeper)\b/i.test(profession)) {
    weight = 1.5;
  }

  // The historical share of food-producing work, applied before the locale
  // adjustment so that a rural pre-industrial persona is overwhelmingly likely
  // to be working the land — which is what the sources describe.
  if (context && FOOD_PRODUCING.test(profession)) {
    weight *= subsistenceBoost(context.year);
  }

  const locale = effectiveLocale(context);

  // Locale changes likelihood rather than acting as a universal prohibition.
  // A rural person can become a judge or engineer, for example, but the local
  // livelihood distribution should still be dominated by agriculture, craft,
  // transport, and household labor.
  if (locale === 'rural') {
    if (/\b(?:farm|farmer|farmhand|field hand|agricultural|herder|shepherd|cowherd|goatherd|fisher|weaver|potter|smith|carpenter|artisan|washer|dhobi|carrier|porter)\b/i.test(profession)) {
      weight *= 3;
    } else if (/\b(?:airline pilot|civil engineer|judge|surgeon|librarian|journalist|secretary|accountant|politician|professor|bank president)\b/i.test(profession)) {
      weight *= 0.2;
    }
  } else if (locale === 'city') {
    if (/\b(?:factory|dock|porter|servant|clerk|shop|street|construction|railway|telegraph|teacher)\b/i.test(profession)) {
      weight *= 1.4;
    }
  }

  return weight;
}
