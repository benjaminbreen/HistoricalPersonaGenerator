/**
 * services/languageAttributionService.ts
 *
 * Gives every persona a language.
 *
 * Resolution order:
 *   1. The attested `LANGUAGES` table, *if* the match satisfies its own
 *      declared `period` and `culturalZones`. The table already carried those
 *      constraints and nothing enforced them, which is how a Rapa Nui islander
 *      came to speak Malagasy and a Rwandan farmer to speak Scots.
 *   2. A deep-time attribution window matching place and year.
 *   3. The zone backstop, which exists for every zone across the whole range,
 *      so this function cannot return nothing.
 *
 * The draw is deterministic in the persona seed: the same persona always gets
 * the same language and the same citation list.
 */

import type { CulturalZone } from '../types/characterData';
import { LANGUAGES, LanguageData, getLanguageForCharacter } from '../constants/gameData/languages';
import {
  ORDERED_WINDOWS,
  type AttributionWindow,
  type LanguageConfidence,
  type LanguageHypothesis,
} from '../constants/gameData/languageDeepTime';
import { getSources, type ScholarlySource } from '../constants/gameData/scholarlySources';

export interface LanguageAttributionInput {
  culturalZone: CulturalZone;
  year: number;
  region?: string;
  location?: string;
  characterName?: string;
  profession?: string;
  seed?: number;
}

export interface LanguageAttribution {
  /** What the card displays. */
  label: string;
  family: string;
  confidence: LanguageConfidence;
  /** Present when the attested table supplied the answer. */
  languageData?: LanguageData;
  /** Everything that was weighed, chosen first, with probabilities. */
  hypotheses: LanguageHypothesis[];
  /** Which window produced this, or 'attested-table'. */
  basis: string;
  sources: ScholarlySource[];
  note?: string;
}

const CONFIDENCE_BLURB: Record<LanguageConfidence, string> = {
  attested: 'Attested. Written records of this language exist from this region and period.',
  reconstructed: 'Reconstructed. No records survive from here; the language is recovered by systematically comparing its descendants.',
  inferred: 'Inferred. The family is known to have been here; which of its languages this person spoke is an inference from distribution.',
  conjectural: 'Conjectural. The grouping itself is a live scholarly question, and the label below is a best guess rather than a settled result.',
};

export function confidenceBlurb(confidence: LanguageConfidence): string {
  return CONFIDENCE_BLURB[confidence];
}

/** Deterministic 0..1 from a string plus a numeric seed. */
function hashUnit(text: string, seed: number): number {
  let hash = 2166136261 ^ (seed >>> 0);
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 100000) / 100000;
}

/**
 * Does an attested entry actually belong here? The table declares both
 * constraints; this is the check that was missing.
 */
const normalizePlace = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * The geography and the language table name the same places differently — the
 * app's regions are things like "British Isles" and "Levant", the language
 * table says "England" and "Judea". These are the bridges.
 */
const REGION_ALIASES: Array<[RegExp, string[]]> = [
  [/british isles|england|scotland|wales|ireland/, ['england', 'britain', 'britannia', 'scotland', 'wales', 'ireland', 'united kingdom']],
  [/germanic lands|central europe/, ['germany', 'germania', 'austria', 'bohemia', 'switzerland', 'holy roman']],
  [/low countries/, ['netherlands', 'flanders', 'holland', 'belgium']],
  [/iberian peninsula/, ['spain', 'portugal', 'hispania', 'castile', 'catalonia', 'andalusia']],
  [/greece and aegean/, ['greece', 'aegean', 'attica', 'cyprus', 'crete']],
  [/scandinavia/, ['norway', 'sweden', 'denmark', 'iceland', 'finland']],
  [/eastern europe|balkans/, ['russia', 'poland', 'ukraine', 'hungary', 'serbia', 'romania', 'bulgaria']],
  [/levant|eastern desert|red sea/, ['syria', 'palestine', 'judea', 'lebanon', 'israel', 'canaan', 'egypt']],
  [/persian plateau/, ['persia', 'iran', 'parthia', 'media']],
  [/anatolia/, ['anatolia', 'asia minor', 'turkey', 'phrygia', 'lydia']],
  [/north china|yellow river|south china|yangtze/, ['china', 'zhongyuan', 'jiangnan', 'sichuan']],
  [/indus valley|thar/, ['punjab', 'sindh', 'pakistan', 'india', 'gujarat']],
  [/ganges|deccan|bengal/, ['india', 'bengal', 'bihar', 'tamil', 'deccan']],
  [/west african|lower guinea|congo basin|sahel/, ['nigeria', 'ghana', 'congo', 'cameroon', 'mali', 'niger', 'west africa']],
  [/east african|great lakes of africa|swahili/, ['kenya', 'tanzania', 'uganda', 'east africa', 'zanzibar']],
  [/atlantic coast|northeast woodlands|great lakes/, ['new england', 'virginia', 'canada', 'eastern woodlands', 'united states']],
  [/andes|altiplano/, ['peru', 'bolivia', 'ecuador', 'cusco', 'andes']],
  [/mexico|central highlands/, ['mexico', 'yucatan', 'oaxaca', 'mesoamerica', 'guatemala']],
];

function placeVocabulary(region?: string, location?: string): string {
  const base = normalizePlace(`${region ?? ''} ${location ?? ''}`);
  const extra = REGION_ALIASES
    .filter(([pattern]) => pattern.test(base))
    .flatMap(([, aliases]) => aliases);
  return [base, ...extra].join(' ');
}

/**
 * Loose region affinity against the table's own `regions` field. Used as a
 * preference, not a gate: `getLanguageForCharacter` will happily return Italian
 * for a London persona because both are European, and this is how a better
 * candidate gets found without dropping an attested period into guesswork.
 */
export function regionAffinity(lang: LanguageData, region?: string, location?: string): boolean {
  if (!Array.isArray(lang.regions) || lang.regions.length === 0) return false;
  const place = placeVocabulary(region, location);
  if (!place.trim()) return false;
  return lang.regions.some(declared => {
    const d = normalizePlace(declared);
    if (d.length < 4) return false;
    return place.includes(d) || d.includes(place);
  });
}

/** The best same-zone, in-period entry whose declared regions include this place. */
function findAttestedByRegion(
  zone: CulturalZone,
  year: number,
  region?: string,
  location?: string,
): LanguageData | undefined {
  const candidates = Object.values(LANGUAGES).filter(lang =>
    attestedEntryIsValid(lang, zone, year) && regionAffinity(lang, region, location));
  if (candidates.length === 0) return undefined;
  // Prefer a language actually spoken rather than a reconstruction, then the
  // one whose attested window is tightest around this year.
  candidates.sort((a, b) => {
    const recon = Number(!!a.isReconstructed) - Number(!!b.isReconstructed);
    if (recon !== 0) return recon;
    return (a.period[1] - a.period[0]) - (b.period[1] - b.period[0]);
  });
  return candidates[0];
}

export function attestedEntryIsValid(
  lang: LanguageData,
  zone: CulturalZone,
  year: number,
): boolean {
  if (!lang) return false;
  if (Array.isArray(lang.period) && (year < lang.period[0] || year > lang.period[1])) return false;
  if (Array.isArray(lang.culturalZones) && lang.culturalZones.length > 0
    && !lang.culturalZones.includes(zone)) return false;
  return true;
}

function matchWindow(
  input: LanguageAttributionInput,
  kind: 'place' | 'zone',
): AttributionWindow | undefined {
  const place = `${input.location ?? ''} ${input.region ?? ''}`.toLowerCase();
  return ORDERED_WINDOWS.find(w => {
    if (kind === 'place' ? !w.places : !!w.places) return false;
    if (input.year < w.yearRange[0] || input.year > w.yearRange[1]) return false;
    if (w.zones && !w.zones.includes(input.culturalZone)) return false;
    if (w.places && !w.places.test(place)) return false;
    return true;
  });
}

function fromWindow(
  window: AttributionWindow,
  key: string,
  seed: number,
): LanguageAttribution {
  const ordered = drawHypothesis(window.hypotheses, key, seed);
  const chosen = ordered[0];
  const sourceIds = Array.from(new Set(window.hypotheses.flatMap(hyp => hyp.sourceIds)));
  return {
    label: chosen.label,
    family: chosen.family,
    confidence: chosen.confidence,
    hypotheses: ordered,
    basis: window.id,
    sources: getSources(sourceIds),
    note: chosen.note,
  };
}

/** Weighted draw, deterministic in the seed, returning chosen-first ordering. */
function drawHypothesis(
  hypotheses: LanguageHypothesis[],
  key: string,
  seed: number,
): LanguageHypothesis[] {
  const total = hypotheses.reduce((sum, hyp) => sum + hyp.probability, 0);
  let roll = hashUnit(key, seed) * (total > 0 ? total : 1);
  let chosen = hypotheses[0];
  for (const hyp of hypotheses) {
    roll -= hyp.probability;
    if (roll <= 0) { chosen = hyp; break; }
  }
  return [chosen, ...hypotheses.filter(hyp => hyp !== chosen)];
}

function asAttestedAttribution(lang: LanguageData): LanguageAttribution {
  const confidence: LanguageConfidence = lang.isReconstructed ? 'reconstructed' : 'attested';
  return {
    label: lang.name,
    family: lang.family,
    confidence,
    languageData: lang,
    hypotheses: [{
      label: lang.name,
      family: lang.family,
      probability: 1,
      confidence,
      sourceIds: ['glottolog'],
    }],
    basis: 'attested-table',
    sources: getSources(['glottolog']),
    note: lang.historicalContext,
  };
}

export function attributeLanguage(input: LanguageAttributionInput): LanguageAttribution {
  const seed = input.seed ?? 0;
  const key = `${input.culturalZone}|${input.year}|${input.region ?? ''}|${input.location ?? ''}|${input.characterName ?? ''}`;

  // 1. A place-scoped window beats the attested table. These are hand-curated
  //    for a specific region and period — Rapa Nui, the pre-Greek Aegean, the
  //    Puebloan southwest — and the table is only zone-accurate, which is how
  //    Proto-Indo-European ended up on Bronze Age Crete.
  const placeWindow = matchWindow(input, 'place');
  if (placeWindow) return fromWindow(placeWindow, key, seed);

  // 2. The attested table, with its own declared constraints enforced.
  const attested = getLanguageForCharacter(
    input.culturalZone,
    input.year,
    input.region,
    input.location,
    input.characterName,
    input.profession,
  );

  if (attested && attestedEntryIsValid(attested, input.culturalZone, input.year)) {
    // Zone and period are satisfied, but the selector is only zone-accurate.
    // Prefer an entry whose declared regions actually cover this place.
    const better = regionAffinity(attested, input.region, input.location)
      ? attested
      : (findAttestedByRegion(input.culturalZone, input.year, input.region, input.location) ?? attested);
    return asAttestedAttribution(better);
  }

  // 3. and 4. Zone window, then the backstop. Every zone has a backstop across
  //    the whole range, so this cannot return nothing.
  const zoneWindow = matchWindow(input, 'zone');
  if (zoneWindow) return fromWindow(zoneWindow, key, seed);

  return {
    label: 'Unrecorded language of the region',
    family: 'unclassified',
    confidence: 'conjectural',
    hypotheses: [],
    basis: 'none',
    sources: [],
  };
}

/**
 * Adapt an attribution to the `LanguageData` shape the UI already consumes, so
 * a persona with only a hypothetical language still renders everywhere a
 * persona with an attested one does.
 */
export function attributionToLanguageData(
  attribution: LanguageAttribution,
  zone: CulturalZone,
  year: number,
): LanguageData {
  if (attribution.languageData) return attribution.languageData;

  return {
    id: `attributed-${attribution.basis}`,
    name: attribution.label,
    family: attribution.family,
    period: [year, year],
    regions: [],
    culturalZones: [zone],
    isReconstructed: attribution.confidence !== 'attested',
    description: attribution.note,
    llmPrompt: `Speak as someone whose language is not recorded. Do not invent vocabulary. Convey ${attribution.label} through rhythm, indirection and the concerns of the speaker's world rather than through supposed words of the language itself.`,
    historicalContext: attribution.note,
  };
}

/** Every language id in the attested table, for audits. */
export function attestedLanguageIds(): string[] {
  return Object.keys(LANGUAGES);
}
