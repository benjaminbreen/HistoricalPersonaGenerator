import type React from 'react';
import { FaBookOpen, FaHeartbeat } from 'react-icons/fa';
import { IoStar } from 'react-icons/io5';
import { CulturalZone, Gender, HistoricalEra, WealthLevel } from '../types';
import { LANGUAGES, LanguageData } from '../constants/gameData/languages';
import { GenerationParams } from './personaGenerator';
import { HistoricalPersonaAnnotationRecord } from '../types/personaAnnotation';
import { CharacterPersonality, PlayerCharacter } from '../types/playerCharacter';
import { Item } from '../types/itemTypes';
import { AttributeBadge } from '../types/attributeTypes';
import { FamilyMember } from '../types/npcTypes';
import { EnhancedLifeEvent, EventImportance } from '../constants/characterData/lifeHistoryService';

export type MaterialSupportTag =
  | 'explicit'
  | 'strong-inference'
  | 'weak-inference'
  | 'synthetic-fill'
  | 'uncertain';

export interface MaterialDisplayAttribute {
  name: string;
  description: string;
  fieldPath: string;
  icon: React.ComponentType<any>;
}

export interface MaterialDisplayOverrides {
  languageLabel?: string;
  languageData?: LanguageData;
  clothingDetail?: string;
  possessions: string[];
  attributes: MaterialDisplayAttribute[];
  worldviewLabel?: string;
  worldviewDescription?: string;
}

export interface PersonaMaterialAdapterResult {
  generationParams: Partial<GenerationParams>;
  displayOverrides: MaterialDisplayOverrides;
  lifeEvents: EnhancedLifeEvent[];
  adapterOverrides: Record<string, unknown>;
  provenanceForField: (fieldPath: string) => MaterialSupportTag | null;
  applyToCharacter: (character: PlayerCharacter) => PlayerCharacter;
}

const regionZoneHints: Array<{ pattern: RegExp; zone: CulturalZone }> = [
  {
    pattern: /\b(massachusetts|united states|america|american colonies|new england|virginia|new york|pennsylvania|cambridge, massachusetts)\b/i,
    zone: 'NORTH_AMERICAN_COLONIAL' as CulturalZone,
  },
  {
    pattern: /\b(british isles|england|english|warwickshire|stratford|stratford-upon-avon|london|oxford|cambridge university|cambridge, england|shakespeare|low countries|dutch republic|france|spain|italy|germany|europe)\b/i,
    zone: 'EUROPEAN' as CulturalZone,
  },
  {
    pattern: /\b(bengal|india|mughal|delhi|south asia|hindu|sanskrit|persianate)\b/i,
    zone: 'SOUTH_ASIAN' as CulturalZone,
  },
  {
    pattern: /\b(china|lower yangzi|ming|qing|japan|korea|east asia)\b/i,
    zone: 'EAST_ASIAN' as CulturalZone,
  },
  {
    pattern: /\b(ottoman|syria|egypt|levant|maghreb|arabia|middle east|north africa|mena)\b/i,
    zone: 'MENA' as CulturalZone,
  },
  {
    pattern: /\b(gold coast|akan|kongo|ethiopia|sub-saharan|west africa|east africa)\b/i,
    zone: 'SUB_SAHARAN_AFRICAN' as CulturalZone,
  },
  {
    pattern: /\b(new spain|peru|andes|brazil|south america|rio de la plata)\b/i,
    zone: 'SOUTH_AMERICAN' as CulturalZone,
  },
  {
    pattern: /\b(saint-domingue|haiti|caribbean|new france|canada)\b/i,
    zone: 'NORTH_AMERICAN_COLONIAL' as CulturalZone,
  },
  {
    pattern: /\b(oceania|polynesia|melanesia|australia|new zealand|maori)\b/i,
    zone: 'OCEANIA' as CulturalZone,
  },
];

const periodFromYear = (year: number): HistoricalEra => {
  if (year < 1450) return 'MEDIEVAL' as HistoricalEra;
  if (year < 1750) return 'RENAISSANCE_EARLY_MODERN' as HistoricalEra;
  if (year < 1900) return 'INDUSTRIAL_ERA' as HistoricalEra;
  return 'MODERN_ERA' as HistoricalEra;
};

const wealthFromRecord = (record: HistoricalPersonaAnnotationRecord): WealthLevel => {
  const security = record.persona_seed.social_position?.economic_security;
  if (security === 'elite' || security === 'wealthy') return 'wealthy' as WealthLevel;
  if (security === 'comfortable') return 'comfortable' as WealthLevel;
  if (security === 'destitute' || security === 'precarious' || security === 'subsistence') return 'poor' as WealthLevel;
  const cash = record.persona_seed.household_economy.cash_position;
  const clothing = record.persona_seed.material_life.clothing_level;
  if (cash === 'wealthy' || clothing === 'luxurious') return 'wealthy' as WealthLevel;
  if (cash === 'comfortable' || clothing === 'fine') return 'comfortable' as WealthLevel;
  if (cash === 'none' || cash === 'minimal' || clothing === 'ragged') return 'poor' as WealthLevel;
  return 'modest' as WealthLevel;
};

const socialPositionLabel = (record: HistoricalPersonaAnnotationRecord): string =>
  record.persona_seed.social_position?.local_status_detail
  || record.persona_seed.social_identity.status_detail
  || normalizeMaterialText(record.persona_seed.social_identity.status_group);

const worldviewLabelForRecord = (record: HistoricalPersonaAnnotationRecord): string => {
  const seed = record.persona_seed;
  if (seed.public_world?.scale) return displayValue(seed.public_world.scale);
  return displayValue(seed.mobility_and_horizon.political_horizon || 'Worldview');
};

const worldviewDescriptionForRecord = (record: HistoricalPersonaAnnotationRecord): string => {
  const seed = record.persona_seed;
  return [
    seed.public_world?.detail,
    seed.religious_practice?.specific_label || (seed.religious_practice?.tradition ? `Religious or ritual practice: ${displayValue(seed.religious_practice.tradition)}.` : undefined),
    seed.religious_practice?.practice_context,
    seed.normative_world?.detail || (seed.normative_world?.primary_frame ? `Normative frame: ${displayValue(seed.normative_world.primary_frame)}.` : undefined),
    seed.mobility_and_horizon.religious_or_moral_world,
  ].filter(Boolean).join(' ');
};

const genderFromRole = (genderRole: string): Gender | undefined => {
  const lower = genderRole.toLowerCase();
  if (lower.includes('woman') || lower.includes('female') || lower.includes('wife') || lower.includes('widow')) return 'Female' as Gender;
  if (lower.includes('man') || lower.includes('male') || lower.includes('husband') || lower.includes('widower')) return 'Male' as Gender;
  return undefined;
};

const ageFromBand = (band: string): number => {
  const ranges: Record<string, [number, number]> = {
    child: [8, 12],
    adolescent: [13, 17],
    young_adult: [18, 29],
    adult: [30, 44],
    middle_aged: [45, 59],
    elder: [60, 76],
  };
  const [min, max] = ranges[band] || [18, 65];
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const normalizeMaterialText = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const normalizedForMatch = (value?: string): string =>
  normalizeMaterialText(value || '').toLowerCase();

const slug = (value: string): string =>
  normalizeMaterialText(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 56) || 'material';

const titleCase = (value: string): string =>
  normalizeMaterialText(value).replace(/\b\w/g, char => char.toUpperCase());

const sourceBackgroundForRecord = (record: HistoricalPersonaAnnotationRecord): { base: string; accent: string; texture: 'subtle' | 'grain' } => {
  const basis = record.source.source_basis;
  if (basis === 'will_or_inventory' || basis === 'tax_or_census') return { base: '#A99B82', accent: '#8F836F', texture: 'grain' };
  if (basis === 'court_testimony' || basis === 'legal_code_or_regulation') return { base: '#96928A', accent: '#7E7A74', texture: 'subtle' };
  if (basis === 'ship_log_or_manifest' || basis === 'travel_account') return { base: '#839FAA', accent: '#6F8994', texture: 'subtle' };
  if (basis === 'image_or_artifact' || basis === 'material_culture') return { base: '#9A8B76', accent: '#817361', texture: 'grain' };
  if (basis === 'diary_or_letter' || basis === 'newspaper_or_periodical') return { base: '#A69A8E', accent: '#8C8177', texture: 'grain' };
  return { base: '#909DA4', accent: '#78868E', texture: 'subtle' };
};

const sourcePaletteForClothing = (clothingLevel?: string) => {
  const normalized = normalizedForMatch(clothingLevel);
  if (/bare|rag|poor|coarse|patched|homespun|plain/.test(normalized)) return { primary: '#6F6656', secondary: '#8A7A61', accent: '#A08862' };
  if (/fine|silk|embroider|velvet|fur|jewel|noble|wealth/.test(normalized)) return { primary: '#6B2E3A', secondary: '#273F5F', accent: '#B88A3B' };
  if (/uniform|livery|military|soldier|guard/.test(normalized)) return { primary: '#334653', secondary: '#5D4A35', accent: '#A9823E' };
  if (/religious|clerical|monastic|nun|priest|imam|rabbi|monk/.test(normalized)) return { primary: '#3F3A34', secondary: '#746A5A', accent: '#B7A46A' };
  return { primary: '#746B5B', secondary: '#8F8068', accent: '#A77F4F' };
};

const sourceSkinTexture = (bodyConditions: string[] = []) => {
  const text = bodyConditions.join(' ').toLowerCase();
  if (/scar|wound|pox|burn|injur/.test(text)) return 'scarred' as const;
  if (/weather|sun|labor|field|sail|mine|hardship/.test(text)) return 'weathered' as const;
  return undefined;
};

const displayValue = (value?: string): string => {
  const normalized = normalizedForMatch(value);
  const labels: Record<string, string> = {
    fine: 'fine period clothing',
    plain_working: 'plain working clothing',
    'plain working': 'plain working clothing',
    respectable: 'respectable period clothing',
    decent: 'decent practical clothing',
    luxurious: 'luxurious period clothing',
    ragged: 'worn or ragged clothing',
    ritual_or_scholarly_network: 'ritual or scholarly network',
    cultural_or_reform_network: 'cultural or reform network',
    occupational_network: 'occupational network',
    market_or_trade_network: 'market or trade network',
    household: 'household world',
    local_community: 'local community',
    honor_reputation_or_shame: 'honor, reputation, and shame',
    household_obligation: 'household obligation',
    pragmatic_survival: 'pragmatic survival',
    advanced_literary: 'advanced literary',
    full_practical: 'full practical literacy',
    basic_practical: 'basic practical literacy',
    chronic_pain: 'chronic pain',
    none_apparent: 'none apparent',
  };
  return labels[normalized] || normalizeMaterialText(value || '');
};

const materialSupportTagFromSchema = (supportLevel?: string): MaterialSupportTag => {
  switch (supportLevel) {
    case 'explicit':
      return 'explicit';
    case 'strong_inference':
      return 'strong-inference';
    case 'weak_inference':
      return 'weak-inference';
    case 'synthetic_fill':
      return 'synthetic-fill';
    case 'contradicted_or_uncertain':
      return 'uncertain';
    default:
      return 'synthetic-fill';
  }
};

const materialName = (record: HistoricalPersonaAnnotationRecord): string | undefined => {
  const identity = record.persona_seed.identity_name;
  if (!identity) return undefined;
  if (identity.full_name) return normalizeMaterialText(identity.full_name);
  const parts = [identity.given_name, identity.family_name].filter(Boolean).map(part => normalizeMaterialText(String(part)));
  return parts.length > 0 ? parts.join(' ') : undefined;
};

const createMaterialItem = (
  name: string,
  category: Item['category'],
  options: Partial<Item> = {}
): Item => ({
  id: `material-${slug(name)}-${Math.random().toString(36).slice(2, 8)}`,
  baseId: `material-${slug(name)}`,
  name: titleCase(name),
  description: options.description || `Source material item: ${normalizeMaterialText(name)}.`,
  emoji: options.emoji || (category === 'Apparel' ? 'C' : category === 'Document' ? 'D' : 'I'),
  rarity: options.rarity || 'Common',
  value: options.value ?? 1,
  weight: options.weight ?? 1,
  wearable: options.wearable ?? category === 'Apparel',
  stackable: options.stackable ?? false,
  category,
  attack: options.attack ?? 0,
  defense: options.defense,
  sustenance: options.sustenance ?? 0,
  fatigueEffect: options.fatigueEffect,
  xpEffect: options.xpEffect,
  wieldable: options.wieldable ?? false,
  throwable: options.throwable ?? false,
  craftingValue: options.craftingValue ?? 0,
  equipmentSlot: options.equipmentSlot,
  material: options.material,
  damage: options.damage,
  statusEffect: options.statusEffect,
  eraAvailability: options.eraAvailability,
  culturalAvailability: options.culturalAvailability,
  quantity: options.quantity ?? 1,
  quality: options.quality,
  color: options.color,
  condition: options.condition ?? 80,
  culturalStyle: options.culturalStyle,
  crafterName: options.crafterName,
  age: options.age,
  enchantments: options.enchantments,
});

const displayAttributeToBadge = (attribute: MaterialDisplayAttribute): AttributeBadge => ({
  id: `source-${slug(attribute.fieldPath)}-${slug(attribute.name)}`,
  name: titleCase(attribute.name),
  icon: attribute.icon === FaBookOpen ? 'FaBookOpen' : attribute.icon === FaHeartbeat ? 'FaHeartbeat' : 'IoStar',
  rarity: 'common',
  description: attribute.description,
  category: attribute.fieldPath.includes('body_conditions')
    ? 'physical'
    : attribute.fieldPath.includes('literacy')
      ? 'skill'
      : 'mental',
  dialogueHint: attribute.description,
});

const knownFamilyBySubject: Array<{
  pattern: RegExp;
  family: Array<FamilyMember & { sourceSupport?: MaterialSupportTag; sourceNote?: string }>;
}> = [
  {
    pattern: /margaret cavendish/i,
    family: [
      { relation: 'father', name: 'Thomas Lucas', profession: 'Royalist landowner', birthYear: 1573, deathYear: 1625, isDeceased: true, sourceSupport: 'explicit', sourceNote: 'Known parent of Margaret Cavendish.' },
      { relation: 'mother', name: 'Elizabeth Leighton Lucas', profession: 'Gentlewoman', birthYear: 1580, deathYear: 1647, isDeceased: true, sourceSupport: 'explicit', sourceNote: 'Known parent of Margaret Cavendish.' },
      { relation: 'spouse', name: 'William Cavendish', profession: 'Duke of Newcastle', birthYear: 1593, deathYear: 1676, isDeceased: false, sourceSupport: 'explicit', sourceNote: 'Known spouse of Margaret Cavendish.' },
    ],
  },
  {
    pattern: /william james/i,
    family: [
      { relation: 'father', name: 'Henry James Sr.', profession: 'Theologian', birthYear: 1811, deathYear: 1882, isDeceased: true, sourceSupport: 'explicit', sourceNote: 'Known parent of William James.' },
      { relation: 'mother', name: 'Mary Walsh James', profession: 'Household manager', birthYear: 1810, deathYear: 1882, isDeceased: true, sourceSupport: 'explicit', sourceNote: 'Known parent of William James.' },
      { relation: 'spouse', name: 'Alice Gibbens James', profession: 'Household manager', birthYear: 1849, deathYear: 1922, isDeceased: false, sourceSupport: 'explicit', sourceNote: 'Known spouse of William James.' },
    ],
  },
  {
    pattern: /william shakespeare/i,
    family: [
      { relation: 'father', name: 'John Shakespeare', profession: 'Glover and alderman', birthYear: 1531, deathYear: 1601, isDeceased: false, sourceSupport: 'explicit', sourceNote: 'Known parent of William Shakespeare.' },
      { relation: 'mother', name: 'Mary Arden', profession: 'Gentlewoman', birthYear: 1537, deathYear: 1608, isDeceased: false, sourceSupport: 'explicit', sourceNote: 'Known parent of William Shakespeare.' },
      { relation: 'spouse', name: 'Anne Hathaway', profession: 'Household manager', birthYear: 1556, deathYear: 1623, isDeceased: false, sourceSupport: 'explicit', sourceNote: 'Known spouse of William Shakespeare.' },
    ],
  },
];

const sourceFamilyForRecord = (
  record: HistoricalPersonaAnnotationRecord,
  character: PlayerCharacter
): Array<FamilyMember & { sourceSupport?: MaterialSupportTag; sourceNote?: string }> => {
  const seed = record.persona_seed;
  if (seed.family?.members && seed.family.members.length > 0) {
    return seed.family.members.map(member => ({
      relation: member.relation,
      name: member.name,
      profession: member.profession,
      birthYear: member.birth_year,
      deathYear: member.death_year,
      isDeceased: member.is_deceased,
      sourceSupport: materialSupportTagFromSchema(member.support_level),
      sourceNote: member.notes,
    }));
  }

  const context = `${record.source.title} ${record.source.citation_label} ${seed.summary || ''}`;
  const known = knownFamilyBySubject.find(item => item.pattern.test(context));
  if (known) return known.family;

  const birthYear = Number(character.birthYear) || ((seed.temporal.specific_year || seed.temporal.decade || 1800) - character.age);
  const status = normalizeMaterialText(socialPositionLabel(record) || 'household');
  const sourceNote = 'Plausible family placeholder because persona_seed.family.members did not supply explicit family fields.';

  return [
    {
      relation: 'father',
      name: `Plausible father of ${character.name.split(' ')[0]}`,
      profession: status.includes('elite') || status.includes('gentry') ? 'Household patriarch' : 'Household worker',
      birthYear: birthYear - 30,
      sourceSupport: 'synthetic-fill',
      sourceNote,
    },
    {
      relation: 'mother',
      name: `Plausible mother of ${character.name.split(' ')[0]}`,
      profession: status.includes('elite') || status.includes('gentry') ? 'Gentlewoman' : 'Household manager',
      birthYear: birthYear - 27,
      sourceSupport: 'synthetic-fill',
      sourceNote,
    },
  ];
};

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const personalityFromRecord = (record: HistoricalPersonaAnnotationRecord): CharacterPersonality => {
  const traits = record.persona_seed.temperament_and_voice.personality_traits;
  if (traits) {
    return {
      openness: clamp01(traits.openness),
      conscientiousness: clamp01(traits.conscientiousness),
      extraversion: clamp01(traits.extraversion),
      agreeableness: clamp01(traits.agreeableness),
      neuroticism: clamp01(traits.neuroticism),
    };
  }

  const temperament = record.persona_seed.temperament_and_voice.dominant_temperament;
  const speech = record.persona_seed.temperament_and_voice.abstraction_level;
  const conflict = record.persona_seed.temperament_and_voice.how_they_handle_conflict;
  const stranger = record.persona_seed.temperament_and_voice.how_they_react_to_strangers;
  const interaction = record.persona_seed.interaction_style;

  return {
    openness: speech === 'fairly_abstract' || speech === 'mixed' ? 0.68 : 0.42,
    conscientiousness: temperament === 'dutiful' || conflict === 'stubborn' ? 0.74 : 0.55,
    extraversion: interaction?.with_peers === 'gregarious' || stranger === 'warm' || stranger === 'curious' ? 0.68 : interaction?.with_peers === 'isolated' || stranger === 'suspicious' || stranger === 'deferential' ? 0.34 : 0.5,
    agreeableness: interaction?.with_peers === 'cooperative' || conflict === 'conciliatory' ? 0.72 : interaction?.with_peers === 'competitive' || conflict === 'explosive' || temperament === 'irritable' ? 0.28 : 0.52,
    neuroticism: interaction?.under_stress === 'withdrawn' || interaction?.under_stress === 'angry' || temperament === 'anxious' || temperament === 'melancholy' || temperament === 'volatile' ? 0.76 : temperament === 'hopeful' || temperament === 'patient' ? 0.34 : 0.5,
  };
};

const sourceLifeEventsForRecord = (
  record: HistoricalPersonaAnnotationRecord,
  character: PlayerCharacter
): EnhancedLifeEvent[] => {
  const seed = record.persona_seed;
  const currentYear = seed.temporal.specific_year || seed.temporal.decade || 1800;
  const birthYear = Number(character.birthYear) || currentYear - character.age;
  const events: EnhancedLifeEvent[] = [
    {
      year: birthYear,
      kind: 'birth',
      importance: EventImportance.MILESTONE,
      title: 'Birth and Household Origins',
      text: `Born into ${socialPositionLabel(record)} circumstances in ${seed.place.settlement_or_locality || seed.place.region}.`,
      culturalContext: record.source.citation_label,
      sourceSupport: 'synthetic-fill',
      sourceNote: 'Adapter synthesis from social identity and place fields.',
    },
  ] as Array<EnhancedLifeEvent & { sourceSupport?: MaterialSupportTag; sourceNote?: string }>;

  if (seed.work.primary_occupation) {
    events.push({
      year: Math.min(currentYear, birthYear + Math.max(12, Math.floor(character.age * 0.45))),
      kind: seed.work.skill_level === 'scholarly' || seed.work.skill_level === 'clerical' ? 'education' : 'trade',
      importance: EventImportance.MILESTONE,
      title: 'Work Took Shape',
      text: `Became established in ${seed.work.primary_occupation}, with work centered on ${normalizeMaterialText(seed.work.workplace)} and a ${normalizeMaterialText(seed.work.work_rhythm)} rhythm.`,
      culturalContext: seed.work.work_notes || record.evidence.basis_summary,
      sourceSupport: 'synthetic-fill',
      sourceNote: 'Adapter synthesis from work fields.',
    });
  }

  (seed.place.historical_pressures || []).slice(0, 2).forEach((pressure, index) => {
    if (pressure === 'none_apparent') return;
    events.push({
      year: Math.max(birthYear + 8, currentYear - (2 - index)),
      kind: pressure.includes('war') ? 'political' : pressure.includes('disease') ? 'plague' : pressure.includes('migration') ? 'journey' : 'family',
      importance: pressure.includes('war') || pressure.includes('disease') || pressure.includes('crisis') ? EventImportance.TRAGEDY : EventImportance.OPPORTUNITY,
      title: titleCase(pressure),
      text: `The household lived under the pressure of ${normalizeMaterialText(pressure)}, shaping daily choices and expectations.`,
      culturalContext: 'Source material historical pressure.',
      sourceSupport: 'explicit',
      sourceNote: 'Derived from persona_seed.place.historical_pressures.',
    });
  });

  events.push({
    year: currentYear,
    kind: 'achievement',
    importance: EventImportance.MILESTONE,
    title: 'Source-Grounded Moment',
    text: seed.summary || `The source record places this persona in ${seed.place.region}, connected to ${record.source.title}.`,
    culturalContext: `Evidence confidence: ${record.evidence.confidence}.`,
    sourceSupport: 'explicit',
    sourceNote: 'Summary moment from the material record.',
  });

  return events.sort((a, b) => a.year - b.year);
};

export const findLanguageDataForMaterial = (languageName?: string): LanguageData | undefined => {
  if (!languageName) return undefined;
  const normalized = normalizedForMatch(languageName);
  if (!normalized || normalized === 'unknown' || normalized === 'local vernacular') return undefined;

  if (normalized === 'english' || normalized === 'modern english') {
    return LANGUAGES.MODERN_ENGLISH || Object.values(LANGUAGES).find(language => language.id === 'MODERN_ENGLISH');
  }

  const candidates = Object.values(LANGUAGES).map(language => {
    const candidateValues = [
      language.id,
      language.name,
      language.nativeName,
      ...language.regions,
    ].filter(Boolean).map(value => normalizedForMatch(String(value)));
    const exactScore = candidateValues.includes(normalized) ? 3 : 0;
    const nameScore = normalizedForMatch(language.name) === normalized || normalizedForMatch(language.nativeName) === normalized ? 4 : 0;
    const partialScore = candidateValues.some(candidate => candidate.includes(normalized) || normalized.includes(candidate)) ? 1 : 0;
    const modernityScore = language.id === 'MODERN_ENGLISH' ? 1 : 0;
    return { language, score: Math.max(exactScore, nameScore, partialScore) + modernityScore };
  }).filter(candidate => candidate.score > 0);

  return candidates.sort((a, b) => b.score - a.score)[0]?.language;
};

const inferCulturalZone = (record: HistoricalPersonaAnnotationRecord): CulturalZone | undefined => {
  const seed = record.persona_seed;
  const context = [
    seed.place.region,
    seed.place.polity,
    seed.place.settlement_or_locality,
    seed.place.place_notes,
    seed.social_identity.religious_or_communal_identity,
    seed.social_identity.languages?.join(' '),
    seed.work.workplace,
    record.source.title,
    record.source.citation_label,
    record.source.document_genre,
    record.evidence.basis_summary,
  ].filter(Boolean).join(' ');

  return regionZoneHints.find(hint => hint.pattern.test(context))?.zone;
};

export function adaptPersonaMaterialRecord(
  record: HistoricalPersonaAnnotationRecord,
  options: { useSourceTitleAsName?: boolean } = {}
): PersonaMaterialAdapterResult {
  const seed = record.persona_seed;
  const year = seed.temporal.specific_year || seed.temporal.decade || 1800;
  const age = seed.social_identity.estimated_age || ageFromBand(seed.social_identity.age_band);
  const sourceLanguageLabel = seed.social_identity.languages?.[0] || record.source.language;
  const sourceLanguageData = findLanguageDataForMaterial(sourceLanguageLabel);
  const culturalZone = inferCulturalZone(record) || sourceLanguageData?.culturalZones?.[0];
  const name = materialName(record) || (
    options.useSourceTitleAsName && record.source.source_basis === 'wikipedia_or_reference'
      ? record.source.title.replace(/\s*\([^)]*\)\s*$/, '')
      : undefined
  );
  const provenanceForField = (fieldPath: string): MaterialSupportTag | null => {
    const evidence = record.field_evidence?.find(item =>
      item.field_path === fieldPath ||
      fieldPath.startsWith(`${item.field_path}/`) ||
      item.field_path.startsWith(`${fieldPath}/`)
    );
    if (!evidence) {
      if (fieldPath === '/persona_seed/identity_name' && seed.identity_name?.support_level) {
        return materialSupportTagFromSchema(seed.identity_name.support_level);
      }
      const isModelRecord = record.annotation.annotator_type === 'model' || record.annotation.annotator_type === 'human_reviewed_model';
      if (!isModelRecord) return null;
      if (record.evidence.confidence === 'high') return 'strong-inference';
      if (record.evidence.confidence === 'medium') return 'weak-inference';
      return 'synthetic-fill';
    }
    return materialSupportTagFromSchema(evidence.support_level);
  };

  const displayOverrides: MaterialDisplayOverrides = {
    languageLabel: sourceLanguageLabel,
    languageData: sourceLanguageData,
    clothingDetail: seed.material_life.clothing_detail || displayValue(seed.material_life.clothing_level),
    possessions: seed.material_life.possessions || [],
    attributes: [
      seed.temperament_and_voice.dominant_temperament && {
        name: seed.interaction_style?.under_stress
          ? displayValue(seed.interaction_style.under_stress)
          : displayValue(seed.temperament_and_voice.dominant_temperament),
        description: seed.interaction_style
          ? `Interaction style: ${displayValue(seed.interaction_style.with_authorities || 'uncertain')} with authorities; ${displayValue(seed.interaction_style.with_peers || 'uncertain')} with peers; ${displayValue(seed.interaction_style.under_stress || 'uncertain')} under stress.`
          : `Temperament: ${displayValue(seed.temperament_and_voice.how_they_handle_conflict)} in conflict; ${displayValue(seed.temperament_and_voice.how_they_react_to_strangers)} with strangers.`,
        fieldPath: seed.interaction_style ? '/persona_seed/interaction_style' : '/persona_seed/temperament_and_voice/dominant_temperament',
        icon: IoStar,
      },
      seed.social_identity.literacy && {
        name: displayValue(seed.social_identity.literacy),
        description: 'Literacy and practical knowledge are taken from the source material record.',
        fieldPath: '/persona_seed/social_identity/literacy',
        icon: FaBookOpen,
      },
      ...(seed.material_life.body_conditions || [])
        .filter(condition => condition !== 'none_apparent')
        .slice(0, 2)
        .map(condition => ({
          name: displayValue(condition),
          description: 'Bodily condition from the source material record.',
          fieldPath: '/persona_seed/material_life/body_conditions',
          icon: FaHeartbeat,
        })),
    ].filter(Boolean) as MaterialDisplayAttribute[],
    worldviewLabel: worldviewLabelForRecord(record),
    worldviewDescription: worldviewDescriptionForRecord(record),
  };
  const lifeEvents = sourceLifeEventsForRecord(record, {
    birthYear: year - age,
    age,
    name: record.source.title,
  } as PlayerCharacter);
  const personality = personalityFromRecord(record);
  const family = (character: PlayerCharacter) => sourceFamilyForRecord(record, character);
  const adapterOverrides = {
    name,
    culturalZone,
    language: sourceLanguageLabel,
    family_source: seed.family?.members?.length ? 'schema' : 'adapter_fallback',
    life_events_source: 'adapter_from_material_record',
    personality_source: seed.temperament_and_voice.personality_traits ? 'schema_big_five' : 'adapter_temperament_fallback',
    procedural_fields_remaining: ['stats', 'health', 'portrait geometry', 'belief convictions', 'social context'],
  };

  const applyToCharacter = (character: PlayerCharacter): PlayerCharacter => {
    const sourceAttributes = displayOverrides.attributes.map(displayAttributeToBadge);
    const sourceInventory = displayOverrides.possessions.map(possession =>
      createMaterialItem(possession, /book|letter|paper|manuscript|ledger|correspondence|journal|diary/i.test(possession) ? 'Document' : 'Special')
    );
    const sourceEquippedItems = { ...character.equippedItems };

    if (displayOverrides.clothingDetail) {
      sourceEquippedItems.torso = createMaterialItem(displayOverrides.clothingDetail, 'Apparel', {
        equipmentSlot: 'torso',
        description: `Clothing from the source material record: ${displayOverrides.clothingDetail}.`,
        material: 'cloth',
      });
    }
    const sourceBodyConditions = seed.material_life.body_conditions || [];
    const shouldPreserveProceduralDisease = sourceBodyConditions.some(condition =>
      /infectious_disease|epidemic|plague|typhus|cholera|smallpox|tuberculosis|malaria/i.test(condition)
    );

    return {
      ...character,
      profession: seed.work.primary_occupation || character.profession,
      occupation: seed.work.primary_occupation || character.occupation,
      class: socialPositionLabel(record) || character.class,
      socialClass: socialPositionLabel(record) || character.socialClass,
      religion: seed.religious_practice?.specific_label || seed.social_identity.religious_or_communal_identity || character.religion,
      inventory: sourceInventory.length > 0 ? sourceInventory : character.inventory,
      equippedItems: sourceEquippedItems,
      attributes: sourceAttributes.length > 0 ? sourceAttributes : character.attributes,
      name: name || character.name,
      family: family(character),
      diseaseHealth: shouldPreserveProceduralDisease ? character.diseaseHealth : undefined,
      lifeEvents: lifeEvents.map(event => ({
        year: event.year,
        event: event.text,
      })),
      personality,
      ideology: displayOverrides.worldviewLabel || character.ideology,
      isLlmEnhanced: true,
      appearance: {
        ...character.appearance,
        skinTexture: sourceSkinTexture(sourceBodyConditions) || character.appearance.skinTexture,
        palette: {
          ...character.appearance.palette,
          ...sourcePaletteForClothing(seed.material_life.clothing_detail || seed.material_life.clothing_level),
        },
        garment: displayOverrides.clothingDetail
          ? { name: titleCase(displayOverrides.clothingDetail), material: 'cloth' }
          : character.appearance.garment,
      },
      portraitVisualOverrides: {
        ...(character as any).portraitVisualOverrides,
        appearance: {
          ...((character as any).portraitVisualOverrides?.appearance || {}),
          skinTexture: sourceSkinTexture(sourceBodyConditions) || character.appearance.skinTexture,
        },
        garment: displayOverrides.clothingDetail
          ? { name: titleCase(displayOverrides.clothingDetail), material: 'cloth' }
          : undefined,
        palette: sourcePaletteForClothing(seed.material_life.clothing_detail || seed.material_life.clothing_level),
        background: {
          ...sourceBackgroundForRecord(record),
          sourceBasis: record.source.source_basis,
          vignette: true,
        },
        notes: [
          `Source visual profile from ${record.source.source_basis.replace(/_/g, ' ')}.`,
          ...(sourceBodyConditions.length ? ['Body condition cues applied to skin texture.'] : []),
        ],
      },
    };
  };

  return {
    generationParams: {
      name,
      year,
      era: periodFromYear(year),
      culturalZone,
      region: seed.place.region,
      location: seed.place.settlement_or_locality || seed.place.region,
      gender: genderFromRole(seed.social_identity.gender_role),
      age,
      profession: seed.work.primary_occupation,
      wealthLevel: wealthFromRecord(record),
      socialClass: socialPositionLabel(record),
      religion: seed.religious_practice?.specific_label || seed.social_identity.religious_or_communal_identity,
    },
    displayOverrides,
    lifeEvents,
    adapterOverrides,
    provenanceForField,
    applyToCharacter,
  };
}
