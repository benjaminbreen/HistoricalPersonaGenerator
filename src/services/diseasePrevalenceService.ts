/**
 * services/diseasePrevalenceService.ts
 *
 * How likely a persona is to be carrying a given condition at the moment we
 * meet them.
 *
 * The generator already gave about a third of personas *something*, which is
 * defensible. What it got wrong was which something: the disease was drawn
 * uniformly from every condition available in that era and region, so anthrax
 * came out as the second most common human ailment, rabies ran at nearly two
 * percent, and bubonic plague appeared at a flat rate in every century whether
 * or not there was an outbreak. Meanwhile intestinal worms — which infected
 * most of the population in most pre-modern societies — turned up less often
 * than dislocated shoulders.
 *
 * The correction rests on one idea from epidemiology:
 *
 *     point prevalence  ≈  incidence  ×  duration
 *
 * A condition you are unlikely to catch and which kills you in ten days is
 * almost never what you see when you stop a random person in the street. A
 * condition that is mildly unpleasant and lasts for years is what you see
 * constantly. Sampling uniformly ignores both terms.
 *
 * See docs/DEMOGRAPHY.md §6.
 */

import type { Disease } from '../types/diseaseTypes';

/**
 * Relative incidence, by what the condition actually is.
 *
 * These are order-of-magnitude judgements, not measurements — the point is that
 * they span four orders of magnitude, where uniform sampling spans none.
 */
const INCIDENCE_PATTERNS: Array<[RegExp, number]> = [
  // Endemic parasites. Helminth infection ran at 50-90% in many pre-modern
  // populations and is the single most common thing a human body was carrying.
  [/worm|helminth|ascaris|hookworm|schistosom|fluke|tapeworm|lice|scabies|ringworm/i, 10],
  // Everyday minor injury, and the aches of hard physical work.
  [/cut|scrape|bruise|sprain|strain|torn muscle|bump|blister|burn|splinter|dislocat/i, 30],
  // Ubiquitous mild infection.
  [/cold|catarrh|cough|sore throat|conjunctivitis|stye/i, 40],
  // Teeth and eyes: near-universal sources of chronic misery before dentistry.
  [/tooth|dental|caries|abscess|gum|cataract|trachoma|blind/i, 8],
  // Endemic and water- or food-borne, common but not universal.
  [/diarrh|dysentery|giardia|gastroenteritis|food poisoning|malnutrition|rickets|scurvy|anaemia|anemia|goitre|goiter/i, 14],
  [/malaria|ague|marsh fever/i, 18],
  [/influenza|flu\b|fever\b|bronchitis|pneumonia/i, 8],
  [/tuberculosis|consumption|phthisis/i, 5],
  [/typhoid|typhus|cholera(?! epidemic)/i, 2.5],
  [/syphilis|gonorrh|pox\b(?!.*small)/i, 1.0],
  // Rare zoonoses. Real, historically attested, and *rare* — these were the
  // conditions most over-represented by uniform sampling.
  [/anthrax|brucell|tularemia|rabies|glanders|leptospir|plague of|hydatid|trichinos/i, 0.15],
  // Epidemic killers. Their prevalence between outbreaks is close to zero; the
  // epidemic multiplier below is what makes them matter when they matter.
  [/plague|smallpox|measles|diphtheria|scarlet fever|yellow fever|typhus epidemic/i, 0.3],
  [/leprosy|elephantiasis/i, 0.08],
  // Chronic vector-borne conditions confined to particular regions. The disease
  // tables already gate these geographically; the weight keeps them from
  // dominating simply by lasting decades.
  [/chagas|trypanosom|sleeping sickness|filaria|leishman/i, 0.4],
];

function baseIncidence(disease: Disease): number {
  for (const [pattern, weight] of INCIDENCE_PATTERNS) {
    if (pattern.test(disease.name)) return weight;
  }
  // Unrecognised: treat as uncommon rather than as common, so anything new in
  // the tables has to be classified deliberately to become frequent.
  return 3;
}

const EPIDEMIC_PRONE = /plague|smallpox|cholera|measles|typhus|yellow fever|influenza|diphtheria/i;

/**
 * Weight for drawing this condition as the one a persona currently has.
 *
 * Duration is capped at roughly a decade: beyond that a condition is
 * effectively permanent and the linear relationship stops being informative.
 */
export function prevalenceWeight(
  disease: Disease,
  options: { inEpidemic?: boolean } = {}
): number {
  const incidence = baseIncidence(disease);

  // Longer-lasting conditions are far more likely to be the one you are
  // carrying right now, which is why chronic complaints dominate real life.
  //
  // The factor is capped. Left unbounded, a condition lasting a decade outweighs
  // a week-long one by two orders of magnitude and buries everything else —
  // the first attempt at this pushed the common cold, which most people catch
  // more than once a year, down to a third of a percent.
  const duration = Math.min(disease.durationDays ?? 14, 3650);
  const durationFactor = Math.max(0.4, Math.min(duration / 21, 15));

  // Something that kills quickly is rarely what you happen to be carrying when
  // someone meets you.
  const lethalityFactor = 1 / (1 + (disease.mortalityRate ?? 0) * 4);

  let weight = incidence * durationFactor * lethalityFactor;

  // Between outbreaks an epidemic disease is close to absent; during one it is
  // the thing everybody has. A flat rate across every century is the one
  // reading that is wrong in both directions.
  if (EPIDEMIC_PRONE.test(disease.name)) {
    weight *= options.inEpidemic ? 40 : 0.15;
  }

  return Math.max(0.001, weight);
}

/** Draw a condition weighted by how often it would actually be encountered. */
export function pickByPrevalence(
  diseases: Disease[],
  random: () => number,
  options: { inEpidemic?: boolean } = {}
): Disease | null {
  if (diseases.length === 0) return null;
  const weights = diseases.map(d => prevalenceWeight(d, options));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < diseases.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return diseases[i];
  }
  return diseases[diseases.length - 1];
}

/**
 * How likely a persona is to be carrying anything at all.
 *
 * Higher before modern sanitation, antibiotics and dentistry, and lower after.
 * The previous flat 33% applied the same rate to a Neolithic forager and a
 * twentieth-century office worker.
 */
export function illnessRate(year: number): number {
  if (year < 1750) return 0.42;
  if (year < 1900) return 0.36;
  if (year < 1950) return 0.26;
  return 0.18;
}
